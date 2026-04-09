# Codebase Architecture Plan: 웨딩홀 근무 운영 PWA

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Design: [../designs/pwa.md](../designs/pwa.md)  
Status: ACTIVE  
Date: 2026-04-09

## Purpose
이 문서는 실제 코드베이스의 canonical tree와 경계 규칙을 정리한다.  
세부 FSD 규칙은 [FSD Profile](./fsd-profile.md)이 source of truth이고, 이 문서는 그 규칙을 현재 프로젝트 구조에 적용한 결과다.

## Top-Level Layout
```text
src/
  app/
    _providers/
    admin/
    events/
    replacements/
    check-in/
    pay/
    auth/
    api/
  flows/
  mutations/
  queries/
  shared/
    components/
    lib/
    config/
    api/
    models/
    utils/
    types/

supabase/
  migrations/
  seed/

public/
```

## Route Tree
Non-route support folders under `src/app` must use a private `_` prefix, for example `_providers/`.

```text
src/app/
  layout.tsx
  page.tsx
  events/[eventId]/page.tsx
  replacements/page.tsx
  check-in/page.tsx
  pay/page.tsx

  admin/
    layout.tsx
    page.tsx
    requests/page.tsx
    users/page.tsx
    positions/page.tsx
    templates/page.tsx
    payroll-rules/page.tsx

  auth/
    callback/route.ts

  api/
    push/subscribe/route.ts
    push/unsubscribe/route.ts
    health/route.ts
```

## Route To Flow Mapping
- `/` -> `flows/dashboard`
- `/events/[eventId]` -> `flows/event-detail`
- `/replacements` -> `flows/replacements`
- `/check-in` -> `flows/check-in`
- `/pay` -> `flows/pay`
- `/admin` -> `flows/admin-dashboard`
- `/admin/requests` -> `flows/admin-requests`
- `/admin/users` -> `flows/admin-users`
- `/admin/positions` -> `flows/admin-positions`
- `/admin/templates` -> `flows/admin-templates`
- `/admin/payroll-rules` -> `flows/admin-payroll-rules`

## Canonical Module Shape

### Flows
```text
src/flows/dashboard/
  components/
  hooks/
  models/
  tests/
```

### Queries And Mutations
```text
src/queries/users/get-my-profile/
  actions/
  components/
  hooks/
  models/
  tests/

src/mutations/replacements/approve-replacement/
  actions/
  components/
  hooks/
  models/
  tests/
```

### Initial Domains
- `auth`
- `users`
- `events`
- `assignments`
- `replacements`
- `checkins`
- `payroll`
- `workflow`

## Dependency Rules
- `app`은 `flows`와 `shared`만 import한다.
- `flows`는 여러 `queries`, `mutations`, `shared`를 조합할 수 있다.
- `queries`와 `mutations`는 같은 도메인 내부에서만 자유 import를 허용한다.
- `queries`와 `mutations`의 cross-domain import는 기본 금지다.
- 사용자 세션 정보는 `shared/lib/auth` 같은 cross-cutting concern으로 처리한다.
- 실제 사용자 도메인 데이터는 `queries/users/*`에서만 읽는다.
- `shared`는 상위 레이어를 import하지 않는다.
- barrel file `index.ts`는 사용하지 않는다.
- 프로젝트 내부 소스 import는 모두 `#/*` 절대 경로를 사용한다.
- `./`, `../` 기반 상대 경로 import는 내부 소스 코드에서 사용하지 않는다.
- route 파일과 UI 컴포넌트에서 DB를 직접 호출하지 않는다.

## Rendering And Data Flow
1. 각 route는 server component로 시작한다.
2. page는 대응하는 `flows/*`를 렌더한다.
3. `flows/*`는 필요한 `queries/*` 결과와 `mutations/*` action을 조합한다.
4. 상태 변경은 `mutations/*/*/actions/action.ts`로 들어간다.
5. TanStack Query hook과 React 전용 wiring은 해당 유스케이스 또는 flow의 `hooks/`에 둔다.

## Naming
- 폴더 이름은 `kebab-case`
- React 컴포넌트 파일은 `PascalCase.tsx`
- 일반 파일은 `camelCase.ts` 또는 `camelCase.tsx`
- hook 파일은 `useXxx.ts` 또는 `useXxx.tsx`
- test 파일은 `camelCase.test.ts` 또는 `camelCase.test.tsx`
- query 폴더는 `get-*`, `list-*`
- mutation 폴더는 `create-*`, `assign-*`, `approve-*`, `request-*`, `close-*`
- 내부 소스 import는 `#/* -> src/*` alias를 사용한다
- Next.js 예약 파일은 `page.tsx`, `layout.tsx`, `route.ts` 같은 framework naming을 그대로 쓴다

## State Management Policy
- 전역 client store는 `Zustand`만 사용한다.
- `Zustand`는 drawer, filter, selected item, temporary compose state 같은 UI 상태에만 쓴다.
- 서버 데이터의 source of truth는 `TanStack Query` 또는 server render 결과다.
- 서버 데이터는 `flows -> queries` 경로로 읽는다.
- client-side server state는 `TanStack Query`로 관리한다.
- polling과 cache invalidation은 `TanStack Query` 기준으로 구현한다.
- UI 로컬 상태는 컴포넌트 상태, form state, 또는 `Zustand`로 관리한다.
- URL에 남아야 하는 상태만 search params로 올린다.
- query hook은 가능하면 `queries/*/hooks`에 둔다.
- Zustand store는 가능하면 해당 flow 또는 유스케이스 아래 `hooks/`에서 감싼다.

## Test Placement
```text
src/flows/**/tests/
src/queries/**/tests/
src/mutations/**/tests/
```

- 테스트는 가능한 한 유스케이스 가까이에 둔다.
- 화면 조합 테스트는 `flows/*/tests`
- 도메인 읽기/쓰기 테스트는 각 유스케이스의 `tests`
- truly cross-flow E2E가 늘어나면 별도 `e2e/`를 추가한다

## Infra Placement
- DB schema와 index는 `supabase/migrations`
- seed 데이터는 `supabase/seed`
- push helper는 `src/shared/lib/push`
- auth/session helper는 `src/shared/lib/auth`
- geolocation helper는 `src/shared/lib/geo`

## Bootstrap Checklist
1. `src/app`, `src/flows`, `src/mutations`, `src/queries`, `src/shared` 생성
2. `src/shared` 하위 공용 디렉터리 생성
3. `tsconfig`에 `#/* -> ./src/*` path alias 설정
4. 대표 샘플로 `flows/dashboard`, `queries/users/get-my-profile`, `mutations/auth/logout` 생성
5. 각 유스케이스에 필요한 `actions / components / hooks / models / tests`만 추가
6. root work routes와 `/admin` 레이아웃 분리
7. no-barrel, no-cross-domain, no-relative-internal-import, no-direct-db-from-route 규칙을 lint/리뷰 기준으로 반영
