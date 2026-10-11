# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**[선언형 제안](proposals/declarative-refactor-triage.md)의 묶음 둘이 닫혔고 셋째가 계획까지 섰다.** `src`·`scripts`·`supabase/functions`의 818 파일을 TypeScript AST로 전수 훑어 명령형 꼴 여덟을 셌다.

**`declarative-accumulation`이 `done`이다**([PR #533](https://github.com/tkyoun0421/la-bie-belle/pull/533) · [#535](https://github.com/tkyoun0421/la-bie-belle/pull/535)). 35자리를 열어 스물둘을 바꾸고 아홉을 안 바꿨다. 공용 손 둘이 `shared/utils/collect.ts`에 섰고(`groupBy` · `countBy`), 계산 다섯이 `hooks`와 `ui`에서 제 층으로 내려갔다. **`Map.groupBy`를 안 쓴다** — `tsconfig`가 `ESNext`를 줘서 타입 검사는 통과하는데 Hermes v0.17.0에 폴리필이 없다([관찰 068](observations/068-type-lib-is-wider-than-hermes.md)).

**다음 수는 [`list-state-follows-fragments`](3-build/plans/list-state-follows-fragments.md)다** — 계획이 섰고 아직 실패 테스트가 없다.

**이것이 `fragment-triple-one-hand`의 남은 절반이다.** 그 task가 조각 controller 열아홉을 `fragmentOf`와 `FragmentView`로 옮기고 **화면과 `entities`의 목록 상태는 안 건드렸다.** 그래서 `.tsx`에 그 task가 지운 꼴이 그대로 남아 있다.

```tsx
if (screen.listState === "loading") { … }
if (screen.listState === "failed")  { … }
if (screen.listState === "empty")   { … }
```

`*ListState`와 `*Body` **여덟**이 평평한 글자 union이고 **상태 이름 자리에 준비됐을 때의 데이터가 올라와 있다** — `StatsListState`가 탭 셋을 거기 둬서 여섯 갈래고 `NotificationsListState`는 일곱이다. ADR-016:108이 그것을 이미 다스린다: 「가지를 늘리고 싶은 것은 대개 상태가 아니라 그 가지의 데이터다」. **ADR-016의 적용 범위를 「어느 그림을 그릴지 고르는 controller 상태」로 넓혀 적었다.**

읽는 자리 31 · 짝 테스트 단언 30이라 **묶음 1(19자리)과 비슷한 크기다.**

**깊은 삼항 넷이 그 task로 사라진다.** 5갈래 평평 union을 만들려니 4겹 삼항이 필요했던 것이다 — `usePayrollScreen:74`이 그 꼴이고, `useStatsScreen:225`는 **`tab`을 `ready` 밖에서 읽을 수 있어서** 생긴 자리라 union으로 가두면 없어진다.

**규칙 45가 그 여덟을 한 번도 안 봤다.** `eslint-rules/fragmentStateContract.mjs:8`이 `endsWith("Controller")`로 걸러서다. **범위를 접미사 셋(`Controller`·`ListState`·`Body`)으로 넓히면 여덟이 걸리고 거짓 양성이 0이다.** 어휘로 거르면 안 된다 — 읽기 상태 어휘를 쓰는 별칭 열여섯 가운데 **아홉이 거짓 양성**이고 `AttendanceStatus`·`MemberKind`의 `pending`은 「승인 대기」라는 도메인 상태다.

- [`guard-chains-to-policies`](backlog.md) — 중첩 삼항의 나머지다. AST로 세니 **스물아홉**(4겹 1 · 3겹 7 · 2겹 21)이고 **깊이가 축이 아니라 묻는 질문이 축이다.** 꼴이 다섯으로 갈려 「표로 바꾼다」는 일부만 맞는다 — 가드 사슬은 이른 `return`, 태그 붙은 값 만들기는 `.policy.ts`, 판정은 `model`이고 **첫 일치가 이기는 꼴만 표가 맞는다**
- [`as-assertions-to-guards`](backlog.md) — `as` 단언 **서른넷**이다(열셋으로 센 것은 `grep` 한 줄 출력에 걸린 셈이었다). 가장 나쁜 자리는 `shared/utils/theme.utils.ts:5`(한 줄에 둘)와 `shared/ui/Illustration.tsx`의 `as unknown as`다. **고차 함수가 이 문제를 푼다** — 글자 union을 `includes`로 좁히면 가드 안에서 `as`가 다시 필요해지는데, `memberOf(THEMES)` 하나가 그 `as`를 **한 자리에 가두면** 열세 자리에 흩어지지 않는다
- [`effect-derived-values`](backlog.md) · [`modern-react-hooks`](backlog.md) — **둘을 붙여 간다.** 건드릴 파일이 같아서다. `useEffectEvent`가 걷는 것이 의존 배열이고 `effect-derived-values`가 걷는 것이 그 배열에 매달린 `setState`다. **`react`가 19.2.3이라** `useEffectEvent`·`use`·`useOptimistic`·`useActionState`를 쓸 수 있는데 **맞는 것이 셋**이다 — `useActionState`·`useFormStatus`는 웹 `<form>` action용이고, `useOptimistic`은 TanStack Query가 이미 mutation 상태를 들어 되돌리기가 두 체계에 걸치고, `useDeferredValue`는 **느리다는 측정이 없다**
- [`post-refactor-audit`](backlog.md) — **묶음이 다 닫히면 저장소 전체를 다시 감사한다.** 셈은 스크립트가 한다 — 앞선 두 감사에서 LLM이 센 수가 틀렸고 AST로 다시 세서야 맞았다
- [`day-sheet-missing-day-is-not-failure`](backlog.md) — `useDaySheet`가 「질의 실패」와 「그 달에 그 날 없음」을 `failed` 하나로 접어 공용 손이 못 갔다. **`day === null`이 실패인가 빈 것인가가 판정이고** 사용자가 보는 것이 바뀐다
- [`payroll-screen-duplicates-fragment-state`](backlog.md) — `usePayrollScreen:65`가 자식 조각과 똑같은 질의를 똑같은 인자로 부른다. 캐시 키가 같아 통신은 한 번인데 상태를 두 겹으로 센다

### 상시 주의

**전체 suite를 한꺼번에 돌리면 `services`의 query 테스트가 간헐적으로 `waitFor` 타임아웃을 낸다.** 따로 돌리면 통과하고 CI는 초록이다. 이 회차에 subagent 둘이 각자 「내 변경과 무관해 보인다」고 보고했다 — **그 판단을 매번 다시 하는 것이 마찰이라** [관찰 069](observations/069-query-service-tests-flake-under-full-suite.md)에 적었다. 원인은 안 봤다.

**받은 실패 테스트의 `await import` + `@ts-expect-error`는 대상이 서면 걷어야 한다.** 미사용 directive가 되어 `TS2578`로 typecheck를 죽이고, ESM이라 `jest` 전역도 안 들어온다. 이 회차에 두 번 밟았다 — 정적 import와 `import { jest } from "@jest/globals"`로 고친다. **단언은 안 건드린다.**

**[triage 제안](proposals/codebase-refactor-triage.md)의 묶음 여덟은 전부 닫혔다** — A~H가 `done`이다.

- [`identity-threading-into-features`](backlog.md) — `features/stats`의 둘과 `features/payrollCompute`의 하나가 `useMyStanding`을 못 쓴다. `house/no-cross-slice-import`가 `features/stats` → `features/auth`를 막아서다. 부르는 쪽이 `profileId`를 인자로 심어 준다
- [`schedule-deadline-line-duplicate`](backlog.md) · [`vacancy-days-of-duplicate`](backlog.md) · [`attendance-column-dead-code`](backlog.md) — `screens-calc-placement`가 찾고 안 건드린 중복·죽은 코드 셋

`session-error-is-swallowed`는 이미 `ready`로 서 있다 — `useSessionUserQuery`가 `useQuery`의 `error`를 버려 세션 실패가 로그아웃과 구별이 안 된다.

**기존에 남아 있던 두 위험도 그대로다.**

- `scheduleAdmin`의 조각 열둘이 `DayDetailPositionRow`(`screens/scheduleAdmin/model/dayDetail.type.ts`) 때문에 `features` 슬라이스 셋(`adjustment`·`scheduleAssign`·`scheduleConfirm`)을 당겨 못 내려간다. 계산 자체는 깨끗하고 입력 타입 하나가 막는다
- 통계 화면이 같은 달의 급여를 두 경로(차트 집계와 조각의 `empty` 판정)로 계산한다. `TrendChart`를 조각으로 올려야 풀린다

**로컬 전용 실패 하나.** `entities/payroll/api/__tests__/getWageRates.api.integration.test.ts`가 `wage_rates` 이력 셋을 기대하는데 로컬 DB에서는 하나만 온다. `supabase db reset`으로 없어진다 — CI는 매번 새 스택을 띄워 안 겪는다.

## 재개 맥락

**조각의 세 질문과 세 분기가 `shared`의 손 둘에 산다.** `fragmentOf`는 읽기 하나나 튜플을 받고 `empty`의 선택성을 오버로드 넷으로 담는다 — `failed`와 `emptyValue`는 무인자 값 콜백이라 `retry`와 `reason`을 호출부가 클로저로 담아 온다. 가름의 순서는 `error` → `data === undefined` → `empty` → `ready`고 **`error`가 있으면 `data`가 와 있어도 `failed`다.** `FragmentView`는 가지 순서를 `ready` → `failed` → `empty`로 두어 남는 것이 `pending`이다 — 닿지 않는 기본 분기가 없다.

**공용 손을 Controller 타입으로 쓰면 규칙 45가 꺼진다.** `house/fragment-state-contract`가 별칭의 annotation이 `TSUnionType`이나 `TSTypeLiteral`일 때만 가지를 본다. 그래서 **Controller 타입은 파일마다 인라인 union으로 남기고 손은 값만 만든다.** 그 규율을 `house/controller-type-not-generic`(46)이 지킨다 — 가름이 「타입 인자가 붙었나」라서 한 파일의 AST로 끝난다. 타입 인자 없는 맨 이름 별칭(`= MemberWaitRowsController`)은 통과한다.

**`.tsx` 둘은 손을 안 쓴다.** `entities/member/ui/MemberRows.tsx`는 `empty` 가지에서 `reason`에 따라 주변 UI를 같이 그릴지 가르고, `entities/profile/ui/ProfileCard.tsx`는 조기 반환이 아니라 부분만 가른다.

**정본에서 떨어진 조각 자리가 하나 남아 있다.** `screens/payroll/hooks/usePayrollScreen.ts:74`가 조각들과 같은 질문 넷을 묻는데 **4겹 삼항**이고, 타입이 판별 union이 아니라 **납작한 글자 union**이며, 이름이 `pending`이 아니라 **`loading`**이다. 규칙 45가 못 잡는 까닭은 그 별칭이 `*Controller`가 아니라 `PayrollListState`라서다. `payroll-screen-duplicates-fragment-state`가 그 자리를 든다.

**빠짐을 막는 검사가 저장소에 0건이다.** 생성된 DB 타입 밖에 `never`로 막은 자리가 없다. 나란한 `if`로 union을 가르면 가지가 늘 때 마지막 `return`이 조용히 받는다 — 지금은 `ready`가 데이터를 들어 타입이 대개 잡지만, 데이터 없는 가지를 더하면 안 잡는다.

**가름의 축이 「무엇을 아는가」다.** 베껴 선언한 타입도 아는 것이고, 인자는 그 타입을 당길 때만 셈이고, 화면 문안을 내면 그 화면을 아는 것이고, 조각이 호출부와 맺는 props 타입(투영)은 베낀 것이 아니고, 인자가 평평해도 그 값이 한 자리에서만 오면 거기를 아는 것이다. 조항 전부가 [ADR-016](2-design/adr/ADR-016-fragments-own-their-data.md)에 섰다. [ADR-015](2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 세그먼트 열에는 비동기만으로는 `lib`이 아니라는 것과, 받은 손을 순서대로 부르는 것은 controller의 일이라는 것이 더해졌다.

**조각 controller의 상태는 판별 union 하나, 이름은 넷(`pending`·`failed`·`empty`·`ready`)과 쓰는 중 하나(`sending`)다.** 실패는 `failedLine: string | null`이다. 본보기는 `features/stats/hooks/useStatsAttendance.ts`, 규칙은 `house/fragment-state-contract`(45)가 지킨다.

**controller 공용 훅 다섯이 섰다.** `useServerNow`(`entities/clock`)·`useToast`(`shared/hooks`, `{ kind, message } | null`)·`useMonthCursor`(`shared/hooks`)·`useMyStanding`(`features/auth`)·`useCloseSheetOnSuccess`(`shared/hooks`). 토스트 `kind`는 「해냈나」로 가른다 — 끝낸 일을 알리면 `success`, 안 됐거나 그냥 알려주면 `info`다. `kind`를 단언하는 테스트가 없던 자리라 바뀌는 날 조용히 틀릴 수 있으니 고칠 때 `toast?.kind`도 같이 본다.

**mutation의 `onSuccess` 뒤처리는 둘로만 모인다.** 키 하나면 그 프로미스를 그대로 돌려주고, `staleTogether` 루프는 `Promise.all`로 함께 기다린다. 사용자가 누르는 「다시」(`refetch`)는 이 축 밖이고 규칙(`house/mutation-settle-shape`, 41)도 `onSuccess` 안만 본다.

**경로 글자는 `shared/consts/navigation.const.ts` 한 집이다.** `house/no-route-path-literal`(44)이 `src/app/` 밖의 경로꼴 리터럴을 막는다. `"/"` 하나는 경로인지 구분자인지 AST로 못 갈라 기계가 못 막는다 — `resolveAdminGuard.policy.ts`의 `AdminGuardMove`가 그 자리고 사람이 본다.

**검사가 마흔여섯이고 하나를 켜려면 한 커밋에 다섯 자리를 건드린다** — `eslint-rules/<이름>.mjs`·`index.mjs`·`eslint.config.mjs`·`tests/lint/rules.ts`·`docs/4-test/execution.md`. 베낀 도메인 꼴을 막는 검사는 못 세웠다 — ESLint가 파일 하나의 AST만 보고 `tests/lint/`로 재도 거짓 양성이 안 사라진다(규칙 3이 import를 막아 베낄 수밖에 없는 자리가 대부분이었다).

**CI가 job 넷(`checks`·`bundle`·`db`·`secrets`)으로 병렬이다.** `impact.yml`이 PR 본문의 「영향 확인」만 따로 보고, `db`는 `api/`에 안 닿는 변경이면 건너뛴다. 생성 타입 대조가 `database-types.ts`(없는 경로)를 보던 죽은 게이트였던 것을 고쳐 `databaseTypes.ts`를 본다. **브랜치 보호의 필수 검사는 `ci`와 `impact` 둘이다** — 영향 확인 절이 없는 PR은 merge되지 않는다.

**`grep` 한 줄로 셀 때 여러 줄 import·여러 줄 타입 선언 안의 이름이 안 보인다.** 이번 회차에 다섯 번 틀렸다. 경유지·이름으로 파일을 먼저 찾고(`grep -rl`) 그 파일을 열어 세는 쪽이 맞다.

**본보기 셋.** 쓰기 조각은 `features/memberAdmin/{ui/MemberSheet.tsx, hooks/useMemberSheet.ts}`. 읽기 조각은 `entities/payroll/hooks/useWageRows.ts`(상태 이름)와 `features/stats/hooks/useStatsAttendance.ts`(판별 union). 경계는 `shared/ui/QueryBoundary.tsx`다.

**옮기지 않기로 한 것들.** `useDayDetail`의 mutation 아홉은 `pick → commit → pending → run`을 지나 조각 하나로 못 접힌다. `pending`의 폼 로직은 형제 셋이 같은 상태를 읽어 아무도 혼자 못 가진다. `adjustSheetRows.utils.ts`·`stats/utils/chartValues.utils.ts`는 `features` 둘을 당겨 규칙 3이 양쪽을 막아 `screens`에 머문다.

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시키고, spec이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다. backlog 행이 「미작성 — 행이 완료 조건이다」인 task는 plan을 먼저 써야 `src/`가 열린다(관찰 067, 열림 — 056과 함께 `.claude/hooks/spec-gate.py`를 target으로 든 관찰이 둘이라 증축 문턱 셋에는 아직 못 미친다).

**`backlog.md` 행 본문에 `|`를 쓰지 않는다.** `tests/lint/backlogIds.ts`의 `cells`가 `.split("|")`로 쪼개 escape를 모른다.

**Edge Function을 타입 검사하는 자리가 없다.** Deno 런타임이라 `tsconfig.json`이 `exclude`하고 CI에 Deno가 없다. `erase-account`·`import-holidays`가 섰고 `send-push`가 셋째다.

**e2e TDD 훅이 Edit·Write만 보고 Bash를 안 본다**(관찰 054는 archive로 갔지만 같은 성격의 재발 가능성은 남는다). `internal` 스키마의 실제 방어는 PostgREST 라우팅과 스키마 USAGE 둘뿐이고 함수 revoke는 안 서 있다 — `internal-grants-public` candidate.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e·Suspense), NCP 대표 계정과 지도 키, 3D 석 장, 로컬 Supabase 구글 프로바이더.

회차 기록은 [docs/log/2026-10-10.md](log/2026-10-10.md)다 — 리팩터링 묶음 여덟이 전부 닫히고 CI가 넷으로 쪼개졌다(#516~#528). 그 앞은 [docs/log/2026-10-09-2.md](log/2026-10-09-2.md)(쓰기 조각이 `features`·`entities`로 가고 조각 controller 48개, #514)와 [docs/log/2026-10-09.md](log/2026-10-09.md)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
