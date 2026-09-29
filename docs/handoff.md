# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `sian-sync`다** — `ready`에 남은 하나다. 재편 전부터 있던 문서↔시안 어긋남을 시안 쪽에서 맞춘다. 값은 문서와 [tokens.md](2-design/design-system/tokens.md)가 정본이라 시안만 고친다. 자리는 backlog 행이 화면별로 든다. 나머지 `blocked`는 `attendance-checkin`의 NCP 자격에 묶인 사슬이다.

**`notification-settings`가 `done`이다(#475 정본, #476 구현).** 권한 감싸기(`push-permission.ts`, 기기에 붙는 함수는 전부 주입), 갈래 판정(`reach-state.ts`)과 자리별 문장(`reach-message.ts`), 켜고 끄는 훅, 매 진입 주소 보내기, 「나」의 알림 줄과 승인 대기 켜기 자리, 관리자 세 자리의 갈래 표시가 섰다. **매 진입을 붙인 자리는 `src/app/(tabs)/_layout.tsx`다** — 세션이 있는 사람만 지나고 앱이 떠 있는 동안 안 내려간다.

**총괄이 정본에 박은 판정이 여덟이다.** 「나」의 거부 안내를 승인 대기 화면과 같은 두 줄로 맞췄고, 확정 뒤 확인 자리는 갈래를 안 가르고 한 줄로 합친다(그 자리에서 할 일이 어느 갈래든 따로 연락 하나다). 갈래 표시는 재직자에게만 붙는다. 「매 진입」은 앱이 뜰 때와 포그라운드 복귀마다다. 승인 대기 뷰 값은 `"idle" | "enabled" | "denied"`고 `"unsupported"` 결과도 셋째 모습으로 간다. 의사를 읽기 전에는 스위치 대신 스켈레톤이다. 안드로이드 채널 이름은 「근무 알림」이다. AC-05·AC-07의 DB 자리는 이미 선 함수와 테스트가 덮어 재배정 안 했다.

**남은 것은 기기가 있어야 닫힌다.** 권한 창을 거치는 AC-01·AC-03·AC-06과 `app.json`의 `extra.eas.projectId` 실값이다. 그 값이 없으면 `null`로 서서 「켰는데 기기가 없음」 갈래가 된다. `tests/e2e/notification-settings.yaml`이 여정을 들고 기다린다.

**관찰 셋이 열렸다.** [037](observations/037-planner-reported-absent-what-was-there.md) — 계획자가 「정본에 없다」고 한 문구 둘이 실제로는 있었다(찾은 말이 정본의 말과 달랐다). [038](observations/038-fixture-user-misses-member-list.md) — `createApprovedUser`가 `submitted_at`을 안 채워 그 사람이 `listActiveMembers`에 안 잡힌다. [039](observations/039-e2e-only-assignment-blocks-the-hook.md) — **e2e로만 배정된 `.ts`를 TDD 훅이 못 통과시킨다.** 이번에 `push-permission.ts`가 그것에 막혀 구현이 두 라운드로 갈렸다.

**`notification-push`가 `done`이다(#472).** 트리거와 cron `retry-push`(매분)가 같은 Edge Function `send-push`를 부르고, 잡기(`claim_notifications`)의 `returning`이 두 경로의 중복 발송을 막는다. **잡기는 한 문장이다** — `update ... returning`을 CTE로 두고 밖에서 `array_agg`로 주소를 묶는다(조인하면 주소가 둘인 사람의 행에 매치가 여럿 붙어 한쪽만 남는다). 껍데기 넷의 첫 줄이 전부 `auth.role() is distinct from 'service_role'`이고, 트리거의 쏘는 단계는 예외를 삼켜 사건 함수의 트랜잭션을 안 말린다.

**`_shared` 복사 단계가 섰다(AC-09).** `pnpm edge:sync`가 `src/`를 `supabase/functions/_shared/`로 옮기며 import에 `.ts`를 붙인다. `import-holidays`도 그 복사본을 보게 고쳤다 — [관찰 035](observations/035-edge-function-reaches-outside-mount.md)가 연 자리를 닫았다. **재발은 lint 규칙 둘(20·21)이 막는다** — `supabase/functions/`의 마운트 밖 import와 복사되는 폴더의 `node:` import다. 다만 **규칙 21의 폴더 목록이 복사 대상과 정확히 같지는 않다** — `sync-edge-shared.mts`가 `src/entities/notification/model/types.ts`도 옮기는데 규칙은 `src/features/notification/model/`만 문다.

**edge-runtime은 여전히 안 뜬다.** `supabase start`가 `-x`로 빼서 `send-push`가 실제로 도는 것, 실기기 수신, 접수증 서비스의 답은 배포 뒤 손 확인이다.

**`notification-list`가 `done`이다(#468).** 알림 목록 화면과 앱바 종이 섰고, 순수 함수 셋(`title`·`when`·`destination`)과 훅 셋, 읽는 손 둘이 같이 왔다. **문장·목적지는 1차 열여덟만 낸다** — 2차 다섯은 널이고 `kind` 유니온만 스물셋을 든다. `kind` 문자열과 `payload` 열쇠는 [design.md 「kind와 payload」](2-design/modules/notification/design.md#kind와-payload)가 정본이고 **`notification-emit`이 그 표에 맞춰 행을 낳아야 한다**. 판정 둘을 정본에 박았다 — 줄을 눌러 간 자리의 읽음 실패는 조용하고(토스트 없음, [runtime.md](2-design/system/runtime.md)에 예외 한 줄), `?from=notifications`는 앱바 뒤로가 있는 관리자 두 화면에만 싣는다(탭 화면은 받을 자리가 없다, [navigation.md](2-design/system/navigation.md#뒤로)).

**구현자가 남긴 발견 둘이 열려 있다.** 아래 줄(`sub`) 문안이 정본에 없어 데이터를 잇는 꼴로 지어 넣었다 — 목록은 안 그려 지금은 안 보이지만 대시보드와 푸시가 그릴 자리다. 그리고 **로컬 DB가 1000행을 넘으면 `getWageRates`가 조용히 잘린다** — 범위 없이 읽어 PostgREST 기본 상한에 걸리고, CI는 매번 빈 DB라 안 걸린다. `runtime.md` 「읽기 범위」가 막으려던 자리다.

**`payroll-holidays`가 `done`이다(#464).** `internal.fetch_holidays()`가 날마다 다음 해에 `source = 'api'` 공휴일이 있는지 보고, 비었으면 `pg_net`으로 Edge Function `import-holidays`를 쏜다. 그 함수가 공공데이터포털에서 열두 달을 순차로 받아 한 달이라도 실패하면 아무것도 안 넣고, 성공하면 `public.import_holidays(p_year, p_rows)`를 부른다. **서비스 키로도 `internal`은 못 부른다** — PostgREST가 노출 목록(`public`·`graphql_public`) 밖의 스키마를 라우팅 단계에서 끊어 키와 무관하게 `PGRST106`이다. 그래서 `public` 껍데기가 서고 그 첫 줄이 `auth.role() is distinct from 'service_role'`을 본다(`<>`면 JWT 없는 호출의 널 비교가 널이라 검사를 그냥 통과한다). 판정은 [data-access.md](2-design/system/data-access.md)의 「서비스 키 자리」가 정본이고 [관찰 033](observations/033-service-key-cannot-reach-internal.md)이 경위를 담는다.

**pg_net 호출 횟수는 응답 표가 아니라 요청 시퀀스로 센다.** `net.http_post`는 요청 행만 그 자리에서 넣고 응답 행은 백그라운드 워커가 나중에 쓴다 — `net._http_response`를 부른 직후에 세면 로컬에서는 맞고 CI에서는 0이 나온다. 통합 테스트 둘이 이 경쟁으로 깨졌고 `net.http_request_queue_id_seq`의 차를 세는 쪽으로 옮겼다([관찰 034](observations/034-pg-net-response-row-is-async.md)). `send-push`도 「쏘았는가」를 세게 되니 같은 길을 탄다.

**`profile-erasure`가 `done`이다(#461 plan, #462 구현).** 퇴사 1년 뒤 비우기가 섰다 — `internal.erase_profiles(p_now)`가 1년 경계로 `profile_private`를 지우고 `avatars` 사진을 비우고 `erased_at`을 찍은 뒤, `pg_net`으로 Edge Function `erase-account`를 쏴서 `auth.users`를 지운다. **plan을 쓰며 정본에 판정 넷을 박았다** — 도는 시각은 한국 새벽 4시, 사진은 주소만이 아니라 파일도 지운다, 알림 행은 안 비운다(`notification-data`가 넘긴 판정), 계정이 살아 있는 하루 동안 본인은 이름·지난 급여·근무 기록을 그대로 본다. 이 넷은 `account/design.md`의 「비우기」 절이 정본이다.

**구현이 쏘는 단계를 제 트랜잭션에 가뒀다.** `net.http_post` 호출을 `begin ... exception when others ...; end`로 감싸 예외가 방금 지운 개인정보를 롤백으로 되살리지 않게 했다 — 안 그러면 같은 실패가 날마다 되풀이돼 비우기가 영영 안 끝난다. **AC-03(Edge Function이 실제로 `auth.users`를 지우는 것)은 로컬·CI가 edge-runtime을 빼고 띄워 배포 뒤 손 확인으로 남았다** — 멱등, anon 키 거절, `user_id`가 널이 되는 것 셋이 확인 목록이다.

**발견 둘이 candidate로 섰다.** `erased-photo-bytes-remain` — 사진을 지우는 SQL이 `storage.objects` 행만 지워 공개 주소는 404가 되지만 객체 저장소의 바이트는 고아로 남는다(`storage.protect_delete()` 트리거가 SQL 직접 삭제를 막아서다). 완전히 지우려면 Storage API를 타야 하고 그건 Edge Function 쪽 일이다. `internal-grants-public` — `revoke all on all functions in schema internal from anon, authenticated`가 저장소의 `internal` 마이그레이션마다 복사돼 있는데 실제로는 안 막는다. 함수 EXECUTE가 기본으로 `PUBLIC`에 붙어서 역할을 이름으로 빼봐야 `PUBLIC`을 타고 들어온다. 지금 막는 것은 PostgREST 라우팅과 스키마 USAGE뿐이고, 누가 `internal`에 USAGE를 여는 날 모든 함수가 같이 열린다. [관찰 031](observations/031-internal-exposure-test-covers-one-layer.md)이 근거다.

**`plans-restate`가 `done`이다(#459, #460).** plan 열둘의 「변경 파일」 표가 디렉터리 대신 구현 파일을 하나씩 들고, 검증 표의 `(예정)`과 「e2e 명령」이 실재 경로와 `pnpm e2e`로 섰다. 채우는 일보다 낡은 서술을 걷어낸 쪽이 컸다 — 계획서가 「누가 무엇을 세우는가」를 적는데 실제 merge 순서가 그것과 달라, dal과 공용 조각의 주체가 뒤바뀐 자리 넷과 달 고르기 시트를 서로 미루던 자리 다섯이 나왔다. `attendance-excuse` AC-05의 「iOS 사파리 visual viewport」는 네이티브에 사파리가 없어 `KeyboardAvoidingView`로 판정했다(선례는 `src/screens/pending/ui/PendingScreen.tsx:390`). **다음 화면 task가 plan을 읽을 때 이 정정을 믿어도 된다** — 열둘 다 지금 코드와 대조했다.

**`ready`가 `sian-sync` 하나다.** 알림 영역에서 남은 `notification-emit`·`notification-schedule`·`notification-second`는 `attendance-excuse`(그 앞이 `dashboard`, 그 앞이 `attendance-checkin`의 NCP 자격)에 묶여 있다.

**`notification-push`의 plan이 섰고 정본에 판정 셋을 박았다.** 보낼 것이 없어도 접수증을 긁는다([Q-02](2-design/modules/notification/design.md#아직-안-정한-것) 닫음), 잡기와 결과 쓰기가 `public` 껍데기를 탄다, 접수증 번호 열(`push_receipt_id`)은 그 task가 붙인다. **문장 함수의 주인은 `notification-list`다** — spec과 plan 둘이 그렇게 적어둬서 순서를 뒤집는 대신 `notification-push`를 그 뒤로 보냈다. **[관찰 035](observations/035-edge-function-reaches-outside-mount.md)가 열려 있다** — `import-holidays`가 마운트 밖의 `src/`를 import하는데 edge-runtime을 안 띄워 아무 검사도 안 잡았다. `notification-push`의 AC-09가 복사 단계를 세우며 같이 고친다. `blocked`로 남은 쪽의 이유는 셋뿐이다 — **NCP 자격**(`attendance-checkin`·`hall-location`), **도메인**(`qr-landing-page`·`first-release`), **앞 task의 사슬**(`dashboard`가 `attendance-checkin`을 기다리고 `attendance-excuse`·`notification-emit` 이하가 그 뒤에 선다).

**관찰 021·027·030은 아직 archive로 안 옮겼다.** `resolved: 2026-09-29`가 찍혀 있는데 오늘이 아직 그 날짜라 archive 조건(그 날짜가 지나는 것)을 아직 안 채운다. 다음 마감이 옮긴다. 025·026은 `resolved: 2026-09-28`로 날짜가 지나 이번 회차에 archive로 옮겼다.

**앞선 `stats-worker`(#457)와 급여 모듈(`payroll-wages`·`payroll-view`·`payroll-adjust`)은 로그가 담는다.** 세부는 [2026-09-29 로그](log/2026-09-29.md)와 [2026-09-28 로그](log/2026-09-28.md)가 담는다.

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. spec 파일이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다(#441) — `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**저장소의 첫 Edge Function이 섰다.** `supabase/functions/erase-account/index.ts` — service role로 Admin API를 불러 계정을 지운다. `tsconfig.json`이 `supabase/functions`를 `exclude`에 두는데, 그 폴더가 Deno 런타임이라 `Deno` 전역도 `npm:` 지정자도 우리 `tsc`로는 안 풀려서다. Edge Function을 타입 검사하는 자리가 아직 없다 — CI에 Deno가 없다. `import-holidays`(#464)가 둘째로 섰고 검사 단계는 여전히 안 세웠다. `send-push`가 셋째다.

**vault로 로컬 시크릿을 심는 길이 섰다.** integration 테스트가 `beforeAll`/`afterAll`에서 `vault.create_secret`/삭제로 로컬 전용 가짜 값을 넣고 뺀다. `seed.sql`(전역 상태, `db reset`마다 돎)은 이 용도로 안 쓴다 — `payroll-holidays`가 같은 길을 그대로 탔고 `notification-push`도 부치는 접근 토큰을 이렇게 심는다.

**금액 꼴은 `shared/lib/spell-number.ts` 하나로 모였고, 시간 길이 꼴은 아직 슬라이스 셋에 흩어져 있다.** `screens/payroll/model/summary.ts`의 `spellWorkedHours`(「0시간 30분」)와 `screens/schedule-admin/model/adjust-sheet-rows.ts`의 `spellHours`·`features/rehearsal/model/spell-total.ts`의 `spellMinutes`(「30분」)가 갈려 있다 — `writing.md`가 「30분」 쪽으로 판정했으니 `summary.ts`가 어긋난 쪽이다. `spell-number-shared` candidate가 받는다.

**`internal` 스키마의 실제 방어는 두 겹뿐이다.** PostgREST 라우팅과 스키마 USAGE다 — 문서가 요구하는 「함수 revoke」 한 겹은 저장소 전체에서 안 서 있다. `internal-grants-public` candidate가 고칠 길(`revoke execute on all functions in schema internal from public`)까지 적어 뒀다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024, open).** `backlog.md`의 `test-seed-transaction`이 받는다. `add-assignment.integration.test.ts`가 전체 실행에서 한 번 이 경쟁으로 흔들렸다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더. 여기에 Edge Function 배포 뒤 손 확인(`profile-erasure`의 AC-03)이 더해졌다.

회차 기록은 [docs/log/2026-09-29-3.md](log/2026-09-29-3.md)다. `payroll-holidays`(#464)가 서며 서비스 키가 `internal`에 못 닿는다는 판정이 나고, `notification-push`의 plan(#466)과 `kind`·`payload` 계약(#467)이 서야 `notification-list`(#468)가 문장 범위를 정해 구현됐다. 그 앞은 [docs/log/2026-09-29-2.md](log/2026-09-29-2.md)(계정 삭제 파이프라인)와 [docs/log/2026-09-29.md](log/2026-09-29.md)(통계 모듈)와 [docs/log/2026-09-28.md](log/2026-09-28.md)(급여 모듈)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
