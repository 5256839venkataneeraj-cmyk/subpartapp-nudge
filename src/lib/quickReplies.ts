import {
  Target,
  Coffee,
  Search,
  Clock,
  BookOpen,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Smile,
  Compass,
  ArrowRight,
  LucideIcon
} from "lucide-react";

export interface QuickReplyItem {
  label: string;
  isPrimary: boolean;
  icon: LucideIcon;
}

/**
 * Maps a quick reply text to an appropriate semantic icon
 */
export function getIconForReply(text: string, isFirst: boolean): LucideIcon {
  const lower = text.toLowerCase();

  if (
    lower.includes("lock") ||
    lower.includes("start") ||
    lower.includes("yes") ||
    lower.includes("let's do") ||
    lower.includes("let's go") ||
    lower.includes("target")
  ) {
    return Target;
  }
  if (
    lower.includes("break") ||
    lower.includes("coffee") ||
    lower.includes("breathe") ||
    lower.includes("rest") ||
    lower.includes("tea")
  ) {
    return Coffee;
  }
  if (
    lower.includes("source") ||
    lower.includes("search") ||
    lower.includes("find") ||
    lower.includes("lookup") ||
    lower.includes("pubmed")
  ) {
    return Search;
  }
  if (
    lower.includes("time") ||
    lower.includes("minute") ||
    lower.includes("hour") ||
    lower.includes("clock") ||
    lower.includes("timer") ||
    lower.includes("pm") ||
    lower.includes("am")
  ) {
    return Clock;
  }
  if (
    lower.includes("read") ||
    lower.includes("paper") ||
    lower.includes("outline") ||
    lower.includes("draft") ||
    lower.includes("notes") ||
    lower.includes("bioethics") ||
    lower.includes("chem")
  ) {
    return BookOpen;
  }
  if (
    lower.includes("calendar") ||
    lower.includes("schedule") ||
    lower.includes("due") ||
    lower.includes("event")
  ) {
    return Calendar;
  }
  if (
    lower.includes("step") ||
    lower.includes("idea") ||
    lower.includes("how") ||
    lower.includes("why") ||
    lower.includes("explain")
  ) {
    return Lightbulb;
  }
  if (
    lower.includes("done") ||
    lower.includes("finish") ||
    lower.includes("log") ||
    lower.includes("complete")
  ) {
    return CheckCircle2;
  }
  if (
    lower.includes("gentle") ||
    lower.includes("feel") ||
    lower.includes("calm") ||
    lower.includes("mood")
  ) {
    return Smile;
  }

  return isFirst ? Target : Sparkles;
}

/**
 * Analyzes the most recent AI response to generate 3 context-aware quick replies
 * if none were returned directly by the AI model.
 */
export function deriveContextualQuickReplies(
  aiContent?: string,
  providedReplies?: string[]
): QuickReplyItem[] {
  // If the AI or database provided explicit quick replies, use them
  if (providedReplies && providedReplies.length >= 3) {
    return providedReplies.slice(0, 3).map((reply, idx) => ({
      label: reply,
      isPrimary: idx === 0,
      icon: getIconForReply(reply, idx === 0),
    }));
  }

  const text = (aiContent || "").toLowerCase();

  // Scenario 1: Focus blocks, calendar scheduling, or PubMed sprint (Image 1 pattern)
  if (
    text.includes("set that block") ||
    text.includes("focus sprint") ||
    text.includes("pubmed") ||
    text.includes("11:30") ||
    text.includes("schedule") ||
    text.includes("calendar") ||
    text.includes("[event:")
  ) {
    return [
      { label: "Yes, lock it in 🎯", isPrimary: true, icon: Target },
      { label: "Need a 10m break first ☕", isPrimary: false, icon: Coffee },
      { label: "Help me find sources 🔍", isPrimary: false, icon: Search },
    ];
  }

  // Scenario 2: Overwhelmed, stress, feelings, anxiety
  if (
    text.includes("overwhelmed") ||
    text.includes("stress") ||
    text.includes("anxious") ||
    text.includes("deep breath") ||
    text.includes("exhausted") ||
    text.includes("empathy")
  ) {
    return [
      { label: "Take it step-by-step 🌱", isPrimary: true, icon: Smile },
      { label: "Give me one tiny task 💡", isPrimary: false, icon: Lightbulb },
      { label: "I need a 5m breather 🧘", isPrimary: false, icon: Coffee },
    ];
  }

  // Scenario 3: Organic Chemistry, science lab, problems, quizzes
  if (
    text.includes("organic chem") ||
    text.includes("chemistry") ||
    text.includes("problem set") ||
    text.includes("quiz") ||
    text.includes("lab") ||
    text.includes("reaction")
  ) {
    return [
      { label: "Break down problem 1 🧪", isPrimary: true, icon: Target },
      { label: "Set a 25m focus sprint ⏱️", isPrimary: false, icon: Clock },
      { label: "Remind me after dinner 🍲", isPrimary: false, icon: Calendar },
    ];
  }

  // Scenario 4: Paper writing, citations, bioethics, essay draft
  if (
    text.includes("paper") ||
    text.includes("bioethics") ||
    text.includes("section") ||
    text.includes("citations") ||
    text.includes("sources") ||
    text.includes("draft")
  ) {
    return [
      { label: "Help me outline Section 2 📝", isPrimary: true, icon: BookOpen },
      { label: "Find 2 strong citations 🔍", isPrimary: false, icon: Search },
      { label: "Set a 20m writing block ✍️", isPrimary: false, icon: Clock },
    ];
  }

  // Scenario 5: Habits, hydration, cycling, streaks
  if (
    text.includes("habit") ||
    text.includes("water") ||
    text.includes("hydration") ||
    text.includes("cycle") ||
    text.includes("streak") ||
    text.includes("laundry")
  ) {
    return [
      { label: "Log this habit as done ✅", isPrimary: true, icon: CheckCircle2 },
      { label: "Remind me at 6:00 PM ⏰", isPrimary: false, icon: Clock },
      { label: "Check my active streaks 🔥", isPrimary: false, icon: Sparkles },
    ];
  }

  // Scenario 6: AI ends with a direct question
  if (text.trim().endsWith("?")) {
    return [
      { label: "Yes, let's start now 🚀", isPrimary: true, icon: Target },
      { label: "Break it into smaller steps 💡", isPrimary: false, icon: Lightbulb },
      { label: "Can we adjust the time? ⏱️", isPrimary: false, icon: Clock },
    ];
  }

  // General default context-aware options
  return [
    { label: "Lock it into my schedule 🎯", isPrimary: true, icon: Target },
    { label: "Break it down further 💡", isPrimary: false, icon: Lightbulb },
    { label: "What should I tackle next? ⏳", isPrimary: false, icon: Clock },
  ];
}
