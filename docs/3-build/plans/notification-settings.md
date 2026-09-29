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

저장소에서 확인한 것이 넷이다. **`expo-notifications`가 아직 의존성에 없다**(`package.json`). 함수 넷은 `supabase/migrations/20260922091506_notifications.sql`에 서 있고, 「나」 화면(`src/screens/profile/`)·승인 대기 화면(`src/screens/pending/`)·직원 목록(`src/screens/members/`)·배정(`src/features/schedule-assign/`)이 이미 섰다.

## 이 plan이 정본에 박은 판정

- **iOS 쪽 차이를 정본이 안 적는다.** 안드로이드의 알림 채널만 적혀 있다(AC-06). iOS는 채널 개념이 없고 권한 요청이 곧 시스템 창이라 **추가 단계가 없다** — 이 plan이 그 사실을 적고 화면은 플랫폼 분기 하나로 끝낸다
- **주소를 받으려면 `projectId`가 든다.** Expo 푸시 주소는 EAS 프로젝트에 묶여 `app.json`의 `extra.eas.projectId`를 읽어 넘긴다. 그 값이 없으면 개발 빌드에서 주소 발급이 실패한다 — 화면은 그 실패를 「켰는데 기기가 없음」 갈래로 받는다

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

- 앱이 떠 있는 동안 주소가 바뀌는 것도 같은 자리에서 받는다
- 같은 주소를 다시 보내도 행이 안 는다 — `save_push_token`의 upsert가 `token`으로 부딪힌다
- **한 기기를 A가 쓰다 B가 로그인하면 주소가 B에게 옮겨간다.** 함수 안의 일이고 이 task는 부르기만 한다([기기 주소](../../2-design/modules/notification/design.md#기기-주소))

### AC-05

**끈 사람의 주소가 안 되살아난다.**

- `save_push_token`이 의사가 거짓이면 아무 일도 안 한다. **이미 선 함수라 이 task가 고칠 것이 있는지부터 확인한다** — 막는 겹이 없으면 마이그레이션 한 줄이 이 task에 든다
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
- 권한 거부면 스위치 대신 안내 한 줄이다
- **켰는데 기기가 안 닿는 것을 근무자에게 안 말한다** — 고칠 것이 없는 경고가 된다([profile.md](../../2-design/modules/account/screens/profile.md#알림))

### AC-08

**관리자가 보는 갈래 표시.**

자리 셋이다 — 직원 목록의 사람 줄, 사람 시트, 확정 뒤 배정을 바꾸는 확인.

- 읽는 것은 `push_reachable` 뷰다. `profile_id`와 `has_device`만 오고 주소는 안 온다
- 화면이 「꺼두었어요」와 「기기가 안 연결됐어요」를 갈라 말한다([NTF-034](../../2-design/modules/notification/README.md#ntf-034))
- **관리자가 아니면 빈 결과다** — 예외가 아니다. 그 사실이 DB에 있어 integration이 본다
- 문안은 `writing.md`와 그 화면 문서가 정본이다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `package.json`·`app.json` | `expo-notifications` 의존성과 `projectId` 읽는 자리 | AC-01 |
| `src/features/notification/model/push-permission.ts` | 권한 상태 셋, 안드로이드 채널, 주소 받기 | AC-01·AC-06 |
| `src/features/notification/model/reach-state.ts` | 갈래 판정 순수 함수 | AC-02·AC-07·AC-08 |
| `src/features/notification/model/useNotificationSwitch.ts` | 켜기·끄기의 순서와 실패 되돌리기 | AC-03 |
| `src/features/notification/model/useSavePushToken.ts` | 매 진입 주소 보내기 | AC-04 |
| `src/entities/notification/dals/save-push-token.ts`·`remove-push-token.ts`·`set-notifications-enabled.ts` | 함수 넷 중 이 화면이 부르는 셋 | AC-03·AC-04 |
| `src/entities/notification/dals/get-push-reachable.ts` | `push_reachable` 뷰 읽기 | AC-08 |
| `src/screens/profile/` | 알림 줄과 끄기 확인 Dialog | AC-07 |
| `src/screens/pending/` | 켜기 자리 | AC-06 |
| `src/screens/members/`·사람 시트·배정 확인 | 갈래 표시 | AC-08 |
| `supabase/migrations/<날짜>_*.sql` — **필요할 때만** | `save_push_token`에 의사 검사가 없으면 더한다 | AC-05 |
| `src/features/notification/model/__tests__/`·`src/entities/notification/dals/__tests__/` | 갈래 판정과 함수의 짝 | AC-02·AC-04·AC-05·AC-08 |
| `tests/e2e/notification-settings.yaml` | 켜기·끄기·거부의 여정 | AC-01·AC-03·AC-06·AC-07 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-08을 배정한다. **정본 모순을 명시로 돌려받는다** — 특히 AC-05의 함수가 이미 막는지, 권한을 쥔 기기 동작을 어느 층이 보나
2. `unit-test-writer`가 갈래 판정과 훅의 순서(켜기는 의사 먼저, 끄기는 반대)를 쓴다
3. `integration-test-writer`가 주소가 사람 사이를 옮기는 것, 끈 사람의 주소가 안 되살아나는 것, 뷰가 주소를 안 내고 관리자가 아니면 빈 결과인 것을 쓴다
4. `e2e-test-writer`가 켜기·끄기·거부의 여정을 쓴다. **못 돌린다** — 기기 빌드가 없다
5. `implementer`가 의존성 → 권한 감싸기 → 훅 → 화면 넷 순으로 초록을 만든다
6. `pr-diff`가 diff를 본다

## 리스크·전환·되돌리기

- **기기 권한은 시뮬레이터로 다 못 본다.** 거부 상태의 화면, 안드로이드 채널, 실제 주소 발급은 개발 빌드가 있어야 닫힌다. **AC-01·AC-06은 배포 뒤 손 확인이 남는다**
- **`expo-notifications`가 새 의존성이다.** 네이티브 모듈이라 Expo Go에서 일부가 안 돈다 — 개발 빌드가 없는 지금은 화면이 뜨는지까지만 본다
- **끄기가 통째다.** 폰 둘을 쓰는 사람이 한 기기만 끌 길이 없다([NTF-019](../../2-design/modules/notification/README.md#ntf-019)). 1차의 판정이고 고치려면 의사를 기기에 붙여야 한다
- **관리자 화면 셋에 같은 표시가 붙는다.** 문장이 세 곳에서 갈라지면 같은 상태가 다르게 읽힌다 — 조각 하나를 세 화면이 쓴다
- 되돌리기는 화면에서 알림 줄을 빼는 것이다. 표와 함수는 `notification-data`의 것이라 남는다

## 범위 밖

- 푸시를 부치는 자리 — [`notification-push`](notification-push.md)가 이미 냈다
- 알림을 낳는 자리 — [`notification-emit`](notification-emit.md)
- 알림 목록 화면 — [`notification-list`](notification-list.md)
- 「나」·승인 대기·직원 목록·배정 화면 자체 — 각자의 task가 세웠고 이 task는 알림 자리만 채운다
- 기기마다 따로 끄는 길 — [NTF-019](../../2-design/modules/notification/README.md#ntf-019)가 1차에서 안 연다
