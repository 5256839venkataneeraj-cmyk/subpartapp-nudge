import { useState, useEffect, useRef, useCallback } from "react";
import {
  playChimeSound,
  requestNotificationPermission,
  sendBrowserNotification,
} from "../lib/sound";

interface UseBreakTimerOptions {
  onBreakOver?: () => void;
}

export function useBreakTimer(options: UseBreakTimerOptions = {}) {
  const { onBreakOver } = options;

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(10);
  const [totalSeconds, setTotalSeconds] = useState(600);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [hasFinished, setHasFinished] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  // Keep track of onBreakOver callback ref to avoid effect recreation
  const onBreakOverRef = useRef(onBreakOver);
  useEffect(() => {
    onBreakOverRef.current = onBreakOver;
  }, [onBreakOver]);

  // Read notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotification = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    return perm;
  }, []);

  const startBreak = useCallback(
    (minutes: number = 10) => {
      const clampedMins = Math.max(1, Math.min(180, minutes));
      const secs = clampedMins * 60;
      setInitialMinutes(clampedMins);
      setTotalSeconds(secs);
      setRemainingSeconds(secs);
      setIsActive(true);
      setIsPaused(false);
      setHasFinished(false);

      // Play soft start tone
      playChimeSound("break-start");

      // Silently ask for notification permission if default so student gets alerted when over
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        requestNotificationPermission().then(setNotificationPermission).catch(() => {});
      }
    },
    []
  );

  const pauseToggle = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const addMinutes = useCallback((mins: number) => {
    const additionalSecs = Math.max(1, mins) * 60;
    setTotalSeconds((prev) => prev + additionalSecs);
    setRemainingSeconds((prev) => prev + additionalSecs);
    setHasFinished(false);
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const finishEarly = useCallback(() => {
    setRemainingSeconds(0);
    setIsActive(false);
    setHasFinished(true);

    // Play chime sound
    playChimeSound("break-over");

    // Send native desktop notification
    sendBrowserNotification("Break is over! ⏰", {
      body: "Time to refocus with Nudge! Ready to lock into your next task?",
    });

    if (onBreakOverRef.current) {
      onBreakOverRef.current();
    }
  }, []);

  const dismissFinished = useCallback(() => {
    setHasFinished(false);
    setIsActive(false);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsActive(false);
          setHasFinished(true);

          // 1. Play synthesized bell chime
          playChimeSound("break-over");

          // 2. Native browser notification
          sendBrowserNotification("Break is over! ⏰", {
            body: "Your break has ended! Time to refocus with Nudge. Let's get back to it!",
          });

          // 3. Trigger callback for chat message / follow-up
          if (onBreakOverRef.current) {
            onBreakOverRef.current();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  return {
    isActive,
    isPaused,
    initialMinutes,
    totalSeconds,
    remainingSeconds,
    hasFinished,
    notificationPermission,
    startBreak,
    pauseToggle,
    addMinutes,
    finishEarly,
    dismissFinished,
    requestNotification,
  };
}
