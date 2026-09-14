# API

서버와 주고받는 경계가 산다. 경로, 입출력, 권한이다.

이 파일이 도메인을 가로지르는 것을 들고, 도메인마다의 경계는 300줄을 넘기면 `<도메인>.md`로 나간다. 표의 모양은 [`../data-model/`](../data-model/)에 있고 여기는 그 표를 누가 어떻게 부르는지다.

## 경계 하나

**브라우저가 Supabase를 바로 부른다.** Next 서버는 로그인 게이트와 첫 페이지 껍데기만 준다. 권한을 RLS에 뒀으니 서버가 중간에 서서 검사할 것이 없고, Vercel 서버는 요청이 없으면 잠들어 깨우는 데 1~3초가 든다 — 출근 인증 버튼이 그걸 기다릴 이유가 없다. realtime 구독과 오프라인 캐시도 브라우저가 Supabase를 직접 쥘 때 자연스럽다.

브라우저에 anon key가 보이는 것은 단점이 아니다. 그 키는 공개용이고 권한은 세션 토큰과 RLS가 정한다.

**데이터에 닿는 코드는 `dals`뿐이다.** `from()`·`rpc()`·`storage`·`channel()`이 여기서만 나온다. 화면과 use-case는 `dals` 함수를 부른다. `auth.*`(세션 확인·코드 교환·로그아웃)는 데이터가 아니라 `shared/lib`에 산다 — 도메인이 없고 로컬 Supabase가 구글 OAuth를 못 돌려 integration 테스트 대상도 아니다. 조항의 정본은 [ADR-003](../../adr/ADR-003-supabase-and-integration-tests.md#db-접근을-한곳에-모은다)이다.

Next 서버가 Supabase를 부르는 자리는 `auth.*`와 첫 페이지의 승인 여부 읽기(`readAuthGate`)뿐이다. 데이터를 쓰는 서버 코드는 없다.

## 읽기

**`dals`가 표를 직접 `select`하고 PostgREST 임베딩으로 join한다.** 근무표 한 달은 `from('days').select('*, slots(*), assignments(*, profiles(display_name)), check_ins(*)')` 한 질의다. `assignments`는 `days`에서 바로 임베딩한다 — `slots`를 거치면 `slot_id`가 없는 교육 배정이 빠진다. RLS가 표마다 걸려 임베딩된 표도 걸러진다 — 근무자가 `wage_rates`를 임베딩해도 자기 행만 온다. 단 `grant select`가 없는 표는 빈 결과가 아니라 오류라, 새 표를 만들 때 grant를 빠뜨리면 그 표를 임베딩한 질의 전체가 죽는다.

뷰는 둘뿐이다. `excuse_status`(사유 글을 뺀 판정)와 `open_slots`(빈 자리). 둘 다 `security_invoker`라 RLS를 그대로 탄다. Supabase linter의 `security_definer_view`가 나머지를 잡는다.

임베딩 문자열은 런타임에서만 틀린다. 표가 바뀌면 `dals`의 integration 테스트가 잡는다 — `dals` 함수의 짝 테스트는 integration으로 쓴다. 훅은 unit도 통과시키니 이건 `implementer` 정의문과 `pr-diff`가 본다.

한 질의는 `max_rows`(지금 1000)에서 잘린다. 잘려도 오류가 아니다. 알림처럼 안 지우고 쌓이는 표는 첫 사람이 1000에 닿기 전에 `range()`를 건다 — 어느 표부터인지는 [`../runtime/`](../runtime/)이 정한다.

**타입은 표에서 뽑는다.** `supabase gen types typescript --local > src/shared/api/database.types.ts`. 파일을 저장소에 넣고 CI가 마이그레이션 뒤 다시 뽑아 diff가 0인지 본다 — 표를 바꾸고 타입을 안 뽑으면 빨간불이다. CLI 버전이 다르면 포맷이 달라 헛빨간불이 나니 CI는 로컬과 같은 버전을 박는다. `pnpm types`가 그 명령을 감싼다.

## 쓰기

**쓰기는 Postgres 함수고 `dals`가 `rpc()`로 부른다.** 이유는 [`../data-model/`](../data-model/#쓰기-함수)에 있다. 여기는 목록과 규칙이다.

### 이름과 자리

`<동사>_<목적어>` snake_case다. 동사는 도메인 문서의 행위 이름을 따른다 — 승인은 `approve`, 확정은 `confirm`, 강제 변경은 `force`. 마이그레이션 파일은 도메인마다 하나(`<날짜>_<도메인>_functions.sql`)고 함수는 그 안에 모인다.

**호출자가 있는 함수는 `public`, 없는 함수는 `internal` 스키마다.** `public`의 함수는 전부 PostgREST `/rpc/`로 노출되고 로그인한 누구나 부른다. pg_cron이 부르는 함수를 `public`에 두면 근무자가 devtools에서 `expire_requests()`를 불러 남의 요청을 만료시킨다. `internal`은 PostgREST가 모르는 스키마라 까먹으면 새는 쪽이 아니라 안 도는 쪽으로 틀린다.

### 목록

관리자만 부르는 것.

| 함수 | 하는 일 |
| --- | --- |
| `approve_member`, `reject_member`, `block_member`, `unblock_member` | 가입 승인·거절·차단·해제. 승인은 `wage_rates` 첫 행을 같이 넣는다 |
| `set_role` | 관리자 올리기·내리기. 마지막 관리자는 못 내린다 |
| `set_display_name` | 관리자가 이름을 고친다. 본인은 못 고치니 여기뿐이다 |
| `link_account` | 새 구글 계정을 옛 프로필에 잇는다. 새 계정의 빈 프로필을 지운다 |
| `mark_leave`, `undo_leave` | 퇴사 처리(앞 배정이 있으면 거절)와 되돌리기 |
| `create_schedule`, `set_application_deadline`, `confirm_schedule` | 근무표 만들기·마감일 바꾸기·확정 |
| `open_day`, `close_day`, `set_day_hours` | 날 열기(자리 기본값 깔기)·닫기(배정 같이)·근무 시간 |
| `add_slot`, `remove_slot`, `merge_slots`, `split_slot` | 자리 늘리기·줄이기·겸임 만들기·나누기 |
| `add_assignment`, `remove_assignment`, `force_change` | 배정 추가(교육 포함)·확정 전 빼기·확정 뒤 바꾸기 |
| `grant_position` | 자격까지 주기 |
| `send_work_request` | 근무 요청 보내기(여럿에게) |
| `approve_swap`, `decide_cancel_request`, `decide_excuse` | 교대 승인·근무 취소 판정·사유 판정 |
| `set_adjustment` | 그날 그 사람의 근무 시간 조정 |
| `set_wage`, `reset_wage_to_default`, `set_default_wage` | 시급·기본으로 되돌리기·기본 시급 |
| `set_hall_defaults`, `set_hall_location`, `rotate_qr` | 자리·근무 시간 기본값, 좌표·반경, QR 바꾸기(옛 코드 즉시 폐기) |
| `post_announcement` | 관리자 공지 |
| `import_holidays` | 공휴일 넣기 |

근무자가 부르는 것.

| 함수 | 하는 일 |
| --- | --- |
| `ensure_profile` | 첫 진입에서 자기 프로필 행을 만든다. 있으면 아무것도 안 한다 |
| `submit_profile` | 프로필 제출. 이름·성별·생년월일은 제출된 뒤 잠기고 거절되면 다시 열린다 |
| `submit_availability` | 근무 신청. 그 달 행을 지우고 새로 넣는다 |
| `respond_request` | 근무 요청·교대 요청에 답하기 — 수락·거절·수락 취소. 근무 요청 수락은 곧 배정이라 자격 검사도 한다 |
| `create_swap_request`, `create_cancel_request` | 교대 요청(받을 사람 없이 관리자에게만도 같은 함수)·근무 취소 요청 |
| `check_in` | 출근 인증. 좌표 또는 QR 값을 받고 거리 계산과 코드 대조는 함수가 한다 — 화면의 판정을 안 믿는다 |
| `submit_excuse` | 사유 제출 |
| `mark_notifications_read` | 읽음 찍기 |
| `save_push_subscription`, `remove_push_subscription` | 기기 구독 |

누구나 부르는 것 — `server_now()`.

pg_cron이 부르는 것(`internal`) — `emit_reminders`(전날 저녁 9시·시작 10분 전·빈자리 재촉), `expire_requests`(48시간·12시간 만료와 「전부 끝남」 알림), `retry_push`(미발송 알림 다시 쏘기), `erase_profiles`(퇴사 1년 지난 프로필 비우기).

### 함수 안의 규칙

- 첫 줄이 호출자 검사다. `auth.uid()`로 프로필을 찾고 `is_admin()`·`is_approved()`를 본다. 검사가 없는 함수는 구멍이라 함수 PR은 그 검사의 integration 테스트를 같이 낸다
- 시각 판정은 `now()`다. 인자로 시각을 받지 않는다 — 기기 시계가 들어올 자리가 없다
- 여러 행을 바꾸는 것은 전부 한 함수 안이다. 기본 시급 변경이 서른 행을 넣다 끊기면 전부 되돌아간다
- 사건 알림은 같은 함수 안에서 `notifications`에 넣는다
- `security definer`, `set search_path = ''`, 표는 스키마를 붙여 부른다(`public.profiles`)
- 함수는 상수를 리터럴로 든다. 정본은 TypeScript고 대조 테스트가 맞춘다([`../data-model/`](../data-model/#업무-상수))
- unique·check 제약에 닿기 전에 검사해 코드를 던진다. 제약이 먼저 걸리면 화면이 「다시 시도」를 시킨다

## 오류의 모양

**함수는 실패를 예외로 던지고, 메시지가 고정 코드다.** `raise exception using message = 'slot_full'`. 예외라 트랜잭션이 저절로 되돌아간다.

`dals`가 예외를 둘로 가른다.

- `DomainError` — 메시지가 코드 목록에 있는 것. 코드 목록은 `src/shared/api/error-codes.ts`가 정본이고 대조 테스트가 마이그레이션의 `raise` 문자열과 맞춘다
- `TransportError` — 그 밖의 전부. 통신 실패, 타임아웃, 모르는 코드

화면은 이 둘만 본다. `TransportError`면 시트를 열어둔 채 「보내지 못했어요. 다시 시도해주세요」다. `DomainError`는 코드마다 페이지 문서가 정한 대로다.

| 코드 | 언제 | 화면 |
| --- | --- | --- |
| `slot_full` | 근무 요청 수락이 선착순에 졌다 | 시트 닫고 토스트 「자리가 찼어요」 |
| `request_closed` | 요청이 만료됐거나 다른 사람이 통과했다 | 시트 닫고 새로 읽기 |
| `stale` | 화면이 든 id가 닫혔거나 없는 행이다 | 「이 근무가 바뀌었어요」, 새로 읽기 |
| `already_assigned` | 그날 이미 다른 자리에 든 사람이다 | 관리자 화면이 자리 합치기를 안내 |
| `not_qualified` | 포지션 자격이 없다 | 관리자 컨펌 시트 |
| `window_closed` | 인증 창·요청 마감·취소 마감 밖이다 | 버튼이 잘못 켜진 것. 새로 읽기 |
| `too_early` | 신청 마감 전에 확정하려 했다 | 마감일 당기기 안내 |
| `too_far`, `invalid_qr` | 홀 반경 밖, 옛 코드 | 인증 화면 문안 |
| `last_admin` | 마지막 관리자를 내리려 했다 | 문안 |
| `has_future_assignments` | 앞 배정이 남은 사람을 퇴사 처리했다 | 남은 자리 목록은 화면이 먼저 읽어 보여준다 |
| `not_allowed` | 관리자 검사에 걸렸거나 RLS 거부(`42501`) | 버튼이 잘못 켜진 것. 새로 읽기 |

**`stale`은 닫혔거나 없는 행이다.** 배정·자리·요청이 바뀌면 옛 행이 닫히고 새 행이 선다([`../data-model/`](../data-model/#근무표)). 확정 전에는 행이 지워진다. 화면이 들고 있던 id가 그 둘 중 하나면 함수가 `stale`을 던진다. 버전 열 없이 「상태가 바뀜」을 잡는다.

**오류에 데이터를 싣지 않는다.** 코드 하나면 화면이 새로 읽는다. 목록이 필요한 자리(퇴사의 남은 배정)는 버튼을 누르기 전에 화면이 읽어둔다. 실을 것이 셋째로 생기면 `using detail`을 연다.

**읽기 오류는 전부 `TransportError`다.** RLS는 읽기를 거부하지 않고 빈 결과를 준다.

## 서버 시각

**앱이 뜨면 `server_now()`를 한 번 부르고 차이를 든다.** `offset = server - Date.now()`. 화면은 `Date.now() + offset`을 쓴다. 탭이 돌아올 때(`visibilitychange`) 다시 받는다. 하루 띠가 매초 도는 것은 이 값이다 — 서버를 매초 안 부른다.

화면 시각은 보여주기용이다. 버튼이 켜지는 것, 카운트다운, 남은 시간이 여기 걸리고 판정은 함수의 `now()`다. 기기 시계를 바꿔 버튼을 켜도 눌러보면 `window_closed`가 온다.

## 푸시

**경로 둘, 함수 하나.** `notifications`에 행이 들어오면 Database Webhook이 Edge Function `send-push`를 부른다. pg_net은 한 번 쏘고 끝이라 놓친 것은 pg_cron의 `retry_push`가 매분 같은 함수를 다시 부른다.

**잡기와 성공은 다른 열이다.** 함수가 먼저 잡는다 — `update notifications set claimed_at = now(), push_attempts = push_attempts + 1 where id = any($1) and pushed_at is null and push_attempts < 5 and (claimed_at is null or claimed_at < now() - interval '2 minutes') returning *`. 잡힌 행만 보내고 성공한 행에만 `pushed_at`을 찍는다. 보내다 죽으면 2분 뒤 다시 잡힌다. `retry_push`가 보는 조건이 이 문장과 같아 두 경로가 같은 규칙을 탄다. 다섯 번 넘으면 그만둔다 — 앱을 열면 알림 행은 그대로 있다.

**Edge Function은 얼개다.** 알림 행 잡기 → `src/features/notification/model/`의 순수 함수로 payload와 처리 방법 정하기 → `npm:web-push`로 보내기 → 성공이면 `pushed_at`, 410이면 구독 지우기. 판단(어떤 실패가 재시도인가, 어떤 것이 구독 폐기인가)은 전부 `src/`의 순수 함수라 unit 테스트가 지킨다. 그 함수들은 Node 전용 API를 안 쓴다 — lint가 `src/features/notification/model/`에서 `node:` import를 막는다.

Deno가 `supabase/functions` 밖의 `src/`를 import할 수 있는지는 확인 안 됐다. 데이터 task의 첫 스파이크다 — 되면 `deno.json`이 경로를 맵핑하고, 안 되면 CI가 그 폴더를 `_shared/`로 복사한다(생성물, 커밋 안 함). 정본은 어느 쪽이든 `src/`다.

얼개 자체는 e2e가 본다. CI가 `supabase functions serve`를 띄우고 가짜 푸시 엔드포인트로 한 번 돌린다.

**비밀은 저장소 밖이다.** VAPID 키는 Edge Function secret이고 공개키만 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`로 브라우저에 간다. Webhook 트리거의 인증 헤더는 Vault에서 읽는다 — 트리거 정의에 리터럴로 넣으면 마이그레이션에 실려 PUBLIC 저장소에 올라간다.

## 서비스 키 자리

ADR-003이 「자리마다 문서에 먼저 적는다」고 한 것. 둘이고 둘 다 Edge Function 안이다. 브라우저와 Next 서버에는 없다.

- **`send-push`.** 사용자 세션 없이 돈다. `notifications`와 `push_subscriptions`만 만진다
- **`erase-account`.** `erase_profiles` cron이 `erased_at`을 찍은 뒤 이 함수를 불러 `auth.users`를 지운다. Admin API뿐이다. 지워지면 `user_id`가 null이 되는 것이 완료 표시라 큐 표가 따로 없다 — 다음 날 cron이 `erased_at`은 있고 `user_id`도 있는 행을 다시 부른다

## Free 플랜

pg_cron·Database Webhook·Edge Function 셋 다 Free에서 된다. 7일 무활동이면 프로젝트가 멈추고 셋이 같이 멈춘다 — 운영 중엔 매일 접속하니 안 걸리고, 출시 전 스테이징이 걸린다. Edge Function은 월 50만 회다.

## 아직 안 정한 것

- `emit_reminders`의 「주말은 금요일 저녁 9시에 묶어서」 — 함수 하나가 요일을 보고 가르는지, cron 항목을 요일별로 두는지
- `import_holidays`를 누가 누르나 — 관리자 버튼이면 브라우저가 공공 API를 부르고 결과를 함수에 넘긴다(CORS가 막으면 Edge Function). 연 1회라 자동화 안 한다
- realtime 구독을 어느 표에 거나 — [`../runtime/`](../runtime/)이 정한다
- 관리자에게만 보낸 교대 요청을 관리자가 어떻게 푸나 — [swap.md](../../domain/swap.md#아직-안-정한-것)가 열려 있다. 닫히면 `approve_swap`의 인자가 정해진다
- 알림 하나에 기기 구독이 둘일 때 — `pushed_at`이 행에 하나라 한 기기만 성공한 것을 못 나타낸다. 서른 명 규모에서 드물어 두고 본다
