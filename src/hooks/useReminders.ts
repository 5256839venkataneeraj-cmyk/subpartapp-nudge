import { useState, useEffect, useCallback, useRef } from "react";
import { ReminderItem } from "../types";
import {
  playChimeSound,
  requestNotificationPermission,
  sendBrowserNotification,
} from "../lib/sound";

const STORAGE_KEY = "nudge_scheduled_reminders";

interface UseRemindersOptions {
  onReminderTriggered?: (reminder: ReminderItem) => void;
}

export function useReminders(options: UseRemindersOptions = {}) {
  const { onReminderTriggered } = options;
  const onReminderTriggeredRef = useRef(onReminderTriggered);

  useEffect(() => {
    onReminderTriggeredRef.current = onReminderTriggered;
  }, [onReminderTriggered]);

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to load reminders from localStorage", e);
    }
    // Default helpful starter reminder if none exist
    return [
      {
        id: "rem_sample_psych",
        title: "Submit Psych 101 Quiz",
        note: "Due tonight at 11:59 PM - 30 min sprint block",
        targetTime: Date.now() + 45 * 60 * 1000,
        delayMinutes: 45,
        category: "assignment",
        relatedId: "asg_2",
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: "rem_sample_hydration",
        title: "Afternoon Hydration & Desk Stretch",
        note: "Take a sip of water and reset posture",
        targetTime: Date.now() + 15 * 60 * 1000,
        delayMinutes: 15,
        category: "habit",
        relatedId: "hab_3",
        completed: false,
        createdAt: Date.now(),
      },
    ];
  });

  const [activeAlert, setActiveAlert] = useState<ReminderItem | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  // Synchronize permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Save to localStorage whenever reminders change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch (e) {
      console.warn("Failed to persist reminders", e);
    }
  }, [reminders]);

  const requestPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    return perm;
  }, []);

  // Fire a single reminder
  const triggerReminder = useCallback((reminder: ReminderItem) => {
    // 1. Synthesizer sound chime
    playChimeSound("reminder");

    // 2. Native Web Notification
    sendBrowserNotification(`🔔 ${reminder.title}`, {
      body: reminder.note || "Nudge Reminder Alert - Stay focused!",
      tag: reminder.id,
    });

    // 3. Device vibration if supported
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    // 4. In-App visual banner alert
    setActiveAlert(reminder);

    // 5. Notify parent callback
    if (onReminderTriggeredRef.current) {
      onReminderTriggeredRef.current(reminder);
    }
  }, []);

  // Periodic interval checking for due reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setReminders((prev) => {
        let hasChanges = false;
        const next = prev.map((rem) => {
          if (!rem.completed && rem.targetTime <= now) {
            hasChanges = true;
            triggerReminder(rem);
            return {
              ...rem,
              completed: true,
              triggeredAt: now,
            };
          }
          return rem;
        });
        return hasChanges ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [triggerReminder]);

  // Schedule a new reminder
  const scheduleReminder = useCallback(
    (params: {
      title: string;
      note?: string;
      delayMinutes?: number;
      targetTime?: number;
      category?: ReminderItem["category"];
      relatedId?: string;
    }) => {
      // Prompt for browser notification permission if not yet requested
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        requestNotificationPermission()
          .then(setNotificationPermission)
          .catch(() => {});
      }

      const delayMins = params.delayMinutes || 10;
      const target =
        params.targetTime || Date.now() + Math.max(1, delayMins) * 60 * 1000;

      const newReminder: ReminderItem = {
        id: "rem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        title: params.title.trim() || "Study Reminder",
        note: params.note?.trim(),
        targetTime: target,
        delayMinutes: params.delayMinutes,
        category: params.category || "custom",
        relatedId: params.relatedId,
        completed: false,
        createdAt: Date.now(),
      };

      setReminders((prev) => [newReminder, ...prev]);

      // Gentle confirmation tone
      playChimeSound("break-start");

      return newReminder;
    },
    []
  );

  // Cancel an active reminder
  const cancelReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Snooze an existing or active reminder
  const snoozeReminder = useCallback(
    (id: string, minutes: number = 5) => {
      const addMs = Math.max(1, minutes) * 60 * 1000;
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              targetTime: Date.now() + addMs,
              completed: false,
              triggeredAt: undefined,
            };
          }
          return r;
        })
      );
      if (activeAlert?.id === id) {
        setActiveAlert(null);
      }
      playChimeSound("break-start");
    },
    [activeAlert]
  );

  // Dismiss currently active ringing alert
  const dismissActiveAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  // Clear completed reminders
  const clearCompleted = useCallback(() => {
    setReminders((prev) => prev.filter((r) => !r.completed));
  }, []);

  // Send a test notification immediately so the user can verify
  const sendTestNotification = useCallback(async () => {
    // If permission is default, request first
    let currentPerm = notificationPermission;
    if (currentPerm === "default") {
      currentPerm = await requestPermission();
    }

    const testItem: ReminderItem = {
      id: "rem_test_" + Date.now(),
      title: "Test Reminder from Nudge! 🔔",
      note: "Your notifications and sound reminders are active and ready.",
      targetTime: Date.now(),
      category: "custom",
      completed: true,
      createdAt: Date.now(),
      triggeredAt: Date.now(),
    };

    triggerReminder(testItem);
  }, [notificationPermission, requestPermission, triggerReminder]);

  const activeReminders = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => a.targetTime - b.targetTime);

  const pastReminders = reminders
    .filter((r) => r.completed)
    .sort((a, b) => (b.triggeredAt || b.createdAt) - (a.triggeredAt || a.createdAt));

  return {
    reminders,
    activeReminders,
    pastReminders,
    activeAlert,
    notificationPermission,
    scheduleReminder,
    cancelReminder,
    snoozeReminder,
    dismissActiveAlert,
    dismissAlert: dismissActiveAlert,
    clearCompleted,
    sendTestNotification,
    requestPermission,
  };
}
