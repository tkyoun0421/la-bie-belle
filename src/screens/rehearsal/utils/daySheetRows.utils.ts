import {
  dayTotal,
  rehearsalHours,
  type RehearsalRow,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import {
  CLOCK_LENGTH,
  MIN_ROWS_FOR_TOTAL,
} from "@/screens/rehearsal/consts/rehearsal.const";
import { spellMinutes } from "@/screens/rehearsal/utils/spellTotal.utils";

export type DaySheetRow = RehearsalRow & {
  id: string;
  profiles?: { display_name: string | null } | null;
};

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
  const hours = spellMinutes(rehearsalHours(row));

  if (row.count !== null) {
    return `리허설 ${row.count}건 · ${hours}`;
  }

  return `${clock(row.starts_at ?? "")}–${clock(row.ends_at ?? "")} · ${hours}`;
}

function textOf(row: DaySheetRow, isAdmin: boolean): string {
  const name = isAdmin ? (row.profiles?.display_name ?? "") : "";

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
        : `합계 · ${spellMinutes(dayTotal(rows).minutes)}`,
  };
}
