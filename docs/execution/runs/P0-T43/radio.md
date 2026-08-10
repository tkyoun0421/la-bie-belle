# P0-T43 RADIO 적용 기록

- 대상 RADIO: `docs/execution/radio/P0-T43-radio.md` revision 3
- 승인 SHA-256: `7d7b3a6021e26f779cc26dfaf149f123d61f32a309465d1bb0ae0460e8278ef2`
- 개발 착수 시점의 봉인: revision 2 `9cc65ba2a21ad2babf972f0213fbe91d330559589d9aac66ebe6ab00e21d6146`
- 개발 세션 기준 시각: 2026-08-10
- 상태: revision 3의 기술 인수 조건 7건 모두 완료

## 완료한 인수 조건

### 1. 토큰

`globals.css` `@theme`에 `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`, `--duration-stagger: 30ms`, `--spring-stiffness: 400`, `--spring-damping: 30`을 더했다. 기존 duration 3종의 값은 그대로다.

`prefers-reduced-motion: reduce` 블록에 `:root` 규칙을 넣어 시간 계열 토큰 4종을 `0ms`로 덮는다. spring 상수 2종은 시간이 아니라 덮지 않으며, 테스트가 덮지 않음을 단언한다. 기존 전역 `*` 안전망 규칙은 서드파티 애니메이션을 잡기 위해 유지했다.

`--ease-spring`의 오버슈트 계수 1.56은 FOUNDATIONS의 "spring과 튕김을 쓴다"에 맞춘 값이다. spring 상수는 감쇠비 0.75, 고유진동수 20rad/s로 정착 시간이 약 267ms이며 FOUNDATIONS의 시트·전환 대역 220~280ms 안이다.

### 2. 정지 상태 요소

- `dialog`: 오버레이와 콘텐츠에 `data-[state=open]`·`data-[state=closed]` 모션 유틸을 붙였다. keyframes 4종과 `@utility motion-overlay-in/out`·`motion-dialog-in/out`을 `globals.css`에 정의했고 시간·easing은 전부 토큰에서 온다. 오버레이는 테스트가 잡을 수 있도록 `data-slot="dialog-overlay"`를 갖는다.
- `button`·`chip`: `active:scale-[0.97]`, `schedule-row`: `active:scale-[0.99]`. 셋 다 `duration-[var(--duration-feedback)]`과 `ease-[var(--ease-out)]`을 쓴다. 버튼은 `disabled:active:scale-100`으로 비활성 상태에서 눌림 반응을 없앤다.

### 3. 라이브러리 타이밍 조율

두 라이브러리 모두 FOUNDATIONS 대역 밖이었다 — `vaul`은 `[data-vaul-drawer]`에서 `transform .5s`, `sonner`는 `[data-sonner-toast]`에서 `transform 400ms, opacity 400ms, height 400ms`.

`!important` 없이 명시도만 높여 덮었다. `vaul`의 규칙이 0,1,0과 0,2,0이라 `[data-vaul-drawer][data-vaul-drawer-direction][data-state]`와 `[data-vaul-overlay][data-vaul-snap-points][data-state]`(둘 다 0,3,0)로 이겼다. `sonner`는 `[data-sonner-toast]:not([data-swiping="true"])`(0,2,0)로 이기되 스와이프 중 규칙은 건드리지 않는다.

`!important`를 쓰지 않은 이유는 드래그 때문이다. 두 라이브러리 모두 손가락을 따라가는 동안 인라인 스타일이나 `transition: none`을 쓰는데, `!important`로 덮으면 그 즉시 반응이 사라진다. 테스트가 `data-vaul`·`data-sonner` 줄에 `!important`가 없음을 단언한다.

`sonner`가 `height`를 전이시키는 것은 우리 lint가 자체 코드에 금지하는 패턴이지만 라이브러리 내부라 손대지 않았다. 전이 목록을 덮으면 스택 높이 애니메이션이 깨진다.

### 5. lint

`tools/eslint-plugin-project/rules/motion-tokens.mjs` 1종을 만들어 `eslint.config.mjs`에 error로 등록했다. 메시지 2종이다.

- `layoutAnimation`: `transition-all`과 레이아웃 속성을 지정한 `transition-[...]`·`animate-[...]`를 막는다. 판정 대상은 `width`·`height`·`top`·`inset`·`margin`·`padding`·`flex`·`grid-template-*` 등 24종이다.
- `arbitraryMotionValue`: `duration-[...]`·`delay-[...]`는 `var(--duration-*)`만, `ease-[...]`는 `var(--ease-*)`만 통과시킨다. JSX `style`의 `transitionDuration`·`animationTimingFunction` 계열 문자열 리터럴도 같은 기준으로 막는다.

수식어(`hover:`·`md:`·앞뒤 `!`)를 벗겨내고 판정하며, Tailwind 임의값의 `_`는 공백으로 정규화한다. `chip.tsx`의 기존 `duration-[var(--duration-feedback)]` 표기는 통과 케이스로 테스트에 넣었고 `pnpm lint`가 GREEN이다.

### 6. 번들 게이트

`harness/lib/bundle-budget.ts`(순수 측정·판정), `harness/gates/bundle-budget.ts`(진입점), `harness/self-test/bundle-budget.test.ts`(테스트 7건)를 만들고 `pnpm gate:bundle`을 `verify` 체인의 `build` 뒤에 이었다. 상한 초과·산출물 부재·상한 경계(같으면 통과, 1바이트 초과면 차단)를 모두 테스트한다.

상한은 `BUNDLE_BUDGET_BYTES = 420 * 1024`다. 아래 "번들 상한 확정" 참조.

### 4. 탐색 회귀

`tests/e2e/tab-navigation.spec.ts` 4건이다. 하단 탭 4개를 순회하며 각 화면의 제목을 확인하고, `Document.prototype.startViewTransition`을 지운 미지원 환경과 `reducedMotion: "reduce"` 컨텍스트에서 같은 이동을 반복하며, 새 `viewTransition` 날짜 대역에 `CLOSED` 스케줄을 시딩해 달력 셀에서 상세로 들어가는 경로를 확인한다.

날짜 대역은 `tests/e2e/support/work-date-band.ts`에 `viewTransition: { minMonthsAhead: 165, maxMonthsAhead: 196 }`으로 새로 잡아 기존 spec들과 겹치지 않게 했다.

### 7. 회귀

`pnpm test` 1217건, `pnpm harness:self-test` 315건, `pnpm typecheck`, `pnpm lint`, `pnpm build`, e2e 4건이 모두 GREEN이다.

## P0-T45로 분리한 것

### 화면 전환 — React `<ViewTransition>`이 전환을 시작하지 않는다

구현했다가 되돌리고 별도 task로 뗐다(2026-08-10 사용자 결정). 확인한 사실은 다음과 같다.

- 앱의 `react` 19.2.8에는 `ViewTransition`이 없고, Next 16.3.0이 번들하는 `react` 19.3.0-canary에는 있다. `import { ViewTransition } from "react"`가 빌드에 성공하고, `@types/react` 19.2.18의 `canary.d.ts` 109행이 타입을 제공한다. `tsconfig.json`에 `"types": ["node", "react/canary"]`를 넣으면 `pnpm typecheck`가 통과한다.
- 빌드된 클라이언트 청크에 `startViewTransition` 구현이 실린다(1개 청크에서 확인). 테스트 브라우저는 Chrome 151로 `document.startViewTransition`을 지원한다.
- 그런데 `Document.prototype.startViewTransition`을 계수기로 감싸고 하단 탭을 4번 이동해도 **호출이 0회**다. `(tabs)/layout.tsx`에서 `{children}`을 감싸도, 각 페이지 컴포넌트를 감싸도 같다.
- `experimental: { viewTransition: true }`는 Next 16.3.0에서 **인식되지 않는 키**다("Invalid next.config / Unrecognized key"). Next가 함께 배포하는 `01-app/02-guides/view-transitions.md` 44행도 "no configuration"이라고 적는다. 설치된 `vercel-react-view-transitions` 스킬의 `nextjs.md`는 Next 15 기준이라 이 버전에 맞지 않는다.

`shouldStartViewTransition`을 React가 false로 판정하는 이유는 더 파야 나온다. 남은 후보는 RSC 경계에서의 `<ViewTransition>` 처리, `default` prop 기본값, Next 라우터가 전이를 여는 조건이다. 어느 쪽이든 승인된 변경 허용 경로 밖(`next.config.ts`)이거나 새 기술 결정이라 임의로 정하지 않았다. revision 3에서 이 인수 조건을 "탐색 회귀"로 바꾸고 전환 자체는 P0-T45가 가져갔다.

되돌린 범위: `(tabs)/layout.tsx`, `(tabs)/page.tsx`, `(tabs)/pay/page.tsx`, `schedule/[id]/page.tsx`의 래핑과 `tsconfig.json`의 canary 타입.

남긴 것: `tests/e2e/tab-navigation.spec.ts` 4건. 탭 4개 이동, View Transitions 미지원 환경, reduced-motion, 달력 셀→상세 진입을 회귀로 덮는다. 전환이 붙는 시점에 호출 계수 단언을 얹을 자리다.

## 번들 상한 확정

RADIO 인수 조건 6의 380KB와 ADR-0015의 400KB가 둘 다 현실보다 낮았다. 제 변경을 뺀 HEAD 상태에서 정적 청크 gzip 합계가 **403KB**다. 2026-08-09에 기록한 367KB 기준선이 그 뒤 들어온 코드로 낡았다.

420KB로 확정했다(2026-08-10 사용자 결정). `BUNDLE_BUDGET_BYTES = 420 * 1024`, RADIO 인수 조건 6, ADR-0015 결정 3, `00-foundation.md`를 모두 이 값으로 맞췄다. `motion` 27KB가 들어오는 P0-T44는 실측 위에서 다시 정한다.

## 범위 밖에서 발견하고 고친 것

**`tests/e2e/global-setup.ts`의 `listUsers()` 페이지네이션 결함.** `listUsers()`가 기본 50명만 돌려주는데 로컬 Supabase에 사용자가 52명 쌓여 고정 픽스처 `e2e-p1-t01`이 1페이지 밖으로 밀렸다. 없다고 판정해 생성을 시도하고 "already registered"로 죽어 **e2e 전체가 막혔다.** `ensureTestUser`와 `ensureSuperAdminFixtureUser` 둘 다 같은 결함이었다.

`findUserByEmail`이 200명 단위로 페이지를 넘기며 찾도록 고쳤다. 검증을 진행할 수 없어 고쳤고 조용히 포함하지 않기 위해 여기 남긴다. CI는 DB가 매번 새로 서므로 드러나지 않던 결함이다.

## RADIO와 어긋났던 경로

RADIO revision 2의 변경 허용 경로가 `harness/tests/**`를 적었으나 저장소의 하네스 테스트 디렉터리는 `harness/self-test/`다. 존재하지 않는 경로여서 실제 디렉터리에 테스트를 넣었고, revision 3에서 경로 표기를 실제에 맞게 고쳤다.

## 검증 수정 라운드 (2026-08-10)

교차 검증이 확정 발견 11건을 냈고 사용자 결정으로 수정 범위를 `high` 2건 + `medium` 7건으로 넓혔다(기본 범위는 `critical`·`high`). `low` 2건은 backlog에 남긴다. 확정 발견의 정본은 `docs/execution/reviews/P0-T43-review.json`이다.

### 두 결함의 원인은 같다 — Tailwind v4의 개별 변형 속성

`translate`·`scale`·`rotate`는 Tailwind v4에서 `transform` 축약이 아니라 **CSS 개별 속성**으로 컴파일된다. 빌드 산출물에서 `.-translate-x-1\/2`는 `translate:var(--tw-translate-x) var(--tw-translate-y)`, `.scale-\[0\.97\]:active`는 `scale:.97`이다.

- **다이얼로그(F-01)**: 중앙 정렬 유틸이 `translate` 속성을 쓰는데 keyframes가 `transform: translate(-50%,-50%) scale(...)`을 써서 둘이 **덮는 게 아니라 합성**됐다. 250ms 동안 자기 크기만큼 좌상단으로 밀렸다가 끝에 중앙으로 튄다. keyframes에서 이동을 빼고 `transform: scale(...)`만 남겨 위치는 유틸이 단독으로 잡는다.
- **버튼·칩(F-02)**: `transition-colors`와 `transition-transform`이 같은 `transition-property`를 같은 명시도로 선언해 뒤에 오는 하나만 남았다. 두 컴포넌트 다 이전부터 색 전이를 쓰고 있었으므로 회귀다. `transition-[color,background-color,border-color,scale]` 하나로 합쳤다. `scale`을 목록에 넣은 이유가 위의 개별 속성이다.

재발 방지로 lint에 `conflictingTransition`을 더했다. 같은 수식어 그룹에서 `transition-property`를 정하는 유틸이 둘 이상이면 error이며, 실제로 이 규칙이 `button.tsx`·`chip.tsx`의 위반을 잡아 수정을 이끌었다.

### 나머지 수정

- **sonner 명시도(F-03)**: 기존 (0,2,0) 규칙은 sonner의 제거 상태 규칙 (0,5,0)과 스와이프 아웃 규칙 (0,3,0)을 이기지 못했다. `[data-sonner-toast][data-removed][data-front][data-swipe-out][data-expanded]:not([data-swiping="true"])`(0,6,0)와 `[data-sonner-toast][data-swipe-out="true"][data-y-position][data-styled]`(0,4,0)를 더했다. `!important`는 여전히 없고 `data-swiping` 규칙은 그대로 둔다.
- **lint 강제 범위(F-04)**: `DEV-TOKEN-01`이 선언한 "시간·easing 숫자를 코드에 적지 않는다"보다 규칙이 좁았다. `duration-<숫자>`·`delay-<숫자>`와 `@theme`이 소유하지 않는 easing 유틸 4종을 차단 대상에 넣었다. `--ease-out`·`--ease-spring`은 `@theme`이 정의하므로 `ease-out`·`ease-spring`은 통과한다.
- **계산된 스타일 층(F-05)**: 모션 단언이 전부 문자열 수준이라 위 두 결함이 1217건 GREEN을 통과했다. `tests/e2e/motion.spec.ts`를 새로 만들어 실제 브라우저의 `getComputedStyle`과 `getAnimations()`로 본다. 다이얼로그는 근무자 화면에 없어 Content의 실제 클래스 문자열을 가진 요소를 붙여 애니메이션을 일시정지하고 0~250ms 다섯 시점의 박스 중심이 뷰포트 중심에서 1px 이내인지 잰다. **이 테스트가 수정 전 keyframes에서 실제로 실패하는 것을 확인했다**(되돌려 빌드 → 실패, 복구 → 통과). `tab-navigation.spec.ts`의 이름 없는 h1 단언도 `모집 마감`으로 좁혔다.
- **번들 게이트(F-06)**: `measureStaticChunks`가 하위 디렉터리까지 재귀한다. 현재 Turbopack 산출물은 평면이지만 구조가 바뀌면 상한을 조용히 통과하는 방향으로 실패했다.
- **위험 매트릭스(F-07)**: RADIO를 고쳐 재봉인하는 대신 비어 있던 칸 두 개를 테스트로 채웠다 — 칩 연속 5회 탭에서 `aria-pressed`가 매번 뒤집히는지, 바텀시트와 스낵바를 함께 띄웠을 때 두 라이브러리의 타이밍 대상 선택자가 같은 요소에서 겹치지 않는지.
- **e2e 사용자 정리(F-09)**: `tests/e2e/support/worker-session.ts`로 생성·삭제를 모으고 두 spec이 `test.afterAll`에서 지운다(`profiles`·`roles`는 `on delete cascade`). 스케줄 행은 `schedules_reject_delete` 트리거가 append-only를 강제하므로 지울 수 없어, 삽입을 23505에서 기존 행 재사용으로 바꿔 반복 실행이 깨지지 않게 했다.

### 재확인에서 나온 것 (수정 라운드 2)

재확인 자체가 새 발견 3건을 냈고 양쪽 인정으로 확정됐다. `medium` 2건을 이어서 고쳤다.

- **probe 클래스 드리프트(N-01)**: `motion.spec.ts`의 다이얼로그 클래스 상수가 `dialog.tsx`를 손으로 복사한 것이라 이미 어긋나 있었다 — `data-[state=closed]:motion-dialog-out`이 빠져 이탈 애니메이션이 계산된 스타일 층에서 한 번도 검증되지 않았다. 상수를 맞추고 중앙 유지 테스트를 `open`·`closed` 두 상태로 돌린다. 드리프트는 `dialog.tsx` 원문에서 Content의 `className` 선언을 정규식으로 뽑아 **정확 비교**하는 테스트가 막는다. 처음에는 `toContain`으로 썼는데 리뷰어가 "뒤에 클래스를 붙이면 부분 문자열이 살아남는다"고 반박해 정확 비교로 바꿨고, `origin-center`를 덧붙여 실제로 실패하는 것을 확인했다.
- **동시 표시 타이밍(N-02)**: jsdom 테스트가 DOM 배타성만 봐서 "타이밍 충돌 없음"을 검증하지 못했다. `/pay`에서 리허설 기록을 삭제해 스낵바를 띄우고 그 상태로 바텀시트를 열어, 두 요소의 계산된 `transitionDuration`이 중복 제거 후 각각 `["0.25s"]`인지 잰다. sonner 기본 규칙이 전이 대상 4종에 서로 다른 시간을 주므로 중복 제거 결과가 한 값이라는 것은 `box-shadow` 200ms까지 토큰으로 통일됐다는 뜻이다.

`low` 2건은 backlog로 넘긴다 — sonner 자식 요소(`> *`)의 opacity 400ms가 토큰 밖인 것, 동시 표시 e2e가 스낵바 기본 지속 시간 4초 안에 두 단계를 끝내야 하는 시간 창에 기대는 것. 후자는 `src/views/**`가 이 task의 변경 허용 경로 밖이라 호출부에 duration을 넘길 수 없다.

### 수정 후 상태

`pnpm test` 1234건, `pnpm harness:self-test` 316건, `pnpm typecheck`·`pnpm lint`·`pnpm build`·`pnpm gate:all`·`pnpm gate:bundle`, e2e 6건이 모두 GREEN이다.

`e2e-transition-worker` 접두사의 사용자 14명은 수정 전 실행이 남긴 것으로 로컬 DB에 그대로 있다. 사용자 데이터라 임의로 지우지 않았고, `global-setup.ts`의 페이지네이션 수정 덕에 실행에는 지장이 없다.

## 도구 사용에서 남길 것

번들 기준선을 재려고 `git stash -u`를 썼는데 병렬 세션이 작업 중이던 P3-T03 문서 4개까지 함께 스태시에 들어갔다. `pop` 후 양쪽 변경이 모두 살아 있음을 대조로 확인했으나, 약 1분간 그 파일들이 디스크에서 사라진 창이 있었다. 기준선 비교는 별도 워크트리나 임시 클론에서 해야 한다.
