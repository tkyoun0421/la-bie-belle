# P0-T37 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-05
- 개발 설계 승인: user, 2026-08-05

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-05 | 최초 작성. |

- 관련 spec: DOCS:SDD, ADR:0011
- 적용 깊이: 일반 (표준·상수·린트 도구. DB·권한·캐시·오프라인 경로 없음)
- test mode: tdd
- 예정 check IDs: error-lint-test, error-registry-typecheck

## Requirements

### 범위와 비목표

- 범위: [개발 컨벤션](../../standards/DEVELOPMENT.md) DEV-ERR 절 확장(명명 규칙, 정본 위치, read Route Handler 오류 형식과 HTTP 매핑 원칙, 도메인 코드 추가 절차), 오류 코드 정본 레지스트리 파일과 COMMON 시드 4종, `project/error-code-literal` ESLint 룰과 RuleTester 테스트, `eslint.config.mjs` 등록.
- 비목표(기획 승인 그대로): 다국어, 화면별 오류 UI·문구 디자인(P0-T04·DESIGN), 구버전 PWA 배포 불일치(P7-T09), 로깅·관측 규칙(DEV-OBS), 재시도·멱등성(각 기능 task RADIO).
- 설계 비목표: 실제 read Route Handler 구현(첫 소비자는 P1 이후), correlation ID의 생성·전파 구현(첫 서버 오류 경로가 소유), 화면 재정의 메커니즘(소비 화면 task가 소유).

### 불변 규칙

- 오류 코드는 도메인 접두 6종(`IDENTITY`·`SCHEDULING`·`ATTENDANCE`·`NOTIFICATIONS`·`PAY`·`COMMON`) + 의미 슬러그의 UPPER_SNAKE 단일 문자열이다. 번호 접미사는 쓰지 않는다.
- HTTP 상태는 이름에서 유도하지 않고 레지스트리가 코드별로 선언한다.
- 오류 응답과 기본 문구에 비밀값·불필요한 개인정보를 담지 않는다(`DEV-SEC-04`, `DEV-OBS-02`).
- Server Action Result 형식은 `DEV-ERR-01`을 그대로 유지하고 `code` 값만 이 정본을 따른다.

### 기술 인수 조건

- 레지스트리 파일 밖에서 접두 6종 패턴(`/^(IDENTITY|SCHEDULING|ATTENDANCE|NOTIFICATIONS|PAY|COMMON)_[A-Z0-9_]+$/`)에 걸리는 문자열 리터럴이 lint를 실패시킨다.
- `ERROR_CODES` 멤버 접근(`ERROR_CODES.COMMON_FORBIDDEN`)은 lint를 통과한다.
- 레지스트리는 `satisfies`로 각 항목이 `http`와 `message`를 갖는 형태를 강제하고, 어긋난 항목은 `pnpm typecheck`가 실패시킨다.
- COMMON 시드 4종이 존재하고 각각 HTTP 상태와 해요체 기본 문구를 갖는다.
- DEV-ERR 절이 명명 규칙·정본 위치·read Route Handler 오류 형식·HTTP 매핑 원칙·도메인 코드 추가 절차를 소유한다.

### 위험 기반 테스트

이 task의 위험은 "룰이 있으니 우회가 막혔다"는 착시다. 오탐과 미탐 양쪽을 실제 ESLint 실행(RuleTester)으로 단언한다.

| 위험 | 검증 계층 | 배치 |
| --- | --- | --- |
| Happy path — 레지스트리 멤버 접근 허용 | RuleTester | valid: `ERROR_CODES.COMMON_FORBIDDEN` 비교·전달 |
| 주요 실패 — 패턴 리터럴 차단 | RuleTester | invalid: 문자열 리터럴, 표현식 없는 템플릿 리터럴 각 1건 이상 |
| 오탐 대조군 — 무관 문자열 허용 | RuleTester | valid: 접두가 아닌 UPPER_SNAKE(`SERVER_ONLY_MARKER`), 접두를 포함만 하는 단어(`COMMONLY_USED`), 소문자 문자열 |
| 오탐 대조군 — 정의 지점 허용 | RuleTester | valid: 레지스트리 파일 경로에서는 리터럴 허용 |
| 경계값 — 접두 6종 각각 | RuleTester | invalid: 도메인 접두별 리터럴이 모두 걸리는지 |
| 형태 강제 — 레지스트리 스키마 | typecheck | `satisfies` 위반이 컴파일 실패가 되는 구조를 코드로 두고 `pnpm typecheck`를 check 증거로 기록 |
| 동시성 | 해당 없음 | 상수와 정적 분석뿐이다 |

### DEV-* 적용 상태

- `DEV-ERR-01`: 추가 결정 — Result 형식은 유지하고, `code` 값의 문법·정본·강제 수단을 이 task가 세운다. DEV-ERR 절에 명명 규칙(`DEV-ERR-03`)과 read Route Handler 오류 계약(`DEV-ERR-04`)을 신설한다.
- `DEV-SSOT-01`: 추가 결정 — 코드·HTTP 상태·기본 문구의 정본은 레지스트리 파일 하나다. DEVELOPMENT.md는 규칙과 절차만 소유하고 코드 목록을 복제하지 않는다. 린트 룰은 정본을 읽지 않는 패턴 검사라 정본이 둘이 되지 않는다.
- `DEV-SEC-04`, `DEV-OBS-02`: 기본 적용 — 기본 문구와 응답 계약에 비밀값·개인정보 금지.
- `DEV-DATA-*`: 해당 없음 — DB·서버 요청 경로가 없다.
- `DEV-CACHE-*`, `DEV-OFFLINE-*`: 해당 없음 — 클라이언트 상태·네트워크 경로가 없다.
- `DEV-TEST-01`, `DEV-TEST-02`: 기본 적용 — 위 위험 표. mock 없이 실제 ESLint(RuleTester)와 tsc로 검증한다.
- `DEV-CODE-07`: 기본 적용 — 룰 메시지는 문구로 안내하되 코드에 설명 주석을 쓰지 않는다.
- `DEV-NAME-*`: 기본 적용 — kebab-case 파일명.
- `DEV-OPT-*`: 기본값 유지 — 성능 경로가 없다.

## Architecture

- 레지스트리는 `src/shared/config/error-codes.config.ts`. 근거: `config` 세그먼트는 `runtimeExports: "constants"`로 순수 상수를 허용하고, 계약 성격 설정의 선례(`server-only.config.ts`, ESLint가 예약한 `env.ts`)가 이미 이 위치다. `shared` 계층이라 모든 상위 계층이 import할 수 있고 클라이언트·서버 공용이다(비밀값 없음).
- `config` 세그먼트는 단위 테스트 면제 구역이므로 레지스트리에 로직을 두지 않는다. 상수와 타입만 export하고, 검증 로직이 필요해지면 그때 `shared/lib`으로 분리한다(지금은 소비자가 없어 만들지 않는다).
- 린트 룰은 `tools/eslint-plugin-project/rules/error-code-literal.mjs`. 기존 룰 7종과 같은 배치·등록(`index.mjs`)·테스트(`rules/__tests__/`) 관행을 따른다. `eslint.config.mjs`의 project 룰 블록에 `"project/error-code-literal": "error"`로 등록하며, CI 설정은 base를 상속하므로 별도 등록이 없다.
- 강제의 역할 분담: 코드 값의 유효성은 TS 유니언 타입이, 리터럴 우회는 린트가 막는다. 린트 룰은 레지스트리 내용과 결합하지 않는다.

## Data model

DB 변경이 없다. 레지스트리의 정본 스키마는 다음과 같다.

- `ERROR_CODES`: 코드 → `{ http, message }`의 `as const` 객체를 `satisfies Record<string, ErrorSpec>`로 형태 강제. `ErrorCode` 유니언 타입은 키에서 유도해 export한다.
- COMMON 시드 4종:

| 코드 | HTTP | 기본 문구 |
| --- | --- | --- |
| `COMMON_AUTH_REQUIRED` | 401 | 로그인이 필요해요 |
| `COMMON_FORBIDDEN` | 403 | 접근 권한이 없어요 |
| `COMMON_NOT_FOUND` | 404 | 요청한 정보를 찾을 수 없어요 |
| `COMMON_UNEXPECTED` | 500 | 일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요 |

- 문구는 [PATTERNS](../../product/design/PATTERNS.md)의 문구 원칙(짧고 친근한 대화체)을 따른다. 도메인 코드는 각 기능 task가 자기 RADIO에서 추가한다.

## Interface

- read Route Handler 오류 응답 본문은 `{ "error": { "code": <ErrorCode>, "correlationId": <string> } }`이고 HTTP 상태는 레지스트리의 `http`를 쓴다. 문구는 담지 않는다 — 표시는 클라이언트가 코드로 결정한다(기획 승인, 구버전 PWA 캐시에 옛 문구가 남는 문제 차단).
- `correlationId`는 계약상 필드만 확정한다. 생성·전파는 `DEV-OBS-01`을 따르는 첫 서버 오류 경로가 구현한다.
- Server Action은 `DEV-ERR-01` 형식(`{ ok: false, code, fieldErrors? }`)을 유지한다. 이 task는 `code`의 타입을 `ErrorCode`로 좁힐 계약만 문서에 세운다.
- 사용자 문구의 정본은 레지스트리 `message`다. 화면은 맥락이 필요할 때만 재정의한다(기획 승인).
- 멱등성·캐시·오프라인: 해당 없음 — 이 task는 실제 핸들러를 만들지 않는다.

## Optimizations

기본값 유지. 상수 조회와 정적 분석뿐이라 측정할 병목이 없다(`DEV-OPT-01` 기록).

## 변경 허용 경로

```
src/shared/config/error-codes.config.ts
tools/eslint-plugin-project/index.mjs
tools/eslint-plugin-project/rules/error-code-literal.mjs
tools/eslint-plugin-project/rules/__tests__/error-code-literal.test.mjs
eslint.config.mjs
docs/standards/DEVELOPMENT.md
docs/execution/radio/P0-T37-radio.md
docs/execution/runs/P0-T37/**
docs/execution/reviews/**
docs/execution/phases/index.jsonl
docs/execution/phases/00-foundation.md
docs/execution/dashboard/**
```

## 미결 사항

- correlation ID의 생성 방식·헤더 전파는 첫 서버 오류 경로(P0-T04 이후)가 `DEV-OBS-01` 아래에서 정한다.
- Server Action `code` 파라미터의 타입 강제(런타임 코드)는 첫 Server Action이 생기는 task가 이 레지스트리를 import해 적용한다.
