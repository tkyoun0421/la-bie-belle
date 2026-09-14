# 4-test — 검증

- `strategy.md` — 리스크를 어느 층(unit·integration·e2e)에 배정하는지의 기준. `test-planner`의 참조 정본

테스트 코드가 어디 사는지는 ADR-001이 정했다. 테스트를 먼저 쓰고 실패를 확인한 뒤 구현하는 규율도 거기 있다.

## 훅

`.claude/hooks/`의 넷이 편집을 막는다. 근거는 ADR-001과 ADR-005다.

- **`spec-gate.py`** — `feat/<슬러그>` 브랜치에서 `src/`를 고치려면 `docs/2-design/spec/<슬러그>.md`가 `status: approved`여야 한다. `feat/`가 아닌 브랜치(문서·리팩터링·수리)는 게이트 밖이다.
- **`tdd-guard-unit.py`** — `src/`와 `tests/lint/`에 짝 테스트를 요구한다. `tests/` 아래에서는 짝을 `__tests__/`가 아니라 형제 `<이름>.test.ts`로 찾는다. `tests/e2e/`는 감시 밖이고 CI의 `pnpm test`가 대신 잡는다. `tests/lint/rule-check.ts`는 짝이 없어서 고치려면 먼저 `rule-check.test.ts`를 쓴다. `src/app/`의 `.ts`는 위임만 남아 `SKIP_PREFIXES`에 있다 — 거기 로직이 다시 들어오면 훅을 좁힌다.
- **`tdd-guard-e2e.py`** — `src/screens/` 아래 순수 `.ts`도 화면으로 오판해 `tests/e2e/<이름>.spec.ts`를 요구할 수 있다. 관찰 006이 열려 있다.
- **pre-commit(`.githooks/`)** — 시크릿 패턴을 막고 staged 파일의 포맷을 고쳐 다시 올린다. 일부만 staged된 파일이 포맷에 어긋나면 고치지 않고 막는다 — 그때는 `pnpm format` 뒤 직접 `git add` 한다.

## `pnpm test`에 끼는 문서 검사

`tests/lint/`의 다섯이 문서를 읽는다. 문서만 바꿔도 깨지는 자리가 있다.

- `doc-map.ts` — CLAUDE.md 문서 지도의 `docs/` 경로가 실존하는지
- `doc-links.ts` — `docs/`와 루트 README의 상대 링크와 앵커. `docs/log/`는 밖이라 당시 경로를 그대로 써도 된다
- `legacy-doc-paths.ts` — 옮기기 전 경로가 문서·정의문·코드에 남았는지
- `design-map.ts` — `design-system/pages/*.md`가 디자인 시스템 지도에 다 걸렸는지
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

## integration과 e2e

- 로컬 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 한다.
- integration 테스트가 만든 사용자를 치우지 않는다 — anon 키로는 `auth.users`를 못 지우고 service role은 금지다(ADR-003). `supabase/config.toml`이 가입을 IP당 5분에 서른 번으로 막는데 e2e도 사용자를 만드니 여러 회차를 연달아 돌리면 닿는다. 로컬에서 연타해도 같은 한도에 걸린다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- `supabase/config.toml`의 analytics가 꺼져 있어 Studio에 Logs 탭이 없다. 로그는 `docker logs supabase_db_la-bie-belle`로 읽는다 — RLS가 막은 순간은 `permission denied for table ...`로 찍힌다. 화면이 붙어 API 트래픽을 걸러 봐야 할 때 다시 켠다.
- e2e는 역할과 이름으로 화면을 잡는다. 스타일을 갈아끼워도 그대로 통과해야 한다.
