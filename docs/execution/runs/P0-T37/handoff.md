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

## 2026-08-05 · 검증 확정 발견 반영

- 작업 식별자: P0-T37 (오류 코드 정본과 인터페이스 오류 계약)
- 현재 단계: 검증(교차 리뷰 확정 발견 4건 반영) 종료 → 다음 검증(재확인)
- 기준 시각: 2026-08-05

### 확정된 사실

- 교차 검증(`docs/execution/reviews/P0-T37-review.json`, opus·codex, total 87)의 확정 발견 4건을 사용자 승인으로 RADIO revision 3에 반영해 재봉인했다. `index.jsonl`의 `development_approval`은 이미 `radio_revision:3`, SHA-256(`ead02383a693c2930d03093277bc70bacc062d212875ee2b8ac61bcca3ad0954`)으로 갱신돼 있어 확인만 하고 그대로 둔다.
- F-01(high): `error-codes.config.ts`에 코드 이름 맵 `ERROR_CODE`(`satisfies { [K in ErrorCode]: K }`, 키=값 일치를 타입이 강제)를 추가해 런타임 코드 문자열 값을 얻는 표기를 만들었다. 테스트의 문자열-객체 비교 fixture(`code === ERROR_CODES.COMMON_FORBIDDEN`)를 `ERROR_CODE` 멤버 접근으로 고쳤다.
- F-02(medium): `ERROR_CODES`의 키 타입을 `` Record<`${ErrorDomain}_${string}`, ErrorSpec> ``(접두 6종 유니언 `ErrorDomain` 기반 템플릿)로 강제했다. 임시로 접두 밖 키(`BOGUS_KEY`)를 넣어 `pnpm typecheck`가 `TS2353`(패턴 밖 키)·`TS1360`(이름 맵 키=값 불일치)로 실패함을 확인한 뒤 되돌려 검증했다.
- F-03(medium): '정의 지점 허용' RuleTester fixture에 접두 패턴에 실제로 걸리는 리터럴(`ERROR_CODE.COMMON_FORBIDDEN: "COMMON_FORBIDDEN"`)을 포함시켰다. 룰의 레지스트리 예외 분기를 통째로 제거한 상태로 이 fixture를 돌려 RED(exit 1, 해당 케이스 1건 실패)를 확인한 뒤, F-04 구현을 적용해 GREEN(exit 0, 14/14)으로 만들었다. RED→GREEN은 `docs/execution/runs/P0-T37/tdd.json`에 추가 기록했다.
- F-04(low): `tools/eslint-plugin-project/rules/error-code-literal.mjs`의 경로 판별을 기존 룰 6종과 같은 `lib/resolve-path.mjs`의 `resolveLocation(context.filename, context.cwd)` 기반으로 바꿨다. 자체 `toPosix` 정규화와 `endsWith` 접미사 일치를 제거하고 `location.relative`의 정확한 경로 일치로 판정한다.
- `DEVELOPMENT.md`의 `DEV-ERR-07` 문구 중 "소비 코드는 `ERROR_CODES` 멤버 접근만 쓴다"를 "소비 코드는 `ERROR_CODE`·`ERROR_CODES` 멤버 접근만 쓴다"로 정정했다. 규칙 ID와 그 외 내용은 바꾸지 않았다.
- `docs/execution/reviews/backlog.md`의 P0-T37 항목 3건([medium] F-02, [medium] F-03, [low] F-04)을 `[x]`로 표기했다. F-01은 backlog 대상이 아니라 RADIO revision 3에 직접 반영된 high 발견이라 별도 항목이 없다.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`(10 files, 127 tests) 모두 통과했다.

### 미결 사항

- 없음. 확정 발견 4건 모두 이번 커밋에 반영됐다.

### 다음 행동

1. 조정자가 반영 내역을 재확인하고 필요하면 재교차검증한다.
2. 통과 확인 후 `index.jsonl`의 P0-T37을 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `src/shared/config/error-codes.config.ts`(`ErrorDomain`·`ERROR_CODE` 추가)
- `tools/eslint-plugin-project/rules/error-code-literal.mjs`(`resolveLocation` 기반 판별)
- `tools/eslint-plugin-project/rules/__tests__/error-code-literal.test.mjs`(F-01·F-03 fixture 정정)
- `docs/standards/DEVELOPMENT.md`(`DEV-ERR-07` 문구 정정)
- `docs/execution/radio/P0-T37-radio.md`(revision 3)
- `docs/execution/reviews/backlog.md`(P0-T37 3건 `[x]`)
- `docs/execution/runs/P0-T37/tdd.json`(2026-08-05 10:17~10:18 RED→GREEN 추가)
