# 데이터 접근

테이블과 관계가 산다. 실제 스키마의 정본은 `supabase/migrations/`고 여기는 그 지도와 근거를 담는다.

서버와 주고받는 경계가 산다. 경로, 입출력, 권한이다.

## 공유 데이터

### 테이블 목록

| 테이블 | 파일 | 한 줄 |
| --- | --- | --- |
| `halls` | 여기 | 홀 하나. 좌표·반경, 자리 기본값, 근무 시간 기본값 |

나머지 행은 각 영역 design의 「소유 데이터」에 있다.

### 홀

- 적용 범위: `halls(id, lat, lng, radius_m, default_slots jsonb, default_starts, default_ends)`
- 기본 계약: 지금은 한 행이고 둘째 홀이 생기면 행을 더한다([attendance/README.md](../modules/attendance/README.md)). 좌표·반경은 전원이 읽는다
- `default_slots`는 **배열**이다 — `[{"positions": ["팀장"], "count": 1}, …]`. 항목 하나가 `slots` 행 `count`개로 펴지고 `positions`가 그 행의 `text[]`다. 객체(`{포지션: 인원}`)가 아닌 이유 둘 — jsonb가 키 순서를 안 지키는데 [SCH-011](../modules/schedule/README.md#sch-011)의 아홉 줄이 화면 표시 순서이고, 객체로는 겸임([SCH-015](../modules/schedule/README.md#sch-015))을 못 담는다
- **포지션 표시 순서의 정본이 그 배열이다.** `slots`에 순번 열을 두지 않는다 — 자리를 합치고 가르면 행마다 든 순번을 다시 매겨야 하고 순서가 두 곳에 산다. 화면은 `halls.default_slots`의 순서로 포지션 줄을 세우고 거기 없는 포지션은 뒤에 붙인다. `slots`를 읽는 질의는 순서를 `ORDER BY` 없이 기대하지 않는다
- 예외: QR 코드 값은 `hall_secrets`로 갈라 관리자만 읽는다 — 그 표는 [`attendance/design.md`](../modules/attendance/design.md)에 있다

## 스키마·타입 규약

### 저장하는 사실

- 적용 범위: 모든 표의 열
- 기본 계약: **사실은 DB에, 상태는 계산한다.** 출근 상태·급여·자격·빈 자리는 저장하지 않는다. 인증 시각, 살아 있는 배정, 시급 행 같은 사실만 두고 TypeScript 순수 함수가 상태를 낸다
- 이유: 잠든 행이 없으니 배치가 없다

### 이력

- 적용 범위: 배정·자리·시급
- 기본 계약: **이력은 닫고 새로 만든다.** 배정·자리·시급이 바뀌면 옛 행에 `ended_at`을 찍고 새 행을 만든다. 살아 있는 것은 `ended_at is null`이다

### 컬럼 이름 규칙

- 적용 범위: 모든 표의 열 이름
- 기본 계약:
  - 시점은 `<동사>_at` — `approved_at`, `ended_at`, `checked_at`, `read_at`
  - 날짜는 `<명사>_date` — `work_date`, `effective_date`
  - 사람 참조는 `profile_id`. 행위자를 따로 적을 때는 `<동사>_by` — `ended_by`, `granted_by`
  - 상태 열은 두지 않는다. 예외는 `request_candidates.status`뿐이다
  - 도메인 용어와의 대응: 자리=`slots`, 배정=`assignments`, 근무 신청=`availabilities`, 근무 요청·교대=`requests`, 근무 취소=`cancel_requests`, 인증=`check_ins`, 사유=`excuses`, 조정=`adjustments`, 시급=`wage_rates`, 자격 부여=`position_grants`
- 구현 참조: `supabase/migrations/`

### 생성 타입

- 적용 범위: `dals`가 쓰는 생성 타입
- 기본 계약: **타입은 표에서 뽑는다.** `supabase gen types typescript --local > src/shared/api/database.types.ts`. 파일을 저장소에 넣고 CI가 마이그레이션 뒤 다시 뽑아 diff가 0인지 본다 — 표를 바꾸고 타입을 안 뽑으면 빨간불이다. CLI 버전이 다르면 포맷이 달라 헛빨간불이 나니 CI는 로컬과 같은 버전을 박는다. `pnpm types`가 그 명령을 감싼다
- 구현 참조: 아직 없음 — 지금은 `pnpm types`도 CI 검사도 없다. [`backlog.md`](../../backlog.md)의 `types-generation`이 세운다

## 읽기·쓰기 경계

### 읽기

- 적용 범위: `dals`가 보내는 읽기 질의와 그것이 쓰는 표·뷰
- 기본 계약:
  - **`dals`가 표를 직접 `select`하고 PostgREST 임베딩으로 join한다.** 근무표 한 달은 `from('days').select('*, slots(*), assignments(*, profiles(display_name))')` 한 질의다. `assignments`는 `days`에서 바로 임베딩한다 — `slots`를 거치면 `slot_id`가 없는 교육 배정이 빠진다. 임베딩에는 `ended_at is null` 필터를 건다 — 화면은 이력을 안 그린다. 인증은 안 든다
  - 뷰는 둘뿐이다. `excuse_status`(사유 글을 뺀 판정)와 `open_slots`(빈 자리). `open_slots`는 `security_invoker`라 RLS를 그대로 탄다. **`excuse_status`만 `security_definer`다** — `excuses`의 RLS가 본인과 관리자라 `security_invoker`로 두면 남의 판정이 0행이고 뷰가 존재할 이유가 사라진다. 대신 뷰 몸통이 `where public.is_approved()`를 들어 기본 읽기 계약을 지킨다. 낼 열에서 글을 이미 뺐으니 정의자 권한으로 읽어도 새는 것이 없다. Supabase linter의 `security_definer_view`가 이 뷰를 잡으니 예외로 적어둔다
  - 한 질의는 `max_rows`(지금 1000)에서 잘린다. 잘려도 오류가 아니다. 알림처럼 안 지우고 쌓이는 표는 첫 사람이 1000에 닿기 전에 `range()`를 건다 — 어느 표부터인지는 [system/runtime.md](runtime.md#읽기-범위)가 정한다
- 이유: 달력이 인증 상태를 안 그리고 명단이 그날치를 따로 읽는다([`attendance/design.md`](../modules/attendance/design.md)). RLS가 표마다 걸려 임베딩된 표도 걸러진다 — 근무자가 `wage_rates`를 임베딩해도 자기 행만 온다. 임베딩 문자열은 런타임에서만 틀린다. 표가 바뀌면 `dals`의 integration 테스트가 잡는다 — `dals` 함수의 짝 테스트는 integration으로 쓴다. 훅은 unit도 통과시키니 이건 `implementer` 정의문과 `pr-diff`가 본다
- 예외: `grant select`가 없는 표는 빈 결과가 아니라 오류라, 새 표를 만들 때 grant를 빠뜨리면 그 표를 임베딩한 질의 전체가 죽는다

### 쓰기 함수

- 적용 범위: 화면과 use-case가 일으키는 모든 쓰기
- 기본 계약: 함수 안에서 「호출자가 관리자인가」·「승인됐나」를 검사한다. 이 검사를 빠뜨린 함수가 구멍이라 함수를 만드는 PR은 그 검사의 integration 테스트를 같이 낸다. 목록과 규칙은 [쓰기](#쓰기)에 있다
- 이유: 관리자 쓰기(가입 승인, 근무표 확정, 기본 시급 변경, 퇴사 처리)가 함수여야 하는 이유는 컬럼 권한이 역할 단위라서다 — `authenticated`에 `approved_at` 갱신을 열면 본인이 자기 승인을 채운다. 근무자 쓰기(근무 신청 덮어쓰기, 근무 요청 수락, 출근 인증)가 함수여야 하는 이유는 선착순·서버 시각·여러 행 덮어쓰기가 전부 한 트랜잭션이어야 해서다. supabase-js에는 트랜잭션이 없다

### 쓰기

- 적용 범위: 데이터를 바꾸는 모든 호출
- 기본 계약: **쓰기는 Postgres 함수고 `dals`가 `rpc()`로 부른다.** 화면과 use-case는 `dals`를 부르고, `dals`가 `supabase.rpc()`로 Postgres 함수(security definer)를 부른다. 함수 목록은 도메인 파일에 있고 여기는 규칙이다
- 이유: [쓰기 함수](#쓰기-함수)에 있다
- 예외: 테이블에 직접 쓰는 정책은 `profile_private` 본인 행(연락처) 하나뿐이다 — 사진은 `profiles`에 있어 `update_my_photo()` 함수다

### 이름과 자리

- 적용 범위: 쓰기 함수의 이름과 스키마와 마이그레이션 파일
- 기본 계약: `<동사>_<목적어>` snake_case다. 동사는 도메인 문서의 행위 이름을 따른다 — 승인은 `approve`, 확정은 `confirm`, 강제 변경은 `force`. 마이그레이션 파일은 도메인마다 하나(`<날짜>_<도메인>_functions.sql`)고 함수는 그 안에 모인다. **호출자가 있는 함수는 `public`, 없는 함수는 `internal` 스키마다**
- 이유: `public`의 함수는 전부 PostgREST `/rpc/`로 노출되고 로그인한 누구나 부른다. pg_cron이 부르는 함수를 `public`에 두면 근무자가 devtools에서 `expire_requests()`를 불러 남의 요청을 만료시킨다. `internal`은 PostgREST가 모르는 스키마라 까먹으면 새는 쪽이 아니라 안 도는 쪽으로 틀린다
- 예외: 누구나 부르는 것은 `server_now()` 하나다

### 함수 안의 규칙

- 적용 범위: `public`·`internal`의 모든 쓰기 함수
- 기본 계약:
  - 첫 줄이 호출자 검사다. `auth.uid()`로 프로필을 찾고 `is_admin()`·`is_approved()`를 본다. 검사가 없는 함수는 구멍이라 함수 PR은 그 검사의 integration 테스트를 같이 낸다
  - **승인 전에 불려야 하는 함수는 `is_approved()`를 안 쓴다.** 프로필 내기·사진 올리기·알림 켜기·기기 주소 저장·읽음 찍기가 그렇다 — 승인 대기 화면이 부르는 것들이고, 가입 승인 알림이 승인 전에 가야 해서 그 배달 경로도 여기 든다([notification/README.md NTF-006](../modules/notification/README.md#ntf-006)). 대신 `auth.uid()`로 `profiles` 행이 잡히고 그 행의 `blocked_at`·`left_at`이 둘 다 널인지를 본다. **승인 대기 중인 사람이 불러서 성공하는 것을 integration이 단언한다** — 안 그러면 다음 사람이 관성으로 `is_approved()`를 붙인다
  - 시각 판정은 `now()`다. **`public` 함수는 인자로 시각을 받지 않는다** — 기기 시계가 들어올 자리가 없다. 예외는 `check_in`의 `reported_at` 하나고 한도가 붙는다([`attendance/design.md`](../modules/attendance/design.md))
  - **`internal` 함수는 호출자 검사를 안 한다.** 껍데기가 이미 했고, 알맹이가 다시 하면 테스트가 못 부른다. 대신 `p_profile_id` 같은 인자를 그대로 믿으니 **노출되면 그 순간 남의 이름으로 쓰는 구멍이다.** 막는 것은 `revoke all on schema internal`과 `revoke all on all functions in schema internal` 두 줄과 `config.toml`의 노출 스키마 목록이라, **그 셋이 뚫렸을 때 빨개지는 integration 테스트를 같이 낸다** — 없으면 뚫려도 아무것도 안 빨갛다. **인자로 신원을 안 받는 `internal` 함수는 이 테스트가 없어도 된다.** `auth.uid()`만 보는 함수는 노출돼도 부르는 사람 자신을 낼 뿐이라 막을 구멍이 처음부터 없다 — 요구가 걸리는 것은 신원을 인자로 받는 함수다
  - **`internal` 함수는 `security invoker`다 — 위의 「`security definer`」에 대한 의도된 예외다.** 호출자 권한으로 돌아서, 스키마가 노출되고 함수 실행권이 풀려도 표의 `insert` 권한과 RLS 정책이 아직 막는다. 방어가 한 겹이 아니라 세 겹인 이유가 이것이다. **관례에 맞추려고 `security definer`로 고치면 그 두 겹이 한 번에 사라진다** — 고치지 마라
  - **시각 경계가 든 알맹이는 `internal`에 두고 `p_now timestamptz`를 받는다.** `public` 껍데기가 `now()`를 넘기는 유일한 호출자고, `internal`은 PostgREST가 모르는 스키마라 클라이언트가 못 부른다 — 기기 시계를 막는 축은 그대로다. 이렇게 안 가르면 경계 테스트가 실제 시계에 걸린다. 인증 창이 「그날 18시까지」라 한국 시각 18~23시에는 열린 창을 만들 방법 자체가 없고, cron이 부르는 함수도 그 시각이 와야 돈다. integration은 `internal`을 직접 불러 경계를 보고, `public`은 껍데기가 `now()`를 넘긴다는 것만 본다
  - 여러 행을 바꾸는 것은 전부 한 함수 안이다. 기본 시급 변경이 서른 행을 넣다 끊기면 전부 되돌아간다
  - 사건 알림은 같은 함수 안에서 `notifications`에 넣는다
  - `security definer`, `set search_path = ''`, 표는 스키마를 붙여 부른다(`public.profiles`)
  - 함수는 상수를 리터럴로 든다. 정본은 TypeScript고 대조 테스트가 맞춘다([system/runtime.md](runtime.md#업무-상수))
  - unique·check 제약에 닿기 전에 검사해 코드를 던진다. 제약이 먼저 걸리면 화면이 「다시 시도」를 시킨다
  - **검사 순서는 거친 것부터다.** 호출자 → 자격(배정이 있나·관리자인가) → 시각 창 → 값 검사(위치·코드·글) → 중복. 화면이 받는 코드가 원인을 가리켜야 하는데, 아직 열리지도 않은 날에 찍은 사람에게 「QR이 올바르지 않아요」를 말하면 원인을 못 찾는다. 두 조건이 같이 틀렸을 때 어느 코드가 나가는지를 테스트가 단언한다

## 인증·권한

### 읽기 RLS 기본값

- 적용 범위: 모든 표의 읽기 정책
- 기본 계약: **기본은 「승인된 사람 전원 읽기」다.** `is_approved()`·`is_admin()` 두 SQL 함수를 모든 정책이 공유한다. 둘은 `security definer`·`stable`·`search_path = ''`다. 둘 다 `left_at`·`blocked_at`이 비어 있어야 참이다 — 퇴사하거나 차단된 관리자의 세션이 관리자 함수를 못 부른다. 좁히는 표는 이렇다. 안 적은 표는 기본값이다. 행은 각 영역 design의 소유 데이터에 있다. 정책을 고치는 PR은 그 정책의 integration 테스트를 같이 낸다(ADR-003)
- 이유: 날·자리·배정·요청·인증 상태처럼 전원이 보는 표가 다수라 기본값과 맞는다. **막는 것은 화면이 아니라 데이터다** — 시급·급여·개인정보·QR 값은 RLS가 행 단위로 막을 수 있게 표를 가른다. `profiles` 정책이 `profiles`를 읽는 함수를 부르면 재귀에 걸린다. 왜 좁히는지는 각 도메인 파일에 있다. 새 표에 좁히기를 까먹으면 새는 쪽으로 틀린다. **RLS를 안 켠 표는 `tests/lint/table-rls.ts`가 잡는다** — 표마다 손으로 쓴 정책 테스트는 정의상 「새 표를 까먹는 것」을 못 잡는다. 그 표를 아무도 안 건드리니 아무것도 안 빨갛다
- 예외: 승인 전은 자기 `profiles`·`profile_private` 행만 읽는다(ADR-003). 퇴사자는 자기 행만이다 — 자기 배정·인증·시급과 그 배정이 든 `days`. 남의 지난 기록도 안 연다([account/README.md](../modules/account/README.md#acc-011))

### 서비스 키 자리

- 적용 범위: service role 키를 쥐는 코드
- 기본 계약: 둘이고 둘 다 Edge Function 안이다. 앱 번들에는 없다
  - **`send-push`** — [`notification/design.md`](../modules/notification/design.md#푸시-보내기)
  - **`erase-account`** — [`account/design.md`](../modules/account/design.md#비우기)
- 이유: ADR-003이 「왜 필요한지를 이 문서에 먼저 적는다」고 한 자리다. 둘이다
  - `auth.users` 삭제 — Admin API뿐이다([`account/design.md`](../modules/account/design.md#퇴사-1년-뒤))
  - Edge Function이 `notifications.pushed_at`을 찍는 것 — 함수는 사용자 세션 없이 돈다([`notification/design.md`](../modules/notification/design.md))

## 결과·오류 계약

### 오류의 모양

- 적용 범위: 쓰기 함수의 실패와 `dals`가 화면에 주는 오류
- 기본 계약: **함수는 실패를 예외로 던지고, 메시지가 고정 코드다.** `raise exception using message = 'slot_full'`. `dals`가 예외를 둘로 가른다
  - `DomainError` — 메시지가 코드 목록에 있는 것. 코드 목록은 `src/shared/api/error-codes.ts`가 정본이고 대조 테스트가 마이그레이션의 `raise` 문자열과 맞춘다. 그 파일이 내는 이름은 `ERROR_CODES` 하나고 문자열 리터럴 배열이다 — 영역마다 코드를 더하는 task가 여럿이라 이름이 갈리면 대조가 한쪽만 읽는다
  - `TransportError` — 그 밖의 전부. 통신 실패, 타임아웃, 모르는 코드
- 이유: 예외라 트랜잭션이 저절로 되돌아간다. **오류에 데이터를 싣지 않는다** — 코드 하나면 화면이 새로 읽는다. 목록이 필요한 자리(퇴사의 남은 배정)는 버튼을 누르기 전에 화면이 읽어둔다. **`stale`은 닫혔거나 없는 행이다** — 배정·자리·요청이 바뀌면 옛 행이 닫히고 새 행이 선다([`schedule/design.md`](../modules/schedule/design.md#배정)). 확정 전에는 행이 지워진다. 화면이 들고 있던 id가 그 둘 중 하나면 함수가 `stale`을 던진다. 버전 열 없이 「상태가 바뀜」을 잡는다
- 예외: **읽기 오류는 전부 `TransportError`다.** RLS는 읽기를 거부하지 않고 빈 결과를 준다. 실을 것이 셋째로 생기면 `using detail`을 연다

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
| `last_admin` | 마지막 관리자를 내리거나 퇴사 처리하려 했다 | 문안 |
| `already_decided` | 이미 승인·거절·차단된 사람을 다시 처리했다 | 시트 닫고 새로 읽기 |
| `invalid_gender`, `invalid_phone`, `invalid_name`, `invalid_role` | 값의 꼴이 규칙 밖이다 — 화면이 먼저 막으니 함수가 마지막 문이다 | 버튼이 잘못 켜진 것. 새로 읽기 |
| `has_future_assignments` | 앞 배정이 남은 사람을 퇴사 처리했다 | 남은 자리 목록은 화면이 먼저 읽어 보여준다 |
| `not_allowed` | 호출자 검사에 걸렸거나 RLS 거부(`42501`) | 버튼이 잘못 켜진 것. 새로 읽기 |

**거절은 `not_allowed` 하나다.** 승인 전이라 막힌 것과 관리자가 아니라 막힌 것을 코드로 가르지 않는다 — 화면이 그 차이로 하는 일이 없고, 가르면 안 부를 사람에게 왜 막혔는지를 알려주는 꼴이다.
