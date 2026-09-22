---
status: draft
sources:
  - ../modules/account/README.md#acc-001
  - ../modules/account/README.md#acc-002
  - ../modules/account/README.md#acc-003
  - ../modules/account/README.md#acc-004
  - ../modules/account/README.md#acc-006
  - ../modules/account/README.md#acc-007
  - ../modules/account/README.md#acc-011
  - ../modules/account/design.md#프로필-제출연락처사진
  - ../modules/account/design.md#첫-진입과-게이트
  - ../modules/account/screens/login.md
  - ../system/navigation.md#앱을-열면
  - ../system/runtime.md#로딩
  - ../system/data-access.md#오류의-모양
---

# 로그인한 사람이 프로필을 적어 가입을 끝낸다

## 요구

구글 로그인은 이미 붙었는데 그 뒤가 없다. 로그인하면 빈 프로필 행만 생기고([ACC-001](../modules/account/README.md#acc-001)) 관리자 대기 목록에는 안 뜬다 — 본인이 다섯을 채워 보내야 가입이 끝난다.

이 task가 그 다섯 칸과 보낸 뒤의 자리를 만든다. 그리고 보낼 수 없는 사람들이 닿는 자리 셋도 같이 만든다 — 퇴사한 사람, 차단된 사람, 게이트를 못 읽은 사람이다. 셋 다 `/pending`과 같은 판정에서 갈라져서 한 task로 묶는다.

## 설계 참조

- **무엇을 받나** — [ACC-001](../modules/account/README.md#acc-001)의 다섯 항목 표. 이름·성별·생년월일이 잠기는 것은 [ACC-002](../modules/account/README.md#acc-002), 연락처·사진이 안 잠기는 것은 [ACC-003](../modules/account/README.md#acc-003)
- **어디로 가나** — [design.md 「프로필 제출·연락처·사진」](../modules/account/design.md#프로필-제출연락처사진)이 `submit_profile`과 그 계약을 든다. 같은 번호 둘을 안 막는 것은 [ACC-005](../modules/account/README.md#acc-005)
- **누가 어디에 서나** — [design.md 「첫 진입과 게이트」](../modules/account/design.md#첫-진입과-게이트)와 [navigation.md 「앱을 열면」](../system/navigation.md#앱을-열면)이 경로 다섯의 판정을 든다
- **화면의 모양과 문안** — [login.md](../modules/account/screens/login.md)가 정본이다. spec은 그 화면이 언제 어떤 상태로 서는지만 자른다

이 task에서 정한 것은 없다. 정본이 안 정한 자리는 아래 「상태 격자」가 그 자리를 가리킨다.

## 완료 조건

### AC-01

- 전제: 로그인했고 프로필을 한 번도 안 보낸 사람
- 행동: 다섯 칸을 채워 보낸다
- 관찰 결과: `submit_profile`이 성공하고 `profiles.submitted_at`이 찬다. 폭죽 축하 뒤 승인 대기 화면이 선다
- 검증 층: e2e — 화면 입력부터 저장까지 이어지는 것이 이 AC의 알맹이다. 함수 계약은 [account-data](../../3-build/plans/account-data.md)가 이미 integration으로 덮었다
- 근거: [ACC-001](../modules/account/README.md#acc-001), [design.md](../modules/account/design.md#프로필-제출연락처사진)

### AC-02

- 전제: 프로필 작성 화면
- 행동: 규칙 밖의 값을 넣고 보낸다 — 공백 이름, `010`으로 시작하지 않거나 열한 자리가 아닌 연락처, 실존하지 않는 여덟 자리 생년월일
- 관찰 결과: 보내지지 않고 그 칸 아래 줄로 규칙을 안내한다. 서버까지 갔을 때는 `invalid_name`·`invalid_phone`·`invalid_gender`가 같은 자리에 뜬다
- 검증 층: unit — 값의 꼴을 보는 순수 함수다. 서버 쪽 거절은 integration이 이미 본다
- 근거: [ACC-002](../modules/account/README.md#acc-002), [오류의 모양](../system/data-access.md#오류의-모양)

### AC-03

- 전제: 프로필 작성 화면. 사진은 구글 것이 기본으로 들어와 있다
- 행동: 다른 사진을 고른다
- 관찰 결과: 올리는 동안 원 위에 스피너가 서고, 끝나면 그 사진이 원에 앉는다. 실패하면 원은 그대로고 칸 아래 줄로 실패를 말한다
- 검증 층: e2e — 기기의 사진 고르기를 거친다
- 근거: [ACC-003](../modules/account/README.md#acc-003), [design.md 「사진 저장」](../modules/account/design.md#사진-저장)

### AC-04

- 전제: 보냈는데 거절당한 사람(`rejected_at`이 차 있다)
- 행동: 앱을 연다
- 관찰 결과: 승인 대기 화면이 안 받았다는 것을 말하고, 다시 보내기로 들어가면 지난 다섯 값이 채워진 채로 선다. 고쳐서 다시 보내면 축하 없이 바로 승인 대기다
- 검증 층: e2e — 거절 상태를 만들고 재진입하는 흐름이다
- 근거: [ACC-007](../modules/account/README.md#acc-007)

### AC-05

- 전제: 보냈고 아직 판정이 안 난 사람(`submitted_at`이 차고 `approved_at`·`rejected_at`이 비었다)
- 행동: 앱을 연다
- 관찰 결과: 승인 대기 화면이 선다. 근무표·급여·남의 프로필은 한 행도 안 온다
- 검증 층: e2e — 게이트 판정이 이 AC의 알맹이다. RLS가 막는 것은 [account-data](../../3-build/plans/account-data.md)가 integration으로 덮었다
- 근거: [ACC-006](../modules/account/README.md#acc-006), [navigation.md](../system/navigation.md#앱을-열면)

### AC-06

- 전제: 퇴사한 사람(`left_at`)과 차단된 사람(`blocked_at`)
- 행동: 로그인한다
- 관찰 결과: 퇴사한 사람은 `/left`에 서고 지난 급여와 자기 근무 기록까지 닿는다. 차단된 사람은 `/blocked`에 서고 아무 행도 안 온다
- 검증 층: e2e — 두 경로의 갈림이다
- 근거: [ACC-011](../modules/account/README.md#acc-011), [ACC-004](../modules/account/README.md#acc-004)

### AC-07

- 전제: 게이트가 읽을 프로필을 못 받았다(통신 실패)
- 행동: 앱을 연다
- 관찰 결과: `/retry`가 서고 다시 읽기를 누르면 판정을 다시 돈다. 어느 화면으로도 잘못 들어가지 않는다
- 검증 층: unit — 판정 함수(`decide-entry.ts`)에 실패한 읽기를 주면 되고, 기기가 필요 없다
- 근거: [navigation.md 「앱을 열면」](../system/navigation.md#앱을-열면)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 해당 없음 — 폼은 늘 다섯 칸이 선다. 사진만 비면 구글 것이 채워져 있고, 그것도 없으면 회색 원에 이름 첫 글자다 | AC-03 |
| 로딩 | 판정이 끝날 때까지 스플래시가 서 있다 — [runtime.md 「로딩」](../system/runtime.md#로딩)의 「복원 중에는 아무것도 안 그린다」를 따른다. 보내는 중에는 버튼 안 스피너, 사진 올리는 중에는 원 위 스피너다 | AC-01, AC-03 |
| 실패 | 값의 꼴이 틀리면 그 칸 아래 줄이다. 통신이 끊기면 [오류의 모양](../system/data-access.md#오류의-모양)의 `TransportError` 기본값 — 폼을 연 채 「보내지 못했어요. 다시 시도해주세요」다. 게이트를 못 읽으면 `/retry` | AC-02, AC-07 |
| 권한 없음 | 이미 승인된 사람이 `/pending`에 직접 닿으면 게이트가 홈으로 돌린다. 차단·퇴사는 제 화면으로 간다 | AC-05, AC-06 |
| 경계 | 이름은 공백만으로 안 된다. 연락처는 `010`으로 시작하는 열한 자리. 생년월일은 실존하는 여덟 자리. 성별은 「여」·「남」 둘뿐 | AC-02 |
| 재진입 | 거절 뒤 다시 보내기는 지난 다섯 값이 채워진 채로 선다. 앱을 껐다 켜도 게이트가 같은 판정을 낸다 | AC-04, AC-05 |
| 동시 변경 | 보내는 사이에 관리자가 그 사람을 차단하면 `submit_profile`이 `not_allowed`로 거절한다. 앱을 다시 열면 `/blocked`다 | AC-05, AC-06 |
| 성공 직후 | 폭죽 축하 화면이 지나가고 승인 대기 화면이 선다. 거절 뒤 재전송은 축하 없이 바로 승인 대기다 | AC-01, AC-04 |

## 범위 밖

- 관리자가 승인·거절·차단하는 자리 — `members-pending`
- 「나」 화면에서 연락처·사진을 고치는 자리 — `profile-screen`. 같은 함수를 부르지만 화면이 다르다
- 구글 로그인 왕복 자체 — [login-screens](login-screens.md)가 이미 덮었다
- 알림 켜기 — 승인 대기 화면에 서지만([NTF-016](../modules/notification/README.md#ntf-016)) `notification-settings`가 만든다
- 퇴사 1년 뒤 비우기 — `profile-erasure`

## 승인 근거

승인 전이라 기록 없음.
