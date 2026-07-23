# P0. 프로젝트 기반과 품질 게이트

## 목표

다음 Phase들이 같은 규칙으로 개발·검증·배포될 수 있는 최소 프로젝트 기반을 만든다.

## 진입 조건

- PRD, Architecture, ADR이 승인되어 있다.
- 관련 spec: [PRD](../PRD.md) `AC-12`, [Domain](../DOMAIN.md), [ADR-0001](../adr/0001-nextjs-supabase-vercel.md), [ADR-0002](../adr/0002-authorization-boundaries.md).

## 작업

### P0-T01. Next.js 모바일 PWA 프로젝트 생성

- pnpm 기반 Next.js App Router와 TypeScript를 생성한다.
- `src/` 구조, 절대 경로 alias, 서버·클라이언트 경계를 정한다.
- 모바일 viewport와 기본 한국어 metadata를 설정한다.
- `DESIGN.md`의 Foundations와 모바일 우선 원칙을 기본 스타일에 반영하되 기능별 화면은 해당 Phase에서 구현한다.

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
- `DESIGN.md`의 앱 셸, 상태 피드백, 접근성 패턴을 적용한다.

인수 조건:

- 필수 환경변수가 없으면 시작 시 이해 가능한 오류를 낸다.
- 서버 비밀값이 클라이언트 번들에 포함되지 않는다.

### P0-T05. CI와 문서 인덱스 검증

- lint, typecheck, unit, build, migration 검증을 CI에 연결한다.
- `docs/phases/index.jsonl`의 JSON 파싱, schema, ID 중복, 의존성 존재 여부와 순환을 검사하는 스크립트를 만든다.
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
- `docs/DESIGN.md`를 공식 진입점으로 두고 세부 명세를 `docs/design/`의 5개 문서로 분리한다.
- 기존 브랜드 색상을 유지하면서 제품 의미 토큰, Pretendard 단일 글꼴, 모션, 접근성 기준을 정의한다.
- PRD와 Domain의 권한·출퇴근·배정·예상 급여·리허설 규칙을 화면 흐름에서 보존한다.
- PWA 구현 task가 디자인 문서를 선행 기준으로 사용하도록 의존성과 문서 지도를 갱신한다.

인수 조건:

- Coinbase 마케팅 문맥이나 라이선스 전용 자산 없이 라비에벨 제품 디자인 원칙만 남는다.
- `FOUNDATIONS`, `PATTERNS`, `COMPONENTS`, `WORKER-FLOWS`, `ADMIN-FLOWS`의 책임이 겹치지 않고 `DESIGN.md`에서 모두 연결된다.
- 기존 원시 색상과 추가 의미 토큰, 반응형·모션·접근성·오프라인·권한 패턴이 명시된다.
- 근무 신청, 출퇴근, 예상 급여·리허설, 관리자 배정·확정, 팀원 관리, 완전 삭제 흐름을 구현 가능한 수준으로 정의한다.
- README, 문서 지도, Architecture와 Phase index가 디자인 문서를 현재 구현 기준으로 가리킨다.

## 종료 조건

- P0의 모든 task가 `done`.
- 새 개발자가 README만 보고 로컬 앱과 DB를 실행할 수 있다.
- CI가 코드와 문서 인덱스의 최소 품질을 강제한다.

## 제외

- 실제 인증과 업무 기능.
- 실제 앱 아이콘·브랜드 자산 제작.
- 문서 명세를 벗어나는 후속 브랜드 리디자인.
