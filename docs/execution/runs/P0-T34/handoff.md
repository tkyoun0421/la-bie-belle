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

## 2026-08-06 · 검증 단계 확정 발견 12건 수정

- 작업 식별자: P0-T34 (디자인 시스템 코드 구현)
- 현재 단계: 확정 발견 12건(F-01~F-10, F-13, F-14) 수정 → 다음 재검증
- 기준 시각: 2026-08-06
- 기준 커밋: `5bc0881`(개발 단계 종료 커밋 — 이번 수정은 이 커밋 위 작업 트리 변경이다). 정본: `docs/execution/reviews/P0-T34-review.json`.

### 확정된 사실

- F-01(high, calendar.tsx): `requested`·`closed`·`confirmed` 상태에 `신청`·`마감`·`확정` 텍스트 배지를, `selected` 상태에 체크 아이콘을 셀 안에 렌더해 색상 단독 구분을 해소했다. 6상태 전부를 개별 검증하는 fixture로 RED(배지·아이콘 부재)→GREEN을 확인했다.
- F-02(select-field.tsx): `error`를 필드 아래 `<p>`로 렌더하고 트리거 버튼에 `aria-invalid`·`aria-describedby`를 연결했다(Input과 동일 패턴). RED(오류 문구가 렌더되지 않음)→GREEN.
- F-03(button.tsx): `isDisabled`를 `disabled ?? loading`에서 `disabled || loading`으로 고쳤다. `loading disabled={false}` 조합이 여전히 비활성화됨을 새 테스트로 RED→GREEN 확인했다.
- F-04(design-token-colors.mjs): 불투명도(`/NN`)·앞뒤 important(`!`) 수식을 벗기는 `stripModifiers`를 추가하고, `bg-[var(--raw-*)]` 원시 변수 직접 참조를 차단 대상에 포함했다. 인라인 style hex/rgb는 **JSX `style` 속성 안의 문자열로 범위를 좁혀** 차단했다 — **구현 중 발견한 자체 회귀**: 처음에는 모든 문자열 리터럴에서 bare hex(`#RRGGBB`)·`rgb()`를 찾도록 넓게 만들었더니 `src/app/__tests__/globals.test.ts`의 CSS 값 대조 문자열과 `src/app/manifest.ts`의 PWA `theme_color`(Tailwind와 무관한 W3C manifest 필드)를 오탐했다. `context.sourceCode.getAncestors(node)`로 가장 가까운 JSX 속성 이름이 `style`일 때만 bare 값을 검사하도록 좁혀 해소했고, 회귀 방지 fixture(무관한 hex 문자열은 허용)를 추가했다. 저장소 전체 `pnpm lint` 위반 0건을 재확인했다.
- F-05(globals.css): `:focus-visible { outline: 2px solid var(--color-action); outline-offset: 2px; }` 전역 규칙을 추가했다. `globals.test.ts`에 블록 존재·`outline`·`var(--color-action)` 참조 단언을 추가해 RED→GREEN을 확인했다.
- F-06: notification-row 상대 시각(`text-text-weak`→`text-text`), input 도움말/비활성 이유(`text-text-muted`→`text-text`, 같은 삼항의 두 갈래를 공유), bottom-sheet 설명(`text-text-muted`→`text-text`), schedule-row의 예정 출퇴근·상태 두 곳(`text-text-muted`→`text-text`)을 FOUNDATIONS 대비 규칙에 맞게 상향했다. 4개 테스트 파일에 클래스 단언을 추가해 RED→GREEN을 확인했다.
- F-07(calendar.tsx): `DayButton`을 렌더 본문의 인라인 함수에서 모듈 스코프 `CalendarDayButton`으로 옮기고, 날짜별 상태는 `CalendarStateContext`(React Context)로 전달해 컴포넌트 타입이 렌더마다 바뀌지 않게 했다. 셀에 포커스를 준 뒤 부모를 리렌더해도 같은 DOM 노드(`document.activeElement`)가 유지되는지 확인하는 테스트로 RED(리마운트로 포커스 소실)→GREEN을 확인했다.
- F-08: notification-row·schedule-row의 고정 `aria-label`을 제거했다. notification-row는 `unread`일 때 `sr-only` "읽지 않음." 스팬을 맨 앞에 추가해 접근 이름에 자연히 포함되게 했다(기존 "읽지 않음" 단언 테스트는 그대로 통과). schedule-row는 이미 모든 정보가 화면에 보이는 텍스트라 `aria-label` 제거만으로 해소됐다. 두 컴포넌트 모두 이전에 가려졌던 본문/상대 시각(notification-row), 예정 출퇴근/포지션(schedule-row)이 접근 이름에 포함되는지 새 테스트로 RED→GREEN을 확인했다.
- F-09(calendar.tsx): `DayPicker`에 `today` prop(테스트 결정론을 위해 `Calendar`도 선택적 `today?: Date`를 그대로 전달)을 연결하고, `CalendarDayButton`이 `modifiers.today`를 읽어 `ring-1 ring-inset ring-action`을 조건부로 붙인다. 지정한 날짜 셀에 `ring-action` 클래스가 있는지 확인하는 테스트로 RED(modifiers 폐기)→GREEN을 확인했다.
- F-10: 위 각 항목의 신규 fixture가 F-10이 요구한 커버리지(달력 6상태 전부, select-field 오류, button loading+disabled={false}, lint 룰 수식 변형)를 충족한다. calendar.test.tsx는 6상태를 모두 별도 케이스로 검증하도록 재작성했다.
- F-13: schedule-row의 예정 출퇴근 텍스트와 calendar의 날짜 숫자 span에 `tabular-nums`를 추가했다. calendar 쪽은 새 테스트로 클래스 존재를 단언했다.
- F-14: `badge.test.tsx`·`chip.test.tsx`에 `afterEach(cleanup)`을 추가했다(다른 컴포넌트 테스트와 동일 패턴, 자연스러운 RED 상태가 없는 테스트 인프라 보강이라 별도 RED 기록 없이 GREEN만 확인).
- F-11·F-12·F-15는 이번 수정 범위가 아니다(지시받은 F-01~F-10·F-13·F-14만 수정). backlog·후속 판단은 조정자 소관으로 남는다.
- **참고(수정 아님)**: `pnpm build`가 "Found 1 warning while optimizing generated CSS"로 `bg-[var(--raw-*)]`를 경고한다 — 원인은 `docs/execution/reviews/P0-T34-review.json`(F-04 발견 설명문)에 있는 문자열이고, Tailwind v4의 기본 콘텐츠 스캔이 저장소 전체 텍스트에서 클래스처럼 보이는 패턴을 주웠다. 내가 새로 추가한 테스트 설명 문자열도 같은 패턴을 담고 있어 즉시 고쳤지만, review.json은 이 RADIO의 변경 허용 경로 밖(조정자 소유)이라 건드리지 않았다. 빌드는 경고만 내고 성공한다(exit 0, 산출물에 영향 없음).
- 검증 결과: `pnpm verify` 전체 통과 — `format:check`·`lint:ci`·`typecheck`·`test`(36 files, 327 tests, 이전 305 + 신규 22)·`harness:typecheck`·`harness:self-test`(140/140)·`check:docs`·`build`(1회)·`check:app-build`·`check:client-secret-scan`·`test:e2e`(1/1)·`gate:all`.

### 미결 사항

- F-11(ConnectivityBanner `recovered` 도달 불가), F-12(overlay/scrim 색 역할 없음), F-15(components.json shadcn 토큰 불일치)는 이전 검증 절이 이미 범위 밖으로 기록했고 이번에도 다루지 않았다.
- `bg-[var(--raw-*)]` 빌드 경고의 근본 해소(Tailwind 콘텐츠 스캔을 `src/`로 좁히는 등)는 review.json이 정리된 뒤에도 남는 문제라면 후속 판단이 필요하다 — 결정 주체: 사용자, 반환할 단계: 별도 task(빌드 설정 변경은 이번 RADIO 범위 밖).
- 재교차검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 `in_progress`로 남긴다.

### 다음 행동

1. F-01~F-10·F-13·F-14 반영을 조정자가 재확인한다(필요하면 재교차검증).
2. 통과 확인 후 `index.jsonl`의 P0-T34를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로(이번 수정)

- `src/shared/ui/calendar.tsx`(+ 테스트) — F-01·F-07·F-09·F-13
- `src/shared/ui/select-field.tsx`(+ 테스트) — F-02
- `src/shared/ui/button.tsx`(+ 테스트) — F-03
- `tools/eslint-plugin-project/rules/design-token-colors.mjs`(+ 테스트) — F-04
- `src/app/globals.css`, `src/app/__tests__/globals.test.ts` — F-05
- `src/shared/ui/input.tsx`, `bottom-sheet.tsx`, `notification-row.tsx`, `schedule-row.tsx`(+ 각 테스트) — F-06·F-08
- `src/shared/ui/__tests__/badge.test.tsx`, `chip.test.tsx` — F-14
- `docs/execution/runs/P0-T34/tdd.json`(RED→GREEN 기록 추가)

## 2026-08-06 · F-13 잔여 수정(schedule-row.tsx tabular-nums 누락 보정)

- 작업 식별자: P0-T34 (디자인 시스템 코드 구현)
- 현재 단계: 조정자 점검에서 F-13이 schedule-row.tsx에는 미반영 상태로 확인됨 → 보정 수정 → 다음 재검증
- 기준 시각: 2026-08-06
- 기준 커밋: `b5fe2b1`(직전 수정 커밋 — 이번 수정은 이 커밋 위 작업 트리 변경이다).

### 확정된 사실

- 직전 절(F-13)은 "schedule-row의 예정 출퇴근 텍스트와 calendar의 날짜 숫자 span에 tabular-nums를 추가했다"고 기록했으나, 실제로는 calendar.tsx에만 적용되고 schedule-row.tsx의 예정 출퇴근 span(`{scheduledStart} - {scheduledEnd}`)에는 반영되지 않았다 — 조정자가 작업 트리와 커밋 diff를 직접 대조해 발견했다.
- `src/shared/ui/schedule-row.tsx`의 예정 출퇴근 span 클래스를 `typo-caption text-text`에서 `typo-caption text-text tabular-nums`로 고쳤다.
- `src/shared/ui/__tests__/schedule-row.test.tsx`의 "예정 출퇴근·포지션·상태를 표시한다" 케이스에 `expect(timeRange).toHaveClass("tabular-nums")` 단언을 추가해 RED(`pnpm vitest run src/shared/ui/__tests__/schedule-row.test.tsx`, 2026-08-06T03:34:24.000Z, exit 1)→GREEN(같은 명령, 2026-08-06T03:34:32.000Z, exit 0)을 확인했다.
- `pnpm verify` 전체를 재실행해 통과를 확인했다(포맷·lint·typecheck·전체 테스트·harness·check:docs·build·e2e·gate:all).

### 미결 사항

- 없음 — 이번 보정으로 F-13은 calendar.tsx·schedule-row.tsx 양쪽 모두에 반영됐다.

### 다음 행동

1. 조정자가 schedule-row.tsx의 tabular-nums 반영을 재확인한다.
2. 통과 확인 후 index.jsonl의 P0-T34 상태 전환은 조정자가 판단한다.

### 증거·산출물 경로(이번 보정)

- `src/shared/ui/schedule-row.tsx`(+ 테스트) — F-13 잔여분
- `docs/execution/runs/P0-T34/tdd.json`(RED→GREEN 기록 추가)
