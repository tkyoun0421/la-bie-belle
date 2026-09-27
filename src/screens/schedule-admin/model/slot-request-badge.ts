/**
 * 날 상세 자리 카드에 얹히는 대기 배지다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「포지션과 자리」다.
 *
 * **카드 문구는 안 바꾼다.** 카드가 자리의 사실(「비어 있어요」)을 말하고 배지가 그 위에
 * 얹힌 상태를 말한다 — 물어봤다는 것과 비어 있다는 것은 다른 사실이다.
 *
 * **닫힌 요청은 배지가 없다.** 자리가 차거나 전부 소진되면 함수가 요청을 닫고, 화면은 그것을
 * 따로 지우지 않는다.
 */

export type SlotRequestBadgeInput = {
  closed_at: string | null;
  candidates: readonly { status: string }[];
};

export function slotRequestBadge(
  request: SlotRequestBadgeInput | null,
): string | null {
  if (request === null || request.closed_at !== null) {
    return null;
  }

  const waiting = request.candidates.filter(
    (candidate) => candidate.status === "pending",
  ).length;

  return `요청 ${waiting}건 대기 중`;
}
