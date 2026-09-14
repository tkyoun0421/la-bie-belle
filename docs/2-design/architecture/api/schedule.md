# 근무표

짝은 [domain/schedule.md](../../domain/schedule.md)와 [`../data-model/schedule.md`](../data-model/schedule.md)다.

## 함수

관리자만.

| 함수 | 하는 일 |
| --- | --- |
| `create_schedule`, `set_application_deadline`, `confirm_schedule` | 근무표 만들기·마감일 바꾸기·확정. 마감 전 확정은 `too_early` |
| `open_day`, `close_day`, `set_day_hours` | 날 열기(자리 기본값 깔기)·닫기(배정 같이)·근무 시간 |
| `add_slot`, `remove_slot`, `merge_slots`, `split_slot` | 자리 늘리기·줄이기·겸임 만들기·나누기. 합치기는 닫힌 자리의 요청도 닫는다 |
| `add_assignment`, `remove_assignment`, `force_change` | 배정 추가(교육 포함)·확정 전 빼기·확정 뒤 바꾸기. 미신청자는 `not_allowed`, 자격 없으면 `not_qualified`, 그날 이미 든 사람은 `already_assigned` |
| `grant_position` | 자격까지 주기 |
| `send_work_request` | 근무 요청 보내기(여럿에게) |
| `decide_cancel_request` | 근무 취소 판정. 거절 이유가 근무자에게 그대로 간다 |
| `set_hall_defaults` | 자리·근무 시간 기본값 |

근무자.

| 함수 | 하는 일 |
| --- | --- |
| `submit_availability` | 근무 신청. 그 달 행을 지우고 새로 넣는다. 마감 지나면 `window_closed` |
| `respond_request` | 근무 요청·교대 요청에 답하기 — 수락·거절·수락 취소. 근무 요청 수락은 곧 배정이라 자격 검사도 하고, 선착순에 지면 `slot_full`, 만료·닫힘이면 `request_closed` |
| `create_cancel_request` | 근무 취소 요청. 전날까지가 아니면 `window_closed` |

pg_cron(`internal`) — `expire_requests`(48시간·12시간 만료와 「전부 끝남」 알림), `emit_reminders`의 빈자리 재촉이 `open_slots` 뷰를 읽는다.

## 읽기

근무표 한 달은 `days`에서 `slots`·`assignments`·`check_ins`를 임베딩한 한 질의다. `assignments`는 `days`에서 바로 — `slots`를 거치면 교육 배정이 빠진다. 관리자 화면의 빈 자리는 `open_slots` 뷰다.

## 아직 안 정한 것

- `emit_reminders`의 「주말은 금요일 저녁 9시에 묶어서」 — 함수 하나가 요일을 보고 가르는지, cron 항목을 요일별로 두는지
