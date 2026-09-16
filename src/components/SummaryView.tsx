import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Flame,
  Award
} from "lucide-react";

export const SummaryView: React.FC<{ onNavigateToChat: () => void }> = ({
  onNavigateToChat,
}) => {
  return (
    <div className="h-full overflow-y-auto bg-[#FAF7F5] px-4 sm:px-6 py-5 text-[#2D2522] font-sans max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-[#A33C1B] uppercase tracking-wider">
          WEEKLY REFLECTION
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[#2D2522] mt-0.5">
          Weekly Summary
        </h1>
        <p className="text-xs text-[#70645D]">Oct 16 – Oct 22 • 84% Overall Flow</p>
      </div>

      {/* Adherence Hero Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E9DFD7] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            HIGH ADHERENCE
          </span>
          <div className="text-3xl font-bold text-[#2D2522] mt-1">84%</div>
          <p className="text-xs text-[#70645D] mt-1 max-w-[200px]">
            You kept your focus blocks and avoided late-night cramming.
          </p>
        </div>
        <div className="w-18 h-18 rounded-full border-6 border-[#A33C1B] flex items-center justify-center text-xl shadow-inner">
          🎯
        </div>
      </div>

      {/* What Stuck */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#245D3A] uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>What Stuck</span>
        </div>
        <div className="bg-[#EDF6F0] rounded-2xl p-3.5 border border-[#D5EAD9] space-y-1">
          <div className="font-bold text-xs sm:text-sm text-[#245D3A]">
            Morning Cycle Ride
          </div>
          <p className="text-xs text-[#355F46]">
            5/5 days completed. Your morning heart rate and energy peaked.
          </p>
        </div>
        <div className="bg-[#EDF6F0] rounded-2xl p-3.5 border border-[#D5EAD9] space-y-1">
          <div className="font-bold text-xs sm:text-sm text-[#245D3A]">
            Bioethics reading prep
          </div>
          <p className="text-xs text-[#355F46]">
            Finished 2 days prior to lecture. Classroom participation up.
          </p>
        </div>
      </div>

      {/* What Slipped */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#A33C1B] uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-[#A33C1B]" />
          <span>What Slipped (Gentle Nudges)</span>
        </div>
        <div className="bg-[#FCEEEA] rounded-2xl p-3.5 border border-[#F6D5CB] space-y-1">
          <div className="font-bold text-xs sm:text-sm text-[#A33C1B]">
            Chem Lab Problem Sets
          </div>
          <p className="text-xs text-[#70645D]">
            Missed Wednesday 4:00 PM sprint due to lab fatigue.
          </p>
        </div>
      </div>

      {/* One Thing to Adjust Card */}
      <div className="bg-gradient-to-r from-[#FCEEEA] to-[#F9E2DB] rounded-3xl p-5 border border-[#F4D1C5] shadow-xs space-y-2">
        <span className="text-[10px] font-bold text-[#A33C1B] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          NUDGE RECOMMENDATION
        </span>
        <h3 className="font-bold text-sm sm:text-base text-[#2D2522]">
          Shift Wednesday study sprint to 11:00 AM
        </h3>
        <p className="text-xs text-[#70645D] leading-relaxed">
          Your energy is 40% higher before lunch. We can auto-adjust your
          schedule for next week.
        </p>
        <button
          onClick={onNavigateToChat}
          className="w-full mt-2 py-2.5 rounded-full bg-[#A33C1B] hover:bg-[#8D3316] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Chat with Nudge to rebalance</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
