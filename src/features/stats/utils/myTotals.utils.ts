import {
  computeWorkTotals,
  type PositionTotal,
  type WorkAssignment,
  type WorkDay,
} from "@/features/stats/model/workTotals.policy";

/**
 * 그달 근무를 내 것으로 좁혀 센다. 정본은
 * `docs/2-design/system/screens/stats.md`의 「내 포지션」이고 완료 조건은
 * `docs/2-design/spec/stats-worker.md`의 AC-03이다.
 *
 * **집계를 다시 짜지 않는다.** 관리자 통계가 쓰는 `computeWorkTotals`를 그대로 부르고 입력만
 * 내 배정으로 좁힌다 — 새로 짜면 내가 보는 내 시간과 관리자가 보는 내 시간이 갈린다.
 *
 * **안 들어간 포지션은 줄 자체가 없다.** 관리자 쪽이 아홉을 다 세우는 것과 반대다. 관리자는
 * 「한 달 내내 아무도 안 들어간 자리」가 읽을 거리지만, 나에게 그 여덟 줄은 내가 안 한 일의
 * 목록이라 읽을 것이 없다.
 *
 * **사람 축이 없다.** 볼 사람이 자기 하나라 `byPerson`을 안 낸다.
 */

export type MyWorkTotals = {
  totalMinutes: number;
  totalCount: number;
  byPosition: PositionTotal[];
};

export function computeMyWorkTotals(
  assignments: readonly WorkAssignment[],
  days: readonly WorkDay[],
  profileId: string,
): MyWorkTotals {
  const totals = computeWorkTotals(
    assignments.filter((assignment) => assignment.profile_id === profileId),
    days,
  );

  return {
    totalMinutes: totals.totalMinutes,
    totalCount: totals.totalCount,
    byPosition: totals.byPosition.filter((row) => row.count > 0),
  };
}
