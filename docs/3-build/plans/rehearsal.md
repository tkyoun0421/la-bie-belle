---
sources:
  - ../../2-design/modules/schedule/design.md#소유-데이터
  - ../../2-design/modules/schedule/design.md#자격
  - ../../2-design/modules/schedule/design.md#리허설
  - ../../2-design/modules/schedule/design.md#리허설-넣기고치기지우기
  - ../../2-design/modules/schedule/README.md#sch-020
  - ../../2-design/modules/schedule/README.md#sch-021
  - ../../2-design/modules/schedule/README.md#sch-022
  - ../../2-design/modules/schedule/README.md#sch-023
  - ../../2-design/modules/payroll/README.md#pay-028
  - ../../2-design/modules/schedule/screens/rehearsal.md#달력
  - ../../2-design/modules/schedule/screens/rehearsal.md#날-시트
  - ../../2-design/modules/schedule/screens/rehearsal.md#넣는-중
  - ../../2-design/modules/schedule/screens/rehearsal.md#고치는-중
  - ../../2-design/modules/schedule/screens/rehearsal.md#달력-짜임
  - ../../2-design/modules/schedule/screens/rehearsal.md#달력-칸
  - ../../2-design/modules/schedule/screens/rehearsal.md#날-시트-짜임
  - ../../2-design/modules/schedule/screens/rehearsal.md#넣는-시트-짜임
  - ../../2-design/modules/schedule/screens/rehearsal.md#고치는-시트-짜임
  - ../../2-design/modules/schedule/screens/rehearsal.md#문안
  - ../../2-design/modules/schedule/screens/rehearsal.md#모션
  - ../../2-design/modules/account/screens/profile.md#리허설
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/data-access.md#쓰기-함수
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/data-access.md#읽기-rls-기본값
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/system/runtime.md#경쟁-조건-기본값
---

# 리허설을 만든다 — 구현 계획

> 앱 골격(`expo-scaffold`)이 선 뒤에 파일 배치와 검증 명령을 채운다. 업무 규칙과 완료 조건은 그대로 선다.

## 입력 명세·기준

정본은 [schedule/design.md](../../2-design/modules/schedule/design.md#리허설)의 [리허설](../../2-design/modules/schedule/design.md#리허설)과 [리허설 넣기·고치기·지우기](../../2-design/modules/schedule/design.md#리허설-넣기고치기지우기), 화면은 [rehearsal.md](../../2-design/modules/schedule/screens/rehearsal.md) 전체와 [profile.md](../../2-design/modules/account/screens/profile.md#리허설)의 리허설 줄이다. 업무 규칙은 [SCH-020](../../2-design/modules/schedule/README.md#sch-020)~[SCH-023](../../2-design/modules/schedule/README.md#sch-023)이고 급여 쪽 계약은 [PAY-028](../../2-design/modules/payroll/README.md#pay-028)이다.

표 하나(`rehearsals`), 함수 셋(`add_rehearsal`·`edit_rehearsal`·`remove_rehearsal`), 화면 하나(`/me/rehearsals`), 그리고 「나」에 줄 하나가 이 task의 산출이다.

선행은 [`schedule-data`](schedule-data.md)다. 갈래를 그날 `assignments`로 가르니 그 표가 먼저 서야 한다. **표가 `schedule-data`에 안 들어간 것은 그 plan이 이미 서 있어서다** — 뒤에 생긴 개념이라 앞 plan을 고치는 대신 여기로 왔다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **`days`를 안 가리킨다.** `rehearsals(profile_id, work_date, ...)`가 날짜를 직접 든다. 근무표를 아직 안 만든 달에도, 이미 지난 날에도 행이 선다([SCH-022](../../2-design/modules/schedule/README.md#sch-022)) — `days`를 FK로 걸면 그 둘이 막힌다. 이 하나가 화면을 `/schedule`이 아니라 따로 세운 까닭이기도 하다
- **두 갈래를 한 표가 들고 갈래 열이 없다.** check 제약이 「시각 둘이 있고 `count`가 비었거나, `count`만 있고 시각 둘이 비었거나」를 강제한다. 행이 스스로 말한다
- **갈래를 고르는 것은 저장 함수다.** 화면이 보내온 갈래를 안 믿는다. 날짜를 고른 뒤 저장까지 사이에 관리자가 배정을 넣거나 뺄 수 있어 함수가 다시 판정하고 어긋나면 `wrong_kind`다
- **이미 선 행은 다시 판정하지 않는다.** 배정 없는 날에 시각으로 넣어둔 뒤 관리자가 그날 배정을 넣어도 그 행은 시각 갈래로 남는다. 급여가 갈래와 무관하게 시간만 쓰고([PAY-028](../../2-design/modules/payroll/README.md#pay-028)) 그 시각이 실제로 일한 시각이라 틀린 값이 아니다. **배정이 바뀔 때마다 리허설을 고치는 코드를 쓰지 않는다**

지금 코드에는 리허설이 하나도 없다. `position_grants` 표는 [`schedule-data`](schedule-data.md)가 세우고 `grant_position` 함수는 [`schedule-assign`](schedule-assign.md)이 낸다 — 이 task는 그 `position` 열에 `'리허설'` 값이 도는 길만 낸다.

## 완료 조건

### AC-01

**표 하나.**

- `rehearsals(id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles (id) on delete cascade, work_date date not null, starts_at time, ends_at time, count integer, created_at timestamptz not null default now())`
- **`day_id`가 없다.** `work_date`가 날짜를 직접 든다
- check 제약 하나가 갈래를 강제한다 — `(starts_at is not null and ends_at is not null and count is null) or (count is not null and starts_at is null and ends_at is null)`
- `count`는 1~9다. `ends_at > starts_at`이다([SCH-023](../../2-design/modules/schedule/README.md#sch-023))
- unique index `(profile_id, work_date) where count is not null` — 건수 갈래는 하루 한 줄이다. 시각 갈래에는 안 건다
- 갈래를 적는 열이 없다. 시간을 저장하는 열도 없다 — 건수에서 시간을 내는 것은 계산이고 [AC-04](#ac-04)의 순수 함수가 한다

### AC-02

**RLS와 자격 값.**

- `rehearsals`는 **본인 행과 관리자만** 읽는다([SCH-021](../../2-design/modules/schedule/README.md#sch-021)). `is_approved()`로 여는 기본값을 좁힌다 — 다른 근무자에게는 남의 리허설이 안 보인다
- 직접 쓰기 정책이 없다. `insert`·`update`·`delete` 권한을 `authenticated`에서 회수한다
- `position_grants.position`에 `'리허설'`이 든다. 열에 check가 없어 마이그레이션이 손댈 것이 없고, **자격 확인 헬퍼 `has_rehearsal_grant(p_profile_id uuid)`를 이 task가 낸다** — 함수 셋이 첫 줄에서 부른다
- 자격을 거두어도 이미 선 `rehearsals`는 안 지운다([자격 주기](../../2-design/modules/schedule/design.md#리허설-넣기고치기지우기)의 이웃 절). 지난 급여가 흔들리면 안 된다

### AC-03

**함수 셋.** 셋 다 `security definer`, `set search_path = ''`, 첫 줄이 `is_approved()`와 `has_rehearsal_grant(auth.uid())`다.

- `add_rehearsal(p_work_date date, p_starts_at time, p_ends_at time, p_count integer)`
  - **갈래를 함수가 판정한다.** `p_work_date`에 그 사람의 **살아 있는 정규 배정**이 있으면 건수 갈래, 없으면 시각 갈래다. 교육 배정은 안 센다 — [리허설](../../2-design/modules/schedule/design.md#리허설)이 「정규 배정」이라고 적었다
  - 판정한 갈래와 받은 인자가 어긋나면 `wrong_kind`
  - 시각 갈래인데 같은 날 기존 행과 구간이 겹치면 `overlaps`. **배정된 근무 시간과는 안 견준다**
  - 건수 갈래인데 그날 행이 이미 있으면 `already_exists`. unique 위반(SQLSTATE `23505`)도 같은 코드로 바꿔 던진다
- `edit_rehearsal(p_id uuid, p_starts_at time, p_ends_at time, p_count integer)`
  - 남의 행이면 `not_allowed`. 관리자에게도 남의 행을 쓰는 길이 없다
  - **갈래를 다시 판정하지 않는다.** 그 행이 이미 든 갈래 안에서만 값을 고친다 — 시각 행은 시각을, 건수 행은 건수를. 다른 갈래 인자가 오면 `wrong_kind`
  - 겹침 검사는 자기 자신을 뺀 나머지와 한다
- `remove_rehearsal(p_id uuid)` — 남의 행이면 `not_allowed`. 지운다
- 오류 코드 넷이 새로 선다 — `not_qualified`·`wrong_kind`·`overlaps`·`already_exists`. `not_allowed`는 이미 있다

### AC-04

**순수 함수.** `src/features/rehearsal/model`에 산다.

- `rehearsalHours(row)` — 건수 갈래면 `count * 60`분, 시각 갈래면 `ends_at - starts_at`. **1건이 1시간이다**([SCH-023](../../2-design/modules/schedule/README.md#sch-023))
- `dayTotal(rows)` · `monthTotal(rows)` — 날 합계와 달 합계. 달력 칸과 달 줄과 날 시트가 같은 함수를 쓴다
- `kindForDate(date, assignments)` — 화면이 시트를 열기 전에 입력 모양을 고르는 판정이다. **함수와 같은 규칙을 두 벌 짜는 자리라 이 하나만 TS에 두고 SQL 쪽은 [AC-03](#ac-03)이 정본이다** — 어긋나면 저장이 `wrong_kind`로 걸리고 화면이 [AC-07](#ac-07)의 알림 한 줄로 다시 받는다. 두 벌이 서는 것을 막을 길이 없어 **어긋났을 때 사용자가 막히지 않는 것**으로 대신한다
- `canAddOn(date, rows, kind)` — 건수 갈래인 날에 줄이 이미 하나면 거짓이다. 날 시트의 「리허설 넣기」가 이 값으로 사라진다

### AC-05

**dal.** 읽기 둘, 쓰기 셋이다.

- `getMyRehearsals(month)` — 키 `['rehearsal', 'YYYY-MM']`. 본인 행만이고 RLS가 이미 좁혀 별도 조건이 없다
- `getAllRehearsals(month)` — 키 `['rehearsal', 'YYYY-MM', 'all']`. 관리자만 부르고 `profiles(display_name)`를 임베딩한다 — 날 시트가 줄마다 이름을 붙인다
- 쓰기 셋은 `supabase.rpc()`를 감싸고 오류를 `DomainError`/`TransportError`로 가른다([오류의 모양](../../2-design/system/data-access.md#오류의-모양))
- 성공하면 `['rehearsal']`과 `['payroll']`을 무효화한다([무효화 표](../../2-design/system/runtime.md#무효화-표)). **`['schedule']`은 안 건드린다** — 리허설이 그 키에 안 실린다

### AC-06

**달력.** [달력 짜임](../../2-design/modules/schedule/screens/rehearsal.md#달력-짜임)과 [달력 칸](../../2-design/modules/schedule/screens/rehearsal.md#달력-칸)이 정본이다.

- 앱바 → 달 줄(달과 그달 합계) → 월 달력 → 범례 한 줄이다. **바닥에 고정 버튼이 없다**
- **모든 날이 눌린다.** 근무표 달력과 달리 못 누르는 칸이 없다 — 아무 날짜에나 선다([SCH-022](../../2-design/modules/schedule/README.md#sch-022))
- 칸 아래 단이 **건수가 아니라 시간**이다. 리허설이 있는 날은 배경이 `bg.neutral-weak`고 「2시간」이 선다
- 읽는 중에는 **바닥 단과 합계만 빈다.** 스켈레톤이 없다 — 달력 뼈대는 날짜만으로 이미 서 있다
- 못 읽으면 달력 아래 한 줄과 Button ghost 「다시 시도」다
- 달 오가기는 [schedule-worker](schedule-worker.md)의 달 고르기 시트를 같이 쓴다. `?month=`가 경로에 든다([navigation.md](../../2-design/system/navigation.md#경로))
- 관리자는 같은 달력이고 칸의 수가 전원 것이다

### AC-07

**시트 셋과 Dialog 하나.**

- **날 시트** — 제목(날짜), 줄 하나씩, 그날 합계, 「리허설 넣기」다. 빈 날은 [components.md](../../2-design/design-system/components.md#빈-상태)의 빈 상태 한 줄이다
- **건수 갈래인 날에 줄이 이미 있으면 「리허설 넣기」가 사라진다**([AC-04](#ac-04)의 `canAddOn`). 그 줄을 눌러 고친다
- **넣는 시트가 날 시트 위에 겹쳐 선다.** 날짜 칸이 없다 — 달력에서 이미 골랐다. 시각 갈래면 칸 둘, 건수 갈래면 칸 하나다
- `wrong_kind`가 오면 알림 한 줄이 서고 **칸만 바뀐다.** 고른 날짜는 그대로다
- `overlaps`는 칸 아래 문구 한 줄이고 넣던 값이 남는다. 저장 실패도 값이 남는다
- **고치는 시트**는 값이 든 채 같은 칸들이고 아래에 「지우기」 한 줄이다. 지우기는 시트 위에 Dialog 하나를 세운다
- 문안과 모션은 [문안](../../2-design/modules/schedule/screens/rehearsal.md#문안)과 [모션](../../2-design/modules/schedule/screens/rehearsal.md#모션) 표 그대로다
- 관리자는 줄마다 이름이 앞에 붙고 **「리허설 넣기」가 없고 줄이 안 눌린다**

### AC-08

**문과 가드.**

- `/me`의 「리허설」 줄이 선다 — 자격이 있는 사람과 관리자에게만이다([profile.md](../../2-design/modules/account/screens/profile.md#리허설)). 자격이 없으면 줄 자체가 없다
- `/me/rehearsals`는 자격이 있는 사람과 관리자만 연다. 다른 사람이 주소를 직접 치면 `/me`로 보낸다 — **`/admin` 밖의 유일한 조건부 경로다**([navigation.md](../../2-design/system/navigation.md#경로))
- 뒤로는 `/me`다. 탭 바가 없다

### AC-09

**오류 코드 목록.** `not_qualified`·`wrong_kind`·`overlaps`·`already_exists`가 `src/shared/api/error-codes.ts`와 마이그레이션 양쪽에 선다. `tests/lint/error-codes.test.ts`가 둘을 맞춘다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_rehearsals.sql` | 표, check, unique index, RLS, 권한 회수 | AC-01·AC-02 |
| `supabase/migrations/<날짜>_rehearsal_functions.sql` | `has_rehearsal_grant`와 함수 셋 | AC-02·AC-03 |
| `src/shared/api/error-codes.ts` | 코드 넷 | AC-09 |
| `src/features/rehearsal/model/*.ts`·`__tests__/` | 시간 환산·합계·갈래 판정·넣기 가능 | AC-04 |
| `src/entities/rehearsal/dals/*.ts`·`__tests__/` | 읽기 둘, 쓰기 셋, 무효화 | AC-05 |
| `src/screens/rehearsal/ui/*.tsx` · `/me/rehearsals/` 화면 | 달력·시트 셋·Dialog·가드 | AC-06~AC-08 |
| `src/screens/profile/ui/*.tsx` | 「리허설」 줄 | AC-08 |
| `rehearsal` e2e | e2e | 검증 표 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`integration-test-writer`·`e2e-test-writer` → `implementer` → `pr-diff`. [`schedule-data`](schedule-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-09를 층에 배정한다. **갈래 판정은 두 층에 다 선다** — SQL 쪽은 정본이라 integration, TS 쪽은 화면 입력 모양이라 unit이고, 같은 판정을 두 벌 짜는 것이 이 task가 안고 가는 것이다
2. `integration-test-writer`가 함수 셋을 먼저 쓴다. 이 task의 위험이 갈래 판정과 겹침에 있다
3. `unit-test-writer`가 AC-04의 경계를 쓴다
4. `implementer`가 표·RLS → 함수 → 순수 함수 → dal → 달력 → 시트 순으로 초록을 만든다
5. `e2e-test-writer`가 넣고 고치고 지우는 한 바퀴를 쓴다
6. `pr-diff`가 diff를 본다 — 남의 리허설이 새는 정책이 없는지, `days`를 FK로 거는 줄이 없는지, 배정이 바뀔 때 리허설을 고치는 코드가 없는지
7. `payroll-data` 행이 `rehearsal` 조건을 풀도록 backlog를 고친다

## 리스크·전환·되돌리기

- **리허설 자격을 주는 화면이 정본에 없다.** [자격](../../2-design/modules/schedule/design.md#자격)이 「관리자가 직접 준 행이 유일한 길」이라 정했는데 그 행을 만드는 화면이 어디에도 안 그려져 있다 — 사람 픽커의 「자격도 주기」는 포지션 배정 맥락이라 리허설에 안 맞다. **아래 [검증 방법](#검증-방법)의 「막힌 것」에 있고 이 task를 시작하기 전에 닫아야 한다**
- **갈래 판정이 두 벌이다.** SQL과 TS에 같은 규칙이 선다. `open_slots` 뷰가 「계산의 예외」로 한 벌만 둔 것과 반대 선택인데, 화면이 시트를 열기 전에 입력 모양을 정해야 해서 어느 쪽도 안 지울 수 있다. [AC-04](#ac-04)가 SQL을 정본으로 못 박았고 어긋나면 `wrong_kind`가 사용자를 안 막고 받아낸다
- **`work_date`가 `days`를 안 가리켜 참조 무결성이 없다.** 근무표에 없는 날짜에도 행이 선다 — 그것이 규칙이라 제약으로 막을 것이 아니다. 대신 날짜 범위를 함수가 안 본다는 뜻이기도 하다. 2030년에 넣는 것을 막는 줄이 없고, 1차에서 그것을 막지 않는다
- **관리자가 남의 리허설을 못 고친다.** 잘못 넣은 것을 관리자가 지워달라는 요구가 올 수 있는데 1차에 그 길이 없다 — 본인에게 지우게 한다
- 되돌리기는 `supabase db reset`이다. 배포한 적이 없어 마이그레이션을 고쳐 다시 만든다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 두 갈래가 한 행에 섞인다 | integration `tests/integration/rehearsal.test.ts`(예정) | `pnpm test:integration:run` | 시각과 건수를 같이 넣으면 check 위반 |
| AC-01 | 건수 갈래가 하루에 둘 선다 | integration 위 | 위와 같다 | unique index 위반, 시각 갈래는 여럿 선다 |
| AC-02 | 남의 리허설이 보인다 | integration `tests/integration/rehearsal-rls.test.ts`(예정) | 위와 같다 | 다른 근무자에게 0행, 관리자에게 전원 |
| AC-02 | 자격 없이 넣는다 | integration 위 | 위와 같다 | `not_qualified` |
| AC-03 | 화면이 보낸 갈래를 믿는다 | integration 위 | 위와 같다 | 배정 있는 날에 시각을 보내면 `wrong_kind` |
| AC-03 | 시각이 겹친다 | integration 위 | 위와 같다 | `overlaps`. 배정 시간과는 안 견준다 |
| AC-03 | 고치기가 갈래를 바꾼다 | integration 위 | 위와 같다 | 시각 행에 건수를 보내면 `wrong_kind` |
| AC-03 | 남의 행을 고친다·지운다 | integration 위 | 위와 같다 | 관리자가 불러도 `not_allowed` |
| AC-04 | 1건이 1시간이 아니다 | unit `src/features/rehearsal/model/__tests__/`(예정) | `pnpm test` | 3건이 3시간, 14:00–16:00이 2시간 |
| AC-04 | 건수 갈래인 날에 넣기 버튼이 남는다 | unit 위 | `pnpm test` | 줄이 하나면 `canAddOn`이 거짓 |
| AC-06 | 못 누르는 칸이 생긴다 | e2e `rehearsal` e2e(예정) | e2e 명령 | 근무표에 없는 달의 아무 날이나 눌린다 |
| AC-07 | 갈래가 바뀌면 고른 날짜가 날아간다 | e2e 위 | 위와 같다 | 알림 한 줄, 날짜 그대로, 칸만 바뀜 |
| AC-08 | 자격 없는 사람이 주소로 들어온다 | e2e 위 | 위와 같다 | `/me`로 보낸다. 「나」에 줄이 없다 |
| AC-09 | 코드 목록과 마이그레이션이 어긋난다 | unit `tests/lint/error-codes.test.ts` | `pnpm test` | 넷이 양쪽에 있다 |

- 배정하지 않은 것: 관리자가 전원 리허설을 달력에서 훑는 실사용 — 서른 명치가 한 칸에 겹칠 때 읽히는지는 실기기에서 손으로 본다
- 막힌 것: **리허설 자격을 주는 화면이 없다.** `position_grants`에 `'리허설'` 행을 넣는 자리가 정본 어디에도 안 그려져 있어 이 task만으로는 아무도 자격을 못 받는다. 화면을 정하는 것이 선행이고, 정해지기 전에는 SQL 콘솔로 행을 넣어 테스트한다

## 범위 밖

- 리허설 자격을 주는 화면 — 위 「막힌 것」이다. 정해지면 그 task의 몫이다
- 급여에 리허설 시간을 더하는 계산 — [`payroll-data`](../../backlog.md)
- 날 상세 조정 시트의 리허설 읽기 전용 줄 — [`payroll-adjust`](../../backlog.md)
- `grant_position`·`revoke_position` 함수 — [`schedule-assign`](schedule-assign.md)
- 알림 — 리허설에 알림이 없다([SCH-020](../../2-design/modules/schedule/README.md#sch-020))
- 타입 생성 — [`types-generation`](../../backlog.md)
