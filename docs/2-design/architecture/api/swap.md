# 교대

짝은 [domain/swap.md](../../domain/swap.md)와 [`../data-model/swap.md`](../data-model/swap.md)다.

## 함수

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `create_swap_request` | 근무자 | 자기 배정에 교대를 건다. 받을 사람 여럿 또는 없이(관리자에게만). 전날까지가 아니면 `window_closed` |
| `respond_request` | 근무자 | 수락·거절·수락 취소. [`schedule.md`](schedule.md)의 그 함수와 같다 — 요청이 한 표라 함수도 하나 |
| `approve_swap` | 관리자 | 수락자 중 하나를 골라 승인. 들어가는 자리에 자격이 걸리면 `not_qualified`, 이미 승인됐거나 닫혔으면 `request_closed` |
| `force_change` | 관리자 | 절차 없이 바꾼다. [`schedule.md`](schedule.md)에 있다 |

만료는 `expire_requests`가 갈래마다 12시간으로 센다.

## 아직 안 정한 것

- 관리자에게만 보낸 교대 요청을 관리자가 어떻게 푸나 — [domain/swap.md](../../domain/swap.md#아직-안-정한-것)가 열려 있다. 닫히면 `approve_swap`의 인자가 정해진다
- 받는 쪽이 그날 근무 신청을 안 했으면 — 같은 자리. `approve_swap`이 신청 검사를 하는지
