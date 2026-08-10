# P0-T44 handoff

## 2026-08-10 · 개발 단계 착수 직후 안전 중단 (blocked)

- 작업 식별자: P0-T44 (화면별 인터랙션 효과)
- 현재 단계: 개발(3단계) 착수 직후 안전 중단 → 다음 설계(2단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-10T09:57:59Z

### 확정된 사실

- RADIO `docs/execution/radio/P0-T44-radio.md` revision 2, SHA-256 `9445d9f13dc172f3e85037dfc94c5aa25cded385e6d3a672c76ca6418a862e90`는 index의 `development_approval`과 일치하고 `gate:radio` 통과 상태다. 봉인 본문은 이번 세션에서 수정하지 않았다.
- RADIO의 기술 인수 조건 4와 '범위와 비목표' ④가 당겨서 새로고침 대상으로 지시하는 '홈·일정·알림·예상급여' 네 화면 중, 같은 RADIO의 Architecture 절과 '변경 허용 경로' 코드펜스는 세 화면(`src/views/pay/**`·`src/views/notifications/**`·`src/views/schedule-detail/**`)만 허용한다. 홈(`src/views/home/**`)과 '일정' 탭(`src/views/schedule/**`, `AppShellTabBar.tsx`로 확인)이 빠져 있고, 그 화면들을 감쌀 수 있는 `src/app/(protected)/(tabs)/**`(개별 page.tsx나 공유 layout.tsx)도 허용 경로에 없다. `src/app/(protected)/layout.tsx`는 있지만 용도가 'LazyMotion 프로바이더 배치'로 명시적으로 좁혀져 있다. 근거·재현 경로는 `docs/execution/runs/P0-T44/decision-signal.json`에 남겼다.
- 이번 세션에서 `src/` 아래 코드는 한 줄도 작성·스테이징하지 않았다. RADIO·00-foundation.md·ADR-0015·설계 인터뷰 기록(`docs/execution/runs/interviews/2026-08-10-p0-t44-design.md`)·`config/fsd.json`·`AppShellTabBar.tsx`·관련 view·harness 파일을 읽는 조사만 수행했다.
- 코디네이터가 지시한 번들 실측(`motion` 설치 후 `pnpm build && pnpm gate:bundle`)은 이 스코프 충돌과 독립적이지만, RADIO 문구가 재봉인으로 바뀔 가능성이 있어 봉인본 재확인 전에 실측 수치를 문서에 먼저 못 박지 않기로 했다. 재봉인 이후 첫 행동으로 이어서 수행하면 된다.
- RADIO가 허용하는 세 화면(pay·notifications·schedule-detail)만으로 기술 인수 조건 2(순차 등장)·3(금액 보간)·5(스와이프 읽음)는 완결되며 이번 충돌의 영향을 받지 않는다.

### 미결 사항

- AC4·범위 ④의 '홈·일정'을 빼고 실제 허용 경로(알림·예상급여·확정 배정 상세)로 문구를 정정하는 재봉인을 승인할지, 아니면 '변경 허용 경로'에 `src/views/home/**`·`src/views/schedule/**`·`src/app/(protected)/(tabs)/**`를 추가해 네 화면 그대로 구현할지 — 결정 주체: 사용자(조정자 경유), 반환 단계: 설계(전자는 development_approval만, 후자는 홈·일정이 서버 컴포넌트라 클라이언트 위젯 경계를 어디에 둘지 기술 설계가 하나 더 필요할 수 있다). 선택지별 근거는 `decision-signal.json`의 `open_questions`에 정리했다.
- 당김·스와이프 임계값의 구체 픽셀 수치(RADIO 143~144행이 위임)는 재개 시 실기기 조정으로 정하며 이번 충돌과 무관하다.

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인(문구 정정이면 revision 3 + development_approval만, 경로 확장이면 추가 기술 설계 포함)한다.
2. 재승인 후 개발 루프가 P0-T44를 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션은 코드 작업물이 없어 이어받을 격리 작업물이 없다 — 다음 세션은 이 handoff와 decision-signal만 읽고, 코디네이터가 지시한 순서대로(① `motion` 설치·프로바이더 배치 직후 번들 실측 ② 재봉인된 대상 화면에 맞춰 widgets/pull-to-refresh와 나머지 인수 조건 구현) 처음부터 시작하면 된다.

### 증거·산출물 경로

- `docs/execution/runs/P0-T44/decision-signal.json`
- `docs/execution/radio/P0-T44-radio.md` (봉인 본문 무수정 확인, revision 2)
- `docs/execution/runs/interviews/2026-08-10-p0-t44-design.md` (revision 1 설계 인터뷰, 홈·일정·순차 등장 관련 조사 기록)
- `src/widgets/app-shell/ui/AppShellTabBar.tsx` ('일정' 탭 = `/schedule` = `ScheduleView` 확인)
- `src/app/(protected)/layout.tsx`, `src/app/(protected)/(tabs)/layout.tsx` (허용 경로와 실제 화면 경계 확인)

## 2026-08-10 · 개발 단계 재착수, 번들 실측 초과로 재차 안전 중단 (blocked)

- 작업 식별자: P0-T44 (화면별 인터랙션 효과)
- 현재 단계: 개발(3단계) 재착수 → 다시 설계(2단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-10T10:19:14Z

### 확정된 사실

- RADIO `docs/execution/radio/P0-T44-radio.md` revision 3, SHA-256 `3d994d9c51ef63b230773fa34effe992a0e8973b10811833d9cbee312d6cee79`가 index의 `development_approval`과 일치하고 `gate:radio` 통과 상태다. 이전 세션이 지적한 AC4·허용 경로 어긋남은 revision 3이 `src/views/home/**`·`src/views/schedule/**`를 허용 경로에 더해 해소했다.
- 코디네이터 지시대로 다른 기능보다 먼저 `motion` 13.0.0을 설치하고(`package.json`·`pnpm-lock.yaml`), ADR-0015 결정 1의 코드 그대로 `src/shared/ui/motion-provider.tsx`(`LazyMotion strict features={() => import("motion/react").then((mod) => mod.domAnimation)}`)를 작성해 `src/app/(protected)/layout.tsx`에 배치했다. 컴포넌트 테스트(`src/shared/ui/__tests__/motion-provider.test.tsx`) 3건 — 프로바이더 아래 `m.*` 정상 렌더, `motion.*` 사용 시 strict 오류, 프로바이더 밖 `useMotionTokens()` 호출 시 명확한 오류 — 를 RED→GREEN으로 확인했다(`docs/execution/runs/P0-T44/tdd.json`에는 아직 기록하지 않았다. 커밋하지 않는 작업물이라 최종 tdd.json에는 남기지 않았고, 실행 로그만 이 handoff와 아래 재현 명령으로 남긴다).
- 이 상태에서 `pnpm build && pnpm gate:bundle`로 실측했다. 기준선(모션 도입 전, 같은 커밋에서 재확인) 407KB(416,274바이트, RADIO가 적은 406.5KB와 일치) 대비 도입 후 478KB(488,981바이트) — 델타 72,707바이트(약 71.0KB)로 ADR-0015가 예상한 27KB를 44KB 초과했다. 빌드 산출물에서 `framer-motion` 관련 문자열을 포함한 청크 3개(56,601+11,900+4,100=72,601바이트, 델타와 거의 일치)를 열어보니 `domAnimation` 외에 이번 task가 아직 쓰지 않는 `domMax`·`AnimatePresence`·`useSpring`·`LazyMotion`(4회)까지 포함돼 있었다 — Next.js 16 Turbopack 프로덕션 빌드가 ADR-0015의 esbuild 격리 측정과 다르게 `motion/react`의 더 넓은 표면을 함께 묶은 것으로 보인다.
- 478KB는 코디네이터가 지정한 정지선 440KB(38KB 초과)와 RADIO가 이번에 올리려는 새 상한 450KB(28KB 초과)를 모두 넘는다. RADIO 기술 인수 조건 6과 코디네이터 지시 모두 이 경우 "상한을 다시 올리지 말고 설계로 반환"하라고 명시해 여기서 멈췄다.
- 이번 세션에서 만든 코드(`motion` 설치, `motion-provider.tsx`, 테스트, layout 배치)는 WORKFLOW.md 269행에 따라 커밋하지 않고 작업 트리에 격리 작업물로만 남겼다. `docs/execution/phases/index.jsonl`의 P0-T44 상태를 `blocked`로 되돌리고 이 handoff·decision-signal만 커밋한다.

### 미결 사항

- 번들 초과에 대한 다음 방향 — 결정 주체: 사용자(조정자 경유), 반환 단계: 설계. 선택지는 `decision-signal.json`의 `open_questions`에 근거와 함께 정리했다(대안 임포트 전략 재설계, `motion` 자체 재검토, 또는 실측 위에서 상한을 다시 산정하며 두 번째 정지선 초과의 근거를 새로 세우는 안).
- 재승인 이후 이 세션이 남긴 격리 작업물(미커밋 `motion` 설치·프로바이더·테스트)을 그대로 이어써도 되는지, 새 임포트 전략이 정해지면 다시 써야 하는지.
- 당김·스와이프 임계값의 구체 픽셀 수치는 이번 충돌과 무관하며 재개 시 실기기 조정으로 정한다.

### 다음 행동

1. 조정자가 번들 초과 방향을 사용자에게 확인하고, 필요하면 ADR-0015·RADIO를 재봉인한다.
2. 재승인 후 개발 루프가 P0-T44를 다시 `planned`으로 올리고, 재봉인된 임포트 전략(또는 상한)에 맞춰 번들 실측부터 다시 확인한 뒤 인수 조건 1~8을 이어서 구현한다.

### 증거·산출물 경로

- `docs/execution/runs/P0-T44/decision-signal.json` (이번 세션 기록으로 갱신)
- 재현 명령: `pnpm add motion@13.0.0` → `src/shared/ui/motion-provider.tsx` 작성 → `(protected)/layout.tsx`에 `<MotionProvider>` 배치 → `pnpm build && pnpm gate:bundle`
- `src/shared/ui/motion-provider.tsx`, `src/shared/ui/__tests__/motion-provider.test.tsx`, `src/app/(protected)/layout.tsx` (모두 미커밋, 작업 트리에만 존재)

## 2026-08-10 · 개발 거의 완료, 좁은 경로 불일치로 재차 안전 중단 (blocked)

- 작업 식별자: P0-T44 (화면별 인터랙션 효과)
- 현재 단계: 개발(3단계) — 인수 조건 1~6, 8 완료, 인수 조건 7(렌더 시간 게이트) 구현은 끝났으나 self-test 등록만 남음
- 기준 시각: 2026-08-10 (RADIO revision 6, SHA-256 `83e6bcd85df899d3662d3e3a733a5bedc06d6d65a1315a82e078abe458af5bfd`)

### 확정된 사실

- 이번 세션 중 두 차례 더 멈췄다가 코디네이터·사용자 결정으로 재개했다 — (1) `useOnlineStatus`가 `widgets/offline/hooks/`에 있어 같은 계층의 다른 슬라이스가 import할 수 없는 문제를 revision 5(`src/shared/hooks/`로 승격)로 해소, (2) 구현 완료 실측이 490.9KB(502,710바이트)로 코디네이터가 지정한 490KB 정지선을 950바이트 넘긴 것을 revision 6에서 그대로 받아들임(500KB 상한 안, `motion/mini` 전환은 `AnimatedAmount`의 훅 3종이 없어 배제).
- 기술 인수 조건 1~6, 8을 완료했다. 상세 구현 내용과 근거는 `docs/execution/runs/P0-T44/radio.md`가 소유한다.
- `harness/lib/motion-render-budget.ts`(측정·판정, 워밍업 2회+표본 5회 중앙값으로 노이즈를 줄인 방식)와 `harness/gates/motion-render-budget.ts`(진입점)를 작성하고 `package.json`의 `verify` 체인(`test:e2e` 뒤, `gate:all` 앞)과 `gate:motion-render-budget` 단독 스크립트에 배선했다. 직접 실행(`pnpm gate:motion-render-budget`)과 `pnpm harness:typecheck`로 GREEN을 확인했다 — 로컬 실측은 전체 모션/reduced-motion 차이 1ms 미만(상한 16ms).
- `tests/e2e/swipe-refresh.spec.ts` 4건(스와이프 커밋/복귀, 세로 드래그의 가로 추적 미시작, 당겨서 새로고침의 실제 서버 데이터 반영, 브라우저 기본 pull-refresh 비활성)을 작성해 3회 반복 실행으로 안정성을 확인했다. `tests/e2e/support/work-date-band.ts`에 겹치지 않는 `swipeRefresh` 대역을 새로 잡았다.
- `docs/execution/runs/P0-T44/tdd.json`에 이번 세션 실행분(`useReducedMotion`·`globals.css` 순차등장/overscroll)의 RED→GREEN을 실제 명령 실행(구현을 임시로 되돌려 RED를 재현하고 복원해 GREEN을 다시 확인)으로 채웠다. 총 18개 RED→GREEN 쌍.
- 세 문서(`docs/execution/runs/P0-T44/radio.md`, `docs/standards/adr/0015-motion-library-scope.md` 결정 3, `docs/execution/phases/00-foundation.md`)에 최종 실측 490.9KB(502,710바이트)를 기록했다.
- **막힌 지점:** RADIO revision 1~6의 「변경 허용 경로」가 `harness/tests/**`를 적었는데 저장소의 실제 하네스 테스트 디렉터리는 `harness/self-test/`다(`harness/self-test/run.ts`가 자기 디렉터리만 훑는다). `matchesAnyGlob`이 리터럴 매칭이라 `harness/tests/**`는 `harness/self-test/...`에 매치되지 않아 `gate:scope`가 새 self-test 파일 스테이징을 막는다. 같은 오타가 P0-T43 RADIO revision 2에도 있었고 revision 3에서 바로잡힌 전례가 있다(`docs/execution/runs/P0-T43/radio.md`의 「RADIO와 어긋났던 경로」) — 이번 RADIO가 그 이전 표기를 물려받은 것으로 보인다. `motion-render-budget`의 순수 판정 함수(`evaluateRenderBudget`)에 대한 회귀 테스트를 `harness/self-test/`에 넣지 못해 인수 조건 7이 완결되지 못했다.
- 이번 세션에서 만든 모든 코드·문서는 아직 커밋하지 않았다(재봉인 문서 3개를 먼저 독립 커밋하라는 이전 지시는 이미 완료된 revision 5 재봉인 커밋 `c0d84d0`에서 마쳤고, 그 이후 작업물은 이번 handoff까지 전부 미커밋 상태다).

### 미결 사항

- `harness/tests/**` → `harness/self-test/**` 경로 표기 정정 재봉인 승인 — 결정 주체: 사용자(조정자 경유), 반환 단계: 설계(문구 정정 성격이라 다른 절을 건드리지 않는 좁은 재봉인으로 충분해 보인다).
- 위 재봉인 이후 남은 일: `harness/self-test/motion-render-budget.test.ts` 작성(`evaluateRenderBudget`의 상한 이하/경계/초과 케이스, `bundle-budget.test.ts` 패턴 재사용) → `pnpm harness:self-test` GREEN 확인 → tdd.json에 이 RED→GREEN 추가 → `pnpm verify` 전체 GREEN → handoff 최종 갱신 → 구현 커밋.

### 다음 행동

1. 조정자가 경로 표기 재봉인을 사용자에게 확인한다.
2. 재승인 후 개발 루프가 이어받아 위 「미결 사항」의 남은 일을 순서대로 마치고 `pnpm verify` GREEN 확인 뒤 구현 커밋을 올린다. 이번 세션이 작업 트리에 남긴 코드·문서(재봉인 문서 3개 제외 전부)는 그대로 이어 쓰면 된다 — 새로 시작할 필요 없다.

### 증거·산출물 경로

- `docs/execution/runs/P0-T44/radio.md` (이번 세션 구현 상세 전부)
- `docs/execution/runs/P0-T44/tdd.json` (18개 RED→GREEN 쌍)
- `tests/e2e/swipe-refresh.spec.ts`, `tests/e2e/support/work-date-band.ts`
- `harness/lib/motion-render-budget.ts`, `harness/gates/motion-render-budget.ts`
- `docs/standards/adr/0015-motion-library-scope.md`, `docs/execution/phases/00-foundation.md` (최종 실측 기록)

## 2026-08-10 · 개발 종료

- 작업 식별자: P0-T44 (화면별 인터랙션 효과)
- 현재 단계: 개발 종료 → 다음 검증(교차 리뷰)
- 기준 커밋: `627af245cdaaa4f442782f646660d0e9f2082c74`(리뷰 대상 diff의 시작점 — RADIO revision 7 재봉인 커밋, 이 handoff가 속한 구현 커밋의 부모)

### 확정된 사실

- RADIO revision 7(SHA-256 `58a712f2ab8b742e86b8ae4690b30673414c3dac1db79b9d7124c16b18cf63d0`)의 「변경 허용 경로」 정정으로 막혀 있던 인수 조건 7의 마지막 조각을 마쳤다 — `harness/self-test/motion-render-budget.test.ts`(5건, `evaluateRenderBudget`의 상한 이하/경계/초과/부호 무관/기본값)를 스테이징했고 `pnpm harness:self-test`가 321건(기존 316 + 신규 5) 전부 GREEN이다.
- 기술 인수 조건 1~8을 전부 완료했다. 상세 구현 내용·근거·재봉인 이력은 `docs/execution/runs/P0-T44/radio.md`가 소유한다.
- 로컬 Supabase를 `pnpm db:reset`으로 초기화한 뒤 `pnpm verify` 전체(format·lint·typecheck·unit 1320건·harness typecheck·harness self-test 321건·check:docs·build·gate:bundle·check:app-build·check:client-secret-scan·**e2e 53/53**·gate:motion-render-budget·gate:all)가 GREEN이다. 초기화 전 로컬 실행에서 `recruitment-manage.spec.ts` 1건이 이 저장소에 이미 있는 알려진 문제(고정 날짜 계산 + append-only `schedules`로 인한 로컬 재실행 시 23505)로 실패한 바 있으나 P0-T44 범위 밖이라 손대지 않았다 — 코디네이터가 확인했고 별도 backlog로 옮긴다. DB 초기화 뒤에는 이 spec도 포함해 53건 전부 통과했다.
- 최종 번들 실측 490.9KB(502,710바이트, gzip 청크 38개)를 `docs/execution/runs/P0-T44/radio.md`·`docs/standards/adr/0015-motion-library-scope.md` 결정 3·`docs/execution/phases/00-foundation.md`에 기록했다. 490KB 정지선을 950바이트 넘겼지만 500KB 상한 안이며 revision 6에서 사용자 결정으로 그대로 받아들였다.
- 개발 중 네 차례 멈추고 재봉인을 거쳤다(revision 3~7). 각 결정의 판단 근거는 이 handoff의 앞선 항목들과 `docs/execution/runs/P0-T44/radio.md`의 「재봉인 이력 요약」에 있다.

### 미결 사항

- 없음. RADIO의 미결 사항 절(당김·스와이프 임계값 실기기 조정, P4의 알림 서버 연동, `m.*` 사용처 확장 시 lint 강제 여부)은 이번 task 범위 밖이며 위임된 그대로다.

### 다음 행동

1. 4단계 검증 — 등록 `check_ids`(`stagger-render`·`amount-motion`·`gesture-model`·`swipe-refresh-e2e`·`motion-render-budget`·`bundle-budget-500`)와 교차 검증을 수행한다.
2. `recruitment-manage.spec.ts`의 알려진 로컬 재실행 결함은 코디네이터가 backlog로 옮긴다 — 이 task의 후속 작업이 아니다.

### 알아둘 것

- **로컬 e2e 재실행 전 `pnpm db:reset`을 권한다.** `schedules`가 append-only(LB022)라 고정 날짜를 쓰는 일부 spec(`recruitment-manage.spec.ts`)은 같은 날 두 번째 로컬 실행에서 23505로 죽는다. CI는 매번 DB를 새로 세우므로 재현되지 않는다.
- **렌더 시간 게이트의 단일 측정은 노이즈가 크다.** 조건마다 워밍업 2회 + 표본 5회 중앙값으로 안정화했다 — 단일 측정으로는 같은 조건에서도 1.5~24ms까지 흔들렸다.
- **e2e 제스처 시뮬레이션은 `page.mouse`가 아니라 합성 `PointerEvent` 디스패치를 쓴다.** 실제 마우스 입력은 임계값 미만의 작은 드래그에서도 네이티브 `click`을 합성해 기존 탭 핸들러(`onPress`)를 건드리는 부작용이 있다.

### 증거·산출물 경로

- 구현 커밋(이 handoff를 포함) — 기준 커밋 `627af245cdaaa4f442782f646660d0e9f2082c74` 대비 전체 diff
- `docs/execution/runs/P0-T44/radio.md`, `docs/execution/runs/P0-T44/tdd.json`(19개 RED→GREEN 쌍)
- `docs/standards/adr/0015-motion-library-scope.md`, `docs/execution/phases/00-foundation.md`(최종 실측 기록)
- `tests/e2e/swipe-refresh.spec.ts`, `harness/lib/motion-render-budget.ts`, `harness/gates/motion-render-budget.ts`, `harness/self-test/motion-render-budget.test.ts`
