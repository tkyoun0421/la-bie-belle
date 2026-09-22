---
status: approved
sources:
  - ../modules/schedule/README.md#sch-011
  - ../modules/schedule/README.md#sch-012
  - ../modules/schedule/README.md#sch-015
  - ../modules/schedule/README.md#sch-016
  - ../modules/schedule/design.md#자리-늘리기줄이기겸임
  - ../modules/schedule/design.md#배정과-강제-변경
  - ../modules/schedule/design.md#자격-주기
  - ../modules/schedule/screens/schedule-admin.md#잠금과-구조-변경
  - ../modules/schedule/screens/schedule-admin.md#사람-픽커-짜임
  - ../modules/schedule/screens/schedule-admin.md#자격-없는-사람
  - ../modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세
  - ../system/navigation.md#뒤로
  - ../system/runtime.md#로딩
  - ../system/runtime.md#경쟁-조건-기본값
  - ../system/data-access.md#오류의-모양
---

# 관리자가 자리를 만들고 사람을 배정한다

## 요구

[schedule-admin](schedule-admin.md)이 날 상세의 껍데기를 세웠는데 포지션 아홉 줄이 배정 수만 세는 임시 줄이다. 근무표의 알맹이 — 누가 어느 자리에 서나 — 가 아직 비어 있다.

이 task가 그 안쪽을 채운다. 자리를 늘리고 줄이고 합치고 나누는 길, 사람을 고르는 픽커, 자격을 주는 자리, 확정 뒤의 강제 변경이다. **착수하면 `schedule-admin`이 둔 임시 줄을 지운다.**

## 설계 참조

- **자리 수에 상한이 없다** — [SCH-011](../modules/schedule/README.md#sch-011)
- **교육 배정은 자리를 안 먹는다** — [SCH-012](../modules/schedule/README.md#sch-012). 날에 붙고 줄 머리 셈에 안 든다
- **겸임은 배정을 안 지운다** — [SCH-015](../modules/schedule/README.md#sch-015)가 빈 자리끼리만 합치게 정했다. 한쪽이라도 빈 자리가 없으면 안 합쳐진다
- **신청 안 한 사람은 어느 길로도 못 들어간다** — [SCH-016](../modules/schedule/README.md#sch-016). 근무 요청만이 그 예외고 `schedule-requests`가 만든다
- **화면의 모양과 문안** — [schedule-admin.md](../modules/schedule/screens/schedule-admin.md)의 [잠금과 구조 변경](../modules/schedule/screens/schedule-admin.md#잠금과-구조-변경)·[사람 픽커 짜임](../modules/schedule/screens/schedule-admin.md#사람-픽커-짜임)·[자격 없는 사람](../modules/schedule/screens/schedule-admin.md#자격-없는-사람)·[확정 뒤 날 상세](../modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세)가 정본이다

**확정 전과 뒤를 가르는 것은 날이 열린 시점이다.** 확정 시점에 이미 있던 날은 잠기고, 확정 뒤에 새로 연 날은 확정 전과 똑같이 열린다.

## 완료 조건

### AC-01

- 전제: 관리자. 확정 전인 날의 상세
- 행동: 빈 자리 카드를 눌러 사람을 고른다
- 관찰 결과: 픽커가 올라오고 짧게 누르면 **확인 없이** 배정된다. 시트가 닫히고 그 카드에 이름이 앉으며 줄 머리 셈과 앱바 채움이 같이 오른다. 교육 배정은 정규 자리 아래 덧붙는 줄이고 줄 머리 셈에 안 든다
- 검증 층: e2e
- 근거: [SCH-012](../modules/schedule/README.md#sch-012), [사람 픽커 짜임](../modules/schedule/screens/schedule-admin.md#사람-픽커-짜임)

### AC-02

- 전제: 픽커가 열렸다
- 행동: 「전체 보기」를 펼친다
- 관찰 결과: 사람이 넷으로 갈린다 — 배정 가능 / 미신청(「신청 안 함」, 배정으론 안 눌린다) / 자격 없음(「스캔 자격 없음」, 눌린다) / 배정됨(「팀장에 배정됨」, 안 눌린다). **배정된 줄을 누르면 토스트 「겸임은 자리를 합쳐 만드세요」가 뜬다** — 안 눌리는 이유를 모르면 고장으로 읽힌다
- 검증 층: unit — 넷으로 가르는 판정과 줄마다의 상태 메시지가 계산이다
- 근거: [사람 픽커 짜임](../modules/schedule/screens/schedule-admin.md#사람-픽커-짜임)

### AC-03

- 전제: 픽커의 목록
- 행동: 줄을 길게 누른다. 자격 없는 줄을 짧게 누른다
- 관찰 결과: 길게 누르면 사람 시트가 픽커 위에 겹쳐 올라온다 — 사진·이름·성별·년생·자격이고 **넣기 버튼이 없다**. 넣으려면 닫고 짧게 다시 누른다. 자격 없는 줄을 누르면 시트 내용이 **줄 셋**으로 바뀐다 — 「이번만 넣기」·「자격도 주기」·「닫기」. 「자격도 주기」는 자격을 주고 배정하는데 한 트랜잭션이 아니라 **앞이 성공하고 뒤가 실패하면 자격만 남는다** — 자격은 사람의 속성이라 그 상태가 틀린 것이 아니고 토스트가 배정 실패만 말한다
- 검증 층: e2e — 길게 누르기와 겹친 시트가 실제 손짓을 거쳐야 보인다
- 근거: [자격 없는 사람](../modules/schedule/screens/schedule-admin.md#자격-없는-사람)

### AC-04

- 전제: 확정 전인 날의 포지션 줄. 아홉 줄 전부 잠긴 채 열린다
- 행동: 자물쇠를 눌러 **그 포지션만** 풀고 자리를 늘리거나 버린다
- 관찰 결과: 자리 카드에 끌기 손잡이가 나타나고 목록 끝에 점선 「자리 추가」 줄이 서며 도움말 한 줄이 붙는다. **줄 머리에도 손잡이가 붙는다** — 집는 것이 둘이고 대상이 갈린다. 자리 추가에 상한이 없다. 카드를 버리는 영역에 놓으면 **빈 자리는 그 자리에서 사라지고 사람이 든 자리는 시트가 확인한다**
- 검증 층: e2e — 자리 추가와 시트 경로만 본다. 끌기는 e2e가 흉내 내기 어려워 삭제·합치기는 아래 AC-09의 integration이 함수를 직접 본다
- 근거: [SCH-011](../modules/schedule/README.md#sch-011), [잠금과 구조 변경](../modules/schedule/screens/schedule-admin.md#잠금과-구조-변경)

### AC-05

- 전제: 포지션 줄 둘이 풀려 있고 양쪽에 빈 자리가 있다
- 행동: 줄 머리를 다른 줄 머리에 겹쳐 놓는다. 겸임 카드를 눌러 나눈다
- 관찰 결과: 받은 쪽 자리가 겸임이 되고 내준 쪽 빈 자리가 닫힌다. **사람이 든 자리는 안 건드린다** — 한쪽이라도 빈 자리가 없으면 받지 않고 토스트 「빈 자리가 있어야 합쳐요」가 뜬다. 확인 시트가 없다, 지워지는 것이 없어서다. 나누면 **배정된 사람은 남는 쪽에 그대로 있다**
- 검증 층: integration — 사람이 든 자리를 안 건드리는지가 알맹이고 끌기 없이 함수로 본다
- 근거: [SCH-015](../modules/schedule/README.md#sch-015)

### AC-06

- 전제: 확정된 달이고 확정 시점에 이미 있던 날
- 행동: 날 상세를 연다
- 관찰 결과: 자물쇠·끌기·자리 추가가 **없다** — 회색으로 남기지 않고 지운다. 빈 자리를 누르면 픽커가 열리되 고르면 확인 시트가 서고, 채워진 자리를 누르면 「사람 바꾸기 · 사람 빼기 · 닫기」다. 「교육 붙이기」는 남고 고르면 확인 시트다. 확인 시트의 오른쪽은 primary고 **critical을 안 쓴다** — 자리는 남고 다시 채울 수 있다
- 검증 층: e2e
- 근거: [확정 뒤 날 상세](../modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세)

### AC-07

- 전제: 확정 뒤에 새로 연 날
- 행동: 날 상세를 연다
- 관찰 결과: 확정 전과 같은 자물쇠·끌기·자리 추가가 선다. 사람이 든 자리를 버리면 강제 변경 빼기와 같은 확인과 알림이 걸린다
- 검증 층: integration — 갈림이 `days.opened_at`과 `schedules.confirmed_at`의 비교라 두 시각을 세워야 보인다
- 근거: [확정 뒤 날 상세](../modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세)

### AC-08

- 전제: 배정을 보내는 중
- 행동: 응답이 늦거나 실패한다
- 관찰 결과: **응답을 기다린다**([경쟁 조건 기본값](../system/runtime.md#경쟁-조건-기본값)) — 보내는 동안 그 카드만 잠기고 나머지는 계속 만진다. `stale`이 오면 시트를 닫지 않고 **그 자리만 다시 읽는다**. `already_assigned`·`slot_full`·`not_applied`는 화면이 낡은 것이라 그 달을 다시 읽어 목록을 새로 가른다
- 검증 층: e2e — 나머지 카드가 계속 만져지는 것은 화면을 거쳐야 보인다
- 근거: [경쟁 조건 기본값](../system/runtime.md#경쟁-조건-기본값), [오류의 모양](../system/data-access.md#오류의-모양)

### AC-09

- 전제: 관리자
- 행동: 배정할 수 없는 사람을 넣으려 한다
- 관찰 결과: 신청 안 한 사람은 `not_applied`, 제한 포지션에 자격 없는 사람은 `not_qualified`, 그날 이미 배정이 있으면 `already_assigned`, 자리가 찼으면 `slot_full`이다. **교육 배정은 넷 중 자격만 안 걸린다.** 근무자가 함수를 직접 부르면 `not_allowed`다
- 검증 층: integration — 검사 넷과 교육의 예외가 DB 상태에 걸려 있다
- 근거: [SCH-016](../modules/schedule/README.md#sch-016), [SCH-012](../modules/schedule/README.md#sch-012)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 빈 자리 카드는 면 없이 점선에 「비어 있어요」다. 픽커에 배정 가능한 사람이 0명이면 「지금 바로 넣을 수 있는 사람이 없어요」 한 줄과 함께 **전체 보기가 펼쳐진 채** 열린다 — 빈 목록만 보이면 왜 없는지를 모른다 | AC-01, AC-02 |
| 로딩 | 첫 진입에 스켈레톤, 캐시가 있으면 표시 없음 — [runtime.md 「로딩」](../system/runtime.md#로딩)의 기본값을 상속한다. 보내는 동안에는 **그 카드만 잠기고 나머지는 계속 만진다** | AC-08 |
| 실패 | 통신이 끊기면 그 자리에 「보내지 못했어요. 다시 시도해주세요」. `stale`은 시트를 닫지 않고 「이 근무가 바뀌었어요」가 시트 안에 서며 그 자리만 다시 읽는다 — 관리자가 고치던 나머지가 사라지지 않는다 | AC-08 |
| 권한 없음 | 근무자가 함수를 직접 부르면 `not_allowed`. 픽커의 배정된 줄과 미신청 줄은 배정으로 안 눌리고, 배정된 줄은 누르면 토스트가 이유를 말한다 | AC-02, AC-09 |
| 경계 | 자리 수에 상한이 없다. 겸임은 **양쪽에 빈 자리가 있고 두 줄 다 풀려 있을 때만** 받는다. 나누기는 겸임 자리에만 선다. 확정 전과 뒤를 가르는 것은 `days.opened_at`과 `schedules.confirmed_at`의 비교다 — 확정 뒤에 새로 연 날은 확정 전과 같다 | AC-04, AC-05, AC-06, AC-07 |
| 재진입 | 픽커를 닫았다 같은 자리에서 다시 열면 목록이 새로 갈린다 — 방금 넣은 사람이 「배정됨」으로 내려간다. 시트는 기기 뒤로가 닫고 화면을 안 떠난다([뒤로](../system/navigation.md#뒤로)) | AC-01, AC-02 |
| 동시 변경 | 관리자 둘이 같은 자리를 채우면 늦은 쪽이 `slot_full`이나 `already_assigned`를 받고 그 달을 다시 읽는다. 열어둔 시트 밖에서 그 배정이 닫혔으면 `stale`이고 **그 자리만** 다시 읽는다 | AC-08 |
| 성공 직후 | 확정 전에는 확인 없이 시트가 닫히고 카드에 이름이 앉는다. 확정 뒤에는 확인 시트가 먼저 서고 무엇이 나가는지 말한다. 자격을 같이 준 경우 토스트가 배정 실패만 말한다 — 자격은 이미 남아 있다 | AC-01, AC-03, AC-06 |

## 범위 밖

- 날 상세의 껍데기와 날 열기·닫기·확정 — [schedule-admin](schedule-admin.md)
- 근무 요청 보내기와 요청 상태 값 — `schedule-requests`. 이 task는 요청 배지의 자리까지다
- 임시공휴일 줄과 근무 조정 줄 — `payroll-adjust`
- 교대 승인이 자리의 요청을 닫는 것 — swap 영역
- 배정·강제 변경 알림이 실제로 나가는 것 — `notification-emit`. 화면은 시트가 무엇이 나가는지 말하는 데까지다

## 승인 근거

- 승인: 총괄이 이 판정을 세션에 위임했다 — 「승인은 너가 해서 진행해」
- 날짜: 2026-09-23
- 기준점: `e763cf4` — 이 spec과 `sources`가 든 문서를 그 커밋에서 읽었다. PR [#392](https://github.com/tkyoun0421/la-bie-belle/pull/392)의 고정 diff다
- 범위: AC-01~AC-09와 상태 격자 여덟 줄. 「범위 밖」에 적은 것은 승인 밖이고 거기 든 task가 제 spec으로 따로 받는다
- 제한: 배정과 강제 변경 알림이 실제로 나가는 것은 `notification-emit`이고, 교대 승인이 자리의 요청을 닫는 것은 swap 영역이라 둘 다 승인 밖이다.
