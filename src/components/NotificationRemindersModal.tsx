import React, { useState } from "react";
import {
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Volume2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Coffee,
  Droplets,
} from "lucide-react";
import { ReminderItem, StudentSnapshot } from "../types";

interface NotificationRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ReminderItem[];
  activeReminders: ReminderItem[];
  pastReminders: ReminderItem[];
  notificationPermission: NotificationPermission;
  onRequestPermission: () => Promise<NotificationPermission>;
  onScheduleReminder: (params: {
    title: string;
    note?: string;
    delayMinutes?: number;
    targetTime?: number;
    category?: ReminderItem["category"];
    relatedId?: string;
  }) => void;
  onCancelReminder: (id: string) => void;
  onSendTestNotification: () => void;
  onClearCompleted: () => void;
  snapshot: StudentSnapshot | null;
}

export const NotificationRemindersModal: React.FC<NotificationRemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  activeReminders,
  pastReminders,
  notificationPermission,
  onRequestPermission,
  onScheduleReminder,
  onCancelReminder,
  onSendTestNotification,
  onClearCompleted,
  snapshot,
}) => {
  const [activeTab, setActiveTab] = useState<"scheduled" | "new" | "history">("scheduled");
  const [customTitle, setCustomTitle] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [selectedDelay, setSelectedDelay] = useState<number>(15);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>("20");
  const [selectedCategory, setSelectedCategory] =
    useState<ReminderItem["category"]>("study");
  const [testSentMessage, setTestSentMessage] = useState(false);

  if (!isOpen) return null;

  const handleCreateCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const title = customTitle.trim();
    if (!title) return;

    const delay =
      selectedDelay === -1 ? Math.max(1, parseInt(customMinutesInput, 10) || 15) : selectedDelay;

    onScheduleReminder({
      title,
      note: customNote.trim() || undefined,
      delayMinutes: delay,
      category: selectedCategory,
    });

    setCustomTitle("");
    setCustomNote("");
    setActiveTab("scheduled");
  };

  const handleTriggerTest = () => {
    onSendTestNotification();
    setTestSentMessage(true);
    setTimeout(() => setTestSentMessage(false), 3500);
  };

  const formatCountdown = (targetTime: number) => {
    const diffMs = targetTime - Date.now();
    if (diffMs <= 0) return "Triggering now...";
    const diffSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const hours = Math.floor(mins / 60);

    if (hours > 0) {
      return `in ${hours}h ${mins % 60}m`;
    }
    if (mins > 0) {
      return `in ${mins}m ${secs}s`;
    }
    return `in ${secs}s`;
  };

  const formatClockTime = (targetTime: number) => {
    return new Date(targetTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      id="notification-reminders-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="notification-reminders-modal-card"
        className="bg-white border border-[#EAE2DA] w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#2D2522]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE2DA] bg-[#FAF7F5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center shadow-2xs">
              <BellRing className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D2522] leading-tight">
                Notifications & Reminders
              </h2>
              <p className="text-xs text-[#70645D]">
                Get scheduled audio alerts & desktop notifications
              </p>
            </div>
          </div>
          <button
            id="close-reminders-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#70645D] hover:bg-[#EFEAE5] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Permission & Test Notification Ribbon */}
        <div className="px-4 py-3 bg-[#FDFBF9] border-b border-[#EAE2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            {notificationPermission === "granted" ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Desktop Alerts Active</span>
              </span>
            ) : notificationPermission === "denied" ? (
              <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Desktop alerts blocked (Chimes active)</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onRequestPermission}
                className="px-2.5 py-1 rounded-full bg-[#A33C1B] text-white font-semibold flex items-center gap-1 hover:bg-[#8D3316] transition-colors shadow-2xs"
              >
                <Bell className="w-3 h-3" />
                <span>Enable Desktop Alerts</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="send-test-notification-btn"
              type="button"
              onClick={handleTriggerTest}
              className="px-2.5 py-1 rounded-full bg-white border border-[#D9CCC2] hover:border-[#A33C1B] text-[#4A3F39] hover:text-[#A33C1B] font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Test audio chime & desktop notification"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span>Send Test Notification</span>
            </button>
          </div>
        </div>

        {testSentMessage && (
          <div className="px-4 py-1.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Test notification dispatched! You should hear the chime and see the banner.
            </span>
            <button
              onClick={() => setTestSentMessage(false)}
              className="text-emerald-700 hover:text-emerald-950 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs: Scheduled (count), Set New Reminder, History */}
        <div className="flex border-b border-[#EAE2DA] px-4 pt-2 bg-[#FAF7F5] text-xs font-semibold gap-2">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`pb-2 px-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "scheduled"
                ? "border-[#A33C1B] text-[#A33C1B]"
                : "border-transparent text-[#70645D] hover:text-[#2D2522]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled</span>
            {activeReminders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#A33C1B] text-white text-[10px] font-bold">
                {activeReminders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("new")}
            className={`pb-2 px-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "new"
                ? "border-[#A33C1B] text-[#A33C1B]"
                : "border-transparent text-[#70645D] hover:text-[#2D2522]"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set New Reminder</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2 px-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "history"
                ? "border-[#A33C1B] text-[#A33C1B]"
                : "border-transparent text-[#70645D] hover:text-[#2D2522]"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>History ({pastReminders.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Scheduled Reminders */}
          {activeTab === "scheduled" && (
            <div className="space-y-3">
              {activeReminders.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#EAE2DA] bg-[#FAF7F5]">
                  <div className="w-10 h-10 rounded-full bg-[#FCEEEA] text-[#A33C1B] mx-auto flex items-center justify-center mb-2">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2522]">
                    No Upcoming Reminders
                  </h3>
                  <p className="text-xs text-[#70645D] mt-1 max-w-xs mx-auto">
                    Schedule a study sprint, assignment deadline check, or daily habit reminder.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="mt-3 px-3.5 py-1.5 rounded-full bg-[#A33C1B] text-white text-xs font-semibold hover:bg-[#8D3316] transition-colors shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Reminder</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#70645D] px-1 font-medium">
                    <span>{activeReminders.length} Active Reminders</span>
                    <span>Sound alert + notification active</span>
                  </div>

                  {activeReminders.map((rem) => (
                    <div
                      key={rem.id}
                      id={`reminder-card-${rem.id}`}
                      className="p-3 rounded-xl border border-[#EAE2DA] bg-white shadow-2xs hover:border-[#D9CCC2] transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#2D2522] truncate">
                              {rem.title}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAF7F5] border border-[#EAE2DA] text-[#70645D] capitalize shrink-0 font-medium">
                              {rem.category}
                            </span>
                          </div>
                          {rem.note && (
                            <p className="text-[11px] text-[#70645D] mt-0.5 truncate">
                              {rem.note}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#A33C1B] font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>{formatCountdown(rem.targetTime)}</span>
                            <span className="text-[#8A7D75] font-normal">
                              ({formatClockTime(rem.targetTime)})
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCancelReminder(rem.id)}
                        className="text-[#8A7D75] hover:text-rose-600 p-1 rounded-lg hover:bg-[#FBEAE9] transition-colors shrink-0"
                        title="Cancel reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Preset Reminders */}
              <div className="pt-3 border-t border-[#EAE2DA]">
                <span className="text-xs font-bold text-[#4A3F39] block mb-2">
                  Quick 1-Click Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onScheduleReminder({
                        title: "15m Focus Sprint Check-in",
                        note: "Check your progress and stretch your posture",
                        delayMinutes: 15,
                        category: "study",
                      });
                      setActiveTab("scheduled");
                    }}
                    className="p-2.5 rounded-xl border border-[#EAE2DA] bg-[#FAF7F5] hover:bg-[#FFF9F6] hover:border-[#A33C1B]/50 text-left transition-all text-xs flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#2D2522] block">
                        15m Focus Sprint
                      </span>
                      <span className="text-[10px] text-[#70645D]">
                        Quick study milestone nudge
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onScheduleReminder({
                        title: "30m Assignment Sprint",
                        note: "Wrap up current question & review rubric",
                        delayMinutes: 30,
                        category: "assignment",
                      });
                      setActiveTab("scheduled");
                    }}
                    className="p-2.5 rounded-xl border border-[#EAE2DA] bg-[#FAF7F5] hover:bg-[#FFF9F6] hover:border-[#A33C1B]/50 text-left transition-all text-xs flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#2D2522] block">
                        30m Assignment Sprint
                      </span>
                      <span className="text-[10px] text-[#70645D]">
                        Targeted assignment check
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onScheduleReminder({
                        title: "Hydration & Posture Reset",
                        note: "Drink a glass of water and take 3 deep breaths",
                        delayMinutes: 20,
                        category: "habit",
                      });
                      setActiveTab("scheduled");
                    }}
                    className="p-2.5 rounded-xl border border-[#EAE2DA] bg-[#FAF7F5] hover:bg-[#FFF9F6] hover:border-[#A33C1B]/50 text-left transition-all text-xs flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Droplets className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#2D2522] block">
                        Hydration Check (20m)
                      </span>
                      <span className="text-[10px] text-[#70645D]">
                        2.0L Daily target nudge
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onScheduleReminder({
                        title: "Evening Study Wrap-up",
                        note: "Pack bag for tomorrow & log daily reflection",
                        delayMinutes: 60,
                        category: "custom",
                      });
                      setActiveTab("scheduled");
                    }}
                    className="p-2.5 rounded-xl border border-[#EAE2DA] bg-[#FAF7F5] hover:bg-[#FFF9F6] hover:border-[#A33C1B]/50 text-left transition-all text-xs flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Coffee className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#2D2522] block">
                        1-Hour Wrap-up
                      </span>
                      <span className="text-[10px] text-[#70645D]">
                        Evening review reminder
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Set New Reminder Form */}
          {activeTab === "new" && (
            <form onSubmit={handleCreateCustomReminder} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#2D2522] mb-1">
                  Reminder Title <span className="text-[#A33C1B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Finish Organic Chem reaction mechanisms"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CCC2] focus:border-[#A33C1B] focus:ring-1 focus:ring-[#A33C1B] outline-none text-xs text-[#2D2522]"
                />
              </div>

              {/* Quick suggestions based on Maya's open assignments */}
              {snapshot?.openAssignments && snapshot.openAssignments.length > 0 && (
                <div>
                  <span className="text-[11px] text-[#70645D] block mb-1 font-medium">
                    Or select an active assignment:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {snapshot.openAssignments
                      .filter((a) => !a.completed)
                      .map((asg) => (
                        <button
                          key={asg.id}
                          type="button"
                          onClick={() => {
                            setCustomTitle(`Work on ${asg.title} (${asg.course})`);
                            setCustomNote(`Due: ${asg.dueDate}`);
                            setSelectedCategory("assignment");
                          }}
                          className="px-2 py-1 rounded-lg bg-[#FAF7F5] hover:bg-[#FCEEEA] hover:text-[#A33C1B] border border-[#EAE2DA] text-[11px] text-[#4A3F39] truncate max-w-full text-left"
                        >
                          📌 {asg.course}: {asg.title}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* When should this reminder fire? */}
              <div>
                <label className="block text-xs font-bold text-[#2D2522] mb-1.5">
                  When should the notification trigger?
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { label: "5 mins", value: 5 },
                    { label: "10 mins", value: 10 },
                    { label: "15 mins", value: 15 },
                    { label: "30 mins", value: 30 },
                    { label: "45 mins", value: 45 },
                    { label: "1 hour", value: 60 },
                    { label: "2 hours", value: 120 },
                    { label: "Custom", value: -1 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedDelay(opt.value)}
                      className={`py-1.5 px-2 rounded-xl font-medium border text-center transition-all ${
                        selectedDelay === opt.value
                          ? "bg-[#A33C1B] text-white border-[#A33C1B] shadow-2xs font-bold"
                          : "bg-white border-[#D9CCC2] text-[#4A3F39] hover:bg-[#FAF7F5]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {selectedDelay === -1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-[#70645D]">Remind in:</span>
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg border border-[#D9CCC2] bg-white text-xs font-mono"
                    />
                    <span className="text-[11px] text-[#70645D]">minutes</span>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#2D2522] mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "study", label: "Study Sprint" },
                    { id: "assignment", label: "Assignment" },
                    { id: "habit", label: "Habit / Wellness" },
                    { id: "class", label: "Class / Prep" },
                    { id: "custom", label: "Custom" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        selectedCategory === cat.id
                          ? "bg-[#2D2522] text-white border-[#2D2522]"
                          : "bg-white border-[#D9CCC2] text-[#5C5049] hover:bg-[#FAF7F5]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note (optional) */}
              <div>
                <label className="block text-xs font-bold text-[#2D2522] mb-1">
                  Optional Note or Action Step
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Review pages 45-52 and write summary notes"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9CCC2] focus:border-[#A33C1B] focus:ring-1 focus:ring-[#A33C1B] outline-none text-xs text-[#2D2522]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("scheduled")}
                  className="px-3 py-1.5 rounded-xl border border-[#D9CCC2] text-[#70645D] hover:bg-[#FAF7F5] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#A33C1B] text-white font-bold hover:bg-[#8D3316] transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Schedule Reminder</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: History */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#70645D] px-1 font-medium">
                <span>Past Triggered Reminders</span>
                {pastReminders.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearCompleted}
                    className="text-rose-600 hover:text-rose-800 underline text-[11px]"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {pastReminders.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8A7D75]">
                  No past reminders recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {pastReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-2.5 rounded-xl border border-[#EAE2DA] bg-[#FAF7F5] text-xs flex items-start justify-between gap-2 opacity-80"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-[#2D2522] line-through">
                            {rem.title}
                          </span>
                          {rem.note && (
                            <p className="text-[11px] text-[#70645D]">{rem.note}</p>
                          )}
                          <span className="text-[10px] text-[#8A7D75] block mt-0.5">
                            Triggered at{" "}
                            {rem.triggeredAt
                              ? new Date(rem.triggeredAt).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Earlier"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EAE2DA] text-[#70645D] capitalize shrink-0">
                        {rem.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAF7F5] border-t border-[#EAE2DA] text-[11px] text-[#70645D] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Bell className="w-3 h-3 text-[#A33C1B]" />
            <span>Reminders sound Web Audio chimes even if browser is idle</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white border border-[#D9CCC2] text-[#4A3F39] hover:bg-[#EFEAE5] font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
