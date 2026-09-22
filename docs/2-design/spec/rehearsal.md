---
status: draft
sources:
  - ../modules/schedule/README.md#sch-021
  - ../modules/schedule/README.md#sch-022
  - ../modules/schedule/README.md#sch-023
  - ../modules/schedule/design.md#리허설
  - ../modules/schedule/design.md#리허설-넣기고치기지우기
  - ../modules/schedule/screens/rehearsal.md
  - ../modules/account/screens/profile.md#리허설
  - ../system/navigation.md#경로
  - ../system/runtime.md#로딩
  - ../system/data-access.md#오류의-모양
  - ../design-system/components.md#빈-상태
---

# 자격이 있는 사람이 자기 리허설을 적는다

## 요구

리허설은 근무표 밖에서 일어나고 급여에는 들어간다([PAY-028](../modules/payroll/README.md#pay-028)). 그런데 적을 데가 없다 — 표도 화면도 없다.

이 task가 표 하나와 화면 하나를 세운다. **`payroll-data`가 이것을 기다리고 있다** — 리허설 시간을 못 더하면 급여 계산이 안 선다.

## 설계 참조

- **갈래가 그날 배정으로 갈린다** — [design.md 「리허설」](../modules/schedule/design.md#리허설). 그날 **살아 있는 정규 배정**이 있으면 건수, 없으면 시각이다. 교육 배정은 안 센다
- **1건이 1시간이다** — [SCH-023](../modules/schedule/README.md#sch-023). 건수에서 시간을 내는 것은 계산이고 저장하지 않는다
- **본인과 관리자만 읽는다** — [SCH-021](../modules/schedule/README.md#sch-021). 다른 근무자에게 남의 리허설이 안 보인다
- **아무 날짜에나 선다** — [SCH-022](../modules/schedule/README.md#sch-022). 근무표 달력과 달리 못 누르는 칸이 없다
- **자격을 거두어도 이미 선 행은 안 지운다** — [design.md 「리허설 넣기·고치기·지우기」](../modules/schedule/design.md#리허설-넣기고치기지우기)의 이웃 절. 지난 급여가 흔들리면 안 된다
- **화면의 모양과 문안** — [rehearsal.md](../modules/schedule/screens/rehearsal.md)가 정본이다

## 완료 조건

### AC-01

- 전제: `position_grants`에 `'리허설'`이 있는 사람
- 행동: `/me`를 열고 리허설 줄로 들어간다
- 관찰 결과: 줄이 있고 `/me/rehearsals`가 열린다. **자격이 없으면 줄 자체가 없고** 주소를 직접 쳐도 `/me`로 돌아간다 — `/admin` 밖의 유일한 조건부 경로다. 뒤로는 `/me`고 탭 바가 없다
- 검증 층: e2e
- 근거: [profile.md 「리허설」](../modules/account/screens/profile.md#리허설), [navigation.md 「경로」](../system/navigation.md#경로)

### AC-02

- 전제: `/me/rehearsals`
- 행동: 달력을 보고 달을 넘긴다
- 관찰 결과: 달 줄에 그 달 합계가 서고 칸 아래 단이 **건수가 아니라 시간**이다. 리허설이 있는 날은 배경이 깔리고 「2시간」이 선다. **모든 날이 눌린다** — 과거도 미래도 못 누르는 칸이 없다. 바닥에 고정 버튼이 없다
- 검증 층: e2e
- 근거: [SCH-022](../modules/schedule/README.md#sch-022), [rehearsal.md 「달력 칸」](../modules/schedule/screens/rehearsal.md#달력-칸)

### AC-03

- 전제: 그날 살아 있는 정규 배정이 **없는** 날
- 행동: 그 날을 눌러 리허설을 넣는다
- 관찰 결과: 시트에 시각 칸 둘이 선다. 넣으면 줄이 서고 그날 합계와 달 합계가 같이 오른다. **같은 날에 여러 줄을 넣을 수 있다** — 구간이 안 겹치기만 하면 된다
- 검증 층: e2e
- 근거: [design.md 「리허설」](../modules/schedule/design.md#리허설)

### AC-04

- 전제: 그날 살아 있는 정규 배정이 **있는** 날
- 행동: 그 날을 눌러 리허설을 넣는다
- 관찰 결과: 시트에 건수 칸 하나가 선다. **하루 한 줄이다** — 이미 줄이 있으면 「리허설 넣기」가 사라지고 그 줄을 눌러 고친다. 1건이 1시간으로 세어진다
- 검증 층: integration — 하루 한 줄을 지키는 것이 부분 unique index라 DB가 있어야 보인다
- 근거: [SCH-023](../modules/schedule/README.md#sch-023)

### AC-05

- 전제: 이미 넣은 줄
- 행동: 줄을 눌러 고치거나 지운다
- 관찰 결과: 값이 든 채 같은 칸들이 서고 아래에 「지우기」가 있다. 지우기는 시트 위에 Dialog 하나를 세운다. **갈래를 다시 판정하지 않는다** — 시각 행은 시각을, 건수 행은 건수를 고친다
- 검증 층: e2e
- 근거: [design.md 「리허설 넣기·고치기·지우기」](../modules/schedule/design.md#리허설-넣기고치기지우기)

### AC-06

- 전제: 시트를 연 채다
- 행동: 겹치는 구간을 넣는다. 또는 연 사이에 관리자가 그날 배정을 넣거나 뺀다
- 관찰 결과: 겹치면 칸 아래 문구 한 줄이고 **넣던 값이 남는다**. 갈래가 어긋나면 알림 한 줄이 서고 **칸만 바뀌며 고른 날짜는 그대로다** — 화면과 함수가 같은 규칙을 두 벌 갖는 자리라 어긋나는 것을 막을 길이 없고, **어긋났을 때 사용자가 안 막히는 것**으로 대신한다
- 검증 층: integration — 겹침과 갈래 판정이 함수 안에 있고 그 함수가 정본이다
- 근거: [design.md 「리허설 넣기·고치기·지우기」](../modules/schedule/design.md#리허설-넣기고치기지우기)

### AC-07

- 전제: 관리자
- 행동: 같은 달력을 연다
- 관찰 결과: 칸의 수가 **전원 것**이고 날 시트의 줄마다 이름이 앞에 붙는다. **「리허설 넣기」가 없고 줄이 안 눌린다** — 관리자에게도 남의 행을 쓰는 길이 없다
- 검증 층: e2e
- 근거: [SCH-021](../modules/schedule/README.md#sch-021)

### AC-08

- 전제: 자격 없는 사람, 또는 남의 행
- 행동: 함수를 직접 부른다
- 관찰 결과: 자격이 없으면 `not_qualified`, 남의 행이면 `not_allowed`다. 다른 근무자에게는 남의 리허설이 한 행도 안 온다. **자격을 거두어도 이미 선 행은 남는다**
- 검증 층: integration — RLS와 자격 검사가 DB에 있다
- 근거: [SCH-021](../modules/schedule/README.md#sch-021), [design.md 「리허설 넣기·고치기·지우기」](../modules/schedule/design.md#리허설-넣기고치기지우기)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 그 달에 넣은 것이 없으면 달력은 그대로 서고 **합계 자리만 빈다**. 빈 날의 시트는 [components.md](../design-system/components.md#빈-상태)의 빈 상태 한 줄과 「리허설 넣기」다 | AC-02, AC-03 |
| 로딩 | 달을 넘기는 중에는 **바닥 단과 합계만 빈다** — 스켈레톤이 없다. 달력 뼈대는 날짜만으로 이미 서 있어서다. [runtime.md 「로딩」](../system/runtime.md#로딩)의 「이미 그릴 것이 있으면 안 가린다」와 같은 축이다 | AC-02 |
| 실패 | 못 읽으면 달력 아래 한 줄과 「다시 시도」. 저장이 실패하면 시트가 열린 채 문구 두 줄이고 **넣던 값이 그대로 남는다**. 겹침은 칸 아래 문구 한 줄이다 | AC-02, AC-06 |
| 권한 없음 | 자격이 없으면 `/me`에 줄 자체가 없고 주소를 직접 쳐도 `/me`로 간다. 관리자는 읽기만이라 「리허설 넣기」가 없고 줄이 안 눌린다. 함수는 자격 없으면 `not_qualified`, 남의 행이면 `not_allowed`다 | AC-01, AC-07, AC-08 |
| 경계 | 건수는 1~9다. 끝이 시작보다 늦어야 한다. 건수 갈래는 **하루 한 줄**이고 시각 갈래에는 그 제한이 없다. **1건이 1시간**이다. 배정된 근무 시간과는 안 견준다 — 리허설이 근무 시간 안에 들어도 막지 않는다 | AC-03, AC-04, AC-06 |
| 재진입 | 고치는 시트는 값이 든 채 열린다. 달을 떠났다 오면 그 달 합계가 다시 계산돼 온다 | AC-02, AC-05 |
| 동시 변경 | 시트를 연 사이에 관리자가 그날 배정을 넣거나 빼면 갈래가 바뀐다. 저장이 `wrong_kind`로 걸리고 **알림 한 줄이 서며 칸만 바뀐다** — 고른 날짜는 그대로라 다시 고를 필요가 없다 | AC-06 |
| 성공 직후 | 시트가 든 날 상태로 돌아가고 줄과 그날 합계가 선다. 달 합계와 달력 칸의 시간이 같이 오른다. 급여 쪽 캐시도 같이 무효화된다 — 리허설 시간이 그 달 급여에 든다 | AC-03, AC-04, AC-05 |

## 범위 밖

- 리허설 시간을 급여 금액으로 바꾸는 것 — `payroll-data`. 이 task는 시간을 내는 순수 함수까지다
- 근무표 달력과 날 시트 — [schedule-worker](schedule-worker.md). 달 고르기 시트는 그쪽 것을 같이 쓴다
- 관리자가 자격을 주는 자리 — [schedule-assign](schedule-assign.md)의 `grant_position`
- 리허설 알림 — 없다. 본인이 적는 것이라 알릴 상대가 없다

## 승인 근거

승인 전이라 기록 없음.
