import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ChatBox } from "./components/ChatBox";
import { LiveSnapshotPanel } from "./components/LiveSnapshotPanel";
import { SecurityExplainerModal } from "./components/SecurityExplainerModal";
import { VoiceNudgeModal } from "./components/VoiceNudgeModal";
import { BottomNavigation } from "./components/BottomNavigation";
import { HomeView } from "./components/HomeView";
import { ScheduleView } from "./components/ScheduleView";
import { SummaryView } from "./components/SummaryView";
import {
  StudentSnapshot,
  ChatMessage,
  EdgeFunctionChatResponse,
  NudgeTone,
} from "./types";
import {
  fetchLiveSnapshot,
  updateLiveSnapshot,
  sendChatMessageToEdgeFunction,
} from "./lib/api";
import {
  getPaginatedLocalHistory,
  appendLocalChatMessage,
  clearLocalChatHistory,
} from "./lib/storage";
import { useBreakTimer } from "./hooks/useBreakTimer";
import { detectBreakRequest } from "./lib/breakTimer";
import { BreakTimerBanner } from "./components/BreakTimerBanner";
import { useReminders } from "./hooks/useReminders";
import { NotificationRemindersModal } from "./components/NotificationRemindersModal";
import { NotificationAlertBanner } from "./components/NotificationAlertBanner";
import { detectReminderRequest } from "./lib/reminderDetector";
import { getSavedTone, saveTonePreference } from "./lib/tones";
import {
  ShieldAlert,
  X
} from "lucide-react";

export default function App() {
  const [snapshot, setSnapshot] = useState<StudentSnapshot | null>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(20);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "home" | "chat" | "schedule" | "summary" | "snapshot"
  >("chat");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reminders & Notification System with Web Audio chime + desktop notification
  const remindersSystem = useReminders();

  // Nudge Tone & Persona setting (persisted across sessions in localStorage)
  const [currentTone, setCurrentTone] = useState<NudgeTone>(() => getSavedTone());

  const handleToneChange = (newTone: NudgeTone) => {
    setCurrentTone(newTone);
    saveTonePreference(newTone);
  };

  // Focus Mode: Mutes non-urgent UI alerts & highlights active tasks in LiveSnapshotPanel
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("nudge_focus_mode") === "true";
    } catch {
      return false;
    }
  });

  const handleToggleFocusMode = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nudge_focus_mode", String(next));
      } catch {}
      return next;
    });
  };

  // Proactive notification & follow-up message when student's break completes
  const handleBreakOver = useCallback(() => {
    const assistantTime = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const breakDoneMsg: ChatMessage = {
      id: "msg_break_over_" + Date.now(),
      role: "assistant",
      content:
        "☕ **Break is over!** Hope you feel recharged and clear-headed. Ready to dive back in? Let's tackle that next task together.",
      timestamp: assistantTime,
      quickReplies: [
        "Start a 25m focus sprint 🎯",
        "Review open assignments 📋",
        "Need 5 more minutes ☕",
      ],
      snapshotContextSnippet: {
        openTasksCount:
          snapshot?.openAssignments.filter((a) => !a.completed).length || 0,
        classesCount: snapshot?.todayClasses.length || 0,
        mood: snapshot?.mood.label || "Rested",
        habitStreak: snapshot?.streaks.habitDays || 0,
      },
    };

    setMessages((prev) => [...prev, breakDoneMsg]);
    appendLocalChatMessage(breakDoneMsg);
  }, [snapshot]);

  // Dedicated Break Timer with Web Audio synthesizer chimes & native browser alerts
  const breakTimer = useBreakTimer({
    onBreakOver: handleBreakOver,
  });

  // 1. Load on-device local history on startup (persisting across restarts)
  useEffect(() => {
    const { messages: initialMsgs, hasMore } = getPaginatedLocalHistory(15, 0);
    setMessages(initialMsgs);
    setHasMoreHistory(hasMore);
  }, []);

  // 2. Fetch live Supabase student snapshot
  const loadSnapshot = useCallback(async () => {
    try {
      setIsSnapshotLoading(true);
      const data = await fetchLiveSnapshot();
      setSnapshot(data);
      setErrorMessage(null);
    } catch (err) {
      console.error("Snapshot error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load Supabase snapshot"
      );
    } finally {
      setIsSnapshotLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  // Handle pagination for on-device local storage
  const handleLoadMoreHistory = () => {
    const nextOffset = historyOffset + 15;
    const { messages: olderMsgs, hasMore } = getPaginatedLocalHistory(15, nextOffset);
    setMessages(olderMsgs);
    setHistoryOffset(nextOffset);
    setHasMoreHistory(hasMore);
  };

  // Clear local device history
  const handleClearHistory = () => {
    if (
      window.confirm(
        "Clear all on-device conversation records? Your habit and assignment data in Supabase will NOT be affected."
      )
    ) {
      clearLocalChatHistory();
      setMessages([]);
      setHistoryOffset(0);
      setHasMoreHistory(false);
    }
  };

  // Update Supabase snapshot
  const handleUpdateSnapshot = async (updated: Partial<StudentSnapshot>) => {
    try {
      const fresh = await updateLiveSnapshot(updated);
      setSnapshot(fresh);
    } catch (err) {
      console.error("Snapshot update error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update Supabase snapshot"
      );
    }
  };

  // Send message via Edge Function Proxy with live snapshot
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isChatLoading) return;

    // A. Create and append user message to local on-device vault
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      role: "user",
      content: text,
      timestamp: formattedTime,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    appendLocalChatMessage(userMsg);
    setIsChatLoading(true);
    setErrorMessage(null);

    // Immediately start break timer if break request is detected in message!
    const breakDetection = detectBreakRequest(text);
    if (breakDetection.isBreak) {
      breakTimer.startBreak(breakDetection.durationMinutes);
    }

    // Immediately schedule notification reminder if requested in message!
    const reminderDetection = detectReminderRequest(text);
    if (reminderDetection.isReminder) {
      if (reminderDetection.openModalRequested) {
        setIsRemindersModalOpen(true);
      } else {
        remindersSystem.scheduleReminder({
          title: reminderDetection.title || "Study Sprint Check-in",
          delayMinutes: reminderDetection.delayMinutes || 15,
          category: "study",
          note: `Requested in chat: "${text}"`,
        });
      }
    }

    try {
      // B. Ensure fresh snapshot before sending (or use active)
      let currentSnapshot = snapshot;
      try {
        currentSnapshot = await fetchLiveSnapshot();
        setSnapshot(currentSnapshot);
      } catch (e) {
        console.warn("Using active snapshot fallback", e);
      }

      // C. Extract recent conversational turns (last 6 turns)
      const recentTurns = updatedMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const requestPayload = {
        message: text,
        snapshot: currentSnapshot!,
        history: recentTurns,
        tone: currentTone,
      };

      // D. App calls the Edge Function Proxy (NO GEMINI KEY IN APP)
      const response: EdgeFunctionChatResponse = await sendChatMessageToEdgeFunction(
        requestPayload
      );

      // Update rate limit remaining from server response
      if (response.rateLimit) {
        setRateLimitRemaining(response.rateLimit.remaining);
      }

      const assistantTime = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      // E. Save Nudge's assistant message to on-device vault
      const assistantMsg: ChatMessage = {
        id: "msg_" + Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: response.reply,
        timestamp: assistantTime,
        events: response.events,
        quickReplies: response.quickReplies,
        snapshotContextSnippet: {
          openTasksCount:
            currentSnapshot?.openAssignments.filter((a) => !a.completed).length || 0,
          classesCount: currentSnapshot?.todayClasses.length || 0,
          mood: currentSnapshot?.mood.label || "Moderate",
          habitStreak: currentSnapshot?.streaks.habitDays || 0,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
      appendLocalChatMessage(assistantMsg);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg =
        err instanceof Error ? err.message : "Error sending message to Edge Function";
      setErrorMessage(errMsg);

      const errorMsg: ChatMessage = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: `⚠️ [Security & Proxy Notice]: ${errMsg}. Please check Edge Function connection or rate limit.`,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2D2522] flex flex-col font-sans selection:bg-[#FCEEEA] selection:text-[#A33C1B]">
      {/* Top Header */}
      <Header
        snapshot={snapshot}
        rateLimitRemaining={rateLimitRemaining}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenSnapshotDrawer={() =>
          setActiveTab(activeTab === "snapshot" ? "chat" : "snapshot")
        }
        isSnapshotOpen={activeTab === "snapshot"}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        breakTimerState={{
          isActive: breakTimer.isActive,
          remainingSeconds: breakTimer.remainingSeconds,
          hasFinished: breakTimer.hasFinished,
        }}
        onOpenRemindersModal={() => setIsRemindersModalOpen(true)}
        activeRemindersCount={remindersSystem.activeReminders.length}
      />

      {/* Floating Interactive Alert Banner for Triggered Reminders */}
      <NotificationAlertBanner
        alert={remindersSystem.activeAlert}
        onDismiss={remindersSystem.dismissAlert}
        onSnooze={remindersSystem.snoozeReminder}
        onOpenRemindersModal={() => setIsRemindersModalOpen(true)}
      />

      {/* Error / Rate Limit Alert Banner */}
      {errorMessage && (
        <div className="bg-[#FBEAE9] border-b border-[#F5CAC7] px-4 py-2 text-xs text-rose-950 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-112px)]">
        {/* Desktop Left Column: Live Supabase Student Context (Classes, Mood, Habits) */}
        <div
          className={`lg:col-span-4 xl:col-span-4 border-r border-[#EAE2DA] lg:block ${
            activeTab === "snapshot" ? "block" : "hidden"
          } h-full overflow-hidden`}
        >
          <LiveSnapshotPanel
            snapshot={snapshot}
            isLoading={isSnapshotLoading}
            onRefresh={loadSnapshot}
            onUpdateSnapshot={handleUpdateSnapshot}
            isFocusMode={isFocusMode}
            onToggleFocusMode={handleToggleFocusMode}
            onQuickRemind={(asg) => {
              remindersSystem.scheduleReminder({
                title: `Work on ${asg.title}`,
                note: `Due: ${asg.dueDate} (${asg.course})`,
                delayMinutes: 20,
                category: "assignment",
                relatedId: asg.id,
              });
              setIsRemindersModalOpen(true);
            }}
          />
        </div>

        {/* Center / Primary Mobile View: Renders ChatBox or other selected screen */}
        <div
          className={`lg:col-span-8 xl:col-span-8 flex flex-col h-full overflow-hidden ${
            activeTab === "snapshot" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Break Timer Banner on non-chat screens so students never lose their break status */}
          {activeTab !== "chat" && (breakTimer.isActive || breakTimer.hasFinished) && (
            <div className="shrink-0 bg-[#FAF7F5] border-b border-[#EAE2DA] pt-2">
              <BreakTimerBanner
                initialMinutes={breakTimer.initialMinutes}
                totalSeconds={breakTimer.totalSeconds}
                remainingSeconds={breakTimer.remainingSeconds}
                isActive={breakTimer.isActive}
                isPaused={breakTimer.isPaused}
                onPauseToggle={breakTimer.pauseToggle}
                onAddMinutes={breakTimer.addMinutes}
                onFinishEarly={breakTimer.finishEarly}
                onDismissFinished={breakTimer.dismissFinished}
                hasFinished={breakTimer.hasFinished}
                notificationPermission={breakTimer.notificationPermission}
                onRequestNotification={breakTimer.requestNotification}
              />
            </div>
          )}

          {activeTab === "home" && (
            <HomeView
              snapshot={snapshot}
              onNavigateToChat={() => setActiveTab("chat")}
            />
          )}

          {activeTab === "chat" && (
            <ChatBox
              messages={messages}
              isLoading={isChatLoading}
              onSendMessage={handleSendMessage}
              onLoadMoreHistory={handleLoadMoreHistory}
              hasMoreHistory={hasMoreHistory}
              onClearLocalHistory={handleClearHistory}
              snapshot={snapshot}
              onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              currentTone={currentTone}
              onSelectTone={handleToneChange}
              isFocusMode={isFocusMode}
              onToggleFocusMode={handleToggleFocusMode}
              onOpenRemindersModal={() => setIsRemindersModalOpen(true)}
              activeRemindersCount={remindersSystem.activeReminders.length}
              breakTimer={{
                isActive: breakTimer.isActive,
                isPaused: breakTimer.isPaused,
                initialMinutes: breakTimer.initialMinutes,
                totalSeconds: breakTimer.totalSeconds,
                remainingSeconds: breakTimer.remainingSeconds,
                hasFinished: breakTimer.hasFinished,
                notificationPermission: breakTimer.notificationPermission,
                onPauseToggle: breakTimer.pauseToggle,
                onAddMinutes: breakTimer.addMinutes,
                onFinishEarly: breakTimer.finishEarly,
                onDismissFinished: breakTimer.dismissFinished,
                onRequestNotification: breakTimer.requestNotification,
              }}
            />
          )}

          {activeTab === "schedule" && (
            <ScheduleView onNavigateToChat={() => setActiveTab("chat")} />
          )}

          {activeTab === "summary" && (
            <SummaryView onNavigateToChat={() => setActiveTab("chat")} />
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar (Matching all screenshots) */}
      <BottomNavigation
        activeTab={activeTab === "snapshot" ? "chat" : (activeTab as any)}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
      />

      {/* Voice Nudge Companion Modal (Image 2) */}
      <VoiceNudgeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSendTranscription={(text) => {
          setActiveTab("chat");
          handleSendMessage(text);
        }}
      />

      {/* Security Architecture Explainer Modal */}
      <SecurityExplainerModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Notifications & Reminders Modal */}
      <NotificationRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={remindersSystem.reminders}
        activeReminders={remindersSystem.activeReminders}
        pastReminders={remindersSystem.pastReminders}
        notificationPermission={remindersSystem.notificationPermission}
        onRequestPermission={remindersSystem.requestPermission}
        onScheduleReminder={remindersSystem.scheduleReminder}
        onCancelReminder={remindersSystem.cancelReminder}
        onSendTestNotification={remindersSystem.sendTestNotification}
        onClearCompleted={remindersSystem.clearCompleted}
        snapshot={snapshot}
      />
    </div>
  );
}
