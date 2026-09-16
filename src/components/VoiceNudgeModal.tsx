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
  AlertCircle,
  ExternalLink,
  Edit3
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
  const [isEditingManually, setIsEditingManually] = useState(false);

  const {
    isStarting,
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
    { text: "Move my chemistry study session to 4:30 PM", icon: Clock },
    { text: "Remind me to do laundry at 6pm", icon: Clock },
    { text: "Log $4.50 coffee spend and track my budget", icon: Sparkles },
    { text: "Help me break down Bioethics Section 2", icon: Calendar },
    { text: "Set a 25-minute Pomodoro study sprint", icon: Clock },
  ];

  // Clean up when modal closes; do NOT auto-prompt mic on open to avoid browser unprompted gesture blocks
  useEffect(() => {
    if (!isOpen) {
      cancelListening();
      setIsEditingManually(false);
    }
  }, [isOpen, cancelListening]);

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
    setIsEditingManually(false);
  };

  const handleSelectSample = (sample: string) => {
    setManualText(sample);
    if (isListening) {
      stopListening();
    }
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
      // Friendly fallback so user is never stuck
      onSendTranscription("Help me review my tasks and schedule my next study block");
      onClose();
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F5] flex flex-col justify-between overflow-y-auto font-sans text-[#2D2522]">
      {/* Top Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#EAE2DA] bg-[#FAF7F5]/90 backdrop-blur-md sticky top-0 z-30">
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
          <span
            className={`w-2 h-2 rounded-full ${
              isListening ? "bg-[#A33C1B] animate-ping" : isStarting ? "bg-amber-500 animate-pulse" : "bg-[#8E8078]"
            }`}
          />
          <span>
            {isTranscribing
              ? "TRANSCRIBING AUDIO WITH GEMINI..."
              : isStarting
              ? "CONNECTING MICROPHONE..."
              : isListening
              ? "COLLECTING LIVE VOICE INPUT"
              : "READY TO LISTEN"}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2522] tracking-tight mb-1.5">
          {isTranscribing
            ? "Converting speech to text..."
            : isStarting
            ? "Opening microphone..."
            : isListening
            ? "Listening to your voice..."
            : "Tap the mic orb to speak"}
        </h2>
        <p className="text-xs sm:text-sm text-[#70645D] max-w-xs mb-5 leading-relaxed">
          {isListening
            ? "Speak freely into your microphone. Tap again when done."
            : isStarting
            ? "Requesting browser microphone access..."
            : "Tap the button below and speak your reminder, schedule, or request."}
        </p>

        {/* Microphone Access Denied or Iframe Restricted Alert */}
        {permissionDenied && (
          <div className="w-full mb-5 p-4 rounded-2xl bg-[#FBEAE9] border border-[#F5CAC7] text-left text-xs text-rose-950 flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Microphone Blocked by Browser or Iframe</span>
            </div>
            <p className="text-rose-800 leading-relaxed text-xs">
              Browsers often restrict microphone access inside embedded preview windows. You can either open the app directly in a new tab for native microphone support, or tap any suggestion below.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="px-3.5 py-1.5 rounded-lg bg-[#A33C1B] hover:bg-[#8D3316] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab for Mic</span>
              </button>
              <button
                type="button"
                onClick={handleToggleListening}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#F5CAC7] text-rose-900 font-bold text-xs hover:bg-rose-50 transition-colors"
              >
                Retry Mic Access
              </button>
            </div>
          </div>
        )}

        {/* General Speech Error Banner */}
        {speechError && !permissionDenied && (
          <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 flex items-center justify-between">
            <span className="truncate">{speechError}</span>
            <button
              onClick={handleToggleListening}
              className="text-xs font-bold text-amber-800 underline ml-2 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pulsing Audio Orb with Guaranteed Clickability */}
        <div className="relative my-3 flex items-center justify-center">
          {/* Animated pulsing decorative rings (pointer-events-none so they never block clicks) */}
          <div
            style={{
              transform: `scale(${1 + (audioLevel / 100) * 0.4})`,
            }}
            className={`absolute w-64 h-64 rounded-full bg-[#FBEAE4] -z-10 pointer-events-none transition-transform duration-150 ${
              isListening ? "opacity-60" : "scale-90 opacity-20"
            }`}
          />
          <div
            style={{
              transform: `scale(${1 + (audioLevel / 100) * 0.25})`,
            }}
            className={`absolute w-52 h-52 rounded-full bg-[#F7D8CE] -z-10 pointer-events-none transition-transform duration-100 ${
              isListening ? "opacity-75" : "opacity-30"
            }`}
          />

          {/* Interactive Tap to Speak / Pause Button */}
          <button
            id="voice-modal-orb-btn"
            type="button"
            onClick={handleToggleListening}
            disabled={isStarting || isTranscribing}
            className={`relative z-20 w-36 h-36 rounded-full text-white flex flex-col items-center justify-center shadow-2xl transition-all transform active:scale-95 cursor-pointer ${
              isListening
                ? "bg-[#A33C1B] hover:bg-[#8D3316] ring-4 ring-[#A33C1B]/30"
                : isStarting
                ? "bg-amber-600 hover:bg-amber-700 ring-4 ring-amber-500/30"
                : "bg-[#70645D] hover:bg-[#5C504A] hover:scale-105"
            }`}
            title={isListening ? "Tap to finish listening" : "Tap to start speaking"}
          >
            {/* Live Frequency Waveform Bars Driven By Voice Audio */}
            <div className="flex items-center gap-1.5 mb-2.5 h-10">
              {frequencyBars.map((height, i) => (
                <div
                  key={i}
                  style={{
                    height: isListening ? `${height}px` : "8px",
                    transition: "height 0.08s ease-out",
                  }}
                  className={`w-1.5 rounded-full ${
                    audioLevel > 12 ? "bg-[#FFDFC9]" : "bg-white"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase opacity-95">
              {isStarting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>STARTING...</span>
                </>
              ) : isListening ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-red-200" />
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
          <div className="w-52 mt-2 flex items-center gap-2 animate-in fade-in">
            <span className="text-[10px] text-[#8E8078] font-bold uppercase tracking-wider">Level</span>
            <div className="flex-1 h-1.5 bg-[#EAE2DA] rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(5, audioLevel)}%` }}
                className="h-full bg-[#A33C1B] rounded-full transition-all duration-75"
              />
            </div>
            <span className="text-[10px] text-[#A33C1B] font-extrabold w-8 text-right">
              {audioLevel}%
            </span>
          </div>
        )}

        {/* Live Transcription & Editable Box */}
        <div className="w-full mt-5 bg-white rounded-3xl p-5 border border-[#E9DFD7] shadow-sm text-left relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#70645D]">
              <Volume2 className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span className="tracking-wide uppercase text-[10px]">
                LIVE TRANSCRIPTION
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingManually(!isEditingManually)}
                className="text-[10px] font-semibold text-[#8E8078] hover:text-[#A33C1B] flex items-center gap-1"
                title="Edit text"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingManually ? "Done" : "Edit"}</span>
              </button>
              {activeText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] font-semibold text-[#8E8078] hover:text-[#A33C1B] flex items-center gap-1"
                  title="Clear text"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isListening
                    ? "bg-[#FCEEEA] text-[#A33C1B]"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {isTranscribing ? "Gemini Transcribing" : isListening ? "Listening" : "Ready"}
              </span>
            </div>
          </div>

          {/* Transcript Content Display or Manual Input */}
          <div className="min-h-[56px] flex items-center">
            {isTranscribing ? (
              <div className="flex items-center gap-2 text-sm text-[#70645D]">
                <Loader2 className="w-4 h-4 text-[#A33C1B] animate-spin shrink-0" />
                <span className="italic">Transcribing your voice with Gemini AI...</span>
              </div>
            ) : isEditingManually ? (
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type or refine your voice command here..."
                rows={2}
                className="w-full text-sm font-medium text-[#2D2522] bg-[#FAF7F5] border border-[#E0D5CC] rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-[#A33C1B]"
              />
            ) : activeText ? (
              <p className="text-sm sm:text-base font-medium text-[#2D2522] leading-relaxed">
                &ldquo;{activeText}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-[#9C8F87] italic leading-relaxed">
                {isListening
                  ? "Listening... Speak clearly into your mic (e.g., 'Move my chemistry study block to 4:30 PM')..."
                  : "Tap the microphone orb above and start speaking, or tap a sample below."}
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

        {/* Quick Voice Command Suggestions */}
        <div className="w-full mt-4 text-left">
          <div className="flex items-center justify-between text-xs text-[#70645D] mb-2 px-1">
            <span>Or tap a voice command suggestion:</span>
            <span className="text-[11px] text-[#A09289]">1-Tap Fill</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {sampleIdeas.map((idea, idx) => {
              const Icon = idea.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(idea.text)}
                  className="px-3 py-1.5 rounded-full bg-[#EFE9E4] hover:bg-[#E7DFD8] text-[#4A3F39] text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors border border-transparent hover:border-[#D0C4BB]"
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
      <div className="p-5 bg-[#FAF7F5] border-t border-[#EAE2DA] sticky bottom-0 z-30">
        <div className="max-w-md mx-auto grid grid-cols-12 gap-3">
          <button
            type="button"
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
            type="button"
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
