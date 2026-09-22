---
status: draft
sources:
  - ../modules/account/README.md#acc-008
  - ../modules/account/README.md#acc-009
  - ../modules/account/README.md#acc-010
  - ../modules/account/README.md#acc-011
  - ../modules/account/design.md#관리자-올리기내리기
  - ../modules/account/design.md#이름-고치기
  - ../modules/account/design.md#퇴사-처리와-되돌리기
  - ../modules/account/screens/members.md
  - ../system/navigation.md#경로
  - ../system/runtime.md#로딩
  - ../system/data-access.md#오류의-모양
---

# 관리자가 승인된 사람들을 관리한다

## 요구

승인까지는 `members-pending`이 덮는데 그 뒤가 없다. 이름에 오타가 나도 고칠 데가 없고([ACC-009](../modules/account/README.md#acc-009)), 관리자를 더 세울 데도 없고, 그만둔 사람을 퇴사로 옮길 데도 없다.

셋 다 같은 목록과 같은 사람 시트를 쓴다. 그래서 한 task다.

## 설계 참조

- **이름은 관리자만 고친다** — [ACC-009](../modules/account/README.md#acc-009). 같은 이름 둘을 안 막는다. 고치면 과거 근무표의 이름까지 같이 바뀐다
- **관리자 올리기·내리기** — [ACC-008](../modules/account/README.md#acc-008)과 [design.md](../modules/account/design.md#관리자-올리기내리기). 「마지막」의 셈은 재직 중이고 차단되지 않은 관리자다
- **퇴사 처리** — [ACC-010](../modules/account/README.md#acc-010)이 앞 배정이 남으면 막는다고 정했고, [ACC-011](../modules/account/README.md#acc-011)이 퇴사한 사람이 무엇까지 보는지를 정했다. 되돌리기에 시한이 없는 것은 [design.md](../modules/account/design.md#퇴사-처리와-되돌리기)
- **화면의 모양과 문안** — [members.md](../modules/account/screens/members.md)가 정본이다

**`mark_leave`의 남은 배정 검사를 이 task가 넣는다.** [schedule-data plan AC-11](../../3-build/plans/schedule-data.md#ac-11)이 그 검사를 여기로 넘겼다 — `assignments`는 섰지만 `mark_leave` 함수가 그때 없었다.

## 완료 조건

### AC-01

- 전제: 관리자
- 행동: `/admin/members`를 연다
- 관찰 결과: 승인된 사람이 줄로 선다. 퇴사자는 따로 구획에 모인다. 이름으로 검색된다
- 검증 층: e2e
- 근거: [members.md](../modules/account/screens/members.md)

### AC-02

- 전제: 사람 시트를 열었다
- 행동: 이름을 고친다
- 관찰 결과: `display_name`이 바뀌고 토스트가 뜬다. 지난 근무표에 뜨는 이름도 같이 바뀐다. 공백만이거나 지금 이름과 같으면 저장이 안 된다
- 검증 층: e2e — 값 검사는 unit이 덮지만 과거 화면까지 바뀌는 것은 화면을 거쳐야 보인다
- 근거: [ACC-009](../modules/account/README.md#acc-009)

### AC-03

- 전제: 사람 시트
- 행동: 관리자로 올리거나 내린다
- 관찰 결과: `role`이 바뀌고 그 사람의 다음 진입부터 관리자 화면이 열리거나 닫힌다
- 검증 층: e2e
- 근거: [ACC-008](../modules/account/README.md#acc-008)

### AC-04

- 전제: 재직 중이고 차단되지 않은 관리자가 한 명뿐이다
- 행동: 그 사람을 내리려 하거나 퇴사 처리하려 한다
- 관찰 결과: 둘 다 막히고 `last_admin`이 나온다. 화면은 버튼을 미리 끄고 이유를 말한다
- 검증 층: integration — 「마지막」의 셈이 퇴사·차단을 빼고 세는지가 알맹이라 DB가 있어야 보인다
- 근거: [ACC-008](../modules/account/README.md#acc-008)

### AC-05

- 전제: 앞으로 배정된 근무가 없는 사람
- 행동: 퇴사 처리한다
- 관찰 결과: `left_at`이 차고 줄이 퇴사 구획으로 옮겨간다. 그 사람은 다음 진입에 `/left`로 간다
- 검증 층: e2e
- 근거: [ACC-011](../modules/account/README.md#acc-011)

### AC-06

- 전제: 앞으로 배정된 근무가 남은 사람
- 행동: 퇴사 처리하려 한다
- 관찰 결과: `has_future_assignments`가 나오고 화면이 남은 자리를 보여주며 막는다. 셋 이상이면 「외 n건」이다. 배정은 저절로 안 빠진다
- 검증 층: integration — `mark_leave`가 배정을 실제로 세는지가 이 task의 새 코드다
- 근거: [ACC-010](../modules/account/README.md#acc-010), [schedule-data plan AC-11](../../3-build/plans/schedule-data.md#ac-11)

### AC-07

- 전제: 퇴사 구획의 사람
- 행동: 되돌린다
- 관찰 결과: `left_at`이 비고 줄이 재직 구획으로 돌아온다. 시한이 없어 언제든 된다
- 검증 층: e2e
- 근거: [design.md](../modules/account/design.md#퇴사-처리와-되돌리기)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 「아직 승인된 사람이 없어요」. 검색해서 아무도 안 나오면 「맞는 이름이 없어요」 — 둘은 다른 말이다. 퇴사 구획이 비면 그 구획 자체가 안 선다 | AC-01 |
| 로딩 | 첫 진입에 스켈레톤, 캐시가 있으면 표시 없음 — [runtime.md 「로딩」](../system/runtime.md#로딩)의 기본값을 상속한다. 검색은 이미 받은 목록을 거르는 것이라 로딩이 없다 | AC-01 |
| 실패 | 통신이 끊기면 시트를 연 채 「보내지 못했어요. 다시 시도해주세요」. 도메인 거절 둘은 `last_admin`과 `has_future_assignments`고 각각 Dialog로 이유를 말한다 | AC-04, AC-06 |
| 권한 없음 | 근무자가 경로에 닿으면 화면이 안 뜨고 데이터도 안 온다. 마지막 관리자를 내리는 버튼은 눌리기 전에 꺼져 있다 | AC-04 |
| 경계 | 이름은 공백만으로 안 되고 지금 이름과 같아도 안 된다. 같은 이름 둘은 안 막는다. 남은 배정이 셋 이상이면 「외 n건」으로 줄인다. 「마지막 관리자」의 셈에서 퇴사·차단된 관리자는 빠진다 | AC-02, AC-04, AC-06 |
| 재진입 | 이름 시트를 다시 열면 지금 이름이 채워진다. 검색 칸을 비우면 목록이 돌아온다. 퇴사 되돌리기에 시한이 없어 나중에 다시 들어와도 된다 | AC-02, AC-07 |
| 동시 변경 | 관리자 둘이 같은 사람을 동시에 다루면 늦은 쪽이 서버 상태를 받는다 — 이미 퇴사한 사람을 다시 퇴사 처리하면 `already_decided`다. 마지막 관리자 판정은 누르는 시점에 서버가 다시 센다 | AC-04, AC-05 |
| 성공 직후 | 시트가 닫히고 토스트가 뜬다. 퇴사·되돌리기는 줄이 구획 사이를 옮겨간다 | AC-02, AC-03, AC-05, AC-07 |

## 범위 밖

- 가입 승인·거절·차단 — [members-pending](members-pending.md)
- 퇴사 1년 뒤 비우기 — `profile-erasure`
- 남은 배정을 실제로 빼는 자리 — `schedule-assign`. 이 화면은 막고 보여주기까지다
- 본인이 자기 연락처·사진을 고치는 자리 — [profile-screen](profile-screen.md)
- 퇴사한 사람이 보는 화면 — [profile-form](profile-form.md#ac-06)

## 승인 근거

승인 전이라 기록 없음.
