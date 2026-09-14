# 런타임

돌아갈 때의 규칙이 산다. 언제 다시 읽나, 무엇을 먼저 그리나, 어긋나면 누가 이기나다.

[`../data-model/`](../data-model/)이 무엇을 저장하는지를 말하고 [`../api/`](../api/)가 어떻게 주고받는지를 말한다면, 여기는 그 위에서 시간과 순서를 다룬다. 이 파일이 가로지르는 것을 들고, 도메인마다의 것은 같은 이름의 파일에 산다 — [`account.md`](../../modules/account/design.md) · [`schedule.md`](schedule.md) · [`swap.md`](swap.md) · [`attendance.md`](attendance.md) · [`payroll.md`](payroll.md) · [`notification.md`](notification.md).

## 캐시 네 계층

| 계층 | 결정 |
| --- | --- |
| Service Worker | 앱 껍데기(HTML·JS·CSS·서체·아이콘)를 Serwist로 미리 캐시한다. 데이터 요청은 안 만진다. 푸시 수신이 여기 산다 |
| TanStack Query | 데이터의 유일한 캐시. IndexedDB에 영속해 마지막 응답이 다음 진입에 바로 뜬다 |
| Next.js 서버 | `proxy`가 세션 쿠키만 본다. 화면 라우트는 서버 데이터 없이 빌드된 정적 껍데기다 |
| Supabase realtime | 안 쓴다 |

**realtime을 안 쓰는 이유.** 서른 명·홀 하나라 남이 바꾸는 일이 분에 한 번도 안 된다. 선착순은 함수가 풀었고(`slot_full`) 동시 편집은 `stale`이 잡는다 — 막히지 않고 늦게 안다. 소켓 연결·재연결·배터리를 치를 값이 없다.

**서버가 승인을 판정하지 않는 이유.** 승인·차단·퇴사를 서버가 HTML에 그리면 그 HTML이 세션마다 달라 Service Worker가 캐시할 수 없고, 오프라인에 앱이 안 뜬다. 그래서 `proxy`는 세션이 없으면 `/login`으로 보내는 것까지만 하고, 승인·차단·퇴사는 앱이 뜬 뒤 클라이언트가 `['profile']`을 읽어 가른다 — [`account.md`](../../modules/account/design.md). 브라우저가 Supabase를 바로 부르니([`../api/`](../api/#경계-하나)) 서버가 데이터를 그릴 이유도 없다.

## TanStack Query 규칙

- **키는 `[도메인, 범위]`다.** `['schedule', '2026-09']`, `['attendance', '2026-09-20']`, `['notifications']`, `['payroll', '2026-09']`, `['profile']`. 도메인 파일이 각자의 키를 적는다
- **`staleTime`은 30초, `gcTime`은 7일이다.** 30초 안에 같은 화면을 오가면 안 다시 읽고, 7일 안 열면 캐시가 지워진다. 근무표는 달 단위라 지난달이 7일 뒤 지워져도 다시 읽으면 된다
- **다시 읽는 때 셋.** 화면 진입, 탭 복귀(`refetchOnWindowFocus`), 쓰기 성공 뒤 무효화. 폴링은 없다
- **`networkMode`는 `'always'`다.** 기본값 `'online'`은 오프라인이면 요청을 멈춰뒀다가 복귀 때 자동으로 보낸다 — 쓰기가 사람 모르게 큐에 드는 셈이다. `'always'`면 바로 실패하고 「다시 시도」가 사람 손에 남는다
- **영속은 `persistQueryClient` + IndexedDB다.** `maxAge`는 `gcTime`과 같다. `buster`는 빌드 id다 — 배포로 응답 모양이 바뀌면 옛 캐시를 통째로 버린다. `['profile']`과 `['hall', 'qr']`는 영속하지 않는다(`shouldDehydrateQuery`) — 차단된 사람이 옛 프로필로 근무표를 보거나 옛 QR로 인증하는 일이 없게. 로그아웃·퇴사·차단이면 전부 지운다
- **복원 중(`isRestoring`)에는 아무것도 안 그린다.** 스켈레톤도 아니다. IndexedDB에서 돌아오는 데 수십 ms라 스켈레톤을 그리면 깜빡인다

## 무효화 표

쓰기 함수가 성공하면 무효화하는 키다. 도메인 파일은 이 표를 가리키고 따로 적지 않는다 — 흩어 적으면 어긋나도 아무도 못 본다.

**규칙 하나.** `['schedule']`을 무효화하는 함수는 `['payroll']`도 무효화한다 — 급여는 배정에서 계산한다.

| 함수 | 무효화 |
| --- | --- |
| `create_schedule` · `set_application_deadline` · `confirm_schedule` · `open_day` · `close_day` · `set_day_hours` · `add_slot` · `remove_slot` · `merge_slots` · `split_slot` · `add_assignment` · `remove_assignment` · `force_change` | `['schedule']` `['payroll']` `['requests']` |
| `send_work_request` · `respond_request` · `approve_swap` · `create_swap_request` · `create_cancel_request` · `decide_cancel_request` | `['schedule']` `['payroll']` `['requests']` |
| `submit_availability` | `['availability']` |
| `grant_position` | `['members']` |
| `check_in` | `['attendance', 그날]` |
| `submit_excuse` · `decide_excuse` | `['attendance', 그날]` `['excuses']` `['payroll']` |
| `set_wage` · `reset_wage_to_default` · `set_default_wage` · `set_adjustment` | `['payroll']` |
| `approve_member` | `['members']` `['payroll']` |
| `reject_member` · `block_member` · `unblock_member` · `set_role` · `mark_leave` · `undo_leave` | `['members']` |
| `set_display_name` · `submit_profile` | `['profile']` `['members']` `['schedule']` |
| `set_hall_location` · `set_hall_defaults` | `['hall']` |
| `rotate_qr` | `['hall', 'qr']` |
| `post_announcement` · `mark_notifications_read` | `['notifications']` |
| `save_push_subscription` · `remove_push_subscription` | 없음 |

## 오프라인

**앱이 메모리에 살아 있으면 마지막 본 화면이 그대로 뜨고 「통신 없음」 띠가 붙는다.** 홀에서 「오늘 누가 오나」를 보는 게 주 용도라 그 화면이 오프라인에서도 보여야 한다. 쓰기 버튼은 잠긴다.

**완전히 새로 뜨는데 오프라인이면 「통신 없음」 화면이다.** `['profile']`을 영속하지 않아 승인·차단을 가를 수 없다. 껍데기는 Service Worker가 주니 흰 화면은 아니다.

띠는 `navigator.onLine`이 아니라 **실제 요청 실패**로 뜬다. `onLine`은 와이파이에 붙었지만 인터넷이 안 되는 상태를 못 가른다. 다시 읽기가 성공하면 띠가 진다.

**쓰기는 큐에 넣지 않는다.** 언제 갈지 모르는 쓰기는 사람이 「됐다」고 믿고 가버리는 것이 문제다. 출근 인증만 예외적으로 화면이 열린 동안 다시 시도한다 — [`attendance.md`](attendance.md).

## 시각

**앱이 뜨면 `server_now()` 한 번, 그 차이를 기기 시계에 더해 쓴다.** 탭 복귀 때 다시 받는다. 오프셋은 `localStorage`에 남겨 오프라인으로 뜨면 마지막 값을 쓰고, 없으면 0이다. 하루 띠·카운트다운·버튼 켜짐이 이 값이고 매초 도는 것은 로컬 계산이다. 판정은 함수의 `now()`다 — [`../api/`](../api/#서버-시각). 예외는 출근 인증의 `reported_at` 하나다.

## 경쟁 조건 기본값

**뒤에 온 쪽이 진다. 막지 않고 `stale`로 알린다.** 관리자 둘이 같은 자리를 고치면 앞이 배정 행을 닫고 새 행을 만들었으니 뒤의 함수가 닫힌 id를 받아 `stale`을 던진다. 화면은 「이 근무가 바뀌었어요」를 보이고 다시 읽는다. 잠금·편집 중 표시는 없다 — 관리자가 여럿이어도 같은 날을 동시에 고치는 일은 드물다.

선착순(근무 요청 수락)은 함수가 한 트랜잭션에서 풀어 첫 사람만 통과한다. 화면은 `slot_full`을 받아 토스트로 말한다. 도메인마다의 경쟁은 각 파일에 있다.

## 낙관적 업데이트

**되돌릴 수 있고 남과 안 겹치는 것만 즉시 칠한다.** 근무 신청 체크, 알림 읽음, 프로필 연락처. 실패하면 되돌리고 토스트.

**남과 겹치거나 되돌릴 수 없는 것은 응답을 기다린다.** 근무 요청 수락, 교대 승인, 출근 인증, 확정. 버튼이 스피너를 물고 잠긴다.

## 로딩

- **화면 첫 진입에 데이터가 없으면 스켈레톤이다.** 최종 모양의 회색 덩이라 데이터가 와도 레이아웃이 안 튄다. 조각은 `components.md`에 올린다
- **캐시가 있으면 로딩 표시가 없다.** 옛 데이터를 보이고 뒤에서 갱신한다. 값이 바뀌면 그 자리만 바뀐다
- **보내는 중인 버튼은 글자 자리에 스피너다.** 이미 토큰이 있다
- **앱 스플래시는 OS 몫이다.** `manifest`의 배경색·아이콘으로 OS가 그린다

## 재시도

- **읽기**는 TanStack Query 기본값(3회, 지수 백오프). 실패하면 캐시가 있으면 캐시 + 띠, 없으면 실패 화면
- **쓰기**는 재시도하지 않는다. `TransportError`면 시트를 열어둔 채 「다시 시도」 버튼이고 사람이 누른다. 예외는 출근 인증 하나
- **재시도해도 안전한 함수는 두 번 불려도 한 번만 쓴다.** `check_in`이 `already_done`을 던지는 것이 그 규칙이다

## 읽기 범위

`max_rows`가 1000이라 그 안에 드는 표는 한 질의다. 근무표 한 달, 급여 한 달, 프로필 서른. 임베딩은 살아 있는 행만 받는다 — `ended_at is null`을 건다. 이력은 화면이 안 그린다.

**범위 없이 읽는 키가 문제다.** 쌓이는 표는 여럿이지만 화면이 전체를 읽는 키는 셋이다.

- `['notifications']` — `useInfiniteQuery` + `range()` 50건. 영속은 첫 세 페이지(`maxPages`)
- `['requests']` — 살아 있는 것과 닫힌 지 30일 안
- `['excuses']` — 달 단위 `['excuses', 'YYYY-MM']`

통계가 여러 달을 합칠 때는 달마다 질의한다.

## 아직 안 정한 것

- 달 키의 범위 — 달력 달인지 근무표 주 범위인지는 [`../data-model/`](../data-model/#아직-안-정한-것)이 열어뒀다. `['schedule']`·`['payroll']`·`['availability']` 키가 그 결정에 딸린다
- iOS 홈 화면 앱에서 `visibilitychange`가 앱 전환마다 오는지 — 탭 복귀 재조회와 시각 재동기화가 이 이벤트에 산다. 기기 테스트
- 화면 사이 전환 모션 — `motion.md` 몫이다
- 「통신 없음」 띠의 모양 — `components.md`에 없다. 알림 블록의 중립 종류가 후보다
