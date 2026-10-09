# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**[fragments-own-their-data](3-build/plans/fragments-own-their-data.md)가 돌고 있다 — 조각이 자기 데이터를 들게 한다.** 브랜치는 `feat/suspense-probe`고 [screens-orchestration-only](3-build/plans/screens-orchestration-only.md)는 PR [#511](https://github.com/tkyoun0421/la-bie-belle/pull/511)·[#512](https://github.com/tkyoun0421/la-bie-belle/pull/512)로 merge됐다.

**`.tsx`는 조립만 하게 됐다.** `ui/`의 값 import 27 → 0, `.tsx`의 `useRouter` 20 → 0, 한 파일의 `<Screen>`과 `SheetLayer` 각각 1이다. 규칙 서른아홉 `house/ui-value-import`가 재발을 막는다 — **면제는 `shared` 층의 `utils`다**(`cn`·`miniCalendarGrid`·`buildYearMonths`·`dayBandFillRatio` 넷이 그리기 기하학이라서).

**그 대가로 무게가 화면 controller 한 자리에 모였다.** `useScheduleAdminScreen`이 698줄에 service 스물여섯(query 9 · mutation 17)을 들고, 조각 서른여섯이 그 한 controller가 완성한 값을 받아 그린다. [ADR-016](2-design/adr/ADR-016-fragments-own-their-data.md)이 그 자리를 뒤집는다 — 조각이 자기 데이터를 부르고 조각마다 controller가 서고 화면은 경계를 든다.

**ADR-015의 기준이 이미 거짓이었다.** 「`features/*/ui`만 service를 부를 수 있다」고 적었지만 그 자리의 유일한 조각 `DeadlineSheet`가 service를 하나도 부르지 않는다. 실제로 일하던 기준은 무엇을 부르나가 아니라 **무엇에 관한 것이냐**였다. 「`entities/*/ui`가 0인 것은 정상이다」도 그 기준에 매달려 있었다 — 값을 부르는 쪽이 들고 와야 하니 두 번째 화면이 쓰려면 같은 query를 또 부르고 같은 props를 또 엮는다.

**`screens/*/ui` 152개 중 149개가 도메인 층을 하나도 import하지 않는다.** 이름에 도메인이 있어도(`DayRoster`·`PositionSlotCard`·`WageRows`) 타입으로는 모른다 — controller가 원시 타입으로 평평하게 풀어서 준다. 그것이 조각이 자립 못 하는 진짜 까닭이다.

**본보기가 `entities/notification`이다(`408dc995`).** `services/useUnreadCountSuspenseQuery.ts` → `hooks/useUnreadCountLine.ts`(조각 controller) → `ui/UnreadCountLine.tsx`(꽂기만) 꼴이고, `shared/ui/QueryBoundary.tsx`가 `Suspense`와 ErrorBoundary와 `QueryErrorResetBoundary`를 묶는다.

**쓰기가 먼저 돈다.** implementer 넷이 병렬로 `features/<use case>/ui`에 쓰기 조각을 세우는 중이다 — 묶음은 `scheduleAdmin` 하나(조각 열여섯) · `scheduleWorker`+`rehearsal` · `profile`+`pending` · 관리자 여섯(`members`·`membersPending`·`wages`·`adminHome`·`adminStats`·`approvals`)이다. base는 `f6a56307`이고 각자 커밋만 한다.

**읽기는 실기기 확인에 막혀 있다 — 그것이 다음 세션의 첫 수다.** `pnpm dev`로 띄워 알림 화면에 들어가 AppBar 밑 한 줄을 본다. 「세는 중」이 「안 읽은 알림 N개」로 바뀌면 `useSuspenseQuery`로 가고, 안 바뀌면 조각이 `useQuery`로 제 로딩을 그린다(ADR-016의 그 절만 뒤집고 나머지는 산다).

**까닭은 RN에서 Suspense fallback이 안 풀린다는 보고 둘이다** — [TanStack/query#8819](https://github.com/TanStack/query/issues/8819)(RN 0.77 · Query v5.68 · New Architecture)와 [react-native#49129](https://github.com/react/react-native/issues/49129)(RN 0.78-rc · React 19). 둘 다 어느 쪽 책임인지 결론이 없다. 여기 버전은 RN 0.86.3 · React 19.2.3이라 보고보다 뒤지만 저장소에 `Suspense`가 한 자리도 없었다. jsdom 테스트는 통과했고 그것이 RN 렌더러를 말해주지 않는다.

**받아 둘 꼬리가 넷이다.**

- `useMyProfileRowQuery`의 이름이 거짓이 됐다 — `Profile`을 돌려주면서 `Row`를 든다. 당기는 자리가 여덟이고, `useMyProfileQuery`(연락처까지 합쳐 `MyProfile`을 낸다)와 가르는 축이 「한 행인가」가 아니라 「연락처가 붙었나」라 타입 이름 둘까지 같이 움직인다
- 테스트 아흔여덟이 `jest.fn<(...args: unknown[]) => Promise<unknown>>()`로 mock해 픽스처의 꼴을 아무도 안 본다(관찰 061). `jest.fn<typeof getMonthSchedule>()`로 바꾸면 `import type`이 런타임에 사라지니 mock을 우회하지 않는다
- `useQrScreen`의 `qr`·`rotateFailed`와 `useProfileScreen`의 `contactRejected`가 테스트에서만 쓰인다. `loadNextWhenNear`도 `loadNextOnScroll`과 나란히 public으로 남았다
- 조각 `.tsx`가 `useRouter`를 쥐는 것을 막는 규칙이 없다. 지금 서른아홉까지고 그 자리가 마흔이다(plan의 AC-07)

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
