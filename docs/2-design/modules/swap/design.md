# 교대 — 설계

짝은 [README.md](README.md)다. 교대의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

업무 규칙은 [README.md](README.md#업무-규칙)의 `SWP-001`부터 `SWP-016`까지다.

공통 스키마·권한·컬럼 규약과 읽기·쓰기·타입·에러 계약은 [system/data-access.md](../../system/data-access.md), 캐시 계층·시각은 [system/runtime.md](../../system/runtime.md), 시스템 경계는 [system/architecture.md](../../system/architecture.md)를 따른다.

## 소유 데이터

표를 따로 두지 않는다 — `requests`의 `kind = 'swap'` 행과 그 갈래 `request_candidates`가 교대다. 표의 모양은 [schedule/design.md](../schedule/design.md#요청)에 있다.

키는 [schedule/design.md](../schedule/design.md)의 `['requests']`를 같이 쓴다 — 교대는 `requests`의 한 `kind`다. 무효화 키는 교대 함수를 든 [schedule/design.md](../schedule/design.md#근무-요청-보내기)에 있고 공통 규칙은 [system/runtime.md](../../system/runtime.md#무효화-표)에 있다.

### 교대 행

`requests(kind = 'swap', assignment_id, requested_by, expires_at, closed_at, approved_candidate_id)`. `assignment_id`는 요청한 사람의 살아 있는 배정이다. 받을 사람마다 `request_candidates` 행이 하나 서고, 갈래마다 `expires_at`이 따로다 — 건 지 12시간이라 갈래마다 다르다.

받을 사람 없이 관리자에게만 보낸 교대는 갈래가 없는 `swap` 행이다. 그 뒤 처리는 [swap/README.md](README.md#아직-안-정한-것)가 열려 있다.

### 승인이 남기는 것

승인 함수가 `approved_candidate_id`를 찍고 `closed_at`을 찍는다. 배정은 [schedule/design.md](../schedule/design.md#배정)의 규칙대로 옛 행을 닫고 새 행을 만든다 — 받는 쪽이 그날 쉬면 요청자의 행이 닫히고 받는 사람의 행이 서고, 받는 쪽이 그날 근무 중이면 둘 다 닫히고 둘 다 새로 선다. 같은 배정에 걸려 있던 나머지 갈래는 `status`가 닫힘으로 바뀐다.

강제 변경은 `requests` 행이 없다. 배정 행의 `ended_reason = 'forced'`와 `ended_by`가 자국이다.

## 행위별 구현 계약

### 교대 걸기

- 규칙: [SWP-001](README.md#swp-001)·[SWP-002](README.md#swp-002)·[SWP-003](README.md#swp-003)·[SWP-010](README.md#swp-010)
- 입력·전제: `create_swap_request`가 자기 배정에 교대를 건다. 받을 사람 여럿 또는 없이(관리자에게만)
- 권한: 근무자
- 결과와 실패: 전날까지가 아니면 `window_closed`

### 요청에 답하기

- 규칙: [SWP-001](README.md#swp-001)·[SWP-005](README.md#swp-005)·[SWP-008](README.md#swp-008)
- 입력·전제: `respond_request`가 수락·거절·수락 취소다. [schedule/design.md](../schedule/design.md#요청에-답하기)의 그 함수와 같다 — 요청이 한 표라 함수도 하나
- 권한: 근무자

### 교대 승인

- 규칙: [SWP-002](README.md#swp-002)·[SWP-011](README.md#swp-011)·[SWP-012](README.md#swp-012)·[SWP-013](README.md#swp-013)
- 입력·전제: `approve_swap`이 수락자 중 하나를 골라 승인한다
- 권한: 관리자
- 처리와 경쟁: 관리자가 `approve_swap`을 누르는 사이 요청자가 근무 취소를 냈거나 다른 관리자가 강제 변경을 했으면 `stale`이다
- 결과와 실패: 들어가는 자리에 자격이 걸리면 `not_qualified`, 이미 승인됐거나 닫혔으면 `request_closed`
- 캐시 갱신: `stale`이면 화면은 요청 카드를 「바뀜」으로 바꾸고 `['requests']`·`['schedule']`을 다시 읽는다

### 강제 변경

- 규칙: [SWP-004](README.md#swp-004)
- 입력·전제: `force_change`가 절차 없이 바꾼다. [schedule/design.md](../schedule/design.md#배정과-강제-변경)에 있다
- 권한: 관리자

### 행위 밖의 실행 동작

- 규칙: [SWP-006](README.md#swp-006)·[SWP-007](README.md#swp-007)·[SWP-009](README.md#swp-009)
- 입력·전제: 만료는 `expire_requests`가 갈래마다 12시간으로 센다. 갈래마다 `expires_at`이 다르다
- 처리와 경쟁: 교대 요청·수락·수락 취소·승인 전부 남에게 닿는다. 낙관적인 것이 없다
- 결과와 실패: 전부 만료되면 `expire_requests` cron이 요청을 닫고 알림이 온다 — 화면이 세지 않는다. 받는 쪽 화면의 카운트다운은 자기 갈래 값이고, 요청자 화면은 가장 늦은 갈래까지 「기다리는 중」이다

## UI 연결

화면은 [schedule-worker](../schedule/screens/schedule-worker.md)의 날 시트다.

요청자가 그날 시트에서 여럿에게 건다(`create_swap_request`) → 받는 쪽마다 알림 → `/schedule?date=` 그날 시트 → 수락(`respond_request`) → 요청자와 관리자에게 수락 알림 → 관리자가 승인(`approve_swap`) → 배정이 바뀌고 승인 알림이 요청자와 선택된 쪽에게 → `/schedule?date=`.

받는 쪽이 전부 거절·만료면 요청자에게 전부 소진 알림 하나 → `/schedule?date=`. 거절·만료 건건이는 안 울린다. 수락 취소는 안 울린다.

## 아직 안 정한 것

### Q-01

- 질문: 관리자에게만 보낸 교대 요청을 관리자가 어떻게 푸나
- 영향: 닫히면 `approve_swap`의 인자가 정해진다
- 필요한 근거와 대안: [README.md](README.md#아직-안-정한-것)가 열려 있다

### Q-02

- 질문: 받는 쪽이 그날 근무 신청을 안 했으면 `approve_swap`이 신청 검사를 하는지
- 필요한 근거와 대안: [README.md](README.md#아직-안-정한-것)의 같은 자리

### Q-03

- 질문: 관리자가 교대를 승인하는 화면이 없다
- 영향: 수락 알림이 관리자를 어디로 보낼지가 이것에 달렸다. 정해질 때까지 [`notification/README.md`](../notification/README.md)의 그 줄은 비워둔다
- 필요한 근거와 대안: `schedule-admin.md`가 「관리자 승인 화면은 여기 없다」고 비워뒀고 `approvals.md`는 근무 취소와 사유만 든다 — 승인할 일에 교대 종류를 더하는 것이 후보다

### Q-04

- 질문: 받을 사람 없이 관리자에게만 거는 교대에서 관리자에게 무엇이 어디로 가나
- 결정 담당과 시점: 위 화면([Q-03](#q-03))과 같이 정한다
- 필요한 근거와 대안: `api/swap.md`가 함수 모양은 적었는데 domain도 여기도 비어 있다
