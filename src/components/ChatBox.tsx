import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowUp,
  Plus,
  Mic,
  Clock,
  Zap,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  ExternalLink,
  Trash2,
  Coffee,
  Search,
  Target,
  ArrowDown,
  MicOff,
  AlertCircle,
  X,
  Headphones,
  Bell,
} from "lucide-react";
import { ChatMessage, ExtractedEvent, StudentSnapshot } from "../types";
import { MarkdownContent } from "./MarkdownContent";
import { deriveContextualQuickReplies } from "../lib/quickReplies";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { BreakTimerBanner } from "./BreakTimerBanner";
import { ToneSelectorMenu } from "./ToneSelectorMenu";
import { NudgeTone } from "../types";
import { getToneConfig } from "../lib/tones";

interface ChatBoxProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onLoadMoreHistory: () => void;
  hasMoreHistory: boolean;
  onClearLocalHistory: () => void;
  snapshot: StudentSnapshot | null;
  onOpenSecurityModal: () => void;
  onOpenVoiceModal: () => void;
  breakTimer?: {
    isActive: boolean;
    isPaused: boolean;
    initialMinutes: number;
    totalSeconds: number;
    remainingSeconds: number;
    hasFinished: boolean;
    notificationPermission: NotificationPermission;
    onPauseToggle: () => void;
    onAddMinutes: (mins: number) => void;
    onFinishEarly: () => void;
    onDismissFinished: () => void;
    onRequestNotification: () => void;
  };
  currentTone?: NudgeTone;
  onSelectTone?: (tone: NudgeTone) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenRemindersModal?: () => void;
  activeRemindersCount?: number;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onLoadMoreHistory,
  hasMoreHistory,
  onClearLocalHistory,
  snapshot,
  onOpenSecurityModal,
  onOpenVoiceModal,
  breakTimer,
  currentTone = "supportive_coach",
  onSelectTone,
  isFocusMode = false,
  onToggleFocusMode,
  onOpenRemindersModal,
  activeRemindersCount = 0,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [addedEvents, setAddedEvents] = useState<Record<string, boolean>>({});
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [toneNotice, setToneNotice] = useState<string | null>(null);
  const alreadySentRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Focus Mode: Automatically mute non-urgent UI audio sounds when enabled
  useEffect(() => {
    if (isFocusMode) {
      setIsSoundMuted(true);
    }
  }, [isFocusMode]);

  const activeToneConfig = getToneConfig(currentTone);

  const handleToneChange = (newTone: NudgeTone) => {
    if (onSelectTone) {
      onSelectTone(newTone);
    }
    const cfg = getToneConfig(newTone);
    if (!isFocusMode) {
      setToneNotice(`Tone updated to ${cfg.label} (${cfg.emoji}) • Edge prompt synced`);
      setTimeout(() => setToneNotice(null), 4000);
    }
  };

  // Web Speech API + Gemini Audio capture for voice dictation directly to Nudge
  const {
    isSupported: isSpeechSupported,
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    audioLevel,
    frequencyBars,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: "en-US",
  });

  const activeTranscript = (
    transcript + (interimTranscript ? " " + interimTranscript : "")
  ).trim();

  const handleToggleDictation = async () => {
    if (isListening) {
      const finalRecorded = await stopListening();
      const textToSend = (finalRecorded || activeTranscript).trim();
      if (textToSend && !alreadySentRef.current) {
        alreadySentRef.current = true;
        onSendMessage(textToSend);
        setInputText("");
        resetTranscript();
        setSpeechNotice(`Dictated: "${textToSend}"`);
        setTimeout(() => setSpeechNotice(null), 4000);
      }
    } else {
      alreadySentRef.current = false;
      resetTranscript();
      await startListening();
    }
  };

  const handleCancelDictation = () => {
    alreadySentRef.current = true;
    stopListening();
    resetTranscript();
  };

  const handleSendDictationNow = async () => {
    alreadySentRef.current = true;
    const finalRecorded = await stopListening();
    const textToSend = (finalRecorded || activeTranscript).trim();
    if (textToSend) {
      onSendMessage(textToSend);
      setInputText("");
      resetTranscript();
      setSpeechNotice(`Dictated: "${textToSend}"`);
      setTimeout(() => setSpeechNotice(null), 4000);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText("");
    onSendMessage(text);
  };

  const handleAddEventToCalendar = (evt: ExtractedEvent) => {
    setAddedEvents((prev) => ({ ...prev, [evt.id]: true }));

    try {
      const [year, month, day] = (evt.date || "2026-10-25").split("-");
      const [hour, min] = (evt.time || "11:30").split(":");
      const startDateTime = new Date(
        parseInt(year || "2026"),
        parseInt(month || "10") - 1,
        parseInt(day || "25"),
        parseInt(hour || "11"),
        parseInt(min || "30")
      );
      const endDateTime = new Date(startDateTime.getTime() + 25 * 60 * 1000);

      const formatGCalDate = (d: Date) =>
        d.toISOString().replace(/-|:|\.\d+/g, "");

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        evt.title
      )}&dates=${formatGCalDate(startDateTime)}/${formatGCalDate(
        endDateTime
      )}&details=${encodeURIComponent(evt.notes)}&location=${encodeURIComponent(
        "Library 2nd Floor Silent Room"
      )}`;

      window.open(gcalUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.warn("Calendar link fallback:", err);
    }
  };

  // Find the most recent assistant response to anchor context-aware quick replies
  const lastAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((m) => m.role === "assistant");
  }, [messages]);

  // Derive 3 context-aware quick replies based on the latest AI response
  const contextualQuickReplies = useMemo(() => {
    return deriveContextualQuickReplies(
      lastAssistantMessage?.content,
      lastAssistantMessage?.quickReplies
    );
  }, [lastAssistantMessage]);

  return (
    <div className="h-full flex flex-col bg-[#FAF7F5] text-[#2D2522] relative font-sans">
      {/* 1. Daily Check-in Card (Image 1 top bar) */}
      <div className="px-4 py-3 bg-[#FAF7F5] border-b border-[#EAE2DA] shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center shadow-xs border border-[#F6D5CB]">
              <span className="text-base">{activeToneConfig.emoji}</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-[#2D2522] leading-tight">
                Daily Check-in
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#70645D]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{activeToneConfig.label} • {activeToneConfig.tagline}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Focus Mode Settings Toggle */}
            <button
              id="focus-mode-toggle-btn"
              onClick={onToggleFocusMode}
              title={
                isFocusMode
                  ? "Focus Mode is Active: Non-urgent alerts muted, active tasks highlighted"
                  : "Enable Focus Mode: Automatically mute non-urgent UI alerts & highlight active tasks"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                isFocusMode
                  ? "bg-[#2D2522] text-[#FDFBF7] border-[#2D2522] shadow-xs ring-2 ring-[#A33C1B]/30"
                  : "bg-[#FAF7F5] hover:bg-[#EFEAE5] text-[#5C5049] border-[#E2D8D0]"
              }`}
            >
              <Target
                className={`w-3.5 h-3.5 ${
                  isFocusMode ? "text-amber-400 animate-pulse" : "text-[#70645D]"
                }`}
              />
              <span className="text-[11px] sm:text-xs">
                {isFocusMode ? "Focus On" : "Focus"}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isFocusMode ? "bg-amber-400" : "bg-[#A09289]"
                }`}
              />
            </button>

            {/* Tone Settings Menu dropdown */}
            <ToneSelectorMenu
              currentTone={currentTone}
              onSelectTone={handleToneChange}
            />

            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#EFE9E4] text-[#4A3F39] hover:bg-[#E5DDD6] transition-colors"
              title={isSoundMuted ? "Unmute audio" : "Mute audio"}
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onOpenSecurityModal}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#EFE9E4] text-[#4A3F39] hover:bg-[#E5DDD6] transition-colors"
              title="Security & Rate Limit Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tone Change Instant Confirmation Notice */}
        {toneNotice && !isFocusMode && (
          <div className="px-3 py-1.5 rounded-xl bg-[#FFF8F5] border border-[#F0D5C7] text-xs font-semibold text-[#A33C1B] flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#A33C1B]" />
              <span>{toneNotice}</span>
            </span>
            <button
              onClick={() => setToneNotice(null)}
              className="text-[#A33C1B]/70 hover:text-[#A33C1B] p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 2. Gentle focus mode banner / Active Focus Mode Indicator */}
        <div
          className={`flex items-center justify-between rounded-2xl px-3.5 py-2 text-xs transition-colors border ${
            isFocusMode
              ? "bg-[#2D2522] text-[#FAF7F5] border-[#443831] shadow-xs"
              : "bg-[#EFEAE5] border-[#E2D8D0] text-[#2D2522]"
          }`}
        >
          <div className="flex items-center space-x-2 overflow-hidden mr-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                isFocusMode
                  ? "bg-amber-400/20 text-amber-300"
                  : "bg-[#DCEEE2] text-[#245D3A]"
              }`}
            >
              {isFocusMode ? (
                <Target className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3 stroke-[3]" />
              )}
            </div>
            <div className="truncate">
              <span className="font-semibold">
                {isFocusMode ? "Focus Mode Active: " : "Gentle focus mode "}
              </span>
              <span
                className={`hidden sm:inline ${
                  isFocusMode ? "text-[#C8BCB4]" : "text-[#70645D]"
                }`}
              >
                {isFocusMode
                  ? "Non-urgent alerts muted • Active tasks highlighted in Live Snapshot"
                  : "Small intentional steps beat frantic effort..."}
              </span>
            </div>
          </div>
          {isFocusMode ? (
            <button
              onClick={onToggleFocusMode}
              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 text-[10px] font-semibold transition-colors shrink-0"
            >
              Disable Focus
            </button>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F5] border border-[#DDD3CB] text-[#554A43] font-medium text-[11px] shrink-0">
              Bioethics
            </span>
          )}
        </div>
      </div>

      {/* Break Timer Active or Finished Banner */}
      {breakTimer && (breakTimer.isActive || breakTimer.hasFinished) && (
        <BreakTimerBanner
          initialMinutes={breakTimer.initialMinutes}
          totalSeconds={breakTimer.totalSeconds}
          remainingSeconds={breakTimer.remainingSeconds}
          isActive={breakTimer.isActive}
          isPaused={breakTimer.isPaused}
          onPauseToggle={breakTimer.onPauseToggle}
          onAddMinutes={breakTimer.onAddMinutes}
          onFinishEarly={breakTimer.onFinishEarly}
          onDismissFinished={breakTimer.onDismissFinished}
          hasFinished={breakTimer.hasFinished}
          notificationPermission={breakTimer.notificationPermission}
          onRequestNotification={breakTimer.onRequestNotification}
        />
      )}

      {/* 3. Messages Stream */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
      >
        {/* Pagination trigger for on-device local storage */}
        {hasMoreHistory && (
          <div className="text-center py-2">
            <button
              onClick={onLoadMoreHistory}
              className="px-3.5 py-1.5 rounded-full bg-[#EFE9E4] hover:bg-[#E5DDD6] text-[#4A3F39] text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <ArrowDown className="w-3 h-3 text-[#A33C1B]" />
              <span>Load older on-device turns</span>
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isAssistant = msg.role === "assistant";
          return (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${
                isAssistant ? "items-start" : "items-end"
              } space-y-1`}
            >
              <div
                className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[82%] ${
                  isAssistant ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Assistant Avatar */}
                {isAssistant && (
                  <div className="w-8 h-8 rounded-full bg-[#FCEEEA] text-[#A33C1B] border border-[#F6D5CB] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <span className="text-sm">🌱</span>
                  </div>
                )}

                {/* Message Speech Bubble */}
                <div
                  className={`rounded-3xl p-4 sm:p-5 text-sm leading-relaxed shadow-xs ${
                    isAssistant
                      ? "bg-[#F1EBE6] text-[#2D2522] rounded-tl-sm border border-[#E7DFD7]"
                      : "bg-[#332B27] text-white rounded-br-sm font-normal"
                  }`}
                >
                  <MarkdownContent content={msg.content} isAssistant={isAssistant} />

                  {/* Embedded Focus Sprint / Event Block (Matching Image 1) */}
                  {msg.events && msg.events.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.events.map((evt) => {
                        const isAdded = addedEvents[evt.id];
                        return (
                          <div
                            key={evt.id}
                            className="bg-white rounded-2xl p-3.5 border border-[#E8DFD7] shadow-sm flex items-center justify-between gap-3 text-[#2D2522]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs sm:text-sm text-[#2D2522] truncate">
                                  {evt.title}
                                </div>
                                <div className="text-[11px] text-[#70645D] font-medium truncate">
                                  {evt.time} • {evt.notes}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddEventToCalendar(evt)}
                              className={`p-2 rounded-xl shrink-0 transition-all ${
                                isAdded
                                  ? "bg-[#E2F0E7] text-[#245D3A]"
                                  : "bg-[#FAF7F5] hover:bg-[#FCEEEA] text-[#A33C1B] border border-[#EAE2DA]"
                              }`}
                              title={isAdded ? "Event Confirmed" : "Add to Google Calendar"}
                            >
                              {isAdded ? (
                                <Check className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <Zap className="w-4 h-4 fill-current" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp & Delivery Checkmarks */}
              <div
                className={`text-[11px] font-medium text-[#8F827A] flex items-center gap-1 ${
                  isAssistant ? "pl-11" : "pr-2"
                }`}
              >
                <span>{msg.timestamp || "Just now"}</span>
                {!isAssistant && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#8F827A]" />
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FCEEEA] text-[#A33C1B] border border-[#F6D5CB] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm">🌱</span>
            </div>
            <div className="bg-[#F1EBE6] border border-[#E7DFD7] rounded-3xl rounded-tl-sm px-5 py-4 shadow-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#A33C1B] animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-[#A33C1B] animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-[#A33C1B] animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Context-Aware Quick Reply Buttons (Image 1 pattern, 3 choices) */}
      <div className="px-4 py-2 bg-[#FAF7F5] shrink-0 border-t border-[#EAE2DA]/40">
        <div className="flex items-center justify-between gap-1.5 text-xs text-[#70645D] mb-2 font-medium">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#A33C1B]" />
            <span>Suggested quick replies</span>
          </div>
          {lastAssistantMessage && (
            <span className="text-[10px] text-[#8E8078] hidden sm:inline">
              Tap to continue without typing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {onOpenRemindersModal && (
            <button
              id="chat-set-reminder-btn"
              type="button"
              onClick={onOpenRemindersModal}
              className="px-3 py-2 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 bg-[#FAF7F5] hover:bg-[#FCEEEA] text-[#A33C1B] border border-[#EAE2DA] hover:border-[#A33C1B] transition-all shadow-2xs active:scale-95"
              title="Set notification reminder"
            >
              <Bell className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span>Set Reminder</span>
              {activeRemindersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#A33C1B] text-white text-[10px] font-extrabold">
                  {activeRemindersCount}
                </span>
              )}
            </button>
          )}

          {contextualQuickReplies.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${idx}`}
                id={`quick-reply-btn-${idx}`}
                disabled={isLoading}
                onClick={() => onSendMessage(item.label)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  item.isPrimary
                    ? "bg-[#A33C1B] hover:bg-[#8D3316] text-white"
                    : "bg-[#EFE9E4] hover:bg-[#E5DDD6] text-[#4A3F39] border border-[#E3D9D1]"
                }`}
                title={`Quick reply: ${item.label}`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.isPrimary ? "text-white" : "text-[#A33C1B]"}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Input Bar & Voice Dictation Controls */}
      <div className="p-4 pt-1 bg-[#FAF7F5] shrink-0">
        {/* Active Dictation Live Feedback Banner */}
        {isListening && (
          <div className="mb-2 p-3 bg-white border border-[#E7DDD5] rounded-2xl shadow-md flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A33C1B]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
                <span>
                  {isTranscribing ? "Gemini transcribing..." : "Collecting voice..."}
                </span>

                {/* Real-time frequency bars */}
                <div className="flex items-center gap-0.5 h-4 ml-1">
                  {frequencyBars.slice(0, 6).map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: `${Math.max(4, Math.min(16, h / 2))}px`,
                        transition: "height 0.08s ease-out",
                      }}
                      className="w-1 bg-[#A33C1B] rounded-full"
                    />
                  ))}
                </div>

                <span className="text-[10px] font-bold text-[#8E8078] bg-[#FCEEEA] px-1.5 py-0.5 rounded-full">
                  {audioLevel}% vol
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {activeTranscript && (
                  <button
                    type="button"
                    onClick={handleSendDictationNow}
                    className="px-2.5 py-1 rounded-full bg-[#A33C1B] text-white text-[11px] font-medium flex items-center gap-1 hover:bg-[#8D3316] transition-colors active:scale-95 shadow-xs"
                  >
                    <span>Send</span>
                    <ArrowUp className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelDictation}
                  className="p-1 rounded-full text-[#8A7D75] hover:text-[#2D2522] hover:bg-[#F2ECE6] transition-colors"
                  title="Cancel dictation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-[#2D2522] italic font-sans min-h-[18px]">
              {activeTranscript ? (
                <span>&ldquo;{activeTranscript}&rdquo;</span>
              ) : (
                <span className="text-[#8E8078] not-italic">
                  Speak clearly into your microphone — your voice is being captured live...
                </span>
              )}
            </p>
          </div>
        )}

        {/* Speech Recognition Error Notice */}
        {speechError && (
          <div className="mb-2 px-3 py-1.5 bg-[#FBEAE9] border border-[#F5CAC7] rounded-xl text-xs text-rose-950 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={resetTranscript}
              className="text-rose-700 hover:text-rose-950 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Speech Sent Notice (Muted in Focus Mode to avoid distraction) */}
        {speechNotice && !isFocusMode && (
          <div className="mb-2 px-3 py-1.5 bg-[#F0F7F2] border border-[#D0E6D6] rounded-xl text-xs text-emerald-950 flex items-center justify-between">
            <span className="truncate">{speechNotice}</span>
            <button
              onClick={() => setSpeechNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 p-0.5 ml-2 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[#F5EFEB] border border-[#E7DDD5] rounded-full p-1.5 pl-3 flex items-center gap-2 shadow-sm focus-within:border-[#A33C1B] focus-within:ring-1 focus-within:ring-[#A33C1B] transition-all"
        >
          {/* Attachment + button */}
          <button
            type="button"
            className="w-8 h-8 rounded-full border border-[#D8CDC4] flex items-center justify-center text-[#6B5E56] hover:bg-[#EBE3DC] transition-colors shrink-0"
            title="Attach note or assignment reference"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Text input */}
          <input
            id="chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening ? "Listening to your dictation..." : "Message Nudge..."
            }
            disabled={isLoading || isListening}
            className="flex-1 bg-transparent border-0 text-sm text-[#2D2522] placeholder-[#8F827A] focus:outline-none focus:ring-0 min-w-0"
          />

          {/* Web Speech API Dictation Microphone Button */}
          <button
            id="mic-dictation-btn"
            type="button"
            onClick={handleToggleDictation}
            className={`p-2 rounded-full transition-all shrink-0 ${
              isListening
                ? "bg-[#A33C1B] text-white animate-pulse ring-2 ring-[#A33C1B]/50 shadow-sm"
                : "text-[#6B5E56] hover:text-[#2D2522] hover:bg-[#EBE3DC]"
            }`}
            title={
              isListening
                ? "Stop dictating and send"
                : isSpeechSupported
                ? "Dictate message to Nudge (Web Speech API)"
                : "Microphone speech input"
            }
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Optional Companion Modal Orb Launcher */}
          {onOpenVoiceModal && (
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="p-2 rounded-full text-[#8E8078] hover:text-[#2D2522] hover:bg-[#EBE3DC] transition-colors shrink-0 hidden sm:flex"
              title="Open Voice Nudge Audio Companion Orb"
            >
              <Headphones className="w-4 h-4" />
            </button>
          )}

          {/* Circular Terracotta Send Button */}
          <button
            id="send-message-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-[#A33C1B] hover:bg-[#8D3316] disabled:opacity-40 disabled:hover:bg-[#A33C1B] text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
            title="Send message to Nudge"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
