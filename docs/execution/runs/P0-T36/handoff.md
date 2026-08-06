# P0-T36 handoff

## 2026-08-06 · 개발 단계 종료

- 작업 식별자: P0-T36 (RADIO 위험 렌즈 표 필수화)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-06

### 확정된 사실

- 실행 전 승인 SHA-256(`7eec220804b85a95a0cf9c2d066d09045b6365f0d885173c890d0213ec17a939`, revision 1)과 실제 `docs/execution/radio/P0-T36-radio.md` 파일 해시가 일치함을 확인했다. RADIO 본문은 수정하지 않았다.
- `docs/execution/phases/index.jsonl`에서 P0-T36을 `planned` → `in_progress`로 바꿨다. 같은 줄의 다른 필드와 다른 task는 손대지 않았다.
- `harness/lib/radio-doc.ts`에 `parseRiskLensTable(markdown)`과 `hasCodePaths(paths)`를 추가했다. 렌즈 표는 `### 위험 기반 테스트` 절 아래 첫 markdown 표만 인식하고, 헤더가 렌즈 6열(`인수 조건·Happy Path·주요 실패·경계값·권한·중복 요청·동시성`) 이름·순서와 정확히 일치해야 표로 인정한다. 기존 `parseAllowedPaths`는 손대지 않았다.
- `harness/lib/radio-gate.ts`에 `checkRiskLensMarkdown`·`checkRiskLensTables`(대상 판별: `EXECUTABLE_STATUSES` ∧ `hasCodePaths` ∧ 스냅숏 밖)와 면제 스냅숏 로더(`config/radio-lens.json`, fail-closed)를 추가했다. `runRadioGate`는 기존 `checkRadioBindings`(해시 결속, 코드 무변경)와 새 렌즈 검사를 각각 독립 실행해 결과를 이어 붙인다 — 한쪽이 실패해도 다른 쪽 검사와 위반 수집을 막지 않는다(fixture로 단언).
- `config/radio-lens.json`(신규)의 `exemptTasks`는 구현 시점 `docs/execution/phases/index.jsonl`에서 `development_approval` 필드가 있는 task 16개(P0-T01~05, P0-T28~38 중 승인분, P0-T36 자신 포함)를 오름차순으로 기계 추출한 고정 목록이다. `harness/self-test/fixtures/index-snapshot-p0-t36.jsonl`(index.jsonl을 이 시점에 그대로 복사한 고정 fixture)을 입력으로 같은 추출 로직을 재실행해 `config/radio-lens.json`과 정확히 일치함을 self-test로 단언했다 — fixture가 그 시점의 실제 index를 그대로 복사한 정적 파일이라 이후 index.jsonl이 커져도(새 task의 development_approval 추가) 이 test는 흔들리지 않는다.
- `harness/self-test/fixture.ts`의 `createFixtureRoot()`가 이제 `config/radio-lens.json` 실물도 함께 복사해 다른 게이트·훅 self-test(P0-T01 기본 fixture는 실제 스냅숏에도 포함돼 있어 그대로 통과)에 회귀가 없다. 새 렌즈 전용 fixture는 실제 스냅숏에 없는 `P9-T01` id를 쓰고 `config/radio-lens.json`을 명시적으로 덮어써 시나리오를 격리했다.
- `harness/self-test/radio-gate.test.ts`에 렌즈 차단 4종(표 부재·행 0개·빈 칸·사유 없는 해당 없음)과 통과 3종(정상 표·문서 전용 task·스냅숏 task)에 더해, 해시 위반과 렌즈 위반이 동시에 보고됨을 확인하는 fixture, 스냅숏 JSON 오류 fail-closed fixture, 스냅숏 전수 대조 test를 추가했다(총 16 case, 기존 6 case는 무수정 그대로 통과).
- `docs/execution/radio/README.md`에 "위험 기반 테스트" 절(헤더·칸 값 2종·보충 행 규칙·문서 task 면제·예시 1개)을 신설하고, "템플릿" 블록의 Requirements에 `### 위험 기반 테스트` 표 스켈레톤을 넣었다.
- TDD RED→GREEN: `harness/self-test/radio-gate.test.ts`를 먼저 확장한 뒤 파서·게이트 구현 전으로 되돌려 RED(모듈 export 부재로 exit 1)를 확인했고, 구현 복원 후 같은 명령으로 GREEN(16/16)을 확인했다. `docs/execution/runs/P0-T36/tdd.json`에 기록했다.
- `pnpm harness:typecheck`, `pnpm harness:self-test`(166/166), `pnpm check:docs`, `pnpm gate:radio`(실 저장소 대상 무출력 통과 — 기존 RADIO는 전부 스냅숏에 포함돼 렌즈 표 없이 통과), `pnpm verify` 전체가 통과했다.

### 미결 사항

- 렌즈 표의 실효성(오탐률·작성 비용)은 P1-T01 RADIO 첫 실사용 후 평가한다 — 결정 주체: 사용자, 반환할 단계: P1-T01 설계 회고. (RADIO 원본 미결 사항 그대로 승계)
- 스냅숏 task의 조기 채택(자발적 렌즈 표 작성)은 해당 task 재봉인 결정과 함께 다룬다 — 결정 주체: 사용자. (RADIO 원본 미결 사항 그대로 승계)
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남겨 둔다.

### 다음 행동

1. 등록된 `check_ids`(`radio-lens-fixtures`, `typecheck`)와 관련 회귀를 검증 단계에서 실행한다.
2. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T36-review.json`에 기록한다.
3. 검증 통과 후 `index.jsonl`의 P0-T36을 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `harness/lib/radio-doc.ts`(`parseRiskLensTable`·`hasCodePaths` 추가)
- `harness/lib/radio-gate.ts`(렌즈 검사·스냅숏 로더 추가, `checkRadioBindings` 무수정)
- `harness/lib/repo.ts`(`RADIO_LENS_SNAPSHOT_PATH` 추가)
- `harness/self-test/fixture.ts`(`config/radio-lens.json` 시드, 렌즈 fixture 헬퍼 추가)
- `harness/self-test/radio-gate.test.ts`(16 case)
- `harness/self-test/fixtures/index-snapshot-p0-t36.jsonl`(전수 대조용 고정 스냅숏)
- `config/radio-lens.json`(신규)
- `docs/execution/radio/README.md`("위험 기반 테스트" 절, 템플릿 갱신)
- `docs/execution/phases/index.jsonl`(P0-T36 `in_progress`)
- `docs/execution/runs/P0-T36/tdd.json`

## 2026-08-06 · 검증 단계 종료

- 작업 식별자: P0-T36 (RADIO 위험 렌즈 표 필수화)
- 현재 단계: 검증 종료 → done 전환
- 기준 시각: 2026-08-06

### 확정된 사실

- 교차 검증(opus·codex 병렬 독립 리뷰 + 상대 되물음)을 완료했다. 확정 발견 9건(medium 5·low 4), critical·high 없음. 결과는 `docs/execution/reviews/P0-T36-review.json`(총점 86, 기준 커밋 `26cf0bef7ecf075ab1c1547fa4fcdd3c2a5abb0b`)이 소유하고 medium·low는 backlog에 누적했다.
- 조정자 대조: `config/radio-lens.json`의 16개 항목을 index.jsonl의 `development_approval` 보유 task에서 독립 재추출해 완전 일치를 확인했고, `harness/self-test/fixtures/index-snapshot-p0-t36.jsonl`이 봉인 커밋 시점 index.jsonl과 동일함을 diff로 확인했다. 변경 파일 11개는 전부 봉인 허용 경로 안이다.
- 등록 check 실행: `radio-lens-fixtures`(harness self-test 내 radio-gate 16 case 포함 전체)와 `typecheck`를 검증 단계에서 재실행해 통과를 확인했다.

### 미결 사항

- F-05: 6렌즈 기계 강제가 상위 문서 `DEV-TEST-01`의 "다섯 위험 렌즈" MUST 문구와 충돌한다. `docs/standards/**`는 이 task의 변경 허용 경로 밖이라 별도 정비 제안이 필요하다 — 결정 주체: 사용자.
- F-01~F-04, F-06~F-09는 backlog가 추적한다. P1-T01이 렌즈 표 첫 실사용이므로 게이트 우회 구멍 2건(F-02 빈 인수 조건 칸, F-04 빈 허용 경로 fail-open)은 그 전 수정 라운드 후보다 — 결정 주체: 사용자.
- 렌즈 표 실효성 평가(P1-T01 설계 회고)와 스냅숏 조기 채택은 RADIO 원본 미결 사항 그대로 유지한다.

### 다음 행동

1. `index.jsonl`의 P0-T36을 `done`으로 전환하고 대시보드를 재생성한다.
2. ci-finisher가 push와 CI 감시를 백그라운드로 수행한다.
3. P0 phase 종료 — 다음 READY task(P1-T01)의 기획 인터뷰로 진행한다.

### 증거·산출물 경로

- `docs/execution/reviews/P0-T36-review.json`
- `docs/execution/reviews/backlog.md`(P0-T36 9건 누적)
