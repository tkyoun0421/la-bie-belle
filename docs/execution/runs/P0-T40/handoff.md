# P0-T40 handoff

## 2026-08-07 · 개발 단계 종료

- 작업 식별자: P0-T40 (TDD 증거 시각 정합 게이트)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- 실행 전 승인 SHA-256(revision 1, `d6df1ee506bbe5f3c71d0930ed50ee34ea75852d6ff6575f7fc48aa1b8f0efcd`)과 실제 `docs/execution/radio/P0-T40-radio.md` 파일 해시가 일치함을 확인한 뒤 시작했다. `docs/execution/phases/index.jsonl`에서 P0-T40을 `planned` → `in_progress`로 바꿨다(같은 줄 다른 필드·다른 task 무수정).
- `harness/lib/tdd-gate.ts`: 허용 오차 상수 `TDD_CLOCK_SKEW_TOLERANCE_MS = 120_000`(120초, 모듈 소유 단일 선언, export)을 추가했다. `checkTddEvidence(evidence, now: number = Date.now())`로 시그니처를 확장했다 — `now`는 기본값이 실제 시각이라 기존 self-test의 `checkTddEvidence(evidence)` 호출부는 한 글자도 손대지 않고 그대로 통과한다(과거 고정일 2026-08-03 기록만 다뤄 실제 시각이 흘러도 항상 과거). 스키마 검증이 전부 통과한 뒤(entries 배열이 확정된 뒤) `entry.at > now + TDD_CLOCK_SKEW_TOLERANCE_MS`인 항목을 `entries[i]: 기록 시각이 검사 시점보다 미래입니다 (at: ISO8601)` 메시지로 보고하고, 미래 위반이 하나라도 있으면 그 시점에서 반환한다(기존 RED→GREEN 순서 검사보다 먼저 판정). RED→GREEN 순서·스키마 검증 로직 자체는 무수정이다. `runTddGate`는 `checkTddEvidence(evidence, Date.now())`로 실제 시각을 명시적으로 주입한다(자기 참조 검증 — 이 게이트가 검사하는 `docs/execution/runs/P0-T40/tdd.json` 자체도 이 경로를 통과했다).
- `harness/self-test/tdd-gate.test.ts`: 기존 15 case는 문자 그대로 무수정이다. 5개 case를 신규 추가했다 — ① 허용 오차 초과 미래 기록 거부(`entries[1]` 지목), ② 여러 항목 중 미래 항목 하나만 지목(다른 유효 항목은 오탐 없음), ③ 허용 오차 경계 ±1초 판정 갈림(정확히 경계·경계-1초는 통과, 경계+1초는 위반), ④ 고정 시각(2030-01-01)을 주입해도 기존 `makeTddEvidence()`(2026-08-03 고정)는 회귀 없이 통과, ⑤ `runTddGate`가 실제 시각을 주입해 아주 먼 미래(9999년) 기록을 거부함을 fixture root로 확인(프로덕션 경로의 실시각 주입 자체를 단언).
- TDD RED→GREEN: 구현 전 `harness/lib/tdd-gate.ts`만 git stash로 되돌려 `pnpm harness:self-test`를 실행해 모듈 로드 실패(`TDD_CLOCK_SKEW_TOLERANCE_MS` export 없음)로 exit 1을 실제로 확인했다(RED, `at: 2026-08-07T01:47:59Z`). stash pop으로 구현을 복원한 뒤 다시 실행해 201/201 전체 통과(GREEN, `at: 2026-08-07T01:48:10Z`)를 확인했다. 두 시각 모두 실제 명령 실행 완료 직후 `date -u` 출력에서 그대로 옮겨 `docs/execution/runs/P0-T40/tdd.json`에 기록했다(추정·소급 없음).
- `pnpm harness:typecheck`, `pnpm harness:self-test`(201/201), `pnpm gate:tdd`(무출력 통과, 자기 참조 검증 포함), `pnpm verify` 전체(format → lint → typecheck → test → harness:typecheck → harness:self-test → check:docs → build → check:app-build → check:client-secret-scan → test:e2e 27/27 → gate:all)가 모두 통과했다(gate:all은 이 handoff 파일 작성 후 재확인).
- 변경 파일은 전부 RADIO의 변경 허용 경로 안이다: `harness/lib/tdd-gate.ts`, `harness/self-test/tdd-gate.test.ts`, `docs/execution/runs/P0-T40/**`, `docs/execution/phases/index.jsonl`.

### 미결 사항

- 없음. RADIO 원본의 미결 사항도 없음(RADIO 자체에 "없음"으로 명시).
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남겨 둔다.

### 다음 행동

1. 등록된 `check_ids`(`tdd-timestamp-selftest`)와 관련 회귀를 검증 단계에서 재실행한다.
2. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T40-review.json`에 기록한다.
3. 검증 통과 후 `index.jsonl`의 P0-T40을 `done`으로 전환하고 대시보드를 재생성한다.
4. ci-finisher가 push와 CI 감시를 백그라운드로 수행한다(이 handoff는 push하지 않는다).

### 증거·산출물 경로

- `harness/lib/tdd-gate.ts`(`TDD_CLOCK_SKEW_TOLERANCE_MS`, `checkTddEvidence(evidence, now)` 미래 시각 검사 추가)
- `harness/self-test/tdd-gate.test.ts`(기존 15 case 무수정 + 신규 5 case, 총 20 case)
- `docs/execution/runs/P0-T40/tdd.json`
- `docs/execution/phases/index.jsonl`(P0-T40 `in_progress`)
