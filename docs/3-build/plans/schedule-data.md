---
sources:
  - ../../2-design/modules/schedule/design.md#소유-데이터
  - ../../2-design/modules/schedule/design.md#달
  - ../../2-design/modules/schedule/design.md#날과-자리
  - ../../2-design/modules/schedule/design.md#배정
  - ../../2-design/modules/schedule/design.md#자격
  - ../../2-design/modules/schedule/design.md#근무-신청
  - ../../2-design/modules/schedule/design.md#요청
  - ../../2-design/modules/schedule/design.md#근무-취소
  - ../../2-design/modules/schedule/design.md#계산의-예외-하나
  - ../../2-design/modules/schedule/design.md#근무표-만들기와-마감일
  - ../../2-design/modules/schedule/design.md#날-열기닫기
  - ../../2-design/modules/schedule/design.md#홀-기본값
  - ../../2-design/modules/schedule/README.md#sch-001
  - ../../2-design/modules/schedule/README.md#sch-002
  - ../../2-design/modules/schedule/README.md#sch-003
  - ../../2-design/modules/schedule/README.md#sch-004
  - ../../2-design/modules/schedule/README.md#sch-005
  - ../../2-design/modules/schedule/README.md#sch-007
  - ../../2-design/modules/schedule/README.md#sch-008
  - ../../2-design/modules/schedule/README.md#sch-009
  - ../../2-design/modules/schedule/README.md#sch-010
  - ../../2-design/modules/schedule/README.md#sch-011
  - ../../2-design/modules/schedule/README.md#sch-012
  - ../../2-design/modules/schedule/README.md#sch-013
  - ../../2-design/modules/schedule/README.md#sch-015
  - ../../2-design/modules/account/README.md#acc-010
  - ../../2-design/system/data-access.md#홀
  - ../../2-design/system/data-access.md#컬럼-이름-규칙
  - ../../2-design/system/data-access.md#이력
  - ../../2-design/system/data-access.md#쓰기-함수
  - ../../2-design/system/data-access.md#이름과-자리
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/data-access.md#읽기-rls-기본값
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/data-access.md#생성-타입
  - ../../2-design/system/runtime.md#업무-상수
---

# 근무표 데이터 구조를 세운다 — 구현 계획

## 입력 명세·기준

정본은 [design.md](../../2-design/modules/schedule/design.md#소유-데이터)의 소유 데이터와 [행위별 구현 계약](../../2-design/modules/schedule/design.md#행위별-구현-계약)이다. 업무 규칙은 [README.md](../../2-design/modules/schedule/README.md#업무-규칙)의 `SCH-001`~`SCH-019`에 있다. 공통 규약은 [data-access.md](../../2-design/system/data-access.md) — 컬럼 이름, 이력을 닫고 새로 만드는 법, 쓰기가 함수인 이유, `public`과 `internal`의 갈림, 함수 안의 규칙, 읽기 RLS 기본값, 오류 코드다.

저장소에 근무표 표가 하나도 없다. 이 task가 표 아홉과 뷰 하나를 처음 세운다.

**함수는 이 task가 다 만들지 않는다.** 표는 FK가 서로를 가리켜 한 번에 서야 하지만 함수는 행위 묶음이라 화면 task가 자기 것을 가져간다. 여기서 만드는 것은 근무표의 뼈대를 세우는 일곱이다 — `create_schedule`·`set_application_deadline`·`confirm_schedule`·`open_day`·`close_day`·`set_day_hours`·`set_hall_defaults`. 자리와 배정은 [`schedule-assign`](../../backlog.md), 근무 신청은 [`schedule-worker`](../../backlog.md), 요청과 취소는 [`schedule-requests`](../../backlog.md)가 자기 함수를 자기 테스트와 같이 낸다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **달은 계산하지 않는다.** `schedules.month`가 그 달 1일의 `date`이고 unique다([달](../../2-design/modules/schedule/design.md#달)). 범위를 재는 코드가 없고, 날을 여는 함수가 `date_trunc('month', work_date)`로 행을 찾거나 만든다. 캐시 키 `['schedule', 'YYYY-MM']`과 URL `?month=`와 급여 월 조회가 같은 달력 달을 가리킨다
- **자리는 날을 열 때 미리 만든다.** `open_day`가 `days` 행 하나와 자리 기본값만큼 `slots` 행을 같이 세운다([날과 자리](../../2-design/modules/schedule/design.md#날과-자리)). 기본값은 `halls.default_slots`에서 읽는다 — 아홉 포지션 열한 명이 [SCH-011](../../2-design/modules/schedule/README.md#sch-011)의 값이고 홀 표가 그것을 든다
- **확정 전과 뒤가 다르다.** 확정 전에 배정을 빼면 행을 지우고, 확정 뒤에는 `ended_at`을 찍는다([배정](../../2-design/modules/schedule/design.md#배정)). 함수가 `schedules.confirmed_at`을 보고 가른다. 이 task의 `close_day`가 그 갈림의 첫 사용자다 — [SCH-004](../../2-design/modules/schedule/README.md#sch-004)가 확정 전에만 닫을 수 있다고 정했으니 여기서는 지우는 쪽만 만든다
- **빈 자리만 SQL이다.** [계산의 예외 하나](../../2-design/modules/schedule/design.md#계산의-예외-하나)가 `open_slots` 뷰(`security_invoker`)를 두라고 정했다. pg_cron과 관리자 화면이 같은 뷰를 읽어 규칙이 두 벌 서지 않게 한다. 나머지 상태(자격·빈 자리 밖의 판정)는 저장도 뷰도 아니고 TypeScript다

지금 코드에는 근무표가 하나도 없다. 마이그레이션은 `supabase/migrations/20260825162027_profiles.sql` 하나뿐이고 거기 `profiles`·`profile_private` 표와 `is_approved`·`is_admin`·`ensure_profile`·`submit_profile`·`update_my_photo`·`approve_member`·`reject_member` 함수, 정책 셋(`profiles_select`·`profile_private_select`·`profile_private_update_own`)이 있다. 직접 쓰기를 막는 모양도 거기 있다 — `revoke all ... from anon, authenticated` 뒤에 필요한 `grant select`만 되돌리는 꼴이고 이 task가 같은 꼴을 쓴다. `is_admin()`은 `role = 'admin'`만 보고 `left_at`·`blocked_at`을 안 본다 — 좁히는 것은 `members-pending`의 몫이라 이 task는 건드리지 않는다. `halls`·`schedules` 아래 아홉과 `open_slots`는 저장소 어디에도 없다. `src/shared/api/` 디렉터리가 없어 `error-codes.ts`도 `database.types.ts`도 없고, `package.json`에 `types` 스크립트가 없다. `tests/integration/postgres.ts`에는 `createApprovedUser`·`createAdminUser`·`createBlockedUser`·`createLeftUser`가 있고 근무표 시드 헬퍼가 없다. `supabase/config.toml`에 pg_cron 설정이 없다 — 배치는 [`schedule-requests`](../../backlog.md)가 처음 필요로 한다.

확인한 코드와 Git 기준점 — `supabase/migrations/20260825162027_profiles.sql`·`tests/integration/postgres.ts`가 `61c5d68`(#363).

## 완료 조건

### AC-01

**근무표와 날.**

- `schedules(id uuid primary key default gen_random_uuid(), month date not null unique, application_deadline date, confirmed_at timestamptz, created_by uuid not null references public.profiles (id), created_at timestamptz not null default now())`
- `month`에 `check (month = date_trunc('month', month)::date)`를 건다. 그 달 1일만 들어온다 — 범위 계산이 없는 근거가 이 제약이다
- `days(id uuid primary key default gen_random_uuid(), schedule_id uuid not null references public.schedules (id) on delete cascade, work_date date not null unique, starts_at time not null, ends_at time not null, ceremony_at time, opened_at timestamptz not null default now(), opened_by uuid not null references public.profiles (id))`
- `work_date`가 unique다 — 날 하나가 근무표 하나에만 든다. `schedule_id`와 `work_date`의 연월이 어긋나지 않게 `check`를 걸 수 없으니(다른 표의 값이다) `open_day`가 `date_trunc`로 찾아 넣는 것이 유일한 길이고, AC-09의 테스트가 그 불변을 본다
- 안 연 날은 `days` 행이 없다. 「비활성」을 저장하는 열을 두지 않는다

### AC-02

**자리와 배정.**

- `slots(id uuid primary key default gen_random_uuid(), day_id uuid not null references public.days (id) on delete cascade, positions text[] not null, ended_at timestamptz, ended_by uuid references public.profiles (id), created_at timestamptz not null default now())`
- `positions`에 `check (cardinality(positions) >= 1)`. 겸임은 원소 둘 이상인 행 하나다([SCH-015](../../2-design/modules/schedule/README.md#sch-015)). `array_length`가 아닌 것은 빈 배열에서 그것이 `null`을 내 check가 통과해서다 — `cardinality`는 0을 낸다
- `assignments(id uuid primary key default gen_random_uuid(), day_id uuid not null references public.days (id) on delete cascade, slot_id uuid references public.slots (id) on delete cascade, position text not null, profile_id uuid not null references public.profiles (id), kind text not null check (kind in ('regular', 'training')), started_at timestamptz not null default now(), ended_at timestamptz, ended_reason text, ended_by uuid references public.profiles (id))`
- `check ((kind = 'regular' and slot_id is not null) or (kind = 'training' and slot_id is null))` — 정규는 자리를 먹고 교육은 안 먹는다([SCH-012](../../2-design/modules/schedule/README.md#sch-012))
- unique index 둘이다. `(slot_id) where ended_at is null and kind = 'regular'`가 자리당 사람 하나, `(day_id, profile_id) where ended_at is null and kind = 'regular'`가 한 사람이 같은 날 두 자리를 못 맡게 한다. 겸임은 자리 하나라 둘째에 안 걸린다
- 교육 배정은 둘 다 안 걸린다 — `slot_id`가 없고 `kind`가 다르다. 같은 날 정규와 교육을 같이 받는 것이 막히지 않는다

### AC-03

**자격·신청·요청·취소.**

- `position_grants(id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles (id) on delete cascade, position text not null, granted_by uuid not null references public.profiles (id), granted_at timestamptz not null default now())`. `(profile_id, position)` unique — 같은 자격을 두 번 저장하지 않는다
- `availabilities(id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles (id) on delete cascade, work_date date not null, created_at timestamptz not null default now())`. `(profile_id, work_date)` unique. `days`를 안 가리킨다 — 접수는 근무표를 만드는 순간 열리고 날 열기는 그 뒤라 아직 없는 날짜에 신청이 선다([근무 신청](../../2-design/modules/schedule/design.md#근무-신청))
- `requests(id uuid primary key default gen_random_uuid(), kind text not null check (kind in ('work', 'swap')), slot_id uuid references public.slots (id) on delete cascade, assignment_id uuid references public.assignments (id) on delete cascade, requested_by uuid not null references public.profiles (id), expires_at timestamptz not null, closed_at timestamptz, approved_candidate_id uuid, created_at timestamptz not null default now())`
- `check ((kind = 'work' and slot_id is not null) or (kind = 'swap' and assignment_id is not null))`
- `request_candidates(id uuid primary key default gen_random_uuid(), request_id uuid not null references public.requests (id) on delete cascade, profile_id uuid not null references public.profiles (id) on delete cascade, status text not null check (status in ('pending', 'accepted', 'declined')), responded_at timestamptz, expires_at timestamptz not null)`. `(request_id, profile_id)` unique
- `requests.approved_candidate_id`에 FK를 걸지 않는다 — `request_candidates`가 `requests`를 가리키는 순환이라 한쪽을 끊는다. 진짜 FK는 `request_candidates.request_id`고 design.md가 그렇게 정했다([요청](../../2-design/modules/schedule/design.md#요청))
- `request_candidates.status`가 저장소에서 유일한 상태 열이다. [컬럼 이름 규칙](../../2-design/system/data-access.md#컬럼-이름-규칙)이 그 예외를 명시했고, 수락 취소가 답 안 한 상태로 되돌려 시각으로 못 나타내는 것이 이유다
- `cancel_requests(id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments (id) on delete cascade, profile_id uuid not null references public.profiles (id) on delete cascade, reason text not null, created_at timestamptz not null default now(), decided_at timestamptz, decided_by uuid references public.profiles (id), decision text check (decision in ('approved', 'rejected')), decision_reason text)`. 거절되면 새 행이라 unique를 안 건다

### AC-04

**뷰.**

- `open_slots`가 `security_invoker = true`로 선다. 살아 있는 자리(`slots.ended_at is null`) 중 살아 있는 정규 배정이 없는 것을 낸다
- 뷰가 `day_id`·`work_date`·`slot_id`·`positions`를 낸다 — pg_cron의 빈자리 재촉이 날짜를 알아야 하고 관리자 화면이 자리를 그려야 한다
- `security_invoker`라 부르는 사람의 RLS가 걸린다. 근무자가 읽어도 자기가 볼 수 있는 날의 빈 자리만 나온다

### AC-05

**RLS.**

- 기본은 「승인된 사람 전원 읽기」다([읽기 RLS 기본값](../../2-design/system/data-access.md#읽기-rls-기본값)). `schedules`·`days`·`slots`·`assignments`·`position_grants`·`requests`·`request_candidates`가 `is_approved()`로 읽힌다
- 좁히는 표 둘이다. `availabilities`와 `cancel_requests`는 본인 행(`profile_id`가 자기 프로필)이거나 `is_admin()`이다 — design.md의 읽기 RLS 표가 정한 것이고, 누가 어느 날 쉬는지와 왜 못 나오는지는 남이 볼 것이 아니다
- 표 아홉 전부 직접 쓰기 정책이 없다. `insert`·`update`·`delete` 권한을 `authenticated`에서 회수한다 — 바꾸는 길은 함수뿐이다
- 퇴사자는 근무표를 아예 못 읽는다. `is_approved()`가 `left_at`을 보아 거짓이 되는 것이 그 장치고, 자기 지난 기록을 여는 길은 급여 영역이 따로 낸다
- **그런데 `is_approved()`가 `left_at`을 안 봤다.** `20260825162027_profiles.sql`이 `approved_at is not null and blocked_at is null`만 보는데 [읽기 RLS 기본값](../../2-design/system/data-access.md#읽기-rls-기본값)은 「둘 다 `left_at`·`blocked_at`이 비어 있어야 참이다」로 정했다. 계약과 어긋나 이 task가 그 파일을 고친다 — 배포한 적이 없어 마이그레이션을 고쳐 다시 만드는 것이 되돌리기다. `create or replace`를 다른 파일에 얹으면 정의가 두 벌 서고 어느 쪽이 사는지 읽는 사람이 모른다
- `is_admin()`은 여전히 `role = 'admin'`만 본다. 같은 계약이 그것도 좁히라고 하지만 퇴사·차단까지 보게 만드는 것은 [`members-pending`](../../backlog.md)의 몫이다

### AC-06

**근무표 만들기와 마감일.**

`public` 스키마, `security definer`, `set search_path = ''`, 첫 줄이 `is_admin()` 검사다.

- `create_schedule(p_month date, p_deadline date)` — [SCH-001](../../2-design/modules/schedule/README.md#sch-001)·[SCH-005](../../2-design/modules/schedule/README.md#sch-005). `schedules` 행을 만들고 마감일을 같이 정한다. 그 달 행이 이미 있으면 `already_exists`. 마감일이 오늘 이전이면 `deadline_past`
- [SCH-002](../../2-design/modules/schedule/README.md#sch-002)의 「열 수 있는 날이 하루라도 남아야 한다」는 그 달의 마지막 날이 오늘 이후인지로 본다. 아니면 `month_over`
- `set_application_deadline(p_month date, p_deadline date)` — [SCH-007](../../2-design/modules/schedule/README.md#sch-007). 오늘 이전으로는 못 간다(`deadline_past`). 확정된 달이면 `already_confirmed`
- `confirm_schedule(p_month date)` — [SCH-008](../../2-design/modules/schedule/README.md#sch-008)·[SCH-009](../../2-design/modules/schedule/README.md#sch-009). 마감일이 안 지났으면 `too_early`. 이미 확정이면 `already_confirmed`. `confirmed_at`을 찍는다. 되돌리는 함수를 만들지 않는다 — 규칙이 되돌릴 수 없다고 정했다
- 빈 자리인 채로 확정된다([SCH-014](../../2-design/modules/schedule/README.md#sch-014)) — 확정이 자리를 검사하지 않는다
- `set_application_deadline`과 `confirm_schedule`이 그 달 행을 못 찾으면 `no_schedule`이다. 새 코드를 안 만든다 — `open_day`가 쓰는 것과 같은 뜻이라 목록이 늘지 않는다

### AC-07

**날 열기·닫기.**

- `open_day(p_work_date date)` — [SCH-003](../../2-design/modules/schedule/README.md#sch-003). `date_trunc('month', p_work_date)`로 `schedules` 행을 찾고 없으면 `no_schedule`. `days` 행 하나와 `halls.default_slots`만큼 `slots` 행을 같이 넣는다. 근무 시간도 홀 기본값(`default_starts`·`default_ends`)이다. 이미 열린 날이면 `already_open`
- 지난 날짜면 `date_past`. [SCH-002](../../2-design/modules/schedule/README.md#sch-002)가 「이미 지난 날짜는 열 수 없다」고 정했고 판정 표가 거부로 든다. 오늘은 열린다 — 경계가 「오늘부터」다. 오늘을 재는 것은 `(now() at time zone 'Asia/Seoul')::date`다
- `close_day(p_work_date date)` — [SCH-004](../../2-design/modules/schedule/README.md#sch-004). 확정 전에만 닫힌다(`already_confirmed`). `days` 행을 지우면 `slots`·`assignments`가 cascade로 같이 간다 — 규칙이 「배정이 같이 사라진다」고 한 그것이다. 그 자리에 걸린 `requests`도 cascade로 따라 사라진다 — `closed_at`을 안 찍는다([요청](../../2-design/modules/schedule/design.md#요청))
- `set_day_hours(p_work_date date, p_starts time, p_ends time, p_ceremony time)` — 그 날의 시각을 바꾼다. 안 연 날이면 `not_open`. 끝이 시작보다 이르면 `bad_hours`
- `close_day`도 안 연 날이면 `not_open`이다. 같은 뜻이라 새 코드를 안 만든다
- 셋 다 자리 기본값 열한 명을 SQL 리터럴로 들지 않는다. `halls.default_slots`를 읽는 것이 곧 [SCH-011](../../2-design/modules/schedule/README.md#sch-011)의 값을 한 곳에서 쓰는 길이다

### AC-08

**홀 기본값.**

- `halls` 표가 아직 없으면 이 task가 만든다 — [data-access.md](../../2-design/system/data-access.md#홀)가 `halls(id, lat, lng, radius_m, default_slots jsonb, default_starts, default_ends)`로 정했고 공유 표다. 좌표·반경은 전원이 읽는다
- 씨앗 행 하나가 든다. `default_slots`가 [SCH-011](../../2-design/modules/schedule/README.md#sch-011)의 아홉 포지션 열한 명이고 모양은 배열이다 — `[{"positions": ["팀장"], "count": 1}, …]`([홀](../../2-design/system/data-access.md#홀)). 표의 줄 순서가 배열 순서고 그 배열이 포지션 표시 순서의 정본이다. 좌표는 가짜 값이고 실제 값은 운영 DB에만 산다
- `slots`에 순번 열을 두지 않는다. `open_day`가 깐 행의 순서를 단언하지 않는다 — `ORDER BY` 없는 select의 순서는 Postgres가 보장하지 않는다. 테스트가 보는 것은 열한 행의 포지션별 개수다
- `set_hall_defaults(p_slots jsonb, p_starts time, p_ends time)` — 관리자만. 자리·근무 시간 기본값을 바꾼다. 이미 연 날에는 소급하지 않는다 — `open_day`가 읽는 값이 바뀔 뿐이다
- 좌표·반경을 바꾸는 함수는 출근 인증 영역이 낸다. 이 task는 자리와 시간만 건드린다

### AC-09

**integration 테스트.**

[ADR-003](../../2-design/adr/ADR-003-supabase-and-integration-tests.md)이 정책을 고치는 PR은 그 정책의 테스트를 같이 내라고 했고, [쓰기 함수](../../2-design/system/data-access.md#쓰기-함수)가 함수 PR은 호출자 검사의 테스트를 같이 내라고 했다.

- RLS — 승인된 근무자가 `schedules`·`days`·`slots`·`assignments`를 읽는다. 승인 전과 퇴사자는 빈 결과다. `availabilities`와 `cancel_requests`는 남의 행이 안 보이고 관리자에게는 보인다
- 직접 쓰기 — 근무자가 `assignments`에 `insert`를 시도하면 막힌다. 관리자도 막힌다
- 호출자 검사 — 근무자가 `create_schedule`·`confirm_schedule`·`open_day`·`close_day`·`set_day_hours`·`set_hall_defaults`를 부르면 `not_allowed`
- 달 — `create_schedule`이 그 달 1일이 아닌 `month`를 받으면 제약에 걸린다. `open_day`가 `date_trunc`로 맞는 근무표를 찾는다. 달을 걸친 날짜 둘(8월 31일과 9월 1일)이 서로 다른 `schedules` 행에 붙는다
- 확정 — 마감 전 `confirm_schedule`이 `too_early`. 마감 뒤에는 통과하고 `confirmed_at`이 찍힌다. 확정 뒤 `close_day`가 `already_confirmed`
- 날 열기 — `open_day` 한 번에 `days` 하나와 `slots` 열한 개가 선다. 두 번 부르면 `already_open`. 어제를 열면 `date_past`고 오늘은 열린다. `close_day`가 `days`를 지우면 `slots`가 같이 사라지고, 그 자리에 걸린 `requests`도 없어진다
- unique index — 같은 자리에 정규 배정 둘을 넣으면 둘째가 막힌다. 같은 날 같은 사람에게 정규 자리 둘을 주면 막힌다. 교육 배정은 둘 다 안 걸린다. 배정은 아직 함수가 없으니 이 테스트만 직접 `insert`를 쓴다 — `service_role`로 넣어 제약만 본다
- 뷰 — 자리를 열고 배정을 안 넣으면 `open_slots`에 뜬다. 정규 배정을 넣으면 사라진다. 교육 배정만 넣으면 그대로 뜬다

### AC-10

**오류 코드 목록.**

- 이 task가 던지는 코드를 `src/shared/api/error-codes.ts`에 더한다 — `already_exists`·`deadline_past`·`date_past`·`month_over`·`already_confirmed`·`too_early`·`no_schedule`·`already_open`·`not_open`·`bad_hours`·`not_allowed`
- 파일이 내는 이름은 `ERROR_CODES` 하나고 문자열 리터럴 배열이다([오류의 모양](../../2-design/system/data-access.md#오류의-모양))
- 대조 테스트가 마이그레이션의 `raise ... using message =` 문자열과 그 목록을 맞춘다. **양방향이라 목록은 마이그레이션 전체의 합집합이다** — 위 열하나에 `profiles`가 던지는 `already_submitted`·`already_approved`가 더해져 열셋이다
- 그 파일과 대조 테스트는 `profile-form`의 AC-01·AC-11이 세운다. **먼저 merge된 쪽이 만들고 뒤가 얹는다** — 이 task와 `profile-form`은 선행이 갈려 순서가 안 정해졌다. 이 task가 먼저면 여기서 파일과 `tests/lint/error-codes.test.ts`를 세우고, `DomainError`·`TransportError`는 만들지 않는다. 화면이 없어 던진 코드를 받는 쪽이 아직 없고, 오류 기계는 그 plan의 몫이다

타입 생성(`pnpm types`·`database.types.ts`)은 이 task가 하지 않는다 — [`types-generation`](../../backlog.md)이 절차를 세우는 task고 지금 저장소에 그 스크립트가 없다.

### AC-11

**`mark_leave`의 남은 배정 검사를 잇는다.** `members`이 「`assignments` 표가 서는 마이그레이션이 이 함수를 `create or replace`로 고쳐 검사를 넣는다」고 예고한 자리다. [ACC-010](../../2-design/modules/account/README.md#acc-010)이 DB에서 지켜지는 유일한 문이라 잊으면 근무표가 선 뒤로 규칙이 비어 있다.

- `mark_leave`가 살아 있는 `assignments`(`ended_at is null`) 중 `days.work_date`가 `(now() at time zone 'Asia/Seoul')::date`보다 뒤인 행이 있으면 `has_future_assignments`를 던진다. 교육 배정도 센다 — 그날 나와야 하는 것은 같다
- `error-codes.ts`에 `has_future_assignments`가 든다
- integration이 본다 — 앞 배정이 있는 사람은 퇴사 처리가 막히고, 지난 날짜 배정만 있으면 통과하고, `ended_at`이 찍힌 배정은 안 센다
- **`members` task가 이 task보다 뒤면 여기서 안 한다.** 그때는 `mark_leave` 자체가 아직 없다 — 그 task가 함수를 만들 때 검사를 처음부터 넣고, 이 AC는 그 plan의 AC-11이 삼킨다. 어느 쪽이 먼저든 `assignments`가 선 뒤 `mark_leave`가 검사를 든 상태로 main에 있어야 한다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_halls.sql` | 홀 표와 씨앗 행. 공유 표라 근무표보다 앞이다 | AC-08 |
| `supabase/migrations/<날짜>_schedule.sql` | 표 아홉, 제약, 인덱스, `open_slots` 뷰, RLS, 권한 회수 | AC-01~AC-05 |
| `supabase/migrations/<날짜>_schedule_functions.sql` | 함수 일곱. [이름과 자리](../../2-design/system/data-access.md#이름과-자리)가 도메인마다 파일 하나로 정했다 | AC-06~AC-08 |
| `src/shared/api/error-codes.ts` | 코드 열하나 | AC-10 |
| `src/entities/schedule/dals/__tests__/schedule-rls.integration.test.ts` | RLS와 직접 쓰기 | AC-05·AC-09 |
| `src/entities/schedule/dals/__tests__/schedule-functions.integration.test.ts` | 호출자 검사·달·확정·날 열기 | AC-06~AC-09 |
| `src/entities/schedule/dals/__tests__/schedule-constraints.integration.test.ts` | 제약·unique index와 뷰 | AC-02~AC-04·AC-09 |
| `tests/integration/postgres.ts` | 범용 `execSql`과 `backdateDeadline` | AC-09 |
| `tests/lint/error-codes.ts`·`tests/lint/error-codes.test.ts` | 코드 대조 | AC-10 |

integration 테스트가 `tests/integration/`이 아니라 `src/` 아래인 것은 `jest.integration.config.js`의 `testMatch`가 `<rootDir>/src/**/__tests__/**/*.integration.test.ts`만 잡아서다 — `tests/integration/`에 두면 `No tests found`다. 기존 profile 테스트 열도 같은 자리에 있고 `tests/integration/`에는 헬퍼만 산다.

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `integration-test-writer` → `implementer` → `pr-diff`. 화면이 없어 unit은 오류 코드 대조 하나뿐이고 e2e는 없다.

1. `error-codes.ts`와 `tests/lint/error-codes.test.ts`의 상태를 본다. `profile-form`이 merge됐으면 그 파일에 코드를 더하고, 아니면 여기서 세운다([AC-10](#ac-10))
2. `test-planner`가 AC-01~AC-08·AC-11을 층에 배정한다. 제약·RLS·함수는 전부 integration이고, 코드 목록만 unit이다
3. `integration-test-writer`가 실패 테스트를 쓴다. 로컬 Supabase가 떠 있어야 실패를 확인한다 — 표가 없어 `relation ... does not exist`로 빨간 것이 첫 빨강이다
4. `implementer`가 순서대로 초록을 만든다
   1. `halls` 마이그레이션과 씨앗 행. 근무표가 `default_slots`를 읽으니 먼저다
   2. 표 아홉을 한 파일에 세운다. FK가 서로를 가리켜 순서가 있다 — `schedules` → `days` → `slots` → `assignments` → 나머지
   3. 제약과 unique index. 여기까지에서 `supabase db reset`이 통과해야 한다
   4. `open_slots` 뷰
   5. RLS와 권한 회수. `tests/integration/schedule-rls.test.ts`가 여기서 초록이 된다
   6. 함수 일곱. 하나씩 만들고 그 테스트를 붙인다 — `create_schedule` → `set_application_deadline` → `confirm_schedule` → `open_day` → `close_day` → `set_day_hours` → `set_hall_defaults`
   7. `mark_leave` 검사([AC-11](#ac-11))와 오류 코드 목록
5. `pr-diff`가 diff를 본다 — 씨앗 행에 진짜 좌표가 없는지, 마이그레이션이 `profiles` 쪽을 건드리지 않았는지
6. `schedule-admin`·`schedule-assign`·`schedule-worker`·`schedule-requests` 행이 `ready`로 올라오게 backlog를 고친다

## 리스크·전환·되돌리기

- **`days.work_date`와 `schedules.month`가 어긋날 수 있다.** 다른 표의 값이라 check 제약으로 못 묶는다. `open_day`가 `date_trunc`로 찾아 넣는 것이 유일한 방벽이고, 그 함수를 우회해 넣는 길은 RLS가 막는다. AC-09의 달 테스트가 그 불변을 본다
- **`requests.approved_candidate_id`에 FK가 없다.** 순환을 끊느라 뺀 것이라 그 열이 없는 후보를 가리킬 수 있다. 요청을 닫는 함수가 `request_candidates`에서 고른 값을 넣는 것이 지키는 길이고, 그 함수는 [`schedule-requests`](../../backlog.md)가 만든다 — 이 task는 열만 세운다
- **씨앗 좌표가 가짜다.** 공개 저장소라 실제 홀 좌표를 커밋하지 않는다. 출근 인증이 그 값을 쓰기 전에 운영 DB에서 갈아 끼워야 하고, 그것은 출근 인증 task의 전환 항목이다
- **`mark_leave` 검사를 놓치기 쉽다.** 이 task의 산출에 화면이 없어 `assignments`를 쓰는 코드가 하나도 없고, 그래서 [ACC-010](../../2-design/modules/account/README.md#acc-010)이 비어 있어도 아무것도 빨갛지 않다. [AC-11](#ac-11)이 그 자리고 `pr-diff`가 `mark_leave`의 존재와 검사를 같이 본다
- **`error-codes.ts`를 두 브랜치가 만든다.** `profile-form`과 이 task가 같은 파일을 세울 수 있다. 뒤에 merge되는 쪽이 충돌을 푼다 — 코드는 합집합이라 지우는 것이 없다
- 되돌리기는 `supabase db reset`이다. 배포한 적이 없어 마이그레이션을 고쳐 다시 만든다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01·AC-02·AC-03 | 표가 안 서거나 FK 순서가 어긋난다 | `supabase db reset` | 로컬 Supabase | 마이그레이션 셋이 오류 없이 돈다 |
| AC-02 | 한 자리에 둘이 들어간다, 한 사람이 같은 날 두 자리를 맡는다, 교육이 자리를 먹는다 | integration `tests/integration/schedule-constraints.test.ts`(예정) | `pnpm test:integration:run` | 정규 둘째가 막히고 교육은 안 막힌다 |
| AC-04 | 배정이 찬 자리가 빈 자리로 뜬다, 교육만 든 자리가 안 뜬다 | integration 위 파일 | 위와 같다 | 정규가 들면 사라지고 교육만이면 남는다 |
| AC-05 | 남의 근무 신청·취소 사유가 샌다, 표를 직접 쓴다 | integration `tests/integration/schedule-rls.test.ts`(예정) | 위와 같다 | 근무자에게 남의 `availabilities`·`cancel_requests`가 0행, `insert`가 막힌다 |
| AC-06·AC-07·AC-08 | 근무자가 관리자 함수를 부른다, 마감 전 확정이 통과한다, 확정 뒤 날이 닫힌다 | integration `tests/integration/schedule-functions.test.ts`(예정) | 위와 같다 | `not_allowed`·`too_early`·`already_confirmed` |
| AC-07 | 날이 엉뚱한 달에 붙는다, 자리가 안 깔린다, 지난 날짜가 열린다 | integration 위 파일 | 위와 같다 | 8월 31일과 9월 1일이 다른 `schedules`, `open_day` 한 번에 `slots` 열한 개, 어제는 `date_past`고 오늘은 열린다 |
| AC-10 | 코드 목록과 마이그레이션이 어긋난다 | unit `tests/lint/error-codes.test.ts` | `pnpm test` | 코드 열이 양쪽에 있다 |
| AC-11 | 앞 배정이 남은 사람이 퇴사 처리된다 | integration `tests/integration/schedule-functions.test.ts`(예정) | `pnpm test:integration:run` | `has_future_assignments`, 지난 배정·끝난 배정은 통과 |
| 전체 | — | — | `pnpm lint`·`pnpm format:check`·`pnpm typecheck` | 초록 |

- 배정하지 않은 것: `open_slots`가 pg_cron 쪽에서 읽히는 모습 — `expire_requests`와 빈 자리 재촉은 [`schedule-requests`](../../backlog.md)와 알림 영역의 것이라 여기서는 뷰의 결과만 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 자리와 배정의 함수 여덟(`add_slot`·`remove_slot`·`merge_slots`·`split_slot`·`add_assignment`·`remove_assignment`·`force_change`·`grant_position`) — [`schedule-assign`](../../backlog.md)
- `submit_availability` — [`schedule-worker`](../../backlog.md)
- `send_work_request`·`respond_request`·`create_cancel_request`·`decide_cancel_request`와 `expire_requests` cron — [`schedule-requests`](../../backlog.md)
- 화면은 하나도 안 만든다. 이 task의 산출은 마이그레이션과 테스트다
- 홀 좌표·반경을 바꾸는 함수와 `hall_secrets` — 출근 인증 영역
- 교대 쪽 `requests` 사용과 `approve_swap`·`create_swap_request` — swap 영역
- 타입 생성 절차 — [`types-generation`](../../backlog.md)
- pg_cron 설정과 `expire_requests`·빈 자리 재촉 — [`schedule-requests`](../../backlog.md)와 알림 영역
- `is_admin()`을 퇴사·차단까지 보게 좁히기 — [`members-pending`](../../backlog.md)
- `DomainError`·`TransportError` — `profile-form`
