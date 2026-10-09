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
- **그 152개 중 150개가 도메인 층을 하나도 import하지 않는다.** `entities`든 `features`든 당기는 것이 둘뿐이다(`DeadlineSheet`가 `availabilitySubmit`, 새로 세운 `UnreadCountLine`이 `notification`). 나머지는 원시 타입 props만 받는다 — controller가 도메인을 평평하게 풀어서 준다
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

**읽기는 `useQuery`로 간다.** 실기기 확인을 못 했다 — 맥과 기기가 같은 네트워크에 없고 시뮬레이터도 없다. `useQuery`는 어느 쪽이든 돌고, 확인이 되면 조각마다 한 줄 교체다.

## 완료 조건

### AC-01 — 쓰기 조각이 자기 use case로 간다

시트와 폼이 `features/<use case>/ui`에 살고 자기 슬라이스의 mutation을 부른다. `hooks/use<조각>.ts`가 보내는 중·실패를 든다.

화면 controller에서 그 mutation과 그 조각만 쓰던 값이 사라진다.

| 조각 | 가는 자리 |
| --- | --- |
| `ConfirmSheet`·`ConfirmSheetAsk`·`ConfirmSheetDone`·`ConfirmSheetFailed`·`ConfirmChangeSheet` | `features/scheduleConfirm/ui` |
| `SlotSheet`·`DiscardSlotSheet` | `features/scheduleSlot/ui` |
| `PersonSheet`·`PersonPickerSheet`·`PersonPickerLine` | `features/scheduleAssign/ui` |
| `AdjustSheet`·`AdjustChoiceSheet`·`AdjustRow` | `features/adjustment/ui` |
| `CreateScheduleSheet`·`CloseDayWarningSheet`·`DayHoursSheet` | `features/scheduleDay/ui` |
| `QualificationSheet` | `features/qualificationGrant/ui` |
| `RequestSheet`·`CancelShiftSheet` | `features/workRequest/ui` |
| `RehearsalFormSheet` | `features/rehearsalEdit/ui` |
| `ContactSheet`·`PhotoSheet` | `features/profileEdit/ui` |
| `MemberSheet`·`MemberDialog`·`MemberDetailSheet` | `features/memberAdmin/ui` |
| `DefaultWageSheet`·`MemberWageSheet`·`ResetWageDialog` | `features/wageAdmin/ui` |
| `HallDefaultsSheet` | `features/hallDefaults/ui` |

| `PendingEditor` | `features/profileEdit/ui` |
| `ProfileNotificationRow` | `features/pushSwitch/ui` |
| `ThemeSheet` | `shared/ui` — mutation이 없고 도메인을 모른다 |
| `ApprovalDetailSheet` | `features/workRequest/ui` — 판정하는 것이 사정이 아니라 취소 요청이다 |

가는 자리가 애매한 것은 그 조각이 **어느 mutation을 부르나**로 정한다. 둘 이상 부르면 그 use case가 하나로 묶이는지 보고, 아니면 화면에 남긴다.

**orchestration을 지나는 mutation은 안 옮긴다.** `useDayDetail`의 아홉(`useAddSlotMutation`·`useRemoveSlotMutation`·`useMergeSlotsMutation`·`useSplitSlotMutation`·`useAddAssignmentMutation`·`useRemoveAssignmentMutation`·`useForceChangeMutation`·`useGrantPositionMutation`·`useSetAdjustmentMutation`)이 그 자리다. 조각 하나가 mutation 하나를 삼키는 꼴이 아니라 `pick → commit → pending → run` 흐름을 지나서, `ConfirmChangeSheet`의 확정 버튼 하나가 pending의 종류에 따라 넷 중 하나를 고른다. 옮기려면 `useDayDetail` 653줄과 그 테스트 611줄을 다시 짜야 한다 — 이 plan의 범위가 아니다.

### AC-02 — 읽기 조각이 자기 도메인으로 간다

**대상이 쉰넷이 아니다 — 열여섯이다.** 처음 표는 파일을 열지 않고 이름으로 세어 과대 집계였다. worker가 「AC-02 표가 AC-03과 부딪힌다」고 집어 전수로 다시 쟀다.

`screens/*/ui`의 `.tsx` **백열다섯**을 꼴로 가르면 이렇다. 넷은 `grep` 하나로 세어진다.

| 꼴 | 수 | 뜻 |
| --- | --- | --- |
| `screen:`·`day:`를 통째로 받는다 | 39 | **못 올라간다** — `entities`가 `screens`를 몰라 그 타입을 따라갈 수 없다 |
| `screens/<슬라이스>/consts`만 본다 | 30 | **화면 문안을 든 뼈** — 상태 자리와 빈 상태·실패 자리다 |
| 같은 슬라이스의 `ui`를 꽂는다 | 16 | **묶음 자리** — 조각을 배치하고 도메인을 모른다 |
| `hooks`·`model`·`utils`의 계산을 받아 그린다 | 20 | **후보** — 넷은 화면 꼭대기(`BlockedScreen`·`LeftScreen`·`RetryScreen`·`QrFullscreen`)고 **열여섯이 올라갈 자리다** |
| 아무 층도 안 본다 | 6 | 둘은 기다리는 자리, **넷은 도메인을 모른다**(`AdminStatsMonthNav`·`WorkDaysSheet`·`ScheduleCalendarCard`·`StatsMonth` — `shared/ui` 자리) |
| 도메인 값을 당기고 통째를 안 받는다 | 4 | `AdminHomeScreen`·`MembersScreen`·`NotificationsScreen`·`PendingFooter` |

**열여섯이 이렇다** — `AdminStatsAttendance`·`AdminStatsWork`·`ApplicationsDateGroups`·`ApplicationsPersonGroups`·`ApprovalRows`·`MemberRows`·`BlockedRows`·`PendingRows`·`PayrollAccrual`·`PayrollHistoryRows`·`PayrollMonthRows`·`RehearsalDaySheet`·`PositionRowHead`·`PositionSlotCard`·`StatsAttendance`·`StatsPositions`.

**통째로 받는 것은 손이 닿으면 풀 수 있다.** ADR-016이 「받는 모양이 그 조각이 어디까지 갈 수 있는지를 정한다」고 적었다 — `screen:`을 props 하나씩으로 푸는 것이 올리는 일의 일부고, 그 서른아홉이 영구히 묶인 것은 아니다. 다만 그중 상태 자리·시트 고르는 자리·앱바는 풀어도 뼈다.

**조각이 도메인 타입을 타입으로 당기는 자리가 0건이다.** 백열다섯 가운데 하나도 없다 — 조각마다 자기 입력 타입을 따로 선언했다. 그래서 「무엇을 당기나」로는 주제를 못 가리고, 그 선언이 어느 도메인 타입의 투영인지는 사람이 본다. 기계가 가를 수 있는 것은 위 표의 넷까지다.

목록과 행과 카드가 `entities/<도메인>/ui`에 살고 자기 슬라이스의 query를 부른다. 도메인 타입을 props로 받는 것으로 끝나지 않는다 — 부르는 쪽이 값을 들고 와야 하면 자립이 아니다.

**`features/stats`는 그 자리에 머물고 통계 조각은 `features/stats/ui`로 간다.** 그 슬라이스에 mutation이 하나도 없지만 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)가 「도메인 둘 이상을 읽는 것은 읽기라도 `features`에 산다」고 적고 `features/stats`를 이름까지 들어 예로 쓴다. `useAttendanceMonthsQuery`가 `useWorkMonthsQuery`와 `useMonthsAttendanceQuery`를 합치고 자기 질의키조차 없다 — `queryKeys`에 `stats` 네임스페이스가 없다. `entities`로 내리면 규칙 3 `house/no-cross-slice-import`가 열두 자리에서 막는다(`import type`도 막는다).

**`wage`는 새 슬라이스가 아니다.** `useWageRatesQuery`가 `entities/payroll/services`에 살아서 `WageRows`·`WagesList`도 거기로 간다.

| 조각 | 가는 자리 |
| --- | --- |
| `DayRoster`·`DaySheet`·`ScheduleAgenda`·`ScheduleCalendarCard`·`ScheduleWorkerRoster`·`ScheduleWorkerPicker` | `entities/schedule/ui` |
| `DayDetail`·`DayDetailCard`·`ScheduleAdminCalendar`·`ScheduleAdminDay`·`ScheduleCalendarMonth`·`ScheduleCalendarMissing` | `entities/schedule/ui` |
| `RehearsalDaySheet` | `entities/rehearsal/ui` |
| `PositionRow`·`PositionRowHead`·`PositionSlotCard` | `entities/schedule/ui` |
| `WageRows` | `entities/payroll/ui` — `useWageRatesQuery`가 거기 산다 |
| `PayrollMonthRows`·`PayrollHistoryRows`·`PayrollAccrual`·`PayrollSummary` | `features/payrollCompute/ui` — `services/`에 composing read를 먼저 세운다 |
| `PeriodStepper` | `shared/ui` — `label`·`canGoPrev`·`canGoNext`·`onPrev`·`onNext`만 받고 도메인을 모른다. `PREV_PERIOD_TEST_ID`·`NEXT_PERIOD_TEST_ID`도 같이 내린다 |
| `MemberRows`·`PendingRows`·`BlockedRows` | `entities/member/ui` |
| `ApprovalRows`·`ApprovalsList` | `entities/workRequest/ui` |
| `ApplicationsDateGroups`·`ApplicationsPersonGroups`·`ApplicationsList`·`ApplicationsDeadlineBar` | `entities/availability/ui` |
| `NotificationsList` | `entities/notification/ui` |
| `StatsAttendance`·`StatsPositions`·`StatsMonth` | `features/stats/ui` |
| `StatsPayroll` | `features/payrollCompute/ui` — 주제가 급여고 그 슬라이스의 composing read를 부른다 |
| `AdminStatsWork`·`AdminStatsAttendance`·`AdminStatsMonthNav`·`WorkDaysSheet` | `features/stats/ui` |
| `ProfileCard`·`ProfileFacts`·`PendingSummary` | `entities/profile/ui` |

### AC-03 — 화면에 뼈만 남는다

`screens/<슬라이스>/ui`에 남는 것이 `<화면>Screen`·`Loading`·`Empty`·`Failed`·`Sheets`·`Toast`·`AppBar`·`BottomCta`·`SheetBody`·`SheetFace`다.

**조각을 배치하는 자리도 뼈다.** `ProfileSettings`·`StatsList`가 그 꼴이다 — `screen:` controller를 통째로 받아 상태 이름으로 조각만 고르고 도메인 층을 하나도 import하지 않는다. 「통째로 받으면 그 조각은 그 화면에 묶인다」와 「상태마다의 자리」가 같은 답을 낸다.

**급여 계산을 쓰는 조각 다섯은 `features/payrollCompute`에 service가 서야 움직인다.** `payrollViewDays`가 `attendance`·`payroll`·`rehearsal`·`schedule` 넷을 맞추는데 그 슬라이스에 `services/`가 없다 — 규칙 28이 그 자리를 허락하니 composing read를 세우면 조각이 그 슬라이스의 `ui`로 간다. `entities/payroll`로 내리는 길은 막혀 있다(규칙 3이 `attendance`를, `no-restricted-imports`가 `import type`까지 막는다).

딸린 것 둘 — `PayrollDayKind`가 `features/payrollCompute`에 섰는데 `DayKind | "wage-pending"`이라 `entities/payroll/model/payroll.type.ts`가 자리다. `screens/payroll/utils/yearRows.utils.ts`는 `shared`만 당겨 지금도 옮길 수 있다.

**「쓰기로 들어가는 문」은 뼈가 아니다.** `DaySheet`·`RehearsalDaySheet`·`WorkDaysSheet`가 mutation을 안 불러 `features`로 못 가지만, 도메인을 읽어 보여주는 것이 그 조각의 본업이라 `entities`로 간다. 쓰기 시트를 여는 행위는 `onPress`로 받는다 — 갈 데를 받는 것과 같은 축이다.

### AC-04 — 화면 controller가 경계와 교통정리만 든다

다섯 화면의 controller가 자기 조각들이 가져간 service를 안 부른다. 남는 것은 그 화면 전체가 쓰는 query, 조각 사이를 잇는 상태(어느 시트가 열렸나·어느 날이 골렸나), 갈 데다.

`useScheduleAdminScreen` 698줄이 **200줄 아래**로 내려간다.

### AC-05 — 조각이 제 로딩과 실패를 든다

조각 controller가 `useQuery`로 받고 `isPending`·`isError`를 상태 이름으로 내준다. `.tsx`는 그 이름으로 조각을 고른다.

**원래 이 AC는 「경계가 화면마다 하나 이상 선다」였고 뒤집었다.** 실기기 확인을 못 해서다. `QueryBoundary`와 `UnreadCountLine`은 그대로 둔다 — 확인이 되면 그 꼴이 본보기고, 그때 조각마다 `useQuery`를 `useSuspenseQuery`로 바꾸고 분기를 지운다.

### AC-06 — 갈 데는 올라가지 않는다

옮긴 조각이 `useRouter`를 들지 않고 `onPress`를 props로 받는다. 경로는 화면 controller에서 내려온다.

### AC-07 — 검사가 그 자리를 지킨다 ✅

규칙 마흔 `house/ui-no-router`가 `ui/`에서 `expo-router`의 라우팅 훅 여섯을 막는다. `Link`와 `import type { Href }`는 통과하고 `src/app/`은 밖이다.

## 하지 않는 것

**`shared/ui`의 백한 개는 안 건드린다.** 도메인 낱말을 쓰는 열다섯도 그대로다 — 도메인 층을 하나도 import하지 않고 props가 평평해서 옮길 이유가 없다([ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)).

**`screens`의 화면 파일 스물은 안 옮긴다.** 라우트 이름이라 쪼개지 않는다.

**controller가 작은 화면 열다섯은 뒤로 미룬다.** `approvals`(235줄)보다 작은 화면은 무게가 안 몰렸다. 증축 규칙대로 상처가 생긴 자리에만 짓는다.
