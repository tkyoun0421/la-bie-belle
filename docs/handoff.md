# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**읽기 묶음 넷이 도는 중이다 — 받아서 cherry-pick하고 전수를 다시 세는 것이 첫 수다.** 쓰기 묶음은 PR [#514](https://github.com/tkyoun0421/la-bie-belle/pull/514)(`feat/suspense-probe`)에 있고 자동 리뷰가 통과했다. 읽기 묶음은 worktree 브랜치에 커밋만 하고 PR을 안 연다 — 총괄이 cherry-pick한다.

**정본이 세 번 고쳐졌다. 고친 쪽이 지금 맞다.**

**하나 — 도메인 여럿을 맞추는 읽기는 `features`에 산다.** plan이 `features/stats`를 「mutation이 없으니 `entities`로」 보내려 했는데 ADR-015가 「도메인 둘 이상을 읽는 것은 읽기라도 `features`에 산다」고 적고 그 슬라이스를 이름까지 들어 예로 쓴다. `useAttendanceMonthsQuery`가 query 둘을 합치고 `queryKeys`에 `stats` 네임스페이스조차 없다 — 내리면 규칙 3이 열두 자리에서 막는다(`import type`도 막는다). ADR-016의 가름 축이 「도메인 하나를 읽으면 `entities`, 바꾸거나 도메인 여럿을 맞추면 `features`」로 섰다.

**둘 — 못 올라가는 것과 자리를 안 만든 것은 다르다.** 관찰 065를 「`screens`가 맞는 자리」로 닫았는데 한 칸 모자랐다. `payrollViewDays`가 entity 슬라이스 넷(`attendance`·`payroll`·`rehearsal`·`schedule`)을 맞춰 `entities/payroll`로 못 내려가는데, **규칙 28 `house/features-query-composes`가 바로 그 자리를 허락한다** — `features/payrollCompute`에 `services/`가 없었을 뿐이다. ADR-016에 「먼저 물을 것은 그 슬라이스에 service가 있나다」를 넣었다. `screens`에 남을 자리는 진짜로 `features` 둘 이상을 당기는 여덟이고 그중 `ui`는 시트 고르는 자리 둘(`DayDetailSheetBody` 다섯, `ScheduleAdminSheetBody` 셋)뿐이다.

**셋 — 묶음 자리는 뼈다.** `AdminStatsBody`·`StatsList`·`PayrollList`·`WagesList`·`ApplicationsList`·`ApprovalsList`·`ProfileSettings`가 `screen:` controller를 통째로 받아 상태 이름으로 조각만 고르고 도메인 층을 하나도 안 당긴다. 고르는 대상이 화면 문안을 든 조각이라 목록이 올라가면 빈 상태·실패 문안까지 따라 올라간다.

**읽기는 `useQuery`로 간다.** RN에서 Suspense fallback이 안 풀린다는 보고가 [TanStack/query#8819](https://github.com/TanStack/query/issues/8819)·[react-native#49129](https://github.com/react/react-native/issues/49129)에 있고, 맥과 기기가 같은 네트워크에 없고 시뮬레이터도 없어(Xcode는 Command Line Tools만) 확인을 못 했다. 조각이 자기 데이터를 부르는 것이 ADR-016의 핵심이고 경계는 그 위의 선택이라 확인 하나로 전체를 미루지 않는다 — 확인되면 조각마다 `useSuspenseQuery` 한 줄 교체다.

**기기 확인은 사용자가 나중에 한다.** 막힌 자리는 `.env`의 `EXPO_PUBLIC_SUPABASE_URL`이 `127.0.0.1`이라 폰에서 자기 자신을 가리키는 것이고, LAN 주소로 덮어 띄우면 된다(`EXPO_PUBLIC_SUPABASE_URL=http://$(ipconfig getifaddr en0):54321 pnpm dev`). 맥과 기기가 같은 Wi-Fi여야 한다 — Metro는 `--tunnel`로 피할 수 있지만(ngrok 전역 설치가 권한으로 실패한다) 로컬 Supabase는 LAN 주소밖에 길이 없다.

**본보기가 셋이다.**

- **쓰기 조각** — `features/memberAdmin/{ui/MemberSheet.tsx, hooks/useMemberSheet.ts}`. 조각 controller가 초안·보내는 중·실패를 들고 자기 mutation을 부르고 끝나면 `onDone`으로 화면에 알린다
- **읽기 조각** — `entities/payroll/{hooks/useWageRows.ts, ui/WageRows.tsx, ui/WageRowsLoading.tsx, ui/WageRowsFailed.tsx}`. `state: "pending" | "failed" | "rows"`를 상태 이름으로 내주고 `.tsx`가 조건문으로 고른다. 누가 있는지는 `entities/member` 소관이라 `people`로 받고 시트 여는 행위는 `onPressPerson`으로 받는다
- **경계** — `shared/ui/QueryBoundary.tsx`가 `Suspense`·ErrorBoundary·`QueryErrorResetBoundary`를 묶는다. `retry`가 쿼리의 에러 상태까지 되돌려 다시 그려도 같은 에러가 또 던져지지 않는다. `entities/notification`의 조각 넷만 `useSuspenseQuery`로 그 경계를 쓴다

**옮기지 않기로 한 것 둘.**

- **`useDayDetail`의 mutation 아홉.** `pick → commit → pending → run`을 지나고 확정 버튼 하나가 pending의 종류에 따라 넷 중 하나를 고른다. 조각이 mutation 하나를 삼키는 꼴이 아니라 옮기려면 653줄과 그 테스트 611줄을 다시 짜야 한다
- **`pending`의 폼 로직.** 형제 셋이 같은 상태를 읽는다 — `PendingSummary`가 굳은 칸을, `PendingEditor`가 열린 칸을, BottomCTA가 `canSubmit`을 본다. 아무도 혼자 가질 수 없다

**검사가 둘 섰다.** 규칙 39 `house/ui-value-import`(`ui/`에서 `model`·`utils`를 값으로 당기는 것을 막는다, 면제는 `shared` 층의 `utils`)와 규칙 40 `house/ui-no-router`(`ui/`에서 라우팅 훅 여섯, `Link`와 `import type { Href }`는 통과)다. 규칙 하나를 켜려면 **한 커밋에 다섯 자리**를 건드린다 — `.mjs`·`eslint-rules/index.mjs`·`eslint.config.mjs`·`tests/lint/rules.ts`(행과 `DOCUMENTED_LINT_RULE_COUNT`)·`docs/4-test/execution.md`. `ruleCatalogue.test.ts`가 살아 있는 `eslint.config.mjs`를 읽어서다.

**테스트 프로젝트 범위가 넓어졌다.** `components`가 `src/shared/ui/__tests__/`만 봐서 조각이 `entities`·`features`로 옮겨가면 그 `.tsx` 테스트를 아무도 돌리지 않았다. `logic`의 제외 패턴도 같은 경로만 집어 양쪽에서 빠졌다 — 둘을 `src/**/ui/__tests__/`로 넓혔다. 조각을 옮기면 짝 테스트가 iOS 환경에서 돈다.

**꼬리는 `backlog.md`의 `duplicated-constants-and-copy`가 받는다** — `CLOCK_LENGTH = 5` 네 자리(집은 `entities/clock/consts`), `alreadyDecided`와 `adminBadge` 중복, `useMyProfileRowQuery` 오명(`Profile`을 돌려주며 `Row`를 든다, importer 여덟, 축은 「연락처가 붙었나」)이다. 관찰 061의 mock 아흔여덟도 열려 있다.

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
