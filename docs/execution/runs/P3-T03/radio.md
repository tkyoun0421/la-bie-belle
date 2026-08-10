# P3-T03 RADIO 적용 결과

- RADIO: `docs/execution/radio/P3-T03-radio.md` revision 1, SHA-256
  `3a5a54a5430067e0b38ff55eed31960b3e52390149a615d03a10c14aac3e0009`
- 적용 세션: 2026-08-10

## RADIO가 개발 단계에 위임한 결정 2건

RADIO 미결 사항: "후보 목록 정렬 기준(이름순 고정 여부)과 1000행 상한 대응은 개발 단계에서 실측 후 확정하고
`runs/P3-T03/radio.md`에 기록한다. 결정 주체: AI." — 아래 두 가지로 확정했다.

### 1. 정렬 기준 — 이름 오름차순 고정

`list_position_assignment_candidates` 함수 본문(`supabase/migrations/20260810000000_assignments.sql`)에
`order by p.name asc`를 명시했다.

- 후보 시트는 화면에서 별도로 재정렬하지 않고 함수가 반환한 순서를 그대로 두 묶음(신청함/신청 안 함)으로
  나눠 표시한다(`buildAssignmentCandidateBuckets`, `src/views/admin-schedule/model/candidate-buckets.ts`).
  정렬을 화면 쪽에 두면 "자격 판정 규칙의 정본은 DB 함수 한 곳"이라는 RADIO의 `DEV-SSOT-01` 적용과 같은
  이유로 정렬도 함수가 고정해야 화면이 같은 규칙을 다시 계산하지 않는다.
- 관리자가 후보를 찾는 방식은 이름을 훑어보는 것뿐이다(검색·필터는 P3-T04 비목표). 신청 시각·배정 여부
  같은 다른 정렬 축은 이 화면에서 쓰이지 않으므로 이름순이 유일하게 근거 있는 고정 기준이었다.
- 재구성 가능성: 나중에 다른 정렬이 필요해지면 함수의 `order by` 한 줄만 바꾸면 되고 화면·테스트 어느
  쪽도 정렬 로직을 갖고 있지 않아 변경 지점이 하나다.

### 2. PostgREST 1000행 상한 대응 — 명시적 `limit 1000`

`supabase/config.toml`의 `max_rows = 1000`을 확인했다. 이 함수는 REST가 아니라 `rpc()` 호출로 실행되지만,
PostgREST의 `max_rows`는 REST 엔드포인트뿐 아니라 RPC 응답에도 동일하게 적용된다(행 수가 1000을 넘으면
PostgREST가 묵시적으로 잘라 반환하며 클라이언트에는 잘렸다는 신호가 없다). 함수가 이 상한을 몰래 넘기지
않도록 `order by p.name asc limit 1000`을 함수 본문에 직접 넣어 PostgREST 계층의 암묵적 절단에 기대지
않고 정본(함수)이 상한을 스스로 안다.

- 이 저장소의 활성 근무자 수는 웨딩홀 한 곳 규모(RADIO 범위 밖 운영 인원 추정)라 1000명을 넘는 시나리오는
  현재 없다. 그래도 "몰래 잘린 목록"과 "명시적으로 상한을 아는 함수"는 실패 모드가 다르다 — 후자는 상한에
  닿아도 최소한 결정적이고(항상 이름순 앞 1000명), pgTAP으로 상한 존재 자체를 고정할 수 있다.
- 새 의존성이나 페이지네이션 UI를 추가하지 않는다(Optimizations 절 "새 dependency 없음"과 합치). 1000명을
  넘는 스케줄 단위 후보 목록은 이번 범위에서 현실적으로 발생하지 않는다고 판단해 상한 초과 시 UI 안내는
  만들지 않았다 — 실제로 발생하면 그 시점에 별도 task로 페이지네이션을 설계해야 한다(이번 task가 임의로
  판단할 문제가 아니다).

## 구현 중 확정한 세부(설계 재해석이 아니라 RADIO 문구 안에서의 선택)

1. **`22023`(invalid_text_representation류 표준 SQLSTATE)을 "대상 없음"·"비활성 포지션" 거부에 재사용했다.**
   RADIO Interface가 이미 "22023→SCHEDULING_VALIDATION"을 관례로 정해 뒀고, 같은 코드가 P3-T01·P3-T02의
   존재하지 않는 대상 거부에도 쓰였다(선례 일치). 새 errcode를 만들지 않았다.
2. **"활성 근무자 0명이면 빈 목록"(위험 기반 테스트 경계값 행)은 별도 pgTAP 픽스처로 재현하지 않았다.**
   `list_position_assignment_candidates`가 `where p.status = 'active'`로 조회하므로 활성 근무자가 0명이면
   구조적으로 빈 결과가 나온다 — 이 저장소의 공유 시드 데이터에서 활성 근무자를 전부 비활성화하는 픽스처는
   다른 스위트(11~18번 파일)가 같은 세션에서 기대하는 활성 계정 존재를 깨뜨릴 위험이 있어 만들지 않았다.
   대신 이 WHERE 절이 실제로 걸러내는 걸 "비활성(pending) 계정은 후보 목록에서 아예 제외된다"
   단언(`supabase/tests/19-assignments.test.sql` AC2)으로 확인했다 — 같은 조건절의 다른 값(0명 vs 1명 제외)
   차이일 뿐 필터링 자체는 이 단언이 증명한다.

## 이 세션에서 별도로 고친 회귀(P3-T03 구현 범위가 아니라 조정자 지시로 편입)

Next.js fetch 요청 메모이제이션 회귀(5790d71에서 도입, `page.tsx`의 복사-후-재조회 패턴이 원인)를
발견·수정한 경위와 범위는 `docs/execution/runs/P3-T03/handoff.md`의 미결 사항 절에 기록했다. 이 결정은
AI 위임이 아니라 조정자가 직접 확인·승인한 수정이라 이 문서(개발 단계의 재해석 결정 기록)가 아니라
handoff에 남긴다.

## 2026-08-10 · 교차 검증 수정 라운드(F-01~F-05)

기준 커밋 `d4cc999`의 구현이 RADIO 27~29행의 불변 규칙("자격은 배정을 만드는 순간에만 판정한다 …
이미 저장된 행은 이후 자격 변화와 무관하게 그대로 둔다")을 세 갈래로 어긴 결함 5건을 고쳤다. RADIO
본문·해시는 무수정이며, 아래는 그 불변 규칙 아래에서 기술 인수 조건 2·3·6을 다시 읽고 취한 조치의
기록이다.

### 불변 규칙 재확인

- 기술 인수 조건 3("각 profile 자격 검사 실패 시 전체 거부")은 "대상 profile"이 곧 candidate_ids
  전체를 뜻하지 않는다 — 27~29행이 "교체 함수가 대상 profile 각각에 대해 … 검사"라고 할 때의
  "대상"은 이번 교체로 **새로 배정에 편입되는 profile**(추가분)만을 가리킨다. 기존 배정을 그대로
  유지하는 편집에서까지 그 profile을 재검사하면 "이미 저장된 행은 이후 자격 변화와 무관하게 그대로
  둔다"를 정면으로 어긴다. F-01이 이 해석을 코드에 반영했다.
- 기술 인수 조건 2("자격 판정 … 붙여 반환")는 후보 목록이 판정을 계산해 붙이는 대상 범위를 규정할
  뿐, 그 대상이 "활성 근무자 전원"으로 한정된다고 못박지 않는다. 27~29행이 요구하는 "이미 저장된
  행은 그대로 둔다"를 화면에서 지키려면, 자격을 잃은 기존 배정자도 목록에 나타나 `eligible: false`
  판정과 함께 "선택된 상태"로 보여야 한다 — 목록에서 빠지면 화면은 그를 이미 해제된 것처럼 다루게
  되어 오히려 불변 규칙을 어기는 부작용(F-03의 소리 없는 삭제)을 낳는다.
- 기술 인수 조건 6("두 묶음, 미달자 접힘과 펼침 시 이유 표시")의 "미달자"는 처음부터 자격이 없어
  후보 시트에 새로 추가될 수 없는 사람을 뜻한다. 이미 배정된 사람은 이 정의에 들지 않는다 — 그를
  접힘 영역에 넣으면 해제할 UI가 사라져 27~29행의 "그대로 둔다"가 아니라 "손댈 수도 뺄 수도 없게
  갇힌다"가 되어 버린다. F-02가 이 구분을 코드에 반영했다.

### F-01 — `replace_position_assignments`가 유지되는 배정까지 재검사하던 결함

`previous_ids` 계산을 자격 검사 루프보다 앞으로 옮기고, `added_ids`(candidate_ids − previous_ids)를
먼저 구한 뒤 `added_ids`에 대해서만 `assignment_eligibility`를 호출하도록 재배치했다. 유지되는 배정
(`candidate_ids ∩ previous_ids`)과 제거되는 배정(`removed_ids`)은 검사하지 않는다. 스케줄 `for update`
잠금은 그대로 앞에서 잡으므로 직렬화는 유지된다. 거부 코드·메시지(`LB023`, 3종 메시지)는 그대로다.

### F-02 — 자격을 잃은 기존 배정자를 화면에서 해제할 수 없던 결함

`groupAssignmentCandidates`의 분기 조건을 `!eligible`에서 `!eligible && !currentlyAssigned`로 좁혔다.
이제 `!eligible && currentlyAssigned`인 후보는 `applied` 값에 따라 일반 묶음(신청함/신청 안 함)으로
가고 `CandidateRow`가 렌더된다. `CandidateRow`는 `candidate.eligible === false`일 때 이름 아래에
사유 캡션을 렌더한다 — `ineligibleReason`이 있으면 `assignmentIneligibleReasonLabel(reason)`,
`null`이면 새 상수 `GENERIC_INELIGIBLE_MESSAGE`("지금은 배정 조건에 맞지 않아요")를 쓴다.
`useCandidateSelection` 훅은 지시대로 무수정이다(`currentlyAssigned` 전원을 선택 상태로 두는 기존
동작이 이미 맞았다).

### F-03 — 비활성이 된 기존 배정자가 후보에서 빠져 소리 없이 삭제되던 결함

`list_position_assignment_candidates`의 `where` 절을 `p.status = 'active' or exists(… 현재 이
스케줄·이 포지션에 배정됨 …)`으로 넓혔다(활성 근무자 전원은 그대로 포함되는 상위집합이다). 자격
판정(`assignment_eligibility`)이 상태 비활성을 최우선으로 검사해 `eligible = false, reason = null`을
반환한다 — `AssignmentIneligibleReason` 타입에 새 값을 추가하지 않았다(GENDER_MISMATCH·NOT_ELIGIBLE
두 값 유지, RADIO 42행). 배정된 적 없는 비활성 계정은 여전히 후보에서 빠진다(F-05/4로 고정).

### F-04 — 자격 판정 정본이 두 곳에 복제돼 있던 결함

내부 헬퍼 `assignment_eligibility(target_position_id uuid, target_profile_id uuid) returns table
(eligible boolean, ineligible_reason text)`를 신설해 활성 상태·성별 조건·가능 포지션 세 조건과
`ineligible_reason` 판정을 이 함수 안에만 뒀다. `list_position_assignment_candidates`는
`cross join lateral`로, `replace_position_assignments`는 `added_ids` 각각에 대해 호출해 사용한다.
`search_path`는 기존 두 함수와 같은 `set search_path = public`을 쓰고, 실행 권한은
`revoke execute … from public, anon, authenticated, service_role`만 하고 grant하지 않았다(내부용,
정의자 권한 함수 안에서 소유자로 호출되므로 동작).

`04-rls-default-deny.test.sql` 영향 확인: 이 파일은 `positions`·`venue_settings`·`check_in_rules`
테이블의 RLS만 단언하며 `assignments`·`assignment_positions`나 이번에 신설한 함수를 다루지 않는다.
새 헬퍼 함수 신설로 이 파일의 어떤 단언도 영향받지 않아 무수정으로 남겼다.

### F-05 — 사후 자격 회수 회귀 테스트 추가

`19-assignments.test.sql`에 pgTAP 단언 23건(72→95)을 추가했다 — 가능 포지션 회수·포지션 성별 조건
변경·계정 비활성화 세 경로 각각에서 재저장·다른 사람 추가·본인 해제가 성공하는지, 비활성 배정자가
후보 목록에 올바른 판정(`currently_assigned: true`, `eligible: false`, `ineligible_reason: null`)으로
나오는지, 배정된 적 없는 비활성 계정은 여전히 제외되는지를 고정했다. `candidate-buckets.test.ts`에
F-02의 새 분기(`!eligible && currentlyAssigned` → 일반 묶음)를 고정하는 unit 테스트 1건을 추가했다.

migration 파일만 git stash로 수정 전 버전으로 되돌려 새 pgTAP 단언이 실제로 실패하는 RED를 확인한
뒤(9개 실패 — F-01·F-03 결함이 재현됨), stash를 복원해 GREEN(95/95, 전체 19파일 1010/1010)을 확인했다.
`candidate-buckets.ts`도 같은 방식(git stash)으로 RED(1건 실패)→GREEN(4/4)을 확인했다. 실행 기록은
`docs/execution/runs/P3-T03/tdd.json`에 이어 남겼다.
