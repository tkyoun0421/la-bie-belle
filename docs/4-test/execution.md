# 검증 실행

실행 전제와 명령, 훅과 문서 검사, 실패 진단, 결과 찾는 자리가 산다. 검증 방법 선택과 완료 판정은 [strategy](strategy.md), 계획·결과 작성법은 [README](README.md)를 따른다.

**여기 적힌 명령은 지금 저장소가 돌리는 것이다.** [Expo 골격](../3-build/plans/expo-scaffold.md)이 서는 중이라 아직 안 옮겨진 자리가 하나 있다 — 걷어낸 e2e가 Maestro나 Detox로 간다. 그것이 정해지면 이 문서가 따라간다.

## 명령

저장소 루트에서 Node 22와 pnpm 8.15.2로 실행한다. 아래 일곱이 로컬과 CI가 같이 돌리는 명령이다. 정본은 [package.json](../../package.json)의 `scripts`와 [ci.yml](../../.github/workflows/ci.yml)이다.

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

### `pnpm typecheck`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다.
- 실행: `pnpm typecheck` — `tsc --noEmit`.
- 정상 결과: tsc 오류 없이 종료 코드 0.
- 실패할 때: `@supabase/supabase-js`를 못 찾으면 [돌릴 때](#돌릴-때)를 본다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm typecheck` 단계.

### `pnpm test`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다. unit만 돌아 Docker가 필요 없다.
- 실행: `pnpm test` — `jest`. 갈래는 `jest.config.js`의 `testMatch`가 가르고 integration은 부정 glob으로 빠진다.
- 정상 결과: 실패 0. `tests/lint/`의 문서 검사도 여기서 같이 돈다 — [`pnpm test`에 끼는 문서 검사](#pnpm-test에-끼는-문서-검사).
- 실패할 때: 첫 테스트가 타임아웃에서 흔들리거나 픽스처 표기가 어긋나면 [돌릴 때](#돌릴-때)를 본다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm test` 단계.

### `pnpm test:integration`

- 전제: 로컬 Docker가 떠 있다. 스택이 이미 떠 있으면 `pnpm test:integration:run`으로 기동을 건너뛴다.
- 실행: `pnpm test:integration` — `supabase start` 뒤 `supabase migration up && jest --config jest.integration.config.js`.
- 정상 결과: 실패 0.
- 실패할 때: 가입 한도와 로그 읽는 자리는 [integration과 e2e](#integration과-e2e)가 든다.
- 근거 위치: CI는 테스트가 쓰는 서비스만 `supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime`으로 띄우고 `pnpm test:integration:run`을 돌린다.

### `pnpm dev`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있고 `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_ANON_KEY`가 env에 있다. 값은 번들에 박히므로 띄우기 전에 넘긴다.
- 실행: `pnpm dev` — `expo start`. 뜨는 QR을 Expo Go로 찍으면 기기에서 본다.
- 정상 결과: 번들이 만들어지고 기기에 첫 화면이 뜬다.
- 실패할 때: NativeWind가 CSS를 빌드 때 읽으니 `globals.css`가 네이티브 컴파일러가 안 받는 문법을 들면 여기서 던진다.
- 근거 위치: 아직 CI 단계가 없다. 빌드를 검사에 넣는 자리는 EAS 설정과 같이 선다.

### e2e

**지금 없다.** Playwright를 Expo로 옮기며 걷었고 Maestro와 Detox 중 무엇을 쓸지는 아직 안 정했다 — 화면이 하나도 없어 볼 것이 없어서다([expo-scaffold](../3-build/plans/expo-scaffold.md)). 첫 화면 task가 서기 전에 정한다.

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

- `docs/`·`.claude/`·루트 마크다운만 바뀐 PR은 뒤쪽 둘(supabase 기동·integration)을 건너뛴다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨진다.
- 나머지 PR과 main push는 Supabase 기동 → integration까지 실행한다. 현재 제외한 Supabase 서비스를 새 테스트가 필요로 하면 CI 기동 범위도 함께 맞춘다.
- 앱을 빌드하는 단계와 e2e가 CI에 없다. 빌드는 EAS 설정과 같이 서고 e2e는 러너를 고르고 나서다.
- PR은 승인된 spec 입력 변경에 대한 「영향 확인」 검사도 실행한다. 구체적인 명령과 대상은 [문서 검사](#pnpm-test에-끼는-문서-검사)에 있다.

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
- **`tdd-guard-e2e.py`** — `src/screens/` 아래 순수 `.ts`도 화면으로 오판해 `tests/e2e/<이름>.spec.ts`를 요구할 수 있다. 관찰 006이 열려 있다.
- **pre-commit(`.githooks/`)** — 시크릿 패턴을 막고 staged 파일의 포맷을 고쳐 다시 올린다. 일부만 staged된 파일이 포맷에 어긋나면 고치지 않고 막는다 — 그때는 `pnpm format` 뒤 직접 `git add` 한다.

편집 훅은 테스트 파일의 존재를 검사한다. 실패 테스트 실행이나 단언의 품질까지 증명하지 않는다. 실제 실패·통과 확인은 작성자·구현자와 리뷰가 맡는다.

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
- `sources-impact.ts` — 승인된 입력 변경의 영향 확인 판정. PR에서는 `scripts/check-sources-impact.mts`가 변경 파일 목록과 PR 본문을 받아 실제 영향을 검사

링크·지도 검사는 내용의 의미나 완료 조건 충족을 대신하지 않는다. 제목·경로를 옮기면 참조도 함께 갱신하고 과거 완료 기록의 본문은 보존한다.

## 돌릴 때

환경·설정을 먼저 확인하고 제품 실패와 구별한다. Docker·서버 기동 실패와 잘못된 import·설정값은 의도한 동작의 실패 증거가 아니다. 새 대상 파일이 아직 없어서 실패한 경우에는 그 사실을 명시하고, 구현 뒤에는 실제 계약의 단언이 실행되어 통과하는지 확인한다.

integration이 스키마·함수를 찾지 못하면 마이그레이션의 적용 누락과 아직 구현할 스키마를 구별한다. writer는 임의로 마이그레이션을 만들지 않고 준비가 필요한 범위를 보고한다.

- `.prettierignore`가 `*.md`를 거른다. 문서에 prettier를 돌려도 아무 일도 안 한다.
- env를 갈아끼우는 헬퍼가 러너에 없다. `process.env`를 직접 쓰고 `afterEach`에서 원래 값으로 되돌린다 — 없던 키는 지운다. `read-supabase-env.test.ts`가 그 자리고, 두 번째 파일이 필요해지면 그때 공용으로 뺀다.
- `tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다. Prettier 3이 `.gitignore`를 ignore 파일로 읽어 픽스처를 건너뛰면 `--check`가 조용히 0으로 끝난다.
- `pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으면 `pnpm install --frozen-lockfile`.
- `tests/lint/`를 worktree 여럿에서 동시에 돌리면 첫 테스트가 기본 5초 타임아웃에서 흔들린다(`new ESLint()` 로드 비용). `--testTimeout=60000`.
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
- e2e는 역할과 이름으로 화면을 잡는다. 스타일을 갈아끼워도 그대로 통과해야 한다.

## 테스트 데이터

테스트는 자기 데이터를 직접 준비하고 순서·다른 실행의 잔여 데이터에 기대지 않는다. [supabase 헬퍼](../../tests/integration/supabase.ts)는 고유 이메일로 사용자를 만들고, [postgres 헬퍼](../../tests/integration/postgres.ts)는 로컬 DB 직결로 승인·역할·차단·퇴사 상태를 준비한다. 실제 권한 검증은 [사용자 세션 기준](strategy.md#대역과-실제-의존성)을 따른다.

현재 한계는 다음과 같다. 문서의 원칙과 실제 헬퍼가 제공하는 기능을 구별한다.

- 사용자 정리 헬퍼가 없어 integration·e2e가 만든 사용자가 남는다([관찰 013](../observations/013-integration-users-never-cleaned.md)). 실행이 통과해도 데이터 정리까지 성공한 것으로 기록하지 않는다.
- `postgres.ts`는 이름에 `supabase_db`가 들어가는 컨테이너 중 첫 번째를 고른다. 여러 로컬 프로젝트를 띄웠으면 앱·헬퍼·마이그레이션이 같은 프로젝트를 가리키는지 먼저 확인한다.
- [config.toml](../../supabase/config.toml)의 `sign_in_sign_ups = 30`은 IP당 5분간 로그인·가입 요청 제한이다. 사용자 삭제만으로 요청 제한이 풀리지는 않는다. 제한 오류를 확인하면 제한 시간이 지난 뒤 재실행하고 반복 검증의 요청 수를 별도로 점검한다. CI도 한 실행 안에서 제한을 넘길 수 있다.

자기 실행이 만든 데이터 정리·DB 대상 명시·반복 실행의 요청 수 관리는 [backlog](../backlog.md)의 `test-data-isolation` 후보로 연결한다. 완료된 계정 전환의 후속 과제이며 이번 문서 변경으로 해결된 것은 아니다.
