# P0. 프로젝트 기반과 품질 게이트

## 목표

다음 Phase들이 같은 규칙으로 개발·검증·배포될 수 있는 최소 프로젝트 기반을 만든다.

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
- 기존 브랜드 색상을 유지하면서 제품 의미 토큰, Pretendard 단일 글꼴, 모션, 접근성 기준을 정의한다.
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

- 현재 상태: `design_pending`. 제품 승인(user, 2026-07-24)은 유효하고 개발 설계 승인은 [ADR-0013](../../standards/adr/0013-project-layer-structure.md) 구조 재편으로 철회되었다. 새 RADIO는 P0-T31 이후 설계 단계에서 다시 승인한다.
- 아래 항목은 보존된 제품 승인 범위다. 근거 결정 [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md)가 보류이고 이전 생성기와 산출물이 제거되었으므로, 구현 구조와 파일 위치는 설계 단계에서 다시 정한다.
- 대시보드를 프로젝트 운영의 읽기 전용 판단 진입점으로 만든다. 정적 생성물 형태를 유지한다.
- 상단에 기준 시각·기준 커밋, 현재 상태와 단일 다음 행동을 표시한다. 다음 행동은 상태·승인·의존성의 실행 경로를 따른다.
- 추천 근거, 직접 선행 조건, 차단 사유와 관련 task·문서를 제공하고, 대안 후보와 phase별 진행을 함께 표시한다. 상세 의존성 경로는 필요할 때만 펼쳐 본다.
- task `done`·`blocked`·`skipped` 전환과 phase 경계 상태 변화 뒤에 대시보드 데이터를 갱신한다. 생성 시각·기준 커밋을 표시하고 원본 누락 또는 오래됨은 명시적으로 경고한다.

인수 조건:

- 대시보드만 보고 현재 상태, 다음 행동, 추천 이유, 직접 차단 조건, 대안 후보와 phase 진행을 판단할 수 있다.
- 추천은 `proposed`, `design_pending`, `planned`, `in_progress`, `blocked` 상태와 의존성을 운영 계약에 맞게 구분한다.
- task 최종 상태 또는 phase 경계가 바뀐 뒤 생성물의 상태·기준 시각·기준 커밋은 원본과 일치한다.
- 대시보드는 읽기 전용 표시물이다. task index나 실행 상태를 변경하지 않고 승인·상태 전환·구현 실행을 수행하지 않는다.
- 모바일 화면에서 핵심 판단 정보가 먼저 읽히고, 상세 의존성은 필요할 때만 펼쳐 볼 수 있다.

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

- 기획·설계 승인 검증, 개발, 검증, 리팩토링과 handoff 기록을 수행하는 실행 하네스를 다시 만든다.
- 승인 게이트, RADIO SHA-256 결속, `design_pending` 실행 차단, 단일 `in_progress` 제약을 코드 경계에서 강제한다.
- 단계 경계마다 [handoff 계약](../../workflow/HANDOFF.md)의 최소 필드를 기록하고, 중단 후 재개가 가능하게 한다.
- 하네스 코드·검사·산출물의 위치, commit hook 연결과 `package.json` 실행 명령을 이 task의 설계 단계에서 확정한다.
- 보류 중인 [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md)와 P0-T29 대시보드 재설계는 이 task 완료 이후에 다시 다룬다.

인수 조건:

- 기획 단계에서 범위와 인수 조건을 승인받은 뒤 RADIO를 작성한다. 현재 상태는 `proposed`이며 승인 전에는 실행할 수 없다.

## 종료 조건

- P0의 모든 task가 `done`.
- 새 개발자가 README만 보고 로컬 앱과 DB를 실행할 수 있다.
- CI가 코드와 문서 인덱스의 최소 품질을 강제한다.

## 제외

- 실제 인증과 업무 기능.
- 실제 앱 아이콘·브랜드 자산 제작.
- 문서 명세를 벗어나는 후속 브랜드 리디자인.
