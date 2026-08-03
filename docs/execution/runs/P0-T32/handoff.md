# P0-T32 handoff

## 2026-08-03 · 설계(실행 직전 구체화) 종료

- 작업 식별자: P0-T32 (교차 검증 에이전트 시스템)
- 현재 단계: 설계 종료 → 다음 개발
- 기준 시각: 2026-08-03

### 확정된 사실

- 기획 승인(user, 2026-08-03)과 개발 설계 승인(user, 2026-08-03)이 모두 있고, 설계 정본은 `docs/execution/radio/P0-T32-radio.md`(revision 1)다.
- 승인 SHA-256 `8900a32610108785c1b5eadf440f2d1c5e338e6a352a0a83eb2acf4b17786333`과 실제 RADIO 파일 해시가 일치함을 실행 전에 확인했다. RADIO 본문은 수정하지 않는다.
- 의존 task P0-T31은 `done`이다. 실행 조건을 만족한다.
- `docs/execution/phases/index.jsonl`에서 P0-T32를 `planned` → `in_progress`로 바꿨다. 같은 줄의 다른 필드와 다른 task는 손대지 않았다(`updated_at`은 이미 `2026-08-03`).
- `test_mode`는 `docs_only`다. TDD 증거(`tdd.json`)는 요구되지 않으며 `gate:tdd`도 `test_mode=tdd`가 아닌 task는 검사하지 않는다.
- 등록 check는 `review-format-example`, `doc-link-integrity` 2종이다.

#### 산출물 목록 (RADIO Architecture·Data model 절의 구체화)

- `docs/workflow/REVIEW.md` (신설) — 교차 검증 프로세스 정본. 목적, 리뷰어 3자와 호출 방식, 절차(독립 리뷰 → 교차 확인·반박 → 2/3 확정), 평가 영역 5개와 점수 산정, 중요도 4단계와 에스컬레이션, 실행 시점, 성능 저하 규칙, 결과·backlog 형식, 기록 금지 사항, task 승격 경로.
- `docs/execution/reviews/example-review.json` (신설) — RADIO Data model 형식과 정확히 일치하는 예시 fixture. P0-T29 대시보드 파서 테스트 입력으로도 쓴다.
- `docs/execution/reviews/backlog.md` (신설) — 형식 설명 헤더 + 빈 목록.
- `docs/workflow/WORKFLOW.md` (수정) — 4단계 검증 절에 `REVIEW.md` 참조 추가. 기존 계약 내용은 바꾸지 않는다.
- `docs/execution/runs/P0-T32/handoff.md` (이 파일).

#### 검증 방법 (RADIO 기술 인수 조건의 구체화)

- `review-format-example`: `python3`로 `example-review.json`을 실제 파싱하고 `REVIEW.md`의 형식 정의(최상위 필드, 점수 5영역과 0~100 범위, `total`이 5영역 평균, `severity` 허용값, `agreed_by` ⊂ {main, codex, opus}이고 2개 이상, finding id 유일성)를 필드 단위로 검사한다.
- `doc-link-integrity`: 신규·수정 문서의 마크다운 상대 링크를 추출해 실제 파일 존재를 확인한다.
- 추가로 `pnpm gate:all`(index·RADIO 해시·handoff·TDD·커밋 범위)이 통과해야 한다.

### 미결 사항

- 없음. RADIO의 미결 사항도 "없음"이며 새 제품·기술 결정이 필요한 지점은 발견되지 않았다.

### 다음 행동

1. `docs/workflow/REVIEW.md`를 작성하고 이어서 `docs/execution/reviews/`의 fixture와 backlog를 만든 뒤 `WORKFLOW.md` 검증 단계에 참조를 추가한다.

### 증거·산출물 경로

- `docs/execution/radio/P0-T32-radio.md` (승인 정본, 수정 금지)
- `docs/execution/phases/index.jsonl` (P0-T32 = `in_progress`)
- `docs/execution/runs/P0-T32/handoff.md` (이 파일)

## 2026-08-03 · 개발 종료

- 작업 식별자: P0-T32
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-03

### 확정된 사실

- `docs/workflow/REVIEW.md`를 신설했다. 승인된 RADIO의 Architecture·Data model·Interface 절을 그대로 문서화했다.
  - 리뷰어 3자(`main`·`codex`·`opus`)와 호출 방식을 표로 고정했다. `/codex:review`는 소규모 `--wait`·대규모 `--background`, 설계·가정 공격은 `/codex:adversarial-review`다.
  - 독립성 규칙을 명시했다. 메인 에이전트는 다른 리뷰어에게 자신의 발견·결론·점수를 전달하지 않고 대상 범위와 기준만 전달한다.
  - 절차를 대상 확정 → 독립 리뷰 → 교차 확인·반박 → 2자 이상 확정 → 중요도·점수 판정 → 기록 → 에스컬레이션 7단계로 고정하고 mermaid 흐름도를 함께 두었다.
  - 평가 영역 5개를 JSON 키·`DEV-*` 규칙과 연결했다. 영역별 100점, `total`은 5개 영역 평균의 반올림 정수다.
  - 중요도 4단계 정의와 처리를 표로 고정했다. `critical`은 `blocked` + 즉시 보고, `high`는 즉시 보고 + 루프 계속, `medium`·`low`는 backlog다.
  - Codex 사용 불가 시 2자 진행 규칙을 넣었다. 확정 기준은 그대로 2자 인정이므로 2자 진행에서는 두 리뷰어가 모두 인정해야 한다(`agreed_by` 2개 이상 규칙에서 그대로 도출된다).
  - 비밀값·개인정보·악용 가능한 payload 기재 금지와, 개선 사항의 task 승격이 사용자 승인 + 기획 단계 경유임을 명시했다.
- `docs/execution/reviews/example-review.json`을 만들었다. 3자 참여, 영역 점수 5개(평균 84), 중요도 4단계를 모두 포함한 확정 발견 4건, `agreed_by` 3자·2자 조합을 함께 예시한다.
- `docs/execution/reviews/backlog.md`를 형식 설명 + 빈 목록으로 초기화했다.
- `docs/workflow/WORKFLOW.md`에 참조를 추가했다. 머리말 관련 문서, 파이프라인 표의 4단계 산출물, 4단계 검증 절차 항목이며 기존 계약 내용은 바꾸지 않았다.
- 변경 파일 6개는 모두 RADIO의 변경 허용 경로 안이다. `index.jsonl`은 P0-T32의 `status` 한 값만 바꿨다.

#### RADIO에 없던 필드 2개를 형식에 추가했다

RADIO Data model이 요구하는 기록을 담을 자리가 필드 목록에 없어 이름을 정했다. 의미는 RADIO 문장 그대로이며 새 규칙을 만들지 않았다.

- `score_rationale` — "영역 점수의 근거를 결과 파일에 기록한다"를 담는다. `scores`와 같은 5개 키를 가진다.
- `participants_note` — "2자 진행 사실을 참여자 기록에 남긴다"를 담는다. 3자 전부면 빈 문자열이다.

### 미결 사항

- 수동 전체 스캔 결과 파일의 이름 규칙 — 결정 주체: 사용자, 반환할 단계: 설계. RADIO는 결과 정본을 `<task-id>-review.json`으로만 정의해 task에 매이지 않는 스캔의 파일 이름이 비어 있다. 임의로 정하지 않고 `REVIEW.md`의 미결 사항으로 남겼으며, 확정 전까지 수동 스캔 결과는 backlog와 사용자 보고로만 남긴다.
- `score_rationale`·`participants_note` 두 필드 추가 — 사후 확인 주체: 사용자, 반환할 단계: 설계(불수용 시 RADIO Data model 절만 개정).
- 판단 재료가 없는 평가 영역(예: 문서 전용 변경의 `performance`)을 100점으로 처리하고 그 사실을 `score_rationale`에 적는 규칙 — 사후 확인 주체: 사용자, 반환할 단계: 설계. `total`이 5개 영역 평균이라는 승인된 정의를 유지하려면 영역을 비울 수 없어 정한 운영 규칙이다.

### 다음 행동

1. check 2종(`review-format-example`, `doc-link-integrity`)과 `pnpm gate:all`을 실행해 검증 단계를 마친다.

### 증거·산출물 경로

- `docs/workflow/REVIEW.md` (신규)
- `docs/execution/reviews/example-review.json`, `docs/execution/reviews/backlog.md` (신규)
- `docs/workflow/WORKFLOW.md` (참조 추가)
- `docs/execution/phases/index.jsonl` (P0-T32 = `in_progress`)

## 2026-08-03 · 검증 종료

- 작업 식별자: P0-T32
- 현재 단계: 검증 종료 → 다음 리팩토링
- 기준 시각: 2026-08-03

### 확정된 사실

- 등록 check 2종을 모두 실행해 통과했다. `test_mode`가 `docs_only`이므로 두 check는 문서 형식·링크 검사다.
  - `review-format-example`: `python3`로 `example-review.json`을 실제 파싱해 93개 항목 통과, 종료 코드 0. 필드 목록을 손으로 베끼지 않고 `REVIEW.md`의 JSON 스켈레톤과 두 필드 표에서 추출해 fixture의 키와 정확히 일치하는지 비교했다. 이어서 `task_id` 패턴, `at`의 ISO 8601 파싱, `base_commit` 40자 SHA-1, `participants`·`agreed_by`의 `main`·`codex`·`opus` 부분집합·중복 없음·2개 이상, `scores` 5개 키의 0~100 정수, `score_rationale` 키 일치와 빈 값 없음, `total`이 평균 84의 반올림과 일치, finding id 유일성, `severity`·`area` 허용값, `agreed_by` ⊆ `participants`를 검사했다.
  - `doc-link-integrity`: 신규·수정 문서 4개(`REVIEW.md`, `WORKFLOW.md`, `backlog.md`, 이 handoff)의 상대 링크 27개가 모두 실제 파일을 가리킨다. 종료 코드 0. 링크의 `#앵커`도 대상 문서의 실제 제목과 대조했다.
- 두 check가 실제로 실패를 잡는지 음성 대조로 확인했다. 임시 사본에서 `total`을 99로 바꾸고 `agreed_by`를 1명으로 줄이고 `severity`를 `blocker`로 바꾸자 4개 항목이 실패(종료 코드 1)했고, 링크를 없는 파일·없는 앵커로 바꾸자 두 위반을 모두 보고했다. 저장소 원본은 바꾸지 않았다.
- `pnpm gate:all`(index·RADIO 해시·handoff·TDD·커밋 범위)이 출력 없이 종료 코드 0으로 통과했다.
- 변경 파일 6개를 실제로 staged 상태로 두고 `pnpm gate:scope`를 실행해 종료 코드 0을 확인했다. 승인된 변경 허용 경로를 벗어난 파일이 없다는 실측 증거다. 확인 후 staged 상태를 원복했고 commit은 하지 않았다.
- 인수 조건 대응: 검증 프로세스 문서 정의(`REVIEW.md`), 결과·backlog 형식 고정과 예시 fixture(`review-format-example` 통과), 운영 계약 검증 단계 참조(`WORKFLOW.md` 4단계), `critical`·`high` 보고 규칙과 연속 루프 규칙의 연결(`REVIEW.md` 중요도 표 + `WORKFLOW.md`에서 연속 루프 규칙으로 연결).

### 미결 사항

- 개발 종료 시점의 미결 3건이 그대로 유효하다(수동 전체 스캔 결과 파일 이름 규칙, 필드 2개 추가, 판단 재료 없는 영역의 100점 처리).
- check 스크립트 2종은 저장소에 남기지 않았다. RADIO의 변경 허용 경로가 `harness/**`를 포함하지 않아 이번 task에서 하네스에 등록할 수 없다. 재실행 가능한 형태로 하네스에 넣을지는 사후 결정 사항 — 결정 주체: 사용자, 반환할 단계: 설계.

### 다음 행동

1. 문서 간 중복·불일치를 정리하고 두 check를 다시 실행해 GREEN을 확인한다.

### 증거·산출물 경로

- `docs/execution/reviews/example-review.json` (check 입력)
- `docs/workflow/REVIEW.md`, `docs/workflow/WORKFLOW.md`, `docs/execution/reviews/backlog.md` (링크 검사 대상)

## 2026-08-03 · 리팩토링 종료

- 작업 식별자: P0-T32
- 현재 단계: 리팩토링 종료 → 완료(`done`)
- 기준 시각: 2026-08-03

### 확정된 사실

- 문서 의미를 바꾸지 않고 중복 두 곳을 정리했다.
  - `backlog.md`가 갖고 있던 형식·처리 규칙 5줄을 지우고 한 줄 형식과 정본 링크만 남겼다. 같은 규칙이 두 파일에 있으면 한쪽만 고쳐져 어긋난다. 규칙 정본은 `REVIEW.md`의 backlog 형식 절 하나다.
  - `WORKFLOW.md` 4단계의 중요도별 처리 서술을 `REVIEW.md`의 중요도 표 링크로 바꿨다. 4단계 정의를 두 문서가 각각 갖지 않게 하고, `critical`의 안전 중단이 연속 루프 규칙의 `blocked` 경로와 같다는 연결만 남겼다.
- `WORKFLOW.md` 변경은 참조 연결과 산출물 이름 추가뿐이다. 승인 게이트, 상태 전이, 연속 루프 규칙 등 기존 계약 문장은 하나도 바꾸지 않았다.
- 정리 후 재검증 결과: `review-format-example` 93개 항목 통과(종료 코드 0), `doc-link-integrity` 상대 링크 28개 통과(종료 코드 0), `pnpm gate:all` 출력 없이 종료 코드 0.
- 변경 파일은 6개이며 모두 RADIO의 변경 허용 경로 안이다.
  - 신규: `docs/workflow/REVIEW.md`, `docs/execution/reviews/example-review.json`, `docs/execution/reviews/backlog.md`, `docs/execution/runs/P0-T32/handoff.md`
  - 수정: `docs/workflow/WORKFLOW.md`(참조 연결), `docs/execution/phases/index.jsonl`(P0-T32 `status`만)
- `index.jsonl`의 P0-T32를 `done`으로 갱신했다. `updated_at`은 이미 `2026-08-03`이라 값이 그대로다. 같은 줄의 다른 필드와 다른 task는 이 task 내내 변경하지 않았다.
- 승인 SHA-256 결속 RADIO 파일은 하나도 수정하지 않았다.

### 미결 사항

- 수동 전체 스캔 결과 파일의 이름 규칙 — 결정 주체: 사용자, 반환할 단계: 설계. `REVIEW.md`의 미결 사항 절에 그대로 남아 있다.
- `score_rationale`·`participants_note` 필드 추가와, 판단 재료가 없는 평가 영역을 100점으로 처리하는 규칙 — 사후 확인 주체: 사용자, 반환할 단계: 설계(불수용 시 RADIO Data model 절만 개정).
- check 스크립트 2종을 저장소에 남기지 않았다. RADIO의 변경 허용 경로에 `harness/**`가 없어 이번 task에서 하네스에 등록할 수 없다 — 결정 주체: 사용자, 반환할 단계: 설계.
- 이 task 자체에는 3자 교차 검증을 실행하지 않았다. 프로세스를 정의하는 task이고 승인된 검증 계약은 check 2종이다. 계약은 다음 task의 4단계부터 적용된다 — 결정 주체: 사용자.
- `docs/README.md`의 문서별 책임 표에 `REVIEW.md` 줄이 없다. `docs/README.md`는 이번 RADIO의 변경 허용 경로가 아니라 손대지 않았다 — 결정 주체: 사용자, 반환할 단계: 설계(다음 문서 task에서 한 줄 추가).
- 이번 작업은 commit하지 않았다.

### 다음 행동

1. 사용자가 변경 6개를 검토하고 commit 메시지에 `P0-T32`를 포함해 commit한다(예: `docs(P0-T32): 교차 검증 계약과 결과 형식 정의`).
2. 다음 후보는 `planned` 큐를 다시 확인해 정한다. P0-T29는 `planned`이고 의존 task(P0-T28·P0-T31·P0-T32)가 모두 `done`이 되어 실행 가능한 후보가 된다.

### 증거·산출물 경로

- `docs/workflow/REVIEW.md`
- `docs/execution/reviews/example-review.json`, `docs/execution/reviews/backlog.md`
- `docs/workflow/WORKFLOW.md`
- `docs/execution/runs/P0-T32/handoff.md` (이 파일)
- `docs/execution/phases/index.jsonl` (P0-T32 = `done`)
