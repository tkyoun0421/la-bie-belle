---
status: draft
sources:
  - ../modules/account/README.md#acc-002
  - ../modules/account/README.md#acc-003
  - ../modules/account/README.md#acc-008
  - ../modules/account/README.md#acc-009
  - ../modules/account/design.md#프로필-제출연락처사진
  - ../modules/account/design.md#사진-저장
  - ../modules/account/screens/profile.md
  - ../system/navigation.md#경로
  - ../system/runtime.md#로딩
  - ../system/data-access.md#오류의-모양
---

# 근무자가 자기 정보를 보고 고칠 수 있는 것만 고친다

## 요구

승인된 사람이 앱에 들어와도 자기 프로필을 볼 자리가 없다. 연락처가 바뀌었는데 고칠 데도 없다([ACC-003](../modules/account/README.md#acc-003)).

이 화면은 탭 넷 중 하나라 `expo-scaffold`가 자리만 비워뒀다. 그 안을 채운다 — 잠긴 셋을 보여주고, 고칠 수 있는 둘을 고치고, 화면(테마)을 고르고, 관리자면 관리자 모드로 넘어가는 줄을 낸다.

## 설계 참조

- **무엇이 잠기고 무엇이 안 잠기나** — [ACC-002](../modules/account/README.md#acc-002)와 [ACC-003](../modules/account/README.md#acc-003). 이름·성별·생년월일은 본인 손에서 잠기고 연락처·사진은 안 잠긴다. 이름을 관리자만 고치는 것은 [ACC-009](../modules/account/README.md#acc-009)
- **어디로 가나** — [design.md 「프로필 제출·연락처·사진」](../modules/account/design.md#프로필-제출연락처사진)과 [「사진 저장」](../modules/account/design.md#사진-저장)
- **관리자 모드 줄** — [ACC-008](../modules/account/README.md#acc-008)이 「같은 앱에서 관리자 화면으로 넘어가며 두 모드를 오간다」로 정했다
- **화면의 모양과 문안** — [profile.md](../modules/account/screens/profile.md)가 정본이다

## 완료 조건

### AC-01

- 전제: 승인된 사람
- 행동: `/me`를 연다
- 관찰 결과: 사진·이름·성별·생년월일·연락처가 보인다. 앞의 셋에는 고치는 손잡이가 없다
- 검증 층: e2e
- 근거: [ACC-002](../modules/account/README.md#acc-002)

### AC-02

- 전제: `/me`
- 행동: 연락처를 고친다
- 관찰 결과: 시트가 열리며 지금 번호가 채워지고 커서가 끝에 선다. 저장하면 시트가 닫히고 토스트가 뜨며 화면 값이 바뀐다
- 검증 층: e2e
- 근거: [ACC-003](../modules/account/README.md#acc-003)

### AC-03

- 전제: 연락처 시트
- 행동: `010`으로 시작하지 않거나 열한 자리가 아닌 번호를 저장한다
- 관찰 결과: 시트가 열린 채 오류가 뜬다. 서버까지 갔으면 `invalid_phone`이 같은 자리에 뜬다
- 검증 층: unit — 값의 꼴을 보는 순수 함수고 [profile-form](profile-form.md#ac-02)과 같은 함수를 쓴다
- 근거: [ACC-003](../modules/account/README.md#acc-003), [오류의 모양](../system/data-access.md#오류의-모양)

### AC-04

- 전제: `/me`
- 행동: 사진을 바꾸거나 구글 사진으로 되돌린다
- 관찰 결과: 올리는 동안 시트 안 스피너가 서고 끝나면 화면의 원이 바뀐다. 실패하면 시트가 열린 채 「사진을 올리지 못했어요」다
- 검증 층: e2e — 기기의 사진 고르기를 거친다
- 근거: [design.md 「사진 저장」](../modules/account/design.md#사진-저장)

### AC-05

- 전제: `/me`
- 행동: 화면(테마)을 고른다
- 관찰 결과: 그 자리에서 앱 전체가 바뀐다. 앱을 껐다 켜도 고른 것이 남는다
- 검증 층: e2e — 앱 재시작 뒤가 알맹이라 기기가 필요하다
- 근거: [profile.md](../modules/account/screens/profile.md)

### AC-06

- 전제: 관리자
- 행동: `/me`를 연다
- 관찰 결과: 관리자 모드로 넘어가는 줄이 있다. 근무자에게는 그 줄이 없다
- 검증 층: e2e
- 근거: [ACC-008](../modules/account/README.md#acc-008)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 해당 없음 — 승인된 사람은 다섯이 다 차 있다. 사진만 비면 회색 원에 이름 첫 글자다 | AC-01 |
| 로딩 | 첫 진입에 스켈레톤, 캐시가 있으면 표시 없음 — [runtime.md 「로딩」](../system/runtime.md#로딩)의 기본값을 상속한다. 저장하는 중에는 시트 안 스피너 | AC-01, AC-02 |
| 실패 | 값의 꼴이 틀리면 시트가 열린 채 그 자리에 오류다. 통신이 끊겨도 시트를 안 닫는다 — 적은 값이 사라지면 다시 적어야 한다 | AC-03, AC-04 |
| 권한 없음 | 승인 전인 사람은 `/me`에 못 온다 — 게이트가 `/pending`으로 돌린다. 퇴사한 사람은 `/left`다. 근무자에게는 관리자 모드 줄이 없다 | AC-06 |
| 경계 | 연락처는 `010`으로 시작하는 열한 자리. 같은 번호 둘은 안 막는다([ACC-005](../modules/account/README.md#acc-005)) | AC-03 |
| 재진입 | 연락처 시트를 다시 열면 지금 번호가 채워진다. 테마는 앱을 껐다 켜도 남는다 | AC-02, AC-05 |
| 동시 변경 | 관리자가 이름을 고치는 중에 본인이 이 화면을 열고 있으면 다음 읽기에 새 이름이 온다. 본인이 고칠 수 있는 자리와 겹치지 않아 충돌이 없다 | AC-01 |
| 성공 직후 | 시트가 닫히고 토스트가 뜨며 화면 값이 그 자리에서 바뀐다. 테마는 토스트 없이 즉시 바뀐다 | AC-02, AC-04, AC-05 |

## 범위 밖

- 알림 스위치 — 이 화면에 서지만 `notification-settings`가 만든다
- 관리자 화면 자체 — 넘어가는 줄까지가 이 task고 그 너머는 `members`·`schedule-admin`이 각각 맡는다
- 이름 고치기 — 관리자 손이라 `members`다([ACC-009](../modules/account/README.md#acc-009))
- 퇴사·차단된 사람이 보는 화면 — [profile-form](profile-form.md#ac-06)
- 내 리허설 목록 — `rehearsal`

## 승인 근거

승인 전이라 기록 없음.
