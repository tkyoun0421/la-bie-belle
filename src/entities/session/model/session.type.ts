/**
 * 세션을 든 사람이 설 수 있는 자리 다섯이다. 정본은
 * `docs/2-design/system/navigation.md`의 「세 층」이고, 게이트 넷(`/login`·`/pending`·
 * `/blocked`·`/left`)과 앱 안(`/`)이 그 전부다.
 *
 * **라우트 글자를 그대로 든다.** `Href`로 바로 넘겨 `router.replace`에 실리는 값이라
 * 한 겹 더 옮기면 그 옮기는 표가 또 하나의 정본이 된다.
 *
 * 이 꼴을 `features/auth`가 당겨 `EntryDecision`에 `"/retry"`를 얹는다 — 읽기 실패는
 * 세션의 상태가 아니라 진입이 겪는 일이라 그 한 갈래가 위층에 산다.
 */
export type AuthDestination =
  "/login" | "/pending" | "/blocked" | "/left" | "/";
