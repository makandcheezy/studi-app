import { createContext, useContext } from "react";

export const STUDY_METHODS = [
  { id: "dev-phase", label: "Dev Phase", focusMinutes: 0.5, breakMinutes: 10 / 60 },
  { id: "pomodoro", label: "Pomodoro", focusMinutes: 25, breakMinutes: 5 },
  { id: "extended-pomodoro", label: "Extended Pomodoro", focusMinutes: 50, breakMinutes: 10 },
  { id: "52-17", label: "52-17 Rule", focusMinutes: 52, breakMinutes: 17 },
  { id: "classic-hour", label: "Classic Hour", focusMinutes: 60, breakMinutes: 10 },
];

export function getMethodById(id) {
  return STUDY_METHODS.find((m) => m.id === id) ?? STUDY_METHODS[0];
}

export const TimerContext = createContext(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return ctx;
}

export function formatSeconds(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
