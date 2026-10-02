/**
 * 「승인할 일」 한 줄의 모양이다. 정본은
 * `docs/2-design/system/screens/approvals.md`의 「목록 짜임」이다.
 *
 * **지금 서는 줄은 근무 취소뿐이다.** 사유 줄은 `attendance-excuse`가 같은 목록에 이을 때
 * `kind`에 더해지고, 그때 「근무 취소가 위」라는 두 번째 정렬 기준이 붙는다 — 갈래를
 * 유니언으로 둔 것이 그 자리다.
 */

export type ApprovalKind = "cancel";

export type ApprovalListRow = {
  id: string;
  kind: ApprovalKind;
  workDate: string;
};

/**
 * 상세 시트의 얼굴이다 — 시트는 하나고 안쪽만 바뀐다
 * (같은 문서의 「상세 시트 짜임」과 「거절 짜임」).
 *
 * 시트 조각이 아니라 여기 사는 것은 어느 얼굴인지를 controller가 들기 때문이다.
 */
export type ApprovalSheetFace = "detail" | "reject";
