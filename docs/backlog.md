# backlog

task 보드다. 행 하나가 task 하나고, 완료 조건은 그 행이 링크하는 spec이나 plan이 담는다(ADR-005). 「다음」은 위가 먼저고 바로 잡을 수 있다. 「대기」는 완료 조건이 아직 없어 못 잡는다 — 무엇이 먼저 서야 하는지만 적는다. 「후보」는 작은 할 일이고 완료 조건은 행에 있다. 큰 순서(릴리스 단위)는 `1-plan/roadmap.md`가 담는다. 끝난 task는 완료로 내리고 로그 링크를 단다.

## 다음

- [ ] 문서 구조를 고친다 — 여덟 항목이 다 들어갔다. #324가 merge되면 완료로 내린다 — [plan](3-build/plans/docs-structure.md)
- [ ] Deno Edge Function이 `supabase/functions` 밖의 `src/`를 import할 수 있는지 확인한다 — 되면 `deno.json` 맵핑, 안 되면 CI가 `_shared/`로 복사. 결과를 [api/notification.md](2-design/architecture/api/notification.md)의 그 문단에 적는다. 데이터 task의 첫 스파이크
- [ ] 계정 데이터 구조를 전환한다 — `profiles.id` 분리와 `user_id → auth.users`, `profile_private`, 로그인 트리거 대신 `ensure_profile()`, 관리자 승인은 security definer 함수. 정본은 [data-model/account.md](2-design/architecture/data-model/account.md)·[api/account.md](2-design/architecture/api/account.md). 기존 마이그레이션과 integration 테스트를 갈아엎는다. plan을 쓴 뒤 잡는다
- [ ] 인증 진입을 전환한다 — `middleware.ts`를 `proxy.ts`로, 서버 `readAuthGate`의 승인 판정을 클라이언트 `['profile']`로. 정본은 [runtime/account.md](2-design/architecture/runtime/account.md). `matcher`를 이때 같이 본다. 계정 데이터 구조 뒤
- [ ] 타입 생성 절차를 세운다 — `pnpm types`가 `supabase gen types`를 감싸고 CI가 마이그레이션 뒤 diff 0을 본다. 정본은 [api/README.md](2-design/architecture/api/README.md#읽기). 계정 데이터 구조 뒤

## 대기

완료 조건이 없다. 대시보드가 이 넷을 기다린다.

- 근무표 — 달 만들기·날 열기·신청·확정. [data-model/schedule.md](2-design/architecture/data-model/schedule.md)·[api/schedule.md](2-design/architecture/api/schedule.md). 달 키의 범위(달력 달인지 주 범위인지)가 [runtime](2-design/architecture/runtime/README.md#아직-안-정한-것)에 열려 있어 먼저 닫는다
- 출근 인증 — [data-model/attendance.md](2-design/architecture/data-model/attendance.md)·[api/attendance.md](2-design/architecture/api/attendance.md). 근무표 뒤
- 급여 계산 — [data-model/payroll.md](2-design/architecture/data-model/payroll.md)·[api/payroll.md](2-design/architecture/api/payroll.md). 출근 인증 뒤
- 알림 — [data-model/notification.md](2-design/architecture/data-model/notification.md)·[api/notification.md](2-design/architecture/api/notification.md). Edge Function 스파이크 뒤. 교대 승인 화면이 [flows](2-design/architecture/flows/README.md#아직-안-정한-것)에 열려 있다
- [ ] 근무자 대시보드를 만든다 — 위 넷이 서기 전에는 못 연다. 착수할 때 spec을 [설계 안내](2-design/README.md#spec)의 새 형식(요구·설계·완료 조건·범위 밖)으로 다시 쓴다 — [spec](2-design/spec/dashboard.md)

## 후보

- [ ] `architecture/` 넷의 세세함 수준을 정한다 — 산문 반 결정 반이라 plan처럼 읽힌다는 지적. 총괄이 직접 손본다. 그때까지 지금 수준이 정본
- [ ] iOS 홈 화면 앱에서 기기로 확인할 둘 — 가장자리 스와이프가 `popstate`를 주는지(안 주면 시트를 history에서 뺀다), `visibilitychange`가 앱 전환마다 오는지. [flows](2-design/architecture/flows/README.md#아직-안-정한-것)·[runtime](2-design/architecture/runtime/README.md#아직-안-정한-것)
- [ ] 로고 렌더를 지키는 e2e 한 줄 — `public/google-g.svg`를 지워도 e2e가 초록이다. 「버튼 안 로고의 `background-image`가 비어 있지 않다」
- [ ] CI에 webkit을 더한다 — 주 타깃이 아이폰 사파리인데 chromium만 돈다. [ADR-007](2-design/adr/ADR-007-web-pwa-over-native.md)이 열어둔 값
- [ ] `motion.md`에 `delay-*` 함정을 적고 테스트로 잡는다 — core Tailwind의 `transition-delay`가 이겨서 `tw-animate-css`는 `[--tw-animation-delay]`로 우회하는데, 라이브러리 내부 변수라 이름이 바뀌면 조용히 죽는다
- [ ] `src/`의 스캐폴드 잔재를 지울지 — 총괄 지시가 있어야 지운다. 되돌리기 어려운 쪽을 기본값으로 안 삼는다
- [ ] 디자인 캔버스 빌드 소스를 저장소에 넣을지 — 지금은 세션 임시 폴더라 다시 못 만든다. `docs/2-design/design-system/canvas/`가 후보고, 넣으면 토큰이 바뀔 때 다시 빌드해 같은 링크에 올리는 일이 회차 절차가 된다. 캔버스는 아티팩트 CSP 탓에 Wanted Sans를 못 싣는다
- [ ] 시안과 조항의 어긋남 넷을 정리한다 — ⓐ `.lrow .lv`가 `fg.neutral-muted`인데 `components.md`는 `fg.neutral` ⓑ 작은 버튼 30px가 세로 44px 규칙과 부딪힘 ⓒ AdminCalendar의 「마감일 당기기」가 누를 것처럼 안 보임 ⓓ 모든 시안의 `.backic`이 svg 20px(문서 28px)에 닿는 면 44px 없음. 시안을 고칠지 조항을 고칠지
- [ ] 팝오버 다크 ring — 시안 둘(members-pending·members)이 `0 0 0 1px stroke.neutral`을 들고 있는데 정본은 `none`. `sian-auditor`로 잡는다
- [ ] `error.tsx` — env가 없으면 미들웨어가 모든 요청에서 던져 Next 기본 에러 화면이 뜬다. 조용한 로그아웃보다 낫다고 정했고, 화면은 이때 그린다
- [ ] `playwright.config.ts` 정리 — `workers: 1`이 `fullyParallel: true`를 무의미하게 만들고 CI 리트라이 2가 겹쳐 e2e가 무겁다
- [ ] PR #197의 lint 규칙 표를 저장소로 — `DOCUMENTED_LINT_RULE_COUNT` 불변식이 그 표에 기대는데 정본이 PR 본문에만 있다
- [ ] `tsx-dumb-ui.test.ts`의 인라인 픽스처 다섯을 `readFileSync`로 — 소스를 베낀 사본이라 소스가 바뀔 때마다 썩는다(`layout.tsx` 픽스처가 아직 Geist)

## 진행

(없음)

## 완료

- [x] Supabase 서버 클라이언트의 진입점을 하나로 모으고 인증 게이트를 features로 옮긴다 — [plan](3-build/plans/supabase-client-entry.md) — [docs/log/2026-09-13.md](log/2026-09-13.md)
- [x] 마크다운 문서를 읽는 모듈을 세우고 깨진 링크를 잡는다 — [plan](3-build/plans/doc-links.md) — [docs/log/2026-09-11.md](log/2026-09-11.md)
- [x] 로그인 화면과 승인 대기 화면을 만든다 — [spec](2-design/spec/login-screens.md) — [docs/log/2026-09-07.md](log/2026-09-07.md)
- [x] spec 승인 게이트와 문서 구조 검사를 단다 — [docs/log/2026-09-04.md](log/2026-09-04.md)
- [x] 근무자 대시보드 디자인을 정한다 — [docs/log/2026-08-30.md](log/2026-08-30.md)
- [x] `tokens.md` 7절의 대비값을 기계가 재게 한다 — [docs/log/2026-08-29-2.md](log/2026-08-29-2.md)
- [x] `src/app/globals.css`를 `tokens.md`에서 생성한다 — [docs/log/2026-08-29-2.md](log/2026-08-29-2.md)
- [x] 로그인 화면과 승인 대기 화면의 디자인을 정한다 — [docs/log/2026-08-29.md](log/2026-08-29.md)
- [x] 세션 배선의 조용한 실패 둘을 드러낸다 — [docs/log/2026-08-28-3.md](log/2026-08-28-3.md)
- [x] 세션 기반을 깐다 — [plan](3-build/plans/session-foundation.md) — [docs/log/2026-08-28-2.md](log/2026-08-28-2.md)
- [x] `tokens.md` 8절이 덮지 않는 자리 넷을 메운다 — [docs/log/2026-08-28.md](log/2026-08-28.md)
- [x] 값이 비어 있던 상태 토큰 셋을 채운다 — [docs/log/2026-08-28.md](log/2026-08-28.md)
- [x] 규율을 lint와 포매터로 기계화한다 — [docs/log/2026-08-26-4.md](log/2026-08-26-4.md)
- [x] 디자인 레퍼런스 검토 — [docs/log/2026-08-26-4.md](log/2026-08-26-4.md)
- [x] 교대와 출근과 알림 규칙을 확정한다 — [docs/log/2026-08-26-3.md](log/2026-08-26-3.md)
- [x] 계정과 근무표 규칙을 확정한다 — [docs/log/2026-08-26-3.md](log/2026-08-26-3.md)
- [x] 급여 규칙을 확정한다 — [docs/log/2026-08-26-3.md](log/2026-08-26-3.md)
- [x] 도메인 규칙의 집을 정한다 (ADR-004) — [docs/log/2026-08-26-2.md](log/2026-08-26-2.md)
- [x] Supabase 바탕과 integration 테스트 층을 세운다 — [docs/log/2026-08-26.md](log/2026-08-26.md)
- [x] 영속과 인증을 Supabase로 정한다 (ADR-003) — [docs/log/2026-08-26.md](log/2026-08-26.md)
- [x] integration 층에 손과 계획을 붙인다 — [docs/log/2026-08-26.md](log/2026-08-26.md)
- [x] SDD·DDD·TDD 자리를 ADR-002로 정한다 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] PRD 작성 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] 테스트 계획·작성 분리와 회차 마감 위임 — [docs/log/2026-08-25-5.md](log/2026-08-25-5.md)
- [x] subagent 여섯과 FSD 배치, TDD 훅 — [docs/log/2026-08-25-4.md](log/2026-08-25-4.md)
- [x] 프로젝트 스캐폴드 — [docs/log/2026-08-25-3.md](log/2026-08-25-3.md)
- [x] 협업 구조 확정 — [docs/log/2026-08-25.md](log/2026-08-25.md)
