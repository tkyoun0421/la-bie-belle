---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #68, #101"
---

# Matcher: 문서를 쓸 때

`docs/` 아래를 만들거나 고칠 때마다 읽는다.

세션에서 문서 작업을 이끄는 에이전트는 `/doc` 스킬을 쓴다. 그 스킬이 절차를 끝까지 돌린다 — 소유권 확인, 브랜치, 템플릿, 발행이다. 그 스킬이 붙이는 subagent는 아래 규칙을 직접 따르고 스킬로 되돌아오지 않는다.

## 템플릿

`docs/templates/`에서 시작한다. 빈 파일에서 시작하지 않는다.

| 문서 | 경로 | 템플릿 |
|----------|------|----------|
| PRD | `docs/prd.md` | `docs/templates/prd.md` |
| 도메인 | `docs/domain/<topic>.md` | `docs/templates/domain.md` |
| ADR | `docs/adr/ADR-00N-<slug>.md` | `docs/templates/adr.md` |
| TDR | `docs/architecture/decisions/TDR-00N-<slug>.md` | `docs/templates/tdr.md` |
| SPEC | `docs/specs/<feature>.md` | `docs/templates/spec.md` |
| UI 명세 | `docs/ui/<screen>.md` | `docs/templates/ui-spec.md` |
| 아키텍처 개요 | `docs/architecture/overview.md` | `docs/templates/architecture-overview.md` |

## Front matter

모든 문서는 같은 네 필드로 시작한다. 문서를 손댈 때마다 함께 갱신한다.

```yaml
---
owner: "@agent-pm"
status: "active"
related_adr: "ADR-001"
related_issue: "#42"
---
```

`status`는 문서에 따라 어휘 둘 중 하나를 쓴다. 결정 기록 — ADR과 TDR — 은 `proposed` → `accepted` → `superseded`를 쓰고, 나머지는 전부 `draft` → `active` → `superseded`를 쓴다. 둘 다 한 방향으로만 흐른다.

`related_issue`는 Issue 번호를 쉼표로 나열한 문자열이다. 없으면 빈 문자열이다.

```yaml
related_issue: ""
related_issue: "#69"
related_issue: "#69, #88"
```

문서 하나가 Issue 여럿을 거치는 것은 예외가 아니라 정상이다. 문서를 손대면 그 작업의 Issue를 뒤에 덧붙이고, 앞 값은 지우지 않는다.

수정 날짜도 버전 번호도 쓰지 않는다. 정본은 git이다: `git log -1 --format=%as -- <file>`.

## 정본은 하나다

명세의 유일한 정본은 `docs/specs/` 아래의 파일이다. Issue 본문은 요약과 링크를 담을 뿐 상세를 복사하지 않는다. 정정은 파일로 간다.

## 결정 기록

제품·도메인 결정은 `docs/adr/ADR-00N-<slug>.md`이고 PM이 소유한다. 기술 결정은 `docs/architecture/decisions/TDR-00N-<slug>.md`이고 Dev가 소유한다.

둘 다 **append-only**다. 대체는 옛 기록을 지우지 않는다. 옛 기록의 `status`를 `superseded`로 바꾸고 그것을 대신하는 기록의 이름을 적을 뿐이다.

둘 다 같은 템플릿을 쓴다.

```
맥락 / 결정 / 검토한 대안 / 트레이드오프
```

## 백지 원칙

`snapshot/2026-08-20-pre-reset` 브랜치의 이전 프로젝트 산출물은 절대 참조하지 않는다.
