---
status: open
target: docs/4-test/execution.md
date: 2026-10-09
---

# 병렬 worktree가 로컬 DB 하나를 공유해 integration을 못 믿는다

읽기 묶음 넷을 worktree로 띄운 뒤 `pnpm test:integration:run`을 두 자리에서 돌렸는데 실패 수가 달랐다 — worker는 6 suite, 총괄은 9 suite(58 tests)다. 같은 코드에서 수가 다르면 코드가 아니라 환경이다.

까닭이 둘이다.

**로컬 Supabase가 반만 떴다.** `supabase status`가 `edge_runtime`·`pooler`·`analytics`·`vector`·`imgproxy` 다섯을 Stopped로 보고한다. push와 사진을 보는 테스트가 거기 매달린다 — `pushSwitch/savePushToken`·`pushSwitch/setNotificationsEnabled`·`profileEdit/updateMyPhoto`가 그 묶음이다. `analytics`는 8GB 기계에서 Logflare가 VM을 무너뜨려 꺼둔 것이다.

**worktree가 `supabase/` 설정을 공유한다.** 네 worktree가 같은 프로젝트 ID로 같은 컨테이너에 붙어서, 한쪽의 픽스처 정리가 다른 쪽이 읽을 행을 씻어낸다. `memberAdmin/setRole`은 혼자 다시 돌리니 통과했다.

**하나는 경합이 아닐 수 있다.** `getWageRates.api.integration.test.ts`가 혼자서도 반복 실패한다 — 시급 이력 셋을 기대하는데 미래 날짜 하나만 온다. 병렬을 멈춘 뒤 단독으로 다시 확인할 자리다.

지금 상태로는 **integration 결과가 PR의 완료 근거로 못 쓰인다.** 자동 리뷰가 「총괄 쪽 재실행이 없다」고 두 번 집었는데, 돌려도 그 수를 믿을 수 없다는 것이 답이다.

[관찰 024](archive/)가 픽스처를 여러 psql 호출로 심는 자리의 cron 경합을 들고 `test-seed-transaction`이 받는다. 이쪽은 축이 다르다 — 한 실행 안의 경합이 아니라 **실행 둘 사이**다.

## 고칠 길 셋

**worktree마다 다른 Supabase 포트를 띄운다.** 가장 깨끗하지만 8GB 기계에 컨테이너 묶음이 둘 이상 서야 한다 — `analytics`를 끈 까닭이 그 메모리다.

**integration은 총괄만 돌린다.** worker 정의문에 「`pnpm test:integration`을 돌리지 말고 총괄에게 넘겨라」를 넣는다. 싸지만 worker가 `api/`를 고쳤을 때 늦게 안다.

**`execution.md`가 병렬일 때의 판정을 적는다.** 실패 목록이 `api/`를 건드린 diff와 겹치지 않으면 환경으로 판정하고 그 근거(멈춘 서비스 목록·다른 실행의 존재)를 PR에 적는다.
