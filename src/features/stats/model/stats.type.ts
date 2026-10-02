/**
 * 통계가 세는 것의 모양이다 — 재료 둘과 결과 넷이다. 정본은
 * `docs/2-design/system/screens/stats.md`의 「근무」고 완료 조건은
 * `docs/2-design/spec/stats-admin.md`의 AC-01과 `stats-worker.md`의 AC-03이다.
 *
 * **열 이름이 snake인데 DTO가 아니다.** `workInputsOf`가 `ScheduleDay`를 받아 이 꼴로 눕히면서
 * 열 이름을 그대로 들고 왔다. 통신이 주고받는 꼴이 아니라 이 슬라이스가 세기 위해 추린 꼴이고,
 * 열 이름을 도메인 이름으로 바꾸는 일은 [dto-to-domain-shape](../../../../docs/3-build/plans/dto-to-domain-shape.md)가
 * 받는다.
 *
 * **결과 넷이 한 숫자를 두 축으로 나눈다.** `WorkTotals`의 사람별 합과 포지션별 합이 둘 다
 * `totalMinutes`와 같아서, 둘이 어긋나면 그 자리에서 들킨다. 내 것으로 좁힌 `MyWorkTotals`는
 * 사람 축을 안 든다 — 볼 사람이 자기 하나다.
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

export type WorkInputs = {
  assignments: WorkAssignment[];
  days: WorkDay[];
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

export type MyWorkTotals = {
  totalMinutes: number;
  totalCount: number;
  byPosition: PositionTotal[];
};
