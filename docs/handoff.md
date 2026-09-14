# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

[`docs-authoring-playbook`](backlog.md) — **문서 재편 묶음을 이어 나른다** — [sdlc-coherence plan](3-build/plans/docs-sdlc-coherence.md)의 묶음 C가 끝나면 [authoring-playbook plan](3-build/plans/docs-authoring-playbook.md)의 묶음 A~H 중 merge 안 된 다음 것. 재편이 끝나기 전에는 설계 정본 경로가 PR마다 바뀌니 계정 데이터 plan(`3-build/plans/account-data.md`)은 그 뒤에 쓴다. 그 뒤 순서는 `backlog.md`의 `ready`가 든다.

## 재개 맥락

회차 기록은 `docs/log/2026-09-14-3.md`(이번 회차)와 `docs/log/2026-09-14-2.md`(직전 회차)에 있다.

**주요 설계 문서가 다 섰다.** 1차 화면의 페이지 문서 12개와 짝 시안이 `docs/2-design/modules/<영역>/screens/`와 `docs/2-design/system/screens/`에 있고, 영역을 가로지르는 공통 설계는 `docs/2-design/system/` 넷 — architecture·data-access·runtime·navigation — 이 든다(#315~#318에서 채운 내용을 옮겨 세웠다). 남은 미정은 각 정본의 「아직 안 정한 것」에 있고, 그 미정이 막는 task는 `backlog.md`의 `blocked` 행이 링크한다 — 착수 전 인터뷰로 닫는다. 되돌리기 어려운 결정 넷이 거기서 났다 — 프로필 신원 분리(`profiles.id` 별도, `user_id → auth.users`), 개인정보 표 분리(`profile_private`), 승인 게이트가 서버에서 클라이언트로, 출근 판정이 누른 시각(`reported_at`). 기존 `profiles` 마이그레이션·`readAuthGate`·`middleware.ts`는 이 결정과 어긋나 데이터 task가 갈아엎는다.

**Edge Function 스파이크가 닫혔다.** Deno는 `supabase/functions` 밖을 못 읽는다 — edge-runtime 컨테이너에 그 폴더만 마운트되니 `deno.json` 맵핑도 심볼릭 링크도 안 통한다. CI가 `_shared/`로 복사하는 쪽으로 [notification/design.md](2-design/modules/notification/design.md#푸시-보내기)가 결론을 담았고, 복사 단계는 알림 task가 `ci.yml`에 붙인다.

코드는 세션 기반과 로그인·승인 대기 화면까지다. 대시보드는 데이터가 없어 못 연다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
