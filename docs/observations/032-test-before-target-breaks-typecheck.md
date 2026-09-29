---
status: actioned
target: .claude/agents/unit-test-writer.md
date: 2026-09-29
resolved:
---

# 대상보다 먼저 쓴 테스트가 typecheck를 죽인다

## 일

TDD라 테스트가 구현보다 먼저 선다. 그 테스트는 아직 없는 모듈을 import하고, 정적 `import`로 적으면 `pnpm typecheck`가 `TS2307: Cannot find module`로 죽는다.

`payroll-holidays`의 unit writer가 저장소에서 선례를 찾아 그 시점 커밋을 별도 worktree로 체크아웃해 직접 돌려봤다. **선례 자체가 통과하지 못했다** — `payroll-adjust` 계열이 정적 import를 썼고 그 시점에 typecheck가 빨갰다. 따라 할 수 없는 선례다.

그래서 길을 새로 냈다.

```ts
// @ts-expect-error 대상 모듈이 아직 없다
const { toIsoDate } = await import("@/features/payroll/model/holiday-api-response");
```

`@ts-expect-error`는 바로 다음 한 줄에만 붙는다. 처음에 `import(...)`를 여러 줄로 쪼갰더니 TS가 오류를 문자열 리터럴이 있는 줄에 붙여 지시자가 헛돌고 `TS2578: Unused '@ts-expect-error' directive`가 따라 났다. 호출 전체를 한 줄로 합쳐야 한다.

## 볼 자리

[관찰 030](030-export-gate-needs-complete-writer-assignment.md)의 곁가지로 `unit-test-writer`에 「`pnpm typecheck`와 `pnpm lint`도 통과해야 한다」를 이미 박았다. **요구는 섰는데 방법이 없었다.** writer마다 같은 자리에서 새로 발명하고, 발명이 안 되면 그대로 넘겨 구현자가 받자마자 막힌다.

요구만 적고 방법을 안 적으면 그 요구는 매번 다시 풀린다. 이 저장소에서 「어떻게」가 한 줄이면 끝나는 자리는 정의문에 그 한 줄을 넣는 쪽이 싸다.

## 지은 것

`unit-test-writer`에 동적 import 꼴과 `@ts-expect-error`의 한 줄 규칙을 박았다. 정적 import 선례가 통과하지 못한 것이라 따라 하지 말라는 줄도 같이 넣었다 — 안 적으면 다음 writer가 같은 함정을 다시 밟는다.

**구현이 선 뒤 정적 import로 되돌리는 것은 구현자 몫**이라는 것도 적었다. 안 떼면 `TS2578`이 난다.

## 원칙

정의문이 무엇을 요구할 때는 그것을 어떻게 하는지도 같이 적는다. 요구만 있는 줄은 매 라운드 비용을 새로 문다.
