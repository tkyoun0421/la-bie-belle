import type { ScheduleDay } from "@/entities/schedule/dals/get-month-schedule";
import { POSITION_ORDER } from "@/entities/schedule/model/positions";

/**
 * 그달 근무를 사람과 포지션 두 축으로 가른다. 정본은
 * `docs/2-design/system/screens/stats.md`의 「근무」고 완료 조건은
 * `docs/2-design/spec/stats-admin.md`의 AC-01이다.
 *
 * **셋의 합이 같다.** 사람별 시간 합도 포지션별 시간 합도 `totalMinutes`와 같다 — 같은 한
 * 숫자를 두 축으로 나눠 보는 자리라 둘이 어긋나면 그 자리에서 들킨다. 건수도 같다.
 *
 * **한 배정의 시간은 그날 근무 시간이다.** 사람마다 다르지 않아 `days`의 시각 차이가 그대로
 * 그 배정의 분이다. 날을 못 찾은 배정은 잴 값이 없어 빠진다.
 *
 * **겸임은 앞 포지션으로 한 번만 센다.** 배정이 든 `position`이 이미 그 앞 포지션이라 양쪽에
 * 얹을 길이 없다 — 얹으면 포지션 합이 전체보다 커진다.
 *
 * **교육 배정도 든다**(ATT-020). 정규 자리를 안 먹을 뿐 그날 같은 시간을 있었고, 어느
 * 포지션의 교육이었는지로 센다.
 *
 * **확정 여부를 안 본다.** 배정이 있으면 센다 — 관리자가 이번 달을 짜면서 균형을 보는 것이 이
 * 화면의 쓰임이라 확정을 기다리면 가장 쓸모 있는 순간에 빈다(plan stats-admin 「착수 판정」).
 *
 * **재직 여부도 안 본다.** 그달에 일했으면 퇴사한 사람도 선다 — 근무 시간은 그달의 사실이다.
 */

export type WorkAssignment = {
  id: string;
  day_id: string;
  profile_id: string;
  display_name: string;
  position: string;
  kind: string;
  ended_at: string | null;
};

export type WorkDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
};

export type PersonTotal = {
  profileId: string;
  displayName: string;
  minutes: number;
  count: number;
};

export type PositionTotal = {
  position: string;
  minutes: number;
  count: number;
};

export type WorkTotals = {
  totalMinutes: number;
  totalCount: number;
  byPerson: PersonTotal[];
  byPosition: PositionTotal[];
};

const MINUTES_PER_HOUR = 60;

const KOREAN = "ko";

export type WorkInputs = {
  assignments: WorkAssignment[];
  days: WorkDay[];
};

/**
 * 읽어 온 달을 이 모듈이 세는 모양으로 옮긴다. 배정 행이 이름을 임베딩해 오므로
 * (`get-month-schedule.ts`) 사람별 구획이 프로필을 다시 읽지 않는다.
 *
 * 옮기는 손이 여기 있는 것은 `WorkAssignment`·`WorkDay`를 이 파일이 소유해서다 — 부르는
 * 쪽마다 짜면 필드 하나가 늘 때 그만큼 고쳐야 한다.
 */
export function workInputsOf(days: readonly ScheduleDay[]): WorkInputs {
  return {
    assignments: days.flatMap((day) =>
      day.assignments.map((assignment) => ({
        id: assignment.id,
        day_id: day.id,
        profile_id: assignment.profile_id,
        display_name: assignment.profiles?.display_name ?? "",
        position: assignment.position,
        kind: assignment.kind,
        ended_at: assignment.ended_at,
      })),
    ),
    days: days.map((day) => ({
      id: day.id,
      work_date: day.work_date,
      starts_at: day.starts_at,
      ends_at: day.ends_at,
    })),
  };
}

/**
 * 「9시간」이다. 30분짜리 꼬리가 붙으면 소수 한 자리까지 적는다 — 반올림해 지우면 사람별 합과
 * 포지션 합이 화면에서 안 맞는 것처럼 보인다.
 */
export function hoursLabel(minutes: number): string {
  const hours = minutes / MINUTES_PER_HOUR;

  return `${Number(hours.toFixed(1))}시간`;
}

/** 배정이 끝난 자국은 취소나 교대로 넘어간 자리라 셈에 안 든다. */
export function isLiveAssignment(assignment: WorkAssignment): boolean {
  return assignment.ended_at === null;
}

/** `"10:00:00"`과 `"18:00:00"`이면 480이다. */
export function dayMinutes(day: WorkDay): number {
  return minutesOfTime(day.ends_at) - minutesOfTime(day.starts_at);
}

export function computeWorkTotals(
  assignments: readonly WorkAssignment[],
  days: readonly WorkDay[],
): WorkTotals {
  const minutesByDay = new Map(days.map((day) => [day.id, dayMinutes(day)]));
  const people = new Map<string, PersonTotal>();
  const positions = new Map<string, PositionTotal>();

  for (const position of POSITION_ORDER) {
    positions.set(position, { position, minutes: 0, count: 0 });
  }

  let totalMinutes = 0;
  let totalCount = 0;

  for (const assignment of assignments.filter(isLiveAssignment)) {
    const minutes = minutesByDay.get(assignment.day_id);

    if (minutes === undefined) {
      continue;
    }

    totalMinutes += minutes;
    totalCount += 1;

    add(
      people,
      assignment.profile_id,
      () => ({
        profileId: assignment.profile_id,
        displayName: assignment.display_name,
        minutes: 0,
        count: 0,
      }),
      minutes,
    );

    add(
      positions,
      assignment.position,
      () => ({ position: assignment.position, minutes: 0, count: 0 }),
      minutes,
    );
  }

  return {
    totalMinutes,
    totalCount,
    byPerson: [...people.values()].sort(
      (left, right) =>
        right.minutes - left.minutes ||
        left.displayName.localeCompare(right.displayName, KOREAN),
    ),
    byPosition: [...positions.values()].sort(
      (left, right) =>
        right.minutes - left.minutes ||
        positionRank(left.position) - positionRank(right.position),
    ),
  };
}

type Tallied = { minutes: number; count: number };

function add<Row extends Tallied>(
  rows: Map<string, Row>,
  key: string,
  create: () => Row,
  minutes: number,
): void {
  const row = rows.get(key) ?? create();

  row.minutes += minutes;
  row.count += 1;
  rows.set(key, row);
}

/** 정본 순서 밖의 포지션은 뒤에 붙는다 — 홀이 포지션을 늘려도 합이 안 어긋난다. */
function positionRank(position: string): number {
  const at = (POSITION_ORDER as readonly string[]).indexOf(position);

  return at === -1 ? POSITION_ORDER.length : at;
}

function minutesOfTime(time: string): number {
  const [hour, minute] = time.split(":").map(Number);

  return hour * MINUTES_PER_HOUR + minute;
}
