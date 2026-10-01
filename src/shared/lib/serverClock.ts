/**
 * 화면이 쓰는 「지금」의 계산이다. 정본은
 * `docs/2-design/system/runtime.md`의 「서버 시각」이다.
 *
 * **서버를 매초 안 부른다.** 앱이 뜰 때와 앞으로 돌아올 때 차이를 한 번 재고, 그 뒤로는
 * 기기 시각에 그 차이를 더한 것이 지금이다. 카운트다운과 만료 잠금이 여기 걸린다.
 *
 * **시각을 전부 인자로 받는다.** `Date.now()`를 안에서 부르면 같은 입력이 시각마다 다른 답을
 * 내서 경계(정확히 만료 시각)를 시험할 길이 없다.
 *
 * **경계는 만료 쪽이다.** 만료 시각과 같은 순간이면 이미 끝난 것으로 본다 — 서버의
 * `expire_requests`가 `expires_at > now()`인 갈래만 살아 있다고 세는 것과 같은 방향이라,
 * 화면이 「아직 된다」고 말하고 서버가 `request_closed`를 던지는 어긋남이 안 생긴다.
 */

/** `offset = 서버 - 기기`. 서버가 앞서 있으면 양수다. */
export function serverOffset(
  serverNowIso: string,
  deviceNowMs: number,
): number {
  return new Date(serverNowIso).getTime() - deviceNowMs;
}

export function nowWithOffset(deviceNowMs: number, offset: number): number {
  return deviceNowMs + offset;
}

/** 만료까지 남은 밀리초다. 지났으면 음수 대신 0 — 화면이 음수 초를 세지 않는다. */
export function remainingMs(expiresAt: string, serverNowMs: number): number {
  return Math.max(0, new Date(expiresAt).getTime() - serverNowMs);
}

export function isExpired(expiresAt: string, serverNowMs: number): boolean {
  return serverNowMs >= new Date(expiresAt).getTime();
}
