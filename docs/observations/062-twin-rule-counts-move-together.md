---
status: open
target: tests/lint/rules.ts
date: 2026-10-09
---

# 뜻이 다른 두 상수가 같은 값이라 하나만 고치게 만든다

규칙 서른아홉째(`house/ui-value-import`)를 카탈로그에 넣으면서 `DOCUMENTED_LINT_RULE_COUNT`를 39로 올렸다. 「문서가 말하는 수는 lint가 집행하는 마지막 번호다」가 통과했고, 대신 「1부터 끝 번호까지 끊김 없이 이어진다」가 깨졌다 — 그 테스트는 `ENFORCED_RULE_COUNT`를 읽는데 그것이 아직 38이었다.

## 왜 하나만 고쳤나

`tests/lint/rules.ts`가 둘을 나란히 선언하고 **값이 같다.**

```ts
export const DOCUMENTED_LINT_RULE_COUNT = 38;

export const ENFORCED_RULE_COUNT = 38;
```

뜻은 다르다 — 앞은 lint·prettier가 무는 마지막 번호고, 뒤는 훅과 pre-commit까지 포함한 카탈로그의 끝 번호다. 지금 같은 것은 **마지막 규칙이 마침 lint여서**다. 다음 규칙이 훅이면 뒤만 오르고 lint면 둘이 같이 오른다.

값이 같아서 「하나를 고치면 되는가」가 안 보인다. 실패 메시지도 그 축을 안 든다 — 「1부터 끝 번호까지 끊김 없이」가 깨졌다고만 말하고, 깨진 까닭이 번호가 빠진 것이 아니라 **끝 번호를 세는 상수가 안 올랐다**는 것임을 말하지 않는다.

## 규칙을 하나 더하면 다섯 자리가 움직인다

1. `eslint-rules/<이름>.mjs` — 규칙
2. `eslint-rules/index.mjs` — import와 등록 키
3. `eslint.config.mjs` — `"error"`로 켜기
4. `tests/lint/rules.ts` — `RULES` 행과 **상수 둘**
5. `docs/4-test/execution.md` — 표의 행

`ruleCatalogue.test.ts`가 live config를 읽어 교차검증하므로 다섯이 **한 커밋**이어야 한다. 넷만 하면 「표와 코드 목록이 한 줄씩 같다」나 「켜져 있는지」가 깨진다.

## 고칠 길

**`ENFORCED_RULE_COUNT`를 상수로 두지 않고 세는 쪽이 있다.** `RULES`와 `RULE_NUMBERS_NEVER_ASSIGNED`에서 최댓값을 뽑으면 손으로 올릴 자리가 하나 줄고, 「끊김 없이」 테스트가 재는 것이 「번호가 빠졌나」만 남는다. 지금은 그 테스트가 두 가지를 겸한다 — 번호의 연속성과 상수의 최신성이다.

`DOCUMENTED_LINT_RULE_COUNT`는 남는다. 그것은 문서가 말하는 수라서 손으로 쓴 값과 코드가 어긋나는 것을 잡는 것이 일이다.
