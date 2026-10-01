import {
  tallyMonthlyAttendance,
  type MonthlyAttendanceTally,
} from "@/entities/attendance/utils/attendanceSummary.utils";
import type { ScheduleDay } from "@/entities/schedule/api/getMonthSchedule.api";
import {
  buildAttendanceInputs,
  type AttendanceInputCheckIn,
  type AttendanceInputDay,
  type AttendanceInputExcuseStatus,
} from "@/features/stats/utils/attendanceInputs.utils";

/**
 * 그달 내 근태를 넷으로 센다. 화면이 보는 달 하나를 넘기고 추이 그래프가 열두 달을 한 달씩
 * 넘기는데, 좁히기부터 셈까지가 한 덩이라 부르는 자리마다 세 함수를 줄세우면 그 줄이 사본이
 * 된다.
 *
 * **남의 배정은 안 센다.** 그달 날들을 내 배정만 남기고 좁힌 뒤에 센다 — 안 좁히면 같은 날
 * 같이 선 사람의 결근까지 내 숫자에 든다.
 *
 * **프로필을 아직 못 읽었으면 넷 다 0이다.** 좁힐 기준이 없는 순간이라 좁힌 날이 비고, 그
 * 빈 배열이 그대로 0으로 나온다.
 *
 * **판정도 셈도 여기서 다시 안 짠다.** 재료를 맞물리는 것은
 * `features/stats/model/attendanceInputs.ts`, 세는 것은
 * `entities/attendance/model/attendanceSummary.ts`다 — 확인 중과 안 찍음이 넷 중 어디에도
 * 안 드는 것도 그 계약 그대로다.
 */
export function myAttendanceTally(
  days: readonly ScheduleDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  profileId: string | null,
  now: string,
): MonthlyAttendanceTally {
  return tallyMonthlyAttendance(
    buildAttendanceInputs(
      myDaysOf(days, profileId),
      checkIns,
      excuseStatuses,
      now,
    ),
  );
}

function myDaysOf(
  days: readonly ScheduleDay[],
  profileId: string | null,
): AttendanceInputDay[] {
  return profileId === null
    ? []
    : days.map((day) => ({
        id: day.id,
        work_date: day.work_date,
        starts_at: day.starts_at,
        ends_at: day.ends_at,
        assignments: day.assignments.filter(
          (assignment) => assignment.profile_id === profileId,
        ),
      }));
}
