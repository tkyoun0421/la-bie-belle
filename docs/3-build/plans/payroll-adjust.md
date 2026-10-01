---
sources:
  - ../../2-design/spec/payroll-adjust.md
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-색
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-글자
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-여백과-모양
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-모션
  - ../../2-design/modules/payroll/README.md#pay-002
  - ../../2-design/modules/payroll/README.md#pay-003
  - ../../2-design/modules/payroll/README.md#pay-020
  - ../../2-design/modules/payroll/README.md#pay-027
  - ../../2-design/modules/payroll/README.md#pay-028
  - ../../2-design/modules/payroll/design.md#조정
  - ../../2-design/modules/payroll/design.md#시급과-조정
  - ../../2-design/modules/payroll/design.md#공휴일
  - ../../2-design/modules/payroll/design.md#공휴일-넣기
  - ../../2-design/modules/schedule/design.md#리허설
  - ../../2-design/modules/schedule/README.md#sch-020
  - ../../2-design/modules/schedule/README.md#sch-022
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/design-system/components.md#스위치
  - ../../2-design/design-system/components.md#빈-상태
---

# 날 상세의 급여 줄 둘을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [schedule-admin.md](../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정)의 [날 상세 짜임](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-짜임) 3·4번 항목과 [근무 조정](../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정) 절이다. 업무 규칙은 [PAY-003](../../2-design/modules/payroll/README.md#pay-003)·[PAY-027](../../2-design/modules/payroll/README.md#pay-027)·[PAY-028](../../2-design/modules/payroll/README.md#pay-028)이고, 쓰기 함수 둘(`set_adjustment`·`set_holiday`)은 [`payroll-data`](payroll-data.md#ac-04)가 이미 냈다.

날 상세의 줄 둘과 시트 둘이 이 task의 산출이다.

선행이 둘이다. [`payroll-data`](payroll-data.md)가 함수를 냈고 [`schedule-admin`](schedule-admin.md)이 날 상세 껍데기를 세웠다 — **그 plan이 이 줄 둘을 자기 범위 밖으로 밀어 여기로 보냈다.**

정본에서 확인한 넷이 plan의 방향을 정한다.

- **근무표 화면에 서지만 값이 급여 쪽 표로 간다.** 임시공휴일은 `holidays`, 조정은 `adjustments`다. 여기 둔 것은 날짜가 이미 정해진 자리라 스위치 하나면 끝나서고, 따로 화면을 세우면 일 년에 몇 번 안 가는 화면이 하나 는다
- **결근이 값이 아니라 음수다.** 「결근」이라는 열이 없다. 관리자가 결근을 고르면 **화면이 그날 배정 시간만큼의 음수를 계산해** `set_adjustment`에 넣는다([조정](../../2-design/modules/payroll/design.md#조정))
- **리허설은 읽기 전용이다.** 이름 아래 작은 줄로 서고 안 눌린다 — 조정은 관리자가 쓴 값이고 리허설은 그 사람이 쓴 값이다([SCH-020](../../2-design/modules/schedule/README.md#sch-020))
- **확정 뒤에도 열린다.** 조정도 임시공휴일도 확정을 안 기다린다([PAY-020](../../2-design/modules/payroll/README.md#pay-020)). 지난 날에도 연다 — 관리자가 달력에서 지난 달로 넘어가는 길이 살아 있어야 한다

## 구현 산출물

> 관찰 가능한 완료 조건은 [spec](../../2-design/spec/payroll-adjust.md)이 든다. 여기 있는 것은 그 조건을 세우는 파일·함수·계산이고, 아래 번호를 「변경 파일」과 「검증 방법」 표가 가리킨다.

### AC-01

**임시공휴일 줄.**

- 날 상세 짜임의 3번이다. **스위치 하나**고([components.md](../../2-design/design-system/components.md#스위치)) 라벨 아래에 무엇에 쓰이는지 한 줄이 붙는다
- 켜면 `set_holiday(p_date, true)`, 끄면 `false`다
- **받아온 공휴일인 날은 켜진 채 잠긴다.** 아래 줄 문구가 「원래 공휴일이에요」로 바뀐다 — 이미 공휴일이라 손댈 것이 없다. 판정은 그 날짜에 `source = 'api'` 행이 있는가 하나고, 같은 날짜에 `manual` 행이 같이 서 있어도 잠금이 이긴다([공휴일](../../2-design/modules/payroll/design.md#공휴일))
- **확정 뒤 잠금 게이트에 안 태운다.** 날 상세가 이미 쓰는 `canChangeStructure`는 포지션과 자리의 것이다
- **확정 뒤에도 켜고 끌 수 있다** — 임시공휴일 지정이 근무표 확정을 안 기다린다([PAY-027](../../2-design/modules/payroll/README.md#pay-027))
- 근무를 여는 날에만 선다. 날 상세가 곧 열린 날이라 이 조건은 화면 위치가 이미 만족한다

### AC-02

**근무 조정 줄.**

- 날 상세 짜임의 4번이다. 라벨 오른쪽에 「2명 조정됨」이 서고 **조정한 사람이 없으면 오른쪽이 빈다** — 「0명 조정됨」이 아니다
- 세는 것은 **마지막 조정 행의 분이 0이 아닌 사람**이다. 되돌린 사람은 손본 사람이 아니라 안 센다([근무 조정](../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정))
- 누르면 [근무 조정 시트](../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정)가 열린다
- 근무 시간 줄이 그날 전원에게 같이 걸리는 하나의 값이라면 이 줄은 그 값에서 사람마다 어긋난 자리를 담는다

### AC-03

**근무 조정 시트.**

- 제목 아래에 그날 근무 시각과 시간이 서고 그 아래 도움말 한 줄이 선다. **그날 배정된 사람이 한 줄씩**이다 — 살아 있는 배정만이고 교육 배정도 든다([PAY-007](../../2-design/modules/payroll/README.md#pay-007))
- **줄마다 그날 최종 시간이 선다** — 배정 시간 + 조정 + 리허설이다([PAY-028](../../2-design/modules/payroll/README.md#pay-028)). 관리자가 고치기 전에 지금 얼마로 세고 있는지를 먼저 본다
- **그 시간은 근태를 안 본다.** 인증이 없어 결근으로 판정된 날을 급여 계산이 0으로 덮는 층은 여기 안 그린다 — 대신 머리 아래 도움말 한 줄이 그 층을 말한다([근무 조정](../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정))
- 조정이 든 줄은 시간 앞에 「결근」이나 「연장」이 붙는다
- **리허설이 있는 사람은 이름 아래 작은 줄이다.** 건수면 「리허설 2건 · 2시간」, 시각이면 「리허설 14:00–16:00 · 2시간」이다. **안 눌린다**
  - 시각 갈래가 여기 서는 것은 배정 없는 날에 넣어둔 뒤 관리자가 나중에 그날 배정을 넣은 날이다 — 이미 선 행은 갈래를 다시 판정하지 않는다([리허설](../../2-design/modules/schedule/design.md#리허설))
- **리허설만 있고 배정이 없는 사람은 이 목록에 없다.** 이 시트는 그날 배정에서 출발한다. 관리자가 그런 리허설을 보는 자리는 [리허설 화면](../../2-design/modules/schedule/screens/rehearsal.md)이다
- 배정이 0명이면 빈 상태다([components.md](../../2-design/design-system/components.md#빈-상태)) — 왼쪽 정렬이고 그림도 버튼도 없다

### AC-04

**조정 고르기 시트.** 조정 시트 위에 한 겹 더 선다. 이름이 「사람 시트」가 아닌 것은 [사람 픽커](../../2-design/modules/schedule/screens/schedule-admin.md#사람-시트)가 그 이름을 이미 써서다.

- 「결근이에요 · 연장이에요」 둘이고 **조정 행이 하나라도 있는 사람에게만 「원래대로」가 한 줄 더 선다** — 지울 것이 없는 사람에게 지우기를 안 보여준다. 마지막 행이 0분인 사람에게도 선다(이미 되돌린 사람이다)
- **결근은 값을 안 묻는다.** 고른 즉시 반영이고 화면이 **그날 배정 시간만큼의 음수**를 계산해 넣는다
- **연장을 고르면 분을 넣는 칸이 열리고 버튼이 「닫기 · 바꾸기」로 바뀐다.** 단위가 분이다
- 「원래대로」는 `p_minutes = 0`인 새 행이다 — 지우지 않는다([payroll-data AC-04](payroll-data.md#ac-04))
- 저장은 셋 다 `set_adjustment`고 `p_reason`은 고른 갈래 이름이다 — 「결근」·「연장」·「원래대로」([조정](../../2-design/modules/payroll/design.md#조정))

### AC-05

**읽기와 무효화.**

- 조정 시트는 `['schedule']`(배정과 날)·`['payroll', 'YYYY-MM']`(조정과 공휴일)·`['rehearsal', 'YYYY-MM', 'all']`(그날 전원 리허설)을 읽는다. **날 상세가 지금 읽는 것은 `['schedule']`뿐이라 키 둘이 는다** — 앞 두 줄이 「하나가 는다」로 적혀 있던 자리다
- 최종 시간 셈은 [`payroll-data`](payroll-data.md#ac-06)의 순수 함수를 쓴다. **여기서 다시 짜지 않는다** — 급여 화면과 이 시트가 다른 시간을 말하면 안 된다
- `set_adjustment`·`set_holiday`가 성공하면 `['payroll']`을 무효화한다([무효화 표](../../2-design/system/runtime.md#무효화-표))

### AC-06

**색·글자·여백·문안·모션.** [날 상세 색](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-색)·[날 상세 글자](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-글자)·[날 상세 여백과 모양](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-여백과-모양)·[날 상세 문안](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-문안)·[날 상세 모션](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-모션) 표에서 **임시공휴일·근무 조정·조정 시트·조정 고르기 시트 행이 이 task의 것이다.**

시안 `schedule-admin.sian.html`을 옆에 열고 맞춘다. **시안과 문서가 어긋나면 문서가 이긴다.**

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/screens/schedule-admin/model/holiday-switch.ts` | 임시공휴일 스위치의 켜짐·잠김과 아래 줄 문구 | AC-01 |
| `src/screens/schedule-admin/model/adjustment-count.ts` | 「2명 조정됨」 — 마지막 조정 행의 분이 0이 아닌 사람만 센다 | AC-02 |
| `src/screens/schedule-admin/model/adjust-sheet-rows.ts` | 조정 시트의 사람 줄, 줄마다 최종 시간, 리허설 읽기 전용 줄 문구 | AC-03 |
| `src/screens/schedule-admin/model/absence-minutes.ts` | 결근을 고른 순간 넣을 음수를 낸다 — 시:분 파싱은 `dayMinutes`를 그대로 부른다 | AC-04 |
| `src/screens/schedule-admin/model/adjust-choice-state.ts` | 「원래대로」가 서는지와 연장 분 입력의 자릿수 손 | AC-04 |
| `src/screens/schedule-admin/model/adjustment-failure.ts` | 저장이 거절됐을 때 시트가 할 일 — `not_allowed`면 다시 읽는다 | AC-03·AC-04 |
| `src/screens/schedule-admin/model/__tests__/` | 위 여섯의 unit | AC-01~AC-04 |
| `src/screens/schedule-admin/ui/DayDetail.tsx` | 줄 둘을 짜임에 끼운다 | AC-01·AC-02 |
| `src/screens/schedule-admin/ui/AdjustSheet.tsx`·`AdjustChoiceSheet.tsx` | 시트 둘. 둘째 이름이 `PersonSheet`가 아닌 것은 사람 픽커가 그 이름을 이미 써서다 | AC-03·AC-04·AC-06 |
| `src/screens/schedule-admin/ui/ScheduleAdminScreen.tsx` | 날 상세에 `['payroll', 'YYYY-MM']`과 `['rehearsal', 'YYYY-MM', 'all']` 두 키를 붙여 내린다 | AC-05 |
| `src/features/payroll/model/useSetAdjustment.ts`·`useSetHoliday.ts`·`__tests__/` | mutation과 `['payroll']` 무효화 | AC-05 |
| `src/entities/payroll/api/get-payroll-month.ts`·`__tests__/get-payroll-month.integration.test.ts` | `holidays`를 그달치로 같이 싣는다 | AC-01 |
| `src/features/payroll/model/usePayrollMonths.ts`·`__tests__/usePayrollMonths.test.ts` | 합치는 덩이에 `holidays`를 더한다 — 날 상세가 `['payroll', 'YYYY-MM']`을 읽는다 | AC-01·AC-05 |
| `src/features/payroll/model/day-minutes.ts` | 조정 마지막 행 고르기를 `adjustedMinutes`로 내보내 조정 시트와 셈을 나눠 쓴다 | AC-03 |
| `src/features/schedule/model/useMonthSchedule.ts` | `refetch`를 낸다 — 배정이 사라진 거절에 목록을 다시 읽는다 | AC-05 |
| `tests/e2e/schedule-admin.yaml` | 새 절을 이어 붙인다. 새 파일이 아니다 | 검증 표 |
| `scripts/e2e-seed-server.mts`·`tests/e2e/scripts/seed-session.js`·`tests/integration/postgres.ts` | 임시공휴일과 조정이 붙은 날의 시드 | 검증 표 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `pr-diff`. [`payroll-data`](payroll-data.md)와 [`schedule-admin`](schedule-admin.md)이 둘 다 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-06을 배정한다. **함수 거절은 앞 task가 이미 봤다** — 새 integration은 `get_payroll_month`가 `holidays`를 싣는 자리 하나뿐이다
2. `unit-test-writer`가 AC-04의 결근 음수를 먼저 쓴다. 이 task의 위험이 거기 있다 — 화면이 값을 만들어 넣는 유일한 자리다
3. `implementer`가 임시공휴일 줄 → 조정 줄 → 조정 시트 → 조정 고르기 시트 순으로 초록을 만든다
4. `e2e-test-writer`가 결근을 넣었다 원래대로 돌리는 한 바퀴를 쓴다
5. `pr-diff`가 diff를 본다 — 최종 시간 셈이 여기서 다시 짜이지 않았는지, 리허설 줄에 누르는 길이 생기지 않았는지
6. `sian-auditor`가 문서와 시안과 구현을 대조한다

## 리스크·전환·되돌리기

- **결근 음수는 고른 순간의 배정 시간이다.** 함수가 분만 받아서 화면이 그날 배정 시간만큼의 음수를 넣는다. 그날 근무 시간을 관리자가 나중에 고치면 그 음수가 새 배정 시간과 안 맞는다. **판정은 계산 쪽 바닥이고, 근무 시간을 고칠 때 조정을 다시 계산하지 않는다** — 조정은 이력이 남는 사람 손이라([payroll/design.md](../../2-design/modules/payroll/design.md#조정)) 근무 시간 변경이 남의 조정 행을 말없이 고치면 그 이력이 거짓이 된다. 시간이 줄어 총합이 음수가 되는 쪽은 [`dayMinutes`](../../../src/features/payrollCompute/model/dayMinutes.ts)의 `Math.max(total, 0)`이 이미 막는다. 시간이 늘어 총합이 양수로 남는 쪽(9시간일 때 넣은 −540분이 10시간이 된 날에 60분을 남긴다)은 막지 않는다 — 배정을 늘리는 것이 관리자의 손이고, 그 손 바로 옆 조정 시트가 줄마다 최종 시간을 보여줘 「1시간」이 눈에 선다([schedule-admin.md](../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정)). 결근으로 되돌리려면 그 시트에서 「결근」을 다시 고른다 — 같은 날 두 번 조정은 새 행이고 계산은 마지막 행을 쓴다
- **리허설 키 하나가 날 상세에 는다.** 관리자가 날을 열 때마다 그달 전원 리허설을 받는다. 서른 명 한 달이면 수십 행이라 작지만, 날 상세가 읽는 키가 넷이 된다
- **읽기 전용 줄이 눌릴 위험.** 리허설 줄이 조정 줄 바로 아래 붙어 있어 손가락이 스친다. 누름 배경도 화살표도 없는 것이 유일한 구분이라 히트 영역이 안 겹치게 둔다
- **날 상세가 두 영역의 값을 같이 든다.** 근무표 화면에 급여 표로 가는 쓰기가 둘 선다 — 경계를 넘는 자리라 `pr-diff`가 그 dal이 `entities/payroll`에 사는지 본다
- 되돌리기는 줄 둘을 안 붙이는 것이다. 데이터는 앞 task의 것이라 안 건드린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 받아온 공휴일인 날에 스위치가 눌린다 | unit `src/screens/schedule-admin/model/__tests__/holiday-switch.test.ts` | `pnpm test` | 켜진 채 잠기고 문구가 바뀐다 |
| AC-01 | 그달치 `holidays`가 응답에 안 실린다 | integration `src/entities/payroll/api/__tests__/get-payroll-month.integration.test.ts` | `pnpm test:integration:run` | 그달 공휴일 행이 오고 이웃 달 행은 안 온다 |
| AC-02 | 조정 0명에 「0명 조정됨」이 선다 | unit `src/screens/schedule-admin/model/__tests__/adjustment-count.test.ts` | `pnpm test` | 오른쪽이 빈다 |
| AC-03 | 최종 시간에 리허설이 안 든다 | unit `src/screens/schedule-admin/model/__tests__/adjust-sheet-rows.test.ts` | `pnpm test` | 배정 9시간 + 리허설 2건이 11시간 |
| AC-03 | 리허설만 있는 사람이 목록에 선다 | unit 위 | `pnpm test` | 배정이 있는 사람만 선다 |
| AC-04 | 결근 음수가 배정 시간과 안 맞는다 | unit `src/screens/schedule-admin/model/__tests__/absence-minutes.test.ts` | `pnpm test` | 9시간이면 −540분, 8시간이면 −480분 |
| AC-04 | 조정 없는 사람에게 「원래대로」가 뜬다 | unit `src/screens/schedule-admin/model/__tests__/adjust-choice-state.test.ts` | `pnpm test` | 그 줄이 없다 |
| AC-04 | 연장이 시간 단위로 들어간다 | unit 위 | `pnpm test` | 칸 단위가 분이고 60이 1시간 |
| AC-03 | 리허설 줄이 눌린다 | e2e `tests/e2e/schedule-admin.yaml` | `pnpm e2e` | 눌러도 아무 일이 없다 |
| AC-04 | 결근을 넣었다 못 되돌린다 | e2e 위 | 위와 같다 | 「원래대로」 뒤 최종 시간이 배정 시간으로 돌아온다 |
| AC-01 | 확정 뒤에 스위치가 잠긴다 | e2e 위 | 위와 같다 | 확정 뒤에도 켜고 꺼진다 |
| AC-06 | 시안과 어긋난다 | 수동 — `sian-auditor` | — | 문안·토큰·상태가 문서와 같다 |

- 배정하지 않은 것: 지난 달 날 상세로 들어가 조정하는 길이 살아 있는지 — 달력에서 지난 달로 넘기는 동작이라 실기기에서 손으로 본다
- 막힌 것: e2e는 기기·시뮬레이터 빌드가 없어 미실행이다

## 범위 밖

- `set_adjustment`·`set_holiday` 함수와 `adjustments`·`holidays` 표 — [`payroll-data`](payroll-data.md)
- 날 상세의 나머지 — [`schedule-admin`](schedule-admin.md)과 [`schedule-assign`](schedule-assign.md)
- 리허설을 넣고 고치는 길 — [`rehearsal`](rehearsal.md). 관리자에게는 읽기만 있다
- 공휴일 받기 — [`payroll-holidays`](payroll-holidays.md)
- 조정이 급여 금액에 드는 계산 — [`payroll-data`](payroll-data.md#ac-06)
- 알림 — 조정에 알림이 없다
