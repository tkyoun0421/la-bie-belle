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

표 둘과 뷰 하나와 함수 넷이 이 task의 산출이다. **알림을 낳는 자리도 보내는 자리도 안 만든다** — 낳기는 [`notification-emit`](notification-emit.md), 보내기는 [`notification-push`](notification-push.md)다. 이 task는 그 둘이 쓸 그릇만 낸다.

선행이 없다. 알림 영역의 첫 task고 나머지 넷이 전부 이것을 딛는다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **의사와 상태가 갈린다.** 받겠다는 의사는 `profiles.notifications_enabled`고 기기가 실제로 닿는지는 `push_subscriptions` 행의 유무다. 둘을 곱해 셋이 나고 화면이 셋을 갈라 말한다([NTF-034](../../2-design/modules/notification/README.md#ntf-034))
- **구독 원문은 본인만 본다.** `endpoint`와 `keys`는 그 기기로 푸시를 쏠 수 있는 값이라 RLS가 본인 행만 연다. 관리자는 닿나 안 닿나만 알면 되므로 `security definer` 뷰가 불리언 하나만 낸다
- **읽음은 눌러야 찍힌다.** 목록을 훑는 것으로는 안 바뀐다([NTF-023](../../2-design/modules/notification/README.md#ntf-023)). 함수를 부르는 자리가 넷이다 — ✕, CTA, 답, 그리고 알림 목록의 줄
- **지난 알림을 안 지운다.** [NTF-026](../../2-design/modules/notification/README.md#ntf-026)이 그렇게 정해서 이 표에는 지우는 함수가 없다. 사람이 사라질 때만 [`erase_profiles`](../../2-design/modules/account/design.md#비우기)를 따라 함께 간다

## 완료 조건

### AC-01

**`notifications` 표.**

`notifications(id, profile_id, kind, subject_id, payload, created_at, read_at, claimed_at, push_attempts, pushed_at)`

- `profile_id`는 `profiles(id)` 참조고 사람이 지워지면 행도 같이 간다
- `kind`는 알림 종류다. 문장의 정본은 [notifications.md](../../2-design/modules/notification/screens/notifications.md#알림-제목)의 「알림 제목」 표고 이 열은 그 표의 종류를 가리키는 키다
- `subject_id`는 그 알림이 가리키는 것의 id다. 근무면 배정, 교대면 교대다. 종류마다 무엇인지는 [`notification-emit`](notification-emit.md)이 정한다
- `payload`는 `jsonb`다. 문장의 가변값(달·날짜·이름·수)이 들어간다 — **문장 자체는 안 넣는다.** 문구가 바뀌면 지난 알림까지 같이 바뀌어야 하는데 문장을 박아두면 안 바뀐다
- `read_at`·`claimed_at`·`pushed_at`은 널 허용이고 `push_attempts`는 기본 0이다
- 인덱스: `(profile_id, created_at desc)` — 목록이 이 순서로 읽는다. 그리고 `where read_at is null` 부분 인덱스 — 안 읽은 수를 세는 질의가 이것을 탄다
- RLS: 본인 행만 읽는다

### AC-02

**`push_subscriptions` 표.**

`push_subscriptions(id, profile_id, endpoint, keys, created_at)` — `unique(endpoint)`

- `endpoint`가 유일하다. 같은 기기가 다시 구독하면 새 행이 아니라 같은 행이다
- `keys`는 `jsonb`고 `p256dh`와 `auth`를 담는다
- **RLS가 본인 행만 연다.** 읽기도 쓰기도 그렇다. 이 값이 새면 남의 기기로 푸시를 쏠 수 있다
- 사람 하나에 행이 여럿일 수 있다. 폰과 데스크톱이 각각 하나다

### AC-03

**`push_reachable` 뷰.**

`push_reachable(profile_id, has_device)` — `security definer`

- `has_device`는 그 사람의 `push_subscriptions` 행이 하나라도 있나다
- **`endpoint`도 `keys`도 안 낸다.** 관리자가 볼 것은 닿나 안 닿나뿐이다
- 관리자만 읽는다. 첫 줄이 `is_admin()` 확인이다
- `set search_path = ''`

### AC-04

**읽음 찍기 함수.**

`mark_notifications_read(p_ids uuid[])` — `security definer`

- 첫 줄이 `is_approved()` 확인이다
- **자기 알림만 찍는다.** `profile_id`가 부르는 사람이 아닌 행은 조용히 건너뛴다 — 남의 알림 id를 넣어도 아무 일이 안 일어난다
- 이미 `read_at`이 찬 행은 안 덮는다. 처음 읽은 시각이 남는다
- 배열을 받는다. 알림 목록의 줄 하나를 누를 때도 한 개짜리 배열이다
- `set search_path = ''`

### AC-05

**기기 구독 함수 둘.**

`save_push_subscription(p_endpoint text, p_keys jsonb)`·`remove_push_subscription(p_endpoint text)` — 둘 다 `security definer`

- 저장은 upsert다. `endpoint`가 같으면 `keys`만 갈아 끼운다 — 브라우저가 키를 갱신하는 일이 있다
- 삭제는 자기 행만이다. 남의 `endpoint`를 넣어도 안 지워진다
- 둘 다 첫 줄이 `is_approved()` 확인이다
- `set search_path = ''`

### AC-06

**의사 바꾸기 함수.**

`set_notifications_enabled(p_on boolean)` — `security definer`

- `profiles.notifications_enabled`를 바꾼다
- **끄면 그 사람의 `push_subscriptions` 행도 같이 지운다.** 껐는데 구독이 남아 있으면 브라우저가 계속 살아 있는 구독으로 알고, 다시 켤 때 새로 만들지 않는다
- 켜는 것은 의사만 바꾼다. 기기 구독은 브라우저 권한을 받아야 생겨서 함수가 못 만든다 — [`notification-settings`](notification-settings.md)가 그 자리다
- 첫 줄이 `is_approved()` 확인이다

### AC-07

**에러 코드.**

- `not_approved` — 승인 안 된 사람이 불렀다
- `not_admin` — 관리자 아닌 사람이 뷰를 읽었다

`raise exception using message = '<코드>'` 꼴이다([오류의 모양](../../2-design/system/data-access.md#오류의-모양)). `src/shared/api/error-codes.ts`에 같은 문자열이 선다 — 마이그레이션과 어긋나면 `pnpm test`의 에러 코드 검사가 잡는다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_notifications.sql` | 표 둘, 뷰, RLS, 인덱스 | AC-01~AC-03 |
| `supabase/migrations/<날짜>_notification_fns.sql` | 함수 넷 | AC-04~AC-06 |
| `src/shared/api/error-codes.ts` | 코드 둘 | AC-07 |
| `src/features/notification/api/dals.ts` | 함수 넷의 `supabase.rpc()` 래퍼 | AC-04~AC-06 |
| `src/features/notification/model/types.ts` | `kind`와 `payload`의 타입 | AC-01 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `integration-test-writer` → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-07을 배정한다. **대부분 integration이다** — RLS와 `security definer`의 경계가 이 task의 본체고 그것은 DB가 있어야 보인다
2. `integration-test-writer`가 경계를 쓴다. 남의 알림 id로 `mark_notifications_read`를 부르는 것, 남의 `push_subscriptions`를 읽는 것, 관리자 아닌 사람이 뷰를 읽는 것 셋이 핵심이다
3. `implementer`가 표 → 뷰 → 함수 순으로 초록을 만든다
4. `pr-diff`가 diff를 본다 — RLS를 안 켠 표가 없는지

## 리스크·전환·되돌리기

- **`push_subscriptions`가 이 저장소에서 가장 민감한 표다.** 행 하나로 그 사람 기기에 푸시를 쏠 수 있다. RLS를 빠뜨리면 승인된 누구나 전원의 구독을 읽는다 — integration이 이것을 본다
- **`security definer` 뷰가 RLS를 우회한다.** 그것이 목적이지만 첫 줄의 `is_admin()`을 빠뜨리면 아무나 전원의 알림 상태를 읽는다. 함수와 달리 뷰는 첫 줄 확인이 눈에 덜 띈다
- **`payload`가 스키마 없는 `jsonb`다.** 낳는 쪽과 읽는 쪽이 어긋나면 화면에 빈 값이 선다. 종류마다의 모양은 [`notification-emit`](notification-emit.md)이 `src/features/notification/model/`의 타입으로 묶는다 — DB가 아니라 타입이 지킨다
- **`push_attempts`와 `claimed_at`은 이 task가 열만 낸다.** 쓰는 것은 [`notification-push`](notification-push.md)다. 열이 먼저 서야 그 task가 설 수 있어 여기 든다
- 되돌리기는 표 둘을 drop하는 마이그레이션이다. 아직 아무도 안 쓰는 단계라 값이 안 사라진다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 남의 알림이 읽힌다 | integration `tests/integration/notifications-rls.test.ts`(예정) | `pnpm test:integration:run` | 다른 사람 행이 0건 |
| AC-02 | 남의 구독이 읽힌다 | integration 위 | 위와 같다 | 다른 사람 행이 0건 |
| AC-02 | 같은 기기가 두 행이 된다 | integration 위 | 위와 같다 | 같은 `endpoint`로 두 번 저장해도 행이 1 |
| AC-03 | 관리자 아닌 사람이 뷰를 읽는다 | integration 위 | 위와 같다 | `not_admin` |
| AC-03 | 뷰가 `endpoint`를 낸다 | integration 위 | 위와 같다 | 컬럼이 둘뿐이다 |
| AC-04 | 남의 알림에 읽음이 찍힌다 | integration `tests/integration/notifications-read.test.ts`(예정) | 위와 같다 | `read_at`이 그대로 널 |
| AC-04 | 두 번 읽으면 시각이 덮인다 | integration 위 | 위와 같다 | 첫 시각이 남는다 |
| AC-06 | 껐는데 구독이 남는다 | integration 위 | 위와 같다 | 끈 뒤 `push_subscriptions` 행이 0 |
| AC-07 | 코드가 마이그레이션과 어긋난다 | unit `tests/lint/error-codes.test.ts` | `pnpm test` | 양쪽 문자열이 같다 |

- 배정하지 않은 것: 실제 푸시가 나가는 것 — [`notification-push`](notification-push.md)가 본다. 알림 행이 생기는 것 — [`notification-emit`](notification-emit.md)이 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 알림을 낳는 자리 — [`notification-emit`](notification-emit.md)
- 푸시를 쏘는 자리와 `claimed_at`·`push_attempts`·`pushed_at`을 쓰는 것 — [`notification-push`](notification-push.md)
- 알림 목록 화면과 종 아이콘 — [`notification-list`](notification-list.md)
- 프로필의 알림 스위치와 브라우저 권한 받기 — [`notification-settings`](notification-settings.md)
- 공지 보내기 `post_announcement` — 2차다([roadmap](../../1-plan/roadmap.md#릴리스-목록))
- 대시보드의 안 본 알림 영역 — [`dashboard`](../../backlog.md)
