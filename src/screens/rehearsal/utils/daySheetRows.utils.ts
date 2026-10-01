import {
  dayTotal,
  rehearsalHours,
  type RehearsalRow,
} from "@/entities/rehearsal/model/rehearsalHours";
import { spellMinutes } from "@/screens/rehearsal/model/spellTotal";

/**
 * 날 시트의 줄 문구다(`docs/2-design/modules/schedule/screens/rehearsal.md`의 「날 시트
 * 짜임」과 「문안」).
 *
 * **줄이 무엇으로 넣었는지를 먼저 말한다.** 시각 줄은 구간을, 건수 줄은 건수를 적고 뒤에
 * 시간이 붙는다 — 같은 2시간이어도 어떻게 센 것인지가 갈린다.
 *
 * **줄이 하나면 합계를 안 그린다.** 같은 숫자가 두 번 선다.
 *
 * **관리자는 이름이 앞에 붙는다.** 「님」을 안 붙이는 것은 이름이 나열되는 목록이라서다
 * (`docs/2-design/design-system/writing.md`의 「사람 이름」).
 */

const CLOCK_LENGTH = 5;

const MIN_ROWS_FOR_TOTAL = 2;

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

/** DB는 초까지 싣고 화면은 안 싣는다 — 「14:00:00」이 「14:00」이다. */
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
