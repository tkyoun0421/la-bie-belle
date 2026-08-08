# P2-T05 handoff

## 2026-08-08 (3차) · 개발 완료

- 작업 식별자: P2-T05 (모집 운영 화면과 테스트)
- RADIO 기준: `docs/execution/radio/P2-T05-radio.md` revision 4, SHA-256 `08da0dd324eaee6f4b68910dbde69984c4948ff1957794b93b29f04a02b2f9fd` (index `development_approval` 일치)
- 재개 승인: 사용자가 2차 blocked의 선택지 1(근무자 일정 탭을 F-03 계열 월 경계 수정 한정으로 변경 허용 경로에 편입)을 승인, RADIO revision 4로 재봉인(커밋 `39d5f4a`)

### 이번 세션에서 한 일

1. `docs/execution/phases/index.jsonl`의 P2-T05를 `blocked` → `in_progress`로 전환(전 저장소 in_progress 1개, `pnpm gate:index` 통과 확인).
2. 근무자 일정 탭 F-03 근본 수정 — `src/app/(protected)/(tabs)/schedule/page.tsx`의 `parseMonthParam`에서 UTC(`Z`) 파싱을 제거해 서버 프로세스 로컬 타임존과 self-consistent하게 만들고, `ScheduleView`에 넘기는 `month`를 `Date` 대신 `"yyyy-MM"` 문자열로 바꿨다. `src/views/schedule/ui/ScheduleView.tsx`는 `month: string` prop을 받아 클라이언트 컴포넌트 내부 `useMemo`로 `Date`를 재구성하도록(관리자 달력과 동일 기법) 고쳤다. 파급으로 `schedule.mock.ts`의 `month` 필드와 `ScheduleView.test.tsx`의 `rerender` 호출부를 새 타입에 맞춰 최소 조정했다(단언 내용은 무수정).
3. 2차 blocked 시점에 발견한 E2E 자체 버그(날짜 숫자와 배지 숫자를 모두 매치하던 `getByText(/^[1-9]\d*$/)`)를 `applicationCountBadge(cell)` 헬퍼(`cell.locator("span.absolute")`)로 좁혀 수정.
4. `tests/e2e/recruitment-flow.spec.ts`에 `test.describe.configure({ mode: "serial" })`를 추가 — 두 테스트가 병렬 실행되면 서로의 전역 스케줄 픽스처(홈 마감 임박 카드 후보)가 오염되는 것을 발견해 순차 실행으로 격리했다. 시간대 회귀 테스트가 만드는 "오늘 마감" 임박 스케줄은 검증 후 `status: "CANCELLED"`로 정리해 재실행 내성을 확보했다.
5. `pnpm lint:ci`에서 발견한 기존 결함(`useScheduleApplicants.ts`의 `@typescript-eslint/no-floating-promises`)을 `void onList(...).then(...)`로 수정.
6. 신규 pgTAP `supabase/tests/16-recruitment-applicants.test.sql`(7 assertions)을 작성 — 인수 조건 2의 "철회자 제외·0명·동명이인" 경계값과 "권한"(비관리자는 RLS로 본인 신청만 조회) 항목을 실제 DB로 검증.

### 인수 조건별 구현·테스트

| 인수 조건 | 구현 | 테스트 |
| --- | --- | --- |
| 1 달력 셀 배지 | `count-applications-by-month.ts`(월 범위 group by), `recruitment-cell-state.ts` 확장, `calendar.tsx` 배지 렌더 | unit: `count-applications-by-month.test.ts`(4)·`application-count.test.ts`·`recruitment-cell-state.test.ts`(신규 4) / E2E: Test1 |
| 2 시트 신청 현황 | `list-applicants-by-schedule.ts`+action, `RecruitmentManageSheet`의 `ApplicantsSection`, `useScheduleApplicants` | unit: `list-applicants-by-schedule.test.ts`(5)·`.action.test.ts`(4)·`useScheduleApplicants.test.ts`(5, race condition 포함)·`schedule-applicant.test.ts` / pgTAP: `16-recruitment-applicants.test.sql`(7) / E2E: Test1 |
| 3 홈 카드 | `find-imminent-recruitment.ts`, `imminent-recruitment.ts`(순수 선정 함수), `home-priority.ts` 확장, `HomeView` 분기 | unit: `find-imminent-recruitment.test.ts`(4)·`imminent-recruitment.test.ts`(8, D+2/D+3 경계·동률)·`home-priority.test.ts`(예외 갱신)·`HomeView.test.tsx`(예외 갱신) / E2E: Test1(소멸)·Test2(노출) |
| 4 CLOSED 상세 | `schedule-detail-variant.ts`, `ScheduleDetailClosedView.tsx`, `schedule/[id]/page.tsx` 분기 | unit: `schedule-detail-variant.test.ts`(5) / component: `ScheduleDetailClosedView.test.tsx`(5) / E2E: Test1 |
| 5 시간대 회귀 | admin: `RecruitmentOpenView` month를 문자열화, `recruitment-month.ts`; 근무자: `schedule/page.tsx`+`ScheduleView` 동일 기법(이번 세션 편입분) | unit: `recruitment-month.test.ts`(4, `vi.stubEnv("TZ", ...)`) / E2E: Test2(America/Los_Angeles) |
| 6 E2E 왕복 | — | `tests/e2e/recruitment-flow.spec.ts` Test1 전체(모집 생성→다중 신청→배지·시트 반영→마감→근무자 구분·CLOSED 상세·홈 카드 소멸) |
| 7 회귀 | — | `pnpm verify`(전체 GREEN, 이번 세션 로그 보존) / `pnpm db:reset && pnpm db:test`(16 files, 764 tests, PASS) |

### 검증 실행 기록

- `pnpm db:reset && pnpm db:test`: 16 files, 764 tests, `Result: PASS`.
- `pnpm test:e2e -- recruitment-flow`: DB 리셋 후 1회 36 passed, 리셋 없는 재실행 1회에서도 이 스펙 2건은 재현 통과(다른 스펙 2건의 재실행 실패는 P2-T03/T04 기존 결함이며 이 task 범위 밖 — 아래 "관찰" 참고).
- `pnpm verify`(전체, `pnpm db:reset` 직후 단독 1회): format:check → lint:ci → typecheck → test(171 files/1024 tests) → harness:typecheck → harness:self-test(308 assertions) → check:docs → build → check:app-build → check:client-secret-scan → test:e2e(36 passed) → gate:all, 전 구간 GREEN. `pnpm gate:all` 별도 재실행으로 exit 0·침묵 재확인.

### 관찰(이 task 범위 밖, 정보 제공용)

- `recruitment-manage.spec.ts`·`recruitment-open.spec.ts`는 고정 상대 날짜를 써서 `pnpm db:reset` 없이 반복 재실행하면 `schedules_work_date_active_unique` 충돌로 실패한다. 이는 P2-T03/T04가 만든 기존 스펙의 결함(RADIO 허용 경로 밖)이며 이번 세션에서 손대지 않았다. `pnpm verify`가 요구하는 "db:reset 후 단독 1회" 실행에서는 재현되지 않는다.

### 증거·산출물 경로

- `docs/execution/runs/P2-T05/decision-signal.json`(2차 blocked 사건, 해소됨)
- `docs/execution/radio/P2-T05-radio.md` revision 4(재봉인 커밋 `39d5f4a`)
- `supabase/tests/16-recruitment-applicants.test.sql`(신규 pgTAP)
- `tests/e2e/recruitment-flow.spec.ts`(신규 E2E)

---

## 2026-08-08 (2차) · 개발 단계 안전 중단 (blocked) — F-03 계열 결함이 허용 경로 밖 파일에서 재현됨

- 작업 식별자: P2-T05 (모집 운영 화면과 테스트)
- 현재 단계: 개발(3단계) 진행 중 안전 중단 → 설계(2단계) 또는 기획(1단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-08T03:47:11Z
- RADIO 기준: `docs/execution/radio/P2-T05-radio.md` revision 3, SHA-256 `1feb1840a59458656e9dc011115618f3f8a19f746a4d7c496e3dffc245685e98` (index의 `development_approval`과 일치, 봉인 본문 무수정)

### 확정된 사실

- 기술 인수 조건 1(달력 셀 배지)·2(시트 신청 현황)·3(홈 카드 실데이터)·4(워커 CLOSED 상세)와 조건 5의 관리자 모집 달력 쪽 F-03(월 경계 시간대) 근본 수정·unit 회귀는 모두 구현·테스트를 완료했다. 신규/수정 파일은 RADIO 허용 경로 안이며 아직 스테이징하지 않고 워킹 트리에 보존했다(`git status`로 전체 목록 확인 가능).
- `tests/e2e/recruitment-flow.spec.ts`(RADIO 허용 경로 `tests/e2e/**` 안, 인수 조건 6·5 커버)를 작성해 로컬 Supabase·`pnpm build` 산출물로 실제 실행했다. 그 과정에서 근무자 일정 탭(`/schedule`, `src/app/(protected)/(tabs)/schedule/page.tsx`)이 관리자 달력과 동일한 F-03 패턴(`new Date(\`${value}-01T00:00:00Z\`)` UTC 파싱 후 Date 객체를 클라이언트 컴포넌트에 그대로 전달)을 가지고 있고, America/Los_Angeles 브라우저에서 실제로 월 경계가 하루 밀려 렌더되는 것을 재현했다(요청 `month=2031-02` → 렌더된 화면 "2031년 1월").
- 이 파일(`src/app/(protected)/(tabs)/schedule/page.tsx`, `src/views/schedule/ui/ScheduleView.tsx`)은 RADIO의 변경 허용 경로 밖이고 P2-T03 산출물이라, RADIO 비목표의 "P2-T01~T04 산출물 봉인 계약 무수정"과 인수 조건 5("F-03 월 경계 결함이... 고정된다")가 이 지점에서 충돌한다. 근거·선택지는 `docs/execution/runs/P2-T05/decision-signal.json`(2026-08-08T03:47:11Z, 이전 blocked 사건 기록을 대체 — 이전 기록은 git 커밋 `c302730`에 보존됨)에 남겼다.
- `tests/e2e/recruitment-flow.spec.ts`의 첫 번째 테스트(모집 운영 왕복)는 실제 실행에서 셀렉터 문제(`getByText(/^[1-9]\d*$/)`가 날짜 숫자 자체와 배지 숫자를 모두 매치)로 1건 추가 실패가 있었다 — 이는 F-03과 무관한 이 스펙 자체의 버그이며 blocked 해소 후 함께 고쳐야 한다(배지 전용 로케이터로 좁혀야 함, 예: `cell.locator("span.absolute")`).
- 이번 세션에서 `pnpm build`를 실행해 `.next` 산출물을 최신화했고, `pnpm test:e2e -- recruitment-flow`를 1회 실행했다(위 실패 포함). `docker`/로컬 Supabase는 세션 시작 시점부터 이미 떠 있었다.

### 미결 사항

- `decision-signal.json`의 `open_questions` 3건 — 근무자 일정 탭 F-03을 이 task 범위로 끌어들여 재봉인할지, 인수 조건 5의 범위를 관리자 달력으로 좁히고 후속 task로 분리할지, 재승인 성격(설계 재승인만인지 기획 반환까지 필요한지). 결정 주체: 사용자(조정자 경유).

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인하거나 기획 단계로 반환한다.
2. 재승인 후 개발 루프가 P2-T05를 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션이 만든 미스테이징 워킹 트리 산출물(신규 model/api/hooks/ui·수정 파일·`tests/e2e/recruitment-flow.spec.ts`)은 그대로 보존돼 있으므로, 다음 세션은 처음부터 다시 만들지 말고 이어서 (a) 결정된 범위에 맞게 `/schedule` 페이지 F-03 수정을 포함/제외하고 (b) 첫 번째 E2E 테스트의 배지 셀렉터를 고치고 (c) 나머지 검증 증거·handoff·커밋을 마무리하면 된다.

### 증거·산출물 경로

- `docs/execution/runs/P2-T05/decision-signal.json`(이번 사건, 이전 사건은 `c302730` 커밋에 보존)
- `docs/execution/radio/P2-T05-radio.md`(봉인 본문 무수정 확인)
- `docs/execution/reviews/P2-T02-review.json`의 F-03 finding — 이번에 다시 참조한 배경
- `tests/e2e/recruitment-flow.spec.ts`(워킹 트리, 미스테이징)

---

## 2026-08-08 · 개발 단계 안전 중단 (blocked)

- 작업 식별자: P2-T05 (모집 운영 화면과 테스트)
- 현재 단계: 개발(3단계) 착수 직후 안전 중단 → 다음 설계(2단계) 또는 기획(1단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-08T00:25:54Z

### 확정된 사실

- RADIO `docs/execution/radio/P2-T05-radio.md` revision 2, SHA-256 `db59b1d46ae007e4841eff79457a33a3278712bd9c320601721e0aed35c4aa1f`는 index의 `development_approval`과 일치하고 `gate:radio` 통과 상태다. 봉인 본문은 이번 세션에서 수정하지 않았다.
- RADIO 기술 인수 조건 1(관리자 모집 달력 셀의 applied 신청 수 배지)을 구현하려면 `src/shared/ui/calendar.tsx`(달력 날짜 셀을 전담 렌더링하는 공용 컴포넌트)를 수정해야 하는데, 이 파일은 RADIO의 '변경 허용 경로' 코드펜스(`src/shared/config/**`만 있고 `src/shared/ui/**`는 없음)에 없다. `gate:scope`가 이 파일의 스테이징을 차단한다. 근거와 재현 경로는 `docs/execution/runs/P2-T05/decision-signal.json`에 남겼다.
- 기술 인수 조건 2(시트 신청 현황)·3(홈 카드)·4(CLOSED 상세)·5의 F-03(월 경계 시간대) 회귀·관련 pgTAP·entities/schedule 신규 조회 3종(`count-applications-by-month`·`list-applicants-by-schedule`·`find-imminent-recruitment`)은 `src/shared/ui`를 건드리지 않고 RADIO가 선언한 허용 경로만으로 구현 가능하다고 판단했다. 다만 기술 인수 조건 6(E2E 왕복)이 배지 확인 단계를 포함해, 1번을 분리하면 그 E2E 시나리오도 함께 손봐야 한다.
- 이번 세션에서 `src/` 아래 코드·테스트는 한 줄도 작성·스테이징하지 않았다. 읽기 전용 조사(RADIO·관련 코드·P2-T02 교차 검증 F-03 finding 등)만 수행했다.
- P2-T03·P2-T04는 모두 `done`으로 커밋돼 있어 이 RADIO가 전제한 시트(`RecruitmentManageSheet`)·달력(`RecruitmentOpenView`, `toRecruitmentCellStates` 등)·다중 신청(`applyRecruitmentChanges`) 산출물은 실물로 확인했다. RADIO 미결 사항("P2-T03·T04 재봉인 시 재점검")은 해당 없음 — 두 task는 봉인된 형태 그대로다.

### 미결 사항

- `src/shared/ui/calendar.tsx`(또는 `src/shared/ui/**`)를 변경 허용 경로에 추가하는 재봉인으로 해소할지, 배지 표시 위치를 바꾸는 기획 재검토로 갈지, 기술 인수 조건 1을 별도 task로 분리할지 — 결정 주체: 사용자(조정자 경유), 반환 단계: 설계(경로 추가만이면) 또는 기획(표시 위치 자체를 바꾸면). 선택지별 트레이드오프는 `decision-signal.json`의 `open_questions`에 정리했다.

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인하거나 기획 단계로 반환한다.
2. 재승인 후 개발 루프가 P2-T05를 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션은 코드 작업물이 없어 이어받을 격리 작업물이 없다 — 다음 세션은 이 handoff와 decision-signal만 읽고 처음부터 구현을 시작하면 된다.

### 증거·산출물 경로

- `docs/execution/runs/P2-T05/decision-signal.json`
- `docs/execution/radio/P2-T05-radio.md` (봉인 본문 무수정 확인)
- `docs/execution/reviews/P2-T02-review.json`의 F-03 finding(월 경계 시간대) — 이번 조사에서 함께 확인한 관련 배경
