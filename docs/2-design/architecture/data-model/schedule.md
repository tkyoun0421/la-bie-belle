# 근무표

짝은 [domain/schedule.md](../../domain/schedule.md)다. 표는 `schedules`·`days`·`slots`·`assignments`·`position_grants`·`availabilities`·`requests`·`request_candidates`·`cancel_requests` 아홉이다. `requests`는 교대와 같이 쓴다 — 교대 쪽은 [`swap.md`](swap.md)에 있다.

## 날과 자리

**자리는 날을 열 때 행으로 미리 만든다.** 관리자가 9월 20일을 열면 `days` 행 하나와 자리 기본값(아홉 포지션 열한 명)만큼 `slots` 행이 선다. 배정·근무 요청이 전부 `slot_id`를 가리킨다. 안 연 날은 `days` 행이 없고 달력이 비활성으로 그린다. `days.opened_at`이 「확정 시점에 있던 날인가」를 가른다 — 확정이 묶는 것은 그때 있던 날들이다([schedule.md](../../domain/schedule.md#확정-뒤에-바꾸는-길)).

**겸임은 새 자리 행이다.** 안내와 매니저를 합치면 `positions = ['안내','매니저']`인 `slots` 행 하나가 서고 원래 둘은 `ended_at`이 찍힌다. 나누면 합친 행을 닫고 원래 둘의 `ended_at`을 비운다. 살아 있는 자리는 언제나 하나라 「자리당 살아 있는 배정 하나」 unique index가 그대로 묶음까지 지킨다. 닫힌 자리에 걸려 있던 근무 요청은 합치기 함수가 같이 닫는다.

## 배정

**배정은 바뀌면 옛 행을 닫고 새 행을 만든다.** `assignments(slot_id, day_id, position, profile_id, kind, started_at, ended_at, ended_reason, ended_by)`. 교대·강제 변경·근무 취소가 남긴 자국이 그대로 이력이다. 확정 뒤에만 그렇다 — 확정 전에 짜는 동안의 이동은 행을 지운다([schedule.md](../../domain/schedule.md#근무표의-생애)가 날을 닫으면 「배정이 같이 사라진다」고 했다). 함수가 `schedules.confirmed_at`을 보고 가른다.

unique index 둘이 도메인 규칙을 지킨다.

- `(slot_id) where ended_at is null and kind = 'regular'` — 자리당 사람 하나
- `(day_id, profile_id) where ended_at is null and kind = 'regular'` — 한 사람이 같은 날 두 자리를 못 맡는다. 겸임은 자리 하나라 여기 안 걸린다

**교육 배정도 같은 표다.** `kind = 'training'`이고 `slot_id`가 없다. 정규면 `slot_id` 필수, 교육이면 없음을 check 제약이 지킨다. 「그날 근무한 사람」을 한 표에서 읽고, 「안내 교육 몇 번」은 `kind`로 센다.

## 자격

**자격은 계산한다.** 팀장·스캔·메인·드레스·드레스실에 들어갈 수 있는 사람은 그 포지션 `position_grants` 행이 있거나 그 포지션 교육 배정 행이 있는 사람이다. 관리자가 「자격까지 줌」을 고른 것만 저장한다(`position_grants(profile_id, position, granted_by, granted_at)`). 취소된 교육 배정은 `ended_reason`으로 걸러 자격에서 뺀다.

## 근무 신청

**날짜에 딸린다.** `availabilities(profile_id, work_date) unique`. `days`가 아니다 — 신청 접수는 근무표를 만드는 순간 열리고 날을 여는 것은 그 뒤라, 아직 안 연 날짜에 신청이 선다. 다시 보내면 함수가 그 달 행을 지우고 새로 넣는다. 본인과 관리자만 읽는다 — 누가 어느 날 쉬는지는 남이 볼 것이 아니다.

## 요청

**근무 요청과 교대 요청은 한 표다.** 여럿에게 묻고 답을 기다리는 모양이 같다. `requests(kind, slot_id, assignment_id, requested_by, expires_at, closed_at, approved_candidate_id)` — `kind = 'work'`면 `slot_id` 필수, `kind = 'swap'`이면 `assignment_id` 필수를 check 제약이 지킨다. 갈래는 `request_candidates(request_id, profile_id, status, responded_at, expires_at)`이고 `request_id`가 진짜 FK다.

자리를 채우는 길 다섯(배정 추가·교대 승인·강제 변경·근무 요청 수락·날 닫기)이 전부 그 자리의 살아 있는 `requests`를 닫는다. 한 표라 「이 자리의 살아 있는 요청」이 한 질의다.

`request_candidates.status`는 「상태는 저장하지 않는다」의 예외다. 수락 취소가 답을 안 한 상태로 되돌리니([swap.md](../../domain/swap.md#수락-취소)) 시각으로 못 나타낸다.

## 근무 취소

**따로 둔다.** `cancel_requests(assignment_id, reason, decided_at, decision, decision_reason)`. 거절되면 새 행이다 — 사유와 같은 꼴이다. 본인과 관리자만 읽는다.

## 아직 안 정한 것

- 「배웠다」의 기준 — 교육 배정이 서면인가, 출근 인증까지인가. 자격 계산이 이걸 든다
