import type { AssignmentIneligibleReason } from "@/entities/assignment/types/candidate";

const INELIGIBLE_REASON_LABELS: Record<AssignmentIneligibleReason, string> = {
  GENDER_MISMATCH: "포지션 성별 조건과 맞지 않아요",
  NOT_ELIGIBLE: "이 포지션의 가능 포지션으로 등록되지 않았어요",
};

export function assignmentIneligibleReasonLabel(reason: AssignmentIneligibleReason): string {
  return INELIGIBLE_REASON_LABELS[reason];
}
