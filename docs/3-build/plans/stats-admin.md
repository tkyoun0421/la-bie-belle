---
sources:
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

> 앱 골격(`expo-scaffold`)이 선 뒤에 파일 배치와 검증 명령을 채운다. 업무 규칙과 완료 조건은 그대로 선다.

## 입력 명세·기준

정본은 [stats.md](../../2-design/system/screens/stats.md)다. 차트 조각 셋은 [components.md의 차트 넷](../../2-design/design-system/components.md#차트-넷), 경로와 역할 조건은 [navigation.md](../../2-design/system/navigation.md#경로)다.

화면 하나(`/admin/stats`)와 차트 조각 셋이 이 task의 산출이다.

선행이 하나다. [`attendance-data`](attendance-data.md)가 상태 여섯을 내는 순수 함수와 근태 월 집계를 이미 낸다([AC-06](attendance-data.md#ac-06)). 배정과 날은 [`schedule-data`](schedule-data.md)가 세운 `['schedule', 'YYYY-MM']`을 읽는다 — `attendance-data`가 그것을 선행으로 들고 있어 따로 안 적는다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **금액이 없다.** 관리자 통계가 세는 것은 시간과 출결이고 시급을 안 읽는다. `['payroll']`도 `['rehearsal']`도 이 화면이 안 부른다 — 질의가 절반으로 준 자리고, 시급 화면([`payroll-wages`](payroll-wages.md))이 선행에서 빠진 이유다
- **탭이 둘이고 근무 탭이 구획 둘이다.** 사람별과 포지션이 같은 432시간을 두 축으로 가른다. 합계가 셋 다 같아야 한다 — 이 task의 핵심 단언이다
- **차트 조각 셋이 여기서 처음 선다.** 추이 그래프·줄 막대·비율 띠다. 대시보드([`dashboard`](../../backlog.md))와 근무자 통계([`stats-worker`](stats-worker.md))가 이것을 가져다 쓴다
- **달 키를 새로 연다.** `['attendance', 'YYYY-MM']`이다([attendance/design.md](../../2-design/modules/attendance/design.md#소유-데이터)). 날 키로 한 달을 읽으면 서른 질의고 열두 달 그래프에서는 360이 된다

## 완료 조건

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

`src/features/stats/model/trend.ts`와 `src/features/stats/api/queries.ts`

- 보는 달에서 열한 달을 거슬러 올라간 열두 달이고 보는 달이 오른쪽 끝이다
- **달마다 키를 읽어 더한다**([읽기 범위](../../2-design/system/runtime.md#읽기-범위)). 근무 탭은 `['schedule', 'YYYY-MM']` 열둘, 근태 탭은 거기에 `['attendance', 'YYYY-MM']` 열둘이다 — `useQueries`로 나란히 읽는다
- **키를 다른 화면과 같이 쓴다.** 근무표·급여 화면이 이미 읽어둔 달은 캐시에서 온다. 새 키를 만들지 않는 것이 이 방식의 값이다
- **앱을 쓰기 전 달은 값이 없다.** 0이 아니라 `null`이고 선이 거기서 끊긴다 — 근무표가 아예 없는 달과 확정 전인 달을 같게 다룬다
- 대표 숫자는 탭마다 하나다 — 근무는 시간 합, 근태는 출근율

### AC-04

**달 키 dal.**

`src/entities/attendance/dals/get-month-attendance.ts`

- 키가 `['attendance', 'YYYY-MM']`이고 그달치 `check_ins`와 `excuse_status`를 받는다
- 날 키(`get-day-attendance.ts`)와 같은 모양을 내서 [`attendance-data` AC-06](attendance-data.md#ac-06)의 순수 함수가 그대로 돈다. **상태 계산을 여기서 다시 짜지 않는다**
- 한 달 서른 명이면 수백 행이라 한 질의다([읽기 범위](../../2-design/system/runtime.md#읽기-범위))

### AC-05

**차트 조각 셋.**

`src/shared/ui/`

- `trend-chart.tsx` — 열두 달. 선 2px `stroke.brand-solid`, 아래 면 `bg.brand-weak`, **점은 보는 달에만**, 높이 96px. 값이 `null`인 달은 선이 끊긴다. 가로축은 1·4·7·10월만 글자고 나머지 여덟은 눈금이다
- `row-bar.tsx` — 줄 아래 4px `rounded-full`, **트랙이 없다**. 가장 큰 값이 100%고 **0이면 아무것도 안 그린다**
- `ratio-band.tsx` — 8px `rounded-full`, 몫 사이 2px 틈. 몫이 0이면 그 색과 범례가 같이 빠진다
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
| `src/features/stats/model/work-totals.ts` | 사람별·포지션별 집계 | AC-01 |
| `src/features/stats/model/person-days.ts` | 한 사람의 날짜별 근무 | AC-02 |
| `src/features/stats/model/trend.ts` | 열두 달 대표 숫자 | AC-03 |
| `src/features/stats/api/queries.ts` | 달마다의 `useQueries`와 캐시 키 | AC-03 |
| `src/entities/attendance/dals/get-month-attendance.ts` | `['attendance', 'YYYY-MM']` | AC-04 |
| `src/shared/ui/trend-chart.tsx` | 추이 그래프 | AC-05 |
| `src/shared/ui/row-bar.tsx` | 줄 막대 | AC-05 |
| `src/shared/ui/ratio-band.tsx` | 비율 띠 | AC-05 |
| `src/screens/admin-stats/` | 화면 조립, 탭 둘, 시트 | AC-06~AC-09 |
| `/admin/stats/` 화면 | 라우트 | AC-06 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`attendance-data`](attendance-data.md)가 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-09를 배정한다. **AC-01·AC-02·AC-03은 unit, AC-04는 integration, AC-06~AC-09는 e2e다**
2. `unit-test-writer`가 집계부터 쓴다. **합이 맞는지가 먼저다** — 사람별 합 = 포지션 합 = 전체, 겸임이 한 번만, 교육이 들고, 리허설이 안 든다
3. `integration-test-writer`가 달 키를 쓴다. 한 달치가 한 질의로 오고 관리자가 전원 행을 받는 것이다
4. `e2e-test-writer`가 탭 둘과 시트와 빈 상태를 쓴다
5. `implementer`가 순수 함수 → dal → 조각 → 화면 순으로 초록을 만든다
6. `pr-diff`가 diff를 본다 — `.tsx`에 계산이 든 자리가 없는지, 상태 계산이 두 벌 생기지 않았는지

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
| AC-01 | 사람별 합과 포지션 합이 다르다 | unit `src/features/stats/model/__tests__/work-totals.test.ts`(예정) | `pnpm test` | 셋이 같다 |
| AC-01 | 겸임이 두 번 센다 | unit 위 | `pnpm test` | 앞 포지션으로 한 번 |
| AC-01 | 교육 배정이 빠진다 | unit 위 | `pnpm test` | 그 포지션의 교육으로 든다 |
| AC-01 | 리허설이 섞인다 | unit 위 | `pnpm test` | 배정만 센다 |
| AC-01 | 0시간 포지션이 사라진다 | unit 위 | `pnpm test` | 아홉이 다 온다 |
| AC-02 | 시트 합계가 줄 값과 다르다 | unit `person-days.test.ts`(예정) | `pnpm test` | 회수와 시간이 구획 줄과 같다 |
| AC-03 | 값 없는 달을 0으로 잇는다 | unit `trend.test.ts`(예정) | `pnpm test` | `null`이라 선이 끊긴다 |
| AC-03 | 지난달을 골랐는데 구간이 안 밀린다 | unit 위 | `pnpm test` | 보는 달이 오른쪽 끝 |
| AC-04 | 남의 행이 안 온다 | integration `tests/integration/stats-month.test.ts`(예정) | `pnpm test:integration:run` | 관리자는 전원, 근무자는 자기 것 |
| AC-04 | 한 달을 날마다 읽는다 | integration 위 | 위와 같다 | 한 질의로 그달치 |
| AC-05 | 0인데 1px 선이 남는다 | unit `row-bar` 계산(예정) | `pnpm test` | 폭이 0이면 안 그린다 |
| AC-06 | 탭을 옮기면 달이 돌아간다 | e2e `admin-stats` e2e(예정) | e2e 명령 | 보는 달 그대로 |
| AC-06 | 근무자가 들어간다 | e2e 위 | e2e 명령 | 관리자만 |
| AC-07 | 포지션 줄이 눌린다 | e2e 위 | e2e 명령 | 안 눌리고 화살표가 없다 |
| AC-08 | 시트가 안 열린다 | e2e 위 | e2e 명령 | 사람별 줄을 누르면 올라온다 |
| AC-09 | 빈 달에 그래프가 사라진다 | e2e 위 | e2e 명령 | 그래프는 서고 목록만 빈 상태 |
| AC-09 | 근태 셈이 명단과 다르다 | e2e 위 | e2e 명령 | 같은 함수의 값 |

- 배정하지 않은 것: 차트 조각의 눈으로 보는 확인 — 시안 `stats.sian.html`과 나란히 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 근무자 통계 `/stats` — [`stats-worker`](stats-worker.md). **차트 조각 셋과 집계 함수를 가져다 쓴다**
- 대시보드의 미니 달력과 띠 — [`dashboard`](../../backlog.md). 조각을 여기서 만들지 않는다
- 관리자 홈의 「통계」 줄 — [`schedule-admin`](schedule-admin.md)이 줄과 경로를 이미 세웠다
- 금액 — 관리자 통계에 없다([stats.md](../../2-design/system/screens/stats.md#안-담은-것))
- 내보내기·증감률·사람별 추이 — 정본이 안 담기로 한 것들이다
