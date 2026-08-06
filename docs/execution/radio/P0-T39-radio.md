# P0-T39 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-06
- 개발 설계 승인: user, 2026-08-06 (revision 2 재승인 포함)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. P0-T36 교차 검증 확정 발견 8건(F-01 경량·F-02~F-09, F-01 완전 강제 제외)의 처리 설계. |
| 2 | 2026-08-06 | 구현 중 발견된 내부 모순 해소(사용자 결정 B): 기존 행 0개 차단 case 1건이 F-07의 행 0개 전용 메시지와 배타적이라, 해당 case의 기대 문자열 갱신을 허용하는 예외를 불변 규칙에 명시. |

- 관련 spec: DOCS:SDD, ADR:0011
- 적용 깊이: 일반 (harness 게이트 정비·표준 문서 문구 정정. DB·권한·비밀값·UI 경로 없음)
- test mode: tdd (index에 봉인 시 기록)
- 예정 check IDs: radio-lens-hardening-fixtures, typecheck (index에 봉인 시 기록)

## Requirements

### 범위와 비목표

- 범위: ① `harness/lib/radio-doc.ts` 파서 강화(빈 인수 조건 칸·구분자 열 수 검증, 실패 원인 구조화) ② `harness/lib/radio-gate.ts` 판별 fail-closed·스냅숏 스키마 검증·본문 1회 읽기 ③ `harness/self-test/fixture.ts`의 운영 config 결합 해소 ④ 신규 차단·회귀 fixture와 `radio-doc` 단위 테스트 ⑤ `docs/standards/DEVELOPMENT.md`의 `DEV-TEST-01` 렌즈 개수 문구 정정 ⑥ [RADIO 양식 정본](README.md)에 인수 조건 칸 규칙 한 줄 추가.
- 비목표(기획 승인 그대로): 면제 스냅숏 무추가 불변식의 완전 강제(비교 기준선 설계가 별도 논점 — backlog 유지), 렌즈 목록·표 형식 변경, 기존 승인 RADIO 소급 개정. 설계 비목표: P0-T36이 봉인한 스냅숏 파일(`config/radio-lens.json`)의 내용 변경, 다른 게이트 변경.

### 불변 규칙

- 해시 결속 검사의 관찰 가능한 동작(판정·위반 메시지)은 바뀌지 않는다. 본문 1회 읽기는 내부 구현 공유일 뿐이다.
- P0-T36이 확립한 렌즈 표 형식(헤더 6렌즈 이름·순서, 칸 값 2종, 보충 행)은 바뀌지 않는다. 이 task는 형식을 지키지 않는 입력이 통과하던 우회로만 막는다.
- 면제 스냅숏의 판별 의미(스냅숏 안 task는 렌즈 검사 면제)는 바뀌지 않는다. 추가되는 것은 파일 스키마 검증뿐이다.
- 기존 self-test 16 case는 검증 시나리오를 유지한 채 계속 통과한다. 예외 두 가지만 허용한다: ① fixture 격리(F-03)로 fixture 시드 방식이 바뀌는 경우 해당 case의 전제 파일만 fixture 소유 목록으로 바뀌고 단언은 그대로다 ② 행 0개 차단 case 1건("위험 렌즈 표에 행이 없으면 차단한다")은 Data model의 행 0개 전용 메시지 도입에 따라 기대 문자열만 새 메시지로 갱신한다(revision 2, 사용자 결정) — 차단 시나리오 자체는 동일하다. 나머지 15 case의 단언은 무수정이다.

### 기술 인수 조건

1. 인수 조건 칸이 비어 있는(공백만 포함) 행을 `gate:radio`가 행 번호와 함께 차단한다(F-02).
2. 구분자 행의 열 수가 헤더 7열과 다른 표를 행 번호와 함께 차단한다(F-02).
3. 실행 상태(planned 이상)이고 스냅숏 밖인 task의 RADIO에서 변경 허용 경로를 파싱할 수 없으면(절 부재·빈 코드펜스) 문서 task로 간주하지 않고 위반으로 보고한다(F-04, fail-closed). 문서 전용 task와 스냅숏 task의 통과 동작은 그대로다.
4. 표 부재·헤더 불일치·행 0개가 서로 다른 메시지로 보고되고, 헤더 불일치·행 0개는 표의 행 번호 단서를 담는다(F-07).
5. `DEV-TEST-01` MUST 문구가 여섯 렌즈로 정정되어 README·게이트 판정과 어긋나지 않고 `pnpm check:docs`가 통과한다(F-05).
6. `config/radio-lens.json`의 `exemptTasks`가 task ID 형식(`P[0-9]+-T[0-9]{2}`)·오름차순·중복 없음을 위반하면 게이트 실패로 보고한다. 빈 배열은 유효하다(F-01 경량).
7. `createFixtureRoot()`가 운영 `config/radio-lens.json`을 복사하지 않고 fixture 소유 면제 목록을 시드하며, 운영 파일 내용과 무관하게 기존 case가 통과한다(F-03). P0-T36의 스냅숏 전수 대조 test(운영 config ↔ 고정 index fixture)는 봉인된 계약이므로 그대로 둔다.
8. RADIO 본문을 task마다 1회 읽어 해시 검사와 렌즈 검사가 같은 바이트를 공유한다(F-06).
9. 렌즈 위반의 `violation.file`·`violation.line` 값, 스냅숏 파일 부재 fail-closed, `hasCodePaths`(주석·공백 변형)·`parseRiskLensTable`(직접 호출) 동작이 self-test로 단언된다(F-08·F-09).
10. `pnpm verify` 전체 통과.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 빈 인수 조건 칸 차단 | 테스트함 — 기존 정상 표 통과 fixture 유지 | 테스트함 — 인수 조건 칸이 빈 행 차단 fixture | 테스트함 — 공백만 담긴 칸도 빈 칸으로 판정 | 해당 없음 — 로컬 파일 검사로 권한 경계가 없다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |
| 2 구분자 열 수 차단 | 테스트함 — 7열 구분자 정상 통과 | 테스트함 — 한 칸짜리 구분자 행 차단 fixture | 테스트함 — 6열·8열 구분자 각각 차단 | 해당 없음 — 로컬 파일 검사로 권한 경계가 없다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |
| 3 허용 경로 fail-closed | 테스트함 — 정상 허용 경로 코드 task는 렌즈 검사 수행 | 테스트함 — 절 부재·빈 코드펜스가 위반 보고 | 테스트함 — 문서 전용 task 통과·스냅숏 task 면제 유지 | 해당 없음 — 로컬 파일 검사로 권한 경계가 없다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |
| 4 진단 메시지 구분 | 테스트함 — 정상 표 무위반 | 테스트함 — 표 부재·헤더 불일치·행 0개 세 메시지 각각 단언 | 테스트함 — 헤더 한 글자 차이 fixture가 헤더 불일치로 보고 | 해당 없음 — 로컬 파일 검사로 권한 경계가 없다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |
| 5 DEV-TEST-01 정정 | 테스트함 — check:docs 통과로 링크·문서 규칙 확인 | 해당 없음 — 문구 정정이라 실패 경로가 없다 | 해당 없음 — 문구 정정이라 경계 입력이 없다 | 해당 없음 — 문서 변경이다 | 해당 없음 — 문서 변경이다 | 해당 없음 — 문서 변경이다 |
| 6 스냅숏 스키마 검증 | 테스트함 — 현행 운영 스냅숏이 통과 | 테스트함 — ID 형식 위반·중복·비정렬 각각 게이트 실패 fixture | 테스트함 — 빈 배열은 유효로 단언 | 해당 없음 — 로컬 파일 검사로 권한 경계가 없다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |
| 7 fixture 격리 | 테스트함 — 기존 case가 fixture 소유 목록으로 통과 | 테스트함 — 운영 config를 참조하지 않음을 시드 경로로 단언 | 해당 없음 — 격리는 이진 속성이라 경계 입력이 없다 | 해당 없음 — 테스트 내부 구조 변경이다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |
| 8 본문 1회 읽기 | 테스트함 — 기존 16 case 회귀로 해시·렌즈 판정 불변 확인 | 테스트함 — 해시 위반·렌즈 위반 동시 보고 fixture 유지 | 테스트함 — RADIO 파일 부재 시 기존 위반 경로 유지 | 해당 없음 — 로컬 파일 검사로 권한 경계가 없다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |
| 9 회귀 단언 확충 | 테스트함 — file·line 값 단언 추가 | 테스트함 — 스냅숏 파일 부재 fail-closed fixture 추가 | 테스트함 — hasCodePaths 주석·공백 변형과 parseRiskLensTable 직접 호출 단위 테스트 | 해당 없음 — 로컬 파일 검사로 권한 경계가 없다 | 해당 없음 — 네트워크 요청이 없다 | 해당 없음 — 단일 프로세스 순차 실행이다 |

- 보충: 인수 조건 5의 실질 위험은 상위 문서 정본성(README·게이트와의 재충돌)이며, `check:docs`가 기계 확인하는 범위 밖 의미 정합은 교차 검증이 본다.

### DEV-* 적용 상태

- `DEV-SSOT-01`: 렌즈 표 형식 정본은 README 한 곳 유지. 이 task는 정본 규칙에 "인수 조건 칸은 비울 수 없다" 한 줄만 더한다.
- `DEV-TEST-01`: 문구 정정 대상이자 이 RADIO가 첫 준수 사례다(위 렌즈 표).
- `DEV-CODE-07`·`DEV-NAME-06`·`DEV-TEST-06`: harness 코드 관행 그대로 적용한다.

## Architecture

- `harness/lib/radio-doc.ts`: `parseRiskLensTable`의 반환을 구조화한다 — `{ kind: "missing" } | { kind: "header-mismatch", line } | { kind: "separator-mismatch", line } | { kind: "ok", headerLine, rows }`. 행 데이터에 `criterion`(공백 정규화)과 `line`을 유지한다. `hasCodePaths`는 무수정.
- `harness/lib/radio-gate.ts`: ① `runRadioGate`가 task마다 RADIO 본문을 `readTextFile` 1회로 읽어 해시(sha256 of bytes)와 렌즈 검사에 같은 내용을 전달한다 — `checkRadioBindings`의 판정·메시지는 불변 ② 렌즈 대상 판별에서 `parseAllowedPaths` 결과가 빈 배열이면 위반을 생성한다(fail-closed) ③ `loadExemptTasks`에 스키마 검증(ID 정규식·오름차순·중복 없음)을 추가하고 위반 시 게이트 실패 ④ `checkRiskLensMarkdown`이 파서의 구조화된 실패를 각각의 메시지로 변환하고 빈 인수 조건 칸을 행 번호와 함께 보고한다.
- `harness/self-test/fixture.ts`: `createFixtureRoot()`가 fixture 소유 면제 목록 `{ "exemptTasks": ["P0-T01"] }`을 시드한다(운영 파일 복사 제거). 렌즈 전용 fixture의 명시 덮어쓰기 헬퍼는 유지.
- `harness/self-test/radio-doc.test.ts`(신규): `parseRiskLensTable`·`hasCodePaths` 직접 호출 단위 테스트.
- `harness/self-test/radio-gate.test.ts`: 신규 차단 fixture(빈 인수 조건·구분자 6/1/8열·허용 경로 부재·스키마 위반 3종·스냅숏 부재)와 `violation.file`·`violation.line` 단언을 추가한다. 기존 16 case는 무수정.
- `docs/standards/DEVELOPMENT.md`: `DEV-TEST-01` MUST 문구 "다섯 위험 렌즈" → "여섯 위험 렌즈".
- `docs/execution/radio/README.md`: 칸 값 규칙에 "인수 조건 칸은 비울 수 없다" 추가.

## Data model

위반 메시지 형식(기존 `violation.ts` 구조, `<task-id>` 접두 관례 유지):

- `"<task-id>: 위험 렌즈 표가 없습니다"` — 절·표 부재(기존 유지, line 없음)
- `"<task-id>: 렌즈 표 헤더가 정본 형식과 다릅니다"` — 헤더 행 line 포함
- `"<task-id>: 렌즈 표 구분자 행의 열 수가 헤더와 다릅니다"` — 구분자 행 line 포함
- `"<task-id>: 렌즈 표에 인수 조건 행이 없습니다"` — 헤더 행 line 포함
- `"<task-id>: <n>행의 인수 조건 칸이 비어 있습니다"` — 해당 행 line 포함
- `"<task-id>: 변경 허용 경로를 파싱할 수 없어 코드 task 여부를 판별할 수 없습니다"` — fail-closed
- `"exemptTasks 스키마 위반: <사유>"` — 스냅숏 파일 경로로 보고

스냅숏 스키마(검증만 추가, 파일 무수정): `{ "exemptTasks": string[] }` — `P[0-9]+-T[0-9]{2}` 형식, 사전순 오름차순, 중복 없음, 빈 배열 유효.

## Interface

- 게이트 통과 시 무출력 exit 0, 위반 시 파일·행 단서 violation(기존 관례 불변).
- README의 작성자 규칙 변화는 "인수 조건 칸은 비울 수 없다" 한 줄뿐이다 — 기존 정상 RADIO의 작성 방식은 영향받지 않는다.

## Optimizations

- 본문 1회 읽기(F-06)로 task당 파일 I/O가 2회 → 1회가 된다. 그 외 최적화 없음.

## 변경 허용 경로

```
harness/lib/**
harness/self-test/**
docs/standards/DEVELOPMENT.md
docs/execution/radio/README.md
docs/execution/radio/P0-T39-radio.md
docs/execution/runs/P0-T39/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 없음. 스냅숏 무추가 완전 강제는 비목표로 backlog가 추적한다(승격 시 비교 기준선 설계가 선결 논점).
