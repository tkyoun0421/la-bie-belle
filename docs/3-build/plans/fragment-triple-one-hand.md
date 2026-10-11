# 조각이 묻는 세 질문과 답하는 세 분기를 공용 손으로

조각 controller 21개가 **똑같은 질문 셋**을 각자 쓰고 짝 `.tsx` 21개가 **똑같은 분기 셋**을 각자 쓴다. 다른 것은 마지막 가지뿐이다. 그 셋을 `shared`의 손 둘로 모은다.

## 입력 명세·기준

정본은 [ADR-016](../../2-design/adr/ADR-016-fragments-own-their-data.md)의 「상태는 판별 union이고 이름이 넷이다」와 ADR-015의 세그먼트 열이다. 셈의 출처는 [제안](../../proposals/declarative-refactor-triage.md)의 묶음 1이고, 스물한 자리를 전부 열어 다시 셌다.

### 지금 꼴

controller 쪽이다.

```ts
if (error !== null) return { state: "failed" };
if (data === undefined) return { state: "pending" };
if (rows.length === 0) return { state: "empty" };
return { state: "ready", …그 조각만의 값 };
```

`.tsx` 쪽이다.

```tsx
if (fragment.state === "pending") return pending ?? null;
if (fragment.state === "failed") return failed ?? null;
if (fragment.state === "empty") return empty ?? null;
return <실제 그림/>;
```

### 자리마다의 입구

| controller | 질의 | `pending` 재는 식 | `empty` 재는 식 | `failed` 값 |
| --- | --- | --- | --- | --- |
| `features/stats/hooks/useStatsAttendance.ts` | 3(세션은 안 봄) | `profile.isLoading \|\| attendance.isLoading` | `days.length === 0` | — |
| `features/stats/hooks/useStatsPositions.ts` | 3(세션은 안 봄) | `profile.isLoading \|\| work.isLoading` | `totals.totalCount === 0` | — |
| `features/stats/hooks/useAdminStatsAttendance.ts` | 1 | `isLoading` | `tab.rows.length === 0` | — |
| `features/stats/hooks/useAdminStatsWork.ts` | 1 | `isLoading` | `totals.totalCount === 0` | — |
| `features/stats/hooks/useWorkDaysSheet.ts` | 1 | `isLoading` | 없음 | — |
| `features/payrollCompute/hooks/useStatsPayroll.ts` | 1 | `fragmentStateOf` | 없음 | `retry` |
| `features/payrollCompute/hooks/usePayrollSummary.ts` | 1 | `fragmentStateOf` | 없음 | `retry` |
| `features/payrollCompute/hooks/usePayrollAccrual.ts` | 1 | `fragmentStateOf` | 없음 | — |
| `features/payrollCompute/hooks/usePayrollMonthRows.ts` | 1 | `fragmentStateOf` | `rows.length === 0` | `retry` |
| `features/payrollCompute/hooks/usePayrollHistoryRows.ts` | 1 | `fragmentStateOf` | `rows.length === 0` | `retry` |
| `entities/schedule/hooks/useScheduleAgenda.ts` | 1 | `isLoading` | `days.length === 0` | `retry` |
| `entities/schedule/hooks/useDaySheet.ts` | 1 | `isLoading` | 없음 | `retry` |
| `entities/rehearsal/hooks/useRehearsalDaySheet.ts` | 2(`isAdmin`으로 택1) | `asked.data === undefined` | 없음 | — |
| `entities/profile/hooks/useProfileCard.ts` | 1 | `data === undefined` | 없음 | — |
| `entities/payroll/hooks/useWageRows.ts` | 1 | `data === undefined` | `rows.length === 0` | — |
| `entities/workRequest/hooks/useApprovalRows.ts` | 1 | `data === undefined` | `rows.length === 0` | — |
| `entities/member/hooks/useMemberRows.ts` | 2(OR 결합) | `active.data === undefined \|\| left.data === undefined` | 3단 + `reason` | — |
| `entities/member/hooks/usePendingRows.ts` | 1 | `data === undefined` | `rows.length === 0` | — |
| `entities/member/hooks/useBlockedRows.ts` | 1 | `data === undefined` | `rows.length === 0` | — |
| `entities/availability/hooks/useApplicationsList.ts` | 1 | `data === undefined` | `applications.length === 0`(그룹화 전) | — |
| `entities/notification/hooks/useNotificationsList.ts` | 1(무한) | 자체 7상태 머신 | 그 머신의 `empty` | `retry` |

**가지 값은 제안서의 셈과 같다** — 13은 맨 가지, 7은 `failed`에 `retry`, 1은 `empty`에 `reason`이고, `empty`를 드는 것이 14 · 안 드는 것이 7이다.

**질의 수는 제안서가 틀렸다.** 「16이 하나·3이 둘·2가 셋」이라 적었는데 `use*Query` 호출을 세면 **17이 하나·2가 둘·2가 셋**이다. 이 계획이 그 줄을 고친다.

### 이미 반쯤 모여 있다

`features/payrollCompute/model/fragmentState.policy.ts`의 `fragmentStateOf`가 다섯 자리에 쓰인다. **세 가지(`pending`·`failed`·`ready`)만 내고 `empty`는 호출부가 따로 얹는다.**

```ts
export function fragmentStateOf(read: FragmentRead): PayrollFragmentState {
  if (read.error !== null) return "failed";
  return read.data === undefined ? "pending" : "ready";
}
```

**이 선례가 반만 간 까닭이 글자를 돌려주기 때문이다.** 글자는 `read.data`를 좁히지 못해서 호출부가 같은 질문을 또 한다.

```ts
const state = fragmentStateOf(read);
if (state === "pending") return { state };
if (state === "failed") return { state, retry: read.refetch };

const rows: PayrollMonthLine[] = (
  read.data === undefined ? [] : yearRows(monthRowsOfDays(read.data))
).map(…);
```

`state === "ready"`가 이미 데이터가 왔음을 증명했는데 `read.data === undefined`를 다시 묻고, **닿지 않는 `[]`가 그 자리에 남는다.** 공용 손이 데이터를 들고 가야 이것이 사라진다.

## 판정은 이미 났다 — 묻지 말고 이 꼴로 쓴다

**① 손은 글자가 아니라 데이터를 든 판별 union을 돌려준다.** 위의 `usePayrollMonthRows`가 그 근거다. 글자를 돌려주면 좁히기를 잃고 호출부가 같은 질문을 두 번 한다.

**② Controller 타입은 파일마다 인라인 union으로 남는다.** 공용 손은 **값만** 만든다. `house/fragment-state-contract`(45)가 `*Controller` 별칭의 annotation이 `TSUnionType`이나 `TSTypeLiteral`일 때만 가지를 보기 때문이다. `export type WageRowsController = FragmentState<{ rows: … }>`로 쓰면 annotation이 `TSTypeReference`가 되어 **규칙이 통째로 통과한다.** 사본 파일로 찔러 확인했다 — 인라인 union의 틀린 이름 둘은 잡히고 제네릭 인스턴스화는 아무 말도 안 나왔다.

**③ `pending`을 재는 식은 스물한 자리 전부 `data === undefined`로 모은다.** 지금 `isLoading`으로 재는 일곱이 바뀐다. 근거는 **조건부 질의를 조각이 하나도 안 읽는다**는 것이다 — `enabled`를 가진 질의는 `entities/profile/services/useProfilePrivateQuery.ts` 하나뿐이고 그것을 읽는 셋(`usePendingScreen`·`useProfileScreen`·`useMembersPendingScreen`)이 전부 화면 controller다. 그래서 「안 돌린 질의가 영원히 `pending`에 머문다」가 이 스물한 자리에 없다. 그리고 `data === undefined`는 TypeScript가 따라갈 수 있어 ①이 성립한다.

**④ `empty`를 재는 식은 손이 콜백으로 받고 `failed`는 값만 받는다.** 자리마다 다른 식을 그대로 넘긴다 — `rows.length === 0`·`totals.totalCount === 0`·그룹화 전 원본 길이·`useMemberRows`의 3단 `reason`이 전부 각자 산다. **동작이 안 바뀐다.** `useDaySheet`가 「질의 실패 ∪ 그 날 없음」을 `failed` 하나로 합친 자리는 **이 손으로 안 간다** — `failed` 가지를 여는 것이 `error !== null` 하나라서다. AC-02가 그 자리를 뺀 까닭을 든다.

**⑤ `useNotificationsList`는 밖이다.** 입력이 `{data, error}`가 아니라 페이징 여섯 필드고, 이미 `resolveNotificationsListState`로 뽑힌 7상태 머신에 전가한다. 손의 입구를 그 한 자리에 맞춰 넓히면 나머지 스물이 안 쓰는 인자를 받는다. **대상은 스물이다.**

**⑥ 손이 사는 자리는 `src/shared/model/fragmentState.policy.ts`다.** 「이 읽기가 넷 중 무엇인가」는 판정이라 `model`이고(ADR-015의 가름축), 선례의 자리(`model`의 `.policy.ts`)와 같다. `features/payrollCompute`의 것은 **흡수하고 지운다** — 규칙 3이 `entities`가 `features`를 못 당기게 막아 거기 두면 열한 자리가 못 쓴다.

**⑦ `.tsx` 쪽 손은 `shared/ui`에 컴포넌트로 선다.** `QueryBoundary.tsx`가 이미 그 자리에 `pending`·`failed: (retry) => ReactNode`를 받는 선례다.

**⑧ `.tsx` 둘은 손을 안 쓰고 그대로 둔다.** `entities/member/ui/MemberRows.tsx`는 `empty` 가지에서 `reason`에 따라 주변 UI를 같이 그릴지 가르고, `entities/profile/ui/ProfileCard.tsx`는 조기 반환이 아니라 `ready?.name ?? ""` 꼴로 부분만 가른다. 억지로 맞추면 그리는 것이 달라진다.

**⑨ `screens/payroll/hooks/usePayrollScreen.ts`의 `listState`는 이 묶음 밖이다.** 이름이 `loading`이고 납작한 글자 union인 것만이 아니다 — **그 화면이 자식 조각과 똑같은 질의를 똑같은 인자로 부른다.** `usePayrollScreen:65`와 `usePayrollMonthRows:33`과 `usePayrollHistoryRows:19`가 전부 `useMyPayrollViewDaysQuery(supabase, span)`다. 캐시 키가 같아 통신은 한 번이지만 **상태를 두 겹으로 센다.** 누가 그 상태를 들어야 하는가는 설계 판정이고, 이 묶음은 스물 자리의 기계적 모음이다. 새 task로 세운다.

## 왜 한 PR인가

controller 쪽과 `.tsx` 쪽이 **같은 union의 두 끝**이다. 한쪽만 고치면 가지의 이름과 값이 어긋나는 중간 상태가 남는다. 규칙 46도 같이 간다 — 그 규칙이 막는 것이 **바로 이 PR이 만들 수 있는 구멍**이다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `src/shared/model/fragmentState.policy.ts` | 손이 선다. 읽기 하나나 여럿을 받고 `empty`·`ready`·`failed`의 식을 콜백으로 받아 판별 union을 돌려준다 |
| `src/shared/model/__tests__/fragmentState.policy.test.ts` | 그 손의 단언이 선다 |
| `src/shared/ui/FragmentView.tsx` | `.tsx` 쪽 손이 선다. 이름은 구현이 정한다 |
| `src/features/payrollCompute/model/fragmentState.policy.ts` | 지워진다. 짝 테스트도 같이 간다 |
| controller 20개 | 세 질문이 손 하나로 바뀐다. **Controller 타입 선언은 인라인 union으로 그대로 둔다** |
| `.tsx` 19개 | 세 분기가 손 하나로 바뀐다 |
| `eslint-rules/controllerTypeNotGeneric.mjs` | 규칙 46이 선다. `*Controller` 별칭의 annotation이 **타입 인자를 가진** `TSTypeReference`면 막는다 |
| `eslint-rules/__tests__/controllerTypeNotGeneric.test.ts` | 그 규칙의 짝 테스트 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` · `tests/lint/rules.ts` · `docs/4-test/execution.md` | 규칙 46을 등록한다. `DOCUMENTED_LINT_RULE_COUNT`가 45에서 46으로 간다 |
| `docs/proposals/declarative-refactor-triage.md` | 질의 수 줄을 고친다 — 「16이 하나·3이 둘·2가 셋」이 「17이 하나·2가 둘·2가 셋」이다 |

## 완료 조건

- **AC-01** `src/shared/model/fragmentState.policy.ts`의 손이 데이터를 든 판별 union을 돌려준다. `ready` 가지를 좁힌 뒤 **호출부가 `data === undefined`를 다시 묻지 않는다** — 그 재질문과 닿지 않는 기본값이 대상 스물에서 0이다
- **AC-02** controller 19개가 그 손을 부른다. `error !== null`·`data === undefined`를 직접 묻는 자리가 그 열아홉에서 0이다. `useNotificationsList`와 `entities/schedule/hooks/useDaySheet.ts`는 밖이다 — 후자는 「질의 실패 ∪ 그 달에 그 날 없음」을 `failed` 하나로 접는데 **손의 `failed`는 식이 아니라 값만 받는다.** 판정 ④가 「식을 그대로 넘기면 된다」고 적었지만 `failed` 가지를 여는 것은 `error !== null` 하나다. 그 자리를 맞추려면 없는 `Error`를 지어내 꽂아야 한다 — `day === null`이 실패인가 빈 것인가는 사용자가 보는 것을 바꾸는 설계 판정이라 뒤 task로 간다
- **AC-03** 스물 자리의 Controller 타입이 **인라인 union으로 남는다.** 제네릭 인스턴스화가 0이다
- **AC-04** `.tsx` 19개가 `shared/ui`의 손을 쓴다. `MemberRows.tsx`와 `ProfileCard.tsx`는 그대로다
- **AC-05** `features/payrollCompute/model/fragmentState.policy.ts`가 없고 그것을 당기던 다섯이 `shared`를 당긴다
- **AC-06** 규칙 46이 `*Controller` 별칭의 제네릭 인스턴스화를 막는다. 짝 테스트가 통과 케이스 둘(`= MemberWaitRowsController` 꼴의 맨 이름 별칭, 인라인 union)과 위반 하나(`= FragmentState<{…}>`)를 든다. `tests/lint/rules.ts`의 수가 46이고 `docs/4-test/execution.md`의 산문도 46이다
- **AC-07** `pending`을 재는 식이 열아홉 자리 전부 `data === undefined`다. `isLoading`으로 재던 일곱이 바뀌고 **그 일곱의 기존 `.state` 단언이 같은 답을 낸다.** 「재시도 중」을 따로 단언하지 않는다 — **그 경우는 두 기준이 같은 답을 내서 아무것도 가르지 못한다.** 재시도 중에는 `data`가 이미 있어 `data === undefined`가 거짓이고, `isLoading`도 `isPending && isFetching`인데 데이터가 있으면 `isPending`이 거짓이라 같이 거짓이다
- **AC-08** `empty`와 `failed`를 재는 식이 자리마다 그대로다 — 바뀐 뒤에도 같은 입력이 같은 가지를 낸다. `useMemberRows`의 `reason` 3단과 `useDaySheet`의 「질의 실패 ∪ 그 날 없음」이 특히 그렇다
- **AC-09** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 실패 테스트를 쓴다 — 손(AC-01), 규칙 46(AC-06), `pending` 기준이 바뀌는 일곱(AC-07), 식이 그대로임(AC-08). 대상이 아직 없는 손은 정적 import 대신 `await import`와 `@ts-expect-error` 한 줄을 쓴다
2. `shared/model`의 손을 세운다. 읽기 둘 이상을 받는 자리(`useMemberRows`·`useStatsAttendance`·`useStatsPositions`)가 입구를 정한다 — 배열로 받고 `error`는 먼저 난 것, `data`는 하나라도 `undefined`면 `pending`이다
3. 규칙 46을 세운다. 다섯 자리를 한 커밋에 건드린다
4. controller 스물을 바꾼다. **`features/payrollCompute`의 다섯을 먼저** 한다 — 선례를 흡수하는 자리라 손의 입구가 거기서 검증된다
5. `.tsx` 열아홉을 바꾼다
6. `features/payrollCompute/model/fragmentState.policy.ts`를 지운다
7. 제안서의 질의 수 줄을 고친다
8. 검증하고 PR을 연다

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 테스트는 `pnpm exec jest <경로>`로 좁혀 돌린다 — `pnpm test -- <경로>`는 pnpm이 플래그를 먹는다.

**integration과 e2e는 밖이다.** 이 묶음은 분기를 모을 뿐이고 질의·DB·라우팅을 안 건드린다. 그 층이 새로 잡을 실패가 없다.

**`shared/ui`의 손에 짝 테스트가 선다.** 가지 넷을 고르는 판정이 들어 있어 `.tsx` 열아홉의 간접 검증에만 맡기지 않는다. `tdd-guard-unit.py`가 `src/shared/ui/`를 면제하지만 면제는 「안 써도 된다」고 「쓰면 안 된다」가 아니다.

**짝 테스트의 단언은 대개 그대로 산다.** 스물한 자리의 짝 테스트가 `.state`를 196번 참조하는데, 손이 여전히 `{ state: "ready", … }` 꼴의 값을 돌려주므로 그 단언이 대상을 잃지 않는다. 깨지는 것은 `pending` 기준이 바뀌는 일곱이고 AC-07이 그것을 든다.

## 리스크

**손이 스물 자리에 다 안 맞을 수 있다.** 읽기 수가 1에서 3까지고 `empty` 식이 다섯 꼴이다. **열넷에만 맞으면 열넷만 간다** — 억지로 맞춰 안 쓰는 인자를 넘기지 않는다. 안 간 자리는 PR 본문이 왜인지 적는다.

**`pending` 기준을 바꾸는 일곱이 동작을 바꿀 수 있다.** 조건부 질의가 없음은 확인했지만, 재시도 중(`isFetching`이 참이고 `data`가 이미 있는)인 자리는 `isLoading`과 `data === undefined`가 다르게 답한다. 그 일곱의 짝 테스트가 그 경우를 단언하는지 먼저 본다.

**규칙 46이 기존 두 자리를 잡아선 안 된다.** `BlockedRowsController`와 `PendingRowsController`가 `= MemberWaitRowsController`로 맨 이름 별칭이다. 타입 인자가 없으니 규칙이 그것을 통과시켜야 한다 — 가름은 **타입 인자가 붙었나**다.
