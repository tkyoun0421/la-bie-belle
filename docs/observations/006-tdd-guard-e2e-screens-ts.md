---
status: open
target: .claude/hooks/tdd-guard-e2e.py
date: 2026-09-06
resolved:
---

# screens 아래 순수 .ts까지 e2e 스펙을 요구한다

## 일

login-screens 회차에서 unit-test-writer가 `src/screens/pending/model/__tests__/notification-prompt.test.ts`를 만들려다 훅에 막혔다. `tdd-guard-e2e.py`의 `spec_name()`(13~15행)이 `src/screens/` 접두사면 확장자를 보지 않고 화면 이름을 뽑아 `tests/e2e/<이름>.spec.ts`를 요구한다. 계획이 `model/`로 분리해 둔 순수 로직 `.ts`와 그 unit 테스트 파일까지 화면으로 판정됐고, e2e 스펙이 아직 없어 unit 테스트 작성이 순서상 뒤로 밀렸다.

## 고침

`spec_name()`의 `src/screens/` 분기가 `.tsx` 파일일 때만 화면 이름을 돌려주게 좁힌다. 로직 `.ts`의 테스트 짝은 `tdd-guard-unit.py`가 이미 지키는 축이라 겹침도 구멍도 없다.

## 원칙

훅의 판정 기준은 경로 접두사가 아니라 규칙이 실제로 가르는 축(.tsx는 화면, .ts는 로직)을 읽어야 한다.
