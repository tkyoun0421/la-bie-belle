---
sources:
  - ../../2-design/modules/payroll/design.md#소유-데이터
  - ../../2-design/modules/payroll/design.md#시급-이력은-사람마다-실제-행이다
  - ../../2-design/modules/payroll/design.md#조정
  - ../../2-design/modules/payroll/design.md#급여는-계산한다
  - ../../2-design/modules/payroll/design.md#공휴일
  - ../../2-design/modules/payroll/design.md#시급과-조정
  - ../../2-design/modules/payroll/design.md#공휴일-넣기
  - ../../2-design/modules/payroll/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/payroll/README.md#pay-002
  - ../../2-design/modules/payroll/README.md#pay-003
  - ../../2-design/modules/payroll/README.md#pay-004
  - ../../2-design/modules/payroll/README.md#pay-005
  - ../../2-design/modules/payroll/README.md#pay-007
  - ../../2-design/modules/payroll/README.md#pay-008
  - ../../2-design/modules/payroll/README.md#pay-009
  - ../../2-design/modules/payroll/README.md#pay-010
  - ../../2-design/modules/payroll/README.md#pay-011
  - ../../2-design/modules/payroll/README.md#pay-012
  - ../../2-design/modules/payroll/README.md#pay-013
  - ../../2-design/modules/payroll/README.md#pay-014
  - ../../2-design/modules/payroll/README.md#pay-018
  - ../../2-design/modules/payroll/README.md#pay-020
  - ../../2-design/modules/payroll/README.md#pay-021
  - ../../2-design/modules/payroll/README.md#pay-022
  - ../../2-design/modules/payroll/README.md#pay-024
  - ../../2-design/modules/payroll/README.md#pay-027
  - ../../2-design/modules/payroll/README.md#pay-028
  - ../../2-design/modules/schedule/design.md#리허설
  - ../../2-design/system/data-access.md#쓰기-함수
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/data-access.md#읽기-rls-기본값
  - ../../2-design/system/data-access.md#서비스-키-자리
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/data-access.md#이력
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/system/runtime.md#시각-컬럼
---

# 급여 데이터와 계산을 세운다 — 구현 계획

## 입력 명세·기준

정본은 [payroll/design.md](../../2-design/modules/payroll/design.md)의 [소유 데이터](../../2-design/modules/payroll/design.md#소유-데이터)와 [행위별 구현 계약](../../2-design/modules/payroll/design.md#시급과-조정)이다. 업무 규칙은 [README.md](../../2-design/modules/payroll/README.md)의 `PAY-001`~`PAY-028`이고, 공통 규약은 [data-access.md](../../2-design/system/data-access.md)와 [runtime.md](../../2-design/system/runtime.md)다.

표 넷(`wage_rates`·`default_wage_rates`·`adjustments`·`holidays`), 함수 여섯(`set_wage`·`reset_wage_to_default`·`set_default_wage`·`set_adjustment`·`import_holidays`·`set_holiday`), 그리고 **금액을 내는 순수 함수**가 이 task의 산출이다. 화면은 하나도 안 만든다.

선행이 둘이다. [`attendance-data`](attendance-data.md)는 결근 판정을 가졌고([AC-06](attendance-data.md#ac-06)) [`rehearsal`](rehearsal.md)은 리허설 시간을 가졌다. 계산이 그 둘을 다 읽는다.

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **저장된 금액이 없다.** 확정해 잠그는 행이 없어([PAY-020](../../2-design/modules/payroll/README.md#pay-020)) 앱이 매번 다시 계산한다. 이 task가 내는 것은 금액 표가 아니라 순수 함수 하나다. 근무를 고치면 지난주 금액이 따라 바뀌는 것이 규칙이지 버그가 아니다
- **결근을 다시 짜지 않는다.** [`attendance-data`](attendance-data.md#ac-06)가 상태 여섯을 내는 순수 함수를 이미 냈다. 여기서 또 짜면 두 벌이 서고 어긋날 때 어느 쪽이 정본인지가 사라진다. **그 함수를 import해서 쓴다**
- **결근은 조정 표에 음수로 산다.** 「결근」이라는 값을 따로 두지 않는다 — 관리자가 결근을 고르면 화면이 그날 배정 시간만큼의 음수를 `adjustments.minutes`에 넣는다([조정](../../2-design/modules/payroll/design.md#조정)). 합산 뒤 0분이 되어 그날이 급여에서 빠진다
- **리허설은 조정이 아니다.** 주인이 달라 표를 안 섞는다 — 조정은 관리자가 쓰고 리허설은 본인이 쓴다. 계산이 배정·조정·리허설 셋을 더하고 그 하나로 9시간 기준을 본다([PAY-028](../../2-design/modules/payroll/README.md#pay-028))
- **기본 시급이 끈이다.** 승인될 때 한 번 복사되는 첫값이 아니다([PAY-013](../../2-design/modules/payroll/README.md#pay-013)). `set_default_wage`가 따르는 사람 전원에게 같은 날 행을 **한 트랜잭션에** 넣어, 계산은 `wage_rates` 한 표만 읽고 RLS도 한 표에만 건다

지금 코드에는 급여가 하나도 없다. `src/shared/api/error-codes.ts`는 앞선 task가 이미 만들어 두었다.

## 완료 조건

### AC-01

**표 넷.**

- `wage_rates(profile_id uuid not null references public.profiles (id) on delete cascade, effective_date date not null, amount integer not null, follows_default boolean not null, primary key (profile_id, effective_date))`
  - `(profile_id, effective_date)`가 곧 키다 — 같은 날 두 번 바꾸면 덮어쓴다([PAY-011](../../2-design/modules/payroll/README.md#pay-011))
  - `amount`는 원 단위 정수다. `check (amount > 0 and amount <= 100000)`
- `default_wage_rates(effective_date date primary key, amount integer not null check (amount > 0 and amount <= 100000))`
- `adjustments(id uuid primary key default gen_random_uuid(), day_id uuid not null references public.days (id) on delete cascade, profile_id uuid not null references public.profiles (id), minutes integer not null, reason text, adjusted_by uuid not null references public.profiles (id), adjusted_at timestamptz not null default now())`
  - **unique를 안 건다.** 이력이 남고 계산은 마지막 행을 쓴다([조정](../../2-design/modules/payroll/design.md#조정)·[이력](../../2-design/system/data-access.md#이력))
  - `minutes`가 더할 분이다. 연장이면 양수, 결근이면 음수다. **「결근」 열이 없다**
- `holidays(holiday_date date not null, source text not null check (source in ('api', 'manual')), name text, primary key (holiday_date, source))`
  - 키에 `source`가 든다 — 같은 날짜에 `api` 행과 `manual` 행이 같이 설 수 있어야 받기가 손으로 넣은 값을 안 지운다([공휴일](../../2-design/modules/payroll/design.md#공휴일))
- 금액을 저장하는 표가 없다. 확정 표도 없다

### AC-02

**RLS.**

- `wage_rates`는 **본인 행과 관리자만**이다([PAY-018](../../2-design/modules/payroll/README.md#pay-018)). 화면에서 안 그리는 것으로는 직접 질의하는 길이 안 닫힌다
- `default_wage_rates`는 **관리자만**이다
- `adjustments`는 기본값이다 — `is_approved()`면 읽는다. 그날 명단에 서는 값이라 같은 날 배정된 사람들이 서로 본다
- `holidays`도 기본값이다
- 표 넷 다 직접 쓰기 정책이 없다. `insert`·`update`·`delete` 권한을 `authenticated`에서 회수한다

### AC-03

**시급 함수 셋.** 셋 다 `security definer`, `set search_path = ''`, 첫 줄이 `is_admin()`이다.

- `set_wage(p_profile_id uuid, p_amount integer)` — **적용일을 인자로 안 받는다.** 오늘이다([PAY-008](../../2-design/modules/payroll/README.md#pay-008)·[PAY-009](../../2-design/modules/payroll/README.md#pay-009)). `(profile_id, 오늘)`에 `follows_default = false`로 upsert한다
- `reset_wage_to_default(p_profile_id uuid)` — 오늘 날짜에 지금 기본값과 `follows_default = true`로 upsert한다. 되돌린 날부터 다시 끈에 붙는다([PAY-014](../../2-design/modules/payroll/README.md#pay-014))
- `set_default_wage(p_amount integer)` — `default_wage_rates`에 오늘 행을 넣고, **`follows_default = true`인 사람 전원**에게 같은 날 행을 같은 트랜잭션에 넣는다([PAY-013](../../2-design/modules/payroll/README.md#pay-013))
  - 「따르는 사람」 판정은 **각자의 가장 최근 행**이 `follows_default = true`인지다. 지난 행이 아니라 지금 상태를 본다
- 금액이 범위 밖이면 `bad_amount`. 상한 100,000원은 [wages.md](../../2-design/modules/payroll/screens/wages.md)가 화면에 건 값인데 **함수에도 건다** — 0을 하나 더 친 실수가 한 화면 너머에서 막히면 안 된다
- **지난 줄을 고치는 함수가 없다.** 소급하는 길을 안 만든다([PAY-010](../../2-design/modules/payroll/README.md#pay-010))
- 승인 함수가 첫 행(`follows_default = true`)을 넣는다 — [`account-data`](account-data.md)의 승인 함수에 그 줄이 는다. **`wage_rates`가 그 함수보다 늦게 서니 이 task가 그쪽을 고친다**

### AC-04

**조정 함수.**

`set_adjustment(p_day_id uuid, p_profile_id uuid, p_minutes integer, p_reason text)` — `is_admin()`. `adjustments`에 **새 행을 넣는다.** 덮어쓰지 않는다 — 이력이다.

- 그날 그 사람의 살아 있는 배정이 없으면 `not_allowed`. 조정은 배정에 붙는다([PAY-002](../../2-design/modules/payroll/README.md#pay-002))
- 「원래대로」는 `p_minutes = 0`인 새 행이다. 지우지 않는다 — 지우면 이력이 사라진다
- **함수가 결근을 모른다.** 음수를 계산해 넣는 것은 화면이다([`payroll-adjust`](../../backlog.md)). 함수는 분만 받는다
- 확정과 무관하고 지난 날에도 선다([PAY-020](../../2-design/modules/payroll/README.md#pay-020))

### AC-05

**공휴일 함수 둘.**

- `import_holidays(p_year integer, p_rows jsonb)` — **`internal`이다.** 사람이 부르는 자리가 없고 Edge Function이 서비스 키로 온다([서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리))
  - 그 해의 `api` 행을 지우고 새로 넣는다. **`manual` 행은 안 건드린다**
  - `p_rows`가 비었으면 아무것도 안 한다 — 지우고 안 넣는 일이 없어야 한다
- `set_holiday(p_date date, p_on boolean)` — `public`이고 첫 줄이 `is_admin()`이다. 참이면 `manual` 행을 넣고 거짓이면 지운다
  - 같은 날짜에 `api` 행이 이미 있으면 **아무것도 안 한다.** 이미 공휴일이다
- 계산이 `holidays`를 안 읽는다([PAY-024](../../2-design/modules/payroll/README.md#pay-024)). 데이터만 모은다

### AC-06

**금액을 내는 순수 함수.** `src/features/payroll/model`에 산다. **이 task의 가장 어려운 조각이다.**

- 입력은 살아 있는 `assignments`·`days`·`adjustments`·`rehearsals`·`excuse_status`·`wage_rates`다. 출력은 날짜마다의 `{ minutes, amount, kind }`와 기간 합계다
- **날짜를 세 키의 합집합에서 모은다.** `['schedule']`만 훑으면 배정 없이 리허설만 있는 날이 빠진다([행위 밖의 실행 동작](../../2-design/modules/payroll/design.md#행위-밖의-실행-동작))
- 그날 총 분 = **배정 시간 + 조정 분(마지막 행) + 리허설 시간**이다. 배정 시간은 `days.starts_at`~`ends_at`이고 휴게를 안 뺀다([PAY-004](../../2-design/modules/payroll/README.md#pay-004))
- 리허설 시간은 [`rehearsal`](rehearsal.md#ac-04)의 `rehearsalHours`를 import한다. 1건이 1시간이다
- **9시간 기준을 총 분 하나로 본다**([PAY-028](../../2-design/modules/payroll/README.md#pay-028)). 540분까지 1배, 넘는 몫이 1.5배다. 배정 9시간 + 리허설 2건이면 11시간이고 그중 2시간이 가산이다 — 따로 세면 둘 다 9시간 미만이라 가산이 아예 안 난다
- **결근 판정은 [`attendance-data`](attendance-data.md#ac-06)의 함수를 부른다.** 여기서 다시 짜지 않는다. 결근인 날은 조정 음수가 이미 들어 총 분이 0이 되지만, **조정이 안 들어간 결근도 있다** — 관리자가 아직 안 누른 날이다. 그 날은 상태가 결근이라 금액을 0으로 내고 목록에 사실로 선다
- 출근 인정(사유 승인)은 **배정된 시간대로 센다**([PAY-003](../../2-design/modules/payroll/README.md#pay-003))
- 교육 배정도 같은 규칙이다([PAY-007](../../2-design/modules/payroll/README.md#pay-007))
- **그날 시급은 `effective_date <= 그날` 중 가장 늦은 행**이다. 첫 행보다 이른 날은 계산에서 뺀다 — 승인 전 날짜다
- 주는 월요일~일요일이고([PAY-021](../../2-design/modules/payroll/README.md#pay-021)) 월은 달력 달이다([PAY-022](../../2-design/modules/payroll/README.md#pay-022)). **달을 걸친 주는 날마다 갈린다** — 주 단위 합계를 달로 자르지 않고 날짜를 기준으로 담는다

### AC-07

**dal.** 읽기 하나와 쓰기 여섯이다.

- `getPayrollMonth(month)` — 키 `['payroll', 'YYYY-MM']`. `wage_rates`·`adjustments`·`excuse_status`를 그달치로 받는다. 배정과 날은 `['schedule', 'YYYY-MM']`, 리허설은 `['rehearsal', 'YYYY-MM']`이라 **화면이 세 키를 읽어 [AC-06](#ac-06)에 넣는다**
- `wage_rates`는 RLS가 좁혀 근무자에게 자기 행만 온다. 같은 dal이 관리자에게는 전원을 낸다 — 조건을 코드로 안 나눈다
- 쓰기 여섯은 `supabase.rpc()`를 감싼다. `import_holidays`는 클라이언트에서 안 부른다 — dal이 없다
- 성공하면 `['payroll']`을 무효화한다([무효화 표](../../2-design/system/runtime.md#무효화-표))

### AC-08

**오류 코드 목록.** `bad_amount`가 `src/shared/api/error-codes.ts`와 마이그레이션 양쪽에 선다. `not_allowed`는 이미 있다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_payroll.sql` | 표 넷, RLS, 권한 회수 | AC-01·AC-02 |
| `supabase/migrations/<날짜>_payroll_functions.sql` | 함수 여섯 | AC-03~AC-05 |
| `supabase/migrations/<날짜>_approve_wage_row.sql` | 승인 함수에 첫 시급 행 | AC-03 |
| `src/shared/api/error-codes.ts` | `bad_amount` | AC-08 |
| `src/features/payroll/model/*.ts`·`__tests__/` | 금액 계산·9시간 기준·기간 합계 | AC-06 |
| `src/entities/payroll/dals/*.ts`·`__tests__/` | 읽기 하나, 쓰기 여섯 | AC-07 |
| `tests/integration/postgres.ts` | 급여 시드 헬퍼 | 검증 표 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`integration-test-writer` → `implementer` → `pr-diff`. [`attendance-data`](attendance-data.md)와 [`rehearsal`](rehearsal.md)이 둘 다 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-08을 층에 배정한다. **계산은 unit, 함수는 integration이고 겹치지 않는다**
2. `unit-test-writer`가 AC-06의 경계를 먼저 쓴다. 이 task의 위험이 전부 거기 있다 — 9시간 기준, 리허설 합산, 조정 마지막 행, 시급 고르기, 달을 걸친 주
3. `integration-test-writer`가 함수 여섯과 RLS를 쓴다
4. `implementer`가 표·RLS → 시급 함수 → 조정·공휴일 함수 → 계산 → dal 순으로 초록을 만든다. **계산을 마지막에서 두 번째로 둔다** — 앞의 함수들이 시드를 만들어 준다
5. `pr-diff`가 diff를 본다 — 결근 판정이 두 벌 서지 않았는지, `wage_rates`가 남에게 새는 정책이 없는지, 금액을 저장하는 열이 생기지 않았는지
6. `payroll-holidays`·`payroll-wages`·`payroll-view`·`payroll-adjust` 행이 조건을 풀도록 backlog를 고친다

## 리스크·전환·되돌리기

- **계산이 클라이언트에서 돈다.** 시급이 브라우저로 내려간다는 뜻인데, RLS가 자기 행만 주니 근무자에게는 자기 시급만 간다([PAY-018](../../2-design/modules/payroll/README.md#pay-018)). 관리자에게는 전원 시급이 가고 그것이 곧 통계다. **이 구조가 무너지는 자리는 RLS 하나뿐이라 integration이 거기를 본다**
- **`set_default_wage`가 전원에게 행을 넣는다.** 서른 명이면 서른 행이라 지금은 작지만 한 트랜잭션이 커지는 유일한 자리다. 실패하면 통째로 롤백되니 일부만 바뀌는 일은 없다
- **조정 없는 결근과 조정 든 결근이 둘 다 있다.** 관리자가 아직 안 누른 날은 상태가 결근이고 조정이 0이다. 계산이 그 둘을 같은 금액으로 내야 하는데 경로가 달라 어긋나기 쉽다 — [AC-06](#ac-06)이 그 자리를 적었고 unit이 둘을 나란히 본다
- **9시간 기준이 법과 어긋난다.** [PAY-026](../../2-design/modules/payroll/README.md#pay-026)이 어긋난 자리 여섯을 이미 적었다. 알고 정한 것이고 앱이 내는 것은 예상치다 — 코드가 그 규칙을 그대로 구현하고 바로잡지 않는다
- **`holidays`를 아무도 안 읽는다.** 계산이 안 쓰니 이 task 뒤에도 그 표는 죽어 있다([PAY-024](../../2-design/modules/payroll/README.md#pay-024)). 나중에 공휴일 가산을 붙일 때를 위해 데이터만 모은다
- 되돌리기는 `supabase db reset`이다. 배포한 적이 없어 마이그레이션을 고쳐 다시 만든다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-02 | 남의 시급이 보인다 | integration `tests/integration/payroll-rls.test.ts`(예정) | `pnpm test:integration:run` | `wage_rates`는 본인·관리자만, `default_wage_rates`는 관리자만 |
| AC-03 | 같은 날 두 번 바꿔 이력이 둘 선다 | integration `tests/integration/payroll-functions.test.ts`(예정) | 위와 같다 | 행이 하나, 값이 나중 것 |
| AC-03 | 기본을 바꿔도 따르는 사람이 안 바뀐다 | integration 위 | 위와 같다 | 따르는 전원에게 같은 날 행, 개별로 정한 사람은 그대로 |
| AC-03 | 0을 하나 더 친다 | integration 위 | 위와 같다 | 1,200,000원이면 `bad_amount` |
| AC-04 | 조정이 덮어써서 이력이 사라진다 | integration 위 | 위와 같다 | 두 번 부르면 행이 둘, 계산은 마지막 |
| AC-04 | 배정 없는 사람에게 조정이 붙는다 | integration 위 | 위와 같다 | `not_allowed` |
| AC-05 | 받기가 손으로 넣은 임시공휴일을 지운다 | integration 위 | 위와 같다 | 다시 받아도 `manual` 행이 남는다 |
| AC-05 | 빈 목록이 그 해를 비운다 | integration 위 | 위와 같다 | `p_rows`가 비면 기존 `api` 행이 그대로 |
| AC-06 | 리허설이 따로 세어져 연장이 안 난다 | unit `src/features/payroll/model/__tests__/`(예정) | `pnpm test` | 배정 9시간 + 리허설 2건 = 11시간, 2시간이 1.5배 |
| AC-06 | 배정 없는 날의 리허설이 빠진다 | unit 위 | `pnpm test` | 그날 금액이 리허설 시각만큼 난다 |
| AC-06 | 결근 판정이 두 벌이라 어긋난다 | unit 위 | `pnpm test` | 조정 든 결근과 안 든 결근이 같은 금액(0) |
| AC-06 | 그날 시급을 잘못 고른다 | unit 위 | `pnpm test` | 8월 1일에 올리면 7월은 옛 값, 8월 1일부터 새 값 |
| AC-06 | 달을 걸친 주가 한 달에 통째로 든다 | unit 위 | `pnpm test` | 8월 31일 하루만 8월, 9월 1일부터 엿새는 9월 |
| AC-08 | 코드 목록과 마이그레이션이 어긋난다 | unit `tests/lint/error-codes.test.ts` | `pnpm test` | `bad_amount`가 양쪽에 있다 |

- 배정하지 않은 것: 실제 한 달치 데이터로 금액이 관리자의 손 계산과 맞는지 — 첫 달 운영에서 대조한다. 앱이 내는 것이 예상치라 이 대조가 곧 규칙 검증이다
- 막힌 것: 지금은 없다

## 범위 밖

- `/admin/wages` 화면 — [`payroll-wages`](../../backlog.md)
- `/payroll` 화면 — [`payroll-view`](../../backlog.md)
- 날 상세의 임시공휴일 줄과 근무 조정 줄 — [`payroll-adjust`](../../backlog.md)
- pg_cron `fetch_holidays`와 Edge Function `import-holidays` — [`payroll-holidays`](../../backlog.md)
- 통계의 인건비 — 통계 화면의 것이다
- 공휴일 가산 — [PAY-024](../../2-design/modules/payroll/README.md#pay-024)가 1차 밖으로 뺐다
- 타입 생성 — [`types-generation`](../../backlog.md)
