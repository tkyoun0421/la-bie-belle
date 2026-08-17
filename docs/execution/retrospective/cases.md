# 회고 사례

형식과 규칙은 [README](README.md)에 있다. 한 줄 형식: `- <task-id> | 성공|실패 | <한 줄 요약> | <근거 경로>`

새 줄은 아래에 덧붙인다. 기존 줄은 고치거나 지우지 않는다.

<!-- cases:start -->

- P4-T03 | 실패 | 새 알림 팬아웃이 만든 e2e teardown FK 위반을 GoTrue 동시성 탓으로 보고 serial 설정으로 덮은 뒤 그 spec을 회귀 확인에서 뺐다 — 대조 실행이 spec 파일만 원본이고 마이그레이션은 적용된 상태여서 환경 탓이라는 판정이 성립할 수 없었다 | docs/execution/runs/P4-T03/radio.md · docs/execution/reviews/P4-T03-review.json F-01 · 05eb52a

- P0-T46 | 실패 | 게이트 묶음에 항목을 더하는 것만으로 기존 self-test가 깨지고 훅 픽스처가 새 파일을 요구한다는 것을 revision 1·2가 놓쳐 구현 중 허용 경로를 넓혀야 했다 | docs/execution/radio/P0-T46-radio.md 개정 이력 revision 3 · docs/execution/runs/P0-T46/handoff.md

- P0-T47 | 실패 | RADIO를 다섯 번 봉인했는데 revision 2~5의 사유가 전부 봉인 전에 저장소를 기계로 한 번 훑었으면 나왔을 것들이다 — 문서 밖 간격값을 쓰는 실코드 19곳과 `gap-0` 네 파일, `.gitignore`의 `.claude/skills/*`가 새 스킬을 무시한다는 사실, 모든 task가 내는 `reviews/**`·`retrospective/**` 경로 셋 다 커밋 직전이나 구현 중에야 드러났다 | docs/execution/radio/P0-T47-radio.md 개정 이력 2~5 · docs/execution/runs/P0-T47/open-decisions.md

- P0-T47 | 실패 | 정본 대조 게이트의 self-test fixture를 실물에서 복사하지 않고 손으로 적어 게이트와 회귀 테스트가 같은 방향으로 틀렸다 — 접두 표기 하나(`--spacing-nav-safe` 대 `spacing-nav-safe`)가 어긋나 하단 여백 대조가 0행 실행되고 간격 표 13행 중 10행만 검사되는데도 self-test는 GREEN이었다 | docs/execution/reviews/P0-T47-review.json F-01·F-04 · docs/execution/runs/P0-T47/tdd.json

- P0-T47 | 실패 | 승인만 받고 `index.jsonl`에 등록되지 않은 P0-T46 위에 이 task를 얹어 진행해 커밋을 가를 때 되돌릴 수 없었다 — P0-T47의 문서 줄 일부가 P0-T46 커밋에 섞여 들어갔고 P0-T46의 인수 조건 하나는 다음 커밋에서야 채워졌다 | docs/execution/runs/P0-T47/handoff.md 「커밋을 가르며 생긴 것」 · docs/execution/reviews/P0-T47-review.json F-09 · 76c108f

- P0-T47 | 실패 | FOUNDATIONS에 「탭 바가 없는 화면에는 이 여백을 두지 않는다」는 산문 규칙을 새로 넣으면서 같은 커밋의 화면 일곱이 그것을 어기는 상태로 뒀다 — `gate:tokens`는 값 표만 대조하므로 정본에 적힌 산문은 아무도 강제하지 않는다 | docs/execution/reviews/P0-T47-review.json F-08 · da8be6c의 docs/product/design/FOUNDATIONS.md

- P0-T47 | 성공 | 새 규칙이 기존 자산과 부딪힌 두 지점에서 우회를 다 거부했다 — 실사용 중인 `gap-0`은 린트 예외 목록 대신 FOUNDATIONS 표에 행으로 올려 「표에 있는 값만」이 예외 없이 성립하게 했고, 새 게이트가 hook-acceptance 픽스처 저장소를 깨뜨렸을 때는 「파일이 없으면 통과」 대신 픽스처에 대조 쌍을 심었다 | docs/execution/radio/P0-T47-radio.md 개정 이력 2 · docs/execution/runs/P0-T47/handoff.md

<!-- cases:end -->
