import React from "react";
import {
  Home,
  MessageSquare,
  Mic,
  Calendar,
  BarChart2
} from "lucide-react";

interface BottomNavigationProps {
  activeTab: "home" | "chat" | "schedule" | "summary";
  onTabChange: (tab: "home" | "chat" | "schedule" | "summary") => void;
  onOpenVoiceModal: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenVoiceModal,
}) => {
  return (
    <nav className="sticky bottom-0 z-30 bg-[#FAF7F5]/95 backdrop-blur-md border-t border-[#EAE2DA] px-4 py-1.5 shrink-0">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* 1. Home */}
        <button
          id="nav-home"
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            activeTab === "home"
              ? "text-[#A33C1B]"
              : "text-[#8A7D75] hover:text-[#2D2522]"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Home</span>
        </button>

        {/* 2. Chat (Active in Image 1) */}
        <button
          id="nav-chat"
          onClick={() => onTabChange("chat")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            activeTab === "chat"
              ? "text-[#A33C1B]"
              : "text-[#8A7D75] hover:text-[#2D2522]"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Chat</span>
        </button>

        {/* 3. Center Floating Microphone Action Button */}
        <div className="flex flex-col items-center -mt-6">
          <button
            id="nav-voice-companion"
            onClick={onOpenVoiceModal}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#A33C1B] hover:bg-[#8D3316] text-white flex items-center justify-center shadow-lg border-4 border-[#FAF7F5] transition-all transform active:scale-95 group"
            title="Start Voice Nudge Companion"
          >
            <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* 4. Schedule */}
        <button
          id="nav-schedule"
          onClick={() => onTabChange("schedule")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            activeTab === "schedule"
              ? "text-[#A33C1B]"
              : "text-[#8A7D75] hover:text-[#2D2522]"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Schedule</span>
        </button>

        {/* 5. Summary */}
        <button
          id="nav-summary"
          onClick={() => onTabChange("summary")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            activeTab === "summary"
              ? "text-[#A33C1B]"
              : "text-[#8A7D75] hover:text-[#2D2522]"
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Summary</span>
        </button>
      </div>
    </nav>
  );
};
