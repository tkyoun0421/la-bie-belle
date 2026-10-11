# 선언형으로 내려가는 묶음

`src`·`scripts`·`supabase/functions`의 818 파일을 TypeScript AST로 전수 훑어 **명령형으로 쓴 자리**를 센 결과다. `__tests__`는 밖이다 — 테스트의 명령형은 읽히면 그걸로 된다.

가름의 축은 **코드가 「무엇을」 말하나 「어떻게」 말하나**다. 선언형은 결과를 적고 명령형은 절차를 적는다. 절차가 같은 자리에 여러 번 적히면 한 자리를 고칠 때 나머지가 안 따라온다.

## 센 수

| 꼴 | 전체 | `src` | `scripts` | edge function |
| --- | --- | --- | --- | --- |
| 빈 그릇에 쌓는 루프 | 63 | 35 | 16 | 12 |
| 나란한 `if`로 값 고르기 | 57 | 52 | 4 | 1 |
| `as` 단언 | 52 | 34 | 4 | 14 |
| 중첩 삼항 | 28 | 28 | 0 | 0 |
| 루프가 조건으로 빠져나가기 | 22 | 9 | 9 | 4 |
| `let` 다시 넣기 | 19 | 8 | 6 | 5 |
| `useEffect`가 값을 끌어내기 | 14 | 14 | 0 | 0 |
| `switch` | 10 | 10 | 0 | 0 |

`as const` 134는 세었으나 **고칠 자리가 아니다** — 리터럴을 고정하는 올바른 쓰임이고 84가 `consts` 세그먼트에 산다.

**`scripts/`와 edge function은 이 제안 밖이다.** 전자는 빌드 도구라 한 번 돌고 끝이고, 후자는 `supabase/functions`로 따로 배포되는 다른 실행 환경이다. 아래 묶음은 전부 `src`를 든다.

## 깨끗한 축 둘

**제자리 변이가 0건이다.** 받은 배열을 고치는 `sort`·`splice`·`reverse`를 찾아 다섯이 걸렸는데 **다섯 다 `.filter`나 `.map` 뒤**였다 — 그 둘이 이미 새 배열을 내므로 뒤의 `sort`가 남의 것을 안 건드린다. TanStack Query의 캐시 배열을 제자리에서 정렬하는 자리가 없다.

**`switch` 열이 전부 올바르다.** 열이 `features/payrollCompute/model/period.policy.ts`의 아홉과 `features/rehearsalEdit/model/addSheetState.reducer.ts`의 하나고, 모두 판별 union의 필드를 가른다. `model`에만 살아 층도 맞는다.

## 묶음

### 묶음 1 — 조각이 묻는 세 질문과 답하는 세 분기

**가장 큰 자리고 42군데다.** controller 21개가 똑같은 질문 셋을 각자 쓰고, 짝 `.tsx` 21개가 똑같은 분기 셋을 각자 쓴다.

controller 쪽이 이 꼴이다.

```ts
const { data, error } = useMonthAvailabilitiesQuery(supabase, month);
const applications = data ?? [];

if (error !== null) return { state: "failed" };
if (data === undefined) return { state: "pending" };
if (applications.length === 0) return { state: "empty" };

return { state: "ready", tab, dateGroups: … };
```

`.tsx` 쪽이 이 꼴이다.

```tsx
if (fragment.state === "pending") return pending ?? null;
if (fragment.state === "failed") return failed ?? null;
if (fragment.state === "empty") return empty ?? null;

return <>{fragment.rows.map(…)}</>;
```

**다른 것은 마지막 가지뿐이다.** 앞의 셋은 스물한 자리에서 글자까지 같다.

가지에 붙는 값의 차이가 작고 규칙적이다 — 13은 맨 가지, 7은 `failed`에 `retry`, 1은 `empty`에 `reason`이다. 질의 수는 17이 하나, 2가 둘, 2가 셋이다. ADR-016의 「가지를 늘리고 싶은 것은 대개 상태가 아니라 그 가지의 데이터다」가 이 차이를 이미 설명한다.

가지 수로는 둘로 갈린다 — `empty`를 드는 것 14개와 안 드는 것 7개다.

**빠짐을 막는 검사가 저장소에 0건이다.** 생성된 DB 타입 밖에 `never`로 막은 자리가 없다. 나란한 `if`로 가르면 가지가 늘 때 **마지막 `return`이 조용히 받는다.** ADR-016이 쓰기 조각의 `sending`을 이미 박아뒀으니 그 가지가 서는 날 스물한 자리가 전부 그 길로 떨어진다. `ready`가 데이터를 들어 타입이 대개 잡지만, 데이터 없는 가지를 더하면 안 잡는다.

**정본에서 떨어진 자리가 하나 있다.** `screens/payroll/hooks/usePayrollScreen.ts:74`가 같은 질문 넷을 **4겹 삼항**으로 묻고, 타입이 판별 union이 아니라 **납작한 글자 union**이며, 이름이 `pending`이 아니라 **`loading`**이다. ADR-016이 그 이름을 고치고 그 꼴을 버린 뒤에 남은 자리다.

### 묶음 2 — 손으로 쌓는 루프

`src`에 35군데고 `utils` 16 · `model` 10 · `hooks` 5 · `api` 2 · `ui` 2다.

```ts
const counts: Record<string, number> = {};
for (const slot of slots) {
  counts[slot.workDate] = (counts[slot.workDate] ?? 0) + 1;
}
```

**하는 일이 이름에 안 나온다.** 읽는 사람이 본문을 따라가야 「날짜마다 센다」를 안다. 하는 일은 일곱 가운데 하나다 — 골라내기·바꾸기·키마다 하나 꽂기·키마다 쌓기·세기·합치기·납작하게다.

**같은 저장소에 선언형 이웃이 산다.** `features/stats/utils/personDays.utils.ts:32`가 `new Map(days.map((day) => [day.id, day]))`로 같은 일을 한 줄에 한다. 두 꼴이 공존하는 자리가 먼저 고칠 곳이다.

이 축은 지난 회차에 **공용 함수로 뽑으려다 뺐다** — 꼴마다 자리가 한둘이라 증축 문턱 셋에 못 미쳤다. **뽑기와 고치기는 다르다.** 뽑는 데는 셋이 필요하지만 명령형을 선언형으로 **그 자리에서** 바꾸는 데는 한 자리로 족하다.

### 묶음 3 — 중첩 삼항

28군데고 `hooks` 23 · `ui` 5다. 4겹 하나, 3겹 일곱, 2겹 스물이다.

4겹은 묶음 1의 `usePayrollScreen`이라 거기서 같이 간다. 3겹 일곱이 이 묶음의 본체다.

**겹친 삼항은 조건과 결과의 짝이 눈에 안 보인다.** 들여쓰기가 짝을 말하지 않아 한 가지를 고칠 때 옆 가지의 괄호를 건드린다. 같은 입력을 여러 번 보고 값을 고르는 자리면 표가 그 짝을 눈에 보이게 한다.

### 묶음 4 — `as` 단언을 가드로

`src`에 34군데고 일반 `as` 30과 `as unknown as` 4다. 세그먼트로는 `utils` 9 · `ui` 5 · `api` 4 · `model` 4 · `services` 3 · `hooks` 3 · `lib` 1 · `config` 1이다.

**이미 backlog에 `as-assertions-to-guards`로 서 있다.** 그 행이 센 열셋보다 실제가 많다 — 그 셈이 `grep` 한 줄 출력에 걸렸다. 이 제안이 그 행의 수를 고친다.

가장 나쁜 자리가 둘이다. `shared/utils/theme.utils.ts:5`가 한 줄에 둘을 쓰고, `shared/ui/Illustration.tsx`가 `as unknown as`로 두 번 건너뛴다.

**선례가 있다.** `entities/member/api/getQualifications.api.ts:9`가 `function isFilled(row): row is FilledQualificationRow`를 세우고 `.filter(isFilled)`로 넘긴다.

**가드가 틀린 손인 자리를 따로 가른다.** 글자 union을 `includes`로 좁히려면 가드 안에서 `as`가 필요해져 수가 안 줄고 자리만 늘어난다. `Illustration.tsx`의 둘도 webpack이 내는 꼴이라 좁힐 조건을 쓸 수 없다.

### 묶음 5 — `useEffect`가 값을 끌어내는 자리

14군데고 `hooks` 13 · `app` 3 · `ui` 1이다. 통신·구독·타이머·네이티브 호출은 센 것에서 뺐다 — 거기는 부작용이 맞는 자리다.

```ts
useEffect(() => {
  setValues(seeded);
  setFrozen(frozen);
  setEverSubmitted(submitted);
  setSeeded(true);
}, [seeded, frozen, submitted]);
```

**한 번 그린 뒤에 다시 그린다.** 다른 상태에서 끌어낼 수 있는 값을 `useEffect`로 넣으면 첫 그림이 옛 값으로 나가고 그다음에 고쳐진다. `screens/pending/hooks/usePendingScreen.ts`가 넷으로 가장 많고 `screens/qr/hooks/useQrScreen.ts`가 둘이다.

### 묶음 6 — 지금 React 버전이 주는 손을 쓴다

`react`가 **19.2.3**이고 `useEffectEvent`·`use`·`useOptimistic`·`useActionState`를 내보낸다. 그 가운데 **이 앱에 맞는 것이 셋이다.**

**`useEffectEvent`가 가장 크다.** 부작용이 「최신 값을 읽어야 하지만 그 값이 바뀌었다고 다시 걸리면 안 되는」 자리를 위한 손이다.

```ts
export function FloatingToast({ kind, message, onDone }: FloatingToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, TOAST_STAY_MS);
    return () => clearTimeout(timer);
  }, [message, onDone]);
```

`onDone`이 의존 배열에 있어 **그 함수의 정체가 바뀌면 2400ms 타이머가 처음부터 다시 돈다.** 지금 안 터지는 까닭은 `shared/hooks/useToast.ts`가 `dismissToast`를 `useCallback(…, [])`로 감쌌기 때문이다 — **보장이 그 효과에서 멀리 떨어진 다른 파일에 산다.** 누가 그 `useCallback`을 걷으면 토스트가 안 사라지고, 걷은 자리에서는 아무것도 안 깨진다.

`shared/hooks/useHardwareBack.ts`도 같은 꼴이다. `onBack`이 의존 배열에 있어 **그 정체가 바뀔 때마다 리스너를 떼고 다시 건다.**

**이것이 `useCallback` 259개의 한 몫이다.** 그 가운데 상당수가 계산을 아끼려는 것이 아니라 **자식의 의존 배열을 안정시키려고** 있다. `useEffectEvent`는 그 이유를 없앤다.

**`use(Context)`가 한 자리다.** `shared/stores/drag.context.ts`가 `useContext`를 쓰는 유일한 곳이다. 문턱에 못 미치지만 그 파일을 건드릴 때 같이 간다.

**`useReducer`는 집이 이미 있고 갈 자리를 셌다.** [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)가 `model/<이름>.reducer.ts`를 그 자리로 두고 가름을 「`useReducer`를 타느냐」로 박았다. 선례가 `features/rehearsalEdit/model/addSheetState.reducer.ts` 하나다.

한 손이 `setState`를 둘 이상 부르는 자리를 AST로 전수 세니 **파일 열다섯에 서른둘이다.** 그 가운데 **넷만 간다.**

| 파일 | `useState` | 한 손이 둘 이상 | 왜 가나 |
| --- | --- | --- | --- |
| `screens/scheduleAdmin/hooks/useDayDetail.ts` | **12** | 9 | `closePicker`가 다섯을 되돌린다. 「고르는 창이 닫혔다」 하나가 변수 다섯이고 뒤의 넷은 **창이 열렸을 때만 뜻이 있다** |
| `screens/pending/hooks/usePendingScreen.ts` | 9 | 3 | 한 `useEffect`가 넷을 넣는다(`setValues`·`setFrozen`·`setEverSubmitted`·`setSeeded`). 묶음 5와 같은 파일이다 |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts` | 7 | 4 | `setOpenDate` + `setCancelling`이 네 자리에서 같이 움직인다 |
| `screens/rehearsal/hooks/useRehearsalScreen.ts` | 5 | 2 | 한 손이 넷을 되돌린다(`setMonth`·`setOpenDate`·`setOpenForm`·`setPickerYear`) |

**나머지 열하나는 안 간다.** 상태 둘이 같이 뒤집히는 꼴(`setPicking` + `setPickFailed`·`setMenuOpen` + `setFace`·`setAnswered` + `setOpen`)이 그 대부분이고, 그 둘은 **서로 모순되는 조합이 없어** reducer와 action 유니언을 세우는 값이 없다. `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts`는 `setSheetState`가 이미 판별 union이라 절반이 돼 있고 `shared/ui/DragProvider.tsx`는 ADR-001이 허용하는 측정값 자리다.

**가름은 「있을 수 없는 조합이 타입에 남나」다.** 중간 그림이 아니다 — React는 한 손 안의 `setState` 여럿을 묶어 한 번만 그린다. 얻는 둘은 전이가 순수 함수라 **테스트가 `dispatch` 없이 서는 것**과 「무엇이 같이 바뀌나」가 **한 자리에 사는 것**이다.

**안 쓰는 것 넷과 까닭이다.**

| 손 | 왜 안 쓰나 |
| --- | --- |
| `useActionState`·`useFormStatus` | 웹 `<form>`의 action을 위한 손이다. React Native에 그 action이 없다. `react-dom`이 의존에 있는 것은 Expo web 때문이고 이 앱의 화면은 그 길로 안 그려진다 |
| `useOptimistic` | TanStack Query가 이미 mutation의 상태를 든다 — service 42개가 `onMutate`와 `onSuccess`를 쓰고 규칙 41이 그 뒤처리 꼴을 박았다. 한 mutation에 낙관 갱신 체계를 둘 두면 되돌리기가 어느 쪽 몫인지 모른다 |
| `useDeferredValue`·`useTransition` | 성능을 바꾸는 손이고 **느리다는 측정이 없다.** 측정 없이 넣으면 무엇이 좋아졌는지 말할 수 없다 |
| 고차 컴포넌트(HOC) | 저장소에 0건이다. 조각을 감싸는 일은 `shared/ui/FragmentView.tsx`가 **children 함수를 받는 컴포넌트**로 이미 푼다 — HOC로 바꾸면 props 계약이 안 보이고 지금 맞아떨어진 타입 추론이 깨진다. ADR-015의 고정 세그먼트에 「컴포넌트를 내는 함수」의 자리도 없다 |

**고차 함수(HOF)는 이미 가고 있는 방향이다.** 묶음 1의 `fragmentOf(read, { empty, ready, failed })`와 묶음 2의 `groupBy(items, keyOf)`가 함수를 받는 함수다. 묶음 4에 한 자리가 더 있다 — **가드를 만드는 손**이다. 글자 union을 `includes`로 좁히려면 가드 안에서 `as`가 필요해지는데, `memberOf(THEMES)` 하나가 그 `as`를 **한 자리에 가두면** 열세 자리에 흩어지지 않는다.

## 순서와 왜 그 순서인가

**묶음 1이 먼저다.** 42자리를 건드리고 그 자리가 다른 묶음의 대상과 겹친다 — 묶음 3의 4겹 삼항이 거기 살고, 묶음 2의 `hooks` 5자리와 묶음 5의 `hooks` 13자리가 같은 controller 파일에 산다. 1을 뒤로 미루면 그 파일들을 두 번 고친다.

**묶음 2와 4는 서로 안 겹쳐 같이 간다.** 전자는 `utils`·`model`, 후자는 흩어져 있지만 바꾸는 줄이 다르다.

**묶음 3과 5가 마지막이다.** 둘 다 `hooks`에 몰려 있어 묶음 1이 그 파일을 정리한 뒤가 싸다.

**묶음 6은 묶음 5와 붙는다.** `useEffectEvent`가 걷는 것이 의존 배열이고 묶음 5가 걷는 것이 그 배열에 매달린 `setState`다 — 같은 파일을 두 번 열지 않는다. `useReducer`도 거기서 쓴다.

## 리스크

**공용 손이 스물한 자리에 다 맞지 않을 수 있다.** 가지에 붙는 값이 셋으로 갈리고(맨 가지·`retry`·`reason`) 질의 수가 1에서 3까지다. 억지로 한 꼴에 맞추면 호출부가 쓰지 않는 인자를 넘기게 된다. **묶음 1의 계획이 스물한 자리를 다 열어 보고 공용 손의 입구를 정한다** — 열넷에만 맞으면 열넷만 간다.

**규칙 3이 자리를 정한다.** 공용 손은 `shared`에 서야 `entities`와 `features`가 같이 당긴다. `fragmentOf`는 순수 함수라 `shared/utils`, `.tsx`의 분기를 받는 것은 컴포넌트라 `shared/ui`다.

**묶음 2에서 뜻이 달라질 자리가 있다.** 루프 안에서 밖의 값을 읽거나 순서가 결과를 바꾸는 자리는 `reduce`로 옮길 때 같은 순서를 지켜야 한다. 계획이 그 자리를 따로 센다.

**묶음 5가 동작을 바꾼다.** `useEffect`를 걷으면 그리는 횟수가 줄어 보이는 것이 달라질 수 있다. 짝 테스트가 중간 상태를 단언하면 그 단언이 대상을 잃는다 — 지우기 전에 그 단언이 무엇을 지키는지 본다.

## 셈의 근거

전수는 `grep`이 아니라 TypeScript AST로 돌렸다. **`grep`은 맞는 줄 하나만 출력해서 여러 줄 꼴이 안 보인다** — 나란한 `if` 사슬과 중첩 삼항과 여러 줄 `import` 블록이 그것이다. 지난 회차에 그 탓에 셈이 다섯 번 틀렸다.

처음 센 값 둘이 틀려 고쳤다. 나란한 `if`가 0으로 났는데 **`else if` 사슬만 찾고 있었다** — 이 저장소의 꼴은 `else`가 없는 나란한 `if`다. `useEffect`는 `setTimeout`·`setInterval`이 `set[A-Z]` 꼴에 걸려 넷이 많게 났다.
