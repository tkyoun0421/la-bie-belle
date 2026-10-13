# 세션 읽기 실패가 `/retry`로 간다

세션을 못 읽으면 지금은 로그아웃과 같은 값이 된다. 관리자 화면 가드는 근무자 홈으로, 리허설 가드는 `/me`로 사람을 보내고, 첫 진입은 로그인 화면으로 보낸다. 통신이 잠깐 끊겼을 뿐인데 사람이 자기 화면에서 쫓겨난다.

## 입력 명세·기준

정본은 [account 설계](../../2-design/modules/account/design.md)의 「읽기 자체가 실패하면 `/retry`다 — 껍데기를 빈 채로 두지 않는다」와 [runtime](../../2-design/system/runtime.md#재시도)의 「읽기 실패는 캐시가 있으면 캐시 + 띠, 없으면 실패 화면」이다. 「띠」는 아직 코드에 없어 이 task 밖이다.

## 뿌리가 한 겹 아래다

`useSessionUserQuery`가 `error`를 버리는 것이 backlog가 적은 자리였는데, 그 아래 `entities/session/api/getCurrentUser.api.ts`가 **모든 오류를 `null`로 접는다** — `error ? null : data.user`. 그래서 query에 `error`를 세워도 늘 `null`이다. `decideEntry`도 같은 api를 써서 통신 실패를 「세션 없음」으로 읽고 `LOGIN_PATH`로 보낸다.

## 판정 — 묻지 말고 이 꼴로 쓴다

**`getCurrentUser`는 「세션 없음」만 `null`로 읽고 나머지는 던진다.** Supabase가 세션이 없을 때 돌려주는 `AuthSessionMissingError`(`@supabase/supabase-js`의 `isAuthSessionMissingError`)만 `null`이고, 다른 오류는 `toApiError`로 던진다. 이것으로 `decideEntry`의 `catch`가 통신 실패를 `RETRY_PATH`로 보낸다 — 지금 그 경로는 죽어 있다.

**`useSessionUserQuery`가 `error`를 돌려준다.** `useMyStanding`의 `error`는 `session.error ?? profile.error`다.

**가드 둘이 「데이터 없는 실패」를 `/retry`로 보낸다.** `resolveAdminGuard`와 `resolveRehearsalGuard`가 `failed`를 입력으로 받는다 — `failed`는 `error !== null`이고 **그 값이 아직 한 번도 안 왔을 때**다(세션과 프로필 둘 중 하나라도 `undefined`). 캐시가 있으면 옛 값으로 판정을 이어간다 — runtime의 「캐시가 있으면 캐시」다. `app/admin/_layout.tsx`와 `app/me/rehearsals.tsx`가 그 판정을 따라 `RETRY_PATH`로 `Redirect`한다.

**`useMyStanding`의 다른 소비자는 안 건드린다.** `error`를 읽는 소비자가 지금 0이다. 화면마다 실패를 그리는 일은 `query-failure-reaches-the-screen`이 정본을 세운 뒤 간다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `entities/session/api/getCurrentUser.api.ts` + integration 짝 | 세션 없음만 `null`, 나머지 던짐 |
| `entities/session/services/useSessionUserQuery.ts` + 짝 | `error` 반환 |
| `features/auth/hooks/useMyStanding.ts` + 짝 | `error`가 세션 실패도 든다 |
| `entities/session/model/resolveAdminGuard.policy.ts` · `shared/model/rehearsalGuard.policy.ts` + 짝 | `failed` 입력, 결과 `RETRY_PATH` |
| `app/admin/_layout.tsx` · `app/me/rehearsals.tsx` | 판정을 넘기고 따른다 |
| `features/auth/lib/__tests__/decideEntry.lib.test.ts` | `getCurrentUser`가 던지면 `RETRY_PATH` — 이미 있으면 그대로 |

## 완료 조건

- **AC-01** `getCurrentUser`가 세션 없음에 `null`, 통신 오류에 던진다
- **AC-02** 첫 진입에 `getUser`가 통신 오류면 `RETRY_PATH`다(로그인 화면이 아니다)
- **AC-03** `useMyStanding.error`가 세션 실패를 든다
- **AC-04** 관리자 가드와 리허설 가드가 데이터 없는 실패에 `RETRY_PATH`, 캐시가 있는 실패에는 옛 값으로 판정한다
- **AC-05** `pnpm lint`·`pnpm typecheck`·`pnpm test` 초록

## 리스크

**`isAuthSessionMissingError`의 이름과 꼴을 설치된 `@supabase/supabase-js`에서 확인한다.** 없으면 `error.name === "AuthSessionMissingError"`를 가드 함수로 쓴다(`as` 아님).

**integration 짝이 「세션 없음 → `null`」을 이미 단언하면 그대로 통과해야 한다.** 통신 오류는 integration으로 못 만드니 unit에서 클라이언트 대역으로 단언한다.
