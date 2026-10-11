# 목록 상태 여덟이 조각 규격을 따라간다

`*ListState`와 `*Body` 여덟이 평평한 글자 union으로 서서 **상태 이름 자리에 준비됐을 때의 데이터가 올라와 있다.** [ADR-016](../../2-design/adr/ADR-016-fragments-own-their-data.md)의 네 이름을 따르는 판별 union으로 바꾸고, `.tsx`의 세 `if`를 이미 선 `FragmentView`에 넘긴다. **깊은 삼항 넷이 그 결과로 사라진다.**

## 입력 명세·기준

**정본은 ADR-016이다.** 읽기 상태 이름이 넷(`pending`·`failed`·`empty`·`ready`)이고, 「가지를 늘리고 싶은 것은 대개 상태가 아니라 그 가지의 데이터다」가 이 task의 판정 근거다.

**이것은 [fragment-triple-one-hand](fragment-triple-one-hand.md)의 남은 절반이다.** 그 task가 조각 controller 열아홉을 `fragmentOf`와 `FragmentView`로 옮겼고 **화면과 `entities`의 목록 상태는 안 건드렸다.** 그래서 `.tsx`에 그 task가 지운 꼴이 그대로 남았다.

```tsx
if (screen.listState === "loading") { … }
if (screen.listState === "failed")  { … }
if (screen.listState === "empty")   { … }
```

### 자리 여덟

AST로 전수 훑어 **글자 union 가운데 읽기 상태 어휘를 쓰는 별칭 열여섯**을 찾고, 그중 「어느 그림을 그릴지 고르는」 여덟을 가렸다.

| 별칭 | 사는 곳 | 지금 | 상태 자리에 올라온 데이터 |
| --- | --- | --- | --- |
| `StatsListState` | `screens/stats/hooks/useStatsScreen.ts:41` | 6갈래 평평 | 탭 셋 — `attendance`·`position`·`payroll` |
| `NotificationsListState` | `entities/notification/model/notificationRows.policy.ts:30` | **7갈래 평평** | 넷 |
| `AdminStatsListState` | `screens/adminStats/hooks/useAdminStatsScreen.ts:33` | 5갈래 평평 | 탭 둘 — `work`·`attendance` |
| `PayrollListState` | `screens/payroll/hooks/usePayrollScreen.ts:28` | 5갈래 평평 | `history`·`months` |
| `ScheduleAdminListState` | `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts:73` | 3갈래 평평 | `calendar`. **`missing`은 데이터가 아니라 `empty`다** |
| `WagesListState` | `screens/wages/hooks/useWagesScreen.ts:20` | 3갈래 평평 | `rows` |
| `ScheduleWorkerBody` | `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:43` | 3갈래 평평 | 둘 |
| `ScheduleWorkerBodyState` | `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:41` | **이미 판별** | — |

읽는 자리가 **31**이고 짝 테스트 단언이 **30**이다.

### 규격 밖인 여덟

같은 어휘를 쓰지만 **그림을 고르는 값이 아니라** 이 task 밖이다. 거짓 양성을 미리 가려 둔다.

| 별칭 | 왜 밖인가 |
| --- | --- |
| `AttendanceStatus`·`MemberKind` | `pending`이 **「승인 대기」라는 도메인 상태**다. 가져오는 중이 아니다 |
| `ReachState` | 푸시가 닿는지의 판정이다 |
| `ConfirmSheetFace` | 시트의 얼굴(`ask`·`failed`·`done`)이고 **쓰기 흐름**이다 |
| `PendingStage` | 승인 대기 화면의 단계다 |
| `RehearsalDayCellState`·`SlotCardVariant` | 칸과 카드의 생김새다 |
| `FragmentState` | `shared/ui/FragmentView.tsx`의 **정본 정의 자체**다 |

## 판정은 이미 났다 — 묻지 말고 이 꼴로 쓴다

**① 공용 손을 새로 만들지 않는다.** `shared/model/fragmentState.policy.ts`의 `fragmentOf`와 `shared/ui/FragmentView.tsx`가 이미 섰다. **그것을 쓴다.**

**`makeListState(isLoading, error, empty, defaultValue)` 꼴을 만들지 않는다.** 글자 하나를 돌려주면 **좁혀지지 않아** 부르는 쪽이 같은 조건을 다시 묻는다. `features/payrollCompute/model/fragmentState.policy.ts`가 정확히 그 꼴이었고 [fragment-triple-one-hand](fragment-triple-one-hand.md)가 **지웠다** — `usePayrollMonthRows.ts`가 `read.data === undefined`를 다시 묻고 닿지 않는 `[]`를 들고 있었다. 되돌리지 않는다.

**② 준비됐을 때의 값은 `ready` 가지의 데이터로 내린다.**

```ts
export type StatsListState =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | { state: "ready"; tab: StatsTab };
```

**이것이 이 task의 핵심이고 삼항이 사라지는 까닭이다.** `tab`을 `ready` 밖에서 읽을 수 없게 되면 그것을 밖에서 읽으려고 서 있던 식이 설 자리가 없다.

**③ 깊은 삼항 넷이 이 task로 사라진다.** 나머지 넷은 다른 꼴이라 `guard-chains-to-policies`가 가져간다.

| 자리 | 지금 | 사라지는 까닭 |
| --- | --- | --- |
| `useStatsScreen.ts:200` | 3겹 4갈래 | `fragmentOf`가 그 판정을 든다 |
| `useAdminStatsScreen.ts:135` | 3겹 4갈래 | 같다 |
| `usePayrollScreen.ts:74` | **4겹 5갈래** | 같다. 5갈래였던 까닭이 `unit` 둘이 상태 자리에 있어서다 |
| `useStatsScreen.ts:225` | 3겹 4갈래 | **`listState`가 준비 상태인지 다시 묻는 자리다.** `ready` 가지 안에서만 `tab`이 보이면 그 질문이 없어진다 |

**④ `.tsx`의 세 `if`는 `FragmentView`가 든다.** `StatsList.tsx`와 `WagesList.tsx`가 그 꼴이다. 바꿀 자리를 구현이 `grep`으로 세지 말고 **`listState`를 읽는 31자리를 전부 열어** 가린다.

**`missing`이 `empty`로 간다.** 「그 달 근무표 레코드가 없다」는 **와 보니 없는 것**이고 다른 화면의 `empty`와 같은 성격이다. 만들기 버튼을 설명하는 값(`canCreate`·`emptyTitle`·`createHint`)이 **이미 `listState` 밖의 필드로 따로 산다** — `empty`로 접어도 화면이 잃는 것이 없다.

**`PayrollListState`의 `ready` 가지는 `view`를 든다.** `history`와 `months`는 탭이 아니라 `unit`에서 파생된 「어느 조각을 그릴지」라서 `tab`이라는 이름이 안 맞는다. **받은 테스트가 그 이름으로 계약을 박았으니 구현이 그 이름을 쓴다.**

**⑤ `ScheduleWorkerBodyState`는 이미 판별 union이다.** 그 옆의 `ScheduleWorkerBody`가 평평하다 — **둘의 관계를 먼저 읽고** 하나로 합칠지 그대로 둘지 정한다. 합치면 `.tsx`가 따라 바뀐다.

**⑥ `NotificationsListState`는 `entities`에 산다.** 일곱 갈래로 가장 심하고 `model`의 `.policy.ts`에 있다. **층이 다르지만 묻는 질문이 같아** 같이 간다. 규칙 3에 걸리는지 구현이 확인한다.

## 검사를 세운다

**규칙 45(`house/fragment-state-contract`)가 이 여덟을 한 번도 안 봤다.** `eslint-rules/fragmentStateContract.mjs:8`이 `node.id.name.endsWith("Controller")`로 걸러서다.

**범위를 접미사 셋으로 넓힌다 — `Controller`·`ListState`·`Body`다.** 어휘로 거르면 안 된다: 읽기 상태 어휘를 쓰는 별칭 열여섯 가운데 **아홉이 거짓 양성**이고(`AttendanceStatus`의 `pending`이 「승인 대기」다), 거짓 양성이 남으면 다음 사람이 `eslint-disable`로 덮는다.

접미사로 거르면 **여덟이 정확히 걸리고 거짓 양성이 0이다.** `ScheduleWorkerBodyState`가 `*BodyState`로 걸리는데 이미 판별 union이라 통과한다.

ESLint 규칙을 건드리면 **한 커밋에 다섯 자리가 같이 간다** — `.mjs`, `eslint-rules/index.mjs`, `eslint.config.mjs`, `tests/lint/rules.ts`(행과 `DOCUMENTED_LINT_RULE_COUNT`), `docs/4-test/execution.md`(표의 행과 **산문의 수**). 짝 테스트도 `eslint-rules/__tests__/`에 선다. **규칙 번호를 새로 주지 않는다 — 45의 범위를 넓히는 것이라 행이 늘지 않는다.**

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `screens/stats/hooks/useStatsScreen.ts` | `StatsListState`가 판별 union이 되고 `fragmentOf`를 쓴다. 삼항 둘(`:200`·`:225`)이 사라진다 |
| `screens/adminStats/hooks/useAdminStatsScreen.ts` | 같다. 삼항 하나(`:135`) |
| `screens/payroll/hooks/usePayrollScreen.ts` | 같다. 삼항 하나(`:74`, 4겹) |
| `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts` | `ScheduleAdminListState`가 판별 union이 된다 |
| `screens/wages/hooks/useWagesScreen.ts` | `WagesListState`가 판별 union이 된다 |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts` | `ScheduleWorkerBody`와 `ScheduleWorkerBodyState`의 관계를 정리한다 |
| `entities/notification/model/notificationRows.policy.ts` | `NotificationsListState`가 판별 union이 된다 |
| 위 여덟의 `.tsx` | 세 `if`를 `FragmentView`에 넘긴다. `listState`를 읽는 31자리 |
| 위 여덟의 짝 테스트 | 단언 30이 새 꼴을 읽는다. **단언이 지키는 것을 줄이지 않는다** |
| `eslint-rules/fragmentStateContract.mjs` | 접미사 셋을 본다 |
| `eslint-rules/__tests__/fragmentStateContract.test.mjs` | 새 접미사의 통과·실패 사례가 선다 |
| `docs/4-test/execution.md` | 규칙 45 행의 설명이 범위를 적는다. **규칙 수는 안 바뀐다** |

## 완료 조건

- **AC-01** 여덟이 판별 union이고 상태 이름이 `pending`·`failed`·`empty`·`ready` 넷뿐이다. **`"loading"`이 그 여덟에 0건**
- **AC-02** 준비됐을 때의 값이 `ready` 가지 안에 있다. 탭·`rows`·`calendar`·`history`·`months`가 **상태 이름 자리에 0건**
- **AC-03** 깊은 삼항 넷이 사라진다 — `useStatsScreen:200`·`:225`, `useAdminStatsScreen:135`, `usePayrollScreen:74`
- **AC-04** `.tsx`가 세 `if`로 상태를 가르지 않는다. `FragmentView`나 그에 준하는 한 자리가 든다
- **AC-05** 규칙 45가 접미사 셋(`Controller`·`ListState`·`Body`)을 본다. **규격 밖 여덟에 거짓 양성이 0이다** — `AttendanceStatus`·`MemberKind`·`ReachState`·`ConfirmSheetFace`·`PendingStage`·`RehearsalDayCellState`·`SlotCardVariant`가 통과한다
- **AC-06** `makeListState` 꼴의 글자 하나를 내는 손이 서지 않는다
- **AC-07** 짝 테스트 단언 30이 지키는 것이 줄지 않는다. **지운 단언이 있으면 왜 아무것도 안 지키는지를 적는다**
- **AC-08** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 여덟의 지금 꼴과 읽는 31자리를 **전부 열어** 가지마다 무엇이 필요한지 적는다
2. 판별 union 여덟을 세우고 controller가 `fragmentOf`를 쓰게 한다
3. `.tsx` 31자리를 `FragmentView`로 넘긴다
4. 짝 테스트 30을 새 꼴로 옮긴다
5. 규칙 45의 범위를 넓힌다 — 다섯 자리가 한 커밋
6. 검증하고 PR을 연다

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다 — `pnpm test -- <경로>`는 pnpm이 플래그를 먹는다. `.tsx`를 렌더하는 테스트는 `--selectProjects components`다.

**전체 실행에서 `services`의 query 테스트가 간헐적으로 `waitFor` 타임아웃을 낸다**([관찰 069](../../observations/069-query-service-tests-flake-under-full-suite.md)). 따로 돌려 가린다.

## 받은 그물에 대해 알아 둘 것

**`toEqual`은 타입을 안 본다.** `@types/jest`가 `toEqual<E = any>(expected: E)`로 정의해서(`node_modules/@types/jest/index.d.ts:960`) 평평한 글자와 객체를 비교해도 **typecheck가 초록이다.** 그래서 받은 단언 30은 **런타임에서만 실패하고** 실패 메시지가 전부 모양 불일치다.

**대기 헬퍼가 구현 전에는 안 기다린다.** `mounted()` 꼴의 헬퍼가 `.not.toEqual({ state: "pending" })`로 기다리는데, 지금 값이 글자라 **그 비교가 첫 동기 검사에서 바로 참이 되어** `waitFor`가 즉시 빠진다. 그래서 `useScheduleAdminScreen`에서 **무관한 테스트 일곱에서 여덟이 타이밍 경합으로 같이 깨지고 실행마다 그 집합이 바뀐다.**

**구현이 들어가면 저절로 사라진다** — 값이 `{ state: "pending" }`이 되는 순간 `not.toEqual`이 거짓이 되어 헬퍼가 원래대로 기다린다. **그러니 구현 전 실패 수가 30보다 많이 보이는 것이 정상이고, 구현 뒤에 남으면 그때가 진짜 결함이다.**

## 리스크

**가장 큰 것은 짝 테스트 30이다.** 평평한 글자를 단언하던 자리가 판별 union을 읽으면 **단언이 더 좁아지는데**, 그 과정에서 지키던 것을 잃을 수 있다. 고칠 때 **무엇을 지켰는지 먼저 적고** 새 꼴에서도 그것이 지켜지는지 본다.

**`.tsx` 31자리 가운데 `FragmentView`가 안 맞는 자리가 있을 수 있다.** 조각 하나가 아니라 **탭마다 다른 슬라이스의 조각을 고르는** 자리가 그렇다 — ADR-016이 `StatsList`를 그런 자리로 든다. 안 맞으면 억지로 맞추지 않고 그 자리는 판별 union만 쓰고 그림 고르기는 제자리에 둔다. **몇에 갔고 몇이 남았는지 수로 보고한다.**

**`usePayrollScreen:74`은 4겹이라 가장 복잡하다.** 다섯 갈래 가운데 둘이 `unit`에서 오는데 그것이 `ready` 가지의 데이터인지 **다른 질문인지** 구현이 먼저 가린다. 다른 질문이면 식 둘로 갈라야 하고 그러면 삼항이 하나만 줄어든다.
