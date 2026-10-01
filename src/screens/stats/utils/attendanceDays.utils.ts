import { spellDate } from "@/shared/utils/kstDate";
import {
  getAttendanceStatus,
  type AttendanceStatus,
} from "@/entities/attendance/model/attendanceStatus";
import type { ScheduleDay } from "@/entities/schedule/api/getMonthSchedule.api";
import {
  buildAttendanceInputs,
  type AttendanceInputCheckIn,
  type AttendanceInputExcuseStatus,
} from "@/features/stats/model/attendanceInputs";

/**
 * 근태 탭 날짜 목록이다. 정본은 `docs/2-design/system/screens/stats.md`의 「내 근태 날짜
 * 목록」이고 완료 조건은 `docs/2-design/spec/stats-worker.md`의 AC-02다.
 *
 * **판정을 다시 짜지 않는다.** 재료를 맞물리는 것은 `buildAttendanceInputs`고 상태 여섯을
 * 내는 것은 `getAttendanceStatus`다 — 관리자 쪽 `buildAttendanceTab`이 밟은 길과 같다.
 *
 * **사람이 아니라 날이 줄이다.** 근무자가 이 탭에서 묻는 것은 「언제 늦었나」고 그 답은
 * 날짜에 붙어 있다.
 *
 * **인증 창이 아직 안 열린 날은 빠진다.** 상태 함수가 `null`을 내는 날이라 여섯 중 어디에도
 * 안 든다 — 결과가 없는 날은 이 탭에 읽을 것이 없다(ATT-008).
 *
 * **상태 이름을 줄이지도 늘리지도 않는다.** 여섯의 정본은 `attendance/design.md`고, 근무표
 * 명단이 쓰는 「아직 안 찍음」·「출근 인정」은 그 화면의 자리 사정이라 여기로 안 온다.
 *
 * **색으로 안 가른다.** 「지각」이 붉지 않아 이 모듈이 내는 것은 글자뿐이고 색 이름이 없다.
 */

const TRAINING_KIND = "training";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "출근",
  late: "지각",
  unmarked: "안 찍음",
  pending: "확인 중",
  excused: "인정",
  absent: "결근",
};

const KST_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

export type MyAttendanceDay = {
  workDate: string;
  position: string;
  isEducation: boolean;
  status: AttendanceStatus;
  checkedAt: string | null;
};

export type MyAttendanceRow = {
  title: string;
  subtitle: string;
  value: string;
};

export function buildMyAttendanceDays(
  profileId: string,
  days: readonly ScheduleDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  now: string,
): MyAttendanceDay[] {
  const mine = days.flatMap((day) => {
    const assignment = day.assignments.find(
      (row) => row.profile_id === profileId && row.ended_at === null,
    );

    return assignment === undefined ? [] : [{ day, assignment }];
  });

  // 날마다 산 배정이 하나뿐이라 입력도 날마다 하나씩 같은 순서로 나온다.
  const inputs = buildAttendanceInputs(
    mine.map(({ day, assignment }) => ({
      id: day.id,
      work_date: day.work_date,
      starts_at: day.starts_at,
      ends_at: day.ends_at,
      assignments: [assignment],
    })),
    checkIns,
    excuseStatuses,
    now,
  );

  return mine
    .flatMap(({ day, assignment }, at) => {
      const status = getAttendanceStatus(inputs[at]);

      return status === null
        ? []
        : [
            {
              workDate: day.work_date,
              position: assignment.position,
              isEducation: assignment.kind === TRAINING_KIND,
              status,
              checkedAt:
                checkIns.find(
                  (checkIn) =>
                    checkIn.day_id === day.id &&
                    checkIn.profile_id === profileId,
                )?.checked_at ?? null,
            },
          ];
    })
    .sort((left, right) => left.workDate.localeCompare(right.workDate));
}

export function myAttendanceRow(day: MyAttendanceDay): MyAttendanceRow {
  const status = STATUS_LABELS[day.status];

  return {
    title: spellDate(day.workDate),
    subtitle: day.isEducation ? `${day.position} 교육` : day.position,
    value:
      day.checkedAt === null
        ? status
        : `${status} · ${checkedTimeLabel(day.checkedAt)}`,
  };
}

/** 찍은 순간을 홀의 시계로 읽는다 — UTC로 읽으면 밤 9시 뒤가 하루 전 시각으로 선다. */
export function checkedTimeLabel(checkedAt: string): string {
  return KST_TIME.format(new Date(checkedAt));
}
