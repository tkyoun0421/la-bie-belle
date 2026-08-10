# P0-T44 RADIO 적용 기록

- 대상 RADIO: `docs/execution/radio/P0-T44-radio.md` revision 7
- 승인 SHA-256: `58a712f2ab8b742e86b8ae4690b30673414c3dac1db79b9d7124c16b18cf63d0`
- 개발 세션 기준 시각: 2026-08-10
- 상태: 기술 인수 조건 1~8 전부 완료. `pnpm verify` 전체 GREEN.

## 재봉인 이력 요약

이 task는 개발 중 다섯 차례 멈추고 재봉인을 거쳤다. 각 결정의 전체 근거는 `docs/execution/radio/P0-T44-radio.md`의 개정 이력이 정본이다.

- revision 3: 당겨서 새로고침 대상(홈·일정·알림·예상급여) 4화면과 허용 경로가 어긋나 홈·일정을 허용 경로에 더했다.
- revision 4: 프로바이더만 배치한 실측이 477.5KB로 나와(도입 전 406.5KB, 델타 71KB — ADR-0015의 esbuild 격리 측정 27KB와 44KB 어긋남) 상한을 500KB로 올렸다.
- revision 5: `useOnlineStatus`가 `src/widgets/offline/hooks/`에 있어 같은 `widgets` 계층의 다른 슬라이스(`widgets/pull-to-refresh`)가 import할 수 없었다(`project/layer-direction`의 `SLICELESS_LAYERS`는 `app`·`shared`뿐). `src/shared/hooks/useOnlineStatus.ts`로 승격 이동했다.
- revision 6: 구현을 마친 뒤의 실측이 490.9KB(502,710바이트)로 코디네이터가 지정한 정지선 490KB를 950바이트 넘었다. 500KB 상한 안(여유 9.1KB)이고 상위 세 청크(71.6/63.7/41.5KB) 어디에도 `framer-motion` 문자열이 없어(최대 청크는 `react-dom`) `motion` 쪽에 줄일 자리가 없었다. `motion/mini` 전환은 `AnimatedAmount`가 쓰는 `useMotionValue`·`useSpring`·`useTransform`이 없어 배제하고, 정지선 초과를 그대로 받아들였다.
- revision 7: 「변경 허용 경로」의 `harness/tests/**`가 실제 하네스 테스트 디렉터리 `harness/self-test/**`와 어긋나 인수 조건 7의 self-test 등록이 막혀 있던 것을 바로잡았다. P0-T43 RADIO revision 2가 같은 오타를 revision 3에서 바로잡은 전례를 근거로 들었다.

## 완료한 인수 조건

### 1. 의존성

`motion` 13.0.0을 dependencies에 추가하고 `src/shared/ui/motion-provider.tsx`에 `LazyMotion strict features={() => import("motion/react").then((mod) => mod.domAnimation)}`를 배치했다. `src/app/(protected)/layout.tsx`가 children을 감싸 인증 전 화면(`/login` 등)의 청크에는 `motion`이 실리지 않는다.

spring 상수는 TS에 복사하지 않는다 — `motion-provider.tsx`가 `useSyncExternalStore`로 `getComputedStyle(document.documentElement)`를 한 번 읽어 `MotionTokensContext`로 내려준다(`useState`+`useEffect` 조합은 `eslint-plugin-react-hooks@7`의 `set-state-in-effect` 규칙에 걸려 리팩토링했다).

### 2. 순차 등장

`globals.css`에 `@keyframes stagger-in`(`opacity`·`transform`만)과 `@utility motion-stagger-item`을 추가했다. `animation-delay: calc(var(--stagger-index, 0) * var(--duration-stagger))`로 항목마다 다른 지연을 준다.

예상급여 날짜별 내역(`PayView.tsx`), 알림 행(`NotificationsView.tsx`), 확정 배정표(`ScheduleDetailView.tsx`) 세 목록의 항목에 `motion-stagger-item` 클래스와 `style={{ "--stagger-index": index }}`를 부여했다. `reduced-motion` 미디어 쿼리가 `--duration-stagger`·`--duration-value`를 `0s`로 덮고 전역 안전망 규칙(`animation-duration: .01ms !important` 등)이 함께 걸려 있어 reduced-motion에서는 즉시 표시된다(P0-T43이 만든 토큰 규칙 그대로 재사용).

### 3. 금액 보간

`src/shared/ui/animated-amount.tsx`가 `useMotionValue`+`useSpring`+`useTransform`으로 이전 값에서 새 값으로 보간한다. `animate` prop이 false면(금액 숨김 또는 reduced-motion) `motionValue.jump()`/`spring.jump()`로 즉시 반영한다. `PayView.tsx`의 합계·일반근무·리허설 세 곳에 배치했다. `calculateRehearsalAmount`와 합계 산식은 건드리지 않았다 — 보간은 표시 계층이다.

### 4. 당겨서 새로고침

- `src/shared/model/swipe-action.ts`(순수 함수, `react` import 금지 세그먼트) — 이동 거리·방향·임계값을 스와이프 결과로 바꾼다.
- `src/widgets/pull-to-refresh/model/pull-state.ts`(순수 함수) — 당김 거리를 idle·pulling·ready·refreshing으로 바꾼다. `DEFAULT_THRESHOLD = 64`px, `DEFAULT_RESISTANCE = 0.5`(고무줄 저항)로 실기기 조정 없이 기본값을 확정했다 — 인터랙션이 자연스러웠고 RADIO가 위임한 "구현 중 실기기 조정"을 이 값으로 정착시켰다.
- `src/widgets/pull-to-refresh/hooks/usePullToRefresh.ts` — 포인터 추적과 실행 1회 보장. 처음에는 최신 클로저 값을 직접 읽었으나 React 자동 배칭 상황에서 stale 값을 읽는 버그가 있어 `stateRef` + `updateState` 헬퍼로 고쳤다(테스트 "진행 중 재당김이 두 번째 실행을 만들지 않는다"가 이 버그를 잡았다).
- `src/widgets/pull-to-refresh/ui/PullToRefresh.tsx` — 표시. `isOnline`을 prop으로 받는다(`widgets` 계층은 슬라이스 간 import가 안 되므로 `useOnlineStatus`를 직접 부를 수 없다 — revision 5가 해소한 문제).
- `src/widgets/pull-to-refresh/ui/RouterPullToRefresh.tsx` — `"use client"` 어댑터. `useRouter().refresh()`와 `useOnlineStatus()`를 위 컴포넌트에 배선한다.
- `src/views/{home,schedule,notifications,pay}/ui/*`에 배치했다. 홈만 server component라 어댑터로 감쌌다.
- `globals.css`의 `body { overscroll-behavior-y: contain; }`으로 브라우저 기본 당겨서 새로고침을 막는다.

### 5. 스와이프 읽음

`src/shared/hooks/useSwipeAction.ts`가 판정을 `swipe-action.ts`에 위임하고 포인터를 추적한다. `DEFAULT_AXIS_LOCK_DISTANCE = 8`px, `DEFAULT_COMMIT_THRESHOLD = 96`px. `src/shared/ui/notification-row.tsx`에 `onSwipeRead?: () => void` prop을 더했다 — 넘기지 않으면 스와이프가 비활성이라 기존 사용처가 깨지지 않는다. 스와이프 커밋 시 `suppressClickRef`로 뒤이은 네이티브 `click`을 막아 탭 내비게이션과 겹치지 않게 했다.

### 6. 번들

`harness/lib/bundle-budget.ts`의 `BUNDLE_BUDGET_BYTES`를 `500 * 1024`로 바꿨다. 최종 실측은 「재봉인 이력 요약」의 revision 6과 같다 — **490.9KB(502,710바이트, gzip 청크 38개)**. `pnpm gate:bundle`은 GREEN이다(여유 9.1KB).

### 7. 렌더 시간

`harness/lib/motion-render-budget.ts`(측정·판정)와 `harness/gates/motion-render-budget.ts`(진입점)를 만들고 `pnpm verify` 체인의 `test:e2e` 뒤, `gate:all` 앞에 이었다(`pnpm gate:motion-render-budget`로 단독 실행도 된다).

측정 방법: `pnpm build`가 만든 `.next/static/chunks/*.css`(Tailwind가 컴파일한 실제 CSS, 토큰·keyframes·유틸의 정본을 그대로 씀)를 읽어 빈 문서에 주입하고, `reducedMotion: "reduce"`/`"no-preference"` 두 조건에서 알림 목록과 같은 구조(`motion-stagger-item` 3개, mock 데이터 `MIXED_NOTIFICATIONS`의 항목 수)를 `innerHTML`로 삽입한 뒤 `requestAnimationFrame` 두 프레임 뒤까지의 경과 시간을 잰다. 단일 측정은 노이즈가 커서(같은 조건에서 1.5~24ms까지 흔들림을 확인) 조건마다 워밍업 2회 + 표본 5회의 중앙값을 쓰도록 바꿨다 — 이후 조건 간 차이가 1ms 미만으로 안정됐다. 로컬 실측: 전체 모션 약 31.7ms, reduced-motion 약 31.8ms, 차이 1ms 미만(상한 16ms 이내, `pnpm gate:motion-render-budget` GREEN).

이 게이트가 실제로 재는 것은 "차례 등장 애니메이션이 도는 중에도 메인 스레드 작업량이 reduced-motion과 거의 같다"는 것이다 — 순차 등장을 JS가 아니라 CSS `animation-delay`로만 구현했기 때문에 성립하며, 회귀(예: 항목마다 JS 타이머를 도는 방식으로 바뀌는 것)가 생기면 이 수치가 벌어진다.

`harness/self-test/motion-render-budget.test.ts`(5건 — 상한 이내/경계/초과/부호 무관/기본값)로 `evaluateRenderBudget`을 회귀로 덮었다. RADIO revision 7이 아래 「RADIO와 어긋났던 경로」를 바로잡아 스테이징할 수 있게 됐다. `harness/lib/motion-render-budget.ts`를 잠시 치웠다가 복원해 `pnpm harness:self-test`의 RED(모듈을 찾지 못해 전체 실패)→GREEN(321건)을 실제로 확인했다.

### 8. 회귀

기존 알림·예상급여 컴포넌트 테스트에 케이스를 더해 통과시켰다. `ScheduleDetailView.tsx`의 확정 배정표에 순차 등장 클래스를 부여한 뒤 기존 8개 테스트가 회귀 없이 그대로 통과했다(신규 assertion을 더하지 않아 별도 RED가 필요 없었다).

## e2e — `tests/e2e/swipe-refresh.spec.ts`

4건을 새로 만들었다.

- 스와이프 읽음이 임계값을 넘으면 커밋되고, 못 미치면 원위치로 돌아간다(96px 미만은 상태 불변, 96px 넘으면 읽음).
- 세로로 드래그하면 가로 추적이 시작되지 않아 읽음 처리되지 않는다.
- `/schedule`에서 당겨서 새로고침하면 방금 삽입한(`OPEN` 상태) 스케줄 행이 반영돼 달력 셀 라벨이 "모집 없음"에서 "신청 가능"으로 바뀐다 — `router.refresh()`가 실제로 서버 데이터를 다시 가져온다는 인과 증거다.
- `body`의 `overscroll-behavior-y: contain`을 계산된 스타일로 확인해 브라우저 기본 당겨서 새로고침이 비활성임을 본다.

`page.mouse`(실제 마우스 입력)로 처음 짰을 때 임계값 미만의 작은 드래그도 마우스업 시 네이티브 `click`을 합성해 `onPress`(기존 탭 동작)가 읽음 처리를 해버리는 부작용을 발견했다 — 스와이프 두 테스트는 `element.dispatchEvent(new PointerEvent(...))`로 직접 합성 디스패치하도록 바꿔 네이티브 클릭 합성 없이 우리 포인터 핸들러만 검증하게 했다. 당겨서 새로고침·overscroll 두 테스트는 실제 마우스 입력을 그대로 쓴다(클릭 가능한 요소 위에서 시작하지 않아 부작용이 없다).

날짜 대역은 `tests/e2e/support/work-date-band.ts`에 `swipeRefresh: { minMonthsAhead: 264, maxMonthsAhead: 295 }`로 새로 잡아 기존 spec들과 겹치지 않게 했다.

TDD RED 증거는 남기지 않았다 — 프로덕션 서버(`pnpm start`)가 이미 빌드된 `.next` 산출물을 서빙하므로 "구현 전" 상태로 RED를 재현하려면 소스를 되돌리고 다시 빌드해야 한다. P0-T43의 교차 검증(F-10)이 같은 종류의 공백(자연스러운 RED가 없는 신규 e2e)을 low로 판단한 전례를 따라, 재현 비용 대비 낮은 우선순위로 판단해 생략하고 여기 남긴다.

## RADIO와 어긋났던 경로

RADIO revision 1~6의 「변경 허용 경로」가 `harness/tests/**`를 적었으나 저장소의 실제 하네스 테스트 디렉터리는 `harness/self-test/`다(`harness/self-test/run.ts`가 같은 디렉터리의 `*.test.ts`만 훑는다 — `harness/tests/`에 넣으면 `pnpm harness:self-test`가 그 파일을 아예 실행하지 않는다). `matchesAnyGlob`은 리터럴 매칭이라 `harness/tests/**`는 `harness/self-test/...` 경로에 매치되지 않아 `gate:scope`가 `harness/self-test/**` 아래 새 파일 스테이징을 막았다.

같은 오타가 P0-T43 RADIO revision 2에도 있었고 revision 3에서 바로잡은 전례가 있다(`docs/execution/runs/P0-T43/radio.md`의 「RADIO와 어긋났던 경로」). 이번 RADIO가 그 수정 이전 표기를 다시 물려받았던 것으로 보인다. revision 7이 `harness/tests/**` → `harness/self-test/**`로 바로잡아 해소했다.
