import { spellDuration } from "@/shared/utils/spellNumber";
import {
  CLOCK_LENGTH,
  MIN_ROWS_FOR_TOTAL,
} from "@/entities/rehearsal/consts/rehearsal.const";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import {
  dayTotal,
  rehearsalHours,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";

export type DaySheetRow = Pick<
  Rehearsal,
  "id" | "startsAt" | "endsAt" | "count" | "name"
>;

export type DaySheetLine = {
  id: string;
  text: string;
};

export type DaySheetContent =
  | { kind: "empty"; message: string }
  | { kind: "rows"; lines: DaySheetLine[]; totalLine: string | null };

function clock(value: string): string {
  return value.slice(0, CLOCK_LENGTH);
}

function bodyOf(row: DaySheetRow): string {
  const hours = spellDuration(rehearsalHours(row));

  if (row.count !== null) {
    return `리허설 ${row.count}건 · ${hours}`;
  }

  return `${clock(row.startsAt ?? "")}–${clock(row.endsAt ?? "")} · ${hours}`;
}

function textOf(row: DaySheetRow, isAdmin: boolean): string {
  const name = isAdmin ? (row.name ?? "") : "";

  return name === "" ? bodyOf(row) : `${name} · ${bodyOf(row)}`;
}

export function daySheetRows(
  rows: readonly DaySheetRow[],
  isAdmin: boolean,
): DaySheetContent {
  if (rows.length === 0) {
    return {
      kind: "empty",
      message: isAdmin
        ? "이 날 넣은 사람이 없어요"
        : "이 날 넣은 리허설이 없어요",
    };
  }

  return {
    kind: "rows",
    lines: rows.map((row) => ({ id: row.id, text: textOf(row, isAdmin) })),
    totalLine:
      rows.length < MIN_ROWS_FOR_TOTAL
        ? null
        : `합계 · ${spellDuration(dayTotal(rows).minutes)}`,
  };
}
