# ADR-016 — 조각이 자기 데이터를 들고 화면은 경계만 든다

[ADR-015](ADR-015-read-write-layers-and-fixed-segments.md)의 「`ui`가 사는 네 자리」 절을 대체한다. 그 문서의 나머지(층의 뜻, 세그먼트 열, 역할 넷, 파일 이름, 「`.tsx`는 조립만 한다」)는 그대로 산다.

## 결정

**조각은 자기 데이터를 부른다.** `entities/<도메인>/ui`가 그 도메인의 query를, `features/<use case>/ui`가 그 use case의 mutation을 부른다. 「통신하지 않는다」를 기준에서 뺀다.

**조각마다 controller를 둔다.** `hooks/use<조각>.ts`가 그 조각의 값을 완성해 준다. 화면 controller와 같은 꼴이고, 화면도 조각의 하나다.

**화면은 경계를 든다.** `shared/ui/QueryBoundary`가 `Suspense`와 ErrorBoundary와 `QueryErrorResetBoundary`를 묶고, 화면이 그것으로 조각을 감싼다. 조각 자신은 「다 불러왔나」를 묻지 않는다.

**`screens/<슬라이스>/ui`에 남는 것은 그 화면의 뼈다.** 앱바와 바닥 버튼, 상태마다의 자리, 시트 고르는 자리다. 도메인을 아는 조각은 올라간다.

**`features` 여럿을 맞추는 조각도 거기 남는다.** `screens`만 `features` 여럿을 당길 수 있다 — 규칙 3이 같은 층 슬라이스끼리를 막는다. 시트 고르는 자리가 그 꼴이다: `DayDetailSheetBody`가 다섯을, `ScheduleAdminSheetBody`가 셋을 꽂는다. 뼈의 뜻이 「생김새뿐」이 아니라 「위층에서만 할 수 있는 조립」까지다.

**먼저 물을 것은 「그 슬라이스에 service가 있나」다.** 조각이 당기는 계산이 `features/<슬라이스>/model`에 살고 그 슬라이스에 query가 없으면, 못 올라가는 것이 아니라 **올라갈 자리를 아직 안 만든 것이다.** 규칙 28이 「`features`의 읽기 service는 `entities` 도메인 둘 이상을 맞출 때 선다」고 허락하니 그 자리에 composing read를 세우고 조각을 그 슬라이스의 `ui`로 보낸다.

`features/payrollCompute`가 그 꼴이었다 — `payrollViewDays`가 `attendance`·`payroll`·`rehearsal`·`schedule` 넷을 맞추는데 `services/`가 비어 있어서 급여 조각 넷이 `screens`에 묶여 있었다. `entities/payroll`로 내리는 길은 막혀 있다(규칙 3이 `attendance`를, `no-restricted-imports`가 `features` 쪽을 막고 `import type`도 막는다) — 올라갈 자리는 `features/payrollCompute` 자신이다.

## 왜 지금

[#511](https://github.com/tkyoun0421/la-bie-belle/pull/511)과 [#512](https://github.com/tkyoun0421/la-bie-belle/pull/512)가 `.tsx`를 조립만 하게 만들면서 조각 수가 51에서 97로 늘었다. 늘어난 것은 좋은데 전부 `screens/*/ui`에 쌓였다.

그래서 화면 controller가 커졌다. `useScheduleAdminScreen`이 698줄에 service 스물여섯(query 9 · mutation 17)을 든다. 조각 열다섯이 그 한 controller가 완성한 값을 받아 그린다 — 조각은 가벼워졌지만 무게가 사라진 게 아니라 한 자리로 모였다.

**그 자리는 오케스트레이션 레이어여야 한다.** 조각을 배치하고 경계를 긋는 자리고, 스물여섯 service를 직접 부르는 자리가 아니다.

## 기준이 이미 거짓이었다

ADR-015는 「`features/*/ui`만 service를 부를 수 있다」고 적었다. 그 자리의 유일한 조각이 그렇지 않았다.

`features/availabilitySubmit/ui/DeadlineSheet.tsx`는 `shared/ui` 컴포넌트만 당기고 props 여덟(`deadline`·`today`·`canSave`·`saving`·`failed`·`onChange`·`onClose`·`onSave`)을 받는다. **service를 하나도 부르지 않는다.** 그 조각이 거기 사는 까닭은 「마감일을 보내는 일」이라는 주제이고, 실제로 일하던 기준은 무엇을 부르나가 아니라 무엇에 관한 것이냐였다.

같은 절의 「`entities/*/ui`가 지금 0인 것은 정상이다」도 그 기준에 매달려 있었다. 「도메인 타입을 props로 받고 통신하지 않는」 조각은 자립하지 못한다 — 부르는 쪽이 값을 들고 와야 하니 두 번째 화면이 쓰려면 그 화면 controller가 같은 query를 또 부르고 같은 props를 또 엮는다. 재사용이 안 되는 자리라 아무것도 올라가지 않은 것이고, 0은 정상이 아니라 기준이 그 자리를 못 쓰게 만든 결과다.

## 자리 넷의 새 기준

| 자리 | 기준 |
| --- | --- |
| `shared/ui` | 도메인을 **모른다.** props가 원시 타입이거나 자기가 선언한 타입 |
| `entities/<도메인>/ui` | **그 도메인을 읽어 보여준다.** 자기 슬라이스의 query를 부른다 |
| `features/<use case>/ui` | **그 use case를 실행한다.** 자기 슬라이스의 mutation을 부르거나, 도메인을 가로질러 읽는다 |
| `screens/<슬라이스>/ui` | **그 화면의 뼈.** 앱바·바닥 버튼·상태마다의 자리·시트 고르는 자리·경계 |

가름의 축은 **무엇을 아는가**다. 도메인을 모르면 `shared`, 도메인 하나를 읽으면 `entities`, 바꾸거나 **도메인 여럿을 맞추면** `features`, 화면의 생김새면 `screens`다.

**도메인 여럿을 맞추는 읽기 조각은 `features`에 산다.** [ADR-015](ADR-015-read-write-layers-and-fixed-segments.md)의 「도메인 둘 이상을 읽는 것은 읽기라도 `features`에 산다」가 그대로 적용된다 — `entities` 슬라이스는 도메인 하나고 같은 층 슬라이스끼리 서로를 못 부른다. 통계 조각이 그 자리다: `features/stats`에 mutation이 하나도 없지만 근무·근태·급여를 합쳐 읽으니 `entities`에 앉을 데가 없고, 그 조각들도 `features/stats/ui`로 간다.

`entities`가 query를 부르고 `features`가 mutation을 부르는 것은 ADR-015가 세운 층의 뜻 그대로다 — 조각이 그 층에 살면 그 층이 하는 일을 한다.

## 라우팅은 올라가지 않는다

조각이 query를 부르되 **갈 데는 받는다.** `onPress`를 props로 받고 자기가 `useRouter`를 들지 않는다.

까닭은 두 가지다. 같은 조각이 화면마다 다른 데로 보내고(알림 한 줄은 근무표에서 눌리면 그 날로, 급여에서 눌리면 명세로 간다), 경로를 아는 것은 그 화면이 어디 사는지를 아는 것이라 `src/app/` 바깥의 조각이 알 수 있는 것이 아니다.

[ADR-015](ADR-015-read-write-layers-and-fixed-segments.md)의 「갈 데를 controller가 정한다」는 그대로 산다. 조각의 controller는 그 조각 안의 값을 완성하고, 경로는 화면 controller에서 내려온다.

## 상태마다의 그림은 조각이 받는다

조각이 자기 query를 부르면 「기다리는 중」·「실패」·「비었다」가 조각 안에서 갈린다. 그 그림까지 조각이 가지면 화면 문안이 도메인 층으로 올라가고, 화면에 두면 조각이 상태를 못 쓴다.

**조각이 상태 기계를 들고 그림을 `ReactNode`로 받는다.** `loading`·`failed`·`empty`를 props로 받아 자기 상태 이름으로 고른다 — `QueryBoundary`의 `loading=`·`failed=`와 같은 꼴이다. query는 화면을 떠나고 `<화면>Loading`·`Empty`·`Failed`는 `screens/<슬라이스>/ui`에 남는다.

**그래서 목록을 고르는 자리가 뼈가 아닐 수 있다.** 상태로 조각을 고르던 `ApplicationsList`·`ApprovalsList`는 그 판정이 조각 안으로 들어가 올라갔다. 가름은 **고르는 조각들이 한 슬라이스에 사나**다 — `StatsList`는 탭마다 다른 슬라이스(`features/stats`와 `features/payrollCompute`)의 조각을 고르니 올라갈 자리가 없고, `ProfileSettings`는 라우팅 줄과 시트를 꽂아 도메인을 모른다.

## 조각이 controller를 받는 꼴

조각은 `screen: <화면>Controller`를 통째로 받거나 props를 하나씩 받는다. 가름은 **그 화면 밖에서 쓰일 수 있나**다.

통째로 받으면 그 조각은 그 화면에 묶인다 — `screens/*/ui`에 사는 조각의 꼴이다. 하나씩 받으면 다른 화면도 같은 props를 채워 쓸 수 있다 — 올라갈 조각의 꼴이다. 받는 모양이 그 조각이 어디까지 갈 수 있는지를 정한다.

## 기다리는 일은 경계가 든다

조각이 자기 query를 부르면 「다 불러왔나」가 조각마다 생긴다. 그것을 조각마다 그리면 한 화면에 스켈리톤이 여럿 뜨고 각자 다른 시각에 채워져 화면이 들썩거린다.

그래서 `useSuspenseQuery`로 받고 화면이 경계를 긋는다. 조각의 controller에는 `isPending`·`isError` 분기가 없고, 「기다리는 중」과 「실패」는 경계가 그린다. **어디에 경계를 두느냐가 그 화면의 설계 결정이 된다** — 함께 채워질 조각들을 한 경계에 묶는다.

`shared/ui/QueryBoundary`가 그 자리다.

```tsx
<QueryBoundary
  loading={<UnreadCountLoading />}
  failed={(retry) => <UnreadCountFailed onRetry={retry} />}
>
  <UnreadCountLine />
</QueryBoundary>
```

`QueryErrorResetBoundary`가 안에 있어서 `retry`가 ErrorBoundary만 되돌리지 않고 쿼리의 에러 상태까지 되돌린다. 그것이 없으면 다시 그려도 같은 에러가 바로 또 던져진다.

**지금은 `useQuery`로 간다.** 실기기 확인이 조건인데 그 확인을 못 했다 — 맥과 기기가 같은 네트워크에 없고 시뮬레이터도 없다. `useQuery`는 어느 쪽이든 돈다. 조각이 자기 데이터를 부르는 것이 이 ADR의 핵심이고 경계는 그 위의 선택이라, 조각마다 `isPending`·`isError`를 들고 가다가 확인이 되면 `useSuspenseQuery` 한 줄로 바꾼다. 대가는 한 화면에 스켈리톤이 여럿 뜨는 것이다.

**확인이 필요한 까닭은 이렇다.** RN에서 Suspense fallback이 안 풀린다는 보고가 [TanStack/query#8819](https://github.com/TanStack/query/issues/8819)(RN 0.77 · Query v5.68 · New Architecture)와 [react-native#49129](https://github.com/react/react-native/issues/49129)(RN 0.78-rc · React 19)에 있다. 둘 다 어느 쪽 책임인지 결론이 없다. 여기 버전은 RN 0.86.3 · React 19.2.3이라 보고보다 뒤지만, 저장소에 `Suspense`가 한 자리도 없었으므로 `UnreadCountLine`이 그 확인을 맡는다. 안 풀리면 이 절만 뒤집고 조각이 `useQuery`로 제 로딩을 그린다 — 나머지 결정은 그대로 산다.

## 쓰기는 조각이 삼킨다

`features/<use case>/ui`는 자기 mutation을 부른다. 눌리면 그 use case가 도는 자리고, 보내는 중·실패·성공을 자기 controller가 든다.

경계가 쓰기를 가리지 않는다. `useMutation`은 `Suspense`에 걸리지 않고, 보내는 중은 그 버튼이 비활성으로 보여야 하는 것이라 화면이 아니라 그 조각의 일이다.

## 집행

| 무엇 | 어떻게 |
| --- | --- |
| `ui/`에서 `model`·`utils`를 값으로 import 금지 | 규칙 39 `house/ui-value-import` |
| `entities`가 쓰기 훅 금지 | 규칙 27 `house/entities-read-only` |
| `features`의 읽기 service는 도메인 둘 이상 | 규칙 28 `house/features-query-composes` |
| 조각 `.tsx`가 `useRouter` 금지 | 규칙 — 이 ADR이 세울 자리 |
| 조각 `.tsx`가 `isPending`·`isError` 분기 금지 | 사람이 본다 — 실기기 확인 뒤 |

## 남는 위험

**한 화면을 읽으려면 파일 여럿을 연다.** 조각이 자기 query를 부르면 그 화면이 무엇을 불러오는지 한 자리에서 안 보인다. 대가로 조각이 자립하고 화면 controller가 작아진다.

**같은 query를 여러 조각이 부를 수 있다.** TanStack Query가 같은 키를 캐시로 합치니 통신은 한 번이지만, 키가 어긋나면 두 번 간다. `queryKeys`가 한 자리에 있는 것이 그것을 막는다.

**경계를 잘못 두면 화면이 늦어진다.** 빠른 조각과 느린 조각을 한 경계에 묶으면 둘 다 느린 쪽을 기다린다. 묶는 기준은 「함께 채워져야 하나」다.
