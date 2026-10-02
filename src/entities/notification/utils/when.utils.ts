import { kstDateOf, spellDate } from "@/shared/utils/kstDate";
import { spellKstClock } from "@/entities/notification/utils/kstClock.utils";

/**
 * 알림을 언제 받았는지를 적는 두 손이다. 정본은
 * `docs/2-design/modules/notification/screens/notifications.md`의 「날짜 머리」와 「알림 줄」,
 * 문안은 같은 문서의 문안 표다.
 *
 * **둘이 같은 날을 두 번 말한다.** 날짜 머리가 이미 날을 적는데 줄마다 받은 시각이 또 선다 —
 * 머리는 스크롤하면 화면 밖으로 나가고 줄만 남아서다.
 *
 * **기준 시각을 인자로 받는다.** 안에서 `new Date()`를 부르면 해를 넘기는 경계나 자정 직전을
 * 시험할 길이 없다.
 *
 * **날은 시간 차가 아니라 한국 달력일로 가른다.** 20분 전이어도 자정을 건넜으면 어제다 —
 * 「몇 시간 전」과 「어제」가 갈리는 자리가 경과 시간이 아니라 날짜 경계라서
 * (`docs/2-design/system/runtime.md`의 시각 규약과 같은 방향이다).
 */

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
