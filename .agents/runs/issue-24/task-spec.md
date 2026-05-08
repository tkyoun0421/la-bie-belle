# 작업 명세

## 목표

실제 앱 개발을 안정적으로 시작할 수 있도록 Next.js, TypeScript, 품질 게이트, CI, 로컬 Supabase 개발 DB를 포함한 프로젝트 개발 표준 뼈대를 만든다.

현재 저장소에는 AI 하네스와 운영 문서 중심 구조가 있으므로, 제품 기능 구현 전 최소 실행 가능한 애플리케이션/검증/문서 기반을 마련한다.

## 범위

- Next.js + TypeScript 기반 앱 뼈대 생성
- TypeScript strict 설정
- ESLint 설정
- formatter 설정
- Vitest 기반 최소 테스트 또는 smoke test 추가
- GitHub Actions CI 설정
- Docker 기반 Supabase 개발 DB 구성
- 로컬 개발 DB 실행, 중지, 초기화, 상태 확인 명령 추가
- `package.json` 개발, 검증, DB 명령 추가
- Husky + lint-staged 기반 pre-commit 품질 게이트 설정
- staged 파일 formatting/lint 커밋 흐름 문서화
- README 개발 가이드 작성
- 하네스 단계 산출물 작성 대상 준비

## 제외 범위

- 완성된 제품 기능 구현
- 디자인 시스템 전체 구현
- 인증 구현
- Supabase 실제 쿼리 연동
- 운영 DB 또는 원격 Supabase 프로젝트 연결
- 배포 설정
- E2E 테스트
- PR Ready 전환, 머지, 배포

## 관련 파일 또는 영역

- `AGENT.md`
- `.env.example`
- `.github/workflows/**`
- `.husky/**`
- `package.json`
- `pnpm-lock.yaml`
- `next.config.*`
- `tsconfig.json`
- ESLint 설정 파일
- formatter 설정 파일
- Vitest 설정 파일
- Supabase/Docker 설정 파일
- 앱 소스 디렉터리
- 테스트 디렉터리
- `README.md`
- `.agents/runs/issue-24/`

## 검증 방법

- 패키지 설치 가능 여부 확인
- 개발 서버 실행 명령 확인
- 최소 테스트 또는 smoke test 실행
- lint 실행
- typecheck 실행
- build 실행
- GitHub Actions workflow 문법 확인
- Supabase 개발 DB start/stop/status/reset 명령 확인
- Husky pre-commit hook이 staged 파일 기준 format/lint를 실행하는지 확인
- 하네스 산출물과 대시보드 데이터 갱신 확인

## 완료 기준

- 프로젝트 기술 스택 선택이 하네스 계획 산출물에 기록된다.
- 최소 실행 가능한 Next.js + TypeScript 앱 뼈대가 생성된다.
- TypeScript strict 설정이 적용된다.
- ESLint 설정이 추가된다.
- formatter 설정이 추가된다.
- Vitest 기반 최소 테스트 또는 smoke test가 추가된다.
- `package.json`에 개발/검증/DB/커밋 품질 명령이 정의된다.
- GitHub Actions CI가 추가된다.
- Docker 기반 Supabase 개발 DB 구성이 추가된다.
- Husky + lint-staged pre-commit 품질 게이트가 설정된다.
- README에 개발 시작, 검증, DB, 커밋 흐름이 문서화된다.
- Red 단계에서 실패 테스트 또는 테스트 불가 사유가 기록된다.
- Green 단계에서 최소 구현이 완료된다.
- 검증 명령과 결과가 `verification.md`에 기록된다.
- 리뷰 점수와 gate 결정이 `review-score.json`, `review.md`에 기록된다.
- 대시보드 데이터가 갱신된다.

## 리스크

- 첫 뼈대 작업의 범위가 커져 하네스 첫 실행이 무거워질 수 있다.
- pre-commit에서 너무 많은 검증을 실행하면 커밋 속도가 느려질 수 있다.
- Supabase 로컬 개발 DB 구성 방식이 이후 운영 DB 구조와 달라질 수 있다.
- 테스트 환경을 과하게 구성하면 초기 유지보수 비용이 커질 수 있다.
- CI와 로컬 명령이 다르면 개발자 경험이 불안정해질 수 있다.
