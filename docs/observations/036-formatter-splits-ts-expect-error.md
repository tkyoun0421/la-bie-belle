---
status: actioned
target: .claude/agents/unit-test-writer.md
date: 2026-09-29
resolved:
---

# 포맷터가 지시자와 대상 사이를 갈랐다

## 일

`notification-list`의 unit 테스트 여덟이 대상 없는 모듈을 동적 import로 불렀다. 작성자가 정의문대로 한 줄에 썼고 `pnpm typecheck` 통과까지 보고 끝냈다.

커밋할 때 pre-commit 훅의 포맷 단계가 그 줄을 쪼갰다.

```ts
// @ts-expect-error 대상 모듈이 아직 없다
const { toNotificationTitle } =
  await import("@/entities/notification/model/title");
```

지시자가 붙은 줄은 `const { … } =`이고 `TS2307`이 나는 줄은 그 다음이다. 지시자가 헛돌아 `TS2578 Unused '@ts-expect-error' directive`가 여덟 번 났다. 구현자가 받자마자 typecheck가 죽어 있었고, 받은 테스트에서 그 여덟 줄을 지우는 것이 첫 일이 됐다.

[관찰 032](032-test-before-target-breaks-typecheck.md)가 세운 규칙이 「한 줄로 합친다」였다. **그 규칙이 포맷터를 계산에 안 넣었다** — 작성자가 무엇을 쓰든 커밋 시점에 줄이 다시 그어진다.

## 지은 것

지시자를 괄호 안, 경로 문자열 바로 위로 옮겼다.

```ts
const { toIsoDate } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/features/payroll/model/holiday-api-response"
);
```

이 꼴은 Prettier가 이미 쪼개둔 모양이라 더 건드리지 않는다 — 빈 파일로 실험해 `prettier --check`와 `tsc --noEmit` 둘 다 통과하는 것을 확인했다. `unit-test-writer` 정의문의 예제와 설명을 이 꼴로 바꿨다.

## 원칙

커밋 훅이 코드를 다시 쓰는 저장소에서, 줄 위치에 기대는 규칙은 작성자가 아니라 포맷터가 정한다. 그런 규칙은 포맷터가 손대도 안 움직이는 모양으로 적는다.
