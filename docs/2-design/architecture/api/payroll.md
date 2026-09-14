# 급여

짝은 [domain/payroll.md](../../domain/payroll.md)와 [`../data-model/payroll.md`](../data-model/payroll.md)다.

## 함수

전부 관리자만.

| 함수 | 하는 일 |
| --- | --- |
| `set_wage` | 개인 시급. 적용일은 오늘이고 인자로 안 받는다 |
| `reset_wage_to_default` | 기본으로 되돌리기. 오늘부터 다시 끈에 붙는다 |
| `set_default_wage` | 기본 시급. 따르는 전원에게 같은 날 행이 한 트랜잭션에 선다 |
| `set_adjustment` | 그날 그 사람의 근무 시간 조정 |
| `import_holidays` | 공휴일 넣기 |

## 읽기

급여 화면은 `assignments`(살아 있는 것)·`days`·`adjustments`·`excuse_status`·`wage_rates`를 받아 `features/payroll`이 계산한다. 근무자는 RLS가 자기 시급만 주니 자기 금액만 나온다. 통계는 관리자가 전원 행을 받는다 — 한 달치 배정 천 행쯤이라 한 질의다.

## 아직 안 정한 것

- `import_holidays`를 누가 누르나 — 관리자 버튼이면 브라우저가 공공 API를 부르고 결과를 함수에 넘긴다(CORS가 막으면 Edge Function). 연 1회라 자동화 안 한다
