# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**구현은 전 영역의 설계가 끝난 뒤 한꺼번에 한다.** task 하나의 plan이 섰다고 그 task를 구현하지 않는다. 영역마다 ① 정본의 「아직 안 정한 것」을 인터뷰로 닫고(한 라운드 한 질문) ② 정본에 반영하고 ③ 시안을 갱신해 아티팩트로 사용자가 보고 승인하고 ④ plan을 쓴다. 순서는 account → schedule → attendance → payroll → notification → system이고 swap은 2차라 뒤다. 실패 테스트 작성부터가 구현 단계라 plan 뒤에 writer를 띄우지 않는다.

지금 account 안이다. 프로필 작성이 멀티스텝(고정된 칸 하나, 답한 것은 라벨 없는 글이 되어 위 더미로 날아가 쌓임, 확인 시트 없음)으로 바뀌었고 `/blocked` 화면이 그려졌다 — [login.md](2-design/modules/account/screens/login.md#프로필-작성-짜임). 시안 `login.sian.html`이 그것을 따라가는 중이고, 아티팩트 승인이 나면 `docs/account-design-close` 브랜치로 PR을 연다. 그 뒤 남은 account 미정 — login.md 「아직 안 정한 것」(게이트 읽기 실패 모습, 넷째 도는 문구, 탭 제목, 구글 서체), README Q-01·Q-03, members-pending.md 넷 — 을 닫고 members·members-pending·profile 화면의 plan을 쓴다. `3-build/plans/profile-form.md`는 따라 고쳤다. `feat/profile-form` 브랜치의 실패 테스트도 시트 기준이라 구현 단계에서 다시 쓴다.

같은 줄의 다른 후보 — [`types-generation`](backlog.md)은 plan이 없고 작다.

## 재개 맥락

회차 기록은 `docs/log/2026-09-15.md`(이번 회차)와 `docs/log/2026-09-14-3.md`(직전 회차)에 있다.

**주요 설계 문서가 다 서고 작성법 틀로 다시 썼다.** 작성법은 단계 README(`docs/<단계>/README.md`)가 소유하고(ADR-010), 규칙은 `### ACC-001` 같은 고정 ID로 부른다. 1차 화면의 페이지 문서 14개와 짝 시안이 `docs/2-design/modules/<영역>/screens/`와 `docs/2-design/system/screens/`에 있고, 영역을 가로지르는 공통 설계는 `docs/2-design/system/` 넷 — architecture·data-access·runtime·navigation — 이 든다(#315~#318에서 채운 내용을 옮겨 세웠다). 남은 미정은 각 정본의 「아직 안 정한 것」에 있고, 그 미정이 막는 task는 `backlog.md`의 `blocked` 행이 링크한다 — 착수 전 인터뷰로 닫는다. 되돌리기 어려운 결정 넷이 거기서 났다 — 프로필 신원 분리(`profiles.id` 별도, `user_id → auth.users`), 개인정보 표 분리(`profile_private`), 승인 게이트가 서버에서 클라이언트로, 출근 판정이 누른 시각(`reported_at`). 기존 `profiles` 마이그레이션·`readAuthGate`·`middleware.ts`는 이 결정과 어긋나 데이터 task가 갈아엎는다.

**Edge Function 스파이크가 닫혔다.** Deno는 `supabase/functions` 밖을 못 읽는다 — edge-runtime 컨테이너에 그 폴더만 마운트되니 `deno.json` 맵핑도 심볼릭 링크도 안 통한다. CI가 `_shared/`로 복사하는 쪽으로 [notification/design.md](2-design/modules/notification/design.md#푸시-보내기)가 결론을 담았고, 복사 단계는 알림 task가 `ci.yml`에 붙인다.

코드는 세션 기반과 로그인·승인 대기 화면까지다. 대시보드는 데이터가 없어 못 연다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
