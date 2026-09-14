# 교대

짝은 [domain/swap.md](../../domain/swap.md)다. 표를 따로 두지 않는다 — `requests`의 `kind = 'swap'` 행과 그 갈래 `request_candidates`가 교대다. 표의 모양은 [`schedule.md`](schedule.md#요청)에 있다.

## 교대 행

`requests(kind = 'swap', assignment_id, requested_by, expires_at, closed_at, approved_candidate_id)`. `assignment_id`는 요청한 사람의 살아 있는 배정이다. 받을 사람마다 `request_candidates` 행이 하나 서고, 갈래마다 `expires_at`이 따로다 — 건 지 12시간이라 갈래마다 다르다.

받을 사람 없이 관리자에게만 보낸 교대는 갈래가 없는 `swap` 행이다. 그 뒤 처리는 [domain/swap.md](../../domain/swap.md#아직-안-정한-것)가 열려 있다.

## 승인이 남기는 것

승인 함수가 `approved_candidate_id`를 찍고 `closed_at`을 찍는다. 배정은 [`schedule.md`](schedule.md#배정)의 규칙대로 옛 행을 닫고 새 행을 만든다 — 받는 쪽이 그날 쉬면 요청자의 행이 닫히고 받는 사람의 행이 서고, 받는 쪽이 그날 근무 중이면 둘 다 닫히고 둘 다 새로 선다. 같은 배정에 걸려 있던 나머지 갈래는 `status`가 닫힘으로 바뀐다.

강제 변경은 `requests` 행이 없다. 배정 행의 `ended_reason = 'forced'`와 `ended_by`가 자국이다.
