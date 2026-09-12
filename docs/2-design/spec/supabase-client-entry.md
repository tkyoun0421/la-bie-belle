---
status: approved
---

# Supabase 서버 클라이언트의 진입점을 하나로 모으고 인증 게이트를 features로 옮긴다

`createSupabaseServerClient(await cookies())`가 `src/app/` 네 곳에 같은 모양으로 있다. 호출자마다 Next의 `cookies()`를 알아야 하고, 화면이 늘면 같은 줄이 화면 수만큼 는다. 미들웨어만 저장소가 달라 `request.cookies`를 손수 감싼다. 두 팩토리의 `requireEnv`도 글자까지 같은 복제다. 한편 `src/app/auth-gate.ts`는 `entities`와 `shared`를 같이 부르는 조립 코드인데 훅이 안 보는 자리에 있어 e2e만 배선을 밟는다 — 관찰 007이 연 것이다. 아키텍처 리뷰(`docs/log/2026-09-11.md`)의 후보 B·C·D·E를 한 PR로 닫는다.

## 완료 조건

- `src/shared/lib/read-supabase-env.ts`가 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 읽어 `{ url, anonKey }`로 돌려준다. 둘 중 하나라도 비어 있으면 지금 두 팩토리가 던지는 것과 같은 문구로 그 자리에서 던진다. 두 팩토리가 이 함수를 부르고 자기 `requireEnv`를 지운다. 기존 팩토리 테스트의 env 단언은 고치지 않은 채 그대로 통과한다.
- `src/shared/lib/create-supabase-request-client.ts`가 인자 없이 `next/headers`의 `cookies()`를 안에서 받아 `createSupabaseServerClient`에 넘긴 결과를 돌려준다. 호출자는 `cookies()`를 모른다. `createSupabaseServerClient(store)`는 그대로 남는다 — 미들웨어처럼 저장소가 다른 자리의 진입점이다.
- `src/app/auth-gate.ts`·`src/app/login/actions.ts`·`src/app/auth/callback/route.ts`·`src/app/auth/logout/route.ts`가 새 진입점을 쓴다. 저장소에서 `createSupabaseServerClient(await cookies())`가 사라진다.
- `src/features/auth/read-auth-gate.ts`가 클라이언트를 받아 목적지와 계정을 돌려준다 — 지금 `src/app/auth-gate.ts`의 `readAuthGate`와 `googlePhotoOf`, `AuthGate`·`SignedInAccount` 타입이 여기로 온다. `next/*`를 import하지 않는다. 짝 테스트 `src/features/auth/__tests__/read-auth-gate.test.ts`가 가짜 클라이언트로 세션 없음·승인 전·승인 후와 아바타 키 둘(`avatar_url`·`picture`)을 확인한다.
- `src/app/auth-gate.ts`에는 `enterRoute`·`enterPendingRoute`만 남는다. 하는 일은 클라이언트를 만들어 `readAuthGate`에 넘기고 `redirect`하는 것뿐이다.
- `scripts/tokens-md.mts`가 `SUBSECTION`을 export하고 `scripts/generate-globals-css.mts`가 그것을 import한다. 정규식 정의가 한 곳이 된다. `pnpm tokens:css`의 출력이 바뀌지 않는다.
- ADR-001 「레이어」에 조립의 자리가 한 문단 선다 — 여러 계층을 묶는 조립은 `features`에 두고, `src/app/`의 `.ts`는 Next API를 부르는 위임만 한다. 관찰 007이 `actioned`로 닫힌다.
- e2e 11개가 고치지 않은 채 초록이다. 동작은 하나도 바뀌지 않는다.

## 범위 밖

- ADR-003 「클라이언트는 `dals`에서만」과 `shared/lib/get-current-user.ts`·`handle-auth-callback.ts`의 어긋남. 클라이언트를 받아 쓰는 함수가 `shared/lib`에 있는 것이 그 조항과 맞는지는 따로 본다.
- `tdd-guard-unit.py`의 `SKIP_PREFIXES`에서 `src/app/`을 빼는 것. 조립이 `features`로 나가면 `src/app/`의 `.ts`는 위임뿐이라 짝 테스트를 요구할 것이 없다.
- `tokens-md.mts`의 절 나누기를 `tests/lint/markdown.ts` 위로 옮기는 것. `scripts/`가 `tests/lint/`를 import하는 방향이 낯설고, `###`를 순서대로 훑는 모양과 제목 하나를 찾는 `section()`의 모양이 다르다.
