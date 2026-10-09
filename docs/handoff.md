# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**[screens-orchestration-only](3-build/plans/screens-orchestration-only.md)이 돌고 있다 — `.tsx`가 조립만 하게 한다.** 브랜치는 `feat/screens-orchestration-only`고 `dto-to-domain-shape`는 PR [#510](https://github.com/tkyoun0421/la-bie-belle/pull/510)으로 merge됐다.

**통신 쪽 경계는 섰다.** `ui`가 `api`·`services`·Supabase 클라이언트·`.dto.ts`를 당기는 자리가 전부 0이다. 남은 것은 **값을 만드는 일**이 화면에 있다는 것 — `ui`가 `utils`를 값으로 당기는 자리가 스물둘, `model`이 다섯이고 아무 lint 규칙도 안 문다. 통신 축 넷만 막혀 있어서 포맷과 판정을 당기는 길이 열려 있다.

**그 스물일곱이 조각에 몰렸다.** `screens/*/ui` 쉰넷 중 화면 파일은 스물이고 조각이 서른넷인데, 값 import 스물다섯 중 **화면 파일은 둘**이다. `MemberSheet.tsx` 하나가 `canSaveDisplayName`·`formatBirthDate`·`spellGender`·`spellLeftAt` 넷을 불렀다.

**ADR-015가 controller의 정의를 넓혔다** — 파일 꼴이 `hooks/use<화면>.ts`에서 `hooks/use<조각>.ts`가 되고 「`.tsx`는 조립만 한다」 절이 섰다. controller를 화면 단위로만 두면 조각의 로직이 갈 데가 없어 `.tsx`에 남거나 화면 controller가 조각의 props까지 만드는 뭉치가 된다. 집행 표에 「`ui/`에서 `model`·`utils`를 값으로 import 금지」가 더해졌고 깨진 경계 표는 실측으로 갱신했다.

**본보기가 `members`다(`d88167cc`).** 꼴이 넷이다 — `model/<조각>.type.ts`가 `<조각>Input`·`<조각>Controller`를 선언하고, `hooks/use<조각>.ts`가 포맷·판정을 불러 완성된 값을 주고, 조각 `.tsx`는 `const view = use<조각>(input)`로 받아 꽂고, 상태마다의 렌더는 조각으로 갈린다(`MembersLoading`·`MembersEmpty`·`MemberRows`). `Linking.openURL`은 `shared/lib/openPhone.lib.ts`로 갔다 — 부작용을 내는 손이 `lib`의 일이다. `useRouter`도 controller로 올라가 `screen.goBack` 하나가 됐고 경로는 `shared/consts/navigation.const.ts`의 `ADMIN_HOME_PATH`로 간다. 줄 수는 `MemberSheet` 248 → 196, `MembersScreen` 175 → 111이다.

**나머지 열아홉 슬라이스를 implementer 다섯이 병렬로 한다.** 묶음은 `scheduleAdmin` 하나(파일 열다섯, 값 열여섯, `SheetLayer` 열셋) · `pending`+`profile` · `membersPending`+`rehearsal`+`qr` · `scheduleWorker`+`notifications`+`adminHome`+`adminStats` · 나머지 여덟(`wages`·`approvals`·`applications`·`payroll`·`stats`·`left`·`blocked`·`retry`)이다. 슬라이스가 경계라 파일이 안 겹친다. 각자 커밋만 하고 PR은 총괄이 연다.

**규칙 `house/ui-value-import`는 썼지만 안 켰다.** `eslint-rules/uiValueImport.mjs`와 짝 테스트 열셋이 디스크에 있고 등록 다섯 자리가 비어 있다 — `eslint-rules/index.mjs` · `eslint.config.mjs` · `tests/lint/rules.ts`(`RULES` 행 + `ENFORCED_RULE_COUNT`와 `DOCUMENTED_LINT_RULE_COUNT` **둘 다** 39로) · `docs/4-test/execution.md`의 표다. **두 상수가 쌍이라 하나만 올리면 「1부터 끝 번호까지 끊김 없이」가 깨진다.** `ruleCatalogue.test.ts`가 live config를 읽어 교차검증하므로 다섯이 한 커밋이어야 하고, 켜는 시점은 AC-01이 0에 닿은 뒤다.

**받아 둘 꼬리가 둘이다.**

- `useMyProfileRowQuery`의 이름이 거짓이 됐다 — `Profile`을 돌려주면서 `Row`를 든다. 당기는 자리가 여덟이고, `useMyProfileQuery`(연락처까지 합쳐 `MyProfile`을 낸다)와 가르는 축이 「한 행인가」가 아니라 「연락처가 붙었나」라 타입 이름 둘까지 같이 움직인다
- 테스트 아흔여덟이 `jest.fn<(...args: unknown[]) => Promise<unknown>>()`로 mock해 픽스처의 꼴을 아무도 안 본다(관찰 061). `useAdminHomeScreen.test.ts`의 `check_ins` 픽스처가 없는 열(`checked_in_at`)을 들고 있었고 어떤 검사도 안 잡았다. `jest.fn<typeof getMonthSchedule>()`로 바꾸면 `import type`이 런타임에 사라지니 mock을 우회하지 않는다

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. spec 파일이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다(#441) — `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**저장소의 첫 Edge Function이 섰다.** `supabase/functions/erase-account/index.ts` — service role로 Admin API를 불러 계정을 지운다. `tsconfig.json`이 `supabase/functions`를 `exclude`에 두는데, 그 폴더가 Deno 런타임이라 `Deno` 전역도 `npm:` 지정자도 우리 `tsc`로는 안 풀려서다. Edge Function을 타입 검사하는 자리가 아직 없다 — CI에 Deno가 없다. `import-holidays`(#464)가 둘째로 섰고 검사 단계는 여전히 안 세웠다. `send-push`가 셋째다.

**vault로 로컬 시크릿을 심는 길이 섰다.** integration 테스트가 `beforeAll`/`afterAll`에서 `vault.create_secret`/삭제로 로컬 전용 가짜 값을 넣고 뺀다. `seed.sql`(전역 상태, `db reset`마다 돎)은 이 용도로 안 쓴다 — `payroll-holidays`가 같은 길을 그대로 탔고 `notification-push`도 부치는 접근 토큰을 이렇게 심는다.

**금액 꼴은 `shared/utils/spellNumber.ts` 하나로 모였고, 시간 길이 꼴은 다섯 자리에 흩어져 있다.** `screens/payroll/utils/summary.utils.ts`와 `historyRows.utils.ts`, `screens/scheduleAdmin/utils/adjustSheetRows.utils.ts`, `screens/rehearsal/utils/spellTotal.utils.ts`, `screens/stats/utils/payrollSummary.utils.ts`가 같은 `floor`와 `%`를 각자 들고, 앞의 것만 「0시간 30분」으로 0을 적는다 — `writing.md`가 「30분」 쪽으로 판정했으니 `summary.utils.ts`가 어긋난 쪽이다. `spell-number-shared` candidate가 받고, plan AC-13의 사본 묶음과 같은 손이다.

**e2e TDD 훅이 꺼져 있던 것을 통계 묶음이 고쳤다.** AC-02가 슬라이스 폴더를 camelCase로 바꾼 뒤 훅이 `tests/e2e/adminStats.yaml`을 찾는데 파일은 `admin-stats.yaml`이라, camel로 이름이 바뀐 화면 다섯이 Edit·Write로 영영 못 열렸다. 그 사이의 `.tsx` 수정이 Bash의 `perl -pi`로 지나가서 막힌 줄 몰랐다 — **훅이 Edit·Write만 보고 Bash를 안 본다.** 관찰 054고 그 구멍은 열려 있다.

**`internal` 스키마의 실제 방어는 두 겹뿐이다.** PostgREST 라우팅과 스키마 USAGE다 — 문서가 요구하는 「함수 revoke」 한 겹은 저장소 전체에서 안 서 있다. `internal-grants-public` candidate가 고칠 길(`revoke execute on all functions in schema internal from public`)까지 적어 뒀다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024, open).** `backlog.md`의 `test-seed-transaction`이 받는다. `addAssignment.integration.test.ts`가 전체 실행에서 한 번 이 경쟁으로 흔들렸다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더. 여기에 Edge Function 배포 뒤 손 확인(`profile-erasure`의 AC-03)이 더해졌다.

회차 기록은 [docs/log/2026-10-01.md](log/2026-10-01.md)다 — `notification-settings`의 막힌 판정 여섯(#475)과 그 구현(#476), 관찰 정리(#477), 시안↔문서 여백 어긋남을 시안 쪽에서 맞춘 `sian-sync`(#478)가 들었다. 그 앞은 [docs/log/2026-09-29-3.md](log/2026-09-29-3.md)(공휴일 받기·알림 목록)와 [docs/log/2026-09-29-2.md](log/2026-09-29-2.md)(계정 삭제 파이프라인)와 [docs/log/2026-09-29.md](log/2026-09-29.md)(통계 모듈)와 [docs/log/2026-09-28.md](log/2026-09-28.md)(급여 모듈)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
