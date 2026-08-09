# P0-T43 RADIO 적용 기록

- 대상 RADIO: `docs/execution/radio/P0-T43-radio.md` revision 3
- 승인 SHA-256: `ab72e08641407feff4a8f47072f0efeca9b7adc6192e5d69bb10510811d092e6`
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

## 도구 사용에서 남길 것

번들 기준선을 재려고 `git stash -u`를 썼는데 병렬 세션이 작업 중이던 P3-T03 문서 4개까지 함께 스태시에 들어갔다. `pop` 후 양쪽 변경이 모두 살아 있음을 대조로 확인했으나, 약 1분간 그 파일들이 디스크에서 사라진 창이 있었다. 기준선 비교는 별도 워크트리나 임시 클론에서 해야 한다.
