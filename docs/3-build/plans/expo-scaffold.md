---
sources:
  - ../../2-design/adr/ADR-011-expo-native-app.md
  - ../../2-design/system/architecture.md#경계-하나
  - ../../2-design/system/architecture.md#데이터에-닿는-코드
  - ../../2-design/system/architecture.md#세션을-드는-자리
  - ../../2-design/system/navigation.md#앱을-열면
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/navigation.md#세-층
  - ../../2-design/system/navigation.md#뒤로
  - ../../2-design/system/navigation.md#알림을-누르면
  - ../../2-design/system/navigation.md#종이-qr을-찍으면
  - ../../2-design/system/runtime.md#캐시-두-계층
  - ../../2-design/system/runtime.md#서버-시각
  - ../../2-design/system/runtime.md#업무-상수
  - ../../2-design/design-system/tokens.md#서체-연결
---

# Expo 골격을 세운다 — 구현 계획

## 입력 명세·기준

정본은 [ADR-011](../../2-design/adr/ADR-011-expo-native-app.md)이다. 가는 곳이 Expo(Expo Router) + NativeWind + 직접 만든 조각, Jest, 세션은 기기 저장소, 배포는 EAS다. 구조 요구는 [architecture.md](../../2-design/system/architecture.md#경계-하나)와 [navigation.md](../../2-design/system/navigation.md#경로), 서체는 [tokens.md](../../2-design/design-system/tokens.md#서체-연결)에 있다.

**이 task는 화면을 안 만든다.** 앱이 뜨고, 구글로 로그인하고, 세션이 기기에 남고, 탭 넷이 서고, 토큰과 서체가 붙는 데까지다. 데이터에 닿는 코드도 없다 — 표가 아직 없어서 `dals`가 부를 것이 없다. 화면 task가 전부 이 골격을 딛는다.

### 바깥이 정한 값

조사로 확인한 넷이 골격의 모양을 정했다. 공식 문서가 근거다.

- **Expo SDK 57**이 React Native 0.86과 React 19.2.3을 묶는다
- **NativeWind는 v5를 쓰고 Tailwind 4를 지킨다.** v5는 release candidate고(`5.0.0-rc.0`, 2026-09-13) 문서가 아직 프로덕션 권장을 안 하지만, Expo SDK 57을 대상으로 서 있고 릴리스 계획이 「RC 기간에는 API 변경 없이 버그 수정만, 약 2주 뒤 승격」이다. Tailwind 3으로 내렸다가 다시 올라오면 생성기와 대비 검증과 lint 테스트를 두 번 고치게 된다
- **Tailwind 4의 성능 이득은 CSS를 만드는 시간이다.** 공식 숫자가 full build 378ms→100ms, incremental 44ms→5ms다. NativeWind는 Tailwind를 빌드 때 돌리니 이 이득은 개발 중 리로드에 남고 앱이 도는 속도와는 무관하다. `@property`와 cascade layers는 브라우저 CSS 엔진 이야기라 여기서는 자리가 없다
- **React Native 색 파서가 `oklch()`를 안 받는다.** 받는 것은 RGB·HSL·HWB·color int·이름 있는 색 다섯이다. 지금 팔레트는 전부 OKLCH다 — v5가 빌드 때 바꿔 내는지 아니면 생성기가 해야 하는지가 AC-03의 첫 확인이다
- **NativeWind 문서에 `before:`·`after:` variant가 없다.** 지원한다고도 안 한다고도 안 적는다. 닿는 면을 넓히는 공식 수단은 `Pressable`의 `hitSlop`이고 문서가 「Sets additional distance outside of element in which a press can be detected」라 적는다
- **`expo-secure-store`의 값 한도가 2048바이트**고 Android·iOS만 지원한다. Supabase 세션은 그보다 커서 실무 패턴이 갈린다 — 열쇠만 SecureStore에 두고 암호화한 본문은 `@react-native-async-storage/async-storage`에 둔다
- **테마 전환은 `vars()`와 `useColorScheme()`이다.** `data-theme` 속성으로 가르는 길은 문서에 없다

### 저장소 현황

`src/`에 Next 코드가 살아 있고 웹에 묶인 파일이 열둘이다.

- `next/headers`를 쓰는 셋 — `src/app/login/actions.ts`, `src/shared/lib/create-supabase-server-client.ts`, `src/shared/lib/create-supabase-request-client.ts`
- `next/server`를 쓰는 셋 — `src/app/auth/callback/route.ts`, `src/app/auth/logout/route.ts`, `src/proxy.ts`
- `next/navigation`을 쓰는 하나 — `src/features/auth/use-auth-gate.ts`
- `'use client'` 넷 — `src/app/providers.tsx`, `src/features/auth/ui/auth-gate.tsx`, `src/screens/pending/ui/pending-screen.tsx`, `src/screens/login/ui/login-screen.tsx`
- 브라우저 API 둘 — `src/screens/pending/ui/pending-screen.tsx:60`의 `document.documentElement`, `src/screens/pending/model/notification-prompt.ts:28`의 `window.Notification`

프레임워크를 안 타는 것은 그대로 간다 — `handle-auth-callback.ts`, `resolve-auth-destination.ts`, `read-supabase-env.ts`, `get-current-user.ts`, `features/auth/google-photo-of.ts`, `entities/profile/dals/` 둘이다.

설정은 이렇다. Tailwind 4라 config 파일이 없고 토큰이 `src/app/globals.css`의 `:root`에 OKLCH로 깔린다 — `pnpm tokens:css`(`scripts/generate-globals-css.mts`)가 그것을 만든다. `tsconfig.json`의 alias가 `@/*` → `./src/*`, `@tests/*`, `@scripts/*` 셋이다. `vitest.config.ts`가 unit과 integration 두 project를 든다. `playwright.config.ts`와 e2e spec 여덟이 있다.

테스트는 `tests/lint/` 34개와 `tests/e2e/` 여덟과 `tests/integration/` 지원 둘이다. lint 중 둘이 Tailwind를 실제로 돌린다 — `dark-variant-compiles.test.ts`가 `@tailwindcss/postcss`로 `globals.css`를 컴파일해 `data-theme` 갈래를 보고, `tailwind-default-palette.test.ts`가 ESLint 규칙을 돌린다.

확인한 코드와 Git 기준점 — `package.json`·`vitest.config.ts`·`src/app/globals.css`가 `552dfed`.

## 완료 조건

### AC-01

**Expo 프로젝트가 선다.**

- SDK 57로 앱이 iOS 시뮬레이터와 Android 에뮬레이터에서 뜬다
- Expo Router를 쓰고 라우트 파일은 `src/app/` 아래다 — FSD의 `app` 층이 그 자리였고 ADR-011이 「`.ts`와 `.tsx`의 경계는 그대로다」라 정했다
- `tsconfig.json`의 alias 셋이 그대로 돈다
- `package.json`의 스크립트가 바뀐다 — `dev`가 `expo start`, `build`가 없어지고, `typecheck`에서 `next typegen`이 빠진다. `tokens:css`와 `sian:inline`은 그대로다

### AC-02

**치수가 기기에서 제 값을 낸다.**

- **네이티브 rem을 16으로 맞춘다.** v5 호환성 문서가 기본 네이티브 rem을 14라 적는다 — 그대로 두면 `p-6`이 24가 아니라 21이 되고 `text-base`(1.0625rem)가 17이 아니라 14.875가 된다. 스페이싱 눈금 열셋과 타이포 일곱이 통째로 어긋나는 자리다
- 눈금 열셋이 시뮬레이터에서 px 그대로 나오는 것을 재서 확인한다. rem 설정으로 안 되면 `@theme`의 `--spacing`과 `--text-*`를 px로 바꾼다 — 그 경우 [tokens.md](../../2-design/design-system/tokens.md)의 4절과 3절이 따라간다

### AC-03

**토큰이 기기에서 제 색을 낸다.**

- `globals.css`의 `@theme`과 역할 토큰 이름이 그대로 산다. `bg.brand-solid`가 `bg-brand-solid` 유틸로 나오는 규칙이 안 바뀐다
- 시뮬레이터에서 실제로 그 색이 나오는지를 눈과 테스트로 본다. v5의 색 문서는 `@theme`에 `oklch()`를 적는 예를 들지만 호환성 문서의 색 항목은 「Configured color tokens, hexadecimal, RGB and HSL colors」만 든다. OKLCH가 그대로 안 가면 생성기(`scripts/generate-globals-css.mts`)가 sRGB로 바꾼 값을 낸다 — 바꿀 수 없는 색(sRGB 밖으로 나가는 채도)이 있으면 생성이 실패한다. 조용히 가까운 색으로 끌어당기지 않는다
- [tokens.md](../../2-design/design-system/tokens.md)의 8절이 다시 쓰인다. 그 절은 스스로 「이 절은 웹 전제고 Expo 골격을 세울 때 정해서 통째로 다시 쓴다」고 예고해둔 자리다 — Tailwind 4를 지키니 뼈대는 남고 웹 전제였던 자리(`postcss`, shadcn 다리)가 빠진다

### AC-04

**테마가 기기 설정을 따르고 앱에서 덮인다.**

- **지금 방식이 거부된다.** `globals.css`가 `@custom-variant dark`로 `[data-theme]` 속성을 받는데, v5 호환성 문서가 「The v4 class dark mode configuration is rejected with migration guidance」·「Use React Native Appearance and `useColorScheme` for native dark mode」라 적고 `:root.dark` 같은 한정 선택자를 네이티브 컴파일러가 거부한다고 못 박는다
- `dark:`는 `prefers-color-scheme` 미디어쿼리로 간다. 앱에서 덮는 길은 `Appearance.setColorScheme()`이다 — 「기기 설정대로 · 밝게 · 어둡게」 셋 중 앞엣것이 기본이고 나머지 둘이 덮는다
- 변수를 갈래마다 다시 정의해야 하면 `VariableContextProvider`를 쓴다. v4의 `vars()`는 폐기 예정이라 안 쓴다
- 고른 값은 기기 저장소의 `theme` 하나고 계정에 안 둔다. 앱이 뜨면서 그것을 읽어 첫 화면부터 그 테마로 그린다([profile.md](../../2-design/modules/account/screens/profile.md#화면))
- `dark-variant-compiles.test.ts`가 그 갈래를 실제로 컴파일해 본다. [tokens.md](../../2-design/design-system/tokens.md)의 「적응형 팔레트」와 8.1이 따라간다

### AC-05

**서체 넷이 번들에 든다.**

- Wanted Sans v1.0.3의 정적 `.ttf` 넷 — Regular·Medium·SemiBold·Bold. 파일 이름을 안 바꾼다
- 가변 서체를 안 쓴다. Expo 문서가 「완전한 플랫폼 지원을 원하면 static 폰트를 쓰라」고 적었고 [tokens.md](../../2-design/design-system/tokens.md#서체-연결)가 고른 것도 정적 넷이다
- 서체가 안 뜬 동안 글자가 안 그려진다 — 시스템 서체로 한 번 그렸다가 바뀌면 글자가 뛴다

### AC-06

**경로가 [navigation.md](../../2-design/system/navigation.md#경로)대로 선다.**

- 근무자 탭 넷이 나란히다 — `/`·`/schedule`·`/payroll`·`/me`
- 게이트 넷이 나란히다 — `/login`·`/pending`·`/blocked`·`/left`. 탭 바가 없다
- 관리자 층이 `/admin` 아래고 탭 바가 없다. 관리자 홈이 허브고 앱바의 뒤로로 돌아온다
- 탭에서 올라오는 화면 넷이 스택 위에 선다 — `/check-in`·`/me/rehearsals`·`/notifications`·`/stats`
- 화면 알맹이는 비어 있다. 각 경로에 자리만 있고 「아직 없다」 한 줄이 선다
- 뒤로는 [뒤로](../../2-design/system/navigation.md#뒤로)가 정한 대로 부모 경로로 가는 명시 이동이다

### AC-07

**세션이 기기에 남는다.**

- 열쇠는 `expo-secure-store`, 암호화한 본문은 `@react-native-async-storage/async-storage`다. 2048바이트 한도를 세션이 넘어서다
- Supabase 클라이언트의 `auth.storage`가 그것을 문다
- 앱을 껐다 켜면 로그인 상태가 남는다
- `create-supabase-server-client.ts`와 `create-supabase-request-client.ts`가 없어진다. 서버가 없다

### AC-08

**구글 로그인이 딥링크로 돌아온다.**

- 로그인이 끝나면 딥링크로 앱에 돌아오고 그 자리에서 토큰을 받아 넣는다([architecture.md](../../2-design/system/architecture.md#세션을-드는-자리))
- `src/app/auth/callback/route.ts`와 `src/app/auth/logout/route.ts`가 없어지고 그 일을 화면이 한다
- `handle-auth-callback.ts`와 `resolve-auth-destination.ts`는 순수 TypeScript라 그대로 쓴다

### AC-09

**앱이 뜰 때 세 판정이 갈린다.**

- 세션 → 프로필 → 승인 순이다([navigation.md](../../2-design/system/navigation.md#앱을-열면))
- 판정은 껍데기 하나가 `['profile']`을 읽어 한다. 화면마다 따로 안 본다
- 판정이 끝나기 전에는 스플래시가 그대로 떠 있다
- 지금 `src/proxy.ts`(Next middleware)와 `use-auth-gate.ts`가 하던 일이 이 껍데기로 모인다. 둘 다 없어진다

### AC-10

**닿는 면 44px을 `hitSlop`이 받는다.**

- 모양은 필요한 만큼 그리고 닿는 면을 넓히는 원칙이 그대로다. 수단이 `::after`에서 `Pressable`의 `hitSlop`으로 바뀐다
- [components.md](../../2-design/design-system/components.md)의 터치 면 조항과 그 조항을 든 화면 문서가 따라간다
- 시안의 `::after`는 그대로 둔다. 시안은 브라우저에서 보는 목업이고 `::after`가 거기서는 맞는 수단이다 — 다만 시안 주석이 「앱에서는 `hitSlop`이 이 일을 한다」고 가리킨다

### AC-11

**검사판이 Jest로 옮겨진다.**

- `jest-expo` 프리셋으로 unit 테스트가 돈다
- `tests/lint/` 34개 중 프레임워크를 안 타는 것은 그대로 옮긴다. Tailwind를 돌리는 둘은 다시 쓴다(AC-03·AC-04)
- `tests/e2e/` 여덟과 `playwright.config.ts`가 없어진다. Maestro와 Detox 중 어느 쪽인지는 이 task가 안 정한다 — 화면이 하나도 없어 e2e가 볼 것이 없다. [`backlog.md`](../../backlog.md)에 행을 새로 연다
- integration 테스트(`src/**/__tests__/**/*.integration.test.ts`)는 Supabase에만 붙어 그대로 돈다

### AC-12

**Next 자취가 남지 않는다.**

- `next`·`next-env.d.ts`·`next.config.ts`·`eslint-config-next`·`postcss.config.mjs`·`shadcn`·`tw-animate-css`가 빠진다. `tailwindcss`는 4로 남고 `@tailwindcss/postcss`는 NativeWind v5가 무엇을 요구하는지에 달렸다
- `src/app/`의 Next 라우트 파일과 `src/proxy.ts`가 없어진다
- `src/shared/ui/`의 `button.tsx`·`card.tsx`는 shadcn 전제라 다시 만든다. 「직접 만든 조각」의 첫 둘이다
- `pnpm lint`·`pnpm typecheck`·`pnpm test`가 통과한다

## 구현 순서

1. **빈 Expo 프로젝트를 세우고 뜨는 것을 본다.** SDK 57, Expo Router, `src/app/` 배치, alias 셋
2. **NativeWind v5와 토큰을 붙인다.** 지금 `globals.css`를 그대로 물려 치수와 색이 실제로 나오는지 본다 — rem 16, 눈금 열셋, 팔레트다. 안 맞으면 그 자리에서 `@theme`이나 생성기를 고친다. 다크 갈래를 `prefers-color-scheme`으로 옮기는 것도 여기다. **이 단계가 이 task에서 제일 먼저 막힐 수 있는 자리라 앞에 둔다**
3. **서체 넷을 넣는다**
4. **경로를 다 세운다.** 탭 넷·게이트 넷·관리자 층·올라오는 화면 넷. 알맹이는 비운다
5. **세션과 로그인을 붙인다.** SecureStore + AsyncStorage, 딥링크 콜백, 진입 판정 껍데기
6. **`hitSlop` 조각을 만들고 `components.md`를 고친다**
7. **검사판을 옮긴다.** jest-expo, lint 테스트 이사, Playwright 제거
8. **Next를 걷어낸다.** 의존성·설정·라우트·`proxy.ts`·shadcn 조각
9. **정본을 따라 고친다** — `tokens.md`의 3·4·8절과 「적응형 팔레트」, `components.md` 터치 면, `CLAUDE.md`의 스택과 명령어, [4-test/execution.md](../../4-test/execution.md)의 실행 명령

## 리스크·전환·되돌리기

**RC를 딛는 것이 이 task의 가장 큰 값이다.** 릴리스 계획이 「API 변경 없이 버그 수정만」이라 적었지만 계획은 미끄러질 수 있다. 골격은 모든 화면 task가 딛는 자리라 여기서 막히면 전부 멈춘다. 되돌리는 길은 v4와 Tailwind 3으로 내려가는 것이고, 그때 같이 움직이는 것이 생성기와 `dark-variant-compiles` 테스트와 lint 규칙 셋이다. **2번 단계에서 막히면 그 자리에서 결정을 다시 받는다** — 뒤 단계를 진행해놓고 나중에 뒤집지 않는다.

**색 변환이 팔레트를 바꿀 수 있다.** OKLCH의 채도가 sRGB 밖으로 나가면 같은 색이 안 나온다. 그래서 AC-03이 조용한 보정을 막는다 — 실패하면 `tokens.md`의 팔레트 값을 사람이 다시 고른다. [대비 검증](../../2-design/design-system/tokens.md#7-대비-검증)이 든 조합도 같이 다시 잰다.

**`hitSlop`이 `::after`와 다르게 겹친다.** `::after`는 부모 안에서 커지지만 `hitSlop`은 형제와 겹칠 수 있다. 줄 안에 누를 것이 둘 이상인 자리(알림 목록의 ✕와 CTA)에서 어느 쪽이 먹는지를 실제로 눌러봐야 안다.

**거부되는 유틸이 있다.** v5 호환성 문서가 네이티브에서 거부하는 목록을 든다 — `fixed`·`sticky`·`overflow-auto`와 축별 overflow·`w-fit` 같은 고유 크기 키워드·`origin-*`·`order-*`·`inset-auto`·`border-none`·`align-baseline` 등이다. 지금 설계 문서에 그 유틸을 든 자리는 없다. 화면을 만들 때 쓰게 되면 그때 걸린다.

**e2e가 한동안 없다.** Playwright를 걷고 Maestro나 Detox를 안 정하니 그 사이에 e2e가 0이다. 화면이 없어 볼 것도 없지만, 첫 화면 task가 서기 전에 그 행이 닫혀야 한다.

**되돌리는 단위는 이 task 전체다.** 골격은 쪼개서 되돌릴 수 없다 — Expo가 반쯤 선 저장소는 Next로도 Expo로도 안 돈다.

## 검증 방법

| 완료 조건 | 깨질 수 있는 것 | 테스트 층·위치 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 앱이 안 뜬다 | 수동 | `pnpm dev` 뒤 시뮬레이터 | iOS·Android 둘 다 첫 화면이 뜬다 |
| AC-02 | 여백과 글자가 문서보다 작게 나온다 | 수동 + unit | 시뮬레이터, `pnpm test` | `p-6`이 24pt, `text-base`가 17pt다 |
| AC-03 | 색이 안 나오거나 다른 색이 나온다 | 수동 + unit — 생성기 테스트 | 시뮬레이터, `pnpm test` | 시뮬레이터의 색이 시안과 같다. 변환이 필요하면 sRGB 밖 색에서 생성이 실패한다 |
| AC-03 | 역할 토큰 이름이 바뀐다 | unit — `tests/lint/design-token-values.test.ts` | `pnpm test` | `tokens.md`의 표와 생성물이 같다 |
| AC-04 | 다크에서 라이트 색이 나온다 | 수동 + unit — `dark-variant-compiles` | 시뮬레이터, `pnpm test` | 기기 설정을 따르고, 앱에서 고른 값이 그것을 덮는다 |
| AC-05 | 서체가 시스템 것으로 떨어진다 | 수동 | 시뮬레이터 | 굵기 넷이 다 다르게 보인다 |
| AC-06 | 경로가 빠지거나 층이 섞인다 | unit — 새 테스트 | `pnpm test` | 라우트 파일 목록이 `navigation.md`의 경로 표와 같다 |
| AC-07 | 앱을 껐다 켜면 로그아웃된다 | 수동 | 시뮬레이터 | 다시 켜도 로그인 상태다 |
| AC-07 | 세션이 2048바이트를 넘어 저장이 실패한다 | unit | `pnpm test` | 큰 값이 AsyncStorage로 가고 열쇠만 SecureStore에 남는다 |
| AC-08 | 로그인 뒤 앱으로 안 돌아온다 | 수동 | 실기기 | 구글 화면에서 앱으로 돌아와 세션이 선다 |
| AC-09 | 승인 안 된 사람이 탭을 본다 | unit — `resolve-auth-destination` 기존 테스트 | `pnpm test` | 세션·프로필·승인 조합마다 가는 곳이 맞다 |
| AC-10 | 닿는 면이 44px이 안 된다 | 수동 | 시뮬레이터 | 아이콘 가장자리 밖을 눌러도 먹는다 |
| AC-11 | 옮긴 lint 테스트가 안 돈다 | unit | `pnpm test` | 34개 중 옮긴 것이 다 통과한다 |
| AC-12 | Next 자취가 남는다 | unit — 새 테스트 | `pnpm test` | `package.json`과 `src/`에 `next` 문자열이 없다 |

## 여기서 안 하는 것

- **EAS Build·Submit 설정.** ADR-011이 「배포 파이프라인의 세부와 스토어 등록 정보는 안 정했다」고 적었다. 골격이 뜨고 나서 정한다
- **TanStack Query의 기기 영속과 복원.** [runtime.md](../../2-design/system/runtime.md#캐시-두-계층)가 정해뒀지만 캐시할 데이터가 없다. 첫 데이터 task가 붙인다
- **서버 시각 오프셋.** [runtime.md](../../2-design/system/runtime.md#서버-시각)의 `server_now()`도 부를 표가 서고 나서다
- **푸시 등록.** 기기 주소를 받는 자리는 [`notification-push`](../../backlog.md)가 만든다
- **생성 타입.** `supabase gen types`와 `pnpm types`는 [`types-generation`](../../backlog.md)이 세운다
- **e2e 도구 고르기.** Maestro인지 Detox인지는 첫 화면이 설 때 정한다
