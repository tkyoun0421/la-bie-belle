/**
 * 그날 리허설을 무엇으로 받을지다 — 살아 있는 정규 배정이 있으면 건수 갈래, 없으면 시각
 * 갈래다(`docs/2-design/modules/schedule/design.md`의 「리허설」). 교육 배정은 안 센다.
 *
 * **정본은 SQL이다.** 같은 판정이 `add_rehearsal` 안에도 서 있고 그쪽이 이긴다 — 화면이
 * 시트를 열기 전에 칸 모양을 정해야 해서 어느 쪽도 못 지운다. 둘이 어긋나는 것은 시트를 연
 * 사이에 관리자가 배정을 넣거나 뺐을 때고, 그때는 저장이 `wrong_kind`로 받아 시트가 칸을
 * 바꿔 다시 묻는다 — 두 벌이 선 것을 막는 대신 어긋나도 사람이 안 막히게 한 것이다.
 */

export type RehearsalKind = "count" | "time";

export type KindAssignment = {
  work_date: string;
  kind: string;
  ended_at: string | null;
};

export function kindForDate(
  date: string,
  assignments: readonly KindAssignment[],
): RehearsalKind {
  const working = assignments.some(
    (assignment) =>
      assignment.work_date === date &&
      assignment.kind === "regular" &&
      assignment.ended_at === null,
  );

  return working ? "count" : "time";
}
