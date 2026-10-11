# 중첩 삼항 스물셋이 꼴마다 다른 손으로 간다

중첩 삼항을 AST로 전수 세고 **스물셋을 전부 열었다.** 깊이가 축이 아니었다 — **묻는 질문**이 축이고 꼴이 여섯으로 갈린다. 「표로 바꾼다」가 맞는 자리는 그중 일부고, **둘은 이미 올바라 안 건드린다.**

## 입력 명세·기준

정본은 [제안](../../proposals/declarative-refactor-triage.md)의 묶음 3에서 [`list-state-follows-fragments`](list-state-follows-fragments.md)가 가져간 뒤 남는 몫이다. 그 task가 깊은 삼항 **다섯**을 없앴다(4겹 하나와 3겹 넷) — 상태 모양을 고치니 식이 설 자리가 없어진 것이다.

**남은 자리가 스물셋이다** — 3겹 4 · 2겹 19고 `hooks` 19 · `ui` 4다.

## 꼴 여섯과 자리

| 꼴 | 자리 | 맞는 손 |
| --- | --- | --- |
| **글자 키로 고르기** | 4 | `Record<키, 값>` 표 |
| **첫 일치가 이긴다** | 6 | 조건·값 짝의 목록, 또는 묶어 한 손으로 |
| **태그 붙은 값 만들기** | 3 | `.policy.ts`의 함수 |
| **가드 사슬** | 3 | 이른 `return` |
| **판정** | 2 | `model`로 내린다 |
| **JSX 분기** | 2 | 조각 고르는 표 |
| **이미 올바르다** | 3 | **안 건드린다** |

### 글자 키로 고르기 — 넷. 표가 맞는 유일한 꼴

조건이 **한 변수가 어느 값인지**만 묻는다. `Record`가 그 모양 그대로다.

| 자리 | 키 |
| --- | --- |
| `screens/stats/hooks/useStatsScreen.ts:115` | `tab` — 어느 질의를 로딩 추적에 넣나 |
| 같은 파일 `:173` | `tab` — 어느 함수로 차트값을 만드나 |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:280` | `state` — 어느 몸통을 그리나 |
| 같은 파일 `:288` | `state` — 그 위에 무엇을 알리나 |

**선례가 같은 파일에 이미 섰다.** [`list-state-follows-fragments`](list-state-follows-fragments.md)가 `useStatsScreen`에 `Record<StatsTab, string>` 표를 세워 `trendValueLabel`의 3겹 삼항을 지웠다. 같은 꼴로 간다.

**`:173`은 표의 값이 함수 호출이다.** 세 함수가 **읽는 값이 다르다**(`attendance.data`·`work.data`·`payrollLoaded`와 `rehearsal.data`) — 표를 값으로 만들면 **세 호출이 다 일어난다.** 표의 값을 **함수로** 두고 `tab`으로 고른 뒤 한 번만 부른다.

**`useScheduleWorkerScreen`의 280과 288은 합치지 않는다.** 같은 `state`를 읽지만 **묻는 것이 다르다** — 280은 「무엇을 그리나」고 288은 「그 위에 무엇을 알리나」다. 표 둘이 맞다.

### 첫 일치가 이긴다 — 여섯. 셋은 한 손으로 묶는다

| 자리 | 묻는 것 |
| --- | --- |
| `features/memberAdmin/hooks/useMemberSheet.ts:115` | 시트 본문을 어느 모양으로 |
| 같은 파일 `:121` | 시트 바닥을 어느 모양으로 |
| 같은 파일 `:234` | 메뉴 버튼 라벨이 무엇 |
| `features/scheduleConfirm/hooks/useConfirmSheet.ts:41` | 시트의 얼굴이 무엇 |
| `shared/ui/Input.tsx:41` | 테두리 빛깔이 무엇 |
| `screens/pending/hooks/usePendingScreen.ts:164` | 지금 어느 단계인가 |

**`useMemberSheet`의 셋이 같은 세 값을 읽는다** — `renaming`·`erased`·`left`다. 셋이 각자 묻는 대신 **한 손이 셋을 함께 낸다.**

```ts
memberSheetVisuals({ renaming, erased, left }): { body; footer; menuLabel }
```

**순서가 뜻에 들어오는 자리가 둘이다.** `:115`는 `renaming`이 `erased`보다 **이기고** `:121`은 `renaming`이 `left`보다 이긴다. 조건이 동시에 참일 수 있어 **그 우선순위를 손이 지켜야 하고 짝 테스트가 박아야 한다.**

**`Input.tsx:41`은 `.tsx`에 있는데 남아도 된다.** `error`와 `focused`로 테두리 class를 고르는 것은 **UI를 담당하는 로직**이다. 다만 **첫 일치가 이기는 꼴을 선언형으로 적는 것**은 그 자리에서도 읽기가 낫다.

**`usePendingScreen:164`는 상태 모양 때문에 서 있다.** `override`가 제출 직후 임시 단계를 보여주려고 존재한다 — 그 식은 「`override`가 있으면 그것, 없으면 계산」이다. **`effect-derived-values`가 그 파일의 `useState` 아홉을 볼 때 같이 본다** — 여기서는 안 건드리고 그 task로 넘긴다.

### 태그 붙은 값 만들기 — 셋. `.policy.ts`로 내린다

갈래마다 **객체 모양이 다르다.** 표가 안 맞고 함수가 맞는다.

| 자리 | 내는 것 |
| --- | --- |
| `screens/rehearsal/hooks/useRehearsalScreen.ts:142` | `null` · `{ mode: "add", … }` · `{ mode: "edit", rehearsal }` |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:257` | `null` · `{ kind: "request", … }` · `{ kind: "cancel", … }` · `{ kind: "roster", … }` |
| `screens/adminHome/hooks/useAdminHomeScreen.ts:140` | `{ state: "not_created", … }` · `{ state: "confirmed", … }` · 그밖 |

**ADR-015가 「전이와 판정」을 `model`로 보낸다.** 셋 다 「어느 모양을 만들 수 있나」를 판정하니 그 자리다. **`model`로 옮기면 규칙 3에 걸리는지 구현이 확인한다** — `screens`가 자기 `model`을 쓰는 것은 안전하다.

### 가드 사슬 — 셋. 이른 `return`이 맞는다

**여러 값이 널이 아니어야 결과를 만들 수 있고 깊이가 다른 자리에서 널로 빠진다.** 표가 구조적으로 안 맞는다.

| 자리 | 빠지는 자리 |
| --- | --- |
| `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts:347` | `listState !== "ready" \|\| picking`에서 하나, `deadline === null`에서 또 하나 |
| `screens/wages/hooks/useWagesScreen.ts:116` | `target === null`에서 하나, `chosen === null`에서 또 하나 |
| `screens/scheduleAdmin/ui/ScheduleCalendarMonth.tsx:15` | JSX 안의 사슬 |

**함수로 뽑아 이른 `return`으로 적는다.** 삼항을 유지하면서 「선언형」이라 부르는 것보다, **빠질 조건을 위에서 하나씩 걷는 것**이 그 뜻이다.

### 판정 — 둘. `model`로 내린다

| 자리 | 묻는 것 |
| --- | --- |
| `entities/member/hooks/useMemberRows.ts:96` | 빈 이유가 `noMembers`냐 `noMatch`냐 `noRows`냐 |
| `features/memberAdmin/hooks/useMemberSheet.ts:208` | 거부 이유가 `blocked`냐 `last-admin`냐 없나 |

**둘 다 「어느 경우인가」를 가려 이름 하나를 낸다** — ADR-015가 `model`로 보내는 꼴이다. `useMemberRows:96`은 바로 아래에서 `fragmentOf([active, left], …)`에 그 이유를 넘긴다.

### JSX 분기 — 둘

| 자리 | 꼴 |
| --- | --- |
| `screens/members/ui/MembersScreen.tsx:36` | `reason === "noMembers" ? <A/> : reason === "noMatch" ? <B/> : <C/>` |
| `screens/pending/ui/PendingForm.tsx:71` | `submitFailed ? <실패 문안/> : canSubmit ? null : <힌트 문안/>` |

**`MembersScreen.tsx:36`은 글자 키로 고르기의 JSX판이다** — `Record<EmptyReason, ReactNode>`가 그 모양이다.

**`PendingForm.tsx:71`은 위반이 아니다.** `screen.submitFailed`는 `.tsx`가 **들고 있는 상태가 아니라 controller가 준 prop**이다 — 규칙이 막는 것은 `.tsx`의 `useState`고, **prop으로 받은 상태로 그림을 고르는 것은 ADR-016이 설계한 꼴**이다(`FragmentView`가 바로 그 일을 한다). 꼴만 읽기 좋게 고친다.

### 이미 올바른 셋 — 안 건드린다

| 자리 | 왜 |
| --- | --- |
| `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts:340` | **[`list-state-follows-fragments`](list-state-follows-fragments.md)가 세운 판별 union이다.** `fragmentOf`가 `failed` 가지를 강제해서 손으로 세운 자리고, 2겹 삼항 하나가 남는 것이 맞다 |
| `screens/wages/hooks/useWagesScreen.ts:91` | 같다 |
| `screens/stats/hooks/useStatsScreen.ts:198` | **이미 갈라져 있다.** `fragmentOf`의 `empty` 콜백이 그 식을 받는다 |

## 완료 조건

- **AC-01** 글자 키로 고르는 넷이 `Record` 표를 쓴다. **`:173`의 표는 값이 함수고 한 번만 불린다** — 세 호출이 다 일어나지 않는 것을 짝 테스트가 박는다
- **AC-02** `useMemberSheet`의 셋이 한 손으로 묶인다. **`renaming`이 `erased`와 `left`를 이기는 우선순위를 짝 테스트가 박는다**
- **AC-03** 태그 붙은 값 셋이 `model`의 `.policy.ts`에 산다
- **AC-04** 가드 사슬 셋이 이른 `return`으로 바뀐다
- **AC-05** 판정 둘이 `model`에 산다
- **AC-06** JSX 분기 둘이 표나 그에 준하는 꼴이 된다
- **AC-07** **이미 올바른 셋이 안 바뀐다.** 그 자리의 짝 테스트 단언이 하나도 안 바뀐다
- **AC-08** 2겹 넘는 중첩 삼항이 **`src`에 셋 이하로** 남는다 — AC-07의 셋이다
- **AC-09** 옮긴 자리의 짝 테스트가 **지키던 것을 잃지 않는다.** 지운 단언이 있으면 왜 아무것도 안 지키는지 적는다
- **AC-10** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 글자 키 넷을 표로 — 선례가 같은 파일에 있어 가장 싸다
2. `useMemberSheet`의 셋을 한 손으로. **우선순위 단언을 먼저 세운다**
3. 판정 둘과 태그 붙은 값 셋을 `model`로 내린다
4. 가드 사슬 셋을 이른 `return`으로
5. JSX 분기 둘
6. 검증하고 PR을 연다

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다. `.tsx`를 건드리니 **`components` 프로젝트를 반드시 돌린다** — `Input.tsx`는 거의 모든 폼이 쓴다.

**전체 실행에서 `services`의 query 테스트가 간헐적으로 `waitFor` 타임아웃을 낸다**([관찰 069](../../observations/069-query-service-tests-flake-under-full-suite.md)). 따로 돌려 가린다.

## 리스크

**`:173`의 표가 세 호출을 다 일으킬 수 있다.** 지금은 삼항이라 **고른 가지만 실행된다.** `Record<Tab, Values>`로 적으면 세 함수가 다 불린다 — `Record<Tab, () => Values>`로 두고 고른 뒤 부른다. **그 질의 데이터가 `undefined`일 때 안 터지는지도 본다.**

**`useMemberSheet`을 묶으면 호출부가 바뀐다.** 지금 `body`·`footer`·`menuLabel` 셋이 각자 서 있어 그 파일의 반환 객체가 셋을 따로 든다. 한 손으로 묶어도 **반환 객체의 모양은 그대로 둔다** — 짝 테스트가 그 셋을 각자 읽는다.

**`model`로 옮기면 규칙 3에 걸릴 수 있다.** `screens`가 자기 `model`을 쓰는 것은 안전하고 `features/memberAdmin`도 자기 `model`이라 안전하다. **`useMemberRows:96`은 `entities/member`에서 자기 `model`로 가는 것**이라 역시 안전하다. 그래도 **옮긴 뒤 `pnpm lint`가 판정한다** — 걸리면 억지로 우회하지 않고 그 자리를 안 옮기고 보고한다.
