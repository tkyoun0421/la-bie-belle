---
status: actioned
target: .claude/hooks/spec-gate.py
date: 2026-09-27
resolved: 2026-09-27
---

# spec 게이트가 plan이 정본인 task를 막고, Bash로는 그냥 열린다

## 일

`payroll-data`의 integration writer가 `feat/payroll-data`에서 첫 파일을 쓰자마자 막혔다.

```
spec 차단: src/entities/payroll/dals/__tests__/payroll-rls.integration.test.ts 는
feat/payroll-data 브랜치의 src/ 수정인데 승인된 spec이 없다.
```

막은 것이 맞지 않다. `docs/3-build/README.md`가 이미 정해뒀다 — 「기능 plan에 `## 완료 조건` 절이 있으면 그 기능의 spec이 없다는 뜻이다」. `payroll-data.md`가 정확히 그 꼴이고(AC-01~AC-08이 그 절 아래 산다), 데이터 task는 애초에 spec 없이 plan을 정본으로 간다. `attendance-data`·`account-data`·`schedule-data`도 spec 파일이 없다. 게이트는 그 조항을 모르고 `spec/<슬러그>.md`만 본다.

같은 자리에서 두 번째가 드러났다. **unit writer는 안 막혔다** — 같은 브랜치 같은 `src/`인데 `Bash`의 heredoc으로 썼다. 훅 셋(`tdd-guard-unit`·`tdd-guard-e2e`·`spec-gate`)이 전부 `.claude/settings.json`의 `"matcher": "Write|Edit"` 아래 달려 있어 셸로 쓰는 길은 검사 밖이다. 막힌 writer는 보고하고 멈췄고 안 막힌 writer는 그대로 썼다 — 같은 규칙이 도구에 따라 다르게 걸린 것이라 규칙이 아니라 우연이다.

## 고침

첫째는 고쳤다. `spec-gate.py`가 spec 파일이 **아예 없을 때만** `plans/<슬러그>.md`를 보고, 그 파일에 `## 완료 조건` 절이 있으면 통과시킨다. spec이 있는데 `draft`면 그대로 막는다 — 있는 spec을 plan으로 덮는 길을 열지 않는다. 차단 문구에도 그 조건을 적어 다음 사람이 왜 막혔는지 알게 했다. 짝 테스트 셋을 `.claude/hooks/__tests__/spec-gate.test.ts`에 더했다.

둘째는 안 고쳤다. `Bash`를 matcher에 더하면 훅 셋이 셸 명령마다 돌고, 각 훅이 명령 문자열에서 「무엇을 어디에 쓰는지」를 읽어내야 한다 — heredoc·리다이렉션·`python3 - <<EOF`·`sed -i`가 전부 쓰기다. 그 파싱은 훅 하나의 곁가지가 아니라 제 task다. `backlog.md`에 `hook-bash-writes`로 세우고 여기 남긴다.

## 원칙

게이트가 정본의 조항 하나만 알고 그 조항의 예외를 모르면, 예외에 해당하는 일을 하는 사람은 규칙을 어기는 것처럼 막힌다 — 게이트를 세울 때 그 규칙이 사는 문서의 **이웃 문단**까지 읽는다. 그리고 검사 범위를 도구 이름으로 자르면 같은 일을 다른 도구로 하는 길이 곧 구멍이다.
