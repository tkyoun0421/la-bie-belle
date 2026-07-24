---
name: tdd-guard
description: 이 저장소의 Codex 기능 작업에 RED-GREEN-REFACTOR 증거를 강제한다. 단계 작업의 test_mode가 tdd이거나 동작, 도메인 로직, API, 데이터베이스, RLS 또는 보안 규칙을 추가할 때 사용한다.
---

# TDD 가드

`test_mode`가 `tdd`인 모든 작업에 이 스킬을 사용한다. Git hook과 하네스 스크립트가 실행 계약의 기준이며, 테스트 한 번이 통과했다는 이유만으로 작업 완료를 선언하지 않는다.

## 진행 절차

1. 작업의 `spec_refs`, 단계 인수 조건과 `check_ids`를 읽는다.
2. 제품 코드를 변경하기 전에 기준선 검사가 통과하는지 확인한다.
3. 요구 동작을 표현하는 가장 작은 테스트를 추가한다.
4. 대상 테스트를 실행하고 실제 assertion 실패를 RED로 기록한다. 인프라 또는 문법 오류는 RED가 아니다.
5. 같은 테스트를 통과시키는 가장 작은 변경을 구현한다.
6. 같은 대상 테스트를 GREEN으로 다시 실행한 뒤 작업의 모든 `check_id`를 실행한다.
7. 모든 검사가 계속 통과하는 동안에만 리팩터링한다.
8. 하네스가 검증 증거를 기록하게 하고 가드가 적용된 흐름으로만 커밋한다.

## 증거 규칙

- RED 증거에는 작업 ID, 명령 argv, 종료 코드, assertion 실패 분류와 구현 전 제품·테스트 트리 상태를 포함한다.
- GREEN 증거에는 같은 테스트 식별자, 종료 코드 0, 설정된 모든 check ID와 참조한 모든 spec ID를 포함한다.
- hook을 우회하려고 증거를 수정하거나 삭제하지 않는다. 검사가 실패하면 작업 worktree를 격리된 상태로 유지하고 실패를 기록한다.
- `git commit --no-verify`를 사용하지 않는다. CI도 같은 가드를 다시 실행한다.

## 예외

- `docs_only` 작업은 문서 검증기를 사용하며 RED/GREEN이 필요하지 않다.
- `verification` 작업은 선언된 검사를 사용하며 RED/GREEN이 필요하지 않다.
- 편의만을 이유로 예외를 선택하지 않는다. `index.jsonl`에 기록된 작업의 `test_mode`가 기준이다.

실행 가능한 계약은 `.agents/harness/scripts/tdd-guard.mjs`에 있으며 worktree hook과 CI가 호출한다.
