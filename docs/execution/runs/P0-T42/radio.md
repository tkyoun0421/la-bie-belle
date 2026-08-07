# P0-T42 RADIO 적용 기록

- 대상 RADIO: `docs/execution/radio/P0-T42-radio.md` revision 3
- 승인 SHA-256: `a05dd0dee0431c519abf46b6333c6c9b3486d05dd0f7d1d9179c6988f60fd297`
- 개발 세션 기준 시각: 2026-08-08

## 전제

작업 트리에 이전 세션의 부분 구현이 미커밋 상태로 이미 존재했다(`harness/lib/claude-loop-state.ts`, `harness/self-test/claude-loop-state.test.ts`, `scripts/claude-loop.mjs`, `.claude/hooks/claude-loop-stop-failure.sh`, `.claude/statusline-usage.sh`, `.claude/loop.md`, `.claude/settings.json`·`package.json`·`.gitignore` 수정분). 이번 세션은 그 상태에서 이어받아 revision 3와 정합하지 않는 부분만 고쳤다.

## 발견된 구현 공백과 조치

1. `harness/lib/claude-loop-state.ts`가 존재하지 않는 `error_kind` 필드를 읽고 6종만 인식했다 → `error_type` 필드로 고치고 문서화된 10종(`rate_limit`·`overloaded`·`authentication_failed`·`oauth_org_not_allowed`·`billing_error`·`invalid_request`·`model_not_found`·`server_error`·`max_output_tokens`·`unknown`) 전체를 `ERROR_TYPES`·`normalizeErrorType`으로 인식한다. `rate_limit`·`overloaded`만 `waiting_rate_limit`(bounded backoff), 나머지는 `needs_user`. 목록 밖 값은 `unknown`으로 정규화한다.
2. `resets_at`이 문자열만 받아들여 statusline의 Unix epoch 초 입력이 버려졌다 → `normalizeResetsAt`이 숫자(초)와 문자열 모두 받아 저장 시 ISO 8601로 정규화한다. `overloaded`는 armed reset 시각을 참조하지 않고 backoff만 사용한다(`resolveArmedResetAt`은 `rate_limit`에서만 호출).
3. `recordUsage`가 `rate_limits` 필드 부재 시 `value` 자체를 창 데이터로 오인해 기존 armed·usage 값을 0으로 덮어썼다 → `rate_limits`가 객체가 아니면 상태를 그대로 반환한다.
4. 재시도 상한이 없어 무한 backoff가 반복됐다 → `MAX_RETRY_ATTEMPTS = 6`을 넘는 실패는 `recordFailure`·`recordRespawnFailure` 양쪽에서 `needs_user`로 전환한다.
5. `scripts/claude-loop.mjs`의 respawn 실패 처리가 attempt를 증가시키지 않고 30초마다 무한 재시도했다 → `recordRespawnFailure`로 attempt 증가와 backoff 재계산을 하고, 상한 초과 시 `needs_user`로 감시 루프를 종료한다. 성공 시 `recordRespawnSuccess`로 `running`을 복원한다.
6. `.claude/settings.json`의 StopFailure matcher가 6종만 등록돼 있었다 → 10종 전체로 확장했다(`statusLine`은 이미 최상위 키였다).
7. **`stop`이 background Claude 세션 자체를 중단하지 않는다.** 조사 결과는 아래 "미해결 사항" 참조 — CLI에 안전한 공식 중단 경로가 없어 구현하지 않고 질문으로 반환한다.
8. 이벤트 멱등이 없어 동일 세션·동일 오류의 재기록마다 attempt가 증가했다 → 상태 파일에는 존재하지 않는 event id 필드를 새로 만들지 않고, "직전 상태가 이미 같은 session_id·error_type을 `waiting_rate_limit`/`needs_user`로 반영하고 있는가"로 중복을 판별한다(`isOutstandingDuplicate`). RADIO의 고정 허용 필드 목록(`schema_version`·`session_id`·`task_id`·`status`·`attempt`·`next_attempt_at`·`last_error_kind`·`usage`·`updated_at`)을 지키면서 멱등을 만족하는 유일한 방법으로 판단했다.
9. `scripts/claude-loop.mjs`가 `task_id`를 `"P0-T42"`로 하드코딩했다 → `selectQueueTask(entries)`가 index.jsonl을 읽어 `in_progress` task가 있으면 그것을 재개(`resume`)하고, 없으면 승인(product·development 승인, `radio_ref`)과 `depends_on` 충족을 모두 만족하는 첫 `planned` task를 `next`로 고른다. 실행 가능한 task가 없으면 `idle`.
10. redaction 회귀 테스트가 없어 훅 공통 필드(`transcript_path`·`cwd`·`permission_mode`·`prompt_id`·`error_message` 원문)가 상태에 남아도 감지되지 않았다 → `hook and statusline inputs never leak raw fields into stored state` 테스트로 직렬화 결과에 이 필드들과 원문 비밀 문자열이 없음을 단언한다.

## 구현하지 않은 것 (범위 판단)

- **저장소 재검사(불변 규칙 "새 세션을 시작하기 전에 index·RADIO hash·handoff를 확인한다", 기술 인수 조건 5)를 `scripts/claude-loop.mjs`에 통합하지 않았다.** 조정자가 지정한 10개 구현 공백에 없고, `runHandoffGate`를 매 `start` 호출마다 적용하면 아직 handoff를 쓰지 않은 정상 진행 중 task의 resume까지 차단할 위험이 있어 설계 판단 없이 임의로 넣지 않았다. `harness/lib/index-gate.ts`·`radio-gate.ts`·`handoff-gate.ts`의 순수 함수는 이미 재사용 가능한 상태이므로, 통합 방식(특히 handoff 게이트를 resume/next 중 어디에 어떻게 적용할지)은 검증 단계나 다음 설계 라운드에서 결정하는 것이 안전하다고 판단해 handoff에 미결 사항으로 남긴다.

## 검증

- `pnpm harness:typecheck`
- `pnpm harness:self-test` (268 테스트, claude-loop-state 관련 20개 포함)
- 수동 CLI 확인: `record-failure`(rate_limit), `record-usage`(armed 유지·malformed 무시), `start --dry-run`(큐 유도 확인)
