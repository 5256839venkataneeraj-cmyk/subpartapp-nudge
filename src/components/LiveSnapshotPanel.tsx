import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  Clock,
  Smile,
  Sparkles,
  RefreshCw,
  Droplets,
  Bike,
  Check,
  GraduationCap,
  Target,
  Eye,
  EyeOff,
  Bell,
} from "lucide-react";
import { StudentSnapshot, AssignmentItem } from "../types";
import { AssignmentProgressBar } from "./AssignmentProgressBar";

interface LiveSnapshotPanelProps {
  snapshot: StudentSnapshot | null;
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateSnapshot: (updated: Partial<StudentSnapshot>) => Promise<void>;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onQuickRemind?: (assignment: AssignmentItem) => void;
}

export const LiveSnapshotPanel: React.FC<LiveSnapshotPanelProps> = ({
  snapshot,
  isLoading,
  onRefresh,
  onUpdateSnapshot,
  isFocusMode = false,
  onToggleFocusMode,
  onQuickRemind,
}) => {
  const [editingMood, setEditingMood] = useState(false);
  const [showCompletedInFocus, setShowCompletedInFocus] = useState(false);
  const [selectedMoodScore, setSelectedMoodScore] = useState(
    snapshot?.mood.score || 3
  );
  const [selectedEnergy, setSelectedEnergy] = useState(
    snapshot?.mood.energy || "Medium"
  );
  const [moodNote, setMoodNote] = useState(snapshot?.mood.note || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!snapshot) {
    return (
      <div className="p-6 text-center text-[#70645D] flex flex-col items-center justify-center h-full bg-[#FAF7F5]">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#A33C1B]" />
        <p className="text-sm font-medium">Connecting to Supabase snapshot...</p>
      </div>
    );
  }

  const toggleAssignment = async (id: string, currentStatus: boolean) => {
    const nextCompleted = !currentStatus;
    const updatedAssignments = snapshot.openAssignments.map((a) =>
      a.id === id
        ? {
            ...a,
            completed: nextCompleted,
            progress: nextCompleted
              ? 100
              : typeof a.progress === "number" && a.progress < 100
              ? a.progress
              : 50,
          }
        : a
    );
    await onUpdateSnapshot({ openAssignments: updatedAssignments });
  };

  const handleUpdateAssignmentProgress = async (id: string, progress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const updatedAssignments = snapshot.openAssignments.map((a) =>
      a.id === id
        ? {
            ...a,
            progress: clampedProgress,
            completed: clampedProgress === 100,
          }
        : a
    );
    await onUpdateSnapshot({ openAssignments: updatedAssignments });
  };

  const toggleHabit = async (id: string, currentStatus: boolean) => {
    const updatedHabits = snapshot.habitLogs.map((h) =>
      h.id === id ? { ...h, completed: !currentStatus } : h
    );
    const newHabitDays = !currentStatus
      ? snapshot.streaks.habitDays + 1
      : Math.max(0, snapshot.streaks.habitDays - 1);

    await onUpdateSnapshot({
      habitLogs: updatedHabits,
      streaks: {
        ...snapshot.streaks,
        habitDays: newHabitDays,
      },
    });
  };

  const handleSaveMood = async () => {
    setIsSaving(true);
    let label = "A bit overwhelmed tbh";
    if (selectedMoodScore === 1) label = "Exhausted & Drained";
    else if (selectedMoodScore === 2) label = "Stressed & Anxious";
    else if (selectedMoodScore === 3) label = "A bit overwhelmed tbh";
    else if (selectedMoodScore === 4) label = "Focused & Balanced";
    else if (selectedMoodScore === 5) label = "Unstoppable & High Energy";

    await onUpdateSnapshot({
      mood: {
        score: selectedMoodScore,
        label,
        energy: selectedEnergy,
        note: moodNote,
      },
    });
    setIsSaving(false);
    setEditingMood(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF7F5] border-r border-[#EAE2DA] text-[#2D2522] overflow-y-auto font-sans">
      {/* Top Banner */}
      <div className="p-4 border-b border-[#EAE2DA] bg-[#FAF7F5]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center font-bold text-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2D2522] flex items-center gap-1.5">
                <span>Supabase Live Snapshot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-[11px] text-[#70645D]">
                Fed to Edge Function before every chat turn
              </p>
            </div>
          </div>
          <button
            id="refresh-snapshot-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-[#EFE9E4] hover:bg-[#E5DDD6] text-[#4A3F39] transition-colors"
            title="Fetch fresh snapshot from Supabase"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading ? "animate-spin text-[#A33C1B]" : ""
              }`}
            />
          </button>
        </div>

        {/* Student Profile Card */}
        <div className="mt-3 p-3 rounded-2xl bg-white border border-[#E9DFD7] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              alt="Maya"
              className="w-10 h-10 rounded-full object-cover border border-[#EAE2DA]"
            />
            <div>
              <div className="font-bold text-sm text-[#2D2522]">
                {snapshot.studentName}
              </div>
              <div className="text-[#70645D] text-xs">
                {snapshot.academicYear}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#A33C1B] bg-[#FCEEEA] px-2.5 py-1 rounded-full font-bold text-xs">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{snapshot.streaks.habitDays}d streak</span>
          </div>
        </div>

        {/* Focus Mode Snapshot Banner */}
        {isFocusMode && (
          <div
            id="focus-mode-snapshot-callout"
            className="mt-3 p-2.5 rounded-xl bg-[#2D2522] text-[#FAF7F5] border border-[#443831] flex items-center justify-between shadow-xs animate-in fade-in"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">
                  Focus Mode Active
                </span>
                <span className="text-[10px] text-amber-200">
                  Highlighting active targets • Distractions filtered
                </span>
              </div>
            </div>
            {onToggleFocusMode && (
              <button
                onClick={onToggleFocusMode}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white transition-colors shrink-0"
              >
                Disable
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Mood & Energy Card */}
        <section className="bg-white rounded-2xl p-4 border border-[#E9DFD7] shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-[#70645D] uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span>Current Mood & Energy</span>
            </h3>
            <button
              onClick={() => setEditingMood(!editingMood)}
              className="text-xs text-[#A33C1B] hover:underline font-semibold"
            >
              {editingMood ? "Cancel" : "Edit"}
            </button>
          </div>

          {!editingMood ? (
            <div className="bg-[#F5EFEB] p-3 rounded-xl border border-[#E7DDD5] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D2522]">
                  {snapshot.mood.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#70645D] font-semibold">
                  Energy: {snapshot.mood.energy}
                </span>
              </div>
              {snapshot.mood.note && (
                <p className="text-xs text-[#61554E] italic leading-relaxed">
                  "{snapshot.mood.note}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 bg-[#FAF7F5] p-3 rounded-xl border border-[#E7DDD5]">
              <div>
                <label className="text-xs text-[#70645D] font-medium block mb-1">
                  Mood (1 = Overwhelmed, 5 = Energized)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedMoodScore(s)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedMoodScore === s
                          ? "bg-[#A33C1B] text-white shadow-xs"
                          : "bg-white text-[#70645D] border border-[#E7DDD5]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#70645D] font-medium block mb-1">
                  Personal Note for Nudge
                </label>
                <input
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="What's stressing or motivating you?"
                  className="w-full text-xs p-2 rounded-lg bg-white border border-[#E7DDD5] focus:outline-none focus:ring-1 focus:ring-[#A33C1B]"
                />
              </div>

              <button
                onClick={handleSaveMood}
                disabled={isSaving}
                className="w-full py-1.5 rounded-lg bg-[#A33C1B] hover:bg-[#8D3316] text-white text-xs font-bold shadow-xs transition-colors"
              >
                {isSaving ? "Saving to Supabase..." : "Update Live Snapshot"}
              </button>
            </div>
          )}
        </section>

        {/* Today's Classes */}
        <section className="bg-white rounded-2xl p-4 border border-[#E9DFD7] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#70645D] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span>Today's Classes ({snapshot.todayClasses.length})</span>
            </h3>
            <span className="text-[11px] text-[#A33C1B] font-semibold">
              Oct 25 (Today)
            </span>
          </div>

          <div className="space-y-2">
            {snapshot.todayClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-3 rounded-xl bg-[#FAF7F5] border border-[#EAE2DA] hover:border-[#D5C7BD] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#2D2522]">
                      {cls.name}
                    </div>
                    <div className="text-[11px] text-[#70645D] font-medium">
                      {cls.location} • {cls.instructor}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#70645D] border border-[#E2D8CF]">
                    {cls.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coursework & Open Assignments */}
        <section
          className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
            isFocusMode
              ? "border-[#A33C1B]/40 ring-1 ring-[#A33C1B]/10"
              : "border-[#E9DFD7]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#70645D] uppercase tracking-wider flex items-center gap-1.5">
              {isFocusMode ? (
                <Target className="w-3.5 h-3.5 text-[#A33C1B]" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 text-[#A33C1B]" />
              )}
              <span>{isFocusMode ? "Target Focus: Open Tasks" : "Assignments & Deadlines"}</span>
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isFocusMode
                  ? "bg-[#2D2522] text-[#FAF7F5]"
                  : "bg-[#FCEEEA] text-[#A33C1B]"
              }`}
            >
              {snapshot.openAssignments.filter((a) => !a.completed).length} active
            </span>
          </div>

          {/* Visual Assignment Completion Progress Bar */}
          <AssignmentProgressBar
            assignments={snapshot.openAssignments}
            onUpdateAssignmentProgress={handleUpdateAssignmentProgress}
            onToggleAssignment={toggleAssignment}
            onQuickRemind={onQuickRemind}
          />

          {/* Assignments List with Focus Mode Highlighting */}
          <div className="space-y-2.5">
            {/* Active (Incomplete) Assignments with Due Dates & Completion Progress Bars */}
            {snapshot.openAssignments
              .filter((a) => !a.completed)
              .map((asg) => {
                const taskProgress = asg.completed
                  ? 100
                  : typeof asg.progress === "number"
                  ? asg.progress
                  : 0;

                return (
                  <div
                    key={asg.id}
                    id={`active-task-card-${asg.id}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFocusMode
                        ? "bg-[#FFF9F6] border-2 border-[#A33C1B] shadow-sm ring-2 ring-[#A33C1B]/15"
                        : "bg-[#FAF7F5] border-[#EAE2DA] hover:border-[#A33C1B]/50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        id={`toggle-task-${asg.id}`}
                        onClick={() => toggleAssignment(asg.id, asg.completed)}
                        className="mt-0.5 shrink-0 text-[#A33C1B] hover:scale-110 transition-transform cursor-pointer"
                        title={asg.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        <Circle className="w-4 h-4 text-[#A09289]" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#2D2522] truncate">
                            {asg.title}
                          </span>
                          {isFocusMode && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#FCEEEA] text-[#A33C1B] font-extrabold text-[9px] flex items-center gap-1 border border-[#F6D5CB]">
                              <Target className="w-2.5 h-2.5" />
                              <span>TARGET</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#70645D] mt-0.5">
                          <span className="font-semibold text-[#A33C1B]">
                            {asg.course}
                          </span>
                          <span>•</span>
                          <span>{asg.estMinutes}m est</span>
                          {asg.dueLabel && asg.dueLabel !== asg.dueDate && (
                            <>
                              <span>•</span>
                              <span className="text-[#8A7D75] truncate">
                                {asg.dueLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Due date displayed alongside the completion progress bar for each active task */}
                    <div className="mt-2.5 pt-2 border-t border-[#EAE2DA] space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div
                            id={`task-due-date-badge-${asg.id}`}
                            className="flex items-center gap-1.5 font-semibold text-[#A33C1B] bg-[#FCEEEA] px-2 py-0.5 rounded-md border border-[#F6D5CB] text-[11px]"
                            title={`Assignment due date: ${asg.dueDate}`}
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>Due: {asg.dueDate}</span>
                          </div>

                          {onQuickRemind && (
                            <button
                              id={`remind-btn-${asg.id}`}
                              type="button"
                              onClick={() => onQuickRemind(asg)}
                              className="flex items-center gap-1 text-[10px] font-semibold text-[#5C5049] hover:text-[#A33C1B] bg-white hover:bg-[#FCEEEA] px-2 py-0.5 rounded-md border border-[#D9CCC2] hover:border-[#A33C1B] transition-colors shadow-2xs"
                              title={`Set notification reminder for ${asg.title}`}
                            >
                              <Bell className="w-2.5 h-2.5 text-[#A33C1B]" />
                              <span>Remind Me</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#70645D]">Progress:</span>
                          <span
                            id={`task-progress-value-${asg.id}`}
                            className="font-mono text-xs font-bold text-[#2D2522]"
                          >
                            {taskProgress}%
                          </span>
                        </div>
                      </div>

                      {/* Completion Progress Bar */}
                      <div
                        id={`task-progress-bar-track-${asg.id}`}
                        className="w-full bg-[#E8DFD7] h-2 rounded-full overflow-hidden cursor-pointer group"
                        role="progressbar"
                        aria-valuenow={taskProgress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${asg.title} completion progress: ${taskProgress}%`}
                        onClick={() => {
                          const nextProgress =
                            taskProgress >= 100
                              ? 0
                              : taskProgress >= 75
                              ? 100
                              : taskProgress + 25;
                          handleUpdateAssignmentProgress(asg.id, nextProgress);
                        }}
                        title="Click to advance progress (+25%)"
                      >
                        <div
                          id={`task-progress-bar-fill-${asg.id}`}
                          className={`h-full rounded-full transition-all duration-300 ease-out ${
                            taskProgress === 100
                              ? "bg-emerald-600"
                              : taskProgress >= 50
                              ? "bg-[#A33C1B]"
                              : "bg-[#B8502E]"
                          }`}
                          style={{ width: `${taskProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Completed Tasks in Focus Mode: Collapsible to eliminate visual noise */}
            {isFocusMode ? (
              snapshot.openAssignments.some((a) => a.completed) ? (
                <div className="pt-2 border-t border-[#EAE2DA] mt-3">
                  <button
                    onClick={() => setShowCompletedInFocus(!showCompletedInFocus)}
                    className="w-full flex items-center justify-between text-xs text-[#70645D] hover:text-[#2D2522] py-1.5 px-2.5 rounded-lg bg-[#FAF7F5] hover:bg-[#F5EFE9] transition-colors border border-[#EAE2DA]"
                  >
                    <span className="flex items-center gap-1.5 font-medium text-[11px]">
                      {showCompletedInFocus ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {showCompletedInFocus
                          ? "Hide completed tasks"
                          : `View ${
                              snapshot.openAssignments.filter((a) => a.completed).length
                            } completed task(s)`}
                      </span>
                    </span>
                    <span className="text-[10px] text-[#8A7D75]">
                      {showCompletedInFocus ? "Collapse" : "Muted in Focus"}
                    </span>
                  </button>

                  {showCompletedInFocus && (
                    <div className="space-y-2 mt-2 opacity-60">
                      {snapshot.openAssignments
                        .filter((a) => a.completed)
                        .map((asg) => (
                          <div
                            key={asg.id}
                            onClick={() => toggleAssignment(asg.id, asg.completed)}
                            className="p-3 rounded-xl border bg-[#FAF7F5] border-[#EAE2DA] cursor-pointer flex items-start gap-2.5"
                          >
                            <button className="mt-0.5 shrink-0 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold line-through text-[#8F827A] truncate">
                                {asg.title}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#70645D] mt-0.5">
                                <span className="font-semibold text-[#8F827A]">{asg.course}</span>
                                <span>•</span>
                                <span>Due: {asg.dueDate}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">Completed (100%)</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : null
            ) : (
              /* Non-Focus Mode: Show Completed Tasks in regular list */
              snapshot.openAssignments
                .filter((a) => a.completed)
                .map((asg) => (
                  <div
                    key={asg.id}
                    onClick={() => toggleAssignment(asg.id, asg.completed)}
                    className="p-3 rounded-xl border bg-[#FAF7F5] opacity-60 border-[#EAE2DA] hover:border-[#A33C1B]/50 transition-all cursor-pointer flex items-start gap-2.5"
                  >
                    <button className="mt-0.5 shrink-0 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold line-through text-[#8F827A] truncate">
                        {asg.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#70645D] mt-0.5">
                        <span className="font-semibold text-[#A33C1B]">{asg.course}</span>
                        <span>•</span>
                        <span>Due: {asg.dueDate}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">Completed (100%)</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Gentle Habits & Momentum */}
        <section className="bg-white rounded-2xl p-4 border border-[#E9DFD7] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#70645D] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span>Today's Flow & Habits</span>
            </h3>
            <span className="text-[11px] font-semibold text-[#70645D]">
              {snapshot.habitLogs.filter((h) => h.completed).length}/
              {snapshot.habitLogs.length} done
            </span>
          </div>

          <div className="space-y-2">
            {snapshot.habitLogs.map((hab) => (
              <div
                key={hab.id}
                onClick={() => toggleHabit(hab.id, hab.completed)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  hab.completed
                    ? "bg-[#E2F0E7]/50 border-[#C4E3D0]"
                    : "bg-[#FAF7F5] border-[#EAE2DA] hover:border-[#D5C7BD]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      hab.completed
                        ? "bg-emerald-600 text-white"
                        : "border border-[#A09289] bg-white"
                    }`}
                  >
                    {hab.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      hab.completed ? "text-[#245D3A]" : "text-[#2D2522]"
                    }`}
                  >
                    {hab.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#70645D] font-medium">
                  {hab.target}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
