---
status: open
target: .claude/hooks/spec-gate.py
date: 2026-10-10
---

# `spec-gate`가 「행이 완료 조건이다」 task의 `src/`를 통째로 막는다

`feat/spell-number-shared`에서 writer가 테스트를 한 줄도 못 썼다. Edit이 PreToolUse에서 막혔고 `src/`가 안 바뀌었다.

`.claude/hooks/spec-gate.py`는 `feat/<슬러그>` 브랜치의 `src/` 쓰기를 둘 중 하나가 있을 때만 통과시킨다 — `docs/2-design/spec/<슬러그>.md`에 `status: approved`, 또는 `docs/3-build/plans/<슬러그>.md`에 `## 완료 조건` 절. 그 task는 둘 다 없었다. `docs/backlog.md`의 그 행이 「spec 또는 plan」 칸에 **`미작성 — 행이 완료 조건이다`**를 적어 두고 본문이 완료 조건을 들고 있었다.

**그 문구를 쓴 행이 여럿이다** — `system-detail-level`·`test-data-isolation`·`logo-e2e`·`chart-math-out-of-tsx`·`attendance-column-label` 등. 그 행 가운데 `active`나 `candidate`인 것은 전부 같은 이유로 `src/`가 막힌다. `spec-gate.py`의 `plan_holds_spec()`이 `plans/<슬러그>.md` 안의 문자열만 찾고 `backlog.md` 행은 읽지 않기 때문이다.

[`docs/3-build/README.md`](../3-build/README.md)는 비기능 task가 「완료 조건과 작업 순서를 한 파일에 적고 `backlog.md`의 행이 여기를 링크한다」고 적는다. 그러니 「행이 완료 조건이다」는 README가 기대하는 꼴이 아니고, 훅이 그 예외를 모르는 것이 아니라 **그 예외가 정본 밖에서 자란 것이다.**

이번 자리는 plan을 써서 풀었다 — [spell-number-shared](../3-build/plans/spell-number-shared.md)가 AC 다섯을 든다. 훅을 넓히는 길도 있었지만 택하지 않았다. `spec-gate`가 막는 것은 「끝이 어디인지 안 정한 구현」이고, `backlog.md` 행의 산문을 완료 조건으로 인정하면 AC로 쪼개지지 않은 글이 그 자리를 차지한다. 이 행만 해도 본문이 긴 산문이라 「무엇이 끝인가」를 셀 수 없었다.

남은 판정은 둘이다. **하나** — 그 문구를 쓴 다른 행들이 `src/`에 들어갈 때 plan을 받게 할지, 아니면 「행이 완료 조건이다」를 쓰지 않는 쪽으로 정본을 벼릴지. **둘** — 훅이 막을 때 그 까닭과 해소 방향을 말하게 할지. 지금은 조건 둘을 적시하지만 「backlog 행이 완료 조건을 들고 있다」는 자리를 안내하지 않아서, writer가 저장소 관례와 훅 사이의 충돌을 스스로 찾아 올려야 했다.
