# P3-T01 handoff

## 2026-08-08 · 개발 단계 착수 직후 안전 중단 (blocked)

- 작업 식별자: P3-T01 (예식 아이템과 시간 추천)
- 현재 단계: 개발(3단계) 착수 직후 안전 중단 → 다음 설계(2단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-08T05:25:08Z

### 확정된 사실

- RADIO `docs/execution/radio/P3-T01-radio.md` revision 1, SHA-256 `abb9470c92ea2967a36e50f856d896cfd92068613c9e240af466e9add4597c5a`는 index의 `development_approval`과 일치하고 `gate:radio` 통과 상태다. 봉인 본문은 이번 세션에서 수정하지 않았다.
- RADIO의 범위·Architecture·기술 인수 조건 3이 새로 만들라고 지시하는 `checkin_rules`(first_ceremony_time·checkin_time) 테이블은, P0-T03(`done`)이 이미 만든 `check_in_rules`(first_ceremony_at·recommended_check_in) 테이블과 구조·목적·seed 값(10:00→08:20, 11:00→09:10)이 완전히 같다. `docs/standards/ARCHITECTURE.md` 143행도 이 기존 테이블을 P3-T01이 필요로 하는 바로 그 규칙표로 이미 문서화하고 있다. 근거·재현 경로는 `docs/execution/runs/P3-T01/decision-signal.json`에 남겼다.
- 기존 `check_in_rules`는 RLS가 켜져 있으나 정책이 0개(default deny)라 admin CRUD를 열려면 어차피 신규 마이그레이션으로 admin 전용 정책을 추가해야 한다 — 재사용해도 신규 작업량 자체는 크게 늘지 않는다.
- pgTAP 파일명 `16-ceremony-schema.test.sql`도 RADIO가 지정한 번호이지만 P2-T05가 같은 날 `16-recruitment-applicants.test.sql`을 이미 선점했다. 의미 내용이 없는 순번 표기라 재개 시 `17-ceremony-schema.test.sql`로 진행할 계획이며 별도 결정이 필요한 사안으로 보지 않는다.
- 이번 세션에서 `src/`·`supabase/` 아래 코드·마이그레이션은 한 줄도 작성·스테이징하지 않았다. RADIO·기존 스키마·ARCHITECTURE.md·관련 pgTAP·P0-T03 handoff를 읽는 조사만 수행했다.
- `ceremonies` 테이블, `schedules`의 예정 출퇴근 컬럼, `replace_schedule_ceremonies`·`set_schedule_planned_times` 함수는 기존 스키마에 대응물이 없어 이번 충돌의 영향을 받지 않는다 — 재봉인 후 RADIO 그대로 신설하면 된다.

### 미결 사항

- 기존 `check_in_rules` 테이블을 재사용(테이블·컬럼명 유지, admin RLS 정책만 추가, 재seed 없음)할지, 새 마이그레이션으로 RENAME해 RADIO 표기에 맞출지, 아니면 다른 이유로 별개 테이블을 유지할지 — 결정 주체: 사용자(조정자 경유), 반환 단계: 설계(재사용이면 development_approval만, RENAME이면 P0-T03 회귀 범위 합의도 필요). 선택지별 트레이드오프는 `decision-signal.json`의 `open_questions`에 정리했다.
- `check_in_rules`의 DOMAIN 소유 표기(P0-T03 RADIO는 DOMAIN:ATTENDANCE 소비로 적었으나 실제 소비자는 DOMAIN:SCHEDULING인 P3-T01)를 함께 정정할지 — 결정 주체: 사용자.

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인(재사용 경로면 revision 2, development_approval만)하거나 더 무거운 RENAME 경로를 선택한다.
2. 재승인 후 개발 루프가 P3-T01을 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션은 코드 작업물이 없어 이어받을 격리 작업물이 없다 — 다음 세션은 이 handoff와 decision-signal만 읽고 처음부터 구현을 시작하면 된다. 재개 시 pgTAP 파일명은 `17-ceremony-schema.test.sql`을 쓴다.

### 증거·산출물 경로

- `docs/execution/runs/P3-T01/decision-signal.json`
- `docs/execution/radio/P3-T01-radio.md` (봉인 본문 무수정 확인)
- `supabase/migrations/20260804000000_foundation_schema.sql`·`20260804000100_foundation_reference_data.sql`(기존 `check_in_rules` 정의·seed 확인)
- `docs/standards/ARCHITECTURE.md` 143행(기존 테이블의 문서화된 목적)

## 2026-08-08 · 개발 단계 종료(revision 2 재개, 구현 완료)

- 작업 식별자: P3-T01 (예식 아이템과 시간 추천)
- 현재 단계: 개발(3단계) 종료 → 다음 검증(4단계, 교차 리뷰)
- 기준 시각: 2026-08-08T06:37:41Z

### 확정된 사실

- RADIO `docs/execution/radio/P3-T01-radio.md` revision 2, SHA-256 `5d85abeb2cbbc56332389142e01df135b1321eb3dca3cb1531f631525b8d76b3`(index의 `development_approval`과 일치, `gate:radio` 통과)의 기술 인수 조건 1~7을 전부 구현했다. RADIO 적용 결과와 구현 중 확정한 세부는 `docs/execution/runs/P3-T01/radio.md`에 별도로 남겼다.
- DB: `supabase/migrations/20260808020000_ceremony_schema.sql`(`ceremonies` 신설·`check_in_rules` admin 정책 추가·`schedules` 예정 출퇴근 컬럼·`replace_schedule_ceremonies`·`set_schedule_planned_times` 함수), `supabase/tests/17-ceremony-schema.test.sql`(신규, plan 54) — `pnpm db:reset && pnpm db:test` 최종 실행 `Files=17, Tests=818, Result: PASS`(2026-08-08T06:30:48Z).
- TS: 추천 순수 모델(`entities/schedule/model/ceremony-times.ts`), 검증·에러 매핑(`ceremony-manage.ts`), 조회(`entities/schedule/api/get-schedule-prep.ts`), Server Actions(`features/ceremony/api/*`), 상태 훅(`useCeremonyEditor`·`useCheckInRuleActions`), 화면 분기 모델(`views/admin-schedule/model/schedule-prep-screen.ts`), UI(`features/ceremony/ui/*`, `views/admin-schedule/ui/AdminSchedulePrepView.tsx`), 라우트(`src/app/(protected)/admin/schedule/[id]/page.tsx`), 시트 진입 링크(`RecruitmentManageSheet.tsx`)를 모두 TDD RED→GREEN으로 구현했다. 증거는 `docs/execution/runs/P3-T01/tdd.json`(빨강·초록 쌍 전부 실제 명령 실행 기록).
- E2E: `tests/e2e/ceremony-edit.spec.ts`(신규, `ceremony-edit-e2e`) 2건 — RADIO 기술 인수 조건 6 시나리오 전체(예식 3개 생성→2번째 수정→시각순 확인→첫 예식 변경→재추천 확인창 승인→예정 출근 08:20 반영)와 확정 스케줄 읽기 전용 표시. try/finally로 픽스처(스케줄·예식)를 정리해 재실행 안전하다.
- `pnpm verify` 전체 GREEN(2026-08-08T06:34:15Z~06:37:14Z, exit 0): format·lint:ci·typecheck·vitest(180 files/1097 tests)·harness:typecheck·harness:self-test(308/308)·check:docs·build·check:app-build·check:client-secret-scan·전체 e2e(38/38, 신규 2건 포함)·gate:all(index·radio·handoff·tdd·scope 전부 통과).
- 위험 기반 테스트 표의 "테스트함" 선언은 전부 실제 테스트로 실증했다. "동시성" 행은 RADIO 비고·P2-T03 선례와 동일하게 `for update` 잠금 존재를 함수 정의 문자열 검사로 구조적으로만 확인했다(pgTAP은 단일 커넥션이라 실제 동시 세션을 재현하지 못한다).
- 구현 중 발견한 세부 재해석 8건(스키마 정책 범위, LB020 재사용, `ceremonies` 컬럼 최소화, snake_case RPC 키, 타입 위치, 에러 표시 방식 등)은 새 설계 결정이 아니라 RADIO 문구 안에서의 선택이었다 — 전부 `docs/execution/runs/P3-T01/radio.md`에 근거와 함께 기록했다.

### 미결 사항

- 없음. RADIO의 유일한 미결 사항(P2-T04·T05 재봉인 시 시트 진입 링크 재점검)은 두 task가 이미 재봉인 없이 done 상태라 해당하지 않았다.

### 다음 행동

1. 조정자가 이 커밋을 대상으로 [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자(`opus`·`codex`)를 호출해 `docs/execution/reviews/P3-T01-review.json`을 남긴다.
2. 확정 발견이 없거나 fix round가 필요 없으면 `done`으로 갱신하고 대시보드를 재생성한다. fix round가 필요하면 개발 단계로 돌아와 이 handoff를 이어 읽는다.
3. push는 `ci-finisher`가 맡는다 — 이 세션은 커밋까지만 완료했다.

### 증거·산출물 경로

- `docs/execution/runs/P3-T01/radio.md` (RADIO 적용 결과·구현 중 세부 재해석 8건)
- `docs/execution/runs/P3-T01/tdd.json` (RED→GREEN 증거 전체)
- `supabase/tests/17-ceremony-schema.test.sql`, `supabase/migrations/20260808020000_ceremony_schema.sql`
- `tests/e2e/ceremony-edit.spec.ts`
- `src/entities/schedule/**`, `src/features/ceremony/**`, `src/views/admin-schedule/**`, `src/app/(protected)/admin/schedule/**`

## 2026-08-08 · 검증 수정 라운드(revision 3, F-02·F-03·F-05·F-06)

- 작업 식별자: P3-T01 (예식 아이템과 시간 추천)
- 현재 단계: 교차 검증 fix round 완료 → 다음 재검증(4단계, 조정자가 재리뷰 호출)
- 기준 시각: 2026-08-08T09:29:25Z

### 확정된 사실

- RADIO `docs/execution/radio/P3-T01-radio.md` revision 3, SHA-256 `81a1ce185414ae325f9bdd27016221d265acf87804ea1cfb2eddbde127a0226b`(index의 `development_approval`과 일치)로 재봉인됐다. **F-01(high, 보안)은 코드 변경 없이 재봉인 문구 정정만으로 해소됐다** — 예정 출퇴근 컬럼이 기존 `schedules` select 정책(admin·활성 근무자 공유 role)으로 조회되는 것을 P3-T07 이전까지 한시 수용하는 것으로 불변 규칙·Data model 절을 정정했다.
- **F-02(DB 경계 공백, 수정 완료)**: `set_schedule_planned_times`에 `checkin is null or checkout is null` 명시 검사(`22023`)를 추가하고, `schedules_planned_times_pair_check` CHECK 제약(편측 NULL 저장 차단)을 컬럼에 걸었다. pgTAP으로 NULL 인자 두 경우(checkin만 NULL/checkout만 NULL) 모두 `throws_ok`로 검증했고, CHECK 제약 자체도 postgres 세션에서 직접 UPDATE로 위반시켜 확인했다.
- **F-02(초 단위 거부, 수정 완료)**: `ceremonies_starts_at_minute_check`·`schedules_planned_checkin_minute_check`·`schedules_planned_checkout_minute_check` 세 CHECK 제약(`extract(second from ...) = 0`)을 추가했다. TS `TimeStringSchema`가 이미 초 단위 입력을 구조적으로 차단해 함수 레벨 사전 검사는 두지 않고 DB 최종 강제로만 뒀다(근거는 `radio.md` 검증 수정 라운드 절 참조). pgTAP은 postgres 세션 직접 INSERT/UPDATE로 초 단위 값을 시도해 `23514`(check_violation)를 확인했다.
- **F-03(저장 전 추천 미리보기, 수정 완료)**: `useCeremonyEditor`에 `recommendationPreview`(useMemo 파생값, 저장 왕복 없음)를 추가해 `ceremonyTimes`가 바뀔 때마다(생성 직후·개별 시각 수정 직후) 즉시 재계산되도록 했다. `PlannedTimesEditor`가 이 값을 helperText로 렌더해 "추천 HH:MM" 형태로 노출하고, 규칙표에 매칭 규칙이 없을 때·자정 캡이 걸렸을 때를 구분해 표시한다. 기존 `pendingRecommendation`(저장 성공 후 확인창 흐름)과는 별개 상태로 공존한다.
- **F-05(감사 로그 전후 값 누락, 수정 완료)**: `ceremonies_replaced` 이벤트 detail에 `previous_ceremony_times`·`new_ceremony_times`(HH:MM 배열)를, `planned_times_set` 이벤트 detail에 `previous_checkin`·`previous_checkout`·`new_checkin`·`new_checkout`(첫 저장 시 previous는 NULL)을 기록하도록 두 함수를 수정했다. 시간값은 PII가 아니라 그대로 기록했다. pgTAP으로 최초 저장(previous NULL)·실제 변경(previous 값 존재) 두 케이스 모두 detail 내용을 `is`로 단언했다.
- **F-06(자정 경계 생성 버그, 수정 완료)**: `generateCeremonyTimes`가 마지막 예식 시각이 자정(24:00)에 걸치거나 넘으면 `null`을 반환하도록 바꿨다(생성 거부 방식 선택, 근거는 `radio.md` 참조). 훅의 `generateFromCount`가 `null`을 받으면 목록을 바꾸지 않고 스낵바로 안내한다. 기존 "24시간 순환" 단위 테스트를 제거하고 거부 계약·경계값(23:59 허용, 23:00+2개 거부) 테스트로 교체했다.
- TDD: 위 4건 모두 RED→GREEN을 실제 명령 실행으로 남겼다(`docs/execution/runs/P3-T01/tdd.json`). `pnpm db:test`는 새 pgTAP 단언을 수정 전 마이그레이션에 대고 먼저 실패시켜(2026-08-08T09:24:06Z, exit 1) 진짜 RED를 확보한 뒤 수정된 마이그레이션으로 복원해 GREEN(2026-08-08T09:24:59Z, exit 0, `17-ceremony-schema.test.sql` 65/65·전체 829/829 PASS)을 받았다.
- `pnpm db:reset && pnpm db:test` 최종 재확인 GREEN(829/829, 2026-08-08T09:26:30Z~09:27:01Z), db:reset 이후 `pnpm test:e2e tests/e2e/ceremony-edit.spec.ts` GREEN(2/2, 09:27:08Z), `pnpm verify` 전체 GREEN(2026-08-08T09:27:17Z~09:29:25Z, exit 0): format·lint:ci·typecheck·vitest(180 files/1104 tests)·harness:typecheck·harness:self-test(308/308)·check:docs·build·check:app-build·check:client-secret-scan·전체 e2e(38/38)·gate:all.
- F-04(E2E 픽스처 정리)·F-07(미사용 검증 함수)·F-08(pgTAP #04 레코드)은 사용자가 백로그로 명시적으로 보낸 항목이라 이번 라운드에서 건드리지 않았다.

### 미결 사항

- 없음. 이번 라운드에 배정된 F-02·F-03·F-05·F-06 전부 수정·검증 완료했고, F-01은 코드 변경이 필요하지 않았다.

### 다음 행동

1. 조정자가 이 fix round 커밋을 대상으로 재검증(재리뷰)을 진행한다. 이 세션은 `status`를 `in_progress`로 남겨뒀다 — `done` 전환은 조정자 몫이다.
2. 재검증이 통과하면 조정자가 `done`으로 갱신하고 대시보드를 재생성한다.
3. push는 `ci-finisher`가 맡는다 — 이 세션은 커밋까지만 완료했다.

### 증거·산출물 경로

- `docs/execution/runs/P3-T01/radio.md` (검증 수정 라운드 절 — 4건 구현 세부 선택과 근거)
- `docs/execution/runs/P3-T01/tdd.json` (fix round RED→GREEN 3쌍 추가)
- `supabase/migrations/20260808020000_ceremony_schema.sql`, `supabase/tests/17-ceremony-schema.test.sql`
- `src/entities/schedule/model/ceremony-times.ts`, `src/features/ceremony/hooks/useCeremonyEditor.ts`, `src/features/ceremony/ui/PlannedTimesEditor.tsx`, `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`

## 2026-08-08 · 검증 종료 (교차 검증 완료 → done)

- 작업 식별자: P3-T01
- 현재 단계: 검증(4단계) 종료 → done
- 기준 시각: 2026-08-08T09:40Z

### 확정된 사실

- 교차 검증(리뷰어 `opus`·`codex`, 개발 커밋 892d06f 대상)에서 확정 발견 8건이 나왔다 —
  high 1(예정 출퇴근 select 노출), medium 5, low 2. 기각 0건.
- high F-01은 봉인 충돌(행 단위 RLS·단일 authenticated role 구조에서 컬럼 select만 admin
  전용으로 강제 불가)로 판정돼 사용자 결정 "한시 노출 수용"으로 RADIO revision 3 재봉인(커밋
  3de0e09)해 종결했다. 코드 무수정은 양 리뷰어가 재확인했다.
- 사용자 승인 수정 라운드(커밋 6e614b9)가 F-02(NULL·초 단위 DB 제약)·F-03(저장 전 추천
  미리보기)·F-05(감사 전후 값)·F-06(자정 경계 생성 거부)를 수정했고, 양 리뷰어 재확인에서
  4건 전부 해소 판정을 받았다.
- 재확인에서 양 리뷰어가 독립적으로 같은 새 결함 1건(빈 예식 행의 추천 미리보기 오표시,
  low)을 발견해 전원 인정됐다.
- 최종 미해결 4건(medium 1·low 3)은 결과 파일 `docs/execution/reviews/P3-T01-review.json`과
  backlog에 기록했다. total 89 (cq 88 · tests 82 · sec 90 · perf 96 · arch 88).
- `pnpm gate:all` 침묵, `pnpm test` 1104/1104 통과(조정자 재실행 확인).

### 미결 사항

- 없음. backlog 4건은 backlog 문서가 소유한다.

### 다음 행동

1. index `done` 전환 + 대시보드 재생성 + 마감 커밋.
2. `ci-finisher`가 미push 커밋 전체(b8a9aa0부터 마감 커밋까지)를 push하고 CI를 감시한다.
