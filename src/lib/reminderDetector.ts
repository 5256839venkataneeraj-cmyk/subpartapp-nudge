/**
 * Natural language detector for reminder and notification requests
 */

export interface ReminderDetectionResult {
  isReminder: boolean;
  title?: string;
  delayMinutes?: number;
  openModalRequested?: boolean;
}

export function detectReminderRequest(text: string): ReminderDetectionResult {
  if (!text || typeof text !== "string") {
    return { isReminder: false };
  }

  const clean = text.toLowerCase().trim();

  // Pattern: "set notification reminder", "notifications reminder", "send notifications to me", "set reminder"
  const generalTriggers = [
    "set notification",
    "set notifications",
    "notifications reminder",
    "notification reminder",
    "send notifications to me",
    "send notification to me",
    "send me notifications",
    "send me notification",
    "remind me",
    "set a reminder",
    "set reminder",
    "schedule reminder",
    "schedule a reminder",
    "alarm for",
    "nudge me in",
    "nudge me at",
  ];

  const matchedTrigger = generalTriggers.some((t) => clean.includes(t));
  if (!matchedTrigger) {
    return { isReminder: false };
  }

  // Extract duration if present, e.g. "in 15 minutes", "in 10m", "in 30 mins", "in 1 hour"
  let delayMinutes = 15; // default fallback
  const hourMatch = clean.match(/(?:in|after)?\s*(\d+)\s*(?:h|hr|hrs|hour|hours)/i);
  const minMatch = clean.match(/(?:in|after)?\s*(\d+)\s*(?:m|min|mins|minute|minutes)/i);

  if (hourMatch && hourMatch[1]) {
    const hours = parseInt(hourMatch[1], 10);
    if (!isNaN(hours) && hours > 0) {
      delayMinutes = hours * 60;
    }
  } else if (minMatch && minMatch[1]) {
    const mins = parseInt(minMatch[1], 10);
    if (!isNaN(mins) && mins > 0) {
      delayMinutes = mins;
    }
  }

  // Extract reminder topic if pattern like "remind me to [do something]" or "remind me in X to [do something]"
  let title = "Focus & Task Check-in";
  const toMatch = clean.match(/remind(?:\s+me)?(?:\s+in\s+\d+\s*(?:m|min|mins|minutes|hours?))?\s+to\s+([^.!?]+)/i);
  const forMatch = clean.match(/reminder\s+(?:for|about)\s+([^.!?]+)/i);

  if (toMatch && toMatch[1]) {
    title = toMatch[1].trim();
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else if (forMatch && forMatch[1]) {
    title = forMatch[1].trim();
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else if (clean.includes("notification") || clean.includes("reminder")) {
    title = "Nudge Study Sprint";
  }

  const openModalRequested =
    clean === "set notifications reminder" ||
    clean.includes("set notifications reminder") ||
    clean.includes("open reminders") ||
    clean.includes("view reminders") ||
    clean.includes("show reminders");

  return {
    isReminder: true,
    title,
    delayMinutes,
    openModalRequested,
  };
}
