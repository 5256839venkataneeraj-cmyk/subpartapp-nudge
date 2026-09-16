import React from "react";
import { TrendingUp, Sparkles, Check, Calendar, Clock, Bell } from "lucide-react";
import { AssignmentItem } from "../types";

interface AssignmentProgressBarProps {
  assignments: AssignmentItem[];
  className?: string;
  onUpdateAssignmentProgress?: (id: string, progress: number) => void;
  onToggleAssignment?: (id: string, currentStatus: boolean) => void;
  onQuickRemind?: (assignment: AssignmentItem) => void;
}

export const AssignmentProgressBar: React.FC<AssignmentProgressBarProps> = ({
  assignments,
  className = "",
  onUpdateAssignmentProgress,
  onToggleAssignment,
  onQuickRemind,
}) => {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;
  const isAllComplete = total > 0 && completed === total;
  const activeAssignments = assignments.filter((a) => !a.completed);

  return (
    <div
      id="assignment-progress-component"
      className={`p-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DA] mb-3 shadow-2xs ${className}`}
    >
      {/* Overall Metric Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              isAllComplete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[#FCEEEA] text-[#A33C1B]"
            }`}
          >
            {isAllComplete ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-[#2D2522] block leading-tight">
              Assignment Progress
            </span>
            <span className="text-[10px] text-[#70645D]">
              {completed} of {total} completed
            </span>
          </div>
        </div>

        <div className="text-right">
          <span
            id="assignment-progress-percentage"
            className={`font-mono text-base font-extrabold tracking-tight ${
              isAllComplete ? "text-emerald-700" : "text-[#A33C1B]"
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Overall Progress Track */}
      <div
        id="assignment-progress-track"
        className="w-full bg-[#E8DFD7] h-2 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall assignment completion percentage"
      >
        <div
          id="assignment-progress-fill"
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isAllComplete
              ? "bg-emerald-600"
              : percentage >= 50
              ? "bg-[#A33C1B]"
              : "bg-[#B8502E]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status Micro-badge */}
      <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-[#70645D]">
        <span className="flex items-center gap-1 font-medium">
          {isAllComplete ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              All caught up!
            </span>
          ) : percentage >= 50 ? (
            <span className="text-[#A33C1B] font-semibold">Over halfway there!</span>
          ) : (
            <span>{remaining} remaining</span>
          )}
        </span>
        <span className="text-[10px] font-medium text-[#8A7D75]">
          {remaining === 0 ? "0 left" : `${remaining} to go`}
        </span>
      </div>

      {/* Active Tasks Due Dates & Completion Progress Bars */}
      {activeAssignments.length > 0 && (
        <div
          id="active-tasks-progress-breakdown"
          className="mt-3 pt-3 border-t border-[#EAE2DA] space-y-2"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-[#70645D] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#A33C1B]" />
              <span>Active Tasks Due Dates & Progress</span>
            </span>
            <span className="font-semibold text-[#A33C1B]">
              {activeAssignments.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {activeAssignments.map((asg) => {
              const taskProgress = asg.completed
                ? 100
                : typeof asg.progress === "number"
                ? asg.progress
                : 0;

              return (
                <div
                  key={asg.id}
                  id={`active-task-progress-card-${asg.id}`}
                  className="p-2.5 rounded-lg bg-white border border-[#EAE2DA] space-y-1.5 transition-colors hover:border-[#D9CCC2]"
                >
                  {/* Task Info & Due Date Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#2D2522] truncate">
                          {asg.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#A33C1B]">
                        {asg.course}
                      </span>
                    </div>

                    {/* Due date displayed alongside the completion progress bar */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <div
                        id={`active-task-due-date-${asg.id}`}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#A33C1B] bg-[#FCEEEA] px-2 py-0.5 rounded-full border border-[#F6D5CB]"
                        title={`Due date: ${asg.dueDate}`}
                      >
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">Due: {asg.dueDate}</span>
                      </div>

                      {onQuickRemind && (
                        <button
                          type="button"
                          onClick={() => onQuickRemind(asg)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#5C5049] hover:text-[#A33C1B] bg-white hover:bg-[#FCEEEA] px-2 py-0.5 rounded-full border border-[#D9CCC2] hover:border-[#A33C1B] transition-colors"
                          title={`Set notification reminder for ${asg.title}`}
                        >
                          <Bell className="w-2.5 h-2.5 text-[#A33C1B]" />
                          <span>Remind</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Completion Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#70645D] font-medium flex items-center gap-1">
                        {asg.dueLabel ? (
                          <span className="truncate max-w-[140px] text-[10px]">
                            {asg.dueLabel}
                          </span>
                        ) : (
                          <span>Progress</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          id={`active-task-pct-${asg.id}`}
                          className="font-mono font-bold text-[#2D2522]"
                        >
                          {taskProgress}%
                        </span>
                        {onUpdateAssignmentProgress && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = taskProgress >= 100 ? 0 : Math.min(100, taskProgress + 25);
                              onUpdateAssignmentProgress(asg.id, next);
                            }}
                            className="text-[9px] px-1 py-0.2 rounded bg-[#EFE9E4] hover:bg-[#E5DDD6] text-[#4A3F39] font-medium"
                            title="Advance progress (+25%)"
                          >
                            +25%
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      id={`active-task-track-${asg.id}`}
                      className="w-full bg-[#E8DFD7] h-1.5 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={taskProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${asg.title} completion progress: ${taskProgress}%`}
                    >
                      <div
                        id={`active-task-fill-${asg.id}`}
                        className={`h-full rounded-full transition-all duration-400 ease-out ${
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
          </div>
        </div>
      )}
    </div>
  );
};
