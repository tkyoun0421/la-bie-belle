# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 첫 수」를 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

넷만 담는다 — 지금 상태, 다음 첫 수, 그 수를 막는 결정, 이번 회차에만 필요한 주의. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/README.md`와 `docs/5-deploy/README.md`다.

## 지금 상태

회차 기록은 `docs/log/2026-09-14-2.md`(이번 회차)와 `docs/log/2026-09-14.md`(직전 회차)에 있다.

**설계가 다 섰다.** 1차 화면 열한 개가 문서와 시안으로 서 있고(`docs/2-design/design-system/pages/`), `architecture/` 넷 — data-model·api·runtime·flows — 이 #315~#318로 채워졌다. 되돌리기 어려운 결정 넷이 거기서 났다 — 프로필 신원 분리(`profiles.id` 별도, `user_id → auth.users`), 개인정보 표 분리(`profile_private`), 승인 게이트가 서버에서 클라이언트로, 출근 판정이 누른 시각(`reported_at`). 기존 `profiles` 마이그레이션·`readAuthGate`·`middleware.ts`는 이 결정과 어긋나 데이터 task가 갈아엎는다.

**문서 구조 task가 끝났다.** `docs/3-build/plans/docs-structure.md` 여덟 항목이 #321~#324로 다 들어갔다 — spec 폴더를 기능만으로 좁히고 비기능은 `plans/`로, 목차 허용과 차단·뒤로 정합, 루트 README·디자인 지도·CHANGELOG, backlog·handoff 재편과 architecture 현재 상태 표기.

코드는 세션 기반과 로그인·승인 대기 화면까지다. 대시보드는 데이터가 없어 못 연다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).

## 다음 첫 수

**Edge Function import 스파이크다** — [plan](3-build/plans/edge-function-import.md). 그 뒤 순서는 `backlog.md` 「다음」이 든다.

## 막는 결정

(없음 — 스파이크는 열린 결정에 안 걸린다. 뒤 task를 막는 미정은 `backlog.md` 「대기」의 각 행이 정본 링크로 든다.)

## 주의

- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있다.
- `session-recorder`가 이 파일을 덮어쓸 때 위 넷 밖의 절을 만들지 않는다. 닫힌 항목은 지우고, 새 열린 결정은 정본으로 보낸다.
