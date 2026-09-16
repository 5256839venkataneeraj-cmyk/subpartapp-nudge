import React from "react";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Bike,
  Droplets,
  Check,
  Circle,
  Clock,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { StudentSnapshot } from "../types";

interface HomeViewProps {
  snapshot: StudentSnapshot | null;
  onNavigateToChat: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  snapshot,
  onNavigateToChat,
}) => {
  return (
    <div className="h-full overflow-y-auto bg-[#FAF7F5] px-4 sm:px-6 py-5 text-[#2D2522] font-sans max-w-lg mx-auto space-y-5">
      {/* 1. Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2522]">
            Good morning, <br />
            Maya 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#70645D] mt-1.5 leading-relaxed">
            You have 3 focus blocks & 5 gentle habits mapped out for today.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2F0E7] text-[#245D3A] text-xs font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Balanced Day
        </span>
      </div>

      {/* 2. Chat with Nudge Hero Banner (Matching Image 3) */}
      <div
        onClick={onNavigateToChat}
        className="cursor-pointer rounded-3xl p-5 bg-gradient-to-r from-[#FCEEEA] to-[#F9E3DC] border border-[#F3D1C6] shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white text-[#A33C1B] flex items-center justify-center text-lg shadow-xs shrink-0">
            🌱
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#A33C1B] uppercase tracking-wider block">
              FEELING OVERWHELMED?
            </span>
            <div className="font-bold text-sm sm:text-base text-[#2D2522] group-hover:text-[#A33C1B] transition-colors">
              Need a quick reset? Chat with Nudge
            </div>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#A33C1B] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Active Momentum (Streaks) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-base text-[#2D2522]">Active Momentum</h2>
            <p className="text-xs text-[#70645D]">4 active streaks</p>
          </div>
          <button className="px-3 py-1 rounded-full bg-[#E2F0E7] text-[#245D3A] text-xs font-semibold flex items-center gap-1">
            🌱 View Badges
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3 border border-[#E9DFD7] shadow-xs text-center">
            <span className="text-xl">🔥</span>
            <div className="font-bold text-sm text-[#2D2522] mt-1">12 Days</div>
            <div className="text-[10px] text-[#70645D] font-medium">Deep Study</div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-[#E9DFD7] shadow-xs text-center">
            <span className="text-xl">🚴‍♀️</span>
            <div className="font-bold text-sm text-[#2D2522] mt-1">5 Days</div>
            <div className="text-[10px] text-[#70645D] font-medium">Campus Ride</div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-[#E9DFD7] shadow-xs text-center">
            <span className="text-xl">💧</span>
            <div className="font-bold text-sm text-[#2D2522] mt-1">8 Days</div>
            <div className="text-[10px] text-[#70645D] font-medium">Hydration</div>
          </div>
        </div>
      </div>

      {/* 4. Today's Flow (Matching Image 3) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-base text-[#2D2522]">Today's Flow</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFEAE5] text-[#70645D] font-semibold">
              1/5 done
            </span>
          </div>
          <button className="text-xs text-[#A33C1B] font-semibold hover:underline">
            Cheer me on
          </button>
        </div>

        <div className="space-y-3">
          {/* Item 1 */}
          <div className="bg-white rounded-2xl p-4 border border-[#E9DFD7] shadow-xs flex items-center justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F5B89A]" />
            <div className="pl-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#FCEEEA] text-[#A33C1B] text-[10px] font-bold">
                  Study
                </span>
                <span className="text-xs text-[#70645D] flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" /> 3:00 PM
                </span>
              </div>
              <div className="font-bold text-xs sm:text-sm text-[#2D2522]">
                45m Organic Chemistry review
              </div>
              <div className="text-xs text-[#70645D]">
                Reaction mechanisms & synthesis cards
              </div>
            </div>
            <div className="w-5 h-5 rounded-full border border-[#D5C7BD] shrink-0" />
          </div>

          {/* Item 2 - Completed */}
          <div className="bg-[#FAF7F5] rounded-2xl p-4 border border-[#EAE2DA] shadow-xs flex items-center justify-between relative overflow-hidden opacity-90">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#86D4A5]" />
            <div className="pl-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#E2F0E7] text-[#245D3A] text-[10px] font-bold">
                  Movement
                </span>
                <span className="text-xs text-[#70645D] font-medium">
                  Completed 8:30 AM
                </span>
              </div>
              <div className="font-bold text-xs sm:text-sm text-[#2D2522]">
                20 min campus ride / commute
              </div>
              <div className="text-xs text-[#70645D]">
                Brisk morning fresh air loop
              </div>
            </div>
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </div>

          {/* Item 3 */}
          <div className="bg-white rounded-2xl p-4 border border-[#E9DFD7] shadow-xs flex items-center justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C7C3E8]" />
            <div className="pl-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#EBE8F7] text-[#4A4382] text-[10px] font-bold">
                  Space
                </span>
                <span className="text-xs text-[#70645D] font-medium">Evening</span>
              </div>
              <div className="font-bold text-xs sm:text-sm text-[#2D2522]">
                Laundry & tidy study desk
              </div>
              <div className="text-xs text-[#70645D]">Clear space = clear mind</div>
            </div>
            <div className="w-5 h-5 rounded-full border border-[#D5C7BD] shrink-0" />
          </div>

          {/* Item 4 - Hydration */}
          <div className="bg-white rounded-2xl p-4 border border-[#E9DFD7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#FCEEEA] text-[#A33C1B] text-[10px] font-bold">
                  Hydration
                </span>
                <span className="text-xs text-[#70645D]">70% reached</span>
              </div>
              <button className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#EFE9E4] text-[#4A3F39]">
                + 250ml
              </button>
            </div>
            <div className="font-bold text-sm text-[#2D2522] mb-1.5">
              2.0L Daily target
            </div>
            <div className="w-full h-2 rounded-full bg-[#EFE9E4] overflow-hidden">
              <div className="w-[70%] h-full bg-[#3D5A45] rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#70645D] mt-1.5 font-medium">
              <span>1.4L of 2.0L logged</span>
              <span>Almost there! 🧋</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Weekly Pace Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E9DFD7] shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-[#A33C1B] flex flex-col items-center justify-center shrink-0">
          <span className="font-bold text-base text-[#2D2522]">78%</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#A33C1B] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            WEEKLY PACE
          </span>
          <p className="text-xs sm:text-sm text-[#2D2522] font-medium leading-snug mt-0.5">
            You've crushed 78% of your weekly targets. One gentle step at a time!
          </p>
        </div>
      </div>
    </div>
  );
};
