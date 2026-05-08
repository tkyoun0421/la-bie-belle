---
name: ai-harness-dashboard
description: 이 프로젝트에서 AI 하네스 대시보드 갱신 단계만 수행할 때 사용한다. .agents/runs/** 실행 기록을 dashboard/data/runs.js 로 변환하고 HTML 대시보드 확인 경로를 안내해야 할 때 사용한다.
---

# AI 하네스 대시보드

대시보드 갱신만 수행한다.

## 절차

1. 실행 기록이 `.agents/runs/**`에 있는지 확인한다.
2. 대시보드 데이터를 생성한다.

```bash
node .agents/harness/scripts/build-dashboard-data.mjs
```

3. 생성된 `.agents/harness/dashboard/data/runs.js` 문법을 확인한다.
4. 사용자가 열 HTML 경로를 안내한다.

## 산출물

- `.agents/harness/dashboard/data/runs.js`

## 금지

- 이슈 산출물을 수정하지 않는다.
- 점수를 새로 만들지 않는다.
- 하네스 개선안을 만들지 않는다.
