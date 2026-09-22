# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**데이터 task를 잇는 중이다.** 화면 task 열넷이 `expo-scaffold`(실기기 확인 — 사람 손)와 데이터 task에 이중으로 막혀 있는데 데이터 쪽은 안 막혀 있다. 그래서 거기부터 친다. 데이터 task는 화면이 없어 spec 대상이 아니라 `chore/` 브랜치로 간다 — [설계 안내](2-design/README.md#spec)가 「spec에는 기능만 들어온다」고 정했고 ADR-005:39가 `feat/`가 아닌 브랜치를 게이트 밖에 뒀다.

`schedule-data`([PR #386](https://github.com/tkyoun0421/la-bie-belle/pull/386))와 `attendance-data`([PR #387](https://github.com/tkyoun0421/la-bie-belle/pull/387))가 들어갔다. 지금은 `notification-data`(`chore/notification-data`)고 **이것이 선행 없는 마지막 데이터 task다.**

**그 뒤로 사람 손 없이 갈 수 있는 것은 검사 task 넷뿐이다** — `claimed-guards-audit`·`typed-routes-gate`·`plan-sources-gate`·`e2e-runner`(골격 선행). `payroll-data`는 `rehearsal`이 화면(`/me/rehearsals`)을 들어 `expo-scaffold`에 막혀 있다. 화면 task 열넷도 전부 골격 뒤다. **실기기 확인이 유일한 병목이다.**

**실기기 확인이다.** [expo-scaffold](backlog.md)의 AC-01·02·03·04·05·07(재시작)·08·10이 남는다 — 시뮬레이터나 실기기에서만 닫힌다. `pnpm dev`(= `expo start`)를 사람이 별도 터미널에서 띄워 뜨는 QR을 Expo Go로 찍어야 한다. 세션 유지(앱 재시작 후 로그인), 판정이 끝날 때까지 스플래시가 서 있는지, 서체가 바뀌면서 글자가 안 뛰는지가 이 확인의 알맹이다.

**구글 로그인 왕복은 별도로 막혀 있다.** 로컬 Supabase에 구글 프로바이더가 없어 `/auth/v1/authorize`가 400으로 끝난다 — 실 Supabase 프로젝트와 구글 OAuth 클라이언트가 서야 보이고, 그 자리는 [environments.md Q-01·Q-03](5-deploy/environments.md#q-01)이다.

**`sian-native-pass`도 `active`로 남아 있다.** 시안 열여섯이 ADR-012(브랜드 파랑, 헐거운 밀도) 기준으로 갱신돼 아티팩트로 올라갔고 사람의 승인을 기다린다.

**`e2e-runner`는 `ready`고 `expo-scaffold`가 선행이다.** 지금 `tdd-guard-e2e.py`는 `tests/e2e/`를 못 찾아 아무것도 안 막는 상태다 — 이 task가 도구(Maestro나 Detox)를 골라 첫 스펙을 세워야 게이트가 다시 문다.

**`plans-restate`는 `blocked`고 `expo-scaffold`가 선행이다.** 남은 plan 열둘이 골격 위에서 파일 배치와 검증 명령을 채우길 기다린다.

**새로 `ready`에 오른 것 셋 — `font-subset`·`typed-routes-gate`·`plan-sources-gate`.** 서체 서브셋으로 9.4MB를 줄이는 것, `typedRoutes`가 CI에서 안 켜져 없는 경로도 `typecheck`를 통과하는 것, plan의 `sources` 영향 검사가 `status: approved`만 보다가 실질적으로 죽어 있는 것 — 셋 다 [backlog.md](backlog.md)가 완료 조건을 든다.

## 재개 맥락

**퇴사자가 승인된 사람과 똑같이 읽히고 있었다.** `is_approved()`가 `approved_at is not null and blocked_at is null`만 봤다 — [읽기 RLS 기본값](2-design/system/data-access.md#읽기-rls-기본값)은 「둘 다 `left_at`·`blocked_at`이 비어 있어야 참이다」로 정했는데 `left_at`이 빠져 있었다. 근무표 RLS 테스트가 퇴사자를 처음 세워 보면서 드러났고 `20260825162027_profiles.sql`을 직접 고쳤다(배포 전이라 마이그레이션을 고치는 것이 되돌리기다). `is_admin()`은 아직 `role`만 본다 — 같은 계약을 어기고 있고 `members-pending`이 받아뒀다.

회차 기록은 `docs/log/2026-09-22.md`다. 그 앞 [2026-09-21](log/2026-09-21.md)이 Expo 골격 뼈대와 토큰 파이프라인, 러너 이사를 세웠고 서체·세션·딥링크·진입 판정을 남겼는데, 이번 회차(#382·#383·#384)가 그 남은 넷을 채웠다.

**번들링이 죽어 있었는데 검사 넷이 다 초록이었다.** `react-native-svg@15.13.0`이 Node 내장 `buffer`를 import해서 Metro가 번들을 못 묶었다. `pnpm lint`·`typecheck`·`test`·`format:check` 어느 것도 Metro를 안 돌려서 아무도 몰랐다. Expo SDK 57이 고정한 15.15.4로 올리면 해결된다 — 상위가 15.15.3에서 `Buffer`를 `atob()`로 바꿨다. `pnpm bundle`이 이제 그 자리를 막는다([execution.md](4-test/execution.md#pnpm-bundle)).

**서체 유틸 400은 `font-normal`이 아니라 `font-sans`다.** Tailwind 4에서 `--font-*`가 패밀리 네임스페이스라 `font-medium`·`semibold`·`bold`는 `fontFamily`를 내지만 `font-normal`은 `fontWeight: 400`만 걸어 패밀리를 안 바꾼다 — 그것만 쓰면 시스템 서체가 나온다. `tokens.md`·`typography.md` 여섯 자리를 컴파일 실측으로 고쳤다.

**코드 교환이 목적지를 정하고 있었다.** `handle-auth-callback.ts`가 성공 시 `"/"`를 하드코딩해서 새로 들어온 사람도 `/pending` 대신 홈으로 갔다. 성공 여부만 알리게 좁혔고 목적지는 `decide-entry.ts`가 정한다. `read-supabase-env.ts`가 아직 `NEXT_PUBLIC_*`를 읽던 것도 같이 잡았다 — Expo는 `EXPO_PUBLIC_*`만 번들에 인라인한다.

**세션은 SecureStore 열쇠 + AsyncStorage 암호문으로 갈랐다.** 세션 JSON이 2048바이트를 넘어 안드로이드 키체인이 못 받는다 — 근거는 [runtime.md 「세션」](2-design/system/runtime.md). 딥링크는 PKCE라 코드를 싣고 돌아오고, GoTrue의 redirect glob는 `*`가 `.`을 못 넘어서 Expo Go 주소는 `**`로 등록해야 한다.

**판정 실패는 `/retry`다.** 자동 리뷰가 그 폴백이 `_layout.tsx`(화면 파일)에 앉아 있던 것을 잡아 `decide-entry.ts`로 옮겼다 — 정본은 [navigation.md 「앱을 열면」](2-design/system/navigation.md#앱을-열면)이고 게이트 경로가 넷에서 다섯이 됐다.

**`react-native`는 Jest에서 대역이 안 먹는다.** `moduleNameMapper`가 절대경로로 리매핑해서 `src/` 안쪽 import는 늘 실물을 문다 — `AppState`·`Linking`은 함수 인자로 주입한다. [execution.md 「돌릴 때」](4-test/execution.md#돌릴-때)에 적었다.

**서체는 원본 넷이 9.4MB 그대로 들어간다.** `tokens.md`가 서브셋을 거친다고 적어둔 자리를 아직 안 채웠다 — `font-subset` task로 잡았다.

**plan의 `sources` 영향 검사가 실질적으로 죽어 있다.** `findImpacted`가 `status: approved`인 문서만 보는데(`tests/lint/sources-impact.ts:40`) plan 서른넷 전부 frontmatter에 `status`가 없다 — `plan-sources-gate` task로 잡았다.

**총괄이 정할 것 둘이 여전히 열려 있다.** [navigation Q-03](2-design/system/navigation.md#q-03) — 종이 QR을 앱 없는 기기로 찍으면 무엇이 뜨나. [runtime Q-01](2-design/system/runtime.md#q-01) — 오래 안 열었다 여는 앱이 무엇을 다시 읽나.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
