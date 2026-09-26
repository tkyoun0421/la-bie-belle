# 검증 실행

실행 전제와 명령, 훅과 문서 검사, 실패 진단, 결과 찾는 자리가 산다. 검증 방법 선택과 완료 판정은 [strategy](strategy.md), 계획·결과 작성법은 [README](README.md)를 따른다.

**여기 적힌 명령은 지금 저장소가 돌리는 것이다.** 하나는 기계가 아직 못 돌린다 — [`pnpm e2e`](#pnpm-e2e)는 설치 가능한 앱을 요구하고 그 빌드가 없다([Expo 골격](../3-build/plans/expo-scaffold.md)).

## 명령

저장소 루트에서 Node 22와 pnpm 8.15.2로 실행한다. 아래 열하나가 로컬과 CI가 돌리는 명령이다. 정본은 [package.json](../../package.json)의 `scripts`와 [ci.yml](../../.github/workflows/ci.yml)이다.

### `pnpm lint`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다.
- 실행: `pnpm lint` — `eslint`를 저장소 전체에 돌린다.
- 정상 결과: 출력 없이 종료 코드 0.
- 실패할 때: 규칙 이름과 파일 위치가 찍힌다. type-aware 규칙과 디자인 값 규칙이 무엇을 안 보는지는 [돌릴 때](#돌릴-때)가 든다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm lint` 단계.

### `pnpm format:check`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다.
- 실행: `pnpm format:check` — `prettier --check .`
- 정상 결과: `All matched files use Prettier code style!`
- 실패할 때: `pnpm format`으로 고치고 다시 `git add` 한다. staged 파일은 pre-commit 훅이 먼저 같은 일을 한다 — [훅](#훅).
- 근거 위치: PR의 `ci` 워크플로 `pnpm format:check` 단계.

### `pnpm routes:types`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다.
- 실행: `pnpm routes:types` — `scripts/generate-route-types.mts`가 `expo customize tsconfig.json`을 부르고 그것이 낸 `.expo/types/router.d.ts`를 다시 읽어 판정한다. `pnpm typecheck`가 앞에 이것을 세워서 따로 부를 일은 드물다.
- 정상 결과: `.expo/types/router.d.ts가 섰다`가 찍히고 종료 코드 0. `tsconfig.json`은 이미 `.expo/types/**/*.ts`를 `include`해서 안 바뀐다 — 여러 번 돌려도 같다.
- 실패할 때: 파일이 안 생겼거나 `ExpoRouter.__routes`가 반쯤 섰으면 어느 자리가 빈지 찍고 종료 코드 1이다. 판정하는 규칙 넷은 [`tests/lint/route-types.ts`](../../tests/lint/route-types.ts)에 있고 그 테스트가 `pnpm test`에서 돈다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm typecheck` 단계 — 같은 단계에서 먼저 돈다.

**왜 생성이 검사 앞에 서나.** `.expo/`는 `.gitignore` 안이라 CI에 라우트 타입이 없다. 없으면 `expo-router`의 `Href`가 `string | HrefObject`로 떨어져 **`router.replace("/없는경로")`가 `tsc`를 통과한다** — 타입 안전이 로컬에서만 켜져 있고 CI에서는 조용히 꺼진 상태다. 종료 코드로는 두 상태가 구별되지 않아서 스크립트가 생성물을 직접 읽어 판정한다.

만드는 명령이 `expo customize tsconfig.json`인 것은 Expo CLI의 `setupTypedRoutes`가 Metro나 개발 서버 없이 도는 진입점이 그것 하나라서다. `expo export`(= `pnpm bundle`)로는 안 생긴다.

**그 명령이 세 파일을 더 건드린다.** `tsconfig.json`(이미 맞아서 안 바뀐다), `.gitignore`의 `@generated expo-cli` 블록, 그리고 `expo-env.d.ts`다. 마지막 둘은 명령이 만들고 무시하라고 적는 파일이라 그렇게 뒀다 — `expo-env.d.ts`는 추적 대상이 아니고 `routes:types`가 매번 다시 만든다. 셋 다 같은 내용을 다시 써서 여러 번 돌려도 작업 트리가 안 더러워진다. 이 명령을 바꿀 때는 그것부터 확인한다.

### `pnpm typecheck`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다.
- 실행: `pnpm typecheck` — `pnpm routes:types && tsc --noEmit`. 라우트 타입을 먼저 만들고 검사한다.
- 정상 결과: tsc 오류 없이 종료 코드 0.
- 실패할 때: `@supabase/supabase-js`를 못 찾으면 [돌릴 때](#돌릴-때)를 본다. 라우트 타입 생성이 실패하면 `tsc`까지 가지 않는다 — [`pnpm routes:types`](#pnpm-routestypes)를 본다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm typecheck` 단계.

### `pnpm test`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다. unit만 돌아 Docker가 필요 없다.
- 실행: `pnpm test` — `jest`. 갈래는 `jest.config.js`의 `testMatch`가 가르고 integration은 부정 glob으로 빠진다.
- 정상 결과: 실패 0. `tests/lint/`의 문서 검사도 여기서 같이 돈다 — [`pnpm test`에 끼는 문서 검사](#pnpm-test에-끼는-문서-검사).
- 실패할 때: 첫 테스트가 타임아웃에서 흔들리거나 픽스처 표기가 어긋나면 [돌릴 때](#돌릴-때)를 본다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm test` 단계.

### `pnpm bundle`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다. env는 필요 없다 — `EXPO_PUBLIC_*`가 비어도 번들은 만들어진다.
- 실행: `pnpm bundle` — `expo export`를 iOS와 안드로이드로 한 번씩 돌려 `.expo/bundle-check/` 아래에 낸다.
- 정상 결과: 플랫폼마다 `.hbc` 번들 하나와 자산 목록이 나온다. 자산 목록에 서체 넷이 보여야 한다.
- 실패할 때: Metro가 해석 못 한 import를 `Import stack`으로 짚어준다. 라이브러리가 Node 내장 모듈(`buffer` 같은 것)을 부르면 여기서 막히고, 위 검사 넷은 그것을 못 잡는다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm bundle` 단계. 문서만 바뀐 PR은 건너뛴다.

### `pnpm test:integration`

- 전제: 로컬 Docker가 떠 있다. 스택이 이미 떠 있으면 `pnpm test:integration:run`으로 기동을 건너뛴다.
- 실행: `pnpm test:integration` — `supabase start` 뒤 `supabase migration up && jest --config jest.integration.config.js`.
- 정상 결과: 실패 0.
- 실패할 때: 가입 한도와 로그 읽는 자리는 [integration과 e2e](#integration과-e2e)가 든다.
- 근거 위치: CI는 테스트가 쓰는 서비스만 `supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime`으로 띄우고 `pnpm test:integration:run`을 돌린다.

### `pnpm types`

- 전제: 로컬 Supabase가 떠 있고 마이그레이션이 올라가 있다. 방금 표를 바꿨으면 `supabase db reset`이 먼저다 — `supabase migration up`은 이미 올린 파일을 다시 안 돌린다.
- 실행: `pnpm types` — `scripts/generate-database-types.mts`가 `supabase gen types typescript --local --schema public --schema internal`을 부르고, 뽑은 것에 prettier를 먹여 `src/shared/api/database-types.ts`에 쓴 뒤 다시 읽어 판정한다.
- 정상 결과: `src/shared/api/database-types.ts가 섰다`가 찍히고 종료 코드 0. 표가 안 바뀌었으면 작업 트리도 안 바뀐다.
- 실패할 때: 스택이 안 떠 있으면 `supabase status`를 가리키고 멈춘다. 뽑기가 절반만 되면 어느 표·뷰·함수가 빠졌는지 찍는다 — 그 판정은 [`tests/lint/database-types.ts`](../../tests/lint/database-types.ts)에 있고 `pnpm test`에서도 돈다.
- 근거 위치: PR의 `ci` 워크플로 「생성 타입이 마이그레이션과 같은지 본다」 단계.

**왜 `typecheck`에 안 끼우나.** 이 명령은 Docker와 로컬 스택이 필요하다. `pnpm typecheck`는 그것 없이 돌아야 해서 CI에서도 DB를 띄운 뒤에 따로 선다 — 마이그레이션을 올리는 `pnpm test:integration:run` 다음이다.

**뽑은 뒤 prettier를 먹이는 이유.** CLI가 세미콜론 없이 내놓고 저장소는 세미콜론을 쓴다. 두 단계가 한 덩이가 아니면 CI가 다시 뽑을 때마다 포맷 차이로 diff가 나서 헛빨간불이 된다.

**함수 인자의 `null`.** 생성기는 함수 인자가 NULL을 받는지 모른다 — `pg_proc`에 그 정보가 없다. 그래서 NULL을 받는 인자도 non-null로 나오고, `null`을 넘기는 호출이 `tsc`에서 막힌다. 안 보내도 되는 인자는 SQL에 `default null`을 적어라. 그러면 생성 타입이 선택 인자(`p_qr_code?: string`)로 내고 호출자가 그 키를 빼고 부른다 — PostgREST가 안 보낸 인자를 SQL 기본값으로 채우니 DB에 가는 값이 같다. 기본값은 뒤쪽 인자에만 붙으니 가운데 인자가 NULL을 받아야 하면 그 자리는 캐스트밖에 없다 — 캐스트를 적기 전에 그 호출이 값을 채워 불러도 되는지 본다.

### `pnpm dev`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있고 `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_ANON_KEY`가 env에 있다. 값은 번들에 박히므로 띄우기 전에 넘긴다. 기기의 Expo Go가 프로젝트와 같은 SDK여야 한다 — 아래 [Expo Go의 한계](#expo-go의-한계).
- 실행: `pnpm dev` — `expo start`. 뜨는 QR을 Expo Go로 찍으면 기기에서 본다.
- 정상 결과: 번들이 만들어지고 기기에 첫 화면이 뜬다.
- 실패할 때: NativeWind가 CSS를 빌드 때 읽으니 `globals.css`가 네이티브 컴파일러가 안 받는 문법을 들면 여기서 던진다. 번들이 안 만들어지는 자리는 [`pnpm bundle`](#pnpm-bundle)이 CI에서 먼저 잡는다.
- 근거 위치: 대화형이라 CI 단계가 없다. 네이티브 컴파일을 검사에 넣는 자리는 EAS 설정과 같이 선다.

#### Expo Go의 한계

**SDK가 어긋나면 `Project is incompatible with this version of Expo Go`로 끝난다.** Expo Go는 제 바이너리가 아는 SDK만 띄운다.

**iOS는 Expo Go로 이 프로젝트를 못 띄운다.** Expo의 버전 불일치 문서가 App Store의 Expo Go는 SDK 54에서 멈췄다고 적는다 — 프로젝트는 SDK 57이다. 안드로이드는 Play Store 것을 올리면 뜬다. SDK별 Expo Go를 따로 받는 길이 `expo.dev/go?sdkVersion=<번호>&platform=android`고, 그마저 막히면 개발 빌드다.

**네이티브 모듈은 Expo Go 것이 돈다.** 프로젝트가 설치한 버전이 아니라 Expo Go 바이너리에 든 버전이 실행된다 — 둘이 어긋나면 JS는 통과하고 런타임에 조용히 깨진다. `npx expo install --check`가 그 어긋남을 알려주고, Expo Go로 확인하기 전에 맞춰야 그 확인이 무언가를 증명한다.

### `pnpm e2e`

- 전제: Maestro CLI가 PATH에 있고(`curl -Ls "https://get.maestro.mobile.dev" | bash`, 버전을 박으려면 `MAESTRO_VERSION`을 앞에 준다) JVM이 깔려 있다. **설치 가능한 앱이 기기나 시뮬레이터에 올라가 있어야 한다** — Maestro는 `appId`로 앱을 찾아 띄우고 Expo Go는 제 `appId`로 뜬다. 그 빌드는 EAS 설정과 같이 선다.
- 실행: `pnpm e2e` — `maestro test tests/e2e/`. 한 플로우만 돌릴 땐 `pnpm exec maestro test tests/e2e/login.yaml`.
- 정상 결과: 플로우마다 커맨드가 초록으로 지나간다.
- 실패할 때: 어느 커맨드에서 멈췄는지와 그때 화면을 Maestro가 남긴다. `assertVisible`이 못 찾으면 셀렉터부터 본다 — **텍스트 셀렉터는 정규식이다.** 일부만 맞히려면 `.*`를 앞뒤에 붙이고 `$`·`[` 같은 글자는 이스케이프한다.
- 근거 위치: CI 단계가 없다 — 아래 [CI와 결과 위치](#ci와-결과-위치)의 한계에 든다. 지금은 손으로 돌린 결과를 [evidence](README.md#evidence)에 남긴다.

러너를 Maestro로 고른 근거와 받아들인 비용은 [ADR-013](../2-design/adr/ADR-013-e2e-runner-maestro.md)이다.

**플로우 이름은 훅이 정한다.** `tdd-guard-e2e.py`가 고친 화면에서 이름을 뽑아 `tests/e2e/<이름>.yaml`을 찾는다 — `src/app/login.tsx`면 `login.yaml`이고, 디렉터리를 대표하는 `index.tsx`·`_layout.tsx`는 그 디렉터리 이름, 최상위면 `home`이다. `src/screens/<이름>/`은 그 슬라이스 이름이다.

**`appId`는 플로우마다 적는다.** Maestro의 워크스페이스 `config.yaml`이 받는 키가 아니다 — 앱 ID가 바뀌면 플로우 전부가 따라 바뀐다.

**지금 플로우는 하나다.** `login.yaml`이 세션 없는 차가운 시작이 로그인 화면에 서는지 본다. **아직 한 번도 돌리지 않았다** — 올릴 앱이 없다. 나머지 라우트는 플로우가 없어서 고치려 들면 훅이 막는다. 그것이 이 자리가 서기 전까지 안 물던 게이트다.

**세션은 개발 빌드의 테스트 문으로 심는다.** Maestro는 앱 내부를 안 봐서 코드로 세션을 넣을 수 없으니 앱이 문을 하나 낸다 — `src/app/__test/session.tsx`가 `labiebelle://__test/session?access_token=…&refresh_token=…`을 받아 `supabase.auth.setSession`을 부르고 게이트로 넘긴다. `_catalog`와 같은 꼴로 `__DEV__`가 아니면 `/`로 돌려보내 프로덕션에는 문이 없다. 토큰과 DB 상태는 **시드 서버**가 만든다 — `scripts/e2e-seed-server.mts`가 `tests/integration/postgres.ts`의 헬퍼(거절·퇴사·차단 사용자 만들기 등)를 로컬 HTTP(`127.0.0.1:8765`)로 내놓고, 테스트 사용자를 이메일·비밀번호로 만들어 `signInWithPassword`로 받은 토큰을 돌려준다. 플로우는 `runScript`로 그 서버를 부르고 받은 토큰을 `openLink`에 넣는다. 서버는 `pnpm e2e`가 띄우고 끝나면 내린다 — 로컬 Supabase가 떠 있어야 하고 프로덕션 키는 절대 받지 않는다(URL이 `127.0.0.1`이 아니면 서버가 죽는다). 이 문을 처음 세우는 task가 `profile-form`이다 — 로그인 뒤 화면에 처음 닿는 task라서다.

### 파일을 골라 실행

작성 중에는 바꾼 파일부터 실행한다. 아래는 현재 존재하는 테스트 경로다. `pnpm test`는 unit만 집고 integration은 실행하지 않는다.

```sh
pnpm test src/shared/lib/__tests__/resolve-auth-destination.test.ts
```

integration은 준비와 러너 호출을 나눈다. integration 스크립트는 여러 명령을 연결하므로 파일 인자 전달에 기대지 않는다.

```sh
supabase start
supabase migration up
pnpm exec jest --config jest.integration.config.js src/entities/profile/dals/__tests__/ensure-profile.integration.test.ts
```

## CI와 결과 위치

현재 [ci.yml](../../.github/workflows/ci.yml)의 동작이다. 로컬에서 파일별 검증을 마친 뒤 최종 검증 범위는 이 검사와 작업별 검증 표를 함께 따른다.

- `docs/`·`.claude/`·루트 마크다운만 바뀐 PR은 뒤쪽 셋(supabase 기동·integration·생성 타입 대조)을 건너뛴다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨진다.
- 나머지 PR과 main push는 Supabase 기동 → integration → 생성 타입 대조까지 실행한다. 현재 제외한 Supabase 서비스를 새 테스트가 필요로 하면 CI 기동 범위도 함께 맞춘다.
- 앱을 빌드하는 단계와 e2e가 CI에 없다. 러너는 Maestro로 정해졌지만([ADR-013](../2-design/adr/ADR-013-e2e-runner-maestro.md)) 돌릴 앱 파일이 없다 — 빌드 단계가 EAS 설정과 같이 서고 e2e가 그 뒤에 붙는다.
- PR은 추적 중인 spec·plan의 입력 변경에 대한 「영향 확인」 검사도 실행한다. 구체적인 명령과 대상은 [문서 검사](#pnpm-test에-끼는-문서-검사)에 있다.

| 근거 | 현재 위치와 한계 |
| --- | --- |
| 정적 검사·Jest 결과 | 로컬 터미널 출력 또는 GitHub Actions의 명령별 로그 |
| CI 파일 산출물 | 현재 workflow에 artifact 업로드 단계가 없음. trace의 영구 공유 링크가 있다고 가정하지 않음 |
| 수동·실기기 결과 | [evidence](README.md#evidence)에 절차·실제 결과와 보관한 근거 위치를 기록 |

PR에는 검증한 Git 기준점·미커밋 변경분, 명령과 결과 또는 해당 CI 실행 링크를 적는다. 재시도로 통과한 경우에도 최초 실패와 남은 불안정성을 드러낸다. 필요한 실패 자료는 실행 환경이 사라지기 전에 확인한다.

## 훅

`.claude/hooks/`의 편집 훅 셋과 `.githooks/`의 pre-commit이 각각 작동한다. 근거는 ADR-001과 ADR-005다.

- **`spec-gate.py`** — `feat/<슬러그>` 브랜치에서 `src/`를 고치려면 `docs/2-design/spec/<슬러그>.md`가 `status: approved`여야 한다. `feat/`가 아닌 브랜치(문서·리팩터링·수리)는 게이트 밖이다.
- **`tdd-guard-unit.py`** — `src/`·`tests/lint/`의 실행 코드를 export하는 `.ts`에 짝 테스트를 요구한다. `src/`는 같은 레벨 `__tests__/<이름>.test.ts` 또는 `<이름>.integration.test.ts`, `tests/lint/`는 형제 테스트를 찾는다. `src/app/`·`src/shared/ui/`, 타입 선언·테스트 파일은 예외다. `tests/lint/rule-check.ts`를 고치려면 먼저 짝 테스트가 필요하다. `src/app/`의 예외는 위임만 남는 구조를 전제로 한다.
- **`tdd-guard-e2e.py`** — 화면을 고치려면 `tests/e2e/<이름>.yaml`이 있어야 한다. 이름을 뽑는 규칙은 [`pnpm e2e`](#pnpm-e2e)에 있다. `.tsx`만 화면으로 본다 — `src/screens/` 아래 순수 `.ts`는 밖이다.
- **pre-commit(`.githooks/`)** — 시크릿 패턴을 막고 staged 파일의 포맷을 고쳐 다시 올린다. 일부만 staged된 파일이 포맷에 어긋나면 고치지 않고 막는다 — 그때는 `pnpm format` 뒤 직접 `git add` 한다.

편집 훅은 테스트 파일의 존재를 검사한다. 실패 테스트 실행이나 단언의 품질까지 증명하지 않는다. 실제 실패·통과 확인은 작성자·구현자와 리뷰가 맡는다.

## 집행되는 규칙

기계가 무는 규칙의 정본이다. `tests/lint/rule-catalogue.test.ts`가 이 표를 읽어 `tests/lint/rules.ts`의 목록과 대조하고, 켜져 있다고 적힌 규칙이 실제로 켜져 있는지·짝 테스트 파일이 있는지까지 본다 — 표에 한 줄을 더하고 설정을 안 고치면 `pnpm test`가 막는다.

**번호 6·7·8은 영영 안 쓴다.** 무엇이었는지 끝내 못 찾은 자리고, 그 번호를 새 규칙에 재활용하면 옛 기록이 다른 규칙을 가리키게 된다. 새 규칙은 마지막 번호 다음을 받는다.

| 번호 | 규칙 | 집행 | 집행하는 것 | 짝 테스트 |
| --- | --- | --- | --- | --- |
| 1 | 상대 경로 import 금지 | eslint | `no-restricted-imports` | `tests/lint/relative-import.test.ts` |
| 2 | FSD 역방향 import | eslint | `no-restricted-imports` | `tests/lint/fsd-layer-order.test.ts` |
| 3 | 같은 층 다른 슬라이스 import | house | `house/no-cross-slice-import` | `tests/lint/fsd-slice-boundary.test.ts` |
| 4 | 하드코딩한 색과 크기 | house | `house/no-arbitrary-class-values` | `tests/lint/design-token-values.test.ts` |
| 4 | 하드코딩한 색과 크기 | house | `house/no-color-literals` | `tests/lint/design-token-values.test.ts` |
| 5 | Tailwind 기본 팔레트 유틸리티 | house | `house/no-default-palette-class` | `tests/lint/tailwind-default-palette.test.ts` |
| 9 | .tsx는 더미 UI | house | `house/dumb-ui` | `tests/lint/tsx-dumb-ui.test.ts` |
| 10 | 집중 실행 표시 | eslint | `no-restricted-syntax` | `tests/lint/no-focused-tests.test.ts` |
| 11 | import 순서 | eslint | `import/order` | `tests/lint/import-order.test.ts` |
| 12 | Tailwind 클래스 순서 | prettier | `prettier.config.mjs` | `tests/lint/format-check.test.ts` |
| 13 | console | eslint | `no-console` | `tests/lint/no-console.test.ts` |
| 14 | 미사용 import와 import type | eslint | `unused-imports/no-unused-imports` | `tests/lint/unused-imports.test.ts` |
| 14 | 미사용 import와 import type | eslint | `@typescript-eslint/consistent-type-imports` | `tests/lint/unused-imports.test.ts` |
| 15 | 실행 코드를 쓰기 전에 짝 테스트가 있어야 한다 | hook | `.claude/hooks/tdd-guard-unit.py` | `.claude/hooks/__tests__/tdd-guard.test.ts` |
| 16 | 화면과 라우트를 쓰기 전에 e2e 플로우가 있어야 한다 | hook | `.claude/hooks/tdd-guard-e2e.py` | `.claude/hooks/__tests__/tdd-guard.test.ts` |
| 17 | 시크릿과 .env는 커밋할 수 없다 | pre-commit | `.githooks/pre-commit` | `tests/lint/pre-commit.test.ts` |
| 18 | 승인된 spec 없이 feat 브랜치에서 src/를 고칠 수 없다 | hook | `.claude/hooks/spec-gate.py` | `.claude/hooks/__tests__/spec-gate.test.ts` |
| 19 | 화면 파일의 시각 유틸리티 | house | `house/no-visual-utility-class` | `eslint-rules/__tests__/no-visual-utility-class.test.ts` |

**집행 갈래는 다섯이다.** `eslint`는 기성 규칙, `house`는 [`eslint-rules/`](../../eslint-rules/)의 직접 만든 규칙, `prettier`는 포맷터가 겸하는 것, `hook`은 [`.claude/hooks/`](#훅)의 편집 훅, `pre-commit`은 커밋 앞이다. 앞 셋은 `pnpm lint`나 `pnpm format:check`가 돌리고 뒤 둘은 파일을 쓰는 순간과 커밋하는 순간에 선다.

번호 하나에 줄이 둘인 자리가 있다 — 한 규칙을 규칙 ID 둘이 나눠 무는 경우다. 그래서 **줄 수와 마지막 번호가 다르다** — 번호는 1부터 19까지 이어지고 미배정 셋이 빠지며, 줄은 열여덟이다.

**규칙 19가 켜지는 자리와 무는 자리가 다르다.** `eslint.config.mjs`는 `src/**/*.tsx` 전체에 켜고, 실제로 무는 두 층(`src/screens/**`·`src/features/**`)은 규칙 자신이 든다 — `src/shared/ui/**`는 조각이 사는 자리라, `src/app/_catalog*`는 그 조각을 늘어놓는 자리라 밖이다. 층을 `files` 글롭으로 좁히면 이 표를 읽는 `rule-catalogue.test.ts`가 조각 파일 하나로 「켜져 있는가」를 재는 것과 어긋난다.

## `pnpm test`에 끼는 문서 검사

`tests/lint/`의 문서 검사는 `pnpm test`에 포함된다. 문서만 바꿔도 실행한다.

- `doc-map.ts` — `docs/README.md` 문서 지도의 `docs/` 경로가 실존하는지
- `doc-links.ts` — `docs/`·루트 README·CLAUDE.md의 상대 링크와 앵커. `docs/log/`는 밖이라 당시 경로를 그대로 써도 된다
- `legacy-doc-paths.ts` — 옮기기 전 경로가 문서·정의문·코드에 남았는지
- `design-map.ts` — 화면 문서가 업무 영역 지도에 다 걸렸는지
- `changelog.ts` — 로그가 가리키는 PR이 CHANGELOG에 있는지
- `sources-exist.ts` — spec·plan의 `sources` 경로와 앵커 존재
- `slug-chain.ts` — 적용 대상 기능의 intent·spec·plan 슬러그와 참조 연결
- `backlog-ids.ts` — 작업 ID와 선행 작업 참조
- `route-types.ts` — 생성된 라우트 타입 선언이 온전한지. 판정 규칙 넷(모듈 보강·`__routes` 인터페이스·`href` 멤버·경로 리터럴)을 `pnpm routes:types`가 가져다 쓴다
- `file-naming.ts` — 코드 파일 이름이 규약대로인지. 컴포넌트(`.tsx`)는 PascalCase, 훅은 그 훅 이름과 같은 camelCase, 나머지는 kebab-case다 — 판정은 이름 꼴이 아니라 파일이 무엇을 담았는지로 한다. 케이스만 다른 두 파일도 같이 막는다(macOS·윈도우가 대소문자를 안 구별해 git과 어긋난다). `src/app/`은 밖이다 — 거기 파일 이름은 URL이다. 규약의 정본은 [CLAUDE.md](../../CLAUDE.md)의 「코드 구조」다
- `database-types.ts` — 마이그레이션이 만든 표·뷰·함수가 생성 타입에 다 들었는지, 그리고 생성 타입을 안 물린 `SupabaseClient`를 직접 가져오는 파일이 남았는지. DB 없이 이름만 대조한다 — 실제로 다시 뽑아 diff를 보는 것은 CI가 한다. `pnpm types`가 판정 부분을 가져다 쓴다
- `font-subset.ts` — 서브셋을 거친 서체 넷이 화면이 찍는 2,527자를 다 들었는지. `.ttf`의 `cmap`을 직접 읽는다 — 글자가 빠지면 그 자리가 시스템 서체로 떨어지고 앱은 안 죽어서 다른 검사가 못 잡는다. 집합의 정본이 이 파일이고 `pnpm fonts:subset`이 가져다 쓴다
- `sources-impact.ts` — 추적 중인 문서의 입력 변경에 대한 영향 확인 판정. 추적 여부는 `spec-docs.ts`가 계산한다 — spec은 `status: approved`, plan은 제목 바로 뒤 완료 머리글(`> 완료된 작업의 당시 계획이다`)이 없으면 추적 대상이다. PR에서는 `scripts/check-sources-impact.mts`가 변경 파일 목록과 PR 본문을 받아 실제 영향을 검사. **판정은 파일 단위다** — `sources`가 앵커까지 적지만 그것으로 좁히지 않는다. 정본은 절끼리 엮여 있어 한 절이 바뀌면 이웃 절의 뜻도 움직이고, 좁히면 새는 쪽으로 틀린다. 시끄러운 쪽이 맞다

링크·지도 검사는 내용의 의미나 완료 조건 충족을 대신하지 않는다. 제목·경로를 옮기면 참조도 함께 갱신하고 과거 완료 기록의 본문은 보존한다.

## 돌릴 때

환경·설정을 먼저 확인하고 제품 실패와 구별한다. Docker·서버 기동 실패와 잘못된 import·설정값은 의도한 동작의 실패 증거가 아니다. 새 대상 파일이 아직 없어서 실패한 경우에는 그 사실을 명시하고, 구현 뒤에는 실제 계약의 단언이 실행되어 통과하는지 확인한다.

integration이 스키마·함수를 찾지 못하면 마이그레이션의 적용 누락과 아직 구현할 스키마를 구별한다. writer는 임의로 마이그레이션을 만들지 않고 준비가 필요한 범위를 보고한다.

- `.prettierignore`가 `*.md`를 거른다. 문서에 prettier를 돌려도 아무 일도 안 한다.
- env를 갈아끼우는 헬퍼가 러너에 없다. `process.env`를 직접 쓰고 `afterEach`에서 원래 값으로 되돌린다 — 없던 키는 지운다. `read-supabase-env.test.ts`가 그 자리고, 두 번째 파일이 필요해지면 그때 공용으로 뺀다.
- `tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다. Prettier 3이 `.gitignore`를 ignore 파일로 읽어 픽스처를 건너뛰면 `--check`가 조용히 0으로 끝난다.
- `pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으면 `pnpm install --frozen-lockfile`.
- `tests/lint/`를 worktree 여럿에서 동시에 돌리면 첫 테스트가 기본 5초 타임아웃에서 흔들린다(`new ESLint()` 로드 비용). `--testTimeout=60000`.
- **`react-native`는 대역이 안 먹는다.** `jest.config.js`가 그 이름을 절대경로로 리매핑해서, 테스트 파일이 직접 import할 때는 대역이 서지만 `src/`의 다른 파일이 안에서 `import { AppState } from "react-native"`를 하면 진짜 모듈이 온다(`addEventListener is not a function`). `AppState`·`Linking`처럼 그 네임스페이스에 닿는 것은 대역하지 말고 함수 인자로 주입해라 — 기본값에 실물을 두면 부르는 쪽은 그대로다.
- **`jest` 객체는 전역이 아니다.** `describe`·`it`·`expect`만 전역이고 `jest.fn()`이나 `jest.unstable_mockModule`을 쓰려면 `@jest/globals`에서 가져와야 한다.
- 테스트를 ESM으로 돌려서 `NODE_OPTIONS=--experimental-vm-modules`가 스크립트에 박혀 있다. `scripts/generate-globals-css.mts`의 최상위 `await`과 `import.meta.url` 때문이고, 그 둘은 `pnpm tokens:css`가 그 파일을 직접 실행할 때 필요한 것이라 러너에 맞춰 걷지 않는다. 같은 이유로 `jest.mock()`이 안 먹는다 — 대역이 필요하면 `jest.unstable_mockModule`과 동적 import다.
- `babel.config.js`가 없어서 `jest.config.js`가 babel preset을 직접 물고 있다. 그 파일이 생기면 `.mts`를 TypeScript로 보게 하는 override와 `transformImportMeta: false`가 같이 따라가야 한다.
- type-aware lint(`no-floating-promises` 등)는 속도 때문에 안 켜져 있다. await 빠진 Supabase 호출은 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다 — 대조 테스트가 픽스처로 oklch 리터럴을 쥔다.
- 테스트 픽스처의 표기 — `generate-globals-css.test.ts`의 기대값은 prettier가 정규화한 표기(`rgba(28, 25, 22, 0.05)`)고 `tokens.md` 원문은 축약 표기다. 표에서 그대로 복사하면 틀린다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있다.

## integration과 e2e

- 로컬 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 한다.
- 데이터 준비·정리와 요청 제한은 [테스트 데이터](#테스트-데이터)를 따른다.
- `supabase/config.toml`의 analytics가 꺼져 있어 Studio에 Logs 탭이 없다. 로그는 `docker logs supabase_db_la-bie-belle`로 읽는다. RLS 조회가 빈 결과인 경우처럼 거부가 항상 로그 오류로 남는 것은 아니므로 사용자 세션과 실제 결과를 함께 확인한다.
- e2e는 화면에 보이는 글자로 조각을 잡는다. 글자가 여러 자리에 같이 나와 애매하면 `testID`를 붙이고 그것으로 잡는다. 어느 쪽이든 스타일을 갈아끼워도 그대로 통과해야 한다.

## 테스트 데이터

테스트는 자기 데이터를 직접 준비하고 순서·다른 실행의 잔여 데이터에 기대지 않는다. [supabase 헬퍼](../../tests/integration/supabase.ts)는 고유 이메일로 사용자를 만들고, [postgres 헬퍼](../../tests/integration/postgres.ts)는 로컬 DB 직결로 승인·역할·차단·퇴사 상태를 준비한다. 실제 권한 검증은 [사용자 세션 기준](strategy.md#대역과-실제-의존성)을 따른다.

현재 한계는 다음과 같다. 문서의 원칙과 실제 헬퍼가 제공하는 기능을 구별한다.

- 사용자 정리 헬퍼가 없어 integration·e2e가 만든 사용자가 남는다([관찰 013](../observations/013-integration-users-never-cleaned.md)). 실행이 통과해도 데이터 정리까지 성공한 것으로 기록하지 않는다.
- `postgres.ts`는 이름에 `supabase_db`가 들어가는 컨테이너 중 첫 번째를 고른다. 여러 로컬 프로젝트를 띄웠으면 앱·헬퍼·마이그레이션이 같은 프로젝트를 가리키는지 먼저 확인한다.
- [config.toml](../../supabase/config.toml)의 `sign_in_sign_ups = 30`은 IP당 5분간 로그인·가입 요청 제한이다. 사용자 삭제만으로 요청 제한이 풀리지는 않는다. 제한 오류를 확인하면 제한 시간이 지난 뒤 재실행하고 반복 검증의 요청 수를 별도로 점검한다. CI도 한 실행 안에서 제한을 넘길 수 있다.

자기 실행이 만든 데이터 정리·DB 대상 명시·반복 실행의 요청 수 관리는 [backlog](../backlog.md)의 `test-data-isolation` 후보로 연결한다. 완료된 계정 전환의 후속 과제이며 이번 문서 변경으로 해결된 것은 아니다.
