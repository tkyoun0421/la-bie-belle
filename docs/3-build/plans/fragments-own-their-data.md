---
sources:
  - ../../2-design/adr/ADR-016-fragments-own-their-data.md
  - ../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md
---

# 조각이 자기 데이터를 들게 한다

`.tsx`는 조립만 하게 됐다. 그 대가로 무게가 화면 controller 한 자리에 모였다 — `useScheduleAdminScreen`이 698줄에 service 스물여섯(query 9 · mutation 17)을 들고, 조각 서른여섯이 그 한 controller가 완성한 값을 받아 그린다.

## 입력 명세·기준

**정본은 [ADR-016](../../2-design/adr/ADR-016-fragments-own-their-data.md)이다** — 조각이 자기 데이터를 부르고, 조각마다 controller가 서고, 화면은 경계를 든다. 가름의 축은 무엇을 아는가다.

**저장소에서 확인한 것.**

- **`screens/*/ui`가 152개다.** 화면 파일 스물에 조각 백서른둘이다
- **그 152개 중 149개가 도메인 층을 하나도 import하지 않는다.** `entities`든 `features`든 당기는 것이 셋뿐이다(`DeadlineSheet`·`PendingForm`이 `availabilitySubmit`, 새로 세운 `UnreadCountLine`이 `notification`). 나머지는 원시 타입 props만 받는다 — controller가 도메인을 평평하게 풀어서 준다
- **그래서 조각이 자립하지 못한다.** 이름에 도메인이 있어도(`DayRoster`·`PositionSlotCard`·`WageRows`) 타입으로는 모른다. 두 번째 화면이 쓰려면 그 화면 controller가 같은 query를 또 부르고 같은 props를 또 엮어야 한다
- **무게가 다섯 화면에 몰렸다.**

| 화면 | controller | query | mutation |
| --- | --- | --- | --- |
| `scheduleAdmin` | 698줄 | 9 | 17 |
| `scheduleWorker` | 525줄 | 8 | 3 |
| `rehearsal` | 346줄 | 5 | 3 |
| `pending` | 338줄 | 3 | 4 |
| `profile` | 334줄 | 4 | 5 |

- **`features` 슬라이스 스물둘이 이미 서 있다.** mutation 쪽은 갈 자리가 다 있다 — `scheduleAssign`·`scheduleSlot`·`scheduleDay`·`scheduleConfirm`·`adjustment`·`holiday`·`qualificationGrant`·`workRequest`가 `scheduleAdmin`의 mutation 열일곱을 받는다
- **`entities/*/ui`에 하나가 섰다.** `UnreadCountLine`이 Suspense 실험이고 본보기다

## 묶음 순서

**쓰기가 먼저다.** `features`로 가는 조각은 `useMutation`을 부르고, `useMutation`은 `Suspense`에 걸리지 않는다. RN의 Suspense 확인 결과와 무관하게 갈 수 있고 무게도 거기 가장 크다.

**읽기는 실기기 확인 뒤다.** `entities`로 가는 조각은 `useSuspenseQuery`로 받을지 `useQuery`로 받을지가 그 확인에 달렸다.

## 완료 조건

### AC-01 — 쓰기 조각이 자기 use case로 간다

시트와 폼이 `features/<use case>/ui`에 살고 자기 슬라이스의 mutation을 부른다. `hooks/use<조각>.ts`가 보내는 중·실패를 든다.

화면 controller에서 그 mutation과 그 조각만 쓰던 값이 사라진다.

| 조각 | 가는 자리 |
| --- | --- |
| `ConfirmSheet`·`ConfirmSheetAsk`·`ConfirmSheetDone`·`ConfirmSheetFailed`·`ConfirmChangeSheet`·`CreateScheduleSheet` | `features/scheduleConfirm/ui` |
| `SlotSheet`·`DiscardSlotSheet` | `features/scheduleSlot/ui` |
| `PersonSheet`·`PersonPickerSheet`·`PersonPickerLine` | `features/scheduleAssign/ui` |
| `AdjustSheet`·`AdjustChoiceSheet`·`AdjustRow` | `features/adjustment/ui` |
| `CloseDayWarningSheet`·`DayHoursSheet` | `features/scheduleDay/ui` |
| `QualificationSheet` | `features/qualificationGrant/ui` |
| `RequestSheet`·`CancelShiftSheet` | `features/workRequest/ui` |
| `RehearsalFormSheet` | `features/rehearsalEdit/ui` |
| `ContactSheet`·`PhotoSheet`·`ThemeSheet` | `features/profileEdit/ui` |
| `MemberSheet`·`MemberDialog`·`MemberDetailSheet` | `features/memberAdmin/ui` |
| `DefaultWageSheet`·`MemberWageSheet`·`ResetWageDialog` | `features/wageAdmin/ui` |
| `HallDefaultsSheet` | `features/hallDefaults/ui` |
| `WorkDaysSheet` | `features/stats/ui` |
| `PendingEditor`·`PendingForm`·`PendingFooter` | `features/availabilitySubmit/ui` |
| `ApprovalDetailSheet` | `features/excuse/ui` |

가는 자리가 애매한 것은 그 조각이 **어느 mutation을 부르나**로 정한다. 둘 이상 부르면 그 use case가 하나로 묶이는지 보고, 아니면 화면에 남긴다.

### AC-02 — 읽기 조각이 자기 도메인으로 간다

목록과 행과 카드가 `entities/<도메인>/ui`에 살고 자기 슬라이스의 query를 부른다. 도메인 타입을 props로 받는 것으로 끝나지 않는다 — 부르는 쪽이 값을 들고 와야 하면 자립이 아니다.

| 조각 | 가는 자리 |
| --- | --- |
| `DayRoster`·`ScheduleAgenda`·`ScheduleCalendarCard`·`ScheduleWorkerRoster` | `entities/schedule/ui` |
| `PositionRow`·`PositionRowHead`·`PositionSlotCard` | `entities/schedule/ui` |
| `WageRows` | `entities/wage/ui` |
| `PayrollMonthRows`·`PayrollHistoryRows`·`PayrollAccrual`·`PayrollSummary` | `entities/payroll/ui` |
| `MemberRows`·`PendingRows`·`BlockedRows` | `entities/member/ui` |
| `ApprovalRows` | `entities/excuse/ui` |
| `ApplicationsDateGroups`·`ApplicationsPersonGroups` | `entities/availability/ui` |
| `NotificationsList` | `entities/notification/ui` |
| `StatsAttendance`·`StatsPositions`·`StatsPayroll`·`AdminStatsWork`·`AdminStatsAttendance` | `entities/stats/ui` |
| `ProfileCard`·`ProfileFacts` | `entities/profile/ui` |

### AC-03 — 화면에 뼈만 남는다

`screens/<슬라이스>/ui`에 남는 것이 `<화면>Screen`·`Loading`·`Empty`·`Failed`·`Sheets`·`Toast`·`AppBar`·`BottomCta`·`SheetBody`·`SheetFace`다. 도메인을 아는 조각이 없다.

### AC-04 — 화면 controller가 경계와 교통정리만 든다

다섯 화면의 controller가 자기 조각들이 가져간 service를 안 부른다. 남는 것은 그 화면 전체가 쓰는 query, 조각 사이를 잇는 상태(어느 시트가 열렸나·어느 날이 골렸나), 갈 데다.

`useScheduleAdminScreen` 698줄이 **200줄 아래**로 내려간다.

### AC-05 — 경계가 화면마다 하나 이상 선다

`QueryBoundary`가 조각을 감싸고, 함께 채워질 조각이 한 경계에 묶인다. 조각 controller에 `isPending`·`isError` 분기가 없다.

**실기기 확인이 통과하지 못하면 이 AC를 뒤집는다** — 조각이 `useQuery`로 제 로딩을 그리고 `QueryBoundary`는 실패만 든다.

### AC-06 — 갈 데는 올라가지 않는다

옮긴 조각이 `useRouter`를 들지 않고 `onPress`를 props로 받는다. 경로는 화면 controller에서 내려온다.

### AC-07 — 검사가 그 자리를 지킨다

조각 `.tsx`가 `useRouter`를 쥐는 것을 lint가 막는다. 지금 규칙 서른아홉까지 있고 이 자리가 마흔이다.

## 하지 않는 것

**`shared/ui`의 백한 개는 안 건드린다.** 도메인 낱말을 쓰는 열다섯도 그대로다 — 도메인 층을 하나도 import하지 않고 props가 평평해서 옮길 이유가 없다([ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)).

**`screens`의 화면 파일 스물은 안 옮긴다.** 라우트 이름이라 쪼개지 않는다.

**controller가 작은 화면 열다섯은 뒤로 미룬다.** `approvals`(235줄)보다 작은 화면은 무게가 안 몰렸다. 증축 규칙대로 상처가 생긴 자리에만 짓는다.
