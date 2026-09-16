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

  const [isStarting, setIsStarting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>([8, 12, 18, 24, 18, 22, 14, 8]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);

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
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
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
    setIsStarting(false);
  }, [stopAudioAnalyser]);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    cleanup();
    setIsStarting(true);
    setError(null);
    setPermissionDenied(false);
    setTranscript("");
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
    audioChunksRef.current = [];

    let streamObtained = false;
    let speechApiStarted = false;

    // 1. Attempt standard MediaDevices getUserMedia
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        // Use basic { audio: true } for maximum browser & hardware compatibility
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        streamObtained = true;

        // Set up Web Audio Analyser
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            if (audioCtx.state === "suspended") {
              await audioCtx.resume();
            }
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

              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = Math.min(100, Math.round((sum / dataArray.length) * 1.5));
              setAudioLevel(avg);

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
          console.warn("AudioContext setup warning:", analyserErr);
        }

        // Initialize MediaRecorder for server-side Gemini fallback
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
          console.warn("MediaRecorder start warning:", recErr);
        }
      }
    } catch (err: any) {
      console.warn("getUserMedia failed or restricted:", err);
      const isDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        String(err).includes("denied") ||
        String(err).includes("dismissed");
      if (isDenied) {
        setPermissionDenied(true);
      }
    }

    // 2. Initialize Web Speech API
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
          speechApiStarted = true;
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
          console.warn("SpeechRecognition error:", event.error);
          if (event.error === "not-allowed") {
            setPermissionDenied(true);
            setError("Microphone permission was denied by your browser.");
          } else if (event.error === "no-speech") {
            // normal quiet pause
          } else {
            setError(`Speech input issue: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setInterimTranscript("");
        };

        recognitionRef.current = recognition;
        recognition.start();
        speechApiStarted = true;
      } catch (srErr: any) {
        console.warn("SpeechRecognition start error:", srErr);
      }
    }

    // Determine overall listening state
    if (streamObtained || speechApiStarted) {
      setIsListening(true);
      setError(null);

      // If stream failed but speech API started, run a gentle animated wave
      if (!streamObtained && speechApiStarted) {
        let step = 0;
        fallbackIntervalRef.current = window.setInterval(() => {
          step++;
          const base = [10, 16, 24, 30, 24, 28, 16, 10];
          const dynamicBars = base.map((b, i) =>
            Math.max(6, Math.min(36, Math.round(b + Math.sin(step * 0.4 + i) * 8)))
          );
          setFrequencyBars(dynamicBars);
          setAudioLevel(25);
        }, 120);
      }
    } else {
      setIsListening(false);
      setPermissionDenied(true);
      setError("Could not access microphone in this preview window. Please allow microphone access or open in a new tab.");
    }

    setIsStarting(false);
  }, [cleanup, continuous, interimResults, lang]);

  const stopListening = useCallback(async (): Promise<string> => {
    setIsListening(false);
    setIsStarting(false);
    stopAudioAnalyser();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

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

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    let finalResult = accumulatedTranscriptRef.current.trim();

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
        console.warn("Gemini transcription fallback error:", transcribeErr);
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
    isStarting,
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
