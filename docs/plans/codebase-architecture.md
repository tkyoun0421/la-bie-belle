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

Non-route support folders under `src/app` and non-entry support folders under `src/flows` must use a private `_` prefix, for example `_providers/`, `_components/`, `_tests/`.

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
- `/events/[eventId]` -> `flows/events/detail`
- `/replacements` -> `flows/replacements`
- `/check-in` -> `flows/check-in`
- `/pay` -> `flows/pay`
- `/admin` -> `flows/admin/dashboard`
- `/admin/requests` -> `flows/admin/requests`
- `/admin/users` -> `flows/admin/users`
- `/admin/positions` -> `flows/admin/positions`
- `/admin/templates` -> `flows/admin/templates`
- `/admin/payroll-rules` -> `flows/admin/payroll-rules`

## Canonical Module Shape

### Flows

```text
src/flows/admin/templates/
  AdminTemplatesScreen.tsx
  _components/
  _tests/
```

### Queries And Mutations

```text
src/queries/users/
  hooks/
  models/
  tests/

src/mutations/replacements/
  actions/
  hooks/
  models/
  tests/
```

- 도메인 폴더 아래에 `actions`, `hooks`, `models`, `tests`를 둔다.
- 유스케이스는 `approve-replacement/` 같은 폴더가 아니라 파일명으로 구분한다.
- UI는 `flows/*/_components`에서 조합한다.
- 예:
  - `queries/events/models/repositories/eventTemplateRepository.ts`
  - `queries/users/models/services/getMyProfile.ts`
  - `queries/events/models/services/fetchEventTemplates.ts`
  - `mutations/events/actions/createEventTemplate.ts`
  - `mutations/replacements/actions/approveReplacement.ts`
  - `mutations/events/hooks/useCreateEventTemplateMutation.ts`
- `queries/models/{constants,mappers,repositories,schemas,types}`는 same-domain pure-read core다.
- `mutations`는 같은 도메인의 query core만 import할 수 있다.

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

- ESLint가 아래 FSD 경계를 강제한다.
- `shared` -> `app`, `flows`, `queries`, `mutations` import 금지
- `queries` -> `app`, `flows`, `mutations` import 금지
- `queries` -> 같은 레이어 안에서 다른 도메인 import 금지
- `query core` -> `queries/hooks`, `queries/models/services`, `queries/tests` import 금지
- `mutations` -> `app`, `flows` import 금지
- `mutations` -> 같은 도메인의 query core만 import 허용
- `mutations` -> `queries/hooks`, `queries/models/services`, `queries/tests`, 다른 도메인 query core import 금지
- `flows` -> `app` import 금지
- `app`, `shared`를 제외한 각 레이어 -> 같은 레이어 안에서 다른 도메인 import 금지

- `app`은 top layer로서 route/page/layout/provider 성격에 맞게 `flows`, `queries`, `mutations`, `shared`를 import할 수 있다.
- `flows`는 여러 `queries`, `mutations`, `shared`를 조합할 수 있다.
- `app`, `shared`를 제외한 같은 레이어 내부의 cross-domain import는 lint로 막는다.
- 재사용이 반복되면 `shared`로 올리거나 책임을 다시 나눈다.
- 사용자 세션 정보는 `shared/lib/auth` 같은 cross-cutting concern으로 처리한다.
- 실제 사용자 도메인 데이터는 `queries/users/*`에서만 읽는다.
- `shared`는 상위 레이어를 import하지 않는다.
- barrel file `index.ts`는 사용하지 않는다.
- 프로젝트 내부 소스 import는 모두 `#/*` 절대 경로를 사용한다.
- `./`, `../` 기반 상대 경로 import는 내부 소스 코드에서 사용하지 않는다.
- route 파일과 UI 컴포넌트에서 DB를 직접 호출하지 않는다.

## Rendering And Data Flow

1. 각 route는 server component로 시작한다.
2. page는 필요한 `queries/*/models/repositories/*`로 서버 데이터를 읽고 hydration seed를 만든다.
3. page는 대응하는 `flows/*`를 렌더한다.
4. `flows/*`는 server shell로 유지하고, 꼭 필요한 client island만 `_components`에서 렌더한다.
5. 상태 변경은 `mutations/*/actions/*.ts`로 들어가고, same-domain `queries/*/models/repositories/*`를 통해 읽기/쓰기를 마무리한다.
6. TanStack Query hook과 React 전용 wiring은 해당 도메인의 `hooks/`에 둔다.
7. 화면 전용 UI는 `flows/*/_components`로 모은다.
8. `flows/_hooks`는 기본 구조가 아니라 예외 구조다.

## Naming

- 폴더 이름은 `kebab-case`
- React 컴포넌트 파일은 `PascalCase.tsx`
- 일반 파일은 `camelCase.ts` 또는 `camelCase.tsx`
- hook 파일은 `useXxx.ts` 또는 `useXxx.tsx`
- test 파일은 `camelCase.test.ts` 또는 `camelCase.test.tsx`
- query core repository 읽기 함수는 `read*`
- query transport 함수는 `fetch*`
- mutation 폴더는 `create-*`, `assign-*`, `approve-*`, `request-*`, `close-*`
- 내부 소스 import는 `#/* -> src/*` alias를 사용한다
- Next.js 예약 파일은 `page.tsx`, `layout.tsx`, `route.ts` 같은 framework naming을 그대로 쓴다

## State Management Policy

- 서버 데이터의 source of truth는 `TanStack Query` 또는 server render 결과다.
- 서버 데이터는 server route에서 `queries/*/models/repositories/*`로 읽고, client에서는 hydration된 query cache를 기준으로 본다.
- client-side server state는 `TanStack Query`로 관리한다.
- polling과 cache invalidation은 `TanStack Query` 기준으로 구현한다.
- UI 로컬 상태는 기본적으로 React built-in state와 domain hooks로 관리한다.
- URL에 남아야 하는 상태만 search params로 올린다.
- query hook은 `queries/*/hooks`에 둔다.
- mutation 관련 form/edit state는 `mutations/*/hooks`가 owner가 된다.
- 별도 global client store는 정말 shared ephemeral state가 생길 때만 다시 검토한다.

## Test Placement

```text
src/flows/**/_tests/
src/queries/**/tests/
src/mutations/**/tests/
```

- 테스트는 가능한 한 도메인 폴더 가까이에 둔다.
- 화면 조합 테스트는 `flows/*/_tests`
- 도메인 읽기/쓰기 테스트는 각 도메인의 `tests`
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
4. 대표 샘플로 `flows/dashboard`, `queries/users`, `mutations/auth` 생성
5. 각 도메인에 필요한 `actions / hooks / models / tests`만 추가
6. root work routes와 `/admin` 레이아웃 분리
7. no-barrel, no-cross-domain, no-relative-internal-import, no-direct-db-from-route 규칙을 lint/리뷰 기준으로 반영
