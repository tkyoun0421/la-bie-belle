# 빈 그릇에 쌓는 루프를 선언형으로

빈 그릇을 만들고 루프로 채우는 자리가 `src`에 35개다. 자리마다 열어 하는 일을 가렸고 **스물둘을 바꾸고 아홉을 안 바꾼다.** 공용 손 둘이 서고 자리 다섯이 제 층으로 내려간다.

## 입력 명세·기준

정본은 [제안](../../proposals/declarative-refactor-triage.md)의 묶음 2다. 자리는 TypeScript AST로 전수 훑어 찾았고 **35자리를 전부 열어** 분류했다.

**세는 단위가 「자리」가 아니라 「함수가 하는 일」이다.** AST가 센 35 가운데 넷은 한 함수의 앞뒤 단계나 중첩 루프라 **합쳐서 하나로 센다** — `pushMessage.utils.ts:25+33`(바깥·안쪽 루프), `positionRows.utils.ts:30+34`(세우고 채우기), `payrollDays.policy.ts:163+171`(같은 `Set`에 꽂기), `attendanceRows.utils.ts:55+56`(중첩). 그래서 **자리는 31이다.**

### 안 바꿀 아홉

| 자리 | 까닭 |
| --- | --- |
| `entities/notification/api/getPushReachable.api.ts:12` | **비동기 페이지네이션이다.** 500건씩 읽고 받은 게 500보다 작으면 멈춘다. 다음 페이지가 몇 건일지 모르는 루프는 선언형 배열 연산의 전제(배열이 이미 있다)를 깬다. AST가 커서 증가를 「세기」로 잘못 집었다 |
| `features/attendanceCheckin/api/checkIn.api.ts:33` | **지수 백오프 재시도다.** `attempt += 1`을 AST가 「세기」로 집었다. `return`과 `throw`로 빠져나가고 간격 2·4·8·16·32초가 결과에 들어온다 |
| `entities/notification/model/notificationRows.policy.ts:15` | **인접 구간 묶기다.** `groups.at(-1)`로 바로 앞 그룹과 같은 날짜일 때만 합친다 — Map으로 묶으면 떨어져 있는 같은 날짜까지 합쳐져 **뜻이 달라진다.** `reduce`로 감싸도 `last.rows.push`가 그대로 남아 선언형이 아니다 |
| `shared/ui/TrendChart.tsx:172` | 같은 인접 묶기고, 불변 슬라이싱으로 쓰면 지금보다 안 읽힌다. **알고리즘은 그대로 두고 자리만 옮긴다** |
| `features/stats/model/workTotals.policy.ts:66` | **누적기 넷을 한 루프에서 채운다**(`totalMinutes`·`totalCount`·`people`·`positions`). 튜플 `reduce`로 접으면 지금보다 안 읽힌다. `add()` 헬퍼로 이미 중복을 뽑아 뒀다 |
| `features/holiday/model/holiday.schema.ts:58` | **`continue`와 `return []`가 섞였다.** 앞은 그 항목만 건너뛰고 뒤는 **이미 쌓은 것을 다 버린다** — `break`와도 다르다. 쪼개면 `as`와 `!`가 늘어 묶음 4와 부딪힌다 |
| `features/payrollCompute/model/dateSpan.policy.ts:27` | **생성(unfold) 루프다.** 자기가 쌓은 배열의 마지막 값을 읽어 다음 값과 멈출 조건을 정한다. 3줄을 위해 「개월 수 계산」 간접을 새로 만드는 비용이 더 크다 |
| `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts:320` | **`await`가 든 순차 실행이다.** `Promise.all`은 직렬을 병렬로 바꿔 서버에 동시에 쏜다 — 뜻이 달라진다 |
| `shared/ui/DragProvider.tsx:51` | **네이티브 뷰를 비동기로 재는 부작용 루프다.** `measureInWindow`가 콜백 API라 `.map()`으로 감싸도 값을 못 뽑는다. ADR-001이 허용하는 「측정한 너비」 자리고 `useRef`로 일부러 리렌더를 피한다 |

## 판정은 이미 났다 — 묻지 말고 이 꼴로 쓴다

**① `Map.groupBy`와 `Object.groupBy`를 쓰지 않는다.** `reduce`로 간다.

`tsconfig.json`이 `expo/tsconfig.base.json`을 거쳐 `lib: ["DOM", "ESNext"]`를 써서 **그 ES2024 API가 타입 검사를 통과한다.** 그런데 이 앱은 Node가 아니라 Hermes로 돈다 — `node_modules/react-native/sdks/.hermesversion`이 `hermes-v0.17.0`이고 `@react-native/js-polyfills`에 폴리필이 없고 저장소 사용례가 0건이다. **없는 메서드는 컴파일이 아니라 실행에서 터진다.** Jest는 Node에서 돌아 셋 다 초록인 채로 나가고, 확인할 기기 빌드도 지금 없다. 관찰 068이 이 마찰을 든다.

**② 공용 손 둘을 `src/shared/utils/collect.ts`에 세운다.**

```ts
export function groupBy<Item, Key>(
  items: readonly Item[],
  keyOf: (item: Item) => Key,
): Map<Key, Item[]>;

export function countBy<Item, Key>(
  items: readonly Item[],
  keyOf: (item: Item) => Key,
): Map<Key, number>;
```

**셋째 손을 만들지 않는다.** 값을 더해 쌓는 자리(`payrollTotal`의 주별 합·`yearRows`의 달별 합)는 `groupBy`로 묶고 그 묶음을 접는다 — `[...groupBy(days, weekStartOf)].map(([week, ds]) => …)` 꼴이다. 수를 세는 것과 값을 더하는 것을 한 손에 넣으면 호출부가 안 쓰는 인자를 넘긴다.

**문턱을 넘었다.** `groupBy`는 열 자리고(`adjustmentCount`·`attendanceInputs`·`applicationsGrouping` 둘·`payrollTotal`·`yearRows`·`useScheduleAdminScreen`·`useScheduleWorkerScreen`·`useRehearsalScreen`·`attendanceRows`) `countBy`는 넷이다(`groupOpenSlots`·`vacancyCards`·`summarizeAttendanceStatuses`·`useScheduleAdminScreen`의 세는 부분). 증축 규칙의 문턱은 셋이다.

**③ 자리 다섯이 제 층으로 내려간다.** ADR-001이 `.tsx`와 controller에 계산을 두지 말라고 하고 가름은 ADR-016의 「무엇을 아는가」다.

| 지금 | 갈 데 | 아는 것 |
| --- | --- | --- |
| `useScheduleAdminScreen.ts:274` | `entities/availability/utils` | `applications` 하나 |
| `useScheduleWorkerScreen.ts:183` | `entities/schedule/utils` | `ScheduleDay[]` 하나 |
| `useScheduleWorkerScreen.ts:193` | `entities/workRequest/utils` | `SlotRequest[]` 하나 |
| `useRehearsalScreen.ts:113` | `entities/rehearsal/utils` | `Rehearsal[]` 하나 |
| `TrendChart.tsx`의 `plot`·`segmentsOf`·`linePointsOf`·`areaPointsOf` | `shared/utils` | 아무 도메인도 모른다 |

**`useScheduleAdminScreen:274`는 이미 있는 것을 손으로 다시 짠 자리다.** `entities/availability/utils/applicationsGrouping.utils.ts`의 `groupApplicationsByDate`가 거의 같은 일을 한다. **새로 만들지 말고 그 파일에 `Map`을 내는 손을 더해 둘이 같이 쓴다.**

**④ PR을 둘로 쪼갠다.** 바꾸는 축이 둘이라서다.

- **PR 하나** — 공용 손 둘과 `utils`·`model` 자리 열여덟을 선언형으로. 자리를 안 옮긴다
- **PR 둘** — `hooks`와 `ui`의 다섯을 제 층으로 옮기고 거기서 공용 손을 쓴다

쪼개는 까닭은 둘째가 **호출부를 건드린다**는 것이다. 첫째는 함수 본문만 바뀌어 짝 테스트가 그대로 그물이 되는데, 둘째는 import가 움직여 리뷰가 봐야 할 것이 다르다.

**⑤ 그물이 없는 자리는 먼저 친다.** 여섯이다.

| 자리 | 없는 단언 |
| --- | --- |
| `screens/adminHome/model/vacancyCards.policy.ts`의 `vacancyDaysOf` | 전용 단언이 **하나도 없다**. 짝 테스트가 `vacancyCards`와 `vacancyDaysLeftLine`만 본다 |
| `shared/model/miniViewDensity.policy.ts`의 `miniViewLoads` | 전용 단언이 **하나도 없다**. 짝 테스트가 `miniViewDensity`만 본다 |
| `shared/ui/TrendChart.tsx`의 넷 | **짝 테스트 파일이 없다** |
| `features/stats/utils/attendanceInputs.utils.ts` | 같은 `(dayId, profileId)`에 `excuse`가 둘 이상인 픽스처가 없다 |
| `entities/schedule/utils/positionRows.utils.ts` | `POSITION_ORDER`에 없는 포지션이 **조용히 버려지는** 것을 안 본다 |
| `features/holiday/model/holiday.schema.ts` | 여러 항목 가운데 **하나만 깨졌을 때** 나머지도 버리는지를 안 본다 |

마지막 둘은 **안 바꾸는 자리거나 안 바꿀 수 있는 자리**다 — 그 그물은 「바꾸기 전 안전장치」가 아니라 지금 동작이 의도인지 묻는 일이라 **이 task에서 단언만 세우고 동작은 안 건드린다.**

**⑥ 죽은 가지 하나를 걷는다.** `miniViewLoads`가 `miniViewDensity({ isOpen: true, … })`를 부른다 — `isOpen`이 박혀 있어 **`null`이 날 길이 없는데** `if (load !== null)`로 받는다. `miniViewDensity`가 `!isOpen`일 때만 `null`을 낸다. 그 가지를 걷되 **`as`나 `!`로 덮지 않는다** — `flatMap`으로 널 분기를 살려 두거나 입구를 좁힌다.

## 변경 파일

### PR 하나 — 공용 손과 `utils`·`model` 열여덟

| 자리 | 하는 일 | 바뀔 꼴 |
| --- | --- | --- |
| `src/shared/utils/collect.ts` | **새로 선다** | `groupBy`·`countBy` |
| `src/shared/utils/__tests__/collect.test.ts` | **새로 선다** | 그 둘의 단언 |
| `entities/notification/model/pushResult.policy.ts:42` | 네 갈래로 골라내며 바꾸기 | `filter` 넷 + `map` 넷 |
| `entities/notification/utils/pushMessage.utils.ts:25+33` | 골라내고 펼치기 | `flatMap` 하나 |
| `entities/notification/utils/pushMessage.utils.ts:52` | **덩이로 자르기** | `Array.from({length}, (_, i) => slice(…))` |
| `entities/availability/utils/applicationsGrouping.utils.ts:25` | 날짜로 묶기 | `groupBy` |
| `entities/availability/utils/applicationsGrouping.utils.ts:42` | 사람으로 묶기 | `groupBy` |
| `entities/attendance/utils/attendanceSummary.utils.ts:28` | 상태를 구해 추려 세기 | `map` → `filter` → `reduce` |
| `entities/attendance/utils/summarizeAttendanceStatuses.utils.ts:11` | 널 걸러 세기 | `filter` → `countBy` |
| `entities/schedule/utils/groupOpenSlots.utils.ts:22` | 날짜별 세기 | `countBy` |
| `entities/schedule/utils/positionRows.utils.ts:30+34` | 아홉 줄 세우고 채우기 | `Object.fromEntries(POSITION_ORDER.map(…))` |
| `features/stats/model/workTotals.policy.ts:59` | 포지션 아홉 꽂기 | `new Map(POSITION_ORDER.map(…))` |
| `features/payrollCompute/utils/payrollTotal.utils.ts:25` | 주로 묶어 더하기 | `groupBy` + 묶음 접기 |
| `features/payrollCompute/utils/yearRows.utils.ts:13` | 달로 묶어 더하기 | `groupBy` + 묶음 접기 |
| `features/payrollCompute/model/payrollDays.policy.ts:163+171` | 날짜 합집합 | `new Set([...xs, ...ys])` |
| `features/payrollCompute/utils/adjustmentCount.utils.ts:14` | 사람으로 묶기 | `groupBy` |
| `features/stats/utils/attendanceInputs.utils.ts:48` | 복합키로 묶기 | `groupBy` |
| `features/stats/utils/attendanceRows.utils.ts:55+56` | 중첩 — 펼쳐 이름 꽂기 | `flatMap` + `new Map(…)` |
| `screens/adminHome/model/vacancyCards.policy.ts:30` | 날짜별 세기 | `countBy`. **단언 먼저** |
| `shared/model/miniViewDensity.policy.ts:38` | 널 걸러 꽂기 | `Object.fromEntries(flatMap(…))`. **단언 먼저, 죽은 가지 걷기** |
| 위 자리들의 짝 테스트 | 없는 그물 넷을 더한다 | 기존 단언은 안 고친다 |

### PR 둘 — 자리 다섯이 내려간다

| 자리 | 갈 데 |
| --- | --- |
| `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts:274` | `entities/availability/utils/applicationsGrouping.utils.ts`에 `Map`을 내는 손을 더해 쓴다 |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:183` | `entities/schedule/utils`의 새 파일 |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:193` | `entities/workRequest/utils`의 새 파일 |
| `screens/rehearsal/hooks/useRehearsalScreen.ts:113` | `entities/rehearsal/utils`의 새 파일 |
| `shared/ui/TrendChart.tsx` | `shared/utils`의 새 파일. **알고리즘은 그대로, 짝 테스트가 처음 선다** |

## 완료 조건

- **AC-01** `shared/utils/collect.ts`가 `groupBy`와 `countBy`를 내보낸다. 둘 다 `Map`을 내고 **같은 키가 여럿일 때의 승자 규칙**을 짝 테스트가 단언한다 — `groupBy`는 만난 순서로 쌓고 `countBy`는 센다
- **AC-02** PR 하나에서 자리 열여덟이 선언형이다. `for`·`while`·`forEach`로 빈 그릇을 채우는 자리가 그 열여덟에서 0이다
- **AC-03** `Map.groupBy`와 `Object.groupBy`가 저장소에 0건이다
- **AC-04** 그물 없던 넷에 단언이 선다 — `vacancyDaysOf`·`miniViewLoads`·`attendanceInputs`의 다건 `excuse`·`positionRows`의 조용히 버림. **`holiday.schema`의 다건 단언도 선다**(그 자리는 안 바꾸고 단언만)
- **AC-05** `miniViewLoads`의 죽은 널 가지가 없다. `as`와 `!`가 그 파일에 0건이다
- **AC-06** PR 둘에서 자리 다섯이 제 층에 산다. `screens/*/hooks`와 `shared/ui`에 빈 그릇을 채우는 루프가 0이다
- **AC-07** `TrendChart`의 넷에 짝 테스트가 선다
- **AC-08** `useScheduleAdminScreen:274`의 계산이 `applicationsGrouping.utils.ts`의 손을 쓴다 — **같은 일을 하는 손이 둘이 되지 않는다**
- **AC-09** 안 바꾼 아홉이 그대로다. 그 자리의 짝 테스트 단언이 하나도 안 바뀐다
- **AC-10** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 그물 없는 자리에 단언을 먼저 세운다 — 다섯이다(AC-04)
2. `shared/utils/collect.ts`와 그 짝 테스트를 세운다
3. `utils`·`model` 자리 열여덟을 바꾼다. **묶는 자리부터** — 공용 손의 입구가 거기서 검증된다
4. `miniViewLoads`의 죽은 가지를 걷는다
5. 검증하고 **PR 하나**를 연다
6. `TrendChart`의 넷에 짝 테스트를 세운다(AC-07)
7. 자리 다섯을 옮긴다. `useScheduleAdminScreen`은 이미 있는 손을 쓴다
8. 검증하고 **PR 둘**을 연다

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 테스트는 `pnpm exec jest <경로>`로 좁혀 돌린다 — `pnpm test -- <경로>`는 pnpm이 플래그를 먹는다. `.tsx`를 렌더하는 테스트는 `--selectProjects components`다.

**integration과 e2e는 밖이다.** `api/`의 둘은 안 바꾸는 자리고 질의·DB·라우팅을 안 건드린다.

## 리스크

**순서가 결과에 들어오는 자리를 놓칠 수 있다.** 분류에서 셋을 확인했다 — `attendanceRows`는 같은 사람이 여러 날에 다른 이름으로 나오면 **나중 값이 이기고** `new Map([...])` 생성자도 같은 규칙이라 안전하다. `adjustmentCount`는 그룹 안에서 `adjustedAt` 최신값을 다시 골라 배열 순서와 무관하다. `attendanceInputs`는 `.some()`으로만 쓰여 무관하다. **그 셋의 근거를 구현이 다시 확인한다** — 틀렸으면 그 자리를 안 바꾼다.

**공용 손이 자리마다 다 안 맞을 수 있다.** 억지로 맞춰 안 쓰는 인자를 넘기게 되면 **그 자리는 손을 안 쓰고 제자리에서 `reduce`로 간다.** 몇에 갔고 몇이 남았는지를 수로 보고한다.

**자리를 옮기면 규칙 3에 걸릴 수 있다.** `screens`는 `entities`를 당길 수 있어 넷은 안전하다. `TrendChart`는 `shared/ui` → `shared/utils`라 안전하다. 그래도 옮긴 뒤 `pnpm lint`가 판정한다.
