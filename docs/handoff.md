# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**리팩터링 묶음 여덟의 순서가 정해졌다** — [triage 제안](proposals/codebase-refactor-triage.md)이 `accepted`고 결정 다섯을 든다. `src/` 781 파일을 네 축으로 전수 조사한 결과가 거기 있다. **층 규칙은 지켜지고 고칠 것은 경계 안에 쌓인 중복과 한 자리에 모인 무게다.**

순서는 A(값이 틀리는 축) → B(mutation 뒤처리) → C(재수출 걷기) → E·F(중복·경로) → D·G·H다. backlog 행 여섯이 그 묶음을 든다 — `mutation-settle-shape`·`reexport-launders-layers`·`route-paths-one-home`·`screens-calc-placement`(선행이 걸려 `blocked`)·`controller-common-hooks`·`fragment-state-contract`.

**A가 돌고 있다** — `spell-number-shared`가 `active`고 [plan](3-build/plans/spell-number-shared.md)이 AC 다섯을 든다. 브랜치 `feat/spell-number-shared`에 실패 테스트 일곱 벌이 섰고 구현이 그것을 받았다. 시간 길이를 말로 옮기는 손이 다섯인데 정본과 맞는 것이 `features/adjustment`의 `spellHours` 하나고, 그 본문이 `shared/utils/spellNumber.ts`의 `spellDuration`으로 올라간다. `periodSpan`의 `2026-02-31`이 같이 간다. **A의 뒤쪽 절반이 아직 안 섰다** — 매퍼 여섯의 짝 테스트와 `PushReachableRow` 세 사본, `Holiday` 이름 가르기다.

**`fragments-own-their-data`가 여전히 `active`고 읽기 묶음이 남긴 자리 넷이 D·G·H와 엮인다** — [plan](3-build/plans/fragments-own-their-data.md), [backlog 행](backlog.md). 쓰기 묶음은 [PR #514](https://github.com/tkyoun0421/la-bie-belle/pull/514)로 merge됐다.

**하나 — `scheduleAdmin`의 조각 열둘.** `DayDetailPositionRow` 타입이 `screens/scheduleAdmin/model/dayDetail.type.ts`에 살고 그 타입이 features 슬라이스 셋(`adjustment`·`scheduleAssign`·`scheduleConfirm`)을 당긴다. `entities`는 `screens`를 모르고 `features`끼리 못 당긴다. 계산 자체(`positionRows.utils`·`dragId.utils`)는 깨끗하다 — 막는 것은 입력 타입 하나다. `useScheduleAdminScreen`이 594줄로 가장 크고 `useDayDetail`이 655줄이다.

**둘 — 통계 화면이 같은 달의 급여를 두 경로로 계산한다.** 추이 그래프가 열두 달을 화면 꼭대기에서 맞추고 `trendValueLabel`이 탭마다 「비었나」를 알아야 하는데 그 판정이 조각의 판정과 같은 계산이다. 질의키가 같아 통신은 안 늘지만 파생 계산이 두 자리에 산다. 차트의 `values.get(month)`로 대신할 수 없다 — 남의 근무만 있는 달은 값이 `0`으로 서고 조각은 empty를 낸다. `TrendChart`를 조각으로 올리는 일이다. 거기에 단언 하나가 매달려 있다 — `trendValueLabel`이 `totalLabel`과 글자까지 같다는 보호가 「단위를 담는다」로 약해졌고, 두 값이 한 자리에서 나오면 코드가 지킨다.

**셋 — 관찰 066이 열려 있다.** 병렬 worktree가 로컬 DB 하나를 공유해 integration 결과를 못 믿는다 — 고칠 길 셋을 [그 문서](observations/066-parallel-worktrees-share-one-local-db.md)가 든다. `getWageRates.api.integration.test.ts`는 혼자서도 반복 실패해 경합이 아닐 수 있다 — 시급 이력 날짜 셋(`2013-01-30`·`2026-09-29`·`2026-12-08`)을 기대하는데 마지막 하나만 온다.

**넷 — 기기 확인은 사용자가 나중에 한다.** RN에서 Suspense fallback이 풀리는지다. `shared/ui/QueryBoundary`와 `entities/notification`의 조각 넷이 그 확인을 기다리고 나머지 조각은 `useQuery`로 돈다. 막힌 까닭은 `.env`의 `EXPO_PUBLIC_SUPABASE_URL`이 `127.0.0.1`이라 폰에서 자기 자신을 가리키는 것이고 LAN 주소로 덮어 띄우면 된다(`EXPO_PUBLIC_SUPABASE_URL=http://$(ipconfig getifaddr en0):54321 pnpm dev`). 맥과 기기가 같은 Wi-Fi여야 한다 — Metro는 `--tunnel`로 피할 수 있지만 ngrok 전역 설치가 권한으로 실패하고 로컬 Supabase는 LAN 주소밖에 길이 없다.

## 재개 맥락

**본보기가 셋이다.** 쓰기 조각은 `features/memberAdmin/{ui/MemberSheet.tsx, hooks/useMemberSheet.ts}` — 조각 controller가 초안·보내는 중·실패를 들고 자기 mutation을 부르고 끝나면 `onDone`으로 화면에 알린다. 읽기 조각은 `entities/payroll/{hooks/useWageRows.ts, ui/WageRows.tsx}`가 `state`를 상태 이름으로 내주는 꼴이고 `features/stats/hooks/useStatsAttendance.ts`가 판별 union으로 쪼갠 꼴이다. 경계는 `shared/ui/QueryBoundary.tsx`가 `Suspense`·ErrorBoundary·`QueryErrorResetBoundary`를 묶는다 — `retry`가 쿼리의 에러 상태까지 되돌려 다시 그려도 같은 에러가 또 던져지지 않는다.

**가름의 축이 「무엇을 아는가」다.** 도메인 하나를 읽으면 `entities`, 바꾸거나 도메인 여럿을 맞추면 `features`, 화면의 생김새면 `screens`다. 먼저 물을 것은 그 슬라이스에 service가 있나다 — 관찰 065가 「집이 없다」로 닫혔다가 `features/payrollCompute`에 `services/`가 없었을 뿐인 것으로 뒤집혔다. 묶음 자리(`screen:` controller를 통째로 받아 상태 이름으로 조각만 고르는 것)와 화면 문안을 든 뼈는 `screens`에 남고, 올라간 목록은 상태마다의 그림을 `ReactNode`로 받는다.

**옮기지 않기로 한 것 둘.** `useDayDetail`의 mutation 아홉은 `pick → commit → pending → run`을 지나고 확정 버튼 하나가 pending의 종류에 따라 넷 중 하나를 고른다 — 조각이 mutation 하나를 삼키는 꼴이 아니다. `pending`의 폼 로직은 형제 셋이 같은 상태를 읽어 아무도 혼자 가질 수 없다.

**검사가 마흔이고 하나를 켜려면 한 커밋에 다섯 자리를 건드린다** — `eslint-rules/<이름>.mjs`·`index.mjs`·`eslint.config.mjs`·`tests/lint/rules.ts`·`docs/4-test/execution.md`. `ruleCatalogue.test.ts`가 살아 있는 `eslint.config.mjs`를 읽어서다. 규칙 39 `house/ui-value-import`와 40 `house/ui-no-router`가 최근에 섰다.

**테스트 프로젝트가 `src/**/ui/__tests__/`를 본다.** `components`와 `logic`의 제외 패턴이 `src/shared/ui/__tests__/`만 집어서 조각이 `entities`·`features`로 가면 그 `.tsx` 테스트가 양쪽에서 빠졌다 — 넓혔으니 조각을 옮기면 짝 테스트가 iOS 환경에서 돈다.

**꼬리는 `backlog.md`의 `duplicated-constants-and-copy`가 받는다** — `CLOCK_LENGTH = 5` 네 자리(집은 `entities/clock/consts`)와 `useMyProfileRowQuery` 오명(`Profile`을 돌려주며 `Row`를 든다, importer 여덟)이다. `features/stats`에 같은 일을 하는 utils 쌍 둘이 나란히 있다 — `monthAttendanceLine` ↔ `adminAttendanceLine`과 `attendanceRatioShares` ↔ `adminAttendanceShares`(뒤 쌍은 읽는 상수만 달랐고 그 상수마저 값이 같았다). 합치면 테스트를 지워야 해서 안 합쳤다. `agendaRow.utils`의 `filterAgendaDays`는 짝 테스트 말고 부르는 데가 없다. 관찰 061의 mock 아흔여덟도 열려 있다.

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. spec 파일이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다 — `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**backlog 행이 「미작성 — 행이 완료 조건이다」인 task는 `src/`가 통째로 막힌다**(관찰 067, 열림). `spec-gate.py`의 `plan_holds_spec()`이 `plans/<슬러그>.md` 안의 `## 완료 조건`만 찾고 `backlog.md` 행은 읽지 않는다. `test-data-isolation`·`chart-math-out-of-tsx` 등 그 문구를 쓴 행이 여럿이라 각각 들어갈 때 plan을 먼저 써야 한다. 훅을 넓히는 길은 택하지 않았다 — 그 훅이 막는 것이 「끝이 어디인지 안 정한 구현」이고 backlog 행의 산문은 AC로 쪼개지지 않는다.

**`backlog.md` 행 본문에 `|`를 쓰지 않는다.** `tests/lint/backlogIds.ts`의 `cells`가 `.split("|")`로 쪼개고 escape를 모른다 — `string \| null`을 적으면 열이 밀려 「상태」 칸이 본문 조각으로 읽히고 `unknown-status`·`missing-prerequisite`가 난다. 타입을 말로 적는다.

**Edge Function을 타입 검사하는 자리가 아직 없다.** `supabase/functions/`가 Deno 런타임이라 `tsconfig.json`이 `exclude`에 두고 CI에 Deno가 없다. `erase-account`와 `import-holidays`가 섰고 `send-push`가 셋째다.

**e2e TDD 훅이 Edit·Write만 보고 Bash를 안 본다**(관찰 054, 열림). 슬라이스 폴더가 camelCase로 바뀐 뒤 훅이 찾는 `tests/e2e/adminStats.yaml`과 실제 `admin-stats.yaml`이 어긋나 화면 다섯이 Edit·Write로 영영 못 열렸는데, 그 사이의 수정이 `perl -pi`로 지나가서 막힌 줄 몰랐다.

**`internal` 스키마의 실제 방어는 두 겹뿐이다** — PostgREST 라우팅과 스키마 USAGE고 문서가 요구하는 함수 revoke는 안 서 있다. `internal-grants-public` candidate가 고칠 길까지 적어 뒀다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e·Suspense), NCP 대표 계정과 지도 키, 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더. Edge Function 배포 뒤 손 확인(`profile-erasure`의 AC-03)이 더해졌다.

회차 기록은 [docs/log/2026-10-09-2.md](log/2026-10-09-2.md)다 — 쓰기 조각이 `features`·`entities`로 가고 조각 controller 48개가 섰다(#514). 그 앞은 [docs/log/2026-10-09.md](log/2026-10-09.md)(DTO 매퍼와 `.tsx` 조립 전환, #510~#512)와 [docs/log/2026-10-08.md](log/2026-10-08.md)와 [docs/log/2026-10-01.md](log/2026-10-01.md)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
