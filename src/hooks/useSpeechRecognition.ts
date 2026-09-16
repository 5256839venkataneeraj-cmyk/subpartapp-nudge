import { useState, useEffect, useRef, useCallback } from "react";
import { transcribeAudio } from "../lib/api";

// Fallback type definitions for browsers without SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): {
      length: number;
      item(index: number): { transcript: string; confidence: number };
      [index: number]: { transcript: string; confidence: number };
      isFinal: boolean;
    };
    [index: number]: {
      length: number;
      item(index: number): { transcript: string; confidence: number };
      [index: number]: { transcript: string; confidence: number };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onEnd?: (finalTranscript: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    lang = "en-US",
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 volume level
  const [frequencyBars, setFrequencyBars] = useState<number[]>([8, 12, 18, 24, 18, 22, 14, 8]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const accumulatedTranscriptRef = useRef("");
  const onEndCallbackRef = useRef(onEnd);
  onEndCallbackRef.current = onEnd;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMedia = Boolean(navigator?.mediaDevices?.getUserMedia);
      const hasSpeech = Boolean(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      );
      setIsSupported(hasMedia || hasSpeech);
    }
  }, []);

  const stopAudioAnalyser = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyBars([8, 12, 18, 24, 18, 22, 14, 8]);
  }, []);

  const cleanup = useCallback(() => {
    stopAudioAnalyser();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsListening(false);
  }, [stopAudioAnalyser]);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    cleanup();
    setError(null);
    setPermissionDenied(false);
    setTranscript("");
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
    audioChunksRef.current = [];

    // 1. Acquire real microphone stream
    let stream: MediaStream | null = null;
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      }
    } catch (err: any) {
      console.warn("getUserMedia error:", err);
      const isDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        String(err).includes("denied") ||
        String(err).includes("dismissed");
      if (isDenied) {
        setPermissionDenied(true);
        setError("Microphone permission was denied. Please allow microphone access in your browser to speak.");
      } else {
        setError("Could not access microphone. Please check your audio input settings.");
      }
      setIsListening(false);
      return;
    }

    setIsListening(true);

    // 2. Set up live audio analyser for real-time waveform bounce
    if (stream) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.6;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);

            // Compute average level (0-100)
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = Math.min(100, Math.round((sum / dataArray.length) * 1.5));
            setAudioLevel(avg);

            // Extract 8 representative bars
            const bars = [
              Math.max(6, Math.min(36, Math.round(dataArray[1] / 6))),
              Math.max(8, Math.min(38, Math.round(dataArray[3] / 5.5))),
              Math.max(10, Math.min(42, Math.round(dataArray[5] / 5))),
              Math.max(12, Math.min(46, Math.round(dataArray[7] / 4.5))),
              Math.max(10, Math.min(44, Math.round(dataArray[9] / 5))),
              Math.max(8, Math.min(40, Math.round(dataArray[11] / 5.5))),
              Math.max(6, Math.min(34, Math.round(dataArray[13] / 6.5))),
              Math.max(6, Math.min(30, Math.round(dataArray[15] / 7))),
            ];
            setFrequencyBars(bars);

            animationFrameRef.current = requestAnimationFrame(updateVolume);
          };

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }
      } catch (analyserErr) {
        console.warn("Web Audio Analyser setup error:", analyserErr);
      }

      // 3. Initialize MediaRecorder for server-side Gemini transcription fallback
      try {
        let selectedMime = "";
        const candidateMimes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/ogg",
        ];
        for (const m of candidateMimes) {
          if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
            selectedMime = m;
            break;
          }
        }

        const recorder = selectedMime
          ? new MediaRecorder(stream, { mimeType: selectedMime })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn("MediaRecorder init error:", recErr);
      }
    }

    // 4. Initialize Web Speech API for real-time client-side live streaming transcription
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentInterim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0]?.transcript || "";
            if (result.isFinal) {
              finalChunk += text;
            } else {
              currentInterim += text;
            }
          }

          if (finalChunk) {
            accumulatedTranscriptRef.current = (
              accumulatedTranscriptRef.current + " " + finalChunk
            ).trim();
            setTranscript(accumulatedTranscriptRef.current);
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn("SpeechRecognition event error:", event.error);
          // Non-fatal if MediaRecorder is active
          if (event.error === "not-allowed") {
            setError("Speech recognition service permission denied.");
          } else if (event.error === "network") {
            console.log("Speech recognition network offline; falling back to Gemini audio model.");
          }
        };

        recognition.onend = () => {
          // If stopped naturally
          setInterimTranscript("");
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (srErr) {
        console.warn("SpeechRecognition start error:", srErr);
      }
    }
  }, [cleanup, continuous, interimResults, lang]);

  const stopListening = useCallback(async (): Promise<string> => {
    setIsListening(false);
    stopAudioAnalyser();

    // 1. Stop SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // 2. Stop MediaRecorder and grab audio blob
    let recordedBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        const recorder = mediaRecorderRef.current;
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
          recorder.stop();
        });

        if (audioChunksRef.current.length > 0) {
          const mime = recorder.mimeType || "audio/webm";
          recordedBlob = new Blob(audioChunksRef.current, { type: mime });
        }
      } catch (recStopErr) {
        console.warn("Error stopping MediaRecorder:", recStopErr);
      }
    }

    // Release microphone hardware
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // 3. Determine transcript
    let finalResult = accumulatedTranscriptRef.current.trim();

    // If Web Speech API was empty or not supported, use server-side Gemini transcription
    if (!finalResult && recordedBlob && recordedBlob.size > 2000) {
      setIsTranscribing(true);
      try {
        const geminiTranscript = await transcribeAudio(recordedBlob);
        if (geminiTranscript && geminiTranscript.trim()) {
          finalResult = geminiTranscript.trim();
          setTranscript(finalResult);
          accumulatedTranscriptRef.current = finalResult;
        }
      } catch (transcribeErr: any) {
        console.warn("Gemini audio transcription fallback error:", transcribeErr);
        setError("Could not transcribe speech. Please try speaking again or type your command.");
      } finally {
        setIsTranscribing(false);
      }
    }

    setInterimTranscript("");

    if (onEndCallbackRef.current && finalResult) {
      onEndCallbackRef.current(finalResult);
    }

    return finalResult;
  }, [stopAudioAnalyser]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
    audioChunksRef.current = [];
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isSupported,
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    audioLevel,
    frequencyBars,
    error,
    permissionDenied,
    startListening,
    stopListening,
    resetTranscript,
    cancelListening: cleanup,
  };
}
