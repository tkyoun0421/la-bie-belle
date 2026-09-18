---
sources:
  - ../../2-design/modules/notification/design.md#알림을-받나
  - ../../2-design/modules/notification/design.md#기기-구독
  - ../../2-design/modules/notification/design.md#기기-구독-저장과-삭제
  - ../../2-design/modules/notification/README.md#ntf-016
  - ../../2-design/modules/notification/README.md#ntf-021
  - ../../2-design/modules/notification/README.md#ntf-022
  - ../../2-design/modules/notification/README.md#ntf-027
  - ../../2-design/modules/notification/README.md#ntf-028
  - ../../2-design/modules/notification/README.md#ntf-029
  - ../../2-design/modules/notification/README.md#ntf-034
  - ../../2-design/modules/account/screens/profile.md#알림
  - ../../2-design/modules/account/screens/members.md
  - ../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈
---

# 알림을 켜고 끄는 자리를 만든다 — 구현 계획

## 입력 명세·기준

정본은 [notification/design.md](../../2-design/modules/notification/design.md#알림을-받나)의 [알림을 받나](../../2-design/modules/notification/design.md#알림을-받나)와 [기기 구독](../../2-design/modules/notification/design.md#기기-구독)이다. 화면은 [profile.md](../../2-design/modules/account/screens/profile.md#알림)와 [members.md](../../2-design/modules/account/screens/members.md)와 [schedule-admin.md](../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈)다.

Service Worker와 브라우저 권한 받기, 프로필의 알림 스위치, 관리자가 못 받는 사람을 보는 자리 셋이 이 task의 산출이다.

선행이 하나다. [`notification-data`](notification-data.md)가 `save_push_subscription`·`set_notifications_enabled`와 `push_reachable` 뷰를 냈다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **의사와 상태가 갈려서 셋이 난다.** 끔 / 켰는데 기기가 없음 / 켰고 기기가 있음이다. **스위치를 켜도 기기가 안 닿을 수 있다** — 그 자리를 화면이 말한다
- **아이폰은 홈 화면에 추가해야 푸시가 온다**([NTF-027](../../2-design/modules/notification/README.md#ntf-027)). 브라우저에서 연 사파리로는 권한 자체가 안 열린다 — 프로필이 그 길을 안내한다
- **관리자가 못 받는 사람을 본다**([NTF-034](../../2-design/modules/notification/README.md#ntf-034)). 갈래가 둘이라 화면이 둘을 갈라 말한다 — 「· 알림 꺼둠」과 「· 기기 안 연결」이다
- **끄면 구독도 지운다.** 함수가 그렇게 한다([`notification-data` AC-06](notification-data.md#ac-06)). 화면은 그 결과를 반영하기만 한다

## 완료 조건

### AC-01

**Service Worker.**

`public/sw.js`

- `push` 이벤트를 받아 알림을 띄운다. 제목과 본문은 [`notification-push` AC-01](notification-push.md#ac-01)이 실어 보낸 payload 그대로다
- `notificationclick`에 앱을 연다. **payload의 `url`로 간다** — 이미 열린 탭이 있으면 그 탭을 쓴다
- **관리자 공지는 `url`이 없다.** 그때는 앱의 첫 화면을 연다
- 등록은 승인된 사람이 앱을 열 때다

### AC-02

**권한 받기와 구독 만들기.**

`src/features/notification/model/use-push-subscription.ts`

- `Notification.requestPermission()`을 부르고 허락이면 `pushManager.subscribe()`로 구독을 만든다. VAPID 공개키는 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`다
- 만든 구독을 `save_push_subscription`에 넘긴다
- **거부하면 다시 못 묻는다.** 브라우저가 그렇게 한다 — 화면이 그 사실을 말하고 브라우저 설정으로 가는 길을 안내한다([NTF-029](../../2-design/modules/notification/README.md#ntf-029))
- **아이폰에서 홈 화면에 추가 안 했으면 권한을 아예 안 묻는다.** `display-mode: standalone`을 보고 갈라 안내 문구를 세운다([NTF-028](../../2-design/modules/notification/README.md#ntf-028))

### AC-03

**프로필의 알림 스위치.**

[profile.md의 알림 절](../../2-design/modules/account/screens/profile.md#알림)이 정본이다.

- 스위치가 `profiles.notifications_enabled`를 본다. 켜면 `set_notifications_enabled(true)` 뒤 AC-02의 권한 받기로 이어진다
- 끄면 `set_notifications_enabled(false)`고 구독이 지워진다
- **세 모드가 화면에 갈려 선다** — 끔 / 켰는데 기기가 없음 / 켰고 기기가 있음. 가운데가 「스위치를 켜도 기기가 안 닿을 수 있다」는 자리고 안내 면이 `bg.informative-weak`다
- 아이폰에서 홈 화면 추가 안 한 상태는 넷째 갈래로 안내가 다르다
- 토큰과 문안은 문서의 표 그대로다

### AC-04

**관리자가 못 받는 사람을 보는 자리 셋.**

- **직원 목록의 줄** — 재직자 줄 보조 정보에 「· 알림 꺼둠」이나 「· 기기 안 연결」이 붙는다([members.md](../../2-design/modules/account/screens/members.md))
- **사람 시트** — 같은 뜻의 문장 줄이 선다
- **확정 뒤 확인 시트** — 「김지우 님은 알림을 못 받아요 · 따로 연락해주세요」다([schedule-admin.md](../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈)). **경고가 아니라 안내라 색이 `fg.neutral-muted`다** — `fg.warning`이 아니다
- 셋 다 `push_reachable` 뷰와 `profiles.notifications_enabled`를 본다. **둘을 곱해 갈래가 갈린다**
- 둘이 걸린 바꾸기에서 한쪽만 못 받으면 그 사람 이름만 적는다. 받는 쪽은 안 적는다

### AC-05

**읽는 질의.**

- 관리자의 직원 목록이 `push_reachable`을 함께 읽는다. 키는 `['members']`다
- **근무자는 이 뷰를 안 읽는다.** 자기 상태는 `profiles`와 자기 `push_subscriptions` 행으로 안다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `public/sw.js` | 푸시 받기와 누름 | AC-01 |
| `src/features/notification/model/use-push-subscription.ts` | 권한과 구독 | AC-02 |
| `src/features/notification/model/reachability.ts` | 세 모드 판정 | AC-03·AC-04 |
| `src/features/notification/api/queries.ts` | `push_reachable` 읽기 | AC-05 |
| `src/screens/profile/` | 알림 절 | AC-03 |
| `src/screens/members/` | 줄과 사람 시트의 표시 | AC-04 |
| `src/screens/schedule-admin/` | 확정 뒤 확인 시트의 줄 | AC-04 |
| `.env.example` | VAPID 공개키 이름 | AC-02 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`notification-data`](notification-data.md)가 merge된 뒤에 시작한다. **프로필과 직원 목록과 관리자 근무표 화면이 이미 서 있어야 한다** — 이 task는 그 화면들에 자리를 더한다.

1. `test-planner`가 AC-01~AC-05를 배정한다. **AC-03·AC-04의 판정은 unit, AC-05는 integration, 화면은 e2e다**
2. `unit-test-writer`가 세 모드 판정을 쓴다. 의사와 기기 유무의 네 조합이다
3. `integration-test-writer`가 관리자만 뷰를 읽는 것을 쓴다
4. `e2e-test-writer`가 스위치를 끄면 구독이 사라지는 것을 쓴다
5. `implementer`가 Service Worker → 권한 → 스위치 → 관리자 표시 순으로 초록을 만든다
6. `pr-diff`가 diff를 본다 — `endpoint`나 `keys`가 관리자 쪽 질의에 섞인 자리가 없는지
7. **진짜 기기로 한 번 받아본다.** 안드로이드와 아이폰(홈 화면 추가 뒤) 둘이다

## 리스크·전환·되돌리기

- **아이폰이 이 task에서 가장 어렵다.** 홈 화면에 추가해야 권한이 열리고, 추가는 사람이 사파리 메뉴에서 직접 한다. 안내가 틀리면 사람이 알림을 못 켜고 그 사실을 관리자만 「· 기기 안 연결」로 본다 — **실기기 확인이 출시 판정의 참조에 든다**([roadmap](../../1-plan/roadmap.md#릴리스-목록))
- **거부한 뒤에는 앱이 아무것도 못 한다.** 브라우저가 다시 묻는 것을 막는다. 화면이 브라우저 설정으로 가는 길을 말하는 것이 전부다
- **구독이 조용히 죽는다.** 기기가 앱을 지우거나 브라우저가 키를 갱신하면 그렇다. 410으로 지우는 것은 [`notification-push` AC-02](notification-push.md#ac-02)가 하고, 그 뒤 이 사람은 「기기 안 연결」로 보인다 — **사람 본인에게는 안 알린다.** 다음에 프로필을 열면 안다
- **관리자 화면에 `endpoint`가 새면 안 된다.** 뷰가 불리언만 내지만 질의를 잘못 짜면 `push_subscriptions`를 직접 읽을 수 있다. RLS가 막지만 `pr-diff`가 한 겹 더 본다
- **Service Worker가 캐시를 잡으면 배포가 안 먹는다.** 푸시만 다루고 캐시는 안 건드린다 — 오프라인은 [runtime.md](../../2-design/system/runtime.md#오프라인)가 따로 정한다
- 되돌리기는 스위치와 관리자 표시를 숨기는 것이다. 이미 만든 구독은 남고 푸시는 계속 간다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-03 | 세 모드가 안 갈린다 | unit `src/features/notification/model/__tests__/reachability.test.ts`(예정) | `pnpm test` | 네 조합이 각각 다른 안내 |
| AC-04 | 「꺼둠」과 「안 연결」이 뒤바뀐다 | unit 위 | `pnpm test` | 의사가 거짓이면 「꺼둠」 |
| AC-05 | 관리자 아닌 사람이 뷰를 읽는다 | integration `tests/integration/push-reachable.test.ts`(예정) | `pnpm test:integration:run` | `not_admin` |
| AC-05 | 질의에 `endpoint`가 섞인다 | integration 위 | 위와 같다 | 컬럼이 둘뿐 |
| AC-03 | 껐는데 구독이 남는다 | e2e `e2e/notification-settings.spec.ts`(예정) | `pnpm e2e` | 끈 뒤 「기기 안 연결」 |
| AC-04 | 확정 뒤 시트에 경고색이 쓰인다 | e2e `e2e/schedule-admin.spec.ts`(예정) | `pnpm e2e` | `fg.neutral-muted` |
| AC-01 | 누르면 엉뚱한 데로 간다 | 수동 — 진짜 기기 | 운영 | payload의 `url` |
| AC-02 | 아이폰에서 권한이 안 열린다 | 수동 — 홈 화면 추가 뒤 | 운영 | 권한 창이 뜬다 |

- 배정하지 않은 것: 진짜 푸시가 기기에 닿는 것 — 로컬에서 못 본다. 안드로이드와 아이폰 둘로 배포 뒤 손 확인이다
- 막힌 것: 프로필·직원 목록·관리자 근무표 화면이 아직 안 섰다. 그 셋이 merge되기 전에는 AC-03과 AC-04가 못 선다

## 범위 밖

- 표와 함수 — [`notification-data`](notification-data.md)
- 푸시를 쏘는 자리 — [`notification-push`](notification-push.md)
- 알림 목록 화면과 종 아이콘 — [`notification-list`](notification-list.md)
- 오프라인 캐시 — [runtime.md](../../2-design/system/runtime.md#오프라인)가 따로 정한다
- 기기 둘 중 하나만 성공한 것의 표시 — [Q-01](../../2-design/modules/notification/design.md#q-01)이 두고 보기로 했다
