# 알림 — 설계

짝은 [README.md](README.md)다. 알림의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

업무 규칙은 [README.md](README.md#업무-규칙)의 `NTF-001`부터 `NTF-035`까지다.

공통 스키마·권한·컬럼 규약과 읽기·쓰기·타입·에러 계약은 [system/data-access.md](../../system/data-access.md), 캐시 계층·시각은 [system/runtime.md](../../system/runtime.md), 시스템 경계는 [system/architecture.md](../../system/architecture.md)를 따른다.

## 소유 데이터

표는 `notifications`·`push_tokens` 둘이다.

| 테이블 | 파일 | 한 줄 |
| --- | --- | --- |
| `notifications` | notification | 사람에게 간 알림 하나. 읽음·잡음·성공 시각 |
| `push_tokens` | notification | 알림을 받을 기기 하나의 주소 |

읽기 RLS는 기본값을 좁힌다.

| 표 | 누가 읽나 |
| --- | --- |
| `notifications` | 본인 행 |
| `push_tokens` | 본인 행 |

뷰 하나가 그 좁힘에 구멍을 내지 않고 관리자에게 필요한 것만 낸다 — `push_reachable`이다([알림을 받나](#알림을-받나)).

키는 `['notifications']`(`useInfiniteQuery` + `range()` 50건)와 `['notifications', 'unread']`(안 읽은 수, `head: true` count 질의)다. 무효화 키는 행위마다 적고 공통 규칙은 [system/runtime.md](../../system/runtime.md#무효화-표)에 있다.

범위 없이 읽는 키의 범위는 이렇다([system/runtime.md](../../system/runtime.md#읽기-범위)).

- `['notifications']` — `useInfiniteQuery` + `range()` 50건. 영속은 첫 세 페이지(`maxPages`)

### 알림 행

`notifications(profile_id, kind, subject_id, payload, created_at, read_at, claimed_at, push_attempts, pushed_at)`. 지워지지 않고 `read_at`만 찍힌다. 본인 행만 읽는다. 문안은 저장하지 않는다 — `kind`와 `payload`를 받아 화면이 `writing.md`대로 그린다.

`claimed_at`은 푸시를 잡은 시각, `pushed_at`은 성공한 시각이다. 둘이 다른 이유와 재시도는 [푸시 보내기](#푸시-보내기)에 있다.

### kind와 payload

**`kind` 문자열과 `payload` 열쇠가 계약이다.** 낳는 쪽(`notification-emit`·cron)과 읽는 쪽(문장·목적지 함수)이 다른 task라, 한쪽이 `work_date`로 넣고 다른 쪽이 `date`로 읽으면 화면이 조용히 빈칸을 그린다. DB는 `kind`에 제약을 안 걸고([알림 행](#알림-행)) 막는 자리가 `src/entities/notification/model/types.ts`의 유니온이라, 그 유니온이 이 표를 옮긴다.

날짜는 `2026-09-13` 꼴의 한국 달력일, 달은 `2026-10` 꼴, 시각은 ISO 문자열이다. 문장은 [알림 제목](screens/notifications.md#알림-제목), 목적지는 [UI 연결](#ui-연결)이 정본이고 여기는 열쇠 이름만 든다.

| 종류 | `kind` | `payload` 열쇠 | 릴리스 |
| --- | --- | --- | --- |
| 가입 승인 | `signup_approved` | 없음 | 1차 |
| 신청 접수 열림 | `requests_open` | `month`·`deadline` | 1차 |
| 마감일 변경 | `deadline_changed` | `month`·`deadline` | 1차 |
| 근무표 확정 | `schedule_confirmed` | `month` | 1차 |
| 근무표 변경 — 들어옴 | `assignment_added` | `work_date` | 1차 |
| 근무표 변경 — 빠짐 | `assignment_removed` | `work_date`·`month` | 1차 |
| 미리 알림 — 하루 | `shift_reminder` | `work_date`·`start_at`·`position` | 1차 |
| 미리 알림 — 주말 묶음 | `weekend_reminder` | `work_date`·`dates` | 1차 |
| 출근 직전 | `before_shift` | `work_date` | 1차 |
| 근무 요청 도착 | `work_requested` | `work_date` | 1차 |
| 근무 요청 수락 | `work_request_accepted` | `actor_name`·`work_date` | 1차 |
| 근무 요청 전부 소진 | `work_request_exhausted` | `work_date`·`position` | 1차 |
| 근무 취소 요청 | `cancel_requested` | `actor_name`·`work_date` | 1차 |
| 근무 취소 결과 — 승인 | `cancel_approved` | `work_date`·`month` | 1차 |
| 근무 취소 결과 — 거절 | `cancel_rejected` | `work_date` | 1차 |
| 사유 결과 — 승인 | `excuse_approved` | `work_date` | 1차 |
| 사유 결과 — 거절 | `excuse_rejected` | `work_date`·`reason` | 1차 |
| 빈 자리 재촉 | `vacancy_nudge` | `work_date`·`count` | 1차 |
| 관리자 공지 | `admin_notice` | `body` | 2차 |
| 교대 요청 도착 | `swap_requested` | `actor_name`·`work_date` | 2차 |
| 교대 수락 | `swap_accepted` | `work_date` | 2차 |
| 교대 승인 | `swap_approved` | `work_date` | 2차 |
| 교대 전부 소진 | `swap_exhausted` | `work_date` | 2차 |

**유니온은 스물셋을 다 든다.** 2차 다섯도 지금 유니온에 넣어 문장·목적지 함수가 빠짐을 컴파일에서 잡게 한다 — 나중에 종류만 늘리면 그 함수들이 조용히 통과한다. **다만 문장과 목적지는 1차 열여덟만 낸다.** 2차 다섯은 널을 내고, 그 널이 「못 보낸 채 남는다」와 「안 눌린다」로 읽힌다([푸시 보내기](#푸시-보내기)·[UI 연결](#ui-연결)). 「교대 수락 → 관리자」의 목적지가 아직 미정이라([swap/design.md](../swap/design.md#아직-안-정한-것)), 2차를 지금 채우면 그 미정이 코드로 새어 든다.

### 누가 넣나

**사건 알림은 같은 함수 트랜잭션 안에서 insert한다.** `approve_swap()`이 배정을 바꾸고 같은 함수 안에서 `notifications` 행을 넣는다 — 배정은 바뀌었는데 알림이 없는 상태가 안 생긴다. 「자기 행동은 안 알린다」·「전부 끝나면 한 번」 같은 묶기 규칙이 함수 안에 산다.

**시각 알림은 pg_cron이 insert한다.** 전날 저녁 9시 미리알림, 시작 10분 전, 예식 3일 전 빈자리 재촉이 여기다. 매 분 돌며 조건에 맞는 행을 넣는다. 「이미 보냈나」는 `subject_id`가 있는 행에만 `(profile_id, kind, subject_id)` unique를 걸어 막는다 — 사건 알림은 트랜잭션이 이미 중복을 막는다. 어느 kind가 cron 몫인지는 `notification-emit`이 정할 자리라, 지금은 「가리킬 대상이 있는 알림」으로 근사한다 — 가입 승인처럼 `subject_id`가 널인 행은 그물 밖이라 여러 번 선다.

### 기기 주소

`push_tokens(profile_id, token, created_at) unique(token)`. 기기마다 하나라 한 사람에 여럿이다([NTF-019](README.md#ntf-019)). 본인 행만 읽는다.

값은 `ExponentPushToken[...]` 꼴의 문자열 하나다 — 주소와 열쇠를 따로 들던 자리가 문자열 한 줄로 줄었다. 우리가 서명할 키가 없고, 애플과 구글에 닿는 자격 증명은 EAS가 든다.

**주소는 기기를 가리키지 사람을 가리키지 않는다.** 한 기기를 A가 쓰다 로그아웃하고 B가 로그인하면 Expo가 같은 문자열을 준다. 그래서 `save_push_token`의 upsert는 `token`이 부딪힐 때 **`profile_id`를 부르는 사람으로 옮긴다** — 안 옮기면 A에게 갈 알림이 B의 폰에 뜬다. `unique(token)`이 그 옮김이 일어날 자리를 만든다.

**닿지 않는 주소는 나중에 안다.** 보낼 때 오는 답은 「받았다」까지고 기기까지 닿았는지는 그 뒤에 따로 물어야 한다([푸시 보내기](#푸시-보내기)). 앱을 지운 사람의 행이 바로 안 지워진다는 뜻이라, 지우는 자리가 발송 직후가 아니라 결과를 긁는 자리다.

### 알림을 받나

**의사와 상태를 가른다.** 받겠다는 의사는 `profiles.notifications_enabled`(기본 참)고 기기가 실제로 닿는지는 `push_tokens` 행의 유무다. 둘을 곱해 셋이 난다 — 끔, 켰는데 기기가 없음, 켰고 기기가 있음이다([NTF-034](README.md#ntf-034)).

**의사가 `profiles`에 사는 것은 사람에 붙는 값이라서다.** 한 사람이 폰 둘을 써도 끄면 통째로 꺼진다 — 기기마다 따로 끄는 길을 안 연 것은 [NTF-021](README.md#ntf-021)이 「종류별로 나누지 않고 통째로」라 정한 것과 같은 결이다. 표는 account가 소유하고 이 값의 뜻은 여기가 든다.

**발송 함수가 첫 줄에서 본다.** `notifications` 행은 끈 사람에게도 선다 — 앱을 열면 대시보드와 목록에 쌓여 있어야 해서다([NTF-029](README.md#ntf-029)). 안 나가는 것은 푸시뿐이고, 그 행은 `pushed_at`이 빈 채 남는다.

**관리자 화면이 읽는 것은 셈이 아니라 갈래다.** 직원 목록이 사람마다 셋 중 무엇인지를 그린다 — `profiles.notifications_enabled`와 그 사람 `push_tokens`의 존재 여부 둘을 같이 받는다. 남의 주소 행을 관리자가 읽는 길은 없으니(`push_tokens`는 본인 행만이다) **존재 여부만 내는 뷰 `push_reachable(profile_id, has_device)`가 선다** — `security definer`고 `token`은 안 낸다. **`profiles`가 기준이고 `push_tokens`를 `exists`로 센다** — 반대로 잡으면 기기가 없는 사람은 행 자체가 안 나와 갈래 셋 중 둘이 구별되지 않는다. 관리자가 아니면 예외가 아니라 빈 결과다([data-access.md 「읽기 RLS 기본값」](../../system/data-access.md#읽기-rls-기본값)).

## 행위별 구현 계약

### 공지 보내기

- 규칙: [NTF-001](README.md#ntf-001)의 관리자 공지 · [NTF-014](README.md#ntf-014)
- 입력·전제: `post_announcement`이 공지다
- 읽고 쓰는 데이터: 승인된 전원에게 행이 선다
- 권한: 관리자
- 캐시 갱신: `['notifications']`

### 읽음 찍기

- 규칙: [NTF-023](README.md#ntf-023)·[NTF-024](README.md#ntf-024)·[NTF-025](README.md#ntf-025)·[NTF-033](README.md#ntf-033)
- 입력·전제: `mark_notifications_read`가 읽음 찍기다. domain대로 ✕·CTA·답 셋 중 하나를 눌러야 읽음이다. 목록을 훑는 것으로는 안 바뀐다. **[알림 목록](screens/notifications.md)에서는 줄을 누르는 것이 넷째 길이다** — 목적지로 가면서 같은 함수가 나간다
- 읽고 쓰는 데이터: 누른 행의 `read_at`을 즉시 칠하고 `mark_notifications_read`를 보낸다
- 권한: 프로필이 있고 차단·퇴사가 아닌 사람. **승인 전도 포함이다** — [NTF-006](README.md#ntf-006)의 가입 승인 알림을 받은 사람이 그것을 닫아야 한다
- 결과와 실패: 실패하면 되돌린다 — 다시 나타난 행을 사람이 다시 누른다. **줄을 눌러 목적지로 간 자리는 다르다** — 이동이 먼저고 읽음 실패는 조용하다. 토스트도 되돌림 애니메이션도 없고 다음 읽기가 맞춘다([알림 목록](screens/notifications.md)). 이미 다른 화면에 선 사람에게 앞 화면의 되돌림을 보여줄 방법이 없다
- 캐시 갱신: `['notifications']`와 `['notifications', 'unread']`. 안 읽은 수가 종 아이콘의 점이라 같이 안 무효화하면 점이 안 꺼진다

### 기기 주소 저장과 삭제

- 규칙: [NTF-016](README.md#ntf-016)·[NTF-017](README.md#ntf-017)·[NTF-019](README.md#ntf-019)·[NTF-021](README.md#ntf-021)·[NTF-027](README.md#ntf-027)·[NTF-034](README.md#ntf-034)
- 입력·전제: `save_push_token`, `remove_push_token`이 기기 주소다. **의사를 바꾸는 것은 `set_notifications_enabled(p_on boolean)`이고 따로 산다** — 끄면 `profiles.notifications_enabled`가 거짓이 되고 그 기기 주소도 같이 지운다. 켜는 것은 순서가 반대다. 먼저 참으로 바꾸고 기기에 권한을 물어 주소를 받는다 — 권한이 거부되면 의사는 참인 채로 기기가 없는 갈래에 선다
- 입력·전제: **권한 상태를 먼저 읽는다.** 안 물어본 상태·허락·거부 셋이고, 거부는 앱이 다시 못 묻는 자리다([NTF-027](README.md#ntf-027)) — 화면이 그때 켜기 버튼 대신 기기 설정으로 가는 길을 안내한다
- 읽고 쓰는 데이터: 허락이면 주소를 받아 `save_push_token`을 부른다. **안드로이드는 알림 채널을 먼저 만들어야 권한 창이 뜬다** — 채널을 안 만들면 물음 자체가 안 나와 거부와 구별이 안 된다
- 권한: 프로필이 있고 차단·퇴사가 아닌 사람. 본인 행뿐이다. **승인 전도 포함이다** — [NTF-016](README.md#ntf-016)이 켜는 자리를 승인 대기 화면에 뒀고, 그 주소가 있어야 가입 승인 알림이 간다
- 처리와 경쟁: 권한은 있는데 주소가 없을 수 있고 주소가 도는 중에 바뀌는 일도 있어 매 진입에 보낸다 — 함수는 `token` upsert고, 앱이 떠 있는 동안 주소가 바뀌면 그 자리에서도 보낸다. **의사가 거짓이면 저장이 아무 일도 안 한다** — 끈 사람의 주소가 다음 진입에 되살아나면 끄기가 안 끈 것이 된다. **막는 자리가 앱이 아니라 `save_push_token` 안이다.** 앱도 안 부르지만 그것은 한 겹 더일 뿐이다
- 결과와 실패: 안 물어본 상태면 알림 설정 화면의 버튼을 누를 때 묻는다. 진입 즉시 권한을 묻지 않는다
- 캐시 갱신: `set_notifications_enabled`는 `['members']` — 관리자 직원 목록의 갈래가 그 값으로 갈린다. 주소 저장·삭제는 없음

### 푸시 보내기

- 규칙: [NTF-001](README.md#ntf-001)·[NTF-019](README.md#ntf-019)·[NTF-027](README.md#ntf-027)·[NTF-029](README.md#ntf-029)·[NTF-034](README.md#ntf-034)·[NTF-035](README.md#ntf-035)
- 입력·전제: **끈 사람의 행은 잡지 않는다.** 잡는 질의가 `profiles.notifications_enabled`를 같이 보고 거짓인 행을 거른다 — 행은 서고 푸시만 안 나간다([알림을 받나](#알림을-받나))
- 입력·전제: **알림끼리 안 묶는다.** 한 사람에게 몇 분 사이로 둘이 잡혀도 각자 간다([NTF-035](README.md#ntf-035)) — 잡는 질의가 같은 사람의 다른 행을 안 본다
- 입력·전제: **경로 둘, 함수 하나.** `notifications`에 행이 들어오면 Database Webhook이 Edge Function `send-push`를 부른다. pg_net은 한 번 쏘고 끝이라 놓친 것은 pg_cron의 `retry_push`가 매분 같은 함수를 다시 부른다
- 읽고 쓰는 데이터: **잡기와 성공은 다른 열이다.** 함수가 먼저 잡는다 — `update notifications set claimed_at = now(), push_attempts = push_attempts + 1 where id = any($1) and pushed_at is null and push_attempts < 5 and (claimed_at is null or claimed_at < now() - interval '2 minutes') returning *`. 잡힌 행만 보내고 성공한 행에만 `pushed_at`을 찍는다
- 권한: **service role은 `send-push` 안에만 있다.** 사용자 세션 없이 돌아 `notifications`와 `push_tokens`만 만진다 — 서비스 키 자리 셋 중 하나. **잡기와 결과 쓰기는 `public` 껍데기를 탄다** — 서비스 키로도 `internal`은 못 부른다([system/data-access.md](../../system/data-access.md#서비스-키-자리)). 껍데기의 첫 줄이 `auth.role()`을 본다. **비밀은 저장소 밖이다.** 푸시를 부치는 접근 토큰은 Edge Function secret이고 앱 번들에는 안 간다 — 우리가 서명할 키가 없어 앱에 내보낼 공개키도 없다. 애플과 구글에 닿는 자격 증명은 EAS가 든다. Webhook 트리거의 인증 헤더는 Vault에서 읽는다 — 트리거 정의에 리터럴로 넣으면 마이그레이션에 실려 PUBLIC 저장소에 올라간다
- 처리와 경쟁: 보내다 죽으면 2분 뒤 다시 잡힌다. `retry_push`가 보는 조건이 이 문장과 같아 두 경로가 같은 규칙을 탄다. **Edge Function은 얼개다.** 지난 접수증 긁기 → 알림 행 잡기 → `src/features/notification/model/`의 순수 함수로 payload와 처리 방법 정하기 → 부치기 → 성공이면 `pushed_at`. 판단(어떤 실패가 재시도인가, 어떤 것이 주소 폐기인가)은 전부 `src/`의 순수 함수라 unit 테스트가 지킨다. 그 함수들은 Node 전용 API를 안 쓴다 — lint가 `src/features/notification/model/`에서 `node:` import를 막는다
- 처리와 경쟁: **한 번에 백 건까지 한 요청에 묶는다.** 그보다 많으면 나눠 부친다. payload는 4KB를 넘으면 통째로 거절당하니 순수 함수가 문안이 아니라 `kind`와 목적지만 싣는다 — 문안은 어차피 화면이 그린다. **푸시에 뜨는 제목과 아래 줄은 [알림 제목](screens/notifications.md#알림-제목) 표를 옮긴 순수 함수가 낸다** — 목록 화면과 대시보드가 같은 함수를 쓴다
- 결과와 실패: **부친 답과 닿은 결과가 다른 순간에 온다.** 부치면 접수증이 먼저 오고 기기까지 닿았는지는 십오 분쯤 뒤에 따로 물어야 안다. 접수증 번호를 알림 행의 `push_receipt_id`에 적어두고, 다음 회차의 `send-push`가 지난 것부터 긁는다 — `retry_push`가 매분 같은 함수를 부르니 긁는 자리가 저절로 돈다. **보낼 것이 없어도 긁는다** — 긁기가 함수의 첫 단계고 잡을 알림이 없으면 거기서 끝난다. 긁고 나면 `push_receipt_id`를 널로 되돌리는 것이 「긁었다」 표시다. 함수를 하나 더 만들면 service role을 쥔 자리가 셋이 된다([system/data-access.md](../../system/data-access.md#서비스-키-자리))
- 결과와 실패: **주소를 지우는 것은 그 결과를 읽는 자리다.** 앱을 지웠거나 기기가 등록을 잃으면 결과에 그렇게 온다 — 그때 `push_tokens` 행을 지운다. 부치는 순간에는 못 지운다. 부치는 자리에서 오는 실패는 다르다 — 너무 잦으면 물러섰다 다시 부치고, 자격 증명이 틀렸으면 재시도해도 같아 사람이 봐야 한다
- 결과와 실패: 다섯 번 넘으면 그만둔다 — 앱을 열면 알림 행은 그대로 있다. **앱이 꺼져 있으면 기기가 알아서 띄운다.** 앱이 떠 있는 동안에는 띄울지를 앱이 정하는데, 우리는 **항상 띄운다** — 안 본 알림이 화면 위에 이미 있어도 푸시가 조용히 사라지면 사람이 못 받은 것으로 읽는다
- 결과와 실패: **누르면 목적지로 간다.** 앱이 떠 있다 눌린 것과 꺼져 있다 알림으로 시작한 것이 다른 길로 들어와, 시작하는 자리에서 「알림으로 열렸나」를 한 번 더 읽는다. 둘 다 `payload`의 화면으로 간다
- 캐시 갱신: 앱이 떠 있는 동안 푸시가 오면 그 자리에서 `['notifications']`를 무효화한다. 사건이 닿는 도메인 키(강제 변경이면 `['schedule']`)는 앱으로 돌아올 때의 재조회에 맡긴다. 푸시가 안 오는 기기는 앱으로 돌아올 때 다시 읽는 것이 전부다

**Deno는 `supabase/functions` 밖을 못 읽는다.** edge-runtime 컨테이너에 그 폴더 하나만 마운트돼서, `deno.json`이 `../../src/`를 맵핑해도 파일이 컨테이너 안에 없다 — 맵핑 자체는 도는데 그 경로가 컨테이너 안에 없어 `Module not found`다. 심볼릭 링크도 타깃이 마운트 밖이라 끊긴다. 그래서 CI가 `src/features/notification/model/`을 `supabase/functions/_shared/`로 복사한 뒤 Supabase를 띄운다 — `.github/workflows/ci.yml`의 `ci` 잡, `supabase start` 줄 앞이다. 복사본은 생성물이라 커밋하지 않는다. 정본은 `src/`다.

**복사는 `cp`만으로 안 된다.** Deno는 import에 `.ts` 확장자를 요구하는데 `src/`는 확장자를 안 적는다 — 그대로 옮기면 `Module not found … Maybe add a '.ts' extension`으로 부팅이 깨진다. 복사 단계가 옮기면서 import 지정자에 `.ts`를 붙여야 하고, `@/`로 시작하는 별칭은 복사본 뿌리를 가리키도록 `deno.json`의 `imports`가 다시 맵핑한다. 그 단계를 세우는 것은 알림 task의 plan 몫이다.

얼개 자체는 e2e가 본다. CI가 `supabase functions serve`를 띄우고 가짜 푸시 엔드포인트로 한 번 돌린다.

### 행위 밖의 실행 동작

- 입력·전제: pg_cron(`internal`) — `emit_reminders`(전날 저녁 9시·시작 10분 전·빈자리 재촉), `retry_push`(미발송 알림 다시 쏘기)
- 읽고 쓰는 데이터: 사건 알림은 함수가 없다 — 사건을 일으킨 함수가 같은 트랜잭션에서 넣는다
- 처리와 경쟁: 저녁 9시 미리 알림은 cron 항목 하나다. 매일 21:00에 한 번 돌고 함수가 그날 요일을 보고 대상 날짜를 고른다 — 금요일이면 토·일 이틀치를 묶고([NTF-008](README.md#ntf-008)) 나머지 요일은 다음 날 하루다. 토요일은 21시 항목이 미리 알림을 안 만든다. 항목을 요일별로 쪼개지 않는 것은, 시각을 바꿀 때 고칠 자리가 여럿이 되고 누가 언제 도는지가 crontab에 흩어져서다

## UI 연결

화면은 [notifications](screens/notifications.md) 하나고, 알림이 서는 다른 자리는 [대시보드](../../system/screens/dashboard.md#안-본-알림)의 안 본 알림과 「나」의 [알림 설정](../account/screens/profile.md#알림)이다.

푸시를 누르든 대시보드 알림 영역의 CTA를 누르든 알림 목록의 줄을 누르든 같은 곳이다. `payload`가 날짜·달을 든다. 관리자 목적지는 관리자 층으로 바로 착지하고 앱바 뒤로가 부모 경로로 간다([system/navigation.md](../../system/navigation.md#뒤로)).

표는 릴리스를 가리지 않고 전부 든다. 교대 다섯 줄과 관리자 공지는 2차다([roadmap](../../../1-plan/roadmap.md#릴리스-목록)) — 1차 알림 task는 나머지만 구현하고, 「교대 수락 → 관리자」의 미정은 2차 교대 알림 task가 닫는다.

| 종류 | 받는 사람 | 간다 |
| --- | --- | --- |
| 가입 승인 | 그 사람 | `/` |
| 신청 접수 열림 · 마감일 변경 | 승인된 전원 | `/schedule?month=` 제출 모드 |
| 근무표 확정 | 배정된 사람 | `/schedule?month=` |
| 근무표 변경 | 들어온 사람 | `/schedule?date=` |
| 근무표 변경 | 빠진 사람 | `/schedule?month=` — 그날 시트에 자기가 없다 |
| 미리 알림 | 배정된 사람 | `/schedule?date=`. 주말 묶음이면 그 사람의 첫 근무 날 |
| 출근 직전 | 배정된 사람 | `/check-in` |
| 근무 요청 도착 | 받은 사람 | `/schedule?date=` 요청 카드 |
| 근무 요청 수락 · 전부 소진 | 관리자 | `/admin/schedule?date=` |
| 교대 요청 도착 | 받은 사람 | `/schedule?date=` |
| 교대 수락 | 요청자 | `/schedule?date=` |
| 교대 수락 | 관리자 | 미정 — [`swap/design.md`](../swap/design.md#아직-안-정한-것) |
| 교대 승인 | 요청자 · 선택된 쪽 | `/schedule?date=` |
| 교대 전부 소진 | 요청자 | `/schedule?date=` |
| 근무 취소 요청 | 관리자 | `/admin/approvals` |
| 근무 취소 결과 | 그 사람 | 승인이면 `/schedule?month=`, 거절이면 `/schedule?date=` |
| 사유 결과 | 그 사람 | `/schedule?date=` 명단의 자기 상태 |
| 빈 자리 재촉 | 관리자 | `/admin/schedule?date=` |
| 관리자 공지 | 승인된 전원 | 없음. 대시보드 알림 영역이 곧 목적지라 CTA가 없고 ✕뿐이다 |

목적지로 가는 것과 읽음은 같은 순간이다 — CTA를 누르면 `mark_notifications_read`가 같이 나간다([읽음 찍기](#읽음-찍기)). 목록에서 줄을 누르는 것도 같다.

**관리자 공지만 목적지가 없다.** 대시보드에서는 알림 영역이 곧 목적지라 CTA가 없고 ✕뿐인데, 목록에서는 그 줄이 안 눌린다 — 갈 곳이 없어서다. 목록에서 유일하게 안 눌리는 줄이고 화살표도 누름 배경도 없다.

## 코드와의 차이

목표와 지금 코드가 다른 자리다.

| 목표 조항 | 확인한 코드와 Git 기준점 | 차이 | 전환 작업·검증 근거 |
| --- | --- | --- | --- |
| [푸시 보내기](#푸시-보내기) — CI가 `src/features/notification/model/`을 `supabase/functions/_shared/`로 복사한 뒤 Supabase를 띄운다 | `.github/workflows/ci.yml`, `d1a6ec4` — `supabase start` 줄이 `-x`로 `edge-runtime`을 뺀다 | 복사 단계가 없고 `edge-runtime`이 안 뜬다 | `notification-first` — [backlog.md](../../../backlog.md) |

## 아직 안 정한 것

「알림 끄기와 권한 거부를 어디 두나」는 [알림을 받나](#알림을-받나)로 닫혀 올라갔다 — 의사는 `profiles.notifications_enabled`, 기기는 `push_tokens` 유무고 둘을 곱해 갈래 셋이다.

### Q-01

- 질문: 알림 하나에 기기 주소가 둘일 때 한 기기만 성공한 것을 어떻게 나타내나
- 필요한 근거와 대안: `pushed_at`이 행에 하나라 한 기기만 성공한 것을 못 나타낸다. 서른 명 규모에서 드물어 두고 본다

「새 알림이 한동안 없으면 접수증을 누가 긁나」는 [푸시 보내기](#푸시-보내기)로 닫혀 올라갔다 — `retry_push`가 부르는 회차마다 긁기가 먼저 돌고, 잡을 알림이 없으면 긁고 끝난다. 긁기 전용 cron을 따로 두지 않는 것은 서비스 키를 쥔 자리를 안 늘리려는 것이다.
