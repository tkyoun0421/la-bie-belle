# 급여 — 설계

짝은 [README.md](README.md)다. 급여의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

공통 스키마·권한·컬럼 규약과 읽기·쓰기·타입·에러 계약은 [system/data-access.md](../../system/data-access.md), 캐시 계층·시각은 [system/runtime.md](../../system/runtime.md), 시스템 경계는 [system/architecture.md](../../system/architecture.md)를 따른다.

키는 `['payroll', 'YYYY-MM']`이고 `wage_rates`·`adjustments`·`excuse_status`를 그달치로 받는다. 배정과 날은 `['schedule', 'YYYY-MM']`을 같이 쓴다 — 급여 화면이 두 키를 읽고 순수 함수에 넣는다. 무효화 키는 행위마다 적고 공통 규칙은 [system/runtime.md](../../system/runtime.md#무효화-표)에 있다.

## 소유 데이터

표는 `wage_rates`·`default_wage_rates`·`adjustments`·`holidays` 넷이다.

| 테이블 | 파일 | 한 줄 |
| --- | --- | --- |
| `adjustments` | payroll | 관리자가 손본 그날 그 사람의 근무 시간 |
| `wage_rates` | payroll | 사람별 시급 이력 |
| `default_wage_rates` | payroll | 기본 시급 이력 |
| `holidays` | payroll | 공공 API에서 받아둔 공휴일 |

읽기 RLS는 기본값을 좁힌다.

| 표 | 누가 읽나 |
| --- | --- |
| `wage_rates` | 본인 행과 관리자 |
| `default_wage_rates` | 관리자 |

### 시급 이력은 사람마다 실제 행이다

`wage_rates(profile_id, effective_date, amount, follows_default)`. 기본 시급 변경 함수가 `default_wage_rates(effective_date, amount)`에 한 행을 넣고 `follows_default = true`인 사람 전원에게 같은 날 행을 한 트랜잭션에 넣는다. 급여 계산은 `wage_rates` 하나만 읽고 RLS도 한 표에만 건다. 같은 날 두 번 바꾸면 덮어쓴다 — `(profile_id, effective_date)` unique. 승인 함수가 첫 행(`follows_default = true`)을 넣는다 — 승인된 사람은 곧바로 계산에 든다.

`wage_rates`는 본인 행과 관리자만, `default_wage_rates`는 관리자만 읽는다. 남의 시급을 화면에서 안 그리는 것으로는 직접 질의하는 길이 안 닫힌다([README.md](README.md#시급을-누가-보나)).

### 조정

`adjustments(day_id, profile_id, minutes, reason, adjusted_by, adjusted_at)`. 그날 그 사람에 붙는다 — 인증과 같은 이유다. 이력이 남는다고 domain이 정했으니 같은 날 두 번 손보면 새 행이고 계산은 마지막 행을 쓴다.

### 급여는 계산한다

`features/payroll`의 순수 함수가 살아 있는 배정, 날의 시간, 조정, 사유 판정, 그날 시급을 받아 금액을 낸다. 근무자는 RLS가 자기 `wage_rates`만 주니 자기 금액만 나온다. 통계가 서른 명 한 달치를 보는 것은 관리자가 전원 행을 받아서다 — 배정 천 행쯤이라 클라이언트로 내려 계산해도 작다.

확정해 잠그는 행이 없다. 지난주 근무를 고치면 지난주 금액도 따라 바뀐다.

### 공휴일

`holidays(holiday_date, name)`. 공공 API에서 받아 넣어둔다. 지금 계산은 안 쓰고 데이터만 모은다.

## 행위별 구현 계약

### 시급과 조정

| 함수 | 하는 일 |
| --- | --- |
| `set_wage` | 개인 시급. 적용일은 오늘이고 인자로 안 받는다 |
| `reset_wage_to_default` | 기본으로 되돌리기. 오늘부터 다시 끈에 붙는다 |
| `set_default_wage` | 기본 시급. 따르는 전원에게 같은 날 행이 한 트랜잭션에 선다 |
| `set_adjustment` | 그날 그 사람의 근무 시간 조정 |

| 함수 | 무효화 |
| --- | --- |
| `set_wage` · `reset_wage_to_default` · `set_default_wage` · `set_adjustment` | `['payroll']` |

시급·조정 전부다. 돈이라 낙관적으로 칠하지 않는다.

### 공휴일 넣기

| 함수 | 하는 일 |
| --- | --- |
| `import_holidays` | 공휴일 넣기 |

### 행위 밖의 실행 동작

급여 화면은 `assignments`(살아 있는 것)·`days`·`adjustments`·`excuse_status`·`wage_rates`를 받아 `features/payroll`이 계산한다. 근무자는 RLS가 자기 시급만 주니 자기 금액만 나온다. 통계는 관리자가 전원 행을 받는다 — 한 달치 배정 천 행쯤이라 한 질의다.

저장된 금액이 없다. 두 키가 갖춰지면 `features/payroll`의 순수 함수가 돈다. 서른 명 한 달이면 배정 천 행이라 `useMemo` 하나면 된다. 통계가 여러 달을 합칠 때는 달마다 키를 읽어 더한다.

급여 달과 근무표 달의 범위가 다르면 급여 한 달이 `['schedule']` 두 달을 읽는다 — [schedule/design.md](../schedule/design.md#아직-안-정한-것)의 달 키 범위가 정해지면 따라간다.

## UI 연결

화면은 [payroll](screens/payroll.md)·[wages](screens/wages.md)와 [stats](../../system/screens/stats.md)다.

## 아직 안 정한 것

- 공휴일을 누가 넣나 — 관리자 버튼 함수면 서비스 키가 안 든다
- `import_holidays`를 누가 누르나 — 관리자 버튼이면 브라우저가 공공 API를 부르고 결과를 함수에 넘긴다(CORS가 막으면 Edge Function). 연 1회라 자동화 안 한다
