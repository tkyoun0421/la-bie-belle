/**
 * 근무표 질의가 돌려주는 생 꼴이다. 열 이름이 DB 그대로라 `api` 안에 산다 — 도메인의
 * 모양은 `model/schedule.type.ts`가 든다.
 *
 * **아직 화면까지 이 꼴이 닿는다.** 매퍼로 도메인 모양으로 바꾸는 일은 묶음 열이 자리를
 * 잡은 뒤 한 번에 한다([dto-to-domain-shape](../../../../docs/3-build/plans/dto-to-domain-shape.md)).
 */

/**
 * 신고 시각과 접수 시각도 같이 온다 — 근태 판정(`entities/attendance`)이 인증 한 건을
 * 그 셋으로 읽어서, 급여가 결근을 다시 판정할 때 이 행을 그대로 넘긴다.
 */
export type ScheduleCheckIn = {
  id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
};

export type ScheduleAssignment = {
  id: string;
  slot_id: string | null;
  position: string;
  kind: string;
  profile_id: string;
  ended_at: string | null;
  profiles: { display_name: string | null } | null;
};

export type ScheduleSlot = {
  id: string;
  positions: string[];
  ended_at: string | null;
};

export type ScheduleDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
  opened_at: string;
  slots: ScheduleSlot[];
  assignments: ScheduleAssignment[];
  check_ins: ScheduleCheckIn[];
};

/**
 * 빈 자리는 `open_slots` 뷰에서 온다. 뷰의 열이 전부 nullable로 생성되므로 질의가 거른
 * 뒤의 꼴이 이것이다 — 좁히는 손은 `getOpenSlots.api.ts`에 있다.
 */
export type OpenSlot = {
  slot_id: string;
  day_id: string;
  work_date: string;
  positions: string[];
};

/**
 * 그 달 근무표 행이다. 이 꼴만 매퍼를 지나 도메인 모양이 된다 — 나머지 넷은 아직 생 꼴로
 * 화면까지 간다.
 */
export type MonthWindowRow = {
  application_deadline: string | null;
  confirmed_at: string | null;
};
