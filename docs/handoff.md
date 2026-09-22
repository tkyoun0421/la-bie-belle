# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `e2e-runner`지만 `expo-scaffold`가 선행이다.** 기계만으로 닫을 수 있는 task가 지금 없다 — `ready`에 남은 것이 `e2e-runner`(선행 `expo-scaffold`)와 `edge-function-import`·`types-generation`이다. **`edge-function-import`가 유일하게 선행 없는 `ready`다** — Deno Edge Function이 `supabase/functions` 밖의 `src/`를 import할 수 있는지 보는 스파이크고 [plan](3-build/plans/edge-function-import.md)이 완료 조건을 든다. 그것이 서면 `profile-erasure`와 `notification-push`가 풀린다.

**`font-subset`이 닫혔다.** Wanted Sans 넷 합계가 **9,256KB에서 1,753KB로 줄었다** — 7.3MB가 설치 크기에서 빠졌고 `pnpm bundle`의 자산 목록으로 서브셋만 들어간 것을 확인했다. 원본은 `assets/fonts/`에 남고 앱은 `assets/fonts/subset/`을 읽는다.

남긴 글자는 2,527자고 **집합의 정본이 `tests/lint/font-subset.ts`다** — 상용 2,350자를 표로 안 적고 EUC-KR 완성형 영역(lead `0xB0`–`0xC8`, trail `0xA1`–`0xFE`)을 디코더로 풀어 낸다. 만들어진 `.ttf`의 `cmap`을 읽어 그 집합이 다 들었는지 `pnpm test`가 본다 — 글자가 빠지면 그 자리만 시스템 서체로 떨어지고 앱이 안 죽어서 다른 검사가 못 잡는 자리다.

**상용 2,350자가 기준인 근거가 실측으로 확인됐다.** 음절 11,172자를 다 넣으면 Regular 한 장이 9%만 줄고(2,345KB → 2,129KB), 상용만 남기면 81% 줄었다(→ 443KB). 대신 **이름이 상용 밖 음절을 쓰는 사람은 그 글자만 기기 기본 서체로 떨어진다** — 실제로 생기면 그 음절을 집합에 더해 다시 만든다.

**시안이 쓰는 닫기 기호가 원본 서체에 없다.** 「✕」(U+2715)가 Wanted Sans에 없어서 서브셋에 담을 수 없고 지금도 시스템 서체로 떨어진다 — `cmap` 실측에서 드러났다. 「×」(U+00D7)나 「✗」(U+2717)로 바꾸는 것을 `sian-sync`가 받아뒀다.

**`typed-routes-gate`가 닫혔다.** `.expo/types/`가 `.gitignore` 안이라 CI에 라우트 타입이 없었고, 없으면 `Href`가 `string`으로 떨어져 `router.replace("/없는경로")`가 `pnpm typecheck`를 통과했다. 만드는 명령은 `expo customize tsconfig.json`이다 — Expo CLI의 `setupTypedRoutes`가 Metro나 개발 서버 없이 도는 진입점이 그것 하나고 `expo export`(= `pnpm bundle`)로는 안 생긴다. `pnpm routes:types`가 그것을 부른 뒤 **생성물을 다시 읽어 판정한다** — 생성이 조용히 실패한 상태와 정상 상태가 종료 코드로는 구별되지 않아서다. 판정 규칙 넷은 `tests/lint/route-types.ts`에 있고 [execution.md](4-test/execution.md#pnpm-routestypes)가 근거를 든다. 이것이 `claimed-guards-audit`이 남긴 습관의 첫 적용이다 — 「검사가 잡는다」를 적을 때 잡는 파일 이름을 같이 적었다.

**spec 게이트는 열렸지만 그것으로 화면 task가 풀리지 않는다.** 화면이 있는 task 스물하나 전부에 spec이 서고 `approved`다 — 남은 미작성은 cron·Edge Function·배포 문서처럼 화면이 없는 것뿐이다. `spec-gate.py`가 이제 `feat/<슬러그>` 브랜치의 `src/` 쓰기를 통과시킨다. 그래도 화면 task 열넷은 여전히 `expo-scaffold`(실기기 확인 — 사람 손)에 막혀 있다. spec은 게이트 조건 중 하나였을 뿐이고, 그 조건이 풀렸다고 남은 조건까지 풀리지는 않는다.

**실기기 확인이 유일한 병목이다.** [expo-scaffold](backlog.md)의 AC-01·02·03·04·05·07(재시작)·08·10이 남는다 — 시뮬레이터나 실기기에서만 닫힌다. `pnpm dev`(= `expo start`)를 사람이 별도 터미널에서 띄워 뜨는 QR을 Expo Go로 찍어야 한다. 세션 유지(앱 재시작 후 로그인), 판정이 끝날 때까지 스플래시가 서 있는지, 서체가 바뀌면서 글자가 안 뛰는지가 이 확인의 알맹이다. `payroll-data`는 `rehearsal`이 화면(`/me/rehearsals`)을 들어 이 병목에 묶인다.

**구글 로그인 왕복은 별도로 막혀 있다.** 로컬 Supabase에 구글 프로바이더가 없어 `/auth/v1/authorize`가 400으로 끝난다 — 실 Supabase 프로젝트와 구글 OAuth 클라이언트가 서야 보이고, 그 자리는 [environments.md Q-01·Q-03](5-deploy/environments.md#q-01)이다.

**`sian-native-pass`도 `active`로 남아 있다.** 시안 열여섯이 ADR-012(브랜드 파랑, 헐거운 밀도) 기준으로 갱신돼 아티팩트로 올라갔고 사람의 승인을 기다린다.

**`e2e-runner`는 `ready`고 `expo-scaffold`가 선행이다.** 지금 `tdd-guard-e2e.py`는 `tests/e2e/`를 못 찾아 아무것도 안 막는 상태다 — 이 task가 도구(Maestro나 Detox)를 골라 첫 스펙을 세워야 게이트가 다시 문다.

**`plans-restate`는 `blocked`고 `expo-scaffold`가 선행이다.** 남은 plan 열둘이 골격 위에서 파일 배치와 검증 명령을 채우길 기다린다.

## 재개 맥락

**spec 양식에 상태 격자가 들어갔다.** `## 상태 격자` 절 여덟 줄(빈 상태·로딩·실패·권한 없음·경계·재진입·동시 변경·성공 직후)과 AC별 「검증 층」 한 줄이 [2-design/README.md](2-design/README.md#spec)의 정본이고, `tests/lint/spec-grid.ts`가 이것이 찼는지 본다. 검사는 `status`로 안 가른다 — `### AC-NN`으로 조건을 나눈 spec이면 승인 뒤에도 격자를 다시 잰다. 승인을 면제 조건으로 두면 스물을 승인한 순간 검사 대상이 하나도 안 남는 구멍이 실제로 났었다. AC를 안 나눈 옛 명세 `login-screens.md`만 밖이다.

**화면이 있는 task 전부에 spec이 섰다 — 스물하나, 전부 `approved`.** 새 양식으로 걸린 빈 자리들 — `profile-form`(보내는 사이 차단되면 `submit_profile`의 `not_allowed`), `members`(마지막 관리자를 누르는 순간 서버가 다시 센다), `attendance-qr`(관리자 둘이 잇따라 뽑으면 먼저 인쇄한 종이가 그 순간 죽는다), `notification-settings`(권한 상태를 읽는 동안 스위치를 꺼진 모양으로 두면 끈 것처럼 보인다), `stats-admin`(일부 달만 읽기 실패하면 값 없는 달과 모양이 같아 안 갈린다), `payroll-view`·`stats-*`(쓰기가 없어 「성공 직후」가 해당 없음). 승인 근거 절마다 기준점 커밋과 승인 범위, 그 spec이 스스로 든 제한이 적혀 있다 — 승인 판정 자체는 총괄이 세션에 위임했다.

**완료 조건의 자리를 spec 하나로 좁혔다.** 살아 있는 기능 plan 열둘이 완료 조건 104개를 중복으로 품고 있었다 — [3-build/README.md](3-build/README.md)가 「완료 조건은 spec과 `2-design/`이 정본이라 여기 다시 적지 않는다」고 이미 적었는데 지키는지 볼 수 있는 문장이 아니었다. 판정을 절 이름으로 풀었다 — 기능 plan에 `## 완료 조건` 절이 있으면 그 기능의 spec이 없다는 뜻이고, 열둘은 `## 구현 산출물`이 됐다. AC 번호와 본문은 안 건드려서 `attendance-excuse`가 무는 `schedule-worker.md#ac-09`가 그대로 산다.

**데이터 task 셋이 전부 들어갔다** — `schedule-data`([PR #386](https://github.com/tkyoun0421/la-bie-belle/pull/386)), `attendance-data`([PR #387](https://github.com/tkyoun0421/la-bie-belle/pull/387)), `notification-data`([PR #388](https://github.com/tkyoun0421/la-bie-belle/pull/388)). 선행 없는 데이터 task가 더 없다.

**`plan-sources-gate`와 `claimed-guards-audit`가 닫혔다.** `findImpacted`가 이제 `doc.tracked`를 보고, spec은 `status: approved`, plan은 완료 머리글이 없으면 추적 대상이다. `claimed-guards-audit`([PR #390](https://github.com/tkyoun0421/la-bie-belle/pull/390))는 정본이 「기계가 지킨다」고 적은 주장 서른다섯을 훑어 구멍 셋을 메웠다 — RLS를 안 켠 표를 잡는 `tests/lint/table-rls.ts`, 전화번호 형식 제약과 `invalid_phone`, `notifications`의 부분 unique다. 새 주장을 적을 때 파일 이름을 같이 적는 것이 이 감사가 남긴 습관이다.

**승인 전에 불려야 하는 함수가 있다.** 알림 함수 넷이 `is_approved()`를 안 쓴다 — [NTF-016](2-design/modules/notification/README.md#ntf-016)이 알림 켜기를 승인 대기 화면에 뒀고 [NTF-006](2-design/modules/notification/README.md#ntf-006)의 가입 승인이 승인 전에 가야 하는 유일한 알림이라, 승인을 요구하면 그 알림이 배달 경로를 잃는다. 대신 `auth.uid()`로 프로필이 잡히고 `blocked_at`·`left_at`이 둘 다 널인지를 본다. [data-access.md 「함수 안의 규칙」](2-design/system/data-access.md#함수-안의-규칙)에 조항으로 섰고 `submit_profile`이 전례다.

**기기 주소는 사람이 아니라 기기를 가리킨다.** 한 기기를 A가 쓰다 로그아웃하고 B가 로그인하면 Expo가 같은 문자열을 준다 — `save_push_token`의 upsert가 `token` 충돌에서 `profile_id`를 부르는 사람으로 옮기지 않으면 A의 알림이 B의 폰에 뜬다.

**퇴사자가 승인된 사람과 똑같이 읽히던 것을 고쳤다.** `is_approved()`가 `left_at`을 빠뜨렸던 자리를 `schedule-data`에서 잡아 `20260825162027_profiles.sql`을 직접 고쳤다(배포 전이라 마이그레이션을 고치는 것이 되돌리기다). `is_admin()`은 아직 `role`만 본다 — 같은 계약을 어기고 있고 `members-pending`이 받아뒀다.

**총괄이 정할 것 둘이 여전히 열려 있다.** [navigation Q-03](2-design/system/navigation.md#q-03) — 종이 QR을 앱 없는 기기로 찍으면 무엇이 뜨나. [runtime Q-01](2-design/system/runtime.md#q-01) — 오래 안 열었다 여는 앱이 무엇을 다시 읽나.

회차 기록은 `docs/log/2026-09-23.md`다. 그 앞 [2026-09-22](log/2026-09-22.md)가 서체·세션·딥링크·진입 판정을 세웠고, 이번 회차(#391·#392)는 spec 양식에 상태 격자를 더하고 화면 task 스물의 spec을 세워 승인했다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
