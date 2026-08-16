# 회고 사례

형식과 규칙은 [README](README.md)에 있다. 한 줄 형식: `- <task-id> | 성공|실패 | <한 줄 요약> | <근거 경로>`

새 줄은 아래에 덧붙인다. 기존 줄은 고치거나 지우지 않는다.

<!-- cases:start -->

- P4-T03 | 실패 | 새 알림 팬아웃이 만든 e2e teardown FK 위반을 GoTrue 동시성 탓으로 보고 serial 설정으로 덮은 뒤 그 spec을 회귀 확인에서 뺐다 — 대조 실행이 spec 파일만 원본이고 마이그레이션은 적용된 상태여서 환경 탓이라는 판정이 성립할 수 없었다 | docs/execution/runs/P4-T03/radio.md · docs/execution/reviews/P4-T03-review.json F-01 · 05eb52a

- P0-T46 | 실패 | 게이트 묶음에 항목을 더하는 것만으로 기존 self-test가 깨지고 훅 픽스처가 새 파일을 요구한다는 것을 revision 1·2가 놓쳐 구현 중 허용 경로를 넓혀야 했다 | docs/execution/radio/P0-T46-radio.md 개정 이력 revision 3 · docs/execution/runs/P0-T46/handoff.md

<!-- cases:end -->
