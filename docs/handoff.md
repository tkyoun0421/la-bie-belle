# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**[fragments-own-their-data](3-build/plans/fragments-own-their-data.md)의 쓰기 묶음이 PR [#514](https://github.com/tkyoun0421/la-bie-belle/pull/514)로 올라갔다 — CI 확인하고 merge하는 것이 첫 수다.** 브랜치는 `feat/suspense-probe`고 커밋 열일곱이다. 로컬 검증은 다 통과했다(`pnpm lint` 0 · `typecheck` 0 · `test` 3057+17).

**그다음이 AC-02 — 읽기 조각 쉰넷을 `entities/<도메인>/ui`로 옮긴다.** plan의 AC-02 표가 어느 조각이 어느 도메인으로 가는지 전부 든다. `screens/*/ui` 백열아홉 가운데 뼈가 예순다섯이고 나머지가 그 쉰넷이다.

**뼈의 기준은 열하나다** — `<화면>Screen`·`Loading`·`Empty`·`Failed`·`Sheets`·`Toast`·`AppBar`·`BottomCta`·`SheetBody`·`SheetFace`, 그리고 **조각을 배치하는 자리**(`ProfileSettings`처럼 라우팅 줄과 시트를 꽂고 도메인을 모르는 것). 「쓰기로 들어가는 문」은 뼈가 아니다 — `DaySheet`·`RehearsalDaySheet`·`WorkDaysSheet`가 mutation을 안 불러 `features`로 못 가지만 도메인을 읽어 보여주는 것이 본업이라 `entities`로 가고, 시트를 여는 행위는 `onPress`로 받는다.

**읽기는 `useQuery`로 간다.** RN에서 Suspense fallback이 안 풀린다는 보고가 [TanStack/query#8819](https://github.com/TanStack/query/issues/8819)·[react-native#49129](https://github.com/react/react-native/issues/49129)에 있고, 맥과 기기가 같은 네트워크에 없고 시뮬레이터도 없어(Xcode는 Command Line Tools만) 확인을 못 했다. 조각이 자기 데이터를 부르는 것이 ADR-016의 핵심이고 경계는 그 위의 선택이라 확인 하나로 전체를 미루지 않는다 — 확인되면 조각마다 `useSuspenseQuery` 한 줄 교체다. `shared/ui/QueryBoundary`와 `entities/notification`의 조각 넷이 그때의 본보기다.

**기기 확인은 사용자가 나중에 한다.** 막힌 자리는 `.env`의 `EXPO_PUBLIC_SUPABASE_URL`이 `127.0.0.1`이라 폰에서 자기 자신을 가리키는 것이고, LAN 주소로 덮어 띄우면 된다(`EXPO_PUBLIC_SUPABASE_URL=http://$(ipconfig getifaddr en0):54321 pnpm dev`). 다만 맥과 기기가 같은 Wi-Fi여야 한다 — Metro는 `--tunnel`로 피할 수 있지만(ngrok 전역 설치가 권한으로 실패한다) 로컬 Supabase는 LAN 주소밖에 길이 없다.

**본보기가 셋이다.**

- **쓰기 조각** — `features/memberAdmin/{ui/MemberSheet.tsx, hooks/useMemberSheet.ts}`. 조각 controller가 초안·보내는 중·실패를 들고 자기 mutation을 부르고 끝나면 `onDone`으로 화면에 알린다
- **읽기 조각** — `entities/notification/{services/useUnreadCountSuspenseQuery.ts, hooks/useUnreadCountLine.ts, ui/UnreadCountLine.tsx, utils/spellUnreadCount.utils.ts}`. 다만 이 자리만 `useSuspenseQuery`고 나머지는 `useQuery`로 간다
- **경계** — `shared/ui/QueryBoundary.tsx`가 `Suspense`·ErrorBoundary·`QueryErrorResetBoundary`를 묶는다. `retry`가 쿼리의 에러 상태까지 되돌린다

**옮기지 않기로 한 것 둘.**

- **`useDayDetail`의 mutation 아홉.** `pick → commit → pending → run`을 지나고 확정 버튼 하나가 pending의 종류에 따라 넷 중 하나를 고른다. 조각이 mutation 하나를 삼키는 꼴이 아니라 옮기려면 653줄과 그 테스트 611줄을 다시 짜야 한다
- **`pending`의 폼 로직.** 형제 셋이 같은 상태를 읽는다 — `PendingSummary`가 굳은 칸을, `PendingEditor`가 열린 칸을, BottomCTA가 `canSubmit`을 본다. 아무도 혼자 가질 수 없다

**읽기 묶음이 먼저 판정할 것이 관찰 065다** — `features` 사이를 잇는 계산의 집이 없다. `paidMinutes` 하나를 `scheduleAdmin`의 세 파일이 당기고 `screens`가 `features`의 계산을 모으는 파일이 여덟이다. 그것은 use case가 아니라 도메인 지식이라 `entities`로 내려갈 자리일 수 있고, 읽기 이동이 같은 벽을 또 밟는다.

**받아 둘 꼬리가 다섯이다.**

- `useMyProfileRowQuery`의 이름이 거짓이 됐다 — `Profile`을 돌려주면서 `Row`를 든다. 당기는 자리가 여덟이고 `useMyProfileQuery`와 가르는 축이 「한 행인가」가 아니라 「연락처가 붙었나」라 타입 이름 둘까지 같이 움직인다
- 테스트 아흔여덟이 `jest.fn<(...args: unknown[]) => Promise<unknown>>()`로 mock해 픽스처의 꼴을 아무도 안 본다(관찰 061)
- `PENDING_COPY.alreadyDecided`와 `DETAIL_SHEET_TOAST.alreadyDecided`가 같은 문구를 두 자리에 든다. 차단 풀기까지 조각으로 가면 합친다
- `MEMBER_SHEET_COPY.adminBadge`가 `features/memberAdmin`과 `screens/members`에 복사돼 있다. `MemberRows`가 `entities/member/ui`로 가는 묶음에서 합쳐진다
- `CLOCK_LENGTH = 5`가 세 자리에 산다(`rehearsal/utils`·`features/rehearsalEdit`·`scheduleAdmin/utils`)

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
