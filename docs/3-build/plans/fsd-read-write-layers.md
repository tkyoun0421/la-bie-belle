---
sources:
  - ../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md
  - ../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md
  - ../../2-design/system/runtime.md
---

# FSD 층 재편 — 구현 계획

[ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)를 코드에 전개한다. 이름을 camelCase로 바꾸고, 캐시 키를 팩토리로 모으고, 세그먼트를 여덟로 모으면서 성격 접미사를 같이 달고, 층의 뜻을 읽기와 쓰기로 가르고, 타입을 빼내고, 뭉친 슬라이스를 쪼갠다.

## 입력 명세·기준

**정본은 ADR-015다.** 층의 뜻, 세그먼트 여덟의 판정 기준, 슬라이스 쪼개는 기준, 이름 규약, 검사 열둘이 거기 산다. 이 계획은 그것을 몇 번에 나눠 어떤 순서로 옮기는지만 적는다.

**저장소에서 확인한 것.**

- `entities/*/dals/` 74개 — 읽기 24 · 쓰기 49 · **둘 다 하는 파일 0** · 손 판정 1
- `features/*/model/use*.ts` 58개 — 쿼리만 17 · 뮤테이션만 37 · **둘 다 하는 파일 0** · 손 판정 4
- `rpc()`를 부르는 dal 49개와 `from()`을 쓰는 dal 25개가 **한 파일에 겹치지 않는다**
- import 1658개 중 1654개가 `@/` 절대 경로다. 상대 경로는 4개
- 바뀌는 import — `dals/` 273줄 · `features/*/model/` 331줄 · `shared/lib/` 198줄
- 이름이 바뀌는 파일 535개 — `src` 450(`src/app/` 밖) · `tests` 59 · `scripts` 13 · `eslint-rules` 13
- 이름이 바뀌는 폴더 5개 — `screens/`의 `admin-home`·`admin-stats`·`members-pending`·`schedule-admin`·`schedule-worker`. `eslint-rules`는 밖이다
- 타입 선언 360개가 파일 192개에 산다
- `Db` 타입을 쓰는 자리 149개 파일 319회. 파일 이름에는 안 들어간다
- `queryKeys.ts`가 여섯 군데에 산다 — `features/`의 `schedule`·`notification`·`payroll`·`profile`·`members`·`rehearsal`. dal 여섯이 키 함수를 따로 들고 있고 `features/stats`는 문자열을 다시 적는다
- 실제 경로를 박은 검사·스크립트 넷 — `scripts/syncEdgeShared.mts`, `eslint-rules/noNodeImportInEdgeShared.mjs`, `tests/lint/attendanceConstants.ts`, `eslint-rules/noVisualUtilityClass.mjs`

**Git 기준점**은 ADR-015가 merge된 커밋이다.

## 완료 조건

### AC-01 — 파일 이름이 camelCase가 된다 ✅

- 전제: `tests/lint/fileNaming.ts`가 kebab-case를 요구하고 535개 파일이 그 꼴이다
- 행동
  - `fileNaming.ts`의 `kebab` 갈래를 `camel`로 바꾼다 — `matchesStyle`은 `/^[a-z][a-zA-Z0-9]*$/`, `toStyle`은 조각을 camel로 합친다
  - 그 검사가 내놓는 `suggestion`대로 `git mv`하고 import를 치환한다
  - `Db` 타입을 `DB`로 바꾼다
  - 자기 이름이 바뀌는 파일 둘을 같이 옮긴다 — `tests/lint/fileNaming.ts` → `fileNaming.ts`, `tests/lint/fileNaming.test.ts` → `fileNaming.test.ts`
- 관찰 결과: `pnpm test -- fileNaming`이 초록이고 하이픈 든 파일이 `src/app/` 밖에 없다. `pnpm lint`·`pnpm typecheck`·`pnpm test` 셋이 초록이다
- `src/app/`은 안 건드린다 — Expo Router가 파일 이름을 URL로 읽고 `/check-in`은 종이 QR에 실려 나간다
- 왜 먼저인가: 뒤 묶음이 파일을 만들고 옮긴다. 이름 규칙이 먼저 바뀌어야 그 파일들이 새 꼴로 선다
- 돌면서 나온 것 — **ESLint 규칙 이름은 kebab으로 되돌렸다.** 일괄 치환이 `house/dumb-ui` 같은 규칙 ID까지 먹었는데 그것은 파일 이름이 아니라 생태계 식별자고 소스의 `eslint-disable` 주석이 그 이름을 쓴다. 규칙 파일은 camel, 등록 키는 kebab이다
- 돌면서 나온 것 — **`fileNaming.test.ts`의 픽스처가 정답으로 뒤집혔다.** 그 파일 주석이 그 위험을 미리 적어뒀고(「일괄 치환이 이 파일을 지나가면 픽스처가 정답으로 바뀌어 단언이 조용히 무의미해진다」) 실제로 났다 — `kebabWanted`를 `camelWanted`로 뒤집었다

### AC-02 — 폴더 이름이 camelCase가 된다 ✅

- 전제: `screens/`의 슬라이스 폴더 다섯이 kebab이다
- 행동
  - `git mv`로 `admin-home`·`admin-stats`·`members-pending`·`schedule-admin`·`schedule-worker`를 camel로
  - `fileNaming.ts`에 폴더 이름 검사를 더한다 — `src/app/`과 `eslint-rules/`는 밖이다
  - `src/app/`의 라우트 파일이 그 폴더를 import하는 자리를 고친다
- 관찰 결과: 하이픈 든 폴더가 `src/app/`과 `eslint-rules/` 밖에 없다. 셋이 초록이다
- `screens/` 슬라이스가 라우트와 1:1인 것은 그대로다 — `/admin-home` 라우트의 슬라이스가 `screens/adminHome`이다
- 범위의 첫 조각은 검사 밖이다 — `src`·`tests`·`scripts`·`eslint-rules`는 저장소 맨 위 이름이고 마지막은 ESLint 플러그인 이름이다. `__tests__`도 밖이다: Jest가 그 이름으로 짝 테스트 자리를 알고 `tdd-guard-unit.py`가 그 자리를 본다
- 문서는 안 고쳤다 — `src/screens/<kebab>`을 글자로 적은 문서 열둘이 전부 완료된 plan과 보관된 관찰이다

### AC-03 — 캐시 키가 팩토리 하나가 된다 ✅

- 전제: `queryKeys.ts`가 `features/` 아래 여섯 슬라이스에 흩어져 있고, dal 여섯이 키 함수를 따로 들고, `features/stats`는 문자열을 다시 적는다
- 행동
  - 여섯을 `src/shared/api/queryKeys.ts` 하나로 모으고 **팩토리 객체**로 쓴다 — `queryKeys.schedule.all`과 `queryKeys.schedule.month(month)` 꼴
  - dal의 키 함수 여섯(`dayAttendanceKey`·`monthAttendanceKey`·`myExcusesKey`·`qrCodeKey`·`payrollMonthKey`·`firstScheduleMonthKey`)을 빼고 팩토리 항목으로 옮긴다
  - 배열 리터럴로 키를 적은 자리를 전부 팩토리 호출로 바꾼다
  - 키 문자열을 [runtime.md](../../2-design/system/runtime.md#tanstack-query-규칙)의 꼴과 대조한다
- 관찰 결과: 키 문자열이 하나만 바뀌고 그것은 정본이 정한 꼴로 돌아간 것이다(아래). `pnpm test`가 초록이고 캐시 무효화 동작이 그대로다. 여섯 파일이 사라지고 하나가 선다
- 왜 여기인가: 쓰기 슬라이스가 성공한 뒤 낡게 할 키는 읽기 슬라이스의 것이고, `no-cross-slice-import`가 그 import를 막는다. 이것이 안 서면 AC-07이 막힌다
- 돌면서 나온 것 — **키 하나를 정본 쪽으로 되돌렸다.** `useMyAvailability`와 `useMonthAvailabilities`가 `['availability', month]`를 나눠 쓰는데 내놓는 모양이 달라, 한 세션에서 둘이 돌면 먼저 캐시에 든 쪽이 이긴다. [schedule/design.md](../../2-design/modules/schedule/design.md#소유-데이터)가 「맨 키는 본인 신청, 관리자 현황은 `'all'`」을 이미 적어 뒀고 리허설은 그대로 지키는데 근무 신청만 어긋나 있었다 — 관리자 쪽을 `['availability', month, 'all']`로 내렸다. 접두사가 겹쳐 무효화 동작은 그대로다([관찰 045](../../observations/045-two-queries-share-one-cache-key.md))
- 돌면서 나온 것 — **정본 충돌을 고쳤다.** `runtime.md`가 「도메인 파일이 각자의 키를 적는다」고 적어 ADR-015의 팩토리 결정과 부딪혔다. 그 줄을 팩토리로 고쳤다 — 조항이 선 뒤 슬라이스 import를 막는 규칙이 생겨 같은 상수가 복제됐고 그 복제가 위 결함의 바탕이다
- 돌면서 나온 것 — **무효화 묶음은 키가 아니라 정책이라 이름을 갈랐다.** `staleTogether.scheduleWrite`·`rehearsalWrite`가 그 자리고, 어느 쓰기가 어느 키를 낡게 하느냐의 결정은 영역 design이 그대로 가진다

### AC-04 — 통신이 `api/`로 모이고 `.api.ts`가 된다 ✅

- 전제: 데이터 접근이 `entities/*/dals/` 일곱 폴더에 있고 `features/stats/api/`에는 훅이 하나 앉아 있다
- 행동
  - `entities/*/dals/` 74개를 `entities/*/api/`로 옮기면서 이름을 `[action].api.ts`로 바꾼다
  - 짝 테스트도 같이 — `getMonthSchedule.api.test.ts`·`getMonthSchedule.api.integration.test.ts`
- 관찰 결과: `dals` 폴더가 없고 `api/` 아래 모든 파일이 `.api.ts`다. 셋이 초록이다
- 손으로 판정할 하나: `avatarsBucket.ts`는 버킷 주소를 읽고 파일을 올려 둘을 다 하는데, 둘 다 통신이라 `api/`다
- `features/stats/api/useStatsQueries.ts`는 **접미사를 안 받는다** — 통신이 아니라 쿼리 훅이고 AC-05가 그 자리를 다시 정한다. 앞선 판이 이 자리에 접미사를 붙이라고 적었는데 그러면 훅에 `.api`가 달린다
- 돌면서 나온 것 — **문서 링크 26건이 깨졌다.** 완료된 plan 스물셋이 dal 파일을 상대 경로로 걸고 있었다. 「과거 계획은 소급 변경하지 않는다」의 예외로 링크만 고쳤다 — 누른 사람이 404를 보고 `docLinks.test.ts`가 빨개진다

### AC-05 — 훅이 `hooks/`로 가고 층이 갈리고 접미사가 붙는다 ✅

- 전제: 훅 59개가 `features/*/model/`에 순수 계산과 섞여 있고, 읽는 dal과 그 쿼리 훅이 두 층에 떨어져 있다
- **쓰는 통신 45개가 여기서 두 번째로 움직인다.** 「각 파일이 한 번만 움직인다」의 예외고 `no-cross-slice-import`가 그렇게 가른다 — 쓰는 통신을 `features/<슬라이스>/api/`로 올리면 그것을 부르는 뮤테이션 훅이 같은 슬라이스에 있어야 하는데, 지금 훅은 다른 슬라이스의 `model/`에 있고 같은 층 슬라이스끼리 import는 규칙이 막는다. 통신과 그 훅이 같은 걸음에 가야 한다. 이름은 AC-04에서 한 번만 붙었고 이 걸음은 자리만 바꾼다
- **슬라이스 이름은 이 걸음에서 안 건드린다.** 뮤테이션 훅이 지금 사는 슬라이스가 그 통신의 슬라이스고, 쪼개고 이름을 고치는 일은 AC-07이 한다 — 자리와 이름을 한 걸음에 다 바꾸면 어느 쪽이 깨뜨렸는지 못 가린다
- 행동
  - 쿼리 훅 20개를 `entities/<도메인>/hooks/`로 내리고 `use[Action]Query.ts`로 — **export 이름도 같이 바뀐다.** 스물한째인 `useStatsQueries`는 아래 「손으로 판정할 여섯」이 가른다
  - 뮤테이션 훅 37개를 `features/<지금 슬라이스>/hooks/`로 옮기고 `use[Action]Mutation.ts`로
  - 쓰는 dal 45개를 `entities/*/api/` → `features/<지금 슬라이스>/api/`로 올린다. 쓰는 것은 50개고 다섯이 남는다 — 아래가 그 까닭을 든다
  - 호출부(`screens/`·`src/app/`)의 훅 이름을 다 고친다
- 관찰 결과: `entities/`에 `useMutation`이 없고 `features/`에 `useQuery`가 없다. 읽는 dal과 그 쿼리 훅이 같은 슬라이스에 있다. 셋이 초록이다
- 손으로 판정할 여섯
  - `useSavePushToken` — 쿼리도 뮤테이션도 아니고 앱 진입에 주소를 보내는 효과다. 쓰기 쪽이라 `features/pushSwitch/hooks/useSavePushTokenMutation.ts`고, 슬라이스를 `pushSwitch`로 가르는 일은 AC-07 몫이다
  - **부르는 쪽이 없는 쓰기 넷은 `entities/*/api/`에 남는다** — `checkIn`·`submitExcuse`·`decideExcuse`·`setHallLocation`이다. 화면과 훅이 아직 없어 슬라이스를 고를 근거가 없고, 지금 이름을 지어 두면 그 사슬(`attendance-checkin`·`attendance-excuse`)이 제 슬라이스를 정할 때 한 번 더 움직인다. AC-07이 슬라이스를 쪼갤 때 같이 올라간다
    - `removePushToken`만 밖이다 — 부르는 쪽은 없지만 짝 테스트가 `savePushToken`으로 토큰을 깔고 시작해서, 그것이 `features`로 올라가면 `entities`가 `features`를 부르는 꼴이 된다(`no-restricted-imports`). 둘이 한 쌍이라 같이 올라간다
  - 쓰기 다섯은 뮤테이션 훅이 없고 `.tsx`가 직접 부른다 — `approveMember`·`blockMember`·`rejectMember`·`unblockMember`는 `features/members/api/`, `submitProfile`은 `features/profile/api/`다. 같은 슬라이스의 다른 훅들이 이미 거기 있어서다. 훅 없이 부르는 것 자체는 `dumb-ui-widen`이 막을 자리고 이 걸음은 통신의 집만 정한다
  - `usePayrollMonths`·`useRehearsalMonths`·`useScheduleMonths` — 다른 쿼리를 조합해 달 목록을 낸다. 읽기 쪽이라 각 `entities/<도메인>/hooks/use[X]MonthsQuery.ts`
  - `ensureProfile` — 쓰기인데 `entities/profile/api/`에 **남는다.** 「없으면 만든다」가 진입 판정의 일부고 그 판정(`resolveEntryDestination`)은 프로필을 읽어 길을 고르는 조립이라 `features/auth`에 산다. 올리면 `features/auth`가 제 슬라이스 밖의 프로필 쓰기를 들게 되고, 지금 자리는 그 도메인의 통신이 그 도메인에 있는 꼴이다. 뮤테이션 훅이 없으니 「`entities`에 `useMutation` 금지」도 안 걸린다
  - `features/stats/api/useStatsQueries.ts` — 쿼리 훅 넷이 한 파일에 있고 셋은 제 도메인으로 내려가지만 `useAttendanceMonths`는 schedule과 attendance 둘을 함께 읽어 `entities` 어디에도 못 앉는다(`no-cross-slice-import`). 그래서 **파일을 가른다**
    - `useWorkMonths`·`useFirstScheduleMonth` → `entities/schedule/hooks/`, `usePayrollMonthsByMonth` → `entities/payroll/hooks/`
    - `useAttendanceMonths`는 근태 열두 달을 읽는 `entities/attendance/hooks/useMonthsAttendanceQuery.ts`와, 그것을 `useWorkMonthsQuery`와 달마다 맞추는 `features/stats/hooks/useAttendanceMonths.ts`로 갈린다. 맞추는 쪽은 `useQuery`를 안 가져 AC-08의 「`features/`에서 `useQuery` 금지」가 선다
    - 넷이 나눠 쓰는 `MonthsResult`와 `combineMonths`는 `shared/api/monthsQuery.ts`로 — 두 `entities` 슬라이스가 같이 쓰므로 둘 중 한쪽에 둘 수 없다
    - **키 배열 리터럴 둘이 여기 남아 있다** — `[SCHEDULE_KEY, month]`·`[ATTENDANCE_KEY, month]`가 AC-03의 팩토리 전환에서 빠졌다. 파일을 가르는 이 걸음에서 `queryKeys.schedule.month`·`queryKeys.attendance.month`로 바꾼다
    - 이 가름만 커밋을 따로 쓴다 — 나머지 이동은 기계적이고 이것은 모양을 바꾼다
- 돌면서 나온 것 — **`removePushToken`이 짝 테스트에 끌려 올라갔다.** 부르는 쪽이 없어 `entities`에 남길 자리였는데, 그 통합 테스트가 `savePushToken`으로 토큰을 깔고 시작한다. `savePushToken`이 `features`로 가자 `entities`가 `features`를 부르는 꼴이 되어 `no-restricted-imports`가 잡았다 — **부르는 쪽이 없다는 판정에 짝 테스트를 안 셌다.**
- 돌면서 나온 것 — **계획이 `useStatsQueries`를 둘 자리를 규칙에 안 대봤다.** AC-04가 「AC-05가 `entities/stats/hooks/`로 내린다」고 적었는데 그 파일은 entities 세 슬라이스를 함께 읽어 `no-cross-slice-import`에 걸린다. 같은 파일을 두 AC가 연달아 잘못 배치했고([관찰 046](../../observations/046-plan-placement-not-checked-against-rules.md)) 이번에 가르면서 정했다
- 돌면서 나온 것 — **쿼리 훅이 하나도 `features`를 안 당겼다.** 스물이 전부 `entities` 한 도메인과 `shared`만 import해서 내려보내는 데 손이 들지 않았다. 반대로 뮤테이션 훅은 서른여덞이 각자 제 통신 하나만 불러 1:1이었다 — 둘이 기계적으로 갈린 것이 이 묶음을 치환으로 끝낸 바탕이다

### AC-06 — 타입이 빠지고 `model`·`utils`가 갈리고 접미사가 붙는다

**둘로 갈라 AC-07을 그 사이에 끼운다.** 가는 자리를 정리하고 나는 이름을 붙인다 — 까닭은 아래 「구현 순서」가 든다.

#### AC-06가 — `shared/`가 세그먼트로 갈리고 층이 틀린 것이 제 층으로 간다 ✅

- 전제: `shared/lib/` 스물아홉이 세그먼트 없이 한 폴더에 섞여 있고, 그중 열은 기능이나 도메인에 매여 있다. 달 경계를 내는 순수 함수가 dal 넷에 사본으로 흩어져 있다
- 행동
  - `shared/lib/` 스물아홉을 `api`·`hooks`·`utils`로 가른다 — 표는 아래 「shared 재편」
  - 층이 틀린 열을 `features/auth`·`entities/session`·`entities/clock`으로 옮긴다
  - 슬라이스를 가로지르게 만드는 순수 함수를 `shared/utils/`로 뺀다 — `monthStart`·`nextMonthStart`가 지금 dal 넷에 사본으로 산다
  - `features/auth/`에서 세그먼트 없이 슬라이스 루트에 사는 셋(`decideEntry`·`googlePhotoOf`·`resolveEntryDestination`)에 세그먼트를 준다
- 관찰 결과: `pnpm lint`의 `no-cross-slice-import`가 0건이고, `src/` 아래 모든 `.ts`가 세그먼트 다섯 중 하나 안에 산다. 셋이 초록이다
- 왜 여기인가: AC-07의 완료 조건이 「교차 0건」인데 교차를 만드는 함수가 아직 아래층에 사본으로 있다. 그 사본을 먼저 걷어야 쪼개기가 걸리는지 아닌지로 배정을 판정할 수 있다
- 돌면서 나온 것 — **`sessionStorage`는 `shared/api`에 남는다.** 계획이 인증 흐름 다섯에 넣어 `features/auth`로 보냈는데, 그러면 `shared/api/createSupabaseClient`가 그것을 당겨 「`shared`는 `features`를 모른다」에 걸린다. 세션을 만들고 끊는 쓰기가 아니라 클라이언트가 받는 저장소 어댑터고 부르는 쪽도 그 팩토리 하나다 — 떠나는 열이 아홉이 된다
- 돌면서 나온 것 — **`fontLoading`에 훅이 없다.** 계획이 `useFontLoading`으로 이름을 바꿔 `hooks`에 넣으라고 적었는데 그 파일이 내놓는 것은 자산 표와 판정 둘(`shouldRenderApp`·`shouldDismissSplash`)뿐이다. 이름을 안 바꾸고 `utils`로 보냈다. 그 판정이 `utils`에 사는 것은 업무 규칙이 아니고 `shared/`에 `model`이 안 서기 때문이다 — AC-06나의 관찰 결과에 그 범위를 적었다
- 돌면서 나온 것 — **jest 갈래 둘이 ESM 판정 캐시를 나눠 써 스위트 하나가 뜨지 못했다.** `jest-resolve`가 그 판정을 경로만으로 캐시해서, 한 워커가 `logic`과 `components`를 번갈아 받으면 먼저 본 갈래의 답이 다음 갈래에도 적용된다. `cn.ts`처럼 양쪽이 다 쓰는 파일이 그 자리고 묶음 5가 흔들림으로 한 번 봤다. `pnpm test`가 `jest`를 두 번 돌리게 고쳤다([관찰 048](../../observations/048-jest-projects-share-esm-cache.md))
- 돌면서 나온 것 — **쪼갠 뒤 교차가 0이 되는 것을 확인했다.** 배정 표를 파일마다 대보는 스크립트로 세 교차 0·역방향 0이다. 교차를 만들던 둘은 `monthStart` 사본이었고 이 묶음이 걷었다

#### AC-06나 — 타입·검증·상태·판정이 접미사를 받는다 (접미사 ✅ · 타입 빼기 남음)

- 전제: 타입 선언 492개가 파일 186개에 흩어져 있고, `model` 파일 119개 중 88개가 함수와 타입을 같이 든다
- 행동
  - 도메인의 모양을 말하는 타입을 `[domain].type.ts`로 뺀다. 함수 하나의 인자 꼴이나 훅의 반환 꼴처럼 좁은 타입은 그 파일에 남긴다
  - 순수 함수를 판정(`model`)과 꼴 바꾸기(`utils`)로 갈라 옮기고 각자 이름에 `.policy.ts`·`.utils.ts`를 붙인다. **모으는 것은 타입뿐이다** — 판정을 슬라이스 이름으로 모으면 `screens/scheduleAdmin`의 `model/` 23개가 1292줄짜리 한 파일이 되고 짝 테스트 125개가 29개로 합쳐진다. ADR-015가 「한 파일을 열면 그 도메인이 읽힌다」를 논증한 자리도 `.type.ts`뿐이다
  - 바깥 값 검증을 `[domain].schema.ts`로 — `validateProfile`과 홀리데이 API 응답 파싱이 그 자리다
  - zustand store를 `[domain].store.ts`로
- 관찰 결과: `entities/`·`features/`의 `utils/`에 업무 판정이 없다 — 참·거짓이나 허용·금지를 돌려주는 함수가 `model/`에 산다. `shared/utils/`는 밖이다: 글꼴이 떴나·개발 문이 열렸나 같은 판정은 업무 규칙이 아니고 담을 도메인이 없어 `shared/`에 `model`이 안 선다. `[domain].type.ts`를 열면 그 도메인의 모양이 한 파일에서 읽힌다. 셋이 초록이다
- 왜 여기인가: 접미사가 성격을 말하므로 성격을 정하는 이 묶음에서 같이 붙인다. AC-07 뒤인 까닭은 `[domain]`이 슬라이스 이름이기 때문이다 — 쪼개기 전에 모으면 도메인 여섯이 한 파일로 합쳐지고 AC-07이 그것을 다시 가른다
- **접미사 붙이기(묶음 8가)와 타입 빼기(묶음 8나)를 두 PR로 가른다.** 앞의 것은 `git mv`와 지정자 치환이라 기계가 끝내고 rename 추적이 남는다. 뒤의 것은 선언을 파일 밖으로 꺼내 다른 파일에 붙이는 일이라 rename이 아니고 diff가 내용으로 보인다 — 한 PR에 섞으면 123개의 이름 변경 속에서 타입 이동을 읽을 수 없다
- 돌면서 나온 것 — **판정과 꼴 바꾸기의 비율이 거의 반반이다.** 백스물아홉 중 판정 예순하나·꼴 바꾸기 쉰여섯이고, 그 가름이 `model`과 `utils` 두 폴더로 눈에 보이게 됐다. 접미사를 안 받는 여섯은 부작용이 있어 `policy`가 못 되고 통신도 아니다 — 공유 시트를 열고(`exportQrPaper`), 인증을 호출하고(`handleAuthCallback`·`signOut`·`resolveEntryDestination`), OS 권한을 묻고(`pushPermission`), 의존을 묶는다(`pushDeps`). **세그먼트 다섯에 「부작용을 내는 순수하지 않은 손」의 자리가 없다** — 지금은 `model`에 접미사 없이 산다
- 돌면서 나온 것 — **boolean만 보면 판정의 절반을 놓친다.** 반환 타입으로 1차 분류해 보니 boolean을 내는 것이 스물넷인데, 상태 유니언을 내는 판정이 그만큼 더 있었다(`AttendanceStatus`·`ReachState`·`DayConfirmGate`·`RehearsalKind`…). 「참·거짓」이 아니라 「이것이 어떤 상태인가」가 기준이라 자동 분류가 안 되고 파일마다 손으로 봤다

### AC-07 — 슬라이스가 쪼개진다 ✅

- 전제: `features/schedule` 하나에 훅 서른이, `entities/schedule`에 dal 서른이 들어 있다
- 행동: `entities` 7→14, `features` 9→22로 쪼갠다. 슬라이스 폴더 이름은 camel이다
- 관찰 결과: 슬라이스마다 「이 슬라이스는 무엇을 하나」에 한 문장으로 답할 수 있다. `no-cross-slice-import`가 한 건도 안 걸린다 — 걸리면 그 import가 위 층으로 올라가야 하는 조립이다
- `screens/`는 안 쪼갠다
- 돌면서 나온 것 — **`attendanceSummary.ts`가 두 층에 각자 있었다.** 배정 표는 `attendance-summary`를 하나로 적는데 실물이 둘이고 하는 일이 다르다 — `entities` 쪽은 월 집계와 출근율(`tallyMonthlyAttendance`·`attendanceRate`), `features` 쪽은 현황 줄에서 0인 항목을 빼는 것(`summarizeAttendanceStatuses`)이다. 둘 다 읽기 쪽 판정이라 한 슬라이스로 가는데 이름이 겹친다. 부르는 이름을 따라 후자가 `summarizeAttendanceStatuses.ts`를 받았다. 옮기기 전에 목적지가 이미 있는지 보는 줄이 스크립트에 섰다
- 돌면서 나온 것 — **Edge Function 둘이 없는 파일을 부르고 있었다.** 복사 경로를 고치려고 열어 보니 묶음 1이 바꾼 이름을 부르는 쪽이 안 따라갔고, 그 뒤로 묶음 다섯이 지나갔다. `supabase/functions/`가 검사 셋 전부의 밖인 것이 그 까닭이다([관찰 049](../../observations/049-edge-functions-outside-every-check.md))
- 돌면서 나온 것 — **일괄 치환이 마크다운 상대 링크를 안 먹는다.** `"@/..."` 꼴만 바꿔서 문서의 `../../../src/...` 링크 서른둘이 깨졌다. `docLinks.test.ts`가 잡았고, 경로 조각으로 한 번 더 치환했다
- 돌면서 나온 것 — **주석이 가리키는 경로는 아무 검사도 안 본다.** 테스트 머리글의 `// 구현 대상: src/...` 마흔셋이 옮기기 전 자리를 그대로 들고 있었다. import가 아니라 글자라 lint도 typecheck도 안 울고, 링크가 아니라 `docLinks.test.ts`도 안 본다 — 짝 구현 파일을 찾아 주는 유일한 줄이라 틀리면 다음 사람이 없는 파일을 뒤진다. 실재하지 않는 `src/` 경로를 전수로 뽑아 고쳤다

### AC-09 — `lib`이 선다

- 전제: 부작용을 내는 파일이 `model`·`utils`·`hooks`에 흩어져 있다. 플랫폼 SDK를 당기는 열하나, 제가 시계를 읽는 셋, 세션을 조작하는 하나다
- 행동
  - `<이름>.lib.ts`로 이름을 받아 `<층>/<슬라이스>/lib/`으로 옮긴다
  - 묶음 8가에서 **접미사를 못 받은 여섯**이 여기서 집을 얻는다 — `exportQrPaper`·`handleAuthCallback`·`signOut`·`resolveEntryDestination`·`pushPermission`·`pushDeps`
  - 시계를 읽는 셋은 **가른다.** `serverClock.policy.ts`는 시각을 인자로 받아 순수하므로 그대로 두고, `kstDate.ts`의 `kstToday()`처럼 제가 `new Date()`를 부르는 함수만 `lib`으로 뺀다
- 관찰 결과: `entities`·`features`·`screens`의 `model/`과 `utils/`에 `expo-*`·`react-native` import가 없다. `.policy.ts`에 `Date.now`·`Math.random`이 없다. 셋이 초록이다
- 왜 여기인가: `consts`·`config`가 가를 파일 중 일부가 이 묶음에서 먼저 움직인다 — `pushDeps`는 부작용과 환경값을 같이 들어 `lib`으로 간 뒤 그 안에서 환경 읽기가 `config`로 갈린다

### AC-10 — `consts`가 선다

- 전제: `export const <대문자_스네이크>`가 파일 스물여섯에 살고 **그중 스물이 함수와 같이 산다.** `wageAmount.policy.ts` 하나가 업무 상수 하나와 문안 넷과 판정 셋을 든다
- 행동
  - `<도메인>.const.ts`로 모아 `<층>/<슬라이스>/consts/`에 둔다. `[domain]`은 슬라이스 이름이라 슬라이스마다 한 파일이다
  - `<도메인>.type.ts`에 든 상수가 나간다 — 근태 일곱, 알림 넷, 근무표 하나
  - 열거 목록이 타입의 바탕인 자리는 `consts`에 두고 `model`이 import한다(`ERROR_CODES` → `ErrorCode`)
- 관찰 결과: `consts/` 밖에 `export const <대문자_스네이크>`가 없다. `.type.ts`를 열면 타입만 있다. 셋이 초록이다
- `queryKeys`·`staleTogether`는 밖이다 — 통신의 약속이고 꼴이 camel이다

### AC-11 — `config`가 선다

- 전제: 환경값을 읽는 자리가 넷이다 — `readSupabaseEnv`(Supabase 주소·키), `readAppUrl`(앱 주소), `pushDeps`(EAS 프로젝트 id·플랫폼), `authRedirect.utils`(실행 환경)
- 행동
  - `shared/config/`를 세워 `readSupabaseEnv`·`readAppUrl`을 옮긴다. ADR-015의 「캐시 키는 `api`고 설정은 `config`다」가 그 자리를 정한다
  - `pushDeps`와 `authRedirect`에서 환경 읽기만 `<도메인>.config.ts`로 가른다
  - `__DEV__`를 인자로 받는 둘(`isDevDoorOpen`·`isCatalogVisible`)은 **안 건드린다** — 받아서 판정하는 꼴이라 이미 순수하다
- 관찰 결과: `config/` 밖에 `process.env`·`Constants` 읽기가 없다. 셋이 초록이다

### AC-12 — `screens`에 `hooks`가 선다

- 전제: `.tsx` 마흔여섯이 상태·효과를 들고 호출이 **이백아흔둘**이다(`screens` 252 · `app` 22 · `shared` 17 · `features` 1). `DayDetail.tsx` 하나가 서른셋을 든다
- 행동
  - 화면마다 `screens/<슬라이스>/hooks/use<화면>.ts`를 세워 `useState`·`useEffect`·`useMemo`·`useCallback`·`useReducer`와 핸들러를 옮긴다. `.tsx`는 그 훅이 돌려준 것을 구조분해해 그린다
  - `shared/ui/DragAndDrop.tsx`의 열은 화면이 아니라 재사용 컴포넌트라 `shared/hooks/`로 간다 — 「`hooks/` 밖에서 `use*` export 금지」가 그 파일에서만 걸리던 자리다
  - `src/app/`의 스물둘은 라우트 파일이라 **얇게 남긴다** — `_layout.tsx`의 효과 다섯은 앱 수명이고 화면 상태가 아니다
  - 빼낸 훅마다 짝 테스트가 붙어 TDD를 탄다
- 관찰 결과: `screens/*/ui/*.tsx`에 `useState`·`useEffect`·`useReducer`가 없다. 셋이 초록이다
- 보드의 `dumb-ui-widen`이 이 걸음이다 — 그 행이 든 「업무 상수와 판정과 가공 함수가 화면 파일에 남았다」는 AC-10과 이 묶음이 같이 걷는다
- 가장 큰 묶음이다. 화면 단위로 쪼개 PR을 여럿 낸다

### AC-13 — 중복 넷이 접힌다

- 전제: 같은 이름의 export 함수가 두 자리에 산다
  - `canGoBack`·`canGoForward` — `screens/payroll/model/boundary.policy.ts`와 `shared/utils/monthBoundary.ts`
  - `dayMinutes` — `features/payrollCompute/model/dayMinutes.policy.ts`와 `features/stats/model/workTotals.policy.ts`
  - `attendanceSummaryLine` — `screens/scheduleWorker/model/attendanceColumn.policy.ts`와 `screens/stats/utils/attendanceSummaryLine.utils.ts`
- 행동: 몸이 같은 것은 하나로 접고, 다른 것은 **이름을 갈라** 무엇이 다른지 이름이 말하게 한다
- 관찰 결과: 같은 이름의 export 함수가 두 자리에 없다. 셋이 초록이다
- 묶음 6가가 `monthStart` 사본 넷을 접은 것과 같은 일이다

### AC-08 — 검사 열둘이 선다

**번호는 여덟인데 차례는 마지막이다.** AC-09~AC-13이 뒤에 생겨 문서 차례와 번호가 어긋났다 — 번호를 다시 매기면 merge된 PR 본문과 커밋 메시지가 가리키는 이름이 깨진다.

- 전제: `house/dumb-ui`가 `.tsx`의 Supabase import·`fetch()`·쿼리 훅 호출만 잡는다. 세그먼트와 층의 뜻과 접미사를 지키는 검사가 없다
- 행동: 규칙을 더하고 `tests/lint/`에 각각의 테스트를 쓴다. [execution.md의 「집행되는 규칙」](../../4-test/execution.md#집행되는-규칙) 표에 행을 더한다 — `tests/lint/ruleCatalogue.test.ts`가 그 표를 정본으로 읽는다
  - `api/` 밖에서 Supabase 클라이언트 import 금지
  - `hooks/` 밖에서 `use*` export 금지
  - `entities/`에서 `useMutation` 금지 · `features/`에서 `useQuery` 금지
  - `.policy.ts`에서 통신·`Date.now`·`Math.random` 금지
  - 캐시 키 배열 리터럴 금지 — `queryKeys` 팩토리만 쓴다
  - `consts/` 밖에서 `export const <대문자_스네이크>` 금지 — `queryKeys`·`staleTogether`는 예외다(camel이고 통신의 약속이다)
  - `process.env`·`Constants`를 `config/` 밖에서 읽기 금지
  - `expo-*`·`react-native` SDK를 `lib/`·`ui/`·`hooks/` 밖에서 import 금지 — 타입만 import하는 것은 통과시킨다
  - `.tsx`에서 `useState`·`useEffect`·`useReducer` 금지 — `className` 조립과 `isLoading` 분기는 통과시킨다
  - 접미사가 사는 세그먼트와 맞는지 — `fileNaming.ts`
  - 이름이 camelCase인지 · 폴더 이름이 camelCase인지 — `fileNaming.ts`가 AC-01·AC-02에서 이미 본다
- 관찰 결과: 각 규칙이 위반 픽스처에서 걸리고 정상 픽스처를 통과시킨다. 저장소 전체가 열둘을 통과한다
- 마지막 줄은 AC-12가 끝나야 켤 수 있다 — 지금 켜면 `.tsx` 마흔여섯이 빨개진다

## 변경 파일

**아래 표는 AC-01 이전 이름으로 배정을 적는다.** camel로 바뀐 지금 이름은 같은 낱말의 꼴만 다르고(`get-month-schedule`이 `getMonthSchedule`이다) AC-06나가 접미사를 더 붙인다 — 배정과 이름을 한 표에 섞으면 어느 묶음이 무엇을 하는지 읽히지 않는다.

### 슬라이스 배정 — entities 14

| 슬라이스 | 읽는 dal | 쿼리 훅 | 모델·제약 |
| --- | --- | --- | --- |
| `schedule` | `get-month-schedule` `get-first-schedule-month` `get-open-slots` | `useMonthSchedule` `useMonthWindow` `useOpenSlots` `useScheduleMonths` `useWorkMonths` `useFirstScheduleMonth` | `positions` |
| `availability` | `get-my-availability` `get-month-availabilities` | `useMyAvailability` `useMonthAvailabilities` | — |
| `work-request` | `get-slot-requests` `get-pending-approvals` | `useSlotRequests` `usePendingApprovals` | — |
| `hall` | `get-hall-defaults` | `useHallDefaults` | — |
| `attendance` | `get-day-attendance` `get-month-attendance` | `useMonthsAttendance` | `attendance-status` `attendance-summary` `constants` `communication-delay` |
| `excuse` | `get-my-excuses` | — | — |
| `qr` | `get-qr-code` | `useQrCode` | `check-in-url` `export-qr-paper` |
| `profile` | `get-my-profile` `profile-private` `ensure-profile`(쓰기인데 남는다) | `useMyProfile` | `can-save-display-name` `format-birth-date` `validate-profile` |
| `member` | `list-members` `get-qualifications` | `useMembers` `useQualifications` | `is-last-admin` `sort-members` `filter-members` `search-members` `format-elapsed-days` |
| `notification` | `get-notifications` `count-unread-notifications` `get-push-reachable` | `useNotifications` `useUnreadCount` | `title` `when` `destination` `reach-state` `reach-message` `profile-notification-row` `push-message` `push-result` `app-entry` `types` |
| `payroll` | `get-payroll-month` `get-wage-rates` | `useWageRates` `usePayrollMonths` `usePayrollMonthsByMonth` | `day-amount` `wage-at` |
| `rehearsal` | `get-all-rehearsals` `get-my-rehearsals` | `useAllRehearsals` `useMyRehearsals` `useRehearsalMonths` | `rehearsal-hours` `kind-for-date` `can-add-on` `spell-total` |
| `clock` | `get-server-now` | — | `server-clock` `server-clock-store` |
| `session` | `get-current-user` | — | `resolve-admin-guard` `resolve-auth-destination` |

**`entities/stats`가 없다.** 통계는 근무·근태·급여를 합쳐 읽어서 도메인 하나가 아니고, `entities` 슬라이스끼리는 서로를 못 부른다 — 자리가 `features/stats`다. 근거는 [ADR-015의 「읽기와 쓰기」](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md#읽기와-쓰기)고, 이 자리를 묶음 5가 밟아 관찰 046이 됐다.

**자격이 `member`에 든다.** `queryKeys`가 그 읽기를 `["members", "qualifications"]`로 적고 [schedule/design.md](../../2-design/modules/schedule/design.md)도 자격을 사람의 속성으로 적는다 — 슬라이스를 따로 세우면 `member`와 자격이 서로를 못 부른다.

**급여 계산 셋이 `features`에 남는다.** `payroll-days`는 근태·리허설·근무를, `day-minutes`는 리허설을 읽는다. 아래 `features/payroll-compute`다.

### 슬라이스 배정 — features 22

**스물둘 중 둘은 쓰기가 없다.** `stats`와 `payroll-compute`는 도메인을 가로질러 읽기만 하고, 그것이 `features`인 까닭은 [ADR-015의 「읽기와 쓰기」](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md#읽기와-쓰기)가 든다. 둘은 제 질의를 열지 않고 `entities`의 쿼리 훅을 불러 맞춘다.

| 슬라이스 | 바꾸는 것 | 쓰는 dal | 뮤테이션 훅 |
| --- | --- | --- | --- |
| `stats` | — (읽기만 합친다) | — | `hooks/useAttendanceMonths` `model/trend` `model/my-totals` `model/work-totals` `model/person-days` `model/attendance-inputs` |
| `payroll-compute` | — (읽기만 합친다) | — | `model/day-minutes` `model/payroll-days` `model/payroll-total` |
| `schedule-day` | 관리자가 날을 만들고 열고 닫고 시간을 고친다 | `create-schedule` `open-day` `close-day` `set-day-hours` | `useCreateSchedule` `useOpenDay` `useCloseDay` `useSetDayHours` |
| `schedule-slot` | 관리자가 자리를 더하고 빼고 합치고 나눈다 | `add-slot` `remove-slot` `merge-slots` `split-slot` | `useAddSlot` `useRemoveSlot` `useMergeSlots` `useSplitSlot` |
| `schedule-assign` | 관리자가 사람을 배정하고 뺀다 | `add-assignment` `remove-assignment` | `useAddAssignment` `useRemoveAssignment` |
| `schedule-confirm` | 관리자가 확정하고 확정 뒤 강제로 고친다 | `confirm-schedule` `force-change` | `useConfirmSchedule` `useForceChange` |
| `availability-submit` | 근무자가 신청하고 관리자가 마감일을 정한다 | `submit-availability` `set-application-deadline` | `useSubmitAvailability` `useSetApplicationDeadline` + `ui/DeadlineSheet` |
| `work-request` | 근무 요청을 보내고 받고 취소 요청을 판정한다 | `send-work-request` `respond-request` `create-cancel-request` `decide-cancel-request` | `useSendWorkRequest` `useRespondRequest` `useCreateCancelRequest` `useDecideCancelRequest` |
| `qualification-grant` | 관리자가 포지션 자격을 준다 | `grant-position` | `useGrantPosition` |
| `hall-defaults` | 관리자가 홀 기본값을 고친다 | `set-hall-defaults` | `useSetHallDefaults` |
| `attendance-checkin` | 근무자가 출근을 인증한다 | `check-in` | — (그 task가 세운다) |
| `excuse` | 근무자가 사유를 내고 관리자가 판정한다 | `submit-excuse` `decide-excuse` | — (그 task가 세운다) |
| `qr-admin` | 관리자가 QR을 새로 뽑고 홀 위치를 고친다 | `rotate-qr` `set-hall-location` | `useRotateQr` |
| `profile-edit` | 본인이 프로필·연락처·사진을 고친다 | `submit-profile` `update-my-contact` `update-my-photo` `avatars-bucket` | `useUpdateContact` `useUpdatePhoto` |
| `member-admin` | 관리자가 승인·차단·퇴사·역할·표시 이름을 바꾼다 | `approve-member` `reject-member` `block-member` `unblock-member` `mark-leave` `undo-leave` `set-role` `set-display-name` | `useMarkLeave` `useUndoLeave` `useSetRole` `useSetDisplayName` |
| `wage-admin` | 관리자가 시급을 고치고 되돌린다 | `set-wage` `set-default-wage` `reset-wage-to-default` | `useSetWage` `useSetDefaultWage` `useResetWageToDefault` |
| `adjustment` | 관리자가 급여를 조정한다 | `set-adjustment` | `useSetAdjustment` |
| `holiday` | 공휴일을 받고 고친다 | `set-holiday` | `useSetHoliday` + `model/holiday-api-response` |
| `notification-read` | 알림을 읽음으로 표시한다 | `mark-notifications-read` | `useMarkNotificationsRead` |
| `push-switch` | 기기 주소를 올리고 알림을 켜고 끈다 | `save-push-token` `remove-push-token` `set-notifications-enabled` | `useNotificationSwitch` `useSavePushToken` + `model/push-deps` `model/push-permission` |
| `rehearsal-edit` | 관리자가 리허설을 더하고 고치고 뺀다 | `add-rehearsal` `edit-rehearsal` `remove-rehearsal` | `useAddRehearsal` `useEditRehearsal` `useRemoveRehearsal` |
| `auth` | 세션을 만들고 끊고 잇고 들어온 사람을 어디로 보낼지 정한다 | — (OAuth라 dal이 없다) | `model/sign-out` `model/auth-redirect` `model/handle-auth-callback` `model/decide-entry` `model/resolve-entry-destination` `hooks/wire-auto-refresh` `api/session-storage` `utils/google-photo-of` |

### shared 재편

**이 표는 `shared/` 전체다** — `shared/lib`의 스물아홉뿐 아니라 이미 `shared/api`에 사는 `database`·`errors` 같은 것도 든다. 떠나는 아홉을 뺀 스물이 `shared/lib`에서 온다.

| 세그먼트 | 담는 것 |
| --- | --- |
| `api` | `database` `database-types` `errors` `error-codes` `supabase` `create-supabase-client` `session-storage` **`query-keys`(다섯에서 모음)** `query-client` `read-supabase-env` `read-app-url` `months-query` |
| `hooks` | `useTheme` |
| `utils` | `kst-date` `spell-number` `cn`(`utils`에서 이름 바꿈) `month-boundary` **`month-range`(새로 선다)** `mini-calendar` `month-picker` `day-band` `no-value` `reduce-motion` `catalog-visibility` `dev-door` `theme` `font-loading` |
| `ui` | 조각 쉰하나 — 그대로 |

`shared/`에 `model`이 안 선다 — 도메인이 없어 담을 것이 없다. `theme`가 `utils`인 까닭은 색과 서체가 통신과 무관한 값이기 때문이고, env를 읽는 둘은 통신 설정이라 `api`다.

**`month-range`가 새로 선다.** `monthStart`와 `nextMonthStart`가 dal 넷에 사본으로 산다 — `getMonthSchedule`이 내보내고 `getMonthAttendance`·`getMyAvailability`·`getPayrollMonth`가 각자 제 사본을 든다. 내보내는 쪽을 당기는 셋(`getOpenSlots`·`getMonthAvailabilities`·`getSlotRequests`)은 지금 같은 슬라이스라 안 걸리지만 AC-07이 쪼개면 교차가 된다. 한 자리로 올리고 사본 셋을 지운다.

**zustand store 둘의 자리가 갈린다.** `use*`로 불리는 것은 훅이라 `hooks/`에 제 이름으로 살고(`shared/hooks/useTheme.ts`), 그렇지 않은 것은 `model/`에서 `[domain].store.ts`를 받는다(`entities/clock/model/clock.store.ts`). ADR-015의 「전역 상태는 `model`」과 「훅 파일은 그 훅 이름」이 한 파일에서 부딪히는 자리고, 부르는 이름을 이긴 쪽으로 둔다 — AC-08의 「`hooks/` 밖에서 `use*` export 금지」도 그 편이다.

**`shared/lib`를 떠나는 아홉.** 인증 흐름은 로그인이라는 use case에 매여 있어 「어느 기능에도 매이지 않은 것」이 아니고, 서버 시각은 `entities/clock`이 이미 있는데 거기 안 들어가 있었다 — 그 슬라이스에 파일이 하나뿐인 것이 그 증거다.

| 가는 곳 | 파일 | 왜 |
| --- | --- | --- |
| `features/auth` | `auth-redirect` `handle-auth-callback` `sign-out` `wire-auto-refresh` | 세션을 만들고 끊고 잇는 쓰기다 |
| `entities/session` | `get-current-user` `resolve-admin-guard` `resolve-auth-destination` | 누가 들어왔고 어디로 보낼 수 있나 — 읽기와 제약이다 |
| `entities/clock` | `server-clock` `server-clock-store` | 이미 그 슬라이스가 있다 |

**`entities/session`이 새로 선다.** 로그인은 읽기와 쓰기가 한 use case에 섞인 유일한 자리인데, 가르면 「누가 들어왔나」(읽기·제약)와 「세션을 만들고 끊는다」(쓰기)로 나뉘어 lint 규칙에 예외를 둘 필요가 없다.

**사슬 셋은 `features/auth`에 남는다.** `decide-entry`·`resolve-entry-destination`·`google-photo-of`를 `entities/session`으로 내리면 `resolve-entry-destination`이 `entities/profile`의 `ensure-profile`과 `get-my-profile`을 부르는 자리가 같은 층 교차가 된다. 위층에 두면 안 걸린다 — 프로필을 읽어 진입을 판정하는 것은 도메인 둘을 잇는 조립이고 그 자리가 `features`다.

### 검사·설정

| 파일 | 바꿀 책임 |
| --- | --- |
| `tests/lint/fileNaming.ts` | `kebab` 갈래를 `camel`로 — AC-01. 폴더 이름 검사 — AC-02. 접미사 검사 — AC-08 |
| `eslint-rules/supabaseClientInApi.mjs` | 신설 — `api/` 밖에서 Supabase 클라이언트 import를 막는다 |
| `eslint-rules/hooksSegment.mjs` | 신설 — `hooks/` 밖의 `use*` export를 막는다 |
| `eslint-rules/readWriteLayers.mjs` | 신설 — `entities/`의 `useMutation`과 `features/`의 `useQuery`를 막는다 |
| `eslint-rules/purePolicy.mjs` | 신설 — `.policy.ts`의 통신·시계·난수를 막는다 |
| `eslint-rules/constsSegment.mjs` | 신설 — `consts/` 밖의 `export const <대문자_스네이크>`를 막는다 |
| `eslint-rules/configSegment.mjs` | 신설 — `config/` 밖에서 `process.env`·`Constants`를 읽는 것을 막는다 |
| `eslint-rules/nativeSdkSegment.mjs` | 신설 — `lib/`·`ui/`·`hooks/` 밖에서 `expo-*`·`react-native` SDK import를 막는다 |
| `eslint-rules/dumbUi.mjs` | `.tsx`의 `useState`·`useEffect`·`useReducer`를 막는 축을 더한다 — **AC-12가 끝나야 켠다** |
| `eslint-rules/index.mjs` · `eslint.config.mjs` | 신설 규칙 일곱을 등록한다 |
| `tests/lint/supabaseClientInApi.test.ts` 외 여섯 | 신설 — 규칙마다 위반·정상 픽스처 |
| `docs/4-test/execution.md` | 「집행되는 규칙」 표에 행 여덟을 더하고 파일 이름 규칙 행의 문장을 camel과 접미사로 고친다 — `tests/lint/ruleCatalogue.test.ts`가 그 표를 정본으로 읽는다 |
| `scripts/syncEdgeShared.mts` | 복사 경로 넷 — 알림 셋이 `entities/notification/model/`과 `features/pushSwitch/model/`로, 공휴일 하나가 `features/holiday/model/`로 |
| `eslint-rules/noNodeImportInEdgeShared.mjs` | 같은 경로 한 줄 |
| `tests/lint/attendanceConstants.ts` | `src/entities/attendance/model/attendance.type.ts`를 문자열로 박아 뒀다 — AC-07이 슬라이스 이름을 `attendance`로 두므로 안 바뀌지만, 바꾸면 이 줄도 같이 간다 |

### 경로·이름을 적은 활성 정본

문장이 코드를 가리키는 자리는 그 코드를 옮기는 커밋에서 같이 고친다. **지금은 그 문장들이 현재 코드를 맞게 적고 있어** 미리 고치지 않는다 — 코드와 문서가 한 커밋에서 맞아야 중간 상태에 거짓 문장이 안 생긴다.

| 문서 | 고칠 문장 | 같이 가는 묶음 |
| --- | --- | --- |
| `CLAUDE.md` 「코드 구조」 | 「부르는 이름이 없는 나머지는 kebab-case다」와 `fileNaming.ts` 경로 | AC-01 |
| [execution.md](../../4-test/execution.md) 「집행되는 규칙」 | 파일 이름 규칙 행의 kebab 문장과 검사 파일 이름 | AC-01 |
| [ADR-005](../../2-design/adr/ADR-005-sdlc-stage-folders-and-artifact-chain.md) | 문서 슬러그는 kebab 그대로다 — **안 고친다**, 코드 이름과 다른 축이다 | — |
| [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md) 「레이어」 | 「`shared/lib`에 공용 유틸이 산다」 → `shared/utils` | AC-06가 |
| [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md) 「화면과 로직」 | `house/dumb-ui` 설명의 `@/shared/lib/` 경로 | AC-06가 |
| [ADR-003](../../2-design/adr/ADR-003-supabase-and-integration-tests.md) | 「`auth.*`는 `shared/lib`에 산다」 → `features/auth`와 `entities/session` | AC-06가 |
| [architecture.md](../../2-design/system/architecture.md) | 같은 예외 문장 | AC-06가 |
| [account/design.md](../../2-design/modules/account/design.md) | 「전부 `auth.*`라 `shared/lib`이다」 | AC-06가 |
| [spec/ui-kit.md](../../2-design/spec/ui-kit.md) | 「자리」와 AC의 순수 계산 경로 둘 | AC-06가 |
| [execution.md](../../4-test/execution.md) | 테스트 명령 예시의 `src/shared/lib/__tests__/` 경로 | AC-06가 |
| [runtime.md](../../2-design/system/runtime.md) | 「도메인 파일이 각자의 키를 적는다」 → 팩토리 하나 | AC-03 |
| [runtime.md](../../2-design/system/runtime.md) 「업무 상수」 | 「상수는 `src/entities/<도메인>/model/constants.ts`에 산다」 → `<도메인>.type.ts`. ADR-015의 `[domain].type.ts`가 「타입과 상수」를 담는다 | AC-06나 |
| `tests/lint/attendanceConstants.ts` | 그 경로를 문자열로 박아 둔 한 줄 | AC-06나 |

**완료된 과거 plan은 안 건드린다.** [3-build 안내](../README.md#구현-계획)가 「완료된 과거 계획은 소급 변경하지 않는다」고 적는다 — `login-screens`·`rehearsal`·`stats-worker` 등 열 넘는 plan이 `shared/lib`과 kebab 경로를 들지만 그것은 당시 작업의 기록이다.

## 구현 순서

묶음 아홉을 PR 하나씩 나른다. 앞 묶음이 merge되고 나서 다음을 뗀다 — 같은 파일을 연달아 옮기므로 겹치면 충돌이 손으로 풀 수 없게 커진다.

1. **AC-01 — 파일 이름 camel.** ✅ 535개를 `git mv`했다
2. **AC-02 — 폴더 이름 camel.** ✅ `screens/` 다섯을 `git mv`하고 폴더 검사를 세웠다
3. **AC-03 — 캐시 키 팩토리.** ✅ 여섯과 dal 키 함수 여섯을 `shared/api/queryKeys.ts` 하나로. 키 하나를 정본 쪽으로 되돌렸다 — 관찰 045의 겹침
4. **AC-04 — 통신을 `api/`로 + `.api.ts`** ✅ 172개를 `git mv`했다
5. **AC-05 — 훅을 `hooks/`로 + 층 가르기 + `Query`·`Mutation`** ✅ 205개를 `git mv`하고 `useStatsQueries`를 넷으로 갈랐다 — 관찰 046
6. **AC-06가 — `shared/` 재편 + 교차를 만드는 순수 함수 추출** ✅ 쉰아홉을 `git mv`하고 `monthStart` 사본 넷을 접었다. 교차가 0이 됐다
7. **AC-07 — 슬라이스 쪼개기** ✅ 268개를 `git mv`했다. 교차 0이고 깨져 있던 엣지 import 셋을 고쳤다
8. **AC-06나-1 — `model`/`utils` 가르기 + 접미사** ✅ 123개와 짝 테스트 120개를 `git mv`했다. 판정 예순하나·꼴 바꾸기 쉰여섯·타입 셋·검증 둘·store 하나
9. **AC-06나-2 — 타입 빼기** `<슬라이스>.type.ts`로 예순다섯
10. **AC-09 — `lib` 세우기** 부작용을 내는 손을 `model`·`utils`에서 걷는다
11. **AC-10 — `consts` 세우기** 정해진 값을 판정 파일에서 걷는다
12. **AC-11 — `config` 세우기** 환경이 주는 값이 들어오는 문을 하나로
13. **AC-12 — `screens`의 `hooks`** `.tsx`에서 상태와 효과를 걷는다. 보드의 `dumb-ui-widen`이 이 걸음이다
14. **AC-13 — 중복 넷 접기** 같은 이름의 함수가 두 자리에 산다
15. **AC-08 — 검사 열둘**

**AC-06을 갈라 AC-07을 그 사이에 끼운다.** 두 방향 다 한 번은 걸린다.

- 6가가 AC-07보다 먼저인 까닭: AC-07의 완료 조건이 「`no-cross-slice-import` 0건」인데 쪼갠 뒤 교차가 되는 자리가 지금 둘 있고 둘 다 같은 원인이다 — `getMonthAvailabilities`와 `getSlotRequests`가 `getMonthSchedule`에서 `monthStart`를 당긴다. 안 걷고 쪼개면 걸린 건수를 보고 「배정이 틀렸나 사본 탓인가」를 가를 수 없다
- 6나가 AC-07보다 나중인 까닭: `[domain]`이 슬라이스 이름이다. 쪼개기 전에 `[domain].type.ts`로 모으면 `entities/schedule` 하나에 도메인 여섯의 타입이 한 파일로 들어가고 AC-07이 그것을 다시 가른다 — 파일이 두 번 움직여 rename 추적이 끊긴다

6가의 완료 조건은 `pnpm lint`에 교차가 0건인 것이다. 남으면 6가를 안 끝낸 것이다.

**이동과 이름을 한 묶음에서 한다.** 앞선 판은 이동(묶음 3~5)과 접미사(묶음 6)를 갈랐는데, 그러면 같은 파일을 두 번 옮기고 rename 추적이 두 번 끊긴다. 지금은 각 파일이 한 번만 움직인다 — 그 자리의 성격이 정해지는 묶음에서 이름까지 받는다.

**묶음마다 커밋을 둘로 가른다.** 이름·자리만 바꾸는 커밋과 참조를 고치는 커밋이다. 섞이면 git이 rename 추적을 놓쳐 `git log --follow`가 끊긴다.

**이동만 하는 묶음(1·2·4·5·6가·7)에 새 테스트를 만들지 않는다.** [3-build 안내](../README.md#구현-계획)가 「문서만 고치는 작업은 관련 기존 문서 검사로 확인하며 형식만 베끼는 새 테스트를 만들지 않는다」고 적는데, 파일 이동도 같다 — 기존 테스트가 새 경로에서 그대로 초록인 것이 그 묶음의 완료 조건이다. 테스트를 쓰는 묶음은 9뿐이고, 묶음 3과 6나는 기존 테스트가 새 호출 꼴로 바뀐다.

## 리스크·전환·되돌리기

**사용자 대면 동작이 하나도 안 바뀐다.** 묶음 1~8은 파일 자리와 이름과 import만 고치고 묶음 9는 검사만 더한다. 마이그레이션도 없다.

**되돌리기 단위는 PR 하나다.** 묶음 1·2·4·5·6가·7·6나는 `git mv`와 치환뿐이라 revert 한 번으로 돌아간다. 묶음 3은 키 문자열을 안 바꿔 revert해도 캐시가 깨지지 않는다.

**이름만 바꾸는 커밋과 import를 고치는 커밋을 가른다.** 한 커밋에 섞이면 git이 rename 추적을 놓쳐 `git log --follow`가 끊긴다. 묶음 1이 가장 크니 거기서 특히 지킨다.

**macOS에서 `git mv`가 케이스만 바뀌는 짝을 놓칠 수 있다.** 파일 시스템이 대소문자를 안 구별해 `foo-bar.ts` → `fooBar.ts`는 글자가 겹치지 않아 안전하지만, 첫 글자만 바뀌는 자리가 있으면 `git mv -f`가 필요하다. 묶음 1이 끝난 뒤 `git status`가 깨끗한지 확인한다 — [관찰 017](../../observations/017-case-insensitive-rm-deleted-a-tracked-file.md)이 그 축에서 한 번 물렸다

**TDD 훅을 우회하지 않는다.** `git mv`가 Bash라 훅이 안 보는 것은 [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md)이 알고 남긴 구멍이고, 테스트를 짝으로 같이 옮기므로 그 구멍으로 테스트 없는 코드가 들어오지 않는다. 짝이 깨진 자리가 있으면 `pnpm test`가 그 파일을 못 찾아 빨개진다.

**가장 큰 위험은 묶음이 겹치는 것이다.** 다른 task가 같은 기간에 `src/`를 고치면 충돌이 수백 줄이 된다. 이 task가 도는 동안 다른 코드 task를 띄우지 않는다.

**묶음 7에서 `no-cross-slice-import`가 걸릴 수 있다.** 쪼갠 슬라이스끼리 부르는 자리가 나오면 그것은 위 층(`features`나 `screens`)이 조립할 일이다. 그 목록이 길면 쪼개는 단위가 틀린 것이므로 묶음 7을 멈추고 배정 표를 고친다.

배정 표를 지금 코드에 대본 결과는 **교차 둘**이고 둘 다 `monthStart`라 묶음 6가가 걷는다. 아래층이 위층을 부르는 자리는 **0**이다. 슬라이스를 못 가린 파일 스물여덟은 DB 자체를 보는 integration 테스트들인데 `@/shared`와 `@tests/`만 당겨 어느 슬라이스에도 안 매인다.

**계획이 둔 자리를 규칙에 대보는 검사가 없다.** 묶음 5가 `useStatsQueries`를 `entities/stats/hooks/`에 두라고 적은 계획을 그대로 따라가다 돌면서 걸렸다 — [관찰 046](../../observations/046-plan-placement-not-checked-against-rules.md)이다. 그래서 위 숫자를 묶음 7을 뗄 때 다시 센다. 세는 일이 스크립트라 손 판정이 아니다.

## 검증 방법

| 완료 조건 | 깨질 수 있는 것 | 테스트 층·위치 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 이름 규칙이 camel을 안 받는다 | 기존 unit | `pnpm test -- fileNaming` | 초록 |
| AC-01 | rename이 빠져 모듈을 못 찾는다 | 타입 검사 | `pnpm typecheck` | 초록 |
| AC-01 | 하이픈이 남는다 | 손 확인 | `find src tests scripts eslint-rules -name '*-*' -name '*.ts*' \! -path 'src/app/*'` | 결과 없음 |
| AC-01 | `Db`가 남는다 | 손 확인 | `grep -rn '\bDb\b' src tests scripts` | 결과 없음 |
| AC-02 | 하이픈 든 폴더가 남는다 | 손 확인 | `find src -type d -name '*-*' \! -path 'src/app/*'` | 결과 없음 |
| AC-02 | 라우트가 슬라이스를 못 찾는다 | 타입 검사 | `pnpm typecheck` | 초록 |
| AC-03 | 키 문자열이 바뀌어 캐시 무효화가 어긋난다 | 기존 unit·integration 전부 | `pnpm test` | 초록. `queryKeys.ts`가 하나만 남는다 |
| AC-03 | 모은 파일이 `runtime.md`의 키 표와 어긋난다 | 손 확인 | — | `shared/api/queryKeys.ts`의 키가 [runtime.md](../../2-design/system/runtime.md)와 일치 |
| AC-04 | `dals`가 남는다 | 손 확인 | `find src -type d -name dals` | 결과 없음 |
| AC-05 | `entities`에 뮤테이션이, `features`에 쿼리가 남는다 | 새 lint 규칙(묶음 8) | `pnpm lint` | 묶음 8이 선 뒤 0건 |
| AC-05 | 훅 export 이름을 안 바꿔 파일과 어긋난다 | 기존 unit | `pnpm test -- fileNaming` | 초록 |
| AC-05 | Edge Function 복사가 빠진 경로를 본다 | 기존 integration | `pnpm test:integration` | `import-holidays`·`send-push` 관련 초록 |
| AC-06나 | 업무 판정이 `utils`에 숨는다 | 손 확인 | — | `utils/`의 함수가 참·거짓이나 허용·금지를 안 돌려준다 |
| AC-06나 | 접미사가 세그먼트와 어긋난다 | 새 검사(묶음 8) | `pnpm test -- fileNaming` | 묶음 8이 선 뒤 초록 |
| AC-07 | 쪼갠 슬라이스끼리 import가 생긴다 | 기존 lint 규칙 | `pnpm lint` | `no-cross-slice-import` 0건 |
| AC-07 | 슬라이스 이름이 라우트와 어긋난다 | 손 확인 | — | `screens/` 슬라이스가 안 쪼개졌다 — 바뀐 것은 import 줄뿐이다 |
| AC-08 | 규칙이 정상 코드를 막는다 | unit | `tests/lint/supabaseClientInApi.test.ts` 외 셋 (신설) | 위반 픽스처에서 걸리고 정상에서 통과 |
| AC-08 | 규칙 표가 실제 규칙과 어긋난다 | 기존 검사 | `pnpm test -- ruleCatalogue` | 초록 |

**e2e는 안 돈다.** 기기 빌드가 없어 `pnpm e2e`가 실행 불가다([execution](../../4-test/execution.md)). 이 task는 사용자 대면 동작을 안 바꾸므로 e2e가 막는 자리도 없다.

## 여기서 안 하는 것

- **`.tsx`의 로직 걷기** — 별도 task(`dumb-ui-widen`)가 받는다. 성격이 다르다. 이동이 아니라 추출이고, 빼낸 `.ts`에 짝 테스트가 필요해 TDD를 탄다
- **`screens/` 쪼개기** — ADR-001이 라우트 이름으로 묶었다
- **`widgets` 층 신설** — ADR-001이 「화면 조립 덩이가 실제로 반복되면 그때」로 미뤘고 아직 그 반복이 관찰되지 않았다
- **문서 슬러그 이름 바꾸기** — ADR-005가 kebab으로 가지고 있고 코드 파일과 다른 축이다. `docs/`와 브랜치 이름은 그대로 kebab이다
- **검증 라이브러리 들이기** — `[domain].schema.ts`에 자리를 비워두지만 zod를 넣는 것은 별도 결정이다
