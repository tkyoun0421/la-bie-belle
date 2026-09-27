/**
 * 직원 관리가 캐시에서 건드리는 키 셋이다. `docs/2-design/system/runtime.md`의 「TanStack
 * Query 규칙」이 키를 `[도메인, 범위]`로 정했고, 어느 판정이 어느 키를 무효화하는지는
 * `docs/2-design/modules/account/design.md`의 「캐시 갱신」이 든다.
 *
 * `['members']`는 네 목록의 접두사다 — 재직·퇴사·가입 대기·차단이 그 아래 `kind`로 갈리므로
 * 접두사 하나를 무효화하면 넷이 같이 다시 읽힌다. 퇴사 처리가 재직 목록과 퇴사 구획을 동시에
 * 바꾸는 자리라 그 둘을 따로 세는 일이 없다.
 *
 * 이름을 고치면 프로필과 근무표까지 닿는다 — 화면이 프로필의 지금 이름 하나를 읽어서 지난
 * 근무표에 뜨는 이름이 같이 바뀐다.
 *
 * `['profile']`이 `features/profile`에도 적혀 있는 것은 슬라이스끼리 서로를 못 import해서다
 * (규칙 3). 키 문자열의 정본은 코드가 아니라 runtime.md다.
 */

export const MEMBERS_KEY = ["members"] as const;

export const PROFILE_KEY = ["profile"] as const;

export const SCHEDULE_KEY = ["schedule"] as const;
