/**
 * 포지션 순 보기의 날짜 줄이다. 아코디언 한 줄이 날짜 하나고, 오른쪽에 그날 내가 무엇인지가
 * 한 마디로 선다(`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「포지션 순 —
 * 날짜 아코디언」).
 *
 * **「내 근무만」이 여기서는 줄을 지운다.** 달력은 면을 빼고 목록은 줄을 뺀다 — 같은 체크
 * 하나가 보기마다 다르게 거른다.
 */

import { spellDate } from "@/shared/utils/kstDate";

export type MyAssignment = {
  kind: "regular" | "training";
  position: string;
};

export type AgendaDay = {
  workDate: string;
  myAssignment: MyAssignment | null;
};

/**
 * 그날 내 배정이다. 끝난 배정은 안 센다 — 강제 변경으로 자리가 넘어간 날은 남의 근무다.
 * 정규와 교육을 같이 보지만 정규가 먼저다.
 */
export function myAssignmentOf(
  assignments: readonly {
    position: string;
    kind: string;
    profile_id: string;
    ended_at: string | null;
  }[],
  profileId: string | null,
): MyAssignment | null {
  if (profileId === null) {
    return null;
  }

  const mine = assignments.filter(
    (assignment) =>
      assignment.profile_id === profileId && assignment.ended_at === null,
  );
  const chosen =
    mine.find((assignment) => assignment.kind === "regular") ?? mine[0];

  if (chosen === undefined) {
    return null;
  }

  return {
    kind: chosen.kind === "training" ? "training" : "regular",
    position: chosen.position,
  };
}

export function agendaRowStatusLabel(assignment: MyAssignment | null): string {
  if (assignment === null) {
    return "근무 없음";
  }

  return assignment.kind === "training"
    ? `교육 · ${assignment.position}`
    : assignment.position;
}

export function filterAgendaDays(
  days: readonly AgendaDay[],
  showMineOnly: boolean,
): AgendaDay[] {
  return days.filter((day) => !showMineOnly || day.myAssignment !== null);
}

/**
 * 「10월 10일(토)」다. 날짜 줄과 날 시트 제목이 같은 꼴을 쓴다. 계산은
 * `@/shared/utils/kstDate`가 소유한다 — 슬라이스 넷에 같은 손이 각자 서 있던 것을 거기로
 * 모았다.
 */
export function spellWorkDate(workDate: string): string {
  return spellDate(workDate);
}
