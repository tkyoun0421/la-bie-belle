# P0-T44 RADIO 개발 설계

- 상태: Approved
- revision: 7
- 기획 승인: user, 2026-08-09
- 개발 설계 승인: user, 2026-08-10

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 7 | 2026-08-10 | 변경 허용 경로의 `harness/tests/**`를 `harness/self-test/**`로 고친다. 저장소의 하네스 테스트 디렉터리는 `harness/self-test/`이고 `harness/tests/`는 존재하지 않는다 — `harness/self-test/run.ts`가 자기 디렉터리만 훑으므로 다른 곳에 두면 `pnpm harness:self-test`가 그 파일을 아예 실행하지 않는다. `matchesAnyGlob`이 리터럴 매칭이라 `gate:scope`가 렌더 시간 게이트의 self-test 스테이징을 막았다. P0-T43 RADIO revision 2가 같은 오타를 담았다가 revision 3에서 고친 전례가 있고(`runs/P0-T43/radio.md`의 「RADIO와 어긋났던 경로」), 이 RADIO가 그 이전 표기를 물려받았다. 실재하지 않는 경로를 실재하는 경로로 바꾸는 수정이라 범위가 넓어지지 않는다. 2026-08-10 사용자 결정. |
| 6 | 2026-08-10 | 정지선 490KB를 950바이트 넘긴 채로 마무리를 승인한다. 구현을 마친 실측이 490.9KB(502,710바이트)로 revision 4가 세운 정지선을 950바이트 넘었으나, 승인 상한 500KB는 9.1KB 여유로 지켜지고 `pnpm gate:bundle`이 통과한다. 정지선은 "상한을 세 번째로 올려야 하는 상황을 조기에 잡는다"는 목적으로 세운 것인데 세 번째 인상이 필요 없으므로 목적은 지켜졌다 — 글자만 950바이트 어긋났다. 남은 범위가 정적 청크에 아무것도 싣지 않아 이 값이 최종값이다: 렌더 시간 게이트는 `harness/gates/`의 Node 스크립트고, `swipe-refresh-e2e`는 Playwright spec이며, 나머지는 문서 세 곳이다. 최대 청크 71.6KB는 `react-dom`이고 상위 세 청크 어디에도 `framer-motion` 문자열이 없어 `motion` 쪽에 더 줄일 자리가 없다. `motion/mini` 전환(412.8KB)은 택하지 않는다 — mini에는 `AnimatedAmount`가 쓰는 `useMotionValue`·`useSpring`·`useTransform`이 없다. 2026-08-10 사용자 결정. |
| 5 | 2026-08-10 | `useOnlineStatus`를 `src/shared/hooks/`로 승격해 `DEV-OFFLINE` 결정이 실행 가능해지게 한다. revision 4까지의 `DEV-OFFLINE`은 "기존 `useOnlineStatus`를 쓴다"고만 적었는데, 그 훅이 `src/widgets/offline/hooks/`에 있어 같은 `widgets` 계층의 다른 슬라이스인 `widgets/pull-to-refresh`가 import할 수 없다 — `project/layer-direction`의 `SLICELESS_LAYERS`는 `app`·`shared`뿐이다. `isOnline`을 prop으로 올려도 채워줄 `RouterPullToRefresh`가 같은 슬라이스이고, 더 위로 올리면 홈이 server component라 클라이언트 훅을 부르지 못한다. 그 훅은 `navigator.onLine`을 `useSyncExternalStore`로 구독하는 범용 유틸이지 배너에 딸린 로직이 아니므로 `shared`가 옳은 자리다. 허용 경로에 `src/widgets/offline/hooks/**`(이동에 따른 삭제)와 `src/widgets/offline/ui/OfflineBanner.tsx`(import 한 줄)를 더한다. 슬라이스 안에서 `navigator.onLine`을 다시 구독하는 우회는 `DEV-SSOT-01`을 어기므로 택하지 않는다. 2026-08-10 사용자 결정. |
| 4 | 2026-08-10 | 번들 상한을 500KB로 고친다. revision 2가 세운 450KB와 정지선 440KB는 ADR-0015의 27KB를 믿고 계산한 값인데, 그 27KB가 `motion`만 esbuild로 따로 번들해 잰 값이라 Turbopack 프로덕션 빌드에서 재현되지 않았다. `motion/react`는 `export * from 'framer-motion'`으로 77줄짜리 재수출 barrel을 통째로 다시 내보내고 Turbopack은 그 barrel을 흔들지 않는다. 프로바이더만 배치한 실측이 477.5KB(488,981바이트)로 도입 전 기준선 406.5KB 대비 71KB다. 좁은 진입점은 탈출로가 아니다 — `LazyMotion`·`domAnimation`은 index에만 있고 `motion/react-m`은 `m.*` 요소만 준다. `next.config.ts`의 `experimental.optimizePackageImports: ["motion"]`을 얹어도 바이트 단위로 같은 값이 나왔다. 대안으로 `motion/mini`를 실측(412.8KB, +6.3KB)했으나 `LazyMotion` 범위 유지를 택했다. 정지선을 두 번째로 넘기는 근거는 이 수치가 예측이 아니라 실측이고, `motion`이 인증 뒤 화면 청크에만 실리며, 되돌림이 프로바이더 제거 하나로 끝난다는 점이다. 2026-08-10 사용자 결정. |
| 3 | 2026-08-10 | 당겨서 새로고침의 대상 화면과 변경 허용 경로가 어긋난 것을 바로잡는다. 범위 ④와 기술 인수 조건 4는 대상을 홈·일정·알림·예상급여 넷으로 적었는데, 허용 경로와 Architecture는 예상급여·알림·확정 배정 상세만 열었다 — 뒤쪽 셋은 기술 인수 조건 2(순차 등장)의 대상 목록이고, 허용 경로를 그 목록에서 뽑으면서 인수 조건 4의 화면이 빠졌다. 좁은 쪽에 맞추면 새로고침이 mock 상수를 다시 그리는 두 화면에만 붙어 사용자 눈에 아무 변화가 없다 — 홈(`findImminentRecruitment`)과 일정(`listRecruitmentSchedules`·`listOwnApplications`)만 서버 데이터를 쓴다. 인수 조건 4를 그대로 두고 허용 경로에 `src/views/home/**`·`src/views/schedule/**`를 더한다. 홈만 server component라 `router.refresh()`를 부를 클라이언트 경계를 `widgets/pull-to-refresh` 안의 얇은 어댑터로 두어 네 화면이 같은 방식으로 쓴다. 2026-08-10 사용자 결정. |
| 2 | 2026-08-10 | 번들 상한을 450KB로 고친다. revision 1은 상한을 380KB에서 400KB로 올린다고 적었으나 그 계산이 선 기준선 367KB가 낡은 값이었다 — P0-T43이 개발 중 실측으로 이를 확인하고 상한을 이미 420KB로 올렸다(P0-T43 revision 3). 착수 직전 실측은 406.5KB라 revision 1대로 상한을 400KB로 내리면 코드를 쓰기 전에 `pnpm verify`가 실패하고, 현재 상한 420KB를 유지해도 `motion` 27KB를 더한 약 433KB가 넘어선다. ADR-0015와 `00-foundation.md`가 이미 "상한을 다시 올리는 일은 P0-T44가 개발 시점 실측 위에서 정한다"고 위임해 둔 자리를 이 개정이 채운다. 2026-08-10 사용자 결정. |
| 1 | 2026-08-10 | 최초 작성. 설계 인터뷰 확정 5건 — `motion`을 `LazyMotion` 범위로 도입하고 번들 상한을 400KB로 올리며([ADR-0015](../../standards/adr/0015-motion-library-scope.md)), 순차 등장 대상을 실재하는 목록 셋으로 좁히고, mock 화면 위에 제스처 UI를 지금 세우며, 렌더 시간은 reduced-motion 켠/끈 두 측정의 차이로 판정한다. 조사에서 `motion` 13.0.0의 진입점별 gzip을 실측(mini 3KB / LazyMotion 27KB / 전체 42KB)했고, 일정 탭이 목록이 아니라 `<Calendar>` 하나이며 알림·예상급여가 아직 mock 데이터로 렌더되고 TanStack Query가 없어 새로고침 수단이 `router.refresh()`뿐임을 확인했다. |

- 관련 spec: DOCS:SDD(FOUNDATIONS 모션 절), ADR:0015
- 적용 깊이: 일반 — UI와 제스처다. 권한·개인정보·금액 계산·출퇴근 원본·DB·외부 서비스가 없다. 예상급여 숫자는 표시 방식만 바뀌고 계산은 건드리지 않는다.
- test mode: tdd
- 예정 check IDs: stagger-render(순차 등장·빈 목록·1건), amount-motion(값 보간·감소·0원·숨김), gesture-model(당김·스와이프 판정 순수 함수), swipe-refresh-e2e(스와이프 읽음·당겨서 새로고침·스크롤 비간섭), motion-render-budget(reduced-motion 대비 렌더 시간 차이), bundle-budget-500(상한 상향)

## Requirements

### 범위와 비목표

- 범위: ① `motion` 13.0.0 설치와 `LazyMotion` 프로바이더 배치 ② 순차 등장 — 예상급여 날짜별 내역·알림 행·확정 배정표, CSS `animation-delay` ③ 금액 보간 — 예상급여의 합계·일반근무·리허설 세 숫자 ④ 당겨서 새로고침 — 홈·일정·알림·예상급여 ⑤ 스와이프 읽음 — 알림 행 ⑥ 번들 상한 420KB→500KB ⑦ 렌더 시간 게이트 신설 ⑧ `overscroll-behavior-y` 전역 규칙.
- 비목표(기획 그대로): 아직 만들지 않은 화면의 효과 — P3 배정·확정과 P4 이후 화면은 각 task가 같은 토큰을 쓴다. 새 모션 토큰 신설.
- 설계 비목표: 알림 읽음 처리와 새로고침의 서버 연동 — P4 소유다. 이 task는 지금의 로컬 상태 처리와 `router.refresh()`를 부르고 호출부만 나중에 갈아끼운다. TanStack Query 도입. `motion.*`·`AnimatePresence` 사용. 색상·타이포·간격 토큰 변경.

### 불변 규칙

- **`motion` 사용은 `LazyMotion` 범위를 벗어나지 않는다.** `m.*`만 쓰고 `motion.*`와 `AnimatePresence`는 쓰지 않는다. `strict`가 이를 런타임에서 강제한다. 근거는 [ADR-0015](../../standards/adr/0015-motion-library-scope.md).
- **모션 상수의 정본은 `globals.css` 하나다.** spring 상수도 TS에 복사하지 않고 프로바이더가 `getComputedStyle`로 한 번 읽어 내려준다. 어긋나면 `DEV-SSOT-01` 위반이다.
- **CSS로 되는 효과에 라이브러리를 부르지 않는다.** 순차 등장은 `animation-delay`로 처리한다.
- **제스처 판정은 UI 밖에 둔다.** 당김 거리·스와이프 거리·방향 확정을 `model` 세그먼트의 순수 함수로 두고, `ui`는 결과를 표시만 한다. `config/fsd.json`이 `model`의 `react` import를 막으므로 규칙이 기계로 강제된다.
- **제스처가 기본 조작을 가로채지 않는다.** 세로 스크롤과 행 탭이 먼저다. 방향이 세로로 확정되면 가로 추적을 포기한다.
- **금액 계산에 손대지 않는다.** 보간은 표시 계층이며 `calculateRehearsalAmount`와 합계 산식은 그대로다.

### 기술 인수 조건

1. **의존성**: `motion` 13.0.0이 dependencies에 있고, 프로바이더가 `(protected)` 레이아웃 아래에만 있으며, `strict`가 켜져 있고, feature 번들이 동적 import로 지연된다. 인증 전 화면의 청크에 `motion`이 들어가지 않는다.
2. **순차 등장**: 예상급여 날짜별 내역·알림 행·확정 배정표의 항목이 `--duration-stagger` 간격으로 차례로 나타난다. 항목이 0개면 아무것도 실행되지 않고 1개면 지연 없이 나타난다. reduced-motion에서는 전부 즉시 표시된다.
3. **금액 보간**: 리허설 기록을 추가·수정·삭제하면 합계·일반근무·리허설 숫자가 이전 값에서 새 값으로 이어진다. 값이 줄어드는 경우와 0원에서 시작하는 경우도 같다. 금액 숨김(`••••••`) 상태에서는 보간하지 않는다. reduced-motion에서는 즉시 바뀐다.
4. **당겨서 새로고침**: 홈·일정·알림·예상급여에서 목록 최상단을 당기면 표시가 나타나고 놓으면 `router.refresh()`가 한 번 실행된다. 임계값에 못 미치면 원위치로 돌아가고 아무것도 실행하지 않는다. 오프라인이면 실패를 알리고 기존 화면을 유지한다. 브라우저 기본 당겨서 새로고침이 함께 뜨지 않는다.
5. **스와이프 읽음**: 알림 행을 가로로 밀어 임계값을 넘기면 읽음 처리된다. 임계값 전에 놓으면 복귀한다. 세로 스크롤 중에는 가로 추적이 시작되지 않는다. 이미 읽은 행은 스와이프해도 상태가 그대로다.
6. **번들**: 상한이 500KB이고 `pnpm verify`가 그대로 GREEN이다. 도입 전 기준선은 406.5KB이고 프로바이더만 배치한 실측은 477.5KB다. 구현을 마친 뒤의 실측값을 `runs/P0-T44/radio.md`와 ADR-0015 결정 3, `00-foundation.md`의 해당 문장에 기록한다.
7. **렌더 시간**: 같은 화면을 reduced-motion 켜고/끄고 두 번 측정해 차이가 16ms 이내다. 대상은 항목이 가장 많은 알림 목록이다.
8. **회귀**: 기존 알림·예상급여 컴포넌트 테스트가 통과하고 `pnpm verify`가 GREEN이다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 의존성 | 테스트함 — 프로바이더 아래에서 `m.*` 동작 | 테스트함 — `motion.*` 사용 시 오류 | 테스트함 — 프로바이더 밖 렌더에서 명확한 실패 | 해당 없음 — 인증 전 화면은 프로바이더 범위 밖이다 | 해당 없음 — 마운트가 1회다 | 해당 없음 — 단일 프로바이더다 |
| 2 순차 등장 | 테스트함 — 세 목록의 지연 부여 | 테스트함 — reduced-motion에서 즉시 표시 | 테스트함 — 0건·1건·최대 건수 | 해당 없음 — 표현 계층이다 | 해당 없음 — 렌더가 멱등이다 | 테스트함 — 목록 갱신 중 재마운트에서 지연이 겹치지 않음 |
| 3 금액 보간 | 테스트함 — 추가·수정에서 값 이동 | 테스트함 — 숨김 상태에서 보간 안 함 | 테스트함 — 0원 시작·값 감소·동일 값 | 해당 없음 — 표시 계층이다 | 테스트함 — 연속 편집에서 이전 보간이 취소됨 | 테스트함 — 보간 중 삭제로 대상이 사라져도 오류가 없음 |
| 4 당겨서 새로고침 | 테스트함 — 임계값 초과 시 1회 실행 | 테스트함 — 오프라인에서 실패 안내·기존 화면 유지 | 테스트함 — 임계값 직전·직후, 스크롤 중간에서 시작 | 해당 없음 — 서버 재조회가 기존 인증을 그대로 쓴다 | 테스트함 — 당김을 연달아 놓아도 실행이 1회 | 테스트함 — 진행 중 재당김이 두 번째 실행을 만들지 않음 |
| 5 스와이프 읽음 | 테스트함 — 임계값 초과 시 읽음 | 테스트함 — 세로 스크롤이 이기면 가로 추적 없음 | 테스트함 — 임계값 직전 복귀, 이미 읽은 행 | 해당 없음 — 로컬 상태 전이다 | 테스트함 — 같은 행 연속 스와이프가 상태를 뒤집지 않음 | 테스트함 — 스와이프 도중 목록이 갱신돼도 다른 행이 읽음 처리되지 않음 |
| 6 번들 | 테스트함 — 500KB 이하 통과 | 테스트함 — 초과 시 verify 실패 | 해당 없음 — P0-T43 게이트가 소유 | 해당 없음 — 빌드 산출물이다 | 해당 없음 — 측정이 멱등이다 | 해당 없음 — 순차 실행이다 |
| 7 렌더 시간 | 테스트함 — 차이 16ms 이내 | 테스트함 — 초과 시 실패 | 테스트함 — 목록이 빈 화면에서 측정이 성립 | 해당 없음 — 측정이다 | 해당 없음 — 반복 측정이 독립이다 | 해당 없음 — 순차 실행이다 |
| 8 회귀 | 테스트함 — verify GREEN | 테스트함 — 기존 컴포넌트 테스트 통과 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 |

- 보충 위험: P0-T43이 만든 lint 규칙은 Tailwind 클래스를 검사하므로 `m.*`가 `width`·`height`를 애니메이션해도 막지 못한다. 사용처가 네 곳뿐인 동안 리뷰가 담당하며, 늘어나면 규칙 확장을 별도 제안으로 올린다. 프로바이더만 배치한 실측이 477.5KB였고 구현을 마친 실측은 490.9KB로 상한 500KB 아래에 9.1KB를 남긴다. 정지선 490KB를 넘으면 멈추고 `motion/mini` 전환(실측 412.8KB)을 설계로 반환하기로 했었고 950바이트 초과로 실제로 멈췄으나, 세 번째 상한 인상이 필요 없어 정지선의 목적이 지켜졌다는 판단으로 그대로 마무리했다(revision 6). 이 화면들에 코드를 더할 때 쓸 예산은 남은 9.1KB다. 알림·예상급여가 아직 mock이라 P4에서 서버가 붙을 때 읽음 처리와 새로고침의 호출부가 바뀐다 — 제스처와 호출부를 분리해 그 교체가 UI를 건드리지 않게 한다.

### DEV-* 적용 상태

- `DEV-DEP-01`: 추가 결정 — `motion` 13.0.0을 새 production 의존성으로 추가한다. 범위 제한과 근거는 [ADR-0015](../../standards/adr/0015-motion-library-scope.md).
- `DEV-SSOT-01`: 기본 적용 — 모션 상수의 정본은 `globals.css` 하나이며 spring 상수도 복사하지 않는다.
- `DEV-TOKEN-01`: 기본 적용 — P0-T43이 모션까지 넓힌 규칙을 그대로 따른다.
- `DEV-ARCH`: 추가 결정 — `widgets` 계층에 첫 제스처 블록을 만들고 `shared`에 `hooks` 세그먼트를 신설한다. 의존 방향은 그대로다.
- `DEV-TEST-01`: 기본 적용 — tdd, RED→GREEN 증거를 `runs/P0-T44`에 남긴다.
- `DEV-CODE-07`: 기본 적용 — 설명 주석 금지.
- `DEV-OFFLINE`: 추가 결정 — 당겨서 새로고침이 오프라인에서 실패를 알리고 기존 데이터를 유지한다. 기존 `useOnlineStatus`를 쓰되, `widgets` 슬라이스끼리 import할 수 없으므로 `src/shared/hooks/useOnlineStatus.ts`로 옮겨 쓴다. 구독 코드를 복제하지 않는다.
- `DEV-SEC`·`DEV-DATA`·`DEV-TIME`·`DEV-CACHE`: 해당 없음 — 서버 경계·데이터 스키마·시간 계산·캐시 정책이 없다.

## Architecture

계층 배치는 `config/fsd.json`의 세그먼트 규칙을 그대로 따른다. `model`은 `react` import가 금지된 단위 테스트 필수 세그먼트이므로 판정 로직이 자연스럽게 UI 밖으로 밀린다.

- `src/shared/ui/motion-provider.tsx`: `"use client"`, `<LazyMotion strict>`과 spring 상수 컨텍스트. `src/app/(protected)/layout.tsx`가 children을 감싼다.
- `src/shared/model/swipe-action.ts`: 이동 거리·방향·임계값을 스와이프 결과로 바꾸는 순수 함수.
- `src/shared/hooks/useSwipeAction.ts`: 포인터 추적. 판정은 위 순수 함수에 위임한다. `shared`에 `hooks` 세그먼트를 처음 만든다.
- `src/shared/hooks/useOnlineStatus.ts`: `src/widgets/offline/hooks/`에서 옮겨온다. 내용은 그대로이고 테스트도 함께 옮긴다. `OfflineBanner`의 import를 새 경로로 바꾸는 것 외에 `widgets/offline`은 건드리지 않는다.
- `src/shared/ui/notification-row.tsx`: `onSwipeRead` prop 추가. 기존 `onPress` 동작은 그대로다.
- `src/shared/ui/animated-amount.tsx`: 숫자 보간 표시. 보간 여부는 prop으로 받고 컴포넌트가 판단하지 않는다.
- `src/widgets/pull-to-refresh/model/pull-state.ts`: 당김 거리를 대기·당기는 중·임계값 초과·실행 중 상태로 바꾸는 순수 함수.
- `src/widgets/pull-to-refresh/hooks/usePullToRefresh.ts`: 포인터 추적과 실행 1회 보장.
- `src/widgets/pull-to-refresh/ui/PullToRefresh.tsx`: 표시. 실행 함수는 prop으로 받는다.
- `src/widgets/pull-to-refresh/ui/RouterPullToRefresh.tsx`: `"use client"` 어댑터. `useRouter().refresh()`를 위 컴포넌트의 `onRefresh`로 넘기고 children을 그대로 감싼다. server component인 홈이 함수 prop 없이 쓸 수 있고, P4에서 서버 재조회로 갈아끼울 때 이 파일 하나만 바뀐다.
- `src/views/{home,schedule}/ui/*`: 당겨서 새로고침 블록 배치. 화면 내용과 데이터 흐름은 건드리지 않는다. 일정·알림·예상급여는 이미 `"use client"`이고 홈만 server component라 어댑터로 감싼다.
- `src/views/{pay,notifications,schedule-detail}/ui/*`: 순차 등장 클래스와 `--stagger-index` 부여, 위 블록 배치.
- `src/app/globals.css`: 순차 등장 keyframes와 `overscroll-behavior-y: contain`.
- `harness/gates/`: 렌더 시간 게이트 1종. 번들 게이트는 P0-T43이 만든 것의 상한 숫자만 바꾼다.

## Data model

- 해당 없음 — DB 스키마·마이그레이션·RLS 변경이 없다. 알림 읽음 상태는 P4까지 `NotificationsView`의 로컬 상태로 남는다.

## Interface

- `NotificationRow`에 `onSwipeRead?: () => void`가 추가된다. 넘기지 않으면 스와이프가 비활성이며 기존 사용처가 깨지지 않는다.
- `PullToRefresh`는 `onRefresh: () => Promise<void> | void`를 받는다. 호출부는 `RouterPullToRefresh`이며 지금은 `router.refresh()`를 넘기고 P4에서 서버 재조회로 바꾼다. 화면은 어댑터만 쓰고 `onRefresh`를 직접 넘기지 않는다.
- `AnimatedAmount`는 `value: number`와 `animate: boolean`을 받는다. 포맷 함수는 호출부가 넘긴다.
- spring 상수는 프로바이더의 컨텍스트로만 흐른다. 개별 컴포넌트가 `getComputedStyle`을 다시 부르지 않는다.
- 렌더 시간 게이트는 `pnpm verify` 체인의 e2e 뒤 단계로 노출되고 단독 실행도 가능하다.

## Optimizations

- 진입점을 `LazyMotion`+`domAnimation`으로 제한한다. ADR-0015의 진입점별 수치(mini 3KB / LazyMotion 27KB / 전체 42KB)는 esbuild 격리 측정이라 Turbopack 빌드에서 재현되지 않는다 — 이 저장소 실측은 도입 전 406.5KB에서 477.5KB로 71KB가 늘었고, 구현을 마친 최종 실측은 490.9KB다. 측정 방법과 수치는 [ADR-0015](../../standards/adr/0015-motion-library-scope.md)가 소유한다.
- feature 번들을 동적 import로 지연해 첫 화면의 파싱 비용을 뺀다. 정적 청크 합계는 같으므로 게이트 수치에는 영향이 없다.
- 순차 등장을 CSS로 처리해 항목 수만큼의 JS 애니메이션을 만들지 않는다. 목록이 길수록 이 선택의 이득이 커진다.
- 애니메이션 대상은 `transform`과 `opacity`뿐이다. 제스처의 이동도 `transform`으로만 표현한다.
- 관측: 렌더 시간 게이트가 reduced-motion 대비 차이를 재므로 회귀가 수치로 드러난다.
- 되돌림은 프로바이더 제거, `m.*` 호출부 되돌리기, 패키지 삭제, 상한 원복으로 가능하다. DB·서버 변경이 없어 되돌림 비용이 낮다.

## 변경 허용 경로

```
package.json
pnpm-lock.yaml
src/app/globals.css
src/app/__tests__/**
src/app/(protected)/layout.tsx
src/shared/ui/**
src/shared/model/**
src/shared/hooks/**
src/widgets/offline/hooks/**
src/widgets/offline/ui/OfflineBanner.tsx
src/widgets/pull-to-refresh/**
src/views/pay/**
src/views/notifications/**
src/views/schedule-detail/**
src/views/home/**
src/views/schedule/**
harness/gates/**
harness/lib/**
harness/self-test/**
tests/e2e/**
docs/standards/ARCHITECTURE.md
docs/standards/adr/0015-motion-library-scope.md
docs/standards/adr/README.md
docs/execution/radio/P0-T44-radio.md
docs/execution/runs/P0-T44/**
docs/execution/phases/00-foundation.md
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/app/(protected)/layout.tsx`는 프로바이더 배치에 한정하며 인증 흐름과 라우팅을 수정하지 않는다. `src/shared/ui/**`는 새 모션 컴포넌트 추가와 `notification-row`의 prop 확장에 한정한다. `src/views/{pay,notifications,schedule-detail}/**`는 순차 등장 부여와 블록 배치에 한정하며 화면 내용·데이터 흐름을 바꾸지 않는다. `src/views/{home,schedule}/**`는 당겨서 새로고침 블록 배치에만 쓰며 순차 등장은 넣지 않는다 — 두 화면은 목록이 아니다. `src/widgets/offline/hooks/**`는 `useOnlineStatus`와 그 테스트를 `shared`로 옮기면서 비우는 데만 쓰고, `src/widgets/offline/ui/OfflineBanner.tsx`는 import 경로 한 줄 수정에 한정한다 — 배너의 동작·표시는 그대로다. `package.json`은 `motion` 추가와 게이트 연결에 한정한다. `docs/standards/ARCHITECTURE.md`는 스택 목록에 `motion`을 넣는 수정에 한정한다.

## 미결 사항

- `--duration-stagger`와 spring 상수 2종의 구체값은 P0-T43이 선언하고 실기기에서 조정한다. 결정 주체: P0-T43 구현.
- 당김 임계값과 스와이프 임계값의 픽셀 수치는 구현 중 실기기에서 정한다. 판정 함수의 인자로 두어 조정이 테스트를 깨지 않게 한다.
- P4에서 알림 서버가 붙을 때 읽음 처리의 낙관적 갱신과 실패 복구를 어떻게 할지. 결정 주체: P4 알림 task.
- `m.*` 사용처가 늘어날 때 JS 애니메이션의 속성 제한을 기계로 강제할지. 결정 주체: 사용처가 늘어나는 시점의 별도 제안.
