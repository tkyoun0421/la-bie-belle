# effect에 매달린 상태가 제 자리로 간다

선언형 묶음의 마지막이다. 묶음 5(effect가 만드는 파생 상태)와 묶음 6(React 19.2의 손 셋)과 묶음 3의 나머지(평평한 상태 union 셋)를 **한 PR**로 묶는다 — 셋이 `useScheduleWorkerScreen.ts`를 같이 건드려 따로 열면 두 번 열고 충돌이 merge로 미뤄진다.

## 입력 명세·기준

정본은 [제안](../../proposals/declarative-refactor-triage.md)의 묶음 5·6과 [`list-state-follows-fragments`](list-state-follows-fragments.md)가 남긴 셋이다. `useReducer`의 집과 가름은 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 `reducer` 절이 박았다 — **「있을 수 없는 조합이 타입에 남나」**가 축이고 중간 그림이 아니다(React는 한 손 안의 `setState` 여럿을 묶어 한 번만 그린다).

**세는 것은 AST가 했다.** `setState`만 부르는 `useEffect` **넷**, 정리 함수를 돌려주는 `useEffect` **여섯**, 한 손이 `setState` 둘 이상을 부르는 자리 **서른**(파일 열다섯), 콜백이 의존 배열에 든 `useEffect` **여덟 + 셋**. React는 **19.2.3**이고 `useEffectEvent`·`use`를 내보낸다.

## 다섯 묶음

| 묶음 | 자리 | 손 |
| --- | --- | --- |
| **A. 파생 상태를 effect가 만든다** | 4 | 그리는 중에 계산한다 |
| **B. 콜백이 의존 배열에 들어 다시 걸린다** | 11 | `useEffectEvent` |
| **C. 한 손이 상태 여럿을 되돌린다** | 4 파일 | `useReducer` + `model/<이름>.reducer.ts` |
| **D. 평평한 상태 union** | 3 + 규칙 45 | 판별 union, 검사 한 줄 |
| **E. `useContext` 하나** | 1 | `use(Context)` |

## 판정은 이미 났다 — 묻지 말고 이 꼴로 쓴다

### A. 파생 상태 넷 — effect를 지우고 그리는 중에 계산한다

**`useEffect` 안에서 `setState`만 부르는 자리는 「다른 값에서 계산되는 상태」를 한 박자 늦게 들고 있는 것이다.** 첫 그림은 낡은 값으로 나가고 둘째 그림이 고친다.

| 자리 | 무엇을 넣나 | 어디서 오나 |
| --- | --- | --- |
| `screens/pending/hooks/usePendingScreen.ts:155` | `setOverride` · `setEverSubmitted` | `submitted` · `everSubmitted` · `resetSubmit` |
| `screens/qr/hooks/useQrScreen.ts:84` | `setAsking` | `rotated` · `resetRotate` · `showToast` |
| `screens/rehearsal/hooks/useRehearsalScreen.ts:93` | `setMonth` | `monthParam` |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:159` | `setSelected` | `myDates` |

**꼴이 둘로 갈린다.** `useRehearsalScreen:93`과 `useScheduleWorkerScreen:159`는 **URL 인자나 질의 결과가 바뀌면 상태를 거기에 맞추는** 자리다 — 그 상태가 **사용자가 만지는 값**(달을 넘기고 날을 고른다)이라 그냥 계산으로 바꾸면 사용자 입력이 사라진다. **답은 「키로 되돌리기」다** — 그 상태를 든 조각에 `key={monthParam}`을 주거나, `useState`의 초기값으로 두고 「인자가 바뀌면 초기화」를 **그 인자의 이전 값과 비교해 그리는 중에** 한다(React 문서의 「props가 바뀔 때 상태 조정」 꼴). **effect는 안 남는다.**

`usePendingScreen:155`와 `useQrScreen:84`는 **mutation 결과에 반응**한다(`submitted`·`rotated`). 이것은 B의 자리다 — `onSuccess`/`onSettled`로 옮기거나 `useEffectEvent`로 간다. **A와 B가 같은 자리를 두 번 세지 않는다** — 이 둘은 B에서 센다.

### B. 콜백이 의존 배열에 들어 다시 걸린다 — `useEffectEvent`

**이 꼴이 열하나다.**

```ts
useEffect(() => {
  if (isSuccess) {
    onSaved();
  }
}, [isSuccess, onSaved]);
```

**버그 꼴이다.** `onSaved`의 identity가 바뀌면(부모가 다시 그려 새 함수를 내리면) `isSuccess`가 여전히 참인 채로 effect가 **다시 걸려 `onSaved`가 두 번 불린다.** 지금 안 터지는 것은 부모들이 `useCallback`으로 identity를 붙잡아 주기 때문이고 — **그 보장이 effect와 다른 파일에 산다.** `FloatingToast.tsx:16`의 타이머가 같은 꼴이다(`onDone`이 바뀌면 2400ms가 다시 시작한다).

| 자리 | 의존 배열 |
| --- | --- |
| `features/workRequest/hooks/useCancelShiftSheet.ts:46` | `[isSuccess, onSent]` |
| `features/workRequest/hooks/useRequestSheet.ts:50` | `[isSuccess, onAnswered]` |
| 같은 파일 `:56` | `[failure, request, onSeatTaken]` |
| `features/rehearsalEdit/hooks/useRehearsalFormSheet.ts:46` | `[added, saved, onSaved]` |
| `features/hallDefaults/hooks/useHallDefaultsSheet.ts:44` | `[isSuccess, onSaved]` |
| `features/profileEdit/hooks/usePendingEditor.ts:39` | `[saved, reset, onUploaded]` |
| `features/profileEdit/hooks/usePhotoSheet.ts:44` | `[saved, onSaved]` |
| `features/profileEdit/hooks/useContactSheet.ts:53` | `[saved, onSaved]` |
| `features/scheduleConfirm/hooks/useConfirmSheet.ts:28` | `[done, onClose]` |
| `shared/ui/FloatingToast.tsx:16` | `[message, onDone]` |
| `shared/hooks/useHardwareBack.ts` | `[onBack, source]` |

**손은 하나다.**

```ts
const fireSaved = useEffectEvent(onSaved);

useEffect(() => {
  if (isSuccess) {
    fireSaved();
  }
}, [isSuccess]);
```

`useEffectEvent`가 돌려주는 함수는 **항상 최신 `onSaved`를 부르고 identity가 바뀌지 않는다** — 의존 배열에서 빠지고 effect는 `isSuccess`가 바뀔 때만 건다. **이 저장소에 `react-hooks/exhaustive-deps`가 없다** — `eslint --print-config`에 `react-hooks/` 규칙이 0이다. 거짓 경고 걱정도 없고 의존 배열을 봐 주는 눈도 없다. 그래서 AC-02의 0건은 lint가 아니라 **AST 센서스**가 센다.

**더 나은 자리가 있으면 그쪽이 먼저다.** `isSuccess`에 반응하는 effect는 **mutation의 `onSuccess`로 옮기면 effect 자체가 없어진다** — TanStack이 성공한 그 순간 부르고 다시 그릴 일이 없다. 구현이 자리마다 **`onSuccess`로 갈 수 있나**를 먼저 묻고, 못 가는 자리(`FloatingToast`의 타이머, `useHardwareBack`의 리스너)만 `useEffectEvent`로 간다. **둘 다 effect가 콜백 identity에 매달리지 않는 것**이 완료 조건이다.

**`useEffectEvent`의 제약 둘을 지킨다.** 돌려받은 함수는 **effect 안에서만** 부른다 — 그리는 중에 부르거나 자식에게 내리면 안 된다. 그리고 **그 함수를 의존 배열에 넣지 않는다.**

### C. `useReducer` 넷 — 「있을 수 없는 조합」이 있는 파일만

[제안](../../proposals/declarative-refactor-triage.md)이 서른둘을 열어 **넷만** 골랐고 까닭을 적었다. 나머지는 상태 둘이 같이 뒤집히는 꼴이라 **모순되는 조합이 없어** reducer를 세울 값이 없다.

| 파일 | `useState` | 왜 가나 |
| --- | --- | --- |
| `screens/scheduleAdmin/hooks/useDayDetail.ts` | **12** | `closePicker`가 다섯을 되돌린다. 「고르는 창이 닫혔다」 하나가 변수 다섯이고 뒤의 넷은 **창이 열렸을 때만 뜻이 있다** — `picker === null`인데 `picked`가 차 있는 조합이 타입에 남는다 |
| `screens/pending/hooks/usePendingScreen.ts` | 9 | 한 `useEffect`가 넷을 넣는다(`setValues`·`setFrozen`·`setEverSubmitted`·`setSeeded`) |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts` | 7 | `setOpenDate` + `setCancelling`이 네 자리에서 같이 움직인다 |
| `screens/rehearsal/hooks/useRehearsalScreen.ts` | 5 | 한 손이 넷을 되돌린다(`setMonth`·`setOpenDate`·`setOpenForm`·`setPickerYear`) |

**reducer는 `model/<이름>.reducer.ts`에 산다** — ADR-015가 박았고 선례가 `features/rehearsalEdit/model/addSheetState.reducer.ts` 하나다. 상태 타입은 **판별 union**으로 「창이 닫혔다」와 「창이 열렸고 이것들을 들고 있다」를 가른다. action도 union이다.

**규칙 15가 reducer마다 짝 테스트를 먼저 요구한다 — 그게 이 묶음에서는 이득이다.** reducer는 순수 함수라 `dispatch` 없이 `reducer(state, action)`을 단언한다. **작성자가 먼저 쓴다.**

**열둘 전부를 reducer에 넣지 않는다.** `useDayDetail`의 열둘 가운데 **창과 함께 움직이는 것만** 들어간다 — 측정값이나 독립된 토글은 `useState`로 남는다. 어느 것이 들어가는지는 「`closePicker`가 되돌리는가」가 가른다.

### D. 평평한 상태 union 셋 — 그리고 검사가 이것을 물게 한다

| 자리 | 지금 | 가는 꼴 |
| --- | --- | --- |
| `entities/notification/model/notificationRows.policy.ts:30` `NotificationsListState` | `"loading" \| "error" \| "empty" \| "loadingMore" \| "errorMore" \| "end" \| "normal"` 일곱 | **축이 둘이다** — 목록 자체(`pending`·`failed`·`empty`·`ready`)와 **더 불러오기**(`idle`·`pending`·`failed`·`end`). 한 축에 일곱을 눕혀 놓은 것이라 두 필드로 가른다 |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:41` `ScheduleWorkerBodyState` | `"loading" \| MonthState` | ADR-016의 네 이름을 쓰는 판별 union으로. `MonthState`는 `ready` 가지의 데이터다 |
| 같은 파일 `:43` `ScheduleWorkerBody` | `"loading" \| "confirmed" \| "picker"` | 같다 — `loading`은 `pending`, 나머지 둘은 `ready`의 `body` |

**`NotificationsListState`는 축을 가르는 것이 핵심이다.** `loadingMore`는 「목록은 `ready`인데 더 불러오기가 `pending`」이고 `errorMore`는 「목록은 `ready`인데 더 불러오기가 `failed`」다. 일곱 글자는 그 두 축의 조합 가운데 **있을 수 있는 것만** 손으로 늘어놓은 것이다. `{ state: "ready"; more: "idle" | "pending" | "failed" | "end" }`로 적으면 조합이 타입에 들어온다.

**규칙 45가 평평한 글자 union을 물게 한다 — 한 줄이다.** `eslint-rules/fragmentStateContract.mjs:34`의 `stateLiteralsOf`가 `TSTypeLiteral`이 아니면 `[]`를 돌려줘서 글자 union(`TSLiteralType` 가지)이 통째로 빠진다. **`TSLiteralType`이고 그 글자가 네 이름 어휘(`loading`·`error`·`pending`·`failed`·`empty`·`ready`)에 들면 가지로 센다.** 지금 이 줄을 더하면 **위 셋이 물리고 다른 것은 안 물린다** — `list-state-follows-fragments`에서 세 자리를 두고 이 수정을 미룬 까닭이 「셋을 바꾸기 전에 켜면 `eslint-disable`을 부른다」였고, 이 PR이 셋을 바꾸니 **같은 PR에서 켠다.** 검사 짝 테스트에 **평평한 글자 union이 물리는 경우 둘**을 더한다.

### E. `use(Context)` 하나

`shared/stores/drag.context.ts`가 `useContext`를 쓰는 유일한 자리다. `use(DragContext)`로 바꾼다. 문턱에 못 미치는 양이지만 **이 파일을 건드리는 PR이 여기뿐**이라 같이 간다.

### 안 쓰는 것 — 제안서가 박았다

`useActionState`·`useFormStatus`·`useOptimistic`·`useDeferredValue`는 안 쓴다. 폼이 `<form action>`을 안 타고, 낙관적 갱신은 TanStack이 들고, 비싼 그림이 없다. 다시 묻지 않는다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `screens/scheduleAdmin/model/dayDetail.reducer.ts` 외 reducer **넷** | **새로 선다.** 상태 union · action union · 순수 reducer |
| 그 넷의 짝 테스트 | **작성자가 먼저 쓴다.** `reducer(state, action)`을 직접 단언 |
| C의 hook 넷 | `useState` 묶음이 `useReducer`로. **반환 객체의 모양은 그대로** — 기존 단언이 그 필드를 읽는다 |
| B의 열하나 | `onSuccess`로 가거나 `useEffectEvent`로. 콜백이 의존 배열에서 빠진다 |
| B의 짝 테스트 | **콜백 identity를 바꿔도 한 번만 불리는 것**을 단언한다 — 지금은 부모의 `useCallback`이 숨겨 주는 버그다 |
| A의 둘 (`useRehearsalScreen:93`·`useScheduleWorkerScreen:159`) | effect가 사라지고 「인자가 바뀌면 초기화」가 그리는 중에 선다 |
| `notificationRows.policy.ts` + 그 소비자 | 두 축의 판별 union. 소비자가 `state === "loadingMore"`를 묻던 자리가 `state === "ready" && more === "pending"`으로 |
| `useScheduleWorkerScreen.ts:41·43` | 판별 union으로. C와 같은 파일이라 한 번에 |
| `eslint-rules/fragmentStateContract.mjs` + 짝 테스트 | `TSLiteralType` 가지 한 줄. 테스트 둘 |
| `shared/stores/drag.context.ts` | `use(Context)` |

## 완료 조건

- **AC-01** `setState`만 부르는 `useEffect`가 `src`에 **0건**이다
- **AC-02** 콜백(`on*`)이 `useEffect` 의존 배열에 든 자리가 **0건**이다. `onSuccess`로 갔거나 `useEffectEvent`가 들었다
- **AC-03** B의 짝 테스트가 **콜백 identity를 바꿔도 완료 콜백이 한 번만 불리는 것**을 단언한다 — 지금 코드로는 **두 번 불려 실패해야** 하는 테스트다(부모의 `useCallback`을 끼우지 않고 렌더하면)
- **AC-04** reducer 넷이 `model/<이름>.reducer.ts`에 서고 **짝 테스트가 `dispatch` 없이** 전이를 단언한다. 상태 타입이 판별 union이라 **「창이 닫혔는데 고른 것이 있다」 같은 조합이 타입에 없다**
- **AC-05** C의 hook 넷의 **반환 객체 모양이 그대로**다 — 기존 단언이 하나도 안 바뀐다
- **AC-06** `NotificationsListState`가 두 축의 판별 union이고 소비자가 따라간다. `ScheduleWorkerBodyState`·`ScheduleWorkerBody`가 ADR-016의 네 이름을 쓴다
- **AC-07** 규칙 45가 **평평한 글자 union을 문다.** 짝 테스트에 물리는 경우 둘이 더해지고, **`src`에서 거짓 양성이 0이다**(세 자리를 바꾼 뒤 켜니 0이어야 한다)
- **AC-08** `drag.context.ts`가 `use(Context)`를 쓴다
- **AC-09** `useReducer`가 **네 파일에만** 있다. 다른 파일에 새로 들어가지 않는다
- **AC-10** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. **작성자 둘이 먼저 쓴다.** 하나는 reducer 넷의 전이 단언(규칙 15가 요구하고 순수 함수라 싸다), 하나는 B의 「identity가 바뀌어도 한 번」 단언과 D의 상태 모양 단언
2. D의 셋을 판별 union으로 바꾸고 **같은 커밋에서** 규칙 45의 한 줄을 켠다 — 먼저 켜면 셋이 물려 `eslint-disable`을 부른다
3. C — reducer 넷을 세우고 hook이 `useReducer`로 간다. **`useDayDetail`부터** — 가장 크고(656줄) 창 다섯이 묶이는 효과가 가장 또렷하다
4. B — 자리마다 `onSuccess`로 갈 수 있나 먼저 묻고, 못 가는 자리만 `useEffectEvent`
5. A의 둘 — effect를 지우고 「인자가 바뀌면 초기화」를 그리는 중에
6. E
7. 검증하고 PR을 연다. **열기 전에 `impact`에 미리 묻는다**

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `NODE_OPTIONS=--experimental-vm-modules pnpm exec jest <경로>`다. `FloatingToast.tsx`와 `DragProvider` 쪽을 건드리니 **`components` 프로젝트를 반드시 돌린다.**

**AC-01·AC-02는 AST로 센다** — `src`의 `useEffect` 전부를 `ts.createSourceFile`로 열어 본문이 setter 호출만인 것과 의존 배열에 `on`으로 시작하는 식별자가 든 것을 센다. grep은 여러 줄 의존 배열을 놓친다.

## 리스크

**`useDayDetail`이 656줄에 `useState` 열둘이다.** 한 번에 다 reducer로 넣으려 하면 반환 객체가 흔들려 단언 수십이 깨진다. **`closePicker`가 되돌리는 다섯만** 먼저 묶고, 반환 객체는 reducer 상태에서 **같은 이름으로 풀어** 내보낸다. 나머지 일곱은 `useState`로 남는다 — 「독립된 토글」이라 모순 조합이 없다.

**A의 「키로 되돌리기」가 사용자 입력을 지울 수 있다.** `monthParam`이 바뀔 때 `month`를 초기화하는 것은 지금 effect도 하는 일이다 — 바뀌는 것은 **한 박자 늦던 것이 같은 그림에 나가는 것**뿐이다. 그래도 `useRehearsalScreen.test.ts`의 달 넘기기 단언이 그대로 통과하는 것이 그물이다.

**B를 `onSuccess`로 옮기면 호출 시점이 미세하게 달라진다.** effect는 성공 **뒤 그림이 나간 다음** 불리고 `onSuccess`는 **그림 전**에 불린다. 콜백이 시트를 닫는 것이라면 차이가 안 보이지만, 콜백이 **그려진 것을 읽는다면** 다르다. 구현이 자리마다 콜백 본문을 읽고 **읽는 것이 있으면 `useEffectEvent`로** 간다.

**`NotificationsListState`의 소비자가 일곱 글자를 어디서 읽는지 다 찾아야 한다.** 한 자리를 놓치면 typecheck가 잡는다 — 그게 판별 union의 값이다. **`as`를 써서 통과시키지 않는다.**

**규칙 45를 켜면 `src` 밖(테스트 픽스처)에서 물릴 수 있다.** 검사의 대상 경로를 확인하고, 테스트 파일은 지금처럼 밖이면 그대로 둔다.
