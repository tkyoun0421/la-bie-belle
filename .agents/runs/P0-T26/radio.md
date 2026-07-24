# P0-T26 RADIO

## Requirements

- 사용자와의 딥인터뷰가 프로젝트 매니징, 제품 범위, 도메인 및 기술 설계의 독립된 첫 번째 트랙이다.
- AI 자동화는 사용자가 명시적으로 승인한 단일 task를 입력으로 구현·검증·재시도를 자율 수행하는 두 번째 트랙이다.
- 기존 미구현 계획은 삭제하지 않고 `proposed` 상태의 인터뷰 재료로 보존한다.
- 관련 spec refs: `DOCS:SDD`, `ADR:0008`.

## Architecture

- `docs/WORKFLOW.md`를 딥인터뷰와 자율 개발 사이의 운영 경계 원문으로 추가한다.
- `AGENTS.md`, 개발 규칙, Phase 규칙, repository-local skill과 Codex 세션 안내가 같은 경계를 가리킨다.
- runner는 자동 선택을 제거하고 명시적인 `--task <ID>`와 사용자 승인 기록을 요구한다.
- `la-bie-belle-deep-interview`와 `la-bie-belle-harness`를 두 트랙의 실행 스킬로 사용한다.

## Data model

- 제품 데이터베이스 변경은 없다.
- 작업 인덱스에 `proposed` 상태와 `approved_by`, `approved_at` 승인 기록을 추가한다.
- 기존 미구현 제품 task를 `planned`에서 `proposed`로 되돌린다.

## Interface

- 실행 인터페이스는 `pnpm harness:start -- --task <ID>`다.
- `--task` 누락, `proposed` task, 승인 기록 누락, 미충족 의존성은 이해 가능한 오류로 거부한다.
- discovery·design 인터뷰 중에는 task 상태 변경과 구현 명령을 실행하지 않는다.

## Optimizations

- 기존 task, spec ID와 상세 문서는 인터뷰 자료로 재사용해 손실과 불필요한 재작성을 피한다.
- 승인 여부를 상태와 최소 메타데이터로 표현하고 별도 PM 시스템이나 복잡한 workflow engine은 도입하지 않는다.
