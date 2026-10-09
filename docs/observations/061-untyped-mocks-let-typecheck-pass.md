---
status: open
target: src/**/__tests__/*.test.ts
date: 2026-10-09
---

# 타입 없는 mock 픽스처가 typecheck를 지나친다

`dto-to-domain-shape`가 `.api.ts` 스물둘의 반환 꼴을 바꿨다. 그 꼴을 받는 자리는 전부 `pnpm typecheck`가 잡아 줄 줄 알았는데, 훅 테스트 일곱이 안 걸리고 `pnpm test`에서야 빨개졌다 — 매퍼를 세운 커밋이 「끝났다」로 보고된 뒤였다.

## 어떻게 그물을 지났나

`jest.unstable_mockModule`로 `.api.ts`를 갈아 끼우는 자리가 저장소에 **아흔여덟**이고, 그 mock이 전부 같은 서명이다.

```ts
const getMonthScheduleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
```

반환이 `Promise<unknown>`이라 `mockResolvedValue`에 무엇을 넣어도 통과한다. 픽스처가 DTO 꼴이든 도메인 꼴이든 없는 열 이름이든 컴파일이 안 울고, 훅이 그 값을 읽다 런타임에서 터진다.

## 증거 둘

- **매퍼를 세운 뒤 훅 테스트 일곱이 늦게 빨개졌다.** `useDayDetail`·`useStatsScreen`·`usePayrollScreen`·`useAdminStatsScreen`·`useScheduleWorkerScreen`·`useAdminHomeScreen`·`useScheduleAdminScreen`이다. typecheck가 0건인 상태에서 테스트가 실패했다
- **픽스처가 없는 열 이름을 들고 있었다.** `useAdminHomeScreen.test.ts`의 `check_ins` 픽스처가 `checked_in_at`을 썼다 — 그 테이블에 없는 이름이다. 훅이 `.length`만 읽어 동작이 같았고, 아무도 못 봤다

둘째가 더 나쁘다. 첫째는 테스트가 결국 잡았지만 둘째는 **아무 검사도 안 잡았다** — 그 픽스처가 거짓인 채로 통과하는 테스트를 지켰다.

## 기계가 대신할 수 있나

**할 수 있다.** 실물 서명을 박는 길이 이미 있다.

```ts
import type { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";

const getMonthScheduleMock = jest.fn<typeof getMonthSchedule>();
```

`import type`은 런타임에 사라져 mock을 안 피한다. 이 꼴이면 픽스처가 반환 타입에 맞아야 하고, `.api.ts`가 바뀌면 그 자리가 **typecheck에서** 걸린다.

집행은 `jest.fn<(...args: unknown[]) => Promise<unknown>>()` 꼴을 막는 lint 규칙이다. 막기만 하면 대안이 하나뿐이라 사람이 `typeof`를 쓰게 된다 — 「무엇을 쓰라」를 규칙이 안 적어도 된다.

**아흔여덟 자리를 고치는 것이 그 규칙보다 크다.** 규칙을 먼저 켜면 그 아흔여덟이 전부 빨개진다. 매퍼 묶음이 그랬듯 자리를 먼저 다 옮기고 규칙을 마지막에 켜는 순서가 맞다.
