import React, { useState, useEffect } from "react";
import {
  Coffee,
  Play,
  Pause,
  Plus,
  Check,
  Bell,
  BellRing,
  RotateCcw,
  Sparkles,
  Volume2
} from "lucide-react";
import { formatTime } from "../lib/breakTimer";
import { requestNotificationPermission } from "../lib/sound";

interface BreakTimerBannerProps {
  initialMinutes: number;
  totalSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  onPauseToggle: () => void;
  onAddMinutes: (mins: number) => void;
  onFinishEarly: () => void;
  onDismissFinished: () => void;
  hasFinished: boolean;
  notificationPermission: NotificationPermission;
  onRequestNotification: () => void;
}

export const BreakTimerBanner: React.FC<BreakTimerBannerProps> = ({
  initialMinutes,
  totalSeconds,
  remainingSeconds,
  isActive,
  isPaused,
  onPauseToggle,
  onAddMinutes,
  onFinishEarly,
  onDismissFinished,
  hasFinished,
  notificationPermission,
  onRequestNotification,
}) => {
  const [justStarted, setJustStarted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setJustStarted(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!isActive && !hasFinished) return null;

  const progressPercent =
    totalSeconds > 0
      ? Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
      : 0;

  // Render "Break Complete" Alert State
  if (hasFinished) {
    return (
      <div
        id="break-finished-banner"
        className="mx-4 my-2 p-4 bg-[#FFF8F3] border-2 border-[#A33C1B] rounded-2xl shadow-lg animate-in zoom-in-95 duration-200"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#A33C1B] text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#2D2522]">
                  Break Completed! ⏰
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EAD4C7] text-[#7A2B14] text-[10px] font-semibold uppercase tracking-wider">
                  Chime Sounded
                </span>
              </div>
              <p className="text-xs text-[#61544D] mt-0.5">
                Nice rest! Nudge is ready to help you lock in for your next focus block.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onAddMinutes(5)}
              className="px-3 py-1.5 rounded-full bg-[#EFE9E4] hover:bg-[#E5DDD6] text-xs font-semibold text-[#4A3F39] flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span>+5m rest</span>
            </button>
            <button
              onClick={onDismissFinished}
              className="px-4 py-1.5 rounded-full bg-[#A33C1B] hover:bg-[#8D3316] text-xs font-semibold text-white flex items-center gap-1 transition-all active:scale-95 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Back to Focus</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Break In Progress
  return (
    <div
      id="active-break-timer-banner"
      className="mx-4 my-2 p-3.5 bg-[#FFF9F6] border border-[#F0D5C7] rounded-2xl shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#FCEEE7] text-[#A33C1B]">
            <Coffee className="w-4 h-4" />
            {!isPaused && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A33C1B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A33C1B]"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#2D2522]">
                Break Timer Active
              </span>
              {isPaused ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                  Paused
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  Counting Down
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#7A6E67]">
              Step away, stretch, or hydrate
            </span>
          </div>
        </div>

        {/* Big countdown clock */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-bold tracking-tight text-[#A33C1B]">
            {formatTime(remainingSeconds)}
          </span>

          {/* Pause / Resume Button */}
          <button
            id="break-timer-pause-toggle"
            onClick={onPauseToggle}
            className="w-8 h-8 rounded-full bg-[#F1E9E3] hover:bg-[#E7DED7] flex items-center justify-center text-[#4A3F39] transition-colors"
            title={isPaused ? "Resume break timer" : "Pause break timer"}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current" />
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#EDE4DD] h-1.5 rounded-full overflow-hidden mb-2.5">
        <div
          className="bg-[#A33C1B] h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Action shortcuts & Notification status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddMinutes(2)}
            className="px-2.5 py-1 rounded-full bg-[#F3ECE6] hover:bg-[#EAE1D9] text-[11px] font-medium text-[#4A3F39] flex items-center gap-1 transition-colors"
            title="Add 2 minutes to break"
          >
            <Plus className="w-3 h-3 text-[#A33C1B]" />
            <span>+2m</span>
          </button>
          <button
            onClick={() => onAddMinutes(5)}
            className="px-2.5 py-1 rounded-full bg-[#F3ECE6] hover:bg-[#EAE1D9] text-[11px] font-medium text-[#4A3F39] flex items-center gap-1 transition-colors"
            title="Add 5 minutes to break"
          >
            <Plus className="w-3 h-3 text-[#A33C1B]" />
            <span>+5m</span>
          </button>
          <button
            onClick={onFinishEarly}
            className="px-2.5 py-1 rounded-full bg-[#F3ECE6] hover:bg-[#EAE1D9] text-[11px] font-medium text-[#4A3F39] flex items-center gap-1 transition-colors"
            title="Finish break right now"
          >
            <Check className="w-3 h-3 text-emerald-700" />
            <span>Finish</span>
          </button>
        </div>

        {/* Notification permission prompt / badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#7A6E67]">
          {notificationPermission === "granted" ? (
            <div
              className="flex items-center gap-1 text-emerald-700 font-medium"
              title="Browser notifications are enabled. You will receive a desktop alert when the break ends."
            >
              <BellRing className="w-3 h-3" />
              <span className="hidden sm:inline">Desktop alert active</span>
            </div>
          ) : (
            <button
              onClick={onRequestNotification}
              className="flex items-center gap-1 text-[#A33C1B] hover:underline font-medium"
              title="Enable desktop notifications when break ends"
            >
              <Bell className="w-3 h-3" />
              <span>Enable desktop alert</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
