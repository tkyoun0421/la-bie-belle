import { DAY_MS } from "@/shared/consts/time.const";
import { kstDateOf, spellDate } from "@/shared/utils/kstDate";
import type { Availability } from "@/entities/availability/model/availability.type";

export type DateGroup = {
  workDate: string;
  names: string[];
};

export type PersonGroup = {
  profileId: string;
  displayName: string;
  workDates: string[];
};

function nameOf(row: Availability): string {
  return row.name ?? "";
}

export function groupApplicationsByDate(
  rows: readonly Availability[],
): DateGroup[] {
  const byDate = new Map<string, string[]>();

  for (const row of rows) {
    const names = byDate.get(row.workDate) ?? [];

    names.push(nameOf(row));
    byDate.set(row.workDate, names);
  }

  return [...byDate.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([workDate, names]) => ({ workDate, names }));
}

export function groupApplicationsByPerson(
  rows: readonly Availability[],
): PersonGroup[] {
  const byPerson = new Map<string, PersonGroup>();

  for (const row of rows) {
    const group = byPerson.get(row.profileId) ?? {
      profileId: row.profileId,
      displayName: nameOf(row),
      workDates: [],
    };

    group.workDates.push(row.workDate);
    byPerson.set(row.profileId, group);
  }

  return [...byPerson.values()].map((group) => ({
    ...group,
    workDates: [...group.workDates].sort((one, other) =>
      one.localeCompare(other),
    ),
  }));
}

export function spellApplicationDate(workDate: string): string {
  return spellDate(workDate);
}

export type ApplicationsDeadlineInput = {
  applicationDeadline: string;
  now: string;
};

export function applicationsTitle(month: string): string {
  return `${Number(month.slice(5, 7))}월 근무 신청`;
}

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

export function applicationsEmptyDeadlineLine(
  applicationDeadline: string,
): string {
  const [, month, day] = applicationDeadline.split("-").map(Number);

  return `마감은 ${month}월 ${day}일이에요`;
}
