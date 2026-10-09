export function cancelRequestBadge(hasActiveRequest: boolean): string | null {
  return hasActiveRequest ? "취소 요청 중" : null;
}
