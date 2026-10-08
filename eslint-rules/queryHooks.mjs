/**
 * TanStack Query가 내놓는 훅 중 **통신을 여는** 것들이다. 이 목록의 정본이 여기 하나고
 * `house/dumb-ui`와 `house/query-hook-in-services`가 같은 집합을 본다 — 사본을 두면
 * 라이브러리가 갈래를 늘릴 때 한쪽만 따라간다.
 *
 * `useQueryClient`는 밖이다. 캐시 손잡이를 받는 것이라 통신을 열지 않고, controller가
 * 무효화를 부르는 자리가 그 훅이다.
 */
export const QUERY_PACKAGE = "@tanstack/react-query";

export const QUERY_HOOKS = new Set([
  "useQuery",
  "useQueries",
  "useInfiniteQuery",
  "useSuspenseQuery",
  "useSuspenseQueries",
  "useSuspenseInfiniteQuery",
  "usePrefetchQuery",
  "usePrefetchInfiniteQuery",
  "useMutation",
  "useMutationState",
  "useIsFetching",
  "useIsMutating",
]);
