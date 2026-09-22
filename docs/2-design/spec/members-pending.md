---
status: approved
sources:
  - ../modules/account/README.md#acc-001
  - ../modules/account/README.md#acc-004
  - ../modules/account/README.md#acc-006
  - ../modules/account/README.md#acc-007
  - ../modules/account/design.md#가입-승인거절차단해제
  - ../modules/account/screens/members-pending.md
  - ../system/navigation.md#경로
  - ../system/runtime.md#로딩
  - ../system/data-access.md#오류의-모양
---

# 관리자가 가입 신청을 받거나 돌려보낸다

## 요구

프로필을 보낸 사람이 대기 목록에 쌓이는데 그것을 여는 화면이 없다. 승인이 없으면 근무표도 급여도 누구에게도 안 열린다([ACC-006](../modules/account/README.md#acc-006)) — 이 화면이 앱 전체의 첫 문이다.

같이 만드는 것이 차단 구획이다. 차단을 푸는 자리가 여기 말고 없어서다([ACC-007](../modules/account/README.md#acc-007)).

## 설계 참조

- **무엇이 목록에 뜨나** — [ACC-001](../modules/account/README.md#acc-001). 프로필을 안 채운 사람은 안 뜬다
- **판정 넷** — [design.md 「가입 승인·거절·차단·해제」](../modules/account/design.md#가입-승인거절차단해제)가 함수와 계약을 든다. 거절당한 사람이 다시 보내는 길은 [ACC-007](../modules/account/README.md#acc-007)
- **차단이 무엇을 닫나** — [ACC-004](../modules/account/README.md#acc-004)
- **화면의 모양과 문안** — [members-pending.md](../modules/account/screens/members-pending.md)가 정본이다

관리자 경로를 지키는 것은 이 task가 처음 세운다 — 지금까지 관리자 화면이 하나도 없었다. 판정은 [navigation.md](../system/navigation.md#경로)의 경로 표를 따르고 새 정책을 만들지 않는다.

## 완료 조건

### AC-01

- 전제: 관리자. 프로필을 보낸 사람이 하나 이상 있다
- 행동: `/admin/members/pending`을 연다
- 관찰 결과: 보낸 사람이 줄로 선다. 사진·이름·보낸 시각이 보이고 프로필을 안 채운 사람은 안 뜬다
- 검증 층: e2e — 목록이 서는 것이 이 AC다
- 근거: [ACC-001](../modules/account/README.md#acc-001)

### AC-02

- 전제: 대기 목록의 줄 하나를 열었다
- 행동: 승인한다
- 관찰 결과: `approved_at`이 차고 시트가 닫히며 그 줄이 목록에서 사라진다. 토스트가 뜬다. 그 사람은 다음 진입에 홈으로 간다
- 검증 층: e2e — 화면 판정부터 목록 갱신까지다
- 근거: [design.md](../modules/account/design.md#가입-승인거절차단해제)

### AC-03

- 전제: 같은 시트
- 행동: 거절한다
- 관찰 결과: `rejected_at`이 차고 줄이 사라진다. 그 사람은 알림을 안 받고, 다음에 앱을 열면 승인 대기 화면이 안 받았다는 것을 말한다
- 검증 층: e2e
- 근거: [ACC-007](../modules/account/README.md#acc-007)

### AC-04

- 전제: 같은 시트
- 행동: 차단한다
- 관찰 결과: `blocked_at`이 차고 줄이 차단 구획으로 옮겨간다. 그 계정은 로그인해도 차단 화면뿐이고 아무 행도 못 받는다
- 검증 층: e2e
- 근거: [ACC-004](../modules/account/README.md#acc-004)

### AC-05

- 전제: 차단 구획(`/admin/members/blocked`)에 사람이 있다
- 행동: 차단을 푼다
- 관찰 결과: `blocked_at`이 비고 그 계정이 다시 로그인한다. 승인 여부는 그대로다 — 승인 전이었으면 대기 목록으로 돌아온다
- 검증 층: e2e
- 근거: [ACC-007](../modules/account/README.md#acc-007)

### AC-06

- 전제: 관리자가 아닌 사람
- 행동: `/admin/members/pending`에 직접 닿는다
- 관찰 결과: 그 화면이 안 뜬다. 데이터도 안 온다 — 화면이 막기 전에 RLS가 이미 막는다
- 검증 층: e2e — 경로 보호가 이 AC고, RLS 쪽은 [account-data](../../3-build/plans/account-data.md)가 integration으로 덮었다
- 근거: [navigation.md](../system/navigation.md#경로), [ACC-006](../modules/account/README.md#acc-006)

### AC-07

- 전제: 관리자 둘이 같은 사람을 동시에 열었다
- 행동: 한 쪽이 먼저 판정하고 다른 쪽이 누른다
- 관찰 결과: 늦게 누른 쪽은 `already_decided`를 받고 시트가 닫히며 「이미 처리된 사람이에요」가 뜬다. 목록이 다시 그려진다
- 검증 층: integration — 두 세션의 순서가 알맹이라 DB가 있어야 보인다
- 근거: [design.md](../modules/account/design.md#가입-승인거절차단해제), [오류의 모양](../system/data-access.md#오류의-모양)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 「기다리는 사람이 없어요」. 차단 구획도 비면 같은 꼴이다. 시트 안에서 사진이 없으면 회색 원에 이름 첫 글자 | AC-01, AC-05 |
| 로딩 | 첫 진입에 스켈레톤, 캐시가 있으면 표시 없음 — [runtime.md 「로딩」](../system/runtime.md#로딩)의 기본값을 상속한다. 판정을 보내는 중에는 버튼 안 스피너 | AC-01, AC-02 |
| 실패 | 통신이 끊기면 시트를 연 채 「보내지 못했어요. 다시 시도해주세요」 — [오류의 모양](../system/data-access.md#오류의-모양)의 `TransportError` 기본값. 도메인 거절은 `already_decided` 하나뿐이고 아래 「동시 변경」이 그 자리다 | AC-07 |
| 권한 없음 | 근무자가 경로에 닿으면 화면이 안 뜨고 데이터도 안 온다 | AC-06 |
| 경계 | 해당 없음 — 이 화면에는 상한도 마감도 없다. 판정 넷이 전부 한 번 누르면 끝이고 되돌리는 것은 차단 풀기뿐이다 | AC-05 |
| 재진입 | 이미 처리된 사람의 시트를 다시 열면 시트가 닫히고 목록이 새로 그려진다. 앱을 껐다 켜도 목록은 서버가 정본이다 | AC-07 |
| 동시 변경 | 늦게 누른 쪽이 `already_decided`를 받고 「이미 처리된 사람이에요」가 뜬다 | AC-07 |
| 성공 직후 | 시트가 닫히고 토스트가 뜨며 줄이 목록에서 사라진다. 차단은 사라지지 않고 차단 구획으로 옮겨간다 | AC-02, AC-03, AC-04 |

## 범위 밖

- 승인된 사람을 보는 자리 — `members`. 목록 조각이 겹치지만 그 task가 만든다
- 퇴사 처리와 되돌리기 — `members`
- 관리자 올리기·내리기 — `members`
- 승인 알림이 그 사람에게 가는 것 — `notification-emit`. [NTF-006](../modules/notification/README.md#ntf-006)이 승인 전에 가는 유일한 알림으로 정했고 그릇은 [notification-data](../../3-build/plans/notification-data.md)가 이미 세웠다
- 거절당한 사람이 다시 보내는 화면 — [profile-form](profile-form.md)

## 승인 근거

- 승인: 총괄이 이 판정을 세션에 위임했다 — 「승인은 너가 해서 진행해」
- 날짜: 2026-09-23
- 기준점: `e763cf4` — 이 spec과 `sources`가 든 문서를 그 커밋에서 읽었다. PR [#392](https://github.com/tkyoun0421/la-bie-belle/pull/392)의 고정 diff다
- 범위: AC-01~AC-07과 상태 격자 여덟 줄. 「범위 밖」에 적은 것은 승인 밖이고 거기 든 task가 제 spec으로 따로 받는다
- 제한: 승인 알림이 그 사람에게 가는 것은 `notification-emit`이다 — 그릇은 섰고 부치는 자리가 없다.
