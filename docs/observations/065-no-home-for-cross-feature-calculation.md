---
status: actioned
target: ADR-016
date: 2026-10-09
---

# `features` 사이를 잇는 계산의 집이 없다

쓰기 조각을 `features/<use case>/ui`로 옮기는 중에 `adjustSheetRows.utils`가 안 따라갔다. `@/features/payrollCompute/model/paidMinutes.policy`를 당기므로 `features/adjustment`로 옮기면 규칙 3 `house/no-cross-slice-import`에 걸린다.

## 어디가 그 자리인가

`screens`가 `features`의 계산을 모으는 파일 여덟이고 그중 셋이 둘 이상을 당긴다.

| 파일 | 당기는 슬라이스 |
| --- | --- |
| `scheduleAdmin/model/dayDetail.type.ts` | `adjustment` · `scheduleAssign` · `scheduleConfirm` |
| `stats/utils/chartValues.utils.ts` | `payrollCompute` · `stats` |
| `scheduleAdmin/utils/adjustSheetRows.utils.ts` | `adjustment` · `payrollCompute` |
| `stats/utils/payrollSummary.utils.ts` | `payrollCompute` |
| `scheduleAdmin/utils/adjustmentCount.utils.ts` | `payrollCompute` |
| `scheduleAdmin/utils/absenceMinutes.utils.ts` | `payrollCompute` |
| `stats/utils/attendanceTally.utils.ts` · `attendanceDays.utils.ts` | `stats` |
| `scheduleAdmin/utils/confirmChangeCopy.utils.ts` | `scheduleConfirm` |

`paidMinutes.policy` 하나를 `screens/scheduleAdmin`의 세 파일이 당긴다.

## 무엇이 걸리나

**`features`끼리 못 당긴다.** 규칙 3이 슬라이스 경계를 막고, 그것이 맞다 — use case가 서로를 알면 하나로 묶여야 한다.

**그래서 공용 계산이 `screens`에 남는다.** 조각이 `features`로 올라가도 그 조각이 쓰던 계산은 못 따라가고, 조각이 `screens`의 `utils`를 당기면 이번엔 층 순서가 깨진다(`features`가 `screens`를 못 본다). 결과는 **그 계산을 쓰는 조각만 `screens`에 남는** 것이다.

## 실은 내려가야 하는 것일 수 있다

`paidMinutes`는 「이 근무가 몇 분 유급인가」다. 그것은 use case가 아니라 **도메인 지식**이라 `entities`의 일이다. `features/payrollCompute`에 사는 까닭은 급여 계산 use case가 그걸 처음 필요로 했기 때문이고, 그 뒤 근무표와 통계가 같은 계산을 쓰게 됐다.

같은 꼴이 `features/stats`에도 있다 — `stats/utils` 셋이 그것을 당긴다.

ADR-016이 조각을 층으로 올리면 이 자리가 전부 드러난다. 「`features`의 계산 가운데 둘 이상이 쓰는 것은 `entities`로 내린다」가 설 자리인지, 아니면 `shared/model`에 중립 계산 자리를 두는지가 판정이다.

## 지금은 왜 안 고치나

AC-02(읽기 조각 이동)가 같은 자리를 또 밟는다. 그때 전수가 보이니 한 번에 판정하는 쪽이 싸다 — 지금 고치면 읽기 묶음이 또 옮긴다.

## 판정 — 집은 있었다. 조각이 못 올라가는 것이 답이다

`features/payrollCompute`가 그 집이다. 거기 사는 셋이 당기는 것을 세면 `paidMinutes`가 `entities/payroll`·`entities/schedule`, `payrollDays`가 거기에 `entities/attendance`까지 셋이다 — 도메인을 가로지르는 읽기라 [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)대로 `features`가 맞다. `entities`로 내리면 규칙 3이 막는다.

**사본도 없었다.** `payrollDays`를 `screens/payroll` 넷과 `screens/stats` 넷이 당기는데 둘 다 `features/payrollCompute`를 당기는 것이고 각자 복사한 것이 아니다. `paidMinutes`를 당기는 `scheduleAdmin` 셋은 같은 슬라이스 안이다.

**남은 것은 하나다 — 그것을 쓰는 조각이 `screens`를 떠날 수 없다.** 규칙 3이 `features`끼리도 막으니 `features/stats/ui`도 `entities/payroll/ui`도 `payrollCompute`에 못 닿는다. 그래서 `StatsPayroll`과 `screens/payroll/utils` 넷, `screens/stats/utils` 넷이 그 자리에 남는다.

## 한 칸 더 있었다 — 그 슬라이스에 service가 없었던 것이다

worker가 사본으로 두 길을 막힌 것까지 확인하고 **세 번째를 냈다.** `payrollViewDays`는 entity 슬라이스 **넷**을 맞춘다 — `attendance`(`getAttendanceStatus`)·`payroll`·`rehearsal`(`rehearsalHours`)·`schedule`이다. `entities/payroll`로 내려도 그 안에서 못 산다.

그런데 규칙 28 `house/features-query-composes`가 「`features`의 읽기 service는 `entities` 도메인 둘 이상을 맞출 때만 선다」고 **허락한다.** `features/payrollCompute`에 `services/`가 없었을 뿐이다 — `model`과 `utils`만 있다.

**그래서 조각이 못 올라가는 것이 아니라 올라갈 자리를 안 만든 것이었다.** `features/payrollCompute/services`에 composing read를 세우면 `PayrollSummary`·`PayrollAccrual`·`PayrollHistoryRows`·`PayrollMonthRows`와 `StatsPayroll`이 `features/payrollCompute/ui`로 간다. [ADR-016](../2-design/adr/ADR-016-fragments-own-their-data.md)에 「먼저 물을 것은 그 슬라이스에 service가 있나다」를 넣었다.

`screens`에 남는 것은 **진짜로 `features` 둘 이상을 당기는 자리**뿐이다 — 전수로 세니 여덟이고 그중 `ui`는 시트 고르는 자리 둘(`DayDetailSheetBody` 다섯, `ScheduleAdminSheetBody` 셋)이다.

**딸린 사고 하나.** `PayrollDayKind`가 `features/payrollCompute`에 선언됐는데 `DayKind | "wage-pending"`이고 둘 다 `entities/payroll/model/payroll.type.ts`에 있다. 거기로 내려갈 타입이다.
