"use client";

import type { PendingRecommendation } from "@/features/ceremony/hooks/useCeremonyEditor";
import { Dialog } from "@/shared/ui/dialog";

const TITLE = "예정 시각을 다시 추천할까요?";
const NO_RULE_CHECKIN_LABEL = "규칙표가 비어 있어 직접 입력이 필요해요";
const MIDNIGHT_CAP_SUFFIX = " (자정 캡)";

type RecommendationConfirmDialogProps = {
  recommendation: PendingRecommendation | null;
  currentCheckin: string | null;
  currentCheckout: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
};

function formatDescription(
  recommendation: PendingRecommendation,
  currentCheckin: string | null,
  currentCheckout: string | null,
) {
  const checkinLabel = recommendation.checkin ?? NO_RULE_CHECKIN_LABEL;
  const checkoutLabel = `${recommendation.checkout.time}${
    recommendation.checkout.capped ? MIDNIGHT_CAP_SUFFIX : ""
  }`;
  return `출근 ${currentCheckin ?? "미설정"} → ${checkinLabel} · 퇴근 ${
    currentCheckout ?? "미설정"
  } → ${checkoutLabel}`;
}

export function RecommendationConfirmDialog({
  recommendation,
  currentCheckin,
  currentCheckout,
  onConfirm,
  onDismiss,
}: RecommendationConfirmDialogProps) {
  return (
    <Dialog
      open={recommendation !== null}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
      title={TITLE}
      description={
        recommendation
          ? formatDescription(recommendation, currentCheckin, currentCheckout)
          : undefined
      }
      confirmLabel="반영"
      cancelLabel="유지"
      onConfirm={onConfirm}
    />
  );
}
