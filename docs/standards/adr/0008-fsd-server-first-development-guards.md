# ADR-0008: FSD, server-first, RADIO 개발 가드

- 상태: Accepted
- 날짜: 2026-07-23
- 후속 운영 경계: [ADR-0009](0009-two-track-interview-and-engineering-loop.md)
- RADIO 승인 시점과 공통 컨벤션 후속 결정: [ADR-0011](0011-planning-radio-development-contract.md)
- FSD 레이어 이름 부분 대체: [ADR-0014](0014-fsd-view-layer-naming.md) — 아래 Decision의 `pages`는 `views`로 읽는다

## Context

MVP는 개인정보, 권한, 출퇴근, 예상 급여를 다룬다. UI 편의 코드가 서버 비밀값이나 DB 접근을 직접 가져오거나, AI가 검증 없이 구조를 바꾸면 RLS만으로는 충분한 개발 안전성을 얻을 수 없다. 동시에 초기 규모에 맞지 않는 추상화와 성능 최적화는 피해야 한다.

## Decision

- Next.js App Router는 `src/app`에만 두고 FSD 레이어 `pages`, `widgets`, `features`, `entities`, `shared`로 화면과 도메인 코드를 구성한다.
- UI는 표시와 이벤트 전달만 맡는다. 복수 entity를 변경하는 command는 `features/*/api`의 Server Action에서 Zod 검증, 인증·인가, 트랜잭션과 감사를 수행한다.
- 서버 전용 모듈은 `import "server-only"`를 선언한다. entity는 도메인 모델·순수 규칙·DTO를 소유하며 DB row를 UI에 직접 노출하지 않는다.
- 예상 가능한 action 오류는 `Result`로 반환하고, 예기치 않은 오류만 throw한다.
- Server Component 직접 조회를 기본으로 한다. 상호작용 후 재조회가 필요한 데이터는 TanStack Query의 서버 prefetch/dehydrate/hydrate를 사용하며, client query는 얇은 read Route Handler를 호출한다. mutation은 Server Action을 사용한다.
- PostgreSQL migration은 물리 schema·제약·RLS·권한·함수·trigger·index의 실행 원본이다. 생성 DB 타입은 커밋하고 entity DTO로 변환한다.
- task마다 Requirements, Architecture, Data model, Interface, Optimizations(RADIO)를 기록한다. ADR-0011 이후 RADIO 정본은 개발 전 인터뷰에서 승인하고 실행 run에는 적용 결과와 차이만 기록한다. 민감 변경은 구현·검증 후 사용자 확인을 거쳐 완료·커밋한다.
- repository-local harness skill과 guard는 RADIO 구조, server-only, 기본 FSD 경계를 검사한다. 동작 변경은 TDD, 문서·설정 변경은 verification으로 검증한다.
- repository-local 스킬의 사용자 노출 지침과 UI 메타데이터는 한국어로 제공하며, 언어 가드가 `.agents/skills/**`의 `SKILL.md`와 `agents/openai.yaml`을 회귀 검사한다. 식별자, 파일명, `$skill-name` 참조, 코드와 명령어는 영문 호환 형식을 유지한다. Codex 시스템 스킬과 외부 플러그인 스킬은 이 저장소 가드의 범위 밖이다.
- Codex lifecycle hook은 `SessionStart`에 현재 task 계약을 제공하고, `PreToolUse`에서 Codex의 `git commit`을 기존 task/TDD pre-commit guard로 재검증한다. Git hook은 Codex 밖 commit의 동일한 최종 방어선으로 유지한다.
- 이 개발 가드는 ADR-0011의 기획 승인과 RADIO 개발 설계 승인을 통과한 단일 task에만 적용한다.

## Consequences

- FSD import 경계와 Prettier/ESLint의 실제 도입은 P0-T02에서 앱 기반과 함께 설정한다.
- public cache와 private 세션 메모리 cache는 `DEV-CACHE-*`, 오프라인 범위는 `DEV-OFFLINE-*`를 따른다. experimental streaming, private 브라우저 영속 cache, offline mutation replay와 새 production dependency는 별도 RADIO 근거와 사용자 승인이 필요하다.
- 관측 로그와 외부 오류 수집은 출시 준비 task에서 결정한다.
