# P3-T11 RADIO 적용 결과

- 기준 RADIO: `docs/execution/radio/P3-T11-radio.md` revision 1, SHA-256
  `f7db6ee2ab3561dd3228f21d8b4045ee500a45cd33c4d5689a21d1fd4a31cc32`(index.jsonl
  `development_approval`과 시작 전 대조 완료, 일치).
- 기준 커밋: `e4f628b`(RADIO 봉인 커밋).

## 적용 결과 요약

RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 정지 조건 3개는
모두 발동하지 않았다 — 아래 "정지 조건 점검"에 실증 근거를 남긴다.

1. **마이그레이션 1개**(`supabase/migrations/20260818000000_confirmation_warning_scope.sql`)로
   `confirm_schedule`·`replace_position_assignments` 둘 다 재정의했다.
   - `confirm_schedule`: `position_counts` CTE를 `relevant_positions`(필요 인원 행 ∪
     `assignment_trainees` 잔존 포지션) union으로 감싸고, 표 밖 포지션은
     `schedule_position_requirements`에 대한 `left join`으로 `required_count`를 0
     coalesce했다. 필터(`required_count > assigned_count`,
     `assigned_count = 0 and trainee_count >= 1`)·정렬·본문 나머지는 무수정.
     표 밖에 정식 배정만 남은 포지션은 `relevant_positions`에 애초에 들어가지 않으므로
     (교육생 residual만 union 소스) 어떤 경고에도 나타나지 않는다 — RADIO 불변 규칙과 정확히
     일치.
   - `replace_position_assignments`: 486행의 무조건 비활성 거부를 제거하고, added/added_trainee
     diff 계산 직후·자격 루프 앞에 `not position_active and (added_ids 또는 added_trainee_ids
     비어있지 않음)` 조건으로 재배치했다. 문구·errcode(`'비활성 포지션에는 배정할 수
     없습니다'`, 22023)는 그대로다. 본문 나머지 무수정.
   - `security definer`·`set search_path`·revoke/grant 관례 보존 — 두 함수 모두 기존과 동일한
     인자 시그니처로 `create or replace`했으므로 OID가 유지돼 기존 grant가 자동 보존된다(재선언
     불필요, `\df` 재확인 없이도 함수 OID 불변으로 보증됨).

2. **`list-schedule-requirements.ts`**: 교육생 쿼리를 `position_id, positions(name,
   sort_order)`로 확장하고 `traineePositions: TraineePosition[]`(중복 제거, Map 기반)을
   결과에 추가했다. 기존 필드·정렬·절단 가드 무수정.

3. **`confirmation-warnings.ts`**: `ComputeConfirmationWarningsInput`에 `traineePositions`
   필수 필드를 추가했다. 표 행 순회는 기존 그대로이고, 그 뒤 표 밖 교육생 포지션(표 안에 없고
   `assignedCounts`가 0인 것만)을 `sortOrder`·이름순으로 `noManager`에 추가한다.
   `assignedCounts`가 이미 존재하는 표 밖 포지션(정식+교육생 혼재)은 걸러진다 — DB 쪽
   `position_counts`의 `assigned_count`와 동일 규칙.

4. **`AdminSchedulePrepView.tsx`·`page.tsx`**: prop 전달만 추가했다. 계산 로직 이동 없음.

5. **`confirm-schedule.ts`(features)는 무수정** — 기획 결정대로 확정 응답 경고를 버리는
   클라이언트 동작을 그대로 뒀다.

## 구현 중 확정한 세부(설계 재해석이 아닌 구체화)

1. **`AdminSchedulePrepView.tsx`(ui 세그먼트)는 `entities/schedule/api/*`를 import할 수
   없다.** `config/fsd.json`의 `segments.ui.forbidImports`가 `**/api/**`를 막고
   ESLint `project/segment-imports`가 즉시 걸린다(`import type`으로 시도해도 동일하게
   차단됨 — 경로 패턴 기반 규칙이라 type-only 여부를 구분하지 않는다). P3-T06 handoff에 이미
   기록된 동일 패턴(`ConfirmScheduleDialog.tsx`가 `views/model` 타입을 구조적 타이핑으로
   로컬 선언한 선례)을 그대로 따라, `AdminSchedulePrepView.tsx`에 같은 필드 구조의
   `TraineePosition` 타입을 로컬로 선언했다. `views/admin-schedule/model/confirmation-warnings.ts`
   (model 세그먼트, `forbidImports`에 `**/api/**` 없음)는 `entities/schedule/api/list-schedule-requirements`에서
   `TraineePosition`을 정상 import한다 — 계산은 여전히 model에만 있고 표시(ui)는 구조가 맞는
   로컬 타입으로만 받는다는 RADIO Architecture 절과 일치. 정지 조건("조회 계약을 넓혀야 하는
   경우")에 해당하지 않는 순수 레이어 임포트 방향 문제로 판단했다.
2. **`AdminSchedulePrepView.tsx`의 `traineePositions` prop을 선택(optional, 기본값
   `[]`)으로 뒀다.** `src/views/admin-schedule/ui/__tests__/AdminSchedulePrepView.test.tsx`는
   RADIO 허용 경로 밖이라 수정할 수 없는데, 필수 prop으로 만들면 그 테스트가 컴파일에서
   깨진다. `computeConfirmationWarnings`의 `ComputeConfirmationWarningsInput.traineePositions`는
   RADIO Interface 절대로 필수 필드로 유지했다(허용 경로 안의 두 테스트 파일만 갱신).
3. **`page.tsx`가 `traineePositions`를 `resolveRequirementSectionData`를 거치지 않고
   `requirementsResult`에서 직접 읽어 prop으로 넘긴다.** `requirement-section-data.ts`는
   RADIO 허용 경로 밖이다. `requirementsResult.ok`가 false면 `resolveRequirementSectionData`가
   `{ ok: false }`를 반환해 그 직후 `ErrorScreen`으로 즉시 반환되므로(76~78행,
   `AdminSchedulePrepView`는 렌더되지 않음) `requirementsResult.ok ? requirementsResult.traineePositions
   : []`를 직접 참조해도 게이팅 의미가 달라지지 않는다 — `AdminSchedulePrepView`가 실제로
   렌더되는 모든 경로에서 `requirementsResult.ok`는 항상 true다.
4. **`list-schedule-requirements.ts`의 `TraineeRow.positions`를 `undefined`에도 방어적으로
   처리했다(`!row.positions`, `=== null` 아님).** 기존 단위 테스트 다수(교육생 카운트만
   검증하는 케이스들)의 mock 데이터가 `positions` 필드 자체를 생략한 채로 남아 있어(질의
   변경과 무관하게 그대로 둠 — 카운트 로직과 무관), 런타임에서 `row.positions`가
   `undefined`가 될 수 있다. `RequirementRow.positions`가 이미 `| null` 방어를 쓰는 것과
   같은 방어적 철학을 재사용했을 뿐 새 계약을 만들지 않았다.
5. **pgTAP 21의 "P3-T11" 신규 블록에서 `confirm_schedule`의 반환 jsonb를 임시 테이블
   (`p3t11_confirm_capture`)에 캡처했다.** 기존 이 파일의 관례는 `lives_ok`로 성공만
   확인하고 `scheduling_audit_logs.detail`만 값으로 단언했는데, RADIO 기술 인수 조건 1은
   "반환 jsonb와 감사 detail 양쪽"을 값으로 요구한다. `confirm_schedule` 호출은 상태를
   전이시켜 재호출이 불가능하므로, `do $$ ... $$` 블록으로 단일 호출의 반환값을 캡처해
   양쪽을 모두 단언했다. 임시 테이블은 `set local role authenticated` **이후**에 만들어야
   한다 — 이전에 만들면 소유자가 슈퍼유저(테스트 러너)가 되어 `authenticated`로 전환한
   `do` 블록의 insert가 permission denied로 막힌다(직접 겪고 고침, 근거는
   `docs/execution/runs/P3-T11/tdd.json`의 21번 RED 로그).
6. **pgTAP 19의 "혼합 호출" 준비 insert를 멱등하게 작성했다.** RED 단계(마이그레이션 미적용)에서
   앞선 축소·전원 해제 단언이 여전히 거부돼 F3(`...006`)가 지워지지 않은 채 남을 수 있어,
   원래 무조건 insert였다면 unique 제약 위반으로 트랜잭션이 중단돼 plan 밖 테스트 실패까지
   집어삼켰다. `where not exists (...)` 가드로 재삽입을 멱등하게 만들어 RED 실행이 118개
   전부를 완주하게 했다(GREEN 동작은 무수정).

## 정지 조건 점검

RADIO가 명시한 3개 정지 조건 중 어느 것도 발동하지 않았다.

1. **기존 pgTAP·단위·e2e가 「비활성 포지션의 축소·전원 해제 거부」를 인수 조건으로 단언한
   경우** — 발동 안 함. 구현 전 `supabase/tests/19-assignments.test.sql`·
   `23-post-confirmation-changes.test.sql` 전체를 확인했다. 기존 비활성 관련 단언은
   전부 "새 인원 추가"에 대한 거부뿐이었다(19번 396~405행 `임시비활성배정포지션` 최초
   시도, 652~661행 자격 강제 4/5 — 둘 다 이전 배정이 없는 상태에서 새로 추가하려는
   시도라 완화 후에도 여전히 거부돼야 하는 케이스). "축소"나 "전원 해제"를 거부로 단언한
   기존 문항은 없었다.
2. **화면 경고 확장이 `src/shared/ui/**` 변경을 요구하는 경우** — 발동 안 함.
   `computeConfirmationWarnings`는 순수 함수 계산만 확장했고 `AdminSchedulePrepView.tsx`·
   `page.tsx`는 prop 전달만 추가했다. `ConfirmScheduleDialog`(features/ui) 등 렌더링
   컴포넌트는 무수정 — 이미 `understaffed`·`noManager` 배열을 그대로 받아 렌더링하므로
   항목 수만 늘어도 계약이 같다.
3. **교육생 쿼리의 `positions` 임베드가 RLS·조회 계약 문제로 이름을 읽지 못하는 경우** —
   발동 안 함. `assignment_trainees.position_id → positions.id` FK가 정확히 1개뿐임을
   `pg_constraint`로 확인했고(`assignment_trainees_position_id_fkey`, 다른 FK 경로 없어
   PostgREST 임베딩 모호성 없음), 로컬 REST API(`/rest/v1/assignment_trainees?select=position_id,positions(name,sort_order)`)에
   service-role 키로 호출해 임베딩 구문 자체가 유효함(에러 없이 빈 배열 반환, 테스트
   데이터는 pgTAP 트랜잭션 rollback으로 이미 비어 있는 상태)을 확인했다. pgTAP GREEN
   전체 스위트(1323 tests)도 이 FK·정책 경로에 문제가 없음을 간접 실증한다.

## 위험 매트릭스 대비 실증 근거

RADIO "위험 기반 테스트" 표의 8행 전부 아래 파일에서 실증됐다(값 단언 포함, `docs/execution/runs/P3-T11/tdd.json` RED→GREEN 쌍 참고).

- 1·2 DB 경고 합집합: `supabase/tests/21-schedule-confirmation.test.sql`의 "P3-T11" 블록
  (반환 jsonb·감사 detail 양쪽 값 단언 + 표 밖 정식-only 무경고 경계).
- 3 비활성 축소: `supabase/tests/19-assignments.test.sql`의 "P3-T11" 블록(부분 축소·전원
  해제 lives_ok, 정식·교육생 추가 각각 22023 + 행수 무변화, 혼합 호출 거부) +
  `supabase/tests/23-post-confirmation-changes.test.sql`의 "P3-T11" 블록(CONFIRMED
  경로, revision +1·감사 동반).
- 4 화면 규칙 동일성: `src/views/admin-schedule/model/__tests__/confirmation-warnings.test.ts`
  (표 밖 교육생 잔존 → noManager 정렬 포함, 표 밖 정식·혼재 무경고 경계, 기존 6문항 회귀
  없음).
- 5 조회 확장: `src/entities/schedule/api/__tests__/list-schedule-requirements.test.ts`
  (traineePositions 반환·중복 제거·빈 배열, 기존 실패 매핑·절단 가드 회귀 없음).

## 커버리지 밖(RADIO 비목표, 무수정 확인)

- `src/features/confirmation/api/confirm-schedule.ts`: 무수정 확인(git diff 없음).
- 신규 e2e 없음 — 기존 e2e 스위트는 `pnpm verify`의 일부로 실행해 회귀 없음을 확인했다
  (아래 verify 결과 참고).
