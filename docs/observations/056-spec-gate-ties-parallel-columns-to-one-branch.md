---
status: open
target: .claude/hooks/spec-gate.py
date: 2026-10-03
---

# 병렬로 돌라는 plan과 브랜치 하나를 요구하는 게이트가 부딪힌다

`fsd-read-write-layers`의 AC-12는 안쪽 열을 **병렬**로 적는다 — 「worktree를 열로 떼어 같이 돈다」고, 그렇게 되는 까닭(빼낸 훅을 그 화면의 `.tsx` 하나만 부른다)까지 적혀 있다. 열이 아홉이다.

그런데 열마다 worktree를 떼면 브랜치가 아홉이 되고, `spec-gate.py`는 `feat/` 브랜치의 `src/` 수정을 **그 브랜치 슬러그와 같은 이름의 plan**으로만 통과시킨다.

```python
slug = feature_slug()            # "fsd-read-write-layers-qr"
plan = f"{PLAN_DIR}/{slug}.md"   # docs/3-build/plans/fsd-read-write-layers-qr.md — 없다
```

plan은 하나(`fsd-read-write-layers.md`)인데 브랜치가 아홉이라 여덞이 막힌다. git은 같은 브랜치를 worktree 둘에 못 걸어서 아홉이 이름을 나눠 가질 수밖에 없다.

## 통과시키는 길이 셋이고 둘은 규칙을 비껴간다

| 길 | 왜 통과하나 | 값 |
| --- | --- | --- |
| 열마다 plan 파일 | 슬러그가 실재 plan을 가리킨다 | 한 task의 계획서가 열로 쪼개져 문서 아홉이 생긴다 |
| `feat/`가 아닌 브랜치 | `feature_slug()`가 `None`을 내 게이트가 그냥 돌아간다 | ADR-005의 「기능 브랜치는 `feat/<슬러그>`」를 버린다 |
| detach된 worktree | `rev-parse --abbrev-ref HEAD`가 `HEAD`를 내 같은 자리로 빠진다 | 같다 |

뒤 둘은 게이트를 **끄는** 것이지 통과하는 것이 아니다.

## 이번에는 직렬로 돈다

열 아홉을 `feat/fsd-read-write-layers` 하나에서 차례로 내보낸다 — 이동 열 열 묶음이 돈 것과 같은 리듬이고, 열 안에서 쓰는 조사자는 그대로 병렬이다. **plan 문서 아홉을 만드는 값이 병렬로 버는 시간보다 크다고 봤다** — 열마다 「완료 조건」을 따로 적으면 그 조건들이 한 AC를 아홉으로 나눠 들어, 저장소 전체를 한 번에 보는 단언(「`.tsx`에 업무 상태가 없다」)이 어느 문서에도 안 선다.

## 기계가 대신할 수 있나

**아직 아니다.** 게이트에 「슬러그가 plan 이름으로 시작하면 통과」를 넣으면 아홉이 다 풀리지만, 그 느슨함은 `feat/payroll-view-2` 같은 이름도 같이 통과시킨다. 판정에 쓸 축(「열 PR인가 새 task인가」)이 브랜치 이름에 없다.

이 자리가 다시 오는 조건은 **한 plan이 PR 넷 이상으로 갈리고 그 PR들이 서로를 안 기다리는 것**이다. 두 번째가 오면 게이트에 축을 하나 더 세울 값이 선다.
