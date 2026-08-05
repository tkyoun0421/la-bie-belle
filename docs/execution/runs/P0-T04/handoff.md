# P0-T04 handoff

## 2026-08-05 · 개발 단계 종료

- 작업 식별자: P0-T04 (환경변수와 애플리케이션 셸)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-05

### 확정된 사실

- 구현 착수 중 두 가지 도구 공백을 발견해 ask로 즉시 보고했다. 조정자가 사용자 결정을 받아 RADIO를 revision 2로 재승인·재봉인했다(개정 이력에 사유 기록). `index.jsonl`의 `development_approval`은 `radio_revision:2`, SHA-256(`e50e4682c19e0b745c2f313b2976da543a0ad34f603cee43220feebd7f4c8458`)이 정본이다.
  - `vitest.config.ts`에 tsconfig의 `@/*` 레이어별 alias가 없어 화면 컴포넌트 테스트가 정본 레지스트리(`@/shared/config/error-codes.config`)를 import하지 못했다. `vitest.config.ts`를 변경 허용 경로에 추가해 6개 레이어 alias(`resolve.alias`, 각 `test.projects` 항목에도 개별 적용 — Vitest projects는 루트 `resolve`를 자동 상속하지 않는다)를 추가했다.
  - `@testing-library/jest-dom`의 vitest 매처 타입 증강이 `tsconfig.json`의 `include`에 없는 `tests/setup-dom.ts`에만 걸려 있어 `tsc --noEmit`이 `toBeInTheDocument`·`toHaveAttribute`를 인식하지 못했다. 이건 RADIO 변경이 필요 없는 범위였다 — 각 컴포넌트 테스트 파일에 `import "@testing-library/jest-dom/vitest";`를 직접 추가해 해결했다(파일 하나에만 넣어도 TS 모듈 증강이 프로그램 전체에 적용되지만, 특정 파일 삭제가 다른 테스트를 조용히 깨뜨리지 않도록 사용하는 4개 파일 모두에 명시했다).
- **production 판정 확정**(미결 사항 해소): `env.server.ts`는 `Boolean(process.env.VERCEL_ENV)`, `env.client.ts`는 `Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)`를 production 신호로 쓴다. 형식·필수 검사는 환경 무관 상시(zod 스키마가 항상 실행), `changeme` placeholder 거부만 이 플래그로 게이팅한다. 로컬 `pnpm build`·`pnpm dev`는 Vercel 환경변수가 없어 placeholder를 그대로 통과하고, 실제 Vercel 배포에서만 거부된다.
- 정본 레지스트리(`src/shared/model/env.ts`)와 두 config 파일(`env.server.ts`·`env.client.ts`)을 RADIO Architecture대로 분리했다. 형식 검증(URL·이메일·비어있지않음)은 zod로 상시, `changeme`(대소문자 무시) 거부는 production에서만 한다. 오류 메시지는 키 이름과 사유만 담고 값은 담지 않는다(직접 확인: 문제 값 문자열이 메시지에 없음을 단언하는 테스트 포함).
- Supabase factory 2종(`shared/api/supabase-server.ts`, `shared/lib/supabase-browser.ts`)을 얇은 래퍼로 만들었다. 서버 쪽 쿠키 어댑터는 `getAll() { return []; }`만 두고 실제 세션 쓰기(`setAll`)는 미구현으로 남겼다(P1-T01 소유, RADIO 승인 범위 그대로).
- 상태 화면 3종(`ErrorScreen`·`AccessDeniedScreen`·`NotFoundScreen`)이 `ERROR_CODES`(P0-T37 정본)의 `COMMON_UNEXPECTED`·`COMMON_FORBIDDEN`·`COMMON_NOT_FOUND` 기본 문구를 표시하고 홈 링크를 제공한다. `app/error.tsx`·`app/global-error.tsx`·`app/not-found.tsx`가 이를 소비하는 얇은 어댑터다. `app/loading.tsx`는 별도 views 컴포넌트 없이 자체 skeleton이다. `AccessDeniedScreen`은 RADIO 설계 비목표(forbidden.tsx 채택은 P1)대로 아직 어떤 app 파일에도 연결되지 않았다.
- 오프라인 배너(`widgets/offline/ui/OfflineBanner` + `widgets/offline/hooks/useOnlineStatus`)를 만들어 `layout.tsx`에 상시 배치했다. `layout.tsx`는 `@/shared/config/env.server`를 부수효과로 import해 앱 시작(빌드·요청 렌더) 시점에 env 검증을 강제한다.
- `app/manifest.ts`가 이름 `라비에벨`, `theme_color` `#0052ff`, `background_color` `#ffffff`와 192·512 아이콘을 선언한다. `public/icons/`의 두 PNG는 ImageMagick·PIL이 환경에 없어 순수 Python(zlib)으로 만든 단색(#0052ff) placeholder다(실제 브랜드 자산은 비목표).
- `.env.example`을 RADIO Data model 그대로 채웠다. Supabase URL·anon key·service role key는 `supabase start`가 매번 생성하는 고정 로컬 데모 값(공개, 비밀 아님)을 실값으로 넣었다. `NEXT_PUBLIC_APP_URL`은 URL 형식이 상시 필수라 `http://localhost:3000`을 실질 기본값으로 넣었다(RADIO가 Supabase 외 URL 필드의 placeholder 관례를 명시하지 않아 로컬 개발 URL로 메운 구현 결정).
- **완료 기준 검증 결과**: `pnpm lint`·`pnpm typecheck`·`pnpm test`(19 files, 157 tests) 전부 통과. `.env.example`을 `.env`로 복사한 뒤 `pnpm build` 성공, `pnpm dev` 부팅 후 `curl localhost:3000`이 200과 부트스트랩 화면을 반환함을 확인했다(둘 다 검증 후 `.env` 삭제, 커밋하지 않음).
  - 필수 키 제거 시 시작 실패: `QR_SIGNING_SECRET`을 `.env`에서 지우고 `pnpm build`를 실행해 "QR_SIGNING_SECRET: 필수 값이 없습니다" 오류로 실패함을 확인(값 미노출), 이후 복구.
  - 서버 비밀 클라이언트 유출 차단: 임시로 `'use client'` 컴포넌트가 `@/shared/config/env.server`를 import하도록 만들어 `pnpm build`가 `server-only` 오류로 실패함을 확인한 뒤 파일을 삭제해 되돌렸다. 현재 코드베이스에는 서버 env를 실제로 소비하는 클라이언트 화면이 없어 (P1 이전) 빌드 산출물 문자열 스캔은 대조군 없이 공허하게 통과하므로, 이 임시 재현이 실질적 증거다.

### 미결 사항

- Google OAuth 변수의 실소비 형태와 스키마 정합화는 P1-T01이 정한다 — 결정 주체: AI(P1-T01 구현자), 반환할 단계: P1-T01 설계.
- `forbidden.tsx` 채택, 쿠키 세션 어댑터(`setAll` 실구현), correlation ID 생성·전파는 P1 이후가 소유한다 — 결정 주체: AI, 반환할 단계: 해당 task 설계.
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남겨 둔다.

### 다음 행동

1. 등록된 `check_ids`(`app-build`, `client-secret-scan`, `env-validation-test`, `status-screen-test`)와 관련 회귀를 검증 단계에서 실행한다.
2. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T04-review.json`에 기록한다.
3. 검증 통과 후 `index.jsonl`의 P0-T04를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `src/shared/model/env.ts`, `src/shared/model/env.test.ts`
- `src/shared/config/env.server.ts`, `src/shared/config/env.client.ts`
- `src/shared/api/supabase-server.ts`, `src/shared/api/supabase-server.test.ts`
- `src/shared/lib/supabase-browser.ts`, `src/shared/lib/supabase-browser.test.ts`
- `src/views/status/ui/ErrorScreen.tsx`·`AccessDeniedScreen.tsx`·`NotFoundScreen.tsx`와 각 `.test.tsx`
- `src/widgets/offline/hooks/useOnlineStatus.ts`(+test), `src/widgets/offline/ui/OfflineBanner.tsx`(+test)
- `src/app/loading.tsx`·`error.tsx`·`global-error.tsx`·`not-found.tsx`·`manifest.ts`(+test)·`layout.tsx`(수정)
- `public/icons/icon-192.png`, `public/icons/icon-512.png`
- `.env.example`, `eslint.config.mjs`(`ENV_MODULES` 2경로), `vitest.config.ts`(alias), `package.json`·`pnpm-lock.yaml`(zod·@supabase/supabase-js·@supabase/ssr)
- `docs/execution/radio/P0-T04-radio.md`(revision 2)
- `docs/execution/runs/P0-T04/tdd.json`(RED→GREEN 7쌍)
