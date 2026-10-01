/**
 * 요청에 돌아오는 답의 갈래다. 둘 다 서버 함수의 인자로 그대로 가고 그 문자열이 DB의
 * 검사 제약과 같아야 한다 — `respond_request`와 `decide_cancel_request`가 그 값을 본다.
 *
 * **쓰기 함수가 아니라 요청 도메인의 것이다.** 근무 요청을 보내는 쪽과 받는 쪽이 같은
 * 갈래를 쓰고, 관리자 판정 화면도 그 이름으로 읽는다.
 */

/** 근무 요청에 근무자가 주는 답이다. */
export type RequestAnswer = "accept" | "decline";

/** 근무 취소 요청에 관리자가 주는 판정이다. */
export type CancelDecision = "approved" | "rejected";
