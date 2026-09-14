# backlog

task 보드다. 행 하나가 task 하나고, 완료 조건은 그 행이 링크하는 spec이나 plan이 담는다(ADR-005). 표는 이 한 곳이고 상태는 `active`·`ready`·`blocked`·`candidate`·`done` 다섯이다. `ready`는 위가 먼저고 바로 잡을 수 있다. 큰 순서(릴리스 단위)는 `1-plan/roadmap.md`가 담는다. 작성법은 [docs/README.md](README.md#협업-기록)가 소유한다.

| 작업 ID | 작업 | 상태 | 선행 작업 ID | spec 또는 plan | 검증·완료 근거 |
| --- | --- | --- | --- | --- | --- |
| `docs-sdlc-coherence` | SDLC를 유지하며 설계를 업무 영역으로 모은다 — [plan](3-build/plans/docs-sdlc-coherence.md). [제안](proposals/docs-sdlc-coherence.md) 채택, 근거는 [ADR-009](2-design/adr/ADR-009-design-modules-and-stage-links.md). 묶음 A~C가 끝났고 D~F는 아래 행이 잇는다 | done | — | [plan](3-build/plans/docs-sdlc-coherence.md) | [PR #356](https://github.com/tkyoun0421/la-bie-belle/pull/356), [docs/log/2026-09-15.md](log/2026-09-15.md) |
| `docs-authoring-playbook` | SDLC 문서의 작성법과 틀을 정본에 옮기고 활성 문서를 그 틀로 다시 쓴다 — [plan](3-build/plans/docs-authoring-playbook.md). [제안](proposals/docs-authoring-playbook.md) 채택, 근거는 [ADR-010](2-design/adr/ADR-010-authoring-guides-in-stage-readmes.md). 묶음 A~H를 PR 하나씩 나른다 | done | — | [plan](3-build/plans/docs-authoring-playbook.md) | [PR #356](https://github.com/tkyoun0421/la-bie-belle/pull/356), [docs/log/2026-09-15.md](log/2026-09-15.md) |
| `edge-function-import` | Deno Edge Function이 `supabase/functions` 밖의 `src/`를 import할 수 있는지 확인한다 — [plan](3-build/plans/edge-function-import.md). 데이터 task의 첫 스파이크 | ready | — | [plan](3-build/plans/edge-function-import.md) | — |
| `account-data-plan` | 계정 데이터 구조 전환의 plan을 쓴다 — `3-build/plans/account-data.md`. 정본은 [account/design.md](2-design/modules/account/design.md)의 소유 데이터와 행위별 구현 계약. 완료 조건은 plan이 서는 것: `profiles.id` 분리와 `user_id → auth.users`, `profile_private`, 로그인 트리거 대신 `ensure_profile()`, 관리자 승인 함수, `update_my_photo()`까지 바꿀 마이그레이션·함수·integration 테스트 목록과 순서. 사진은 본인 변경 성공과 남의 변경 거부를 integration이 본다. plan이 서면 전환 task가 `blocked`에서 `ready`로 올라온다 | ready | — | 미작성 — 행이 완료 조건이다 | — |
| `account-data` | 계정 데이터 구조를 전환한다 — 기존 마이그레이션과 integration 테스트를 갈아엎는다. `ready`의 plan 쓰기 뒤 | blocked | `account-data-plan` | 미작성 — 선행 뒤 plan | — |
| `auth-entry` | 인증 진입을 전환한다 — `middleware.ts`를 `proxy.ts`로, 서버 `readAuthGate`의 승인 판정을 클라이언트 `['profile']`로. 정본은 [account/design.md](2-design/modules/account/design.md). `matcher`를 이때 같이 본다. 계정 데이터 구조 전환 뒤 | blocked | `account-data` | 미작성 — 선행 뒤 plan | — |
| `types-generation` | 타입 생성 절차를 세운다 — `pnpm types`가 `supabase gen types`를 감싸고 CI가 마이그레이션 뒤 diff 0을 본다. 정본은 [system/data-access.md](2-design/system/data-access.md#생성-타입). 계정 데이터 구조 전환 뒤 | blocked | `account-data` | 미작성 — 선행 뒤 plan | — |
| `schedule` | 근무표 — 달 만들기·날 열기·신청·확정. [schedule/design.md](2-design/modules/schedule/design.md). 달 키의 범위(달력 달인지 주 범위인지)가 [schedule/design.md](2-design/modules/schedule/design.md#아직-안-정한-것)에 열려 있어 먼저 닫는다 | blocked | [schedule/design.md](2-design/modules/schedule/design.md#아직-안-정한-것) | 미작성 — 선행 뒤 plan | — |
| `attendance` | 출근 인증 — [attendance/design.md](2-design/modules/attendance/design.md). 근무표 뒤 | blocked | `schedule` | 미작성 — 선행 뒤 plan | — |
| `payroll` | 급여 계산 — [payroll/design.md](2-design/modules/payroll/design.md). 출근 인증 뒤 | blocked | `attendance` | 미작성 — 선행 뒤 plan | — |
| `notification-first` | 알림(1차) — 공통 전송 기반과 1차 알림(승인·확정·전날·직전, [roadmap](1-plan/roadmap.md#릴리스-목록)). [notification/design.md](2-design/modules/notification/design.md#ui-연결). Edge Function 스파이크 뒤 | blocked | `edge-function-import` | 미작성 — 선행 뒤 plan | — |
| `notification-second` | 교대 알림·관리자 공지(2차) — 알림(1차) 뒤. 교대 승인 화면이 [system/navigation.md](2-design/system/navigation.md#아직-안-정한-것)에 열려 있어 먼저 닫는다 | blocked | `notification-first` | 미작성 — 선행 뒤 plan | — |
| `first-release` | 첫 출시 준비 — 배포 문서(적용·확인·되돌리기 순서, 환경별 설정 위치)와 운영 문서(장애 확인 위치·대응 담당·복구 후 확인)의 최소 안내, 지표의 집계 기준(분모·기간·수집 대상, [metrics.md](1-plan/metrics.md)). [5-deploy](5-deploy/README.md)·[6-maintain](6-maintain/README.md). 배포 플랫폼을 정한 뒤 — 1차 기능이 다 선 다음이고 데이터 task의 선행이 아니다 | blocked | [environments.md](5-deploy/environments.md#q-01) | 미작성 — 선행 뒤 plan | — |
| `dashboard` | 근무자 대시보드를 만든다 — 위 넷이 서기 전에는 못 연다. 착수할 때 spec을 [설계 안내](2-design/README.md#spec)의 새 형식(요구·설계·완료 조건·범위 밖)으로 다시 쓴다 — [spec](2-design/spec/dashboard.md) | blocked | `schedule`·`attendance`·`payroll`·`notification-first` | [spec](2-design/spec/dashboard.md) | — |
| `pending-screen-copy` | 승인 대기 화면의 넷째 도는 문구를 1차 문구로 바꾼다 — 「못 가는 날은 교대를 부탁해요」는 2차 교대 문구다. 문구는 [login.md](2-design/modules/account/screens/login.md#아직-안-정한-것)에서 정하고 문서·시안·`pending-screen.tsx` 셋을 같이 고친다. 1차 배포 전 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `system-detail-level` | `system/` 넷의 세세함 수준을 정한다 — 산문 반 결정 반이라 plan처럼 읽힌다는 지적. 총괄이 직접 손본다. 그때까지 지금 수준이 정본 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `ios-home-screen-checks` | iOS 홈 화면 앱에서 기기로 확인할 둘 — 가장자리 스와이프가 `popstate`를 주는지(안 주면 시트를 history에서 뺀다), `visibilitychange`가 앱 전환마다 오는지. [system/navigation.md](2-design/system/navigation.md#아직-안-정한-것)·[system/runtime.md](2-design/system/runtime.md#아직-안-정한-것) | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `logo-e2e` | 로고 렌더를 지키는 e2e 한 줄 — `public/google-g.svg`를 지워도 e2e가 초록이다. 「버튼 안 로고의 `background-image`가 비어 있지 않다」 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `webkit-ci` | CI에 webkit을 더한다 — 주 타깃이 아이폰 사파리인데 chromium만 돈다. [ADR-007](2-design/adr/ADR-007-web-pwa-over-native.md)이 열어둔 값 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `motion-delay-trap` | `motion.md`에 `delay-*` 함정을 적고 테스트로 잡는다 — core Tailwind의 `transition-delay`가 이겨서 `tw-animate-css`는 `[--tw-animation-delay]`로 우회하는데, 라이브러리 내부 변수라 이름이 바뀌면 조용히 죽는다 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `scaffold-leftovers` | `src/`의 스캐폴드 잔재를 지울지 — 총괄 지시가 있어야 지운다. 되돌리기 어려운 쪽을 기본값으로 안 삼는다 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `design-canvas-source` | 디자인 캔버스 빌드 소스를 저장소에 넣을지 — 지금은 세션 임시 폴더라 다시 못 만든다. `docs/2-design/design-system/canvas/`가 후보고, 넣으면 토큰이 바뀔 때 다시 빌드해 같은 링크에 올리는 일이 회차 절차가 된다. 캔버스는 아티팩트 CSP 탓에 Wanted Sans를 못 싣는다 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `sian-clause-mismatch` | 시안과 조항의 어긋남 넷을 정리한다 — ⓐ `.lrow .lv`가 `fg.neutral-muted`인데 `components.md`는 `fg.neutral` ⓑ 작은 버튼 30px가 세로 44px 규칙과 부딪힘 ⓒ AdminCalendar의 「마감일 당기기」가 누를 것처럼 안 보임 ⓓ 모든 시안의 `.backic`이 svg 20px(문서 28px)에 닿는 면 44px 없음. 시안을 고칠지 조항을 고칠지 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `popover-dark-ring` | 팝오버 다크 ring — 시안 둘(members-pending·members)이 `0 0 0 1px stroke.neutral`을 들고 있는데 정본은 `none`. `sian-auditor`로 잡는다 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `error-screen` | `error.tsx` — env가 없으면 미들웨어가 모든 요청에서 던져 Next 기본 에러 화면이 뜬다. 조용한 로그아웃보다 낫다고 정했고, 화면은 이때 그린다 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `playwright-config-cleanup` | `playwright.config.ts` 정리 — `workers: 1`이 `fullyParallel: true`를 무의미하게 만들고 CI 리트라이 2가 겹쳐 e2e가 무겁다 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `lint-rule-catalogue` | PR #197의 lint 규칙 표를 저장소로 — `DOCUMENTED_LINT_RULE_COUNT` 불변식이 그 표에 기대는데 정본이 PR 본문에만 있다 | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `tsx-dumb-ui-fixtures` | `tsx-dumb-ui.test.ts`의 인라인 픽스처 다섯을 `readFileSync`로 — 소스를 베낀 사본이라 소스가 바뀔 때마다 썩는다(`layout.tsx` 픽스처가 아직 Geist) | candidate | — | 미작성 — 행이 완료 조건이다 | — |
| `doc-map-links` | 문서 지도의 경로를 링크로 만들고 검사가 링크를 읽게 한다 — [plan](3-build/plans/doc-map-links.md) | done | — | [plan](3-build/plans/doc-map-links.md) | [docs/log/2026-09-14-3.md](log/2026-09-14-3.md) |
| `docs-structure-followup` | 문서 구조 후속 개선을 적용한다 — [제안](proposals/docs-structure-followup.md) | done | — | 미작성 — 채택된 [제안](proposals/docs-structure-followup.md)이 완료 기준을 든다 | [docs/log/2026-09-14-3.md](log/2026-09-14-3.md) |
| `docs-structure` | 문서 구조를 고친다 — [plan](3-build/plans/docs-structure.md) | done | — | [plan](3-build/plans/docs-structure.md) | [docs/log/2026-09-14-2.md](log/2026-09-14-2.md) |
| `supabase-client-entry` | Supabase 서버 클라이언트의 진입점을 하나로 모으고 인증 게이트를 features로 옮긴다 — [plan](3-build/plans/supabase-client-entry.md) | done | — | [plan](3-build/plans/supabase-client-entry.md) | [docs/log/2026-09-13.md](log/2026-09-13.md) |
| `doc-links` | 마크다운 문서를 읽는 모듈을 세우고 깨진 링크를 잡는다 — [plan](3-build/plans/doc-links.md) | done | — | [plan](3-build/plans/doc-links.md) | [docs/log/2026-09-11.md](log/2026-09-11.md) |
| `login-screens` | 로그인 화면과 승인 대기 화면을 만든다 — [spec](2-design/spec/login-screens.md) | done | — | [spec](2-design/spec/login-screens.md) | [docs/log/2026-09-07.md](log/2026-09-07.md) |
| `spec-gate` | spec 승인 게이트와 문서 구조 검사를 단다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-09-04.md](log/2026-09-04.md) |
| `dashboard-design` | 근무자 대시보드 디자인을 정한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-30.md](log/2026-08-30.md) |
| `tokens-contrast-check` | `tokens.md` 7절의 대비값을 기계가 재게 한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-29-2.md](log/2026-08-29-2.md) |
| `globals-css-generation` | `src/app/globals.css`를 `tokens.md`에서 생성한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-29-2.md](log/2026-08-29-2.md) |
| `login-screens-design` | 로그인 화면과 승인 대기 화면의 디자인을 정한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-29.md](log/2026-08-29.md) |
| `session-wiring-failures` | 세션 배선의 조용한 실패 둘을 드러낸다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-28-3.md](log/2026-08-28-3.md) |
| `session-foundation` | 세션 기반을 깐다 — [plan](3-build/plans/session-foundation.md) | done | — | [plan](3-build/plans/session-foundation.md) | [docs/log/2026-08-28-2.md](log/2026-08-28-2.md) |
| `tokens-uncovered-four` | `tokens.md` 8절이 덮지 않는 자리 넷을 메운다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-28.md](log/2026-08-28.md) |
| `state-tokens-fill` | 값이 비어 있던 상태 토큰 셋을 채운다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-28.md](log/2026-08-28.md) |
| `lint-and-format` | 규율을 lint와 포매터로 기계화한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26-4.md](log/2026-08-26-4.md) |
| `design-reference-review` | 디자인 레퍼런스 검토 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26-4.md](log/2026-08-26-4.md) |
| `swap-attendance-notification-rules` | 교대와 출근과 알림 규칙을 확정한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26-3.md](log/2026-08-26-3.md) |
| `account-schedule-rules` | 계정과 근무표 규칙을 확정한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26-3.md](log/2026-08-26-3.md) |
| `payroll-rules` | 급여 규칙을 확정한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26-3.md](log/2026-08-26-3.md) |
| `domain-rules-home` | 도메인 규칙의 집을 정한다 (ADR-004) | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26-2.md](log/2026-08-26-2.md) |
| `supabase-foundation` | Supabase 바탕과 integration 테스트 층을 세운다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26.md](log/2026-08-26.md) |
| `supabase-decision` | 영속과 인증을 Supabase로 정한다 (ADR-003) | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26.md](log/2026-08-26.md) |
| `integration-layer-agents` | integration 층에 손과 계획을 붙인다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-26.md](log/2026-08-26.md) |
| `sdd-ddd-tdd-adr` | SDD·DDD·TDD 자리를 ADR-002로 정한다 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-25-6.md](log/2026-08-25-6.md) |
| `prd` | PRD 작성 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-25-6.md](log/2026-08-25-6.md) |
| `test-split-and-recorder` | 테스트 계획·작성 분리와 회차 마감 위임 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-25-5.md](log/2026-08-25-5.md) |
| `subagents-fsd-tdd-hooks` | subagent 여섯과 FSD 배치, TDD 훅 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-25-4.md](log/2026-08-25-4.md) |
| `project-scaffold` | 프로젝트 스캐폴드 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-25-3.md](log/2026-08-25-3.md) |
| `collaboration-structure` | 협업 구조 확정 | done | — | 미작성 — 로그가 완료 기록이다 | [docs/log/2026-08-25.md](log/2026-08-25.md) |
