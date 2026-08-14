# P3-T05 RADIO 개발 설계

- 상태: Approved
- revision: 4
- 기획 승인: user, 2026-08-11
- 개발 설계 승인: user, 2026-08-14

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-11 | 최초 작성. 설계 인터뷰 확정 7건 — 교육생을 새 테이블에 담고, 저장은 기존 함수를 넓혀 한 트랜잭션으로 하며, 후보 함수에 교육생 여부 컬럼을 더하고, DB 경계 테스트는 새 pgTAP 파일로 떼고, 시트의 `자격 없음` 묶음은 유지한 채 누를 수만 있게 하고, 후보 한 줄에 `[배정]`·`[교육]` 두 버튼을 나란히 두고, e2e는 새 spec으로 떼며 시딩 헬퍼를 `tests/e2e/support/`로 뺀다. 2026-08-11 사용자 결정. |
| 2 | 2026-08-11 | 네번째 인자의 기본값을 `null`로 두고 「교육생을 건드리지 않는다」로 읽는다. revision 1의 지시 셋이 서로 부딪혀 개발이 멈춰 반환한 결과다 — 「기본값을 두지 않는다」와 「과부하를 남기지 않는다」와 「`19-assignments.test.sql`은 7줄만 고친다」를 동시에 만족할 방법이 없었다. 봉인 전 조사가 시그니처를 문자열로 박은 줄만 세고 함수를 실제로 부르는 26곳을 세지 않은 것이 원인이다. 정지 조건의 행 번호도 4줄(76·77·87·92)로 정정한다 — 72·73·81행은 `list_position_assignment_candidates`의 인자가 그대로라 깨지지 않는다. 2026-08-11 사용자 결정. |
| 3 | 2026-08-14 | 교차 검증(critical F-01) 수정 라운드 재봉인. ① 정식 배정 추가 시의 무조건 교차 검사에서 제외하는 대상을 「대상 포지션의 교육생 전체」가 아니라 「이번 호출의 교육 제거 집합에 든 사람」으로 좁힌다 — revision 2가 하위 호환용으로 남긴 3-인자 경로에서 같은 포지션 교육생을 정식 배정하면 겸직 금지가 뚫리던 구멍을 닫고, 4-인자 스왑(교육→정식 전환)은 그대로 허용한다. 이미 push된 마이그레이션은 소급 수정하지 않고 새 마이그레이션으로 함수만 재생성한다. ② F-05: `listScheduleRequirements`의 세 조회 모두 1,000행 상한 도달 시 성공으로 처리하지 않고 fail-closed로 돌린다. ③ F-02: 교육 가능 판정이 `eligible` 축을 함께 보도록 Architecture 문구를 정밀화한다. ④ F-03: 인수 조건 7의 「정식 전원 제거 후 교육생 잔존」 전이를 pgTAP로 단언한다. ⑤ 구현과 어긋났던 봉인문 두 곳을 사실로 정정한다 — RLS는 관리자 select 정책 하나뿐이고(쓰기는 RPC 전용), 교육생 수는 FK 경로 부재로 임베딩이 불가능해 별도 병렬 조회다. 2026-08-14 사용자 결정. |
| 4 | 2026-08-14 | 재검증 확정 F-11(high) 회귀 수정 재봉인. revision 3의 F-02 수정이 교육 가능 판정을 추가 축으로만 좁혀, 비활성이면서 이미 그 포지션의 교육생인 후보(eligible `false`·사유 `null`·`currentlyTrainee` 참 — 후보 함수의 세번째 `or exists`가 비활성이어도 반환하는 조합)에게 교육 칩이 그려지지 않아 관리자가 그 교육생을 해제할 제품 내 경로가 사라졌다. 판정에 제거 축을 보강한다 — **`currentlyTrainee`가 참이면 칩을 유지한다(해제 가능). 새로 교육으로 고르는 가능 여부는 revision 3 규칙(eligible이거나 사유 `NOT_ELIGIBLE`) 그대로다.** 이 규칙은 이 diff 이전부터 있던 형제 사례(교육생 등록 뒤 포지션 성별 조건 변경으로 `GENDER_MISMATCH`가 된 기존 교육생)도 함께 닫는다. DB는 무수정 — 교육생 자격 루프가 `added_trainee_ids`만 순회해 제거는 이미 허용한다. 회귀 테스트로 eligible `false`·사유 `null`·`currentlyTrainee` 참 조합의 칩 유지를 단위에서 단언한다. 기존 e2e·단위 단언이 이 규칙과 충돌하면 멈추고 결정 신호로 반환한다. 2026-08-14 사용자 결정. |

- 관련 spec: PRD:INV-STAFF-02, PRD:AC-04, DOMAIN:SCHEDULING, DOCS:SDD(ADMIN-FLOWS 관리자 예외 규칙 절)
- 적용 깊이: 깊음 — 테이블과 RLS를 새로 만들고, 이미 배포된 함수 둘을 drop한 뒤 다시 만들며, 감사 기록과 오류 코드가 는다. P3-T04와 달리 DB 경계가 움직인다.
- test mode: tdd
- 예정 check IDs: trainee-schema(테이블·RLS·거부 규칙 pgTAP), trainee-headcount(필요 인원 제외와 교육 수 표시 판정 단위), trainee-e2e(추가·제거·겸함 거부·담당자 없음 실DB)

## 전제

교육생을 담는 자리가 저장소에 없다. 마이그레이션 16개 어디에도 교육생 테이블이나 컬럼이 없고, 코드의 `AssignmentRosterRow.isTrainee`는 근무자용 배정표가 mock으로 쓰는 표시 타입이라 데이터원이 아니다. 근거는 `03-assignment-and-confirmation.md`의 P3-T05 절 「알려진 사실」이 소유한다.

기획 인터뷰가 PRD를 한 줄 고쳤다. **교육생은 담당자가 아니라 포지션에 속한다.** 멘토를 매다는 필드도 흐름도 만들지 않는다.

## Requirements

### 범위와 비목표

- 범위: ① 교육생을 담는 테이블과 RLS를 만든다 ② 저장 함수를 넓혀 정식 배정과 교육생을 한 트랜잭션으로 저장한다 ③ 후보 함수에 교육생 여부를 더한다 ④ 시트에서 후보 한 줄에 `[배정]`·`[교육]`을 나란히 둔다 ⑤ 교육생을 필요 인원 집계에서 빼고 `교육 K`를 조건부로 그린다 ⑥ DB 경계와 화면을 pgTAP·단위·e2e로 덮는다.

- 설계 비목표: 담당자 지정 — 멘토 컬럼도 흐름도 만들지 않는다(기획 인터뷰 결정). 확정 경고 — 담당자 없는 포지션을 확정 직전에 막는 일은 P3-T06 소유. 근무자용 배정표의 교육생 표시 — P3-T07이 인수 조건으로 소유하며 `entities/schedule/model/assignment.ts`를 이 task에서 건드리지 않는다. 교육생의 출퇴근(P5)과 급여(P6). `assignments`·`assignment_positions`의 구조 변경 — 아래 정지 조건이 소유한다.

### 불변 규칙

- **교육생에게 담당자를 매달지 않는다.** 새 테이블에 멘토를 가리키는 컬럼을 두지 않는다. 정식 배정자가 바뀌거나 사라져도 교육생 행은 그대로다.
- **정식 배정과 교육생을 한 트랜잭션으로 저장한다.** 시트의 저장 한 번이 RPC 한 번이다. 두 번 호출로 나누면 반쪽만 반영되는 상태가 생긴다.
- **거부 사유마다 다른 오류 코드를 준다.** 정식 배정과 겸하려는 경우와 다른 포지션 교육생인 경우를 같은 코드로 묶지 않는다. P3-T04 교차 검증 F-03이 `LB023` 하나에 두 사유가 얹혀 어느 분기가 막았는지 고정되지 않는다고 지적했고, 그 지적을 여기서 되풀이하지 않는다.
- **성별 검사는 정식 배정과 같은 함수를 쓴다.** `assignment_eligibility`가 성별을 먼저 보고 어긋나면 `GENDER_MISMATCH`로 즉시 끝내므로, 교육생은 그 앞쪽 판정만 통과하면 된다. 성별 규칙을 새로 쓰지 않는다.
- **교육생은 필요 인원 집계에 들어가지 않는다.** `배정 M`도 부족 인원도 교육생 때문에 움직이지 않는다 — `INV-STAFF-02`.
- **교육으로 고를 수 있는지의 판정은 `views/admin-schedule/model/`에 둔다.** 화면 로직은 UI가 아니라 model이 가진다. 시트는 판정 결과만 그린다.
- **`assignments`와 `assignment_positions`의 구조를 바꾸지 않는다.** 컬럼을 더하지도 제약을 고치지도 않는다.
- **`assignment_positions_replaced` 감사 형식을 건드리지 않는다.** 교육생 변경은 별도 이벤트로 남긴다.
- **한 포지션에 붙는 교육생 수에 상한을 두지 않는다.**

### 정지 조건

- **`supabase/tests/19-assignments.test.sql`에서 고칠 것은 옛 시그니처를 문자열로 박아 둔 4줄뿐이다** — 76·77·87·92행, 모두 `replace_position_assignments(uuid, uuid, uuid[])`를 문자열로 적은 자리다. 72·73·81행은 `list_position_assignment_candidates(uuid, uuid)`인데 인자가 그대로고 반환 테이블만 바뀌므로 `has_function`·`has_function_privilege`가 깨지지 않는다. **이 파일의 3-인자 호출부 26곳은 손대지 않는다** — 네번째 인자의 `null` 기본값이 그것들을 그대로 통과시키고, revision 3의 좁힌 교차 검사도 이 파일이 교육생 행을 만들지 않으므로 걸리지 않는다. 호출부를 고쳐야 하는 상황이 나오면 멈추고 결정 신호로 반환한다. 1014줄짜리 기존 회귀망을 이 task가 다시 쓰는 일은 없다.
- **revision 3 수정 라운드에서 `supabase/tests/20-assignment-trainees.test.sql`의 기존 단언 중 고칠 수 있는 것은 AC3 방향1의 고정 메시지 1줄뿐이다** — 교차 검사가 같은 포지션 교육생도 잡게 되면서 거부 메시지가 「이미 다른 포지션의」에서 포지션을 특정하지 않는 문구로 일반화되기 때문이다. 오류 코드는 LB024 그대로다. 그 밖의 기존 단언이 깨지면 멈추고 결정 신호로 반환한다.
- **기존 e2e 헬퍼를 `tests/e2e/support/`로 빼다가 기존 test가 깨지면 추출을 되돌리고 멈춘다.** `assignment-eligibility.spec.ts`의 기존 test 본문은 import 줄 말고 바뀌지 않아야 한다.
- **기존 배정 데이터를 옮기거나 채워 넣어야 하는 상황이 나오면 멈춘다.** 교육생 테이블은 비어서 태어나므로 백필이 필요 없다. 필요해졌다면 설계가 틀린 것이다.
- **`assignments`·`assignment_positions`를 고쳐야 풀리는 문제가 나오면 멈춘다.**
- 문구·정렬·간격 같은 표시 문제는 고치지 않고 backlog로 보낸다.

### 기술 인수 조건

1. **교육생 추가**: 가능 포지션이 하나도 없고 성별 조건은 통과하는 근무자를 그 포지션의 교육생으로 저장할 수 있다.
2. **성별 거부**: 포지션의 성별 조건에 맞지 않는 근무자는 교육생으로도 거부된다.
3. **정식과 겸함 거부**: 같은 스케줄에 이미 정식 배정된 사람을 교육생으로 넣으면 거부되고, 이미 교육생인 사람을 정식 배정해도 거부된다. 양방향 모두 막힌다.
4. **교육생 중복 거부**: 이미 다른 포지션 교육생인 사람을 두 번째 포지션 교육생으로 넣으면 거부된다.
5. **필요 인원 제외**: 교육생이 늘어도 그 포지션의 `배정 M`과 부족 인원이 바뀌지 않는다.
6. **교육 수 표시**: 교육생이 있을 때만 `· 교육 K`가 붙고, 한 명도 없는 포지션에는 그 조각이 DOM에 없다.
7. **담당자 없음**: 정식 배정자를 모두 뺀 뒤에도 교육생은 남고, 그 포지션이 `담당자 없음`으로 보인다.
8. **회귀**: 기존 단위·e2e·pgTAP이 그대로 통과하고 `pnpm verify`가 GREEN이다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 교육생 추가 | 테스트함 — e2e에서 가능 포지션 없는 근무자를 교육으로 저장 후 DB 행 확인 | 테스트함 — 저장이 조용히 무시되면 행 부재로 드러남 | 테스트함 — pgTAP에서 한 포지션에 교육생 셋(상한 없음) | 테스트함 — pgTAP에서 비관리자 호출이 42501로 거부 | 테스트함 — 같은 사람을 같은 포지션에 다시 저장해도 행이 안 늘어남 | 해당 없음 — 저장이 순차다 |
| 2 성별 거부 | 해당 없음 — 아래 실패 칸이 본체 | 테스트함 — pgTAP과 e2e 양쪽에서 `GENDER_MISMATCH` 계열 거부 | 테스트함 — 성별 조건이 `any`인 포지션은 통과 | 해당 없음 — 자격 판정은 권한과 별개다 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 저장이 순차다 |
| 3 정식과 겸함 거부 | 해당 없음 — 아래 실패 칸이 본체 | 테스트함 — 정식→교육, 교육→정식 두 방향을 각각 거부하고 사유 코드가 서로 다르다 | 테스트함 — 같은 포지션에서 정식과 교육을 동시에 고른 경우, 그리고 같은 포지션 교육생을 3-인자 호출로 정식 배정하는 경우가 LB024로 거부되는지 pgTAP로 단언(revision 3) | 해당 없음 — 위와 같다 | 해당 없음 — 거부가 멱등이다 | 테스트함 — pgTAP에서 `for update` 잠금이 유지되는지 확인 |
| 4 교육생 중복 거부 | 해당 없음 — 아래 실패 칸이 본체 | 테스트함 — 두 번째 포지션 교육생 저장이 3번과 다른 코드로 거부 | 테스트함 — 첫 포지션 교육을 풀고 두 번째로 옮기는 것은 통과 | 해당 없음 — 위와 같다 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 저장이 순차다 |
| 5 필요 인원 제외 | 테스트함 — 단위에서 교육생이 있는 집계의 `배정 M`이 안 늘어남 | 테스트함 — 교육생이 배정에 섞이면 수가 어긋나 드러남 | 테스트함 — 교육생만 있고 정식이 0명인 포지션 | 해당 없음 — 집계 계층이다 | 해당 없음 — 렌더가 멱등이다 | 해당 없음 — 집계 계층이다 |
| 6 교육 수 표시 | 테스트함 — 단위 판정과 e2e에서 `· 교육 1`이 뜸 | 테스트함 — 교육생이 없는 포지션에 조각이 있으면 드러남 | 테스트함 — 0명일 때 DOM 부재, 셋일 때 `교육 3` | 해당 없음 — 표시 계층이다 | 해당 없음 — 렌더가 멱등이다 | 해당 없음 — 표시 계층이다 |
| 7 담당자 없음 | 테스트함 — pgTAP에서 정식 배정을 전원 제거하는 호출 뒤 교육생 행이 남는 전이를 단언하고(revision 3 — 이전 e2e는 최종 상태만 봤다), e2e에서 표시가 뜸 | 테스트함 — 교육생이 따라 지워지면 드러남 | 테스트함 — 정식이 0명이면서 교육생도 0명인 포지션에는 표시가 없음 | 해당 없음 — 표시 계층이다 | 해당 없음 — 렌더가 멱등이다 | 해당 없음 — 표시 계층이다 |
| 8 회귀 | 테스트함 — verify GREEN | 테스트함 — 기존 단위·e2e·pgTAP 통과 | 테스트함 — 새 pgTAP에서 3-인자 호출이 기존 교육생 행을 남기는지 단언(`null` = 무변경) | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 |

- 보충 위험: **단위 테스트는 Supabase를 전부 mock한다.** `replace-position-assignments.test.ts`가 `rpc`를 `vi.fn()`으로 갈아끼우므로 인수 조건 1~4의 실제 거부는 pgTAP과 실DB e2e로만 검증된다. 단위로 덮이는 것은 순수 계산(집계·판정·묶음)과 훅의 선택 상태뿐이다. **`useCandidateSelection`의 선택 상태가 집합 하나에서 둘로 늘어난다** — `toggle`·`submit`·`changeCount`·되돌리기가 모두 두 집합을 함께 다뤄야 하고, 기존 단위 테스트 268줄이 한 집합을 전제로 쓰여 있어 이 파일의 회귀 위험이 이 task에서 가장 크다. **`자격 없음` 묶음의 의미가 바뀐다** — `groupAssignmentCandidates`가 지금 `eligible === false && !currentlyAssigned`를 통째로 그 묶음에 넣는데, 그중 `NOT_ELIGIBLE`인 사람은 이제 교육으로 고를 수 있고 `GENDER_MISMATCH`인 사람만 못 누른다. 묶음 구성은 그대로 두되 누를 수 있는지의 판정이 사유별로 갈린다. **헬퍼 추출이 멀쩡한 기존 spec을 건드린다** — 시딩 헬퍼 10개를 `tests/e2e/support/`로 빼면서 `assignment-eligibility.spec.ts`의 import가 바뀐다. 기존 test 본문이 한 줄이라도 달라지면 정지 조건이 걸린다.

### DEV-* 적용 상태

- `DEV-SEC-01`: **집중 적용** — 새 테이블에 RLS를 켜고 정식 배정 테이블과 같은 관리자 정책을 세운다. 새 RPC 두 개도 `security definer`에 `revoke ... from public, anon, service_role` 후 `authenticated`에만 grant하는 기존 패턴을 그대로 따른다. 권한은 UI가 아니라 함수 안의 `is_admin(actor_id)`이 강제한다.
- `DEV-DATA-01`: **집중 적용** — 유일 제약이 규칙을 떠받친다. `unique (schedule_id, profile_id)`가 "교육생 자리는 하나"를 DB에서 강제하고, 정식 배정과의 겸함은 함수 안의 교차 검사가 막는다. 화면 검증에 기대지 않는다.
- `DEV-SSOT-01`: 기본 적용 — 교육생 수의 출처는 `listScheduleRequirements` 하나다. 화면이 따로 세지 않는다.
- `DEV-ARCH`: 기본 적용 — 값은 `entities/*/api`, 판정은 `views/admin-schedule/model`, 선택 상태는 `features/assignment/hooks`, 표시는 `ui`. 의존 방향은 그대로다.
- `DEV-TEST-01`: 기본 적용 — tdd, RED→GREEN 증거를 `runs/P3-T05`에 남긴다.
- `DEV-CODE-07`: 기본 적용 — 설명 주석 금지.
- `DEV-ERR`: 기본 적용 — 거부 사유마다 다른 `LB0xx`를 주고 화면 메시지는 `error-codes.config.ts`가 소유한다.
- `DEV-OPT`: 기본 적용 — 교육생 여부는 후보 조회의 반환 컬럼으로 얹고, 교육생 수는 요구 조회와 같은 `Promise.all`의 병렬 조회로 가져온다(Optimizations 절이 상세를 소유).
- `DEV-TIME`·`DEV-CACHE`·`DEV-OFFLINE`: 해당 없음 — 시간 계산·캐시 정책·오프라인 처리가 바뀌지 않는다. `revalidatePath` 호출은 기존 자리 그대로다.

## Architecture

계층 배치는 `config/fsd.json`의 세그먼트 규칙을 따른다. `api`는 `requireServerOnly`이자 단위 필수, `hooks`는 `server-only` import 금지에 단위 필수, `model`은 `react` import 금지에 단위 필수, `ui`는 단위 면제이며 `**/api/**` import 금지, `types`는 런타임 export 금지다.

- `supabase/migrations/<타임스탬프>_assignment_trainees.sql`: 새 테이블 `assignment_trainees`와 RLS를 만들고, 이미 배포된 함수 둘을 `drop function`한 뒤 다시 만든다. 옛 함수를 남겨 두지 않는다 — 같은 이름의 과부하가 둘 공존하면 어느 쪽이 불렸는지 흐려진다.
- `supabase/tests/20-assignment-trainees.test.sql`: 새 파일. 테이블 구조, RLS, 새 시그니처, 거부 규칙 넷(성별·정식 겸함 양방향·교육생 중복), 상한 없음, 감사 기록을 덮는다. revision 3 수정 라운드에서 같은 포지션 3-인자 겸직 거부와 정식 전원 제거 후 교육생 잔존 전이 단언을 이 파일에 더하고, AC3 방향1의 고정 메시지 1줄을 일반화된 문구로 갱신한다.
- `supabase/migrations/<타임스탬프>_trainee_conflict_guard.sql`(revision 3 신규): 이미 push된 마이그레이션을 소급 수정하지 않고 이 파일에서 `replace_position_assignments`만 `drop` 후 재생성해 좁힌 교차 검사를 싣는다. 다른 객체는 만들지도 고치지도 않는다.
- `supabase/tests/19-assignments.test.sql`: 시그니처를 문자열로 박은 4줄(76·77·87·92)만 새 시그니처로 고친다. 3-인자 호출부와 다른 단언은 손대지 않는다.
- `src/entities/assignment/types/candidate.ts`: `AssignmentCandidate`에 `currentlyTrainee: boolean`을 더한다. 런타임 값을 export하지 않는다.
- `src/entities/assignment/api/list-position-assignment-candidates.ts`: 새 컬럼을 매핑한다. 조회 개수는 그대로 하나다. `import "server-only"`는 첫 줄에 그대로 둔다.
- `src/entities/schedule/api/list-schedule-requirements.ts`: 성공 반환에 `traineeCounts: Record<string, number>`를 더한다. 교육생 행을 `position_id`로 세며, 기존 `assignedCounts`·`assignedWorkerCount` 계산에 교육생을 섞지 않는다.
- `src/views/admin-schedule/model/candidate-buckets.ts`: 묶음 구성은 그대로 두고, 후보 하나가 교육으로 고를 수 있는지를 판정하는 순수 함수를 더한다. 판정은 `eligible`과 `ineligibleReason` 두 축을 함께 본다 — `eligible`이 참이거나 사유가 `NOT_ELIGIBLE`일 때만 가능하다. `GENDER_MISMATCH`와 사유 없는 비활성(`eligible: false`·사유 `null` — DB가 어차피 「활성 근무자만」으로 거부하는 조합)은 불가다(revision 3, 교차 검증 F-02 — 한 축만 보면 결코 성공하지 않는 버튼이 생긴다). 단 **`currentlyTrainee`가 참인 후보는 위 규칙과 무관하게 칩을 유지한다**(revision 4, 재검증 F-11 — 제거 축. 이미 교육생인 사람의 해제 경로는 추가 가능 여부와 별개이며, DB의 교육생 자격 검사는 추가 대상만 순회해 제거를 막지 않는다). `react`를 import하지 않는다.
- `src/views/admin-schedule/model/requirement-section-data.ts`: `교육 K` 조각을 붙일지 말지의 판정을 더한다. 0명이면 붙이지 않는다.
- `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`: 판정 결과를 prop으로 받아 `필요 N · 배정 M`에 조각을 잇고, 정식 배정자가 없는 포지션에 `담당자 없음`을 그린다. 계산을 이 파일에서 하지 않는다.
- `src/features/assignment/hooks/useCandidateSelection.ts`: 선택 상태를 정식용·교육용 두 집합으로 나눈다. `toggle`은 어느 역할인지를 받고, 한 사람이 두 집합에 동시에 들어가지 않도록 훅 안에서 막는다. 저장은 두 집합을 한 번의 `onReplace`로 보내고, 되돌리기는 두 집합을 함께 되돌린다. 변경 수는 두 집합의 대칭차 합이다.
- `src/features/assignment/ui/AssignmentCandidateSheet.tsx`: 후보 한 줄의 이름 오른쪽에 `[배정]`·`[교육]`을 나란히 둔다. 교육으로 고를 수 없는 후보에게는 `[교육]`을 그리지 않는다. 어느 버튼이 눌린 상태인지가 보이게 한다.
- `src/features/assignment/api/replace-position-assignments.ts`: 입력 스키마와 RPC 호출에 교육생 배열을 더한다. 새 오류 코드 둘을 매핑에 잇는다.
- `src/shared/config/error-codes.config.ts`: 오류 코드 둘을 더한다.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`: 새 값을 view model과 화면에 넘긴다. 얇은 어댑터 역할을 넘지 않는다.
- `tests/e2e/support/`: `assignment-eligibility.spec.ts`의 시딩 헬퍼 10개를 옮기고, `WORK_DATE_BANDS`에 이 task용 밴드를 하나 더한다. 기존 밴드를 나눠 쓰지 않는다 — P3-T04 교차 검증 F-04가 밴드 공유의 충돌 확률을 지적했다.
- `tests/e2e/assignment-trainee.spec.ts`: 새 spec. 추가·성별 거부·겸함 거부·중복 거부·필요 인원 제외·교육 수 표시·담당자 없음을 실DB로 덮는다.
- `tests/e2e/assignment-eligibility.spec.ts`: 헬퍼를 import로 바꾼다. 기존 test 본문은 그대로다.

## Data model

```sql
create table assignment_trainees (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules (id),
  position_id uuid not null references positions (id) on delete restrict,
  profile_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  unique (schedule_id, profile_id)
);
```

- `unique (schedule_id, profile_id)`가 인수 조건 4(교육생 중복 거부)를 DB에서 강제한다. 한 스케줄에서 한 사람은 교육생 행을 하나만 가진다.
- 인수 조건 3(정식과 겸함 거부)은 제약 하나로 못 막는다 — 서로 다른 두 테이블이다. 저장 함수 안에서 양방향으로 교차 검사한다.
- 멘토 컬럼이 없다. 교육생과 정식 배정자를 잇는 외래 키를 두지 않는다.
- `position_id`의 `on delete restrict`는 `assignment_positions`와 같은 결이다. 포지션이 지워지려면 교육생이 먼저 빠져야 한다.
- RLS를 켜고 정책은 관리자 select 하나만 둔다. 쓰기는 `security definer` RPC만 수행하며 관리자의 직접 insert도 42501로 거부된다 — 기존 `assignments`·`assignment_positions`의 선례와 같고, revision 2까지의 「insert·delete 정책」 문구는 구현·pgTAP 단언과 어긋나 revision 3에서 사실로 정정했다(교차 검증 F-06). 근무자에게 여는 일은 P3-T07 소유다.
- 감사는 `assignment_trainees_replaced` 이벤트를 새로 남긴다. `assignment_positions_replaced`의 형식과 대상을 건드리지 않는다.

## Interface

- `replace_position_assignments(target_schedule_id uuid, target_position_id uuid, profile_ids uuid[], trainee_profile_ids uuid[] default null)` — 옛 3인자 함수를 `drop` 후 재생성한다. 함수는 하나뿐이며 과부하를 남기지 않는다.
- **네번째 인자의 `null`은 「교육생을 건드리지 않는다」로 읽는다.** 함수 본문은 `trainee_profile_ids is not null`일 때만 교육생 교체 구간에 들어간다. 빈 배열을 기본값으로 두면 3인자로 부르는 옛 호출이 그 포지션의 교육생을 조용히 비우므로 그렇게 하지 않는다. 두 값의 뜻이 다르다 — `null`은 무변경, `array[]::uuid[]`는 전부 제거다.
- TS 레이어는 언제나 4인자로 부른다. `ReplacePositionAssignmentsInputSchema`가 `traineeProfileIds`를 필수 필드로 강제하므로 프로덕션 경로에 3인자 호출이 없다. 기본값은 기존 pgTAP 회귀망의 하위 호환을 위한 것이다.
- **정식 배정 추가 시의 교육생 교차 검사는 포지션을 가리지 않는다(revision 3, 교차 검증 F-01).** 추가 대상이 이 스케줄의 교육생 행을 갖고 있으면 그 행이 어느 포지션 것이든 `LB024`로 거부한다. 제외는 딱 하나 — 이번 호출의 교육 제거 집합(`removed_trainee_ids`)에 든 사람이다. 그래서 4-인자 스왑(교육 배열에서 빼면서 정식 배열에 넣는 전환)은 그대로 통과하고, 교육생을 건드리지 않는 3-인자 호출로 같은 포지션 교육생을 정식 배정하는 경로는 막힌다. revision 2까지의 「대상 포지션 제외」는 이 3-인자 경로에서 정식·교육 겸직을 허용하는 구멍이었다. 거부 메시지는 포지션을 특정하지 않는 문구로 일반화하고 코드는 `LB024` 그대로 둔다. 이미 push된 `20260811000000_assignment_trainees.sql`은 소급 수정하지 않고 **새 마이그레이션 파일에서 `replace_position_assignments`만 `drop` 후 재생성**한다.
- `list_position_assignment_candidates(target_schedule_id uuid, target_position_id uuid)` — 인자는 그대로, 반환 테이블에 `currently_trainee boolean`을 더해 `drop` 후 재생성한다.
- 거부 코드: `LB024`(정식 배정과 겸하려 함), `LB025`(다른 포지션 교육생과 중복). 성별 거부는 기존 `LB023`을 그대로 쓴다.
- `ERROR_CODE`에 `SCHEDULING_TRAINEE_ALREADY_ASSIGNED`와 `SCHEDULING_TRAINEE_DUPLICATE`를 더한다.
- `AssignmentCandidate`에 `currentlyTrainee: boolean`이 는다.
- `ListScheduleRequirementsResult`의 성공 갈래가 `{ ok: true; data; assignedCounts; assignedWorkerCount; traineeCounts }`가 된다.
- `ReplacePositionAssignmentsInput`에 `traineeProfileIds: string[]`이 는다.
- `useCandidateSelection`의 `toggle`이 역할 인자를 받고, 반환에 교육용 선택 집합이 는다.

## Optimizations

- 교육생 여부는 이미 도는 후보 함수의 반환 컬럼이라 왕복이 늘지 않는다. 교육생 수는 별도 조회다 — `schedule_position_requirements`에서 `assignment_trainees`로 가는 FK 경로가 없어 PostgREST 임베딩으로 「요구 조회에 얹기」가 구조적으로 불가능하고, 기존 `assignedCounts`도 같은 이유로 이미 별도 요청이다. 세 조회가 같은 `Promise.all`에서 병렬로 나가므로 직렬 지연과 N+1은 없다. revision 2까지의 「왕복이 늘지 않는다」는 불가능한 요구였고 revision 3에서 사실로 정정했다(교차 검증 F-07).
- **`listScheduleRequirements`의 세 조회(요구·배정·교육생) 모두 1,000행 상한 도달을 성공으로 처리하지 않는다(revision 3, 교차 검증 F-05).** 조회 행 수가 `LIST_REQUIREMENTS_LIMIT`에 닿으면 잘렸을 수 있으므로 조회 실패와 같은 fail-closed 갈래로 돌린다. 조용히 축소된 집계를 화면에 그리지 않는다.
- 저장이 한 번이다. 정식과 교육을 나눠 부르지 않으므로 시트의 저장 지연이 그대로다.
- 되돌림 비용: 새 테이블을 지우고 두 함수를 옛 시그니처로 되돌리면 끝난다. 기존 테이블 구조를 안 건드렸기 때문에 되돌림이 기존 배정 데이터에 닿지 않는다.

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/19-assignments.test.sql
supabase/tests/20-assignment-trainees.test.sql
src/entities/assignment/**
src/entities/schedule/api/**
src/features/assignment/**
src/views/admin-schedule/**
src/shared/config/error-codes.config.ts
src/app/(protected)/admin/schedule/[id]/page.tsx
tests/e2e/assignment-trainee.spec.ts
tests/e2e/assignment-eligibility.spec.ts
tests/e2e/support/**
docs/execution/radio/P3-T05-radio.md
docs/execution/runs/P3-T05/**
docs/execution/phases/03-assignment-and-confirmation.md
docs/execution/phases/index.jsonl
```

- 용도 한정: `supabase/migrations/**`는 교육생 테이블 신설과 두 함수 재생성에만 쓰고 기존 테이블 구조를 바꾸지 않는다. `supabase/tests/19-assignments.test.sql`은 위 정지 조건이 지정한 4줄에만 쓴다. `src/entities/schedule/api/**`는 교육생 집계를 더하는 데만 쓰고 기존 쿼리·필터·권한을 바꾸지 않는다. `src/features/assignment/**`는 선택 상태와 저장 인자를 넓히는 데만 쓰고 관리자 경계 검사를 바꾸지 않는다. `src/views/admin-schedule/**`는 판정 신설과 표시에만 쓰고 필요 인원 편집 동작을 바꾸지 않는다. `error-codes.config.ts`는 코드 둘을 더하는 데만 쓰고 기존 코드의 문구·http를 바꾸지 않는다. `tests/e2e/assignment-eligibility.spec.ts`는 헬퍼 import로 바꾸는 데만 쓰고 기존 test 본문을 고치지 않는다.
- `src/entities/schedule/model/**`는 의도적으로 빠져 있다. 근무자용 배정표의 `isTrainee`를 실데이터로 잇는 일은 P3-T07 소유다.
- `docs/product/**`도 빠져 있다. PRD·ADMIN-FLOWS 수정은 기획 승인 커밋에서 이미 끝났고, 설계·개발이 제품 정본을 다시 고치지 않는다.

## 미결 사항

- 교육생의 예상 급여를 어떻게 세는가. `PRD:167`이 개인 시급으로 계산한다고 정했지만 예정 근무 시간의 출처는 아직 없다. 결정 주체: P6(예상급여).
- 교육생이 출퇴근을 찍는가. 결정 주체: P5(출퇴근).
- 정식 배정자가 없는 포지션에 교육생만 남은 상태를 확정 직전에 어떻게 막는가. 결정 주체: P3-T06.
- 근무자 본인 화면에서 교육생을 어떻게 구분해 보이는가. 결정 주체: P3-T07.
- `assignment_trainees_replaced` 감사 로그도 개수만 남길지 누구인지까지 남길지. `assignment_positions_replaced`가 개수만 남기는 성질과 함께 다뤄야 한다. 결정 주체: 후속 제안.
