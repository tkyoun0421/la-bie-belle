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
