# P0-T05 handoff

## 2026-08-06 · 개발 단계 종료

- 작업 식별자: P0-T05 (CI와 문서 인덱스 검증)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-06

### 확정된 사실

- 구현 착수 전 4종 검사를 Node 프로토타입으로 실제 저장소에 먼저 시험 적용해 RADIO의 "현재 상태 위반 0" 전제가 깨지는 기존 문서 결함 8건을 발견했다 — 전부 이 RADIO의 원래 변경 허용 경로 밖 파일이었다. 조정자가 사용자 결정을 받아 RADIO를 revision 2로 재승인·재봉인했다(SHA-256 `991ccfdaf1ca6f53d9c29657792838424e076a238e83962b0ad5a5654ea122f5`, `index.jsonl`의 `development_approval` 갱신). 반영 내용: ① heading 존재·제목 일치 검사를 `product_approval`이 기록된 task로 한정한다(P0-T36·P7-T09는 `proposed` 상태라 phase 절이 아직 없는 것이 정상이며 결함이 아니었다). ② `docs/execution/runs/P0-T29/handoff.md`의 내부 링크 5건(`../../workflow/WORKFLOW.md`·`../../workflow/REVIEW.md`×3·`../../standards/adr/0012-...md`)이 상대 경로가 한 단계 얕아 깨져 있어 `../../../`로 경로 깊이만 고쳤다(내용·승인·이력은 그대로). ③ `docs/execution/phases/01-identity-and-staff.md`의 `P1-T06` heading을 index 제목("휴면 계정 상태와 접근 차단")으로 정합했다(기존 heading은 "휴면"이 빠져 있었다). 두 파일이 RADIO의 변경 허용 경로에 추가됐다.
- `harness/lib/docs-check.ts`를 신설했다. 검사 4종 — ① `depends_on` 그래프 DFS로 순환을 검출(사이클 경로를 메시지에 담음, 전체 entries 대상이라 phase·task record가 섞인 실제 그래프도 다룬다) ② `product_approval`이 있는 task만 `doc` 필드가 가리키는 phase 문서에서 `### <id>. <제목>` heading의 존재·제목 일치를 검사 ③ `spec_refs`를 접두(`ADR`·`PRD`·`DOMAIN`·`DOCS`)별로 실제 문서와 대조, 미지의 접두·구분자 없는 값도 위반 ④ `docs/**/*.md`·`CLAUDE.md`·`README.md`의 상대 링크(`](...)`)에서 anchor를 뗀 대상 경로의 존재를 검사(외부 `http(s)://`·순수 anchor `#...`는 제외). 기존 `task-index.ts`·`violation.ts`·`repo.ts`를 재사용했다.
- `harness/checks/docs.ts`(얇은 진입점, `gates/`가 아닌 별도 디렉터리)를 신설하고 `package.json`에 `check:docs`를 등록했다.
- TDD 순서를 따랐다(test_mode는 verification이라 `tdd.json` 의무는 없음): `harness/self-test/docs-check.test.ts`를 먼저 작성한 뒤 `harness/lib/docs-check.ts`를 일시적으로 치워 모듈 부재로 실패함을 확인했고, 파일을 되돌려 6개 테스트(위반 4종 각 1건 + `product_approval` 없는 task 면제 확인 + 실제 저장소 오탐 대조군)가 모두 통과함을 확인했다.
- `verify` 체인을 RADIO 순서(`format:check → lint:ci → typecheck → test → harness:typecheck → harness:self-test → check:docs → build → check:app-build → check:client-secret-scan → test:e2e → gate:all`)로 재구성했다. `scripts/check-app-build.mjs`·`scripts/client-secret-scan.mjs`에 `--reuse-build` 인자를 추가해 인자가 있으면 자체 `pnpm build`를 생략하고, 인자가 없으면 기존처럼 자체 빌드한다. `playwright.config.ts`의 `webServer.command`를 `pnpm build && pnpm start`에서 `pnpm start`로 바꿔 기존 `.next`를 재사용하게 했고 `reuseExistingServer`를 `!process.env.CI`로 바꿨다. 로컬에서 `pnpm verify` 전체를 실행해 "Creating an optimized production build" 로그가 정확히 1회만 나타남을 확인했다(빌드 재사용 경로 재현). `pnpm check:app-build`·`pnpm check:client-secret-scan`을 각각 인자 없이 단독 실행해 자체 빌드 경로도 별도로 재현했다.
- `eslint.config.mjs`의 `no-console`을 `warn`에서 `error`로 올렸다. `src/`에 기존 `console` 사용이 없어 `pnpm lint`가 그대로 통과했다.
- `.github/workflows/ci.yml`을 신설했다. 트리거는 `push`(`main`)·`pull_request`. `app-verify` job(checkout → pnpm/Node 설치+캐시 → `pnpm install --frozen-lockfile` → Playwright 브라우저 캐시(`~/.cache/ms-playwright`, `pnpm-lock.yaml` 해시 키)+설치 → `cp .env.example .env` → `pnpm verify`)과 `db-verify` job(checkout → pnpm/Node 설치 → `supabase/setup-cli@v1`(버전 `2.75.0` 고정, 로컬 설치 버전과 동일) → `supabase start` → `pnpm db:test`)을 독립 병렬로 실행한다. Job 이름은 `app-verify`·`db-verify`로 고정했다(Interface 절, 향후 branch protection의 required checks 이름). `actionlint`가 로컬에 없어 `js-yaml`로 파싱해 구조(트리거·job·step)를 확인했다 — YAML 문법 오류는 없다. 실제 워크플로 실행은 로컬에서 재현할 수 없다.
- `docs/workflow/TOOLING.md`의 tdd-guard 테스트 탐색 서술 한 줄만 정정했다. "형제 → __tests__/(상위 포함) → src/__tests__/ → 루트 tests/" 4단 폴백 서술을 "세그먼트 __tests__/<대상>.test.<확장자> 하나만 인정(config/fsd.json의 testPlacement 계약이 정본)"으로 바꾸고 P0-T38 이전 폴백 서술을 없앴다. 그 외 문장은 건드리지 않았다.
- 로컬 `.env`는 gitignore 대상이라 저장소에 없었다 — CI와 동일하게 `cp .env.example .env`로 만든 뒤 검증했다(커밋 대상 아님).
- 검증 결과: `pnpm verify` 전체 통과(`format:check`·`lint:ci`·`typecheck`·`test`·`harness:typecheck`·`harness:self-test`(140/140)·`check:docs`·`build`·`check:app-build`·`check:client-secret-scan`·`test:e2e`(1/1)·`gate:all`), `check:docs` 단독 실행 위반 0건, `src/` 상대 import 0건 등 기존 게이트 전부 유지.

### 미결 사항

- 실제 GitHub Actions 실행 성공 확인(RADIO 위험 기반 테스트: "브랜치 push로 실제 워크플로 실행 성공을 확인하고 실행 URL을 handoff에 기록")은 로컬에서 할 수 없다 — 결정 주체: 조정자, 반환할 단계: main push 후 이 handoff에 실행 URL을 추가 기록.
- GitHub branch protection(required checks: `app-verify`·`db-verify`) 설정은 저장소 설정 화면의 1회 수동 작업이 필요하다 — 결정 주체: 사용자, 반환할 단계: 이 task 종결 보고 시 안내(RADIO 미결 사항 그대로).
- `db-verify`의 pgTAP 실행이 CI에서 유의미하게 느리면 트리거 축소(PR만)를 후속 결정한다 — 결정 주체: 조정자+사용자, 반환할 단계: 실측 후(RADIO 미결 사항 그대로).
- Markdown heading anchor 유효성 검증은 파일 존재 검사에서 제외했다(설계 비목표) — 결정 주체: 후속 task, 반환할 단계: 해당 task 기획.
- `playwright.config.ts`의 `webServer.command`가 더 이상 자체 빌드하지 않으므로, `pnpm build` 없이 `pnpm test:e2e`만 단독 실행하면 `.next` 산출물이 없어 실패할 수 있다 — 로컬 반복 개발 시 `pnpm build`를 먼저 실행해야 한다는 동작 변화를 기록한다.
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남긴다.

### 다음 행동

1. `main`에 push해 실제 워크플로(`app-verify`·`db-verify`) 실행 성공을 확인하고 실행 URL을 이 handoff에 추가한다.
2. GitHub 저장소 설정에서 branch protection required checks를 등록하도록 사용자에게 안내한다.
3. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T05-review.json`에 기록한다.
4. 검증 통과 후 `index.jsonl`의 P0-T05를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `harness/lib/docs-check.ts`
- `harness/checks/docs.ts`
- `harness/self-test/docs-check.test.ts`
- `package.json`(`check:docs` 등록, `verify` 체인 재구성)
- `scripts/check-app-build.mjs`·`scripts/client-secret-scan.mjs`(`--reuse-build`)
- `playwright.config.ts`(`webServer.command`·`reuseExistingServer`)
- `eslint.config.mjs`(`no-console` error)
- `.github/workflows/ci.yml`
- `docs/workflow/TOOLING.md`(tdd-guard 테스트 탐색 절)
- `docs/execution/runs/P0-T29/handoff.md`(내부 링크 경로 깊이 수정)
- `docs/execution/phases/01-identity-and-staff.md`(P1-T06 heading 정합)
- `docs/execution/radio/P0-T05-radio.md`(revision 2)
- `docs/execution/phases/index.jsonl`(P0-T05 `in_progress`, `development_approval` revision 2)

## 2026-08-06 · 검증 단계 — 확정 8건, high 1건 수정 재진입

- 작성 주체: 조정자
- 교차 검증 결과: `docs/execution/reviews/P0-T05-review.json` — 확정 8건(high 1·medium 2·low 5), 부분 기각 1건(F-07의 디렉터리 링크 부분은 근거 반박으로 좁힘). 총점 87.
- **high 실증**: F-01(db-verify의 cache: pnpm)이 첫 CI 실행(run 31022541665)에서 실제로 발현했다 — supabase start·pnpm db:test까지 전 기능 단계 통과 후 'Post Run actions/setup-node'의 Path Validation Error로 job 실패. app-verify는 1m17s에 통과해 pnpm verify 전체가 CI 환경에서 성립함이 확인됐다.
- 수정 방향(조정자 판독): F-01은 승인 설계 밖 단계가 들어온 구현 결함이라 설계 재승인 없이 db-verify의 `cache: pnpm` 제거로 수정한다. medium·low 7건은 backlog에 누적했다 — F-03(중복 task ID 검사 부재)은 RADIO가 신설 검사를 4종으로 한정해 이번 범위 밖이며 후속 task 승격 후보로 기록한다.

### 미결 사항 (검증 단계 추가)

- 중복 task ID 검사의 소유 task — 결정 주체: 사용자(후속 등록 시), 반환할 단계: 기획.
- branch protection(required checks: app-verify·db-verify) 설정은 GitHub 저장소 설정 화면의 1회 수동 작업이다 — 결정 주체: 사용자, 반환할 단계: P0-T05 종결 보고.

## 2026-08-06 · high 1건 수정 반영

- 작업 식별자: P0-T05 (CI와 문서 인덱스 검증)
- 현재 단계: 확정 high 1건(F-01) 수정 → 다음 재검증
- 기준 시각: 2026-08-06

### 확정된 사실

- `.github/workflows/ci.yml`의 `db-verify` job에서 `actions/setup-node`의 `cache: pnpm` 줄을 제거했다. 설계 변경 없이 RADIO revision 2 봉인 그대로 구현만 고쳤다 — `db-verify`는 `node_modules` 설치가 없어(스크립트가 `supabase` CLI만 호출) pnpm store 캐시가 애초에 무의미했고, 캐시 복원 대상 경로가 없어 첫 실행(run 31022541665)에서 `supabase start`·`pnpm db:test`까지 모두 통과한 뒤 `Post Run actions/setup-node` 단계의 Path Validation Error로 job이 실패했다. `setup-node` 단계 자체는 유지한다(`pnpm db:test` 실행에 Node가 필요하다). `app-verify` job은 건드리지 않았다.
- 로컬에서 `pnpm gate:all`이 통과함을 확인했다. YAML은 `js-yaml`로 다시 파싱해 `db-verify`의 `setup-node` `with` 값이 `{"node-version":"22"}`(캐시 키 없음)임을 확인했다 — 문법 오류 없음. 실제 CI 재실행은 로컬에서 재현할 수 없다.
- `docs/execution/reviews/`(`backlog.md`, `P0-T05-review.json`)는 이 RADIO의 변경 허용 경로 밖이라 스테이징하지 않았다. 이번 커밋에는 `.github/workflows/ci.yml`과 이 handoff 절만 포함한다.

### 미결 사항

- F-01 반영 후 실제 워크플로 재실행 성공 확인(특히 `db-verify`의 `Post Run actions/setup-node` 통과 여부)은 조정자가 push 후 수행하고 실행 URL을 기록한다 — 결정 주체: 조정자, 반환할 단계: 이 handoff에 추가 기록.
- medium·low 7건과 branch protection 설정은 이전 절의 조정자 판독대로 backlog·후속 처리로 남는다. 이번 수정으로 상태가 바뀌지 않았다.
- 재교차검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 `in_progress`로 남긴다.

### 다음 행동

1. `main`에 push해 `db-verify`가 `Post Run actions/setup-node` 단계까지 포함해 성공하는지 조정자가 재확인한다.
2. 통과 확인 후 `index.jsonl`의 P0-T05를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `.github/workflows/ci.yml`(`db-verify`의 `cache: pnpm` 제거)
