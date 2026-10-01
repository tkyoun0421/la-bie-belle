/**
 * 근무 신청 모아보기가 세는 것 전부다 — 날짜순·사람순 재구성과 머리·마감·빈 상태의 문구다.
 * 정본은 `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「근무 신청 모아보기
 * 짜임」과 그 문안 표다.
 *
 * **같은 신청을 두 방향으로 든다.** 날짜순은 근무표를 짜는 손을 따라가고, 사람순은 「이
 * 사람이 이번 달 며칠을 일할 수 있나」를 본다. 입력은 한 질의고 재구성만 둘이다.
 *
 * 날짜를 읽고 적는 손은 `@/shared/lib/kstDate`가 소유한다 — 슬라이스 넷에 같은 계산이 각자
 * 서 있던 것을 거기로 모았다. 마감 문구는 슬라이스마다 말이 달라 여기 남는다.
 */

import { kstDateOf, spellDate } from "@/shared/lib/kstDate";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ApplicationRow = {
  profile_id: string;
  work_date: string;
  profiles: { display_name: string | null } | null;
};

export type DateGroup = {
  workDate: string;
  names: string[];
};

export type PersonGroup = {
  profileId: string;
  displayName: string;
  workDates: string[];
};

function nameOf(row: ApplicationRow): string {
  return row.profiles?.display_name ?? "";
}

export function groupApplicationsByDate(
  rows: readonly ApplicationRow[],
): DateGroup[] {
  const byDate = new Map<string, string[]>();

  for (const row of rows) {
    const names = byDate.get(row.work_date) ?? [];

    names.push(nameOf(row));
    byDate.set(row.work_date, names);
  }

  return [...byDate.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([workDate, names]) => ({ workDate, names }));
}

export function groupApplicationsByPerson(
  rows: readonly ApplicationRow[],
): PersonGroup[] {
  const byPerson = new Map<string, PersonGroup>();

  for (const row of rows) {
    const group = byPerson.get(row.profile_id) ?? {
      profileId: row.profile_id,
      displayName: nameOf(row),
      workDates: [],
    };

    group.workDates.push(row.work_date);
    byPerson.set(row.profile_id, group);
  }

  return [...byPerson.values()].map((group) => ({
    ...group,
    workDates: [...group.workDates].sort((one, other) =>
      one.localeCompare(other),
    ),
  }));
}

/** 목록 머리와 사람순의 날짜다 — 「10월 10일(토)」. */
export function spellApplicationDate(workDate: string): string {
  return spellDate(workDate);
}

export type ApplicationsDeadlineInput = {
  applicationDeadline: string;
  now: string;
};

/** 앱바 제목이다 — 「10월 근무 신청」. */
export function applicationsTitle(month: string): string {
  return `${Number(month.slice(5, 7))}월 근무 신청`;
}

/** 마감 줄이다. 달력의 것과 같은 값을 「스케줄 신청」 없이 짧게 적는다. */
export function applicationsDeadlineLine({
  applicationDeadline,
  now,
}: ApplicationsDeadlineInput): string {
  const [, month, day] = applicationDeadline.split("-").map(Number);
  const remaining = Math.round(
    (Date.parse(`${applicationDeadline}T00:00:00Z`) -
      Date.parse(`${kstDateOf(now)}T00:00:00Z`)) /
      DAY_MS,
  );

  if (remaining < 0) {
    return `${month}월 ${day}일에 마감됐어요`;
  }

  const left = remaining === 0 ? "오늘까지예요" : `${remaining}일 남았어요`;

  return `마감 ${spellApplicationDate(applicationDeadline)} · ${left}`;
}

/** 0건일 때 목록 자리에 서는 둘째 줄이다. */
export function applicationsEmptyDeadlineLine(
  applicationDeadline: string,
): string {
  const [, month, day] = applicationDeadline.split("-").map(Number);

  return `마감은 ${month}월 ${day}일이에요`;
}
