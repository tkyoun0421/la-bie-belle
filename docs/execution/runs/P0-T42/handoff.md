# P0-T42 handoff

## 2026-08-08 · 개발 종료

- 작업 식별자: P0-T42
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-08

### 확정된 사실

- RADIO revision 3(SHA-256 `a05dd0dee0431c519abf46b6333c6c9b3486d05dd0f7d1d9179c6988f60fd297`)를 index.jsonl의 `development_approval`과 대조해 봉인을 확인했다.
- 작업 트리에 있던 이전 세션의 부분 구현을 이어받아, 조정자가 지정한 10개 구현 공백을 모두 수정했다: `error_type`(10종 인식)·`resets_at` epoch→ISO 정규화·`record-usage` 상태 불변·재시도 상한 6회·respawn 실패 bounded backoff·`.claude/settings.json` matcher 10종·이벤트 멱등·`task_id` index.jsonl 유도·redaction 회귀 테스트. 세부 내용과 근거는 `docs/execution/runs/P0-T42/radio.md`에 있다.
- `harness/lib/claude-loop-state.ts`의 이벤트 멱등은 RADIO의 고정 허용 필드(event id 필드 없음) 제약을 지키기 위해 "session_id·error_type·직전 status"로 판별하도록 구현했다(`radio.md`의 "발견된 구현 공백과 조치" 8번 참조).
- `pnpm harness:typecheck`, `pnpm harness:self-test`(268개, claude-loop-state 관련 20개 포함) 통과. RED→GREEN 증거는 `docs/execution/runs/P0-T42/tdd.json`에 있다.
- `claude --help`·`claude agents --help`·`claude respawn --help`·`claude project --help`를 로컬 CLI(2.1.224)로 직접 확인했다: `claude respawn <id>`는 "현재 바이너리를 반영해 재시작"이지 중단이 아니다. `claude agents`는 세션 목록(`--json`으로 pid 포함) 조회만 제공하고 중단/종료 옵션이 없다. `claude project purge`는 transcript를 포함한 프로젝트 상태 전체를 삭제해 "transcript 보존" 요구와 배치된다. kill/stop/terminate/abort/cancel류 명령이 `claude --help` 전체에 없다.
- `docs/execution/phases/index.jsonl`에서 P0-T42를 `in_progress`로 전환했다(전 저장소 1개 확인 완료).
- 개발 세션 중 다른 병렬 Claude Code 세션(`claude agents --json` 확인: pid 18463 "la-bie-belle-92", pid 78409 "la-bie-belle-1c")이 `harness/lib/claude-loop-state.ts`·`harness/self-test/claude-loop-state.test.ts`를 일시적으로 동시 편집한 흔적이 있었다(Write 시 "File has been modified since read" 충돌 2회). 이후 8초 이상 재확인해 안정화를 확인하고 계속 진행했지만, 커밋 전 최종 검토가 필요하다.

### 미결 사항

- **[질문] `stop`이 background Claude 세션 자체를 중단하는 방법 — 결정 주체: 사용자, 반환할 단계: 설계.** RADIO 인터페이스는 "현재 supervisor와 background session을 중단하되 transcript는 보존한다"고 요구하지만, 로컬 CLI에 이를 만족하는 공식 명령이 없다. 선택지: (A) 이번 범위를 "supervisor만 중단, background 세션은 자연 종료(rate limit이면 이미 멈춰 있음)에 맡긴다"로 좁혀 RADIO 문구를 수정한다. (B) `claude agents --json`의 `pid`에 `SIGTERM`을 보내는 비공식 경로를 추가한다 — transcript 보존은 개연적일 뿐 CLI가 보장하지 않고, 향후 CLI 버전이 바뀌면 깨질 수 있다. (C) CLI 벤더에 공식 중단 명령이 추가되기를 기다리며 이 항목만 별도 후속 task로 분리한다. 현재 구현은 A와 동등하게 동작한다(세션은 그대로 두고 supervisor만 정지).
- **안전 게이트 재검사 미구현 — 결정 주체: 사용자/조정자, 반환할 단계: 검증 또는 설계.** RADIO 불변 규칙("supervisor는 새 세션을 시작하기 전에 index·RADIO hash·handoff를 확인한다")과 기술 인수 조건 5를 `scripts/claude-loop.mjs`에 아직 통합하지 않았다. 조정자가 지정한 10개 목록에 없었고, `runHandoffGate`를 매 `start` 호출에 적용하면 아직 handoff를 쓰지 않은 정상 진행 중 task의 resume까지 차단할 위험이 있어 임의로 넣지 않았다. `harness/lib/index-gate.ts`·`radio-gate.ts`·`handoff-gate.ts`는 이미 순수 함수로 재사용 가능하다.
- 다른 병렬 세션의 동시 편집 흔적(위 "확정된 사실" 참조)이 실제로 무엇이었는지 확인되지 않았다. 커밋 전 `git diff`로 최종 내용을 재확인했다.
- `docs/execution/phases/00-foundation.md`가 이미 미커밋 상태(기획 승인 산출물로 추정)로 변경돼 있었으나 RADIO 변경 허용 경로 밖이라 이번 커밋에서 제외했다.

### 다음 행동

1. 위 두 [질문] 항목에 대한 결정을 받는다.
2. (A 선택 시) RADIO revision 4에서 `stop` 인터페이스 문구를 "supervisor만 중단" 또는 "가능한 경우에만 세션 중단"으로 명확히 하거나, (B 선택 시) pid 기반 SIGTERM 경로를 RADIO에 명시하고 구현한다.
3. 안전 게이트 재검사 통합 방식을 결정하고 구현한다(특히 handoff 게이트를 resume에도 적용할지).
4. 검증 단계에서 `check_ids`(`claude-loop-state-selftest`, `claude-loop-recovery`, `claude-loop-safety`) 기준 교차 검증을 수행한다.

### 증거·산출물 경로

- `docs/execution/runs/P0-T42/radio.md`
- `docs/execution/runs/P0-T42/tdd.json`
- `harness/lib/claude-loop-state.ts`
- `harness/self-test/claude-loop-state.test.ts`
- `scripts/claude-loop.mjs`
- `.claude/settings.json`

## 2026-08-08 · 마무리 중단 (blocked, 야간 자동 진행 중 기록)

- 작업 식별자: P0-T42
- 현재 단계: 개발 마무리 중단 → 사용자 결정 대기(blocked)
- 기준 시각: 2026-08-08 심야

### 중단 사유

RADIO revision 4의 변경 허용 경로에 속한 `.claude/settings.json`·`.claude/loop.md`에, revision 4가 승인하지 않은 변경이 병렬 세션(사용자 탭으로 추정, 02:15 KST 무렵 생성)에서 섞여 들어왔다. 확인된 미승인 변경: `.claude/loop-unattended.md`(무인 계약 — 질문으로 멈추지 않음, critical·high 선수정 후 사후 보고), `.claude/hooks/loop-unattended-context.sh`(SessionStart 훅 — `unattended-resume.json` 마커·세션 ID 일치·15분 이내 3중 조건일 때만 무인 계약을 컨텍스트로 주입), `settings.json`의 SessionStart 훅 블록, `loop.md`의 무인 계약 참조 문구. 부분 스테이징 금지 규칙과 병렬 세션 작업 보존 원칙 때문에 이 상태로는 승인분만 골라 커밋할 수 없어, 승인된 야간 프로토콜(새 결정 필요 → 해당 task만 blocked, 큐는 계속)대로 P0-T42만 중단했다.

### 구현 완료분 (워킹 트리 보존, 미커밋)

- `scripts/claude-loop.mjs`: `claude --bg` 호출 직전 index·RADIO 해시·안전 상태 재검사(기술 인수 조건 5). 위반 시 `needs_user` 기록 후 exit 2. `--watch`·`--session-id`·`--dry-run` 경로는 재검사 대상 밖.
- `harness/self-test/claude-loop-reverification.test.ts`(신규): 실제 CLI `spawnSync` 통합 테스트 6건.
- `harness/self-test/claude-loop-state.test.ts`: 1시간 에피소드 경계(-1ms·정각) 테스트 2건 추가.
- `docs/execution/runs/P0-T42/tdd.json`: 위 항목 RED→GREEN 기록. `pnpm harness:self-test` 279개 통과 확인.

### 사용자 결정 필요 (아침)

무인 계약 확장(`loop-unattended.md`·SessionStart 훅)의 처리 — 결정 주체: 사용자, 반환할 단계: 설계.

1. P0-T42 RADIO revision 5로 정식 편입(재봉인·재승인) 후 함께 커밋.
2. 별도 후속 task로 분리하고, P0-T42는 사용자 탭 작업이 정리된 뒤 승인분만 남은 상태에서 커밋.
3. 사용자 탭이 직접 커밋을 마무리(이 경우 P0-T42 커밋 범위 재조정 필요).

### 야간 조치 기록

- fc54a1f amend 계획은 폐기 — 야간 큐 커밋이 위에 쌓이므로 P0-T42 마무리는 후속 커밋으로 진행한다.
- push는 아침 결정 전까지 보류(fc54a1f가 원격에 실리면 amend·정리 여지가 사라짐). ci-finisher 디스패치도 같은 이유로 보류.
- P2-T05·P3-T01 승인 봉인(index 반영)은 이 task 경계에서 커밋했다.

## 2026-08-08 · 마무리 재개 (revision 5 재봉인, 아침 승인)

- 작업 식별자: P0-T42
- 현재 단계: 개발 마무리 재개 → 커밋 → 다음 검증
- 기준 시각: 2026-08-08 아침

### 확정된 사실

- 사용자가 아침 보고에서 무인 계약의 revision 5 편입을 승인했다. RADIO revision 5, SHA-256 `877240622231033cf6b515861481fa5696904b8c4823d92cefbf61c9b9bf0e24`, index `development_approval` 반영, status `in_progress` 복귀(전 저장소 1개). 편입 세부는 `docs/execution/runs/interviews/2026-08-08-p0-t42-reseal.md`의 revision 5 절이 정본이다.
- 이 승인으로 "마무리 중단" 절의 차단 사유가 해소됐다 — 워킹 트리의 무인 계약 파일 4건(`loop-unattended.md`·`loop-unattended-context.sh`·`settings.json` SessionStart·`loop.md` 문구)은 이제 승인분이며, 구현 완료분(재검사·테스트)과 함께 한 커밋으로 마무리한다.
- push 보류도 함께 해제됐다 — done 이후 ci-finisher 경유 일괄 push.

### 다음 행동

1. 마무리 커밋(무인 계약 + 인수 조건 5 재검사 구현 + statusline 위임 구현).
2. 검증 단계: `check_ids` 3종(`claude-loop-state-selftest`·`claude-loop-recovery`·`claude-loop-safety`) 기준 교차 검증.
3. done 전환 → 경계 커밋(재봉인 기록 + P2-T05 revision 3 재봉인) → P2-T05 디스패치.

## 2026-08-08 · 검증 수정 라운드 (교차 검증 high 9건)

- 작업 식별자: P0-T42
- 현재 단계: 검증 수정 → 재검증
- 기준 시각: 2026-08-08

### 확정된 사실

opus·codex 교차 검증이 확정한 high 9건을 봉인 RADIO revision 5 계약대로 수정했다. 커밋 SHA는 이 turn의 최종 보고에 남긴다(handoff는 커밋에 앞서 작성되어 자기 자신의 SHA를 담을 수 없다).

- **H-1** (`harness/lib/claude-loop-state.ts` `recordUsage`): `armed_window`가 서면 lifecycle status(`waiting_rate_limit`·`needs_user`·`stopped`)를 무조건 `"armed"`로 덮어쓰던 결함을 고쳤다. `USAGE_GUARDED_STATUSES` 집합에 속한 상태는 `usage` 필드만 갱신하고 status는 보존한다. armed↔running 토글은 그 외(주로 `running`) 상태에서만 일어난다. 기존 "usage arms at exactly 95%" 계열 두 테스트는 `initialState()`(status `stopped`, 이제는 guarded)가 아니라 `{...initialState(), status:"running"}`을 기준으로 재작성했다 — armed 전환은 유휴(`running`) 상태에서만 일어난다는 봉인 문구를 그대로 테스트에 반영한 것이다.
- **H-7** (`readState`): 파일 부재(ENOENT)만 `initialState()`로 취급하고, 존재하지만 파싱 실패·비객체 JSON인 경우는 `needs_user`(+ `last_error_kind: "unknown"`)로 fail-closed한다.
- **H-3** (`scripts/claude-loop.mjs` `reverifyRepositoryForNewSession`): `checkIndexStateRules` 단독 호출을 `runIndexGate`(파싱 오류·스키마·상태 규칙 전체)로 교체하고 `runHandoffGate`를 추가했다. 적용 범위는 새 세션 생성 분기(`!state.session_id || state.status === "stopped"`)로 한정했고, 그 분기 안에서도 reverify를 큐 선택보다 먼저 실행해 손상된 index가 "idle"로 위장되지 않게 했다.
- **H-4** (dry-run): `main()` 최상단에서 `command === "start" && dryRun`을 가장 먼저 처리해 lock 획득·`mkdirSync`·상태 읽기/쓰기보다 먼저 반환한다. watch·`--session-id`·plain 세 경로 모두 `claude` 미호출을 확인했다.
- **H-5** (lock 소유권): `supervisor.lock`에 pid를 기록하고, 소유자 pid와 파일 내용이 일치할 때만 삭제한다(`releaseSupervisorLock`). `stop`은 이제 상태만 쓰고 lock 파일을 건드리지 않는다. 부수적으로, 기존 코드의 "idle queue" 종료 분기가 `process.exit(0)`을 곧장 호출해 `finally`를 건너뛰고 lock을 영구히 남기던 잠재 결함도 `main()`을 `return` 기반으로 재구성하며 함께 없앴다.
- **H-6** (RMW 보호): 상태 전용 lock 파일(`loop-state.lock`)로 read-modify-write를 직렬화하는 `updateState()`를 만들어 record-usage·record-failure·supervisor 루프·stop 네 쓰기 주체가 전부 이 경로를 거치게 했다. 획득 실패는 20ms 간격 25회 재시도 후 이번 회차를 스킵한다(최대 약 500ms).
- **H-8** (`task_id` 유도): `deriveTaskId(entries)`(순수 함수, `selectQueueTask` 위에 얇게 얹음)를 추가해 `--watch` 시작과 `record-failure`에서 `task_id`가 비어 있으면 index.jsonl의 in_progress(없으면 유일 실행 대상)로 채운다.
- **H-9** (stopped/needs_user 재기동): `stopped` 체크포인트는 `!state.session_id || state.status === "stopped"` 조건으로 새 세션 분기를 다시 통과한다. `needs_user`는 `--session-id` 명시 없이는 자동 재기동하지 않되, 판별 기준을 `status === "needs_user"`만이 아니라 `last_error_kind !== null`도 요구하도록 다듬었다 — reverify-block으로 인한 `needs_user`(last_error_kind 불변, null)는 저장소를 고친 뒤 재시도가 자연스럽게 통과해야 하는 기존 계약(테스트 6)과 충돌했기 때문이다. 순수 CLI/세션 실패(recordFailure·recordRespawnFailure·손상 checkpoint)는 항상 last_error_kind를 채우므로 guard가 정확히 걸린다.
- **부수 발견**: `console.error(...); process.exit(N);`을 곧바로 잇는 기존 패턴이 파이프(spawnSync) 환경에서 stderr를 잘라먹는 사례를 재검사 재시도 테스트에서 실측했다(원인: `process.exit()`는 버퍼링된 비동기 쓰기를 기다리지 않는다). `scripts/claude-loop.mjs`를 `process.exitCode = await main();` 패턴으로 재구성해 모든 조기 종료를 `return <code>`로 바꿔 해결했다 — 부수적으로 `finally`가 항상 자연스럽게 실행되어 H-5의 lock 해제 누락 위험도 함께 없앴다.

### 미결 사항

- 없음. 남은 medium·low 8건(catch-all 사유 유실, statusline 확인 필요 표시, 성능 중복 기록, session_id 형식 검증, `--bg` 파싱, 한 줄 스타일, TOOLING 문서, 종료 상태 구분)은 지시대로 backlog로 남긴다.
- `supervisor.lock`이 소유 프로세스가 `SIGKILL`로 죽는 등 비정상 종료하면 stale lock으로 영구히 남을 수 있다(H-5는 소유권 검증만 요구했고 staleness 복구는 범위 밖). 복구는 `.claude/runtime/` 삭제(기존에 문서화된 되돌림 경로)로 가능하다.

### 다음 행동

1. 검증 단계에서 `check_ids` 3종 기준 교차 재검증을 받는다.
2. 재검증 통과 시 task를 `done`으로 전환한다.

### 증거·산출물 경로

- `harness/lib/claude-loop-state.ts`
- `scripts/claude-loop.mjs`
- `harness/self-test/claude-loop-state.test.ts`
- `harness/self-test/claude-loop-reverification.test.ts`
- `harness/self-test/claude-loop-supervisor.test.ts`(신규)
- `harness/self-test/fixture.ts`
- `docs/execution/runs/P0-T42/tdd.json`

## 2026-08-08 · 검증 수정 라운드 2 (재검증 확정 3건, 마지막 수정 라운드)

- 작업 식별자: P0-T42
- 현재 단계: 검증 수정 2회차 → 재검증
- 기준 시각: 2026-08-08

### 확정된 사실

opus·codex·opus-2 재검증이 확정한 N-1/N-3/F-06 잔여 3건을 봉인 RADIO revision 5 계약대로 수정했다. 이번이 조정자가 지정한 마지막 수정 라운드다. 커밋 SHA는 이 turn의 최종 보고에 남긴다.

- **FIX-1 / F-06 잔여** (`harness/lib/claude-loop-state.ts` `recordRespawnSuccess`·`recordRespawnFailure`): `execFileSync("claude", ["respawn", ...])`가 state lock 밖에서 오래 걸리는 동안 다른 프로세스(StopFailure 훅의 `record-failure`, 또는 `stop`)가 남긴 `needs_user`·`stopped`를 respawn 결과 기록이 무조건 덮어쓰던 결함을 고쳤다. 두 함수 모두 `RESPAWN_OUTCOME_GUARDED_STATUSES`(`needs_user`·`stopped`, `waiting_rate_limit`은 제외 — 정상 경로에서 respawn 대상 상태이므로) 집합에 속한 최신 상태를 보면 기록을 포기하고 그대로 반환한다. 회귀는 두 층으로 남겼다: pure function 단위 테스트(`recordRespawnSuccess`/`recordRespawnFailure`가 needs_user·stopped를 그대로 반환) + CLI 교차 시나리오 테스트(가짜 `claude respawn`을 마커 파일로 붙잡아 두고, 그 사이에 실제 `record-failure`로 needs_user를 기록시킨 뒤 풀어 주는 방식 — 임의 sleep 타이밍에 기대지 않고 결정적으로 재현했다). 이 교차 테스트가 봉인 위험 렌즈 표 "4 안전 중단·게이트" 행의 동시성 셀("실패 신호와 wakeup 교차 시 중단 상태가 우선함")의 "테스트함" 선언을 실제로 채운다.
- **FIX-2 / N-1** (`scripts/claude-loop.mjs` `withStateLock`·`updateState*`): `loop-state.lock`에 소유 pid를 기록하고, 획득 실패 시 소유 pid가 죽어 있으면(`process.kill(pid,0)`이 ESRCH) 회수 후 재시도한다(공급자 `supervisor.lock`이 이미 쓰는 "pid 기법"을 재사용). `record-usage`·`record-failure`·`stop`은 새 `updateStateOrWarn`을 통해 락 획득에 최종 실패하면 stderr 경고를 남기고 exit 1로 종료한다(기존에는 무음으로 exit 0). supervisor 루프의 respawn 성공/실패 기록은 새 `updateStateCritical`(6회, 100ms 간격 추가 재시도)을 써서 일시적 lock 경합으로 "due" 상태가 남아 다음 3초 tick에 respawn이 중복 호출되는 상황을 막는다. `.claude/skills/loop-mode/SKILL.md`의 "on" 절차 1번에 `loop-state.lock` 스테일 정리 문구를 추가했다(`supervisor.lock`만 다루던 것을 보완).
- **FIX-3 / N-3** (`scripts/claude-loop.mjs` needs_user 가드): H-9가 도입한 `status === "needs_user" && last_error_kind !== null` 조건이, 재검사 차단 경로(last_error_kind를 건드리지 않던 244행대)가 만든 needs_user를 가드가 못 보게 해 ① 일반 `start`가 안내 없이 3초 폴링 후 exit 0로 새는 경로, ② `start --watch`가 같은 needs_user를 running으로 되살리는 경로 두 가지를 열어 뒀다. 가드를 `status === "needs_user"` 단독 판정으로 되돌리고, 재검사 차단 경로가 이제 `last_error_kind: "invalid_request"`(고정 정규화 목록 안의 값)를 함께 남기게 해 원인은 여전히 상태 파일에서 확인할 수 있게 했다. `watch` 분기의 상태 보존 목록(`WATCH_PRESERVED_STATUSES`)에 `needs_user`를 추가했다(가드가 이미 앞에서 막지만 방어적으로 이중화). 회귀는 last_error_kind가 null인 needs_user에서 `start`(안내 출력 + exit 2 + claude 미호출)와 `start --watch`(상태 보존) 양쪽으로 남겼다.
- **범위 해석 결정 — `watch`의 `stopped` 보존은 이번 라운드에 넣지 않았다.** 지시문의 요약 문장("watch는 needs_user·stopped를 running으로 되살리지 않는다")을 문자 그대로 `stopped`까지 `WATCH_PRESERVED_STATUSES`에 넣어 보면, `initialState()`의 기본값이 `status: "stopped"`이기 때문에 최초 `/loop-mode on`(fresh 상태에서 `start --watch` 최초 실행)이 3초 폴링 한 번 만에 스스로 종료돼 버린다 — `SKILL.md`의 "on" 3번("status가 running·armed·waiting_rate_limit 중 하나가 됐는지 확인")과 라운드 1부터 검증된 동작을 깨뜨리는 실측 회귀다. 반면 지시문이 명시한 회귀 테스트 스펙은 "last_error_kind가 null인 needs_user에서 ... watch의 상태 보존"으로 needs_user만 좁혀 요구했다. 스키마상 "최초 미실행"과 "명시적으로 stop됨"을 구분할 필드가 없어(둘 다 `status: "stopped"`), 이 구분을 새로 만드는 것은 설계 결정이라 이번 라운드에서 임의로 편입하지 않았다. needs_user만 보존하도록 좁혀 구현했고, 이 판단은 재검증에서 다시 짚어볼 수 있게 여기 명시한다.

### 미결 사항

- 위 "범위 해석 결정"에 적은 대로, `watch`가 명시적으로 `stop`된 직후 재실행됐을 때 `stopped`를 `running`으로 되살리는 기존 동작(라운드 1부터 존재, 이번 라운드가 만든 회귀 아님)은 그대로 남아 있다 — "최초 미실행"과 "명시적 stop"을 구분하는 필드를 추가할지는 설계 결정이 필요하다.
- `updateStateCritical`의 재시도 예산(6회 × 100ms + 매 시도 내부 최대 500ms)을 모두 소진할 만큼 극단적인 lock 경합이 지속되면 respawn 성공/실패 기록이 여전히 유실될 수 있다 — 다음 3초 tick이 자연 복구하지만, 그 사이 중복 respawn 위험은 이론상 남는다. 지시된 "재시도로 막는다" 요구는 충족했고, 완전한 보장(예: in-memory dedupe 플래그)은 이번 지시 범위 밖이라 넣지 않았다.
- 남은 non-critical 항목은 지시대로 이번이 마지막 수정 라운드이므로 backlog로 넘긴다.

### 다음 행동

1. 검증 단계에서 `check_ids` 3종 기준 재검증을 받는다.
2. 통과 시 task를 `done`으로 전환한다.

### 증거·산출물 경로

- `harness/lib/claude-loop-state.ts`
- `scripts/claude-loop.mjs`
- `harness/self-test/claude-loop-state.test.ts`
- `harness/self-test/claude-loop-reverification.test.ts`
- `harness/self-test/claude-loop-supervisor.test.ts`
- `harness/self-test/fixture.ts`
- `.claude/skills/loop-mode/SKILL.md`
- `docs/execution/runs/P0-T42/tdd.json`
