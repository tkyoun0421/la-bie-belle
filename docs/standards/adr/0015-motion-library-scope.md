# ADR-0015: 인터랙션 라이브러리는 `motion`의 `LazyMotion` 범위로 제한한다

- 상태: Accepted
- 날짜: 2026-08-10
- 승인: user, 2026-08-10
- 관련 문서: [시스템 구조](../ARCHITECTURE.md), [Foundations 모션](../../product/design/FOUNDATIONS.md), [P0-T43 RADIO](../../execution/radio/P0-T43-radio.md), [P0-T44 RADIO](../../execution/radio/P0-T44-radio.md)

## Context

[ADR-0001](0001-nextjs-supabase-vercel.md)이 정한 스택에 애니메이션 라이브러리는 없다. P0-T43까지의 움직임은 CSS 전환, `vaul`의 시트 드래그, `sonner`의 스낵바, React `<ViewTransition>`으로 처리했고 새 의존성이 없다.

P0-T44의 네 효과 중 둘은 제스처다. 목록 상단을 당겨 새로고침하는 동작과 알림 행을 옆으로 밀어 읽음 처리하는 동작은 포인터 추적, 고무줄 저항, 관성, 방향 확정, 취소 복귀를 요구한다. `vaul`은 시트 전용이라 재사용할 수 없고, 직접 구현하면 이 판정이 화면마다 흩어진다.

번들이 제약이다. 이 결정을 내릴 때는 P0-T43이 세운 상한 380KB와 기준선 367KB를 근거로 여유를 13KB로 봤다. 그 기준선은 뒤에 낡은 값으로 드러났지만(아래 결정 3), 여유가 좁아 도입 여부보다 **어느 진입점까지 여느냐**가 실제 결정이라는 판단은 그대로다.

2026-08-10에 `motion` 13.0.0을 esbuild로 번들해 react를 external로 두고 gzip을 측정했다.

| 진입점 | gzip | 제스처 |
| --- | ---: | --- |
| `motion/mini` — `animate()` | 3KB | 없음 |
| `motion/react-mini` — `useAnimate()` | 3KB | 없음 |
| `motion/react` — `LazyMotion` + `domAnimation` + `m` | 27KB | 있음 |
| `motion/react` — `motion` + `AnimatePresence` | 42KB | 있음 |

제스처를 얻는 최소 비용이 27KB다. mini 계열은 Web Animations API 위의 얇은 래퍼라 드래그를 제공하지 않는다.

## Decision

### 1. `motion`을 의존성으로 채택하되 `LazyMotion` 범위로 제한한다

`motion/react`에서 `LazyMotion`, `domAnimation`, `m`, 그리고 값 보간에 필요한 훅만 사용한다. `motion.*` 컴포넌트와 `AnimatePresence`는 쓰지 않는다.

제한은 문서가 아니라 코드로 강제한다. 프로바이더에 `strict`를 켜면 `motion.div` 사용 시 런타임 오류가 나고 `m.div`만 통과한다.

```tsx
<LazyMotion strict features={() => import("motion/react").then((mod) => mod.domAnimation)}>
```

feature 번들은 동적 import로 지연한다. 게이트가 재는 정적 청크 합계는 같지만 첫 화면의 파싱 비용이 빠진다.

### 2. 프로바이더는 `(protected)` 범위에만 둔다

로그인, 온보딩, 상태 안내 화면은 인터랙션 대상이 아니다. 인증 전 화면에 27KB를 싣지 않는다.

### 3. 번들 상한은 P0-T44 시점에 다시 정한다

이 ADR을 쓸 때는 기준선을 367KB로 알고 400KB를 제안했으나, P0-T43 개발 중 실측에서 그 기준선이 낡았음이 드러났다. 2026-08-10 실측은 403KB이고 P0-T43이 상한을 420KB로 확정했다.

`motion` 27KB가 들어오면 약 430KB가 되므로 P0-T44가 상한을 다시 올려야 한다. 그 숫자는 P0-T44 개발 시점의 실측 위에서 정한다. 상한을 올리는 일이 이 ADR을 다시 여는 절차라는 점은 그대로다.

### 4. 라이브러리를 부르지 않아도 되는 효과는 CSS로 남긴다

순차 등장은 `animation-delay`로 처리한다. 메인 스레드를 쓰지 않고 번들이 늘지 않는다. `motion`은 CSS로 표현할 수 없는 동작에만 쓴다.

### 5. 모션 상수의 정본은 `globals.css`이며 JS는 이를 읽어 쓴다

[Foundations](../../product/design/FOUNDATIONS.md)가 시간·easing·spring 상수의 정본을 `globals.css`로 정했다. `motion`의 spring은 CSS 변수를 받지 못하고 숫자만 받으므로, 프로바이더가 마운트 시 `getComputedStyle`로 한 번 읽어 컨텍스트로 내려준다. 상수를 TS에 따로 두어 정본을 둘로 가르지 않는다.

## Consequences

- 애니메이션 제스처의 판정이 라이브러리의 검증된 코드로 들어온다. 방향 확정과 임계값처럼 제품 규칙에 해당하는 부분만 `model` 세그먼트의 순수 함수로 남는다.
- `strict` 때문에 `motion.*`를 쓰는 코드는 개발 중 즉시 깨진다. 리뷰가 놓쳐도 실행이 막는다.
- P0-T43이 만든 lint 규칙은 Tailwind 클래스를 검사하므로 JS 애니메이션의 속성 제한을 강제하지 못한다. `m.*` 사용처가 좁게 유지되는 동안은 리뷰가 담당한다. 사용처가 늘면 규칙 확장을 새 task로 제안한다.
- 새 UI 의존성은 사실상 이 ADR을 다시 여는 일이 된다. 번들 상한은 실측 위에서만 올린다.
- `motion`이 유지보수를 멈추면 제스처 두 곳과 값 보간 한 곳을 직접 구현으로 되돌려야 한다. 되돌림 범위가 좁도록 사용처를 `shared/ui`와 `widgets`의 지정된 모듈로 한정한다.

## 개정 이력

| 날짜 | 변경 | 승인 |
| --- | --- | --- |
| 2026-08-10 | 최초 채택. `motion` 13.0.0을 `LazyMotion` 범위로 도입한다. 번들 상한은 P0-T43이 실측 403KB 위에서 420KB로 확정했고, `motion` 도입분은 P0-T44가 다시 정한다. | user, 2026-08-10 |
