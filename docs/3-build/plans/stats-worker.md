---
sources:
  - ../../2-design/system/screens/stats.md
  - ../../2-design/system/screens/stats.md#근무자--stats
  - ../../2-design/system/screens/stats.md#내-근태-날짜-목록
  - ../../2-design/system/screens/stats.md#내-포지션
  - ../../2-design/system/screens/stats.md#내-급여
  - ../../2-design/modules/account/screens/profile.md
  - ../../2-design/modules/payroll/screens/payroll.md
  - ../../2-design/modules/attendance/README.md#att-023
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/runtime.md#tanstack-query-규칙
---

# 근무자 통계 화면을 만든다 — 구현 계획

> 앱 골격(`expo-scaffold`)이 선 뒤에 파일 배치와 검증 명령을 채운다. 업무 규칙과 완료 조건은 그대로 선다.

## 입력 명세·기준

정본은 [stats.md](../../2-design/system/screens/stats.md)의 근무자 절이다. 관리자 화면과 문서가 하나라 짜임·색·글자·여백 표를 같이 읽는다.

화면 하나(`/stats`)가 이 task의 산출이다. 조각은 새로 안 만든다.

선행이 셋이다.

- [`stats-admin`](stats-admin.md) — 차트 조각 셋과 집계 순수 함수와 화면 뼈대를 세웠다. **이 task는 그것을 가져다 쓴다**
- `profile-screen` — 「나」의 「통계」 줄이 들어오는 문이다
- [`payroll-view`](payroll-view.md) — 「내역 보기」가 여는 급여 화면이다

정본에서 확인한 셋이 plan의 방향을 정한다.

- **탭이 셋이고 관리자와 칸이 다르다.** 근태·포지션·급여다. 앱바·달 줄·세그먼트·그래프 넷까지는 같은 자리고 갈리는 것은 칸 이름과 칸 수와 다섯째다
- **여기만 금액이 있다.** 관리자 통계에서 뺀 금액이 근무자 급여 탭에는 그대로 있다 — 자기 급여를 보는 것은 홀 전체 인건비를 보는 것과 다른 자리다. 예상치 안내 한 줄도 이 탭에만 선다
- **사람별 구획이 없다.** 볼 사람이 자기 하나라 근태는 날짜 목록이, 포지션은 내가 들어간 것만 든 목록이 그 자리를 받는다

## 완료 조건

### AC-01

**내 것으로 좁힌 집계.**

`src/features/stats/model/`

- [`stats-admin` AC-01](stats-admin.md#ac-01)의 `work-totals.ts`를 그대로 부르고 입력을 내 배정으로 좁힌다. **집계를 다시 짜지 않는다**
- 포지션 탭은 `byPosition`에서 **내가 안 들어간 포지션을 뺀다** — 관리자 쪽이 아홉을 다 세우는 것과 반대다
- 근태는 [`attendance-data` AC-06](attendance-data.md#ac-06)의 상태 함수를 내 날에 돌린다
- 급여는 [`payroll-data`](payroll-data.md)의 금액 순수 함수를 부른다. **여기서 금액을 새로 계산하지 않는다**

### AC-02

**내 근태 탭.**

- 현황 줄 → 비율 띠와 범례 → 날짜 목록이다
- 줄은 날짜와 요일, 보조 정보가 포지션, 오른쪽 값이 인증 상태와 찍은 시각이다. **못 찍었으면 상태만**이다
- **못 찍은 날도 줄로 선다.** 사유를 냈으면 결과까지 값에 붙고 그 자리를 눌러 사유 시트를 열지는 않는다
- **색으로 안 가른다.** 「지각」이 붉지 않다. 상태 여섯의 이름은 [attendance/design.md](../../2-design/modules/attendance/design.md)가 정본이다
- **출근과 출근 인정을 합치지 않는다**([ATT-023](../../2-design/modules/attendance/README.md#att-023))

### AC-03

**내 포지션 탭.**

- 합계(내 시간 합) → 내가 들어간 포지션 목록이다
- 줄의 자리와 줄 막대는 관리자 [포지션 구획](../../2-design/system/screens/stats.md#근무-포지션-구획)과 같다
- 교육 배정도 들고 겸임은 앞 포지션으로 한 번만 센다 — AC-01의 함수가 이미 그렇게 센다

### AC-04

**내 급여 탭.**

- 합계(금액) → 예상치 안내 한 줄 → 보조 줄(건수와 시간) → 「내역 보기」 줄이다
- **「내역 보기」가 [급여 조회](../../2-design/modules/payroll/screens/payroll.md)를 연다.** ListRow고 오른쪽에 화살표다
- 그래프 값은 만 단위로 줄여 적는다 — 「130만」이다
- **날짜별 내역을 여기 안 그린다.** 달 합계와 열두 달 모양까지고 그 뒤는 급여 화면이 든다

### AC-05

**들어오는 문과 빈 상태.**

- 「나」의 「통계」 줄을 누르면 `/stats`다([profile.md](../../2-design/modules/account/screens/profile.md)). 승인된 사람이면 누구나 본다
- 빈 상태는 그달에 내 근무가 하나도 없을 때고 **세 탭이 같은 모양으로 빈다**. 합계 자리가 `–`, 보조 줄과 예상치 안내가 같이 사라진다
- **급여 탭의 「내역 보기」도 사라진다.** 그 줄이 목록 자리를 쓰고 있어서 빈 상태가 그 자리에 들어온다
- 추이 그래프는 안 빈다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/features/stats/model/my-totals.ts` | 내 것으로 좁힌 집계 | AC-01 |
| `src/features/stats/api/queries.ts` | 내 범위 질의 — `stats-admin`이 만든 파일에 더한다 | AC-01 |
| `src/screens/stats/` | 화면 조립, 탭 셋 | AC-02~AC-05 |
| `/stats/` 화면 | 라우트 | AC-05 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. 선행 셋이 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-05를 배정한다. **AC-01은 unit, AC-02~AC-05는 e2e다**. integration은 안 쓴다 — RLS는 선행 task들이 이미 봤다
2. `unit-test-writer`가 내가 안 들어간 포지션이 빠지는 것과 관리자 함수를 그대로 쓰는 것을 쓴다
3. `e2e-test-writer`가 탭 셋과 「내역 보기」와 빈 상태를 쓴다
4. `implementer`가 좁히기 → 화면 순으로 초록을 만든다
5. `pr-diff`가 diff를 본다 — 집계나 금액 계산이 이 task에서 새로 생기지 않았는지

## 리스크·전환·되돌리기

- **같은 계산이 두 벌 생기기 쉬운 자리다.** 관리자 쪽 함수가 홀 전체를 받게 돼 있어 「내 것만 세는 함수」를 새로 쓰고 싶어진다. 입력을 좁히는 것으로 끝나야 하고, 새로 짜면 내 통계와 관리자 통계가 나를 다르게 센다
- **급여가 예상치다.** 이 탭의 숫자와 실제 지급액이 다를 수 있고 화면이 그것을 한 줄로 밝힌다 — 그 줄을 빼면 사람이 금액을 약속으로 읽는다
- **관리자도 이 화면을 본다.** 홈에서 들어가면 홀 전체고 「나」에서 들어가면 자기 것이다. 두 화면이 같은 조각을 쓰니 역할 판정이 경로에만 있어야 한다
- 되돌리기는 라우트와 「나」의 줄을 빼는 것이다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 안 들어간 포지션이 선다 | unit `src/features/stats/model/__tests__/my-totals.test.ts`(예정) | `pnpm test` | 내 것만 |
| AC-01 | 집계가 관리자 쪽과 다르다 | unit 위 | `pnpm test` | 같은 함수의 값 |
| AC-02 | 못 찍은 날이 빠진다 | e2e `stats` e2e(예정) | e2e 명령 | 줄로 서고 상태만 |
| AC-02 | 지각이 붉다 | e2e 위 | e2e 명령 | 색으로 안 가른다 |
| AC-04 | 「내역 보기」가 안 간다 | e2e 위 | e2e 명령 | 급여 화면이 열린다 |
| AC-04 | 예상치 안내가 없다 | e2e 위 | e2e 명령 | 급여 탭에 한 줄 |
| AC-05 | 빈 달에 「내역 보기」가 남는다 | e2e 위 | e2e 명령 | 빈 상태가 그 자리를 받는다 |
| AC-05 | 남의 것이 보인다 | e2e 위 | e2e 명령 | 자기 것만 |

- 배정하지 않은 것: RLS — 선행 task의 integration이 이미 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 관리자 통계 `/admin/stats` — [`stats-admin`](stats-admin.md)
- 차트 조각 셋 — [`stats-admin` AC-05](stats-admin.md#ac-05)가 만든다
- 날짜별 급여 내역과 주·연 조회 — [`payroll-view`](payroll-view.md)
- 「나」 화면 자체 — `profile-screen`. 이 task는 그 줄이 여는 화면까지다
- 리허설 — 자기 것은 [`rehearsal`](rehearsal.md)의 `/me/rehearsals`가 든다
