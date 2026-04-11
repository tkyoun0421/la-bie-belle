# Refactoring Guide

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-11

## Purpose

이 문서는 이 프로젝트에서 refactor 를 언제 해도 되고, 언제 멈춰야 하는지 고정한다.

핵심 목적:

- `red -> green -> refactor` 의 refactor 기준 고정
- 구조 정리가 SSOT 를 우회하지 않게 만들기
- SOLID 를 실용적으로 적용하되 과한 추상화 방지
- over-engineering 을 기본적으로 경계하기

## Position In SSOT

이 문서는 refactor 운영 규칙의 source of truth 다.

충돌 시에는 아래가 우선이다.

1. 범위와 shipping 판단은 [Build Plan](./build-plan.md)
2. 데이터, 권한, 상태 전이는 [Architecture Spec](./architecture-spec.md)
3. 폴더 책임과 import 방향은 [Folder Hierarchy](./folder-hierarchy.md), [FSD Profile](./fsd-profile.md)
4. 구현 순서와 TDD 운영은 [Execution Plan](./execution-plan.md)
5. 이 문서는 refactor 의 허용 범위와 방식만 고정한다

refactor 는 SSOT 를 더 명확하게 만드는 작업이어야 한다.  
SSOT 를 우회해서 새 구조를 밀어 넣는 수단이면 안 된다.

## Refactor Gate

다음 중 하나가 있을 때만 refactor 한다.

- green 상태에서 중복이 다음 slice 진행을 방해할 때
- 현재 owner 가 잘못되어 layer 책임이 흐려졌을 때
- naming 이 도메인 의미를 숨길 때
- 버그 수정 이후 재발 방지를 위해 구조를 단순화해야 할 때
- screen root state, raw persistence call, domain rule leakage 같은 구조 위반이 있을 때

다음 경우에는 하지 않는다.

- “나중에 재사용할 것 같다” 수준의 추측만 있을 때
- 현재 slice 와 무관한 넓은 정리 작업으로 번질 때
- working code 를 스타일 취향 때문에 흔들 때
- 측정이나 실제 pain 없이 성능 최적화를 넣을 때

## TDD Gate

- refactor 는 green 이후에만 한다.
- 보호 테스트 없이 refactor 하지 않는다.
- refactor 후에도 `pnpm lint`, `pnpm typecheck`, `pnpm test` 를 다시 통과해야 한다.
- happy path 와 핵심 예외 테스트를 줄여서 green 을 맞추지 않는다.

## SOLID Check

이 프로젝트에서 SOLID 는 abstraction 증식 규칙이 아니다.  
현재 구조가 변경 이유를 제대로 나누고 있는지 점검하는 체크리스트다.

- SRP: 하나의 파일은 하나의 주된 변경 이유를 가져야 한다.
- OCP: 새 요구는 기존 concrete seam 을 따라 확장하되, 미리 generic framework 를 만들지 않는다.
- LSP: repository return shape, schema parse result, props contract 의 의미를 깨지 않는다.
- ISP: 필요한 만큼만 좁게 나눈다. 큰 options object 와 과한 범용 prop 을 경계한다.
- DIP: 상위 레벨은 raw Supabase 세부사항이 아니라 repository 와 domain contract 에 의존한다.

판단 질문:

- 이 변경이 변경 이유를 더 분리하는가
- 호출자 contract 를 더 안정적으로 만드는가
- 개념 수를 줄이는가

## Over-Engineering Guardrail

항상 아래를 경계한다.

- 현재 중복보다 개념 수가 더 많은 추상화
- 한 번만 쓰이는 generic helper
- 구현이 하나뿐인 factory, registry, base class
- low-frequency admin 화면에 대한 과한 caching, prefetch, optimistic layer
- 미래 slice 를 미리 반영한 state machine

기본 원칙은 아래다.

- rule of three 전에는 concrete code 를 선호한다
- duplication 보다 잘못된 abstraction 이 더 비싸다
- 성능 최적화는 측정되거나 실제 pain 이 있을 때만 한다
- 미래 확장은 issue 와 문서에 남기고 현재 코드에는 현재 요구만 넣는다
- 가능하면 추상화 추가보다 코드 삭제와 단순화를 먼저 본다

## Refactor Scope Rule

refactor 범위는 현재 slice 를 기준으로 제한한다.

- local rename, extraction, owner 이동은 허용한다
- 같은 use case 안의 read/write contract 정리는 허용한다
- 다른 phase 나 다른 domain 으로 번지는 공통화는 기본 금지한다
- 현재 작업과 직접 관계없는 대규모 파일 재배치는 별도 issue 로 분리한다

한 줄 기준:

- “이 변경이 현재 작업을 더 안전하게 닫게 만드는가”에 답하지 못하면 범위를 줄인다

## Codebase Checks

- screen helper 에 숨은 domain rule 은 `entities/*/models/policies` 로 올린다
- `page.tsx` 나 client component 안의 raw persistence 호출은 repository 또는 mutation 으로 내린다
- query 와 mutation 에 UI component 를 만들지 않는다
- root client component 는 orchestration state 위주로 두고 form state 는 leaf 로 내린다
- 이름은 현재 도메인 의미를 드러내야 한다
- `read*Repository`, `write*Repository`, `use*ScreenState`, `*PageClient` 같은 기존 rail 을 우선 따른다
- owner 가 이동하면 테스트도 가장 가까운 owner 로 같이 이동한다

## Docs Alignment Rule

refactor 가 SSOT 에 영향을 주면 문서도 같은 변경 안에서 같이 갱신한다.

기본 매핑:

- route-to-screen 변경: [Codebase Architecture](./codebase-architecture.md)
- 폴더 책임, import 방향 변경: [Folder Hierarchy](./folder-hierarchy.md), [FSD Profile](./fsd-profile.md)
- 데이터 모델, 권한, 상태 전이 변경: [Architecture Spec](./architecture-spec.md)
- 구현 순서, slice 전략 변경: [Execution Plan](./execution-plan.md)
- 범위와 shipping 결정 변경: [Build Plan](./build-plan.md)

문서 양식 규칙:

- `docs/plans/*` 문서는 제목, 상단 reference block, `Status`, `Date`, `Purpose` 를 기본으로 맞춘다
- 새 SSOT 문서는 다른 문서에서 찾을 수 있게 링크를 건다

## Refactor Checklist

- 보호 테스트가 있는가
- 지금 green 인가
- 현재 pain 이 실제로 설명 가능한가
- layer owner 가 더 명확해졌는가
- abstraction 이 개념 수를 줄였는가
- future-proofing 명분으로 구조를 키우지 않았는가
- 필요하면 관련 SSOT 문서도 같이 갱신했는가

## Current Rule

- refactor 는 green 이후에만 한다
- SOLID 는 구조 점검 기준이지 abstraction 증식 규칙이 아니다
- over-engineering 은 항상 기본 가정으로 경계한다
- 현재 slice 를 더 안전하게 닫는 최소 정리만 한다
- 가능하면 추상화 추가보다 삭제와 단순화를 먼저 한다
- SSOT 에 닿는 refactor 는 코드와 문서를 함께 바꾼다
