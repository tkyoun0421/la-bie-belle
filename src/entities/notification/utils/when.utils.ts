import { kstDateOf, spellDate } from "@/shared/utils/kstDate";
import { spellKstClock } from "@/entities/notification/utils/kstClock.utils";

const MINUTE_MS = 60_000;

const MINUTES_PER_HOUR = 60;

function dayBefore(date: string): string {
  const moved = new Date(`${date}T00:00:00Z`);
  moved.setUTCDate(moved.getUTCDate() - 1);

  return moved.toISOString().slice(0, 10);
}

type Distance = "today" | "yesterday" | "earlier";

function distanceOf(receivedAt: string, now: Date): Distance {
  const day = kstDateOf(receivedAt);
  const today = kstDateOf(now);

  if (day === today) {
    return "today";
  }

  return day === dayBefore(today) ? "yesterday" : "earlier";
}

export function toNotificationDateHeader(
  receivedAt: string,
  now: Date,
): string {
  const distance = distanceOf(receivedAt, now);

  if (distance === "today") {
    return "오늘";
  }

  if (distance === "yesterday") {
    return "어제";
  }

  const day = kstDateOf(receivedAt);

  return day.slice(0, 4) === kstDateOf(now).slice(0, 4)
    ? spellDate(day)
    : `${Number(day.slice(0, 4))}년 ${spellDate(day)}`;
}

export function toNotificationReceivedTime(
  receivedAt: string,
  now: Date,
): string {
  const distance = distanceOf(receivedAt, now);

  if (distance === "yesterday") {
    return `어제 ${spellKstClock(receivedAt)}`;
  }

  if (distance === "earlier") {
    const day = kstDateOf(receivedAt);

    return `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`;
  }

  const minutes = Math.floor(
    (now.getTime() - new Date(receivedAt).getTime()) / MINUTE_MS,
  );

  if (minutes < 1) {
    return "방금";
  }

  return minutes < MINUTES_PER_HOUR
    ? `${minutes}분 전`
    : `${Math.floor(minutes / MINUTES_PER_HOUR)}시간 전`;
}
