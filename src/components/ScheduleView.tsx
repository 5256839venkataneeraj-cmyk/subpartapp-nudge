import React, { useState } from "react";
import {
  Sparkles,
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
  Calendar as CalendarIcon,
  Play,
  CheckCircle2,
  X
} from "lucide-react";

export const ScheduleView: React.FC<{ onNavigateToChat: () => void }> = ({
  onNavigateToChat,
}) => {
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [selectedDay, setSelectedDay] = useState(25);
  const [showInsight, setShowInsight] = useState(true);

  const days = [
    { label: "Mon", date: 23 },
    { label: "Tue", date: 24 },
    { label: "TODAY", date: 25, isToday: true },
    { label: "Thu", date: 26 },
    { label: "Fri", date: 27 },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#FAF7F5] px-4 sm:px-6 py-5 text-[#2D2522] font-sans max-w-lg mx-auto space-y-4">
      {/* 1. Day View / Week View Pill Toggle */}
      <div className="bg-[#EFEAE5] p-1 rounded-full flex items-center max-w-xs mx-auto border border-[#E2D8D0]">
        <button
          onClick={() => setViewMode("day")}
          className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
            viewMode === "day"
              ? "bg-white text-[#2D2522] shadow-xs"
              : "text-[#70645D]"
          }`}
        >
          Day View
        </button>
        <button
          onClick={() => setViewMode("week")}
          className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
            viewMode === "week"
              ? "bg-white text-[#2D2522] shadow-xs"
              : "text-[#70645D]"
          }`}
        >
          Week View
        </button>
      </div>

      {/* 2. Date Selector Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {days.map((d) => (
          <button
            key={d.date}
            onClick={() => setSelectedDay(d.date)}
            className={`flex-1 py-2.5 px-1 rounded-2xl flex flex-col items-center transition-all ${
              d.isToday
                ? "bg-[#A33C1B] text-white shadow-md scale-105"
                : "bg-white text-[#2D2522] border border-[#E9DFD7]"
            }`}
          >
            <span
              className={`text-[10px] font-bold ${
                d.isToday ? "text-[#FCEEEA]" : "text-[#8A7D75]"
              }`}
            >
              {d.label}
            </span>
            <span className="text-base font-bold mt-0.5">{d.date}</span>
            {d.isToday && <span className="w-1 h-1 rounded-full bg-white mt-1" />}
          </button>
        ))}
      </div>

      {/* 3. Nudge Insight Banner */}
      {showInsight && (
        <div className="bg-[#FCEEEA] border border-[#F6D5CB] rounded-3xl p-4 flex items-start justify-between shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#A33C1B] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#A33C1B] uppercase tracking-wider">
                NUDGE INSIGHT • Just now
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#2D2522] mt-0.5">
                Nudge optimized your afternoon for maximum focus!
              </div>
              <p className="text-xs text-[#70645D] mt-1 leading-relaxed">
                Buffered 30 mins after Chem Lab to prevent cognitive burnout.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInsight(false)}
            className="text-[#8A7D75] hover:text-[#2D2522] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Urgent Quiz Due Tonight Banner */}
      <div className="bg-[#FBEAE9] border border-[#F5CAC7] rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            !
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-rose-950">
              Psych 101 Quiz Due Tonight
            </div>
            <div className="text-[11px] text-rose-800">
              11:59 PM • Canvas Portal
            </div>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-white text-rose-700 text-[10px] font-bold border border-rose-200">
          Urgent
        </span>
      </div>

      {/* 5. Schedule Timeline */}
      <div className="space-y-4 pt-1">
        {/* 09:00 AM */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#8A7D75] block">
            09:00 AM
          </span>
          <div className="bg-[#FAF0ED] rounded-3xl p-4 border border-[#F3DFD8] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBE8F7] text-[#4A4382] text-[10px] font-bold">
                Class
              </span>
              <span className="text-xs text-[#70645D] font-medium">
                09:30 – 10:45 AM
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2D2522]">
              Bioethics 302: Hall B
            </h3>
            <div className="text-xs text-[#70645D] flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#A33C1B]" />
              <span>North Quad, Hall B • Prof. Vance</span>
            </div>
          </div>
        </div>

        {/* 11:00 AM - Planned by Nudge */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#8A7D75] block">
            11:00 AM
          </span>
          <div className="bg-gradient-to-r from-[#FCEEEA] to-[#F9E2DB] rounded-3xl p-4 border border-[#F4D1C5] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#A33C1B] text-white text-[10px] font-bold">
                  Focus
                </span>
                <span className="text-xs font-semibold text-[#A33C1B]">
                  Planned by Nudge
                </span>
              </div>
              <span className="text-xs text-[#70645D] font-medium">
                11:15 – 12:00 PM
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2D2522]">
              Paper Sourcing: 2 PubMed citations
            </h3>
            <p className="text-xs text-[#70645D] mt-0.5">
              Target: find supporting evidence for Section 2
            </p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F2C9BD]">
              <span className="text-xs font-medium text-[#A33C1B] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#A33C1B]" />
                Smart Timer 45m
              </span>
              <button
                onClick={onNavigateToChat}
                className="px-3.5 py-1 rounded-full bg-white text-[#A33C1B] text-xs font-bold shadow-xs hover:bg-[#FAF7F5]"
              >
                Chat Nudge
              </button>
            </div>
          </div>
        </div>

        {/* 12:00 PM - Recharge */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#8A7D75] block">
            12:00 PM
          </span>
          <div className="bg-[#EDF6F0] rounded-3xl p-4 border border-[#D5EAD9] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E2F0E7] text-[#245D3A] text-[10px] font-bold">
                Recharge
              </span>
              <span className="text-xs text-[#70645D] font-medium">
                12:30 – 01:15 PM
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2D2522]">
              Lunch & Campus Cycling
            </h3>
            <div className="text-xs text-[#70645D] mt-1">
              Gentle mental reset before Chem Lab
            </div>
          </div>
        </div>

        {/* 02:00 PM - Chem Lab */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#8A7D75] block">
            02:00 PM
          </span>
          <div className="bg-[#FAF0ED] rounded-3xl p-4 border border-[#F3DFD8] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBE8F7] text-[#4A4382] text-[10px] font-bold">
                Lab
              </span>
              <span className="text-xs text-[#70645D] font-medium">
                02:00 – 03:30 PM
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2D2522]">
              Organic Chemistry Lab
            </h3>
            <div className="text-xs text-[#70645D] mt-1">
              Science Complex 402 • Safety Goggles Req
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
