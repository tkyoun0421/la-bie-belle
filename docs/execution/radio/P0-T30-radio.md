# P0-T30 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-03
- 개발 설계 승인: user, 2026-08-03
- 관련 spec: DOCS:SDD, DOCS:DDD, ADR:0013
- 적용 깊이: 간결
- test mode: docs_only
- 예정 check IDs: index-json-parse, doc-link-integrity, legacy-path-scan

## Requirements

- 범위와 비목표:
  - 범위: 문서·실행 상태의 물리 이동, [ADR-0013](../../standards/adr/0013-project-layer-structure.md) 작성, 운영 계약의 5단계 재작성, handoff 계약 신설, `index.jsonl`·`index.schema.json` 경로 갱신, P0-T29 반환, P0-T30·P0-T31 등록, 저장소 전체 경로 참조 정리.
  - 비목표: 하네스 코드 구현(P0-T31), 제품 요구사항 변경, `DEV-*` 규칙 내용 변경, ADR 0001~0011 결정 변경, 대시보드 재설계.
- 불변 규칙:
  - 승인된 제품 불변 규칙과 `DEV-*` 규칙의 의미를 바꾸지 않는다. 경로 참조 갱신만 허용한다.
  - `dual-approval-v3`의 두 승인 의미론과 상태 전이(`proposed → design_pending → planned → in_progress → done`)를 보존한다.
  - 완료 task의 승인 SHA-256 결속을 깨지 않는다. 해시에 결속된 RADIO 본문은 수정하지 않는다.
- 기술 인수 조건:
  - `docs/` 아래 4개 레이어 디렉터리(`workflow`, `product`, `standards`, `execution`)만으로 문서 소속이 결정된다.
  - `index.jsonl`의 모든 줄이 유효한 JSON이고 `index.schema.json`의 경로 패턴을 만족한다.
  - 문서 상대 링크가 실제 파일을 가리킨다.
  - 남은 옛 경로 참조는 사유가 기록된 역사 기록뿐이다.
- 위험 기반 테스트:
  - `index.jsonl` 전 줄 JSON 파싱과 스키마 경로 패턴 확인.
  - 마크다운 상대 링크 존재 확인.
  - 옛 경로 문자열 잔존 검사(`.git` 제외).
- DEV-* 적용 상태:
  - `DEV-TEST-01`~`DEV-TEST-05`: 해당 없음 — 실행 코드를 만들지 않는 문서 작업이다. 검증은 위 세 가지 정적 검사로 대체한다.
  - `DEV-SEC-*`: 기본 적용 — 문서 이동은 비밀값·개인정보를 포함하지 않는다.

## Architecture

- 책임과 FSD 경계:
  - `src/`가 아직 없어 FSD 계층 결정이 없다. 이 task는 문서 레이어(L1~L4)만 다루고 L5는 미래로 남긴다.
  - 레이어 지배 방향은 단방향이다. 아래 레이어 문서는 위 레이어 결정을 바꾸지 못한다.
  - `CLAUDE.md`, `AGENTS.md`, `.claude/`는 도구 규약상 루트에 고정하되 논리적으로 L1에 속하며 `docs/workflow/`의 요약으로 취급한다.
- 서버·보안 경계: 해당 없음 — 런타임 코드가 없다.
- Clean Code·SOLID·재사용:
  - 같은 내용을 두 문서에 복사하지 않는다. 루트 파일은 요약과 링크만 두고 정본은 `docs/`가 소유한다.
- DEV-* 적용 상태:
  - `DEV-ARCH-01`~`DEV-ARCH-05`: 해당 없음 — 제품 코드 변경이 없다.
  - `DEV-REUSE-01`~`DEV-REUSE-05`: 기본 적용 — 정본 하나와 요약 참조 구조를 유지한다.

## Data model

- 정본과 파생 데이터:
  - 실행 상태의 정본은 `docs/execution/phases/index.jsonl`이다. handoff와 실행 증거는 파생 기록이며 승인의 정본이 아니다.
  - RADIO 정본은 `docs/execution/radio/<task-id>-radio.md`, 실행 결과 기록은 `docs/execution/runs/<task-id>/`가 소유한다.
- schema·RLS·migration:
  - DB 변경 없음. `index.schema.json`의 `doc`·`radio_ref` 경로 패턴만 새 구조로 바꾼다. 필드 구성과 승인 계약 정의는 바꾸지 않는다.
- 트랜잭션·멱등성·동시성:
  - 파일 이동은 `git mv`로 이력을 보존한다. 추적되지 않은 파일은 일반 `mv`로 옮긴다.
  - 재실행 시 이미 이동한 파일은 다시 옮기지 않는다.
- 감사·보존·복구:
  - task ID와 승인 이력은 삭제하지 않는다. P0-T29는 제품 승인을 보존하고 개발 승인만 제거한다.
- DEV-* 적용 상태:
  - `DEV-SSOT-01`~`DEV-SSOT-05`: 추가 결정 — 레이어별 정본 소유자를 ADR-0013의 표로 고정한다.
  - `DEV-DATA-*`, `DEV-MIG-*`: 해당 없음 — DB 스키마 변경이 없다.

## Interface

- 입력·DTO·Result: 해당 없음 — 프로그램 인터페이스를 만들지 않는다.
- 문서 인터페이스:
  - handoff의 최소 7개 필드가 인터뷰와 하네스 실행의 공통 계약이다. 형식 정본은 `docs/workflow/HANDOFF.md`다.
  - `index.jsonl`의 한 줄 = 한 JSON 객체 규칙을 유지한다.
- cache·offline: 해당 없음.
- 외부 계약·실패:
  - `package.json`의 깨진 `harness:*` 스크립트를 제거한다. 새 실행 명령은 P0-T31에서 정의한다.
- DEV-* 적용 상태:
  - `DEV-CACHE-*`, `DEV-OFFLINE-*`: 해당 없음.

## Optimizations

- 기본값 유지 또는 최적화 근거:
  - 기본값 유지 — 디렉터리를 4개로만 나누고 더 깊은 분류를 만들지 않는다. 문서 수가 적어 깊은 계층은 탐색 비용만 늘린다.
- 관측성: 재편 결과는 `docs/execution/runs/P0-T30/handoff.md`의 증거 경로로 확인한다.
- 의존성: 새 의존성 없음.
- 복잡도·되돌림:
  - 모든 변경이 파일 이동과 텍스트 수정이므로 Git 이력으로 되돌릴 수 있다.
- DEV-* 적용 상태:
  - `DEV-OPT-*`, `DEV-DEP-*`: 기본 적용 — 새 도구와 의존성을 추가하지 않는다.

## 미결 사항

- 하네스 코드·검사·산출물의 물리 위치와 실행 명령: P0-T31 설계 단계에서 결정한다.
- repository-local 스킬의 새 위치(옛 `.agents/skills/**`): P0-T31 설계 단계에서 결정한다.
- `.githooks/pre-commit`이 제거된 하네스 스크립트를 호출하는 문제: 훅 정책 변경은 승인 범위 밖이므로 사용자 확인 후 P0-T31에서 처리한다.
