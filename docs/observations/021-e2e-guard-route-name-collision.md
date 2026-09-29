---
status: actioned
target: .claude/hooks/tdd-guard-e2e.py
date: 2026-09-27
resolved: 2026-09-29
---

# 라우트 파일명이 같으면 e2e 게이트가 남의 플로우로 통과한다

## 일

`tdd-guard-e2e.py`는 `src/app/` 아래 라우트 파일을 파일명으로 플로우에 잇는다 — `src/app/(tabs)/schedule.tsx`도 `src/app/admin/schedule.tsx`도 `tests/e2e/schedule.yaml`이다. 지금 그 파일은 `schedule-worker.yaml`에 위임하는 근무자 것이라, `schedule-admin` task가 관리자 라우트를 고쳐도 게이트는 기계적으로 열린다. 관리자 쪽 실제 검증은 슬라이스 이름을 따르는 `schedule-admin.yaml`이 진다. `src/app/admin/` 아래 `qr.tsx`·`stats.tsx`·`wages.tsx`도 같은 꼴로 근무자 라우트와 이름을 나눌 수 있다.

첫 번째다. 라우트가 얇아 슬라이스 플로우가 사실상 덮는다는 것을 알고 우회했다.

**둘째가 `stats-worker`에서 났다.** `src/app/admin/stats.tsx`와 `src/app/stats.tsx`가 둘 다 `tests/e2e/stats.yaml`을 가리킨다. 그 파일은 `stats-admin`이 훅을 채우려고 끼워 넣은 `runFlow: admin-stats.yaml` 위임이었고, 이번에 근무자 여정으로 갈아엎으니 이제는 반대로 관리자 라우트가 근무자 증거로 열린다. e2e writer가 짚었다.

## 지은 것

**라우트의 짝을 파일명이 아니라 부르는 슬라이스로 찾는다.** 라우트는 얇아서(CLAUDE.md) 화면을 슬라이스가 들고 라우트는 그것을 부르기만 한다 — `src/app/admin/stats.tsx`가 `@/screens/admin-stats/`를 부르면 짝은 `tests/e2e/admin-stats.yaml`이다. 이름 공간이 슬라이스 하나로 모여 같은 이름이 둘 설 자리가 없어진다.

보는 것은 저장된 파일이 아니라 쓰려는 조각이다. 라우트를 세우는 걸음이 곧 화면을 붙이는 걸음이라 그 조각에 import가 있고, 판정에 안 쓰는 파일을 읽지 않는다는 앞선 계약(fifo 테스트)도 지킨다. 화면을 아직 안 붙인 스텁 라우트는 통과한다 — 세울 플로우가 아직 없다.

`DIRECTORY_ROUTES`로 `index.tsx`·`_layout.tsx`를 가르던 손은 걷혔다. 레이아웃은 화면을 안 불러 저절로 통과한다.

## 원칙

이름으로 짝을 찾는 게이트는 이름이 겹치는 순간 남의 증거로 열린다. 짝 찾기 규칙을 세울 때 그 이름 공간에 같은 이름이 둘 설 수 있는지를 본다.
