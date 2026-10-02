/**
 * 직원 화면이 드는 두 꼴이다. 정본은
 * `docs/2-design/modules/account/screens/members.md`다.
 *
 * **둘 다 controller가 든다.** 어느 Dialog가 섰는지는 물어서 선 것과 거절당해 선 것이
 * 합쳐진 값이고, 시트의 얼굴은 이름 고치기가 통신에 매여 있어 화면 것이 아니다 — 그래서
 * 꼴이 `ui`가 아니라 여기 산다.
 */

/** 묻는 넷과 막는 둘이다 — 앞의 넷은 버튼이 둘이고 뒤의 둘은 하나다. */
export type MemberDialogKind =
  "promote" | "demote" | "leave" | "undo" | "blocked" | "last-admin";

/** 한 시트 안의 얼굴 둘이다 — 이름 고치기가 새 시트를 쌓지 않는다. */
export type MemberSheetFace = "detail" | "rename";
