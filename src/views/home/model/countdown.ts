import { formatTimeInSeoul } from "@/shared/lib/format-time-seoul";
import type { AttendanceAction, AttendanceWindow } from "@/views/home/model/home-view-model";

export const CHECK_IN_WINDOW_LEAD_SECONDS = 2 * 60 * 60;
export const CHECK_OUT_WINDOW_LEAD_SECONDS = 60 * 60;

const WINDOW_LEAD_SECONDS: Record<AttendanceAction, number> = {
  "check-in": CHECK_IN_WINDOW_LEAD_SECONDS,
  "check-out": CHECK_OUT_WINDOW_LEAD_SECONDS,
};

export type CountdownState =
  | { phase: "before-window"; remainingSeconds: number }
  | { phase: "open"; remainingSeconds: number }
  | { phase: "overdue"; elapsedSeconds: number };

export function toCountdown(window: AttendanceWindow, now: Date): CountdownState {
  const secondsUntilScheduled = Math.round(
    (new Date(window.scheduledAt).getTime() - now.getTime()) / 1000,
  );
  const leadSeconds = WINDOW_LEAD_SECONDS[window.action];

  if (secondsUntilScheduled > leadSeconds) {
    return { phase: "before-window", remainingSeconds: secondsUntilScheduled - leadSeconds };
  }

  if (secondsUntilScheduled > 0) {
    return { phase: "open", remainingSeconds: secondsUntilScheduled };
  }

  return { phase: "overdue", elapsedSeconds: -secondsUntilScheduled || 0 };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatCountdownClock(state: CountdownState): string {
  if (state.phase === "overdue") {
    const hours = Math.floor(state.elapsedSeconds / 3600);
    const minutes = Math.floor((state.elapsedSeconds % 3600) / 60);
    const seconds = state.elapsedSeconds % 60;
    return `+${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }

  const hours = Math.floor(state.remainingSeconds / 3600);
  const seconds = state.remainingSeconds % 60;

  if (hours > 0) {
    const minutes = Math.floor((state.remainingSeconds % 3600) / 60);
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }

  const minutes = Math.floor(state.remainingSeconds / 60);
  return `${minutes}:${pad2(seconds)}`;
}

export function formatWindowOpensAt(window: AttendanceWindow): string {
  const leadSeconds = WINDOW_LEAD_SECONDS[window.action];
  const opensAt = new Date(new Date(window.scheduledAt).getTime() - leadSeconds * 1000);
  return formatTimeInSeoul(opensAt);
}
