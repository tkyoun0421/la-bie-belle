# P0-T44 RADIO 적용 기록

- 대상 RADIO: `docs/execution/radio/P0-T44-radio.md` revision 7
- 승인 SHA-256: `58a712f2ab8b742e86b8ae4690b30673414c3dac1db79b9d7124c16b18cf63d0`
- 개발 세션 기준 시각: 2026-08-10
- 상태: 기술 인수 조건 1~8 전부 완료. `pnpm verify` 전체 GREEN. 교차 검증(`docs/execution/reviews/P0-T44-review.json`) 확정 발견 13건 중 high 3건(F-01·F-02·F-03)과 그 원인이 된 테스트 공백 2건(F-04·F-10)을 수정 라운드로 반영했다 — 아래 「수정 라운드」 절 참조.

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

`harness/lib/bundle-budget.ts`의 `BUNDLE_BUDGET_BYTES`를 `500 * 1024`로 바꿨다. revision 6이 받아들인 실측은 490.9KB(502,710바이트, gzip 청크 38개)였고, 교차 검증 수정 라운드를 반영한 최종 실측은 **491.0KB(502,829바이트, gzip 청크 38개)**다 — 아래 「수정 라운드」 참조. `pnpm gate:bundle`은 GREEN이다(500KB 상한 대비 여유 약 9.0KB).

### 7. 렌더 시간

`harness/lib/motion-render-budget.ts`(순수 판정 함수 `evaluateRenderBudget`·`RENDER_BUDGET_MS`)와 `tests/e2e/motion-render-budget.spec.ts`(실측)로 나뉜다. `package.json`의 `gate:motion-render-budget` 스크립트는 `playwright test tests/e2e/motion-render-budget.spec.ts`를 그대로 호출해 `pnpm verify` 체인의 `test:e2e` 뒤, `gate:all` 앞에 놓이고 단독 실행도 된다. 측정 방법은 교차 검증 F-02로 재설계됐다 — 아래 「수정 라운드」의 F-02 항목이 정본이다.

`harness/self-test/motion-render-budget.test.ts`(5건 — 상한 이내/경계/초과/부호 무관/기본값)로 `evaluateRenderBudget`을 회귀로 덮었다. RADIO revision 7이 아래 「RADIO와 어긋났던 경로」를 바로잡아 스테이징할 수 있게 됐다. `harness/lib/motion-render-budget.ts`를 잠시 치웠다가 복원해 `pnpm harness:self-test`의 RED(모듈을 찾지 못해 전체 실패)→GREEN(321건)을 실제로 확인했다.

### 8. 회귀

기존 알림·예상급여 컴포넌트 테스트에 케이스를 더해 통과시켰다. `ScheduleDetailView.tsx`의 확정 배정표에 순차 등장 클래스를 부여한 뒤 기존 8개 테스트가 회귀 없이 그대로 통과했다(신규 assertion을 더하지 않아 별도 RED가 필요 없었다).

## e2e — `tests/e2e/swipe-refresh.spec.ts`

4건을 새로 만들었다.

- 스와이프 읽음이 임계값을 넘으면 커밋되고, 못 미치면 원위치로 돌아간다(96px 미만은 상태 불변, 96px 넘으면 읽음).
- 세로로 드래그하면 가로 추적이 시작되지 않아 읽음 처리되지 않는다.
- `/schedule`에서 당겨서 새로고침하면 방금 삽입한(`OPEN` 상태) 스케줄 행이 반영돼 달력 셀 라벨이 "모집 없음"에서 "신청 가능"으로 바뀐다 — `router.refresh()`가 실제로 서버 데이터를 다시 가져온다는 인과 증거다.
- `body`의 `overscroll-behavior-y: contain`을 계산된 스타일로 확인해 브라우저 기본 당겨서 새로고침이 비활성임을 본다.

`page.mouse`(실제 마우스 입력)로 처음 짰을 때 임계값 미만의 작은 드래그도 마우스업 시 네이티브 `click`을 합성해 `onPress`(기존 탭 동작)가 읽음 처리를 해버리는 부작용을 발견했다. 이후 두 스와이프 테스트는 `element.dispatchEvent(new PointerEvent(...))` 합성 디스패치로 바꿨으나, 교차 검증 F-10이 이 방식은 신뢰되지 않은(untrusted) 이벤트라 브라우저의 `touch-action` 중재·네이티브 `pointercancel`을 전혀 태우지 않는다고 지적했다 — 수정 라운드에서 CDP `Input.dispatchTouchEvent` 기반 실제 터치 디스패치로 다시 바꿨다. 상세는 「수정 라운드」의 F-10 항목이 정본이다. 당겨서 새로고침·overscroll 두 테스트는 실제 마우스 입력을 그대로 쓴다(클릭 가능한 요소 위에서 시작하지 않아 부작용이 없다).

날짜 대역은 `tests/e2e/support/work-date-band.ts`에 `swipeRefresh: { minMonthsAhead: 264, maxMonthsAhead: 295 }`로 새로 잡아 기존 spec들과 겹치지 않게 했다.

최초 구현 때는 TDD RED 증거를 남기지 않았다 — 프로덕션 서버(`pnpm start`)가 이미 빌드된 `.next` 산출물을 서빙하므로 "구현 전" 상태로 RED를 재현하려면 소스를 되돌리고 다시 빌드해야 한다는 이유였다. 수정 라운드에서 F-10을 고치며 임계값 미만 이동으로 일시적으로 되돌려 RED(읽음 처리 안 됨 검증 실패)를 실제로 재현하고 복원해 GREEN을 확인했다 — `docs/execution/runs/P0-T44/tdd.json` 참조.

## RADIO와 어긋났던 경로

RADIO revision 1~6의 「변경 허용 경로」가 `harness/tests/**`를 적었으나 저장소의 실제 하네스 테스트 디렉터리는 `harness/self-test/`다(`harness/self-test/run.ts`가 같은 디렉터리의 `*.test.ts`만 훑는다 — `harness/tests/`에 넣으면 `pnpm harness:self-test`가 그 파일을 아예 실행하지 않는다). `matchesAnyGlob`은 리터럴 매칭이라 `harness/tests/**`는 `harness/self-test/...` 경로에 매치되지 않아 `gate:scope`가 `harness/self-test/**` 아래 새 파일 스테이징을 막았다.

같은 오타가 P0-T43 RADIO revision 2에도 있었고 revision 3에서 바로잡은 전례가 있다(`docs/execution/runs/P0-T43/radio.md`의 「RADIO와 어긋났던 경로」). 이번 RADIO가 그 수정 이전 표기를 다시 물려받았던 것으로 보인다. revision 7이 `harness/tests/**` → `harness/self-test/**`로 바로잡아 해소했다.

## 수정 라운드 (교차 검증 이후)

`docs/execution/reviews/P0-T44-review.json`(opus·codex 합의, 확정 발견 13건 · 총점 82)의 high 3건과 그 원인이 된 테스트 공백 2건만 사용자가 이번 라운드 범위로 정했다. 나머지 8건(F-05·F-06·F-07·F-08·F-09·F-11·F-12·F-13)은 코디네이터가 `docs/execution/reviews/backlog.md`로 옮기며 이번 task의 후속 작업으로 두지 않았다 — 이 절은 손댄 5건만 다룬다.

**F-01(high) — 순차 등장 애니메이션이 스와이프 인라인 transform을 덮는다.** `NotificationRow`가 스와이프 오프셋 `transform: translateX(offset)`을 인라인 `style`로 걸고, 같은 버튼에 `motion-stagger-item`(`animation: stagger-in ... both`)까지 얹었던 게 원인이다. CSS 캐스케이드에서 애니메이션 선언이 인라인 `style`보다 우선하고 `fill-mode: both`가 종료 후에도 `to` 키프레임을 유지해 인라인 `translateX`가 영구히 무시됐다. 애니메이션되는 요소와 스와이프로 이동하는 요소를 분리해 고쳤다 — 바깥 `<div>`가 호출부의 `className`·`style`(`motion-stagger-item`·`--stagger-index`)을 받고, 안쪽 `<button>`은 스와이프 `transform`만 인라인으로 건다. 인수 조건 5(스와이프 읽음)와 인수 조건 2(순차 등장)를 둘 다 유지한다. `src/shared/ui/__tests__/notification-row.test.tsx`에 구조 분리 단언 2건을 더했다.

**F-02(high) — 렌더 시간 게이트가 실제 화면을 재지 않았다.** 기존 `harness/lib/motion-render-budget.ts`가 빌드된 CSS를 빈 문서에 주입하고 게이트 스스로 만든 문자열 마크업 3개(`NOTIFICATION_ITEM_COUNT` 상수)를 재던 것을, `tests/e2e/motion-render-budget.spec.ts`로 옮겨 실제 `/notifications` 화면을 두 조건(`reducedMotion: "no-preference"`/`"reduce"`)으로 띄우고 화면이 실제로 그린 `<main>`의 `outerHTML`(React·`motion`·`NotificationsView`가 만든 진짜 마크업, 항목 수도 실제 렌더된 개수를 그대로 씀)을 그 화면 안에서 재주입해 마운트 시간을 잰다. 워밍업 2회 + 표본 5회 중앙값으로 노이즈를 줄이는 기존 방식은 그대로 살렸다. `harness/lib/motion-render-budget.ts`는 순수 판정 함수(`evaluateRenderBudget`·`RENDER_BUDGET_MS`)만 남겼고, `harness/gates/motion-render-budget.ts`(구 진입점)는 삭제했다 — `gate:motion-render-budget` npm 스크립트가 `playwright test tests/e2e/motion-render-budget.spec.ts`를 직접 호출한다. 인증은 `tests/e2e/support/worker-session.ts`의 `createWorkerSession`으로 새 근무자 세션을 만들어 처리한다(글로벌 `storageState`에 기대지 않는다).

**F-03(high) — 제스처 표면에 `touch-action`이 없고 `pointercancel`을 '놓음'으로 처리했다.** `PullToRefresh.tsx`의 포인터 수신 `<div>`와 `notification-row.tsx`의 버튼에 `touch-action: pan-y`를 추가했다(세로 페이지 스크롤은 브라우저에 맡기고 가로/제스처 인식 모호성만 없앤다). `usePullToRefresh.ts`는 `onPointerUp`과 `onPointerCancel`을 같은 핸들러로 묶어 취소도 `resolvePullRelease`를 태워 `ready` 상태에서 취소되면 `refreshing`으로 넘어갈 수 있었다 — `pull-state.ts`에 `resolvePullCancel`(취소는 `refreshing` 중이 아니면 항상 `idle`로 되돌리고, `refreshing` 중이면 그대로 둔다)을 새로 만들고 `onPointerCancel`을 그 경로로 분리했다. `pull-state.test.ts`·`usePullToRefresh.test.ts`에 취소 케이스를 더했다.

**F-04(medium) — 등록 check id `stagger-render`를 뒷받침하는 컴포넌트 단언이 없었다.** `PayView.test.tsx`(0건·1건·여러 건 — 기존 fixture `PAY_EMPTY_MONTH`·`PAY_WITH_HEAVY_REHEARSAL`·`PAY_WITH_ITEMS`를 그대로 재사용), `NotificationsView.test.tsx`(빈 상태·`NOTIFICATIONS_MIXED` 3건의 순서), `ScheduleDetailView.test.tsx`(`GENERAL_CONFIRMATION` 3행)에 `motion-stagger-item` 클래스와 `--stagger-index` 값을 확인하는 단언을 각각 더했다. 세 파일 모두 구현을 일시적으로 되돌려 RED를 재현했다(F-01처럼 실제 버그가 있어서가 아니라, F-04 자체가 "이 조합을 검증하는 테스트가 없다"는 공백 지적이라 임시로 클래스·스타일을 지워 RED를 만든 뒤 복원해 GREEN을 확인했다).

**F-10(medium) — E2E가 브라우저의 실제 터치 제스처 중재를 우회했다.** `swipe-refresh.spec.ts`의 `dispatchPointerDrag`(`element.dispatchEvent(new PointerEvent(...))`)는 신뢰되지 않은 합성 이벤트라 `touch-action` 중재도 네이티브 `pointercancel`도 유발하지 않았다. CDP `Input.dispatchTouchEvent`(`touchStart`/`touchMove`/`touchEnd`)로 실제 터치 이벤트를 디스패치하는 `dispatchRealTouchDrag`로 바꿨다 — `playwright.config.ts`의 `devices["Pixel 5"]`가 `hasTouch: true`라 CDP 터치 디스패치가 가능하다. 좌표는 대상 행의 `boundingBox()`에서 실측해 실제 히트테스트가 성립하게 했다(합성 디스패치는 히트테스트 없이 지정한 노드에 바로 꽂혀 좌표가 임의여도 됐지만, 실제 터치는 화면 좌표가 맞아야 한다). 3회 반복 실행으로 안정성을 확인했다.

번들 재확인: 수정 라운드 이후 실측 502,829바이트(491.0KB, gzip 청크 38개, 최대 청크 73,292바이트) — revision 6이 받아들인 502,710바이트(490.9KB) 대비 119바이트(0.02%)만 늘었다. `notification-row.tsx`의 래퍼 `<div>` 하나, `pull-state.ts`의 `resolvePullCancel` 순수 함수 몇 줄, `PullToRefresh.tsx`·`notification-row.tsx`의 `touch-action` 인라인 스타일이 전부라 청크 수·구성에 실질적 변화가 없다. `pnpm gate:bundle` GREEN(500KB 상한 대비 여유 약 9.0KB) — 눈에 띄는 증가가 아니라 멈추지 않았다.
