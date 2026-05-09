---
name: ai-harness-verify
description: 이 프로젝트에서 AI 하네스 검증 단계만 수행할 때 사용한다. 구현 후 테스트, 린트, 타입체크, 빌드, 수동 확인을 실행하고 verification.md 를 작성해야 할 때 사용하며, 구현 수정이나 리뷰어 채점은 수행하지 않는다.
---

# AI 하네스 검증

검증 단계만 수행한다.

## 선행 조건

다음 파일이 없으면 검증하지 말고 누락 파일을 보고한다.

- `.agents/runs/issue-{number}/task-spec.md`
- `.agents/runs/issue-{number}/plan.md`
- `.agents/runs/issue-{number}/spec.md`
- `.agents/runs/issue-{number}/implementation-notes.md`

## 절차

1. 완료 기준, 상세 스펙, 구현 기록을 읽는다.
2. 관련 테스트, 린트, 타입체크, 빌드, 수동 확인 중 필요한 검증을 선택한다.
3. 명령을 실행하고 결과를 기록한다.
4. 완료 기준별로 어떤 근거로 충족됐는지 매핑한다.
5. 실행하지 못한 검증과 남은 리스크를 기록한다.
6. `verification.md`만 작성하거나 갱신한다.

## 산출물

- `.agents/runs/issue-{number}/verification.md`

## 금지

- 구현을 수정하지 않는다. 단, 검증을 실행하기 위한 명백한 환경/명령 오타 수정은 사용자에게 보고 후 처리한다.
- 리뷰어 점수를 만들지 않는다.
- PR을 만들지 않는다.
