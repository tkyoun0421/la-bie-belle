---
name: ai-harness-evaluate
description: 이 프로젝트에서 하네스 건강도 평가 단계만 수행할 때 사용한다. 누적 실행 기록과 점수 데이터를 보고 harness-health-score.json, harness-improvements.md, 개선 제안을 작성해야 할 때 사용하며, 사람 승인 전 설정 변경은 하지 않는다.
---

# AI 하네스 평가

하네스 건강도 평가만 수행한다.

## 절차

1. 최근 `.agents/runs/**` 실행 기록과 리뷰어 점수를 확인한다.
2. `.agents/harness/rubrics/harness-health.v1.yaml` 기준으로 하네스 건강도를 평가한다.
3. 낮은 항목에 대해 개선안을 제안한다.
4. 개선안은 `.agents/harness/improvements/proposals/`에 기록한다.
5. 사람 승인 전에는 설정, 프롬프트, 루브릭, 자동화 권한을 바꾸지 않는다.

## 산출물

- `.agents/runs/issue-{number}/harness-health-score.json` 또는 누적 평가 기록
- `.agents/runs/issue-{number}/harness-improvements.md`
- `.agents/harness/improvements/proposals/*.json` 또는 `.md`

## 금지

- 승인 없이 하네스 설정을 수정하지 않는다.
- 한 번의 실패만으로 과도한 전역 규칙을 만들지 않는다.
