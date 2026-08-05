# P0-T37 handoff

## 2026-08-05 · 개발 단계 종료

- 작업 식별자: P0-T37 (오류 코드 정본과 인터페이스 오류 계약)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-05

### 확정된 사실

- 구현 착수 단계에서 승인된 RADIO revision 1이 신설하려던 `DEV-ERR-03`(명명 규칙)·`DEV-ERR-04`(read Route Handler 계약)가 `DEVELOPMENT.md`에 이미 존재하는 동명 MUST 규칙(SQL/스택트레이스 노출 금지, mutation 자동 재시도 금지 — 완료된 P0-T28의 RADIO도 같은 의미로 참조)과 ID가 충돌함을 발견했다. 조정자가 사용자 결정을 받아 신설 ID를 `DEV-ERR-07`·`DEV-ERR-08`로 정정하고 RADIO를 revision 2로 재승인·재봉인했다(개정 이력에 사유 기록). `index.jsonl`의 `development_approval`은 `radio_revision:2`, 새 SHA-256(`9314480899faddf3722534148ee61a084907fe154158ab10d10748dae9e64cea`)이 정본이다.
- `docs/standards/DEVELOPMENT.md`의 "Interface, 오류와 멱등성" 절에 `DEV-ERR-07`(명명 규칙·정본 위치·도메인 코드 추가 절차)·`DEV-ERR-08`(read Route Handler 오류 계약·HTTP 매핑 원칙)을 신설했다.
- 정본 레지스트리 `src/shared/config/error-codes.config.ts`를 만들었다. `ERROR_CODES`는 `as const satisfies Record<string, ErrorSpec>`로 형태를 강제하고 `ErrorCode` 유니언을 키에서 유도해 export한다. COMMON 시드 4종(`COMMON_AUTH_REQUIRED` 401, `COMMON_FORBIDDEN` 403, `COMMON_NOT_FOUND` 404, `COMMON_UNEXPECTED` 500)을 RADIO Data model 절 그대로 시드했다.
- `project/error-code-literal` ESLint 룰(`tools/eslint-plugin-project/rules/error-code-literal.mjs`)을 `index.mjs`와 `eslint.config.mjs`(`src/**/*.{ts,tsx}` project 룰 블록)에 등록했다. 접두 6종(`IDENTITY`·`SCHEDULING`·`ATTENDANCE`·`NOTIFICATIONS`·`PAY`·`COMMON`) 패턴 문자열 리터럴·표현식 없는 템플릿 리터럴을 레지스트리 파일 밖에서 차단하고, 레지스트리 파일 경로와 `ERROR_CODES` 멤버 접근은 예외로 둔다.
- TDD RED→GREEN: `tools/eslint-plugin-project/rules/__tests__/error-code-literal.test.mjs`(RuleTester, 14 케이스 — happy path, 오탐 대조군 2종, 정의 지점 허용, 접두 6종 경계값, 템플릿 리터럴)를 먼저 작성해 모듈 부재로 RED를 확인한 뒤 룰 구현으로 GREEN을 만들었다.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`(10 files, 127 tests) 모두 통과했다.

### 미결 사항

- correlation ID의 생성 방식·헤더 전파는 첫 서버 오류 경로(P0-T04 이후)가 `DEV-OBS-01` 아래에서 결정한다 — 결정 주체: AI(구현자), 반환할 단계: 해당 기능 task의 설계.
- Server Action `code` 파라미터의 런타임 타입 강제는 첫 Server Action이 생기는 task가 이 레지스트리를 import해 적용한다 — 결정 주체: AI(구현자), 반환할 단계: 해당 기능 task의 설계.
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남겨 둔다.

### 다음 행동

1. 등록된 `check_ids`(`error-lint-test`, `error-registry-typecheck`)와 관련 회귀를 검증 단계에서 실행한다.
2. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T37-review.json`에 기록한다.
3. 검증 통과 후 `index.jsonl`의 P0-T37을 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `src/shared/config/error-codes.config.ts`
- `tools/eslint-plugin-project/rules/error-code-literal.mjs`
- `tools/eslint-plugin-project/rules/__tests__/error-code-literal.test.mjs`
- `tools/eslint-plugin-project/index.mjs`, `eslint.config.mjs`
- `docs/standards/DEVELOPMENT.md`(DEV-ERR-07·08)
- `docs/execution/radio/P0-T37-radio.md`(revision 2)
- `docs/execution/phases/index.jsonl`(P0-T37 `in_progress`, `development_approval` revision 2)
