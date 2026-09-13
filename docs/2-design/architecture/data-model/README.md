# 데이터 모델

테이블과 관계가 산다. 실제 스키마의 정본은 `supabase/migrations/`고 여기는 그 지도와 근거를 담는다.

이 파일이 도메인을 가로지르는 것을 들고, 도메인마다의 테이블은 300줄을 넘기면 `<도메인>.md`로 나간다. 파일 이름은 [`../../domain/`](../../domain/)의 것을 그대로 쓴다.

## 네 원칙

- **사실은 DB에, 상태는 계산한다.** 출근 상태·급여·자격·빈 자리는 저장하지 않는다. 인증 시각, 살아 있는 배정, 시급 행 같은 사실만 두고 TypeScript 순수 함수가 상태를 낸다. 잠든 행이 없으니 배치가 없다
- **쓰기는 함수다.** 화면과 use-case는 `dals`를 부르고, `dals`가 `supabase.rpc()`로 Postgres 함수(security definer)를 부른다. 테이블에 직접 쓰는 정책은 `profile_private` 본인 행(연락처·사진) 하나뿐이다
- **이력은 닫고 새로 만든다.** 배정·자리·시급이 바뀌면 옛 행에 `ended_at`을 찍고 새 행을 만든다. 살아 있는 것은 `ended_at is null`이다
- **막는 것은 화면이 아니라 데이터다.** 시급·급여·개인정보·QR 값은 RLS가 행 단위로 막을 수 있게 표를 가른다

## 테이블 목록

| 테이블 | 도메인 | 한 줄 |
| --- | --- | --- |
| `profiles` | account | 사람 하나. 이름·사진·역할·승인·차단·퇴사·비움 시각. `user_id`가 `auth.users`를 가리킨다 |
| `profile_private` | account | 연락처·생년월일·성별. 본인과 관리자만 |
| `position_grants` | schedule | 관리자가 「자격까지 줌」을 고른 기록 |
| `schedules` | schedule | 한 달 근무표. 신청 마감일, 확정 시각 |
| `days` | schedule | 연 날 하나. 근무 시작·끝 시각, 연 시각 |
| `slots` | schedule | 어느 날 어느 포지션(들)의 자리 하나. 겸임은 포지션 둘을 든 새 행 |
| `assignments` | schedule | 자리에 든 사람 하나. 교육 배정도 여기 |
| `availabilities` | schedule | 근무 신청 — 누가 어느 날짜에 일할 수 있나 |
| `requests` | schedule·swap | 근무 요청과 교대 요청. `kind`로 가른다 |
| `request_candidates` | schedule·swap | 요청의 갈래 — 누가 답했나 |
| `cancel_requests` | schedule | 근무자가 자기 배정을 무르는 요청과 판정 |
| `check_ins` | attendance | 그날 그 사람의 출근 인증 |
| `excuses` | attendance | 그날 그 사람의 사유와 판정 |
| `adjustments` | payroll | 관리자가 손본 그날 그 사람의 근무 시간 |
| `wage_rates` | payroll | 사람별 시급 이력 |
| `default_wage_rates` | payroll | 기본 시급 이력 |
| `holidays` | payroll | 공공 API에서 받아둔 공휴일 |
| `notifications` | notification | 사람에게 간 알림 하나. 읽음 시각, 푸시 시각 |
| `push_subscriptions` | notification | 기기의 Web Push 구독 |
| `halls` | 가로지름 | 홀 하나. 좌표·반경, 자리 기본값, 근무 시간 기본값 |
| `hall_secrets` | attendance | 홀의 QR 코드 값. 관리자만 |

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

`auth.users ─? profiles`는 하나 또는 없음이다. 아래 「프로필 신원」에 있다.

## 근무표

**자리는 날을 열 때 행으로 미리 만든다.** 관리자가 9월 20일을 열면 `days` 행 하나와 자리 기본값(아홉 포지션 열한 명)만큼 `slots` 행이 선다. 배정·근무 요청이 전부 `slot_id`를 가리킨다. 안 연 날은 `days` 행이 없고 달력이 비활성으로 그린다. `days.opened_at`이 「확정 시점에 있던 날인가」를 가른다 — 확정이 묶는 것은 그때 있던 날들이다([schedule.md](../../domain/schedule.md#확정-뒤에-바꾸는-길)).

**겸임은 새 자리 행이다.** 안내와 매니저를 합치면 `positions = ['안내','매니저']`인 `slots` 행 하나가 서고 원래 둘은 `ended_at`이 찍힌다. 나누면 합친 행을 닫고 원래 둘의 `ended_at`을 비운다. 살아 있는 자리는 언제나 하나라 「자리당 살아 있는 배정 하나」 unique index가 그대로 묶음까지 지킨다. 닫힌 자리에 걸려 있던 근무 요청은 합치기 함수가 같이 닫는다.

**배정은 바뀌면 옛 행을 닫고 새 행을 만든다.** `assignments(slot_id, day_id, position, profile_id, kind, started_at, ended_at, ended_reason, ended_by)`. 교대·강제 변경·근무 취소가 남긴 자국이 그대로 이력이다. 확정 뒤에만 그렇다 — 확정 전에 짜는 동안의 이동은 행을 지운다([schedule.md](../../domain/schedule.md#근무표의-생애)가 날을 닫으면 「배정이 같이 사라진다」고 했다). 함수가 `schedules.confirmed_at`을 보고 가른다.

unique index 둘이 도메인 규칙을 지킨다.

- `(slot_id) where ended_at is null and kind = 'regular'` — 자리당 사람 하나
- `(day_id, profile_id) where ended_at is null and kind = 'regular'` — 한 사람이 같은 날 두 자리를 못 맡는다. 겸임은 자리 하나라 여기 안 걸린다

**교육 배정도 같은 표다.** `kind = 'training'`이고 `slot_id`가 없다. 정규면 `slot_id` 필수, 교육이면 없음을 check 제약이 지킨다. 「그날 근무한 사람」을 한 표에서 읽고, 「안내 교육 몇 번」은 `kind`로 센다.

**자격은 계산한다.** 팀장·스캔·메인·드레스·드레스실에 들어갈 수 있는 사람은 그 포지션 `position_grants` 행이 있거나 그 포지션 교육 배정 행이 있는 사람이다. 관리자가 「자격까지 줌」을 고른 것만 저장한다(`position_grants(profile_id, position, granted_by, granted_at)`). 취소된 교육 배정은 `ended_reason`으로 걸러 자격에서 뺀다 — 「배웠다」의 기준이 배정 시점인지 출근 뒤인지는 domain이 아직 안 정했다.

**근무 신청은 날짜에 딸린다.** `availabilities(profile_id, work_date) unique`. `days`가 아니다 — 신청 접수는 근무표를 만드는 순간 열리고 날을 여는 것은 그 뒤라, 아직 안 연 날짜에 신청이 선다. 다시 보내면 함수가 그 달 행을 지우고 새로 넣는다.

## 요청

**근무 요청과 교대 요청은 한 표다.** 여럿에게 묻고 답을 기다리는 모양이 같다. `requests(kind, slot_id, assignment_id, requested_by, expires_at, closed_at, approved_candidate_id)` — `kind = 'work'`면 `slot_id` 필수, `kind = 'swap'`이면 `assignment_id` 필수를 check 제약이 지킨다. 갈래는 `request_candidates(request_id, profile_id, status, responded_at, expires_at)`이고 `request_id`가 진짜 FK다. 관리자에게만 보낸 교대는 갈래가 없는 `swap` 행이다.

자리를 채우는 길 다섯(배정 추가·교대 승인·강제 변경·근무 요청 수락·날 닫기)이 전부 그 자리의 살아 있는 `requests`를 닫는다. 한 표라 「이 자리의 살아 있는 요청」이 한 질의다.

`request_candidates.status`는 「상태는 저장하지 않는다」의 예외다. 수락 취소가 답을 안 한 상태로 되돌리니([swap.md](../../domain/swap.md#수락-취소)) 시각으로 못 나타낸다.

**근무 취소는 따로 둔다.** `cancel_requests(assignment_id, reason, decided_at, decision, decision_reason)`. 거절되면 새 행이다 — 사유와 같은 꼴이다.

## 인증과 사유

**그날 그 사람에 붙인다.** `check_ins(day_id, profile_id) unique`, `excuses(day_id, profile_id, ...)`. 배정이 아니다 — 9시 30분에 찍은 인증이 10시 강제 변경으로 사라지면 안 된다. 근무 시간이 날짜당 하나라 포지션이 바뀌어도 인증 창은 같다. 인증 함수가 「그날 살아 있는 배정이 있나」를 따로 검사한다.

사유는 거절되면 새 행이다. 판정은 `decided_at`·`decision`으로 남고 글(`body`)은 본인과 관리자만 읽는다. 명단이 그리는 「확인 중·인정·결근」은 판정 결과가 필요하니 `excuse_status` 뷰(`security_invoker`)가 글만 빼고 `(day_id, profile_id, decided_at, decision)`을 전원에게 낸다.

## 시급과 급여

**시급 이력은 사람마다 실제 행이다.** `wage_rates(profile_id, effective_date, amount, follows_default)`. 기본 시급 변경 함수가 `default_wage_rates`에 한 행을 넣고 `follows_default = true`인 사람 전원에게 같은 날 행을 한 트랜잭션에 넣는다. 급여 계산은 `wage_rates` 하나만 읽고 RLS도 한 표에만 건다. 같은 날 두 번 바꾸면 덮어쓴다 — `(profile_id, effective_date)` unique. 승인 함수가 첫 행(`follows_default = true`)을 넣는다 — 승인된 사람은 곧바로 계산에 든다.

**급여는 계산한다.** `features/payroll`의 순수 함수가 살아 있는 배정, 날의 시간, 조정, 사유 판정, 그날 시급을 받아 금액을 낸다. 근무자는 RLS가 자기 `wage_rates`만 주니 자기 금액만 나온다. 통계가 서른 명 한 달치를 보는 것은 관리자가 전원 행을 받아서다 — 배정 천 행쯤이라 클라이언트로 내려 계산해도 작다.

## 알림

**사건 알림은 같은 함수 트랜잭션 안에서 insert한다.** `approve_swap()`이 배정을 바꾸고 같은 함수 안에서 `notifications` 행을 넣는다 — 배정은 바뀌었는데 알림이 없는 상태가 안 생긴다. 「자기 행동은 안 알린다」·「전부 끝나면 한 번」 같은 묶기 규칙이 함수 안에 산다.

**시각 알림은 pg_cron이 insert한다.** 전날 저녁 9시 미리알림, 시작 10분 전, 예식 3일 전 빈자리 재촉이 여기다. 매 분 돌며 조건에 맞는 행을 넣는다. 「이미 보냈나」는 cron이 넣는 kind에만 `(profile_id, kind, subject_id)` unique로 막는다 — 사건 알림은 트랜잭션이 이미 중복을 막는다.

`notifications(profile_id, kind, subject_id, payload, created_at, read_at, pushed_at)`. 지워지지 않고 `read_at`만 찍힌다. 푸시가 나가는 길은 [`../api/`](../api/)에 있다 — Database Webhook이 Edge Function을 부르고 거기서 `pushed_at`을 찍는다.

## 홀

`halls(id, lat, lng, radius_m, default_slots jsonb, default_starts, default_ends)`. 지금은 한 행이고 둘째 홀이 생기면 행을 더한다([attendance.md](../../domain/attendance.md)). 좌표·반경은 전원이 읽는다. QR 코드 값은 `hall_secrets(hall_id, qr_code, rotated_at)`로 갈라 관리자만 읽는다 — 같은 행에 있으면 근무자가 값을 읽어 스캔 없이 인증 함수에 넣는다.

## 프로필 신원

**`profiles.id`는 별도 uuid고 `user_id`가 `auth.users`를 가리킨다.** `user_id uuid unique references auth.users on delete set null`. 지금 마이그레이션은 `id = auth.users.id`(cascade)라 두 가지가 안 된다 — 새 구글 계정을 옛 프로필에 잇는 것([account.md](../../domain/account.md#구글-계정-변경))과 계정을 지우고 프로필을 남기는 것. 잇기는 `user_id`만 바꾸는 함수다. RLS 술어는 전부 `user_id = auth.uid()`가 된다.

새 로그인마다 빈 프로필을 만드는 트리거는 뗀다. 첫 진입에서 `dals`가 만들고, 잇기 함수는 그 빈 행을 지운다.

**개인정보는 표를 가른다.** `profiles`(이름·사진·역할)는 승인된 전원이 읽고 `profile_private`(연락처·생년월일·성별)는 본인과 관리자만 읽는다. RLS가 행 단위라 한 표로는 열을 못 가른다.

**차단은 `blocked_at`이다.** Auth ban을 안 쓴다 — 구글 로그인은 되지만 미들웨어가 차단 화면으로 보내고 `is_approved()`가 `blocked_at is null`을 품어 행을 안 준다. 서비스 키 자리가 안 는다.

**퇴사 1년 뒤의 「삭제」는 비우기다.** `erase_profile()` 함수가 `profile_private` 행을 지우고 사진을 비우고 `erased_at`을 찍는다. 이름은 남는다 — 그게 스냅샷이다. 배정·인증·시급 FK가 그대로 살아 통계와 지난 근무표가 안 흔들린다. `auth.users` 행은 Supabase Admin API로 지운다 — 서비스 키 자리다.

## 서비스 키 자리

ADR-003이 「왜 필요한지를 이 문서에 먼저 적는다」고 한 자리다. 둘이다.

- `auth.users` 삭제 — Admin API뿐이다
- Edge Function이 `notifications.pushed_at`을 찍는 것 — 함수는 사용자 세션 없이 돈다

## 읽기 RLS 기본값

**기본은 「승인된 사람 전원 읽기」다.** 날·자리·배정·요청·인증 상태처럼 전원이 보는 표가 다수라 기본값과 맞는다. `is_approved()`·`is_admin()` 두 SQL 함수를 모든 정책이 공유한다. 둘은 `security definer`·`stable`·`search_path = ''`다 — `profiles` 정책이 `profiles`를 읽는 함수를 부르면 재귀에 걸린다.

승인 전은 자기 `profiles`·`profile_private` 행만 읽는다(ADR-003). 퇴사자는 자기 행만이다 — 자기 배정·인증·시급과 그 배정이 든 `days`. 남의 지난 기록도 안 연다([account.md](../../domain/account.md#퇴사)).

좁히는 표는 이렇다. 안 적은 표는 기본값이다.

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

프로필 제출도 함수다(`submit_profile()`). 이름·성별·생년월일은 보내고 나면 잠기는데 컬럼 grant는 「한 번만」을 못 나타낸다. 연락처·사진만 직접 갱신 정책이 남는다.

함수 안에서 「호출자가 관리자인가」·「승인됐나」를 검사한다. 이 검사를 빠뜨린 함수가 구멍이라 함수를 만드는 PR은 그 검사의 integration 테스트를 같이 낸다.

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

- 「배웠다」의 기준 — 교육 배정이 서면인가, 출근 인증까지인가. 자격 계산이 이걸 든다
- 알림 끄기와 홈 화면 추가 여부를 어디 두나. `push_subscriptions` 없음만으로는 「안드로이드 안 켬」과 「아이폰 홈 추가 안 함」을 못 가른다
- `schedules`와 주 범위(8월 = 8/3~9/6)의 대응을 누가 계산하나 — 날 열기 함수와 달력 둘 다 필요하다
- 공휴일을 누가 넣나 — 관리자 버튼 함수면 서비스 키가 안 든다
- Free 플랜은 1주 무활동이면 프로젝트가 멈춘다 — pg_cron·Webhook이 같이 멈춘다. pg_cron·Webhook의 플랜별 가부는 문서에서 못 봤다
