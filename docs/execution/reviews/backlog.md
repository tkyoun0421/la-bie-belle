# 교차 검증 backlog

교차 검증에서 확정된 `medium`·`low` 발견을 한 줄씩 누적하는 목록이다.

```text
- [ ] [severity] [task-id] 제목 — 근거 파일
```

형식, 누적 대상, 완료 표기와 task 승격 규칙의 정본은 [교차 검증 계약의 backlog 형식](../../workflow/REVIEW.md#backlog-형식)이 소유한다. 이 파일은 목록만 갖는다.

## 목록

- [x] [medium] [P0-T29] 계약 준수 40점 분모를 저장소 게이트 4종으로 한정(상수 점수 제거) — harness/dashboard/collect.ts
- [x] [medium] [P0-T29] 게이트 실행 예외를 격리해 생성 중단 대신 실행 실패로 표시 — harness/dashboard/collect.ts
- [x] [medium] [P0-T29] collect·main 생성 명령 수준 테스트 신설 — harness/self-test/dashboard-collect.test.ts
- [x] [medium] [P0-T29] 수정 반영 후 tdd.json RED→GREEN 재기록 — docs/execution/runs/P0-T29/tdd.json
- [x] [low] [P0-T29] next-action 근거 문구를 실제 판정 기준(index 등록 순서)으로 정정 — harness/dashboard/next-action.ts
- [x] [low] [P0-T29] HEAD subject·body 조회를 git 프로세스 1회로 병합 — harness/dashboard/collect.ts
- [ ] [low] [P0-T29] 미결 부채 집계가 마지막 handoff 절의 전체 재기술 가정에 의존 — harness/dashboard/collect.ts
- [x] [medium] [P0-T33] task 결과 파일명과 task_id 일치 미검증 — harness/dashboard/reviews.ts
- [x] [medium] [P0-T33] 스캔 결과 표시가 승인 문구 전체 스캔 <날짜>와 다름 — harness/dashboard/reviews.ts
- [x] [low] [P0-T33] 해소된 F-09 backlog 항목이 미완료로 남음 — docs/execution/reviews/backlog.md
- [x] [low] [P0-T33] backlog 회귀 테스트의 도달 불가능한 단언 — harness/self-test/dashboard-reviews.test.ts
- [x] [low] [P0-T33] participants 파싱 실패가 발견마다 연쇄 오탐을 만듦 — harness/dashboard/reviews.ts
- [x] [medium] [P0-T01] app-build 검증이 서버 경계를 판별하지 못함 — docs/execution/runs/P0-T01/handoff.md
- [x] [medium] [P0-T01] 필요한 설정 파일이 봉인된 변경 허용 경로 밖 — postcss.config.mjs
- [x] [medium] [P0-T01] views 개명이 상위 ADR-0008·phase 문서와 충돌 — docs/standards/adr/0008-fsd-server-first-development-guards.md
- [x] [low] [P0-T01] 서버 경계 파일의 이름과 내용이 어긋남 — src/shared/config/server-only.config.ts
- [x] [medium] [P0-T29] reviews 파서가 total=5영역 평균 규칙을 검증하지 않음(P0-T33 파서 개정과 함께 처리) — harness/dashboard/reviews.ts
