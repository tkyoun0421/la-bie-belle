---
owner: "@orchestrator"
related_adr: ""
related_issue: "#62"
---

# Agent Operating Rules

라비에벨 프로젝트의 에이전트 협업 헌법. 이 문서와 다른 문서가 충돌하면 이 문서가 이긴다. 변경은 총괄 에이전트가 PR로만 한다.

## 1. 역할과 작업 공간

| Worktree | 에이전트 | 소유 영역 |
|----------|----------|-----------|
| main 체크아웃 | 총괄 (@orchestrator) | `docs/rules.md`, `config/`, `.claude/`, `.githooks/` — 단, 모든 경로 접근 가능 |
| `pm` | PM (@agent-pm) | `docs/prd.md`, `docs/domain/`, `docs/adr/`, `docs/specs/` |
| `dev` | Dev (@agent-dev) | `docs/architecture/`(기술 결정은 `architecture/decisions/` TDR), `src/`, 루트 개발 설정 파일 |
| `ui` | UI (@agent-ui) | `docs/ui/` — 코드 불가촉 |

- 소유권의 기계 정본은 `config/ownership.json`이다. 이 표와 어긋나면 JSON이 이긴다.
- 자기 소유가 아닌 경로는 직접 수정하지 않는다. 필요하면 `[Request]` Issue로 소유 에이전트에게 요청한다.
- 각 worktree의 정체성은 untracked `CLAUDE.local.md`(지시)와 `.agent-role`(강제 장치용 role 표식)이 담는다.
- 코딩 표준·컨벤션은 Dev 소유 `docs/architecture/overview.md`가 담는다 (첫 설계 때 작성).

## 2. 브랜치·PR·merge

- 브랜치는 task 단명이다. 매 작업 시작마다 `git fetch origin` 후 `origin/main`에서 `<role>/<작업명>` 브랜치를 새로 딴다 (`pm/…`, `dev/…`, `ui/…`, `orch/…`). 장수 브랜치 금지.
- main 직커밋 금지. 총괄 포함 모든 변경은 PR로만 통합한다.
- merge는 총괄 에이전트만 한다. 방식은 **squash merge** — main 이력은 작업 단위당 1커밋.
- merge 전제: 독립 리뷰 에이전트(`pr-reviewer`)의 통과 보고. 작성자는 자기 PR을 리뷰하지 않는다.
- PR 제목은 `type(scope): 요약` 형식, 본문에 관련 Issue 번호(`#N`)와 변경 영향(Domain/Spec/Arch Impact)을 적는다. 커밋 규약은 PR 단위로만 강제하고 작업 중 커밋은 자유다.
- 배포 이후에는 merge 권한이 사람에게 넘어간다.

### 리뷰 중요도와 처리

리뷰 발견의 중요도는 normal · high · critical 3단계다. 배정은 리뷰어가 1차로 하고, 경계 사례의 최종 판정은 총괄이 한다.

| 중요도 | 기준 | 처리 |
|--------|------|------|
| **critical** | 비밀값·PII 노출(저장소 PUBLIC), 데이터 파괴·유실 경로, 인증·권한 우회, main 파괴(빌드·기존 테스트 실패) | merge 불가. 총괄이 **PR 작성 role에게 즉시 수정 지시** |
| **high** | 스펙 인수 조건 미충족·명백한 기능 버그, 소유권 침범, 동작 변경에 테스트 부재, 도메인 정책 오구현 | merge 불가. 총괄이 **PR 작성 role에게 긴급 수정 지시** |
| **normal** | 리팩토링·네이밍·성능 개선 여지, 문서 규약 경미 위반(front matter 누락 등), 스펙 모호로 확인 필요 | merge 진행. 항목을 **`[Ticket]` Issue로 열어** 후속 추적 |

- critical·high 수정은 새 PR이 아니라 **같은 PR에 push**하고 재리뷰를 받는다.
- 긴급 수정 지시의 수신자는 항상 그 PR의 작성 role이다 (pm PR이면 PM, ui PR이면 UI). 전달은 §4 통신 규약을 따른다.
- 루브릭 경계 사례는 발견될 때마다 이 표에 추가해 상세화한다.

## 3. 작업 흐름

```
[PM] 요구 → PRD → ADR(제품 결정) → SPEC 파일 → GitHub Epic Issue
[Dev] Epic을 세로 슬라이스 서브 이슈로 분해 → 구현 → PR
[UI] 구현된 화면 검수 → docs/ui/ 마감 스펙 → Dev가 반영 슬라이스로 처리
```

- SPEC의 유일한 정본은 `docs/specs/*.md` 파일이다. Issue 본문에는 요약과 파일 링크만 넣고 상세를 복사하지 않는다. 수정은 파일에만 한다.
- 기능 구현이 디자인보다 먼저다. 디자인 반영은 `docs/ui/` 스펙이 나온 뒤 별도 슬라이스.
- 과업 추적은 GitHub Issues, 이력 추적은 git log·PR diff. 별도 tasks·changelog 파일을 두지 않는다.
- 결정 기록은 append-only다: 제품·도메인 결정은 `docs/adr/ADR-00N-*.md`(PM), 기술 결정은 `docs/architecture/decisions/TDR-00N-*.md`(Dev). 상태는 Proposed → Accepted → Superseded로만 흐르고, 대체 시 삭제하지 않고 상태만 바꾼다. 두 기록 모두 같은 템플릿(맥락 / 결정 / 대안 검토 / 트레이드오프)을 쓴다.

### GitHub 워크플로우

**Issue 종류** — 제목 접두사로 구분한다.

| 종류 | 발행자 | 내용 |
|------|--------|------|
| `[Epic]` | PM | 기능 단위. SPEC 파일 링크 + 요약. 모든 슬라이스가 닫히면 PM이 닫음 |
| `[Slice]` | Dev | 세로 슬라이스 1개. GitHub sub-issue로 Epic에 묶음 |
| `[Ticket]` | 총괄 | 리뷰 normal 후속, 개선·부채 |
| `[Request]` | 아무 role | 소유권 밖 수정 요청. 소유 role이 자율로 수용(구현 후 PR) 또는 거절(사유 코멘트 후 close). role 간 의견 충돌 시에만 총괄이 중재 |

- PR 본문 `Closes #N`으로 Issue와 연결한다 — merge 시 자동 close.
- 담당 role은 Issue 종류가 결정한다(Epic=PM, Slice=Dev, …). 애매하면 본문에 담당을 명시한다.

**라벨** — 분류 전용이다. 상태를 라벨로 표현하지 않는다.

| 축 | 값 |
|----|----|
| type | `type:feature` `type:bug` `type:refactor` `type:docs` `type:chore` |
| surface | `surface:ui` `surface:db` `surface:auth` `surface:api` `surface:workflow` `surface:docs` |
| risk | `risk:security` `risk:privacy` `risk:performance` `risk:concurrency` `risk:migration` `risk:external` |

**Project Status** — 상태의 정본은 GitHub Project의 Status 필드다.

| Status | 의미 | 옮기는 손 |
|--------|------|-----------|
| Backlog | 발행됐지만 착수 순서 미정 | 발행자 |
| Todo | 다음에 집을 것으로 확정 — 에이전트의 디스패치 큐 | PM(슬라이스 순서)·총괄 |
| In Progress | 브랜치 따고 작업 중 | 담당 role |
| In Review | PR 열림, 리뷰·긴급 수정 루프 | 담당 role |
| Done | merge·close | 자동 |
| Blocked | 스펙 공백·Request 대기·의존 미완. **사유 코멘트 필수** | 담당 role |

- 각 role은 자기 카드를 스스로 옮긴다. 작업 시작=In Progress, PR 생성=In Review는 role의 표준 절차다.
- 조용히 멈추지 않는다 — 진행 불가면 Blocked로 옮기고 사유를 코멘트로 남긴다. 총괄은 Blocked 열을 정기적으로 훑는다.

## 4. 통신

- **기록이 정본, 벨은 신호다.** 에이전트 간 지시·요청·보고의 내용은 항상 GitHub(PR 코멘트·Issue)에 남기고, Orca `terminal send`는 "확인해라" 한 줄 벨로만 쓴다. 터미널로만 전달된 지시는 없던 것으로 친다.
- 긴급 수정 지시: 총괄이 해당 PR에 코멘트(수정 항목 명시) → 작성 role 세션에 벨.
- 완료 보고: PR 생성 자체가 보고다. role은 PR을 열고 총괄 세션에 벨을 보낸다.
- 재전파: merge 소식을 전원에 뿌리지 않는다. merge 결과가 특정 role의 다음 일을 만들 때만(예: SPEC merge → Dev 슬라이싱, 기능 merge → UI 검수) 총괄이 그 role에게 Issue 할당 + 벨로 넘긴다. 그 외에는 각 role이 다음 task 시작 시 main을 당기며 자연히 따라잡는다.

## 5. 병렬 작업

- role 간 병렬은 항상 허용된다.
- 한 worktree 안에서 쓰기 작업을 subagent로 병렬화할 때는 반드시 슬라이스별 임시 worktree(isolation: worktree)로 격리한다. 같은 체크아웃에서 쓰기 병렬 금지.
- 다른 role의 worktree 폴더를 직접 읽거나 수정하지 않는다. 통합은 main을 통해서만.

## 6. 문서 규격

- 모든 `docs/` 문서 상단에 front matter를 둔다: `owner`, `related_adr`, `related_issue`. 문서를 수정하면 함께 갱신한다.
- 수정 날짜·버전은 front matter에 두지 않는다 — git이 정본이다 (`git log -1 --format=%as -- <파일>`).
- 이전 프로젝트 산출물(`snapshot/2026-08-20-pre-reset` 브랜치)은 참조 금지. 백지에서 시작한다.

## 7. 강제 장치

- **PreToolUse 훅** `.claude/hooks/ownership-guard.sh`(로직: `ownership-check.py`): `.agent-role`이 있는 worktree에서 소유 밖 경로의 Edit/Write/NotebookEdit을 편집 시점에 거부한다. 자기 worktree·임시 디렉터리·`~/.claude` 밖의 절대 경로(다른 worktree 포함)도 거부한다.
- **pre-commit** `.githooks/pre-commit`: staged 변경(추가·수정·**삭제·rename 양쪽 경로**)의 소유권 검사 + 트리 어디서든 `.env*`·`.envrc` 커밋 차단(`.env.example` 예외). 저장소 클론·재설정 시 `git config core.hooksPath .githooks`를 한 번 실행해야 한다.
- 두 장치 모두 **fail-closed**다: `config/ownership.json`이 깨졌거나 `.agent-role`의 role이 미등록이면 허용이 아니라 차단한다. 총괄(=`.agent-role` 없음)만 무검사.
- 알려진 한계: role 에이전트가 `git commit --no-verify`나 `.agent-role` 자체 수정으로 자기 가드를 끌 수는 있다. 이는 규칙 위반이며 최종 방어선은 PR 독립 리뷰다 — 리뷰어는 브랜치 접두사와 변경 경로의 소유권을 반드시 대조한다.
- 저장소는 PUBLIC이다. 비밀값은 `.env`·`.env.local`에만 두고, 예시는 `.env.example`에 플레이스홀더로만 적는다.

## 8. 미결 (결정되면 이 문서를 갱신)

- 문서 인덱스·검색 스크립트(tsx)
- 가드 자동 테스트 하네스 (#63)
