import { ChatMessage } from "../types";

const LOCAL_STORAGE_KEY = "nudge_on_device_chat_vault_v2";
const DEFAULT_PAGE_SIZE = 15;

/**
 * On-device Local Storage Engine for Nudge
 * 
 * ARCHITECTURE PRINCIPLE:
 * Student conversations, emotional reflections, and study struggles stay 100% on the user's
 * physical device (mimicking SQLite / Hive in Flutter or CoreData in iOS).
 * Unlike class schedules or assignment deadlines which sync to Supabase, chat messages are NEVER
 * persisted to cloud databases, guaranteeing zero data leakage and personal privacy.
 */

export function getLocalChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // Seed initial welcoming conversation from Nudge matching the exact Maya student screenshot
      const initialWelcome: ChatMessage[] = [
        {
          id: "msg_init_1",
          role: "assistant",
          content:
            "Hey Maya! You logged your morning cycle ride — that's **5 days straight!** 🎉\n\nHow are you feeling about that Bioethics paper due tomorrow?",
          timestamp: "9:41 AM",
          quickReplies: [
            "A bit overwhelmed tbh 😮‍💨",
            "Ready to tackle Section 2 ✍️",
            "Need a quick 10m breather first ☕",
          ],
          snapshotContextSnippet: {
            classesCount: 3,
            openTasksCount: 3,
            mood: "A bit overwhelmed tbh",
            habitStreak: 5,
          },
        },
        {
          id: "msg_init_2",
          role: "user",
          content:
            "A bit overwhelmed tbh. I still need to find two peer-reviewed sources for section 2.",
          timestamp: "9:43 AM",
        },
        {
          id: "msg_init_3",
          role: "assistant",
          content:
            "Totally valid! How about we break it down? Let's spend just **25 minutes on PubMed** before lunch — I'll keep time and protect your schedule.\n\nWant me to set that block for 11:30 AM?",
          timestamp: "9:44 AM",
          quickReplies: [
            "Yes, lock it in 🎯",
            "Need a 10m break first ☕",
            "Help me find sources 🔍",
          ],
          events: [
            {
              id: "evt_focus_pubmed",
              title: "Focus Sprint: 25 mins",
              date: "2026-10-25",
              time: "11:30 AM – 11:55 AM",
              notes: "PubMed Sources",
            },
          ],
          snapshotContextSnippet: {
            classesCount: 3,
            openTasksCount: 3,
            mood: "A bit overwhelmed tbh",
            habitStreak: 5,
          },
        },
      ];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialWelcome));
      return initialWelcome;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read local chat vault:", err);
    return [];
  }
}

/**
 * Returns paginated messages (newest first or chronological slice)
 */
export function getPaginatedLocalHistory(limit: number = DEFAULT_PAGE_SIZE, offset: number = 0): {
  messages: ChatMessage[];
  hasMore: boolean;
  totalCount: number;
} {
  const all = getLocalChatHistory();
  const totalCount = all.length;
  // If offset + limit covers everything
  const startIndex = Math.max(0, totalCount - (offset + limit));
  const endIndex = Math.max(0, totalCount - offset);
  const sliced = all.slice(startIndex, endIndex);

  return {
    messages: sliced,
    hasMore: startIndex > 0,
    totalCount,
  };
}

export function appendLocalChatMessage(message: ChatMessage): void {
  try {
    const all = getLocalChatHistory();
    all.push(message);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to append to local chat vault:", err);
  }
}

export function clearLocalChatHistory(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear local chat vault:", err);
  }
}

export function exportLocalHistoryAsJSON(): string {
  const all = getLocalChatHistory();
  return JSON.stringify(all, null, 2);
}
