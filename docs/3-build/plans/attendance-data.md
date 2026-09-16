---
sources:
  - ../../2-design/modules/attendance/design.md#소유-데이터
  - ../../2-design/modules/attendance/design.md#인증과-사유는-그날-그-사람에-붙인다
  - ../../2-design/modules/attendance/design.md#사유
  - ../../2-design/modules/attendance/design.md#상태는-계산한다
  - ../../2-design/modules/attendance/design.md#qr
  - ../../2-design/modules/attendance/design.md#출근-인증
  - ../../2-design/modules/attendance/design.md#사유-제출과-판정
  - ../../2-design/modules/attendance/design.md#홀-좌표와-반경
  - ../../2-design/modules/attendance/design.md#qr-바꾸기
  - ../../2-design/modules/attendance/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/attendance/README.md#att-001
  - ../../2-design/modules/attendance/README.md#att-002
  - ../../2-design/modules/attendance/README.md#att-003
  - ../../2-design/modules/attendance/README.md#att-004
  - ../../2-design/modules/attendance/README.md#att-005
  - ../../2-design/modules/attendance/README.md#att-008
  - ../../2-design/modules/attendance/README.md#att-009
  - ../../2-design/modules/attendance/README.md#att-010
  - ../../2-design/modules/attendance/README.md#att-011
  - ../../2-design/modules/attendance/README.md#att-012
  - ../../2-design/modules/attendance/README.md#att-013
  - ../../2-design/modules/attendance/README.md#att-014
  - ../../2-design/modules/attendance/README.md#att-015
  - ../../2-design/modules/attendance/README.md#att-016
  - ../../2-design/modules/attendance/README.md#att-017
  - ../../2-design/modules/attendance/README.md#att-018
  - ../../2-design/modules/attendance/README.md#att-020
  - ../../2-design/modules/attendance/README.md#att-027
  - ../../2-design/system/data-access.md#홀
  - ../../2-design/system/data-access.md#컬럼-이름-규칙
  - ../../2-design/system/data-access.md#쓰기-함수
  - ../../2-design/system/data-access.md#이름과-자리
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/data-access.md#읽기-rls-기본값
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/runtime.md#서버-시각
  - ../../2-design/system/runtime.md#시각-컬럼
  - ../../2-design/system/runtime.md#재시도
  - ../../2-design/system/runtime.md#무효화-표
---

# 출근 인증 데이터 구조를 세운다 — 구현 계획

## 입력 명세·기준

정본은 [attendance/design.md](../../2-design/modules/attendance/design.md)의 [소유 데이터](../../2-design/modules/attendance/design.md#소유-데이터)와 [행위별 구현 계약](../../2-design/modules/attendance/design.md#출근-인증)이다. 업무 규칙은 [README.md](../../2-design/modules/attendance/README.md)의 `ATT-001`~`ATT-027`이고, 공통 규약은 [data-access.md](../../2-design/system/data-access.md)와 [runtime.md](../../2-design/system/runtime.md)다.

표 셋(`check_ins`·`excuses`·`hall_secrets`)과 뷰 하나(`excuse_status`), 함수 다섯(`check_in`·`submit_excuse`·`decide_excuse`·`rotate_qr`·`set_hall_location`), 그리고 **상태를 내는 순수 함수**가 이 task의 산출이다. 화면은 하나도 안 만든다.

선행은 [`schedule-data`](schedule-data.md)다. `check_ins.day_id`와 `excuses.day_id`가 `days`를 가리키고, 인증 함수가 「그날 살아 있는 배정이 있나」를 `assignments`에서 본다.

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **시각이 셋이다.** `checked_at`(판정에 쓴 시각)·`reported_at`(기기가 누른 시각)·`received_at`(서버에 닿은 시각). [출근 인증](../../2-design/modules/attendance/design.md#출근-인증)이 「지하에서 09:58에 눌렀는데 10:04에 닿아도 정시다」로 그 셋을 갈랐다. **`check_in`은 「인자로 시각을 받지 않는다」의 유일한 예외**([함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙))고, 기기 값이라 한도를 건다 — `now()`보다 10분 넘게 이르면 `now()`, `now()`보다 늦어도 `now()`
- **상태를 저장하지 않는다.** 출근·지각·안 찍음·확인 중·인정·결근 여섯은 `check_ins`·`excuse_status`·`days.starts_at`·서버 시각으로 **그때 계산한다**([상태는 계산한다](../../2-design/modules/attendance/design.md#상태는-계산한다)). 결근을 찍는 배치가 없다 — 시계가 지나면 저절로 결근이다. 이 task가 그 순수 함수를 만들고 화면 task들이 가져다 쓴다
- **글과 판정이 갈린다.** `excuses.body`는 본인과 관리자만 읽는다([ATT-018](../../2-design/modules/attendance/README.md#att-018)). 그런데 명단이 「확인 중·인정·결근」을 그리려면 판정 결과가 전원에게 필요하다 — `excuse_status` 뷰(`security_invoker`)가 글만 빼고 `(day_id, profile_id, decided_at, decision)`을 낸다
- **QR 값이 따로 산다.** `hall_secrets`를 `halls`와 가른 이유는 읽기 범위다 — 좌표·반경은 전원이 읽지만 QR 값은 관리자만이다. 같은 행에 있으면 근무자가 값을 읽어 **스캔 없이 인증 함수에 넣는다**([QR](../../2-design/modules/attendance/design.md#qr))
- **인증은 되돌릴 수 없다.** 행을 고치는 함수가 없다. 잘못 찍힌 것을 지우는 길도 안 만든다 — [ATT-009](../../2-design/modules/attendance/README.md#att-009)가 한 번 찍으면 버튼이 사라진다고 정했고, 되돌리는 문을 열면 그 규칙이 무너진다

지금 코드에는 출근 인증이 하나도 없다. `halls` 표는 [`schedule-data`](schedule-data.md)가 세우고 이 task가 `hall_secrets`를 그 옆에 더한다. `src/shared/api/error-codes.ts`는 [`profile-form`](profile-form.md)이나 [`schedule-data`](schedule-data.md) 중 먼저 merge된 쪽이 만든다.

## 완료 조건

### AC-01

**표 셋.**

- `check_ins(id uuid primary key default gen_random_uuid(), day_id uuid not null references public.days (id) on delete cascade, profile_id uuid not null references public.profiles (id), checked_at timestamptz not null, reported_at timestamptz not null, received_at timestamptz not null, method text not null check (method in ('location', 'qr')))`
- `unique (day_id, profile_id)` — 한 사람이 그날 한 번이다. 재시도가 두 번 닿으면 둘째가 여기 걸린다
- `excuses(id uuid primary key default gen_random_uuid(), day_id uuid not null references public.days (id) on delete cascade, profile_id uuid not null references public.profiles (id), body text not null, submitted_at timestamptz not null default now(), decided_at timestamptz, decided_by uuid references public.profiles (id), decision text check (decision in ('approved', 'rejected')), decision_reason text)`
  - **unique를 안 건다.** 거절되면 새 행이다([사유](../../2-design/modules/attendance/design.md#사유)·[ATT-013](../../2-design/modules/attendance/README.md#att-013)). 근무 취소 요청과 같은 꼴이다
- `hall_secrets(hall_id uuid primary key references public.halls (id) on delete cascade, qr_code text not null, rotated_at timestamptz not null default now())`
  - `qr_code`가 unique다 — 우연히 같은 값이 두 홀에 서지 않게
- 상태 열이 없다. 출근·지각·결근은 어디에도 저장하지 않는다

### AC-02

**뷰와 RLS.**

- `excuse_status`가 `security_invoker = true`로 선다. `(day_id, profile_id, submitted_at, decided_at, decision)`을 낸다 — **`body`와 `decision_reason`을 안 낸다**
- `check_ins`는 기본값이다 — `is_approved()`면 읽는다([ATT-016](../../2-design/modules/attendance/README.md#att-016)이 같은 날 배정된 사람들이 서로 본다고 정했고, 실제 좁히기는 화면이 그날 명단만 그리는 것으로 난다)
- `excuses`는 **본인 행과 관리자만**이다. 전원이 보는 것은 뷰다
- `hall_secrets`는 **관리자만**이다
- 표 셋 다 직접 쓰기 정책이 없다. `insert`·`update`·`delete` 권한을 `authenticated`에서 회수한다
- 뷰에 `security_invoker`를 쓰니 `excuses`의 RLS가 그대로 걸린다 — **그러면 전원이 못 읽는다.** 뷰는 `security_definer`로 두고 함수처럼 다뤄야 하는데, [계산의 예외](../../2-design/modules/schedule/design.md#계산의-예외-하나)가 `open_slots`를 `security_invoker`로 정한 것과 갈린다. **이 뷰만 `security_definer`다** — 낼 열에서 글을 이미 뺐으니 정의자 권한으로 읽어도 새는 것이 없고, `security_invoker`로 두면 뷰가 존재할 이유 자체가 사라진다. [AC-09](#ac-09)의 integration이 「근무자가 남의 판정은 보고 남의 글은 못 본다」를 본다

### AC-03

**`check_in` — 이 task의 가장 어려운 함수.** `security definer`, `set search_path = ''`, 첫 줄이 `is_approved()`.

`check_in(p_day_id uuid, p_reported_at timestamptz, p_method text, p_lat double precision, p_lng double precision, p_qr_code text)`

- **그날 살아 있는 배정이 없으면 `not_allowed`.** `assignments`에서 `ended_at is null`인 행을 본다. 교육 배정도 센다([ATT-020](../../2-design/modules/attendance/README.md#att-020))
- **인증 창 검사** — 근무 시작 1시간 전부터 오후 6시까지다([ATT-008](../../2-design/modules/attendance/README.md#att-008)). 밖이면 `window_closed`. 이 검사는 `now()`로 한다 — 창은 서버 시각이 정한다
- **`checked_at` 산출** — `p_reported_at`을 쓰되 한도를 건다. `p_reported_at < now() - interval '10 minutes'`면 `now()`, `p_reported_at > now()`면 `now()`, 그 사이면 `p_reported_at` 그대로다. 10분은 재시도 1분과 화면 잠금 뒤 재개를 덮는 폭이다
- **`method = 'location'`이면** `halls`의 좌표에서 `radius_m` 안인지 본다. 밖이면 `too_far`. **거리 계산을 함수가 한다** — 화면의 판정을 안 믿는다([ATT-002](../../2-design/modules/attendance/README.md#att-002))
- **`method = 'qr'`이면** `hall_secrets.qr_code`와 대조한다. 다르면 `invalid_qr`. 옛 코드는 덮여 사라졌으니 자동으로 걸린다([ATT-005](../../2-design/modules/attendance/README.md#att-005))
- **이미 찍혀 있으면 `already_done`.** 검사에서 잡거나, 검사와 삽입 사이에 낀 unique 위반(SQLSTATE `23505`)을 함수가 잡아 같은 코드로 던진다 — **재시도가 두 번 닿는 자리라 둘 다 필요하다**
- `received_at = now()`를 같이 넣는다. `received_at`과 `reported_at`이 5분 넘게 다르면 명단이 「통신 지연」을 그린다([ATT-017](../../2-design/modules/attendance/README.md#att-017)) — 그 판정은 화면이 하고 함수는 값만 남긴다
- 좌표를 저장하지 않는다. 판정에만 쓰고 버린다 — 남길 이유가 없고 남기면 지워야 할 것이 는다

### AC-04

**사유 함수 둘.**

- `submit_excuse(p_day_id uuid, p_body text)` — `is_approved()`. 그날 자기 배정이 없으면 `not_allowed`
  - **근무 끝 48시간이 지나면 `window_closed`**([ATT-011](../../2-design/modules/attendance/README.md#att-011)). 근무 끝은 `days.ends_at`이다
  - 이미 찍혀 있으면 `already_done` — 찍은 사람이 사유를 낼 이유가 없다
  - 살아 있는 사유(`decided_at is null`)가 있으면 `already_requested`. **거절된 사유가 있는 것은 막지 않는다** — 다시 내는 길이 규칙이다([ATT-013](../../2-design/modules/attendance/README.md#att-013))
  - 글이 다듬어 빈 문자열이거나 200자를 넘으면 `invalid_reason`. 화면이 먼저 막지만 함수가 마지막 문이다
  - **고치는 함수가 없다**([ATT-012](../../2-design/modules/attendance/README.md#att-012))
- `decide_excuse(p_excuse_id uuid, p_approved boolean, p_reason text)` — `is_admin()`
  - 이미 판정됐으면 `already_decided`
  - **시한이 없다**([ATT-015](../../2-design/modules/attendance/README.md#att-015)) — 근무 끝 48시간이 지난 사유도 판정한다
  - 거절이면 `decision_reason`이 필수다 — 비면 `invalid_reason`. 그 글이 근무자에게 그대로 간다
  - **거절이 결근을 확정하지 않는다**([ATT-014](../../2-design/modules/attendance/README.md#att-014)). 판정 행만 남고 결근은 계산이 낸다

### AC-05

**QR과 홀 함수 둘.** 둘 다 `is_admin()`.

- `rotate_qr()` — 새 코드를 만들어 `hall_secrets.qr_code`를 **덮는다**. `rotated_at = now()`. 옛 값이 사라지니 즉시 폐기다([ATT-005](../../2-design/modules/attendance/README.md#att-005))
  - 코드는 추측하기 어려운 값이다 — `encode(gen_random_bytes(16), 'hex')` 꼴. **근무자에게 알림이 안 간다**([ATT-006](../../2-design/modules/attendance/README.md#att-006))
  - 이 함수가 `hall_secrets` 행을 만들기도 한다 — 처음 부르면 `insert`, 뒤에는 `update`
- `set_hall_location(p_lat double precision, p_lng double precision, p_radius_m integer)` — `halls`의 좌표·반경을 고친다
  - 반경이 0 이하면 `bad_radius`. 위도·경도가 범위 밖이면 같은 코드
  - **화면이 1차에 없다**([qr.md](../../2-design/modules/attendance/screens/qr.md#안-담은-것)). 함수만 세우고 부르는 곳은 SQL 콘솔이다 — 그 사실을 [리스크](#리스크전환되돌리기)에 적는다

### AC-06

**상태를 내는 순수 함수.** `src/features/attendance/model/`. 저장소에서 이 계산이 **한 곳에만 있어야 한다** — 명단·대시보드·근태 집계가 같은 함수를 부른다.

여섯을 가른다.

| 상태 | 언제 |
| --- | --- |
| 안 찍음 | 인증 창이 열렸는데 `check_ins` 행이 없고 사유도 없다. 창이 아직이면 상태 자체가 없다 |
| 출근 | `checked_at`이 근무 시작 시각 이전이거나 같다 |
| 지각 | `checked_at`이 근무 시작 시각보다 뒤다 |
| 확인 중 | `check_ins`가 없고 살아 있는 사유가 있다(`decided_at is null`) |
| 출근 인정 | 사유가 승인됐다 |
| 결근 | `check_ins`가 없고, 인증 창이 닫혔고, 승인된 사유가 없다. 거절된 사유가 있어도 결근이고, 사유를 낼 48시간이 남아 있으면 아직 결근이 아니다 |

- **입력이 전부 인자다.** `check_ins` 행·`excuse_status` 행·`days.starts_at`·`days.ends_at`·지금 시각. 함수 안에서 `Date.now()`를 안 부른다 — 테스트가 시각을 넣어 경계를 본다
- 「통신 지연」 판정도 여기다 — `received_at`과 `reported_at`이 5분 넘게 다르면 참이다
- 현황 줄의 셈도 여기다 — 「11명 중 9명 출근 · 지각 1 · 아직 1」에서 **0인 항목을 뺀다**([schedule-worker.md](../../2-design/modules/schedule/screens/schedule-worker.md#인증-상태))
- 근태 월 집계도 같은 함수를 돌려 센다([ATT-023](../../2-design/modules/attendance/README.md#att-023)) — **출근 인정은 출근과 따로 센다**([ATT-026](../../2-design/modules/attendance/README.md#att-026))

전부 unit 테스트가 든다. **경계가 이 task의 위험이라 테스트가 두껍다** — 근무 시작 정각, 인증 창 양 끝, 48시간 경계, 거절된 사유가 있는 날.

### AC-07

**dal.** `src/entities/attendance/dals/`.

- 읽기 — `get-day-attendance.ts`(`['attendance', 'YYYY-MM-DD']`, 그날 `check_ins`와 `excuse_status`), `get-my-excuses.ts`(`['excuses', 'YYYY-MM']`, 본인 사유 목록), `get-qr-code.ts`(`['hall', 'qr']`, **`staleTime`이 0이고 영속하지 않는다** — 관리자가 돌리면 옛 값이 `invalid_qr`이다)
- 쓰기 — `check-in.ts`·`submit-excuse.ts`·`decide-excuse.ts`·`rotate-qr.ts`·`set-hall-location.ts`
- **`check_in`만 재시도한다.** [재시도](../../2-design/system/runtime.md#재시도)의 「쓰기를 재시도하지 않는다」의 유일한 예외다 — `TransportError`면 지수 백오프로 다섯 번 더, 2·4·8·16·32초로 합쳐 1분쯤이다. `retryDelay`를 명시한다. **큐에 넣지 않는다**
- 화면 잠금이나 앱 전환으로 iOS가 타이머를 멈추면 돌아올 때 이어 돈다 — **끊지 않는다**

### AC-08

**오류 코드.** `src/shared/api/error-codes.ts`에 더한다 — `too_far`·`invalid_qr`·`bad_radius`. `window_closed`·`already_done`·`not_allowed`·`invalid_reason`·`already_requested`·`already_decided`는 앞 task들이 이미 넣었다. 대조 테스트가 마이그레이션의 `raise` 문자열과 맞춘다.

### AC-09

**테스트.**

- unit: AC-06 전부. 특히 경계 — 근무 시작 정각에 찍으면 출근이고 1초 뒤면 지각, 인증 창이 열리기 전에는 상태가 없고 닫힌 뒤 48시간 안에는 결근이 아니며 그 뒤에는 결근, 거절된 사유가 있어도 결근, 승인된 사유는 출근 인정이고 출근으로 안 센다. 통신 지연 5분 경계. 현황 줄의 0 제외. 쓰기 dal의 오류 가르기와 `check_in`의 재시도 횟수·간격
- integration: 함수 다섯의 호출자 검사. `check_in`의 배정 없음·창 밖·반경 밖·옛 코드·중복. **`checked_at` 한도** — 10분 넘게 이른 값을 보내면 `now()`로 눌리고, 미래 값도 `now()`로 눌리고, 그 사이는 그대로 산다. **unique 위반이 `already_done`으로 올라오는 것**(두 번 연속 호출). `submit_excuse`의 48시간 경계와 이미 찍힌 날과 살아 있는 사유 중복과 거절 뒤 재제출. `decide_excuse`의 시한 없음과 거절 이유 필수. `rotate_qr`이 옛 코드를 죽이는 것(돌린 뒤 옛 값으로 `check_in`하면 `invalid_qr`). **RLS** — 근무자가 남의 `excuses.body`를 못 읽고 `excuse_status`로는 판정을 읽는다, `hall_secrets`를 근무자가 못 읽는다, 표 셋에 직접 쓰기가 막힌다
- 시드 헬퍼를 `tests/integration/postgres.ts`에 더한다 — 인증 창이 열린 날, 창이 닫힌 날, 근무 끝 48시간이 지난 날

### AC-10

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run` 전부 초록. e2e는 없다 — 화면이 없다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_attendance.sql` | 표 셋, 뷰, RLS, 권한 회수 | AC-01·AC-02 |
| `supabase/migrations/<날짜>_attendance_functions.sql` | 함수 다섯 | AC-03~AC-05 |
| `src/shared/api/error-codes.ts` | `too_far`·`invalid_qr`·`bad_radius` | AC-08 |
| `src/features/attendance/model/*.ts`·`__tests__/` | 상태 여섯·통신 지연·현황 셈·월 집계 | AC-06 |
| `src/entities/attendance/dals/*.ts`·`__tests__/` | 읽기 셋, 쓰기 다섯, `check_in` 재시도 | AC-07 |
| `tests/integration/postgres.ts` | 인증 시드 헬퍼 | AC-09 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`integration-test-writer` → `implementer` → `pr-diff`. [`schedule-data`](schedule-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-08을 층에 배정한다. **상태 계산은 unit, 함수는 integration이고 겹치지 않는다** — 같은 판정을 두 층이 각자 다시 짜면 둘이 어긋날 때 어느 쪽이 정본인지가 사라진다
2. `unit-test-writer`가 AC-06의 경계를 먼저 쓴다. 이 task의 위험이 거기 있다
3. `integration-test-writer`가 함수 다섯을 쓴다
4. `implementer`가 표·뷰·RLS → 함수 → 상태 함수 → dal 순으로 초록을 만든다. `check_in`을 마지막 함수로 둔다 — 셋 중 가장 복잡하다
5. `pr-diff`가 diff를 본다 — `hall_secrets`가 근무자에게 새는 정책이 없는지, 좌표가 저장되지 않는지, 인증을 고치는 함수가 없는지
6. `attendance-qr`·`attendance-checkin`·`attendance-excuse` 행이 `ready`로 올라오게 backlog를 고친다

## 리스크·전환·되돌리기

- **`excuse_status`가 `security_definer`다.** 저장소에서 `open_slots`와 반대 결정이라 뒤에 오는 사람이 실수로 통일할 수 있다. [AC-02](#ac-02)가 근거를 적었고 integration이 「남의 판정은 보이고 남의 글은 안 보인다」를 못 박는다 — 그 테스트가 이 결정의 방벽이다
- **`checked_at` 한도가 기기 값을 믿는 폭이다.** 10분 안에서는 기기가 보낸 시각이 그대로 판정에 쓰인다. 시계를 10분 당긴 기기는 10분 늦게 찍어도 정시다. [ATT-017](../../2-design/modules/attendance/README.md#att-017)이 그 폭을 알고 정한 것이고 [ATT-027](../../2-design/modules/attendance/README.md#att-027)의 QR 구멍과 같은 결이다 — 운영이 맡는다
- **`set_hall_location`을 부를 화면이 없다.** 1차에 안 만든다고 정본이 정했으니 값은 SQL 콘솔로 넣는다. **첫 배포 전에 실제 홀 좌표를 넣는 것이 전환 항목이고**, 공개 저장소라 그 값을 커밋하지 않는다 — 시드는 가짜 좌표다
- **결근에 배치가 없다.** 시계가 지나면 저절로 결근이라 저장이 안 된다. 급여가 그 값을 쓸 때 같은 순수 함수를 부르는지가 payroll task의 몫이고, 거기서 다시 짜면 두 벌이 선다. [AC-06](#ac-06)이 「한 곳에만 있어야 한다」를 적은 자리다
- **`check_in`이 인자로 시각을 받는 유일한 함수다.** 규칙의 예외라 다음 함수가 이것을 보고 따라 할 수 있다. `data-access.md`가 이미 예외로 명시했고 `pr-diff`가 다른 함수에 `p_*_at` 인자가 생기는지 본다
- 되돌리기는 `supabase db reset`이다. 배포한 적이 없어 마이그레이션을 고쳐 다시 만든다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-02 | 남의 사유 글이 샌다 | integration `tests/integration/attendance-rls.test.ts`(예정) | `pnpm test:integration:run` | `excuses`는 본인·관리자만, 뷰는 전원이 읽되 글이 없다 |
| AC-02 | 근무자가 QR 값을 읽어 스캔 없이 찍는다 | integration 위 | 위와 같다 | `hall_secrets`가 근무자에게 0행 |
| AC-03 | 배정 없이 찍힌다, 창 밖에 찍힌다, 멀리서 찍힌다 | integration `tests/integration/attendance-functions.test.ts`(예정) | 위와 같다 | `not_allowed`·`window_closed`·`too_far`·`invalid_qr` |
| AC-03 | 기기 시각을 그대로 믿는다 | integration 위 | 위와 같다 | 10분 넘게 이르면 `now()`, 미래도 `now()`, 사이는 그대로 |
| AC-03 | 재시도가 두 번 찍는다 | integration 위 | 위와 같다 | 둘째가 `already_done`, 행이 하나 |
| AC-04 | 48시간 지나 사유가 들어간다, 거절 뒤 못 낸다 | integration 위 | 위와 같다 | `window_closed`, 거절 뒤 새 행이 선다 |
| AC-05 | 옛 QR이 살아 있다 | integration 위 | 위와 같다 | 돌린 뒤 옛 값이 `invalid_qr` |
| AC-06 | 경계에서 상태가 뒤집힌다 | unit `src/features/attendance/model/__tests__/`(예정) | `pnpm test` | 정각·창 양 끝·48시간·거절 사유·통신 지연 5분 |
| AC-07 | 통신이 끊기면 인증이 사라진다 | unit 위 | `pnpm test` | 다섯 번 재시도, 2·4·8·16·32초 |
| AC-08 | 코드 목록과 마이그레이션이 어긋난다 | unit `tests/lint/error-codes.test.ts` | `pnpm test` | 셋이 양쪽에 있다 |

- 배정하지 않은 것: 실제 통신이 끊긴 기기에서 재시도가 이어 도는지 — iOS가 타이머를 멈췄다 재개하는 동작이라 실기기에서 손으로 본다. 이것은 [`attendance-checkin`](../../backlog.md)의 몫이다
- 막힌 것: 지금은 없다

## 범위 밖

- `/check-in` 화면과 네이버 지도 — [`attendance-checkin`](../../backlog.md)
- `/admin/qr` 화면과 인쇄용 그림 — [`attendance-qr`](../../backlog.md)
- 사유 시트와 `/admin/approvals`의 사유 줄 — [`attendance-excuse`](../../backlog.md)
- 근무자 명단의 인증 상태 열과 현황 줄 — [`schedule-worker`](schedule-worker.md)가 자리를 두었고 그 값이 [AC-06](#ac-06)의 함수에서 온다. 붙이는 것은 [`attendance-excuse`](../../backlog.md)와 같은 회차다
- 대시보드의 하루 띠와 못 찍음 블록 — [`dashboard`](../../backlog.md)
- 근태 월 집계 화면 — 통계 화면의 것이다
- 알림 — 알림 영역
- 홀 좌표를 고치는 화면 — 1차 밖
- 타입 생성 — [`types-generation`](../../backlog.md)
