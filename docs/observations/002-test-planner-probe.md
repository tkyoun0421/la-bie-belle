---
status: open
target: test-planner
date: 2026-09-06
resolved:
---

**일**: 계획자가 "로컬은 `.env.local` 덕에 통과하고 CI만 빨간불"이라 진단했는데, probe 테스트로 재보니 로컬 vitest도 `undefined`였다(Vite envPrefix가 VITE\_만 본다). 진단이 틀리면 writer가 잘못된 리스크를 받는다. 실측으로 뒤집힌 기록만 있고 정의문에는 반영이 없다.

**고침**: test-planner 정의문에 환경·설정 진단은 추론으로 단정하지 말라는 조항을 더한다. probe로 확인하거나, 못 하면 미확인이라 표시한다.

**원칙**: 실측 없는 환경 진단은 가설이고, 가설은 가설이라 표시해야 한다.

출처: docs/log/2026-08-28-3.md
