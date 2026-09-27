---
status: open
target: .claude/hooks/tdd-guard-e2e.py
date: 2026-09-27
resolved:
---

# 라우트 파일명이 같으면 e2e 게이트가 남의 플로우로 통과한다

## 일

`tdd-guard-e2e.py`는 `src/app/` 아래 라우트 파일을 파일명으로 플로우에 잇는다 — `src/app/(tabs)/schedule.tsx`도 `src/app/admin/schedule.tsx`도 `tests/e2e/schedule.yaml`이다. 지금 그 파일은 `schedule-worker.yaml`에 위임하는 근무자 것이라, `schedule-admin` task가 관리자 라우트를 고쳐도 게이트는 기계적으로 열린다. 관리자 쪽 실제 검증은 슬라이스 이름을 따르는 `schedule-admin.yaml`이 진다. `src/app/admin/` 아래 `qr.tsx`·`stats.tsx`·`wages.tsx`도 같은 꼴로 근무자 라우트와 이름을 나눌 수 있다.

첫 번째다. 라우트가 얇아 슬라이스 플로우가 사실상 덮는다는 것을 알고 우회했다.

## 고침

두 번째가 나오면 `src/app/` 매핑을 디렉터리 경로를 이어 붙인 이름(`admin-schedule`)으로 바꾸거나, 얇은 라우트는 게이트 밖으로 빼고 슬라이스만 본다. 지금은 test-planner가 writer에게 「슬라이스 플로우가 진다」를 명시한다.

## 원칙

이름으로 짝을 찾는 게이트는 이름이 겹치는 순간 남의 증거로 열린다. 짝 찾기 규칙을 세울 때 그 이름 공간에 같은 이름이 둘 설 수 있는지를 본다.
