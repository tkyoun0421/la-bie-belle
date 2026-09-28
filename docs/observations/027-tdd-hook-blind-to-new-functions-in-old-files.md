---
status: open
target: .claude/hooks/tdd-guard-unit.py
date: 2026-09-28
---

# TDD 훅이 기존 파일 안에 선 새 함수를 못 본다

## 일

`payroll-view`의 구현자가 계산 함수 여섯을 **이미 있는 파일 안에** 넣었다 — `payroll-days.ts`의 `payrollViewDays`, `period.ts`의 `periodOf`·`periodStartDate`·`isInPeriod`·`periodUnitOf`, `year-rows.ts`의 `monthRowsOfDays`. 여섯 다 테스트 없이 main 앞까지 왔다.

`tdd-guard-unit.py`가 보는 것은 **새 `.ts` 파일에 짝이 있나**다. 파일이 이미 있고 그 파일에 `__tests__` 짝도 이미 있으면 훅은 통과시킨다 — 그 안에 오늘 처음 생긴 `export function`이 몇 개든 세지 않는다. 그래서 파일을 새로 만드는 쪽은 막히고, 있는 파일에 얹는 쪽은 안 막힌다. 훅을 피하려는 뜻이 아니라, 있는 자리에 얹는 것이 자연스러워서 그렇게 된다.

잡은 것은 기계가 아니라 총괄의 눈이었다. `pr-diff` 감사도 「테스트 없는 구현 파일」을 파일 단위로 보니 이 자리를 안 짚는다 — 그 파일에는 테스트가 있다.

## 볼 자리

훅이 `export`된 이름 단위로 보게 바꾸는 길이 있다. 바뀐 `.ts`에서 새로 생긴 `export function`·`export const` 이름을 뽑고, 짝 테스트 파일 본문에 그 이름이 안 나오면 막는다. 정규식으로 이름을 뽑는 것이라 오탐(주석 안의 같은 이름, 재수출)이 나지만, 지금은 아예 안 보는 쪽이다.

두 번째가 나오면 그때 짓는다. 지금은 카운터 하나다.

## 원칙

검사의 단위가 사람이 일하는 단위와 다르면 그 틈으로 일이 샌다. 파일 단위로 보는 훅은 파일을 만드는 걸음만 잡고, 함수를 늘리는 걸음은 못 잡는다.
