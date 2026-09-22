---
status: draft
sources:
  - ../modules/schedule/README.md#sch-001
  - ../modules/schedule/README.md#sch-002
  - ../modules/schedule/README.md#sch-003
  - ../modules/schedule/README.md#sch-004
  - ../modules/schedule/README.md#sch-005
  - ../modules/schedule/README.md#sch-014
  - ../modules/schedule/design.md#근무표-만들기와-마감일
  - ../modules/schedule/design.md#날-열기닫기
  - ../modules/schedule/design.md#홀-기본값
  - ../modules/schedule/screens/schedule-admin.md
  - ../system/navigation.md#경로
  - ../system/runtime.md#로딩
  - ../system/runtime.md#tanstack-query-규칙
  - ../system/data-access.md#오류의-모양
---

# 관리자가 달 근무표를 만들고 날을 열고 확정한다

## 요구

근무표 데이터는 [schedule-data](../../3-build/plans/schedule-data.md)가 세웠는데 그것을 만질 화면이 하나도 없다. 지금 앱에 `/admin` 경로 자체가 없다.

이 task가 관리자 쪽 뼈대를 세운다 — 관리자 홈, 달 만들기, 월 달력, 날 열기, 날 상세의 껍데기, 근무 신청 모아보기, 확정. 뒤따르는 관리자 task 전부가 이 홈과 달력을 딛는다.

## 설계 참조

- **근무표는 달 단위고 마감일이 하나다** — [SCH-001](../modules/schedule/README.md#sch-001)~[SCH-003](../modules/schedule/README.md#sch-003)과 [design.md 「근무표 만들기와 마감일」](../modules/schedule/design.md#근무표-만들기와-마감일)
- **확정은 되돌리는 문이 없다** — [SCH-014](../modules/schedule/README.md#sch-014)가 빈 자리가 있어도 막지 않는다고 정했다. 화면이 세우는 유일한 안전장치는 버튼 라벨과 아래 줄이다
- **확정 뒤에는 날을 못 닫는다** — [SCH-004](../modules/schedule/README.md#sch-004). 규칙이 보는 것은 달의 확정이지 날이 열린 시점이 아니다
- **화면의 모양과 문안** — [schedule-admin.md](../modules/schedule/screens/schedule-admin.md)가 정본이다
- **오늘이 화면 밖에서 온다** — [runtime.md 「TanStack Query 규칙」](../system/runtime.md#tanstack-query-규칙)의 서버 시각 오프셋을 쓰고 기기 시계를 그대로 믿지 않는다

**날 상세는 껍데기까지다.** 포지션 아홉 줄 안쪽은 `schedule-assign`이, 임시공휴일 줄과 근무 조정 줄은 `payroll-adjust`가 채운다. 가르는 선이 `open_day`/`close_day`와 `add_slot`/`add_assignment` 사이다.

## 완료 조건

### AC-01

- 전제: 관리자
- 행동: `/admin`을 연다
- 관찰 결과: 근무표 관리 타일에 지금 달 상태가 한 줄로 선다 — 근무표 없음 / 만드는 중 / 확정 뒤. 그 아래 줄 여섯(근무 시간 기본값·승인할 일·가입 대기·직원·시급·QR·통계)이 각자의 경로로 간다. 아직 없는 화면으로 가는 줄도 눌린다
- 검증 층: e2e
- 근거: [schedule-admin.md 「관리자 홈」](../modules/schedule/screens/schedule-admin.md#관리자-홈)

### AC-02

- 전제: 관리자. 그 달 근무표가 없다
- 행동: `/admin/schedule?month=`에서 마감일을 골라 만든다
- 관찰 결과: 그 달 `schedules` 행이 서고 전부 닫힌 달력이 뜬다. 달력 위에 만든 직후 한 줄이 서고 날을 하나라도 열면 사라진다
- 검증 층: e2e
- 근거: [design.md 「근무표 만들기와 마감일」](../modules/schedule/design.md#근무표-만들기와-마감일)

### AC-03

- 전제: 근무표가 있는 달
- 행동: 달력을 보고 달을 넘긴다
- 관찰 결과: 주가 월요일로 시작하고 이 달 밖 칸은 날짜가 아니라 빈칸이다. 줄 수는 달마다 넷·다섯·여섯이다. 칸마다 열림 여부와 신청 수가 선다. 과거 달로도 간다
- 검증 층: unit — 그리드와 칸 상태는 날짜를 넣어 보는 계산이다. 화면이 그것을 그리는 것은 AC-02의 e2e가 같이 본다
- 근거: [schedule-admin.md 「월 달력」](../modules/schedule/screens/schedule-admin.md#월-달력)

### AC-04

- 전제: 달력. 안 연 날이 있다
- 행동: 「날 열기」로 여러 날을 골라 연다
- 관찰 결과: 고른 날에 홀 기본값이 깔리고 모드가 풀린다. 이미 연 날과 지난 날짜는 안 골라진다. 0개면 버튼이 안 눌린다. **하나가 실패하면 그 날만 안 열린 채 나머지는 열리고**, 실패한 날짜를 토스트가 말하며 모드가 안 풀린다
- 검증 층: e2e — 부분 실패가 이 AC의 알맹이라 여러 날을 실제로 보내야 보인다
- 근거: [design.md 「날 열기·닫기」](../modules/schedule/design.md#날-열기닫기), [「홀 기본값」](../modules/schedule/design.md#홀-기본값)

### AC-05

- 전제: 열린 날의 상세(`?date=`)
- 행동: 근무 시간을 고치고 「이 날 닫기」를 누른다
- 관찰 결과: 끝이 시작보다 이르면 버튼이 먼저 막고 서버까지 가면 `bad_hours`다. 닫기는 배정이 있으면 경고 시트를 세우고 없으면 바로 닫는다. 닫히면 달력으로 돌아간다
- 검증 층: e2e
- 근거: [schedule-admin.md 「날 닫기 경고」](../modules/schedule/screens/schedule-admin.md#날-닫기-경고)

### AC-06

- 전제: 근무 신청이 들어온 달
- 행동: 모아보기(`/admin/applications?month=`)를 열고 마감일을 바꾼다
- 관찰 결과: 날짜순·사람순 탭이 같은 신청을 두 방향으로 든다. 마감일 시트가 오늘 이전을 못 고르게 하고, 바꾸면 전원에게 알림이 간다고 미리 말한다. 같은 시트를 확정 잠김의 「마감일 당기기」도 연다
- 검증 층: e2e
- 근거: [schedule-admin.md 「근무 신청 모아보기」](../modules/schedule/screens/schedule-admin.md#근무-신청-모아보기)

### AC-07

- 전제: 마감일 다음 날 이후이고 아직 확정 전인 달
- 행동: 확정한다
- 관찰 결과: 확정 시트가 빈 자리 수와 날짜·포지션 넷(넘치면 「외 n개」)을 보여주고 「되돌릴 수 없어요」를 말한다. **Dialog를 겹치지 않는다.** 성공하면 시트가 결과로 바뀌고 1.65초 뒤 저절로 닫힌다. 빈 자리가 있어도 막지 않는다
- 검증 층: e2e
- 근거: [SCH-014](../modules/schedule/README.md#sch-014), [schedule-admin.md 「확정 시트」](../modules/schedule/screens/schedule-admin.md#확정-시트)

### AC-08

- 전제: 확정된 달
- 행동: 달력을 연다
- 관찰 결과: 제목 옆에 「확정」 배지와 확정 줄이 서고 마감 줄·확정 버튼·범례·신청 수·모아보기 줄이 사라진다. 빈 자리가 남은 날 칸에 점선 원과 수가 선다. 「날 열기」는 남고 날 상세의 「이 날 닫기」는 사라진다 — 확정 뒤에 새로 연 날에도 없다
- 검증 층: e2e
- 근거: [SCH-004](../modules/schedule/README.md#sch-004), [schedule-admin.md 「확정 뒤 달력」](../modules/schedule/screens/schedule-admin.md#확정-뒤-달력)

### AC-09

- 전제: 근무자
- 행동: `/admin/schedule`에 직접 닿는다
- 관찰 결과: 화면이 안 뜨고 `/`로 간다. 쓰기 함수 일곱은 `not_allowed`로 거절한다 — 화면이 막기 전에 함수가 이미 막는다
- 검증 층: integration — 함수 쪽 거절이 알맹이다. 경로 보호는 위 e2e들이 관리자 세션으로 이미 지난다
- 근거: [navigation.md 「경로」](../system/navigation.md#경로), [data-access.md 「함수 안의 규칙」](../system/data-access.md#함수-안의-규칙)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 근무표 없는 달은 달력 아이콘·제목·만들기 버튼이 화면 세로 가운데에 선다. 전부 지난 달이면 제목만이고 버튼이 없다. 모아보기 0건은 목록 자리에 두 줄이고 삽화가 없다. 날 상세의 근무 신청이 0건이면 그 줄이 통째로 없다 | AC-02, AC-06 |
| 로딩 | 첫 진입에 스켈레톤, 캐시가 있으면 표시 없음 — [runtime.md 「로딩」](../system/runtime.md#로딩)의 기본값을 상속한다. 보내는 중에는 버튼 안 링이 돌고, 확정 시트는 링이 도는 동안 닫기까지 잠근다 | AC-02, AC-07 |
| 실패 | 통신이 끊기면 [오류의 모양](../system/data-access.md#오류의-모양)의 `TransportError` 기본값 — 시트를 연 채 「보내지 못했어요. 다시 시도해주세요」. 날 열기는 부분 실패가 있어 실패한 날짜를 토스트가 말하고 모드가 안 풀린다. 확정 실패는 시트가 안 닫히고 원이 흔들리며 「다시 확정하기」가 남는다 | AC-04, AC-07 |
| 권한 없음 | 근무자가 `/admin/*`에 닿으면 `/`로 간다. 쓰기 함수 일곱이 `not_allowed`로 거절한다 | AC-09 |
| 경계 | 확정은 마감일 **다음 날부터** 열린다 — 잠김의 보조 문구가 언제부터인지 말한다. 이미 연 날과 지난 날짜는 열기 모드에서 안 골라진다. 그 달 마지막 날이 오늘 이전이면 만들기 버튼이 없다. 빈 자리 목록은 넷까지고 넘치면 「외 n개」. **자정 경계는 다음 진입이다** — 화면을 열어둔 채 자정을 넘겨도 그 자리에서 안 풀린다 | AC-02, AC-04, AC-07 |
| 재진입 | 다시 들어오면 마지막으로 보던 달이 열린다 — 기기 저장소가 아니라 화면 파라미터(`?month=`)가 든다. 홈 타일이 그것을 붙여 보낸다 | AC-03 |
| 동시 변경 | 관리자 둘이 같은 달을 확정하면 늦은 쪽이 `already_confirmed`를 받는데 **성공으로 처리한다** — 재시도가 두 번 닿은 것과 구별할 길이 없고 결과가 같다. `too_early`는 화면이 잘못 켜진 것이라 다시 읽는다 | AC-07 |
| 성공 직후 | 만든 직후에는 전부 닫힌 달력 위에 한 줄이 서고 날을 하나라도 열면 사라진다. 확정 결과는 1.65초 뒤 저절로 닫히고 달력이 확정 뒤 모습으로 바뀐다. 날을 닫으면 달력으로 돌아간다 | AC-02, AC-05, AC-07, AC-08 |

## 범위 밖

- 자리·배정·사람 픽커·자격·강제 변경 — `schedule-assign`. 이 task의 포지션 줄은 배정 수만 세는 임시 줄이다
- 날 상세의 임시공휴일 줄과 근무 조정 줄 — `payroll-adjust`. 값이 `holidays`와 `adjustments`로 간다
- 근무 요청 보내기와 요청 상태 — `schedule-requests`
- 근무자 근무표 화면 — [schedule-worker](schedule-worker.md)
- 승인할 일·가입 대기·직원·시급·QR·통계 화면 — 각자의 task. 이 task는 홈의 줄과 경로까지다
- 확정 알림이 실제로 나가는 것 — `notification-emit`

## 승인 근거

승인 전이라 기록 없음.
