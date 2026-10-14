# `as` 서른넷이 가족 아홉으로 갈린다

실행 코드의 `as` 단언이 **서른넷**이고 그 가운데 둘이 `as unknown as`다. 자리마다 열어 보니 **가족 아홉**이고 가족마다 답이 다르다. 고차 함수 하나가 일곱을 가져가고, 셋째 자리에 가서는 **`as`를 없애는 것이 아니라 한 자리에 가두는 것**이 답이다.

## 입력 명세·기준

정본은 **타입을 좁히는 기본이 타입 가드**라는 것이다. `as`는 컴파일러에게 「믿어라」고 말하는 것이라 틀렸을 때 아무도 안 막는다. 선례가 저장소에 있다 — `entities/member/api/getQualifications.api.ts`가 `function isFilled(row: QualificationRow): row is FilledQualificationRow`를 세우고 `.filter(isFilled).map(toQualification)`으로 넘긴다.

**세는 것은 AST가 했다.** `grep`이 열셋으로 센 것은 한 줄 출력에 걸린 셈이었다 — `shared/utils/theme.utils.ts:5`은 한 줄에 둘이고 `shared/ui/Illustration.tsx`는 `as unknown as` 하나가 둘로 센다. `__tests__`의 445건은 이 계획 밖이다(픽스처가 의도적으로 깨진 꼴을 만드는 자리다).

## 가족 아홉

| 가족 | 자리 | 답 |
| --- | --- | --- |
| ① **글자 union을 `includes`로 좁히기** | **7** | 고차 함수 하나 |
| ② **오류 꼴 좁히기** | 3 | `in` 연산자와 타입 가드 |
| ③ **`Record` 키 단언** | 3 | 키를 좁히는 가드 |
| ④ **튜플 리터럴 단언** | 3 | 반환 타입 표기 |
| ⑤ **`styled()` 감싸기** | 6 | 한 자리에 가둔다 |
| ⑥ **`require.context`** | 4 | 한 자리에 가둔다 |
| ⑦ **`useQueries` 결과 꺼내기** | 2 | 구현이 가린다 |
| ⑧ **Expo Router `Href`** | 2 | 구현이 가린다 |
| ⑨ **홀로 선 넷** | 4 | 자리마다 다름 |

## 판정은 이미 났다 — 묻지 말고 이 꼴로 쓴다

### ① 고차 함수가 일곱을 가져간다

`shared/model/memberOf.policy.ts`에 **가드를 만드는 손**이 선다.

```ts
export function memberOf<Member extends string>(
  all: readonly Member[],
): (value: unknown) => value is Member {
  const set = new Set<string>(all);

  return (value): value is Member =>
    typeof value === "string" && set.has(value);
}
```

**`as`가 하나도 없다.** `value is Member`는 **서술어가 하는 주장**이고 TS가 그것을 검사하지 않는다 — 그래서 단언을 안 쓰고도 좁힌다. 요점은 **그 검사되지 않는 주장이 일곱 자리에 흩어지지 않고 감사할 수 있는 한 자리에 산다**는 것이다.

가는 일곱이다.

| 자리 | 지금 | 왜 `as`가 서 있었나 |
| --- | --- | --- |
| `shared/utils/theme.utils.ts:5` | `THEMES.includes(raw as Theme) ? (raw as Theme) : "system"` | **가장 나쁘다.** `raw`가 `string \| null`인데 **`Theme`인지 묻기 위해 `Theme`라고 단언한다** — 거짓말을 먼저 하고 확인한다. 한 줄에 둘이고 `null`도 넘어간다 |
| `entities/attendance/utils/attendance.mapper.ts:36` | `(EXCUSE_DECISIONS as readonly string[]).includes(decision)` | 상수를 넓혀 `includes`에 넣는 꼴. 이건 안전하지만 |
| 같은 파일 `:37` | `? (decision as ExcuseDecision)` | **확인한 뒤에도 좁혀지지 않아** 다시 단언한다. `includes`가 타입 가드가 아니라서다 |
| `entities/attendance/utils/attendanceSummary.utils.ts:13` | `(TALLIED_STATUSES as readonly (AttendanceStatus \| null)[]).includes(…)` | 같은 꼴 |
| `entities/schedule/model/daySheet.policy.ts:20` | `(POSITION_ORDER as readonly string[]).indexOf(position)` | `indexOf`도 같다 |
| `features/stats/model/workTotals.policy.ts:129` | 같다 | 같은 꼴이 두 파일에 |
| `shared/api/errors.ts:26` | `new DomainError(message as ErrorCode)` | `KNOWN_CODES.has(message)`로 확인했는데 **`Set.has`도 좁히지 않는다** |

**`indexOf`를 쓰는 둘은 가드가 아니라 다른 답일 수 있다.** 그 자리가 묻는 것은 「이 포지션이 정본 순서에 있나」가 아니라 **「몇째냐」**다. 구현이 **그 값이 어디에 쓰이는지 먼저 보고** 가드가 맞는지 가린다 — 안 맞으면 `Record<Position, number>` 표가 답이다.

### ①-2 가드 이름은 `is`로 시작하고 검사가 그것을 지킨다

**반환 타입이 `값 is 좁은타입`인 함수는 `is`로 시작한다.** 지금 저장소의 열셋이 전부 그 꼴이라 **위반이 0건**이다 — 새로 정하는 것이 아니라 이미 사실인 것을 지키는 것이다. 근거는 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md#파일-이름)고 까닭은 **가드가 거짓말을 할 수 있어** 호출부가 이름만 보고 「여기서 좁힌다」를 알아야 한다는 것이다.

**이 task가 가드를 가장 많이 만드니 검사도 여기서 세운다.** 판정이 순수하게 구문이라 믿을 만하다 — 반환 타입이 `TSTypePredicate`인데 이름이 `/^is[A-Z]/`가 아니면 문다. **지금 거짓 양성이 0이다.**

**가드를 내는 손은 안 문다.** `memberOf`는 반환 타입이 `(value: unknown) => value is Member`고 그 자체는 서술어가 아니다 — 검사가 **함수의 반환 타입이 서술어인 경우만** 보면 그 구분이 공짜다.

ESLint 규칙을 세우면 **한 커밋에 다섯 자리가 같이 간다** — `.mjs`, `eslint-rules/index.mjs`, `eslint.config.mjs`, `tests/lint/rules.ts`(행과 `DOCUMENTED_LINT_RULE_COUNT`를 46에서 47로), `docs/4-test/execution.md`(표의 행과 **산문의 수**). 짝 테스트도 `eslint-rules/__tests__/`에 선다.

### ② 오류 꼴은 `in`이 좁힌다

```ts
const { message } = error as { message?: unknown };
```

`shared/api/errors.ts:17`이다. 바로 위에서 `typeof error !== "object" || error === null`을 걸러 놨으니 **`"message" in error`가 좁힌다** — TS가 `in`으로 좁히므로 단언이 필요 없다.

`features/profileEdit/api/updateMyContact.api.ts:14`의 `(error ?? {}) as UpdateFailure`도 같은 가족이다. **그 자리는 두 필드(`code`·`message`)를 꺼내니** 가드 하나를 세우는 것이 맞는지 구현이 가린다.

### ③ `Record` 키 단언 셋

```ts
POINT_OF[row.kind as NotificationKind];   // entities/notification/model/destination.policy.ts:69
COMPOSE_OF[row.kind as NotificationKind]; // entities/notification/utils/title.utils.ts:133
```

둘이 **같은 단언을 두 파일에서 한다.** `row.kind`가 넓은 글자고 `POINT_OF`의 키가 좁아서다. ① 의 손이 그 가드를 만들 수 있다 — `NotificationKind`의 정본 목록이 어디 있는지 구현이 찾는다.

`entities/member/services/useMembersQuery.ts:44`의 `LIST_OF[kind] as (client: DB) => …`는 **값을 단언하는 꼴**이라 다르다. 표의 값 타입이 좁아지지 않는 자리고 구현이 따로 가린다.

### ④ 튜플 리터럴 셋은 표기로 푼다

```ts
return rate === null ? [] : [[one.month, rate] as [string, number]];
```

`features/stats/utils/chartValues.utils.ts:36`과 `screens/stats/utils/chartValues.utils.ts:74`·`:98`이다. TS가 배열 리터럴을 `(string | number)[]`로 넓혀서 단언이 섰다.

**반환 타입을 적으면 단언이 없어진다.** `function f(): readonly [string, number][]`처럼 적으면 리터럴이 그 꼴로 추론된다.

**그리고 이 둘은 같은 이름의 파일이 두 슬라이스에 있다.** `features/stats/utils/chartValues.utils.ts`와 `screens/stats/utils/chartValues.utils.ts`다 — **같은 일을 하는지 구현이 확인하고** 같으면 중복이라 적는다. **이 계획에서 합치지 않는다**(규칙 3이 걸릴 수 있고 호출부가 따라 바뀐다). 보고에 적고 백로그 행으로 남긴다.

### ⑤⑥ 가두는 것이 답인 열이다

**`as`를 없앨 수 없는 자리가 있다.** 바깥 라이브러리의 타입이 비었거나 틀린 자리다.

| 가족 | 자리 | 무엇이 비었나 |
| --- | --- | --- |
| ⑤ `styled()` | `shared/ui/Icon.tsx:18`, `shared/ui/SvgPaint.tsx:23`·`:25`·`:30`·`:35` | NativeWind의 `styled()`가 감싼 컴포넌트의 props 타입을 잃는다 |
| ⑥ `require.context` | `shared/ui/Illustration.tsx:32`·`:41` (각각 `as unknown as` 하나 = 둘로 센다) | Metro의 `require.context`에 타입이 없다 |

**없애려 하지 말고 한 자리에 가둔다.** 가족마다 **타입을 붙이는 손 하나**를 세우고 거기만 `as`를 둔다 — `shared/ui`의 다섯이 같은 단언을 다섯 번 하는 대신 하나가 한다.

**`as unknown as`는 특히 그렇다.** 두 단계를 거치는 것은 「한 번으로는 TS가 거부한다」는 뜻이고, 그 자리가 **가장 감사받아야 할 자리**다. 가둔 뒤에는 그 파일만 보면 된다.

**없앨 수 있는지 구현이 먼저 본다.** NativeWind v5나 Expo의 타입이 그 사이 좋아졌을 수 있다 — `styled()`의 제네릭 입구를 읽고 **가둘 필요 없이 풀리면 그게 낫다.**

### ⑦⑧⑨ 구현이 자리마다 가린다

| 자리 | 지금 | 물을 것 |
| --- | --- | --- |
| `entities/attendance/services/useMonthsAttendanceQuery.ts:25` | `results[at].data ?? {…}` | `useQueries`가 질의마다의 타입을 잃는다. **배열 인덱스가 범위를 벗어날 수 있나**를 먼저 본다 |
| `entities/payroll/services/usePayrollMonthsByMonthQuery.ts:25` | `results[at].data as PayrollMonth` | 같다. **`data`가 `undefined`일 수 있는데 단언이 그것을 지운다** — 그게 이 가족에서 가장 위험한 자리다 |
| `screens/notifications/hooks/useNotificationsScreen.ts:32`·`:47` | `to as Href` | Expo Router의 타입 있는 경로다. `Href`가 글자 union이면 ① 의 손이 간다 |
| `entities/hall/api/getHallDefaults.api.ts:16` | `(data.default_slots ?? []) as HallSlot[]` | **DB의 `jsonb`를 믿는 자리다.** 가드로 검증하면 **동작이 바뀐다**(깨진 행을 지금은 통과시킨다) — 그러면 이 계획 밖이고 백로그 행이다 |
| `features/holiday/model/holiday.schema.ts:18` | `(value as Record<string, unknown>)` | 검증 함수 안이다. `in`이나 가드로 풀리는지 본다 |
| `features/profileEdit/lib/photoPickDeps.lib.ts:16` | `options as ImageManipulator.SaveOptions` | ⑤ 와 같은 꼴(바깥 타입)이면 가둔다 |
| `features/pushSwitch/config/pushSwitch.config.ts:4` | `Constants.expoConfig?.extra?.eas as …` | `extra`가 `any`에 가까운 자리다. 가드가 맞다 |
| `screens/pending/hooks/usePendingScreen.ts:270` | `picked as ProfileGender` | ① 의 손이 간다 — `ProfileGender`의 정본 목록을 찾는다 |

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `src/shared/model/memberOf.policy.ts` | **새로 선다.** 가드를 만드는 손 |
| `src/shared/model/__tests__/memberOf.policy.test.ts` | **새로 선다.** 그 손의 단언 |
| ① 의 일곱 | 그 손을 쓴다. `theme.utils.ts`는 `null`도 통과하던 것이 막힌다 |
| ② 의 셋 | `in`과 가드로 바뀐다 |
| ③ 의 셋 | 키를 좁히는 가드를 쓴다 |
| ④ 의 셋 | 반환 타입을 적어 단언을 지운다 |
| ⑤ 의 여섯 · ⑥ 의 넷 | 타입을 붙이는 손 하나씩에 가둔다 |
| ⑦⑧⑨ 의 아홉 | 자리마다 가린 뒤 바꾼다. 동작이 바뀌는 자리는 **안 바꾸고 적는다** |
| 위 자리들의 짝 테스트 | 가드가 거부하는 입력을 단언한다 |

## 완료 조건

- **AC-01** `shared/model/memberOf.policy.ts`가 가드를 만드는 손을 내보내고 **그 파일에 `as`가 0건이다.** 짝 테스트가 거부하는 입력(`null`·숫자·목록 밖 글자)을 단언한다
- **AC-02** ① 의 일곱이 그 손을 쓴다. **`theme.utils.ts`의 `as`가 0건**이고 `null`이 `"system"`으로 떨어지는 것을 단언이 박는다
- **AC-03** ② 의 셋에서 `as`가 사라진다 — `in`이나 가드가 그 자리를 든다
- **AC-04** ④ 의 셋에서 단언이 사라진다. 반환 타입이 적혀 있다
- **AC-05** ⑤⑥ 의 열이 **가족마다 한 자리로 모인다.** `shared/ui`의 `.tsx` 다섯이 각자 단언하지 않는다. `as unknown as`가 그 한 자리 밖에 0건이다
- **AC-06** 실행 코드의 `as` 총 수가 **서른넷에서 열 이하로** 내려간다. 남은 것은 ⑤⑥ 의 가둔 자리와 **동작이 바뀌어 안 건드린 자리**뿐이고, 자리마다 왜 남는지가 PR 본문에 적힌다
- **AC-07** **동작이 바뀌는 자리를 안 바꾼다.** `getHallDefaults.api.ts`처럼 가드를 세우면 지금 통과하는 입력이 막히는 자리는 백로그 행으로 남긴다
- **AC-08** 반환 타입이 서술어인 함수가 전부 `is`로 시작한다. **규칙 47이 그것을 문다** — 지금 열셋에 거짓 양성이 0이고, 가드를 내는 손(`memberOf`)은 **안 물린다**
- **AC-09** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 가드를 만드는 손과 그 짝 테스트를 세운다
2. ① 의 일곱을 그 손으로 바꾼다. **`theme.utils.ts`부터** — 가장 나쁜 자리고 `null` 동작이 바뀐다
3. ②④ 를 바꾼다. 단언이 아예 사라지는 가족이다
4. ③ 을 바꾼다
5. ⑤⑥ 을 가둔다. **먼저 바깥 타입으로 풀리는지 본다**
6. ⑦⑧⑨ 를 자리마다 가린다. 동작이 바뀌는 자리는 **안 바꾸고 적는다**
7. 검증하고 PR을 연다

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다 — `pnpm test -- <경로>`는 pnpm이 플래그를 먹는다. `.tsx`를 렌더하는 테스트는 `--selectProjects components`다.

`shared/ui`를 건드리니 **`components` 프로젝트를 반드시 돌린다.** `Icon`과 `SvgPaint`는 거의 모든 화면이 쓴다.

**전체 실행에서 `services`의 query 테스트가 간헐적으로 `waitFor` 타임아웃을 낸다**([관찰 069](../../observations/archive/069-query-service-tests-flake-under-full-suite.md)). 따로 돌려 가린다.

## 리스크

**`theme.utils.ts`는 동작이 바뀐다.** 지금 `THEMES.includes(raw as Theme)`가 `raw`가 `null`일 때 `includes(null)`을 묻고 거짓을 받아 `"system"`으로 떨어진다 — **우연히 맞는다.** 가드가 `typeof value === "string"`을 먼저 보니 결과가 같지만, **그 「우연히」가 없어지는 것이라** 단언으로 박는다.

**가두는 것이 답인 열을 「고치지 못했다」고 세지 않는다.** 바깥 타입이 빈 자리에 가드를 세우면 **없는 보장을 있는 척하는 것**이라 더 나쁘다. 가둔 뒤 그 파일에 왜 그 단언이 있는지는 `docs/`가 들고 코드는 무엇을 하는지만 말한다.

**`shared/ui`의 다섯을 한 자리로 모으면 import가 움직인다.** 거의 모든 화면이 `Icon`을 쓰니 **`pnpm typecheck`가 판정한다.** 꼴이 안 맞아 모을 수 없으면 억지로 모으지 않고 **몇이 모였고 몇이 남았는지 수로 보고한다.**
