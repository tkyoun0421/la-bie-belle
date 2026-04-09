# Stack Spec: 웨딩홀 근무 운영 PWA

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-09

## Purpose
이 문서는 프레임워크, 런타임, 라이브러리 선택의 source of truth다.

중요한 원칙은 두 가지다.
- 초반 구조를 바꾸는 선택은 `Phase 0` 전에 잠근다
- UI 보조 라이브러리처럼 국소적인 선택은 해당 slice가 처음 필요해질 때 정한다

## Decision Rule
- 플랫폼과 기존 스택으로 충분하면 새 라이브러리를 추가하지 않는다
- 같은 문제에 라이브러리를 여러 개 두지 않는다
- 한 번 잠근 선택은 이 문서에 바로 기록한다
- 아직 쓰지 않는 문제의 라이브러리는 미리 고르지 않는다

## Phase 0 Baseline
아래 선택은 `Phase 0` 전에 잠근다.

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js App Router | 서버 중심 구조와 route/flow 분리에 맞다 |
| Language | TypeScript | 도메인 모델과 schema 공유가 필요하다 |
| Backend | Supabase | Auth, Postgres, RLS 기준 설계와 맞다 |
| Database | Postgres | 현재 데이터 모델과 제약 조건의 기준이다 |
| Auth direction | Google sign-in | 제품 플랜에서 이미 잠겨 있다 |
| Package manager | pnpm | 새 프로젝트 기준에서 빠르고 단순한 boring default다 |
| Node version | Node.js 24 LTS | 현재 Active LTS이고 Next.js 요구사항보다 높다 |
| Lint | ESLint flat config | import 경계와 구조 규칙을 강제하기 쉽다 |
| Format | Prettier | 포맷팅을 lint와 분리해서 단순하게 유지한다 |
| Styling | Tailwind CSS v4 + shadcn/ui + CSS variables | DESIGN 방향과 가장 잘 맞고 Next/App Router 기본 흐름과도 잘 맞다 |
| Forms | Server Action-first form + `useActionState` | App Router 구조와 잘 맞고 초반 복잡도를 낮춘다 |
| Validation | Zod 4 | form, mutation, env schema를 한 방식으로 통일할 수 있다 |
| Date/time | date-fns | 가볍고 함수형이며 행사 시간 계산 범위에 충분하다 |
| Env loading | Next.js built-in `.env*` loading | 프레임워크 기본 기능으로 충분하다 |
| Env validation | `src/shared/config/env.ts` + Zod parse | 추가 env 라이브러리 없이 타입과 검증을 확보한다 |
| Testing | Vitest + Playwright | 이미 제품 플랜에서 잠겼다 |
| Internal source import | `#/* -> src/*` | 코드베이스 import 규칙과 일치한다 |

## Implementation Note
- `packageManager` 필드는 `package.json` 생성 시 `pnpm` 기준으로 기록한다
- Node 기준 파일은 bootstrap 때 `.nvmrc`로 고정한다
- ESLint는 structure rule까지 포함하고, Prettier는 포맷팅만 담당한다
- 폼은 기본적으로 server action을 직접 호출하고, Zod schema로 검증한다
- React Hook Form은 기본 스택에 넣지 않는다
- env는 `NEXT_PUBLIC_*`만 클라이언트로 노출한다
- Supabase Next.js 연동은 `@supabase/supabase-js`와 `@supabase/ssr` 조합을 기준으로 한다

## Decide When First Slice Needs It
아래는 실제 slice가 처음 필요해질 때 고르면 된다.

| Concern | First likely slice |
|---|---|
| Toast | 첫 mutation 완료 피드백이 필요할 때 |
| Modal or dialog | 승인/확정/종료 확인 UI가 생길 때 |
| Table or data grid | admin 목록 화면이 커질 때 |
| Date picker | 행사 생성 UI를 실제로 붙일 때 |
| Icons | 공용 UI 컴포넌트를 만들 때 |
| Chart | 대시보드 분석 요소가 필요할 때 |
| Map or geo UI helper | 체크인 위치 UX를 만들 때 |
| Push helper wrapper | 푸시 구독/해제 slice를 만들 때 |

## Update Rule
- 라이브러리를 새로 채택하면 같은 턴에 이 문서를 같이 갱신한다
- 기존 선택을 바꾸면 이유와 migration 영향도 같이 적는다
- 임시 실험 라이브러리는 lock되기 전까지 production stack으로 취급하지 않는다

## Deferred Until Needed
아래는 지금 잠그지 않는다.

- toast
- modal/dialog
- table/grid
- date picker
- icons
- chart
- map/geo UI helper
- push helper wrapper
