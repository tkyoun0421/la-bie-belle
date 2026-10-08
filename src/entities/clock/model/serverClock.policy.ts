export function serverOffset(
  serverNowIso: string,
  deviceNowMs: number,
): number {
  return new Date(serverNowIso).getTime() - deviceNowMs;
}

export function nowWithOffset(deviceNowMs: number, offset: number): number {
  return deviceNowMs + offset;
}

export function remainingMs(expiresAt: string, serverNowMs: number): number {
  return Math.max(0, new Date(expiresAt).getTime() - serverNowMs);
}

export function isExpired(expiresAt: string, serverNowMs: number): boolean {
  return serverNowMs >= new Date(expiresAt).getTime();
}
