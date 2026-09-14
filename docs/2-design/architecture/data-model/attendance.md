# 출근

짝은 [domain/attendance.md](../../domain/attendance.md)다. 표는 `check_ins`·`excuses`·`hall_secrets` 셋과 뷰 `excuse_status` 하나다.

## 인증과 사유는 그날 그 사람에 붙인다

`check_ins(day_id, profile_id, checked_at, method) unique(day_id, profile_id)`, `excuses(day_id, profile_id, body, submitted_at, decided_at, decision, decision_reason)`. 배정이 아니다 — 9시 30분에 찍은 인증이 10시 강제 변경으로 사라지면 안 된다. 근무 시간이 날짜당 하나라 포지션이 바뀌어도 인증 창은 같다. 인증 함수가 「그날 살아 있는 배정이 있나」를 따로 검사한다.

인증은 되돌릴 수 없다 — 행을 고치는 함수가 없다.

## 사유

거절되면 새 행이다. 판정은 `decided_at`·`decision`으로 남고 글(`body`)은 본인과 관리자만 읽는다. 명단이 그리는 「확인 중·인정·결근」은 판정 결과가 필요하니 `excuse_status` 뷰(`security_invoker`)가 글만 빼고 `(day_id, profile_id, decided_at, decision)`을 전원에게 낸다.

## 상태는 계산한다

출근·지각·안 찍음·확인 중·인정·결근 다섯은 저장하지 않는다. `features/attendance`의 순수 함수가 `check_ins`·`excuse_status`·`days.starts_at`·서버 시각으로 낸다. 결근은 시계가 지나면 저절로 되는 것이라 배치가 없다.

## QR

`hall_secrets(hall_id, qr_code, rotated_at)`. `halls`와 가른 이유는 읽기 범위다 — 좌표·반경은 전원이 읽지만 QR 값은 관리자만이다. 같은 행에 있으면 근무자가 값을 읽어 스캔 없이 인증 함수에 넣는다. 바꾸면 옛 값을 덮어 즉시 폐기된다.
