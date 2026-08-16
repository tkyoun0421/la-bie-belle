# P0-T46 RADIO 개발 설계

- 상태: Approved
- revision: 4
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-16 (revision 1·2·3)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 4 | 2026-08-17 | 형식 정정만이다 — 설계 결정은 하나도 바뀌지 않았다. 위험 렌즈 표가 5열(인수 조건·Happy Path·주요 실패·경계값·동시성)이라 `gate:radio`가 요구하는 정본 7열 헤더와 달라 커밋이 막혔다. `권한`·`중복 요청` 열을 더하고 각 칸을 사유와 함께 `해당 없음`으로 채웠다. 이 task를 `index.jsonl`에 등록하는 시점(P0-T47 세션)에 발견해 고쳤다. 등록 자체가 revision 1의 인수 조건 9다. |
| 1 | 2026-08-16 | 최초 작성. 기획 확정 — 에이전트 6종 신설(테스트 writer 3종·docs-curator·retrospector·explainer), implementer 개정(GREEN 전담), gate 2종 강제(retro 신규·docs 편입), 회고 대시보드 페이지(ADR-0012 개정), `/coach` 스킬(레이어별 병목·오류·개선점을 중요도순 제안, 봉인 전 추가 승인). 2026-08-16 사용자 결정. |
| 2 | 2026-08-16 | explainer를 서브 에이전트에서 `explain` 스킬로 전환(사용자 승인, 구현 전). 승인 게이트 요약본·선택지 초안의 재료는 인터뷰 대화이고 서브 에이전트는 부모 대화를 볼 수 없어, 그 경로가 성립하려면 인터뷰 전문을 디스패치 프롬프트로 옮겨야 한다. 산출물이 사용자 대면이라 서브 에이전트 보고는 조정자 컨텍스트를 한 번 거쳐 다시 나가므로 컨텍스트 절감도 상쇄된다. 어조 규칙(Humanize KR)이 이미 스킬 형태라는 점, 같은 판단으로 `/coach`를 스킬로 정한 선례와도 정합. 세션 맥락 없는 독자 시점이 필요한 연속 루프 일괄 보고는 스킬 본문이 읽기 전용 서브 에이전트 팬아웃을 지시하는 경로로 남긴다. |
| 3 | 2026-08-16 | 구현 중 전제 오류 발견에 따른 허용 경로 확장(사용자 승인). revision 1·2의 전제 "harness self-test의 기존 단언과 충돌하는 변경은 없다"가 사실이 아니었다 — `gate:retro`·`gate:docs`를 `REPOSITORY_GATES`·`COMMIT_GATES`에 넣자 `dashboard-collect.test.ts`의 `referenceGates` 고정 기대값과 `hook-acceptance.test.ts`의 픽스처 저장소(신설 게이트가 요구하는 `exempt.json`·phase 문서 부재)가 깨졌다. 게이트 명령 목록을 소유한 `TOOLING.md`·`CLAUDE.md`도 갱신 대상이다. 네 파일 모두 신설 게이트 반영에 따른 정합 갱신이며 새 결정은 없다. |

- 관련 spec: DOCS:WORKFLOW(L1 협업 계층), ADR:0012(대시보드), 기획 정본은 `runs/interviews/2026-08-16-agent-team-planning.md`와 phase 00 P0-T46 절
- 적용 깊이: 일반 — 문서·에이전트 계약 + harness 게이트·대시보드 코드. 제품 코드(`src/**`)·DB 무변경.
- 예정 check IDs: `verify`, `retro-gate-selftest`

## 전제

- 기획 승인(2026-08-16)이 소유한 결정을 다시 열지 않는다: 에이전트 구성 6종과 역할, gate 2종 강제, 회고 페이지. 요약은 기획 handoff가 정본이다.
- 코드 대조로 확인된 사실:
  - `tdd.json` 형식은 `{entries:[{command, exit_code, at, phase:"red"|"green"}]}`이고 게이트는 같은 command의 RED가 GREEN보다 시간상 앞서는지만 검사한다(`harness/lib/tdd-gate.ts`). **두 기록자 분리는 형식·게이트 무수정**으로 성립한다 — writer가 red 항목, implementer가 green 항목을 추가한다.
  - 문서 검사기 `harness/lib/docs-check.ts`(내부 링크·heading 제목·spec_refs·의존성 순환)는 이미 존재하고 `pnpm check:docs`로 `pnpm verify`(CI)에서 돈다. 빠진 곳은 커밋 시점 강제뿐이다.
  - 게이트 묶음은 `harness/lib/gate-suite.ts`의 `REPOSITORY_GATES`(gate:all)·`COMMIT_GATES`(pre-commit)가 소유한다.
  - 대시보드 생성기는 `harness/dashboard/`(collect·render 분리)이고 산출물은 `docs/execution/dashboard/index.html` 단일 파일 계약(ADR-0012 revision 2)이다.
- 구현 주체는 조정 세션이다 — `.claude/**`·`docs/workflow/**`는 조정자 소유 경로다.
- `src/**` 무변경이므로 `config/fsd.json` 세그먼트 규칙과의 대조는 해당 없음. harness self-test의 기존 단언과 충돌하는 변경은 없다(기존 검사기·게이트 로직 무수정, 추가만).
- **revision 3 정정**: 바로 위 문장은 틀렸다. 게이트 묶음(`gate-suite.ts`)에 항목을 더하는 것만으로 그 묶음을 고정 배열로 단언한 기존 self-test가 깨지고, `COMMIT_GATES` 추가는 훅 픽스처 저장소가 갖춰야 할 파일을 늘린다. 묶음에 손대는 변경은 "추가만"으로 격리되지 않는다.

## Requirements

### 범위와 비목표

범위: 에이전트 정의 5종 신설 + implementer 개정, WORKFLOW·ADR-0012 개정, `gate:retro` 신규 구현과 `gate:docs` 편입, 회고 저장소(`docs/execution/retrospective/`) 신설, 대시보드 회고 페이지 추가, `/coach`·`explain` 스킬 신설, phase 00·index.jsonl 등록.

비목표: 제품 코드·DB·`src/**` 변경. integration 테스트 구역 신설(러너·CI·fsd.json — 기획에서 보류). reviewer·ci-finisher 계약 변경. 기존 docs-check 검사 규칙의 확장·수정. 기존 done task의 소급 회고 작성.

### 불변 규칙

- 이중 승인 게이트·`in_progress` 최대 1·승인 해시 봉인 등 WORKFLOW 기존 불변 규칙은 개정 후에도 그대로다. 개정은 절차 추가이지 게이트 완화가 아니다.
- `tdd.json` 형식과 `gate:tdd` 로직은 바꾸지 않는다.
- 기존 done task는 회고 의무에서 면제된다(소급 기록 금지 규칙과 정합). 면제는 명시적 스냅숏으로 고정한다.
- 대시보드는 읽기 전용 파생물 원칙(ADR-0012 advisory)을 유지한다 — 회고 페이지도 정본(`cases.md`·`proposals.md`)을 수정하지 않는다.

### 정지 조건

- 기존 문서가 `check:docs`를 커밋 시점에 통과하지 못하는 사전 위반이 발견되어 수정 범위가 이 task의 허용 경로를 넘는 경우.
- `gate:retro`·`gate:docs` 편입으로 pre-commit 체감 시간이 유의미하게 늘어 기존 개발 루프를 방해하는 경우(측정 후 결정 신호).
- WORKFLOW 개정 중 기존 승인 규칙과 충돌하는 문장이 발견되는 경우 — 조용히 조정하지 않고 결정 신호로 반환한다.

### 기술 인수 조건

1. `.claude/agents/`에 `unit-test-writer.md`·`integration-test-writer.md`·`e2e-test-writer.md`·`docs-curator.md`·`retrospector.md`가 존재하고, 각 frontmatter(model·tools)가 아래 Interface 표와 일치한다. `explainer.md`는 두지 않는다 — revision 2에서 `explain` 스킬로 전환했다(인수 조건 11).
2. `implementer.md`가 개정된다 — RED 생성 책임 삭제, "테스트 수정 필요 시 `[질문]` 반환" 추가, `test_mode=tdd`가 아닌 task는 기존 방식 유지 명시.
3. `docs/workflow/WORKFLOW.md`가 개정된다 — 3단계에 test-writer 선행 디스패치(구역 배분·RED 기록·커밋은 GREEN 후 1회), 5단계에 retrospector(마무리 커밋 전), 공통 인터뷰 계약 5항과 연속 루프 일괄 보고에 `explain` 스킬 경유 관례, task 경계 보조 에이전트(docs-curator) 절.
4. `gate:retro`가 신규 구현된다 — `index.jsonl`의 done task 중 `docs/execution/retrospective/exempt.json` 스냅숏에 없는 ID마다 `cases.md`에 해당 ID를 포함한 줄이 없으면 위반. `REPOSITORY_GATES`·`COMMIT_GATES`·`package.json`(`gate:retro`)에 편입되고 self-test(`harness/self-test/retro-gate.test.ts`)가 위반·통과·면제 케이스를 단언한다.
5. `gate:docs`가 편입된다 — 기존 `runDocsCheck`를 게이트 래퍼로 감싸 `REPOSITORY_GATES`·`COMMIT_GATES`·`package.json`(`gate:docs`)에 추가한다. 검사 규칙 자체는 무수정.
6. `docs/execution/retrospective/`에 `README.md`(형식 계약)·`cases.md`·`proposals.md`·`exempt.json`(구현 시점 done 전수 스냅숏)이 생성된다.
7. `pnpm dashboard`가 `docs/execution/dashboard/retrospective.html`과 `coaching.html`을 추가 생성하고 `index.html`에서 링크한다 — retrospective는 cases.md(성공/실패 구분 집계·task별 목록)와 proposals.md(미결 제안 목록)를, coaching은 `docs/execution/coaching/`의 최신 coach 결과(중요도별 제안)와 과거 실행 이력 목록을 렌더한다. 원본 누락 시 "누락" 표시(advisory 원칙).
8. ADR-0012가 revision 3으로 개정된다 — 산출물 3파일(index.html + retrospective.html + coaching.html)과 회고·코칭 페이지 계약. 읽기 전용 advisory 원칙은 두 페이지에 그대로 적용된다.
9. phase 00에 P0-T46 절, `index.jsonl`에 등록(dual-approval-v3, 두 승인 기록)이 존재한다.
10. `.claude/skills/coach/SKILL.md`가 신설되고 `.gitignore`에 추적 예외가 추가된다 — 사람 전용 호출(`disable-model-invocation: true`), 진단 축은 L1 협업(워크플로·게이트 마찰)·L2 제품 문서·L3 표준·L4 실행 증거(backlog 적체·flaky)·L5 코드(FSD 레이어별). 축별 병목·오류·개선점을 읽기 전용 서브 에이전트로 조사하고, 전체에서 중요도([REVIEW.md](../../workflow/REVIEW.md) critical·high·medium·low)순 상위 10개 내외를 제안한다. 결과는 전용 폴더 `docs/execution/coaching/<날짜>-coach.md`(신설), 제안의 task화는 사용자 승인 시만. `verify` 스킬의 전체 스캔(코드 결함 검증)과 역할이 다름을 본문에 명시한다. 훅·주기 자동 실행은 두지 않는다 — 실행은 언제나 사람이 결정하고, 산출물 노출은 대시보드 coaching 페이지가 담당한다(2026-08-16 사용자 결정).
11. `.claude/skills/explain/SKILL.md`가 신설되고 `.gitignore`에 추적 예외가 추가된다 — 사람(`/explain`)과 모델 양쪽에서 호출 가능(플래그 없음). 두 경로를 본문이 나눈다: ① 승인 게이트 요약본·`AskUserQuestion` 선택지 초안은 조정 세션이 대화 맥락으로 그 자리에서 수행한다(인터뷰 답변은 파일로 남지 않아 서브 에이전트가 볼 수 없다), ② task done·연속 루프 일괄 보고는 산출물(`runs/<id>`·`reviews/<id>-review.json`·handoff·CI)이 크고 조정자가 미독인 경우 읽기 전용 서브 에이전트 팬아웃을 지시한다 — 세션 맥락 없는 독자 시점이 설명 품질에 필요하기 때문이다. 어조는 Humanize KR 규칙을 따르되 규칙 정본은 기존 `humanize-korean` 스킬이고 여기서 복제하지 않는다. 주니어 개발자 눈높이·구체 시나리오 원칙을 본문에 명시한다.
12. `pnpm verify` 전체 GREEN — 신설 gate 2종 포함. P0-T46 자신의 done 전환 커밋에 retrospector가 작성한 P0-T46 회고 항목이 포함되어 `gate:retro`를 스스로 통과한다(첫 실전 적용).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 4 gate:retro | 테스트함 — self-test에서 면제 밖 done에 회고 항목이 있으면 통과 | 테스트함 — self-test에서 항목 없음은 위반 1건, `exempt.json` 누락·형식 오류도 위반 | 테스트함 — self-test에서 면제 목록 안 done은 항목 없어도 통과하고 done 아닌 상태는 검사 대상이 아니다 | 해당 없음 — 로컬 파일을 읽는 정적 검사라 실행 권한 개념이 없다 | 해당 없음 — 같은 입력에 같은 결과를 내는 순수 판정이다 | 해당 없음 — 읽기 전용이라 공유 상태가 없다 |
| 5 gate:docs | 테스트함 — 기존 `docs-check.test.ts`가 검사 규칙을 이미 단언하고 래퍼는 편입만 한다 | 테스트함 — `gate:all` 실행에 위반이 그대로 전파되는지 self-test 1건 | 해당 없음 — 검사 규칙을 고치지 않아 새 경계값이 생기지 않는다 | 해당 없음 — 기존 검사기를 감싸기만 해 권한 경계가 생기지 않는다 | 해당 없음 — 재실행이 같은 결과 | 해당 없음 — 게이트가 순차로 돈다 |
| 7 회고·코칭 페이지 | 테스트함 — self-test에서 cases·proposals·coaching 렌더 결과에 항목이 노출된다 | 테스트함 — self-test에서 원본이 없으면 "누락"으로 표시하고 생성은 계속한다 | 테스트함 — 빈 파일과 coach 실행 이력 0건에서도 렌더된다 | 해당 없음 — 읽기 전용 파생물이라 접근 제어 대상이 아니다 | 해당 없음 — 생성이 멱등이다 | 해당 없음 — 단일 프로세스가 파일을 쓴다 |
| 1~3·10·11 문서·계약 | 테스트함 — `check:docs`가 링크·제목을 판정하고 교차 검증 리뷰가 내용을 본다 | 해당 없음 — 사람이 읽는 계약이라 실패 분기가 없다 | 해당 없음 — 값이 아니라 문장이다 | 해당 없음 — 실행 권한이 없는 문서다 | 해당 없음 — 멱등한 파일 쓰기 | 해당 없음 — 사람이 한 번에 하나씩 고치는 문서다 |

### DEV-* 적용 상태

- DEV-CODE-07(주석 금지): 기본 적용 — harness 코드 포함.
- DEV-TEST: 기본 적용 — 신규 게이트·대시보드 로직은 self-test 동반(기존 관례).
- DEV-SEC·DEV-DATA·DEV-CACHE·DEV-OFFLINE·DEV-TIME: 해당 없음 — 제품 코드·DB 무변경. 회고·대시보드에 개인정보를 쓰지 않는다(리뷰 계약의 비밀값 금지 규칙 준용).

## Architecture

- L1 협업 계층 변경이다. 에이전트 계약은 `.claude/agents/`, 절차 정본은 WORKFLOW, 강제는 harness 게이트 — 기존 소유권 구조를 따른다.
- `gate:retro` 로직은 `harness/lib/retro-gate.ts`, 래퍼는 `harness/gates/retro.ts` — tdd-gate와 같은 배치 관례.
- `gate:docs` 래퍼는 `harness/gates/docs.ts` + `gate-suite.ts` 등록. `harness/checks/docs.ts`(check:docs)는 그대로 두어 CI 경로 불변.
- 대시보드는 `harness/dashboard/retrospective.ts`(수집·렌더)를 추가하고 `main.ts`가 두 페이지를 생성한다. `collect.ts`는 무수정이고, `render.ts`는 공용 스타일·이스케이프 함수 export와 신설 페이지 링크에만 손댄다(revision 3 정정 — 두 페이지가 같은 시각 언어를 쓰려면 스타일 정본이 하나여야 한다).

## Data model

해당 없음 — DB 무변경. 파일 정본: 회고는 `cases.md`(append-only 한 줄 기록)·`proposals.md`, 면제는 `exempt.json`(구현 시점 이후 불변 스냅숏).

## Interface

에이전트 frontmatter:

| 에이전트 | model | tools |
| --- | --- | --- |
| unit-test-writer · integration-test-writer · e2e-test-writer | sonnet | Bash, Read, Grep, Glob, Edit, Write |
| docs-curator | sonnet | Bash, Read, Grep, Glob, Edit, Write |
| retrospector | opus | Bash, Read, Grep, Glob, Edit, Write |

`explain` 스킬은 에이전트가 아니므로 frontmatter에 model·tools를 두지 않는다. ② 경로에서 팬아웃하는 서브 에이전트는 읽기 전용(Read·Grep·Glob)으로 지시한다.

- `cases.md` 한 줄 형식: `- <task-id> | 성공|실패 | <한 줄 요약> | <근거 경로>` — gate는 task ID 포함 여부만 기계 검사하고 나머지는 retrospector·리뷰 몫.
- `proposals.md` 한 줄 형식: `- [ ] <제안 요약> | 출처 <task-id> | <근거 경로>` — task화는 사용자 승인 시만(backlog 규칙 준용).
- `exempt.json`: `{"generated_at": "...", "task_ids": [...]}` — 구현 커밋 시점의 done 전수.
- tdd.json: 형식 무변경. red 항목은 test-writer, green 항목은 implementer가 기록한다(절차 계약).

## Optimizations

- pre-commit 추가 비용은 로컬 파일 검사 2종(retro·docs)뿐 — 네트워크·빌드 없음. 구현 중 실측해 유의미하면 정지 조건으로 반환.

## 변경 허용 경로

```
.claude/agents/unit-test-writer.md
.claude/agents/integration-test-writer.md
.claude/agents/e2e-test-writer.md
.claude/agents/docs-curator.md
.claude/agents/retrospector.md
.claude/agents/implementer.md
.claude/skills/coach/**
.claude/skills/explain/**
docs/workflow/WORKFLOW.md
docs/standards/adr/0012-static-operations-dashboard.md
harness/lib/retro-gate.ts
harness/lib/gate-suite.ts
harness/gates/retro.ts
harness/gates/docs.ts
harness/self-test/retro-gate.test.ts
harness/self-test/gate-suite-docs.test.ts
harness/self-test/dashboard-retrospective.test.ts
harness/self-test/dashboard-collect.test.ts
harness/self-test/hook-acceptance.test.ts
docs/workflow/TOOLING.md
CLAUDE.md
harness/dashboard/retrospective.ts
harness/dashboard/main.ts
harness/dashboard/render.ts
package.json
.gitignore
docs/execution/retrospective/**
docs/execution/coaching/**
docs/execution/dashboard/index.html
docs/execution/dashboard/retrospective.html
docs/execution/dashboard/coaching.html
docs/execution/phases/00-foundation.md
docs/execution/phases/index.jsonl
docs/execution/runs/P0-T46/**
docs/execution/radio/P0-T46-radio.md
```

- 용도 한정(revision 3 추가): `dashboard-collect.test.ts`는 `referenceGates` 기대값에 신설 게이트 2종을 더하는 것에만, `hook-acceptance.test.ts`는 픽스처 저장소에 `exempt.json`과 phase 문서를 더하는 것에만, `TOOLING.md`·`CLAUDE.md`는 게이트 명령 목록과 pre-commit 게이트 수 서술 갱신에만 쓴다. 네 파일의 다른 내용은 건드리지 않는다.
- 용도 한정: `gate-suite.ts`는 게이트 2종 등록에만, `main.ts`·`render.ts`는 회고 페이지 연결·링크에만 쓴다. 기존 게이트·검사 로직과 다른 에이전트 계약(reviewer·ci-finisher)은 바꾸지 않는다. `.gitignore`는 신규 경로 추적에 필요한 경우에만 쓴다. `index.jsonl`은 P0-T46 등록·상태 전환에만 쓴다.

## 미결 사항

- 없음 — 기획 handoff의 미결(테스트 목록 구역 배분 절차의 세부 문구 등)은 본 RADIO의 인수 조건 1~3이 소유한다.
