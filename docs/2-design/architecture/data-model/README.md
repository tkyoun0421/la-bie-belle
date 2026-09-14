# 데이터 모델

테이블과 관계가 산다. 실제 스키마의 정본은 `supabase/migrations/`고 여기는 그 지도와 근거를 담는다.

이 파일이 도메인을 가로지르는 것을 들고, 도메인마다의 표는 같은 이름의 파일에 산다 — [`account.md`](../../modules/account/design.md) · [`schedule.md`](schedule.md) · [`swap.md`](swap.md) · [`attendance.md`](attendance.md) · [`payroll.md`](payroll.md) · [`notification.md`](notification.md). 짝은 [`../../domain/`](../../domain/)의 같은 이름이다.

## 네 원칙

- **사실은 DB에, 상태는 계산한다.** 출근 상태·급여·자격·빈 자리는 저장하지 않는다. 인증 시각, 살아 있는 배정, 시급 행 같은 사실만 두고 TypeScript 순수 함수가 상태를 낸다. 잠든 행이 없으니 배치가 없다
- **쓰기는 함수다.** 화면과 use-case는 `dals`를 부르고, `dals`가 `supabase.rpc()`로 Postgres 함수(security definer)를 부른다. 테이블에 직접 쓰는 정책은 `profile_private` 본인 행(연락처) 하나뿐이다 — 사진은 `profiles`에 있어 `update_my_photo()` 함수다
- **이력은 닫고 새로 만든다.** 배정·자리·시급이 바뀌면 옛 행에 `ended_at`을 찍고 새 행을 만든다. 살아 있는 것은 `ended_at is null`이다
- **막는 것은 화면이 아니라 데이터다.** 시급·급여·개인정보·QR 값은 RLS가 행 단위로 막을 수 있게 표를 가른다

## 테이블 목록

| 테이블 | 파일 | 한 줄 |
| --- | --- | --- |
| `profiles` | account | 사람 하나. 이름·사진·역할·승인·차단·퇴사·비움 시각. `user_id`가 `auth.users`를 가리킨다 |
| `profile_private` | account | 연락처·생년월일·성별. 본인과 관리자만 |
| `schedules` | schedule | 한 달 근무표. 신청 마감일, 확정 시각 |
| `days` | schedule | 연 날 하나. 근무 시작·끝 시각, 연 시각 |
| `slots` | schedule | 어느 날 어느 포지션(들)의 자리 하나. 겸임은 포지션 둘을 든 새 행 |
| `assignments` | schedule | 자리에 든 사람 하나. 교육 배정도 여기 |
| `position_grants` | schedule | 관리자가 「자격까지 줌」을 고른 기록 |
| `availabilities` | schedule | 근무 신청 — 누가 어느 날짜에 일할 수 있나 |
| `requests` | schedule | 근무 요청과 교대 요청. `kind`로 가른다 |
| `request_candidates` | schedule | 요청의 갈래 — 누가 답했나 |
| `cancel_requests` | schedule | 근무자가 자기 배정을 무르는 요청과 판정 |
| `check_ins` | attendance | 그날 그 사람의 출근 인증 |
| `excuses` | attendance | 그날 그 사람의 사유와 판정 |
| `hall_secrets` | attendance | 홀의 QR 코드 값. 관리자만 |
| `adjustments` | payroll | 관리자가 손본 그날 그 사람의 근무 시간 |
| `wage_rates` | payroll | 사람별 시급 이력 |
| `default_wage_rates` | payroll | 기본 시급 이력 |
| `holidays` | payroll | 공공 API에서 받아둔 공휴일 |
| `notifications` | notification | 사람에게 간 알림 하나. 읽음·잡음·성공 시각 |
| `push_subscriptions` | notification | 기기의 Web Push 구독 |
| `halls` | 여기 | 홀 하나. 좌표·반경, 자리 기본값, 근무 시간 기본값 |

## 관계 지도

```
auth.users ─? profiles ─1 profile_private
                │
                ├─< position_grants
                ├─< availabilities (work_date)
                ├─< wage_rates
                ├─< check_ins  >─ days
                ├─< excuses    >─ days
                ├─< adjustments >─ days
                ├─< notifications
                └─< push_subscriptions

halls ─< schedules ─< days ─< slots ─< assignments >─ profiles
halls ─1 hall_secrets              │        │
                                   │        ├─< cancel_requests
                                   │        └─< requests (kind=swap)
                                   └─< requests (kind=work)
                                              └─< request_candidates >─ profiles
```

`auth.users ─? profiles`는 하나 또는 없음이다. [`account.md`](../../modules/account/design.md#프로필-신원)에 있다.

## 홀

`halls(id, lat, lng, radius_m, default_slots jsonb, default_starts, default_ends)`. 지금은 한 행이고 둘째 홀이 생기면 행을 더한다([attendance.md](../../domain/attendance.md)). 좌표·반경은 전원이 읽는다. QR 코드 값은 `hall_secrets`로 갈라 관리자만 읽는다 — 그 표는 [`attendance.md`](attendance.md)에 있다.

## 읽기 RLS 기본값

**기본은 「승인된 사람 전원 읽기」다.** 날·자리·배정·요청·인증 상태처럼 전원이 보는 표가 다수라 기본값과 맞는다. `is_approved()`·`is_admin()` 두 SQL 함수를 모든 정책이 공유한다. 둘은 `security definer`·`stable`·`search_path = ''`다 — `profiles` 정책이 `profiles`를 읽는 함수를 부르면 재귀에 걸린다.

승인 전은 자기 `profiles`·`profile_private` 행만 읽는다(ADR-003). 퇴사자는 자기 행만이다 — 자기 배정·인증·시급과 그 배정이 든 `days`. 남의 지난 기록도 안 연다([account.md](../../modules/account/README.md#퇴사)).

좁히는 표는 이렇다. 안 적은 표는 기본값이다. 왜 좁히는지는 각 도메인 파일에 있다.

| 표 | 누가 읽나 |
| --- | --- |
| `profile_private` | 본인 행과 관리자 |
| `wage_rates` | 본인 행과 관리자 |
| `default_wage_rates` | 관리자 |
| `excuses` | 본인 행과 관리자. 전원은 `excuse_status` 뷰 |
| `availabilities` | 본인 행과 관리자 |
| `cancel_requests` | 본인 행과 관리자 |
| `notifications` | 본인 행 |
| `push_subscriptions` | 본인 행 |
| `hall_secrets` | 관리자 |

정책을 고치는 PR은 그 정책의 integration 테스트를 같이 낸다(ADR-003). 새 표에 좁히기를 까먹으면 새는 쪽으로 틀리니 그 테스트가 유일한 장치다.

## 쓰기 함수

관리자 쓰기(가입 승인, 근무표 확정, 기본 시급 변경, 퇴사 처리)가 함수여야 하는 이유는 컬럼 권한이 역할 단위라서다 — `authenticated`에 `approved_at` 갱신을 열면 본인이 자기 승인을 채운다. 근무자 쓰기(근무 신청 덮어쓰기, 근무 요청 수락, 출근 인증)가 함수여야 하는 이유는 선착순·서버 시각·여러 행 덮어쓰기가 전부 한 트랜잭션이어야 해서다. supabase-js에는 트랜잭션이 없다.

함수 안에서 「호출자가 관리자인가」·「승인됐나」를 검사한다. 이 검사를 빠뜨린 함수가 구멍이라 함수를 만드는 PR은 그 검사의 integration 테스트를 같이 낸다. 목록과 규칙은 [`../api/`](../api/)에 있다.

## 서비스 키 자리

ADR-003이 「왜 필요한지를 이 문서에 먼저 적는다」고 한 자리다. 둘이다.

- `auth.users` 삭제 — Admin API뿐이다([`account.md`](../../modules/account/design.md#퇴사-1년-뒤))
- Edge Function이 `notifications.pushed_at`을 찍는 것 — 함수는 사용자 세션 없이 돈다([`notification.md`](notification.md))

## 계산의 예외 하나

「빈 자리」 판정만 SQL이다. `open_slots` 뷰(`security_invoker`)가 살아 있는 자리 중 살아 있는 정규 배정이 없는 것을 낸다. pg_cron의 빈자리 재촉과 관리자 화면이 같은 뷰를 읽는다 — TS와 cron SQL에 같은 규칙이 두 벌 서는 것을 막는다.

## 업무 상수

**TypeScript 한 곳이 정본이다.** 인증 창(1시간 전~18시)·지각 10분·사유 48시간·요청 만료 48시간·교대 수락 12시간·연장 9시간 1.5배가 `src/entities/<도메인>/model/constants.ts`에 산다. 함수가 같은 숫자를 SQL 리터럴로 들고, `tests/lint/`의 대조 테스트가 마이그레이션의 `interval` 문자열과 TS 상수를 맞춘다.

## 시각 컬럼

**달력 날짜는 `date`, 시점은 전부 `timestamptz`다.** `days.work_date date`(KST 달력의 그날), `days.starts_at/ends_at timestamptz`, 인증·만료·마감·승인 시각 전부 `timestamptz`. `wage_rates.effective_date`·`availabilities.work_date`는 `date`. 함수가 `now()`와 바로 비교한다. 화면은 Asia/Seoul로 바꿔 그린다.

「오늘이 며칠인가」를 SQL에서 쓸 때는 `(now() at time zone 'Asia/Seoul')::date`다. `now()::date`는 UTC 자정 근처에서 하루 틀린다.

## 컬럼 이름 규칙

- 시점은 `<동사>_at` — `approved_at`, `ended_at`, `checked_at`, `read_at`
- 날짜는 `<명사>_date` — `work_date`, `effective_date`
- 사람 참조는 `profile_id`. 행위자를 따로 적을 때는 `<동사>_by` — `ended_by`, `granted_by`
- 상태 열은 두지 않는다. 예외는 `request_candidates.status`뿐이다
- 도메인 용어와의 대응: 자리=`slots`, 배정=`assignments`, 근무 신청=`availabilities`, 근무 요청·교대=`requests`, 근무 취소=`cancel_requests`, 인증=`check_ins`, 사유=`excuses`, 조정=`adjustments`, 시급=`wage_rates`, 자격 부여=`position_grants`

## 아직 안 정한 것

도메인에 속하는 미정은 각 파일 끝에 있다. 가로지르는 것만 여기다.

- `schedules`와 주 범위(8월 = 8/3~9/6)의 대응을 누가 계산하나 — 날 열기 함수와 달력 둘 다 필요하다
