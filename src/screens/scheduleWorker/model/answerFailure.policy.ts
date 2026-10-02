import { errorCodeOf } from "@/shared/model/errorCode.policy";

/**
 * 근무 요청에 답하다 실패했을 때 그 실패가 무엇인지다
 * (`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「실패와 경합」).
 *
 * **늦은 수락은 오류 블록이 아니다.** 선착순에 진 요청은 다시 눌러도 되살아나지 않아 시트에
 * 붙잡아 둘 일이 없다 — 시트를 닫고 토스트로 말한 뒤 달력 아래 줄에 그 사건을 남긴다.
 * 통신이 끊긴 것은 반대로 다시 누를 자리가 시트 안이라 열어 둬야 한다.
 *
 * **한 말로 접으면 화면이 둘을 못 가른다.** React Query의 `isError` 하나만 보면 둘이 같은
 * 실패라, 자리가 찬 날에도 시트가 남고 끊긴 날에도 시트가 닫힌다.
 */

export type AnswerFailure = "seat_taken" | "unreachable";

export function answerFailure(error: Error | null): AnswerFailure | null {
  if (error === null) {
    return null;
  }

  return errorCodeOf(error) === "slot_full" ? "seat_taken" : "unreachable";
}
