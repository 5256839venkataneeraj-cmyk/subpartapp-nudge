export interface ClassItem {
  id: string;
  name: string;
  code: string;
  time: string;
  location: string;
  instructor: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  dueLabel: string;
  priority: 'high' | 'medium' | 'low';
  estMinutes: number;
  completed: boolean;
  progress?: number; // Completion percentage 0 - 100
}

export interface HabitItem {
  id: string;
  name: string;
  target: string;
  completed: boolean;
  category: 'focus' | 'health' | 'study' | 'mindset';
}

export interface MoodState {
  score: number; // 1-5
  label: string;
  energy: 'Low' | 'Medium' | 'High';
  note?: string;
}

export interface HolidayItem {
  name: string;
  date: string;
  daysAway: number;
}

export interface StudentSnapshot {
  studentName: string;
  academicYear: string;
  todayClasses: ClassItem[];
  openAssignments: AssignmentItem[];
  habitLogs: HabitItem[];
  streaks: {
    studyDays: number;
    habitDays: number;
    bestStreak: number;
  };
  mood: MoodState;
  upcomingHolidays: HolidayItem[];
  lastUpdated: string;
}

export interface ExtractedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  added?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  events?: ExtractedEvent[];
  quickReplies?: string[];
  snapshotContextSnippet?: {
    openTasksCount: number;
    classesCount: number;
    mood: string;
    habitStreak: number;
  };
}

export type NudgeTone = 'supportive_coach' | 'strict_mentor' | 'casual_friend';

export interface NudgeToneOption {
  id: NudgeTone;
  label: string;
  tagline: string;
  emoji: string;
  badgeColor: string;
  promptSnippet: string;
}

export interface EdgeFunctionChatRequest {
  message: string;
  snapshot: StudentSnapshot;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  tone?: NudgeTone;
}

export interface EdgeFunctionChatResponse {
  reply: string;
  events: ExtractedEvent[];
  quickReplies?: string[];
  model: string;
  fallbackUsed?: boolean;
  isLocalFallback?: boolean;
  rateLimit: {
    limit: number;
    remaining: number;
    resetInSeconds: number;
  };
  cachedContextUsed: boolean;
  executionTimeMs: number;
  timestamp: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  note?: string;
  targetTime: number; // Unix timestamp ms when reminder fires
  delayMinutes?: number;
  category: "assignment" | "class" | "habit" | "study" | "custom";
  relatedId?: string; // id of assignment, class, or habit
  completed: boolean;
  createdAt: number;
  triggeredAt?: number;
}
