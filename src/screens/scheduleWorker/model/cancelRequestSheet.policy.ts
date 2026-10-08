import { CANCEL_REASON_MAX_LENGTH } from "@/screens/scheduleWorker/consts/scheduleWorker.const";

export function isValidCancelReason(reason: string): boolean {
  const written = reason.trim();

  return written.length > 0 && written.length <= CANCEL_REASON_MAX_LENGTH;
}

export function cancelRequestBadge(hasActiveRequest: boolean): string | null {
  return hasActiveRequest ? "취소 요청 중" : null;
}
