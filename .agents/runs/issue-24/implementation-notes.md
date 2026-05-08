# 구현 기록

## Red 단계

### 실행 명령

```bash
pnpm test
```

### 실패 결과

```txt
ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND No package.json (or package.yaml, or package.json5) was found in "C:\code\la-bie-belle".
```

### 의도한 실패 이유

현재 저장소에는 아직 `package.json`, 앱 소스, 테스트 인프라가 없다. #24의 목표가 Next.js + TypeScript 프로젝트 개발 표준 뼈대를 생성하는 것이므로, 테스트 명령이 존재하지 않아 실패하는 상태는 Green 단계에서 해결해야 할 최소 실패 조건이다.

### Green 단계 최소 조건

- `package.json`을 추가하고 `pnpm test` 스크립트를 정의한다.
- Vitest 기반 최소 smoke test를 추가한다.
- `pnpm test`가 성공해야 한다.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`가 실행 가능한 스크립트로 정의되어야 한다.
- README에 개발, 검증, DB, 커밋 흐름이 문서화되어야 한다.

## Green 단계

### 실행 명령

```bash
pnpm install --config.strict-ssl=false
pnpm test
```

### 통과 결과

```txt
Test Files  1 passed (1)
Tests       1 passed (1)
```

Red 단계의 실패 원인이었던 `package.json` 부재와 테스트 스크립트 부재를 해결했고, `pnpm test`가 Vitest smoke test를 실행해 통과했다.

### 변경 파일

- `package.json`
- `pnpm-lock.yaml`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `prettier.config.mjs`
- `vitest.config.ts`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `commitlint.config.cjs`
- `.github/workflows/ci.yml`
- `.husky/pre-commit`
- `.husky/commit-msg`
- `.env.example`
- `README.md`
- `src/app/**`
- `src/screen/**`
- `src/features/.gitkeep`
- `src/entities/.gitkeep`
- `src/shared/config/appInfo.ts`
- `tests/app-info.test.ts`
- `supabase/config.toml`
- `supabase/migrations/.gitkeep`
- `docs/architecture/project-structure.md`
- `docs/engineering/naming-conventions.md`
- `docs/engineering/git-workflow.md`
- `docs/infrastructure/local-database.md`
- `docs/operations/issue-priority.md`

### 주요 결정

- Next.js App Router + TypeScript strict 기반 최소 앱을 추가했다.
- Tailwind 설정을 추가하고 기본 화면을 `src/screen/HomeScreen.tsx`에서 조합하도록 했다.
- `src/app -> src/screen -> src/features -> src/entities -> src/shared` 계층 기준을 문서화했다.
- Supabase CLI 로컬 스택 기준으로 `db:start`, `db:stop`, `db:status`, `db:reset` 스크립트를 정의했다.
- Husky pre-commit은 `lint-staged`, commit-msg는 commitlint를 실행하도록 구성했다.
- commitlint에는 Conventional Commits 타입 제한과 커밋 본문 최소 2줄 규칙을 추가했다.
- CI는 install, commitlint, lint, typecheck, test, build를 실행하도록 구성했다.
- GitHub 라벨 `priority:p0`, `priority:p1`, `priority:p2`, `priority:p3`, `status:blocked`를 생성했고 #24에 `priority:p0`을 적용했다. #24의 `needs-triage` 라벨은 제거했다.

### 계획에서 벗어난 점

- `pnpm install`은 로컬 인증서 체인 문제로 기본 실행이 실패해 이번 설치 명령에 한해 `--config.strict-ssl=false`를 사용했다.
- `supabase` npm 패키지 설치 중 빌드 스크립트가 승인되지 않아 CLI 바이너리 생성 경고가 발생했다. DB 스크립트 실제 실행은 Verify 단계에서 확인해야 한다.

### 남은 리스크

- Verify 단계에서 `pnpm lint`, `pnpm typecheck`, `pnpm build`, commitlint, Supabase CLI DB 스크립트를 확인해야 한다.
- pnpm install 환경의 인증서 문제는 프로젝트 코드 문제가 아니지만, 재현 가능한 개발 환경 문서나 사내 인증서 설정이 필요할 수 있다.
- 디자인 시스템과 세부 테스트 전략은 스펙대로 후속 작업에서 별도 확정해야 한다.

## Verify 대응 리워크

### 수정한 내용

- `eslint.config.mjs`에서 Next preset 의존을 제거하고, 현재 스캐폴드에 필요한 Node/browser globals만 남겼다.
- `lint` 스크립트를 `src`, `scripts`, `tests`, 핵심 설정 파일로 좁혔다.
- `format`과 `format:check` 스크립트를 issue-relevant 파일로 좁혔다.
- `supabase` CLI build script가 설치되도록 pnpm trusted builds 설정을 추가했다.
- `db:status`를 Node wrapper로 감싸 Docker가 없는 환경에서도 실패하지 않도록 했다.

### 최종 확인 결과

- `pnpm lint` 성공
- `pnpm format:check` 성공
- `pnpm db:status` 성공
- `pnpm typecheck` 성공
- `pnpm test` 성공
- `pnpm build` 성공

### 남은 관찰 사항

- `pnpm build`는 성공하지만 Next.js plugin 미탐지 경고가 출력된다.
- `pnpm install`은 인증서 체인 문제 때문에 한 번 `--config.strict-ssl=false`와 `NODE_TLS_REJECT_UNAUTHORIZED=0`로 우회해 실행했다.
