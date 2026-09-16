import { NudgeTone, NudgeToneOption } from "../types";

export const NUDGE_TONES: NudgeToneOption[] = [
  {
    id: "supportive_coach",
    label: "Supportive Coach",
    tagline: "Warm, empathetic & gentle pacing",
    emoji: "🌱",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    promptSnippet: "Validate feelings, encourage small steps, foster self-compassion.",
  },
  {
    id: "strict_mentor",
    label: "Strict Mentor",
    tagline: "Direct, no-nonsense & accountability-driven",
    emoji: "⚡",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    promptSnippet: "No excuses, enforce hard time limits, challenge procrastination directly.",
  },
  {
    id: "casual_friend",
    label: "Casual Friend",
    tagline: "Relaxed, peer-to-peer & chill study buddy",
    emoji: "💬",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    promptSnippet: "Campus peer talk, casual phrasing, light humor, low-pressure support.",
  },
];

export const TONE_SYSTEM_PROMPTS: Record<NudgeTone, string> = {
  supportive_coach: `VOICE & TONE DIRECTIVE - SUPPORTIVE COACH (CURRENT SETTING):
- Voice: Warm, empathetic, encouraging, and emotionally attuned.
- Mindset: Meet the student with validation first. Acknowledge academic stress, validate feelings of overwhelm or tiredness, and celebrate micro-progress.
- Strategy: Break daunting tasks into tiny, friendly steps. Encourage self-compassion, healthy breaks, and consistent habits over toxic perfectionism.`,

  strict_mentor: `VOICE & TONE DIRECTIVE - STRICT MENTOR (CURRENT SETTING):
- Voice: Direct, razor-sharp, disciplined, and uncompromisingly honest.
- Mindset: Cut through rationalizations, excuses, and procrastination loops. High standards and clear boundaries.
- Strategy: Push for immediate action now, not later. Demand specific start times and verifiable deliverables. Keep answers short, firm, and focused on execution and accountability.`,

  casual_friend: `VOICE & TONE DIRECTIVE - CASUAL FRIEND (CURRENT SETTING):
- Voice: Super chill, conversational, relatable, and humorous—like a close campus friend sitting across the table in the student lounge.
- Mindset: Zero corporate or academic lecturing. Low-pressure, honest peer solidarity.
- Strategy: Speak with casual colloquialisms, light humor, and honest camaraderie while still keeping an eye on upcoming assignments and classes so Maya doesn't fall behind.`,
};

export const LOCAL_STORAGE_TONE_KEY = "nudge_tone_preference";

export function getSavedTone(): NudgeTone {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_TONE_KEY);
    if (saved === "strict_mentor" || saved === "casual_friend" || saved === "supportive_coach") {
      return saved;
    }
  } catch (e) {
    // Ignore in SSR or restricted iframe
  }
  return "supportive_coach";
}

export function saveTonePreference(tone: NudgeTone): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TONE_KEY, tone);
  } catch (e) {
    // Ignore in restricted iframe
  }
}

export function getToneConfig(toneId: NudgeTone): NudgeToneOption {
  return NUDGE_TONES.find((t) => t.id === toneId) || NUDGE_TONES[0];
}
