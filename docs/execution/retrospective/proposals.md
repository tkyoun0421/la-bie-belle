# 회고 제안

회고에서 나온 개선 제안을 모아두는 곳이다. 형식과 규칙은 [README](README.md)에 있다.

**여기 있다는 것은 승인이 아니다.** task로 만드는 것은 사용자 승인이 있을 때만 한다.

한 줄 형식: `- [ ] <제안 요약> | 출처 <task-id> | <근거 경로>`

<!-- proposals:start -->

- [ ] 프로필 단위로 행이 늘어나는 변경은 봉인 체크리스트에서 work_date 밴드 축과 별개로 수신자 축 e2e 격리까지 대조한다 | 출처 P4-T03 | docs/execution/runs/interviews/2026-08-16-p4-t03-design.md · docs/execution/reviews/P4-T03-review.json F-02
- [ ] profiles를 cascade 없이 참조하는 테이블을 새로 만들면 tests/e2e/support/worker-session.ts의 삭제 전 정리 대상에 함께 넣는 규칙을 DEV-TEST에 명시한다 | 출처 P4-T03 | docs/execution/runs/P4-T03/radio.md · tests/e2e/support/worker-session.ts
- [ ] handoff의 검증 기록에 돌리지 않은 검사와 그 사유를 적는 칸을 요구한다 — 개발 중 실패를 본 spec이 표에서 통째로 빠졌는데도 검증 단계 진입까지 아무도 그 공백을 못 봤다 | 출처 P4-T03 | docs/execution/runs/P4-T03/handoff.md · docs/execution/reviews/P4-T03-review.json F-01

<!-- proposals:end -->
