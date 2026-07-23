# P0. 프로젝트 기반과 품질 게이트

## 목표

다음 Phase들이 같은 규칙으로 개발·검증·배포될 수 있는 최소 프로젝트 기반을 만든다.

## 진입 조건

- PRD, Architecture, ADR이 승인되어 있다.

## 작업

### P0-T01. Next.js 모바일 PWA 프로젝트 생성

- pnpm 기반 Next.js App Router와 TypeScript를 생성한다.
- `src/` 구조, 절대 경로 alias, 서버·클라이언트 경계를 정한다.
- 모바일 viewport와 기본 한국어 metadata를 설정한다.
- 데스크톱 전용 레이아웃이나 최종 브랜드 스타일은 만들지 않는다.

인수 조건:

- 개발 서버가 실행되고 기본 모바일 화면이 렌더링된다.
- production build와 typecheck가 성공한다.

### P0-T02. 코드 품질과 테스트 도구 구성

- ESLint, formatter, TypeScript strict를 구성한다.
- Vitest와 Testing Library를 구성한다.
- Playwright 모바일 프로젝트를 구성한다.
- 테스트·lint·typecheck 명령을 package scripts로 제공한다.

인수 조건:

- 의도적인 샘플 단위 테스트와 모바일 E2E smoke test가 통과한다.
- CI에서 사용할 단일 검증 명령이 존재한다.

### P0-T03. Supabase 로컬 개발과 초기 스키마

- Supabase CLI 설정과 마이그레이션 디렉터리를 만든다.
- 공통 enum, timestamp 규칙, audit 기반 타입을 정의한다.
- 9개 포지션과 기본 인원·성별·기본 포지션 여부를 seed한다.
- 단일 venue 기본 설정, GPS 100m, 위치 정확도 100m, 기본 출근 규칙을 seed한다.

인수 조건:

- 빈 로컬 DB에서 migration과 seed를 재실행할 수 있다.
- seed 결과가 PRD 포지션 표와 일치한다.

### P0-T04. 환경변수와 애플리케이션 셸

- 공개·서버 전용 환경변수를 schema로 검증한다.
- Supabase 브라우저·서버 client factory를 분리한다.
- 로딩, 오류, 오프라인, 접근 거절 기본 화면을 만든다.
- PWA manifest와 아이콘 placeholder를 구성한다.

인수 조건:

- 필수 환경변수가 없으면 시작 시 이해 가능한 오류를 낸다.
- 서버 비밀값이 클라이언트 번들에 포함되지 않는다.

### P0-T05. CI와 문서 인덱스 검증

- lint, typecheck, unit, build, migration 검증을 CI에 연결한다.
- `docs/phases/index.jsonl`의 JSON 파싱, schema, ID 중복, 의존성 존재 여부를 검사하는 스크립트를 만든다.
- 깨진 Markdown 내부 링크를 검사한다.

인수 조건:

- 잘못된 JSONL 한 줄, 중복 task ID, 존재하지 않는 의존성이 CI를 실패시킨다.
- 깨진 내부 문서 링크가 CI를 실패시킨다.

## 종료 조건

- P0의 모든 task가 `done`.
- 새 개발자가 README만 보고 로컬 앱과 DB를 실행할 수 있다.
- CI가 코드와 문서 인덱스의 최소 품질을 강제한다.

## 제외

- 실제 인증과 업무 기능.
- 최종 디자인 시스템.
