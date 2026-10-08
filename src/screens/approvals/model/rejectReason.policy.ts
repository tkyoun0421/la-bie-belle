import {
  CANCEL_REJECT_REASONS,
  CUSTOM_REJECT_MAX_LENGTH,
  CUSTOM_REJECT_REASON,
} from "@/screens/approvals/consts/approvals.const";

export function isRejectReasonValid(
  chosen: string | null,
  customText: string,
): boolean {
  if (chosen === null) {
    return false;
  }

  if (chosen !== CUSTOM_REJECT_REASON) {
    return true;
  }

  const written = customText.trim();

  return written.length > 0 && written.length <= CUSTOM_REJECT_MAX_LENGTH;
}

export function rejectReasonText(
  chosen: string | null,
  customText: string,
): string {
  if (chosen === CUSTOM_REJECT_REASON) {
    return customText.trim();
  }

  return (
    CANCEL_REJECT_REASONS.find((reason) => reason.value === chosen)?.label ?? ""
  );
}
