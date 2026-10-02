import type { AuthDestination } from "@/entities/session/model/session.type";

/**
 * 앱이 뜨면서 고르는 자리다. 세션으로 정해지는 다섯에 `"/retry"` 하나가 더 붙는다 —
 * 세션이나 프로필을 못 읽어 **아무 자리도 못 고른** 갈래고, 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「읽기 실패 짜임」이다.
 *
 * 그 한 갈래가 `entities/session`이 아니라 여기인 것은, 읽기 실패가 세션이 든 상태가
 * 아니라 진입을 판정하는 쪽이 겪는 일이기 때문이다.
 */
export type EntryDecision = AuthDestination | "/retry";
