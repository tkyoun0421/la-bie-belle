# 검증 실행

실행 전제와 명령, 훅과 문서 검사, 실패 진단, 결과 찾는 자리가 산다.

## 명령

아래 일곱이 로컬과 CI가 같이 돌리는 명령이다. 정본은 `package.json`의 `scripts`와 `.github/workflows/ci.yml`이다.

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
- 실행: `pnpm typecheck` — `next typegen && tsc --noEmit`.
- 정상 결과: `Types generated successfully` 뒤 tsc 오류 없이 종료 코드 0.
- 실패할 때: `@supabase/supabase-js`를 못 찾거나 `pnpm build`와 결과가 갈리면 [돌릴 때](#돌릴-때)를 본다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm typecheck` 단계.

### `pnpm test`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있다. unit만 돌아 Docker가 필요 없다.
- 실행: `pnpm test` — `vitest run --project unit`.
- 정상 결과: 실패 0. `tests/lint/`의 문서 검사도 여기서 같이 돈다 — [`pnpm test`에 끼는 문서 검사](#pnpm-test에-끼는-문서-검사).
- 실패할 때: 첫 테스트가 타임아웃에서 흔들리거나 픽스처 표기가 어긋나면 [돌릴 때](#돌릴-때)를 본다.
- 근거 위치: PR의 `ci` 워크플로 `pnpm test` 단계.

### `pnpm test:integration`

- 전제: 로컬 Docker가 떠 있다. 스택이 이미 떠 있으면 `pnpm test:integration:run`으로 기동을 건너뛴다.
- 실행: `pnpm test:integration` — `supabase start` 뒤 `supabase migration up && vitest run --project integration`.
- 정상 결과: 실패 0.
- 실패할 때: 가입 한도와 로그 읽는 자리는 [integration과 e2e](#integration과-e2e)가 든다.
- 근거 위치: CI는 테스트가 쓰는 서비스만 `supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime`으로 띄우고 `pnpm test:integration:run`을 돌린다.

### `pnpm build`

- 전제: `pnpm install --frozen-lockfile`이 끝나 있고 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`가 env에 있다. 주입 순서는 [배포 절차](../5-deploy/procedure.md)가 든다.
- 실행: `pnpm build` — `next build`.
- 정상 결과: 컴파일과 라우트 수집이 끝나고 종료 코드 0.
- 실패할 때: 보는 범위가 `pnpm typecheck`와 다르다 — [돌릴 때](#돌릴-때).
- 근거 위치: PR의 `ci` 워크플로 `pnpm build` 단계.

### `pnpm e2e`

- 전제: `pnpm build`가 끝나 있고 브라우저가 설치돼 있다(`pnpm exec playwright install --with-deps chromium`). 로컬 Supabase도 떠 있어야 한다.
- 실행: `pnpm e2e` — `playwright test`.
- 정상 결과: 실패 0.
- 실패할 때: 사용자를 만드는 테스트가 가입 한도에 걸릴 수 있다 — [integration과 e2e](#integration과-e2e).
- 근거 위치: PR의 `ci` 워크플로 `pnpm e2e` 단계와 `playwright-report/`.

CI가 이 명령들을 어디까지 돌리는지는 둘로 갈린다.

- `docs/`·`.claude/`·루트 마크다운만 바뀐 PR은 뒤쪽 넷(integration·build·e2e·supabase 기동)을 건너뛴다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨진다.
- chromium만 돈다. webkit은 `backlog.md` 후보다.

## 훅

`.claude/hooks/`의 넷이 편집을 막는다. 근거는 ADR-001과 ADR-005다.

- **`spec-gate.py`** — `feat/<슬러그>` 브랜치에서 `src/`를 고치려면 `docs/2-design/spec/<슬러그>.md`가 `status: approved`여야 한다. `feat/`가 아닌 브랜치(문서·리팩터링·수리)는 게이트 밖이다.
- **`tdd-guard-unit.py`** — `src/`와 `tests/lint/`에 짝 테스트를 요구한다. `tests/` 아래에서는 짝을 `__tests__/`가 아니라 형제 `<이름>.test.ts`로 찾는다. `tests/e2e/`는 감시 밖이고 CI의 `pnpm test`가 대신 잡는다. `tests/lint/rule-check.ts`는 짝이 없어서 고치려면 먼저 `rule-check.test.ts`를 쓴다. `src/app/`의 `.ts`는 위임만 남아 `SKIP_PREFIXES`에 있다 — 거기 로직이 다시 들어오면 훅을 좁힌다.
- **`tdd-guard-e2e.py`** — `src/screens/` 아래 순수 `.ts`도 화면으로 오판해 `tests/e2e/<이름>.spec.ts`를 요구할 수 있다. 관찰 006이 열려 있다.
- **pre-commit(`.githooks/`)** — 시크릿 패턴을 막고 staged 파일의 포맷을 고쳐 다시 올린다. 일부만 staged된 파일이 포맷에 어긋나면 고치지 않고 막는다 — 그때는 `pnpm format` 뒤 직접 `git add` 한다.

## `pnpm test`에 끼는 문서 검사

`tests/lint/`의 다섯이 문서를 읽는다. 문서만 바꿔도 깨지는 자리가 있다.

- `doc-map.ts` — `docs/README.md` 문서 지도의 `docs/` 경로가 실존하는지
- `doc-links.ts` — `docs/`와 루트 README의 상대 링크와 앵커. `docs/log/`는 밖이라 당시 경로를 그대로 써도 된다
- `legacy-doc-paths.ts` — 옮기기 전 경로가 문서·정의문·코드에 남았는지
- `design-map.ts` — 화면 문서가 업무 영역 지도에 다 걸렸는지
- `changelog.ts` — 로그가 가리키는 PR이 CHANGELOG에 있는지

## 돌릴 때

- `.prettierignore`가 `*.md`를 거른다. 문서에 prettier를 돌려도 아무 일도 안 한다.
- vitest가 `NEXT_PUBLIC_*`을 `process.env`에 안 얹는다 — Vite의 `envPrefix` 기본값이 `VITE_`라서다. env를 읽는 코드는 `vi.stubEnv`로 채운다. `create-supabase-server-client`는 env가 없으면 던진다.
- `tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다. Prettier 3이 `.gitignore`를 ignore 파일로 읽어 픽스처를 건너뛰면 `--check`가 조용히 0으로 끝난다.
- `pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으면 `pnpm install --frozen-lockfile`.
- `pnpm typecheck`와 `pnpm build`가 보는 범위가 다르다. 빌드는 `tsconfig.build.json`으로 테스트를 뺀다 — 테스트 파일의 타입 오류는 `typecheck`나 `test`에서만 드러난다.
- `tests/lint/`를 worktree 여럿에서 동시에 돌리면 첫 테스트가 기본 5초 타임아웃에서 흔들린다(`new ESLint()` 로드 비용). `--testTimeout=60000`.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도 때문에 안 켜져 있다. await 빠진 Supabase 호출은 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다 — 대조 테스트가 픽스처로 oklch 리터럴을 쥔다.
- 테스트 픽스처의 표기 — `generate-globals-css.test.ts`의 기대값은 prettier가 정규화한 표기(`rgba(28, 25, 22, 0.05)`)고 `tokens.md` 원문은 축약 표기다. 표에서 그대로 복사하면 틀린다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있다.

## integration과 e2e

- 로컬 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 한다.
- integration 테스트가 만든 사용자를 치우지 않는다 — anon 키로는 `auth.users`를 못 지우고 service role은 금지다(ADR-003). `supabase/config.toml`이 가입을 IP당 5분에 서른 번으로 막는데 e2e도 사용자를 만드니 여러 회차를 연달아 돌리면 닿는다. 로컬에서 연타해도 같은 한도에 걸린다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- `supabase/config.toml`의 analytics가 꺼져 있어 Studio에 Logs 탭이 없다. 로그는 `docker logs supabase_db_la-bie-belle`로 읽는다 — RLS가 막은 순간은 `permission denied for table ...`로 찍힌다. 화면이 붙어 API 트래픽을 걸러 봐야 할 때 다시 켠다.
- e2e는 역할과 이름으로 화면을 잡는다. 스타일을 갈아끼워도 그대로 통과해야 한다.
