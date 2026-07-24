# P0-T27 RADIO

## Requirements

- `DOCS:SDD`, `ADR:0008`에 따라 `.agents/skills/**`만 검사한다.
- 각 `SKILL.md` 본문과 `agents/openai.yaml`의 `display_name`, `short_description`, `default_prompt`에 한국어 안내가 있어야 한다.
- 영문 식별자, `$skill-name`, 파일 경로, 코드와 명령어는 허용한다.
- 누락 또는 영문 전용 사용자 노출 필드는 대상 경로와 해결 방법을 포함한 한국어 오류로 실패한다.
- 전용 self-test는 정상, 누락, 영문 전용 fixture와 저장소 외부 경로 제외를 검증한다.

## Architecture

- `.agents/harness/scripts/lib/skill-language.mjs`에 재사용 가능한 검사 로직을 둔다.
- `.agents/harness/scripts/skill-language-self-test.mjs`가 임시 fixture로 검사기의 경계 사례를 검증한다.
- 기존 `.agents/harness/scripts/skill-validator.mjs`가 동일 검사 로직을 호출해 `skill-validators`에 통합한다.
- `.agents/harness/checks.json`에 `skill-language-guard`를 등록한다.

## Data model

- 데이터베이스, migration, RLS, 개인정보, 감사 기록 변경이 없다.
- 파일 기반 입력은 repository-local 스킬 디렉터리와 YAML 사용자 노출 필드로 한정한다.

## Interface

- 검사 성공 시 한국어 성공 메시지를 출력한다.
- 검사 실패 시 파일 경로, 누락·영문 전용 필드, 한국어 작성 방법을 오류 메시지에 포함한다.
- 외부 API, Zod, Result, DTO, cache 변경이 없다.

## Optimizations

- 외부 YAML 의존성을 추가하지 않고 제한된 `interface` 필드를 결정적으로 읽는다.
- 작은 repository-local 디렉터리를 동기식으로 한 번 순회하며 별도 성능 최적화는 하지 않는다.
