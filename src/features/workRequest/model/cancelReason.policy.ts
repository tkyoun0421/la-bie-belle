import { CANCEL_REASON_MAX_LENGTH } from "@/features/workRequest/consts/workRequest.const";

export function isValidCancelReason(reason: string): boolean {
  const written = reason.trim();

  return written.length > 0 && written.length <= CANCEL_REASON_MAX_LENGTH;
}
