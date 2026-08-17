# 회고 제안

회고에서 나온 개선 제안을 모아두는 곳이다. 형식과 규칙은 [README](README.md)에 있다.

**여기 있다는 것은 승인이 아니다.** task로 만드는 것은 사용자 승인이 있을 때만 한다.

한 줄 형식: `- [ ] <제안 요약> | 출처 <task-id> | <근거 경로>`

<!-- proposals:start -->

- [ ] 프로필 단위로 행이 늘어나는 변경은 봉인 체크리스트에서 work_date 밴드 축과 별개로 수신자 축 e2e 격리까지 대조한다 | 출처 P4-T03 | docs/execution/runs/interviews/2026-08-16-p4-t03-design.md · docs/execution/reviews/P4-T03-review.json F-02
- [ ] profiles를 cascade 없이 참조하는 테이블을 새로 만들면 tests/e2e/support/worker-session.ts의 삭제 전 정리 대상에 함께 넣는 규칙을 DEV-TEST에 명시한다 | 출처 P4-T03 | docs/execution/runs/P4-T03/radio.md · tests/e2e/support/worker-session.ts
- [ ] handoff의 검증 기록에 돌리지 않은 검사와 그 사유를 적는 칸을 요구한다 — 개발 중 실패를 본 spec이 표에서 통째로 빠졌는데도 검증 단계 진입까지 아무도 그 공백을 못 봤다 | 출처 P4-T03 | docs/execution/runs/P4-T03/handoff.md · docs/execution/reviews/P4-T03-review.json F-01

- [ ] 모든 task가 공통으로 내는 4·5단계 산출물 경로(`reviews/<id>-review.json`·`reviews/backlog.md`·`retrospective/cases.md`·`proposals.md`)를 RADIO마다 손으로 적는 대신 `gate:scope`가 그 task ID 몫에 한해 기본 허용하게 한다 | 출처 P0-T47 | docs/execution/radio/P0-T47-radio.md 개정 이력 5 · harness/gates/scope.ts
- [ ] 정본 대조 게이트의 self-test fixture는 정본 파일에서 복사해 만들고, fixture 표기가 실물과 같은지 단언하는 회귀를 한 건 둔다 — 손으로 적은 fixture는 게이트와 같은 오해를 공유해 거짓 GREEN을 만든다 | 출처 P0-T47 | docs/execution/reviews/P0-T47-review.json F-01·F-04 · harness/self-test/fixtures/token-parity/
- [ ] `COMMIT_GATES`에 게이트를 더하는 변경은 봉인 전에 hook-acceptance 픽스처 저장소가 그 게이트의 입력 파일을 갖는지 대조하도록 봉인 체크리스트에 넣는다 — P0-T46과 P0-T47이 연달아 같은 곳에서 걸렸다 | 출처 P0-T47 | docs/execution/retrospective/cases.md P0-T46 줄 · harness/self-test/hook-acceptance.test.ts
- [ ] task를 `in_progress`로 올리기 전에 워킹 트리에 앞선 task의 미커밋 산출물이 없는지, HEAD가 그 자체로 빌드되는지 확인하는 단계를 WORKFLOW 3단계 진입에 넣는다 — `index.jsonl`의 한 건 제한은 상태 줄만 보고 작업 트리는 안 본다 | 출처 P0-T47 | docs/execution/runs/P0-T47/handoff.md 「커밋을 가르며 생긴 것」

<!-- proposals:end -->
