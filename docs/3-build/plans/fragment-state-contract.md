# 조각이 상태를 내주는 꼴과 이름을 하나로

읽는 조각 23개가 상태를 두 꼴로 내주고 이름이 다섯 축에서 갈린다. 타입이 실수를 잡는 꼴로 모으고 이름을 정본에 맞춘다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 G다.** [`fragments-own-their-data`](fragments-own-their-data.md)의 남은 묶음이고 그 plan의 AC-05(「조각이 제 로딩과 실패를 든다」)가 자리를 만들었다 — 이 계획은 **그 자리의 꼴과 이름**을 정한다.

### 꼴이 둘이고 하나만 실수를 잡는다

| 꼴 | 수 | 타입이 잡나 |
| --- | --- | --- |
| 판별 union | 5 | **잡는다** |
| `state` 한 필드에 평평한 객체 | 16 | **안 잡는다** |

**판별 필드 이름은 둘 다 `state`다.** 다른 것은 union이냐 평평한 객체냐뿐이다.

본보기는 `src/features/stats/hooks/useStatsAttendance.ts:27`이다.

```ts
export type StatsAttendanceController =
  | { state: "loading" }
  | { state: "failed" }
  | { state: "empty" }
  | { state: "ready"; rows: … };
```

약한 쪽은 `src/entities/payroll/hooks/useWageRows.ts:20`이다.

```ts
export type WageRowsController = { state: WageRowsState; rows: WageRowLine[] };
```

`rows`가 늘 붙어 있어 `{ state: "failed", rows: [] }`를 돌려주고, `.tsx`가 pending일 때 `rows`를 읽어도 컴파일이 통과한다. **빈 배열이 「아직 안 왔다」와 「와 보니 없다」를 같은 값으로 만든다.**

### 이름이 다섯 축에서 갈린다

| 축 | 갈린 꼴 |
| --- | --- |
| 기다리는 중 | `pending` 13 對 `loading` 8 |
| 끝 상태 | `ready` 14 · `rows` 5 · 그 밖 2 |
| 쓰는 중 | `sending` 7 · `saving` 5 · `uploading` 2 · `confirming` 1 · `closing` 1 |
| 실패 | `failed: boolean` **13** 對 `failedLine: string \| null` **4** |
| 상태별 그림을 누가 드나 | 받는다 13 對 자기가 그린다 8 |

**그림 축은 슬라이스 단위로만 갈린다.** `features/stats` 다섯과 `entities`의 목록 조각 일곱은 전부 받고, `features/payrollCompute` 다섯과 `entities/schedule` 둘과 `entities/payroll/ui/WageRows.tsx`는 전부 자기가 그린다. 조각의 성격이 아니라 그 슬라이스를 쓴 회차가 갈랐다. [ADR-016](../../2-design/adr/ADR-016-fragments-own-their-data.md)이 「조각이 `ReactNode`로 받는다」고 못박았으니 여덟이 어긋난 자리다.

## 판정 — 수가 아니라 정본과 맞는 쪽이 이긴다

[`spell-number-shared`](spell-number-shared.md)가 다섯 가운데 맞는 하나를 올린 것과 같은 축이다.

**꼴은 판별 union이다.** 다수(16)가 아니라 소수(5) 쪽으로 간다 — 타입이 실수를 잡는 유일한 꼴이다. 판별 필드 이름이 이미 `state`로 같아 호출부의 `switch`나 분기는 거의 그대로다.

**기다리는 중은 `pending`이다.** 13 對 8로 다수이기도 하고, **TanStack Query v5가 `isLoading`을 `isPending`으로 바꿨다** — 상태가 오는 자리의 이름이 그것이다.

**끝 상태는 `ready`다.** 14 對 5다. `rows`는 담긴 것의 이름이라 목록이 아닌 조각(줄 하나·카드 하나)에 안 맞는다.

**쓰는 중은 `sending`이다.** 7로 가장 많고, 저장·올리기·확정이 전부 「보낸다」의 갈래다.

**실패는 `failedLine: string | null`이다.** 13 對 4로 소수 쪽이다 — `failed: boolean`이면 문안을 `.tsx`가 들어야 하고 규칙 「`.tsx`는 더미 UI」와 ADR-001이 그것을 막는다. 문안은 그 슬라이스의 `consts`에서 와 controller가 줄을 완성해 내려준다.

**셈이 10 對 5가 아니라 13 對 4였다.** 처음 표가 `features/*/hooks`만 보고 **화면 controller 넷을 놓쳤다** — `useRehearsalScreen`·`useApplicationsScreen`·`useMembersBlockedScreen`과 `useScheduleAdminScreen`의 `ScheduleAdminSheet` union 안 `"deadline"` 가지다. 이미 전환된 쪽은 다섯이 아니라 넷이고(`useCreateScheduleSheet`·`useDayHoursSheet`·`useMemberDetailSheet`·`useMemberSheet`), 전체 `src/`를 훑어도 다섯째가 없다.

**`useApprovalDetailSheet`는 같은 문안을 다른 이름으로 한 번 더 든다.** `approvalDetailSheet.type.ts:24`의 `confirmNotice: string | undefined`가 `isError ? APPROVAL_SHEET_COPY.sendFailed : undefined`고, 그 옆에 `failed: boolean`이 따로 있다. **`confirmNotice`가 바로 `failedLine`이다** — 이름을 `failedLine`으로 바꾸고 `failed: boolean`을 지운다. 둘을 같이 두면 이 계획이 없애려는 중복을 그대로 남긴다.

**`useScheduleAdminScreen`의 `failed`는 중첩 union 안에 산다.** `ScheduleAdminSheet`의 `"deadline"` 가지라 `sheet.kind === "deadline"`으로 좁힌 뒤에만 읽을 수 있다 — 다른 열둘과 꼴이 다르다.

**상태별 그림은 조각이 `ReactNode`로 받는다.** ADR-016이 이미 정했고 어긋난 여덧을 맞춘다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| 평평한 객체 16 | 판별 union으로 바꾼다. 끝 상태 아닌 가지에서 `rows` 같은 짐을 뺀다 |
| 호출부 `.tsx` 16 | 가지마다 읽는 것이 달라진 자리를 고친다. `state`로 고르는 꼴은 그대로다 |
| 이름이 어긋난 자리 | `loading` 8 → `pending`, `rows` 5와 그 밖 2 → `ready`, 쓰기 다섯 → `sending`, `failed: boolean` 13 → `failedLine` |
| `failed: boolean`이던 13의 `.tsx` | 문안을 자기가 들던 자리가 `failedLine`을 그대로 그린다 |
| `src/shared/ui/QueryBoundary.tsx` | `loading` props가 `pending`이 된다. 쓰는 프로덕션 자리는 `screens/notifications/ui/NotificationsScreen.tsx` 하나다 |
| 그림을 자기가 그리던 조각 8 | 상태별 그림을 `ReactNode` props로 받는다 |
| `eslint-rules/fragmentStateContract.mjs` | 신설 — 조각 controller의 반환 타입이 평평한 `state` 필드면 막고, 상태 이름이 정본 넷 밖이면 막는다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` · `tests/lint/rules.ts` · `docs/4-test/execution.md` | 규칙 하나를 켜는 다섯 자리의 나머지 넷 |
| [ADR-016](../../2-design/adr/ADR-016-fragments-own-their-data.md) | 상태 이름 넷과 판별 union 꼴을 못박는다. 지금 ADR은 「`ReactNode`로 받는다」만 들었다 |

## 완료 조건

- **AC-01** 읽는 조각 controller 21개가 판별 union을 돌려준다. 끝 상태 아닌 가지에 그 가지가 안 쓰는 필드가 없다
- **AC-02** 상태 이름이 넷이다 — `pending`·`failed`·`empty`·`ready`. 쓰는 중은 `sending` 하나다
- **AC-03** 실패가 `failedLine: string | null`이다. 열셋이 그 꼴이고 `useApprovalDetailSheet`의 `confirmNotice`가 그 이름으로 합쳐진다. `.tsx`에 실패 문안 생문안이 0이다
- **AC-04** 상태별 그림을 조각이 `ReactNode`로 받는다. 자기가 import해 그리는 조각이 0이다
- **AC-05** `eslint-rules/fragmentStateContract.mjs`가 평평한 `state` 필드와 정본 밖 상태 이름을 막고, 규칙이 다섯 자리에 한 커밋으로 선다
- **AC-06** ADR-016이 상태 이름 넷과 판별 union을 든다
- **AC-07** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. **ADR-016을 먼저 고친다** — 이름 넷과 꼴을 정본에 박는다. 코드가 그 뒤를 따른다
2. 평평한 객체 16을 판별 union으로 바꾼다. **typecheck가 호출부를 가리킨다** — 끝 상태 아닌 가지에서 짐을 읽던 자리가 거기다
3. 이름을 맞춘다. `failed: boolean` → `failedLine`이 가장 넓다(13자리). `QueryBoundary`의 `loading` props도 `pending`이 된다
4. 그림을 자기가 그리던 조각 여덟을 `ReactNode`로 돌린다
5. lint 규칙을 다섯 자리에 한 커밋으로 켠다. **자리를 다 옮긴 뒤여야 초록이 난다**
6. 검증하고 PR을 연다

실패 테스트가 먼저 서는 자리는 **AC-03의 열세 자리**다 — `failed: boolean`이 `failedLine`으로 바뀌면 그 조각이 내주는 값이 참거짓에서 글자로 달라져 관찰 가능한 변화다. 나머지는 타입 꼴과 이름이라 typecheck와 lint가 센다.

## 리스크

**2번 걸음이 호출부를 깨뜨린다 — 그것이 의도다.** 평평한 객체를 union으로 바꾸면 끝 상태 아닌 가지에서 짐을 읽던 자리가 전부 typecheck에서 막힌다. **막힌 자리가 곧 버그가 숨어 있던 자리다** — 빈 배열을 「없다」로 그리던 `.tsx`가 거기 있다. 고치기 전에 수를 세어 보고한다.

**`empty`가 없던 조각이 있다.** `useWageRows`는 `pending`·`failed`·`rows` 셋만 든다. union으로 바꿀 때 「와 보니 없다」 가지를 세울지가 조각마다 다르다 — 빈 목록을 `ready`의 빈 배열로 둘지 `empty` 가지로 뺄지다. **`empty`로 뺀다** — 그래야 `.tsx`가 빈 상태 그림을 고를 때 배열 길이를 안 본다. 그 판정이 조각마다 그림 하나를 더 요구하므로 수를 세어 보고한다.

**쓰기 이름을 `sending` 하나로 모으면 어색한 자리가 생길 수 있다.** `uploading`(사진)과 `confirming`(근무표 확정)이 그렇다. 그래도 하나로 모은다 — 상태 이름이 하는 일은 「끝났나」를 가리는 것이고, 무엇을 보내는지는 그 조각의 이름이 이미 든다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 조각 `.tsx`의 짝 테스트는 iOS 환경(`components` 프로젝트)에서 돈다. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다. integration은 범위 밖이다 — `api/`를 안 건드린다.
