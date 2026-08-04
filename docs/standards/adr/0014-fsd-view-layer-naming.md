# ADR-0014: FSD 화면 조합 계층 이름 `views`

- 상태: Accepted
- 날짜: 2026-08-04
- 승인: user, 2026-08-04
- 부분 대체: [ADR-0008](0008-fsd-server-first-development-guards.md) — FSD 레이어 이름 중 `pages` 항목만
- 관련 문서: [개발 컨벤션](../DEVELOPMENT.md), [시스템 구조](../ARCHITECTURE.md), [P0 Phase](../../execution/phases/00-foundation.md), [P0-T01 RADIO](../../execution/radio/P0-T01-radio.md)

## Context

[ADR-0008](0008-fsd-server-first-development-guards.md)은 FSD 레이어를 `pages`, `widgets`, `features`, `entities`, `shared`로 규정했다. 이 이름은 Feature Sliced Design 원문 규약을 그대로 따른 것이다.

P0-T01에서 실제로 Next.js App Router 프로젝트를 만들면서 이름 충돌이 드러났다. Next.js는 `src/pages/`를 **Pages Router 디렉터리로 예약**한다. App Router를 쓰는 프로젝트에 `src/pages/`가 존재하면 프레임워크가 두 라우팅 규약이 공존하는 상태로 인식한다. FSD의 `pages`는 라우팅이 아니라 화면 조합 계층이므로, 이 디렉터리에 라우팅 의미가 붙는 것은 계층 책임과 어긋난다.

사용자는 2026-08-04 P0-T01 실행 중에 계층 이름을 `views`로 바꾸기로 결정했고, 구현·`DEVELOPMENT.md`·`ARCHITECTURE.md`·`CLAUDE.md`는 그 결정을 반영했다. 그러나 상위 문서인 ADR-0008과 `00-foundation.md`의 P0-T01 절은 여전히 `pages`를 가리켜, [문서 계층 규칙](0013-project-layer-structure.md)상 상위 문서가 하위 구현과 충돌하는 상태가 되었다. P0-T01 교차 검증의 확정 발견 F-03이 이 충돌이다.

P0-T02는 ESLint로 FSD 계층의 단방향 import를 기계적으로 강제한다. 규칙이 참조할 계층 이름이 문서마다 다른 상태로는 그 강제를 정의할 수 없다.

## Decision

### 1. 화면 조합 계층의 디렉터리 이름은 `views`다

FSD 레이어 이름을 다음으로 확정한다.

```
src/
  app/        # Next.js 라우트·레이아웃·프로바이더 (얇은 어댑터)
  views/      # 라우트 단위 화면 조합 (FSD 원문의 pages)
  widgets/    # 독립 화면 블록
  features/   # 사용자 행위, Server Action, mutation
  entities/   # 도메인 모델, 순수 규칙, DTO
  shared/     # 재사용 UI, 설정, 공통 서버 클라이언트 기반
```

`pages` → `views`는 **이름만 바뀐다.** ADR-0008이 정한 계층 책임, 단방향 import(위 → 아래), 서버 경계 규약, `import "server-only"` 선언 규칙은 그대로 유지된다. ADR-0008의 나머지 결정은 전부 유효하다.

### 2. 계층 디렉터리는 처음 쓰이는 시점에 만든다

여섯 계층 디렉터리를 미리 만들지 않는다. 빈 디렉터리는 커밋되지 않으며, 쓰이지 않는 계층의 빈 골격은 구조를 설명하지 못한다. 계층 정의의 정본은 [개발 컨벤션](../DEVELOPMENT.md)의 `DEV-CODE-04`이고, 경로 alias는 계층 사용 여부와 무관하게 `tsconfig.json`에 전부 선언한다.

P0-T01 종료 시점의 실제 디렉터리는 `app`·`views`·`shared` 셋이다.

## Consequences

- `src/pages/`가 존재하지 않으므로 Next.js가 Pages Router 규약을 감지할 여지가 없다.
- ADR-0008을 인용하는 문서와 도구는 레이어 이름에 한해 이 ADR을 따른다. 충돌하면 뒤의 ADR인 이 문서가 기준이다.
- P0-T02의 ESLint 계층 규칙은 `views`를 기준으로 정의한다.
- FSD 원문 규약과 디렉터리 이름이 하나 달라진다. 외부 FSD 문서를 참조할 때 `pages`를 `views`로 읽어야 한다. 이 비용은 프레임워크 예약어와의 충돌을 피하는 대가로 수용한다.
- 계층 디렉터리를 미리 만들지 않으므로, 새 계층을 처음 쓰는 task가 디렉터리 생성과 첫 모듈 배치를 함께 책임진다.

## 개정 이력

| 날짜 | 변경 | 승인 |
| --- | --- | --- |
| 2026-08-04 | 최초 채택. ADR-0008의 레이어 이름 `pages`를 `views`로 부분 대체하고, 계층 디렉터리의 선생성 요구를 제거한다. | user, 2026-08-04 |
