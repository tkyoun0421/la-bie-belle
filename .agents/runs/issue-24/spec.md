# 기능 상세 스펙

## 스펙 확정 기준

- Issue #24의 `task-spec.md`, `plan.md`는 유지한다.
- `spec.md`는 사용자 인터뷰에서 확정한 결정만 반영해 재작성한다.
- 이번 작업은 제품 기능 구현이 아니라 개발 표준 뼈대 생성에 한정한다.
- 디자인 시스템과 세부 테스트 전략은 #24 직후 후속 작업으로 분리한다.

## 확정된 범위

- Next.js + TypeScript 기반 앱 뼈대를 만든다.
- TypeScript strict 설정을 적용한다.
- Tailwind 기반 스타일 환경을 준비한다.
- Vitest 기반 최소 smoke test를 둔다.
- ESLint + Prettier 설정을 추가한다.
- Supabase CLI 로컬 스택 기반 개발 DB 명령을 추가한다.
- Husky + lint-staged pre-commit 품질 게이트를 추가한다.
- Conventional Commits + commitlint commit-msg 검증을 추가한다.
- GitHub Actions CI를 추가한다.
- priority/status 라벨 세트를 만들고 #24에 `priority:p0`을 적용한다.
- README는 핵심 실행 흐름을 안내하고, 상세 규칙은 `docs/**`에 분리한다.

## 제외 범위

- 완성된 제품 기능 구현
- 디자인 시스템 구현
- 세부 테스트 전략 수립
- 인증 구현
- Supabase 실제 쿼리 연동
- 운영 DB 또는 원격 Supabase 프로젝트 연결
- 배포 설정
- E2E 테스트
- PR Ready 전환, 머지, 배포

## 기술 선택

- 패키지 매니저: `pnpm`
- 프레임워크: Next.js 최신 안정 버전
- 라우팅: App Router
- 언어: TypeScript strict
- CSS: Tailwind
- 테스트: Vitest 최소 smoke test
- lint/formatter: ESLint + Prettier
- 로컬 DB: Supabase CLI 로컬 스택
- Git hook: Husky
- staged 파일 검사: lint-staged
- commit message 검사: commitlint

## 폴더 구조

앱 소스는 `src` 아래에 둔다.

- `src/app`: Next.js route, layout, metadata, provider 연결
- `src/screen`: 페이지 단위 UI 조합
- `src/features`: 사용자 행동과 업무 기능 단위
- `src/entities`: 도메인 모델, 타입, 상태/표시 규칙
- `src/shared`: 공용 UI, lib, config, utils
- `tests`: 전역 smoke test
- `supabase`: Supabase CLI 로컬 DB 설정, migration, seed 기준 위치

의존 방향은 아래 흐름을 기준으로 한다.

```txt
app -> screen -> features -> entities -> shared
```

하위 계층이 상위 계층을 직접 참조하지 않는다.

## 네이밍 컨벤션

- 일반 폴더/파일: `kebab-case`
- React 컴포넌트 파일: `PascalCase.tsx`
- hook 파일: `use-*.ts`
- util/lib/service/repository 파일: `camelCase.ts`
- 테스트 파일: `*.test.ts` 또는 `*.test.tsx`
- DB migration 파일: `YYYYMMDDHHMMSS_description.sql`
- 환경 변수: `UPPER_SNAKE_CASE`
- 하네스 산출물: 기존 파일명 유지

## docs 구조

장기적으로 문서가 늘어날 것을 고려해 `docs`를 분야별로 나눈다.

- `docs/product`: PRD, 사용자 역할, 업무 흐름, 도메인 규칙
- `docs/architecture`: 앱 구조, 계층 책임, 주요 기술 결정, ADR
- `docs/engineering`: 네이밍, Git workflow, 테스트 전략, 코드 품질 기준
- `docs/infrastructure`: Supabase 로컬 DB, 환경 변수, CI/CD, 배포, 운영 환경
- `docs/operations`: GitHub Issue/Project 운영, priority/status 라벨, 하네스 운영 규칙

이번 #24에서 작성할 상세 문서는 아래 기준으로 둔다.

- `docs/architecture/project-structure.md`
- `docs/engineering/naming-conventions.md`
- `docs/engineering/git-workflow.md`
- `docs/infrastructure/local-database.md`
- `docs/operations/issue-priority.md`

README에는 위 문서로 이동할 수 있는 링크와 핵심 실행 명령만 둔다.

## 이슈와 프로젝트 우선순위 규칙

- #24는 기반 차단 작업이므로 `priority:p0`로 본다.
- priority/status 라벨 생성과 #24 라벨 변경은 Green 범위에 포함한다.
- priority 라벨 후보는 `priority:p0`, `priority:p1`, `priority:p2`, `priority:p3`이다.
- 차단 상태 라벨은 `status:blocked`를 사용한다.
- 새 이슈는 triage 전 `needs-triage`를 사용할 수 있다.
- triage 후 priority 라벨은 하나만 유지한다.
- 다음 작업 선택은 `status:blocked` 제외 후 `priority:p0`, `priority:p1`, `priority:p2`, `priority:p3` 순서로 본다.

## 로컬 DB 기준

- Supabase CLI 로컬 스택을 사용한다.
- Docker는 필수 전제 조건으로 README와 `docs/infrastructure/local-database.md`에 명시한다.
- 운영 Supabase 프로젝트와 연결하지 않는다.
- 로컬 DB script는 Supabase CLI 명령을 감싼다.
- 기본 script 이름은 `db:start`, `db:stop`, `db:status`, `db:reset`이다.
- CI에서는 로컬 Supabase DB 실행을 필수로 포함하지 않는다.

## 커밋과 품질 게이트

- pre-commit은 staged 파일 기준 Prettier + ESLint만 실행한다.
- pre-commit에서 전체 `typecheck`, `test`, `build`를 실행하지 않는다.
- 전체 검증은 수동 명령과 CI에서 보장한다.
- commit-msg hook에서 commitlint를 실행한다.
- 커밋 메시지는 Conventional Commits를 따른다.
- 허용 타입은 `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`이다.
- 하네스 산출물 변경은 `docs` 또는 `chore(harness)`를 허용한다.
- 커밋 본문은 최소 2줄 이상의 설명을 요구한다.

## CI 기준

- CI 트리거는 pull request와 `main` push이다.
- CI는 아래 명령을 실행한다.
  - `pnpm install --frozen-lockfile`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- commitlint 검증을 PR/Push CI에 포함한다.
- 로컬 Supabase DB 실행은 CI 필수 범위에서 제외한다.

## README 범위

README는 실행 진입점에 집중한다.

- 설치
- 개발 서버 실행
- lint/typecheck/test/build 검증 명령
- Supabase 로컬 DB 명령과 Docker 전제 조건
- Tailwind 사용 사실
- pre-commit과 commit-msg hook 요약
- CI 범위 요약
- 상세 규칙 문서 링크
- 디자인 시스템과 세부 테스트 전략은 후속 작업이라고 명시

## 사용자 시나리오

- 개발자가 저장소를 처음 클론한 뒤 의존성을 설치하고 개발 서버를 실행해 기본 앱 화면을 확인한다.
- 개발자가 로컬에서 lint, typecheck, test, build를 실행해 변경 사항의 기본 품질을 확인한다.
- 개발자가 Supabase CLI 로컬 스택을 script로 start, stop, status, reset 한다.
- 개발자가 커밋할 때 staged 파일 품질 게이트와 commit message 검증을 통과한다.
- CI가 pull request 또는 `main` push에서 install, lint, typecheck, test, build, commitlint를 실행한다.

## 정상 흐름

1. `pnpm install`로 의존성을 설치한다.
2. `pnpm dev`로 Next.js 개발 서버를 실행한다.
3. 기본 앱 화면이 렌더링된다.
4. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`가 성공한다.
5. `pnpm db:start`, `pnpm db:stop`, `pnpm db:status`, `pnpm db:reset`이 Supabase CLI 로컬 스택 기준으로 동작한다.
6. staged 파일이 있는 상태에서 pre-commit hook이 Prettier와 ESLint를 실행한다.
7. commit-msg hook이 Conventional Commits와 본문 2줄 규칙을 검증한다.
8. GitHub Actions CI가 정해진 검증 명령을 실행한다.

## 엣지 케이스

- Docker가 설치되어 있지 않으면 DB 명령은 실패할 수 있으므로 문서에 전제 조건을 명시한다.
- Supabase 로컬 스택 포트가 이미 사용 중이면 설정 조정 위치를 문서화한다.
- staged 파일이 없으면 pre-commit hook은 불필요한 전체 검증을 강제하지 않는다.
- 운영 Supabase 환경 변수가 없어도 lint, typecheck, test, build는 성공해야 한다.
- CI에서는 로컬 DB 컨테이너 실행을 요구하지 않는다.

## 에러 상태

- 의존성 설치 실패: Node.js/pnpm 버전, lockfile, registry 접근 문제를 확인한다.
- lint 실패: 실패 파일과 rule을 기준으로 수정한다.
- typecheck 실패: strict TypeScript 오류를 수정한다.
- test 실패: smoke test 실패 원인을 확인한다.
- build 실패: Next.js 설정, 라우트, 환경 변수 참조 방식을 확인한다.
- DB 명령 실패: Docker 실행 여부, Supabase CLI 설치 여부, 포트 충돌을 확인한다.
- pre-commit 실패: staged 파일의 formatting/lint 위반을 수정한다.
- commit-msg 실패: Conventional Commits 형식과 본문 2줄 이상 조건을 맞춘다.

## 빈 상태

- 제품 도메인 데이터는 아직 없다.
- 기본 앱 화면은 제품 기능 목록이나 실제 업무 데이터를 표시하지 않는다.
- Supabase schema, migration, seed는 제품 도메인 구조를 만들지 않는다.

## 로딩 상태

- 이번 이슈에서는 사용자 기능의 비동기 로딩 UI를 구현하지 않는다.
- 개발 서버 최초 실행, 의존성 설치, CI build 시간은 터미널과 CI 로그로 확인한다.

## 권한과 인증 조건

- 인증 구현은 제외한다.
- 운영 Supabase 프로젝트에 연결하지 않는다.
- 운영 DB URL, service role key, 실제 사용자 데이터는 저장소에 커밋하지 않는다.
- `.env.example`에는 로컬 개발과 예시 값만 둔다.

## 입력 검증

- 사용자 입력 폼은 이번 범위에 포함하지 않는다.
- 환경 변수 참조가 필요하면 운영 비밀값 없이도 기본 검증 명령이 성공해야 한다.
- DB 명령은 잘못된 환경에서 실패할 수 있으므로 문서에 전제 조건과 복구 힌트를 제공한다.

## 데이터 규칙

- 로컬 개발 DB와 운영 DB는 분리한다.
- smoke test는 제품 도메인 데이터나 원격 DB를 요구하지 않는다.
- 실제 운영 자격 증명을 저장소에 넣지 않는다.

## UI 동작

- 기본 앱은 최소 화면을 안정적으로 렌더링한다.
- 화면에는 smoke test나 수동 확인이 가능한 고정 텍스트 또는 구조가 있어야 한다.
- 제품 기능, 인증 화면, 디자인 시스템 구현은 제외한다.

## 테스트 케이스

- `pnpm test`가 Vitest smoke test를 실행한다.
- smoke test는 기본 앱 또는 핵심 설정이 로드 가능한지 확인한다.
- `pnpm typecheck`가 strict TypeScript 설정에서 성공한다.
- `pnpm lint`가 앱 소스와 설정 파일 범위에서 성공한다.
- `pnpm build`가 Next.js 앱을 production build할 수 있다.
- DB script가 Supabase CLI 로컬 스택 명령과 연결되어 있다.
- pre-commit은 staged 파일 기준 Prettier + ESLint를 실행한다.
- commit-msg hook은 Conventional Commits와 본문 2줄 이상 규칙을 검증한다.
- CI workflow는 install, lint, typecheck, test, build, commitlint를 포함한다.
- priority/status 라벨 세트가 생성되고 #24에 `priority:p0`이 적용된다.

## Red 단계 우선순위

이미 Red 단계에서 `pnpm test`가 `package.json` 부재로 실패하는 상태를 기록했다. Green 단계는 아래 조건을 만족해야 한다.

1. `package.json`을 추가하고 `pnpm test` script를 정의한다.
2. Next.js + TypeScript App Router 최소 앱을 추가한다.
3. Tailwind 설정을 추가한다.
4. Vitest smoke test를 추가해 `pnpm test`가 성공하도록 한다.
5. `pnpm lint`, `pnpm typecheck`, `pnpm build` script를 정의하고 성공하도록 한다.
6. Supabase CLI 로컬 DB script를 추가하고 문서화한다.
7. Husky + lint-staged pre-commit과 commitlint commit-msg hook을 구성한다.
8. GitHub Actions CI에서 install, lint, typecheck, test, build, commitlint를 실행하도록 한다.
9. priority/status 라벨 세트를 만들고 #24에 `priority:p0`을 적용한다.
10. README와 `docs/**`에 확정된 개발 표준을 문서화한다.
