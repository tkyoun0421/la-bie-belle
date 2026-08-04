# 명령과 도구 연결

- 상태: Accepted
- 기준일: 2026-08-04
- 관련 결정: [ADR-0013](../standards/adr/0013-project-layer-structure.md), [ADR-0012](../standards/adr/0012-static-operations-dashboard.md)
- 관련 문서: [운영 계약](WORKFLOW.md), [교차 검증 계약](REVIEW.md), [handoff 계약](HANDOFF.md), [개발 컨벤션](../standards/DEVELOPMENT.md)

이 문서는 저장소를 조작하는 **명령과 훅**의 정본이다. `CLAUDE.md`는 이 문서의 요약과 링크만 갖는다.

명령의 존재 자체는 `package.json`이, 각 명령이 강제하는 **규칙**은 해당 계약 문서가 소유한다. 이 문서는 둘을 잇는다.

## 애플리케이션

Next.js 16 App Router. 개발과 빌드 모두 Turbopack이 기본 번들러다. React 19.2, Tailwind CSS v4를 쓴다. Tailwind v4는 CSS-first 방식이라 `tailwind.config.js`가 없고 테마는 `src/app/globals.css`의 `@theme` 블록에 산다(토큰 값은 P0-T34가 채운다).

```bash
pnpm dev                 # 개발 서버 (Turbopack)
pnpm build               # 프로덕션 빌드 (Turbopack)
pnpm start               # 프로덕션 서버
pnpm typecheck           # next typegen + tsc --noEmit
pnpm check:app-build     # 빌드 후 서버 전용 값이 클라이언트 번들에 샜는지 검사
```

- `typecheck`가 `next typegen`을 먼저 도는 이유: `next-env.d.ts`와 `.next/types/**`는 gitignore 대상이라, 빌드 전 환경(새로 clone한 CI)에서는 ambient·라우트 타입이 빠진 채 조용히 축소된 범위만 검사된다. typegen을 앞에 두면 빌드 전후의 검사 범위가 같아진다.
- `check:app-build`(`scripts/check-app-build.mjs`)는 빌드 산출물에서 서버 전용 표식을 찾는다. `.next/static/`에 0건, `.next/server/`에 존재가 정상이다. 후자가 대조군이라 이 검사에 판별력이 있다.
- import 경로는 계층별 alias(`@/views/*`, `@/shared/*`, …)를 쓰고 **확장자를 붙이지 않는다**. `.ts`/`.tsx` 확장자 규약은 Node type stripping으로 도는 `harness/`에만 적용된다.

### `next dev`의 지침 파일 주입 차단

`next.config.ts`의 `agentRules: false`는 `next dev`가 `CLAUDE.md`나 `AGENTS.md`에 자기 블록을 쓰는 동작을 끈다. npm 의존성이 L1 지침 파일을 저술하게 두지 않는다는 판단이다.

- 끄지 않으면 `app-info-log.js`의 `ensureAgentRulesForDev()`가 실행마다 블록 유무를 확인하고 없으면 다시 쓴다. 블록을 지우는 대응은 매 실행마다 되살아나므로 해법이 아니다.
- 그 블록이 전하던 정보는 `CLAUDE.md`가 우리 문장으로 소유한다: **Next.js 16은 대부분의 학습 데이터와 다르므로 프레임워크 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 읽는다.**
- 옵션 근거: `node_modules/next/dist/docs/01-app/02-guides/ai-agents.md`, 스키마는 `node_modules/next/dist/server/config-schema.js`.

## 게이트 하네스

5단계 파이프라인을 강제하는 게이트 하네스가 `harness/`에 있다(P0-T31). 런타임 의존성이 없고 Node 22 type stripping으로 TypeScript를 직접 실행하므로 `engines.node`가 Node >= 22.6을 요구한다.

```bash
pnpm gate:index          # index.jsonl: JSON 라인 + schema + 상태 규칙
pnpm gate:radio          # planned/in_progress task: radio_sha256 == 실제 파일 해시
pnpm gate:handoff        # handoff.md 존재와 필수 7개 필드 (선택 인자: task ID)
pnpm gate:tdd            # test_mode=tdd task의 tdd.json이 명령별 RED→GREEN을 증명
pnpm gate:scope          # staged 파일이 현재 task RADIO의 변경 허용 경로 안인지
pnpm gate:all            # 위 다섯 게이트를 한 번에
pnpm harness:self-test   # 여섯 게이트의 node:test 스위트 (임시 저장소 훅 수용 테스트 포함)
pnpm harness:typecheck   # harness/ 대상 tsc --noEmit
pnpm dashboard           # docs/execution/dashboard/index.html 재생성
```

### 게이트 판정 규칙

- **상태 규칙**: `in_progress`는 저장소 전체에서 최대 하나, 두 승인과 `radio_ref` 없는 `planned`/`in_progress` 금지, 모든 `depends_on` id 실재, 모든 레코드에 `spec_refs` 최소 1건.
- **출력 규약**: 통과한 게이트는 아무것도 출력하지 않고 0으로 끝난다. 위반은 문제 파일과 수정 힌트를 한국어로 stderr에 쓰고 1로 끝난다.
- **현재 task**: 단일 `in_progress` task를 뜻한다. 없으면 TDD·커밋 범위 게이트는 통과시켜 워크플로 메타 커밋을 막지 않는다. 인덱스와 RADIO 해시 게이트는 언제나 돈다.
- `gate:handoff`, `gate:tdd`, `gate:scope`는 인자가 없으면 현재 `in_progress` task를 대상으로 한다.
- **커밋 범위**의 출처는 task RADIO의 `## 변경 허용 경로` 절이다. 그 절의 첫 fenced code block에 한 줄당 glob 하나를 두며, 승인 SHA-256으로 봉인된다.

### 배치

| 경로 | 책임 |
| --- | --- |
| `harness/gates/` | 진입점 |
| `harness/lib/` | 판정 로직 (순수 함수 + 얇은 IO) |
| `harness/dashboard/` | 대시보드 생성기 |
| `harness/self-test/` | 픽스처와 테스트 |

## 운영 대시보드

`pnpm dashboard`는 인라인 CSS에 외부 리소스가 없는 자족 HTML 한 파일을 `docs/execution/dashboard/index.html`에 쓴다. 모바일 우선이다. 계약의 정본은 [ADR-0012](../standards/adr/0012-static-operations-dashboard.md)다.

- 섹션 4종: 진행도, 준비도 루브릭, 검증, 다음 행동·차단. 상단에 기준 시각과 기준 커밋을 둔다.
- 준비도는 100점 만점의 기계 판정이다: 계약 준수 40(index·radio·handoff·tdd 저장소 게이트 통과율, `harness/lib` 게이트 재사용 — scope와 commit-msg는 참고 표시만), 증거 완결성 25, 실행 준비도 20, 문서 최신성 15(재생성 준수는 직전에 커밋된 산출물의 `base-commit` 표식과 대조해 측정). 등급은 90+ 우수, 70–89 양호, 70 미만 주의. 모든 점수는 근거 숫자를 함께 보여준다.
- **읽기 전용 파생물**이다. `index.jsonl`·`runs/`·`reviews/`에 쓰지 않고 승인이나 상태 전환을 하지 않는다. 원본이 없거나 형식이 깨지면 값을 추측하지 않고 누락 / 결과 없음 / 형식 오류로 표시한다. 생성 실패는 권고 사항이며 task를 막지 않는다.
- 재생성 시점: task가 `done`·`blocked`·`skipped`로 바뀌거나 phase 경계가 바뀐 뒤.

## 교차 검증

실행 절차의 정본은 [`verify` 스킬](../../.claude/skills/verify/SKILL.md), 규칙의 정본은 [교차 검증 계약](REVIEW.md)이다.

리뷰어는 정확히 둘이다 — `reviewer` 서브 에이전트(Opus, `.claude/agents/reviewer.md`)와 Codex CLI(`codex exec`). Codex를 쓸 수 없으면 `opus`/`opus-2`로 대체한다. 메인 에이전트는 조정자일 뿐 독립 리뷰를 내지 않으며, 참여한 모든 리뷰어가 동의할 때만 발견이 확정된다.

## Git 훅

`core.hooksPath`는 `.githooks`다.

- **pre-commit**: `harness/gates/pre-commit.ts`를 실행한다. 인덱스·RADIO 해시·TDD 증거·커밋 범위 네 게이트가 모두 돌아 위반을 한 번에 보고한다.
- **commit-msg**: 메시지 본문에 `P[0-9]+-T[0-9]{2}`와 일치하는 task ID를 요구한다. 주석 줄은 세지 않는다.
- 로컬 훅은 `--no-verify`로 우회할 수 있다. git의 한계이며 CI에서 `pnpm gate:all`을 다시 돌려 보완한다(P0-T05).

## Claude Code 훅

`.claude/settings.json`이 `Write`/`Edit`/`MultiEdit`에 `PreToolUse` 훅을 건다.

**`.claude/hooks/tdd-guard.sh`**는 대응 테스트 파일이 없는 `src/` 아래 비즈니스 로직 편집을 거부한다.

- 예외: `src/app/**`(라우트 어댑터), `**/ui/**`와 `**/components/**`(표현 계층), `**/types/**`, `*.d.ts`, `*.config.*`, 슬라이스 `index.ts` barrel, 그리고 소스가 아닌 파일.
- 테스트 탐색 순서: 형제 `*.test.*`/`*.spec.*` → `__tests__/`(같은 디렉터리 또는 상위) → `src/__tests__/` → 루트 `tests/` 트리.
- `jq`가 필요하다. 없으면 훅이 stderr에 경고만 남기고 편집을 허용한다.
