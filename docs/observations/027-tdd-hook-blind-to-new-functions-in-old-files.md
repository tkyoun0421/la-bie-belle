---
status: actioned
target: .claude/hooks/tdd-guard-unit.py
date: 2026-09-28
---

# TDD 훅이 기존 파일 안에 선 새 함수를 못 본다

## 일

`payroll-view`의 구현자가 계산 함수 여섯을 **이미 있는 파일 안에** 넣었다 — `payroll-days.ts`의 `payrollViewDays`, `period.ts`의 `periodOf`·`periodStartDate`·`isInPeriod`·`periodUnitOf`, `year-rows.ts`의 `monthRowsOfDays`. 여섯 다 테스트 없이 main 앞까지 왔다.

`tdd-guard-unit.py`가 보는 것은 **새 `.ts` 파일에 짝이 있나**다. 파일이 이미 있고 그 파일에 `__tests__` 짝도 이미 있으면 훅은 통과시킨다 — 그 안에 오늘 처음 생긴 `export function`이 몇 개든 세지 않는다. 그래서 파일을 새로 만드는 쪽은 막히고, 있는 파일에 얹는 쪽은 안 막힌다. 훅을 피하려는 뜻이 아니라, 있는 자리에 얹는 것이 자연스러워서 그렇게 된다.

잡은 것은 기계가 아니라 총괄의 눈이었다. `pr-diff` 감사도 「테스트 없는 구현 파일」을 파일 단위로 보니 이 자리를 안 짚는다 — 그 파일에는 테스트가 있다.

**둘째가 바로 다음 task에서 났다.** `payroll-adjust`의 구현자가 `usePayrollMonths.ts`에 `holidays: months.flatMap(...)` 한 줄을 더했는데 짝 테스트의 픽스처에는 그 키가 없어 합치기가 무검증으로 남았다. 새 함수가 아니라 **기존 함수가 넓어진 것**이라 앞 사례와 축이 조금 다르지만, 훅이 파일만 보고 안을 안 본다는 뿌리는 같다. 이번엔 `pr-diff`가 짚었다.

## 볼 자리

훅이 `export`된 이름 단위로 보게 바꾸는 길이 있다. 바뀐 `.ts`에서 새로 생긴 `export function`·`export const` 이름을 뽑고, 짝 테스트 파일 본문에 그 이름이 안 나오면 막는다. 정규식으로 이름을 뽑는 것이라 오탐(주석 안의 같은 이름, 재수출)이 나지만, 지금은 아예 안 보는 쪽이다.

이름 단위로 봐도 둘째 사례(기존 함수가 필드 하나를 더 내는 것)는 못 잡는다. 그쪽까지 잡으려면 커버리지 도구가 바뀐 줄을 보는 쪽이라 훅의 일이 아니다.

**셋째가 `stats-admin`에서 났고 이번엔 아홉이다.** 구현자가 스스로 다섯을 신고했는데(`workInputsOf`·`hoursLabel`·`buildAttendanceTab`·`attendanceRowValue`·`useFirstScheduleMonth`) `pr-diff`가 새로 생긴 `export`를 전수로 훑자 넷이 더 나왔다 — `isLiveAssignment`·`dayMinutes`·`monthAttendanceKey`·`firstScheduleMonthKey`다. 파일 여섯 다 짝 테스트가 있어 훅도 감사자의 파일 단위 눈도 통과했다.

## 지은 것

훅이 이름 단위로 본다. 쓰려는 조각에서 `export function`·`export const`의 이름을 뽑아 **지금 저장된 파일에 없는 이름**만 새것으로 세고, 짝 테스트 본문에 그 이름이 안 나오면 막는다. 전부터 무검증으로 서 있던 `export`를 고치는 걸음은 안 막는다 — 막으면 손댈 길이 사라진다.

짝을 읽으려고 `guard.py`에 `contents()`가 서고, 쓰려는 조각을 보려고 `read("incoming")`이 생겼다. 규칙 15의 이름도 「내보내는 함수마다 그것을 부르는 짝 테스트가 먼저 있어야 한다」로 바뀐다.

## 원칙

검사의 단위가 사람이 일하는 단위와 다르면 그 틈으로 일이 샌다. 파일 단위로 보는 훅은 파일을 만드는 걸음만 잡고, 함수를 늘리는 걸음은 못 잡는다.
