import { QueryClient } from "@tanstack/react-query";

/**
 * 서버 상태가 사는 자리 하나. 둘을 만들면 로그아웃이 비운 쪽과 화면이 읽는 쪽이 갈린다.
 *
 * `staleTime`과 `gcTime`이 0이고 영속하지 않는 것은
 * [design.md](../../../docs/2-design/modules/account/design.md)의 「첫 진입과 게이트」가
 * 정한 그대로다 — 차단당한 사람이 옛 프로필로 근무표를 더 보는 일이 없어야 한다.
 *
 * 로그아웃 넷이 `clear()`로 비우는 대상도 이 하나다
 * (`docs/2-design/modules/account/design.md`의 「로그아웃·퇴사·차단 뒤 기기 정리」).
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 0, gcTime: 0 } },
});
