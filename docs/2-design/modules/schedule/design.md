# 근무표 — 설계

짝은 [README.md](README.md)다. 근무표의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

업무 규칙은 [README.md](README.md#업무-규칙)의 `SCH-001`부터 `SCH-019`까지다.

공통 스키마·권한·컬럼 규약과 읽기·쓰기·타입·에러 계약은 [system/data-access.md](../../system/data-access.md), 캐시 계층·시각은 [system/runtime.md](../../system/runtime.md), 시스템 경계는 [system/architecture.md](../../system/architecture.md)를 따른다.

## 소유 데이터

표는 `schedules`·`days`·`slots`·`assignments`·`position_grants`·`availabilities`·`requests`·`request_candidates`·`cancel_requests` 아홉이다. `requests`는 교대와 같이 쓴다 — 교대 쪽은 [swap/design.md](../swap/design.md)에 있다.

| 테이블 | 파일 | 한 줄 |
| --- | --- | --- |
| `schedules` | schedule | 한 달 근무표. 신청 마감일, 확정 시각 |
| `days` | schedule | 연 날 하나. 근무 시작·끝 시각, 연 시각 |
| `slots` | schedule | 어느 날 어느 포지션(들)의 자리 하나. 겸임은 포지션 둘을 든 새 행 |
| `assignments` | schedule | 자리에 든 사람 하나. 교육 배정도 여기 |
| `position_grants` | schedule | 관리자가 「자격까지 줌」을 고른 기록 |
| `availabilities` | schedule | 근무 신청 — 누가 어느 날짜에 일할 수 있나 |
| `requests` | schedule | 근무 요청과 교대 요청. `kind`로 가른다 |
| `request_candidates` | schedule | 요청의 갈래 — 누가 답했나 |
| `cancel_requests` | schedule | 근무자가 자기 배정을 무르는 요청과 판정 |

읽기 RLS는 기본값을 좁힌다.

| 표 | 누가 읽나 |
| --- | --- |
| `availabilities` | 본인 행과 관리자 |
| `cancel_requests` | 본인 행과 관리자 |

키 넷이다. 무효화 키는 행위마다 적고 공통 규칙은 [system/runtime.md](../../system/runtime.md#무효화-표)에 있다.

- `['schedule', 'YYYY-MM']` — 한 달의 `days`·`slots`·`assignments`·`profiles(display_name)`를 한 임베딩으로 받는다([행위 밖의 실행 동작](#행위-밖의-실행-동작)). 인증은 안 든다 — 달력이 출근 상태를 안 그린다. 달력·하루·명단의 배정이 전부 이 키에서 갈라 그린다
- `['availability', 'YYYY-MM']` — 본인 신청. 관리자의 신청 현황은 `['availability', 'YYYY-MM', 'all']`이다. `work_date`에 딸려 `days`에 임베딩할 수 없어 따로 읽는다
- `['requests']` — 살아 있는 요청과 닫힌 지 30일 안. 근무 요청·교대·근무 취소가 다 든다
- `['hall']` — 좌표·반경·자리 기본값

사람 픽커의 성별 기호와 [사람 시트](screens/schedule-admin.md#사람-시트)는 account의 `['members']`를 같이 읽는다. 근무표가 소유하지 않은 값이라 `['schedule']` 임베딩에 안 넣는다([account/design.md](../account/design.md)).

범위 없이 읽는 키의 범위는 이렇다([system/runtime.md](../../system/runtime.md#읽기-범위)).

- `['requests']` — 살아 있는 것과 닫힌 지 30일 안

### 달

**근무표 한 행이 달력 달 하나다.** `schedules.month`는 그 달 1일의 `date`이고 unique다. 범위를 계산하는 자리가 없다 — `days.work_date`의 연월이 곧 그 달이라 날을 여는 함수가 `date_trunc('month', work_date)`로 `schedules` 행을 찾거나 만든다([README.md](README.md#sch-010)).

달을 가리키는 것이 셋인데 전부 같은 달력 달이다 — 캐시 키 `['schedule', 'YYYY-MM']`, URL의 `?month=YYYY-MM`, 급여의 월 조회([payroll/README.md](../payroll/README.md#pay-022)). `?date=2026-11-01` 시트를 닫으면 `?month=2026-11`로 돌아간다.

### 날과 자리

**자리는 날을 열 때 행으로 미리 만든다.** 관리자가 9월 20일을 열면 `days` 행 하나와 자리 기본값(아홉 포지션 열한 명)만큼 `slots` 행이 선다. 배정·근무 요청이 전부 `slot_id`를 가리킨다. 안 연 날은 `days` 행이 없고 달력이 비활성으로 그린다. `days.opened_at`이 「확정 시점에 있던 날인가」를 가른다 — 확정이 묶는 것은 그때 있던 날들이다([README.md](README.md#sch-018)).

**겸임은 새 자리 행이다.** 안내와 매니저를 합치면 `positions = ['안내','매니저']`인 `slots` 행 하나가 서고 원래 둘은 `ended_at`이 찍힌다. 나누면 합친 행을 닫고 원래 둘의 `ended_at`을 비운다. 살아 있는 자리는 언제나 하나라 「자리당 살아 있는 배정 하나」 unique index가 그대로 묶음까지 지킨다. 닫힌 자리에 걸려 있던 근무 요청은 합치기 함수가 같이 닫는다.

### 배정

**배정은 바뀌면 옛 행을 닫고 새 행을 만든다.** `assignments(slot_id, day_id, position, profile_id, kind, started_at, ended_at, ended_reason, ended_by)`. 교대·강제 변경·근무 취소가 남긴 자국이 그대로 이력이다. 확정 뒤에만 그렇다 — 확정 전에 짜는 동안의 이동은 행을 지운다([README.md](README.md#sch-004)가 날을 닫으면 「배정이 같이 사라진다」고 했다). 함수가 `schedules.confirmed_at`을 보고 가른다.

unique index 둘이 도메인 규칙을 지킨다.

- `(slot_id) where ended_at is null and kind = 'regular'` — 자리당 사람 하나
- `(day_id, profile_id) where ended_at is null and kind = 'regular'` — 한 사람이 같은 날 두 자리를 못 맡는다. 겸임은 자리 하나라 여기 안 걸린다

**교육 배정도 같은 표다.** `kind = 'training'`이고 `slot_id`가 없다. 정규면 `slot_id` 필수, 교육이면 없음을 check 제약이 지킨다. 「그날 근무한 사람」을 한 표에서 읽고, 「안내 교육 몇 번」은 `kind`로 센다.

### 자격

**자격은 계산한다.** 팀장·스캔·메인·드레스·드레스실에 들어갈 수 있는 사람은 그 포지션 `position_grants` 행이 있거나 그 포지션 교육 배정 행이 있는 사람이다. 관리자가 「자격까지 줌」을 고른 것만 저장한다(`position_grants(profile_id, position, granted_by, granted_at)`). 취소된 교육 배정은 `ended_reason`으로 걸러 자격에서 뺀다.

**교육 배정 행이 서는 순간 자격이다.** 날짜가 미래여도, 출근 인증이 없어도 센다 — `days.work_date`도 `attendance`도 안 읽는다([README.md](README.md#sch-013)). 안 나온 사람의 자격을 거두는 길은 관리자가 그 교육 배정을 지우는 것 하나다.

### 근무 신청

**날짜에 딸린다.** `availabilities(profile_id, work_date) unique`. `days`가 아니다 — 신청 접수는 근무표를 만드는 순간 열리고 날을 여는 것은 그 뒤라, 아직 안 연 날짜에 신청이 선다. 다시 보내면 함수가 그 달 행을 지우고 새로 넣는다. 본인과 관리자만 읽는다 — 누가 어느 날 쉬는지는 남이 볼 것이 아니다.

### 요청

**근무 요청과 교대 요청은 한 표다.** 여럿에게 묻고 답을 기다리는 모양이 같다. `requests(kind, slot_id, assignment_id, requested_by, expires_at, closed_at, approved_candidate_id)` — `kind = 'work'`면 `slot_id` 필수, `kind = 'swap'`이면 `assignment_id` 필수를 check 제약이 지킨다. 갈래는 `request_candidates(request_id, profile_id, status, responded_at, expires_at)`이고 `request_id`가 진짜 FK다.

자리를 채우는 길 다섯(배정 추가·교대 승인·강제 변경·근무 요청 수락·날 닫기)이 전부 그 자리의 살아 있는 `requests`를 닫는다. 한 표라 「이 자리의 살아 있는 요청」이 한 질의다.

`request_candidates.status`는 「상태는 저장하지 않는다」의 예외다. 수락 취소가 답을 안 한 상태로 되돌리니([swap/README.md](../swap/README.md#swp-008)) 시각으로 못 나타낸다.

### 근무 취소

**따로 둔다.** `cancel_requests(assignment_id, reason, decided_at, decision, decision_reason)`. 거절되면 새 행이다 — 사유와 같은 꼴이다. 본인과 관리자만 읽는다.

### 계산의 예외 하나

「빈 자리」 판정만 SQL이다. `open_slots` 뷰(`security_invoker`)가 살아 있는 자리 중 살아 있는 정규 배정이 없는 것을 낸다. pg_cron의 빈자리 재촉과 관리자 화면이 같은 뷰를 읽는다 — TS와 cron SQL에 같은 규칙이 두 벌 서는 것을 막는다.

## 행위별 구현 계약

### 근무표 만들기와 마감일

- 규칙: [SCH-001](README.md#sch-001)·[SCH-002](README.md#sch-002)·[SCH-005](README.md#sch-005)·[SCH-007](README.md#sch-007)·[SCH-008](README.md#sch-008)·[SCH-009](README.md#sch-009)
- 입력·전제: `create_schedule`, `set_application_deadline`, `confirm_schedule`이 근무표 만들기·마감일 바꾸기·확정이다
- 결과와 실패: 마감 전 확정은 `too_early`
- 캐시 갱신: `['schedule']` `['payroll']` `['requests']`

### 근무 신청 내기

- 규칙: [SCH-005](README.md#sch-005)·[SCH-006](README.md#sch-006)
- 입력·전제: `submit_availability`가 근무 신청이다
- 읽고 쓰는 데이터: 그 달 행을 지우고 새로 넣는다
- 처리와 경쟁: **근무 신청 체크만 즉시 칠한다.** 달력에서 날짜를 누르면 바로 표시되고 저장 버튼이 `submit_availability`를 한 번 보낸다
- 결과와 실패: 마감 지나면 `window_closed`. 실패하면 서버 값으로 되돌리고 토스트다. 마감이 지나 `window_closed`가 오면 달력을 잠근다
- 캐시 갱신: `['availability']`

### 날 열기·닫기

- 규칙: [SCH-003](README.md#sch-003)·[SCH-004](README.md#sch-004)
- 입력·전제: `open_day`, `close_day`, `set_day_hours`가 날 열기(자리 기본값 깔기)·닫기(배정 같이)·근무 시간이다
- 캐시 갱신: `['schedule']` `['payroll']` `['requests']`

### 자리 늘리기·줄이기·겸임

- 규칙: [SCH-011](README.md#sch-011)·[SCH-015](README.md#sch-015)
- 입력·전제: `add_slot`, `remove_slot`, `merge_slots`, `split_slot`이 자리 늘리기·줄이기·겸임 만들기·나누기다
- 처리와 경쟁: 합치기는 닫힌 자리의 요청도 닫는다
- 캐시 갱신: `['schedule']` `['payroll']` `['requests']`

### 배정과 강제 변경

- 규칙: [SCH-013](README.md#sch-013)·[SCH-014](README.md#sch-014)·[SCH-016](README.md#sch-016)·[SCH-018](README.md#sch-018)
- 입력·전제: `add_assignment`, `remove_assignment`, `force_change`가 배정 추가(교육 포함)·확정 전 빼기·확정 뒤 바꾸기다
- 처리와 경쟁: 배정 추가·제거·강제 변경·요청 수락·확정은 응답을 기다린다. 확정은 되돌릴 수 없고, 나머지는 남과 겹친다. 잠금은 없다
- 결과와 실패: 미신청자는 `not_allowed`, 자격 없으면 `not_qualified`, 그날 이미 든 사람은 `already_assigned`. `stale`이 오면 「이 근무가 바뀌었어요」 시트를 닫지 않고 그 자리만 다시 읽는다 — 관리자가 고치던 나머지가 사라지지 않게. `add_assignment`가 `already_assigned`·`slot_full`을 던지면 같은 처리다
- 캐시 갱신: `['schedule']` `['payroll']` `['requests']`

### 자격 주기

- 규칙: [SCH-013](README.md#sch-013)
- 입력·전제: `grant_position`이 자격까지 주기다
- 캐시 갱신: `['members']`

### 근무 요청 보내기

- 규칙: [SCH-017](README.md#sch-017)
- 입력·전제: `send_work_request`가 근무 요청 보내기(여럿에게)다
- 처리와 경쟁: 관리자가 날 상세에서 여럿에게 보낸다(`send_work_request`) → 받은 근무자마다 알림 → `/schedule?date=` 그날 시트의 요청 카드 → 「근무할게요」(`respond_request`) → 첫 사람만 통과, 나머지는 `slot_full` → 관리자에게 수락 알림 → 날 상세. 전부 거절이거나 배치 `expire_requests`가 만료시키면 관리자에게 전부 소진 알림 → 날 상세
- 결과와 실패: 끝난 요청의 알림을 뒤늦게 누르면 같은 `?date=`고 시트가 끝난 모양으로 열린다
- 캐시 갱신: `send_work_request` · `respond_request` · `approve_swap` · `create_swap_request` · `create_cancel_request` · `decide_cancel_request`가 `['schedule']` `['payroll']` `['requests']`다

### 요청에 답하기

- 규칙: [SCH-017](README.md#sch-017). 교대 쪽은 [swap/README.md](../swap/README.md)다
- 입력·전제: `respond_request`가 근무 요청·교대 요청에 답하기 — 수락·거절·수락 취소다
- 처리와 경쟁: 근무 요청 수락은 곧 배정이라 자격 검사도 한다. 카운트다운은 `expires_at`과 서버 오프셋으로 로컬 계산이고, 0이 되면 버튼이 잠긴다 — 서버의 `expire_requests` cron이 매 분 돌아 닫으니 몇십 초 어긋나면 `request_closed`가 잡는다
- 결과와 실패: 선착순에 지면 `slot_full`, 만료·닫힘이면 `request_closed`. `respond_request`가 `slot_full`·`request_closed`를 던지면 요청 카드를 「마감됨」으로 바꾸고 `['requests']`를 다시 읽는다

### 근무 취소 요청과 판정

- 규칙: [SCH-018](README.md#sch-018)
- 입력·전제: `create_cancel_request`가 근무 취소 요청, `decide_cancel_request`가 근무 취소 판정이다
- 처리와 경쟁: 근무자가 그날 시트에서 낸다(`create_cancel_request`) → 관리자에게 알림 → `/admin/approvals` → 승인(`decide_cancel_request`)이면 날 상세(`?from=approvals`)로 넘어가 빈자리를 채운다, 거절이면 목록에 머문다 → 근무자에게 결과 알림 → 승인이면 `/schedule?month=`(그날 시트에 자기가 없다), 거절이면 `/schedule?date=`
- 결과와 실패: 전날까지가 아니면 `window_closed`. 거절 이유가 근무자에게 그대로 간다

### 홀 기본값

- 규칙: [SCH-011](README.md#sch-011)과 [README.md](README.md#용어)의 근무 시간
- 입력·전제: `set_hall_defaults`가 자리·근무 시간 기본값이다

### 행위 밖의 실행 동작

근무표 한 달은 `days`에서 `slots`·`assignments`·`check_ins`를 임베딩한 한 질의다. `assignments`는 `days`에서 바로 — `slots`를 거치면 교육 배정이 빠진다. 관리자 화면의 빈 자리는 `open_slots` 뷰다.

달을 넘기면 다음 달 키를 읽는다. 앞뒤 한 달은 `prefetchQuery`로 미리 받는다 — 근무표 화면에서 넘기는 일이 잦다. 세 달 밖은 그때 읽는다.

## UI 연결

pg_cron(`internal`) — `expire_requests`(48시간·12시간 만료와 「전부 끝남」 알림), `emit_reminders`의 빈자리 재촉이 `open_slots` 뷰를 읽는다.

화면은 [schedule-worker](screens/schedule-worker.md)·[schedule-admin](screens/schedule-admin.md)·[approvals](../../system/screens/approvals.md)다.

## 아직 안 정한 것

지금은 없다.

달의 축과 달 키의 범위와 `?month=`는 [달](#달)로, 「배웠다」의 기준은 [자격](#자격)으로 닫혀 올라갔다. `emit_reminders`의 주말 묶기는 [notification/design.md](../notification/design.md#행위-밖의-실행-동작)가 소유한다.
