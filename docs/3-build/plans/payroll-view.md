---
sources:
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

지금 코드에는 `/payroll`이 없다. 탭 바는 [`schedule-worker`](schedule-worker.md)가 세웠다.

## 완료 조건

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
| `src/screens/payroll/model/*.ts`·`__tests__/` | 기간 자르기·누적 셈·목록 줄 만들기·연 접기 | AC-01~AC-05 |
| `src/screens/payroll/ui/*.tsx` · `src/app/payroll/page.tsx` | 세그먼트·기간 줄·금액·누적·목록 | AC-01~AC-05·AC-07 |
| `src/features/payroll/*.ts`·`__tests__/` | 여러 달 키 읽어 더하기 | AC-06 |
| `src/shared/ui/segmented.tsx` | 주·월·연 세그먼트 | AC-01 |
| `tests/e2e/payroll.spec.ts` | e2e | 검증 표 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `pr-diff`. [`payroll-data`](payroll-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-07을 배정한다. **integration이 없다** — 계산과 함수는 앞 task가 이미 봤다
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
| AC-01 | 달을 걸친 주가 한 달에 통째로 든다 | unit `src/screens/payroll/model/__tests__/`(예정) | `pnpm test` | 주 보기는 이레가 한 덩이, 월 보기는 8월 31일만 8월 |
| AC-02 | 근무가 없는데 `0원`이 뜬다 | unit 위 | `pnpm test` | `–`가 뜬다 |
| AC-02 | 지각 0회 줄이 선다 | unit 위 | `pnpm test` | 그 줄이 없다 |
| AC-02 | 누적이 기간을 안 따라간다 | unit 위 | `pnpm test` | 주로 바꾸면 누적도 그 주 |
| AC-03 | 결근한 날이 목록에서 사라진다 | unit 위 | `pnpm test` | 줄이 서고 금액이 `–`, 보조 정보가 「결근」 |
| AC-03 | 리허설만 있는 날이 빠진다 | unit 위 | `pnpm test` | 줄이 서고 금액이 난다 |
| AC-03 | 연장이 붙은 날에 근거가 없다 | unit 위 | `pnpm test` | 보조 정보에 「연장 1시간」 |
| AC-04 | 연에 합계 줄이 없거나 눌린다 | unit 위 | `pnpm test` | 맨 아래 한 줄, 안 눌림. 주·월에는 없음 |
| AC-05 | 첫 달 앞으로 계속 간다 | e2e `tests/e2e/payroll.spec.ts`(예정) | `pnpm e2e` | 화살표가 사라진다 |
| AC-05 | 퇴사자에게 탭 바가 선다 | e2e 위 | 위와 같다 | 탭 바가 없고 뒤로가 `/left` |
| AC-06 | 읽는 중에 `–`가 뜬다 | e2e 위 | 위와 같다 | 스켈레톤이고 `–`가 아니다 |
| AC-07 | 시안과 어긋난다 | 수동 — `sian-auditor` | — | 문안·토큰·상태가 문서와 같다 |

- 배정하지 않은 것: 「연」을 처음 열 때의 체감 속도 — 질의 열둘이라 실기기에서 손으로 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 표·함수·계산 — [`payroll-data`](payroll-data.md)
- 시급 화면 — [`payroll-wages`](../../backlog.md)
- 대시보드의 「이번 주 예상 급여」 줄 — [`dashboard`](../../backlog.md)가 이 화면으로 들어오는 문을 낸다
- 통계 — 관리자 쪽이다
- `/left` 화면 — [`login-screens`](login-screens.md)
- 알림 — 급여에 알림이 없다
