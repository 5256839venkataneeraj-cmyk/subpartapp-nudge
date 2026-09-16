import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  Droplets,
  Calendar,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface VoiceNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTranscription: (text: string) => void;
}

export const VoiceNudgeModal: React.FC<VoiceNudgeModalProps> = ({
  isOpen,
  onClose,
  onSendTranscription,
}) => {
  const [manualText, setManualText] = useState("");

  const {
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    audioLevel,
    frequencyBars,
    error: speechError,
    permissionDenied,
    startListening,
    stopListening,
    resetTranscript,
    cancelListening,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: "en-US",
  });

  const sampleIdeas = [
    { text: "Remind me to do laundry at 6pm", icon: Clock },
    { text: "Log $4.50 coffee spend", icon: Sparkles },
    { text: "Help me break down Bioethics Section 2", icon: Calendar },
    { text: "Set a 15-minute study sprint", icon: Clock },
  ];

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      setManualText("");
      resetTranscript();
      startListening();
    } else {
      cancelListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDisplaySpeech = (
    transcript + (interimTranscript ? " " + interimTranscript : "")
  ).trim();

  const activeText = manualText || currentDisplaySpeech;

  const handleToggleListening = async () => {
    if (isListening) {
      await stopListening();
    } else {
      setManualText("");
      await startListening();
    }
  };

  const handleClear = () => {
    setManualText("");
    resetTranscript();
  };

  const handleDone = async () => {
    let finalPayload = activeText;
    if (isListening) {
      const recordedResult = await stopListening();
      finalPayload = manualText || recordedResult || currentDisplaySpeech;
    }

    const trimmed = finalPayload.trim();
    if (trimmed) {
      onSendTranscription(trimmed);
      onClose();
    } else {
      // If nothing spoken, use a friendly starter
      onSendTranscription("Help me review my tasks and schedule a quick sprint");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F5] flex flex-col justify-between overflow-y-auto font-sans text-[#2D2522]">
      {/* Top Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#EAE2DA] bg-[#FAF7F5]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              cancelListening();
              onClose();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#4A3F39] hover:bg-[#EFE9E4] transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#A33C1B] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              <span className="font-serif italic text-sm">n</span>
            </div>
            <span className="font-bold text-base text-[#2D2522]">Voice Nudge Companion</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isListening && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEEEA] border border-[#F5D8CE] text-[#A33C1B] text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#A33C1B]" />
              <span>Mic Active ({audioLevel}%)</span>
            </span>
          )}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            alt="Maya"
            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md w-full mx-auto px-5 py-6 flex-1 flex flex-col items-center justify-center text-center">
        {/* Nudge Audio Companion Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FCEEEA] text-[#A33C1B] text-[11px] font-bold tracking-wider uppercase mb-3 shadow-2xs border border-[#F5D8CE]">
          <span className={`w-2 h-2 rounded-full ${isListening ? "bg-[#A33C1B] animate-ping" : "bg-[#8E8078]"}`} />
          <span>
            {isTranscribing
              ? "TRANSCRIBING WITH GEMINI AI..."
              : isListening
              ? "COLLECTING LIVE VOICE INPUT"
              : "MICROPHONE PAUSED"}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2522] tracking-tight mb-1.5">
          {isTranscribing
            ? "Converting speech to text..."
            : isListening
            ? "Listening to your voice..."
            : "Tap the mic to speak"}
        </h2>
        <p className="text-xs sm:text-sm text-[#70645D] max-w-xs mb-6 leading-relaxed">
          {isListening
            ? "Speak freely. Your voice commands are captured in real-time."
            : "Microphone is on standby. Tap below to speak your request."}
        </p>

        {/* Microphone Access Denied Alert */}
        {permissionDenied && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-[#FBEAE9] border border-[#F5CAC7] text-left text-xs text-rose-950 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Microphone Access Required</span>
            </div>
            <p className="text-rose-800 leading-relaxed">
              Your browser blocked microphone permissions. Please click the lock or camera/mic icon in your browser address bar and choose <strong>Allow</strong>, then tap the button below.
            </p>
            <button
              onClick={() => startListening()}
              className="mt-1 self-start px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs"
            >
              Retry Microphone Access
            </button>
          </div>
        )}

        {/* General Speech Error Banner */}
        {speechError && !permissionDenied && (
          <div className="w-full mb-4 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 flex items-center justify-between">
            <span className="truncate">{speechError}</span>
            <button
              onClick={() => startListening()}
              className="text-xs font-bold text-amber-800 underline ml-2 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pulsing Audio Orb with Real Live Waveforms */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Animated pulsing rings expanding with voice volume */}
          <div
            style={{
              transform: `scale(${1 + (audioLevel / 100) * 0.4})`,
            }}
            className={`absolute w-64 h-64 rounded-full bg-[#FBEAE4] -z-10 transition-transform duration-150 ${
              isListening ? "opacity-60" : "scale-90 opacity-20"
            }`}
          />
          <div
            style={{
              transform: `scale(${1 + (audioLevel / 100) * 0.25})`,
            }}
            className={`absolute w-52 h-52 rounded-full bg-[#F7D8CE] -z-10 transition-transform duration-100 ${
              isListening ? "opacity-75" : "opacity-30"
            }`}
          />

          {/* Interactive Tap to Pause/Resume Button */}
          <button
            id="voice-modal-orb-btn"
            onClick={handleToggleListening}
            className={`w-36 h-36 rounded-full text-white flex flex-col items-center justify-center shadow-2xl transition-all transform active:scale-95 ${
              isListening
                ? "bg-[#A33C1B] hover:bg-[#8D3316]"
                : "bg-[#70645D] hover:bg-[#5C504A]"
            }`}
            title={isListening ? "Tap to pause listening" : "Tap to start listening"}
          >
            {/* Live Frequency Waveform Bars Driven By Physical Mic Audio */}
            <div className="flex items-center gap-1.5 mb-2.5 h-10">
              {frequencyBars.map((height, i) => (
                <div
                  key={i}
                  style={{
                    height: isListening ? `${height}px` : "6px",
                    transition: "height 0.08s ease-out",
                  }}
                  className={`w-1.5 rounded-full ${
                    audioLevel > 12 ? "bg-[#FFDFC9]" : "bg-white"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase opacity-95">
              {isListening ? (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>TAP TO PAUSE</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>TAP TO SPEAK</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Live Audio Level Bar */}
        {isListening && (
          <div className="w-48 mt-3 flex items-center gap-2">
            <span className="text-[10px] text-[#8E8078] font-bold uppercase tracking-wider">Level</span>
            <div className="flex-1 h-1.5 bg-[#EAE2DA] rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(5, audioLevel)}%` }}
                className="h-full bg-[#A33C1B] rounded-full transition-all duration-75"
              />
            </div>
            <span className="text-[10px] text-[#A33C1B] font-extrabold w-6 text-right">
              {audioLevel}%
            </span>
          </div>
        )}

        {/* Live Transcription Box */}
        <div className="w-full mt-6 bg-white rounded-3xl p-5 border border-[#E9DFD7] shadow-sm text-left relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#70645D]">
              <Volume2 className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span className="tracking-wide uppercase text-[10px]">
                LIVE TRANSCRIPTION
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeText && (
                <button
                  onClick={handleClear}
                  className="text-[10px] font-semibold text-[#8E8078] hover:text-[#A33C1B] flex items-center gap-1"
                  title="Clear text"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isListening
                  ? "bg-[#FCEEEA] text-[#A33C1B]"
                  : "bg-stone-100 text-stone-600"
              }`}>
                {isTranscribing ? "Gemini Transcribing" : isListening ? "Live Mic" : "Ready"}
              </span>
            </div>
          </div>

          {/* Transcript Content Display */}
          <div className="min-h-[56px] flex items-center">
            {isTranscribing ? (
              <div className="flex items-center gap-2 text-sm text-[#70645D]">
                <Loader2 className="w-4 h-4 text-[#A33C1B] animate-spin shrink-0" />
                <span className="italic">Processing audio with Gemini speech intelligence...</span>
              </div>
            ) : activeText ? (
              <p className="text-sm sm:text-base font-medium text-[#2D2522] leading-relaxed">
                &ldquo;{activeText}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-[#9C8F87] italic leading-relaxed">
                {isListening
                  ? "Listening... Speak clearly into your mic (e.g., 'Move my study block to 4:30 PM and remind me to study')..."
                  : "Tap the microphone orb above and start speaking..."}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-[#F2ECE6] flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2F0E7] text-[#245D3A] text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Scheduling</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBE8F7] text-[#4A4382] text-xs font-medium">
              <Droplets className="w-3.5 h-3.5" />
              <span>Habits & Reminders</span>
            </span>
          </div>
        </div>

        {/* Try Saying Next Chips */}
        <div className="w-full mt-5 text-left">
          <div className="flex items-center justify-between text-xs text-[#70645D] mb-2 px-1">
            <span>Or tap a suggestion:</span>
            <span className="text-[11px] text-[#A09289]">Quick test</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {sampleIdeas.map((idea, idx) => {
              const Icon = idea.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setManualText(idea.text)}
                  className="px-3.5 py-2 rounded-full bg-[#EFE9E4] hover:bg-[#E7DFD8] text-[#4A3F39] text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-[#A33C1B]" />
                  <span>&ldquo;{idea.text}&rdquo;</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="p-5 bg-[#FAF7F5] border-t border-[#EAE2DA] sticky bottom-0">
        <div className="max-w-md mx-auto grid grid-cols-12 gap-3">
          <button
            onClick={() => {
              cancelListening();
              onClose();
            }}
            className="col-span-4 py-3.5 px-4 rounded-full bg-[#EFE9E4] hover:bg-[#E5DDD6] text-[#4A3F39] font-bold text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            id="voice-modal-done-btn"
            onClick={handleDone}
            className="col-span-8 py-3.5 px-5 rounded-full bg-[#A33C1B] hover:bg-[#8D3316] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transcribing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Done • Send to Nudge</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
