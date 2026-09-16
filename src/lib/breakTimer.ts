/**
 * Break request detector and time utilities
 */

export interface BreakDetectionResult {
  isBreak: boolean;
  durationMinutes: number;
  reason?: string;
}

export function detectBreakRequest(text: string): BreakDetectionResult {
  if (!text || typeof text !== "string") {
    return { isBreak: false, durationMinutes: 10 };
  }

  const clean = text.toLowerCase().trim();

  // Explicit duration patterns: "10m break", "5 min break", "break for 15 minutes", "take 10m"
  const durationMatch = clean.match(
    /(?:take|need|want|have|start)?\s*(?:a\s+)?(?:quick\s+)?(\d+)\s*(?:m|min|mins|minute|minutes)\s*(?:break|rest|off)?/i
  );

  const durationMatchAfter = clean.match(
    /break\s+(?:for\s+)?(\d+)\s*(?:m|min|mins|minute|minutes)/i
  );

  let detectedMinutes = 10; // Default sensible 10-minute break
  if (durationMatch && durationMatch[1]) {
    const parsed = parseInt(durationMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      detectedMinutes = parsed;
    }
  } else if (durationMatchAfter && durationMatchAfter[1]) {
    const parsed = parseInt(durationMatchAfter[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      detectedMinutes = parsed;
    }
  }

  // Keywords that signal a break request:
  const breakKeywords = [
    "i want break",
    "i want a break",
    "want a break",
    "want break",
    "need break",
    "need a break",
    "take a break",
    "take break",
    "taking a break",
    "break time",
    "give me a break",
    "10m break",
    "5m break",
    "15m break",
    "short break",
    "coffee break",
    "step away",
    "rest for a bit",
    "rest a bit",
  ];

  const hasKeyword = breakKeywords.some((kw) => clean.includes(kw));

  // Also check if text says "break" and user expresses desire:
  const isBreakIntent =
    hasKeyword ||
    /\b(i\s*('?m|am)?\s*(tired|exhausted|burn(ed|t)?\s*out|drained))\b/i.test(clean) ||
    (/\bbreak\b/i.test(clean) && /\b(want|need|take|feel|have|gimme|give)\b/i.test(clean));

  return {
    isBreak: Boolean(isBreakIntent),
    durationMinutes: detectedMinutes,
    reason: isBreakIntent ? "Requested by student" : undefined,
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}
