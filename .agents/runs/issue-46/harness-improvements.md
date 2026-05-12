# 하네스 개선 평가

## 결정

- 하네스 건강도: 84/100
- 평가 대상: issue #46 실행과 PR follow-up 추적 규칙

## 주요 개선

- `state.json.inbox_refs`의 의미가 명확해졌다.
- PR 본문에 `Included follow-ups` 섹션이 생겨 같은 PR에 포함된 로컬 발견 작업을 기록할 수 있다.
- draft-pr skill, PR agent, issue workflow, inbox policy, run-state schema가 같은 규칙을 공유한다.

## 남은 리스크

- PR 본문과 `state.json.inbox_refs`의 일치 여부는 아직 자동 검증하지 않는다.
- 실제 follow-up 포함 PR fixture가 없어 규칙의 실전 검증은 다음 사례에 의존한다.

## 제안

- `2026-05-12-pr-inbox-ref-consistency-check`: PR 본문과 inbox_refs 일치 검증 추가
