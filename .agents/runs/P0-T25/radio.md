## Requirements

- 하네스의 오류·사용법·검증 실패 문구를 한국어로 제공한다.
- task ID, 상태값, check ID, 경로, 명령과 JSON 기계 판독 필드는 그대로 둔다.

## Architecture

- 변경 범위는 `.agents/harness/scripts`와 그 내부 라이브러리의 표시 문자열이다.
- 오류 분류·종료 코드·실행 흐름은 바꾸지 않는다.

## Data model

- 작업 인덱스에 P0-T25 실행 계약과 검증 증거를 기록한다.
- 검증 JSON 구조는 변경하지 않는다.

## Interface

- CLI 오류와 사용법 문구를 한국어로 바꾼다.
- 구조화된 JSON의 상태·필드 값은 기존 값으로 유지한다.

## Optimizations

- 기존 한국어 문구 회귀 검사에 하네스 오류 문자열 검사를 더해 재발을 막는다.
