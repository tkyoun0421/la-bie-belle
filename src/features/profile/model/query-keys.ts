/**
 * 프로필이 캐시에서 사는 키 둘이다. `docs/2-design/system/runtime.md`의 「TanStack Query
 * 규칙」이 키를 `[도메인, 범위]`로 정했고 그중 프로필 몫을 이 파일이 든다.
 *
 * 개인정보가 제 키를 갖는 것은 표가 갈려 있어서다 — 연락처를 바꾸면 프로필 행은 그대로라
 * `['profile']`까지 다시 읽을 것이 없다. 반대로 `['profile']`을 무효화하면 접두사가 겹쳐
 * 둘 다 다시 읽는데, 사진처럼 프로필 행을 바꾸는 자리에는 그것이 맞다.
 */

export const PROFILE_KEY = ["profile"] as const;

export const PROFILE_PRIVATE_KEY = ["profile", "private"] as const;
