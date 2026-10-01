---
sources:
  - ../../2-design/spec/stats-admin.md
  - ../../2-design/system/screens/stats.md
  - ../../2-design/system/screens/stats.md#관리자--adminstats
  - ../../2-design/system/screens/stats.md#근무
  - ../../2-design/system/screens/stats.md#근무-내역-시트
  - ../../2-design/system/screens/stats.md#근태-현황-줄
  - ../../2-design/design-system/components.md#차트-넷
  - ../../2-design/design-system/components.md#세그먼트
  - ../../2-design/modules/attendance/README.md#att-020
  - ../../2-design/modules/attendance/README.md#att-023
  - ../../2-design/modules/schedule/README.md#sch-021
  - ../../2-design/modules/attendance/design.md#소유-데이터
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/runtime.md#tanstack-query-규칙
  - ../../2-design/system/runtime.md#읽기-범위
---

# 관리자 통계 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [stats.md](../../2-design/system/screens/stats.md)다. 차트 조각 셋은 [components.md의 차트 넷](../../2-design/design-system/components.md#차트-넷), 경로와 역할 조건은 [navigation.md](../../2-design/system/navigation.md#경로)다.

화면 하나(`/admin/stats`)와 차트 조각 셋이 이 task의 산출이다.

선행이 하나다. [`attendance-data`](attendance-data.md)가 상태 여섯을 내는 순수 함수와 근태 월 집계를 이미 낸다([AC-06](attendance-data.md#ac-06)). 배정과 날은 [`schedule-data`](schedule-data.md)가 세운 `['schedule', 'YYYY-MM']`을 읽는다 — `attendance-data`가 그것을 선행으로 들고 있어 따로 안 적는다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **금액이 없다.** 관리자 통계가 세는 것은 시간과 출결이고 시급을 안 읽는다. `['payroll']`도 `['rehearsal']`도 이 화면이 안 부른다 — 질의가 절반으로 준 자리고, 시급 화면([`payroll-wages`](payroll-wages.md))이 선행에서 빠진 이유다
- **탭이 둘이고 근무 탭이 구획 둘이다.** 사람별과 포지션이 같은 432시간을 두 축으로 가른다. 합계가 셋 다 같아야 한다 — 이 task의 핵심 단언이다
- **차트 조각 셋이 여기서 처음 선다.** 추이 그래프·줄 막대·비율 띠다. 대시보드([`dashboard`](../../backlog.md))와 근무자 통계([`stats-worker`](stats-worker.md))가 이것을 가져다 쓴다
- **달 키를 새로 연다.** `['attendance', 'YYYY-MM']`이다([attendance/design.md](../../2-design/modules/attendance/design.md#소유-데이터)). 날 키로 한 달을 읽으면 서른 질의고 열두 달 그래프에서는 360이 된다

## 구현 산출물

> 관찰 가능한 완료 조건은 [spec](../../2-design/spec/stats-admin.md)이 든다. 여기 있는 것은 그 조건을 세우는 파일·함수·계산이고, 아래 번호를 「변경 파일」과 「검증 방법」 표가 가리킨다.

### AC-01

**근무 집계 순수 함수.**

`src/features/stats/model/work-totals.ts`

- 그달의 배정 목록과 날 목록을 받아 `{ totalMinutes, totalCount, byPerson[], byPosition[] }`을 낸다. 인자만 보고 계산한다 — 안에서 `Date.now()`를 안 부른다
- **한 배정의 시간은 그날 근무 시간이다.** `days.starts_at`과 `ends_at`의 차이고 사람마다 다르지 않다
- **겸임은 앞 포지션으로 한 번만 센다**([stats.md](../../2-design/system/screens/stats.md#근무-포지션-구획)). 양쪽에 얹으면 포지션 합이 전체보다 커진다
- **교육 배정도 든다**([ATT-020](../../2-design/modules/attendance/README.md#att-020)). 어느 포지션의 교육이었는지로 센다
- **리허설은 안 든다**([SCH-021](../../2-design/modules/schedule/README.md#sch-021)). `['rehearsal']`을 아예 안 읽어서 들어올 길이 없다
- **셋의 합이 같다.** `byPerson`의 시간 합과 `byPosition`의 시간 합이 `totalMinutes`와 같다. unit이 이것을 단언한다
- `byPosition`은 아홉이 다 선다 — 시간이 0인 포지션도 행으로 낸다
- 정렬은 둘 다 시간 많은 순이다

### AC-02

**한 사람의 날짜별 근무.**

`src/features/stats/model/person-days.ts`

- 같은 입력에서 한 사람의 날짜 목록을 낸다 — 날짜·요일·포지션·시간이고 날짜순이다
- **겸임인 날은 앞 포지션만 낸다.** AC-01과 같은 규칙이라 시트 합계가 구획 줄의 값과 맞는다
- 합계는 회수와 시간 둘이다

### AC-03

**열두 달 추이.**

`src/features/stats/utils/trend.utils.ts`와 `src/features/stats/api/useStatsQueries.ts`

- 보는 달에서 열한 달을 거슬러 올라간 열두 달이고 보는 달이 오른쪽 끝이다
- **달마다 키를 읽어 더한다**([읽기 범위](../../2-design/system/runtime.md#읽기-범위)). 근무 탭은 `['schedule', 'YYYY-MM']` 열둘, 근태 탭은 거기에 `['attendance', 'YYYY-MM']` 열둘이다 — `useQueries`로 나란히 읽는다
- **키를 다른 화면과 같이 쓴다.** 근무표·급여 화면이 이미 읽어둔 달은 캐시에서 온다. 새 키를 만들지 않는 것이 이 방식의 값이다
- **앱을 쓰기 전 달은 값이 없다.** 0이 아니라 `null`이고 선이 거기서 끊긴다 — 근무표가 아예 없는 달과 확정 전인 달을 같게 다룬다
- 대표 숫자는 탭마다 하나다 — 근무는 시간 합, 근태는 출근율

### AC-04

**달 키 dal.**

`src/entities/attendance/api/get-month-attendance.ts`

- 키가 `['attendance', 'YYYY-MM']`이고 그달치 `check_ins`와 `excuse_status`를 받는다
- 날 키(`get-day-attendance.ts`)와 같은 모양을 내서 [`attendance-data` AC-06](attendance-data.md#ac-06)의 순수 함수가 그대로 돈다. **상태 계산을 여기서 다시 짜지 않는다**
- 한 달 서른 명이면 수백 행이라 한 질의다([읽기 범위](../../2-design/system/runtime.md#읽기-범위))

### AC-05

**차트 조각 셋.** 이미 [`ui-kit`](../../2-design/spec/ui-kit.md)이 세웠다 — `src/shared/ui/TrendChart.tsx`·`RowBars.tsx`·`RatioBand.tsx`고 입력 타입(`TrendChartProps`·`RowBarsProps`·`RatioBandProps`)도 그 파일이 든다. 이 task는 그 조각에 값을 먹이는 자리고, 아래는 그 조각이 이미 지키고 있어야 할 계약이다 — 어긋나면 조각을 고치는 것이 아니라 총괄에게 보고한다.

`src/shared/ui/`

- `TrendChart.tsx` — 열두 달. 선 2px `stroke.brand-solid`, 아래 면 `bg.brand-weak`, **점은 보는 달에만**, 높이 96px. 값이 `null`인 달은 선이 끊긴다. 가로축은 1·4·7·10월만 글자고 나머지 여덟은 눈금이다
- `RowBars.tsx` — 줄 아래 4px `rounded-full`, **트랙이 없다**. 가장 큰 값이 100%고 **0이면 아무것도 안 그린다**
- `RatioBand.tsx` — 8px `rounded-full`, 몫 사이 2px 틈. 몫이 0이면 그 색과 범례가 같이 빠진다
- **등장 모션이 없다**([components.md](../../2-design/design-system/components.md#차트-넷)). 막대가 자라거나 선이 그려지지 않는다. 값이 바뀌면 `--duration-base`로 옮겨간다
- 계산은 `.ts`에 있고 `.tsx`는 좌표와 폭을 받아 그리기만 한다

### AC-06

**화면 뼈대.**

`/admin/stats`. 관리자만이다([navigation.md](../../2-design/system/navigation.md#경로)).

- 앱바(뒤로·「통계」), 달 줄, 세그먼트 둘(근무·근태), 추이 그래프까지가 두 탭에서 같은 자리다
- **세그먼트 칸이 둘인 것이 처음이다**([components.md](../../2-design/design-system/components.md#세그먼트)). 칸 하나가 절반을 먹는다 — 조각이 칸 수를 안 고정하는지 여기서 드러난다
- 달 줄은 앞으로 이번 달에서 멈추고 뒤로 첫 근무표가 있는 달까지 간다. **못 가는 화살표는 안 그리고 자리만 남긴다**
- 탭을 오가도 보는 달이 그대로다
- **그래프를 눌러도 달이 안 바뀐다**

### AC-07

**근무 탭.**

- 합계(시간) → 보조 줄(건수) → 사람별 구획 → 포지션 구획
- 구획 머리글은 「사람별」·「포지션」이고 가는 선 아래에 선다 — [직원](../../2-design/modules/account/screens/members.md#퇴사-구획)의 퇴사 머리글과 같은 꼴이다
- 사람별 줄은 사진·이름·회수·시간·화살표에 줄 막대, 포지션 줄은 이름·건수·시간에 줄 막대다
- **사람별 줄만 눌린다.** 포지션 줄에는 화살표가 없다
- **퇴사한 사람도 그 달에 일했으면 선다**

### AC-08

**근무 내역 시트.**

- 사람별 줄을 누르면 바텀시트가 올라온다. 손잡이·이름·날짜 목록·합계 줄이다
- 날짜순이고 왼쪽이 날짜·요일·포지션, 오른쪽이 시간이다
- **합계 줄이 구획 줄의 값과 같다.** 회수도 같이 적는다 — 틀리면 둘 중 하나가 틀린 것이고 그것을 눈으로 확인하는 것이 이 시트의 쓸모다
- 모션은 [motion.md](../../2-design/design-system/foundation/motion.md)의 바텀시트고 이 화면이 따로 정하는 것이 없다

### AC-09

**근태 탭과 빈 상태.**

- 현황 줄(출근·지각·출근 인정·결근) → 비율 띠와 범례 → 사람별 목록이다. 셈은 [`attendance-data` AC-06](attendance-data.md#ac-06)의 함수를 부른다 — **여기서 다시 짜지 않는다**
- **출근과 출근 인정을 합치지 않는다**([ATT-023](../../2-design/modules/attendance/README.md#att-023))
- 목록은 이름 가나다순이고 **지각이 0이면 그 자리가 빈다**. 색으로 안 가르고 줄이 안 눌린다
- 빈 상태 — 합계 자리가 `–`, 보조 줄과 구획 머리글이 같이 사라지고 목록 자리에만 빈 상태가 온다. **추이 그래프는 안 빈다**
- 달이 하나뿐이면 그래프 자리에 점 하나다. 선도 면도 없다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/entities/schedule/model/schedule.type.ts` | 포지션 아홉과 그 순서의 정본. 근무표 두 화면이 들고 있던 두 벌이 여기로 올라온다 | 「착수 판정」 |
| `src/screens/schedule-worker/model/day-sheet.ts`·`src/screens/schedule-admin/model/position-rows.ts` | `POSITION_ORDER`를 entities에서 받아 다시 내보낸다 — 부르던 이름이 그대로 살아 기존 테스트가 안 깨진다 | 「착수 판정」 |
| `src/entities/attendance/api/get-month-attendance.ts` | `['attendance', 'YYYY-MM']`. 그달에 연 날을 먼저 집고 `check_ins`·`excuse_status`를 표마다 한 번씩 읽어 [`get-day-attendance.ts`](../../../src/entities/attendance/api/getDayAttendance.api.ts)와 같은 `{ checkIns, excuseStatuses }`를 낸다 | AC-04 |
| `src/entities/schedule/api/get-first-schedule-month.ts` | `['schedule', 'first-month']`. `schedules`의 가장 이른 `month` 한 줄 — 달 줄이 뒤로 갈 수 있는 바닥이다 | AC-04·「착수 판정」 |
| `src/entities/attendance/model/attendance-summary.ts` | `tallyMonthlyAttendance`가 `features/attendance`에서 여기로 내려온다 — 근태 화면과 통계가 같은 셈을 나눠 쓴다. `attendanceRate`는 뒤에 [`stats-worker`](stats-worker.md)가 같은 파일에 더했다 | AC-09 |
| `src/features/attendance/model/attendance-summary.ts` | 내려간 `tallyMonthlyAttendance`가 빠지고 `summarizeAttendanceStatuses`만 남는다 | AC-09 |
| `src/features/stats/model/work-totals.ts` | 사람별·포지션별 집계와 그 재료(`workInputsOf`·`dayMinutes`·`isLiveAssignment`·`hoursLabel`) | AC-01 |
| `src/features/stats/model/person-days.ts` | 한 사람의 날짜별 근무 줄과 합계. 교육 배정은 「안내 교육」 꼴 라벨이 붙는다 | AC-02 |
| `src/features/stats/utils/trend.utils.ts` | 보는 달을 오른쪽 끝으로 한 열두 달 창과 값 없는 달의 `null` | AC-03 |
| `src/features/stats/model/attendance-inputs.ts` | 그달 배정·날 시각과 인증·사유를 `(day_id, profile_id)`로 맞물려 상태 함수가 그대로 먹을 입력을 낸다 | AC-09·「착수 판정」 |
| `src/features/stats/api/useStatsQueries.ts` | 달마다의 `useQueries`와 캐시 키. 훅을 내놓는 `.ts`는 훅 이름을 써야 해서 `queries.ts`로 못 선다(`tests/lint/file-naming.ts`) | AC-03 |
| `src/screens/admin-stats/model/attendance-rows.ts` | 근태 탭 사람별 목록과 그달 tally 조립. 0인 몫은 값 자리를 비운다 | AC-09 |
| `src/screens/admin-stats/model/chart-values.ts` | 읽어 온 열두 달을 그래프 값으로 옮기고 출근율 라벨을 낸다 | AC-03·AC-09 |
| `src/shared/lib/month-boundary.ts` | 달 줄 화살표의 바닥·천장 판정. `screens/admin-stats/model/`에 섰다가 두 통계가 같이 쓰게 되면서 [`stats-worker`](stats-worker.md)가 shared로 올렸다 | AC-06 |
| `src/screens/admin-stats/ui/AdminStatsScreen.tsx` | 앱바·달 줄·세그먼트 둘·추이 그래프·탭 둘·근무 내역 시트 조립 | AC-06~AC-09 |
| `src/screens/admin-stats/ui/WorkDaysSheet.tsx` | 근무 내역 시트의 속 — 날짜 줄과 합계를 세로로 쌓는다 | AC-08 |
| `src/app/admin/stats.tsx` | 라우트. `NotBuiltYet`에서 `AdminStatsScreen`으로 바뀐다 | AC-06 |
| `src/shared/ui/TrendChart.tsx`·`RowBars.tsx`·`RatioBand.tsx` | **이미 섰다** — [`ui-kit`](../../2-design/spec/ui-kit.md)이 세웠고 입력 타입도 그 파일이 든다. 이 task는 값을 먹이고, `RatioBand` 범례 글자에 몫마다 `-legend-<key>` testID를 더한다 | AC-05 |
| `src/shared/ui/ListRow.tsx` | 값 톤에 `zero`(`fg.neutral-subtle`)가 붙는다 — 시간이 0인 포지션 줄이 그 색이다 | AC-07 |
| `src/features/stats/model/__tests__/`·`src/features/stats/api/__tests__/` | 집계 넷과 질의의 unit | AC-01~AC-03·AC-09 |
| `src/screens/admin-stats/model/__tests__/`·`src/entities/attendance/model/__tests__/attendance-summary.test.ts` | 화면 모델과 tally의 unit | AC-03·AC-09 |
| `src/entities/attendance/api/__tests__/get-month-attendance.integration.test.ts`·`src/entities/schedule/api/__tests__/get-first-schedule-month.integration.test.ts` | 달 키 둘의 integration | AC-04 |
| `tests/integration/postgres.ts` | 시드 헬퍼 `seedJointSlot`·`seedExcuse` | AC-04 |
| `tests/e2e/admin-stats.yaml` | 근무 탭 → 시트 → 근태 탭 → 달 이동 → 빈 상태 한 여정 | AC-06~AC-09 |
| `scripts/e2e-seed-server.mts` | 시드 상태 `stats_admin_overview` — 관리자 하나와 근무자 넷, 지난 세 달 | AC-06~AC-09 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`attendance-data`](attendance-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-09를 배정한다. **AC-01·AC-02·AC-03은 unit, AC-04는 integration, AC-06~AC-09는 e2e다**
2. `unit-test-writer`가 집계부터 쓴다. **합이 맞는지가 먼저다** — 사람별 합 = 포지션 합 = 전체, 겸임이 한 번만, 교육이 들고, 리허설이 안 든다
3. `integration-test-writer`가 달 키를 쓴다. 한 달치가 한 질의로 오고 관리자가 전원 행을 받는 것이다
4. `e2e-test-writer`가 탭 둘과 시트와 빈 상태를 쓴다
5. `implementer`가 순수 함수 → dal → 조각 → 화면 순으로 초록을 만든다
6. `pr-diff`가 diff를 본다 — `.tsx`에 계산이 든 자리가 없는지, 상태 계산이 두 벌 생기지 않았는지

## 착수 판정

`test-planner`가 막힌 자리 다섯을 올렸다. 정본이 여기서 닫는다.

**포지션 아홉의 정본을 `src/entities/schedule/model/schedule.type.ts`로 올린다.** 지금 `POSITION_ORDER`가 `screens/schedule-worker/model/day-sheet.ts`와 `screens/schedule-admin/model/position-rows.ts`에 같은 값으로 두 벌 있고, lint 규칙 3이 슬라이스 사이를 막아 이 task가 셋째 사본을 세울 자리였다. 포지션 목록은 화면 것이 아니라 업무 상수다([schedule/README.md](../../2-design/modules/schedule/README.md)의 용어 표가 정본이다) — 이 task가 올리고 기존 둘이 그것을 부른다. `kst-date.ts`가 앞서 밟은 길이다.

**확정 여부를 안 본다 — 배정이 있으면 센다.** [stats.md](../../2-design/system/screens/stats.md)의 상태표가 「확정된 근무표가 없다」로, [spec](../../2-design/spec/stats-admin.md)의 상태 격자가 「근무가 없으면」으로 갈려 있었다. **spec 쪽이다.** 관리자가 이번 달 배정을 짜면서 사람별 시간 균형을 보는 것이 이 화면의 실제 쓰임인데, 확정을 기다리면 가장 쓸모 있는 순간에 빈 화면이 된다. 급여도 확정을 안 기다린다([PAY-020](../../2-design/modules/payroll/README.md#pay-020)). `work-totals.ts`도 `trend.ts`도 `confirmed_at`을 입력으로 안 받는다.

**뒤로 가는 바닥은 새 dal이 낸다** — `src/entities/schedule/api/get-first-schedule-month.ts`, 키 `['schedule', 'first-month']`. `schedules`의 가장 이른 `month` 한 줄이다. 급여가 승인일로 대신한 것은([payroll.md](../../2-design/modules/payroll/screens/payroll.md) 「첫 달 앞」) 그 화면의 바닥이 사람마다 달라서고, 여기 바닥은 홀 하나라 질의 한 번이면 된다.

**근태 월 집계의 입력을 만드는 자리는 `src/features/stats/model/attendance-inputs.ts`다.** 그달 배정·날 시각과 `checkIns`·`excuseStatuses`를 `(day_id, profile_id)`로 맞물려 `AttendanceStatusInput[]`을 낸다. 세는 것은 이미 있는 `tallyMonthlyAttendance`고 **다시 짜지 않는다**.

**AC-07의 방어선은 RLS가 아니라 라우트 가드다.** spec이 「남의 근무·근태는 RLS가 좁힌다」고 적었지만 실제 읽기는 홀 전체 공개다([attendance-data](attendance-data.md)의 그 판정과 [SCH-019](../../2-design/modules/schedule/README.md#sch-019)) — 근무자 세션으로도 같은 행이 온다. spec 문구를 고치고 검증은 `admin/_layout.tsx` 가드를 이미 보는 [`tests/e2e/admin.yaml`](../../../tests/e2e/admin.yaml)에 맡긴다. 이 task는 그 층에 아무것도 안 더한다.

## 리스크·전환·되돌리기

- **합이 어긋나는 것이 이 task의 핵심 위험이다.** 사람별 구획과 포지션 구획이 한 화면에 같이 서서 둘의 합이 다르면 그 자리에서 들킨다. 겸임을 양쪽에 얹거나 교육을 빠뜨리면 바로 어긋난다 — unit이 합 셋을 나란히 단언한다
- **상태 계산이 두 벌 생길 수 있다.** 근태 탭이 급해서 여기서 다시 세면 명단·대시보드와 다른 숫자를 말하게 된다. [`attendance-data` AC-06](attendance-data.md#ac-06)의 함수를 부르는 것이 유일한 길이고 `pr-diff`가 그것을 본다
- **열두 달이 질의 열둘·스물넷이다.** 근무 탭이 열둘, 근태 탭이 스물넷이다. 서른 명 규모에서 한 달 배정이 육백 행쯤이라 감당하는 크기지만 첫 진입은 느릴 수 있다 — 캐시가 30초고 IndexedDB에 영속하니 두 번째부터는 대부분 안 읽는다. **느리면 그때 재고 월 요약을 서버로 내린다.** 지금 내리면 급여와 근태 계산이 SQL에 한 벌 더 생긴다
- **리허설이 통계에 없다는 것을 관리자가 알 길이 없다.** 급여가 기대는 시간과 다를 수 있는데 화면이 설명하지 않는다([stats.md](../../2-design/system/screens/stats.md#규칙과-부딪힌-자리)). 물음이 생기면 그때 한 줄을 세운다
- **차트 조각 셋이 공용이다.** 여기서 모양이 틀어지면 대시보드와 근무자 통계가 같이 틀어진다. 조각은 `shared/ui`에 두고 이 화면 전용 값을 안 박는다
- 되돌리기는 라우트와 화면을 빼는 것이다. 순수 함수와 조각과 달 키는 남아도 해가 없다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 사람별 합과 포지션 합이 다르다 | unit `src/features/stats/model/__tests__/work-totals.test.ts` | `pnpm test` | 셋이 같다 |
| AC-01 | 겸임이 두 번 센다 | unit 위 | `pnpm test` | 앞 포지션으로 한 번 |
| AC-01 | 교육 배정이 빠진다 | unit 위 | `pnpm test` | 그 포지션의 교육으로 든다 |
| AC-01 | 리허설이 섞인다 | unit 위 | `pnpm test` | 배정만 센다 |
| AC-01 | 0시간 포지션이 사라진다 | unit 위 | `pnpm test` | 아홉이 다 온다 |
| AC-02 | 시트 합계가 줄 값과 다르다 | unit `src/features/stats/model/__tests__/person-days.test.ts` | `pnpm test` | 회수와 시간이 구획 줄과 같다 |
| AC-03 | 값 없는 달을 0으로 잇는다 | unit `src/features/stats/model/__tests__/trend.test.ts` | `pnpm test` | `null`이라 선이 끊긴다 |
| AC-03 | 지난달을 골랐는데 구간이 안 밀린다 | unit 위 | `pnpm test` | 보는 달이 오른쪽 끝 |
| AC-04 | 달 경계 밖이 섞인다 | integration `src/entities/attendance/api/__tests__/get-month-attendance.integration.test.ts` | `pnpm test:integration:run` | 전달 마지막 날과 다음 달 첫날이 안 온다. **세션별 차이는 안 본다** — 근무·근태 읽기는 홀 전체 공개다(위 「착수 판정」) |
| AC-04 | 뒤로 가는 바닥을 못 낸다 | integration `src/entities/schedule/api/__tests__/get-first-schedule-month.integration.test.ts` | `pnpm test:integration:run` | 달이 여럿이면 가장 이른 것 |
| AC-04 | 한 달을 날마다 읽는다 | integration 위 | 위와 같다 | 한 질의로 그달치 |
| AC-05 | 0인데 1px 선이 남는다 | unit `row-bar` 계산(예정) | `pnpm test` | 폭이 0이면 안 그린다 |
| AC-06 | 탭을 옮기면 달이 돌아간다 | e2e `tests/e2e/admin-stats.yaml` | `pnpm e2e` | 보는 달 그대로 |
| AC-06 | 근무자가 들어간다 | e2e 위 | `pnpm e2e` | 관리자만 |
| AC-07 | 포지션 줄이 눌린다 | e2e 위 | `pnpm e2e` | 안 눌리고 화살표가 없다 |
| AC-08 | 시트가 안 열린다 | e2e 위 | `pnpm e2e` | 사람별 줄을 누르면 올라온다 |
| AC-09 | 빈 달에 그래프가 사라진다 | e2e 위 | `pnpm e2e` | 그래프는 서고 목록만 빈 상태 |
| AC-09 | 근태 셈이 명단과 다르다 | e2e 위 | `pnpm e2e` | 같은 함수의 값 |

- 배정하지 않은 것: 차트 조각의 눈으로 보는 확인 — 시안 `stats.sian.html`과 나란히 본다
- 막힌 것: e2e는 기기·시뮬레이터 빌드가 없어 미실행이다

## 범위 밖

- 근무자 통계 `/stats` — [`stats-worker`](stats-worker.md). **차트 조각 셋과 집계 함수를 가져다 쓴다**
- 대시보드의 미니 달력과 띠 — [`dashboard`](../../backlog.md). 조각을 여기서 만들지 않는다
- 관리자 홈의 「통계」 줄 — [`schedule-admin`](schedule-admin.md)이 줄과 경로를 이미 세웠다
- 금액 — 관리자 통계에 없다([stats.md](../../2-design/system/screens/stats.md#안-담은-것))
- 내보내기·증감률·사람별 추이 — 정본이 안 담기로 한 것들이다
