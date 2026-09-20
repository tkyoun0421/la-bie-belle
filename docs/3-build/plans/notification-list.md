---
sources:
  - ../../2-design/modules/notification/screens/notifications.md
  - ../../2-design/modules/notification/screens/notifications.md#알림-제목
  - ../../2-design/modules/notification/design.md#읽음-찍기
  - ../../2-design/modules/notification/design.md#ui-연결
  - ../../2-design/modules/notification/README.md#ntf-023
  - ../../2-design/modules/notification/README.md#ntf-024
  - ../../2-design/modules/notification/README.md#ntf-026
  - ../../2-design/modules/notification/README.md#ntf-033
  - ../../2-design/design-system/components.md#종-아이콘
  - ../../2-design/system/navigation.md#알림을-누르면
  - ../../2-design/system/runtime.md#tanstack-query-규칙
  - ../../2-design/system/runtime.md#무효화-표
---

# 알림 목록 화면을 만든다 — 구현 계획

> 앱 골격(`expo-scaffold`)이 선 뒤에 파일 배치와 검증 명령을 채운다. 업무 규칙과 완료 조건은 그대로 선다.

## 입력 명세·기준

정본은 [notifications.md](../../2-design/modules/notification/screens/notifications.md)다. 종 아이콘은 [components.md](../../2-design/design-system/components.md#종-아이콘), 어디로 가는지는 [design.md의 UI 연결](../../2-design/modules/notification/design.md#ui-연결)과 [navigation.md](../../2-design/system/navigation.md#알림을-누르면)다.

화면 하나(`/notifications`)와 앱바에 서는 종 아이콘이 이 task의 산출이다.

선행이 하나다. [`notification-data`](notification-data.md)가 `mark_notifications_read`를 냈다. 세울 알림이 있어야 눈으로 보이므로 [`notification-emit`](notification-emit.md) 뒤가 낫지만 **막히지는 않는다** — 빈 상태와 스켈레톤이 먼저 서도 된다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **여기서만 줄 전체가 눌린다.** 대시보드는 CTA와 ✕만 눌리는데([NTF-024](../../2-design/modules/notification/README.md#ntf-024)) 목록은 반대다. 줄을 누르면 그 알림이 말한 자리로 가고 가면서 읽음이 찍힌다
- **관리자 공지만 안 눌린다.** 갈 곳이 없는 유일한 종류다. 그런데 **읽음은 여는 것으로 찍힌다** — 규칙의 예외가 둘 겹친 자리다
- **문장이 여기 산다.** 스물셋의 문장이 [알림 제목](../../2-design/modules/notification/screens/notifications.md#알림-제목) 표에 있고 대시보드도 같은 것을 쓴다. **문장을 조립하는 함수가 이 task의 산출이고 대시보드가 그것을 가져다 쓴다**
- **지난 것을 안 지운다**([NTF-026](../../2-design/modules/notification/README.md#ntf-026)). 그래서 목록이 계속 길어지고 페이지로 끊어 읽는다 — 50건이다

## 완료 조건

### AC-01

**문장을 조립하는 순수 함수.**

`src/features/notification/model/title.ts`

- 알림 행 하나를 받아 `{ title, sub }`을 낸다. `sub`는 없을 수 있다
- 스물셋의 종류를 전부 다룬다. 근거는 [알림 제목](../../2-design/modules/notification/screens/notifications.md#알림-제목) 표고 **문자열이 그 표와 글자 하나까지 같아야 한다**
- **아래 줄이 있는 종류가 넷이다** — 신청 접수 열림(마감일), 미리 알림 하루(시각과 포지션), 미리 알림 주말(날짜 둘), 사유 결과 거절(관리자가 적은 이유)
- 관리자 공지는 `payload`의 본문이 그대로 제목이다
- **푸시의 payload와 같은 표를 쓴다**(`notification-push`). 두 곳이 문장을 따로 들면 같은 알림이 기기와 화면에서 다르게 읽힌다 — 이 함수 하나를 양쪽이 쓴다

### AC-02

**받은 시각과 날짜 머리.**

`src/features/notification/model/when.ts`

- 날짜 머리 셋 — 「오늘」·「어제」·「9월 11일(목)」. **해가 다르면 「2025년 12월 31일(수)」**
- 받은 시각 셋 — 오늘이면 「2시간 전」(한 시간 안이면 「방금」·「12분 전」), 어제면 「어제 21:00」, 그 앞이면 「9월 11일」
- 순수 함수다. 기준 시각을 인자로 받는다 — `new Date()`를 안에서 부르면 테스트가 못 고정한다

### AC-03

**목록을 읽는 질의.**

- `useInfiniteQuery`에 키 `['notifications']`다([TanStack Query 규칙](../../2-design/system/runtime.md#tanstack-query-규칙))
- `range()`로 **50건씩** 읽는다. `maxPages`는 3이다
- 최근부터 내림차순이다. `(profile_id, created_at desc)` 인덱스를 탄다
- 안 읽은 수는 키 `['notifications', 'unread']`로 따로 센다. 종 아이콘의 점이 이것을 본다

### AC-04

**화면 `/notifications`.**

일곱 상태를 전부 그린다([화면 상태와 흐름](../../2-design/modules/notification/screens/notifications.md)).

- 정상·읽는 중(스켈레톤 다섯)·더 읽는 중(스피너 한 줄)·끝(문구 한 줄)·빈 상태·못 읽음·더 못 읽음
- **탭 바가 없다.** 탭 넷 위로 밀려 올라간 화면이다
- 앱바는 뒤로와 「알림」이다. **뒤로는 온 화면으로 간다** — `?from=`이 출처를 든다
- 줄은 안 읽음 점·제목·받은 시각·화살표다. 안 읽음 점은 8px 원에 `bg.brand-solid`다
- **관리자 공지 줄은 안 눌리고 화살표가 없다**
- 토큰과 여백은 문서의 색·글자·여백 표 그대로다. `.tsx`는 더미고 계산은 `.ts`다

### AC-05

**줄을 누르면.**

- `mark_notifications_read`를 부르고 목적지로 간다. **둘이 같은 순간이다**([읽음 찍기](../../2-design/modules/notification/design.md#읽음-찍기))
- 목적지는 [UI 연결](../../2-design/modules/notification/design.md#ui-연결) 표다. 날이 있는 알림은 `/schedule?date=`, 관리자 알림은 `/admin/schedule?date=`다
- 가는 자리에 `?from=notifications`를 실어 그 화면의 뒤로가 여기로 온다
- `['notifications']`와 `['notifications','unread']`를 무효화한다([무효화 표](../../2-design/system/runtime.md#무효화-표))
- **관리자 공지는 여는 것으로 읽음이 찍힌다.** 누를 자리가 없어서 목록에 뜨는 순간이 아니라 화면에 들어온 순간이다

### AC-06

**종 아이콘.**

`src/shared/ui/bell.tsx`

- lucide `Bell` 28px `fg.neutral`. 안 읽음 점은 `bg.brand-solid` 8px 원, 자리는 `top: 4px` `right: 4px`, 테두리 `bg.neutral` 2px
- **닿는 면 44px 정사각.** 아이콘은 28px 그대로고 둘레가 투명하다
- **수를 안 적고 점만 찍는다.** 안 읽은 것이 하나라도 있으면 점이다
- 서는 곳은 근무자 탭 넷과 관리자 홈이다. **퇴사자가 보는 급여 화면에는 없다**
- 누르면 `/notifications?from=<지금 경로>`로 간다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/features/notification/model/title.ts` | 스물셋의 문장 | AC-01 |
| `src/features/notification/model/when.ts` | 날짜 머리와 받은 시각 | AC-02 |
| `src/features/notification/model/destination.ts` | 종류마다의 목적지 | AC-05 |
| `src/features/notification/api/queries.ts` | `useInfiniteQuery`와 안 읽은 수 | AC-03 |
| `src/features/notification/model/use-notification-list.ts` | 목록의 상태와 누름 | AC-04·AC-05 |
| `src/screens/notifications/` | 화면 조립 | AC-04 |
| `/notifications/` 화면 | 라우트 | AC-04 |
| `src/shared/ui/bell.tsx` | 종 아이콘 | AC-06 |
| `src/shared/ui/appbar.tsx` | 오른쪽에 종을 받는 자리 | AC-06 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`notification-data`](notification-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-06을 배정한다. **AC-01·AC-02·AC-05의 목적지는 unit, AC-03은 integration, AC-04는 e2e다**
2. `unit-test-writer`가 문장 스물셋을 쓴다. **표의 문자열을 그대로 단언한다** — 이 테스트가 문서와 코드를 묶는 자리다
3. `integration-test-writer`가 페이지를 쓴다. 50건을 넘겼을 때 둘째 쪽이 오는 것과 남의 알림이 안 섞이는 것이다
4. `e2e-test-writer`가 줄을 눌러 목적지로 가고 안 읽음 점이 사라지는 것을 쓴다
5. `implementer`가 순수 함수 → 질의 → 화면 → 종 순으로 초록을 만든다
6. `pr-diff`가 diff를 본다 — `.tsx`에 계산이 든 자리가 없는지

## 리스크·전환·되돌리기

- **문장이 두 곳에 생길 위험이 이 task의 핵심이다.** 푸시도 목록도 같은 스물셋을 쓴다. AC-01의 함수 하나를 양쪽이 쓰게 묶지 않으면 기기와 화면이 다르게 말한다 — `pr-diff`가 문자열 리터럴이 두 번 선 자리를 본다
- **읽음과 이동이 같은 순간이라 하나가 실패하면 어긋난다.** 읽음을 찍고 가다가 함수가 실패하면 갔는데 안 읽음으로 남는다. 반대면 읽음인데 못 갔다 — **이동을 먼저 하고 읽음은 뒤따르게 한다.** 못 찍힌 읽음은 다음에 누르면 찍히고, 못 간 이동은 사람이 막힌다
- **목록이 계속 길어진다.** 안 지우는 규칙이라 한 사람의 행이 해마다 쌓인다. 50건씩 끊어 읽는 것이 그 방어고 `maxPages` 3이 메모리를 막는다. 서른 명 규모에서 표가 커지는 것 자체는 문제가 아니다
- **날짜 머리가 해를 넘길 때 틀리기 쉽다.** 「12월 31일(수)」과 「2025년 12월 31일(수)」이 갈린다. unit이 기준 시각을 고정해 본다
- **관리자 공지의 읽음이 화면에 들어온 순간이다.** 다른 스물둘과 다른 길이라 조용히 빠뜨리기 쉽다
- 되돌리기는 라우트와 종 아이콘을 빼는 것이다. 표와 함수는 그대로 남는다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 문장이 표와 다르다 | unit `src/features/notification/model/__tests__/title.test.ts`(예정) | `pnpm test` | 스물셋이 표 그대로 |
| AC-01 | 아래 줄이 있는 넷에 아래 줄이 없다 | unit 위 | `pnpm test` | `sub`가 든다 |
| AC-01 | 푸시와 목록이 다르게 말한다 | unit 위 | `pnpm test` | 같은 함수를 쓴다 |
| AC-02 | 해를 넘기면 날짜 머리가 틀린다 | unit `when.test.ts`(예정) | `pnpm test` | 「2025년 12월 31일(수)」 |
| AC-02 | 한 시간 안인데 「1시간 전」이라 한다 | unit 위 | `pnpm test` | 「12분 전」 |
| AC-03 | 남의 알림이 섞인다 | integration `tests/integration/notifications-list.test.ts`(예정) | `pnpm test:integration:run` | 본인 것만 |
| AC-03 | 51번째가 안 온다 | integration 위 | 위와 같다 | 둘째 쪽이 온다 |
| AC-05 | 목적지가 표와 다르다 | unit `destination.test.ts`(예정) | `pnpm test` | 종류마다 표의 경로 |
| AC-05 | 관리자 공지가 눌린다 | e2e `notifications` e2e(예정) | e2e 명령 | 안 눌리고 화살표가 없다 |
| AC-05 | 눌러도 안 읽음 점이 남는다 | e2e 위 | e2e 명령 | 돌아오면 점이 없다 |
| AC-04 | 빈 상태가 안 선다 | e2e 위 | e2e 명령 | 「아직 받은 알림이 없어요」 |
| AC-06 | 퇴사자 화면에 종이 선다 | e2e 위 | e2e 명령 | 급여 화면에 종이 없다 |
| AC-06 | 닿는 면이 44px보다 작다 | 수동 — `.artifact/measure-hit.mjs` | — | 44px 이상 |

- 배정하지 않은 것: 푸시를 눌러 앱이 열리는 길 — `notification-settings`의 Service Worker가 맡는다
- 막힌 것: 지금은 없다

## 범위 밖

- 대시보드의 안 본 알림 영역 — [`dashboard`](../../backlog.md). **AC-01의 문장 함수를 가져다 쓴다**
- 프로필의 알림 스위치 — `notification-settings`
- 알림을 낳는 자리 — [`notification-emit`](notification-emit.md)·[`notification-schedule`](notification-schedule.md)
- 푸시를 쏘는 자리 — `notification-push`
- 교대와 공지 종류의 문장 — 표에는 있지만 2차에 행이 안 생긴다. **함수는 스물셋을 다 다룬다** — 문장이 뒤늦게 갈라지는 것을 막는다
