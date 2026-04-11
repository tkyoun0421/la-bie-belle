# CLAUDE.md

## Purpose

이 문서는 이 프로젝트에서 에이전트가 따라야 하는 운영 기준을 정리한다.

역할은 세 가지다.

- 문서 SSOT 라우팅
- 구현 운영 규칙
- skill routing 기준

제품과 기술의 source of truth는 `docs/plans/*`와 `DESIGN.md`다.  
이 문서는 그 문서들을 어떤 순서로 읽고, 어떻게 따를지 정의한다.

## SSOT Map

### Product And Scope

- 범위, 고정 결정, shipping slice: [build-plan.md](./docs/plans/build-plan.md)

### Architecture

- 데이터 모델, 권한, 상태 전이, DB/query 규칙: [architecture-spec.md](./docs/plans/architecture-spec.md)
- 화면 구조, 사용자 흐름, fallback: [screen-spec.md](./docs/plans/screen-spec.md)

### Codebase

- 폴더 계층 책임과 import 방향: [folder-hierarchy.md](./docs/plans/folder-hierarchy.md)
- canonical tree, route-to-screen 매핑: [codebase-architecture.md](./docs/plans/codebase-architecture.md)
- naming, import, 테스트, private folder 규칙: [fsd-profile.md](./docs/plans/fsd-profile.md)
- refactor entry 기준, SOLID 적용, over-engineering guardrail: [refactoring-guide.md](./docs/plans/refactoring-guide.md)

### Stack

- 프레임워크, 라이브러리, 버전 기준: [stack-spec.md](./docs/plans/stack-spec.md)

### Execution

- phase, slice, TDD, checkpoint 운영: [execution-plan.md](./docs/plans/execution-plan.md)

### Design

- 시각 시스템의 최상위 SSOT: [DESIGN.md](./DESIGN.md)
- 화면 IA와 참고 흐름: [pwa.md](./docs/designs/pwa.md)

## Priority Rule

문서가 충돌하면 아래 순서를 따른다.

1. 현재 사용자가 직접 준 지시
2. 이 파일의 운영 규칙
3. 더 구체적인 SSOT 문서
4. 더 일반적인 계획 문서

구체적 충돌 해석:

- 범위 충돌: `build-plan` 우선
- 데이터/권한/상태 충돌: `architecture-spec` 우선
- 화면 책임/흐름 충돌: `screen-spec` 우선
- 라이브러리 선택 충돌: `stack-spec` 우선
- 폴더 구조/import/naming 충돌: `folder-hierarchy`, `codebase-architecture`, `fsd-profile` 우선
- 구현 순서와 작업 단위 충돌: `execution-plan` 우선
- 시각 표현 충돌: `DESIGN.md` 우선

## Working Rules

### Read Before Coding

- 일반 구현 전에는 [build-plan.md](./docs/plans/build-plan.md), [execution-plan.md](./docs/plans/execution-plan.md), [folder-hierarchy.md](./docs/plans/folder-hierarchy.md)를 먼저 본다
- 구조 정리나 넓은 cleanup 전에는 [refactoring-guide.md](./docs/plans/refactoring-guide.md)를 먼저 본다
- 데이터나 권한을 만지면 [architecture-spec.md](./docs/plans/architecture-spec.md)를 본다
- UI를 만지면 [DESIGN.md](./DESIGN.md)와 [screen-spec.md](./docs/plans/screen-spec.md)를 본다
- 라이브러리를 추가하거나 교체하기 전에는 [stack-spec.md](./docs/plans/stack-spec.md)를 본다
- 새 phase를 시작하기 전에는 먼저 `docs/plans/phases/*` 아래 phase 문서를 만들고 user review를 받는다

### TDD Rule

- 기본 작업 순서는 `test -> implement -> refactor`
- 새 동작은 실패하는 테스트부터 시작한다
- 버그 수정은 재현 테스트부터 시작한다
- 테스트 우선순위는 `unit -> integration -> e2e`
- refactor 기준과 over-engineering guardrail 은 [refactoring-guide.md](./docs/plans/refactoring-guide.md)를 따른다
- slice를 닫을 때는 happy path와 핵심 예외가 자동 테스트로 재현돼야 한다

### Work Unit

- 구현은 `phase -> slice -> task` 순서로 진행한다
- phase는 큰 단계
- slice는 데모 가능한 vertical use case
- task는 slice 내부의 세부 구현이다

### Branch And PR Rule

- 작업 브랜치는 `develop`
- 구현은 기본적으로 `develop`에서 진행한다
- phase가 끝나면 PR은 `develop -> master`
- 하나의 PR은 하나의 phase만 다룬다
- PR 본문에는 반드시 `Closes #...` linked issue가 있어야 한다
- linked issue들은 모두 같은 milestone에 속해야 한다
- PR milestone은 linked issue의 milestone과 같아야 한다
- `master`는 release 기준 브랜치다

### Progress Reporting

- 작업 중에는 현재 phase, 현재 slice, 다음 slice를 짧게 유지한다
- 공통 scaffold만 만들고 끝내는 작업은 지양한다
- slice가 끝나면 최소 happy path가 있어야 한다

### Pause And Resume

- 세션 종료 전이나 큰 중단 전에는 `/checkpoint`를 우선 고려한다
- 복귀 시에는 `/checkpoint resume`로 이어간다
- checkpoint가 여러 개면 `/checkpoint list`, `/checkpoint list --all`을 사용한다

## Code Rules

- 내부 import는 모두 `#/*` 절대 경로를 사용한다
- `./`, `../` 상대 import는 테스트 코드 외 금지한다
- barrel file `index.ts`는 두지 않는다
- route와 UI component에서 DB를 직접 호출하지 않는다
- write는 `mutations` 경계 또는 `route handlers`로만 처리한다
- read data access는 `entities/*/repositories`에서 닫는다
- server state는 TanStack Query와 server hydration을 기준으로 처리한다
- client-only local state는 React built-in state와 domain hook을 우선 사용한다
- 공용 UI primitive는 shadcn/ui 기반으로 유지한다
- 현재 canonical layer order는 `app -> screens -> mutations -> queries -> entities -> shared`

## Design Rule

모든 시각 결정은 [DESIGN.md](./DESIGN.md)를 따른다.

- 폰트, 컬러, 간격, 레이아웃, 모션은 DESIGN 기준을 우선한다
- 명시적 합의 없이 DESIGN에서 벗어나지 않는다
- 시각 QA에서 DESIGN과 어긋나는 코드는 버그로 본다

## Skill Routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:

- Product ideas, "is this worth building", brainstorming -> invoke office-hours
- Bugs, errors, "why is this broken", 500 errors -> invoke investigate
- Ship, deploy, push, create PR -> invoke ship
- QA, test the site, find bugs -> invoke qa
- Code review, check my diff -> invoke review
- Update docs after shipping -> invoke document-release
- Weekly retro -> invoke retro
- Design system, brand -> invoke design-consultation
- Visual audit, design polish -> invoke design-review
- Architecture review -> invoke plan-eng-review
- Save progress, checkpoint, resume -> invoke checkpoint
- Code quality, health check -> invoke health
