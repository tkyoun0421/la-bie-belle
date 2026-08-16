# P0-T47 handoff

## 2026-08-17 · 개발 진행 중

- 작업 식별자: P0-T47 (디자인 단계와 /publish-ui 도입)
- 현재 단계: 개발 진행 중 → 커밋 대기
- 기준 시각: 2026-08-17

### 확정된 사실

- RADIO revision 4가 봉인돼 있다(SHA `f7bfc22304d6…`). revision 2가 FOUNDATIONS 간격 표에 `space-0`를, revision 3이 반 칸 셋(`space-0.5`·`space-1.5`·`space-2.5`)과 `env()` 임의값 린트 예외를, revision 4가 `.gitignore`를 범위에 넣었다. `index.jsonl`의 `development_approval`이 revision 4와 그 SHA를 가리킨다.
- `.claude/skills/publish-ui/`가 `.gitignore`의 `.claude/skills/*`에 걸려 저장소에 들어가지 않고 있었다. `!.claude/skills/publish-ui/` 한 줄을 더해 열었다 — `coach`·`decision`·`explain`·`loop-mode`·`verify`가 이미 같은 방식이다.
- 하네스·린트 구역이 GREEN이다. `harness/lib/token-parity.ts`(self-test 11건), `harness/design/build.ts`(9건), `tools/eslint-plugin-project/rules/spacing-scale.mjs`(34건). `pnpm harness:self-test`가 364 pass / 0 fail로 통과했고 `tdd.json`에 RED 2건·GREEN 2건이 같은 명령으로 기록돼 있다.
- `gate:tokens`가 `harness/lib/gate-suite.ts`의 `REPOSITORY_GATES`와 `COMMIT_GATES` 양쪽에 편입됐고 `package.json`에 `gate:tokens`·`design:build` 스크립트가 있다.
- `globals.css`에 간격 토큰 `--spacing-0`~`--spacing-12`(반 칸 포함)와 하단 여백 토큰 둘이 들어갔고, `gate:tokens` 실물 대조가 exit 0이다.
- 뷰 15개 파일에서 `pb-24`→`pb-nav-safe`, `pb-28`→`pb-nav-action-safe` 치환이 끝났다. `OnboardingView`의 `pb-36`은 제거돼 `p-6`만 남았다.
- `project/spacing-scale`이 `eslint.config.mjs`에 `error`로 켜졌고 `npx eslint src`가 통과한다.
- 조정자 소유 문서가 완료됐다 — `SKILL.md`, `publisher.md`, `unit-test-writer.md`·`implementer.md` 분업, `WORKFLOW.md`의 「디자인 확정」 절과 화면 task 디스패치 순서, `TOOLING`·`DESIGN`·`CLAUDE.md`·`FOUNDATIONS`.
- 재봉인 뒤 `pnpm verify`를 돌려 이 task 몫이 전부 통과함을 확인했다 — `lint:ci`, `typecheck`, `harness:typecheck`, `test`(245파일 1636건), `harness:self-test`(364건), `check:docs`, `build`, `check:app-build`, `check:client-secret-scan`, `gate:all`(8게이트).
- 그 과정에서 이 task가 낸 회귀 3건을 고쳤다. `harness/design/build.ts:89`의 `walkComments` 콜백이 `comment.remove()` 반환값을 그대로 흘려 `harness:typecheck`가 TS2769로 깨졌다 — 블록 본문으로 바꿨다. `harness/self-test/dashboard-collect.test.ts`의 `referenceGates` 기대 목록에 `gate:tokens`가 빠져 있었다. `harness/self-test/hook-acceptance.test.ts`의 fixture 저장소에 FOUNDATIONS·globals.css가 없어 `COMMIT_GATES`에 새로 들어간 `gate:tokens`가 "읽을 수 없습니다"로 커밋을 막았다 — `fixtures/token-parity/match`의 일치 쌍을 fixture 저장소에 심었다. 파일이 없을 때 게이트가 조용히 통과하게 만드는 길은 택하지 않았다. 거짓 통과가 이 게이트의 핵심 위험이다.
- 구현 중 사용자 결정 둘: `env(safe-area-inset-bottom)` 임의값은 FOUNDATIONS가 이미 승인한 패턴이라 린트 대상에서 뺐다. 반 칸 간격(0.5·1.5·2.5)은 19군데 실사용 중이라 FOUNDATIONS 표에 올리고 "밀집한 내부 요소에만" 단서를 달았다(2026-08-17 사용자 결정).

### 4단계 교차 검증과 그 수정

- `opus`·`codex` 2자 교차 검증 결과가 `docs/execution/reviews/P0-T47-review.json`에 있다. 확정 발견 12건, 기각 0건, 종합 77점. medium·low 9건은 backlog에 누적했다.
- `high` 셋 중 둘이 이 task 코드의 결함이라 3단계로 되돌려 고쳤다. **F-01** — `gate:tokens`가 반 칸 세 행과 하단 여백 두 행을 조용히 건너뛰고 있었다. `SPACE_TOKEN_PATTERN`이 정수만 받고, 하단 여백 매핑이 `--spacing-` 접두를 요구하는데 FOUNDATIONS 표는 `spacing-nav-safe`로 적혀 있고, `DECLARATION_PATTERN`이 `--spacing-0\.5` 같은 이스케이프 이름을 못 읽었다. 셋을 고치고 **매핑 실패를 `continue`가 아니라 `unmappableTokenViolation`으로 보고**하게 바꿨다 — 조용히 넘긴 것이 근본 원인이었다. **F-02** — `design:build` 산출물의 글꼴 체인 첫 항목 `var(--font-wanted-sans)`가 자립 HTML에 정의되지 않아 `font-family` 선언이 통째로 무효화되고 심은 1.6MB WOFF2가 쓰이지 않았다. 산출물에 그 변수를 선언해 `@font-face`가 등록한 패밀리가 해석되게 했다.
- `unit-test-writer`가 RED를 남기고(368 tests / 5 fail) 조정 세션이 GREEN으로 만들었다(368 pass / 0 fail). `implementer`를 따로 띄우지 않고 조정 세션이 구현한 것은 이 세션이 앞선 하네스 구현도 이어받아 맥락을 갖고 있었기 때문이다. RED와 GREEN의 기록자는 갈렸다.
- RED 작성 중 fixture가 실제 문서와 다른 표기(`--spacing-nav-safe`)를 써서 결함을 가리고 있던 F-04도 함께 정정했다. fixture 넷의 하단 여백 표기를 실물과 맞추고 반 칸·`space-0` 행을 더했으며, 매핑 불가 토큰을 담은 `unmappable-token` fixture를 새로 만들었다.
- 남은 `high` **F-03**(e2e 시딩 충돌)은 `tests/e2e/**`가 이 task 허용 경로 밖이라 여기서 고칠 수 없다. 별도 task로 올린다.

### 커밋을 가르며 생긴 것

작업 트리에 이 task 말고 두 흐름이 더 있었고, 셋의 글이 같은 파일 안에서 줄 단위로 섞여 있었다. 처리는 이렇게 갈랐다.

- **P0-T46(에이전트 팀 확장)** — 구현은 다 돼 있는데 `index.jsonl` 등록과 커밋이 안 된 채였다. P0-T47이 그 위에 얹혀 있어(내 WORKFLOW 절이 P0-T46의 「테스트 작성과 구현의 분리」를 가리키고, `unit-test-writer.md`는 P0-T46이 만든 파일이다) 먼저 등록·커밋했다. 그 과정에서 **P0-T47의 문서 줄 일부가 P0-T46 커밋에 함께 들어갔다** — `CLAUDE.md`·`WORKFLOW.md`·`TOOLING.md`·`00-foundation.md`·`implementer.md`·`unit-test-writer.md`·`.gitignore`. 여섯 파일 모두 P0-T46의 변경 허용 경로 안이라 게이트는 통과하지만, 이력상 귀속은 정확하지 않다. 줄을 갈라 빼봤더니 `check:docs`가 "`### P0-T47` heading이 없습니다", `gate:radio`가 해시 불일치를 내서 되돌렸다 — HEAD가 이미 P0-T47의 `index.jsonl` 항목만 커밋한 반쪽 상태였기 때문이다.
- 반대로 `gate-suite.ts`와 `package.json`은 P0-T46의 허용 경로 안인데도 **이 커밋으로 미뤘다.** `gate-suite.ts`가 `token-parity.ts`를 import하는데 그 파일은 P0-T47 소유라, P0-T46 커밋에 넣으면 그 시점 트리가 빌드되지 않는다.
- **디자인 시스템 개편(미승인·task ID 미부여)** — `stash@{0}`에 격리했다. 다만 HEAD의 `ScheduleView.tsx`가 이미 `segmented-control`·`deadline-batches`·`DeadlineBatchList`를 import하고 있어(그쪽도 반쪽 커밋 상태다) 타입체크가 깨졌다. 그 네 파일과 `useApplicationBatch`·`schedule-cell-state`만 stash에서 되살렸다. 나머지 시각 변경은 격리된 채 남아 P0-T48이 가져간다.
- `docs/standards/ARCHITECTURE.md`·`DEVELOPMENT.md`·`adr/0008`·`adr/0011`·`adr/README.md`와 `runs/interviews/`의 인터뷰 기록들은 어느 task의 허용 경로에도 없어 스테이징하지 않았다.

### 미결 사항

- `pnpm verify` 전체 통과 — 결정 주체: 사용자, 반환할 단계: 없음. 이 task 몫은 다 통과한다. 남는 둘은 이 task 밖이다. ① `gate:bundle`이 508KB로 상한 500KB를 8KB 넘긴다 — 이 task는 JS를 더하지 않는다(CSS 토큰과 클래스 문자열 치환뿐). ② e2e가 실행마다 다른 spec에서 1~2건 깨진다(`notifications`·`recruitment-notifications`·`recruitment-manage`). 시딩 충돌 계열이고 재실행하면 자리가 바뀐다.
- 격리된 개편 작업의 재적용 — 결정 주체: 사용자, 반환할 단계: 기획. `stash@{0}`이 P0-T48을 기다린다.

### 다음 행동

1. 4단계 검증 — `check_ids` 실행과 교차 검증.
2. `retrospector`로 회고 한 줄을 남기고 `done`으로 전환한다.
3. P0-T48 기획으로 넘어가 `stash@{0}`의 개편 작업을 승인된 범위 안에서 되살린다.

### 증거·산출물 경로

- `docs/execution/radio/P0-T47-radio.md` (revision 4)
- `docs/execution/runs/P0-T47/tdd.json` (RED 2건·GREEN 2건)
- `docs/execution/runs/P0-T47/open-decisions.md` (D-01 해소)
- `docs/execution/runs/interviews/2026-08-16-p0-t47-planning.md`, `2026-08-17-p0-t47-design.md`
- `harness/lib/token-parity.ts`, `harness/gates/tokens.ts`, `harness/design/build.ts`
- `harness/self-test/token-parity.test.ts`, `design-build.test.ts`, `fixtures/token-parity/`
- `tools/eslint-plugin-project/rules/spacing-scale.mjs`, `rules/__tests__/spacing-scale.test.mjs`
- `.claude/skills/publish-ui/SKILL.md`, `.claude/agents/publisher.md`
