import React from "react";
import { Bell, Clock, X, Check, RotateCcw } from "lucide-react";
import { ReminderItem } from "../types";

interface NotificationAlertBannerProps {
  alert: ReminderItem | null;
  onDismiss: () => void;
  onSnooze: (id: string, minutes: number) => void;
  onOpenRemindersModal?: () => void;
}

export const NotificationAlertBanner: React.FC<NotificationAlertBannerProps> = ({
  alert,
  onDismiss,
  onSnooze,
  onOpenRemindersModal,
}) => {
  if (!alert) return null;

  return (
    <div
      id="notification-alert-banner"
      className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-[#2D2522] text-white p-4 rounded-2xl shadow-2xl border border-[#4A3F39] flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#A33C1B] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E89E87]">
                  Nudge Reminder Alert
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#4A3F39] text-[#D8CCC4] capitalize">
                  {alert.category}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                {alert.title}
              </h4>
              {alert.note && (
                <p className="text-xs text-[#C5B8B0] mt-1 leading-relaxed">
                  {alert.note}
                </p>
              )}
            </div>
          </div>

          <button
            id="dismiss-alert-btn"
            onClick={onDismiss}
            className="text-[#A09289] hover:text-white p-1 rounded-lg hover:bg-[#4A3F39] transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#443933] text-xs">
          <button
            id="snooze-alert-btn"
            onClick={() => onSnooze(alert.id, 5)}
            className="px-2.5 py-1 rounded-lg bg-[#3D332D] hover:bg-[#4D413A] text-[#E8DFD7] font-medium flex items-center gap-1.5 transition-colors"
            title="Remind again in 5 minutes"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#E89E87]" />
            <span>Snooze 5m</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenRemindersModal && (
              <button
                onClick={() => {
                  onDismiss();
                  onOpenRemindersModal();
                }}
                className="text-[11px] text-[#A09289] hover:text-white underline underline-offset-2"
              >
                All Reminders
              </button>
            )}

            <button
              id="acknowledge-alert-btn"
              onClick={onDismiss}
              className="px-3 py-1 rounded-lg bg-[#A33C1B] hover:bg-[#B8502E] text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
