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

- [ ] worker와 커밋 훅이 도는 린트를 CI와 같은 규칙으로 맞춘다 — `package.json`의 `lint`(`eslint src`)도 `lint-staged`의 `eslint --fix`도 `-c eslint.config.ci.mjs`를 안 붙여, CI에만 켜진 타입 인식 규칙 여덟이 커밋 시점까지 한 번도 안 돈다. 두 설정을 하나로 합치거나 두 자리 모두 CI 설정을 물린다 | 출처 P0-T48 | package.json의 `lint`·`lint-staged` · eslint.config.ci.mjs:14-23 · docs/execution/runs/P0-T48/handoff.md 「인수 조건 31 GREEN」
- [ ] 검증 명령을 파이프에 물리지 않도록 관행 대신 도구로 막는다 — `pnpm verify`를 `tail`에 물려 돌린 탓에 파이프가 종료 코드를 삼켜 실패가 성공으로 보고된 사고가 이 저장소에서 두 번째다. 로그 파일로 받고 종료 코드를 그대로 내는 스크립트 하나를 `package.json`에 두고 TOOLING의 검증 절차가 그것을 부르게 한다 | 출처 P0-T48 | docs/execution/runs/P0-T48/handoff.md 「곁들여 — 종료 코드를 파이프에 물리지 마라」 · package.json의 `verify` · docs/workflow/TOOLING.md:43
- [ ] P0-T48 handoff가 2026-08-18 사용자 결정으로 P0-T57에 더하라고 적은 셋이 P0-T57 계약 어디에도 안 실렸다 — ① 시안 동작 계약의 요약 없는 전문 전사 ② e2e 공통 픽스처의 `pageerror`·수화 경고 단언 ③ worker 마무리 명령을 CI 규칙과 일치. 그 사이 2026-08-19에 봉인된 revision 2는 외부 교차 리뷰 발견만 담았고 phase 00의 「세울 것 넷」도 그대로다. P0-T57 착수 전에 두 자리에 싣는다 | 출처 P0-T48 | docs/execution/runs/P0-T48/handoff.md 「P0-T57에 더할 것」 · docs/execution/radio/P0-T57-radio.md 개정 이력 2 · docs/execution/phases/00-foundation.md P0-T57 절
- [ ] P0-T49~T54 여섯의 `depends_on`에 P0-T57을 넣는다 — phase 00은 「여섯 앞에 두는 것을 권한다」로만 적었고 `index.jsonl`에는 P0-T48 하나만 걸려 있어 순서를 지키는 장치가 사람의 기억뿐이다. 화면 계열이 재봉인이 가장 잦은 쪽이라(P0-T44 2회 · P0-T45 3회 · P0-T48 15회) 봉인 전 조사와 전사 규칙을 못 받은 채 여섯이 도는 위험이 크다 | 출처 P0-T48 | docs/execution/phases/index.jsonl의 P0-T49~T54 행 · docs/execution/phases/00-foundation.md P0-T57 절 기획 승인 줄
- [ ] 재봉인 2회에 닿으면 남은 범위를 쪼갤지 그 자리에서 판단하는 체크포인트를 WORKFLOW 「단계 반환과 중단 규칙」에 넣는다 — P0-T57 기획이 이미 1회 2.0시간 대 2회 이상 13.2시간을 실측해 뒀는데도 P0-T48은 열세 번째 재봉인에서야 범위를 갈랐고, 가른 뒤 두 시간 만에 닫혔다 | 출처 P0-T48 | docs/workflow/WORKFLOW.md 「단계 반환과 중단 규칙」 · docs/execution/phases/00-foundation.md P0-T57 절의 재봉인 실측 · docs/execution/radio/P0-T48-radio.md 개정 이력 14
- [ ] 중단된 e2e가 남기는 `schedules` 잔여를 걷는 자리를 정한다 — 자식 테이블 여섯이 전부 `NO ACTION`이라 골라 지우려면 의존 순서를 손으로 밟아야 하고, 쌓인 행이 무작위 날짜 대역과 부딪혀 다음 실행을 더 자주 죽인다. 후보는 `tests/e2e/global-setup.ts`의 실행 전 잔여 제거와 그 여섯의 cascade 전환 둘이고, 어느 쪽이든 P0-T62 범위에 명시해야 한다 | 출처 P0-T48 | docs/execution/runs/P0-T48/handoff.md 「verify를 다섯 번 돌려 얻은 것」 · tests/e2e/support/worker-session.ts · docs/execution/phases/00-foundation.md P0-T62 절
- [ ] `playwright.config.ts`에 `workers`를 명시한다 — 지금 `workers`도 `retries`도 없어 8코어 로컬에서 기본 4워커로 돌고, load average 20~36에서는 순수 모킹 단위 테스트까지 5초 기본 타임아웃을 넘겨 죽었다. P0-T62의 「로컬 워커 증설 금지」·「재시도로 불안정을 숨기지 않는다」와 어긋나지 않게 상한을 config에 박는 쪽으로 정한다 | 출처 P0-T48 | playwright.config.ts:9-20 · docs/execution/runs/P0-T48/handoff.md 「verify를 다섯 번 돌려 얻은 것」 · docs/execution/phases/00-foundation.md P0-T62 절
- [ ] 아직 `index.jsonl`에 없는 task ID를 봉인 문서에 적지 않는다 — P0-T48이 봉인된 RADIO revision 9에 P0-T59를 적어 뒀는데 다른 세션이 그 번호를 먼저 등록해, 봉인 이력을 못 고치는 채로 handoff 다섯 자리에 정정만 남기고 P0-T63을 거쳐 P0-T64로 두 번 밀렸다. 미등록 후속은 번호 없이 부르고 등록 시점에 ID를 붙이도록 WORKFLOW의 후속 이관 규칙에 한 줄 넣는다. 미등록 ID 위에서 일이 굴러 손해를 본 것이 P0-T47에 이어 두 번째다 | 출처 P0-T48 | docs/execution/runs/P0-T48/handoff.md 「P0-T59 ID 충돌」 · docs/execution/radio/P0-T48-radio.md 개정 이력 9 · docs/execution/retrospective/cases.md P0-T47 줄

<!-- proposals:end -->
