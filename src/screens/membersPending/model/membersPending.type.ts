/**
 * 가입 대기 화면이 쓰는 갈래 둘이다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`의 「상세 시트 짜임」이다.
 *
 * **얼굴 이름이 그대로 판정 이름이다.** 거절과 차단은 새 시트를 쌓지 않고 상세 시트의 값 넷
 * 자리를 물음으로 바꾼다 — 그래서 「지금 보이는 얼굴」과 「확인을 누르면 나갈 쓰기」가 같은
 * 값이고, 상세 얼굴에서는 나갈 쓰기가 없다.
 */

export type MemberDecision = "reject" | "block";

export type SheetFace = "detail" | MemberDecision;
