---
sources:
  - ../../2-design/modules/account/design.md#첫-진입과-게이트
  - ../../2-design/modules/account/design.md#코드와의-차이
  - ../../2-design/system/navigation.md#앱을-열면
  - ../../2-design/system/runtime.md#캐시-두-계층
  - ../../2-design/system/runtime.md#tanstack-query-규칙
---

# 인증 진입을 전환한다 — 구현 계획

## 입력 명세·기준

정본은 [design.md](../../2-design/modules/account/design.md#첫-진입과-게이트)의 「첫 진입과 게이트」와 [navigation.md](../../2-design/system/navigation.md#앱을-열면)의 상태별 목적지 표다. 서버가 승인을 판정하지 않는 이유는 [runtime.md](../../2-design/system/runtime.md#캐시-두-계층)에 있다 — 승인·차단·퇴사를 서버가 HTML에 그리면 그 HTML이 세션마다 달라 Service Worker가 캐시할 수 없다. `['profile']` 키의 규칙은 [runtime.md](../../2-design/system/runtime.md#tanstack-query-규칙)와 design의 「캐시 갱신」 불릿이다 — `staleTime`이 0이고 영속하지 않는다.

지금 코드는 반대로 서 있다. `src/middleware.ts`가 세션 쿠키를 갱신하고, `src/app/auth-gate.ts`의 `enterRoute`·`enterPendingRoute`가 서버에서 `readAuthGate`로 `approved_at`을 읽어 `redirect`한다. 목적지는 `/login`·`/pending`·`/` 셋뿐이고 차단·퇴사는 없다. `/pending`은 서버가 넘긴 이메일·사진을 그린다. [design.md](../../2-design/modules/account/design.md#코드와의-차이)의 「코드와의 차이」 표에서 `auth-entry`가 닫아야 할 행이 둘이다 — 서버 판정을 클라이언트로, `readAuthGate`·`getApprovedAt`의 이동.

계정 데이터 구조는 #360으로 섰다. 로그인 트리거가 빠져 `ensure_profile()`을 부르는 자리가 앱에 없고, 지금은 테스트 헬퍼만 그것을 부른다. 이 task가 그 자리를 세운다.

확인한 코드와 Git 기준점 — `src/middleware.ts`가 `8585ec8`, `src/app/auth-gate.ts`·`src/features/auth/read-auth-gate.ts`가 `3adcb7b`, `tests/e2e/*.spec.ts` 다섯이 `9467c13`, `supabase/migrations/20260825162027_profiles.sql`이 #360.

## 완료 조건

이 task는 게이트 기계만 세운다. `/pending`의 프로필 작성 폼, `/left`·`/blocked`의 화면 짜임은 범위 밖이다 — 아래 「범위 밖」.

### AC-01

**`proxy.ts`가 세션 쿠키만 본다.** Next.js 16의 `src/proxy.ts`가 `src/middleware.ts`를 대신한다.

- 세션 쿠키를 갱신한다 — 지금 `middleware.ts`가 하는 일 그대로. 정적 자산(`/_next/static`·`/_next/image`·이미지 확장자)에는 인증 호출이 안 딸려 온다
- 세션이 없으면 `/login`으로 보낸다. 예외는 `/login`과 `/auth/*`다 — 로그인 화면과 콜백·로그아웃은 세션 없이 열린다
- 세션이 있으면 어느 경로든 통과시킨다. 승인·차단·퇴사·역할은 안 본다 — `/login`에 세션이 있는 채 들어와도 서버는 안 옮기고 껍데기가 옮긴다
- `src/middleware.ts`와 `src/__tests__/middleware.test.ts`가 사라지고 `src/__tests__/proxy.test.ts`가 그 자리다

### AC-02

**목적지는 다섯이다.** `resolveAuthDestination`이 세션 유무와 프로필 행으로 `/login`·`/pending`·`/blocked`·`/left`·`/` 중 하나를 돌려준다.

- 세션 없음 → `/login`
- 프로필 없음 · `submitted_at` 없음 · `rejected_at` 있음 · `approved_at` 없음 → `/pending`
- `blocked_at` 있음 → `/blocked`. 승인 여부보다 먼저다
- `left_at` 있음 → `/left`. 차단보다 뒤, 승인보다 앞이다
- `approved_at` 있음 → `/`
- 네 게이트 경로(`/login`·`/pending`·`/blocked`·`/left`)는 서로 오가지 않는다. 제 자리가 아닌 경로를 열면 제 자리로 간다 — 승인 안 된 사람이 `/`를 열면 `/pending`, 승인된 사람이 `/pending`을 열면 `/`다. 승인된 사람이 게이트 밖 경로를 열면 그대로 둔다
- `/admin` 아래의 역할 판정은 이 task가 아니다 — 그 경로가 아직 없다

### AC-03

**껍데기 하나가 판정한다.** `src/app/layout.tsx` 안의 클라이언트 컴포넌트가 앱이 뜰 때와 탭 복귀에 게이트를 돈다.

- 순서는 세션 → `ensure_profile()` → `['profile']` 읽기 → 목적지 계산 → 제 자리가 아니면 `router.replace`다. 세션이 없으면 `ensure_profile`을 안 부른다
- `['profile']`은 `staleTime` 0이고 영속하지 않는다. 탭 복귀(`refetchOnWindowFocus`)에 다시 읽는다. 라우트 전환은 그 값을 쓴다 — 탭을 옮길 때마다 다시 읽지 않는다
- 첫 읽기가 끝나기 전에는 아무것도 안 그린다. 읽은 뒤에는 자식을 그린다
- 게이트가 든 값(목적지·이메일·구글 사진)은 React 컨텍스트로 화면에 준다. `/pending`이 이메일과 사진을 여기서 받는다
- `ensure_profile`·`['profile']` 읽기가 통신에 실패하면 껍데기가 빈 채로 남지 않는다 — 실패 모습은 정본이 안 정했으니 이 task는 「다시 시도」 버튼 하나만 둔다([리스크](#리스크전환되돌리기))

### AC-04

**`dals`가 둘 는다.** `src/entities/profile/dals/get-my-profile.ts`가 `profiles`에서 `user_id`로 자기 행(`id`·`display_name`·`photo_url`·`role`·`submitted_at`·`approved_at`·`rejected_at`·`blocked_at`·`left_at`)을 읽고, `ensure-profile.ts`가 `rpc('ensure_profile')`을 감싼다. `get-approved-at.ts`와 그 integration 테스트는 사라진다 — 읽는 열이 `get-my-profile`에 든다.

### AC-05

**화면 라우트가 정적 껍데기가 된다.** `src/app/page.tsx`·`src/app/pending/page.tsx`에서 `enterRoute`·`enterPendingRoute` 호출이 빠지고 `src/app/auth-gate.ts`·`src/features/auth/read-auth-gate.ts`와 그 단위 테스트가 사라진다. `/blocked`·`/left`는 `src/app/blocked/page.tsx`·`src/app/left/page.tsx`가 생기되 한 줄 문장만 그린다 — 화면 짜임은 다음 task다. `/login`·`/auth/callback`·`/auth/logout`은 그대로다.

### AC-06

**e2e가 여섯 상태를 본다.** 기존 다섯 spec이 안 고친 채 초록이다 — `toHaveURL`이 클라이언트 이동을 기다리니 단언이 그대로 선다. 새 spec 둘 — `tests/e2e/blocked.spec.ts`(차단된 사람이 `/`를 열면 `/blocked`), `tests/e2e/left.spec.ts`(퇴사자가 `/`를 열면 `/left`) — 가 훅 최소선이다. 승인된 사람이 `/pending`을 열면 `/`로 가는 것과 로그인만 한 새 사용자에게 프로필 행이 생기는 것(`ensure_profile`의 앱 쪽 호출)도 e2e가 본다.

### AC-07

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`가 초록이고, `pnpm test:integration:run`이 초록이며, `pnpm build && pnpm e2e`가 초록이다. `home.spec.ts`의 「정적 자원을 요청해도 인증 갱신 호출이 안 딸려 온다」가 `proxy.ts`에서도 선다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/proxy.ts`(새) · `src/__tests__/proxy.test.ts`(새) · `src/middleware.ts`(삭제) · `src/__tests__/middleware.test.ts`(삭제) | 쿠키 갱신과 세션 없음 → `/login` | AC-01 |
| `src/shared/lib/resolve-auth-destination.ts` · `__tests__/resolve-auth-destination.test.ts` | 목적지 다섯과 「제 자리」 판정 | AC-02 |
| `src/features/auth/`(게이트 훅·컨텍스트·클라이언트 컴포넌트 — 파일 이름은 구현이 정한다) · `__tests__/` | 세션 → `ensure_profile` → `['profile']` → 이동 | AC-03 |
| `src/entities/profile/dals/get-my-profile.ts` · `ensure-profile.ts` · `__tests__/*.integration.test.ts`(새) · `get-approved-at.ts`와 그 테스트(삭제) | 자기 프로필 읽기, `ensure_profile` 호출 | AC-04 |
| `src/app/layout.tsx` · `page.tsx` · `pending/page.tsx` · `blocked/page.tsx`(새) · `left/page.tsx`(새) · `auth-gate.ts`(삭제) · `src/features/auth/read-auth-gate.ts`와 테스트(삭제) | 서버 게이트 제거, 껍데기에 게이트 컴포넌트, 임시 화면 둘 | AC-03·AC-05 |
| `src/screens/pending/ui/pending-screen.tsx` | 이메일·사진을 컨텍스트에서 | AC-03 |
| `tests/e2e/blocked.spec.ts` · `left.spec.ts`(새) · `tests/e2e/support/session.ts` | 차단·퇴사 사용자 시드(`createBlockedUser`·퇴사 헬퍼) | AC-06 |
| `tests/integration/postgres.ts` | 퇴사 사용자 헬퍼(`left_at`) | AC-06 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-06을 층에 배정한다. 목적지 판정은 unit, `dals` 둘은 integration, 게이트 흐름과 여섯 상태는 e2e다 — 어느 파일에 무엇이 드는지가 먼저 서야 writer가 갈린다
2. `unit-test-writer`가 `resolveAuthDestination`의 다섯 목적지와 「제 자리」 판정, `proxy.ts`의 경로 판정(정적 자산·`/login`·`/auth/*` 예외)을 실패 테스트로 쓴다. `integration-test-writer`가 `get-my-profile`·`ensure-profile`을 쓴다. `e2e-test-writer`가 `blocked.spec.ts`·`left.spec.ts`와 퇴사 헬퍼를 쓴다
3. `implementer`가 `proxy.ts` → `resolveAuthDestination` → `dals` 둘 → 게이트 컴포넌트 → 라우트 정리 순으로 초록을 만든다. 서버 게이트를 먼저 빼면 그 사이 e2e 다섯이 빨갛다 — 게이트 컴포넌트가 선 뒤에 뺀다
4. `pnpm build && pnpm e2e`로 일곱 spec을 본다. `git diff --name-status origin/main -- tests/e2e`에 기존 다섯은 없어야 한다

배포한 적이 없어 호환 기간이 없다. 되돌리기는 브랜치를 버리는 것이다 — 데이터가 안 바뀐다.

## 리스크·전환·되돌리기

- **서버 게이트를 뺀 순간 e2e 다섯이 흔들린다.** `toHaveURL`이 기다리니 단언은 서지만, 껍데기가 첫 읽기 동안 아무것도 안 그리므로 `page.goto` 직후 요소를 찾는 단언은 이동이 끝난 뒤에 붙어야 한다. 기존 spec은 URL 단언이 먼저라 그대로 선다
- **읽기 실패의 모습이 정본에 없다.** `['profile']` 읽기나 `ensure_profile`이 통신에 실패했을 때 무엇을 보이는지 [design.md](../../2-design/modules/account/design.md#첫-진입과-게이트)가 안 정했다. 이 task는 「다시 시도」 하나만 두고, 문안과 짜임은 [login.md](../../2-design/modules/account/screens/login.md#아직-안-정한-것)로 보낸다 — Q-nn 하나를 그 문서에 더한다
- **차단 화면이 안 그려졌다.** `/blocked`의 짜임은 [login.md](../../2-design/modules/account/screens/login.md#아직-안-정한-것)가 열린 채다. 이 task는 목적지만 세우고 한 줄 문장을 그린다
- **`/pending`이 「제출 안 함」과 「승인 대기」를 같은 모습으로 그린다.** 프로필 작성 폼이 없어 `submitted_at`이 비어도 승인 대기 화면이 선다. 폼은 다음 task다 — 그때까지 실제 가입은 관리자가 승인해도 이름이 비어 있다
- **Service Worker는 아직 없다.** 정적 껍데기가 되는 것이 이 task고, Serwist로 캐시하는 것은 다른 task다

## 검증 방법

| 완료 조건·규칙 참조 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- |
| AC-01 | unit `src/__tests__/proxy.test.ts`(예정), e2e `home.spec.ts`의 정적 자원 케이스 | `pnpm test`, `pnpm e2e` | 정적 자산 통과, 세션 없음 → `/login`, `/login`·`/auth/*` 예외 |
| AC-02 | unit `src/shared/lib/__tests__/resolve-auth-destination.test.ts` | `pnpm test` | 다섯 목적지와 우선순위(차단 > 퇴사 > 승인), 「제 자리」 판정 |
| AC-03 | unit `src/features/auth/__tests__/`(예정), e2e 일곱 spec | `pnpm test`, `pnpm build && pnpm e2e` | 첫 읽기 동안 빈 화면, 읽은 뒤 이동, 탭 복귀에 다시 읽기 |
| AC-04 | integration `src/entities/profile/dals/__tests__/get-my-profile.integration.test.ts`·`ensure-profile.integration.test.ts`(예정) | `pnpm test:integration:run`, 로컬 Supabase | 자기 행만 읽힘, `ensure_profile` 멱등 |
| AC-05·AC-06 | e2e `tests/e2e/*.spec.ts` 일곱 | `pnpm build && pnpm e2e` | 기존 다섯 무수정 초록, `blocked`·`left` 초록, 새 사용자에게 프로필 행 |
| AC-07 | 전부 | 위 명령 전부 | 초록 |

## 범위 밖

- `/pending`의 프로필 작성 폼(`submit_profile` 호출)과 「거절된 뒤」 모습. [login.md](../../2-design/modules/account/screens/login.md#프로필-작성)가 정본이고 다음 task다
- `/left`의 화면 짜임([login.md](../../2-design/modules/account/screens/login.md#퇴사한-뒤))과 `/blocked`의 짜임(미정). 이 task는 목적지와 한 줄 문장까지다
- `/admin` 아래 역할 판정 — 관리자 화면 task
- Service Worker·Serwist·IndexedDB 영속 — 별도 task. `['profile']`은 그때도 영속하지 않는다
- 로그아웃·차단·퇴사 뒤 기기 정리(`queryClient.clear()`·영속본 삭제·푸시 구독 해제) — 영속과 푸시가 선 뒤
- 타입 생성(`pnpm types`) — `types-generation`
