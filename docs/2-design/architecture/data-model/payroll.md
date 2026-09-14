# 급여

짝은 [domain/payroll.md](../../domain/payroll.md)다. 표는 `wage_rates`·`default_wage_rates`·`adjustments`·`holidays` 넷이다.

## 시급 이력은 사람마다 실제 행이다

`wage_rates(profile_id, effective_date, amount, follows_default)`. 기본 시급 변경 함수가 `default_wage_rates(effective_date, amount)`에 한 행을 넣고 `follows_default = true`인 사람 전원에게 같은 날 행을 한 트랜잭션에 넣는다. 급여 계산은 `wage_rates` 하나만 읽고 RLS도 한 표에만 건다. 같은 날 두 번 바꾸면 덮어쓴다 — `(profile_id, effective_date)` unique. 승인 함수가 첫 행(`follows_default = true`)을 넣는다 — 승인된 사람은 곧바로 계산에 든다.

`wage_rates`는 본인 행과 관리자만, `default_wage_rates`는 관리자만 읽는다. 남의 시급을 화면에서 안 그리는 것으로는 직접 질의하는 길이 안 닫힌다([payroll.md](../../domain/payroll.md#시급을-누가-보나)).

## 조정

`adjustments(day_id, profile_id, minutes, reason, adjusted_by, adjusted_at)`. 그날 그 사람에 붙는다 — 인증과 같은 이유다. 이력이 남는다고 domain이 정했으니 같은 날 두 번 손보면 새 행이고 계산은 마지막 행을 쓴다.

## 급여는 계산한다

`features/payroll`의 순수 함수가 살아 있는 배정, 날의 시간, 조정, 사유 판정, 그날 시급을 받아 금액을 낸다. 근무자는 RLS가 자기 `wage_rates`만 주니 자기 금액만 나온다. 통계가 서른 명 한 달치를 보는 것은 관리자가 전원 행을 받아서다 — 배정 천 행쯤이라 클라이언트로 내려 계산해도 작다.

확정해 잠그는 행이 없다. 지난주 근무를 고치면 지난주 금액도 따라 바뀐다.

## 공휴일

`holidays(holiday_date, name)`. 공공 API에서 받아 넣어둔다. 지금 계산은 안 쓰고 데이터만 모은다.

## 아직 안 정한 것

- 공휴일을 누가 넣나 — 관리자 버튼 함수면 서비스 키가 안 든다
