# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 첫 수」를 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

넷만 담는다 — 지금 상태, 다음 첫 수, 그 수를 막는 결정, 이번 회차에만 필요한 주의. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/README.md`와 `docs/5-deploy/README.md`다.

## 지금 상태

회차 기록은 `docs/log/2026-09-14.md`(이번 회차)와 `docs/log/2026-09-13.md`(직전 회차)에 있다.

**설계가 다 섰다.** 1차 화면 열한 개가 문서와 시안으로 서 있고(`docs/2-design/design-system/pages/`), `architecture/` 넷 — data-model·api·runtime·flows — 이 #315~#318로 채워졌다. 되돌리기 어려운 결정 넷이 거기서 났다 — 프로필 신원 분리(`profiles.id` 별도, `user_id → auth.users`), 개인정보 표 분리(`profile_private`), 승인 게이트가 서버에서 클라이언트로, 출근 판정이 누른 시각(`reported_at`). 기존 `profiles` 마이그레이션·`readAuthGate`·`middleware.ts`는 이 결정과 어긋나 데이터 task가 갈아엎는다.

**문서 구조 task가 거의 끝났다.** `docs/3-build/plans/docs-structure.md` 여덟 항목 중 spec 폴더 정리(#321), 목차와 차단·뒤로 정합(#322), 루트 README·디자인 지도·CHANGELOG(#323), 그리고 backlog·handoff 재편과 architecture 상태 표기가 이 회차에 들어갔다.

코드는 세션 기반과 로그인·승인 대기 화면까지다. 대시보드는 데이터가 없어 못 연다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).

## 다음 첫 수

**데이터 task다.** `backlog.md` 「다음」 순서대로 — Edge Function import 스파이크 → 계정 데이터 구조 전환 → 인증 진입 전환 → 타입 생성 절차. 계정 데이터 구조는 비기능이라 spec 없이 `3-build/plans/account-data.md`부터 쓴다.

## 막는 결정

- **달 키의 범위.** 근무표 달이 달력 달인지 주 범위(8월 = 8/3~9/6)인지 — [data-model](2-design/architecture/data-model/README.md#아직-안-정한-것)이 열어뒀고 [runtime](2-design/architecture/runtime/README.md#아직-안-정한-것)의 캐시 키와 [flows](2-design/architecture/flows/README.md#아직-안-정한-것)의 `?month=`가 딸린다. 근무표 task 전에 닫는다.
- **교대 승인 화면.** `schedule-admin.md`가 비웠고 교대 수락 알림의 목적지가 [flows](2-design/architecture/flows/README.md#아직-안-정한-것)에 비어 있다. 알림 task 전에 닫는다.

## 주의

- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있다.
- `session-recorder`가 이 파일을 덮어쓸 때 위 넷 밖의 절을 만들지 않는다. 닫힌 항목은 지우고, 새 열린 결정은 정본으로 보낸다.
