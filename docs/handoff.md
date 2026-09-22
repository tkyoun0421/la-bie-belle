# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**데이터 task를 잇는 중이다.** 화면 task 열넷이 `expo-scaffold`(실기기 확인 — 사람 손)와 데이터 task에 이중으로 막혀 있는데 데이터 쪽은 안 막혀 있다. 그래서 거기부터 친다. 데이터 task는 화면이 없어 spec 대상이 아니라 `chore/` 브랜치로 간다 — [설계 안내](2-design/README.md#spec)가 「spec에는 기능만 들어온다」고 정했고 ADR-005:39가 `feat/`가 아닌 브랜치를 게이트 밖에 뒀다.

**데이터 task 셋이 전부 들어갔다** — `schedule-data`([PR #386](https://github.com/tkyoun0421/la-bie-belle/pull/386)), `attendance-data`([PR #387](https://github.com/tkyoun0421/la-bie-belle/pull/387)), `notification-data`([PR #388](https://github.com/tkyoun0421/la-bie-belle/pull/388)). 선행 없는 데이터 task가 더 없다.

**`plan-sources-gate`가 닫혔다.** `findImpacted`가 이제 `doc.tracked`를 보고, 그 판정은 `spec-docs.ts`가 자리마다 따로 계산한다 — spec은 `status: approved`, plan은 완료 머리글이 없으면 추적 대상이다. plan에 `status`를 새로 들이지 않은 것이 이 task의 알맹이다. 서른넷을 손으로 관리하면 「적어뒀는데 안 맞는」 자리가 또 생긴다. `docs/2-design/system/data-access.md`를 바꾼 목록으로 찍어보면 고치기 전 0건, 고친 뒤 살아 있는 plan 열둘이 나온다.

**`claimed-guards-audit`가 닫혔다**([PR #390](https://github.com/tkyoun0421/la-bie-belle/pull/390)). 정본이 「기계가 지킨다」고 적은 주장 서른다섯을 훑어 구멍 셋을 메웠다 — RLS를 안 켠 표를 잡는 `tests/lint/table-rls.ts`(정본이 파일 이름까지 적어뒀는데 없었다), `profile_private.phone`의 형식 제약과 `submit_profile`이 먼저 던지는 `invalid_phone`, `notifications`의 `(profile_id, kind, subject_id)` 부분 unique다. **알맹이는 서른다섯 중 서른이 지키는 물건의 이름을 안 적는다는 것이다** — 「검사가 잡는다」까지만 적히면 맞는지 틀리는지 확인할 길이 없고, 지금까지의 사고 셋이 전부 그 서른 쪽에서 났다. 새 주장을 적을 때 파일 이름을 같이 적는 것이 이 감사가 남긴 습관이다. 지금 못 메우는 다섯은 PR 본문에 사실로만 남겼다 — `runtime.md`의 `stale`은 `schedule-requests`가, [생성 타입](2-design/system/data-access.md#생성-타입)이 한 절 안에서 자기를 부정하는 것은 `types-generation`이 받아뒀고, `security_definer_view` 예외는 우리 CI가 Supabase linter를 안 돌려 대상이 없으며, `attendance`·`schedule`·`payroll`·`swap`의 `design.md`에는 「코드와의 차이」 절 자체가 없다.

**spec 스물하나가 다 섰고 전부 `approved`다.** 화면이 있는 task 전부다 — 남은 미작성은 cron·Edge Function·배포 문서처럼 화면이 없는 것들이다. 양식에 「상태 격자」 여덟 줄과 AC마다의 「검증 층」이 들어갔고([2-design/README.md](2-design/README.md#spec)) `tests/lint/spec-grid.ts`가 그것이 찼는지 본다. **검사가 `status`로 안 가른다** — `### AC-NN`으로 조건을 나눈 spec이면 승인 뒤에도 격자를 다시 잰다. 승인을 면제 조건으로 두면 스물을 승인한 순간 검사 대상이 하나도 안 남는다. AC를 안 나눈 옛 명세 `login-screens.md`만 밖이다.

**같이 고친 것이 자리다.** 살아 있는 기능 plan 열둘이 완료 조건 104개를 품고 있었다 — [3-build/README.md](3-build/README.md)가 「완료 조건은 spec과 `2-design/`이 정본이라 여기 다시 적지 않는다」고 이미 적었는데 지키는지 볼 수 있는 문장이 아니었다. 그 판정을 절 이름으로 풀었다 — **기능 plan에 `## 완료 조건` 절이 있으면 그 기능의 spec이 없다는 뜻**이고, 열둘은 `## 구현 산출물`이 됐다. AC 번호는 그대로라 `attendance-excuse`가 무는 `schedule-worker.md#ac-09`가 살아 있다.

**spec 게이트가 열렸다.** 스물이 `approved`로 올라가 `spec-gate.py`가 `feat/<슬러그>` 브랜치의 `src/` 쓰기를 통과시킨다. 승인 근거 절마다 기준점 커밋과 승인 범위, 그 spec이 스스로 든 제한이 적혀 있다 — 「범위 밖」에 든 것은 승인 밖이고 거기 든 task가 제 spec으로 따로 받는다. 승인 판정 자체는 총괄이 이 세션에 위임했다.

**다음 첫 수는 `typed-routes-gate`다.** `app.json`이 `typedRoutes: true`인데 `.expo/types/`가 CI에 없어서 `Href`가 그냥 `string`으로 떨어진다 — 없는 경로를 적어도 `pnpm typecheck`가 통과한다. 위 감사가 말한 「이름 없는 주장」과 같은 종류다. 그 뒤가 `font-subset`이다.

**`payroll-data`는 `rehearsal`이 화면(`/me/rehearsals`)을 들어 `expo-scaffold`에 막혀 있다.** 화면 task 열넷도 전부 골격 뒤다. **실기기 확인이 유일한 병목이다.**

**실기기 확인이다.** [expo-scaffold](backlog.md)의 AC-01·02·03·04·05·07(재시작)·08·10이 남는다 — 시뮬레이터나 실기기에서만 닫힌다. `pnpm dev`(= `expo start`)를 사람이 별도 터미널에서 띄워 뜨는 QR을 Expo Go로 찍어야 한다. 세션 유지(앱 재시작 후 로그인), 판정이 끝날 때까지 스플래시가 서 있는지, 서체가 바뀌면서 글자가 안 뛰는지가 이 확인의 알맹이다.

**구글 로그인 왕복은 별도로 막혀 있다.** 로컬 Supabase에 구글 프로바이더가 없어 `/auth/v1/authorize`가 400으로 끝난다 — 실 Supabase 프로젝트와 구글 OAuth 클라이언트가 서야 보이고, 그 자리는 [environments.md Q-01·Q-03](5-deploy/environments.md#q-01)이다.

**`sian-native-pass`도 `active`로 남아 있다.** 시안 열여섯이 ADR-012(브랜드 파랑, 헐거운 밀도) 기준으로 갱신돼 아티팩트로 올라갔고 사람의 승인을 기다린다.

**`e2e-runner`는 `ready`고 `expo-scaffold`가 선행이다.** 지금 `tdd-guard-e2e.py`는 `tests/e2e/`를 못 찾아 아무것도 안 막는 상태다 — 이 task가 도구(Maestro나 Detox)를 골라 첫 스펙을 세워야 게이트가 다시 문다.

**`plans-restate`는 `blocked`고 `expo-scaffold`가 선행이다.** 남은 plan 열둘이 골격 위에서 파일 배치와 검증 명령을 채우길 기다린다.

**`ready`에 남은 것 둘 — `font-subset`·`typed-routes-gate`.** 서체 서브셋으로 9.4MB를 줄이는 것, `typedRoutes`가 CI에서 안 켜져 없는 경로도 `typecheck`를 통과하는 것이다. 같이 올라왔던 `plan-sources-gate`는 닫혔다. 완료 조건은 [backlog.md](backlog.md)가 든다.

## 재개 맥락

**승인 전에 불려야 하는 함수가 있다.** 알림 함수 넷이 `is_approved()`를 안 쓴다 — [NTF-016](2-design/modules/notification/README.md#ntf-016)이 알림 켜기를 승인 대기 화면에 뒀고 [NTF-006](2-design/modules/notification/README.md#ntf-006)의 가입 승인이 승인 전에 가야 하는 유일한 알림이라, 승인을 요구하면 그 알림이 배달 경로를 잃는다. 대신 `auth.uid()`로 프로필이 잡히고 `blocked_at`·`left_at`이 둘 다 널인지를 본다. [data-access.md 「함수 안의 규칙」](2-design/system/data-access.md#함수-안의-규칙)에 조항으로 섰고 `submit_profile`이 전례다.

**기기 주소는 사람이 아니라 기기를 가리킨다.** 한 기기를 A가 쓰다 로그아웃하고 B가 로그인하면 Expo가 같은 문자열을 준다 — `save_push_token`의 upsert가 `token` 충돌에서 `profile_id`를 부르는 사람으로 옮기지 않으면 A의 알림이 B의 폰에 뜬다.

**퇴사자가 승인된 사람과 똑같이 읽히고 있었다.** `is_approved()`가 `approved_at is not null and blocked_at is null`만 봤다 — [읽기 RLS 기본값](2-design/system/data-access.md#읽기-rls-기본값)은 「둘 다 `left_at`·`blocked_at`이 비어 있어야 참이다」로 정했는데 `left_at`이 빠져 있었다. 근무표 RLS 테스트가 퇴사자를 처음 세워 보면서 드러났고 `20260825162027_profiles.sql`을 직접 고쳤다(배포 전이라 마이그레이션을 고치는 것이 되돌리기다). `is_admin()`은 아직 `role`만 본다 — 같은 계약을 어기고 있고 `members-pending`이 받아뒀다.

회차 기록은 `docs/log/2026-09-22.md`다. 그 앞 [2026-09-21](log/2026-09-21.md)이 Expo 골격 뼈대와 토큰 파이프라인, 러너 이사를 세웠고 서체·세션·딥링크·진입 판정을 남겼는데, 이번 회차(#382·#383·#384)가 그 남은 넷을 채웠다.

**번들링이 죽어 있었는데 검사 넷이 다 초록이었다.** `react-native-svg@15.13.0`이 Node 내장 `buffer`를 import해서 Metro가 번들을 못 묶었다. `pnpm lint`·`typecheck`·`test`·`format:check` 어느 것도 Metro를 안 돌려서 아무도 몰랐다. Expo SDK 57이 고정한 15.15.4로 올리면 해결된다 — 상위가 15.15.3에서 `Buffer`를 `atob()`로 바꿨다. `pnpm bundle`이 이제 그 자리를 막는다([execution.md](4-test/execution.md#pnpm-bundle)).

**서체 유틸 400은 `font-normal`이 아니라 `font-sans`다.** Tailwind 4에서 `--font-*`가 패밀리 네임스페이스라 `font-medium`·`semibold`·`bold`는 `fontFamily`를 내지만 `font-normal`은 `fontWeight: 400`만 걸어 패밀리를 안 바꾼다 — 그것만 쓰면 시스템 서체가 나온다. `tokens.md`·`typography.md` 여섯 자리를 컴파일 실측으로 고쳤다.

**코드 교환이 목적지를 정하고 있었다.** `handle-auth-callback.ts`가 성공 시 `"/"`를 하드코딩해서 새로 들어온 사람도 `/pending` 대신 홈으로 갔다. 성공 여부만 알리게 좁혔고 목적지는 `decide-entry.ts`가 정한다. `read-supabase-env.ts`가 아직 `NEXT_PUBLIC_*`를 읽던 것도 같이 잡았다 — Expo는 `EXPO_PUBLIC_*`만 번들에 인라인한다.

**세션은 SecureStore 열쇠 + AsyncStorage 암호문으로 갈랐다.** 세션 JSON이 2048바이트를 넘어 안드로이드 키체인이 못 받는다 — 근거는 [runtime.md 「세션」](2-design/system/runtime.md). 딥링크는 PKCE라 코드를 싣고 돌아오고, GoTrue의 redirect glob는 `*`가 `.`을 못 넘어서 Expo Go 주소는 `**`로 등록해야 한다.

**판정 실패는 `/retry`다.** 자동 리뷰가 그 폴백이 `_layout.tsx`(화면 파일)에 앉아 있던 것을 잡아 `decide-entry.ts`로 옮겼다 — 정본은 [navigation.md 「앱을 열면」](2-design/system/navigation.md#앱을-열면)이고 게이트 경로가 넷에서 다섯이 됐다.

**`react-native`는 Jest에서 대역이 안 먹는다.** `moduleNameMapper`가 절대경로로 리매핑해서 `src/` 안쪽 import는 늘 실물을 문다 — `AppState`·`Linking`은 함수 인자로 주입한다. [execution.md 「돌릴 때」](4-test/execution.md#돌릴-때)에 적었다.

**서체는 원본 넷이 9.4MB 그대로 들어간다.** `tokens.md`가 서브셋을 거친다고 적어둔 자리를 아직 안 채웠다 — `font-subset` task로 잡았다.

**죽어 있던 plan의 `sources` 영향 검사를 살렸다.** 필터가 `status: approved`만 보는데 plan 서른넷에 `status`가 없어 검사가 아무것도 안 봤다. PR #387·#388의 ADR-009 영향 검토를 두 번 다 사람이 손으로 한 것이 그 결과다. 이제 `spec-docs.ts`가 `tracked`를 계산해서 준다 — 완료 머리글을 단 plan 아홉만 빠지고 나머지 스물다섯이 검사에 걸린다.

**총괄이 정할 것 둘이 여전히 열려 있다.** [navigation Q-03](2-design/system/navigation.md#q-03) — 종이 QR을 앱 없는 기기로 찍으면 무엇이 뜨나. [runtime Q-01](2-design/system/runtime.md#q-01) — 오래 안 열었다 여는 앱이 무엇을 다시 읽나.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
