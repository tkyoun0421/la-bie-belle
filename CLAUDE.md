# CLAUDE.md

## Purpose

이 문서는 이 프로젝트에서 에이전트가 따라야 하는 운영 기준서다.

역할은 세 가지다.

- 문서 SSOT 라우터
- 구현 운영 규칙
- skill routing 기준

세부 제품/기술 내용의 source of truth는 `docs/plans/*`와 `DESIGN.md`에 둔다.  
이 문서는 그 문서들을 어떤 순서로 읽고, 어떻게 따라야 하는지를 정의한다.

## SSOT Map

### Product And Scope

- 범위, 고정 결정, shipping slice: [build-plan.md](./docs/plans/build-plan.md)

### Architecture

- 데이터 모델, 권한, 상태 전이, DB/query 규칙: [architecture-spec.md](./docs/plans/architecture-spec.md)
- 화면 구조, 핵심 흐름, 실패 시 fallback: [screen-spec.md](./docs/plans/screen-spec.md)

### Codebase

- canonical tree, route-flow 매핑, 의존 규칙: [codebase-architecture.md](./docs/plans/codebase-architecture.md)
- personalized FSD 규칙, import/naming 규칙: [fsd-profile.md](./docs/plans/fsd-profile.md)

### Stack

- 프레임워크, 런타임, 라이브러리 결정과 결정 시점: [stack-spec.md](./docs/plans/stack-spec.md)

### Execution

- phase, slice, 테스트 전략, checkpoint 운영: [execution-plan.md](./docs/plans/execution-plan.md)

### Design

- 시각 시스템의 최상위 SSOT: [DESIGN.md](./DESIGN.md)
- 제품 화면 의도와 참고 흐름: [pwa.md](./docs/designs/pwa.md)

## Priority Rule

문서가 충돌하면 아래 순서를 따른다.

1. 현재 사용자 지시
2. 이 파일의 운영 규칙
3. 가장 구체적인 SSOT 문서
4. 더 일반적인 계획 문서

구체적인 충돌 해석:

- 범위 충돌: `build-plan` 우선
- 데이터/권한/상태 충돌: `architecture-spec` 우선
- 화면 책임/흐름 충돌: `screen-spec` 우선
- 라이브러리/도구 선택 충돌: `stack-spec` 우선
- 폴더 구조/import/naming 충돌: `fsd-profile`과 `codebase-architecture` 우선
- 구현 순서와 작업 단위 충돌: `execution-plan` 우선
- 시각 표현 충돌: `DESIGN.md` 우선

## Working Rules

### Read Before Coding

- 범용 구현 전에는 [build-plan.md](./docs/plans/build-plan.md), [execution-plan.md](./docs/plans/execution-plan.md), [codebase-architecture.md](./docs/plans/codebase-architecture.md)를 먼저 본다
- 데이터나 권한을 만지면 [architecture-spec.md](./docs/plans/architecture-spec.md)를 본다
- UI를 만지면 [DESIGN.md](./DESIGN.md)와 [screen-spec.md](./docs/plans/screen-spec.md)를 본다
- 라이브러리를 추가하거나 교체하기 전에는 [stack-spec.md](./docs/plans/stack-spec.md)를 본다
- 새로운 phase를 시작하기 전에는 먼저 `docs/plans/phases/*` 아래 phase 문서를 만들고 user review를 받는다

### TDD Rule

- 기본 작업 순서는 `test -> implement -> refactor`다
- 새 동작을 만들 때는 먼저 실패하는 테스트를 추가하고, 그 다음 구현으로 테스트를 통과시킨다
- 버그 수정은 재현 테스트를 먼저 추가한 뒤 수정한다
- 테스트는 가능한 한 가장 가까운 경계에 둔다. 순서는 `unit -> integration -> e2e` 우선이다
- slice를 닫을 때는 happy path와 핵심 예외가 자동 테스트로 재현되어야 한다
- 탐색용 스캐폴드나 단순 문서 작업은 예외로 둘 수 있지만, user-facing 동작을 닫기 전에는 테스트가 먼저 있어야 한다

### Work Unit

- 구현은 항상 `phase -> slice -> task` 순서로 진행한다
- phase는 큰 단계다
- slice는 실제로 데모 가능한 작은 사용자 가치 단위다
- task는 slice 내부의 세부 구현 단계다

### Branch And PR Rule

- 작업 브랜치는 `develop`이다
- 구현은 기본적으로 `develop`에서 직접 진행한다
- phase가 끝나면 PR은 `develop -> master`로 올린다
- 하나의 PR은 하나의 `phase`만 다룬다
- 하나의 phase 안에 여러 slice가 있더라도, phase 완료 후 하나의 PR로 올린다
- `master`는 release 또는 배포 기준 브랜치로 유지한다

### Progress Reporting

- 작업 중에는 가능하면 현재 `phase`, 현재 `slice`, 다음 `slice`를 짧게 유지한다
- 공통 scaffold만 만들고 끝나는 작업은 피한다
- 한 slice가 끝나면 최소 happy path는 닫혀 있어야 한다

### Pause And Resume

- 세션을 끝내기 전 또는 긴 중단 전에는 `/checkpoint {작업명}` 저장을 우선 고려한다
- 복귀 시에는 `/checkpoint resume`으로 마지막 작업과 다음 작업을 복구한다
- checkpoint가 여러 개면 `/checkpoint list`, `/checkpoint list --all`을 쓴다

## Code Rules

- 내부 소스 import는 모두 `#/*` 절대 경로를 사용한다
- `./`, `../` 상대 import는 내부 소스 코드에서 사용하지 않는다
- barrel file `index.ts`는 사용하지 않는다
- route와 UI 컴포넌트에서 DB를 직접 호출하지 않는다
- 읽기는 query 경계, 쓰기는 mutation 경계로만 처리한다
- privileged write는 Next.js `server actions` 또는 `route handlers`로만 처리한다
- client-side server state는 TanStack Query를 기준으로 처리한다
- client-only UI state는 Zustand를 기준으로 처리한다
- 공용 UI primitive는 shadcn/ui를 기준으로 처리한다

## Design Rule

모든 시각적 결정은 [DESIGN.md](./DESIGN.md)를 따른다.

- 폰트, 컬러, 간격, 레이아웃, 모션은 DESIGN 기준을 우선한다
- 명시적 승인 없이는 DESIGN에서 벗어나지 않는다
- 디자인 QA에서는 DESIGN과 다른 코드를 버그로 본다

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
