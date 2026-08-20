---
owner: "@orchestrator"
related_adr: ""
related_issue: ""
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
- 자기 소유가 아닌 경로는 직접 수정하지 않는다. 필요하면 소유 에이전트에게 Issue 또는 PR 코멘트로 요청한다.
- 각 worktree의 정체성은 untracked `CLAUDE.local.md`(지시)와 `.agent-role`(강제 장치용 role 표식)이 담는다.

## 2. 브랜치·PR·merge

- 브랜치는 task 단명이다. 매 작업 시작마다 `git fetch origin` 후 `origin/main`에서 `<role>/<작업명>` 브랜치를 새로 딴다 (`pm/…`, `dev/…`, `ui/…`, `orch/…`). 장수 브랜치 금지.
- main 직커밋 금지. 총괄 포함 모든 변경은 PR로만 통합한다.
- merge는 총괄 에이전트만 한다. 방식은 **squash merge** — main 이력은 작업 단위당 1커밋.
- merge 전제: 독립 리뷰 에이전트(`pr-reviewer`)의 통과 보고. 작성자는 자기 PR을 리뷰하지 않는다.
- PR 제목은 `type(scope): 요약` 형식, 본문에 관련 Issue 번호(`#N`)와 변경 영향(Domain/Spec/Arch Impact)을 적는다. 커밋 규약은 PR 단위로만 강제하고 작업 중 커밋은 자유다.
- 배포 이후에는 merge 권한이 사람에게 넘어간다.

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
- 작업 완료 시 총괄 에이전트에게 알린다.

## 4. 병렬 작업

- role 간 병렬은 항상 허용된다.
- 한 worktree 안에서 쓰기 작업을 subagent로 병렬화할 때는 반드시 슬라이스별 임시 worktree(isolation: worktree)로 격리한다. 같은 체크아웃에서 쓰기 병렬 금지.
- 다른 role의 worktree 폴더를 직접 읽거나 수정하지 않는다. 통합은 main을 통해서만.

## 5. 문서 규격

- 모든 `docs/` 문서 상단에 front matter를 둔다: `owner`, `related_adr`, `related_issue`. 문서를 수정하면 함께 갱신한다.
- 수정 날짜·버전은 front matter에 두지 않는다 — git이 정본이다 (`git log -1 --format=%as -- <파일>`).
- 이전 프로젝트 산출물(`snapshot/2026-08-20-pre-reset` 브랜치)은 참조 금지. 백지에서 시작한다.

## 6. 강제 장치

- **PreToolUse 훅** `.claude/hooks/ownership-guard.sh`: `.agent-role`이 있는 worktree에서 소유 밖 경로의 Edit/Write를 편집 시점에 거부한다.
- **pre-commit** `.githooks/pre-commit`: staged 파일의 소유권 검사 + `.env*` 커밋 차단. 저장소 클론·재설정 시 `git config core.hooksPath .githooks`를 한 번 실행해야 한다.
- 저장소는 PUBLIC이다. 비밀값은 `.env`·`.env.local`에만 두고, 예시는 `.env.example`에 플레이스홀더로만 적는다.

## 7. 미결 (결정되면 이 문서를 갱신)

- 총괄이 받은 완료 알림의 타 worktree 재전파 규칙
- GitHub Projects(Kanban) 상태 관리 주체
- 코딩 표준 문서 위치 (제안: `docs/architecture/overview.md`)
- 문서 인덱스·검색 스크립트(tsx)
