import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Sparkles, Terminal, Info } from "lucide-react";
import { NudgeTone } from "../types";
import { NUDGE_TONES, TONE_SYSTEM_PROMPTS } from "../lib/tones";

interface ToneSelectorMenuProps {
  currentTone: NudgeTone;
  onSelectTone: (tone: NudgeTone) => void;
  className?: string;
}

export const ToneSelectorMenu: React.FC<ToneSelectorMenuProps> = ({
  currentTone,
  onSelectTone,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeToneConfig =
    NUDGE_TONES.find((t) => t.id === currentTone) || NUDGE_TONES[0];

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (tone: NudgeTone) => {
    onSelectTone(tone);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        id="tone-settings-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Change Nudge Tone & Personality"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F5] hover:bg-[#EFEAE5] border border-[#E2D8D0] text-xs font-medium text-[#2D2522] transition-colors shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#A33C1B]"
      >
        <span className="text-sm leading-none">{activeToneConfig.emoji}</span>
        <span className="font-semibold text-[11px] sm:text-xs">
          {activeToneConfig.label}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#70645D] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="tone-settings-dropdown-panel"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#FAF7F5] border border-[#E2D8D0] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Menu Header */}
          <div className="px-4 py-3 bg-[#F5EFE9] border-b border-[#E8DFD7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FCEEEA] text-[#A33C1B] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D2522] leading-tight">
                  Nudge Tone & Persona
                </h4>
                <p className="text-[10px] text-[#70645D]">
                  Updates the system prompt sent to the Edge Function
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#EAE2DA] text-[10px] font-semibold text-[#5C5049] border border-[#DDD3CB]">
              Prompt Sync
            </span>
          </div>

          {/* Options List */}
          <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto">
            {NUDGE_TONES.map((option) => {
              const isSelected = option.id === currentTone;
              return (
                <button
                  key={option.id}
                  id={`tone-option-${option.id}`}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 border ${
                    isSelected
                      ? "bg-[#FFF8F5] border-[#A33C1B]/40 shadow-xs"
                      : "bg-white/60 hover:bg-white border-[#EAE2DA] text-[#4A3F39]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base shadow-2xs border ${
                      isSelected
                        ? "bg-[#FCEEEA] border-[#F6D5CB]"
                        : "bg-[#F5EFE9] border-[#E8DFD7]"
                    }`}
                  >
                    {option.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? "text-[#A33C1B]" : "text-[#2D2522]"
                        }`}
                      >
                        {option.label}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[#A33C1B] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5C5049] mt-0.5 font-medium leading-snug">
                      {option.tagline}
                    </p>
                    <p className="text-[10px] text-[#8A7D75] mt-1 font-mono italic truncate">
                      "{option.promptSnippet}"
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Educational Edge Prompt Inspector Collapsible */}
          <div className="px-3 py-2.5 bg-[#F5EFE9] border-t border-[#E8DFD7] text-xs">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-[#70645D] hover:text-[#2D2522] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#A33C1B]" />
                <span>View Injected System Directive</span>
              </span>
              <span className="text-[10px] text-[#8A7D75]">
                {showPromptPreview ? "Hide" : "Show"}
              </span>
            </button>

            {showPromptPreview && (
              <div className="mt-2 p-2 rounded-lg bg-[#2D2522] text-[#EFEAE5] font-mono text-[10px] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {TONE_SYSTEM_PROMPTS[currentTone]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
