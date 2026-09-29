# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `payroll-holidays`다** — backlog의 `ready` 맨 위다. plan이 이미 서 있다: [3-build/plans/payroll-holidays.md](3-build/plans/payroll-holidays.md). 공휴일 받기를 만든다 — pg_cron `fetch_holidays`가 날마다 다음 해가 비었는지 보고 `pg_net`으로 Edge Function `import-holidays`를 쏜다. API 키는 Edge Function secret이라 저장소에 안 들어간다. 정본은 [payroll/design.md](2-design/modules/payroll/design.md#공휴일-받기)다. **vault 시크릿의 로컬 값을 넣는 길은 `profile-erasure`가 이미 밟았다** — 테스트가 `beforeAll`에서 `vault.create_secret`으로 로컬 전용 가짜 값을 넣고 `afterAll`에서 지운다. `seed.sql`은 `db reset`마다 도는 전역 상태라 안 쓴다. 사용자의 상시 지시는 「전체 기능 구현」이다: 시안 열다섯을 건너뛰고 화면 task가 [ADR-014](2-design/adr/ADR-014-toss-like-depth-and-graphics.md)를 코드로 옮기는 랄프 루프를 돌리는 중이고, 루프의 정본은 [spec/ui-kit.md](2-design/spec/ui-kit.md)의 「루프」 절이다.

**`profile-erasure`가 `done`이다(#461 plan, #462 구현).** 퇴사 1년 뒤 비우기가 섰다 — `internal.erase_profiles(p_now)`가 1년 경계로 `profile_private`를 지우고 `avatars` 사진을 비우고 `erased_at`을 찍은 뒤, `pg_net`으로 Edge Function `erase-account`를 쏴서 `auth.users`를 지운다. **plan을 쓰며 정본에 판정 넷을 박았다** — 도는 시각은 한국 새벽 4시, 사진은 주소만이 아니라 파일도 지운다, 알림 행은 안 비운다(`notification-data`가 넘긴 판정), 계정이 살아 있는 하루 동안 본인은 이름·지난 급여·근무 기록을 그대로 본다. 이 넷은 `account/design.md`의 「비우기」 절이 정본이다.

**구현이 쏘는 단계를 제 트랜잭션에 가뒀다.** `net.http_post` 호출을 `begin ... exception when others ...; end`로 감싸 예외가 방금 지운 개인정보를 롤백으로 되살리지 않게 했다 — 안 그러면 같은 실패가 날마다 되풀이돼 비우기가 영영 안 끝난다. **AC-03(Edge Function이 실제로 `auth.users`를 지우는 것)은 로컬·CI가 edge-runtime을 빼고 띄워 배포 뒤 손 확인으로 남았다** — 멱등, anon 키 거절, `user_id`가 널이 되는 것 셋이 확인 목록이다.

**발견 둘이 candidate로 섰다.** `erased-photo-bytes-remain` — 사진을 지우는 SQL이 `storage.objects` 행만 지워 공개 주소는 404가 되지만 객체 저장소의 바이트는 고아로 남는다(`storage.protect_delete()` 트리거가 SQL 직접 삭제를 막아서다). 완전히 지우려면 Storage API를 타야 하고 그건 Edge Function 쪽 일이다. `internal-grants-public` — `revoke all on all functions in schema internal from anon, authenticated`가 저장소의 `internal` 마이그레이션마다 복사돼 있는데 실제로는 안 막는다. 함수 EXECUTE가 기본으로 `PUBLIC`에 붙어서 역할을 이름으로 빼봐야 `PUBLIC`을 타고 들어온다. 지금 막는 것은 PostgREST 라우팅과 스키마 USAGE뿐이고, 누가 `internal`에 USAGE를 여는 날 모든 함수가 같이 열린다. [관찰 031](observations/031-internal-exposure-test-covers-one-layer.md)이 근거다.

**`plans-restate`가 `done`이다(#459, #460).** plan 열둘의 「변경 파일」 표가 디렉터리 대신 구현 파일을 하나씩 들고, 검증 표의 `(예정)`과 「e2e 명령」이 실재 경로와 `pnpm e2e`로 섰다. 채우는 일보다 낡은 서술을 걷어낸 쪽이 컸다 — 계획서가 「누가 무엇을 세우는가」를 적는데 실제 merge 순서가 그것과 달라, dal과 공용 조각의 주체가 뒤바뀐 자리 넷과 달 고르기 시트를 서로 미루던 자리 다섯이 나왔다. `attendance-excuse` AC-05의 「iOS 사파리 visual viewport」는 네이티브에 사파리가 없어 `KeyboardAvoidingView`로 판정했다(선례는 `src/screens/pending/ui/PendingScreen.tsx:390`). **다음 화면 task가 plan을 읽을 때 이 정정을 믿어도 된다** — 열둘 다 지금 코드와 대조했다.

**`ready`가 다섯이다.** `payroll-holidays`가 맨 위고 `notification-push`·`notification-list`·`notification-settings`·`sian-sync`가 뒤를 잇는다. 맨 위는 Edge Function과 pg_cron을 쓰는 서버 쪽이라 화면 task와 결이 다르다. `blocked`로 남은 쪽의 이유는 셋뿐이다 — **NCP 자격**(`attendance-checkin`·`hall-location`), **도메인**(`qr-landing-page`·`first-release`), **앞 task의 사슬**(`dashboard`가 `attendance-checkin`을 기다리고 `attendance-excuse`·`notification-emit` 이하가 그 뒤에 선다).

**관찰 021·027·030은 아직 archive로 안 옮겼다.** `resolved: 2026-09-29`가 찍혀 있는데 오늘이 아직 그 날짜라 archive 조건(그 날짜가 지나는 것)을 아직 안 채운다. 다음 마감이 옮긴다.

**앞선 `stats-worker`(#457)와 급여 모듈(`payroll-wages`·`payroll-view`·`payroll-adjust`)은 로그가 담는다.** 세부는 [2026-09-29 로그](log/2026-09-29.md)와 [2026-09-28 로그](log/2026-09-28.md)가 담는다.

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. spec 파일이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다(#441) — `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**저장소의 첫 Edge Function이 섰다.** `supabase/functions/erase-account/index.ts` — service role로 Admin API를 불러 계정을 지운다. `tsconfig.json`이 `supabase/functions`를 `exclude`에 두는데, 그 폴더가 Deno 런타임이라 `Deno` 전역도 `npm:` 지정자도 우리 `tsc`로는 안 풀려서다. Edge Function을 타입 검사하는 자리가 아직 없다 — CI에 Deno가 없다. `payroll-holidays`의 `import-holidays`가 둘째 Edge Function이 될 자리라, 검사 단계를 세울지는 그 task에서 다시 볼 만하다.

**vault로 로컬 시크릿을 심는 길이 섰다.** integration 테스트가 `beforeAll`/`afterAll`에서 `vault.create_secret`/삭제로 로컬 전용 가짜 값을 넣고 뺀다. `seed.sql`(전역 상태, `db reset`마다 돎)은 이 용도로 안 쓴다 — `payroll-holidays`가 같은 길을 그대로 탄다.

**금액 꼴은 `shared/lib/spell-number.ts` 하나로 모였고, 시간 길이 꼴은 아직 슬라이스 셋에 흩어져 있다.** `screens/payroll/model/summary.ts`의 `spellWorkedHours`(「0시간 30분」)와 `screens/schedule-admin/model/adjust-sheet-rows.ts`의 `spellHours`·`features/rehearsal/model/spell-total.ts`의 `spellMinutes`(「30분」)가 갈려 있다 — `writing.md`가 「30분」 쪽으로 판정했으니 `summary.ts`가 어긋난 쪽이다. `spell-number-shared` candidate가 받는다.

**`internal` 스키마의 실제 방어는 두 겹뿐이다.** PostgREST 라우팅과 스키마 USAGE다 — 문서가 요구하는 「함수 revoke」 한 겹은 저장소 전체에서 안 서 있다. `internal-grants-public` candidate가 고칠 길(`revoke execute on all functions in schema internal from public`)까지 적어 뒀다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024, open).** `backlog.md`의 `test-seed-transaction`이 받는다. `add-assignment.integration.test.ts`가 전체 실행에서 한 번 이 경쟁으로 흔들렸다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더. 여기에 Edge Function 배포 뒤 손 확인(`profile-erasure`의 AC-03)이 더해졌다.

회차 기록은 [docs/log/2026-09-29-2.md](log/2026-09-29-2.md)다. plan 열둘의 사후 기록(#459)을 이어받아 `profile-erasure`(#461·#462)가 서고 계정 삭제 파이프라인이 닫힌다. 그 앞은 [docs/log/2026-09-29.md](log/2026-09-29.md)(통계 모듈)와 [docs/log/2026-09-28.md](log/2026-09-28.md)(급여 모듈)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
