---
status: draft
sources:
  - ../modules/notification/README.md#ntf-021
  - ../modules/notification/design.md#읽음-찍기
  - ../modules/notification/design.md#ui-연결
  - ../modules/notification/screens/notifications.md
  - ../system/navigation.md#경로
  - ../system/navigation.md#뒤로
  - ../system/runtime.md#tanstack-query-규칙
  - ../system/runtime.md#로딩
---

# 근무자와 관리자가 받은 알림을 목록으로 본다

## 요구

[notification-data](../../3-build/plans/notification-data.md)가 알림 그릇을 세웠는데 볼 자리가 없다. 푸시를 놓치면 그 알림이 어디에도 안 남는다.

**문장을 만드는 자리가 여기다.** 알림 스물셋의 제목을 조립하는 순수 함수가 이 task에서 서고, **푸시도 그 함수를 가져다 쓴다** — 두 곳이 문장을 따로 들면 같은 알림이 기기와 화면에서 다르게 읽힌다.

## 설계 참조

- **문장 표가 정본이다** — [notifications.md 「알림 제목」](../modules/notification/screens/notifications.md#알림-제목). 함수가 내는 문자열이 그 표와 글자 하나까지 같아야 한다
- **읽음과 이동이 같은 순간이다** — [design.md 「읽음 찍기」](../modules/notification/design.md#읽음-찍기)
- **목적지 표** — [design.md 「UI 연결」](../modules/notification/design.md#ui-연결)
- **화면의 모양과 문안** — [notifications.md](../modules/notification/screens/notifications.md)가 정본이고 상태 일곱이 그 문서에 있다

## 완료 조건

### AC-01

- 전제: 알림이 쌓인 사람
- 행동: 종 아이콘으로 `/notifications`를 연다
- 관찰 결과: 최근부터 내려온다. 줄은 안 읽음 점·제목·받은 시각·화살표다. **탭 바가 없다** — 탭 넷 위로 밀려 올라간 화면이다. **뒤로는 온 화면으로 간다** — 출처가 주소에 실린다
- 검증 층: e2e
- 근거: [notifications.md](../modules/notification/screens/notifications.md), [navigation.md 「뒤로」](../system/navigation.md#뒤로)

### AC-02

- 전제: 알림 스물셋 중 아무 종류
- 행동: 제목을 읽는다
- 관찰 결과: 종류마다 문장이 조립된다. **아래 줄이 있는 종류가 넷이다** — 신청 접수 열림(마감일), 미리 알림 하루(시각과 포지션), 미리 알림 주말(날짜 둘), 사유 결과 거절(관리자가 적은 이유). 관리자 공지는 본문이 그대로 제목이다
- 검증 층: unit — 스물셋이 전부 표와 글자 하나까지 같은지를 단언한다
- 근거: [notifications.md 「알림 제목」](../modules/notification/screens/notifications.md#알림-제목)

### AC-03

- 전제: 받은 시각이 제각각인 알림들
- 행동: 목록을 본다
- 관찰 결과: 날짜 머리가 셋으로 갈린다 — 「오늘」·「어제」·날짜. **해가 다르면 연도가 붙는다.** 받은 시각도 셋이다 — 오늘이면 얼마 전인지, 어제면 시각, 그 앞이면 날짜다. 한 시간 안이면 분 단위고 방금이면 「방금」이다
- 검증 층: unit — 기준 시각을 인자로 받는 순수 함수라 날짜를 넣어 본다
- 근거: [notifications.md](../modules/notification/screens/notifications.md)

### AC-04

- 전제: 알림이 쉰 건을 넘는다
- 행동: 목록을 끝까지 내린다
- 관찰 결과: **50건씩 끊어 읽는다.** 더 읽는 중에는 줄 하나짜리 표시가 서고 끝에 닿으면 문구 한 줄이다
- 검증 층: e2e
- 근거: [runtime.md 「TanStack Query 규칙」](../system/runtime.md#tanstack-query-규칙)

### AC-05

- 전제: 안 읽은 알림 줄
- 행동: 줄을 누른다
- 관찰 결과: **읽음이 찍히는 것과 목적지로 가는 것이 같은 순간이다.** 가는 자리에 출처가 실려 그 화면의 뒤로가 여기로 온다. 날이 있는 알림은 근무자 근무표의 그 날로, 관리자 알림은 관리자 근무표의 그 날로 간다. **관리자 공지 줄은 안 눌리고 화살표가 없다** — 대신 **화면에 들어온 순간** 읽음이 찍힌다
- 검증 층: e2e
- 근거: [design.md 「읽음 찍기」](../modules/notification/design.md#읽음-찍기), [design.md 「UI 연결」](../modules/notification/design.md#ui-연결)

### AC-06

- 전제: 근무자 탭 넷과 관리자 홈
- 행동: 종 아이콘을 본다
- 관찰 결과: **수를 안 적고 점만 찍는다** — 안 읽은 것이 하나라도 있으면 점이다. **닿는 면이 44px 정사각**이고 아이콘은 그대로며 둘레가 투명하다. 누르면 지금 경로를 출처로 실어 목록으로 간다. **퇴사자가 보는 급여 화면에는 종이 없다**
- 검증 층: e2e
- 근거: [notifications.md](../modules/notification/screens/notifications.md)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 받은 알림이 하나도 없으면 목록 자리에 빈 상태가 온다. 종 아이콘에는 점이 없다 — 「0」을 안 적는다 | AC-01, AC-06 |
| 로딩 | 첫 진입에 **스켈레톤 다섯**, 캐시가 있으면 표시 없음 — [runtime.md 「로딩」](../system/runtime.md#로딩)의 기본값을 상속한다. 더 읽는 중에는 목록 끝에 줄 하나짜리 표시다 | AC-01, AC-04 |
| 실패 | 첫 읽기가 실패하면 목록 자리에 한 줄과 다시 시도. **더 읽다 실패하는 것은 따로다** — 이미 그린 줄들이 남고 끝에만 다시 시도가 선다. 읽음 찍기가 실패해도 **이동은 간다** — 목적지가 더 중요하고 점은 다음 읽기에 맞는다 | AC-04, AC-05 |
| 권한 없음 | 남의 알림은 한 행도 안 온다 — RLS가 본인 것으로 좁힌다. 승인 전인 사람도 가입 승인 알림 하나는 받는다 | AC-01 |
| 경계 | **50건씩** 읽고 쥐는 페이지 수에 한도가 있다 — 끝없이 내려도 메모리가 안 는다. 날짜 머리는 **해가 다르면** 연도가 붙는다. 받은 시각은 한 시간 안이면 분, 오늘이면 시간, 어제면 시각, 그 앞이면 날짜다 | AC-03, AC-04 |
| 재진입 | 다시 들어오면 맨 위부터다 — 보던 자리를 기억하지 않는다. 이미 읽은 줄은 점이 없다. 목적지에서 뒤로 오면 이 목록이고 그 줄이 읽음으로 바뀌어 있다 | AC-01, AC-05 |
| 동시 변경 | 목록을 연 사이 새 알림이 오면 **다음 읽기에 맨 위로 들어온다** — 열어둔 화면에 저절로 끼어들지 않는다. 다른 기기에서 읽으면 그쪽에서 점이 사라지고 이쪽은 다음 읽기에 맞는다 | AC-01 |
| 성공 직후 | 줄을 누르면 읽음이 찍히며 목적지로 간다 — 점이 사라지는 것을 볼 새가 없다. 돌아오면 그 줄에 점이 없다. 마지막 안 읽은 알림을 읽으면 종의 점도 같이 사라진다 | AC-05, AC-06 |

## 범위 밖

- 알림을 낳는 자리 — `notification-emit`. 이 화면은 쌓인 것을 읽는다
- 푸시 발송 — `notification-push`. 문장 함수는 이 task가 내고 그 task가 가져다 쓴다
- 알림을 켜고 끄는 자리 — `notification-settings`
- 대시보드의 알림 블록 — `dashboard`. 같은 문장 함수를 쓴다
- 관리자 공지를 쓰는 자리 — 알림 영역의 다른 task
- 목적지 화면들 — 각자의 task. 이 화면은 주소를 만들어 보내는 데까지다

## 승인 근거

승인 전이라 기록 없음.
