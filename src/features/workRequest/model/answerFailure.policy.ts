import { errorCodeOf } from "@/shared/model/errorCode.policy";

export type AnswerFailure = "seat_taken" | "unreachable";

export function answerFailure(error: Error | null): AnswerFailure | null {
  if (error === null) {
    return null;
  }

  return errorCodeOf(error) === "slot_full" ? "seat_taken" : "unreachable";
}
