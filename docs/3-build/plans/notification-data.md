---
sources:
  - ../../2-design/modules/notification/design.md#소유-데이터
  - ../../2-design/modules/notification/design.md#알림-행
  - ../../2-design/modules/notification/design.md#누가-넣나
  - ../../2-design/modules/notification/design.md#기기-주소
  - ../../2-design/modules/notification/design.md#알림을-받나
  - ../../2-design/modules/notification/design.md#읽음-찍기
  - ../../2-design/modules/notification/design.md#기기-주소-저장과-삭제
  - ../../2-design/modules/notification/README.md#ntf-023
  - ../../2-design/modules/notification/README.md#ntf-025
  - ../../2-design/modules/notification/README.md#ntf-026
  - ../../2-design/modules/notification/README.md#ntf-034
  - ../../2-design/modules/account/design.md#프로필-신원
  - ../../2-design/system/data-access.md#쓰기-함수
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/data-access.md#읽기-rls-기본값
  - ../../2-design/system/data-access.md#오류의-모양
---

# 알림의 그릇을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [notification/design.md](../../2-design/modules/notification/design.md#소유-데이터)의 [소유 데이터](../../2-design/modules/notification/design.md#소유-데이터)와 [읽음 찍기](../../2-design/modules/notification/design.md#읽음-찍기)와 [기기 주소 저장과 삭제](../../2-design/modules/notification/design.md#기기-주소-저장과-삭제)다.

표 둘과 뷰 하나와 함수 넷이 이 task의 산출이다. **알림을 낳는 자리도 보내는 자리도 안 만든다** — 낳기는 [`notification-emit`](notification-emit.md), 보내기는 `notification-push`다. 이 task는 그 둘이 쓸 그릇만 낸다.

선행이 없다. 알림 영역의 첫 task고 나머지 넷이 전부 이것을 딛는다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **의사와 상태가 갈린다.** 받겠다는 의사는 `profiles.notifications_enabled`고 기기가 실제로 닿는지는 `push_tokens` 행의 유무다. 둘을 곱해 셋이 나고 화면이 셋을 갈라 말한다([NTF-034](../../2-design/modules/notification/README.md#ntf-034))
- **주소 원문은 본인만 본다.** 기기 주소는 그 기기로 푸시를 쏠 수 있는 값이라 RLS가 본인 행만 연다. 관리자는 닿나 안 닿나만 알면 되므로 `security definer` 뷰가 불리언 하나만 낸다
- **읽음은 눌러야 찍힌다.** 목록을 훑는 것으로는 안 바뀐다([NTF-023](../../2-design/modules/notification/README.md#ntf-023)). 함수를 부르는 자리가 넷이다 — ✕, CTA, 답, 그리고 알림 목록의 줄
- **지난 알림을 안 지운다.** [NTF-026](../../2-design/modules/notification/README.md#ntf-026)이 그렇게 정해서 이 표에는 지우는 함수가 없다. [비우기](../../2-design/modules/account/design.md#비우기)도 알림을 안 건드린다 — `erase_profiles()`는 연락처를 비울 뿐 `profiles` 행을 지우지 않는다(「이름은 남는다. 그게 스냅샷이다」). 비울 때 알림까지 비울지는 `profile-erasure`가 정한다

## 완료 조건

### AC-01

**`notifications` 표.**

`notifications(id, profile_id, kind, subject_id, payload, created_at, read_at, claimed_at, push_attempts, pushed_at)`

- `profile_id`는 `profiles(id)` 참조고 `on delete cascade`다. 지금 흐름에서는 안 탄다 — 비우기가 `profiles` 행을 남기기 때문이다. 표가 참조 무결성을 스스로 들게 두는 값이다
- `kind`는 알림 종류다. 문장의 정본은 [notifications.md](../../2-design/modules/notification/screens/notifications.md#알림-제목)의 「알림 제목」 표고 이 열은 그 표의 종류를 가리키는 키다
- `subject_id`는 그 알림이 가리키는 것의 id다. 근무면 배정, 교대면 교대다. 종류마다 무엇인지는 [`notification-emit`](notification-emit.md)이 정한다
- `payload`는 `jsonb`다. 문장의 가변값(달·날짜·이름·수)이 들어간다 — **문장 자체는 안 넣는다.** 문구가 바뀌면 지난 알림까지 같이 바뀌어야 하는데 문장을 박아두면 안 바뀐다
- `read_at`·`claimed_at`·`pushed_at`은 널 허용이고 `push_attempts`는 기본 0이다
- 인덱스: `(profile_id, created_at desc)` — 목록이 이 순서로 읽는다. 그리고 `where read_at is null` 부분 인덱스 — 안 읽은 수를 세는 질의가 이것을 탄다
- RLS: 본인 행만 읽는다

### AC-02

**`push_tokens` 표.**

`push_tokens(id, profile_id, token, created_at)` — `unique(token)`

- `token`이 유일하다. 같은 기기가 다시 보내면 새 행이 아니라 같은 행이다
- **그 행의 주인은 마지막으로 그 기기에 로그인한 사람이다.** 기기 하나를 A가 쓰다 로그아웃하고 B가 로그인하면 Expo가 같은 주소를 준다 — `profile_id`를 A에 둔 채로 두면 **A에게 갈 알림이 B의 폰에 뜬다.** 주소는 기기를 가리키지 사람을 가리키지 않는다
- 값은 `ExponentPushToken[...]` 꼴의 문자열 하나다 — 주소와 열쇠를 따로 들지 않는다
- **RLS가 본인 행만 연다.** 읽기도 쓰기도 그렇다. 이 값이 새면 남의 기기로 푸시를 쏠 수 있다
- 사람 하나에 행이 여럿일 수 있다. 폰과 데스크톱이 각각 하나다

### AC-03

**`push_reachable` 뷰.**

`push_reachable(profile_id, has_device)` — `security definer`

- **`profiles`가 기준이고 `push_tokens`는 `exists`로 센다.** 반대로 잡으면 기기가 없는 사람은 행 자체가 안 생겨 관리자 화면이 「꺼둠」·「켰지만 기기 없음」·「켰고 기기 있음」 셋을 못 가른다([design.md](../../2-design/modules/notification/design.md) — 「관리자 화면이 읽는 것은 셈이 아니라 갈래다」)
- `has_device`는 그 사람의 `push_tokens` 행이 하나라도 있나다
- **주소 자체는 안 낸다.** 관리자가 볼 것은 닿나 안 닿나뿐이다
- **관리자가 아니면 빈 결과다. 예외를 안 던진다.** 뷰의 `select`는 예외를 못 던지고, [읽기 RLS 기본값](../../2-design/system/data-access.md#읽기-rls-기본값)이 「RLS는 읽기를 거부하지 않고 빈 결과를 준다」로 정했다. 몸통이 `where public.is_admin()`을 든다 — `excuse_status`가 `is_approved()`로 같은 꼴을 세운 전례다
- `set search_path = ''`는 안 쓴다 — 함수의 문법이고 `create view`에는 그런 절이 없다. 식별자마다 `public.`을 붙이는 것이 같은 목적을 이룬다

### AC-04

**읽음 찍기 함수.**

`mark_notifications_read(p_ids uuid[])` — `security definer`

- 첫 줄이 호출자 검사인데 **`is_approved()`가 아니다** — 아래 [AC-07](#ac-07)의 「승인 전에도 부른다」를 따른다. 승인 대기 중인 사람도 가입 승인 알림을 받으니 읽음도 찍는다
- **자기 알림만 찍는다.** `profile_id`가 부르는 사람이 아닌 행은 조용히 건너뛴다 — 남의 알림 id를 넣어도 아무 일이 안 일어난다
- 이미 `read_at`이 찬 행은 안 덮는다. 처음 읽은 시각이 남는다
- 배열을 받는다. 알림 목록의 줄 하나를 누를 때도 한 개짜리 배열이다
- `set search_path = ''`

### AC-05

**기기 주소 함수 둘.**

`save_push_token(p_token text)`·`remove_push_token(p_token text)` — 둘 다 `security definer`

- 저장은 upsert다. 같은 주소가 다시 오면 **`profile_id`를 부르는 사람으로 옮기고** `created_at`을 갱신한다 — 앱이 매 진입에 보내고, 기기를 물려받은 사람이 곧 그 주소의 주인이다. `profile_id`를 안 옮기면 앞 사람의 알림이 뒤 사람의 폰에 뜬다
- 삭제는 자기 행만이다. 남의 주소를 넣어도 안 지워진다
- 둘 다 첫 줄이 호출자 검사인데 **`is_approved()`가 아니다** — 아래 [AC-07](#ac-07)을 따른다
- `set search_path = ''`

### AC-06

**의사 바꾸기 함수.**

`set_notifications_enabled(p_on boolean)` — `security definer`

- **`profiles.notifications_enabled` 열을 이 task가 만든다.** 지금 `profiles`에 없다 — `boolean not null default true`로 더한다. [design.md 「알림을 받나」](../../2-design/modules/notification/design.md#알림을-받나)가 기본 참으로 정했다. 이 열은 **받겠다는 의사**고 기기 권한이 아니다 — [NTF-016](../../2-design/modules/notification/README.md#ntf-016)·[NTF-017](../../2-design/modules/notification/README.md#ntf-017)의 「켜기를 누른다」는 기기에 권한을 묻는 자리지 이 열을 참으로 만드는 자리가 아니다. 안 끈 사람은 의사가 참인 채 기기가 없는 갈래에 선다
- 표는 account가 소유한다. 열만 여기서 더하고 뜻은 [design.md](../../2-design/modules/notification/design.md#알림을-받나)가 든다
- `profiles.notifications_enabled`를 바꾼다
- **끄면 그 사람의 `push_tokens` 행도 같이 지운다.** 껐는데 주소가 남아 있으면 관리자 화면이 「알림 받는 중」이라 말한다
- 켜는 것은 의사만 바꾼다. 기기 주소는 앱이 권한을 받아야 생겨서 함수가 못 만든다 — `notification-settings`가 그 자리다
- 첫 줄이 호출자 검사인데 **`is_approved()`가 아니다** — 아래 [AC-07](#ac-07)을 따른다. [NTF-016](../../2-design/modules/notification/README.md#ntf-016)이 알림 켜기를 승인 대기 화면에 뒀다
- `set search_path = ''`

### AC-07

**호출자 검사와 에러 코드.**

**이 task는 에러 코드를 안 더한다.** 함수 넷이 쓰는 코드는 이미 선 `not_allowed` 하나뿐이다 — `profiles.sql`·`schedule_functions.sql`·`attendance_functions.sql`이 전부 거절을 이 코드 하나로 낸다([오류의 모양](../../2-design/system/data-access.md#오류의-모양)). `not_approved`·`not_admin` 같은 갈래별 코드를 새로 만들지 않는다. 거절 사유를 코드로 가르면 안 부른 사람에게 「당신은 승인 전이다」와 「당신은 관리자가 아니다」를 구별해 알려주는 셈이고, 화면이 그 차이로 하는 일도 없다.

**승인 전에도 부른다.** 함수 넷 — `mark_notifications_read`·`save_push_token`·`remove_push_token`·`set_notifications_enabled` — 은 `is_approved()`를 안 쓴다.

- [NTF-016](../../2-design/modules/notification/README.md#ntf-016)이 알림 켜기를 **승인 대기 화면**에 뒀다. 켜는 함수에 `is_approved()`를 걸면 그 화면의 스위치가 제 함수에 막힌다
- [NTF-006](../../2-design/modules/notification/README.md#ntf-006)의 「가입 승인」은 **승인 전에 가야 하는 유일한 알림**이다. 주소 저장이 막히면 그 알림이 배달 경로를 잃는다. 읽음 찍기도 같다 — 받은 알림을 못 닫는다
- 대신 이렇게 센다. `auth.uid()`로 `profiles` 행이 잡히고 그 행의 `blocked_at`·`left_at`이 둘 다 널이다. 차단된 사람과 나간 사람은 막고 승인 대기는 통과시킨다
- `submit_profile`·`update_my_photo`가 같은 꼴의 전례다 — 승인 전에 불려야 하는 함수들이다

거절은 `raise exception using message = 'not_allowed'` 꼴이다. `push_reachable` 뷰는 예외를 못 던지므로 코드가 아니라 빈 결과로 답한다([AC-03](#ac-03)).

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_notifications.sql` | 표 둘, 뷰, RLS, 인덱스, `profiles.notifications_enabled` 열 | AC-01~AC-03·AC-06 |
| `supabase/migrations/<날짜>_notification_fns.sql` | 함수 넷과 그 호출자 검사 | AC-04~AC-07 |
| `src/entities/notification/dals/` | 함수 넷의 `supabase.rpc()` 래퍼. 파일 하나에 함수 하나 | AC-04~AC-06 |
| `src/entities/notification/model/types.ts` | `kind`와 `payload`의 타입 | AC-01 |

`src/shared/api/error-codes.ts`는 안 건드린다 — AC-07이 코드를 안 더한다.

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `integration-test-writer` → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-07을 배정한다. **대부분 integration이다** — RLS와 `security definer`의 경계가 이 task의 본체고 그것은 DB가 있어야 보인다
2. `integration-test-writer`가 경계를 쓴다. 남의 알림 id로 `mark_notifications_read`를 부르는 것, 남의 `push_tokens`를 읽는 것, 관리자 아닌 사람이 뷰를 읽는 것 셋이 핵심이다
3. `implementer`가 표 → 뷰 → 함수 순으로 초록을 만든다
4. `pr-diff`가 diff를 본다 — RLS를 안 켠 표가 없는지

## 리스크·전환·되돌리기

- **`push_tokens`가 이 저장소에서 가장 민감한 표다.** 행 하나로 그 사람 기기에 푸시를 쏠 수 있다. RLS를 빠뜨리면 승인된 누구나 전원의 주소를 읽는다 — integration이 이것을 본다
- **`security definer` 뷰가 RLS를 우회한다.** 그것이 목적이지만 첫 줄의 `is_admin()`을 빠뜨리면 아무나 전원의 알림 상태를 읽는다. 함수와 달리 뷰는 첫 줄 확인이 눈에 덜 띈다
- **`payload`가 스키마 없는 `jsonb`다.** 낳는 쪽과 읽는 쪽이 어긋나면 화면에 빈 값이 선다. 종류마다의 모양은 [`notification-emit`](notification-emit.md)이 `src/features/notification/model/`의 타입으로 묶는다 — DB가 아니라 타입이 지킨다
- **`push_attempts`와 `claimed_at`은 이 task가 열만 낸다.** 쓰는 것은 `notification-push`다. 열이 먼저 서야 그 task가 설 수 있어 여기 든다
- 되돌리기는 표 둘을 drop하는 마이그레이션이다. 아직 아무도 안 쓰는 단계라 값이 안 사라진다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 남의 알림이 읽힌다 | integration `src/entities/notification/dals/__tests__/notification-rls.integration.test.ts`(예정) | `pnpm test:integration:run` | 다른 사람 행이 0건 |
| AC-02 | 남의 기기 주소가 읽힌다 | integration 위 | 위와 같다 | 다른 사람 행이 0건 |
| AC-02 | 같은 기기가 두 행이 된다 | integration 위 | 위와 같다 | 같은 `token`으로 두 번 저장해도 행이 1 |
| AC-03 | 관리자 아닌 사람이 뷰를 읽는다 | integration 위 | 위와 같다 | 예외가 아니라 0건 |
| AC-03 | 기기 없는 사람이 뷰에서 사라진다 | integration 위 | 위와 같다 | 주소가 없어도 행이 서고 `has_device`가 거짓 |
| AC-03 | 뷰가 주소를 낸다 | integration 위 | 위와 같다 | 컬럼이 `profile_id`·`has_device` 둘뿐이다 |
| AC-04 | 남의 알림에 읽음이 찍힌다 | integration `src/entities/notification/dals/__tests__/notification-functions.integration.test.ts`(예정) | 위와 같다 | `read_at`이 그대로 널 |
| AC-04 | 두 번 읽으면 시각이 덮인다 | integration 위 | 위와 같다 | 첫 시각이 남는다 |
| AC-05 | 기기를 물려받아도 앞 사람에게 묶인다 | integration 위 | 위와 같다 | 같은 `token`을 B가 저장한 뒤 행의 `profile_id`가 B |
| AC-05 | 남의 주소가 지워진다 | integration 위 | 위와 같다 | 남의 `token`으로 불러도 행이 남는다 |
| AC-06 | 껐는데 주소가 남는다 | integration 위 | 위와 같다 | 끈 뒤 `push_tokens` 행이 0 |
| AC-07 | 승인 대기 중인 사람이 막힌다 | integration 위 | 위와 같다 | 함수 넷이 승인 전 호출자에게 초록 |
| AC-07 | 나간 사람·차단된 사람이 통과한다 | integration 위 | 위와 같다 | `not_allowed` |

- 배정하지 않은 것: 실제 푸시가 나가는 것 — `notification-push`가 본다. 알림 행이 생기는 것 — [`notification-emit`](notification-emit.md)이 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 알림을 낳는 자리 — [`notification-emit`](notification-emit.md)
- 푸시를 쏘는 자리와 `claimed_at`·`push_attempts`·`pushed_at`을 쓰는 것 — `notification-push`
- 알림 목록 화면과 종 아이콘 — [`notification-list`](notification-list.md)
- 프로필의 알림 스위치와 기기 권한 받기 — `notification-settings`
- 공지 보내기 `post_announcement` — 2차다([roadmap](../../1-plan/roadmap.md#릴리스-목록))
- 대시보드의 안 본 알림 영역 — [`dashboard`](../../backlog.md)
