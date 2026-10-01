---
sources:
  - ../../2-design/spec/notification-settings.md
  - ../../2-design/modules/notification/design.md#알림을-받나
  - ../../2-design/modules/notification/design.md#기기-주소
  - ../../2-design/modules/notification/design.md#기기-주소-저장과-삭제
  - ../../2-design/modules/notification/README.md#ntf-016
  - ../../2-design/modules/notification/README.md#ntf-017
  - ../../2-design/modules/notification/README.md#ntf-018
  - ../../2-design/modules/notification/README.md#ntf-021
  - ../../2-design/modules/notification/README.md#ntf-027
  - ../../2-design/modules/notification/README.md#ntf-034
  - ../../2-design/modules/account/screens/profile.md#알림
  - ../../2-design/modules/account/screens/login.md
  - ../../2-design/system/runtime.md#로딩
  - ../../2-design/system/data-access.md#오류의-모양
---

# 알림을 켜고 끄는 자리를 만든다 — 구현 계획

## 입력 명세·기준

완료 조건은 [spec/notification-settings.md](../../2-design/spec/notification-settings.md)의 AC-01~AC-08과 상태 격자 여덟 줄이다. 화면의 모양은 [profile.md 「알림」](../../2-design/modules/account/screens/profile.md#알림)과 [login.md](../../2-design/modules/account/screens/login.md)가, 갈래와 함수는 [notification/design.md](../../2-design/modules/notification/design.md#알림을-받나)가 정본이다.

**화면을 새로 세우지 않는다.** 이 task는 이미 선 화면 넷에 알림 자리를 채운다 — 「나」의 알림 줄, 승인 대기 화면의 켜기 자리, 직원 목록·사람 시트의 갈래 표시, 확정 뒤 배정을 바꾸는 확인 자리다. 표와 함수 넷은 [`notification-data`](notification-data.md)가 이미 냈다.

**알림 영역 전체가 이 task에 걸려 있다.** 기기 주소를 저장하는 자리가 없으면 [`notification-push`](notification-push.md)가 세운 발송 경로로 한 건도 안 나간다 — `claim_notifications`가 주소 없는 행을 잡아 다섯 번을 태우고 끝난다.

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **의사와 기기는 다른 값이다.** `profiles.notifications_enabled`와 `push_tokens` 유무를 곱해 갈래가 셋이다([알림을 받나](../../2-design/modules/notification/design.md#알림을-받나))
- **켜기와 끄기의 순서가 반대다.** 켤 때는 의사를 먼저 참으로 바꾸고 기기에 권한을 묻는다. 끌 때는 의사를 거짓으로 바꾸면서 그 기기 주소도 같이 지운다([AC-02](../../2-design/spec/notification-settings.md))
- **권한 상태가 셋이다** — 안 물어본 상태·허락·거부. 거부는 앱이 다시 못 묻는 자리라 버튼 대신 기기 설정으로 가는 길을 안내한다([NTF-027](../../2-design/modules/notification/README.md#ntf-027))
- **막는 자리가 앱이 아니라 함수 안이다.** 끈 사람의 주소가 매 진입 흐름을 타고 되살아나면 끄기가 안 끈 것이 된다 — `save_push_token`이 그것을 막는다(AC-05)
- **관리자는 주소를 못 읽는다.** `push_reachable` 뷰가 `profile_id`와 `has_device`만 내고, 관리자가 아니면 예외가 아니라 빈 결과다(AC-07)

저장소에서 확인한 것이 여섯이다. **`expo-notifications`가 아직 의존성에 없다**(`package.json`). 함수 넷은 `supabase/migrations/20260922091506_notifications.sql`에 서 있고, 「나」 화면(`src/screens/profile/`)·승인 대기 화면(`src/screens/pending/`)·직원 목록(`src/screens/members/`)·확정 뒤 확인(`src/screens/schedule-admin/`)이 이미 섰다. **`save_push_token`이 이미 의사를 본다** — `supabase/migrations/20260922091507_notification_functions.sql`의 `where id = caller_profile_id and notifications_enabled`라 AC-05에 마이그레이션이 안 든다. **`push_reachable`은 이미 `where public.is_admin()`이라** 비관리자에게 예외가 아니라 빈 결과고, 그 사실과 주소를 안 내는 것은 `notification-functions.integration.test.ts`·`notification-rls.integration.test.ts`가 이미 덮는다.

## 이 plan이 정본에 박은 판정

- **iOS 쪽 차이를 정본이 안 적는다.** 안드로이드의 알림 채널만 적혀 있다(AC-06). iOS는 채널 개념이 없고 권한 요청이 곧 시스템 창이라 **추가 단계가 없다** — 이 plan이 그 사실을 적고 화면은 플랫폼 분기 하나로 끝낸다
- **주소를 받으려면 `projectId`가 든다.** Expo 푸시 주소는 EAS 프로젝트에 묶여 `app.json`의 `extra.eas.projectId`를 읽어 넘긴다. 그 값이 없으면 개발 빌드에서 주소 발급이 실패한다 — 화면은 그 실패를 「켰는데 기기가 없음」 갈래로 받는다
- **승인 대기 화면의 모습이 셋인데 코드의 값은 다른 셋이다.** `src/screens/pending/model/notification-prompt.ts`가 `"idle" | "enabled" | "unsupported"`를 들고 `"denied"` 결과를 받으면 `current`를 그대로 돌려줘 **거부해도 화면이 안 넘어간다**. [login.md 「알림 영역의 세 모습」](../../2-design/modules/account/screens/login.md#알림-영역의-세-모습)의 셋째가 「거부한 뒤」니 뷰 값을 `"idle" | "enabled" | "denied"`로 맞추고, 기기가 물음 자체를 못 띄우는 `"unsupported"` 결과도 같은 셋째 모습으로 보낸다 — 넷째 모습이 정본에 없다. **`src/screens/pending/model/__tests__/notification-prompt.test.ts`의 `toBe("unsupported")` 단언이 이 판정으로 바뀐다** — `unit-test-writer`가 고쳐 쓰고 `implementer`는 받은 것을 그대로 통과시킨다

## 완료 조건

### AC-01

**권한을 읽고 묻는 자리.**

`src/features/notification/model/push-permission.ts`와 그 훅.

- 상태 셋을 낸다 — 안 물어본 상태·허락·거부. `expo-notifications`의 권한 조회를 감싼다
- **진입 즉시 안 묻는다.** 사람이 누를 때만 묻는다([NTF-017](../../2-design/modules/notification/README.md#ntf-017))
- **안드로이드는 채널을 먼저 만든다.** 채널이 없으면 권한 창이 안 떠 거부와 구별이 안 된다(AC-06). iOS는 그 단계가 없다
- 허락이면 주소를 받아 `save_push_token`을 부른다. 주소 발급이 실패하면 던지지 않고 「기기 없음」으로 돌려준다

### AC-02

**갈래를 판정하는 순수 함수.**

`src/features/notification/model/reach-state.ts`.

- 의사(`notifications_enabled`)와 기기(주소 유무)와 권한 상태 셋을 받아 화면이 그릴 갈래를 낸다 — 끔 / 켰는데 기기가 없음 / 켰고 기기가 있음 / 권한 거부
- **권한 거부가 넷째로 갈린다.** 스위치를 세울지 안내를 세울지가 여기서 갈린다(AC-03)
- 읽는 중에는 그 어느 갈래도 아니다 — 스위치를 꺼진 모양으로 먼저 그리면 끈 것처럼 보인다(상태 격자 「로딩」)

### AC-03

**켜고 끄는 훅.**

`src/features/notification/model/useNotificationSwitch.ts`(이름은 테스트가 정한다).

- **켜기** — `set_notifications_enabled(true)`를 먼저 보내고 권한을 묻는다. 거부되면 의사는 참인 채로 끝난다
- **끄기** — 확인 Dialog를 거친 뒤([profile.md](../../2-design/modules/account/screens/profile.md#알림)) `set_notifications_enabled(false)`를 보낸다. 그 함수가 주소도 같이 지운다
- 끄기가 실패하면 스위치가 원래대로 돌아간다. 주소 저장이 실패하면 의사는 참인 채로 「기기 없음」 갈래다
- 무효화 키는 `['members']`다 — 관리자 직원 목록의 갈래가 그 값으로 갈린다([알림을 받나](../../2-design/modules/notification/design.md#알림을-받나))

### AC-04

**매 진입에 주소를 보낸다.**

- **진입은 앱이 뜰 때 한 번과 포그라운드로 돌아올 때마다다**([기기 주소](../../2-design/modules/notification/design.md#기기-주소)). 화면 사이를 오가는 것은 진입이 아니다. `AppState` 선례가 저장소에 없으니 이 task가 첫 자리를 만든다 — 구독은 훅 안에 두고 순수 함수는 상태 전이만 받는다
- 앱이 떠 있는 동안 주소가 바뀌는 것도 같은 자리에서 받는다
- 같은 주소를 다시 보내도 행이 안 는다 — `save_push_token`의 upsert가 `token`으로 부딪힌다
- **한 기기를 A가 쓰다 B가 로그인하면 주소가 B에게 옮겨간다.** 함수 안의 일이고 이 task는 부르기만 한다([기기 주소](../../2-design/modules/notification/design.md#기기-주소))

### AC-05

**끈 사람의 주소가 안 되살아난다.**

- `save_push_token`이 의사가 거짓이면 아무 일도 안 한다. **이미 그렇게 서 있다** — `where id = caller_profile_id and notifications_enabled`라 마이그레이션이 안 든다
- **테스트가 이미 덮는다** — `notification-functions.integration.test.ts`가 그 자리를 본다. 이 task는 재배정하지 않는다
- 앱도 안 부르지만 그것은 한 겹 더일 뿐이다

### AC-06

**승인 대기 화면의 켜기 자리.**

`src/screens/pending/`의 셋째 모습이다([login.md](../../2-design/modules/account/screens/login.md)).

- **켜기가 다음 단계로 가는 문이 아니다.** 안 켜도 막히지 않고 켜도 화면이 안 넘어간다([NTF-018](../../2-design/modules/notification/README.md#ntf-018))
- 승인 전에도 주소가 저장된다 — 그 주소가 있어야 가입 승인 알림이 간다
- 권한을 거부한 사람에게는 「나」 화면과 **같은 문장**이 선다([NTF-028](../../2-design/modules/notification/README.md#ntf-028))

### AC-07

**「나」 화면의 알림 줄.**

`src/screens/profile/`의 설정 카드 안이다.

- 스위치 하나가 통째로 든다. 종류별로 안 나눈다([NTF-021](../../2-design/modules/notification/README.md#ntf-021))
- 권한 거부면 스위치 대신 안내 두 줄이다 — 「알림이 꺼져 있어요」와 「기기 설정에서 알림을 켜면 받을 수 있어요」고 [승인 대기 화면](../../2-design/modules/account/screens/login.md#승인-대기-문안)과 같은 문장이다([profile.md 문안](../../2-design/modules/account/screens/profile.md#프로필-문안))
- **켰는데 기기가 안 닿는 것을 근무자에게 안 말한다** — 고칠 것이 없는 경고가 된다([profile.md](../../2-design/modules/account/screens/profile.md#알림))

### AC-08

**관리자가 보는 갈래 표시.**

자리 셋이다 — 직원 목록의 사람 줄, 사람 시트, 확정 뒤 배정을 바꾸는 확인.

- 읽는 것은 `push_reachable` 뷰다. `profile_id`와 `has_device`만 오고 주소는 안 온다
- **가르는 자리와 합치는 자리가 다르다.** 직원 목록과 사람 시트는 갈라 말하고([members.md 문안](../../2-design/modules/account/screens/members.md#목록-문안)), 확정 뒤 확인 자리는 「…은 알림을 못 받아요 · 따로 연락해주세요」 한 줄이다([schedule-admin.md](../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세)). 그 자리에서 관리자가 할 일이 어느 갈래든 따로 연락 하나다
- **재직자에게만 붙는다.** 퇴사 구획과 퇴사한 사람 시트에는 안 선다
- **관리자가 아니면 빈 결과다** — `push_reachable`이 이미 `where public.is_admin()`이고 `notification-rls.integration.test.ts`가 그 자리를 본다. 이 task는 재배정하지 않는다
- 문안은 그 화면 문서의 문안 표가 정본이다 — 목록은 「· 알림 꺼둠」·「· 기기 안 연결」, 사람 시트는 「알림을 꺼두었어요」·「기기에서 알림을 꺼서 안 가요」다. `list-members.ts`가 아직 `notifications_enabled`를 안 읽어 읽는 자리가 는다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `package.json`·`app.json` | `expo-notifications` 의존성과 `projectId` 읽는 자리 | AC-01 |
| `src/features/notification/model/push-permission.ts` | 권한 상태 셋, 안드로이드 채널, 주소 받기 | AC-01·AC-06 |
| `src/features/notification/model/reach-state.ts` | 갈래 판정 순수 함수 | AC-02·AC-07·AC-08 |
| `src/features/notification/model/useNotificationSwitch.ts` | 켜기·끄기의 순서와 실패 되돌리기 | AC-03 |
| `src/features/notification/model/useSavePushToken.ts` | 매 진입 주소 보내기 | AC-04 |
| `src/entities/notification/api/save-push-token.ts`·`remove-push-token.ts`·`set-notifications-enabled.ts` | 함수 넷 중 이 화면이 부르는 셋 | AC-03·AC-04 |
| `src/entities/notification/api/get-push-reachable.ts` | `push_reachable` 뷰 읽기 | AC-08 |
| `src/screens/profile/` | 알림 줄과 끄기 확인 Dialog | AC-07 |
| `src/screens/pending/` | 켜기 자리 | AC-06 |
| `src/screens/members/`·`src/screens/schedule-admin/` | 갈래 표시. 확정 뒤 확인은 한 줄로 합친다 | AC-08 |
| `src/entities/profile/api/list-members.ts` | 목록이 `push_reachable`과 의사를 같이 읽는다 | AC-08 |
| `src/screens/pending/model/notification-prompt.ts` | 뷰 값을 `"denied"`로 맞춘다 | AC-06 |
| `src/features/notification/model/__tests__/`·`src/entities/notification/api/__tests__/` | 갈래 판정과 함수의 짝 | AC-02·AC-04·AC-05·AC-08 |
| `tests/e2e/notification-settings.yaml` | 켜기·끄기·거부의 여정 | AC-01·AC-03·AC-06·AC-07 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-08을 배정한다 — 돌았고 판정 여섯이 위 두 절에 박혔다
2. `unit-test-writer`가 갈래 판정과 훅의 순서(켜기는 의사 먼저, 끄기는 반대)와 승인 대기 뷰 전이를 쓴다. **`notification-prompt.test.ts`의 `"unsupported"` 단언을 `"denied"`로 고쳐 쓴다**
3. `integration-test-writer`가 주소가 사람 사이를 옮기는 것을 쓴다. **AC-05와 AC-07의 DB 자리는 이미 선 테스트가 덮어 재배정하지 않는다**
4. `e2e-test-writer`가 켜기·끄기·거부의 여정을 쓴다. **못 돌린다** — 기기 빌드가 없다
5. `implementer`가 의존성 → 권한 감싸기 → 훅 → 화면 넷 순으로 초록을 만든다
6. `pr-diff`가 diff를 본다

## 리스크·전환·되돌리기

- **기기 권한은 시뮬레이터로 다 못 본다.** 거부 상태의 화면, 안드로이드 채널, 실제 주소 발급은 개발 빌드가 있어야 닫힌다. **AC-01·AC-06은 배포 뒤 손 확인이 남는다**
- **`expo-notifications`가 새 의존성이다.** 네이티브 모듈이라 Expo Go에서 일부가 안 돈다 — 개발 빌드가 없는 지금은 화면이 뜨는지까지만 본다
- **끄기가 통째다.** 폰 둘을 쓰는 사람이 한 기기만 끌 길이 없다([NTF-019](../../2-design/modules/notification/README.md#ntf-019)). 1차의 판정이고 고치려면 의사를 기기에 붙여야 한다
- **관리자 화면 셋의 문장이 두 벌이다.** 목록과 사람 시트는 갈래 둘, 확정 뒤 확인은 합친 한 줄이다. 판정은 한 함수가 내고 문장만 자리마다 고른다 — 판정을 두 벌 만들면 같은 사람이 화면마다 다른 갈래로 읽힌다
- 되돌리기는 화면에서 알림 줄을 빼는 것이다. 표와 함수는 `notification-data`의 것이라 남는다

## 범위 밖

- 푸시를 부치는 자리 — [`notification-push`](notification-push.md)가 이미 냈다
- 알림을 낳는 자리 — [`notification-emit`](notification-emit.md)
- 알림 목록 화면 — [`notification-list`](notification-list.md)
- 「나」·승인 대기·직원 목록·배정 화면 자체 — 각자의 task가 세웠고 이 task는 알림 자리만 채운다
- 기기마다 따로 끄는 길 — [NTF-019](../../2-design/modules/notification/README.md#ntf-019)가 1차에서 안 연다
