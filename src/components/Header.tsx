import React from "react";
import {
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Database,
  Lock,
  Activity,
  SlidersHorizontal,
  Coffee,
  Bell,
} from "lucide-react";
import { StudentSnapshot } from "../types";
import { formatTime } from "../lib/breakTimer";

interface HeaderProps {
  snapshot: StudentSnapshot | null;
  rateLimitRemaining: number;
  onOpenSecurityModal: () => void;
  onOpenSnapshotDrawer: () => void;
  isSnapshotOpen: boolean;
  activeTab: "home" | "chat" | "schedule" | "summary" | "snapshot";
  setActiveTab: (tab: any) => void;
  breakTimerState?: {
    isActive: boolean;
    remainingSeconds: number;
    hasFinished: boolean;
  };
  onOpenRemindersModal?: () => void;
  activeRemindersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  snapshot,
  rateLimitRemaining,
  onOpenSecurityModal,
  activeTab,
  setActiveTab,
  breakTimerState,
  onOpenRemindersModal,
  activeRemindersCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F5]/95 backdrop-blur-md border-b border-[#EAE2DA] text-[#2D2522]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Left: Back arrow, Nudge logo, Nudge • Chat title matching Image 1 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab(activeTab === "chat" ? "home" : "chat")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A3F39] hover:bg-[#EFE9E4] transition-colors"
            title="Back to Home / Chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#A33C1B] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              <span className="font-serif italic text-sm">n</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-base text-[#2D2522]">Nudge</span>
              <span className="text-xs font-normal text-[#8A7D75]">•</span>
              <span className="text-xs font-medium text-[#70645D] capitalize">
                {activeTab === "chat" ? "Chat" : activeTab}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Architecture & Mode Selector */}
        <div className="hidden md:flex items-center bg-[#EFEAE5] p-1 rounded-full border border-[#E2D8D0] text-xs">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3.5 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-[#A33C1B] text-white shadow-xs"
                : "text-[#5C5049] hover:text-[#2D2522]"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("snapshot")}
            className={`px-3.5 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "snapshot"
                ? "bg-[#A33C1B] text-white shadow-xs"
                : "text-[#5C5049] hover:text-[#2D2522]"
            }`}
          >
            <Database className="w-3 h-3" />
            <span>Supabase Snapshot</span>
            {snapshot && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={onOpenSecurityModal}
            className="px-3 py-1 rounded-full font-semibold text-[#5C5049] hover:text-[#2D2522] flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3 text-[#A33C1B]" />
            <span>Security</span>
          </button>
        </div>

        {/* Right: Break Timer pill + Edge Proxy info + Maya's Profile Picture Avatar (matching Image 1) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active / Finished Break Pill */}
          {breakTimerState?.isActive && (
            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#FFF0E8] border border-[#F0D5C7] text-xs font-bold text-[#A33C1B] hover:bg-[#FDE7DB] transition-all shadow-xs animate-pulse"
              title="Break in progress - click to view in Chat"
            >
              <Coffee className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span className="font-mono">{formatTime(breakTimerState.remainingSeconds)}</span>
              <span className="hidden sm:inline font-sans text-[11px] font-normal text-[#7A6E67]">• Break</span>
            </button>
          )}

          {breakTimerState?.hasFinished && (
            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#A33C1B] text-white text-xs font-bold hover:bg-[#8D3316] transition-all shadow-sm"
              title="Break complete! Click to view in Chat"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Break Over! ⏰</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFEAE5] border border-[#E2D8D0] text-[11px] font-medium text-[#5C5049]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Edge Proxy</span>
            <span className="text-[#A33C1B] font-bold font-mono">
              {rateLimitRemaining}/20 req
            </span>
          </div>

          {/* Notifications & Reminders Bell Button */}
          {onOpenRemindersModal && (
            <button
              id="header-notifications-bell-btn"
              onClick={onOpenRemindersModal}
              className="relative p-1.5 sm:p-2 rounded-full text-[#5C5049] hover:text-[#A33C1B] hover:bg-[#EFEAE5] transition-colors focus:outline-none"
              title="Notifications & Reminders"
              aria-label={`Notifications and Reminders, ${activeRemindersCount} active`}
            >
              <Bell className="w-4 h-4" />
              {activeRemindersCount > 0 && (
                <span
                  id="header-notification-count-badge"
                  className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#A33C1B] text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-[#FAF7F5] animate-pulse"
                >
                  {activeRemindersCount}
                </span>
              )}
            </button>
          )}

          {/* Maya Avatar Photo */}
          <button
            onClick={() => setActiveTab(activeTab === "home" ? "chat" : "home")}
            className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-[#A33C1B] focus:ring-offset-2 focus:ring-offset-[#FAF7F5]"
            title="Maya's Profile"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              alt="Maya"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </button>
        </div>
      </div>
    </header>
  );
};
