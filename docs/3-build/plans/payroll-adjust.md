---
sources:
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

## 완료 조건

### AC-01

**임시공휴일 줄.**

- 날 상세 짜임의 3번이다. **스위치 하나**고([components.md](../../2-design/design-system/components.md#스위치)) 라벨 아래에 무엇에 쓰이는지 한 줄이 붙는다
- 켜면 `set_holiday(p_date, true)`, 끄면 `false`다
- **받아온 공휴일인 날은 켜진 채 잠긴다.** 아래 줄 문구가 「원래 공휴일이에요」로 바뀐다 — 이미 공휴일이라 손댈 것이 없다
- **확정 뒤에도 켜고 끌 수 있다** — 임시공휴일 지정이 근무표 확정을 안 기다린다([PAY-027](../../2-design/modules/payroll/README.md#pay-027))
- 근무를 여는 날에만 선다. 날 상세가 곧 열린 날이라 이 조건은 화면 위치가 이미 만족한다

### AC-02

**근무 조정 줄.**

- 날 상세 짜임의 4번이다. 라벨 오른쪽에 「2명 조정됨」이 서고 **조정한 사람이 없으면 오른쪽이 빈다** — 「0명 조정됨」이 아니다
- 누르면 [근무 조정 시트](../../2-design/modules/schedule/screens/schedule-admin.md#근무-조정)가 열린다
- 근무 시간 줄이 그날 전원에게 같이 걸리는 하나의 값이라면 이 줄은 그 값에서 사람마다 어긋난 자리를 담는다

### AC-03

**근무 조정 시트.**

- 제목 아래에 그날 근무 시각과 시간이 선다. **그날 배정된 사람이 한 줄씩**이다
- **줄마다 그날 최종 시간이 선다** — 배정 시간 + 조정 + 리허설이다([PAY-028](../../2-design/modules/payroll/README.md#pay-028)). 관리자가 고치기 전에 지금 얼마로 세고 있는지를 먼저 본다
- 조정이 든 줄은 시간 앞에 「결근」이나 「연장」이 붙는다
- **리허설이 있는 사람은 이름 아래 작은 줄이다.** 건수면 「리허설 2건 · 2시간」, 시각이면 「리허설 14:00–16:00 · 2시간」이다. **안 눌린다**
  - 시각 갈래가 여기 서는 것은 배정 없는 날에 넣어둔 뒤 관리자가 나중에 그날 배정을 넣은 날이다 — 이미 선 행은 갈래를 다시 판정하지 않는다([리허설](../../2-design/modules/schedule/design.md#리허설))
- **리허설만 있고 배정이 없는 사람은 이 목록에 없다.** 이 시트는 그날 배정에서 출발한다. 관리자가 그런 리허설을 보는 자리는 [리허설 화면](../../2-design/modules/schedule/screens/rehearsal.md)이다
- 배정이 0명이면 빈 상태다([components.md](../../2-design/design-system/components.md#빈-상태)) — 왼쪽 정렬이고 그림도 버튼도 없다

### AC-04

**사람 시트.** 조정 시트 위에 한 겹 더 선다.

- 「결근이에요 · 연장이에요」 둘이고 **조정이 이미 든 사람에게만 「원래대로」가 한 줄 더 선다** — 지울 것이 없는 사람에게 지우기를 안 보여준다
- **결근은 값을 안 묻는다.** 고른 즉시 반영이고 화면이 **그날 배정 시간만큼의 음수**를 계산해 넣는다
- **연장을 고르면 분을 넣는 칸이 열리고 버튼이 「닫기 · 바꾸기」로 바뀐다.** 단위가 분이다
- 「원래대로」는 `p_minutes = 0`인 새 행이다 — 지우지 않는다([payroll-data AC-04](payroll-data.md#ac-04))
- 저장은 셋 다 `set_adjustment`다

### AC-05

**읽기와 무효화.**

- 조정 시트는 `['schedule']`(배정과 날)·`['payroll']`(조정)·`['rehearsal', 'YYYY-MM', 'all']`(그날 전원 리허설)을 읽는다. **날 상세가 이미 읽은 것에 리허설 키 하나가 는다**
- 최종 시간 셈은 [`payroll-data`](payroll-data.md#ac-06)의 순수 함수를 쓴다. **여기서 다시 짜지 않는다** — 급여 화면과 이 시트가 다른 시간을 말하면 안 된다
- `set_adjustment`·`set_holiday`가 성공하면 `['payroll']`을 무효화한다([무효화 표](../../2-design/system/runtime.md#무효화-표))

### AC-06

**색·글자·여백·문안·모션.** [날 상세 색](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-색)·[날 상세 글자](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-글자)·[날 상세 여백과 모양](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-여백과-모양)·[날 상세 문안](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-문안)·[날 상세 모션](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-모션) 표에서 **임시공휴일·근무 조정·조정 시트·사람 시트 행이 이 task의 것이다.**

시안 `schedule-admin.sian.html`을 옆에 열고 맞춘다. **시안과 문서가 어긋나면 문서가 이긴다.**

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/screens/schedule-admin/model/*.ts`·`__tests__/` | 결근 음수 계산·조정 인원 셈·리허설 줄 문구 | AC-02~AC-04 |
| `src/screens/schedule-admin/ui/day-detail.tsx` | 줄 둘을 짜임에 끼운다 | AC-01·AC-02 |
| `src/screens/schedule-admin/ui/adjust-sheet.tsx`·`person-sheet.tsx` | 시트 둘 | AC-03·AC-04·AC-06 |
| `src/features/payroll/*.ts`·`__tests__/` | `set_adjustment`·`set_holiday` mutation과 무효화 | AC-05 |
| `src/entities/rehearsal/dals/get-all-rehearsals.ts` | 날 상세가 쓰는 달 질의 | AC-05 |
| `tests/e2e/payroll-adjust.spec.ts` | e2e | 검증 표 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `pr-diff`. [`payroll-data`](payroll-data.md)와 [`schedule-admin`](schedule-admin.md)이 둘 다 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-06을 배정한다. **integration이 없다** — 함수는 앞 task가 이미 봤다
2. `unit-test-writer`가 AC-04의 결근 음수를 먼저 쓴다. 이 task의 위험이 거기 있다 — 화면이 값을 만들어 넣는 유일한 자리다
3. `implementer`가 임시공휴일 줄 → 조정 줄 → 조정 시트 → 사람 시트 순으로 초록을 만든다
4. `e2e-test-writer`가 결근을 넣었다 원래대로 돌리는 한 바퀴를 쓴다
5. `pr-diff`가 diff를 본다 — 최종 시간 셈이 여기서 다시 짜이지 않았는지, 리허설 줄에 누르는 길이 생기지 않았는지
6. `sian-auditor`가 문서와 시안과 구현을 대조한다

## 리스크·전환·되돌리기

- **결근 음수를 화면이 계산한다.** 함수가 분만 받아서다. 그날 근무 시간을 관리자가 나중에 고치면 **이미 넣은 음수가 새 배정 시간과 안 맞는다** — 9시간일 때 넣은 −540분이 8시간으로 줄어든 날에 −540분으로 남아 총 −60분이 된다. 계산이 음수 총합을 0으로 바닥 처리하지 않으면 금액이 음수가 된다. **[payroll-data AC-06](payroll-data.md#ac-06)이 그 바닥을 안 적었다** — 이 task가 그 자리를 열어 계산 쪽에 바닥을 넣거나, 근무 시간을 고칠 때 조정을 다시 계산하게 해야 한다. **둘 중 어느 쪽인지가 이 task의 첫 결정이다**
- **리허설 키 하나가 날 상세에 는다.** 관리자가 날을 열 때마다 그달 전원 리허설을 받는다. 서른 명 한 달이면 수십 행이라 작지만, 날 상세가 읽는 키가 넷이 된다
- **읽기 전용 줄이 눌릴 위험.** 리허설 줄이 조정 줄 바로 아래 붙어 있어 손가락이 스친다. 누름 배경도 화살표도 없는 것이 유일한 구분이라 히트 영역이 안 겹치게 둔다
- **날 상세가 두 영역의 값을 같이 든다.** 근무표 화면에 급여 표로 가는 쓰기가 둘 선다 — 경계를 넘는 자리라 `pr-diff`가 그 dal이 `entities/payroll`에 사는지 본다
- 되돌리기는 줄 둘을 안 붙이는 것이다. 데이터는 앞 task의 것이라 안 건드린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 받아온 공휴일인 날에 스위치가 눌린다 | unit `src/screens/schedule-admin/model/__tests__/`(예정) | `pnpm test` | 켜진 채 잠기고 문구가 바뀐다 |
| AC-02 | 조정 0명에 「0명 조정됨」이 선다 | unit 위 | `pnpm test` | 오른쪽이 빈다 |
| AC-03 | 최종 시간에 리허설이 안 든다 | unit 위 | `pnpm test` | 배정 9시간 + 리허설 2건이 11시간 |
| AC-03 | 리허설만 있는 사람이 목록에 선다 | unit 위 | `pnpm test` | 배정이 있는 사람만 선다 |
| AC-04 | 결근 음수가 배정 시간과 안 맞는다 | unit 위 | `pnpm test` | 9시간이면 −540분, 8시간이면 −480분 |
| AC-04 | 조정 없는 사람에게 「원래대로」가 뜬다 | unit 위 | `pnpm test` | 그 줄이 없다 |
| AC-04 | 연장이 시간 단위로 들어간다 | unit 위 | `pnpm test` | 칸 단위가 분이고 60이 1시간 |
| AC-03 | 리허설 줄이 눌린다 | e2e `tests/e2e/payroll-adjust.spec.ts`(예정) | `pnpm e2e` | 눌러도 아무 일이 없다 |
| AC-04 | 결근을 넣었다 못 되돌린다 | e2e 위 | 위와 같다 | 「원래대로」 뒤 최종 시간이 배정 시간으로 돌아온다 |
| AC-01 | 확정 뒤에 스위치가 잠긴다 | e2e 위 | 위와 같다 | 확정 뒤에도 켜고 꺼진다 |
| AC-06 | 시안과 어긋난다 | 수동 — `sian-auditor` | — | 문안·토큰·상태가 문서와 같다 |

- 배정하지 않은 것: 지난 달 날 상세로 들어가 조정하는 길이 살아 있는지 — 달력에서 지난 달로 넘기는 동작이라 실기기에서 손으로 본다
- 막힌 것: **결근 음수와 근무 시간 변경이 어긋나는 자리의 처리가 안 정해졌다.** 위 리스크 첫 항목이고 착수 전에 정한다

## 범위 밖

- `set_adjustment`·`set_holiday` 함수와 `adjustments`·`holidays` 표 — [`payroll-data`](payroll-data.md)
- 날 상세의 나머지 — [`schedule-admin`](schedule-admin.md)과 [`schedule-assign`](schedule-assign.md)
- 리허설을 넣고 고치는 길 — [`rehearsal`](rehearsal.md). 관리자에게는 읽기만 있다
- 공휴일 받기 — [`payroll-holidays`](payroll-holidays.md)
- 조정이 급여 금액에 드는 계산 — [`payroll-data`](payroll-data.md#ac-06)
- 알림 — 조정에 알림이 없다
