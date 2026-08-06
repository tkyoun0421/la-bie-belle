# P0-T34 handoff

## 2026-08-06 · 개발 단계 종료

- 작업 식별자: P0-T34 (디자인 시스템 코드 구현)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-06
- 기준 커밋: `3935546`(RADIO revision 2 재봉인 커밋 — 이번 task의 구현은 이 커밋 위에서 진행했고, 아직 커밋하지 않은 작업 트리 변경이다)

### 확정된 사실

- 구현 착수 전 프로토타입으로 확인한 사실: RADIO revision 1의 기본 팔레트 비활성화(`--color-*: initial`) + 신설 lint 룰이, 이 RADIO의 변경 허용 경로 밖에 있던 기존 파일 5개(`src/app/loading.tsx`, `src/views/status/ui/{AccessDeniedScreen,ErrorScreen,NotFoundScreen}.tsx`, `src/views/bootstrap/ui/BootstrapScreen.tsx`)의 Tailwind 기본 팔레트 유틸(`bg-gray-200`, `text-gray-500/600/700`, `text-blue-600`)을 깨뜨림을 발견했다. 조정자가 사용자 결정을 받아 RADIO를 revision 2로 재승인·재봉인했다(SHA-256 `30432a7152017fef6a1dbf30f808477a32388f3c460c11e652048a5dd4f5cb13`, 커밋 `3935546`). Data model에 치환 매핑표를 추가하고 5개 파일을 변경 허용 경로에 편입했다: `bg-gray-200→surface-strong`, `text-gray-700→text`, `text-gray-600→text-muted`, `text-gray-500→text-muted`(대응 원시값 없어 근사, 사용자 결정), `text-blue-600→action`. 5개 파일 모두 정합화했고 `pnpm lint` 위반 0건을 확인했다.
- 폰트: `wanteddev/wanted-sans` 공식 GitHub release **v1.0.3**(`https://github.com/wanteddev/wanted-sans/releases/tag/v1.0.3`)의 `webfonts/variable/complete/woff2/WantedSansVariable.woff2`(SHA-256 `4259e7e9a172e634c2cb419d793b84148990316341e910443e5d10965b2c8f16`)와 동봉된 `OFL.txt`(SIL Open Font License 1.1)를 받아 `src/shared/config/fonts/`에 커밋했다. `src/shared/config/fonts.config.ts`가 `next/font/local`로 로드하고 `--font-wanted-sans` 변수와 명세의 대체 체인(`Wanted Sans, -apple-system, BlinkMacSystemFont, system-ui, Segoe UI, Apple SD Gothic Neo, sans-serif`)을 선언한다. `src/app/layout.tsx`의 `<html>`이 `wantedSans.variable`을 소비한다. **재현 확인**: production 빌드 산출물(`.next/server/app/index.html`)에서 `<link rel="preload" href="/_next/static/media/WantedSansVariable-....woff2" as="font" crossorigin type="font/woff2">`를 확인했다(자체 호스팅, 외부 CDN 없음). 컴파일된 CSS에 `font-display:swap`이 적용됨을 확인했다.
- `src/app/globals.css`에 FOUNDATIONS 표 값을 그대로 옮겼다: 원시 팔레트 14색(`--raw-*`, `@theme` 밖), 의미 토큰 7역할×3열(전경/배경/테두리 — 원시값과 정확히 일치하는 9개는 `var(--raw-*)`로 참조하고, FOUNDATIONS 고유 색인 12개는 리터럴 hex로 둠 — `action-surface`·`action-border`·`action-pressed-surface`·`success`·`warning`·`danger` 각 3열), 텍스트/표면/테두리 9종(전부 `var(--raw-*)` 참조), `typo-*` 8종(`@utility`, 크기·행간·굵기 결합), radius 5종, `--shadow-floating`, duration 3종(`150ms`·`200ms`·`250ms`, 명세 범위 안 Data model 표 값 그대로), 폰트 체인(`@theme inline`), `prefers-reduced-motion` 전역 규칙. `src/app/__tests__/globals.test.ts`(64 케이스)가 모든 값을 FOUNDATIONS·Data model 문자열과 대조 단언한다. `pnpm build` 산출물에서 `--color-gray-500`·`--color-blue-600` 등 기본 팔레트 변수가 전혀 생성되지 않음을 확인했다(팔레트 비활성화 재현).
- `tools/eslint-plugin-project/rules/design-token-colors.mjs`(신규)를 TDD로 구현해 `src/` 안 임의 색상값(`[#…]`·`rgb()`·`hsl()`·`oklch()`)과 Tailwind 기본 팔레트 클래스(샤드 번호 포함 22색 + `white`/`black`)를 차단한다. **구현 중 발견한 자체 버그**: 첫 구현이 샤드 번호를 선택적으로 취급해 우리 의미 토큰 `neutral`(샤드 없음)이 Tailwind 기본 팔레트의 `neutral` 계열과 이름이 겹쳐 오탐(false positive)을 냈다 — `text-neutral`이 실제 저장소에서 걸렸다. RuleTester에 회귀 fixture를 추가해 RED로 재현한 뒤, 샤드 번호가 있는 색상 이름과 `white`/`black`(샤드 없음)을 별도 패턴으로 분리해 GREEN으로 고쳤다(내 소유 파일의 구현 버그라 별도 ask 없이 직접 수정). `index.mjs`·`eslint.config.mjs`에 등록했고 `pnpm lint` 저장소 전체 위반 0건이다.
- `src/shared/lib/cn.ts`(`clsx`+`tailwind-merge`)를 TDD로 구현했다. `components.json`을 신설해 shadcn CLI 별칭을 `@/shared/ui`·`@/shared/lib/cn`으로 고정했다. 다만 **구현 방식 차이**: 로컬에 설치된 `shadcn` CLI(v4.16.1)가 RADIO 설계 시점과 다른 신규 아키텍처(`--base radix/base/aria`, preset, monorepo 감지 등)로 크게 바뀌어 있어 실행 결과가 예측 가능하지 않았다. Button·Input·Dialog는 RADIO가 명시한 기반 라이브러리(`@radix-ui/react-slot`, `@radix-ui/react-dialog`)를 CLI 없이 직접 설치해 손으로 구현했다 — CLI를 실행해 나온 코드를 정리하는 대신 처음부터 저장소 관례(주석 금지·alias import·kebab-case 파일)를 지키는 코드를 작성했다. 관찰 가능한 동작(치수·색·접근성)은 COMPONENTS.md·RADIO Data model과 동일하다.
- 공용 컴포넌트 10종(파일 12개, `src/shared/ui/`)을 TDD로 구현했다: `button.tsx`(radix Slot+cva, primary 56/16·secondary 48/14·tertiary 44·destructive 48/14·icon 44 원형, loading은 라벨 유지+진행 표시+`aria-busy`, `disabledReason`은 `aria-describedby`로 연결, `asChild` 지원), `input.tsx`+`select-field.tsx`(52px·radius 14·`surface-weak` 배경, 라벨 위·오류/도움말 아래 `aria-describedby`, select-field는 `bottom-sheet`를 염), `bottom-sheet.tsx`(vaul, 상단 radius 20, `dismissible`), `dialog.tsx`(radix dialog, `onOpenAutoFocus`로 기본 포커스를 취소 버튼에 고정 — 위험 행동 회피), `snackbar.tsx`(sonner 래퍼, `SnackbarProvider`+`showSnackbar` 한 쌍만 export, 화면은 sonner를 직접 import하지 않음), `badge.tsx`+`chip.tsx`(pill, chip은 `aria-pressed` 토글 버튼), `calendar.tsx`(react-day-picker v10, `weekStartsOn={0}`, `ko` locale, 커스텀 `DayButton`으로 6상태(`none`·`open`·`selected`·`requested`·`closed`·`confirmed`)를 렌더 — `none`만 `disabled`, 나머지는 탭 가능), `schedule-row.tsx`·`notification-row.tsx`(직접 구현, 행 전체가 버튼이고 접근 가능한 이름에 날짜/상태를 포함), `connectivity-banner.tsx`(직접 구현, `offline`/`recovered`/`online` 3상태 props). 각 종마다 렌더·상태 전환·접근성(role·aria·접근 가능한 이름) component-test를 작성했다.
- **jsdom 테스트 환경 한계 발견**: `@testing-library/react`의 `render()`가 이 저장소의 vitest 설정(`globals: true` 미설정)에서 테스트 간 자동 cleanup되지 않아, 한 파일에 여러 `it()`가 있으면 DOM이 누적돼 "여러 요소 발견" 오류가 난다 — 각 컴포넌트 테스트 파일에 `afterEach(cleanup)`을 직접 추가해 해결했다(공유 `tests/setup-dom.ts`는 이 RADIO의 변경 허용 경로 밖이라 건드리지 않았다). 또한 jsdom이 `setPointerCapture`를 구현하지 않아 `vaul`(bottom-sheet)·`sonner`(snackbar) 상호작용 테스트가 uncaught exception을 던졌다 — 필요한 두 테스트 파일에 `Element.prototype.setPointerCapture` 등 no-op 폴리필을 로컬로 추가해 해결했다. 두 문제 모두 내 테스트 파일 안에서 해결했고 공유 설정 파일은 변경하지 않았다.
- `src/widgets/offline/ui/OfflineBanner.tsx`를 `useOnlineStatus` 훅은 그대로 두고 표현만 `ConnectivityBanner` 소비로 교체했다(hex 하드코딩 제거). 기존 테스트의 hex 단언을 의미 토큰(`bg-warning-surface`·`text-warning`) 단언으로 바꿔 RED→GREEN을 재현했다. RADIO의 이번 교체 범위는 "표현 교체"로 한정돼 있어, COMPONENTS.md가 설명하는 "복구 시 짧은 안내 후 사라짐"(`recovered` 상태) 전이 로직은 이번 범위에 포함하지 않았다 — 미결 사항에 남긴다.
- 카탈로그: `src/views/catalog/ui/CatalogView.tsx`(10종·각 주요 상태 나열) + `src/app/catalog/page.dev.tsx`(얇은 어댑터). `config/fsd.json`의 `appLayer.exemptFiles`에 `page.dev.tsx`를 추가했다. `next.config.ts`의 `pageExtensions`를 `process.env.NODE_ENV === "development"`일 때만 `dev.tsx`를 포함하도록 분기했다. **재현 확인**: `pnpm build` 산출물의 라우트 목록은 `/`·`/_not-found`·`/manifest.webmanifest` 뿐이고 `/catalog`가 없다. `pnpm dev`로 로컬 서버를 띄워 `GET /catalog`가 200과 10종 컴포넌트 텍스트를 포함한 HTML을 반환함을 확인했다(서버 로그에 오류·경고 없음).
- `docs/standards/DEVELOPMENT.md`에 "디자인 토큰" 절과 `DEV-TOKEN-01`(`MUST`)을 신설했다. 기존 절 문구는 건드리지 않았다.
- 검증 결과: `pnpm verify` 전체가 `docs/execution/runs/P0-T34/handoff.md` 부재로 인한 `gate:handoff` 실패 직전까지 전부 통과했다 — `format:check`·`lint:ci`(타입 인지 규칙 포함)·`typecheck`·`test`(36 files, 305 tests)·`harness:typecheck`·`harness:self-test`(140/140)·`check:docs`·`build`·`check:app-build`·`check:client-secret-scan`·`test:e2e`(1/1) 모두 통과, "Creating an optimized production build" 로그가 정확히 1회만 나타남을 재확인했다(빌드 재사용 경로 유지).

### 미결 사항

- `ConnectivityBanner`의 `recovered`(복구 시 짧은 피드백 후 자동 소멸) 전이는 `OfflineBanner`에 아직 연결하지 않았다 — RADIO의 이번 교체 범위가 "표현 교체"로 한정돼 있었다. 타이머·이전 상태 추적이 필요한 새 훅 로직이라 범위 확대가 필요하다 — 결정 주체: 사용자, 반환할 단계: 해당 task 설계(신설 또는 P0-T34 후속 확장).
- shadcn CLI를 실제로 실행하지 않고 Button·Input·Dialog를 손으로 구현했다(위 "확정된 사실" 참고). CLI 최신 아키텍처를 확인하고 실제로 맞춰볼지 여부는 후속 판단이 필요하다 — 결정 주체: 사용자, 반환할 단계: 후속 UI task.
- `tests/setup-dom.ts`에 `afterEach(cleanup)`과 pointer-capture 폴리필을 중앙화하면 반복 보일러플레이트를 줄일 수 있으나 이 RADIO의 변경 허용 경로 밖이라 손대지 않았다 — 결정 주체: 사용자, 반환할 단계: 하네스/테스트 인프라 정비 task.
- RADIO 자체 미결 사항 3건(완전 삭제형 dialog는 관리자 라운드 소유, 앱·알림 아이콘 자산은 별도 제작, 기본 팔레트 비활성화로 이후 화면 task는 의미 토큰을 먼저 추가해야 함)은 그대로 유효하다.
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남긴다.

### 다음 행동

1. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T34-review.json`에 기록한다.
2. `ConnectivityBanner`의 `recovered` 전이 연결 여부를 후속 task로 등록할지 판단한다.
3. 검증 통과 후 `index.jsonl`의 P0-T34를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `src/app/globals.css`, `src/app/__tests__/globals.test.ts`
- `src/shared/config/fonts.config.ts`, `src/shared/config/fonts/{WantedSansVariable.woff2,OFL.txt}`
- `components.json`, `src/shared/lib/cn.ts`, `src/shared/lib/__tests__/cn.test.ts`
- `tools/eslint-plugin-project/rules/design-token-colors.mjs`(+ 테스트), `index.mjs`, `eslint.config.mjs`
- `src/app/loading.tsx`, `src/views/status/ui/*.tsx`, `src/views/bootstrap/ui/BootstrapScreen.tsx`(의미 토큰 치환)
- `src/shared/ui/`(컴포넌트 10종, 12파일 + 테스트)
- `src/widgets/offline/ui/OfflineBanner.tsx`(+ 테스트)
- `src/views/catalog/ui/CatalogView.tsx`, `src/app/catalog/page.dev.tsx`, `next.config.ts`, `config/fsd.json`
- `docs/standards/DEVELOPMENT.md`(디자인 토큰 절, `DEV-TOKEN-01`)
- `docs/execution/radio/P0-T34-radio.md`(revision 2)
- `docs/execution/phases/index.jsonl`(P0-T34 `in_progress`, `development_approval` revision 2)
- `docs/execution/runs/P0-T34/tdd.json`
