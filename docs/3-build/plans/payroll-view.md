---
sources:
  - ../../2-design/spec/payroll-view.md
  - ../../2-design/modules/payroll/screens/payroll.md#급여-조회
  - ../../2-design/modules/payroll/screens/payroll.md#급여-조회-짜임
  - ../../2-design/modules/payroll/screens/payroll.md#기간-세그먼트
  - ../../2-design/modules/payroll/screens/payroll.md#기간-줄
  - ../../2-design/modules/payroll/screens/payroll.md#금액
  - ../../2-design/modules/payroll/screens/payroll.md#누적
  - ../../2-design/modules/payroll/screens/payroll.md#내역-목록
  - ../../2-design/modules/payroll/screens/payroll.md#빈-상태
  - ../../2-design/modules/payroll/screens/payroll.md#첫-달-앞
  - ../../2-design/modules/payroll/screens/payroll.md#퇴사한-뒤
  - ../../2-design/modules/payroll/screens/payroll.md#급여-조회-색
  - ../../2-design/modules/payroll/screens/payroll.md#급여-조회-글자
  - ../../2-design/modules/payroll/screens/payroll.md#급여-조회-여백과-모양
  - ../../2-design/modules/payroll/screens/payroll.md#급여-조회-문안
  - ../../2-design/modules/payroll/screens/payroll.md#급여-조회-모션
  - ../../2-design/modules/payroll/README.md#pay-005
  - ../../2-design/modules/payroll/README.md#pay-017
  - ../../2-design/modules/payroll/README.md#pay-020
  - ../../2-design/modules/payroll/README.md#pay-021
  - ../../2-design/modules/payroll/README.md#pay-022
  - ../../2-design/modules/payroll/README.md#pay-025
  - ../../2-design/modules/payroll/README.md#pay-028
  - ../../2-design/modules/attendance/README.md#att-023
  - ../../2-design/modules/attendance/README.md#att-024
  - ../../2-design/modules/account/README.md#acc-011
  - ../../2-design/modules/payroll/design.md#행위-밖의-실행-동작
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/runtime.md#로딩
  - ../../2-design/design-system/writing.md#숫자와-단위
---

# 근무자 급여 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [payroll.md](../../2-design/modules/payroll/screens/payroll.md) 전체다. 업무 규칙은 [PAY-005](../../2-design/modules/payroll/README.md#pay-005)·[PAY-017](../../2-design/modules/payroll/README.md#pay-017)·[PAY-020](../../2-design/modules/payroll/README.md#pay-020)~[PAY-022](../../2-design/modules/payroll/README.md#pay-022)·[PAY-025](../../2-design/modules/payroll/README.md#pay-025)·[PAY-028](../../2-design/modules/payroll/README.md#pay-028)이고, 근태 쪽은 [ATT-023](../../2-design/modules/attendance/README.md#att-023)·[ATT-024](../../2-design/modules/attendance/README.md#att-024), 퇴사자 진입은 [ACC-011](../../2-design/modules/account/README.md#acc-011)이다.

화면 하나(`/payroll`)가 이 task의 산출이다. **계산은 [`payroll-data`](payroll-data.md#ac-06)의 순수 함수가 이미 한다** — 여기는 그 결과를 기간으로 잘라 그린다.

선행은 [`payroll-data`](payroll-data.md)다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **다음 화면이 없다.** 줄을 눌러도 갈 곳이 없고 화살표도 누름 배경도 없다. 예외가 하나 — 「연」의 달 줄이다. 그것이 이 화면에서 화살표를 안 눌러 멀리 가는 유일한 길이다
- **세 키를 읽어 한 함수에 넣는다.** `['payroll']`·`['schedule']`·`['rehearsal']`이다([행위 밖의 실행 동작](../../2-design/modules/payroll/design.md#행위-밖의-실행-동작)). 세 키가 다 와야 금액이 선다
- **금액이 없을 때가 `0원`이 아니라 `–`다.** 근무가 없어 계산이 시작도 안 된 자리다. 읽는 중과도 갈려야 한다
- **누적 두 줄이 지금 보는 기간을 따라 움직인다.** [ATT-023](../../2-design/modules/attendance/README.md#att-023)이 근태를 달로 센다고 정했지만 화면이 한 기간을 말하는 중에 두 줄만 다른 기간을 말할 수 없다. 달로 센 값이 필요한 자리는 「월」이고 그것이 첫 화면이다

탭 바는 [`ui-kit`](../../backlog.md)이 세운 `src/shared/ui/TabBar.tsx`고 이 화면은 그 「급여」 칸에 붙는다.

## 구현 산출물

> 관찰 가능한 완료 조건은 [spec](../../2-design/spec/payroll-view.md)이 든다. 여기 있는 것은 그 조건을 세우는 파일·함수·계산이고, 아래 번호를 「변경 파일」과 「검증 방법」 표가 가리킨다.

### AC-01

**기간과 세그먼트.**

- 주·월·연 셋이고 **처음 열면 「월」이다**([PAY-025](../../2-design/modules/payroll/README.md#pay-025))
- 세그먼트가 금액 **위**에 선다 — 어느 단위로 보는지가 금액을 읽는 전제다
- 기간 줄이 세그먼트와 따로다. 세그먼트는 단위를 고르고 기간 줄은 그 단위 안에서 앞뒤로 움직인다
- **주는 월요일~일요일이고**([PAY-021](../../2-design/modules/payroll/README.md#pay-021)) **월은 달력 달이다**([PAY-022](../../2-design/modules/payroll/README.md#pay-022))
- **달을 걸친 주는 날마다 갈린다.** 8월 31일이 월요일이면 8월 31일 하루만 8월에 들고 9월 1일부터의 엿새는 9월이다. 주 보기에서는 그 이레가 한 덩이다 — **기간을 자르는 축이 단위마다 다르다**

### AC-02

**금액과 누적.**

- 금액이 화면에서 가장 큰 글자다. 세 자리마다 쉼표와 「원」이다([writing.md](../../2-design/design-system/writing.md#숫자와-단위))
- **계산할 것이 아예 없으면 `–`다.** `0원`이 아니다
- 바로 아래에 예상치라는 것을 적는다. **금액을 자르거나 뭉개지 않는다**
- 누적은 두 줄 — 근무(회수와 시간 합), 지각(회수)이다
- **지각이 0회면 그 줄이 없다**
- **결근과 출근 인정은 여기 안 센다.** 결근한 날은 급여에서 빠져 목록에 사실로 서 있고, 출근 인정은 배정된 시간대로 세어 근무 회수에 이미 들어 있다
- 누적도 지금 보는 기간의 합이다

### AC-03

**내역 목록.**

- 날짜마다 한 줄이고 최근이 위다. 제목은 날짜와 요일, 보조 정보는 포지션과 근무 시각, 오른쪽은 그날 금액이다
- **연장이 붙은 날은 보조 정보에 「연장 1시간」이 따라붙는다** — 시급 곱하기 시간이 안 맞는 날이라 근무자가 검산하다 막히는 자리다([PAY-005](../../2-design/modules/payroll/README.md#pay-005))
- **교육 배정도 같은 줄로 선다.** 포지션 뒤에 「교육」이 붙고 금액이 똑같이 난다
- **결근한 날도 목록에 선다.** 금액이 `–`고 보조 정보가 「결근」이다. 지우면 근무자가 금액이 왜 적은지 못 찾는다
- **배정 없이 리허설만 있는 날도 선다**([PAY-028](../../2-design/modules/payroll/README.md#pay-028)). 그날 금액이 리허설 시간만큼 난다 — 계산이 세 키의 날짜 합집합을 훑어서다
- **줄을 눌러도 다음 화면이 없다.** 화살표도 누름 배경도 없다

### AC-04

**「연」 단위.**

- 목록이 달마다 한 줄로 접힌다. 날마다 늘어놓으면 삼백 줄이다
- **달 줄은 눌린다.** 누르면 단위가 「월」로 바뀌고 그달로 간다
- **맨 아래에 합계 줄이 선다.** 값은 위 금액과 같고 **안 눌린다**. 주·월에는 안 붙는다 — 거기는 목록이 짧아 끝까지 가도 위가 아직 화면에 있다

### AC-05

**경계 상태 셋.**

- **빈 상태** — 금액 자리는 `–`로 그대로 서고 그 아래 목록 자리에만 빈 상태가 온다. 금액을 통째로 지우지 않는 것은 근무가 없어 `–`인 것과 아직 안 불러온 것이 갈려야 해서다
- **첫 달 앞** — 뒤로 가는 화살표가 첫 근무가 있는 달에서 사라진다. 빈 달을 무한히 거슬러 가면 앱이 고장 난 것처럼 읽힌다
- **퇴사한 뒤** — 탭 바가 없다. 앱바 뒤로가 `/left`다. 앞으로 가는 화살표가 퇴사한 달에서 사라진다([ACC-011](../../2-design/modules/account/README.md#acc-011))

### AC-06

**읽기.**

- 세 키를 읽는다 — `['payroll', 'YYYY-MM']`·`['schedule', 'YYYY-MM']`·`['rehearsal', 'YYYY-MM']`
- **기간이 달을 걸치면 키를 둘 읽어 합친다.** 주 보기가 8월 31일~9월 6일이면 8월치와 9월치를 둘 다 읽는다. 「연」은 열두 달이라 **열두 키를 한꺼번에 읽지 않고 달마다 읽어 더한다**([행위 밖의 실행 동작](../../2-design/modules/payroll/design.md#행위-밖의-실행-동작))
- 읽는 중과 못 읽음은 [runtime.md](../../2-design/system/runtime.md#로딩)의 공통 규칙이다. **금액 자리가 읽는 중에 `–`가 되면 안 된다**
- 쓰기가 없다. 이 화면은 읽기만이다

### AC-07

**색·글자·여백·모션.** [급여 조회 색](../../2-design/modules/payroll/screens/payroll.md#급여-조회-색)·[급여 조회 글자](../../2-design/modules/payroll/screens/payroll.md#급여-조회-글자)·[급여 조회 여백과 모양](../../2-design/modules/payroll/screens/payroll.md#급여-조회-여백과-모양)·[급여 조회 문안](../../2-design/modules/payroll/screens/payroll.md#급여-조회-문안)·[급여 조회 모션](../../2-design/modules/payroll/screens/payroll.md#급여-조회-모션) 표 그대로다.

시안 `payroll.sian.html`을 옆에 열고 맞춘다. **시안과 문서가 어긋나면 문서가 이긴다.**

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/screens/payroll/model/period.policy.ts` | 기간을 단위와 날짜로 들고 라벨·앞뒤 이동·읽을 달 키를 낸다 | AC-01·AC-06 |
| `src/screens/payroll/utils/summary.utils.ts` | 금액 한 줄과 누적 두 줄. 셀 것이 없는 기간이 `–`고 합이 0인 기간이 `0원`이다. 금액을 글자로 옮기는 손은 뒤에 `src/shared/lib/spell-number.ts`로 올라갔다 | AC-02 |
| `src/screens/payroll/model/history-rows.ts` | 내역 줄의 제목·보조 정보·금액. 연장·교육·결근·시급 미정 문구가 여기 있다 | AC-03 |
| `src/screens/payroll/model/year-rows.ts` | 날을 달로 접고 맨 아래에 안 눌리는 합계 줄을 붙인다 | AC-04 |
| `src/screens/payroll/model/boundary.policy.ts` | 기간 화살표가 서는지 — 바닥은 승인된 달, 천장은 오늘이고 퇴사자는 퇴사한 달이다 | AC-05 |
| `src/screens/payroll/model/__tests__/` | 위 다섯의 unit | AC-01~AC-05 |
| `src/screens/payroll/ui/PayrollScreen.tsx` | 세그먼트·기간 줄·금액·예상치 안내·누적·내역 목록을 배치한다 | AC-01~AC-05·AC-07 |
| `src/app/(tabs)/payroll.tsx` | `NotBuiltYet`을 걷고 `/payroll`에 화면을 붙인다 | AC-01 |
| `src/app/(tabs)/_layout.tsx` | 퇴사한 사람에게 탭 바를 안 그린다 — 판정이 화면이 아니라 탭 껍데기에 있다 | AC-05 |
| `src/features/payroll/model/usePayrollMonths.ts`·`__tests__/usePayrollMonths.test.ts` | 급여 달치를 여러 달 읽어 합친다 | AC-06 |
| `src/features/schedule/model/useScheduleMonths.ts`·`__tests__/useScheduleMonths.test.ts` | 배정·날도 같은 수의 달을 읽어야 한다 — 기존 훅이 달 하나짜리다 | AC-06 |
| `src/features/rehearsal/model/useRehearsalMonths.ts`·`__tests__/useRehearsalMonths.test.ts` | 리허설도 같다 | AC-06 |
| `src/shared/ui/Segment.tsx` | 주·월·연 세그먼트 — 이미 있고 고른 면이 미끄러지는 모션만 는다. `schedule-worker`가 같이 쓰니 그 화면도 회귀로 본다 | AC-01 |
| `src/features/payroll/model/payroll-days.ts`·`__tests__/payroll-days.test.ts` | 시급 없는 날을 버리지 말고 `'wage-pending'`으로 낸다 — [payroll-data AC-06](payroll-data.md#ac-06)의 계약을 넓힌다. `payrollViewDays`가 세 키의 행을 접어 화면이 물을 사실까지 같이 낸다 | AC-04 |
| `src/features/payroll/model/day-amount.ts` | `REGULAR_MINUTES`를 내보내 내역 줄이 연장 초과분을 적는다 | AC-03 |
| `src/entities/schedule/api/get-month-schedule.ts` | 근태 판정이 읽는 인증의 신고·접수 시각을 같이 싣는다 | AC-02 |
| `tests/e2e/payroll.yaml` | 주·월·연 한 바퀴, 연에서 달로 들어가기, 퇴사자 진입 | 검증 표 |
| `scripts/e2e-seed-server.mts`·`tests/integration/postgres.ts` | 지난 달 근무표를 SQL로 꽂고 승인과 첫 시급 행을 근무보다 앞 달로 물린다 | 검증 표 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `pr-diff`. [`payroll-data`](payroll-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-07을 배정한다. **integration이 없다** — 계산과 함수는 앞 task가 이미 봤다. 예외가 하나다: `payroll-days`가 시급 없는 날을 버리던 계약을 넓히고 그 봉인된 단언 하나를 같이 고친다(총괄이 승인했다)
2. `unit-test-writer`가 AC-01의 기간 자르기를 먼저 쓴다. 달을 걸친 주가 이 화면의 가장 어려운 자리다
3. `implementer`가 기간 → 금액·누적 → 목록 → 연 → 경계 셋 순으로 초록을 만든다
4. `e2e-test-writer`가 주·월·연을 오가며 금액이 따라 움직이는 한 바퀴와 퇴사자 진입을 쓴다
5. `pr-diff`가 diff를 본다 — 계산이 이 화면에서 다시 짜이지 않았는지, 줄에 화살표가 붙지 않았는지, 시급이 화면에 뜨지 않는지([PAY-017](../../2-design/modules/payroll/README.md#pay-017))
6. `sian-auditor`가 문서와 시안과 구현을 대조한다

## 리스크·전환·되돌리기

- **「연」이 열두 달 키를 읽는다.** 한 달이 배정 백 행쯤이면 열둘은 천 행이고 질의가 열둘이다. 지금 규모에서는 견디지만 이 화면에서 가장 무거운 자리라 **첫 열기 전에는 읽는 중이 길다** — 「월」이 첫 화면인 것이 그 완충이다
- **금액이 계산이라 매번 다시 난다.** 지난주 근무를 관리자가 고치면 근무자가 이미 본 숫자가 달라진다([PAY-020](../../2-design/modules/payroll/README.md#pay-020)). 그것이 규칙이고 화면이 「예상치」를 금액 바로 아래에 적어 그 사실을 미리 말한다
- **읽는 중과 빈 상태가 둘 다 `–`를 쓸 위험이 있다.** [AC-05](#ac-05)와 [AC-06](#ac-06)이 같은 자리를 양쪽에서 못 박았다 — 읽는 중에는 금액 자리가 스켈레톤이고 `–`가 아니다
- **퇴사자가 탭 바 없이 들어온다.** 레이아웃이 탭 바를 전제하면 이 진입에서 깨진다. 같은 화면이 두 껍데기에 들어가는 저장소 안의 첫 자리다
- 되돌리기는 화면을 안 붙이는 것이다. 데이터는 앞 task의 것이라 안 건드린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 달을 걸친 주가 한 달에 통째로 든다 | unit `src/screens/payroll/model/__tests__/period.test.ts` | `pnpm test` | 주 보기는 이레가 한 덩이, 월 보기는 8월 31일만 8월 |
| AC-02 | 근무가 없는데 `0원`이 뜬다 | unit `src/screens/payroll/model/__tests__/summary.test.ts` | `pnpm test` | `–`가 뜬다 |
| AC-02 | 지각 0회 줄이 선다 | unit 위 | `pnpm test` | 그 줄이 없다 |
| AC-02 | 누적이 기간을 안 따라간다 | unit 위 | `pnpm test` | 주로 바꾸면 누적도 그 주 |
| AC-03 | 결근한 날이 목록에서 사라진다 | unit `src/screens/payroll/model/__tests__/history-rows.test.ts` | `pnpm test` | 줄이 서고 금액이 `–`, 보조 정보가 「결근」 |
| AC-03 | 리허설만 있는 날이 빠진다 | unit 위 | `pnpm test` | 줄이 서고 금액이 난다 |
| AC-03 | 연장이 붙은 날에 근거가 없다 | unit 위 | `pnpm test` | 보조 정보에 「연장 1시간」 |
| AC-04 | 연에 합계 줄이 없거나 눌린다 | unit `src/screens/payroll/model/__tests__/year-rows.test.ts` | `pnpm test` | 맨 아래 한 줄, 안 눌림. 주·월에는 없음 |
| AC-05 | 첫 달 앞으로 계속 간다 | e2e `tests/e2e/payroll.yaml` | `pnpm e2e` | 화살표가 사라진다 |
| AC-05 | 퇴사자에게 탭 바가 선다 | e2e 위 | 위와 같다 | 탭 바가 없고 뒤로가 `/left` |
| AC-06 | 읽는 중에 `–`가 뜬다 | e2e 위 | 위와 같다 | 스켈레톤이고 `–`가 아니다 |
| AC-07 | 시안과 어긋난다 | 수동 — `sian-auditor` | — | 문안·토큰·상태가 문서와 같다 |

- 배정하지 않은 것: 「연」을 처음 열 때의 체감 속도 — 질의 열둘이라 실기기에서 손으로 본다
- 배정하지 않은 것: 읽기 실패의 자동 확인 — 급여 읽기를 강제로 실패시키는 문이 없다(`/retry` 게이트의 것은 프로필 전용이다). 그 문을 새로 내는 것은 이 task 밖이라 손으로 본다
- 막힌 것: e2e는 기기·시뮬레이터 빌드가 없어 미실행이다

## 범위 밖

- 표·함수·계산 — [`payroll-data`](payroll-data.md)
- 시급 화면 — [`payroll-wages`](../../backlog.md)
- 대시보드의 「이번 주 예상 급여」 줄 — [`dashboard`](../../backlog.md)가 이 화면으로 들어오는 문을 낸다
- 통계 — 관리자 쪽이다
- `/left` 화면 — [`login-screens`](login-screens.md)
- 알림 — 급여에 알림이 없다
