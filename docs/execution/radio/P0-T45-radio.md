# P0-T45 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-10
- 개발 설계 승인: user, 2026-08-11

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-11 | 최초 작성. 설계 인터뷰 확정 6건 — Next가 실어 주는 canary의 `<ViewTransition>`을 그대로 쓰고(`react`를 올리지 않는다), 탭 4개 사이는 페이드, 탭 바 밖으로 나가는 이동은 전부 아래에서 올라오는 슬라이드, reduced-motion에서는 움직임 없이 페이드만, 번들 상한은 미리 올리지 않고 실측 정지선을 둔다. 인터뷰 중 P0-T43이 남긴 "알려진 사실"의 해석이 뒤집혔다 — 자세한 근거는 아래 「P0-T43 진단 정정」이 소유한다. 2026-08-11 사용자 결정. |

- 관련 spec: DOCS:SDD(FOUNDATIONS 모션 절)
- 적용 깊이: 일반 — 라우트 전환의 표현이다. 권한·개인정보·금액 계산·출퇴근 원본·DB·외부 서비스가 없고 데이터 흐름도 바뀌지 않는다.
- test mode: tdd
- 예정 check IDs: view-transition-fired(호출 계수), tab-fade(탭 4개 페이드), detail-slide(올라옴·내려감), persistent-nav-isolation(탭 바 비전환), reduced-motion-fade(움직임 없음·페이드 유지), transition-overlap(겹침·미지원), bundle-budget-500-hold(상한 유지)

## P0-T43 진단 정정

`00-foundation.md`의 P0-T45 절이 「알려진 사실」로 적어 둔 세 줄 중 둘은 사실이나 해석이 틀렸다. 이 절이 그 정정을 소유하며, 기획 문서의 해당 줄도 함께 고친다.

- **"앱의 `react` 19.2.8에는 `ViewTransition`이 없다"** — Node의 모듈 해석에서는 맞지만 클라이언트 번들에는 해당하지 않는다. Next는 App Router 클라이언트 코드의 `react`를 자기 vendored canary로 alias한다. 이 저장소의 빌드 산출물에서 `19.3.0-canary-cbb046ab-20260731` 문자열과 `ViewTransition`·`Activity` 심볼을 확인했다. `vercel-react-view-transitions` 스킬도 "`npm ls react`가 stable로 보이는 것은 정상이며 `react@canary`를 설치하지 말라"고 못 박는다.
- **"Next 16.3.0은 `experimental.viewTransition` 키를 인식하지 않는다"** — 맞지만, 그 키가 없는 이유는 미지원이 아니라 기본 활성이기 때문이다. Next 16이 함께 배포하는 가이드(`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`)가 "View transitions work in the App Router with no configuration"이라고 적는다. 스킬의 플래그 지시는 Next 15용이다. `<Link transitionTypes>`도 `node_modules/next/dist/esm/client/link.js`에 실재한다.
- **"레이아웃 래핑과 페이지 래핑 모두에서 호출이 0회였다"** — 두 시도 모두 문서화된 실패 모드에 해당한다. 레이아웃은 라우트 변경에도 마운트를 유지하므로 `enter`/`exit`가 최초 마운트에만 발동한다. 페이지 래핑은 `<ViewTransition>`이 어떤 DOM 노드보다 앞에 있어야 `enter`/`exit`가 활성화되는 배치 규칙을 어기면 조용히 죽는다.

따라서 이 task는 의존성을 바꾸지 않는다. 실패 원인은 배치와 발동 조건이므로 그쪽을 설계로 고정한다.

## Requirements

### 범위와 비목표

- 범위: ① 라우트 페이지에 `<ViewTransition>` 배치 — `shared/ui`의 재사용 래퍼 1종과 각 `page.tsx`의 한 줄 사용 ② `transitionTypes`로 이동 방향 태깅 — 탭 바 링크·상세 진입 링크·화면 내 뒤로 가기 링크, 달력 셀은 `startTransition` + `addTransitionType` ③ 애니메이션 CSS 도입 — 스킬 레시피를 `globals.css`로 복사 ④ 하단 탭 바 격리 ⑤ reduced-motion 대체 ⑥ 호출 계수와 겹침 e2e ⑦ 번들 재실측과 기록.

- 설계 비목표: `react`·`react-dom` 버전 변경. `document.startViewTransition` 직접 호출. 공유 요소 morph — 달력 셀은 숫자만 든 작은 칸이라 morph로 얻는 것이 적다. `src/app/loading.tsx`의 Suspense reveal 전환 — 라우트 전환과 다른 순간에 터지는 별개 층이라 이 task는 `default="none"`으로 간섭만 막고 붙이지 않는다. 모션 토큰 신설 — P0-T43이 세운 토큰을 쓴다. 화면별 효과 — P0-T44 소유다.

### 불변 규칙

- **`react`와 `react-dom`을 올리지 않는다.** Next가 실어 주는 canary를 그대로 쓴다. `package.json`의 두 버전은 이 task에서 바뀌지 않는다.
- **`document.startViewTransition`을 직접 부르지 않는다.** React가 대신 부른다. 우리가 부르면 React의 스냅샷 관리와 경합한다.
- **`<ViewTransition>`은 페이지 컴포넌트의 최상단에 둔다.** 레이아웃에 두지 않고, 그 위를 다른 DOM 노드가 감싸지 않는다. 레이아웃은 라우트 변경에도 살아 있어 `enter`/`exit`가 발동하지 않고, 래퍼 노드가 있으면 배치 규칙 위반으로 조용히 죽는다.
- **모든 `<ViewTransition>`에 `default="none"`을 붙인다.** 없으면 Suspense 해소·배경 재검증 같은 다른 전환에서도 브라우저 기본 크로스페이드가 함께 터진다.
- **애니메이션 CSS는 스킬 레시피를 복사한다.** `references/css-recipes.md`가 정본이며 자체 작성하지 않는다. 예외는 reduced-motion 한 곳뿐이다(아래).
- **모션 상수의 정본은 `globals.css` 하나다.** 레시피의 시간 값은 P0-T43이 세운 `--duration-*`·`--ease-*`로 갈아 끼우고 새 토큰을 만들지 않는다. `DEV-TOKEN-01`.
- **번들 상한을 미리 올리지 않는다.** ADR-0015가 "번들 여유는 저장소 빌드 실측으로만 계산한다"고 정했다. 상한 500KB를 유지하고 넘으면 멈춘다.

### 기술 인수 조건

1. **호출 발동**: 탭 이동과 상세 진입에서 `document.startViewTransition` 호출 계수가 0이 아니다. **이것이 첫 단계다.** 최소 배치로 이 조건을 먼저 세우고, 그래도 0이면 나머지를 만들지 말고 멈춰 설계로 반환한다. 그 경우의 대안은 설계 인터뷰에서 밀려난 `document.startViewTransition` 직접 호출이며, 그때는 불변 규칙 둘을 다시 연다.
2. **탭 이동**: 홈·일정·알림·전체 4개 사이 이동이 짧은 페이드로 바뀐다. 방향은 주지 않는다 — 수평 이동에 방향 슬라이드를 주면 없는 깊이를 암시한다.
3. **탭 밖 진입**: 일정 달력의 날짜 셀에서 스케줄 상세로, 전체 탭에서 예상급여·내 정보·관리자 화면으로 들어갈 때 새 화면이 아래에서 올라온다. 화면 안의 뒤로 가기(`<Link>`)로 나가면 내려간다.
4. **브라우저 뒤로 가기**: 브라우저·하드웨어 뒤로 가기는 애니메이션 없이 이동하고 화면은 정상 렌더된다. `popstate`가 동기라 `startViewTransition`과 맞지 않는 플랫폼 제약이며 결함이 아니다.
5. **탭 바 격리**: 전환 중 하단 탭 바가 콘텐츠와 함께 미끄러지거나 깜빡이지 않고 제자리에 있다.
6. **미지원과 reduced-motion**: `document.startViewTransition`이 없는 환경에서 네 탭과 상세가 모두 정상 렌더된다. reduced-motion에서는 미끄러지거나 올라오는 움직임이 사라지고 짧은 페이드만 남는다.
7. **겹침**: 전환 도중 다른 탭을 누르거나 뒤로 가기를 눌러도 마지막 요청 화면으로 안착하고, 어긋나거나 반쯤 덮인 상태로 남지 않는다. 같은 탭을 다시 눌러도 전환이 중복으로 걸리지 않는다.
8. **번들**: 상한 500KB를 유지하고 `pnpm verify`가 GREEN이다. 이 task의 실측을 `runs/P0-T45/radio.md`와 `00-foundation.md`에 기록한다.
9. **회귀**: 기존 e2e와 컴포넌트 테스트가 그대로 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 호출 발동 | 테스트함 — 탭 이동·상세 진입에서 계수 증가 | 테스트함 — 계수가 0이면 실패로 드러남 | 테스트함 — 최초 진입은 전환 없음 | 해당 없음 — 표현 계층이다 | 테스트함 — 같은 탭 재클릭에서 계수가 늘지 않음 | 해당 없음 — 아래 7행이 소유 |
| 2 탭 이동 | 테스트함 — 4개 탭 왕복 후 각 화면 렌더 | 테스트함 — 미지원 환경에서 정상 렌더 | 테스트함 — 같은 탭 재클릭 | 해당 없음 — 네 탭 모두 인증 뒤다 | 테스트함 — 연속 클릭에서 마지막 화면 안착 | 해당 없음 — 아래 7행이 소유 |
| 3 탭 밖 진입 | 테스트함 — 달력 셀·전체 탭에서 진입 후 상세 렌더 | 테스트함 — 뒤로 가기 링크로 원래 화면 복귀 | 테스트함 — 상세에서 다시 상세로 이동 | 해당 없음 — 관리자 화면 권한은 기존 서버 경계가 소유 | 테스트함 — 같은 셀 연속 클릭 | 해당 없음 — 아래 7행이 소유 |
| 4 브라우저 뒤로 가기 | 테스트함 — 뒤로 가기 후 정상 렌더 | 테스트함 — 전환 도중 뒤로 가기에서도 안착 | 테스트함 — 진입 직후 즉시 뒤로 가기 | 해당 없음 — 표현 계층이다 | 테스트함 — 뒤로 가기 연타 | 해당 없음 — 아래 7행이 소유 |
| 5 탭 바 격리 | 테스트함 — 전환 전후 탭 바 위치 동일 | 테스트함 — 격리 이름이 빠지면 드러남 | 해당 없음 — 탭 바는 단일 요소다 | 해당 없음 — 표현 계층이다 | 해당 없음 — 렌더가 멱등이다 | 해당 없음 — 아래 7행이 소유 |
| 6 미지원·reduced-motion | 테스트함 — 두 환경 모두 정상 렌더 | 테스트함 — reduced-motion에서 움직임 없음 | 테스트함 — 미지원 + reduced-motion 동시 | 해당 없음 — 표현 계층이다 | 해당 없음 — 렌더가 멱등이다 | 해당 없음 — 아래 7행이 소유 |
| 7 겹침 | 테스트함 — 전환 중 다른 탭 요청 시 마지막 화면 안착 | 테스트함 — 반쯤 덮인 화면이 남지 않음 | 테스트함 — 전환 시작 직후·끝나기 직전 요청 | 해당 없음 — 표현 계층이다 | 테스트함 — 같은 경로 연속 요청 | 테스트함 — 서로 다른 두 경로 요청이 겹쳐도 하나로 수렴 |
| 8 번들 | 테스트함 — 500KB 이하 통과 | 테스트함 — 초과 시 verify 실패 | 해당 없음 — P0-T43 게이트가 소유 | 해당 없음 — 빌드 산출물이다 | 해당 없음 — 측정이 멱등이다 | 해당 없음 — 순차 실행이다 |
| 9 회귀 | 테스트함 — verify GREEN | 테스트함 — 기존 e2e·컴포넌트 테스트 통과 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 |

- 보충 위험: **번들 여유가 9.0KB뿐이다.** P0-T44 종료 실측이 491.0KB(502,829바이트)이고 상한이 500KB다. `<ViewTransition>`은 이미 번들에 있는 React 기능이라 코드 증가가 CSS와 래퍼 한 종뿐일 것으로 보지만, 인수 조건 1의 최소 배치를 세운 직후 실측하고 상한을 넘으면 멈춰 반환한다. **P0-T44의 `PullToRefresh`가 홈·일정·알림·예상급여의 콘텐츠 래퍼에 idle에서도 `translateY(0px)`를 걸어 둔다**(교차 검증 F-08, backlog 미해결). `none`이 아닌 `transform`은 자손의 컨테이닝 블록을 바꾸므로 그 아래에서 잡히는 전환 스냅샷의 기하가 어긋날 수 있다. 전환이 네 화면에서만 이상하게 보이면 F-08을 먼저 의심하고, 이 task 범위 밖이면 결정 신호로 반환한다. **reduced-motion 처리가 스킬 레시피와 다르다.** 레시피는 `::view-transition-*`의 `animation-duration`을 0s로 만들어 전환을 완전히 없애지만, 이 task는 사용자 결정으로 짧은 페이드를 남긴다 — `prefers-reduced-motion`은 움직임에 민감한 사람을 위한 설정이지 변화를 숨기라는 뜻이 아니라는 판단이다. P0-T43의 전역 리셋(`*`·`*::before`·`*::after`에 `animation-duration: 0.01ms !important`)은 `::view-transition-*` 의사 요소를 잡지 않으므로 이 페이드와 충돌하지 않는다.

### DEV-* 적용 상태

- `DEV-DEP-01`: 해당 없음 — 새 의존성이 없다. `react`·`react-dom`도 그대로다.
- `DEV-TOKEN-01`: 기본 적용 — 레시피의 시간·easing을 P0-T43 토큰으로 갈아 끼우고 새 토큰을 만들지 않는다.
- `DEV-SSOT-01`: 기본 적용 — 탭 순서와 탭 밖 판정의 정본을 하나로 둔다. `AppShellTabBar` 안의 `TABS` 상수를 `shared/config`로 올려 UI와 판정이 같은 목록을 본다.
- `DEV-ARCH`: 기본 적용 — 의존 방향은 그대로다. 전환 래퍼는 `shared/ui`, 탭 순서 상수는 `shared/config`, 판정은 순수 함수다.
- `DEV-TEST-01`: 기본 적용 — tdd, RED→GREEN 증거를 `runs/P0-T45`에 남긴다.
- `DEV-CODE-07`: 기본 적용 — 설명 주석 금지.
- `DEV-SEC`·`DEV-DATA`·`DEV-TIME`·`DEV-CACHE`·`DEV-OFFLINE`: 해당 없음 — 서버 경계·데이터 스키마·시간 계산·캐시 정책·오프라인 처리가 없다.

## Architecture

계층 배치는 `config/fsd.json`의 세그먼트 규칙을 그대로 따른다. `model`은 `react` import가 금지된 단위 테스트 필수 세그먼트이므로 판정 로직이 UI 밖으로 밀린다.

- `src/shared/config/app-tabs.config.ts`: 하단 탭 4개의 순서·경로·라벨 정본. 지금 `AppShellTabBar` 안에 있는 `TABS` 상수를 옮긴다. 화면과 판정이 같은 목록을 본다. 파일 이름의 `.config` 접미는 이 디렉터리의 기존 관례이자 TDD guard 예외 패턴(`DEVELOPMENT.md` 「TDD guard」)이다.
- `src/shared/model/route-transition.ts`: 경로 한 쌍을 전환 종류(`tab`·`nav-forward`·`nav-back`·없음)로 바꾸는 순수 함수. 탭 목록에 있는 경로끼리면 `tab`, 탭 밖으로 나가면 `nav-forward`, 탭 밖에서 탭으로 돌아오면 `nav-back`이다. `/pay`는 `(tabs)` 안에 있지만 탭 바에 없으므로 경로가 아니라 탭 목록으로 가른다. `model`은 `unitTest: required` 세그먼트이므로 `src/shared/model/__tests__/route-transition.test.ts`가 함께 있어야 하고, 전환 종류 네 갈래를 각각 단언한다.
- `src/shared/ui/route-transition.tsx`: `<ViewTransition>` 래퍼 1종. `enter`/`exit`를 전환 종류별 CSS 클래스로 매핑하고 `default="none"`을 고정한다. server component에서도 쓸 수 있어야 하므로 `"use client"`를 붙이지 않는다.
- `src/app/(protected)/**/page.tsx`: 각 페이지의 최상단을 위 래퍼로 감싼다. 래퍼 위에 다른 노드를 두지 않는다. 레이아웃에는 넣지 않는다.
- `src/widgets/app-shell/ui/AppShellTabBar.tsx`: `TABS`를 `shared/config`에서 읽고, 각 `<Link>`에 `transitionTypes`를 붙이며, `<nav>`에 격리용 `viewTransitionName`을 준다.
- `src/views/schedule/ui/*`: 달력 셀의 `router.push`를 `startTransition` + `addTransitionType('nav-forward')` 안으로 넣는다. 화면 내용과 데이터 흐름은 건드리지 않는다.
- `src/views/schedule-detail/ui/*`: 뒤로 가기 `<Link>`에 `transitionTypes={['nav-back']}`를 붙인다.
- `src/app/globals.css`: 스킬 레시피의 페이드·세로 슬라이드·탭 바 격리 CSS와 reduced-motion 규칙.

## Data model

- 해당 없음 — DB 스키마·마이그레이션·RLS 변경이 없다. 서버에서 읽는 데이터도 바뀌지 않는다.

## Interface

- `RouteTransition`은 `children`만 받는다. 전환 종류는 링크 쪽의 `transitionTypes`가 정하므로 페이지가 종류를 넘기지 않는다.
- `resolveRouteTransition(from, to)`는 두 경로 문자열을 받아 전환 종류를 돌려주는 순수 함수다. `shared/config`의 탭 목록을 읽고 `react`를 import하지 않는다.
- `AppShellTabBar`의 props는 그대로다(`hasUnreadNotifications`). 탭 목록이 상수에서 config로 옮겨질 뿐 호출부가 깨지지 않는다.
- 하단 탭 바의 격리 이름은 `persistent-nav` 하나이며 CSS와 컴포넌트가 같은 문자열을 쓴다.

## Optimizations

- `<ViewTransition>`은 이미 번들에 있는 React 기능이라 새 런타임 비용이 없다. 늘어나는 것은 CSS와 래퍼 한 종이다.
- 애니메이션 대상은 `transform`과 `opacity`뿐이다. 레시피가 이미 그렇게 되어 있다.
- 탭 바를 스냅샷에서 빼면 전환마다 다시 그리는 영역이 줄어든다.
- `default="none"`이 Suspense 해소·배경 재검증에서 불필요한 크로스페이드를 막는다.
- 되돌림은 래퍼 사용처 제거, CSS 제거, `transitionTypes` 제거로 가능하다. 의존성·DB·서버 변경이 없어 되돌림 비용이 낮다.

## 변경 허용 경로

```
src/app/globals.css
src/app/__tests__/**
src/app/(protected)/**/page.tsx
src/shared/config/**
src/shared/model/**
src/shared/ui/**
src/widgets/app-shell/**
src/views/schedule/**
src/views/schedule-detail/**
tests/e2e/**
docs/execution/radio/P0-T45-radio.md
docs/execution/runs/P0-T45/**
docs/execution/phases/00-foundation.md
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/app/(protected)/**/page.tsx`는 최상단을 전환 래퍼로 감싸는 데만 쓰고 인증 흐름·라우팅·데이터 조회를 바꾸지 않는다. 레이아웃 파일은 허용 경로에 없다 — 레이아웃에 전환을 두는 것이 P0-T43의 실패 원인 중 하나이므로 경로로 막는다. `src/widgets/app-shell/**`는 탭 목록 출처 변경·`transitionTypes` 부여·격리 이름 부여에 한정한다. `src/views/schedule/**`와 `src/views/schedule-detail/**`는 이동을 전환으로 감싸는 데만 쓰고 화면 내용과 데이터 흐름은 그대로 둔다. `docs/execution/phases/00-foundation.md`는 P0-T45 절의 「알려진 사실」 정정과 인수 조건에 탭 밖 화면을 더하는 수정에 한정한다.

## 미결 사항

- P0-T44의 `PullToRefresh`가 걸어 둔 상시 `transform`(교차 검증 F-08)이 전환 스냅샷에 영향을 주는지는 구현 중 실기기에서 확인한다. 영향이 있으면 이 task에서 고치지 않고 결정 신호로 반환한다.
- `src/app/loading.tsx`의 Suspense reveal에 전환을 붙일지. 라우트 전환과 다른 순간에 터지는 별개 층이라 이 task는 간섭만 막는다. 결정 주체: 후속 제안.
- 관리자 화면 8종에 같은 전환을 주는 것이 관리자 동선에 맞는지는 실사용 뒤 재검토한다. 지금은 근무자 화면과 같은 규칙을 적용해 예외를 만들지 않는다.
