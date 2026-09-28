import {
  tallyMonthlyAttendance,
  type MonthlyAttendanceTally,
} from "@/entities/attendance/model/attendance-summary";
import type { ScheduleDay } from "@/entities/schedule/dals/get-month-schedule";
import {
  buildAttendanceInputs,
  type AttendanceInputCheckIn,
  type AttendanceInputExcuseStatus,
} from "@/features/stats/model/attendance-inputs";

/**
 * 근태 탭 사람별 목록이다. 정본은 `docs/2-design/system/screens/stats.md`의 「근태 사람별
 * 목록」이다.
 *
 * **이름 가나다순이다.** 근무 탭 사람별 구획이 시간 많은 순인 것과 반대인데, 이 목록을 훑는
 * 이유가 「누가 얼마나 늦나」가 아니라 「누구」라서다 — 지각 순으로 세우면 이 화면의 첫 줄이
 * 늘 누군가를 지목하게 된다.
 *
 * **0인 몫은 값 자체를 비운다.** 「지각 0」을 안 적는다 — 세로로 쌓이면 0이 줄마다 서서 실제로
 * 지각한 사람이 안 보인다. 결근과 출근 인정도 있는 사람 줄에만 붙는다. 출근은 늘 서는 기본
 * 값이라 0이어도 그대로 남는다.
 */

const KOREAN = "ko";

export type AttendanceRowInput = {
  profileId: string;
  displayName: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
};

export type AttendanceRow = {
  profileId: string;
  displayName: string;
  present: number;
  late: number | null;
  absent: number | null;
  excused: number | null;
};

export function buildAttendanceRows(
  people: readonly AttendanceRowInput[],
): AttendanceRow[] {
  return [...people]
    .sort((left, right) =>
      left.displayName.localeCompare(right.displayName, KOREAN),
    )
    .map((person) => ({
      profileId: person.profileId,
      displayName: person.displayName,
      present: person.present,
      late: orNothing(person.late),
      absent: orNothing(person.absent),
      excused: orNothing(person.excused),
    }));
}

function orNothing(count: number): number | null {
  return count === 0 ? null : count;
}

export type AttendanceTab = {
  tally: MonthlyAttendanceTally;
  rows: AttendanceRow[];
};

/**
 * 그달 근태 탭이 쓰는 값 둘이다 — 현황 줄이 읽는 넷과 사람별 목록이다.
 *
 * **세는 것은 `tallyMonthlyAttendance` 하나다.** 사람마다 제 몫만 추려 같은 함수에 넣고,
 * 현황 줄은 그 결과를 더해 낸다 — 전체를 따로 세면 목록의 합과 어긋날 길이 생긴다.
 *
 * **산 배정이 있는 사람만 줄이 선다.** 그달에 안 나온 사람의 「출근 0」 줄은 읽을 것이 없다.
 */
export function buildAttendanceTab(
  days: readonly ScheduleDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  now: string,
): AttendanceTab {
  const names = new Map<string, string>();

  for (const day of days) {
    for (const assignment of day.assignments) {
      if (assignment.ended_at === null) {
        names.set(
          assignment.profile_id,
          assignment.profiles?.display_name ?? "",
        );
      }
    }
  }

  const rows = buildAttendanceRows(
    [...names].map(([profileId, displayName]) => ({
      profileId,
      displayName,
      ...tallyMonthlyAttendance(
        buildAttendanceInputs(
          daysOfPerson(days, profileId),
          checkIns,
          excuseStatuses,
          now,
        ),
      ),
    })),
  );

  return { tally: sumTallies(rows), rows };
}

/** 「출근 12 · 지각 1」이다. 0인 몫은 낱말째 빠진다. */
export function attendanceRowValue(row: AttendanceRow): string {
  return [
    `출근 ${row.present}`,
    row.late === null ? null : `지각 ${row.late}`,
    row.excused === null ? null : `출근 인정 ${row.excused}`,
    row.absent === null ? null : `결근 ${row.absent}`,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");
}

function daysOfPerson(days: readonly ScheduleDay[], profileId: string) {
  return days.map((day) => ({
    id: day.id,
    work_date: day.work_date,
    starts_at: day.starts_at,
    ends_at: day.ends_at,
    assignments: day.assignments.filter(
      (assignment) => assignment.profile_id === profileId,
    ),
  }));
}

function sumTallies(rows: readonly AttendanceRow[]): MonthlyAttendanceTally {
  return rows.reduce<MonthlyAttendanceTally>(
    (total, row) => ({
      present: total.present + row.present,
      late: total.late + (row.late ?? 0),
      absent: total.absent + (row.absent ?? 0),
      excused: total.excused + (row.excused ?? 0),
    }),
    { present: 0, late: 0, absent: 0, excused: 0 },
  );
}
