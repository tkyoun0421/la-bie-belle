# 개발 컨벤션

이 문서는 라비에벨의 공통 개발 규칙과 안정적인 `DEV-*` ID의 정본이다. 설계·승인·실행 경계는 [운영 계약](../workflow/WORKFLOW.md)과 [ADR-0013](adr/0013-project-layer-structure.md), [ADR-0011](adr/0011-planning-radio-development-contract.md), 제품 의미는 [PRD](../product/PRD.md), 도메인 언어는 [Domain](../product/DOMAIN.md), 시스템 구조는 [Architecture](ARCHITECTURE.md), task별 기술 설계는 [task별 개발 설계](../execution/radio/README.md), 실행 상태는 [작업 인덱스](../execution/phases/index.jsonl)가 소유한다.

## 규칙 등급과 예외

- `MUST`: 위반할 수 없는 계약이다. 가능한 항목은 자동 검증한다. task RADIO에서 면제할 수 없고, 부적절하면 설계 단계에서 규칙과 관련 ADR을 먼저 변경한다.
- `SHOULD`: 기본값이다. 더 나은 작업별 선택이 있으면 이유, 트레이드오프, 위험, 보완책과 되돌림 조건을 RADIO에 기록하고 사용자 승인을 받아 예외를 적용할 수 있다.
- `MAY`: 여러 방식이 동등하게 가능한 선택이다. 일관되게 적용하고 프로젝트 전체 결정이 되면 `SHOULD` 또는 ADR로 승격한다.

RADIO는 공통 규칙을 복사하지 않는다. 관련 ID마다 `기본 적용`, `해당 없음`, `추가 결정`, `예외` 중 하나를 기록하고 추가 결정이나 예외에만 상세 근거를 남긴다.

## 설계와 실행 경계

- 제품·프로젝트·도메인·UX와 제품 인수 조건은 기획 단계에서 승인한다.
- `design_pending` task의 구현 구조와 기술 인수 조건은 설계 단계에서 승인한다.
- 승인된 RADIO 정본은 `docs/execution/radio/<task-id>-radio.md`가 소유한다.
- 개발은 두 승인과 `radio_ref`가 있고 의존 task가 모두 `done`인 `planned` task에서만 시작한다.
- `docs/execution/runs/<task-id>/radio.md`는 설계 정본이 아니라 승인된 설계의 적용 결과와 실행 중 차이를 기록한다.
- 개발 승인은 RADIO revision과 정확한 전체 UTF-8 바이트 SHA-256에 결속하며 경로 이탈, 심볼릭 링크, 누락 파일과 해시 불일치는 실행을 차단한다.
- 상태·승인·RADIO 무결성과 실행 가능성은 공통 계약 모듈 하나가 판정하고 모든 소비자는 안정적인 사유 코드를 사용한다.
- 제품 결정이 새로 필요하면 기획 단계, 기술 결정이 새로 필요하면 설계 단계로 반환한다.
- 개발 루프는 `planned` 큐가 빌 때까지 의존성 순서로 task를 연속 실행하고 `in_progress`는 언제나 최대 하나다. 새 결정이 필요하거나 재시도 한도를 넘긴 task는 `blocked`로 두고 의존 관계가 없는 다음 task로 진행한다. 정본 규칙은 [운영 계약의 연속 루프 규칙](../workflow/WORKFLOW.md#연속-루프-규칙)이 소유한다.

## FSD와 서버 경계

```text
src/
  app/       Next.js route, layout, provider, 얇은 route adapter
  views/     route 화면 조합
  widgets/   독립적인 화면 블록
  features/  사용자 행위, Server Action, mutation 상태
  entities/  도메인 모델, 순수 규칙, DTO, entity 조회
  shared/    재사용 UI, 설정, 공통 서버 client 기반
```

FSD 표준의 `pages` 계층을 `views`로 부른다. Next.js가 `src/pages/`를 Pages Router 디렉터리로 해석해 그 아래 모든 파일을 라우트로 만들려 하기 때문이다(P0-T01, 2026-08-04). 계층의 책임과 의존 방향은 표준과 같고 이름만 다르다.

계층 디렉터리는 실제로 쓰일 때 만든다. 비어 있는 계층을 미리 만들어 두지 않는다(`DEV-CODE-04`).

- `DEV-ARCH-01` `MUST`: 의존은 상위 FSD 레이어에서 하위 레이어로만 향하고 `app`만 Next.js route 파일을 가진다.
- `DEV-ARCH-02` `MUST`: UI는 표시와 이벤트 전달을 맡고 DB, 비밀값과 server module을 import하지 않는다.
- `DEV-ARCH-03` `MUST`: server module은 첫 import로 `import "server-only"`를 선언한다.
- `DEV-ARCH-04` `MUST`: entity는 도메인 모델, 상태 전이, 순수 규칙과 DTO를 소유하고 복수 entity command는 `features/*/api`에 둔다.
- `DEV-ARCH-05` `SHOULD`: slice는 필요한 `ui`, `model`, `api`, `lib`만 만들고 빈 계층이나 이름뿐인 wrapper를 만들지 않는다.
- `DEV-ARCH-06` `SHOULD`: 컴포넌트는 서버 컴포넌트가 기본값이다. `"use client"`는 상호작용(이벤트 핸들러·브라우저 API·클라이언트 상태)이 실제로 필요한 leaf 컴포넌트에만 선언하고, route·layout·view 조합 계층은 서버 컴포넌트로 유지하며 클라이언트 경계를 트리 아래로 민다. 화면 전체를 클라이언트로 만드는 것은 클라이언트 상태가 화면 전역을 지배할 때만 허용하며 그 사유를 RADIO가 소유한다. 채택 시점(2026-08-06) 기준 기존 위반(app 라우트 4곳·view 화면 5곳)은 해당 화면의 실 데이터 연결 task에서 정리한다.

## 인터페이스와 데이터

### Source of Truth와 데이터 강제

관심사별 정본은 다음과 같다.

| 관심사 | 정본 |
| --- | --- |
| 제품 동작·범위 | PRD |
| 도메인 용어·불변 규칙·데이터 소유권 | Domain |
| 프로젝트 전체 기술 결정 | ADR·Architecture |
| 공통 개발 컨벤션 | Development |
| task별 기술 설계 | 승인된 RADIO |
| 물리 DB 구조·RLS·함수 | PostgreSQL migration |
| 실행 중 업무 데이터 | PostgreSQL |
| 생성 타입·DTO·projection·client cache | 위 정본에서 만든 파생물 |

- `DEV-SSOT-01` `MUST`: 하나의 업무 사실은 하나의 정본 소유자만 가진다.
- `DEV-SSOT-02` `MUST`: 파생 데이터는 정본과 생성 규칙을 명시한다.
- `DEV-SSOT-03` `MUST`: client cache와 UI state를 업무 정본으로 사용하지 않는다.
- `DEV-SSOT-04` `MUST`: 같은 규칙을 여러 경계에서 강제할 때 의미적 정본과 방어적 투영 관계를 명시한다.
- `DEV-SSOT-05` `MUST`: 정본 변경은 소비자와 cache invalidation 영향을 함께 검토한다.
- `DEV-DATA-01` `MUST`: 업무 규칙의 의미적 정본은 하나만 둔다.
- `DEV-DATA-02` `MUST`: UI 검증을 인증·인가 또는 데이터 무결성 경계로 사용하지 않는다.
- `DEV-DATA-03` `MUST`: 서버는 매 요청마다 외부 입력, 인증·인가와 현재 상태를 검증한다.
- `DEV-DATA-04` `MUST`: DB로 표현 가능한 핵심 불변 규칙은 `NOT NULL`, `CHECK`, `UNIQUE`, FK, RLS와 append-only 제약으로 최종 강제한다.
- `DEV-DATA-05` `MUST`: 여러 데이터를 바꾸는 command는 명시적인 트랜잭션과 동시성 전략을 가진다.

생성 DB 타입은 커밋하지만 수동 편집하지 않는다. entity가 DB row를 안전한 DTO로 변환하고 UI는 DTO만 받는다.

## 보안

모든 RADIO는 신뢰할 수 없는 입력, 인증·인가 위치, 서버·클라이언트 경계, 개인정보·비밀값 노출, 로그·오류 노출과 보안 테스트 필요 여부를 최소 검토한다.

역할·RLS, 개인정보·위치·시급, 불변 출퇴근·감사 기록, 계정 복구·탈퇴·삭제, 파일·외부 서비스·Webhook, 관리자 command·예약 작업, 캐시·오프라인 저장, 동시·중복·악용 가능성이 있으면 자산, 행위자, 신뢰 경계, 공격 경로, 완화책과 회귀 테스트를 심화한다.

- `DEV-SEC-01` `MUST`: UI 숨김을 보안 경계로 사용하지 않고 서버와 DB 정책에서 권한을 다시 강제한다.
- `DEV-SEC-02` `MUST`: 최소 권한과 최소 개인정보 공개를 사용하고 비밀값은 서버 환경에서만 다룬다.
- `DEV-SEC-03` `MUST`: 권한·개인정보·불변 기록 변경은 우회·악용·감사 회피와 회귀 테스트를 RADIO에서 설계한다.
- `DEV-SEC-04` `MUST`: 오류, 로그, cache와 DTO에 토큰·비밀값과 불필요한 개인정보를 남기지 않는다.
- `DEV-SEC-05` `MUST`: 민감 command는 행위자, 대상, 결과와 변경 전후를 감사 가능하게 기록한다.

## server-first와 TanStack Query

### cache와 offline

- 서버만 표시할 데이터는 Server Component가 entity server API를 직접 호출한다.
- 상호작용 이후 재조회가 필요한 데이터만 서버 prefetch → dehydrate → `HydrationBoundary` → client query로 전달한다.
- client query는 얇은 read Route Handler를 호출하고 query function에 Server Action을 사용하지 않는다.
- mutation은 Server Action과 `useMutation`을 사용한다.

`public`은 사용자·역할·세션과 무관하게 모두에게 같은 결과이며 개인정보가 없는 조회다. 그 밖의 조회는 `private`다.

- `DEV-CACHE-01` `MUST`: cache 정책은 개발 설계 RADIO에서 정한다.
- `DEV-CACHE-02` `MUST`: public 기본 조회는 정본, 위치, 키, TTL과 무효화 주체를 정해 cache한다.
- `DEV-CACHE-03` `MUST`: private 데이터는 서버 공유 cache, CDN과 브라우저 영속 저장소에 cache하지 않는다.
- `DEV-CACHE-04` `MUST`: 상호작용형 private 화면은 현재 로그인 세션의 메모리 cache만 필요한 범위에서 허용하고 기본 `staleTime`은 0으로 둔다.
- `DEV-CACHE-05` `MUST`: mutation, 권한 변경, 로그아웃과 탈퇴 후 영향받는 메모리 cache를 명시적으로 무효화하거나 제거한다.
- `DEV-CACHE-06` `MUST`: cache 오류가 권한 우회나 업무 데이터 변경으로 이어져서는 안 된다.
- `DEV-OFFLINE-01` `MUST`: 오프라인 영속 cache는 앱 셸, 아이콘, 글꼴과 public 리소스만 포함한다.
- `DEV-OFFLINE-02` `MUST`: private 업무 데이터와 private 폼 값을 브라우저 저장소나 Service Worker에 영속하지 않는다.
- `DEV-OFFLINE-03` `MUST`: 신청, 배정, 확정, 출퇴근을 포함한 mutation을 오프라인 queue에 쌓거나 자동 제출하지 않는다.
- `DEV-OFFLINE-04` `MUST`: 연결 복구 후 private 데이터는 정본에서 다시 조회한다.

private 데이터의 제한적 오프라인 열람이 실제 현장 요구가 되면 보존 항목, TTL, 삭제 조건과 위험을 별도 RADIO 예외로 승인해야 한다.

## Clean Code와 SOLID

- `DEV-CODE-01` `SHOULD`: 모듈은 하나의 명확한 변경 이유를 가진다.
- `DEV-CODE-02` `MUST`: 도메인 규칙을 UI와 데이터 접근 코드에 섞지 않는다.
- `DEV-CODE-03` `MUST`: FSD와 도메인 소유권의 의존 방향을 역행하지 않는다.
- `DEV-CODE-04` `SHOULD`: 실제 대체 구현, 외부 경계 또는 테스트 격리 요구 없이 인터페이스와 중간 계층을 만들지 않는다.
- `DEV-CODE-05` `SHOULD`: 상속보다 조합과 명시적인 데이터 흐름을 우선한다.
- `DEV-CODE-06` `SHOULD`: 함수·파일 줄 수 자체가 아니라 이름, 응집도, 변경 이유와 테스트 가능성으로 분리한다.
- `DEV-CODE-07` `MUST`: 코드에 설명 주석과 JSDoc 블록을 쓰지 않는다. 의도는 이름과 구조로 드러내고 설계 근거는 RADIO와 handoff가 소유한다. 예외는 코드로 표현할 수 없는 제약(외부 명세 링크, 우회 사유)뿐이며 한 줄로 최소화한다.
- `DEV-CODE-08` `SHOULD`: 상수는 소비 범위가 자리를 정한다. 한 파일 안에서만 쓰는 표현용 상수는 그 파일에 두어도 된다. 두 파일 이상이 소비하거나 업무 의미를 갖는 상수는 세그먼트 정본으로 옮긴다 — slice 공유는 해당 slice의 `model`, 도메인 수치는 `entities`, 전역은 `shared/config`. `ui` 세그먼트 파일은 업무 상수를 소유하지 않는다.
- `DEV-CODE-09` `SHOULD`: `ui` 세그먼트 파일은 표현(마크업·스타일·조립)과 이벤트 배선만 소유한다. 계산·변환·분기 판정·데이터 가공은 해당 slice의 `model`(화면 로직)·`lib`(일반 유틸)·`hooks`(React 상태·효과)·`entities`(도메인 규칙)에 두고 ui는 호출만 한다. 예외는 한 줄 이벤트 배선과 순수 표현 보조(className 조합, 표현용 조건부 렌더)뿐이다.

모든 entity에 repository·service를 만드는 식의 기계적 SOLID 적용과 MVP 밖 기능을 위한 선행 추상화는 하지 않는다.

## 이름 규칙

구조 계약의 기계 판독 정본은 `config/fsd.json`이다. ESLint의 `project/*` 규칙과 `.claude/hooks/tdd-guard.sh`가 같은 파일을 읽으므로 두 도구의 판정이 갈리지 않는다. 이 절은 그 값의 의미를 소유한다.

- `DEV-NAME-01` `MUST`: 폴더 이름은 kebab-case를 쓴다. 계층, 슬라이스, 세그먼트 모두 같다.
- `DEV-NAME-02` `MUST`: 파일 이름은 kebab-case를 기본으로 하되 `ui` 세그먼트의 컴포넌트는 PascalCase, `hooks` 세그먼트는 useCamelCase를 쓴다.
- `DEV-NAME-03` `MUST`: 파일 이름과 그 파일의 주 export 이름을 일치시킨다. `ShiftCard.tsx`는 `ShiftCard`를, `useShiftList.ts`는 `useShiftList`를 export한다.
- `DEV-NAME-04` `MUST`: 세그먼트 디렉터리는 `config/fsd.json`의 `segments`에 정의된 이름만 쓴다. 새 세그먼트가 필요하면 규칙(`unitTest`, `runtimeExports`, `verifiedBy`, import 제약)을 함께 정의해 추가한다.
- `DEV-NAME-05` `MAY`: 프레임워크나 외부 도구가 파일명을 정하는 구역은 예외로 둔다. 예외 목록은 `config/fsd.json`의 `naming.exceptions`가 소유하며 현재는 Next.js 예약 파일명(`src/app/**`)과 shadcn 관리 구역(`src/shared/ui/**`)이다.
- `DEV-NAME-06` `MUST`: `src/` 안 import는 `@/` alias 하나만 쓴다. 상대경로(`./`·`../`)는 정적 `import`·재export(`export … from`)·동적 `import()` 리터럴 모두 금지하며, alias는 파일 확장자를 붙이지 않는다. 기계 강제: `project/import-alias`(fixer 포함).

세그먼트별 책임과 잠금 규칙은 다음과 같다. `unitTest`가 `exempt`인 구역은 런타임 코드를 제한해 면제가 우회 통로가 되지 않게 한다.

| 세그먼트 | 단위 테스트 | 런타임 export | import 제약 |
| --- | --- | --- | --- |
| `ui` | 면제 (컴포넌트·E2E로 검증) | 허용 | 서버 모듈·`api` 세그먼트 금지 |
| `hooks` | 필수 | 허용 | 서버 모듈 금지 |
| `model` | 필수 | 허용 | React 금지 |
| `api` | 필수 | 허용 | `import "server-only"` 필수 |
| `lib` | 필수 | 허용 | — |
| `config` | 면제 | 상수만 (함수·클래스 금지) | — |
| `types` | 면제 | 금지 | — |

`app` 계층은 세그먼트를 갖지 않는다. Next.js 예약 표현 파일(`page`·`layout`·`loading`·`error`·`global-error`·`not-found`·`template`·`default`)만 단위 테스트를 면제하고, `route.ts` 같은 엔드포인트와 `src/` 바로 아래의 `proxy.ts`·`instrumentation.ts`는 서버 코드이므로 테스트를 요구한다.

슬라이스 public API를 barrel(`index.ts`)로 만들지 않는다. Next.js에서 빌드 성능 문제를 만들고 순환 의존의 통로가 되며, 계층 방향은 `project/layer-direction`이 직접 강제하므로 barrel 없이도 규약이 유지된다.

## 디자인 토큰

원시 팔레트 hex는 `src/app/globals.css`의 정의 지점 한 곳에만 존재한다. 화면·컴포넌트 코드는 `@theme` 의미 토큰 유틸(`bg-action`, `text-text-muted` 등)만 쓰고 임의 색상값이나 Tailwind 기본 팔레트 클래스를 직접 참조하지 않는다.

- `DEV-TOKEN-01` `MUST`: 화면 코드는 원시 색과 모션 값을 직접 참조하지 않고 `@theme` 의미 토큰만 쓴다. 모션에서는 `--duration-*`·`--ease-*`를 참조하고 시간·easing 숫자를 코드에 적지 않으며, 애니메이션 대상은 `transform`과 `opacity`로 제한한다. 기계 강제: `project/design-token-colors`, `project/motion-tokens`.

## 재사용

- `DEV-REUSE-01` `MUST`: 도메인·보안·금액·시간 규칙은 하나의 구현만 소유한다.
- `DEV-REUSE-02` `SHOULD`: UI와 일반 유틸은 두 개 이상의 실제 소비자와 동일한 변경 이유가 있을 때 공통화한다.
- `DEV-REUSE-03` `MUST`: 우연한 형태 중복을 업무 개념의 재사용으로 취급하지 않는다.
- `DEV-REUSE-04` `MUST`: `shared` 계층은 feature별 업무 규칙을 소유하지 않는다.
- `DEV-REUSE-05` `SHOULD`: 잘못된 추상화보다 국소적인 중복을 허용하고 조건 분기가 계속 늘어나는 공통화는 다시 분리한다.

## Interface, 오류와 멱등성

Server Action은 Zod로 외부 입력을 검증한다. 성공은 `{ ok: true, data }`, 예상 가능한 실패는 `{ ok: false, code, fieldErrors? }` 형태를 사용하고 UI는 안정적인 `code`를 기준으로 표현한다.

- `DEV-ERR-01` `MUST`: 검증, 권한, 상태 충돌, 마감처럼 예상 가능한 업무 실패는 typed Result로 반환한다.
- `DEV-ERR-02` `MUST`: 코드 결함과 인프라 장애 같은 예상하지 못한 실패는 예외로 처리하고 서버에서 관측 가능하게 기록한다.
- `DEV-ERR-03` `MUST`: SQL, stack trace, 내부 경로와 개인정보를 클라이언트에 노출하지 않는다.
- `DEV-ERR-04` `MUST`: mutation은 기본적으로 자동 재시도하지 않는다.
- `DEV-ERR-05` `MUST`: 중복 가능 command는 멱등성 키·유일성·잠금·revision 중 적합한 전략과 중복 결과를 RADIO에서 결정한다.
- `DEV-ERR-06` `MUST`: 여러 데이터를 바꾸는 command는 중간 실패 시 전체 롤백되거나 승인된 보상 전략을 가져야 한다.

오류 코드는 도메인 접두 6종(`IDENTITY`·`SCHEDULING`·`ATTENDANCE`·`NOTIFICATIONS`·`PAY`·`COMMON`) + 의미 슬러그의 UPPER_SNAKE 단일 문자열이다. 정본 레지스트리는 `src/shared/config/error-codes.config.ts`의 `ERROR_CODES` 하나이며 코드별로 HTTP 상태와 기본 한국어 문구를 함께 선언한다. read Route Handler의 오류 응답은 `code`와 문의용 식별자만 담고 문구를 담지 않는다.

- `DEV-ERR-07` `MUST`: 오류 코드는 도메인 접두 6종 + 의미 슬러그의 UPPER_SNAKE 문자열이며 번호 접미사를 쓰지 않는다. 정본은 `src/shared/config/error-codes.config.ts`의 `ERROR_CODES` 하나이고, HTTP 상태는 이름에서 유도하지 않고 코드별로 선언한다. 정본 밖에서 접두 패턴에 걸리는 문자열 리터럴은 `project/error-code-literal` 린트가 `src/` 전체에서 차단하며, 소비 코드는 `ERROR_CODE`·`ERROR_CODES` 멤버 접근만 쓴다. 도메인 코드는 소비하는 기능 task가 자신의 RADIO에서 레지스트리에 추가한다.
- `DEV-ERR-08` `MUST`: read Route Handler의 오류 응답 본문은 `{ error: { code, correlationId } }`이고 HTTP 상태는 레지스트리의 `http` 값을 쓰며 문구·비밀값·불필요한 개인정보를 담지 않는다. Server Action은 `DEV-ERR-01`의 Result 형식(`{ ok: false, code, fieldErrors? }`)을 유지하고 `code`를 `ErrorCode`로 좁힌다. 사용자 문구의 정본은 레지스트리 `message`이며 화면은 맥락이 필요할 때만 재정의한다. `correlationId`의 생성·전파는 `DEV-OBS-01`을 따르는 서버 오류 경로가 구현한다.

## 위험 기반 테스트 포트폴리오

각 인수 조건마다 Happy Path, 주요 실패, 경계값, 권한, 중복 요청, 동시성 가능성을 검토한다. 모든 조합을 테스트하지 않고 업무 영향, 발생 가능성, 복구 비용, 책임 경계를 기준으로 테스트 시나리오를 선택한다.

각 위험은 가장 낮은 비용으로 신뢰성 있게 검증할 수 있는 계층에 배치한다.

- 순수 도메인 규칙, 계산, 상태 전이: 단위 테스트
- Server Action, Route Handler, DB 트랜잭션: 통합 테스트
- 권한, RLS, 유일성·참조 무결성·불변 제약: 실제 PostgreSQL 테스트
- 외부 서비스 성공·실패·타임아웃: 계약 테스트와 실패 fixture
- 핵심 사용자 흐름: 최소한의 E2E 테스트

예상 가능한 업무 실패는 typed Result를 검증하고, 예상하지 못한 시스템 실패는 서버 예외 발생과 관측 기록을 검증한다.

중복 가능 command는 재전송과 동시 실행 상황에서 멱등성을 검증한다. 여러 데이터를 변경하는 command는 중간 실패 시 전체 롤백을 검증한다.

테스트는 구현 세부사항보다 외부에서 관찰 가능한 동작과 도메인 불변 규칙을 검증한다. 버그 수정 시 실패를 재현하는 테스트를 먼저 추가하고, 수정 후 회귀 테스트로 유지한다.

커버리지 수치는 누락 영역을 탐색하는 참고 지표로만 사용하며, 완료 조건으로 사용하지 않는다.

- `DEV-TEST-01` `MUST`: 인수 조건마다 여섯 위험 렌즈와 검증 계층을 정한다.
- `DEV-TEST-02` `MUST`: 권한·RLS·DB 제약은 mock이 아닌 실제 PostgreSQL 경계에서 검증한다.
- `DEV-TEST-03` `MUST`: 버그 수정은 실패 재현 테스트를 먼저 추가하고 회귀 테스트로 유지한다.
- `DEV-TEST-04` `SHOULD`: 테스트는 구현 세부사항보다 관찰 가능한 동작과 불변 규칙을 검증한다.
- `DEV-TEST-05` `MUST`: 커버리지 수치만으로 완료를 판단하지 않는다.
- `DEV-TEST-06` `MUST`: 단위 테스트는 소스와 같은 폴더의 `__tests__/` 하위에 `<대상>.test.<확장자>`로 둔다. `.spec` 접미사는 쓰지 않는다. 배치 계약의 정본은 `config/fsd.json`의 `testPlacement`이며, 기계 강제: `project/test-placement`와 `.claude/hooks/tdd-guard.sh`.

동작·도메인·API·DB·RLS·보안 task는 TDD를 기본으로 한다. 문서·설정·기계적 생성 task만 verification을 사용한다.

## 관측성과 감사

- `DEV-OBS-01` `MUST`: 예기치 않은 서버 실패는 correlation ID와 함께 구조화해 기록한다.
- `DEV-OBS-02` `MUST`: 로그, trace와 오류 응답에 비밀값과 불필요한 개인정보를 남기지 않는다.
- `DEV-OBS-03` `MUST`: 감사 로그와 장애 진단 로그의 목적, 보존과 접근 권한을 분리한다.
- `DEV-OBS-04` `MUST`: 비동기·예약·외부 연동·다중 변경 작업은 성공·실패·지연·재시도와 최종 상태를 관측 가능하게 한다.
- `DEV-OBS-05` `SHOULD`: 외부 관측 도구와 경보 기준은 실제 운영 요구가 있는 RADIO에서 결정한다.

사용자에게는 안전한 오류 코드와 문의용 식별자만 제공한다.

## 근거 기반 최적화

RADIO의 Optimizations에는 `기본값 유지`, `예방적 설계`, `측정 기반 개선` 중 하나를 기록한다.

- `DEV-OPT-01` `MUST`: 최적화하지 않는 선택도 RADIO에 명시한다.
- `DEV-OPT-02` `MUST`: 최적화에는 측정된 병목 또는 승인된 규모·빈도·플랫폼 제한, 목표 지표와 복잡도 비용이 있어야 한다.
- `DEV-OPT-03` `MUST`: 보안, 정확성과 데이터 일관성을 성능과 교환하지 않는다.
- `DEV-OPT-04` `SHOULD`: N+1, 무제한 조회와 불필요한 직렬 호출처럼 구조적으로 명확한 비용은 사전에 방지한다.
- `DEV-OPT-05` `SHOULD`: 최적화는 검증 가능하고 가능한 경우 되돌릴 수 있어야 한다.

## 외부 의존성

선택 순서는 언어·브라우저·프레임워크의 안정된 기능 → 설치된 의존성 → 작고 명확한 프로젝트 코드 → 새 외부 의존성이다.

- `DEV-DEP-01` `MUST`: 새 production 의존성은 개발 설계 RADIO에서 사용자 승인을 받는다.
- `DEV-DEP-02` `SHOULD`: 기존 플랫폼, 설치 의존성과 작은 내부 구현 순으로 대안을 검토한다.
- `DEV-DEP-03` `MUST`: 보안·암호·인증·서명과 표준 프로토콜을 임의로 재구현하지 않는다.
- `DEV-DEP-04` `MUST`: 새 의존성의 유지보수, 보안, 라이선스, 실행 위치, bundle·빌드 영향과 교체 비용을 검토한다.
- `DEV-DEP-05` `MUST`: 같은 목적의 라이브러리를 중복 도입하지 않는다.

## migration

- `DEV-MIG-01` `MUST`: 적용된 migration을 수정하지 않는다.
- `DEV-MIG-02` `MUST`: migration은 schema, 제약, RLS, grant, policy, 함수, trigger, index와 data migration의 실행 원본이다.
- `DEV-MIG-03` `MUST`: 운영 데이터나 기존 클라이언트 호환성 위험이 있으면 Expand → Migrate → Switch → Contract를 사용한다.
- `DEV-MIG-04` `MUST`: backfill은 재실행, 진행 확인과 중간 실패 복구가 가능해야 한다.
- `DEV-MIG-05` `MUST`: 파괴적 변경은 영향 데이터, 백업·검증·배포 순서와 roll-forward 복구 계획을 가진다.

운영 데이터와 기존 클라이언트가 없는 초기 스키마 생성은 하나의 migration으로 단순화할 수 있다.

## 시간

- `DEV-TIME-01` `MUST`: 실제 시점, 시각 없는 업무 날짜와 기간의 의미를 타입과 이름으로 구분한다.
- `DEV-TIME-02` `MUST`: 정본 사건·감사·상태 변경 시각은 서버에서 생성한 `timestamptz`를 사용한다.
- `DEV-TIME-03` `MUST`: 업무 날짜는 PostgreSQL `date`, 달력·마감·월 경계는 `Asia/Seoul`을 기준으로 계산한다.
- `DEV-TIME-04` `MUST`: 클라이언트 시각을 권한, 마감, 출퇴근과 감사의 정본으로 사용하지 않는다.
- `DEV-TIME-05` `MUST`: 시간 기반 규칙은 주입 가능한 clock과 자정·월말·윤년·정확한 경계값 테스트를 제공한다.

## RADIO와 검증

### RADIO 정본과 실행 증거

모든 task는 위험에 따라 간결·일반·심화 RADIO를 갖는다. 정본 형식은 [task별 개발 설계](../execution/radio/README.md)를 따른다.

1. `## Requirements`: spec refs, 범위, 불변 규칙, 위험 기반 테스트
2. `## Architecture`: FSD·도메인 책임, 서버·보안 경계, Clean Code와 재사용
3. `## Data model`: 정본, migration, RLS, 감사, 트랜잭션과 동시성
4. `## Interface`: Zod, Result, DTO, 멱등성, cache·offline과 외부 계약
5. `## Optimizations`: 관측성, 성능 근거, 의존성과 기본값 유지

작업 인덱스 schema v3에서 현재 미완료와 신규 task는 `approval_contract: "dual-approval-v3"`를 사용한다. 전환 전에 종료된 이력만 `legacy-v2`를 사용할 수 있고 실행 상태로 돌아갈 수 없다. `dual-approval-v3`의 건너뛰기는 제품·개발 승인 대신 명시적인 사용자 `skip_approval`과 이유를 요구한다.

RADIO를 재설계하면 고정 경로에서 revision을 증가시키고 `Draft`로 바꾼다. 제품 범위 변경은 `proposed`로 돌아가 두 승인을, 기술 설계 변경은 `design_pending`으로 돌아가 개발 승인만 다시 받는다. 실행 중 발견된 결정은 먼저 `blocked`와 구조화된 결정 신호로 보존하며 자동 승인 수정, 작업물 폐기 또는 WIP commit을 하지 않는다.

권한, 개인정보, 예상 급여, 출퇴근, 계정 복구 또는 별도로 지정된 민감 변경은 구현·검증 후 실행 RADIO, 검증 결과와 diff를 사용자에게 보여주고 확인받은 뒤 `done`과 task commit을 만든다.

## 에이전트와 Git 품질 게이트

- `.claude/settings.json`의 `PreToolUse`는 `Write`·`Edit`·`MultiEdit`마다 `.claude/hooks/tdd-guard.sh`를 실행한다.
- TDD guard는 `src/` 아래 비즈니스 로직 파일에 대응 테스트가 없으면 편집을 차단한다. `src/app/**` route adapter, `**/ui/**`·`**/components/**` 표시 계층, `**/types/**`, `*.d.ts`, `*.config.*`, slice `index.ts` barrel과 비소스 파일은 예외다.
- `test_mode=tdd` task는 편집 전 RED → GREEN 증거를 남기고 commit 전 동일 검증기를 통과한다.
- 에이전트 hook은 신뢰된 프로젝트에서만 로드한다.
- Git hook은 에이전트 밖 commit의 동일한 최종 방어선이며 원격 우회 방지는 CI가 담당한다. `.githooks/commit-msg`는 task ID 형식을 검사한다.

## 실행

구조 재편 과정에서 기존 하네스와 repository-local 스킬이 제거되어 현재 실행 명령은 없다. 5단계 파이프라인과 [연속 루프](../workflow/WORKFLOW.md#연속-루프-규칙)를 강제하는 새 실행 하네스와 명령은 **P0-T31**에서 다시 만든다. 그때까지 단계 순서, 승인 게이트와 루프 규칙은 문서 계약으로 지키고 사람이 확인한다.

새 하네스는 두 승인, RADIO 해시, 의존성, 실행 계약, TDD 증거, check 결과와 task commit을 검사하고 기술적 실패를 설정된 횟수 안에서 재시도한다. 포맷, lint, TypeScript strict와 실제 앱 테스트 도구는 P0-T02에서 구성한다.
