---
sources:
  - ../../2-design/modules/payroll/screens/wages.md#시급
  - ../../2-design/modules/payroll/screens/wages.md#시급-짜임
  - ../../2-design/modules/payroll/screens/wages.md#기본-시급-줄
  - ../../2-design/modules/payroll/screens/wages.md#사람-줄
  - ../../2-design/modules/payroll/screens/wages.md#빈-상태
  - ../../2-design/modules/payroll/screens/wages.md#기본-시급-시트
  - ../../2-design/modules/payroll/screens/wages.md#사람-시트
  - ../../2-design/modules/payroll/screens/wages.md#기본으로-되돌리기
  - ../../2-design/modules/payroll/screens/wages.md#이력
  - ../../2-design/modules/payroll/screens/wages.md#시급-색
  - ../../2-design/modules/payroll/screens/wages.md#시급-글자
  - ../../2-design/modules/payroll/screens/wages.md#시급-여백과-모양
  - ../../2-design/modules/payroll/screens/wages.md#시급-문안
  - ../../2-design/modules/payroll/screens/wages.md#시급-모션
  - ../../2-design/modules/payroll/README.md#pay-008
  - ../../2-design/modules/payroll/README.md#pay-010
  - ../../2-design/modules/payroll/README.md#pay-011
  - ../../2-design/modules/payroll/README.md#pay-012
  - ../../2-design/modules/payroll/README.md#pay-013
  - ../../2-design/modules/payroll/README.md#pay-014
  - ../../2-design/modules/payroll/README.md#pay-015
  - ../../2-design/modules/payroll/README.md#pay-020
  - ../../2-design/modules/payroll/design.md#시급과-조정
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/system/runtime.md#로딩
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/design-system/writing.md#숫자와-단위
---

# 시급 화면을 만든다 — 구현 계획

> 앱 골격(`expo-scaffold`)이 선 뒤에 파일 배치와 검증 명령을 채운다. 업무 규칙과 완료 조건은 그대로 선다.

## 입력 명세·기준

정본은 [wages.md](../../2-design/modules/payroll/screens/wages.md) 전체다. 업무 규칙은 [PAY-008](../../2-design/modules/payroll/README.md#pay-008)·[PAY-010](../../2-design/modules/payroll/README.md#pay-010)~[PAY-015](../../2-design/modules/payroll/README.md#pay-015)이고, 쓰기 함수는 [`payroll-data`](payroll-data.md#ac-03)가 이미 냈다.

화면 하나(`/admin/wages`)와 시트 둘과 Dialog 하나가 이 task의 산출이다. **함수도 표도 안 만든다.**

선행은 [`payroll-data`](payroll-data.md)다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **정해야 할 것이 둘이다.** 전원이 기본으로 쓰는 값 하나와 거기서 벗어난 사람들의 값이다. 기본 시급 줄이 목록에 안 섞이고 맨 위에 따로 선다 — 한 줄이 여러 사람의 값을 움직이는 자리라 같은 모양으로 늘어놓으면 무게가 안 보인다
- **날짜 고르개가 없다.** 적용은 언제나 오늘부터고 미리 넣어두는 길도 소급하는 길도 없다([PAY-008](../../2-design/modules/payroll/README.md#pay-008)·[PAY-009](../../2-design/modules/payroll/README.md#pay-009)). 화면에 날짜를 다루는 조각이 하나도 안 선다
- **이력은 읽기만이다.** 지난 줄에 화살표도 더보기도 없다([PAY-010](../../2-design/modules/payroll/README.md#pay-010)). 고치는 문을 두면 「지난 급여는 흔들리지 않는다」가 깨진다
- **상한·하한·저장 실패가 두 시트에 똑같이 걸린다.** [기본 시급 시트](../../2-design/modules/payroll/screens/wages.md#기본-시급-시트) 절이 그 셋을 적고 사람 시트에서 다시 안 적었다 — **구현도 조각 하나를 두 시트가 같이 쓴다**

지금 코드에는 `/admin/wages`가 없다. 관리자 홈의 「시급」 줄은 [`schedule-admin`](schedule-admin.md)이 이미 세웠다.

## 완료 조건

### AC-01

**목록 화면.** [시급 짜임](../../2-design/modules/payroll/screens/wages.md#시급-짜임)이 정본이다.

- 앱바 → 기본 시급 줄 → 가는 선 → 사람 목록이다
- 기본 시급 줄은 ListRow고 오른쪽에 값과 화살표다. **아래에 몇 명이 이 값을 쓰는지 한 줄이 붙는다** — 0명이면 문구가 바뀐다
- 사람 줄은 사진·이름·시급·화살표다. **이름 가나다순이고 개별로 정한 사람을 위로 안 올린다**
- **기본을 쓰는 사람을 따로 표시 안 한다.** 배지가 없다. 값만 선다
- **퇴사한 사람은 목록에 없다**([PAY-020](../../2-design/modules/payroll/README.md#pay-020))
- 이름 뒤에 「님」이 없다([writing.md](../../2-design/design-system/writing.md#사람-이름))
- 승인된 사람이 하나도 없으면 빈 상태다. **기본 시급 줄은 그때도 선다**

### AC-02

**기본 시급 시트.**

- 제목 → 입력 칸 → 같이 바뀌는 인원 줄 → 「닫기」·「저장」이다
- **몇 명이 같이 바뀌는지를 저장 전에 말한다.** 0명이면 문구가 바뀐다
- 입력 칸은 숫자와 「원」이 **붙어서 오른쪽에** 선다. 치는 동안 쉼표가 따라 들어간다([writing.md](../../2-design/design-system/writing.md#숫자와-단위))
- **확인을 안 묻는다.** 여러 사람이 움직이지만 같은 날 다시 저장하면 그날 줄을 덮어써서 되돌릴 수 있다([PAY-011](../../2-design/modules/payroll/README.md#pay-011))
- 값이 지금과 같거나 빈 칸이거나 0이면 「저장」이 안 눌린다
- 저장은 `set_default_wage`고 성공하면 토스트다

### AC-03

**사람 시트.**

- 제목(사진과 이름) → 입력 칸 → 적용 안내 → 기본으로 되돌리기 → 이력 → 「닫기」·「저장」이다
- **열 때 지금 시급이 채워져 있다.** 기본을 쓰는 사람도 그 값이 채워져 있고, 고쳐 저장하면 그때부터 개별이 된다(`set_wage`)
- **기본을 쓰는 사람에게는 되돌리기 줄이 없다.** 이미 붙어 있다
- 되돌리기는 **확인을 한 번 묻는다.** Dialog 하나고 바뀔 값을 그 자리에서 말한다 — 지금 값이 기본보다 높으면 누르는 순간 내려간다. 확인하면 `reset_wage_to_default`
- 이력은 최근이 위고 **안 눌린다.** 줄이 하나뿐이면 안 그린다. 세 줄까지 보이고 「더 보기」가 붙는다

### AC-04

**두 시트가 같이 쓰는 셋.** 조각 하나로 만든다.

- **상한 100,000원.** 넘으면 더 안 들어가고 칸 아래에 문구가 선다
- **하한은 0 초과 하나다.** 최저임금을 안 본다 — 해마다 바뀌는 값을 앱이 들면 안 고쳤을 때 틀린 경고가 서고, 틀린 경고는 없는 경고보다 나쁘다
- **저장이 실패하면 시트가 안 닫힌다.** 넣은 값이 칸에 그대로 있고 문구 두 줄이 선다. 사람이 먼저 걱정하는 것이 방금 넣은 값이라 그것을 먼저 말한다
- 문안은 [시급 문안](../../2-design/modules/payroll/screens/wages.md#시급-문안) 표에 있고 **「두 시트 다」라고 적힌 행이 이 조각의 것이다**

### AC-05

**읽기와 무효화.**

- 목록은 `['members']`와 `['payroll']`을 읽는다 — 이름·사진은 account가, 시급은 payroll이 낸다
- 사람 시트의 이력은 그 사람의 `wage_rates` 전부다. **목록이 이미 받은 데이터에서 갈라 쓴다** — 시트를 열 때 질의를 새로 안 던진다
- 쓰기 셋이 성공하면 `['payroll']`을 무효화한다([무효화 표](../../2-design/system/runtime.md#무효화-표))
- 읽는 중과 못 읽음은 [runtime.md](../../2-design/system/runtime.md#로딩)의 공통 규칙이다

### AC-06

**색·글자·여백·모션.** [시급 색](../../2-design/modules/payroll/screens/wages.md#시급-색)·[시급 글자](../../2-design/modules/payroll/screens/wages.md#시급-글자)·[시급 여백과 모양](../../2-design/modules/payroll/screens/wages.md#시급-여백과-모양)·[시급 모션](../../2-design/modules/payroll/screens/wages.md#시급-모션) 표 그대로다. 값은 토큰에서만 온다.

시안 `wages.sian.html`을 옆에 열고 맞춘다. **시안과 문서가 어긋나면 문서가 이긴다.**

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/screens/wages/model/*.ts`·`__tests__/` | 정렬·인원 셈·상한 검사·이력 자르기 | AC-01~AC-04 |
| `src/screens/wages/ui/*.tsx` · `/admin/wages/` 화면 | 목록·시트 둘·Dialog | AC-01~AC-03·AC-06 |
| `src/shared/ui/amount-input.tsx` | 쉼표·「원」·상한·하한 | AC-04 |
| `src/features/payroll/*.ts`·`__tests__/` | query·mutation과 무효화 | AC-05 |
| `wages` e2e | e2e | 검증 표 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `pr-diff`. [`payroll-data`](payroll-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-06을 배정한다. **integration이 없다** — 함수는 앞 task가 이미 봤다
2. `unit-test-writer`가 AC-04를 먼저 쓴다. 두 시트가 같이 쓰는 조각이라 여기가 깨지면 두 자리가 같이 깨진다
3. `implementer`가 목록 → 기본 시트 → 사람 시트 → Dialog 순으로 초록을 만든다
4. `e2e-test-writer`가 기본을 바꿔 따르는 사람이 같이 바뀌는 한 바퀴를 쓴다
5. `pr-diff`가 diff를 본다 — 이력에 고치는 길이 생기지 않았는지, 날짜 고르개가 붙지 않았는지
6. `sian-auditor`가 문서와 시안과 구현을 대조한다

## 리스크·전환·되돌리기

- **기본 시급 저장이 여러 사람을 한 번에 바꾼다.** 함수가 한 트랜잭션이라 일부만 바뀌는 일은 없지만, 화면이 저장 뒤 목록을 다시 읽어야 바뀐 값이 보인다 — `['payroll']` 무효화가 빠지면 관리자가 안 바뀐 줄 알고 또 누른다. 같은 날 두 번이면 덮어써서 값이 틀어지진 않는다
- **이력이 목록 데이터에서 갈려 나온다.** 시트를 열 때 질의를 안 던져 빠르지만, 목록 질의가 `wage_rates` 전부를 받아야 한다는 뜻이다. 서른 명에 사람마다 서너 줄이면 백 행쯤이라 지금은 작다 — 해가 쌓여 커지면 그때 시트 전용 질의로 가른다
- **입력 칸이 이 저장소에서 처음 쓰는 조각이다.** 쉼표와 단위와 상한을 같이 든다. `shared/ui`에 두어 뒤에 오는 금액 칸이 같은 것을 쓴다
- **최저임금을 안 본다.** 법정 최저 아래 값이 그냥 저장된다 — 알고 정한 것이고 근거가 [wages.md](../../2-design/modules/payroll/screens/wages.md#규칙과-부딪힌-자리)에 있다
- 되돌리기는 화면을 안 붙이는 것이다. 데이터는 앞 task의 것이라 안 건드린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 퇴사자가 목록에 선다 | unit `src/screens/wages/model/__tests__/`(예정) | `pnpm test` | 퇴사한 사람이 빠진다 |
| AC-01 | 개별로 정한 사람이 위로 올라간다 | unit 위 | `pnpm test` | 이름 가나다순 하나 |
| AC-02 | 같이 바뀌는 인원이 틀린다 | unit 위 | `pnpm test` | 가장 최근 행이 `follows_default`인 사람만 센다 |
| AC-04 | 상한이 한 시트에만 걸린다 | unit 위 | `pnpm test` | 두 시트 다 100,000원에서 멈춘다 |
| AC-04 | 저장 실패에 값이 날아간다 | unit 위 | `pnpm test` | 칸에 값이 남고 시트가 안 닫힌다 |
| AC-03 | 기본을 쓰는 사람에게 되돌리기가 뜬다 | e2e `wages` e2e(예정) | e2e 명령 | 그 줄이 없다 |
| AC-03 | 이력이 눌려 고쳐진다 | e2e 위 | 위와 같다 | 지난 줄에 화살표가 없고 안 눌린다 |
| AC-02 | 기본을 바꿔도 따르는 사람이 안 바뀐다 | e2e 위 | 위와 같다 | 기본을 바꾸면 목록의 그 사람들 값이 같이 바뀐다 |
| AC-06 | 시안과 어긋난다 | 수동 — `sian-auditor` | — | 문안·토큰·상태가 문서와 같다 |

- 배정하지 않은 것: 실기기에서 금액 칸에 숫자 키패드가 뜨는지 — iOS 사파리 동작이라 손으로 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 표와 함수 — [`payroll-data`](payroll-data.md)
- 근무 조정 — 값이 여기가 아니라 날 상세에 산다. [`payroll-adjust`](../../backlog.md)
- 근무자가 보는 급여 — [`payroll-view`](../../backlog.md)
- 통계 — 여기서 정한 단가가 통계에 안 간다. 관리자 통계에 금액이 없다([stats.md](../../2-design/system/screens/stats.md#안-담은-것))
- 직원 시트의 시급 — `members`가 자리를 두었다
- 알림 — 시급 변경에 알림이 없다. 급여 화면이 다음에 열릴 때 바뀐 값이다
