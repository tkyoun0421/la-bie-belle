# Expo 앱의 로그인 화면

`src/app/login.tsx`가 `NotBuiltYet` 한 줄이다. 앱이 「세션 없음」으로 판정하면 사람을 이 빈 화면으로 보낸다. 웹 시절 화면은 `expo-scaffold`가 걷었고 경로만 남았다. 코드 교환 조각(`handleAuthCallback`·`makeAuthRedirectUri`·`extractAuthCode`)은 테스트만 통과시키며 기다린다.

## 입력 명세·기준

화면의 상태·짜임·문안·모션은 [login.md](../../2-design/modules/account/screens/login.md)의 「로그인」 절과 짝 시안이 정본이다. 돌아온 뒤 목적지는 [account 설계](../../2-design/modules/account/design.md)의 「첫 진입과 게이트」가 정하고 `decideEntry`가 이미 그 판정을 든다. 돌아올 주소의 허용 목록은 [environments.md](../../5-deploy/environments.md)다.

## 판정 — 묻지 말고 이 꼴로 쓴다

**흐름은 lib 하나가 든다.** `features/auth/lib/signInWithGoogle.lib.ts`의 `signInWithGoogle(deps)`가 `signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } })` → `openAuthSessionAsync(url, redirectTo)` → `handleAuthCallback(extractAuthCode(result.url), client)` 순서로 간다. `redirectTo`는 `makeAuthRedirectUri("auth/callback")`이다. `expo-web-browser`는 `devicePushToken.lib.ts`처럼 동적 import를 기본값으로 두고 테스트가 주입한다. 반환은 `{ ok: true }` 또는 `{ ok: false; reason }`이고 이유는 `start_failed`·`cancelled`·`missing_code`·`exchange_failed` 넷이다. 창이 `success`가 아니면(`cancel`·`dismiss`·`locked`) 전부 `cancelled`다.

**service가 목적지까지 간다.** `features/auth/services/useGoogleSignInMutation.ts`의 mutation이 `signInWithGoogle`이 `ok`일 때 `decideEntry({ client })`까지 부른다. 결과는 `{ kind: "decided"; destination } | { kind: "cancelled" } | { kind: "failed" }`이다. `decideEntry`가 `/retry`를 줘도 `decided`다. lib가 던지면 `mutationFn`이 잡아 `failed`로 돌린다. 반환은 `useRetryEntryMutation`과 같은 꼴인 `{ signIn(onOutcome), isPending }`이다 — `MutationCallbacks.onSuccess`는 인자가 없어 결과를 못 싣는다. `isPending` 중 다시 부르면 무시한다.

**controller는 이동과 실패 줄만 든다.** `screens/login/hooks/useLoginScreen.ts`가 `{ signIn, busy, failed }`를 낸다. `decided`면 `router.replace(destination)`, `cancelled`면 아무것도 안 하고, `failed`면 `failed`가 참이다. 다시 누르는 순간 `failed`가 거짓으로 돌아간다.

**구글 버튼은 자산 넷이다.** 구글 `signin-assets.zip`에서 직사각형·글자 있는 SVG를 iOS·Android × Light·Dark로 넷 가져와 `assets/google/`에 둔다. 라이트 테마는 Dark 자산, 다크 테마는 Light 자산이다. 고르는 표는 `screens/login/consts/login.const.ts`가 들고 `.tsx`는 그 표를 인덱싱한다(규칙 39가 `ui`의 `utils` 값 import를 막는다). 높이는 `h-12`, 너비는 자산 종횡비를 따른다. 접근성 라벨은 「Sign in with Google」이다. `busy`면 안 눌리고 생김새는 그대로다.

**`auth/callback` 딥링크는 `/login`으로 돌린다.** 안드로이드가 앱으로 돌아오며 그 주소를 라우터에 넘기면 없는 경로라 not-found가 뜬다. `src/app/+native-intent.ts`의 `redirectSystemPath`가 판정 하나에 위임만 한다. 판정은 `features/auth/model/nativeIntent.policy.ts`이고 `labiebelle://auth/callback?…`, `exp://<호스트>/--/auth/callback?…`, `/auth/callback`을 `LOGIN_PATH`로, 나머지를 그대로 돌린다 — `path`가 전체 주소로도 경로로도 올 수 있어 둘 다 받는다.

**구글 버튼 색 토큰을 뺀다.** `tokens.md` 9절의 「구글 로그인 버튼」 소절과 `--vendor-google-*` 셋을 지우고 `pnpm tokens:css`로 `globals.css`를 다시 만든다. 9절 머리와 앵커는 남긴다 — `color.md`가 링크한다. 생성기가 9절에 표가 없어도 던지지 않게 고치고 `generateGlobalsCss` 테스트의 vendor 단언을 그에 맞춘다.

**`deadExports` 예외 두 줄을 뺀다.** `handleAuthCallback.lib.ts`·`authRedirect.utils.ts`가 이제 production에서 불린다.

**`tests/e2e/login.yaml`을 갱신한다.** 지금 스텁 글자를 단언한다. 차가운 시작에서 「라비에벨」, 한 줄 설명, 안내 첫 줄, 「Sign in with Google」 라벨을 본다. 빌드가 없어 돌리지는 못한다.

**등장 모션과 눌림 스케일은 이 task 밖이다.** 저장소에 움직임 줄이기 설정을 읽는 손도, 요소를 어긋나게 올리는 조각도 없다. reanimated의 `ReduceMotion.System`은 애니메이션을 통째로 끄는데 정본은 「이동만 빼고 밝기는 남긴다」라 같은 것이 아니다. `login-entrance-motion` 행이 든다.

**차가운 시작으로 돌아오는 경우는 안 받는다.** 구글 창이 떠 있는 동안 OS가 앱을 죽이면 코드를 실은 주소로 앱이 새로 뜬다. 그때는 `/login`에 서고 다시 누르면 된다. 코드를 주소에서 꺼내 교환하는 길은 이 task가 안 연다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `features/auth/lib/signInWithGoogle.lib.ts` + 짝 | 새로. 시작→창→교환과 실패 이유 |
| `features/auth/model/auth.type.ts` | 결과·deps·outcome 타입 |
| `features/auth/services/useGoogleSignInMutation.ts` + 짝 | 새로. 목적지 판정과 `isPending` |
| `features/auth/model/nativeIntent.policy.ts` + 짝 | 새로. 콜백 주소를 `LOGIN_PATH`로 |
| `screens/login/hooks/useLoginScreen.ts` + 짝 | 새로 |
| `screens/login/consts/login.const.ts` + 짝 | 문안과 자산 표 |
| `screens/login/ui/LoginScreen.tsx`·`GoogleSignInButton.tsx` + 버튼 짝 | 새로 |
| `src/app/login.tsx`·`src/app/+native-intent.ts` | 화면을 내보낸다, 판정에 위임한다 |
| `assets/google/` | 구글 자산 넷 |
| `tokens.md` · `globals.css` · `scripts/generateGlobalsCss.mts` + 짝 | 구글 토큰을 뺀다 |
| `tests/lint/deadExports.ts` | 예외 두 줄을 뺀다 |
| `tests/e2e/login.yaml` | 스텁 단언을 화면 단언으로 |

## 완료 조건

- **AC-01** 구글 버튼을 누르면 `skipBrowserRedirect`로 받은 주소가 앱 안 창으로 열리고, 창과 Supabase가 같은 `redirectTo`를 받는다
- **AC-02** 창을 닫으면 교환을 안 부르고 실패 줄도 안 뜬다
- **AC-03** 창을 못 열었거나 코드가 없거나 교환이 실패하면 안내 자리에 실패 줄이 서고, 다시 누르면 사라진다
- **AC-04** 교환이 끝나면 `decideEntry`의 목적지로 `replace`한다 — 새로 온 사람은 `/pending`, 읽기 실패는 `/retry`
- **AC-05** 창이 떠 있는 동안과 교환하는 동안 버튼이 안 눌리고 스피너가 없다
- **AC-06** 라이트 테마는 Dark 자산, 다크 테마는 Light 자산을 그리고, 자산 넷이 실재한다
- **AC-07** `auth/callback` 딥링크가 not-found가 아니라 `/login`으로 간다
- **AC-08** `src`와 `globals.css`에 `--vendor-google-*`·`google-` 유틸이 0건이고 `tokens.md`→`globals.css` 생성이 바이트 단위로 같다
- **AC-09** `deadExports`에 `login-screen-native` 예외가 0건이다

## 검증 방법

unit·components는 위 짝 테스트가, 생성 일치는 `generateGlobalsCss` 테스트가 든다. e2e는 `login.yaml`을 쓰되 빌드가 없어 미실행이다. 구글 왕복은 실기기 수동이다 — 새 사람·승인·차단·퇴사 계정으로 들어가 목적지를 보고, 창을 닫아 보고, 안드로이드 복귀에서 not-found가 안 번쩍이는지 본다. iOS Expo Go는 SDK 57을 못 띄워 개발 빌드가 필요하다.
