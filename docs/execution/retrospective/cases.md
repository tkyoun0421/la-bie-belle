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

- P0-T48 | 실패 | RADIO 하나가 화면 아홉 묶음을 덮은 탓에 재봉인이 열다섯 번까지 갔다 — 열세 번째인 revision 14에서 일정을 P0-T60으로, 배정표 라우트를 P0-T50으로 떼자 남은 범위는 두 시간 만에 verify GREEN에 닿았다. 봉인 단위가 크면 한 묶음이 막힐 때마다 나머지 여덟까지 전부 재봉인 대상이 된다 | docs/execution/radio/P0-T48-radio.md 개정 이력 14 · 4b9d103부터 4130c34까지

- P0-T48 | 실패 | 시안에서 RADIO로 옮길 때 동작 계약이 요약되며 잘렸고 하류는 시안이 아니라 RADIO만 정본으로 읽어서(`unit-test-writer.md:21`) 잘린 자리가 틀린 채로 테스트에 굳었다 — 사용자가 실제 홈 화면에서 찾은 버그 여덟 중 다섯이 이 한 단계에서 죽었고, 인수 조건 37이 「가림이 다시 걸리면」이라고만 적고 무엇이 다시 가리는지를 안 적은 자리가 그 실례다 | docs/execution/runs/P0-T48/handoff.md 「P0-T57로 넘기는 몫 — 봉인 전사 유실이 진짜 주범이다」 · docs/execution/radio/P0-T48-radio.md 개정 이력 11

- P0-T48 | 실패 | 다음 라운드에서 막힐 것을 미리 묶어 재봉인을 줄이려던 시도가 세 번 연달아 빗나갔다 — revision 11이 「5D에서 막힐 것까지 한 번에 묶었다」고 적었는데 revision 12가 「그 라운드를 실제로 돌려야 보이던 것」을 다시 열었고 revision 13이 또 열렸다. 돌려 봐야 나오는 것은 예측으로 못 덮으니 묶기보다 봉인 범위를 줄이는 쪽이 싸다 | docs/execution/radio/P0-T48-radio.md 개정 이력 11·12·13

- P0-T48 | 실패 | 확정 시안의 값을 축별로 전수하지 않고 봉인해 radius 사다리 한 축에서만 두 번 재봉인했다 — revision 6이 skeleton의 6px를 열고, revision 7이 「5라운드 착수 전 시안 전수 조사」에서 나온 11px와 12px를 다시 열었다. 용도 한정이 닫힌 목록이라 사다리에 한 줄 더하는 것조차 재봉인이고, 저장소나 시안을 미리 안 훑어 재봉인한 것이 P0-T46·P0-T47에 이어 세 task 연속이다 | docs/execution/radio/P0-T48-radio.md 개정 이력 6·7 · docs/execution/retrospective/cases.md P0-T46·P0-T47 줄

- P0-T48 | 실패 | worker 마무리 명령은 `pnpm lint`인데 CI는 `pnpm lint:ci`로 타입 인식 규칙 여덟을 더 본다 — 라운드마다 GREEN을 보고받고도 이 task가 새로 만든 파일에서만 7건이 최종 verify에 몰려 터졌고, 그 첫 verify는 출력을 `tail`에 물려 돌린 탓에 파이프가 종료 코드를 삼켜 실패가 성공으로 보고됐다(같은 사고가 이 저장소에서 두 번째다) | docs/execution/runs/P0-T48/handoff.md 「인수 조건 31 GREEN」 · docs/execution/radio/P0-T48-radio.md 개정 이력 15

- P0-T48 | 실패 | 중단된 e2e가 남긴 `schedules` 948행이 무작위 날짜 대역과 부딪혀 다음 실행을 더 자주 죽이는 되먹임을 만들었고, 그 상태로 verify를 다섯 번 돌리는 동안 매번 다른 스펙이 죽어 코드 결함인지 환경인지 판정이 안 섰다 — `pnpm db:reset` 한 번에 같은 실행이 89/90으로 올라섰다. e2e가 자기 뒤를 못 치우는 것이 진짜 결함이고 정리 책임을 어디 둘지는 P0-T62가 쥐고 있다 | docs/execution/runs/P0-T48/handoff.md 「verify를 다섯 번 돌려 얻은 것」 · tests/e2e/support/work-date-band.ts

- P0-T48 | 실패 | 위반을 성공 조건으로 고정한 테스트가 셋이라 tests 점수가 63으로 내려앉았다 — reduced-motion 블록에서 빠진 `--duration-crossfade`를 `globals.test.ts:332-334`가 누락 그대로 단언하고, 700 굵기 금지 단언은 `globals.css`만 훑어 화면 파일 셋의 `font-bold`를 놓치며, 마스킹 자릿수 단언은 정본이 갈린 현재 동작을 굳혔다. 감시선이 반대로 걸리면 고칠 때 테스트까지 함께 뒤집어야 한다 | docs/execution/reviews/P0-T48-review.json F-07·F-08·F-09와 score_rationale.tests

- P0-T48 | 실패 | 실패 셋을 한 원인으로 묶어 A/B를 돌리고 「`(tabs)/layout.tsx`의 래퍼는 무관」이라 배제했는데, 그 래퍼가 셋 중 `:439` 하나의 단독 원인이었다 — 여러 실패를 한 덩어리로 놓고 작업 트리를 되돌려 보면 A/B는 원인을 배제하는 근거가 되지 못한다 | docs/execution/runs/P0-T48/handoff.md 「`route-fade` e2e 3건은 사전 결함이다」의 정정과 「인수 조건 41 GREEN」 원인 A

- P0-T48 | 성공 | 한쪽 리뷰어만 든 발견을 상대에게 되묻는 절차가 실제로 판정을 셋 바꿨다 — Next 16의 `retry` 시그니처와 `ui`의 이벤트 배선 소유는 반박 근거가 서서 기각됐고, opus는 되묻기를 받고 「봉인된 결정」이라며 뺐던 마스킹 자릿수를 `FOUNDATIONS.md:140`과 `NOTES.md:1233`의 정본 충돌로 다시 세워 자기 판정을 뒤집었다 | docs/execution/runs/P0-T48/handoff.md 「기각 둘」·「opus가 스스로 뒤집은 것」 · docs/execution/reviews/P0-T48-review.json F-07

- P0-T48 | 성공 | 고친 다음에 원인을 역방향으로 확인했다 — `route-transition.tsx`의 `enter`와 `exit`를 일부러 맞바꿔 같은 지점의 RED가 재현되는 것을 보고 diff가 빌 때까지 원복했고, flake 수리는 `--workers=1` 반복(8/8·10/10)으로 확인했으며, 단언이 「호출 횟수」에서 「타입 붙은 전환 횟수」로 좁아지며 잃은 감시를 backlog에 적어 남겼다 | docs/execution/runs/P0-T48/handoff.md 「인수 조건 41 GREEN」 · docs/execution/reviews/backlog.md의 `startViewTransition` 세 번 줄 · 1addbce

<!-- cases:end -->
