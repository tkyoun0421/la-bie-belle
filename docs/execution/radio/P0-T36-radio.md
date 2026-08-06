# P0-T36 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-06
- 개발 설계 승인: user, 2026-08-06

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. 기획 인터뷰 확정 4건 반영: 같은 절 형식 강제, 코드 변경 task만 적용, 변경 허용 경로 기준 판별, 시행 후 첫 봉인부터 적용. |

- 관련 spec: DOCS:SDD, ADR:0011
- 적용 깊이: 일반 (harness 게이트 확장·계약 파일·양식 문서. DB·권한·비밀값·UI 경로 없음)
- test mode: tdd (index에 봉인 시 기록)
- 예정 check IDs: radio-lens-fixtures, typecheck (index에 봉인 시 기록)

## Requirements

### 범위와 비목표

- 범위: ① `harness/lib/radio-doc.ts`에 위험 렌즈 표 파서와 코드 task 판별 추가 ② `harness/lib/radio-gate.ts`에 렌즈 검사 편입 ③ 면제 스냅숏 계약 파일 `config/radio-lens.json` 신설 ④ [RADIO 양식 정본](README.md)에 렌즈 표 형식·작성 규칙 절 추가 ⑤ `harness/self-test/radio-gate.test.ts`에 fixture 검증 확장.
- 비목표(기획 승인 그대로): 기존 승인 RADIO의 소급 개정, 렌즈 목록의 task별 커스터마이징, 위험 렌즈 결과의 자동 테스트 생성. 설계 비목표: 기존 해시 결속 검사의 재구현·이동, 다른 게이트 변경.

### 불변 규칙

- 기존 해시 결속 검사(`checkRadioBindings`)의 동작은 바뀌지 않는다 — 렌즈 검사는 그 위에 추가되는 독립 검사다.
- 면제 스냅숏은 구현 시점에 `development_approval`이 이미 기록된 task ID의 고정 목록이며, 생성 이후 항목을 추가하지 않는다(P0-T36 자신 포함). 목록 축소(조기 채택)는 해당 task RADIO의 재봉인으로만 가능하다.
- 렌즈 검사 대상은 세 조건의 교집합이다: `EXECUTABLE_STATUSES`(planned 이상) ∧ 코드 task(변경 허용 경로 기준) ∧ 스냅숏 밖.
- 렌즈 6종의 이름과 순서는 고정이다: Happy Path·주요 실패·경계값·권한·중복 요청·동시성.
- 통과 시 무출력 exit 0, 위반 시 파일·행 단서를 담은 violation(기존 게이트 관례).

### 기술 인수 조건

- 위험 렌즈 표가 없는 코드 task RADIO를 `gate:radio`가 차단한다(index 등록 verification ①).
- 표의 각 칸에 `테스트함` 또는 `해당 없음 — 사유`가 없으면 차단한다(verification ②). 인수 조건 행 누락(표의 행 0개)도 차단이다.
- 문서 전용 task(변경 허용 경로가 전부 `docs/**`·`.claude/**`)는 표 없이 통과한다.
- `config/radio-lens.json`의 스냅숏에 든 task는 재봉인이 있어도 표를 요구받지 않는다(verification ③). 판별 입력은 index와 봉인 RADIO뿐이라 결정적이다.
- 차단 메시지가 RADIO 파일 경로와 문제 행 번호, 누락된 렌즈 칸 이름을 지목한다.
- `docs/execution/radio/README.md`가 렌즈 표 형식·칸 값 규칙·보충 행 규칙을 소유한다.
- self-test fixture가 차단 4종(표 부재·빈 칸·사유 없는 해당 없음·행 0개)과 통과 3종(정상 표·문서 task·스냅숏 task)을 각각 단언한다(`radio-lens-fixtures`).
- `pnpm verify` 전체 통과.

### 위험 기반 테스트

| 위험 | 검증 |
| --- | --- |
| 파서가 정상 RADIO를 오탐(형식 미세 차이로 차단) | 통과 fixture + 시행 후 첫 실전 RADIO(P1-T01)에서 실사용 확인 |
| 스냅숏 누락으로 기존 task 재봉인이 갑자기 차단됨 | 스냅숏 생성 시 index의 development_approval 보유 전 task 대조를 테스트로 단언 |
| 코드 task 판별이 경로 형식 변형(주석·공백)에 흔들림 | parseAllowedPaths 재사용으로 단일 파서 유지 + 판별 단위 테스트 |
| 렌즈 검사가 해시 결속 검사를 가림(순서·조기 return) | 두 검사의 위반이 독립적으로 모두 보고됨을 fixture로 단언 |

### DEV-* 적용 상태

- `DEV-SSOT-01`: 렌즈 표 형식의 정본은 README 한 곳, 판별 입력은 기존 파서(parseAllowedPaths) 재사용으로 중복을 만들지 않는다.
- `DEV-CODE-07`·`DEV-NAME-06`·`DEV-TEST-06`: harness 코드 관행 그대로 적용한다.

## Architecture

- `harness/lib/radio-doc.ts`: ① `parseRiskLensTable(markdown)` — "### 위험 기반 테스트" 절 아래 첫 표를 파싱해 헤더 검증(렌즈 6열), 행별 칸 값을 구조화해 반환(행 번호 포함) ② `hasCodePaths(paths)` — 허용 경로 배열에 `docs/`·`.claude/` 접두가 아닌 항목 존재 여부.
- `harness/lib/radio-gate.ts`: 해시 결속 검사 후 같은 순회에서 렌즈 검사 수행. 대상 판별 → RADIO 본문 파싱 → 위반 수집. 스냅숏은 `config/radio-lens.json`에서 1회 로드.
- `config/radio-lens.json`(신규): `{ "exemptTasks": ["P0-T01", …] }` — 구현 시점에 `development_approval`이 기록된 전 task ID. 항목별 사유 주석 없이 목록만(계약 파일 관례).
- `docs/execution/radio/README.md`: "위험 기반 테스트" 템플릿 절을 렌즈 표 형식으로 갱신 — 표 헤더, 칸 값 2종, 보충 행 규칙, 문서 task 면제 기준, 예시 1개.
- `harness/self-test/radio-gate.test.ts`: 기존 fixture 유지 + 렌즈 차단 4종·통과 3종 fixture 추가.

## Data model

렌즈 표 형식(README가 정본으로 소유할 규칙):

- 위치: RADIO의 `### 위험 기반 테스트` 절, 첫 번째 표.
- 헤더: `| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |` — 이름·순서 고정.
- 칸 값: `테스트함`으로 시작(뒤에 보충 서술 허용) 또는 `해당 없음 — <사유>`(사유 비어 있으면 위반).
- 보충 행: 렌즈로 표현되지 않는 서술형 위험은 표 아래 불릿 목록으로 허용하며 검사 대상이 아니다.
- 행: 기술 인수 조건마다 1행 이상. 행 0개는 위반.

스냅숏 파일 스키마: `{ "exemptTasks": string[] }` — task ID 오름차순, 중복 없음.

## Interface

- 위반 메시지: `"<task-id>: 위험 렌즈 표가 없습니다"` / `"<task-id>: <인수 조건> 행의 <렌즈> 칸이 비어 있거나 사유가 없습니다"` 형식으로 RADIO 파일 경로·행 번호를 담는다(기존 `violation.ts` 구조).
- `config/radio-lens.json` 부재·형식 오류는 게이트 실패로 보고한다(fail-closed, ADR-0011 관례).

## Optimizations

- RADIO 본문은 해시 검사에서 이미 읽으므로 렌즈 검사에 추가 파일 I/O가 없다(읽은 본문 재사용). 그 외 최적화 없음.

## 변경 허용 경로

```
harness/lib/**
harness/self-test/**
config/radio-lens.json
docs/execution/radio/README.md
docs/execution/radio/P0-T36-radio.md
docs/execution/runs/P0-T36/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 렌즈 표의 실효성(오탐률·작성 비용)은 P1-T01 RADIO에서 첫 실사용 후 평가한다 — 결정 주체: 사용자, 반환할 단계: P1-T01 설계 회고.
- 스냅숏 task의 조기 채택(자발적 렌즈 표 작성)은 해당 task 재봉인 결정과 함께 다룬다 — 결정 주체: 사용자.
