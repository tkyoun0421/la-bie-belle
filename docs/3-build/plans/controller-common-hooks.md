# controller가 각자 하던 같은 일을 공용 훅으로

같은 일을 여러 controller가 각자 한다. 자리가 셋을 넘는 것만 뽑고, 둘은 다른 묶음에 넘기고, 하나는 안 뽑는다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 H 가운데 반복 축이다.** controller 넷의 무게를 덜는 축은 [`fragments-own-their-data`](fragments-own-their-data.md)의 AC-04이 이미 들었다 — `useScheduleAdminScreen`을 200줄 아래로 내리는 자리다.

### 반복 아홉과 그 판정

**기준은 [증축 규칙](../../../CLAUDE.md)이다** — 「같은 것 세 번째면 뽑는다」. 자리가 둘이면 안 뽑는다.

| 반복되는 일 | 자리 | 판정 |
| --- | --- | --- |
| 서버 시계 조립 | **13** | 뽑는다. 셋은 세 줄이 글자까지 같다 |
| 토스트 들기 | **10** | 뽑는다. 꼴을 먼저 정한다 |
| 달 고르기와 곁 상태 씻기 | 5 | 뽑는다. 씻는 일은 콜백으로 받는다 |
| 세션에서 프로필 두 겹 | **12** | 뽑는다. 셋이 `role`·`isAdmin`까지 더 짠다 |
| mutation 성공 보고 닫고 씻기 | 4 | 뽑는다. **묶음 B 뒤에 온다** |
| 날짜별 Map을 루프로 짜기 | 4 | 뽑는다. 하나가 이미 `utils`로 내려가 있다 |
| 시트 열림을 합집합 타입으로 | 4 | **묶음 G에 넘긴다** — 같은 축이다 |
| 시각을 `HH:mm`으로 자르기 | 10 | **묶음 E에 넘겼다** — 같은 열 자리를 두 번 안 고치려고다 |
| 라우터 파라미터 심기 | 2 | **안 뽑는다.** 둘이라 증축 규칙의 셋째 기준에 못 미친다 |

### 토스트의 꼴이 한 화면 안에서 갈린다

`src/screens/scheduleAdmin/hooks/useDayDetail.ts:117`이 `useState<string | null>(null)`을, 같은 화면의 `src/screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts:192`가 `useState<ScheduleAdminToast | null>(null)`을 든다. 뒤쪽은 `{ kind: "info" | "success"; message: string }`이다.

**`{ kind, message }`가 이긴다.** 글자만 들면 그것이 알림인지 성공인지 `.tsx`가 알 수 없고, 그래서 생김새를 고를 수 없다. 글자로 든 열두 자리는 전부 `kind: "info"`에 해당한다.

### 다른 묶음에 넘긴 둘

**시트 열림 union 넷은 [`fragment-state-contract`](fragment-state-contract.md)가 받는다.** 그 계획이 조각의 상태 계약을 판별 union으로 모으는데, 시트 열림도 같은 꼴의 합집합 타입이다. 거기서 꼴이 정해진 뒤에 와야 두 번 안 고친다.

**시각 자르기 열 자리는 [`duplicated-constants-and-copy`](duplicated-constants-and-copy.md)가 받았다.** `CLOCK_LENGTH` 상수를 옮기는 일과 그 상수를 쓰는 손을 모으는 일이 같은 열 자리라, 따로 하면 import를 두 번 고친다.

## 왜 고치나

`useDayDetail`과 `useScheduleAdminScreen`이 **같은 화면 안에서** 토스트를 각자 다른 꼴로 든다. 한쪽 조각이 성공 토스트를 내려 해도 그 자리의 타입이 글자뿐이라 못 한다.

서버 시계 열세 자리는 세 줄이 같은 일을 한다 — 저장소의 시계 정책(`entities/clock`)을 읽어 지금 시각을 내는 조립이다. 그 조립이 틀리면 열세 화면이 각자 틀린다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `src/shared/hooks/useToast.ts` | 신설 — `{ kind, message } \| null`과 `showToast`·`dismissToast`를 낸다 |
| `src/entities/clock/hooks/useServerNow.ts` | 신설 — 시계 저장소와 `nowWithOffset`을 묶어 지금 시각을 낸다. **`shared`가 아니라 `entities/clock`이다** — 도메인 하나를 읽는 훅이다 |
| `src/shared/hooks/useMonthCursor.ts` | 신설 — 달을 들고 옮기며, 옮길 때 할 일을 콜백으로 받는다 |
| `src/features/auth/hooks/useMyStanding.ts` | 신설 — 세션에서 프로필 두 겹을 받고 `role`·`isAdmin`까지 낸다. **`entities`가 아니라 `features/auth`다** |
| `src/shared/hooks/useCloseSheetOnSuccess.ts` | `useScheduleAdminScreen.ts:161`의 지역 함수를 올린다 |
| 날짜별 Map 넷 | 이미 `utils`로 내려간 하나로 모은다 |
| 토스트 12 · 시계 13 · 달 5 · 프로필 5 · 성공 닫기 4 | 지역 상태와 조립을 지우고 그 훅을 부른다 |

**`shared/hooks`에 둘이 이미 있다**(`useHardwareBack`·`useThemeSheet`). 도메인을 모르는 훅만 거기 가고, 도메인 하나를 읽는 훅은 그 `entities` 슬라이스로 간다 — [ADR-016](../../2-design/adr/ADR-016-fragments-own-their-data.md)의 「무엇을 아는가」 축이다. 그래서 시계는 `entities/clock`이다.

**`useMyStanding`은 `entities`에 못 산다.** 세션과 프로필 둘을 맞추는 일이고 **규칙 3이 같은 층 슬라이스끼리를 막는다** — `entities/profile`에 두면 `entities/session`을 못 당기고 `entities/session`에 두면 그 반대다. ADR-016이 「도메인 여럿을 맞추면 `features`」로 이미 답했다.

**`features/auth`가 그 자리다.** 그 슬라이스가 `decideEntry.lib.ts`와 `resolveEntryDestination.lib.ts`로 「누구인지 보고 어디로 보낼지」를 이미 판정한다 — `useMyStanding`은 같은 물음의 훅 꼴이다. `features/stats`의 읽기 훅 둘이 이미 `entities/session`을 당겨 이 길이 서 있다.

**자리가 다섯이 아니라 아홉이다.** 세션과 프로필을 같이 당기는 파일을 전수로 셌다 — `features/payrollCompute/services/useMyPayrollViewDaysQuery.ts`·`features/stats/hooks/useStatsAttendance.ts`·`features/stats/hooks/useStatsPositions.ts`와 `screens`의 `scheduleWorker`·`rehearsal`·`profile`·`payroll`·`stats`·`pending`이다.

**규칙 「`hooks`·`services`·`stores` 밖의 `use*` export」가 자리를 지킨다.** 새 훅 다섯이 전부 `hooks` 세그먼트다.

## 완료 조건

- **AC-01** 토스트를 지역 상태로 드는 controller가 0이다. 12자리가 `useToast`를 부르고 꼴이 `{ kind, message } | null` 하나다
- **AC-02** 서버 시계를 손으로 조립하는 자리가 0이다. 13자리가 `useServerNow`를 부른다
- **AC-03** 달을 들고 옮기는 **넷**이 `useMonthCursor`를 부르고, 옮길 때 씻을 것은 콜백으로 넘긴다

**다섯째(`useRehearsalScreen`)는 빠진다.** 이전·다음으로 옮기는 손이 없고 연월 피커로 고르기만 해서 `goPrev`·`goNext`가 그 화면에서 죽는다.

**`jumpTo(month)`가 반환에 더 선다.** `useScheduleAdminScreen:248`과 `useScheduleWorkerScreen:151`이 라우터 파라미터가 지목한 달로 건너뛰는 effect를 들어 달을 심을 손이 필요하다. 받은 달을 그대로 넘기니 호출부가 `1`·`-1`을 아는 것이 아니라 「달 셈을 흘리지 않는다」를 깨지 않는다. `onMove`는 부르지 않는다.
- **AC-04** 세션에서 프로필 두 겹을 짜는 **열두** 자리가 `useMyStanding`을 부른다. `role`·`isAdmin`을 더 짜던 자리도 거기서 받는다

**열둘에 `src/app/` 셋이 든다** — `(tabs)/_layout.tsx`·`admin/_layout.tsx`·`me/rehearsals.tsx`고 뒤의 둘은 `role === "admin"`을 손으로 짠다. 그 판정이 훅으로 들어가는 것이 이 AC가 겨누는 자리다.

**`useMyStanding`은 행 쿼리(`useMyProfileRowQuery`)를 든다.** 열둘 가운데 열하나가 그것이고 연락처까지 받는 것은 `useProfileScreen` 하나다. 두 겹 쿼리를 훅에 넣으면 **연락처 질의가 열한 화면에 새로 붙고** `profile.id`가 늦게 서서 그것으로 막은 뒷 쿼리가 늦게 뜬다.

**`null`과 `undefined`를 접지 않는다.** `usePendingScreen:136`이 「행이 없다」와 「아직 안 왔다」를 따로 보고 `useRehearsalScreen:83`이 `role !== undefined`를 「알아냈다」로 쓴다. 훅의 `profile`은 `Profile | null | undefined`다.
- **AC-05** `useCloseSheetOnSuccess`가 `src/shared/hooks/`에 서고 네 자리가 그것을 부른다. 지역 선언이 0이다
- **AC-06** ~~날짜별 Map을 루프로 짜는 자리가 0이다~~ — **뺀다.** 넷이 한 가지가 아니었다

**넷을 열어 보니 하는 일이 셋이다.** `useScheduleWorkerScreen:184`는 키마다 값 하나를 꽂고(나중 것이 이긴다), `useScheduleWorkerScreen:194`와 `useRehearsalScreen:115`는 배열에 쌓고, `vacancyCards.policy.ts:28`은 센다. **각각 한 자리와 두 자리와 한 자리다.** 증축 규칙의 「세 번째면 뽑는다」에 셋 다 못 미친다.

처음 표가 넷으로 센 것은 **「루프로 Map을 짠다」는 생김새를 센 것**이고, 뽑는 기준은 하는 일이다. 꽂기와 쌓기와 세기는 서로 다른 판정이라 한 `utils`로 모으면 그 셋을 가르는 인자가 생겨 부르는 자리가 더 어려워진다. `entities/notification/model`의 `groupNotificationsByDate`는 **네 번째 꼴**이다 — 잇따른 같은 날을 한 묶음으로 접어서 위 셋과 다르다.
- **AC-07** 새 훅 다섯에 짝 테스트가 선다
- **AC-08** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

**선행 둘이 다 섰다** — 묶음 B(`mutation-settle-shape`)가 `isSuccess`의 시점을 「새 데이터가 온 뒤」로 정했고 묶음 G(`fragment-state-contract`)가 판별 union의 꼴을 정했다.

1. 실패 테스트를 쓴다 — 새 훅 다섯의 짝이다. 훅이 아직 없어 `await import`와 `@ts-expect-error` 한 줄을 쓴다
2. `useServerNow`를 세운다. 열세 자리로 가장 넓고 꼴이 하나라 가장 깨끗하다
3. `useToast`를 세운다. 글자로 들던 열두 자리가 `kind: "info"`로 간다
4. `useMyStanding`과 `useMonthCursor`를 세운다. 달 쪽은 `goPrev`·`goNext`로 통일하고 씻는 일만 `onMove`로 받는다
6. **B가 merge된 뒤** `useCloseSheetOnSuccess`를 올린다
7. 검증하고 PR을 연다

## 리스크

**2번 걸음이 열세 화면을 건드린다.** 조립이 세 줄이라 작지만 자리가 넓어 한 번에 전부 바꿔야 한다 — 반만 옮기면 두 꼴이 공존한다.

**달 고르기의 값은 씻기가 아니라 인터페이스에 있다.** 다섯 자리를 읽으니 씻는 상태가 넷·셋·없음·없음으로 갈리고 **둘은 씻을 것이 아예 없다**. 공통은 「달을 들고 옮긴다」뿐이라 얇아 보이는데, **같은 일에 이름이 두 꼴이다** — `useScheduleWorkerScreen`·`useScheduleAdminScreen`이 `goMonth(step)`을, `useAdminStatsScreen`·`useStatsScreen`이 `goPrev`·`goNext`를 쓴다.

**`goPrev`·`goNext`로 통일한다.** `goMonth(step)`은 달 셈을 호출부로 흘려 호출부가 `1`과 `-1`을 알아야 한다. 사람이 하는 일은 「이전 달」과 「다음 달」이다. 씻는 일은 `onMove` 콜백으로 받고 **씻을 것이 없는 둘은 그 인자를 안 준다.**

**`useMonthCursor`는 `shared/hooks`다.** 첫 달을 인자로 받아 시계를 모른다 — 호출부가 이미 `useServerNow`를 든다. 달 글자(`2026-10`)를 다루는 것은 도구고 `shared/utils`의 `monthIn`·`monthRange`·`monthBoundary`가 그 자리다.

**AC-07의 짝 테스트가 훅이라 `renderHook`을 쓴다.** `logic` 프로젝트가 node 환경이라 React 훅 테스트가 거기서 도는지 확인한다 — 기존 controller 짝 테스트가 그 꼴로 이미 돌고 있으니 길은 있다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다. integration은 범위 밖이다 — `api/`를 안 건드리고 controller의 조립만 모은다.
