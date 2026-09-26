/**
 * 로그아웃 뒤 기기를 비우는 순서 하나다. 정본은
 * `docs/2-design/modules/account/design.md`의 「로그아웃·퇴사·차단 뒤 기기 정리」다.
 *
 * 순서가 이 모듈의 알맹이다. 기기 주소는 세션이 살아 있을 때만 지울 수 있어서
 * `remove_push_token`이 `auth.signOut()`보다 먼저다. 캐시를 비우는 것은 세션이 끊긴 뒤라야
 * 남의 근무표가 다시 채워지지 않는다. 네 화면이 각자 이 순서를 적으면 한 자리만 어긋나도
 * 기기에 남의 자료가 남는다.
 *
 * 무엇을 하는지는 화면이 넘긴다. 이 층은 `entities`를 모르고 `QueryClient`도 모른다.
 */
export type SignOutDeps = {
  removePushToken: () => Promise<void>;
  signOut: () => Promise<void>;
  clearQueryClient: () => void;
  clearPersistedState: () => Promise<void>;
};

export async function signOut(deps: SignOutDeps): Promise<void> {
  await deps.removePushToken();
  await deps.signOut();
  deps.clearQueryClient();
  await deps.clearPersistedState();
}

/**
 * 아직 안 선 자리 둘이다. 기기 주소를 기억하는 자리는 `notification-settings`가 세우고,
 * 캐시 영속본은 그것을 켜는 task가 세운다. 그때까지 화면 넷이 각자 빈 함수를 적지 않도록
 * 한 자리에 모아 둔다 — 자리가 서면 여기만 고친다.
 */
export const DEVICE_CLEANUP_NOT_WIRED_YET = {
  removePushToken: async (): Promise<void> => {},
  clearPersistedState: async (): Promise<void> => {},
};
