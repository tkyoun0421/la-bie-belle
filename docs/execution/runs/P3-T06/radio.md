# P3-T06 RADIO 적용 결과

- 기준 RADIO: `docs/execution/radio/P3-T06-radio.md` revision 1, SHA-256
  `284cd06327a3b892d1dab4fa398987df9d4be7cef271df1b18380728a0884d89`(index.jsonl `development_approval`과
  시작 전 대조 완료).
- 기준 커밋: `1afbc40`.

## 적용 결과 요약

RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 정지 조건 3개는 모두
발동하지 않았다 — 아래 "정지 조건 점검"에 실증 근거를 남긴다.

## 구현 중 확정한 세부(설계 재해석이 아닌 구체화)

1. **상태 순차 update를 상태별 분기로 일반화.** RADIO 문면은 "OPEN이면 CLOSED로 먼저(+감사),
   이어 PREPARING, CONFIRMED"만 명시했다. 실제 `enforce_schedule_status_transition` 트리거 규칙에는
   `OPEN→PREPARING`·`CLOSED→CONFIRMED` 직접 전이가 없어(코드 대조 완료, 트리거 무수정) CLOSED에서
   시작해도 PREPARING을 거쳐야 한다. `confirm_schedule`은 `target_status = 'OPEN'`이면 CLOSED update
   +감사를 추가하고, `target_status in ('OPEN','CLOSED')`이면 PREPARING update를, 마지막에 항상
   CONFIRMED update를 실행한다 — RADIO가 명시한 OPEN·CLOSED 두 경로를 그대로 포함하며 트리거 규칙을
   벗어나지 않는다.
2. **`confirm_schedule`에 "스케줄을 찾을 수 없습니다"(`22023`) not-found 분기를 추가했다.** RADIO
   데이터 모델 절이 명시하진 않았지만 이 저장소의 모든 스케줄 대상 DEFINER 함수(`copy_schedule_requirements`,
   `set_position_requirement`, `replace_schedule_ceremonies`, `replace_position_assignments` 등)가
   공통으로 쓰는 방어 패턴이라 반복했다. RADIO가 이 분기를 금지하지 않았고 새 오류 코드를 쓰지
   않았다(기존 `22023` 재사용).
3. **레이어 위반을 구현 중 발견·수정했다.** RADIO Architecture 절대로
   `ConfirmScheduleDialog.tsx`가 `views/admin-schedule/model/confirmation-warnings`의 타입을 직접
   import하도록 작성했더니 `config/fsd.json` 계층 순서(app→views→widgets→features→entities→shared)를
   어긴다는 ESLint `project/layer-direction` 오류가 즉시 났다 — `features`는 `views`를 import할 수
   없다. 정지 조건("조회 계약을 넓혀야 하는 경우")에 해당하지 않는 순수 타입 임포트 방향 문제라
   판단해, `ConfirmScheduleDialog.tsx`가 같은 필드 구조의 타입을 로컬로 선언해 구조적 타이핑으로
   받게 했다 — "표시는 prop으로 받은 경고 목록·안내뿐, 계산 없음"이라는 RADIO의 계약은 그대로
   지키고, 타입을 어느 모듈에서 가져오는지만 바꿨다. `AdminSchedulePrepView.tsx`(views)가
   `computeConfirmationWarnings`(views/model)를 호출해 계산한 값을 `ConfirmScheduleDialog`(features/ui)
   props로 내려주는 흐름은 RADIO가 명시한 "views→features 기존과 같다" import 방향과 일치한다.
4. **확정 버튼 노출 조건.** RADIO Interface 절의 "확정 버튼이 상태와 무관하게 다이얼로그를 연다"는
   버튼을 눌렀을 때 내부 상태(예식 유무·필요 인원 충족 여부 등)를 따져 다이얼로그를 열지 말지 게이팅하지
   않는다는 뜻으로 해석했다. 버튼 자체는 `schedulePrepStatusLabel` mode가 `readonly`가 아닐 때만(OPEN·
   CLOSED·PREPARING) 렌더링한다 — CONFIRMED·CANCELLED는 이미 "확정되었거나 취소된 스케줄은 수정할 수
   없어요" 읽기 전용 화면이라, 거기에 다시 확정 가능해 보이는 버튼을 두는 건 "확정 성공 후 화면이
   확정 상태(읽기 전용 안내 포함)로 갱신된다"는 문면과 자연스럽게 어긋난다. 재확정 시도(LB029) 검증은
   RADIO가 명시한 대로 DB 계층(pgTAP) 책임으로 남겨 e2e에서 다루지 않았다.
5. **트리거 버튼과 다이얼로그 내부 확정 버튼의 문구를 다르게 뒀다**(`스케줄 확정` / `확정하기`).
   `WorkerStatusAction`(`수동 휴면`/`휴면 처리`)의 기존 선례를 따라, 같은 텍스트의 버튼 두 개가 동시에
   렌더링될 때 생기는 접근성 트리 상 이름 충돌(및 e2e 로케이터 모호성)을 피했다. RADIO는 정확한 문구를
   지정하지 않았다.
6. **경고 프리뷰(`confirmation-warnings.ts`)와 DB 확정 함수의 경고 계산은 RADIO가 명시한 대로 서로
   독립 구현이다.** 클라이언트 model은 화면이 이미 가진 `requirementRows`·`assignedCounts`·
   `traineeCounts`만 입력받는 순수 함수이고, DB 쪽은 확정 시점에 SQL로 다시 집계한다. 둘의 필드 이름은
   맞췄지만(`positionId`/`position_id` 등) 코드를 공유하지 않는다 — "정본은 DB, 프리뷰는 화면 데이터로
   계산"이라는 RADIO 결정 그대로다.

## 정지 조건 점검

- **상태 전이 트리거가 트랜잭션 내 순차 update를 거부하는 경우** — 발동하지 않았다. pgTAP 첫
  RED→GREEN 쌍(`docs/execution/runs/P3-T06/tdd.json` entries 1~2)이 OPEN→CLOSED→PREPARING→CONFIRMED
  세 단계 update가 한 함수 호출(=한 트랜잭션) 안에서 트리거 거부 없이 통과함을 실증했다.
- **기존 pgTAP·단위·e2e 단언이 이 설계와 충돌하는 경우** — 발동하지 않았다. `git diff --stat`로
  확인한 결과 `supabase/migrations/20260811000000_assignment_trainees.sql`·
  `supabase/tests/19-assignments.test.sql`·`20-assignment-trainees.test.sql`은 이번 task에서 한 글자도
  건드리지 않았다(컬럼 추가는 기존 테이블에 nullable 컬럼을 얹는 것뿐이라 기존 `columns_are` 류의 고정
  단언이 없다는 RADIO의 사전 조사와 일치). 전체 `pnpm test`(212 files / 1393 tests)와
  `npx -y supabase@2.75.0 test db`(Files=21, Tests=1101) 모두 GREEN이다.
- **확정 다이얼로그에 필요한 데이터가 준비 화면 조회에 없어 조회 계약을 넓혀야 하는 경우** —
  발동하지 않았다. 경고 프리뷰는 `AdminSchedulePrepView`가 이미 props로 받는
  `requirementRows`·`assignedCounts`·`traineeCounts`만으로 계산된다(`listScheduleRequirements`는
  P3-T05까지 이미 세 값을 반환하고 있었다). 새 서버 조회를 추가하지 않았다.

## 위험 기반 테스트 매트릭스 반영(실증 근거)

RADIO 위험 표 8행 전부를 아래 계층에서 실제로 실행해 확인했다. 상세 단언은
`supabase/tests/21-schedule-confirmation.test.sql`(pgTAP 39문항),
`src/views/admin-schedule/model/__tests__/confirmation-warnings.test.ts`(6문항),
`src/features/confirmation/api/__tests__/confirm-schedule.test.ts`(10문항),
`src/features/confirmation/hooks/__tests__/useConfirmSchedule.test.ts`(7문항),
`tests/e2e/schedule-confirmation.spec.ts`(2 test)가 정본이다.

- 1 단일 트랜잭션: happy path·주요 실패(원자성)·경계값(배정 0·필요 0)·권한·중복 요청·동시성(for update
  정적 단언 + 재확정 LB029) 전부 pgTAP.
- 2 구조 오류 개별 코드: LB026~LB030(교육생 단독 wage 누락 포함 5종) 전부 pgTAP `throws_ok`.
- 3 OPEN 확정·마감 동반: pgTAP(OPEN 경로 `schedule_closed`+`schedule_confirmed` 두 건, CLOSED 경로
  `schedule_confirmed`만) + e2e happy path(마감 안내 문구 노출).
- 4 시급 스냅샷: pgTAP(스냅샷 일치, `set_hourly_wage` 이후 불변, 겸직자 1행) + e2e(스냅샷 값 DB 조회로
  재확인).
- 5 경고 감사 기록: pgTAP(미달+담당자 없음 동시 존재, 경계값 필요 0/정식 0/교육 1, 빈 경고) + e2e
  다이얼로그 표시.
- 6 상태 오류 거부: pgTAP(직접 insert CONFIRMED·CANCELLED 픽스처 둘 다 LB029).
- 7 확정 UX: e2e 2 test(성공 흐름 전체, 구조 오류 시 다이얼로그 오류 안내+준비 상태 유지) +
  useConfirmSchedule 훅 단위(pending 전이·재진입 가드).
- 8 경고 프리뷰 계산: `confirmation-warnings.test.ts` 6문항(happy path, 필요 0 교육생만, 전부 충족,
  전부 0, 교육생 미집계 검증, 빈 입력).

## 2026-08-14 · 교차 검증 F-01 정정(수정 라운드)

위 "4 시급 스냅샷: pgTAP(스냅샷 일치, `set_hourly_wage` 이후 불변, 겸직자 1행)" 서술은 실제
커버리지보다 넓게 적혀 있었다. 개발 완료 시점의 `supabase/tests/21-schedule-confirmation.test.sql`은
`hourly_wage_snapshot`을 값으로 읽는 단언(`is()`)을 전부 `assignments` 대상으로만 뒀고,
`assignment_trainees.hourly_wage_snapshot`은 파일 앞부분의 `col_type_is()`로 컬럼 타입 존재만
확인했을 뿐 확정 뒤 실제 값을 단언하지 않았다 — 마이그레이션의 `assignment_trainees` 스냅샷 update
문(`confirm_schedule` 함수 본문)을 통째로 지워도 pgTAP·단위·e2e 전 계층이 GREEN이었다. 교차 검증
확정 발견 F-01(high, `docs/execution/reviews/P3-T06-review.json`)로 지적됐다.

수정: `21-schedule-confirmation.test.sql`에 문항 5개를 추가했다(plan 39→44) — 12-07 스케줄 확정
직후 교육생 2명(담당자없음교육 시급 15000, 경계교육 시급 16000)의 `assignment_trainees.
hourly_wage_snapshot`이 확정 당시 `profiles.hourly_wage`와 일치함을 값으로 단언하고, 확정 후
`set_hourly_wage`로 교육생 시급을 바꿔도 스냅샷이 불변임을 단언한다. RED→GREEN 근거는
`docs/execution/runs/P3-T06/tdd.json`(마지막 두 entries)에 있다. 위 "4 시급 스냅샷" 서술은
이제 실제 커버리지(정식·교육생 양쪽 모두 값으로 단언)와 일치한다. 다른 발견(F-02~F-09)은 이
수정 범위 밖이며 `docs/execution/reviews/backlog.md`가 소유한다.
