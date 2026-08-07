# P0-T42 RADIO 개발 설계

- 상태: Approved
- revision: 3
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-08
- 관련 spec: DOCS:SDD, ADR:0011
- 적용 깊이: 심화 (세션 lifecycle·재시도·checkpoint·외부 CLI)
- test mode: tdd
- 예정 check IDs: claude-loop-state-selftest, claude-loop-recovery, claude-loop-safety

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 사용량 한도 이벤트와 checkpoint 기반 자동 재개 초안. |
| 2 | 2026-08-07 | 5시간·주간 사용량 95% 감시와 statusline 로컬 저장을 추가하고 Haiku 호출을 제외. |
| 3 | 2026-08-08 | revision 2 봉인 파일이 봉인 후 수정으로 무결성이 깨져 재검토 후 재봉인. StopFailure 실제 계약 정합(`error_type` 필드, 실패 유형 10종, epoch 초 `resets_at`), `overloaded` 자동 재시도 편입(user 결정), `statusLine` 최상위 키 명시, 재시도 상한 6회 확정. |

## Requirements

### 범위와 비목표

- 범위: 사용량 한도에 도달한 Claude Code 백그라운드 세션을 안전하게 대기시켰다가 정규 한도 리셋 후 `respawn`으로 재개하는 로컬 supervisor를 만든다. supervisor는 승인된 `planned` 큐를 처리하도록 `/goal`에 전달할 프로젝트 프롬프트를 사용한다.
- 범위: statusline 입력의 5시간·주간 `used_percentage`와 `resets_at`을 로컬 파일에 저장하고 어느 한 창이 95% 이상이면 `armed` 상태로 전환한다. 이 수집은 statusline 로컬 스크립트만 사용하며 모델 호출을 발생시키지 않는다.
- 범위: StopFailure `rate_limit`·`overloaded` 이벤트를 기록하고, session·task·checkpoint를 연결한 상태를 원자적으로 갱신한다. 재시도는 고정·상한 backoff를 사용하며 reset 시각을 알 수 없는 경우에도 무한 빠른 polling을 하지 않는다.
- 범위: `start`·`status`·`stop`·`record-failure` CLI와 결정적 fake Claude adapter를 제공한다.
- 비목표: Mac 잠자기·재부팅·로그인 복구·launchd 설치, 사용량 제한 우회·추가 결제·계정 변경, 원격 worker, 제품 코드.

### 불변 규칙

- `planned` task만 실행하고, 제품·기술 승인 게이트를 자동으로 통과하지 않는다.
- `in_progress`는 저장소 전체에서 최대 하나다. supervisor는 새 세션을 시작하기 전에 index·RADIO hash·handoff를 확인한다.
- rate limit과 overloaded 이외의 인증 실패·billing 오류·critical 검증 실패·새 결정 필요는 자동 재개하지 않고 `blocked` 또는 `needs_user` 상태로 둔다.
- 상태 파일과 로그에는 token·credential·transcript 원문·불필요한 개인정보를 저장하지 않는다.
- 상태 갱신은 임시 파일 + rename 또는 동등한 원자 방식으로 하고, lock으로 supervisor 중복 실행을 막는다.
- `claude --dangerously-skip-permissions`, 자동 사용량 결제, API key 교체 명령을 supervisor가 실행하지 않는다.

### 기술 인수 조건

1. 5시간 또는 주간 사용량이 95% 이상이면 사용량·reset 시각·task를 `armed` 상태로 원자 저장한다.
2. rate limit 또는 overloaded 이벤트가 들어오면 session·task·마지막 checkpoint와 `waiting_rate_limit` 상태를 원자 저장한다. 훅 stdin의 실패 유형 필드는 `error_type`이다.
3. backoff 만료 후 한 번만 `claude respawn <session-id>`를 호출하고, 성공하면 같은 task의 `/goal`을 이어간다. 재시도는 최대 6회이며 초과 시 `needs_user`로 남는다. overloaded는 reset 시각 없이 backoff만 사용한다.
4. rate limit·overloaded가 아닌 오류·잘못된 checkpoint·승인 누락은 재개하지 않고 사유와 수동 재개 방법을 남긴다.
5. 저장소 재검사에서 `in_progress` 최대 1, 승인 계약, RADIO SHA-256이 모두 유효하지 않으면 Claude를 호출하지 않는다.
6. 상태·로그의 허용 필드와 redaction이 self-test로 검증되고 정상 종료·큐 소진·사용자 대기 상태를 구분한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 사용량 감시 | 테스트함 — 5시간·주간 값이 저장되고 95% 이상이면 armed | 테스트함 — malformed 입력·쓰기 실패는 재개 상태를 만들지 않음 | 테스트함 — 94/95/100%, 빈 reset 정보·긴 문자열 | 해당 없음 — statusline 로컬 입력 | 테스트함 — 같은 snapshot은 한 번만 갱신함 | 테스트함 — 원자 rename 중 읽기는 완전 상태만 봄 |
| 2 재시도 이벤트 checkpoint | 테스트함 — rate_limit·overloaded event가 허용 필드 상태로 저장됨 | 테스트함 — malformed event·쓰기 실패는 재개 상태를 만들지 않고 기존 armed·usage 값을 덮어쓰지 않음 | 테스트함 — 빈 reset 정보·긴 오류 문자열·파일 부재·미분류 error_type | 해당 없음 — 로컬 hook 입력이며 외부 사용자 권한을 판정하지 않음 | 테스트함 — 같은 event id 재기록은 상태를 한 번만 갱신함 | 테스트함 — 원자 rename 중 읽기는 이전 또는 새 완전 상태만 봄 |
| 3 backoff 재개 | 테스트함 — due 시각의 respawn 성공과 동일 session 유지 | 테스트함 — respawn 실패는 bounded retry 후 대기 상태로 남음 | 테스트함 — due 직전·직후, 최대 backoff 경계 | 테스트함 — 허용된 `claude respawn`만 호출하고 bypass 권한은 거부 | 테스트함 — duplicate wakeup이 단일 respawn으로 수렴 | 테스트함 — 두 supervisor lock 중 하나만 호출함 |
| 4 안전 중단·게이트 | 테스트함 — auth·billing·model·oauth·token 한도·decision 신호가 needs_user로 기록됨 | 테스트함 — index·RADIO·handoff 위반 시 Claude 미호출 | 테스트함 — unknown·빈 error_type·planned 큐 없음 | 테스트함 — 사용량 결제·credential 변경 명령을 호출하지 않음 | 해당 없음 — 중단 상태는 재시도 요청을 생성하지 않음 | 테스트함 — 실패 신호와 wakeup 교차 시 중단 상태가 우선함 |
| 5 redaction·종료 | 테스트함 — 허용 필드만 상태 JSON에 남음 | 테스트함 — token·credential·transcript 원문이 입력돼도 제거됨 | 테스트함 — UTF-8·개행·대형 문자열 | 해당 없음 — 로그는 로컬 운영자 전용 파일임 | 테스트함 — 같은 종료 신호가 상태를 되살리지 않음 | 해당 없음 — 종료 시 lock을 정리하는 단일 supervisor임 |

- 보충 위험: `claude` CLI 버전이 바뀌어 `respawn` 계약이 변하면 명령 adapter가 실패하고 수동 대기로 남아야 한다.

### DEV-* 적용 상태

- `DEV-SSOT-01`: checkpoint schema·상태 전이·재시도 정책은 supervisor의 순수 상태 모듈 한 곳이 소유한다(추가 결정).
- `DEV-SEC-04`·`DEV-OBS-02`: 오류·로그에는 token·credential·transcript 원문을 남기지 않으며, 사용량·reset 시각은 statusline 로컬 입력만 기록한다(기본 적용).
- `DEV-TEST-01`: 위 위험 렌즈 표와 fake adapter self-test로 RED→GREEN 증거를 남긴다(기본 적용).
- `DEV-CODE-07`: 구현 코드에 설명 주석을 추가하지 않는다(기본 적용).

## Architecture

- `scripts/claude-loop.mjs`: 얇은 CLI 진입점과 Claude 명령 adapter. `start`는 고정 프로젝트 prompt로 background session을 만들고, `status`·`stop`·`record-failure`를 제공한다.
- `harness/lib/claude-loop-state.ts`: checkpoint schema, 허용 상태 전이, backoff 계산, redaction을 순수 함수로 소유한다.
- `harness/self-test/claude-loop-state.test.ts`: fake clock·fake Claude adapter를 사용해 state/recovery/safety를 검증한다.
- `.claude/hooks/claude-loop-stop-failure.sh`: StopFailure 입력을 `record-failure`로 전달하며 stdout에는 아무것도 출력하지 않는다.
- `.claude/statusline-usage.sh`: statusline JSON에서 사용량·reset 시각만 추출해 checkpoint로 전달하고 모델·네트워크를 호출하지 않는다.
- `.claude/loop.md`: `/goal`에 전달할 저장소 실행 계약. planned 큐·승인·in_progress 1개·handoff·게이트와 정상 종료 조건을 요약한다.
- `.claude/settings.json`: StopFailure hook은 문서화된 실패 유형 10종 전체를 matcher로 등록하고, `statusLine`은 `hooks` 밖 최상위 키로 등록한다.
- `.gitignore`: `.claude/runtime/` 아래 운영 상태·lock·로그를 제외한다.

서버·클라이언트 경계는 없다. supervisor는 로컬 파일과 Claude CLI만 호출하며 애플리케이션 `src/`를 수정하지 않는다. 세션을 새로 만들 때는 기존 Claude Code background session의 권한 설정을 상속하되 bypass 권한을 추가하지 않는다.

## Data model

- 정본: `docs/execution/phases/index.jsonl`, 승인 RADIO 파일, task handoff.
- 파생 checkpoint: `.claude/runtime/loop-state.json` 한 개. `schema_version`, `session_id`, `task_id`, `status`, `attempt`, `next_attempt_at`, `last_error_kind`, `usage`, `updated_at`만 허용한다. `usage`에는 5시간·주간 `used_percentage`·`resets_at`과 `armed_window`만 둔다. statusline이 주는 `resets_at`은 Unix epoch 초이며 저장 시 ISO 8601 문자열로 정규화한다.
- checkpoint는 commit 대상이 아니며 transcript·오류 원문·비밀값을 저장하지 않는다.
- 상태 전이는 순수 함수가 검사하고, 파일 쓰기는 임시 파일을 같은 디렉터리에 쓴 뒤 rename한다. lock은 supervisor 프로세스가 종료될 때 정리한다.
- 같은 이벤트와 wakeup은 event id·session id·due 시각으로 멱등 처리한다. 동시 실행은 lock 획득 실패를 정상 대기로 처리한다.

## Interface

- `pnpm claude:loop start`: current repo에서 background session과 supervisor를 시작한다.
- `pnpm claude:loop start --session-id <id> --resume-at HH:MM --not-before HH:MM`: 기존 세션을 지정하고 재개 시각과 기획·설계 허용 시각을 설정한다. 기존 세션을 지정하면 새 background session을 만들지 않는다.
- `--dry-run`을 함께 주면 Claude CLI를 호출하지 않고 예약 prompt와 시각만 검증한다.
- `pnpm claude:loop status`: checkpoint를 redacted human-readable 상태로 출력한다.
- `pnpm claude:loop stop`: 현재 supervisor와 background session을 중단하되 transcript는 보존한다.
- `record-failure`는 hook 전용 stdin JSON 입력이며 실패 유형은 `error_type` 필드에서 읽는다. 허용 유형은 `rate_limit`·`overloaded`·`authentication_failed`·`billing_error`·`invalid_request`·`server_error`·`model_not_found`·`oauth_org_not_allowed`·`max_output_tokens`·`unknown`이고, 목록 밖 값은 `unknown`으로 정규화한다.
- `record-usage`는 statusline 전용 stdin JSON 입력이며, 어느 창이든 95% 이상이면 `armed`로 전환한다. 임계값은 고정 95이며 모델 호출로 보정하지 않는다. `rate_limits` 필드가 없는 입력은 상태를 바꾸지 않는다.
- `rate_limit`·`overloaded`는 bounded backoff 후 `claude respawn <session-id>`를 한 번 호출한다. 다른 유형은 `needs_user`로 종료한다.
- CLI exit code는 성공 0, 사용자 대기 2, 잘못된 입력·상태 1로 고정한다. 정상 게이트처럼 성공 출력은 짧고 민감정보를 포함하지 않는다.
- Claude CLI가 없거나 인증되지 않은 경우 supervisor는 `needs_user`와 수동 조치만 기록한다.

## Optimizations

- reset 시각을 알 수 없을 때 즉시 반복 호출하지 않고 5분에서 최대 30분까지 backoff한다. reset 정보가 있으면 계산된 시각 이후 첫 회만 시도한다.
- `claude agents`의 private roster를 직접 읽지 않고 public CLI 명령과 프로젝트 checkpoint만 사용한다. CLI adapter 교체로 버전 드리프트를 격리한다.
- 새 모델·새 daemon·새 외부 dependency는 추가하지 않는다. fake adapter로 네트워크 없는 self-test를 유지한다.
- 사용량 감시는 Claude statusline의 로컬 JSON만 사용해 별도 Haiku 호출 비용을 만들지 않는다.
- 되돌림은 `pnpm claude:loop stop`과 runtime 디렉터리 제거로 가능하며, transcript와 작업 산출물은 삭제하지 않는다.

## 변경 허용 경로

```
.claude/hooks/**
.claude/settings.json
.claude/statusline-usage.sh
.claude/loop.md
.gitignore
harness/lib/**
harness/self-test/**
scripts/claude-loop.mjs
package.json
docs/execution/radio/P0-T42-radio.md
docs/execution/runs/P0-T42/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 없음. 위 선택은 개발 설계 승인 시 봉인한다.
