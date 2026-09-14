# API

서버와 주고받는 경계가 산다. 경로, 입출력, 권한이다.

이 파일이 도메인을 가로지르는 것을 들고, 도메인마다의 함수는 같은 이름의 파일에 산다 — [`account.md`](account.md) · [`schedule.md`](schedule.md) · [`swap.md`](swap.md) · [`attendance.md`](attendance.md) · [`payroll.md`](payroll.md) · [`notification.md`](notification.md). 표의 모양은 [`../data-model/`](../data-model/)에 있고 여기는 그 표를 누가 어떻게 부르는지다.

## 경계 하나

**브라우저가 Supabase를 바로 부른다.** Next 서버는 로그인 게이트와 첫 페이지 껍데기만 준다. 권한을 RLS에 뒀으니 서버가 중간에 서서 검사할 것이 없고, Vercel 서버는 요청이 없으면 잠들어 깨우는 데 1~3초가 든다 — 출근 인증 버튼이 그걸 기다릴 이유가 없다. 오프라인 캐시도 브라우저가 Supabase를 직접 쥘 때 자연스럽다.

브라우저에 anon key가 보이는 것은 단점이 아니다. 그 키는 공개용이고 권한은 세션 토큰과 RLS가 정한다.

**데이터에 닿는 코드는 `dals`뿐이다.** `from()`·`rpc()`·`storage`·`channel()`이 여기서만 나온다. 화면과 use-case는 `dals` 함수를 부른다. `auth.*`(세션 확인·코드 교환·로그아웃)는 데이터가 아니라 `shared/lib`에 산다 — 도메인이 없고 로컬 Supabase가 구글 OAuth를 못 돌려 integration 테스트 대상도 아니다. 조항의 정본은 [ADR-003](../../adr/ADR-003-supabase-and-integration-tests.md#db-접근을-한곳에-모은다)이다.

Next 서버가 Supabase를 부르는 자리는 `auth.*`뿐이다 — `proxy`가 세션이 있는지 본다. 승인·차단·퇴사는 클라이언트가 `profiles`를 읽어 가른다([`../runtime/account.md`](../runtime/account.md)). 데이터를 읽거나 쓰는 서버 코드는 없다.

## 읽기

**`dals`가 표를 직접 `select`하고 PostgREST 임베딩으로 join한다.** 근무표 한 달은 `from('days').select('*, slots(*), assignments(*, profiles(display_name))')` 한 질의다. `assignments`는 `days`에서 바로 임베딩한다 — `slots`를 거치면 `slot_id`가 없는 교육 배정이 빠진다. 임베딩에는 `ended_at is null` 필터를 건다 — 화면은 이력을 안 그린다. 인증은 안 든다. 달력이 인증 상태를 안 그리고 명단이 그날치를 따로 읽는다([`../runtime/attendance.md`](../runtime/attendance.md)). RLS가 표마다 걸려 임베딩된 표도 걸러진다 — 근무자가 `wage_rates`를 임베딩해도 자기 행만 온다. 단 `grant select`가 없는 표는 빈 결과가 아니라 오류라, 새 표를 만들 때 grant를 빠뜨리면 그 표를 임베딩한 질의 전체가 죽는다.

뷰는 둘뿐이다. `excuse_status`(사유 글을 뺀 판정)와 `open_slots`(빈 자리). 둘 다 `security_invoker`라 RLS를 그대로 탄다. Supabase linter의 `security_definer_view`가 나머지를 잡는다.

임베딩 문자열은 런타임에서만 틀린다. 표가 바뀌면 `dals`의 integration 테스트가 잡는다 — `dals` 함수의 짝 테스트는 integration으로 쓴다. 훅은 unit도 통과시키니 이건 `implementer` 정의문과 `pr-diff`가 본다.

한 질의는 `max_rows`(지금 1000)에서 잘린다. 잘려도 오류가 아니다. 알림처럼 안 지우고 쌓이는 표는 첫 사람이 1000에 닿기 전에 `range()`를 건다 — 어느 표부터인지는 [`../runtime/`](../runtime/)이 정한다.

**타입은 표에서 뽑는다.** `supabase gen types typescript --local > src/shared/api/database.types.ts`. 파일을 저장소에 넣고 CI가 마이그레이션 뒤 다시 뽑아 diff가 0인지 본다 — 표를 바꾸고 타입을 안 뽑으면 빨간불이다. CLI 버전이 다르면 포맷이 달라 헛빨간불이 나니 CI는 로컬과 같은 버전을 박는다. `pnpm types`가 그 명령을 감싼다. 지금은 `pnpm types`도 CI 검사도 없다 — `backlog.md` 「타입 생성 절차」가 세운다.

## 쓰기

**쓰기는 Postgres 함수고 `dals`가 `rpc()`로 부른다.** 이유는 [`../data-model/`](../data-model/#쓰기-함수)에 있다. 함수 목록은 도메인 파일에 있고 여기는 규칙이다.

### 이름과 자리

`<동사>_<목적어>` snake_case다. 동사는 도메인 문서의 행위 이름을 따른다 — 승인은 `approve`, 확정은 `confirm`, 강제 변경은 `force`. 마이그레이션 파일은 도메인마다 하나(`<날짜>_<도메인>_functions.sql`)고 함수는 그 안에 모인다.

**호출자가 있는 함수는 `public`, 없는 함수는 `internal` 스키마다.** `public`의 함수는 전부 PostgREST `/rpc/`로 노출되고 로그인한 누구나 부른다. pg_cron이 부르는 함수를 `public`에 두면 근무자가 devtools에서 `expire_requests()`를 불러 남의 요청을 만료시킨다. `internal`은 PostgREST가 모르는 스키마라 까먹으면 새는 쪽이 아니라 안 도는 쪽으로 틀린다.

누구나 부르는 것은 `server_now()` 하나다.

### 함수 안의 규칙

- 첫 줄이 호출자 검사다. `auth.uid()`로 프로필을 찾고 `is_admin()`·`is_approved()`를 본다. 검사가 없는 함수는 구멍이라 함수 PR은 그 검사의 integration 테스트를 같이 낸다
- 시각 판정은 `now()`다. 인자로 시각을 받지 않는다 — 기기 시계가 들어올 자리가 없다. 예외는 `check_in`의 `reported_at` 하나고 한도가 붙는다([`attendance.md`](attendance.md))
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
| `already_done` | 재시도가 두 번 닿아 이미 쓴 행이 있다 | 성공으로 처리 |
| `already_assigned` | 그날 이미 다른 자리에 든 사람이다 | 관리자 화면이 자리 합치기를 안내 |
| `not_qualified` | 포지션 자격이 없다 | 관리자 컨펌 시트 |
| `window_closed` | 인증 창·요청 마감·취소 마감 밖이다 | 버튼이 잘못 켜진 것. 새로 읽기 |
| `too_early` | 신청 마감 전에 확정하려 했다 | 마감일 당기기 안내 |
| `too_far`, `invalid_qr` | 홀 반경 밖, 옛 코드 | 인증 화면 문안 |
| `last_admin` | 마지막 관리자를 내리려 했다 | 문안 |
| `has_future_assignments` | 앞 배정이 남은 사람을 퇴사 처리했다 | 남은 자리 목록은 화면이 먼저 읽어 보여준다 |
| `not_allowed` | 관리자 검사에 걸렸거나 RLS 거부(`42501`) | 버튼이 잘못 켜진 것. 새로 읽기 |

**`stale`은 닫혔거나 없는 행이다.** 배정·자리·요청이 바뀌면 옛 행이 닫히고 새 행이 선다([`../data-model/schedule.md`](../data-model/schedule.md#배정)). 확정 전에는 행이 지워진다. 화면이 들고 있던 id가 그 둘 중 하나면 함수가 `stale`을 던진다. 버전 열 없이 「상태가 바뀜」을 잡는다.

**오류에 데이터를 싣지 않는다.** 코드 하나면 화면이 새로 읽는다. 목록이 필요한 자리(퇴사의 남은 배정)는 버튼을 누르기 전에 화면이 읽어둔다. 실을 것이 셋째로 생기면 `using detail`을 연다.

**읽기 오류는 전부 `TransportError`다.** RLS는 읽기를 거부하지 않고 빈 결과를 준다.

## 서버 시각

**앱이 뜨면 `server_now()`를 한 번 부르고 차이를 든다.** `offset = server - Date.now()`. 화면은 `Date.now() + offset`을 쓴다. 탭이 돌아올 때(`visibilitychange`) 다시 받는다. 하루 띠가 매초 도는 것은 이 값이다 — 서버를 매초 안 부른다.

화면 시각은 보여주기용이다. 버튼이 켜지는 것, 카운트다운, 남은 시간이 여기 걸리고 판정은 함수의 `now()`다. 기기 시계를 바꿔 버튼을 켜도 눌러보면 `window_closed`가 온다. 언제 다시 받고 오프라인이면 어쩌나는 [`../runtime/`](../runtime/#시각)이 정한다.

## 서비스 키 자리

ADR-003이 「자리마다 문서에 먼저 적는다」고 한 것. 둘이고 둘 다 Edge Function 안이다. 브라우저와 Next 서버에는 없다.

- **`send-push`** — [`notification.md`](notification.md#푸시)
- **`erase-account`** — [`account.md`](account.md#비우기)

## Free 플랜

pg_cron·Database Webhook·Edge Function 셋 다 Free에서 된다. 7일 무활동이면 프로젝트가 멈추고 셋이 같이 멈춘다 — 운영 중엔 매일 접속하니 안 걸리고, 출시 전 스테이징이 걸린다. Edge Function은 월 50만 회다.

## 아직 안 정한 것

도메인에 속하는 미정은 각 파일 끝에 있다. 가로지르는 것은 지금 없다.
