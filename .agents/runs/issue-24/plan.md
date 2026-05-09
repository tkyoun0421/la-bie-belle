# 구현 계획

## 가정

- 패키지 매니저는 기존 저장소 관례가 없으면 `pnpm`을 사용한다.
- 애플리케이션은 제품 기능 없이 최소 라우트와 smoke test만 포함한다.
- 로컬 Supabase는 운영 프로젝트와 분리된 Docker 기반 개발 DB만 구성한다.
- pre-commit은 빠른 staged 파일 검사만 담당하고, 전체 품질 검증은 CI와 수동 명령에서 수행한다.

## 단계

1. 현재 저장소 구조와 기존 문서/하네스 파일을 확인해 충돌 가능성을 점검한다.
2. Next.js + TypeScript 앱 기본 구조와 strict TypeScript 설정을 추가한다.
3. ESLint, formatter, Vitest smoke test 설정을 추가한다.
4. `package.json`에 `dev`, `build`, `lint`, `typecheck`, `test`, `format`, DB 관련 명령을 정의한다.
5. Docker 기반 Supabase 로컬 개발 DB 설정과 `.env.example`을 추가한다.
6. Husky + lint-staged pre-commit 품질 게이트를 구성한다.
7. GitHub Actions CI에서 install, lint, typecheck, test, build를 실행하도록 구성한다.
8. README에 개발 시작, 검증, DB, 커밋 흐름을 문서화한다.
9. Red 단계에서는 현재 미구현 상태를 드러내는 최소 실패 테스트 또는 테스트 불가 사유를 먼저 기록한다.
10. Green 단계에서 최소 구현 후 Verify 단계에서 명령 실행 결과를 기록한다.

## 예상 변경 파일

- `package.json`
- `pnpm-lock.yaml`
- `next.config.*`
- `tsconfig.json`
- ESLint 설정 파일
- formatter 설정 파일
- Vitest 설정 파일
- `.github/workflows/**`
- `.husky/**`
- `.env.example`
- Docker/Supabase 로컬 설정 파일
- 앱 소스 디렉터리
- 테스트 디렉터리
- `README.md`
- `.agents/runs/issue-24/**`

## 열린 질문

- 없음. 제품 기능은 제외하고 개발 표준 뼈대에 한정한다.
