/**
 * 포지션 순 보기의 날짜 줄이다. 아코디언 한 줄이 날짜 하나고, 오른쪽에 그날 내가 무엇인지가
 * 한 마디로 선다(`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「포지션 순 —
 * 날짜 아코디언」).
 *
 * **「내 근무만」이 여기서는 줄을 지운다.** 달력은 면을 빼고 목록은 줄을 뺀다 — 같은 체크
 * 하나가 보기마다 다르게 거른다.
 */

export type MyAssignment = {
  kind: "regular" | "training";
  position: string;
};

export type AgendaDay = {
  workDate: string;
  myAssignment: MyAssignment | null;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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
 * 「10월 10일(토)」다. 날짜 줄과 날 시트 제목이 같은 꼴을 쓴다.
 *
 * `work_date`는 KST 달력의 날짜고 시각이 없다. UTC 자정으로 읽어야 기기 시간대가 어디든 같은
 * 요일이 나온다.
 */
export function spellWorkDate(workDate: string): string {
  const [, month, day] = workDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(`${workDate}T00:00:00Z`).getUTCDay()];

  return `${month}월 ${day}일(${weekday})`;
}
