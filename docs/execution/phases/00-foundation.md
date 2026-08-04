# P0. 프로젝트 기반과 품질 게이트

## 목표

다음 Phase들이 같은 규칙으로 개발·검증·배포될 수 있는 최소 프로젝트 기반을 만들고, 기능 구현이 올라탈 화면 기반(디자인 시스템 코드와 근무자 핵심 화면)을 먼저 세운다.

화면 기반을 기능보다 앞에 두는 이유는 사용자 결정(2026-08-04)이다. 화면을 눈으로 확인한 뒤 기능을 붙이면 UI 재작업이 줄고, 이미 승인된 [디자인 시스템 명세](../../product/DESIGN.md)가 실제로 구현 가능한지 먼저 검증된다.

## 진입 조건

- PRD, Architecture, ADR이 승인되어 있다.
- 관련 spec: [PRD](../../product/PRD.md) `AC-12`, [Domain](../../product/DOMAIN.md), [ADR-0001](../../standards/adr/0001-nextjs-supabase-vercel.md), [ADR-0002](../../standards/adr/0002-authorization-boundaries.md).

## 작업

### P0-T00. 하네스 실행기와 TDD 품질 가드

- `docs/execution/phases/index.jsonl`을 유일한 실행 상태 원본으로 사용한다.
- task별 임시 worktree에서 새 `codex exec`를 실행하고 성공한 commit만 통합 worktree에 반영한다.
- `test_mode`와 `check_ids`에 따라 문서 검사, 일반 검증, RED→GREEN TDD를 선택한다.
- RED 실패 증거, GREEN 통과 결과, 관련 `spec_refs`를 task 실행 기록에 남긴다.
- worktree 전용 Git hook과 CI가 `--no-verify` 우회를 다시 검사한다.
- task당 최대 3회 실행하고 실패하면 `blocked`와 수동 확인 요약을 남긴다.

인수 조건:

- 의존성이 충족된 task를 하나만 `in_progress`로 전환하고 재실행 시 마지막 상태에서 복구한다.
- 실패한 임시 worktree가 통합 worktree를 오염시키지 않는다.
- `test_mode=tdd` task는 RED 증거 없이 commit할 수 없다.
- task 검증 통과 시 관련 spec ID가 증거에 기록되고 task별 commit이 생성된다.
- phase의 자동 검증 통과 후 수동 증거가 없으면 phase가 `verification_pending`으로 남는다.

### P0-T01. Next.js 모바일 앱 프로젝트 생성

- pnpm 기반 Next.js App Router와 TypeScript를 생성한다.
- `src/` 아래 FSD 계층(`app`·`views`·`widgets`·`features`·`entities`·`shared`)의 절대 경로 alias를 만들고, 디렉터리는 처음 쓰이는 계층부터 만든다. 계층 이름의 정본은 [ADR-0014](../../standards/adr/0014-fsd-view-layer-naming.md), 계층 정의의 정본은 [개발 컨벤션](../../standards/DEVELOPMENT.md)이다. P0-T01 종료 시점의 실제 디렉터리는 `app`·`views`·`shared` 셋이다.
- 서버·클라이언트 경계 규약을 세운다. 서버 모듈의 `import "server-only"` 선언 지점을 정하고 서버 전용 값이 클라이언트 번들에 들어가지 않음을 확인한다.
- 모바일 viewport, 한국어 metadata와 문서 언어를 설정한다.
- Tailwind CSS를 설치하고 설정 파일 골격만 만든다. 토큰 값은 P0-T34가 채운다.
- 부트스트랩 확인용 최소 화면 하나를 렌더한다.

비목표:

- 디자인 토큰과 컴포넌트(P0-T34), PWA manifest·아이콘(P0-T04), service worker와 Web Push(P4-T02).
- lint·formatter·테스트 도구(P0-T02), Supabase 연동(P0-T03).

인수 조건:

- 개발 서버가 실행되고 기본 모바일 화면이 렌더링된다.
- production build와 typecheck가 성공한다.
- `src/` 디렉터리 골격이 개발 컨벤션의 FSD 계층과 이름·순서에서 일치한다.
- 서버 전용 모듈이 클라이언트 번들에 포함되지 않는다.

기획 승인: user, 2026-08-04.

### P0-T02. 코드 품질과 테스트 도구 구성

목표: [개발 컨벤션](../../standards/DEVELOPMENT.md)의 구조 규칙을 사람의 주의력이 아니라 기계가 막게 하고, 이후 모든 task가 딛고 설 검증 명령을 완성한다.

**1. FSD 구조 계약의 단일 정본**

계층·세그먼트와 각 세그먼트의 규칙을 파일 하나(`config/fsd.json`)에 정의하고, ESLint와 `.claude/hooks/tdd-guard.sh`가 **같은 파일을 읽는다**. 지금은 같은 구조 지식이 훅의 셸 패턴과 린트 설정 두 곳에 하드코딩되어 `DEV-SSOT-01`을 어기고, 실제로 어긋나 있다(훅은 `types`·`components`를 예외 처리하는데 세그먼트 목록에는 없다). 훅이 이미 `jq`를 요구하므로 새 의존성은 없다.

| 세그먼트 | 책임 | 단위 테스트 | 런타임 코드 | import 제약 |
| --- | --- | --- | --- | --- |
| `ui` | 표시와 이벤트 전달 | 면제 (컴포넌트·E2E로 검증) | 허용 | DB·서버 모듈·비밀값 금지 |
| `hooks` | React 훅, 클라이언트 상태, TanStack Query | 필수 | 허용 | 서버 모듈 금지 |
| `model` | 도메인 모델, 순수 규칙, 상태 전이, Zod 스키마 | 필수 | 허용 | **React 금지** |
| `api` | 서버 요청, Server Action | 필수 | 허용 | `server-only` 필수 |
| `lib` | 범용 유틸 | 필수 | 허용 | 도메인 지식 금지 |
| `config` | 상수, 설정 | 면제 | **금지** | — |
| `types` | 타입 선언 | 면제 | **금지** | — |

- **면제 구역에는 잠금을 건다.** 단위 테스트를 면제하는 `config`·`types`는 런타임 export를 금지해 우회 통로가 되지 않게 한다. 면제는 "로직이 없을 것"이라는 가정 위에 서 있는데, 지금은 그 가정을 강제하는 것이 없다.
- `ui`의 면제는 검증 포기가 아니라 **위임**이다. `verifiedBy`에 검증 계층(컴포넌트·E2E)을 명시하고, 비어 있으면 검증 계획 없는 면제 구역으로 드러난다(`DEV-TEST-01`).
- `model`의 React 금지가 `DEV-CODE-02`("도메인 규칙을 UI와 데이터 접근 코드에 섞지 않는다")를 기계 검사 대상으로 만든다. `hooks`를 분리했기에 가능하다.
- 코드 생성물(Supabase DB 타입)은 세그먼트가 아니라 `api/generated/`에 두고 `exemptPaths`로 처리한다.
- **barrel(`index.ts`)을 쓰지 않는다.** Next.js에서 빌드 성능 문제를 만들고 순환 의존의 주 통로다. 슬라이스 public API 대신 직접 경로로 import하며, 지켜야 할 계층 방향은 ESLint가 직접 강제한다. 기존 `src/views/bootstrap/index.ts`를 제거하고 `tdd-guard.sh`의 `*/index.ts` 예외도 함께 없앤다.

**2. 네이밍 컨벤션** — `DEVELOPMENT.md`에 `DEV-NAME-*`로 신설한 뒤 ESLint로 강제한다. `MUST` 규칙 변경은 설계 단계가 아니라 L3에서 먼저 처리한다([ADR-0013](../../standards/adr/0013-project-layer-structure.md)).

| 대상 | 규칙 |
| --- | --- |
| 폴더(레이어·슬라이스·세그먼트) | kebab-case |
| 일반 파일 | kebab-case |
| React 컴포넌트 파일 | PascalCase (`ShiftCard.tsx`) |
| 컴포넌트 export | PascalCase |
| 훅 | 파일 `useXxx.ts`, export `useXxx` |
| 타입·인터페이스 | PascalCase |
| 테스트 | `*.test.ts(x)` 형제 배치 |
| 예외 | Next.js 예약 파일명(`page.tsx`·`layout.tsx`·`route.ts`·`loading.tsx`·`error.tsx`·`not-found.tsx`), shadcn 관리 구역 `shared/ui/**` |

**3. ESLint 규칙** (Flat Config. Next 16에서 `next lint`가 제거되어 CLI를 직접 구성한다)

- 구조: FSD 단방향 import(`DEV-ARCH-01`·`DEV-CODE-03`), UI의 DB·비밀값·서버 모듈 import 금지(`DEV-ARCH-02`), 서버 모듈의 `import "server-only"` 선언(`DEV-ARCH-03`), 세그먼트별 import 제약과 런타임 코드 잠금
- 규칙 기계화: 주석·JSDoc 금지(`DEV-CODE-07`, 로컬 커스텀 규칙 — 주석은 AST 노드가 아니라 토큰이라 기성 규칙이 없다), `shared/config/env` 밖 `process.env` 접근 차단(`DEV-SEC-02`), `no-console`(`DEV-SEC-04`·`DEV-OBS-02`), `import/no-cycle`
- 정확성: `@next/eslint-plugin-next`, `react-hooks`, `consistent-type-imports`
- **CI 전용 설정으로 분리**: `no-floating-promises`, `no-misused-promises`, `no-explicit-any`, `no-unsafe-*`. 타입 정보를 요구해 린트가 타입 검사만큼 느려지고 변경 파일만 검사하는 방식과 상성이 나쁘다.
- 넣지 않는 것: 스타일 프리셋(Airbnb 등)은 취향 규칙 덩어리라 formatter와 충돌하고, 함수 줄 수·복잡도 제한은 `DEV-CODE-06`이 명시적으로 반대한다.

**4. 도구** — formatter, TypeScript strict, Vitest + Testing Library, Playwright 모바일 프로젝트, 그리고 테스트·lint·typecheck와 CI용 단일 검증 명령을 package scripts로 제공한다.

**5. 검사 배치**

| 단계 | 검사 |
| --- | --- |
| pre-commit | harness 게이트 4종 + lint-staged(변경 파일만) + `tsc --incremental` + 단위 테스트 전체 |
| pre-push (신설) | `pnpm build` |
| CI (P0-T05) | 위 전부 + Playwright E2E + type-aware 린트 + `pnpm gate:all` |

- 커밋 시점에 테스트를 돌려도 TDD 흐름과 충돌하지 않는다. `gate:tdd`는 테스트를 실행하지 않고 `tdd.json`의 RED→GREEN **기록**만 검사하며, task당 단일 commit 계약상 커밋 시점은 이미 GREEN이다.
- 훅은 기존 `.githooks/pre-commit`에 이어 붙인다. husky는 쓰지 않는다. husky는 설치 시 `core.hooksPath`를 자기 디렉터리로 바꾸는데, 그러면 그 경로에 있던 harness 게이트 4종(index·RADIO 해시·TDD 증거·커밋 범위)이 조용히 실행되지 않는다. 승인 계약을 지키는 검사를 포맷터 편의와 바꾸지 않는다.
- 팀원이 `pnpm install`만으로 훅을 얻도록 `prepare` 스크립트가 `core.hooksPath`를 `.githooks`로 설정한다. husky가 제공하는 자동 설치 이점은 이 한 줄로 대체된다.
- staged 파일만 검사하는 부분은 lint-staged를 쓴다. 부분 stage된 파일 처리 같은 함정을 직접 구현하지 않는다.
- 타입 검사와 build는 변경 파일만 검사할 수 없다. TypeScript는 파일이 아니라 프로그램 단위로 검사하고 파일 목록을 직접 주면 `tsconfig.json` 옵션이 무시된다. 증분 캐시로 실제 작업량만 줄인다.

비목표:

- CI 파이프라인 구성(P0-T05). 이 task는 로컬 커밋·푸시 경로와 검증 명령까지만 다룬다.
- 커버리지 임계값 정책. `DEV-TEST-05`가 커버리지 수치만으로 완료를 판단하지 못하게 한다.
- Supabase 연동과 DB 테스트 환경(P0-T03).
- 디자인 토큰과 컴포넌트(P0-T34).

인수 조건:

- 다음이 각각 ESLint 오류로 차단된다: FSD 역방향 import, UI 계층의 서버 모듈 import, 설명 주석, `shared/config/env` 밖 `process.env` 접근, `config`·`types` 세그먼트의 런타임 export, `model`의 React import, 네이밍 규칙 위반. 각각 의도적 위반 fixture로 차단을 확인한다.
- `config/fsd.json`의 세그먼트 하나를 바꾸면 ESLint와 `tdd-guard.sh`의 판정이 함께 바뀐다. 두 도구가 같은 정본을 읽는다는 증거를 남긴다.
- 포맷 위반·린트 오류·타입 오류·테스트 실패가 있는 커밋이 pre-commit에서 거부되고, 같은 훅에서 harness 게이트 4종도 그대로 실행된다.
- build가 실패하는 push가 pre-push에서 거부된다.
- 새로 clone한 저장소에서 `pnpm install` 후 별도 명령 없이 훅이 동작한다.
- 의도적인 샘플 단위 테스트가 통과하고, 모바일 뷰포트 E2E smoke test가 부트스트랩 화면 렌더를 확인한다. 통과만 하는 빈 테스트가 아님을 대조군으로 증명한다.
- CI에서 사용할 단일 검증 명령이 존재한다.

주요 경계 사례:

- `--no-verify` 우회는 git의 한계다. CI가 `pnpm gate:all`로 보완한다(P0-T05).
- `tdd-guard.sh`의 테스트 탐색 경로(형제 `*.test.*` → `__tests__/` → `src/__tests__/` → `tests/`)와 새 Vitest 배치가 어긋나면 테스트가 있는데도 편집이 거부된다.
- shadcn CLI는 레지스트리에 정의된 파일명(`button.tsx`)을 그대로 쓰고 `components.json`에 파일명 옵션이 없다. `shared/ui/**`를 예외 구역으로 두고 실제 개명 정책은 shadcn을 설치하는 P0-T34에서 확정한다.

기획 승인: user, 2026-08-04.

### P0-T03. Supabase 로컬 개발과 초기 스키마

목표: 로컬 Supabase 개발 환경과 마이그레이션 기반을 세우고, 이후 모든 도메인 테이블이 딛고 설 공통 규약과 참조 데이터를 만든다.

- Supabase CLI 설정과 마이그레이션 디렉터리를 만든다.
- 공통 enum, timestamp 규칙, audit 기반 타입을 정의한다.
- 포지션 9종과 기본 인원·성별·기본 포지션 여부를 넣는다.
- 단일 venue 기본 설정, GPS 100m, 위치 정확도 100m, 기본 출근 규칙을 넣는다.

**포지션은 고정 참조 데이터가 아니라 관리자 CRUD 대상이다**(기획 승인 2026-08-04). 정본은 [PRD 4장](../../product/PRD.md)이며 이 task는 스키마와 초기 데이터만 만든다.

- 성별 조건의 값은 제한 없음·남성·여성 셋으로 고정한다.
- 배정이나 개인별 가능 포지션에 한 번이라도 쓰인 포지션은 삭제할 수 없고 비활성화만 할 수 있다. UI가 아니라 **DB 참조 제약으로 강제**한다.
- **seed는 로컬 개발 전용이다.** 운영 DB에는 실행하지 않는다. 운영 초기 포지션과 venue 설정은 1회성 데이터 migration으로 넣고, 그 뒤 정본은 DB다. seed와 관리자 수정값이 정본을 다투지 않게 한다.

비목표: 다중 장소·다중 홀(PRD 비목표), 포지션 관리 화면과 API(P3-T02), 스케줄·신청·배정·출퇴근 테이블(P2·P5), 인증과 역할(P1).

인수 조건:

- 빈 로컬 DB에서 migration과 seed를 재실행할 수 있다.
- seed 결과가 PRD 포지션 표 9종의 이름·기본 필요 인원·성별 조건과 일치한다.
- 운영 초기 포지션은 seed가 아니라 데이터 migration으로 들어간다.
- 사용 중인 포지션의 삭제가 DB에서 차단되고 비활성화만 가능하다.
- venue 기본 설정(GPS 반경 100m, 위치 정확도 100m)과 지각 기준(예정 출근 1분 초과)이 PRD 값대로 들어간다.

기획 승인: user, 2026-08-04.

이월된 미결 사항:

- 새로 만든 포지션을 기본 포지션으로 지정하면 이미 승인된 근무자에게 소급 적용되는지, 이후 승인자부터인지는 P1-T05 또는 P3-T03 기획에서 정한다.
- P3-T02의 범위가 "9개 포지션 설정"에서 포지션 CRUD로 넓어진다. 확정은 P3-T02 기획에서 한다.

### P0-T04. 환경변수와 애플리케이션 셸

- 공개·서버 전용 환경변수를 schema로 검증한다.
- Supabase 브라우저·서버 client factory를 분리한다.
- 로딩, 오류, 오프라인, 접근 거절 기본 화면을 만든다.
- PWA manifest와 아이콘 placeholder를 구성한다.
- `DESIGN.md`의 앱 셸, 상태 피드백, 접근성 패턴을 적용한다.

인수 조건:

- 필수 환경변수가 없으면 시작 시 이해 가능한 오류를 낸다.
- 서버 비밀값이 클라이언트 번들에 포함되지 않는다.

### P0-T05. CI와 문서 인덱스 검증

- lint, typecheck, unit, build, migration 검증을 CI에 연결한다.
- `docs/execution/phases/index.jsonl`의 JSON 파싱, schema, ID 중복, 의존성 존재 여부와 순환을 검사하는 스크립트를 만든다.
- task ID·Phase·제목·문서 heading의 일치, 유효한 `spec_refs`, 최대 한 개의 진행 task를 검사한다.
- 깨진 Markdown 내부 링크를 검사한다.

인수 조건:

- 잘못된 JSONL 한 줄, 중복 task ID, 존재하지 않거나 순환하는 의존성이 CI를 실패시킨다.
- task와 Phase 문서의 제목 불일치, 잘못된 spec 참조, 복수 진행 task가 CI를 실패시킨다.
- 깨진 내부 문서 링크가 CI를 실패시킨다.

### P0-T06. SDD·DDD 문서 구조 정비

- 제품 불변 규칙과 인수 조건에 안정적인 spec ID를 부여한다.
- 공통 언어, 논리적 도메인 경계, aggregate 일관성 경계를 문서화한다.
- task가 관련 spec과 ADR을 `spec_refs`로 추적하게 한다.
- 문서별 책임, 충돌 처리, task 상태 규칙을 하나의 기준으로 정리한다.
- Phase 문서와 작업 인덱스의 ID·제목·의존성을 교차 검증한다.

인수 조건:

- 제품 규칙에서 task와 검증까지 양방향으로 추적할 수 있다.
- DDD 경계가 모듈형 모놀리스 안의 논리적 경계이며 별도 서비스 분리를 강제하지 않는다.
- 상세 인수 조건은 Phase 문서, 실행 상태와 검증 항목은 작업 인덱스가 소유한다.
- 문서 간 제목 불일치, 잘못된 spec 참조, 복수 진행 task를 검출한다.

### P0-T07. 완전 삭제 권한 정책 정합화

- 근무자는 일반 탈퇴만 직접 실행하고 즉시 완전 삭제는 앱 밖에서 관리자에게 요청한다.
- 관리자만 대상 근무자의 복구 정보를 즉시 파기하고 과거 기록을 익명화할 수 있다.
- 완전 삭제 전에 복구 불가 결과를 안내하고 대상자 이름을 다시 입력하게 한다.
- PRD, Domain, ADR-0007, P7 task의 계정 생명주기 표현을 같은 정책으로 맞춘다.

인수 조건:

- 일반 탈퇴와 관리자 완전 삭제의 행위자·결과·복구 가능 여부가 모든 기준 문서에서 일치한다.
- 일반 근무자와 권한 없는 관리자의 완전 삭제 command가 차단되도록 P7 검증 범위에 포함된다.
- 완전 삭제의 관리자, 대상, 시각이 감사 기록에 남는다고 명시한다.

### P0-T08. 제품 디자인 시스템 명세

- 인터뷰에서 합의한 시각 기반, 공통 패턴, 컴포넌트, 근무자 흐름, 관리자 흐름을 공식 문서로 만든다.
- `docs/product/DESIGN.md`를 공식 진입점으로 두고 세부 명세를 `docs/product/design/`의 5개 문서로 분리한다.
- 기존 브랜드 색상을 유지하면서 제품 의미 토큰, Pretendard 단일 글꼴, 모션, 접근성 기준을 정의한다. (글꼴은 2026-08-04 사용자 결정으로 `Wanted Sans Variable`로 교체됐다. 현행 정본은 [Foundations](../../product/design/FOUNDATIONS.md)다.)
- PRD와 Domain의 권한·출퇴근·배정·예상 급여·리허설 규칙을 화면 흐름에서 보존한다.
- PWA 구현 task가 디자인 문서를 선행 기준으로 사용하도록 의존성과 문서 지도를 갱신한다.

인수 조건:

- Coinbase 마케팅 문맥이나 라이선스 전용 자산 없이 라비에벨 제품 디자인 원칙만 남는다.
- `FOUNDATIONS`, `PATTERNS`, `COMPONENTS`, `WORKER-FLOWS`, `ADMIN-FLOWS`의 책임이 겹치지 않고 `DESIGN.md`에서 모두 연결된다.
- 기존 원시 색상과 추가 의미 토큰, 반응형·모션·접근성·오프라인·권한 패턴이 명시된다.
- 근무 신청, 출퇴근, 예상 급여·리허설, 관리자 배정·확정, 팀원 관리, 완전 삭제 흐름을 구현 가능한 수준으로 정의한다.
- README, 문서 지도, Architecture와 Phase index가 디자인 문서를 현재 구현 기준으로 가리킨다.

### P0-T13. Codex AI Readiness 평가와 실행 대시보드

- Codex가 저장소를 안전하고 재현 가능하게 변경할 수 있는 준비도를 `ai-readiness.v1` 루브릭으로 평가한다.
- 지침·컨텍스트, task 결정성, 검증·CI, 아키텍처·ADR, 변경 격리, 환경 재현성, 권한 경계를 점수화한다.
- 파일·명령·검증 결과를 근거로 점수와 ROI순 개선 제안을 생성한다.
- 승인되지 않은 개선안을 `index.jsonl`에 자동 추가하지 않는다.
- 실행 상태와 AI Readiness를 함께 보여주는 로컬 정적 HTML 대시보드를 JSON 원본에서 생성한다.

인수 조건:

- baseline과 phase gate 시점에 같은 rubric 버전으로 점수 추세를 계산한다.
- 점수의 각 항목에 파일 또는 실행 증거가 연결된다.
- `영향도 × 확신도 ÷ 작업 비용`으로 ROI를 계산하고 제안 순서를 재현한다.
- 대시보드가 실제 JSON이 없을 때 샘플 점수를 표시하지 않고 누락 상태를 표시한다.
- readiness 결과는 advisory이며 phase 진행이나 배포를 직접 허용하지 않는다.

### P0-T14. task 실행 검증 계약 완성

- 모든 `planned`, `in_progress`, `blocked`, `verification_pending` task에 `test_mode`와 하나 이상의 `check_ids`를 명시한다.
- 문서만 변경하는 task는 `docs_only`, 기능 동작을 추가하는 task는 `tdd`, 기반 설정·검증·운영 task는 `verification`을 사용한다.
- 아직 구현되지 않은 check는 task 구현 중 `.agents/harness/checks.json`에 실제 명령으로 등록하고 검증 증거를 생성한다.
- runner는 실행 계약이 없거나 비어 있는 task를 선택·실행하지 않고 이해 가능한 오류를 반환한다.

인수 조건:

- 작업 인덱스의 미완료 task가 모두 명시적인 실행 검증 계약을 가진다.
- 인덱스 validator가 누락되거나 빈 `test_mode`·`check_ids`를 검출한다.
- 명시적으로 선택한 task와 자동 선택된 task 모두 runner 경계에서 계약 누락을 거부한다.
- 하네스 self-test와 기존 완료 task 검증이 회귀 없이 통과한다.

### P0-T15. 격리 worktree 실행 수명주기 회귀 수정

- runner는 통합 worktree가 깨끗한지 확인하고 task별 브랜치와 임시 worktree를 생성하거나 중단 상태에서 복구한다.
- task worktree에서만 `in_progress` 전환과 `codex exec`를 수행하고 통합 worktree에는 성공 또는 blocked 상태 커밋만 반영한다.
- 설정의 `max_attempts=3`을 실제 실행 횟수에 적용하며 각 시도의 종료 코드와 요약을 Git 공통 상태에 기록한다.
- 성공 시 관련 spec이 포함된 verification, task `done`, task ID 커밋, 단일 task 커밋을 검사한 뒤 cherry-pick한다.
- 3회 실패 시 실패한 변경은 임시 worktree에 보존하고 상태·시도 기록·수동 확인 요약만 별도 blocked 커밋으로 통합한다.

인수 조건:

- 실제 임시 Git 저장소 검증에서 통합 worktree는 task 실행 중 오염되지 않는다.
- 성공 경로는 정확히 하나의 task 커밋만 통합하고 검증 증거의 `spec_refs`를 확인한다.
- 실패 경로는 세 번만 실행하고 실패 변경을 통합하지 않은 채 task를 `blocked`로 표시한다.
- 재실행은 기록된 worktree와 시도 횟수에서 복구하고 네 번째 실행을 시작하지 않는다.
- pre-commit hook은 blocked 상태에서 index와 실행 요약만 포함한 상태 커밋만 허용한다.
- AI Readiness의 worktree·재시도 점수는 파일 존재가 아니라 runner 구현과 등록된 수명주기 검사를 근거로 계산한다.

### P0-T16. runner 회귀 수정 후 readiness 기준선 갱신

- `P0-T15` 통합 커밋을 평가 대상으로 `ai-readiness.v1` 보고서를 다시 생성한다.
- worktree runner와 시도 제한 항목이 실제 구현·등록 검사 근거로 통과하는지 확인한다.
- ROI 제안은 승인 대기로만 표시하고 작업 인덱스에 자동 추가하지 않는다.
- 갱신된 보고서와 최신 task 상태로 정적 dashboard를 다시 생성한다.

인수 조건:

- 보고서의 `evaluated_commit`이 `P0-T15` 통합 커밋을 가리킨다.
- readiness 보고서에서 worktree runner와 attempt limit 근거가 모두 true다.
- dashboard가 `P0-T15`, `P0-T16`을 done으로 표시하고 현재 task를 비운다.
- 정적 smoke와 실제 모바일 Chromium 렌더링에 오류가 없다.

### P0-T17. blocked 상태 커밋의 staged 변경 격리

- 최대 시도 실패 후 task worktree에 남은 staged 구현 파일을 working tree 내용 손실 없이 unstage한다.
- index, attempts evidence, manual summary만 다시 stage하고 blocked 상태 커밋 hook을 통과한다.
- 실패 구현 파일은 task worktree에 그대로 보존하고 통합 worktree에는 포함하지 않는다.

인수 조건:

- 실제 Git fixture가 실패 구현 파일을 미리 stage한 상태에서도 blocked 상태를 통합한다.
- 통합 커밋에는 index와 두 실행 요약 파일만 포함된다.
- 실패 구현 파일의 내용은 task worktree에 남고 통합 worktree에는 존재하지 않는다.
- blocked commit policy가 production 경로의 직접 stage를 계속 거부한다.

### P0-T18. 하네스 전체 기능 수용 테스트

- TDD guard가 assertion RED, 동일 명령 GREEN, tree 상태, 종료 코드와 `spec_refs` 증거를 구조적으로 재검증한다.
- index 계약 누락 거부, runner 성공·중단 복구·3회 실패·blocked 격리, commit hook을 전체 회귀 실행한다.
- 두 저장소 로컬 Skill을 공식 validator로 검사한다.
- AI Readiness 점수·ROI 제안과 최신 task 상태 dashboard를 정적 검사와 모바일 브라우저로 검증한다.

인수 조건:

- TDD 증거가 없거나 변조됐거나 RED/GREEN 명령이 다르면 guard가 실패한다.
- runner의 성공·blocked fixture와 네 번째 시도 거부가 모두 통과한다.
- 모든 미완료 task가 실행 계약을 가지며 명시·자동 선택 모두 누락 계약을 거부한다.
- Skill validator, readiness capability, dashboard smoke가 통과한다.
- 모바일 Chromium에서 dashboard task 상태와 점수가 렌더링되고 console/page 오류가 없다.
- 제품 MVP 기능은 아직 구현되지 않았음을 결과에 명확히 구분한다.

### P0-T19. 원격 main 하네스 통합 검증

- 최신 원격 제품·디자인 문서와 하네스 구현 이력을 일반 merge로 통합한다.
- 원격 task ID를 보존하고 하네스 task와 실행 증거를 충돌 없는 ID로 이동한다.
- index 계약, runner 수명주기, TDD guard, Git hook, Skill, readiness와 dashboard를 병합 결과에서 다시 검증한다.
- 실제 모바일 Chromium에서 dashboard의 점수와 task 상태, console/page 오류를 확인한다.

인수 조건:

- 원격 P0-T07·P0-T08과 하네스 P0-T13~P0-T18이 중복 ID 없이 모두 보존된다.
- 모든 미완료 task가 명시적 test mode와 하나 이상의 등록된 check를 가진다.
- 하네스 전체 회귀, 두 Skill validator, commit hook과 모바일 dashboard 검증이 통과한다.
- merge 결과가 최신 origin/main과 하네스 통합 commit을 모두 조상으로 가진다.
- 제품 MVP 기능은 아직 구현되지 않았음을 결과에 명확히 구분한다.

### P0-T20. main 통합 후 readiness 기준선 갱신

- P0-T19 merge commit을 평가 대상으로 `ai-readiness.v1` 지표를 다시 생성한다.
- ROI 개선 제안은 승인 대기로 유지하고 작업 인덱스에 자동 추가하지 않는다.
- 최신 점수와 P0-T20 완료 상태로 정적 dashboard를 다시 생성한다.

인수 조건:

- 보고서의 `evaluated_commit`이 P0-T19 merge commit을 가리킨다.
- readiness rubric과 dashboard data·smoke 검사가 통과한다.
- 모바일 Chromium에서 최신 점수, 현재 task 없음, P0-T20 `done`이 표시된다.
- console error와 page error가 없다.

### P0-T21. FSD·RADIO 개발 규칙과 가드 스킬

- FSD 레이어, server-first 경계, entity·feature 책임, Zod 계약, Result 오류 규칙과 TanStack Query hydration 전략을 개발 기준 문서와 ADR로 확정한다.
- 프로젝트 전용 harness skill이 task 시작부터 RADIO 기록, 검증 모드 선택, 민감 변경의 구현 후 사용자 확인, commit까지 안내하게 한다.
- harness가 RADIO 문서 구조, server-only 경계와 기본 FSD 구조를 검사하고 task check로 실행한다.
- 포맷·lint 도입은 후속 P0-T02에서 실제 앱 기반과 함께 구현하되, 이 task는 필요한 정책과 검증 인터페이스만 정의한다.

인수 조건:

- 개발 문서와 ADR이 FSD, server-first, 데이터 모델, 인터페이스, TanStack Query, TDD/RADIO 및 사용자 확인 규칙을 충돌 없이 설명한다.
- repository-local skill이 공식 validator를 통과하고 existing harness 명령·증거 경로를 사용한다.
- RADIO validator가 문서 누락 또는 필수 섹션 누락을 실패로 보고하며 self-test가 통과한다.
- task index와 harness check가 새 skill·validator를 실행 계약으로 추적한다.

### P0-T22. 하네스 한국어 문구와 디자인 대시보드

- Codex 훅의 상태·차단·안내 문구와 하네스가 사용자에게 출력하는 검증 결과를 한국어로 제공한다. 내부 이벤트 ID와 파일 경로는 실행 호환성을 위해 유지한다.
- 정적 실행 대시보드에 디자인 시스템의 색상, 타이포그래피, 간격, 상태 표현과 접근성 있는 표 구조를 적용한다.
- 점수·상태·제안의 화면 라벨은 한국어로 표시하되, 평가 JSON 원본의 안정적인 ID와 값은 변경하지 않는다.
- Phase 작업은 phase별 완료 수와 현재 작업을 먼저 보여주고, 상세 목록은 사용자가 필요할 때만 펼쳐 본다.
- ROI는 영향, 확신, 비용의 산정값과 계산식을 시각적으로 보여줘 우선순위 근거를 설명한다.

인수 조건:

- Codex 훅의 상태 메시지, 작업 안내, 차단 사유가 한국어로 표시된다.
- 대시보드가 브랜드 블루, 의미 상태색, 4px 간격, 모바일 우선 레이아웃과 표의 반응형 구조를 사용한다.
- 대시보드에 샘플 데이터가 없고, 현재 task·점수·상태·제안이 한국어 레이블로 표시된다.
- 긴 작업 목록은 기본적으로 압축되어 있으며, Phase를 펼치면 해당 작업만 확인할 수 있다.
- 각 개선안은 ROI와 영향·확신·비용 점수 및 계산 근거를 함께 보여준다.
- 한국어 문구와 대시보드 계약을 자동 검사하고 관련 검증 증거를 남긴다.

### P0-T23. 가치 기반 TDD RED·GREEN Codex gate

- `test_mode=tdd`이며 로직·도메인·API·DB·RLS·보안처럼 테스트 가치가 있는 작업에만 Codex hook gate를 적용한다.
- 테스트 파일 작성과 RED 실행은 허용하되, RED 증거가 없으면 production 로직 변경을 Codex `PreToolUse` hook에서 차단한다.
- 동일 명령의 GREEN 증거와 `tdd-guard check`가 없으면 task 완료·commit을 차단한다.
- 문서, 포맷, 스타일, 대시보드 같은 `verification`·`docs_only` 작업에는 gate를 적용하지 않는다.

인수 조건:

- TDD task에서 테스트 변경은 RED 증거 전에도 가능하고, production 변경은 RED 증거 전 차단된다.
- RED 뒤 GREEN 전에는 완료·commit이 차단되고, GREEN과 guard check 뒤에는 허용된다.
- non-TDD task에는 편집·commit gate가 추가로 적용되지 않는다.
- hook의 판단과 거부·허용 경로를 self-test로 검증하고 task 증거에 남긴다.

### P0-T24. 위험 명령 Codex 차단 훅

- Codex `PreToolUse`에서 복구 어려운 Git 이력 삭제·강제 원격 반영, 광범위 파일 삭제·덮어쓰기, 권한 상승 또는 시스템 영역 변경 명령을 실행 전에 거부한다.
- 검사 대상은 명령 문자열의 우회 구문(환경 변수 접두사, 경로 변형, 셸 제어 연산자)을 정규화한 뒤 판정한다.
- 일반적인 범위의 파일 편집, 테스트, 상태 조회, 일반 커밋은 막지 않는다.
- 차단 사유는 명령을 재노출하지 않고, 안전한 대안 또는 사용자 명시 승인 필요성을 한국어로 안내한다.

인수 조건:

- `git reset --hard`, 강제 push, broad `rm -rf`, 재귀 권한 변경, `sudo` 및 시스템 경로 대상 쓰기 명령이 PreToolUse에서 거부된다.
- 테스트·조회·일반 `git commit`처럼 비파괴 명령은 기존 TDD·commit guard 외에는 허용된다.
- 파이프, `;`, `&&`, `||`, 환경 변수 접두사 같은 우회 형태도 동일하게 거부된다.
- 정상·차단 경로의 self-test, TDD evidence, task 검증 증거를 남긴다.

### P0-T25. 하네스 오류 문구 한국어화

- 하네스 실행 스크립트와 내부 라이브러리가 사용자에게 반환하는 오류·사용법·검증 실패 문구를 한국어로 통일한다.
- task ID, 상태값, check ID, 파일 경로, Git 명령과 JSON의 안정적인 기계 판독 필드는 호환성을 위해 유지한다.
- 한국어 문구 회귀 검사는 오류 경로를 포함해 검사한다.

인수 조건:

- 하네스 스크립트를 잘못 사용하거나 검증이 실패했을 때 원인과 다음 조치를 한국어로 확인할 수 있다.
- runner·TDD guard·index·worktree·commit 정책의 오류 문구가 한국어로 제공된다.
- 상태값과 증거 JSON의 기계 판독 계약은 변경하지 않는다.

### P0-T26. 투트랙 딥인터뷰·자율 개발 운영 계약

- 프로젝트 매니징, 제품 범위, 도메인 및 기술 설계는 사용자 딥인터뷰 트랙에서 결정하고 AI는 질문, 선택지, 트레이드오프와 합의 요약을 제공한다.
- 기존 미구현 제품 task와 설계 문서는 삭제하지 않고 인터뷰에서 검토할 제안으로 되돌린다.
- 제안 task는 사용자 승인 전 실행할 수 없고, 승인된 task도 명시적인 task ID 없이는 개발 루프가 선택하거나 실행하지 않는다.
- 개발 트랙은 승인된 단일 task에 RADIO, TDD·검증, 격리 worktree, 기술적 자동 재시도와 commit 가드를 깊게 적용한다.
- 딥인터뷰와 자율 개발을 각각 repository-local skill로 제공하고 승인 task를 두 스킬 사이의 인계 계약으로 사용한다.
- 작업 완료 후 결과를 사용자에게 보여주고 다음 제품·설계 결정은 다시 인터뷰 단계에서 시작한다.

인수 조건:

- 운영 문서가 `딥인터뷰 → 합의 → task 승인·인계 → 자율 개발 루프 → 결과 검토` 경계를 일관되게 설명한다.
- `proposed` task는 실행할 수 없고 `planned`·`in_progress` task는 사용자 승인 기록을 가진다.
- 하네스는 자동으로 다음 task를 선택하지 않으며 `--task <ID>`가 없으면 구현을 시작하지 않는다.
- 세션 안내와 두 repository-local skill이 설계와 개발 트랙의 시작·중단 조건을 구분한다.
- 기존 미구현 제품 task는 `proposed`로 보존되고 승인된 P0-T26만 `in_progress`다.
- 승인 흐름 자체 검사, 하네스 회귀, 인덱스 및 Skill 검사가 통과한다.

### P0-T27. Repository-local 스킬 한국어 언어 가드

- 검사 범위는 이 프로젝트의 `.agents/skills/**`로 한정한다. Codex 시스템 스킬과 외부 플러그인 스킬은 수정하거나 검사하지 않는다.
- 새·수정 스킬의 `SKILL.md` 본문과 `agents/openai.yaml`의 `display_name`, `short_description`, `default_prompt`는 사용자에게 한국어 안내를 제공해야 한다.
- `name`, 디렉터리·파일명, `$skill-name` 참조, 코드와 실행 명령은 스킬 발견·도구 호환을 위해 기존 영문 형식을 유지한다.
- 기존 `skill-validators` 검증에 언어 검사를 통합하고, 전용 self-test가 정상 한국어 스킬과 누락·영문 전용 fixture를 각각 통과·실패로 판정한다.

인수 조건:

- `.agents/skills/**/SKILL.md`의 본문에 한국어가 없으면 검증이 실패하고 대상 경로와 해결 방법을 한국어로 알린다.
- `agents/openai.yaml`의 세 사용자 노출 필드 중 하나라도 한국어가 없거나 없으면 검증이 실패한다.
- 영문 식별자·명령어·코드 예시는 허용하며, 이들이 한국어 검사의 실패 원인이 되지 않는다.
- 프로젝트 밖 시스템·플러그인 스킬은 탐색·검사 대상이 아니다.
- 언어 가드 자체 검사, 기존 스킬 검사와 작업 인덱스 검증이 모두 통과한다.

### P0-T28. 기획·개발 인터뷰 분리와 RADIO 설계 인계

- 기존 통합 딥인터뷰 스킬을 기획 인터뷰와 RADIO 개발 인터뷰 스킬로 대체한다.
- 공통 `DEV-*` 컨벤션, task별 영구 RADIO와 기획·개발 이중 승인 계약을 스킬·하네스·인덱스·대시보드에 반영한다.
- `design_pending` task는 실행할 수 없고 `planned` 전환에는 `product_approval`, `development_approval`, `radio_ref`, `test_mode`, `check_ids`가 모두 필요하다.
- 작업 인덱스를 schema v3로 원자적으로 전환하고 과거 종료 작업의 `legacy-v2`와 현재·신규 작업의 `dual-approval-v3` 계약을 명시한다.
- 개발 승인은 RADIO revision과 정확한 전체 파일 SHA-256에 결속하며 공통 계약 모듈이 모든 하네스 소비자의 실행 가능성 판정을 소유한다.
- 개발 하네스는 승인된 `docs/execution/radio/<task-id>-radio.md`를 읽고 run RADIO에는 적용 결과와 차이만 기록한다.
- 기존 `P1-T06`, `P7-T01`의 제품 승인 기록을 보존하고 개발 인터뷰 대기로 전환한다.
- 새 두 스킬과 하네스 검증이 통과한 뒤에만 기존 통합 스킬을 제거한다.

인수 조건:

- 기획 인터뷰와 개발 인터뷰 스킬이 질문 하나, 선택지, 추천 답변, 명시적 승인과 각자의 문서 인계 범위를 구분한다.
- 개발 인터뷰가 공통 규칙을 반복하지 않고 `DEV-*` 적용 상태와 task별 RADIO 차이를 기록한다.
- 인덱스와 runner가 `design_pending`과 두 승인 계약을 검증하고 승인되지 않은 task 실행을 거부한다.
- 승인 누락, 안전하지 않은 RADIO 경로·파일과 해시 불일치를 구조화된 사유로 모두 보고하고 fail-closed 처리한다.
- 실행 중 새 결정은 `blocked`와 결정 신호로 안전 중단하고 선택적 승인 무효화와 격리 작업물 보존 계약을 따른다.
- `dual-approval-v3`의 `skipped`는 사용자, 날짜와 이유가 있는 `skip_approval`을 요구한다.
- RADIO 정본과 실행 증거 경로가 구분되며 구현 중 새 제품 결정은 기획 인터뷰, 새 기술 결정은 개발 인터뷰로 반환된다.
- dashboard, hooks, validators, self-test와 기존 하네스 회귀 검사가 새 상태·경로·스킬 이름을 일관되게 반영한다.
- repository-local 두 새 스킬이 공식 validator와 한국어 언어 가드를 통과한다.

### P0-T29. 운영 의사결정 대시보드

- 현재 상태: `done` (2026-08-04, 커밋 fd124d2). 2026-08-03 기획 인터뷰로 제품 범위를 확장하고 제품 승인을 갱신했으며(이전 승인 user, 2026-07-24는 이력 보존), 교차 검증(main·opus 2자, 종합 91)을 거쳐 종결했다. 근거 결정 [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md)는 이 task에서 새 범위로 개정되어 보류가 해제됐다(Accepted, revision 2).
- 대시보드는 프로젝트 운영의 읽기 전용 판단 진입점이다. 명령으로 생성하는 정적 HTML을 `docs/execution/dashboard/`에 커밋하고, task 최종 상태(`done`·`blocked`·`skipped`)와 phase 경계 변화 뒤에 재생성한다.
- 섹션 4종을 표시한다.
  - 진행 상황·진행도: 전체·phase별 task 완료율, 상태별 집계, 현재 `in_progress`와 다음 후보.
  - 준비도 루브릭(기계 판정 100점): 계약 준수 40(저장소 게이트 4종 index·radio·handoff·tdd 통과율, 커밋 문맥 게이트 scope·commit-msg는 참고 표시), 증거 완결성 25(재편 이후 완료 task의 handoff·tdd 증거 보유율, `legacy-v2` 제외), 실행 준비도 20(실행 가능한 `planned` 존재 10 + `blocked` 0건 10), 문서 신선도 15(재생성 준수 7 + 보류 ADR 0건 4 + 미결 부채 0건 4 — 재생성 준수는 커밋된 기존 산출물의 `base-commit` marker로 실측, 교차 검증 F-01·F-02 반영). 등급 경계는 90 이상 우수, 70~89 양호, 70 미만 주의.
  - 검증 섹션: P0-T32 교차 검증 결과(영역별 점수, 중요도별 확정 발견, backlog)를 표시하고 결과가 없으면 "결과 없음"을 표시한다.
  - 다음 행동·차단: 단일 다음 행동, 추천 근거, 직접 선행 조건, 차단 사유, 대안 후보. 추천은 상태·승인·의존성의 실행 경로를 따른다.
- 상단에 기준 시각·기준 커밋을 표시하고 원본 누락·오래됨은 값을 추정하지 않고 명시한다.

인수 조건:

- 대시보드만 보고 현재 상태, 진행도, 준비도 점수, 검증 결과, 다음 행동과 직접 차단 조건을 판단할 수 있다.
- 준비도 루브릭 점수가 전부 기계 판정으로 산출되고 근거 수치가 함께 표시된다.
- 검증 결과 파일이 없거나 형식이 깨졌을 때 오류 없이 "결과 없음" 또는 "형식 오류"를 표시한다.
- task 최종 상태 또는 phase 경계가 바뀐 뒤 생성물의 상태·기준 시각·기준 커밋은 원본과 일치한다.
- 대시보드는 읽기 전용 표시물이다. task index나 실행 상태를 변경하지 않고 승인·상태 전환·구현 실행을 수행하지 않는다.
- 모바일 화면에서 핵심 판단 정보가 먼저 읽히고, 상세 의존성은 필요할 때만 펼쳐 볼 수 있다.
- [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md)가 새 범위로 개정되어 보류가 해제된다.

기획 승인: user, 2026-08-03 (범위 확장 갱신).

### P0-T30. 프로젝트 5레이어 구조 재편

- 문서와 실행 상태를 L1 협업, L2 제품·도메인, L3 기술 기준, L4 계획·실행, L5 코드의 5레이어 물리·논리 구조로 재편한다.
- 트랙 A1·A2·B 명칭을 폐기하고 운영 계약을 기획 → 설계 → 개발 → 검증 → 리팩토링 5단계 파이프라인으로 다시 쓴다. 승인 게이트와 `dual-approval-v3` 의미론은 그대로 보존한다.
- 인터뷰와 하네스 실행이 공유하는 handoff 포맷을 정의하고 기록 위치를 고정한다.
- 재편 근거를 [ADR-0013](../../standards/adr/0013-project-layer-structure.md)으로 남기고, [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md)를 보류로 표시한다.
- P0-T29는 제품 승인을 보존한 채 `design_pending`으로 반환하고 개발 승인과 `radio_ref`를 무효화한다.
- 새 하네스 코드 구현은 이 task의 범위가 아니며 P0-T31로 넘긴다.
- 실행 중 사용자 승인(user, 2026-08-03)으로 범위가 확장되어 연속 루프 엔지니어링 규칙 문서화, 루트 `AGENTS.md` 삭제와 고유 규범 이관, 제거된 하네스의 codex 잔재 정리를 포함한다.
- 연속 루프 엔지니어링 규칙을 문서화한다. task 하나 완료 후 정지하던 기존 규칙을 폐기하고 `planned` 큐가 빌 때까지 의존성 순서로 연속 실행하며, 사용자 통제 지점을 매 task 실행 지시가 아니라 기획·설계 두 승인 게이트로 옮긴다. `docs/workflow/WORKFLOW.md`, [ADR-0013](../../standards/adr/0013-project-layer-structure.md), `CLAUDE.md`에 반영한다.
- 루트 `AGENTS.md`를 삭제한다. 고유 규범(작업 인덱스 규칙, 구현 원칙)만 `docs/workflow/WORKFLOW.md`와 `CLAUDE.md`로 이관하고, 나머지는 기존 문서와 중복이므로 버린다.
- 제거된 하네스의 codex 연동 잔재를 현행 규범 문서에서 정리한다. 완료 task 이력과 Accepted ADR 본문의 codex 언급은 역사 기록으로 보존한다.

인수 조건:

- `docs/workflow/`, `docs/product/`, `docs/standards/`, `docs/execution/`의 4개 물리 디렉터리가 5레이어 정의와 일치한다.
- 저장소의 모든 문서 상호 링크와 경로 참조가 새 구조를 가리키며, 남은 옛 경로 참조는 사유가 기록된 역사 기록뿐이다.
- `index.jsonl`의 모든 줄이 유효한 JSON이고 `doc`·`radio_ref`가 새 경로 패턴을 만족한다.
- 운영 계약 문서만 읽고 5단계와 두 승인 게이트, handoff 기록 시점을 판단할 수 있다.
- 이 재편 자체의 handoff가 새 포맷으로 `docs/execution/runs/P0-T30/handoff.md`에 남는다.
- 연속 루프 규칙이 `docs/workflow/WORKFLOW.md`, ADR-0013, `CLAUDE.md`에서 "`planned` 큐 소진까지 연속 실행하고 `blocked`는 건너뛰기 신호"로 일관되게 설명된다.
- `AGENTS.md`가 삭제되고 고유 규범이 `docs/workflow/WORKFLOW.md`·`CLAUDE.md`로 이관되며, 현행 규범 문서에 `AGENTS.md` 참조가 남지 않는다.
- 현행 규범 문서에 codex 잔재가 남지 않고, 완료 task 이력과 Accepted ADR 본문의 codex 언급만 역사 기록으로 보존된다.
- 위 세 확장 범위는 user, 2026-08-03 승인으로 유효하다.

### P0-T31. 5단계 하네스 구현(설계→개발→검증→리팩토링 + handoff)

- 경량 게이트형 하네스를 만든다. 연속 루프 진행과 handoff 작성은 AI 세션이 [WORKFLOW](../../workflow/WORKFLOW.md) 규칙대로 수행하고, 하네스는 계약 위반을 검증·차단하는 게이트만 담당한다.
- 게이트 6종을 구현한다.
  - index 게이트: `index.jsonl` 전 줄 스키마와 상태 규칙(단일 `in_progress`, 승인 없는 `planned` 금지, 의존성 실재, `spec_refs` 최소 1개)을 검사한다.
  - RADIO 해시 게이트: `planned` 이상 task의 `radio_sha256`과 실제 RADIO 파일 해시의 일치를 검사한다.
  - handoff 게이트: 단계 전환 시 [handoff 계약](../../workflow/HANDOFF.md)의 필수 필드를 검사한다.
  - commit-msg 훅: 커밋 메시지의 task ID 형식을 검사한다.
  - TDD 증거 게이트: `test_mode`가 `tdd`인 task의 RED→GREEN 기록을 검사한다.
  - 커밋 범위 게이트: 커밋 파일이 task RADIO에 선언된 변경 허용 경로 안인지 검사한다.
- 게이트는 커밋 시(git hook)와 단계 전환 시(명령 실행) 발동한다.
- RADIO 포맷에 기계 판독 가능한 변경 허용 경로 섹션을 추가한다. 형식은 설계 단계에서 확정한다.
- 하네스 코드·검사·산출물의 위치, commit hook 연결과 `package.json` 실행 명령을 이 task의 설계 단계에서 확정한다.
- 보류 중인 [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md)와 P0-T29 대시보드 재설계는 이 task 완료 이후에 다시 다룬다.

비목표:

- 대시보드 재생성(P0-T29의 범위), readiness 리포트, 스킬 검증기, 풀 러너 오케스트레이션.

인수 조건:

- 게이트 6종 각각에 위반 입력 차단과 정상 입력 통과를 확인하는 셀프테스트가 있고 단일 명령으로 실행된다.
- 깨진 `.githooks`가 새 훅으로 교체되어 `--no-verify` 없이 정상 커밋이 된다.
- 현재 저장소 상태가 게이트 전체를 통과한다.
- 실행 명령이 `CLAUDE.md`에 문서화된다.

기획 승인: user, 2026-08-03.

### P0-T32. 교차 검증 에이전트 시스템

- 검증 단계에서 메인 에이전트, Codex 플러그인 리뷰(`/codex:review`, 필요 시 `/codex:adversarial-review`), Claude Opus 서브에이전트가 각자 독립 리뷰한 뒤 서로의 발견을 확인·반박하는 3자 교차 검증 프로세스를 정의한다.
- 평가 영역은 코드 품질, 테스트, 보안, 성능, 아키텍처 정합(FSD·`DEV-*` 준수) 5개이며 영역별 100점과 종합 점수를 산출한다.
- 2/3 이상이 인정한 발견만 확정하고 메인 에이전트가 중요도를 분류한다.
  - `critical`(보안 취약·데이터 손실·불변 규칙 위반 가능): 즉시 사용자 보고 + 해당 task `blocked`.
  - `high`(실제 동작 오류 가능성·핵심 품질 결함): 즉시 사용자 보고, 루프는 계속.
  - `medium`·`low`: backlog 누적, 대시보드 표시.
- 확정 발견과 점수는 `docs/execution/reviews/`의 task별 결과 파일과 backlog에 기록한다. 형식은 기계 판독 가능해야 하며 대시보드(P0-T29)가 읽는다.
- 개선 사항의 task 승격은 사용자 승인 시에만 한다.
- 실행 시점: 각 task의 검증 단계(해당 변경분 대상)와 수동 전체 스캔.

인수 조건:

- 검증 프로세스(참여자, 절차, 확정 규칙, 중요도 정의와 에스컬레이션)가 workflow 문서로 정의된다.
- 결과 파일과 backlog 형식이 고정되고 예시 fixture가 존재한다.
- 운영 계약의 검증 단계가 이 프로세스를 참조한다.
- `critical`·`high` 발견의 사용자 보고 규칙이 연속 루프 규칙과 모순 없이 연결된다.

기획 승인: user, 2026-08-03.

### P0-T34. 디자인 시스템 코드 구현

- 승인된 [디자인 시스템 명세](../../product/DESIGN.md)를 코드로 옮긴다. 새로 디자인하지 않고 [Foundations](../../product/design/FOUNDATIONS.md)·[Components](../../product/design/COMPONENTS.md)가 정한 값을 그대로 구현한다. 명세와 구현이 어긋나면 명세가 이긴다.
- 토큰: 원시 팔레트와 제품 의미 토큰(`action`·`success`·`warning`·`danger`·`neutral`·`disabled`), 타이포 8종, 간격·radius·elevation을 Tailwind 설정과 CSS 변수로 정의한다. 화면 코드는 원시 색을 직접 참조하지 않고 의미 토큰만 쓴다.
- 폰트: `Wanted Sans Variable`을 앱에서 직접 호스팅해 로드하고, 실패 시 명세의 대체 체인을 따른다. 외부 CDN을 런타임에 의존하지 않는다.
- 공용 컴포넌트 10종을 `src/shared/ui`에 구현한다: Button, Input과 선택 필드, Bottom sheet, Dialog, Snackbar, Badge와 chip, Calendar, Schedule row, Notification row, Connectivity banner. shadcn/ui를 기반으로 쓰되 명세와 다르면 명세에 맞춘다.
- 개발 전용 카탈로그 화면에서 컴포넌트와 상태를 눈으로 확인한다. 프로덕션 번들에는 포함하지 않는다.

비목표:

- 관리자 전용 컴포넌트 3종(Assignment roster, Staffing summary, Worker picker) — 관리자 화면 퍼블리싱 라운드에서 다룬다.
- 화면 조립, 데이터 연결, 서버 호출, 다크 모드(MVP는 라이트 모드만).

인수 조건:

- 의미 토큰이 코드의 단일 출처이고, 컴포넌트가 원시 색·크기를 중복 선언하지 않는다.
- 컴포넌트 10종이 명세가 정의한 상태(기본·pressed·disabled·로딩·오류 등 각 컴포넌트에 해당하는 것)를 표현한다.
- 카탈로그 화면 하나에서 10종과 각 상태를 모두 확인할 수 있다.
- 색상만으로 상태를 전달하지 않고, 터치 타깃과 reduced motion 규칙이 명세대로 적용된다.
- 컴포넌트 렌더·상태·접근성 속성에 단위 테스트가 있다.

기획 승인: user, 2026-08-04.

### P0-T35. 근무자 핵심 화면 퍼블리싱

- [Worker flows](../../product/design/WORKER-FLOWS.md)의 근무자 핵심 화면을 목 데이터로 정적 구현한다. 서버 연동은 하지 않는다.
- 먼저 [Domain](../../product/DOMAIN.md)의 집합과 DTO를 `src/entities/*/model`의 타입으로 정의하고, 목 데이터는 그 타입으로만 만든다. 화면은 목 데이터를 프롭으로 받는다. 기능 구현 때 목을 실제 조회로 갈아끼우면 화면은 그대로 남는 것이 목표다.
- 대상 화면 6종:
  - 앱 셸과 홈 — 하단 탭 `홈·일정·알림·전체`, 홈 메인 영역의 우선순위 5종 상태 전부.
  - 일정 — 일요일 시작 월 달력, 여러 날짜 로컬 선택, 하단 변경 개수와 `신청하기`, 저장 후 스낵바와 Undo.
  - 확정 스케줄 상세 — 날짜와 예정 출퇴근, 내 배정, 전체 배정표(기본 펼침, 본인 행 강조), 예식 시간, `근무 변경 요청` 진입점.
  - 출퇴근 — 홈의 단일 행동, GPS 확인 중·성공·실패(권한 꺼짐, 정확도 낮음, 범위 밖) 상태.
  - 예상 급여와 리허설 — 이번 달 합계, 금액 숨김 토글, 날짜별 내역, 리허설 기록 목록과 추가·수정 바텀시트.
  - 알림함 — `오늘·이번 주·이전` 구획, `모두 읽음`, 항목 탭 이동.

비목표:

- 로그인·가입·승인 대기·휴면·근무 변경 요청 제출·전체 메뉴·탈퇴 화면 — 다음 퍼블리싱 라운드로 미룬다.
- 서버 연동, 실제 GPS·QR 인증, 푸시 권한 요청, 관리자 화면.

인수 조건:

- 화면이 서버를 호출하지 않고 목 데이터만 소비하며, 목 데이터의 타입이 `docs/product/DOMAIN.md`의 DTO 정의와 일치한다.
- 6종 화면과 각 화면의 주요 상태(빈 상태·오류·로딩 포함)를 모바일 뷰포트에서 확인할 수 있다.
- 제품 불변 규칙의 표시 요구를 지킨다: 예상 급여에 `예상`과 실제 지급액 차이 안내를 표시하고, 출퇴근 원본 수정·삭제 UI를 만들지 않으며, 배정표에 전화번호·성별·시급·출결을 노출하지 않고, 교육생을 구분해 표시한다.
- 화면 단위 렌더 테스트가 위 표시 요구와 주요 상태 전환을 검증한다.

기획 승인: user, 2026-08-04.

### P0-T33. verify 스킬과 reviewer 에이전트

- 교차 검증 절차를 세션 지식이 아니라 저장소 정의물로 만든다. `verify` 스킬(`.claude/skills/verify/SKILL.md`)이 절차를 소유하고, reviewer 서브 에이전트 정의(`.claude/agents/reviewer.md`)가 리뷰어 역할을 소유한다.
- 구조 변경(2026-08-03 사용자 승인): 리뷰어는 독립 서브 에이전트 2자다 — Claude Opus 서브 에이전트와 Codex CLI 직접 호출(Codex 모델은 지정하지 않는다). **메인 에이전트는 리뷰를 산출하지 않고** 두 리뷰의 병합, 확정(리뷰어 2자 인정), 중요도 판독, 점수 판정과 기록만 담당한다.
- [교차 검증 계약](../../workflow/REVIEW.md)을 새 구조로 개정한다: 리뷰어 표(main은 조정자 역할만), 호출 방식(플러그인 명령 대신 Codex CLI 직접 호출), 독립성 규칙과 확정 기준, 결과 파일 규칙의 정합.
- 파서·fixture 정합: 결과 파일 검증 규칙(참여자·`agreed_by` 최소 인원)을 새 구조에 맞추고, 교차 검증 발견 F-09(`total`=5영역 평균 규칙 미검증)를 파서 검증 추가로 해소한다. `example-review.json`을 개정한다.

인수 조건:

- `verify` 스킬 실행 한 번으로 대상 확정 → 2자 독립 리뷰 → 병합·중요도 판독 → 결과 파일·backlog 기록의 전 절차가 진행된다.
- 메인 에이전트가 독립 리뷰를 산출하지 않는 구조가 스킬 정의와 REVIEW.md에 명시된다.
- Codex CLI를 사용할 수 없을 때 리뷰어 2자를 확보하는 대체 규칙이 REVIEW.md에 정의된다.
- reviews 파서가 `total` 평균 규칙을 검증하고(F-09 해소) 개정된 fixture·테스트가 통과한다.

기획 승인: user, 2026-08-03.

## 종료 조건

- P0의 모든 task가 `done`.
- 새 개발자가 README만 보고 로컬 앱과 DB를 실행할 수 있다.
- CI가 코드와 문서 인덱스의 최소 품질을 강제한다.
- 디자인 시스템 토큰과 공용 컴포넌트가 코드로 존재하고, 근무자 핵심 화면을 목 데이터로 열어볼 수 있다.

## 제외

- 실제 인증과 업무 기능.
- 실제 앱 아이콘·브랜드 자산 제작.
- 문서 명세를 벗어나는 후속 브랜드 리디자인.
