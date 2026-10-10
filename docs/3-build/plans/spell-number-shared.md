# 시간 길이를 말로 옮기는 손을 하나로

같은 분을 다섯 자리가 각자 말로 옮기고 **정본과 맞는 것이 하나다.** 맞는 본문을 `shared/utils`로 올려 넷을 지우고, 같은 축에서 날이 아닌 날짜를 내는 `periodSpan`을 함께 고친다.

## 입력 명세·기준

**정본은 [writing.md](../../2-design/design-system/writing.md)의 「숫자와 단위」다.**

> 시간 길이는 `9시간`으로 쓴다. 분이 남으면 `1시간 30분`이고 한 시간이 안 되면 `30분`이다 — `0시간 30분`으로 쓰지 않는다. 0분인 자리만 `0시간`이다(결근한 줄처럼 시간이 실제로 없는 자리고, 빈 값의 `–`와 다르다)

그 넷을 표로 풀면 0분은 `0시간`, 30분은 `30분`, 90분은 `1시간 30분`, 540분은 `9시간`이다.

**저장소에서 확인한 것.**

| 함수 | 사는 곳 | 0분 | 30분 | 90분 |
| --- | --- | --- | --- | --- |
| `spellHours` | `features/adjustment/utils/spellHours.utils.ts:5` (export) | `0시간` | `30분` | `1시간 30분` |
| `spellMinutes` | `entities/rehearsal/utils/spellTotal.utils.ts:5` (export) | **`0분`** | `30분` | `1시간 30분` |
| `spellLength` | `features/payrollCompute/utils/historyRows.utils.ts:33` (지역) | **`0분`** | `30분` | `1시간 30분` |
| `spellWorkedHours` | `features/payrollCompute/utils/summary.utils.ts:22` (지역) | `0시간` | **`0시간 30분`** | `1시간 30분` |
| `spellWorkedHours` | `features/payrollCompute/utils/payrollSummary.utils.ts:18` (지역) | `0시간` | **`0시간 30분`** | `1시간 30분` |

**틀리는 자리가 둘로 갈린다.** `spellMinutes`와 `spellLength`는 `hours === 0`을 먼저 보고 `rest`를 그대로 적어서 0분에 `0분`을 낸다. `spellWorkedHours` 둘은 `rest === 0`만 보고 `hours === 0`을 안 봐서 30분에 `0시간 30분`을 낸다. **`spellHours`가 두 가지를 다 본다** — 그 본문이 올라갈 것이다.

`MINUTES_PER_HOUR = 60`이 그 다섯 파일에 각자 선언돼 있다. 저장소 전체로는 아홉 자리고 나머지 넷은 이 계획 밖이다([`duplicated-constants-and-copy`](../../backlog.md)가 든다).

**틀린 값을 박아 둔 단언은 없다.** 다섯 자리의 짝 테스트를 다 읽었고 버그를 드러내는 입력이 비어 있었을 뿐이다. `historyRows.utils.test.ts`는 30분을 `연장 30분`으로 올바로 단언하고 0분 경우가 없다. `payrollSummary` 쪽은 450분·480분을 단언하고 한 시간 미만이 없다.

**다만 한 자리는 대상을 잃는다.** `features/adjustment/utils/__tests__/spellHours.utils.test.ts`의 `describe("spellHours …")` 넷이 그 export를 `await import`로 직접 당겨 본다. AC-02가 그 export를 지우니 블록이 대상을 잃어 typecheck와 jest가 둘 다 깨진다. 그 넷은 `spellDuration`의 이름으로 공유 테스트에 서니 보장은 줄지 않지만 **입력 둘(`45분`·`585분`)이 사라지므로 그것을 공유 테스트에 옮긴다** — `585분`은 「시간이 여럿이고 분이 남는」 자리라 90분과 다른 것을 짚는다.

**둘째 결함** — `screens/payroll/model/period.policy.ts:134`의 `periodSpan`이 month 갈래에서 `to`에 `` `${period.month}-31` ``을 고정으로 박는다. 2월이면 `2026-02-31`이 나간다. `features/payrollCompute/model/dateSpan.policy.ts:41`의 `monthSpan`이 `lastDayOf(month)`로 같은 일을 올바로 하고, `period.policy.ts`는 이미 그 파일에서 `DateSpan`을 타입으로, `features/payrollCompute/utils/payrollTotal.utils`에서 `weekStartOf`를 값으로 당겨 층 문제가 없다.

지금 증상은 없다. 그 `span`을 받는 곳이 `useMyPayrollViewDaysQuery` 하나고 `monthKeysOf`가 달 키를 뽑은 뒤 `isInSpan`이 문자열로 비교해 `2026-02-28 <= 2026-02-31`이 참이다. `DateSpan`의 계약이 「그 기간의 첫날과 끝날」인데 2월 31일은 날이 아니라서 결함이고, 그 값이 질의 범위로 가거나 화면에 글자로 나가는 날 터진다.

## 왜 한 PR인가

시간 길이 축과 `periodSpan`은 **같은 꼴의 결함**이다 — 정본이 판정한 값을 한 자리가 올바로 내고 다른 자리가 각자 다시 쓴다. 둘 다 `features/payrollCompute`의 올바른 구현을 `screens`나 다른 슬라이스가 베껴 쓴 모양이고, 고치는 손이 「올바른 쪽을 부른다」 하나다.

매퍼 여섯의 짝 테스트와 `PushReachableRow` 세 사본, `Holiday` 이름 가르기는 타입과 테스트 축이라 따로 간다([triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 A 가운데 뒤쪽 절반).

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `src/shared/utils/spellNumber.ts` | `spellDuration`이 선다. `spellWon` 옆이다 |
| `src/shared/utils/__tests__/spellNumber.test.ts` | `spellDuration`의 단언이 선다 |
| `src/features/adjustment/utils/spellHours.utils.ts` | 지역 `spellHours`와 `MINUTES_PER_HOUR`가 지워지고 `spellDuration`을 부른다. `spellHours`를 밖에서 당기는 자리가 있으면 그 import도 바뀐다. **그 export가 빠지면 남는 것이 `adjustRowLabel` 하나라 파일 이름이 담긴 것과 어긋난다** — `adjustRowLabel.utils.ts`로 `git mv`하고 짝 테스트도 따라간다 |
| `src/entities/rehearsal/utils/spellTotal.utils.ts` | 같다. `spellMinutes`를 밖에서 당기는 자리가 따라 바뀐다 |
| `src/features/payrollCompute/utils/historyRows.utils.ts` | 지역 `spellLength`가 지워진다 |
| `src/features/payrollCompute/utils/summary.utils.ts` | 지역 `spellWorkedHours`가 지워진다 |
| `src/features/payrollCompute/utils/payrollSummary.utils.ts` | 같다 |
| `src/screens/payroll/model/period.policy.ts` | `periodSpan`의 month 갈래가 `monthSpan(period.month)`를 부른다 |
| 위 다섯의 짝 테스트 | 0분과 한 시간 미만을 단언하는 `describe`가 더해진다. 기존 단언은 안 고친다 |
| `src/screens/payroll/model/__tests__/period.policy.test.ts` | 2월·윤년·30일 달을 단언하는 `describe`가 더해진다 |

## 완료 조건

- **AC-01** `src/shared/utils/spellNumber.ts`가 `spellDuration`을 내보내고 정본 넷을 만족한다 — 0분 `0시간`, 30분 `30분`, 90분 `1시간 30분`, 540분 `9시간`. 경계도 센다 — 59분 `59분`, 60분 `1시간`, 120분 `2시간`
- **AC-02** 시간 길이를 말로 옮기는 지역 함수가 `shared` 밖에 0이다. 다섯 자리가 `spellDuration`을 부르고, `MINUTES_PER_HOUR` 선언이 그 다섯 파일에서 사라진다
- **AC-03** 다섯 자리의 입구가 정본 값을 낸다. `spellTotal`·`adjustRowLabel`·`myPayrollSubtitle`과 `summary.utils`·`historyRows.utils`의 export가 0분과 한 시간 미만에서 어긋나지 않는다
- **AC-04** `periodSpan({unit:"month", month:"2026-02"})`이 `{from:"2026-02-01", to:"2026-02-28"}`이다. 윤년(`2028-02` → `2028-02-29`)과 30일 달(`2026-04` → `2026-04-30`)도 맞는다
- **AC-05** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 실패 테스트를 쓴다 — `spellDuration`(AC-01), 다섯 입구(AC-03), `periodSpan` 2월(AC-04). 대상이 아직 없는 `spellDuration`은 정적 import 대신 `await import`와 `@ts-expect-error` 한 줄을 쓴다
2. `spellDuration`을 세운다 — `spellHours`의 본문을 옮긴다
3. 다섯 자리의 지역 함수를 지우고 `spellDuration`을 부른다. 밖에서 당기던 자리의 import를 따라 고친다
4. `periodSpan`의 month 갈래를 `monthSpan`으로 바꾼다. `periodMonthKeys`가 `monthKeysOf`와 겹치는데 **이 PR에서 안 건드린다** — `Period`를 받는 쪽과 `DateSpan`을 받는 쪽의 입구가 달라 합치면 호출부가 따라 바뀐다
5. 검증하고 PR을 연다

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 테스트는 `pnpm exec jest <경로>`로 좁혀 돌린다 — `pnpm test -- <경로>`는 pnpm이 플래그를 먹는다. integration은 이 계획의 범위 밖이다(`api/`를 안 건드린다).
