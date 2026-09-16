# 급여 — 설계

짝은 [README.md](README.md)다. 급여의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

업무 규칙은 [README.md](README.md#업무-규칙)의 `PAY-001`부터 `PAY-028`까지다.

공통 스키마·권한·컬럼 규약과 읽기·쓰기·타입·에러 계약은 [system/data-access.md](../../system/data-access.md), 캐시 계층·시각은 [system/runtime.md](../../system/runtime.md), 시스템 경계는 [system/architecture.md](../../system/architecture.md)를 따른다.

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

키는 `['payroll', 'YYYY-MM']`이고 `wage_rates`·`adjustments`·`excuse_status`를 그달치로 받는다. 배정과 날은 `['schedule', 'YYYY-MM']`을, 리허설은 `['rehearsal', 'YYYY-MM']`을 같이 쓴다 — 급여 화면이 세 키를 읽고 순수 함수에 넣는다. 리허설이 `['schedule']`에 안 실리는 까닭은 [schedule/design.md](../schedule/design.md#소유-데이터)에 있다. 무효화 키는 행위마다 적고 공통 규칙은 [system/runtime.md](../../system/runtime.md#무효화-표)에 있다.

급여 달과 근무표 달이 같은 달력 달이라([PAY-022](README.md#pay-022)) 급여 한 달이 `['schedule']` 한 달만 읽는다.

### 시급 이력은 사람마다 실제 행이다

`wage_rates(profile_id, effective_date, amount, follows_default)`. 기본 시급 변경 함수가 `default_wage_rates(effective_date, amount)`에 한 행을 넣고 `follows_default = true`인 사람 전원에게 같은 날 행을 한 트랜잭션에 넣는다. 급여 계산은 `wage_rates` 하나만 읽고 RLS도 한 표에만 건다. 같은 날 두 번 바꾸면 덮어쓴다 — `(profile_id, effective_date)` unique. 승인 함수가 첫 행(`follows_default = true`)을 넣는다 — 승인된 사람은 곧바로 계산에 든다.

`wage_rates`는 본인 행과 관리자만, `default_wage_rates`는 관리자만 읽는다. 남의 시급을 화면에서 안 그리는 것으로는 직접 질의하는 길이 안 닫힌다([README.md](README.md#pay-018)).

### 조정

`adjustments(day_id, profile_id, minutes, reason, adjusted_by, adjusted_at)`. 그날 그 사람에 붙는다 — 인증과 같은 이유다. 이력이 남는다고 domain이 정했으니 같은 날 두 번 손보면 새 행이고 계산은 마지막 행을 쓴다.

`minutes`가 더할 분이다. 연장이면 양수, 결근이면 그날 배정 시간을 지우는 음수다 — 「결근」이라는 값을 따로 두지 않고 관리자가 결근을 고르면 화면이 그날 배정 시간만큼의 음수를 넣는다. 그래서 합산 뒤 0분이 되고 그날이 급여에서 빠진다([PAY-003](README.md#pay-003)).

**리허설은 조정이 아니다.** `rehearsals`가 따로 시간을 내고([schedule/design.md](../schedule/design.md#리허설)) 급여가 배정 시간과 조정과 리허설 셋을 더한다. 조정 표에 안 섞는 것은 주인이 달라서다 — 조정은 관리자가 쓰고 리허설은 본인이 쓴다.

### 급여는 계산한다

`features/payroll`의 순수 함수가 살아 있는 배정, 날의 시간, 조정, 리허설, 사유 판정, 그날 시급을 받아 금액을 낸다. 그날 총 시간은 배정 시간에 조정 분과 리허설 시간을 더한 것이고, 그 하나로 9시간 기준을 본다([PAY-028](README.md#pay-028)) — 배정이 없는 날도 같은 함수가 돈다. 배정 시간이 0이라 리허설 시간만 남는다. 근무자는 RLS가 자기 `wage_rates`만 주니 자기 금액만 나온다. 통계가 서른 명 한 달치를 보는 것은 관리자가 전원 행을 받아서다 — 배정 천 행쯤이라 클라이언트로 내려 계산해도 작다.

확정해 잠그는 행이 없다. 지난주 근무를 고치면 지난주 금액도 따라 바뀐다.

### 공휴일

`holidays(holiday_date, name, source)`. 지금 계산은 안 쓰고 데이터만 모은다.

`source`가 `api`와 `manual`을 가른다 — 앞은 해마다 한 번 공공 API에서 받은 것이고 뒤는 관리자가 날 상세에서 표시한 임시공휴일이다([PAY-027](README.md#pay-027)). 가르는 이유는 받기 규칙이 뒤에 바뀌어 이미 받은 해를 다시 받게 될 때 손으로 넣은 값이 조용히 사라지지 않게 하는 것이다 — 받기는 `api` 행만 덮는다.

## 행위별 구현 계약

### 시급과 조정

- 규칙: [PAY-002](README.md#pay-002)·[PAY-008](README.md#pay-008)·[PAY-011](README.md#pay-011)·[PAY-013](README.md#pay-013)·[PAY-014](README.md#pay-014)
- 입력·전제: `set_wage`가 개인 시급이다 — 적용일은 오늘이고 인자로 안 받는다. `reset_wage_to_default`가 기본으로 되돌리기고 오늘부터 다시 끈에 붙는다. `set_default_wage`가 기본 시급이다. `set_adjustment(p_day_id uuid, p_profile_id uuid, p_minutes integer, p_reason text)`가 그날 그 사람의 근무 시간 조정이고, 관리자가 근무표 날 상세의 「근무 조정」 줄에서 부른다([schedule-admin.md](../schedule/screens/schedule-admin.md#근무-조정))
- 읽고 쓰는 데이터: `set_default_wage`는 따르는 전원에게 같은 날 행이 한 트랜잭션에 선다
- 처리와 경쟁: 시급·조정 전부다. 돈이라 낙관적으로 칠하지 않는다
- 캐시 갱신: `set_wage` · `reset_wage_to_default` · `set_default_wage` · `set_adjustment`는 `['payroll']`

### 공휴일 넣기

- 규칙: [PAY-023](README.md#pay-023)·[PAY-024](README.md#pay-024)·[PAY-027](README.md#pay-027)
- 입력·전제: `import_holidays(p_year integer, p_rows jsonb)`가 받아온 목록을 넣는다. 부르는 것은 Edge Function `import-holidays`고 그 함수가 공공 API를 부른다 — Postgres 함수가 외부 HTTP를 못 부르니 계기와 호출이 갈린다. 관리자가 손으로 표시하는 임시공휴일은 `set_holiday(p_date date, p_on boolean)`이고 `manual`로 넣는다
- 읽고 쓰는 데이터: `import_holidays`는 그 해의 `api` 행을 지우고 새로 넣는다 — `manual` 행은 안 건드린다. `set_holiday`는 `p_on`이 참이면 `manual` 행을 넣고 거짓이면 지운다. 같은 날짜에 `api` 행이 이미 있으면 `set_holiday`가 아무것도 안 한다 — 이미 공휴일이다
- 권한: `import_holidays`는 `internal`이다. 사람이 부르는 자리가 없고 Edge Function이 서비스 키로 온다 — 서비스 키 자리 둘 중 나머지 하나다([notification/design.md](../notification/design.md#푸시-보내기)의 `send-push`가 첫째). `set_holiday`는 `public`이고 첫 줄이 `is_admin()`이다
- 처리와 경쟁: 받는 계기는 pg_cron이다. 아래 [행위 밖의 실행 동작](#행위-밖의-실행-동작)에 있다

### 공휴일 받기

- 규칙: [PAY-023](README.md#pay-023)
- 입력·전제: pg_cron(`internal`)의 `fetch_holidays`가 날마다 돈다. 다음 해 행이 하나도 없으면 `pg_net`으로 Edge Function `import-holidays`를 쏜다. 있으면 아무것도 안 한다
- 읽고 쓰는 데이터: Edge Function이 공공 API를 부르고 결과를 `import_holidays`에 넘긴다. 실패하면 아무것도 안 넣는다 — 다음 날 cron이 같은 조건을 다시 보고 다시 쏜다
- 권한: API 키는 Edge Function secret이다. 저장소에 안 들어간다
- 처리와 경쟁: 날마다 도는 것이 곧 재시도라 실패 큐가 없다. 받아진 해가 있는지가 완료 표시고, 그 판정이 `erase_profiles`가 `user_id`의 유무를 보는 것과 같은 꼴이다([account/design.md](../account/design.md#비우기)). 한 해에 실제로 외부를 부르는 것은 한 번이고, 그 한 번이 성공하면 이듬해까지 안 부른다

### 행위 밖의 실행 동작

- 규칙: [PAY-015](README.md#pay-015)·[PAY-018](README.md#pay-018)·[PAY-019](README.md#pay-019)·[PAY-020](README.md#pay-020)·[PAY-023](README.md#pay-023)·[PAY-025](README.md#pay-025)·[PAY-028](README.md#pay-028)
- 입력·전제: 급여 화면은 `assignments`(살아 있는 것)·`days`·`adjustments`·`rehearsals`·`excuse_status`·`wage_rates`를 받아 `features/payroll`이 계산한다. pg_cron(`internal`)에 `fetch_holidays`가 하나 있다 — 날마다 돌며 다음 해가 비었을 때만 밖을 부른다
- 읽고 쓰는 데이터: 저장된 금액이 없다. 세 키가 갖춰지면 `features/payroll`의 순수 함수가 돈다. 배정이 없고 리허설만 있는 날도 그 함수가 낸다 — 날짜를 `['schedule']`이 아니라 세 키의 날짜 합집합에서 모은다
- 권한: 근무자는 RLS가 자기 시급만 주니 자기 금액만 나온다. 통계는 관리자가 전원 행을 받는다
- 처리와 경쟁: 서른 명 한 달이면 배정 천 행이라 `useMemo` 하나면 된다 — 한 달치 배정 천 행쯤이라 한 질의다. 통계가 여러 달을 합칠 때는 달마다 키를 읽어 더한다

## UI 연결

화면은 [payroll](screens/payroll.md)·[wages](screens/wages.md)와 [stats](../../system/screens/stats.md)다.

## 아직 안 정한 것

비어 있다. 「공휴일을 누가 넣나」와 「`import_holidays`를 누가 누르나」는 [공휴일 받기](#공휴일-받기)로 닫혀 올라갔다 — cron이 계기고 사람이 누르는 자리가 없다. 「`set_adjustment`를 누르는 화면이 없다」는 [시급과 조정](#시급과-조정)으로 닫혔다 — 날 상세의 「근무 조정」 줄이다.
