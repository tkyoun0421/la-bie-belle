---
sources:
  - ../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md
  - ../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md
  - ../../2-design/system/runtime.md
---

# FSD 층 재편 — 구현 계획

[ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)를 코드에 전개한다. 이름을 camelCase로 바꾸고, 캐시 키를 팩토리로 모으고, 세그먼트를 여덟로 모으면서 성격 접미사를 같이 달고, 층의 뜻을 읽기와 쓰기로 가르고, 타입을 빼내고, 뭉친 슬라이스를 쪼갠다.

## 입력 명세·기준

**정본은 ADR-015다.** 층의 뜻, 세그먼트 여덟의 판정 기준, 슬라이스 쪼개는 기준, 이름 규약, 검사 열일곱이 거기 산다. 이 계획은 그것을 몇 번에 나눠 어떤 순서로 옮기는지만 적는다.

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

## 남은 묶음을 도메인으로 가른다

**완료 조건은 세그먼트 축으로 적고 PR은 도메인 축으로 가른다.** 「`consts/` 밖에 업무 상수가 없다」는 저장소 전체를 한 번에 보는 단언이라 세그먼트로 적어야 검증되고, 그걸 세우는 일은 근태의 상수 일곱과 알림의 넷이 서로 모르는 작업이라 도메인으로 갈라야 PR이 작다.

### 겹이 둘이고 병렬 가능성이 다르다

| 겹 | 하는 일 | 밖에서 보이나 | 병렬 |
| --- | --- | --- | --- |
| 이동 | 타입 빼기 · `lib`·`consts`·`config` 가르기 · 중복 접기 | import 경로가 바뀐다 | 못 한다 |
| 안쪽 | `screens/<슬라이스>/hooks/`로 상태와 효과 빼기 · 큰 파일을 책임으로 쪼개기 | 그 화면 안에서만 | 된다 |

**이동 PR은 저장소 전체의 import 줄을 고친다.** 도메인이 다른 도메인을 당기는 자리가 백쉰둘이다 — 통계가 근무표를 스물하나, 구성원이 알림을 열넷, 구성원이 인증을 열둘이다. 근무표가 타입을 옮기면 통계의 스물한 줄이 같이 바뀌고, 두 PR이 같이 떠 있으면 서로의 치환을 밟는다. 그래서 이동은 **직렬**이고 안쪽은 **병렬**이다.

### 묶음 열

도메인의 경계는 `entities` 슬라이스의 소유권이다. 그 도메인을 읽는 `features`와 그리는 `screens`가 같은 묶음에 든다.

| 묶음 | 품는 슬라이스 | 이동할 것 | DTO·매퍼 | `services` | controller | 안쪽에서 쪼갤 것 |
| --- | --- | --- | --- | --- | --- | --- |
| 공용 ✅ | `shared/*` · `entities/clock` · `src/app/` | 타입 12 · 상수 7 · SDK 5 · 환경값 2 · 시계 2 | — | — | 화면 12 | `_catalog` 624줄 · `DragAndDrop` export 다섯 · `kstDate` export 여섯 |
| 근무표 ✅ | schedule · availability · hall · workRequest + features 일곱 + screens 셋 | 타입 16 · 상수 2 | DTO 파일 4 · 매퍼 1 | 60 | 화면 10 | `DayDetail` 969줄에 훅 서른여덟 · `ScheduleAdminScreen` 736줄 |
| 급여 ✅ | payroll + payrollCompute · wageAdmin · adjustment · holiday + screens 둘 | 타입 8 · 상수 7 | DTO 파일 1 · 매퍼 0 | 16 | 화면 2 | `payrollDays.policy` 339줄 · `period.policy` export 아홉 |
| 구성원 ✅ | member · profile + memberAdmin · profileEdit · qualificationGrant + screens 여섯 | 타입 2 · 상수 16 | DTO 파일 2 · 매퍼 0 | 20 | 화면 10 | `PendingScreen` 689줄 · `ProfileScreen` 506줄 · `MembersScreen` 446줄 |
| 근태 ✅ | attendance · excuse + attendanceCheckin · excuse + approvals | 타입 10 · 상수 9 | DTO 파일 2 · 매퍼 0 | 2 | 화면 2 | `ApprovalsScreen` 235줄 |
| 알림 | notification + pushSwitch · notificationRead + notifications | 타입 2 · 상수 11 · SDK 1 · 환경값 1 · 시계 1 | DTO 2 · 매퍼 2 | 10 | 화면 1 | Edge Function의 복사 경로가 여기 걸린다 |
| 리허설 | rehearsal + rehearsalEdit + rehearsal | 타입 5 · 상수 2 | DTO 2 · 매퍼 2 | 12 | 화면 1 | `RehearsalScreen` 427줄에 훅 열넷 |
| 통계 | stats + stats · adminStats · adminHome | 타입 9 | — | 2 | 화면 4 | `StatsScreen` 470줄 · `AdminStatsScreen` 414줄 · `workTotals.policy` export 다섯 |
| 인증 | session + auth + retry | 타입 2 · 상수 1 · SDK 2 · 환경값 1 | — | — | 화면 1 | `signOut`·`handleAuthCallback`이 `lib`을 받는다 |
| QR | qr + qrAdmin + qr | 타입 1 · 상수 2 | — | 4 | 화면 1 | `QrScreen` 204줄 |

**DTO 스물둘은 여섯 묶음에만 있다** — 공용·통계·인증·QR은 통신이 DB 행을 그대로 내는 자리가 없다. 매퍼 열은 `.returns<>`로 생 행을 내보내면서 꼴을 안 바꾸는 통신이고, 이미 조립하는 다섯(`getPayrollMonth` 같은)은 그 안에서 매퍼를 꺼내는 일만 남는다. `ExcuseStatusRow`는 근태와 급여 두 자리에 각자 선언돼 있는데 **접지 않는다** — `entities`끼리 import가 `no-cross-slice-import`에 걸리고 올릴 자리도 없다(AC-13의 판정).

**`services` 백스물넷이 가장 큰 한 덩이다.** 짝 테스트를 같이 옮긴 수고, 근무표 예순이 그중 절반이다. `stores` 둘은 공용이 가져간다. **controller는 화면 마흔넷**이고 그게 안쪽 겹 전부다.

**공용이 맨 앞이다.** 이동할 것이 거기 쏠려 있고(SDK 다섯·환경값 둘·시계 둘이 전부 `shared/`와 `entities/clock`이다) 나머지 아홉이 전부 `shared/`를 당긴다 — 먼저 굳히지 않으면 뒤 아홉이 움직이는 바닥 위에서 일한다.

**`databaseTypes.ts` 1609줄은 밖이다.** `pnpm types`가 로컬 DB에서 뽑는 생성물이고 `scripts/generateDatabaseTypes.mts`가 통째로 덮어쓴다 — 쪼개면 다음 `pnpm types`가 되돌린다. 거기 선언된 여덞 중 밖에서 당기는 것은 `Database` 하나뿐이고 그것도 `shared/api/database.ts`가 한 번 받아 `DB`로 내보낸다. 당김 백쉰셋이 그 이름 하나로 모여 있어 **옮길 자리도 없다.**

**`shared/ui/*.tsx`의 `*Props` 여든하나도 밖이다.** `.tsx`는 접미사를 안 받고, 컴포넌트 하나의 인자 꼴은 ADR-015가 「함수 하나의 인자 꼴은 그 파일에 남는다」로 이미 그 파일에 묶었다. 밖에서 당기는 것이 다섯뿐인 것도 그 편이다 — `ScheduleDayCellState`·`ToastKind`·`ShiftWindow`·`Theme`·`IllustrationScene`이고 나머지는 선언한 파일만 쓴다.

**`features/notificationRead` 넷이 주인 없이 떠 있었다.** 묶음을 그려 보니 어느 `entities`도 안 당기고 아무 묶음에도 안 들었다 — 알림에 붙인다.

### 이동 PR 하나가 완료 조건 넷을 조금씩 전진시킨다

도메인 하나의 이동 PR은 그 도메인의 타입(AC-06나-2)과 `lib`(AC-09)과 `consts`(AC-10)과 `config`(AC-11)와 중복(AC-13)을 **한꺼번에** 옮긴다. 세그먼트마다 저장소를 열 번 도는 것보다 도메인마다 한 번 도는 것이 같은 파일을 덜 밟는다 — `pushDeps`는 부작용과 환경값과 상수를 한 파일에 들어, 세그먼트로 쪼개면 세 PR이 같은 파일을 연달아 가른다.

그래서 **완료 조건 넷은 마지막 이동 PR이 끝날 때 같이 초록이 된다.** PR마다 그 도메인 몫이 어디까지 갔는지를 본문에 적는다.

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
  - `useSavePushToken` — 쿼리도 뮤테이션도 아니고 앱 진입에 주소를 보내는 효과다. 쓰기 쪽이라 `features/pushSwitch/services/useSavePushTokenMutation.ts`고, 슬라이스를 `pushSwitch`로 가르는 일은 AC-07 몫이다
  - **부르는 쪽이 없는 쓰기 넷은 `entities/*/api/`에 남는다** — `checkIn`·`submitExcuse`·`decideExcuse`·`setHallLocation`이다. 화면과 훅이 아직 없어 슬라이스를 고를 근거가 없고, 지금 이름을 지어 두면 그 사슬(`attendance-checkin`·`attendance-excuse`)이 제 슬라이스를 정할 때 한 번 더 움직인다. AC-07이 슬라이스를 쪼갤 때 같이 올라간다
    - `removePushToken`만 밖이다 — 부르는 쪽은 없지만 짝 테스트가 `savePushToken`으로 토큰을 깔고 시작해서, 그것이 `features`로 올라가면 `entities`가 `features`를 부르는 꼴이 된다(`no-restricted-imports`). 둘이 한 쌍이라 같이 올라간다
  - 쓰기 다섯은 뮤테이션 훅이 없고 `.tsx`가 직접 부른다 — `approveMember`·`blockMember`·`rejectMember`·`unblockMember`는 `features/members/api/`, `submitProfile`은 `features/profile/api/`다. 같은 슬라이스의 다른 훅들이 이미 거기 있어서다. 훅 없이 부르는 것 자체는 `dumb-ui-widen`이 막을 자리고 이 걸음은 통신의 집만 정한다
  - `usePayrollMonths`·`useRehearsalMonths`·`useScheduleMonths` — 다른 쿼리를 조합해 달 목록을 낸다. 읽기 쪽이라 각 `entities/<도메인>/hooks/use[X]MonthsQuery.ts`
  - `ensureProfile` — 쓰기인데 `entities/profile/api/`에 **남는다.** 「없으면 만든다」가 진입 판정의 일부고 그 판정(`resolveEntryDestination`)은 프로필을 읽어 길을 고르는 조립이라 `features/auth`에 산다. 올리면 `features/auth`가 제 슬라이스 밖의 프로필 쓰기를 들게 되고, 지금 자리는 그 도메인의 통신이 그 도메인에 있는 꼴이다. 뮤테이션 훅이 없으니 「`entities`에 `useMutation` 금지」도 안 걸린다
  - `features/stats/api/useStatsQueries.ts` — 쿼리 훅 넷이 한 파일에 있고 셋은 제 도메인으로 내려가지만 `useAttendanceMonths`는 schedule과 attendance 둘을 함께 읽어 `entities` 어디에도 못 앉는다(`no-cross-slice-import`). 그래서 **파일을 가른다**
    - `useWorkMonths`·`useFirstScheduleMonth` → `entities/schedule/hooks/`, `usePayrollMonthsByMonth` → `entities/payroll/hooks/`
    - `useAttendanceMonths`는 근태 열두 달을 읽는 `entities/attendance/services/useMonthsAttendanceQuery.ts`와, 그것을 `useWorkMonthsQuery`와 달마다 맞추는 `features/stats/hooks/useAttendanceMonths.ts`로 갈린다. 맞추는 쪽은 `useQuery`를 안 가져 AC-08의 「`features/`에서 `useQuery` 금지」가 선다
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
  - **통신이 주고받는 꼴은 `[domain].dto.ts`로 따로 간다.** `api/`에 선언됐고 DB 열 이름을 그대로 드는 열여섯이 그 대상이고, `.api.ts`가 돌려주기 전에 `utils/`의 `.mapper.ts`를 불러 도메인 모양으로 바꾼다. DTO와 모델을 한 파일에 모으면 「이 도메인의 모양이 무엇인가」에 답하려고 열었을 때 절반이 DB 열 이름이다
  - 순수 함수를 판정(`model`)과 꼴 바꾸기(`utils`)로 갈라 옮기고 각자 이름에 `.policy.ts`·`.utils.ts`를 붙인다. **모으는 것은 타입뿐이다** — 판정을 슬라이스 이름으로 모으면 `screens/scheduleAdmin`의 `model/` 23개가 1292줄짜리 한 파일이 되고 짝 테스트 125개가 29개로 합쳐진다. ADR-015가 「한 파일을 열면 그 도메인이 읽힌다」를 논증한 자리도 `.type.ts`뿐이다
  - 바깥 값 검증을 `[domain].schema.ts`로 — `validateProfile`과 홀리데이 API 응답 파싱이 그 자리다
  - zustand store를 `[domain].store.ts`로
- 관찰 결과: `entities/`·`features/`의 `utils/`에 업무 판정이 없다 — 참·거짓이나 허용·금지를 돌려주는 함수가 `model/`에 산다. `shared/utils/`는 밖이다: 글꼴이 떴나·개발 문이 열렸나 같은 판정은 업무 규칙이 아니고 담을 도메인이 없어 `shared/`에 `model`이 안 선다. `[domain].type.ts`를 열면 그 도메인의 모양이 한 파일에서 읽힌다. 셋이 초록이다
- 왜 여기인가: 접미사가 성격을 말하므로 성격을 정하는 이 묶음에서 같이 붙인다. AC-07 뒤인 까닭은 `[domain]`이 슬라이스 이름이기 때문이다 — 쪼개기 전에 모으면 도메인 여섯이 한 파일로 합쳐지고 AC-07이 그것을 다시 가른다
- **접미사 붙이기(묶음 8가)와 타입 빼기(묶음 8나)를 두 PR로 가른다.** 앞의 것은 `git mv`와 지정자 치환이라 기계가 끝내고 rename 추적이 남는다. 뒤의 것은 선언을 파일 밖으로 꺼내 다른 파일에 붙이는 일이라 rename이 아니고 diff가 내용으로 보인다 — 한 PR에 섞으면 123개의 이름 변경 속에서 타입 이동을 읽을 수 없다
- 돌면서 나온 것 — **판정과 꼴 바꾸기의 비율이 거의 반반이다.** 백스물아홉 중 판정 예순하나·꼴 바꾸기 쉰여섯이고, 그 가름이 `model`과 `utils` 두 폴더로 눈에 보이게 됐다. 접미사를 안 받는 여섯은 부작용이 있어 `policy`가 못 되고 통신도 아니다 — 공유 시트를 열고(`exportQrPaper`), 인증을 호출하고(`handleAuthCallback`·`signOut`·`resolveEntryDestination`), OS 권한을 묻고(`pushPermission`), 의존을 묶는다(`pushDeps`). **세그먼트 다섯에 「부작용을 내는 순수하지 않은 손」의 자리가 없다** — 지금은 `model`에 접미사 없이 산다
- 돌면서 나온 것 — **`Row` 접미사가 정반대 둘을 가리키고 있었다.** 타입을 빼려고 `*Row` 서른아홉을 세어 보니 열여섯은 Supabase가 돌려주는 생 꼴이고(`entities/*/api/`) 스물셋은 「이 목록의 한 줄」이라는 뷰 꼴이다(`screens/*/utils`·`model`). `MemberRow`와 `PickerRow`가 같은 이름을 쓰는데 하나는 DB 계약이고 하나는 우리가 조립한 것이다. **DB 꼴이 화면까지 닿은 자리가 열이다** — `MembersScreen.tsx`가 `MemberRow`를 그대로 받아 열 이름이 뷰에 박혀 있다. 그래서 `[domain].dto.ts`가 서고, 한 접미사가 두 뜻을 갖던 것이 갈렸다
- 돌면서 나온 것 — **DTO를 가르는 것과 꼴을 바꾸는 것이 다른 일이다.** 근무표에서 DTO 열하나를 떼어 보니 「`.api.ts`가 돌려주기 전에 매퍼를 불러 도메인 모양으로 바꾼다」가 이 묶음 안에서 안 선다 — DB 열 이름이 `api/` 밖 파일 쉰여덟에 닿고 `ScheduleDay` 하나가 묶음 넷에 걸린다. 자리 세우기만 여기서 하고 꼴 바꾸기를 [dto-to-domain-shape](dto-to-domain-shape.md)로 떼어, 그쪽은 도메인이 아니라 **필드**로 가른다. 매퍼는 질의가 이미 꼴을 바꾸던 자리 하나(`getMonthWindow`)에만 섰다
- 돌면서 나온 것 — **훅의 반환 꼴과 도메인 모양의 경계가 이름으로 안 보인다.** `WorkMonth`는 접미사가 없고 밖에서 둘이 당겨 도메인 타입처럼 보이는데, 실은 `useWorkMonthsQuery`가 `ScheduleDay[]`를 달로 묶어 내는 꼴이다. `*Input`·`*Result`·`*Props`는 접미사로 걸러지지만 이런 것은 파일을 열어야 갈린다 — 근무표에서 타입 마흔넷을 접미사로 걸렀을 때 스물일곱이 「접미사 없음」으로 남았고 그 전부를 손으로 봤다
- 돌면서 나온 것 — **함수가 받는 최소 꼴에 DB 열 이름이 들면 그 함수 파일에 남는다.** 구성원에서 `MemberProfileRow`가 `utils/filterMembers.utils.ts`에 살고 있었는데, 두 함수가 보는 것은 열 넷인데 타입은 여섯을 들어 실물은 목록 DTO 셋이 포개지는 뼈대였다 — `api`가 그것을 당겨 역방향 import도 서 있었다. 뼈대를 `.dto.ts`로 올리고 그 자리에는 함수가 보는 넷만 `MemberFilterRow`로 세웠다. 같은 슬라이스의 `sortMembers.policy.ts`가 `NamedRow`·`LeftRow`로 이미 쓰는 꼴이고, 급여의 `WageRate`가 `wageAt()` 옆에 남은 것과 같은 축이다. **가름은 「열 수가 함수가 보는 수와 같나」다**
- 돌면서 나온 것 — **`.tsx`가 선언한 타입은 밖이다.** 구성원의 `.tsx` 넷이 타입을 내보내고 화면이 그것을 당기고 있었다(`MemberDialogKind`·`MemberSheetFace`·`SheetFace`·`MemberDecision`). 넷 다 「그 컴포넌트가 어떤 얼굴을 띠나」라서 Props와 같은 자리고, 모양을 정하는 것도 그 컴포넌트다 — `*Props`를 `.tsx`에 남긴 것과 같은 축이라 옮기지 않았다. 묶음 표의 「타입 8」이 이 넷을 세고 있었다
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
- 도메인으로 쪼갠다 — 공용 다섯·알림 하나·인증 둘이고 나머지 일곱 묶음에는 SDK를 당기는 `.ts`가 없다
- `pushDeps`는 부작용과 환경값을 한 파일에 들어 `lib`으로 간 뒤 그 안에서 환경 읽기가 `config`로 갈린다. 같은 묶음(알림)의 같은 PR이 둘을 같이 한다
- 돌면서 나온 것 — **재수출이 층을 우회하고 있었다.** `screens/scheduleWorker/model/monthState.policy.ts`와 `screens/adminHome/model/todayStatus.policy.ts`가 `kstToday`를 그대로 내보내, 화면 둘이 `model`을 거쳐 바깥을 읽는 손을 당기고 있었다. `export { ... } from`은 import가 아니라 export라 「`model`에 SDK·시계 금지」 축의 어느 검사도 안 본다 — 재수출을 떼고 화면이 `lib`에서 직접 당긴다
- 돌면서 나온 것 — **`sessionStorage`의 자리를 뒤집었다.** 묶음 4가 「통신의 약속이라 `shared/api`에 남는다」로 판정한 파일인데, 그때 `lib`이 없어 `api`가 유일한 후보였다. 세션 토큰을 디스크에 쓰는 손이라 지금은 `shared/lib/sessionStorage.lib.ts`다 — 세그먼트가 늘면 앞선 판정이 다시 열린다

### AC-10 — `consts`가 선다

- 전제: `export const <대문자_스네이크>`가 파일 스물여섯에 살고 **그중 스물이 함수와 같이 산다.** `wageAmount.policy.ts` 하나가 업무 상수 하나와 문안 넷과 판정 셋을 든다
- 행동
  - `<도메인>.const.ts`로 모아 `<층>/<슬라이스>/consts/`에 둔다. `[domain]`은 슬라이스 이름이라 슬라이스마다 한 파일이다
  - `<도메인>.type.ts`에 든 상수가 나간다 — 근태 일곱, 알림 넷, 근무표 하나
  - 열거 목록이 타입의 바탕인 자리는 `consts`에 두고 `model`이 import한다(`ERROR_CODES` → `ErrorCode`)
- 관찰 결과: `consts/` 밖에 `export const <대문자_스네이크>`가 없다. `.type.ts`를 열면 타입만 있다. 셋이 초록이다
- `queryKeys`·`staleTogether`는 밖이다 — 통신의 약속이고 꼴이 camel이다
- 도메인으로 쪼갠다 — 알림 열하나·근태 아홉·구성원 여덟·급여 일곱·공용 일곱이 큰 쪽이다
- 돌면서 나온 것 — **`.tsx`의 `export const <대문자_스네이크>`는 밖이다.** 근무표에서 상수를 세어 보니 넷이 `.tsx`에 있었다 — 테스트 손잡이 둘(`SCHEDULE_HOLIDAY_SWITCH_TEST_ID`·`ADJUSTMENT_EXTRA_MINUTES_INPUT_TEST_ID`)과 드래그 접두 둘(`ROW_DRAG_PREFIX`·`SLOT_DRAG_PREFIX`)이다. 업무 값이 아니라 그 컴포넌트를 집는 식별자라 `ui`에 남는다 — ADR-015가 `*Props`를 `.tsx`에 남긴 것과 같은 축이다. AC-08의 `constsSegment.mjs`는 `.ts`만 본다
- 돌면서 나온 것 — **로컬 상수가 그물 밖이라 한 파일의 문안이 반으로 갈릴 뻔했다.** 축이 `export const <대문자_스네이크>`인데, 구성원의 알림 영역 문안 표(`COPY` 아홉)와 테마 선택지(`CHOICES`)는 export를 안 해서 옆의 상수와 같은 묶음인데 그물에 안 걸렸다. 반만 옮기면 문안을 고칠 때 두 자리를 봐야 해서 같이 보냈다 — **축은 export 여부가 아니라 「무엇인가」다.** `GENDER_LABEL` 네 벌도 같은 자리에서 걸렸다(AC-13)
- 돌면서 나온 것 — **문안 표가 `consts`로 가면 그 표의 타입이 `model`로 가야 한다.** 알림 영역의 `NotificationPromptCopy`가 `utils`에 있어, 표가 `consts`로 가면 `consts`가 그 타입을 당기고 `utils`가 다시 표를 당겨 맞물린다. 모습 셋의 타입이 이미 `model`에 있어 그 자리가 제자리였다
- 돌면서 나온 것 — **상수가 사는 자리를 가리키던 정본 셋이 같이 낡았다.** 근태의 `attendance.type.ts`는 **타입이 하나도 없고 상수 일곱뿐**이었는데, `system/runtime.md`의 「업무 상수」가 그 자리를 「ADR-015의 그 접미사가 「타입과 상수」를 담는다」로 적고 있었다 — ADR의 옛 판본을 인용하는 꼴이다. `tests/lint/attendanceConstants.ts`는 그 경로를 문자열로 들어 파일이 옮겨지면 셋 다 `missing-from-constants`로 터지고, 짝 테스트의 픽스처도 같은 경로를 임시 디렉터리에 쓴다. plan 둘(`attendance-data`·`payroll-data`)도 그 경로를 「정본이다」로 적었다. **상수를 옮기는 묶음은 그 상수의 자리를 가리키는 문서와 검사를 같이 센다** — 묶음 표의 「이동할 것」 칸이 그것까지 세지 않는다
- 돌면서 나온 것 — **가름이 테스트도 가른다.** `fontLoading.ts`의 짝 테스트가 자산 표 검사와 판정 둘 검사를 한 파일에 들고 있었다. 구현이 `consts`와 `utils`로 갈리면 테스트 하나가 두 대상을 보게 되고 「짝 테스트는 대상 옆에」가 깨진다 — `consts/__tests__/font.const.test.ts`와 `utils/__tests__/fontLoading.utils.test.ts`로 같이 갈랐다. 단언은 한 줄도 안 바뀐다

### AC-11 — `config`가 선다

- 전제: 환경값을 읽는 자리가 넷이다 — `readSupabaseEnv`(Supabase 주소·키), `readAppUrl`(앱 주소), `pushDeps`(EAS 프로젝트 id·플랫폼), `authRedirect.utils`(실행 환경)
- 행동
  - `shared/config/`를 세워 `readSupabaseEnv`·`readAppUrl`을 옮긴다. ADR-015의 「캐시 키는 `api`고 설정은 `config`다」가 그 자리를 정한다
  - `pushDeps`와 `authRedirect`에서 환경 읽기만 `<도메인>.config.ts`로 가른다
  - `__DEV__`를 인자로 받는 둘(`isDevDoorOpen`·`isCatalogVisible`)은 **안 건드린다** — 받아서 판정하는 꼴이라 이미 순수하다
- 관찰 결과: `config/` 밖에 `process.env`·`Constants` 읽기가 없다. 셋이 초록이다
- 도메인으로 쪼갠다 — 공용 둘(`readSupabaseEnv`·`readAppUrl`)·알림 하나(`pushDeps`)·인증 하나(`authRedirect.utils`)다

### AC-12 — controller가 선다

- 전제: `.tsx` 마흔넷이 상태·효과를 들고 호출이 **이백아흔둘**이다. 그중 스물여섯이 repository를 직접 당기고 아흔여섯이 service를 controller 없이 부른다. `ui`가 `hooks`를 당기는 자리는 **셋**뿐이다. `DayDetail.tsx` 하나가 서른셋을 든다
- 행동
  - 화면마다 `screens/<슬라이스>/hooks/use<화면>.ts`를 세워 업무 상태와 효과와 핸들러를 옮긴다. `.tsx`는 그 훅이 돌려준 것을 구조분해해 그린다
  - **통신도 같이 내려간다.** `.tsx`가 당기는 repository 스물여섯과 Supabase 클라이언트 스물다섯이 controller로 가고, 거기서 service 훅을 부른다. 이 축을 빼면 「`api/` 밖에서 클라이언트 import 금지」를 영구히 못 켠다
  - **에러 코드 판정도 내려간다.** `error.code === "already_decided"` 꼴이 화면 파일 여섯에 열다섯 건 있다 — `model/<도메인>.policy.ts`가 받는다
  - **UI를 담당하는 상태는 `.tsx`에 남는다.** 측정한 너비·포커스·시트 열림·팝오버 열림이 그것이고, 통신 중·실패·서버에서 온 값은 내려간다. 뒤 넷은 대개 React Query가 `isPending`·`isError`·`data`로 이미 준다
  - `shared/ui/DragAndDrop.tsx`는 가른다 — Context와 그것을 읽는 훅 둘이 `shared/stores/drag.context.ts`로, Provider와 컴포넌트 둘은 `ui/`에 파일을 나눠 남는다. 삼백한 줄에 export 다섯을 든 자리다
  - `shared/ui`에서 상태를 든 여섯은 **안 건드린다** — 측정한 너비(`DayBand`·`TrendChart`·`Segment`)·포커스(`Input`)·드래그 중(`DragAndDrop`)·사라지는 타이머(`FloatingToast`)고 업무 상태가 하나도 없다
  - `src/app/`의 스물둘은 라우트 파일이라 **얇게 남긴다** — `_layout.tsx`의 효과 다섯은 앱 수명이고 화면 상태가 아니다
  - **문안 표도 같이 내려간다.** `.tsx`에 로컬 `const`로 사는 문안·초기값 표가 여덞이다 — 확인창 여섯 벌(`MemberDialog`의 `COPY`), 거절·차단 확인(`MemberDetailSheet`의 `CONFIRM_COPY`), 「이미 정해졌어요」 셋(`ALREADY_DECIDED`), 빈 값 넷(`INITIAL_FORM`·`EMPTY_TALLY`·`EMPTY_VALUES`). export를 안 해서 AC-10의 그물 밖이었고 `consts/`가 받는다. 구성원 묶음에서 `GENDER_LABEL` 네 벌이 이 꼴로 걸렸다(AC-13)
  - 빼낸 훅마다 짝 테스트가 붙어 TDD를 탄다
- 관찰 결과: `api`·`services`·`hooks`를 당기는 `.tsx`에 상태가 없다. `ui`가 `api`를 당기는 자리가 0이다. 셋이 초록이다
- 보드의 `dumb-ui-widen`이 이 걸음이다 — 그 행이 든 「업무 상수와 판정과 가공 함수가 화면 파일에 남았다」는 AC-10과 이 묶음이 같이 걷는다
- **도메인 열로 쪼개 병렬로 돈다.** 이 묶음만 병렬이 되는 까닭은 빼낸 훅을 그 화면의 `.tsx` 하나만 부르기 때문이다 — 밖에서 당기는 import가 없어 다른 묶음의 줄을 안 고친다
- 큰 파일을 책임으로 쪼개는 일이 같이 간다. `DayDetail.tsx` 969줄과 `PendingScreen.tsx` 689줄은 훅을 빼도 여전히 여러 책임을 들고 있어 조각을 가른다

### AC-14 — `services`가 선다

- 전제: `hooks/` 예순다섯 중 **예순둘이 Query·Mutation**이다. 그 폴더가 사실상 `services`인데 이름이 그걸 안 말하고, AC-12가 controller를 같은 이름 폴더에 넣으면 역할 둘이 층으로만 갈린다
- 행동
  - `use[Action]Query.ts`·`use[Action]Mutation.ts`를 `<층>/<슬라이스>/services/`로 `git mv`한다. 짝 테스트를 같이 옮겨 **백스물넷**이다
  - `features/stats/hooks/useAttendanceMonths.ts`는 `services/useAttendanceMonthsQuery.ts`로 — 쿼리 둘을 조립하는 service고 접미사를 못 받고 있었다
  - `features/auth/hooks/wireAutoRefresh.ts`는 `lib/wireAutoRefresh.lib.ts`로 — 훅이 아니고 세션 자동 갱신을 켜는 부작용이다
- 관찰 결과: `services/` 밖에 `useQuery`·`useMutation` 호출이 없다. `hooks/`에는 controller와 UI 훅만 남는다. 셋이 초록이다
- 묶음별로 쪼갠다 — 근무표 60 ✅ · 구성원 20 ✅ · 급여 16 ✅ · 리허설 12 · 알림 10 · QR 4 · 근태 2 ✅다
- 돌면서 나온 것 — **`hooks/`가 네 묶음 연속으로 통째로 비었다.** 근무표 열하나·급여 넷·구성원 다섯·근태 하나고 Query·Mutation 밖의 파일이 하나도 없었다. 「`hooks/`가 사실상 `services`였다」는 전제가 네 묶음에서 그대로 확인됐다는 뜻이고, AC-12가 `hooks/`를 새로 만드는 자리가 된다
- 돌면서 나온 것 — **쓰기 셋에 Mutation이 없다.** 근태의 `checkIn`·`submitExcuse`·`decideExcuse`가 `api/`에만 있고 그것을 감싸는 Mutation 훅이 없어 `.tsx`가 저장소를 직접 부른다. 이 묶음의 `services/`가 Query 하나뿐인 까닭이고, AC-12가 controller를 세울 때 그 셋이 같이 내려간다
- 돌면서 나온 것 — **근무표의 `hooks/` 열하나가 통째로 비었다.** Query·Mutation 밖의 파일이 하나도 없어 폴더를 `git mv` 하나로 옮겼다. controller가 그 자리에 선 뒤 같은 이름 폴더에 역할 둘이 섞이지 않는다는 뜻이고, AC-12가 `hooks/`를 새로 만드는 자리가 된다
- 돌면서 나온 것 — **주석의 「구현 대상」 경로 스물여섯이 또 뒤처졌다.** [관찰 050](../../observations/050-comment-paths-checked-by-nothing.md)이 든 자리고 이번에도 import 치환이 안 집었다. 옮긴 뒤 실재하지 않는 `src/` 경로를 전수로 뽑아 0으로 맞췄다 — 세그먼트를 옮기는 PR마다 이 걸음이 든다

### AC-15 — `stores`가 선다

- 전제: zustand store 둘의 자리가 갈려 있다 — `entities/clock/stores/clock.store.ts`와 `shared/hooks/useTheme.ts`다. ADR-015가 「`use*`로 불리는 store는 부르는 이름이 이긴다」로 봉합하고 있었다
- 행동
  - 둘을 `<층>/stores/`로 옮긴다. `useTheme.ts`는 `shared/stores/theme.store.ts`가 되고 쓰는 쪽은 그대로 `useTheme()`이다
  - `shared/ui/DragAndDrop.tsx`의 Context와 훅 둘이 `shared/stores/drag.context.ts`로 — AC-12와 같은 걸음이다
  - 「`use*` export는 `hooks`·`services`·`stores`만」으로 규칙을 넓힌다
- 관찰 결과: `stores/` 밖에 `create()`·`createContext` 호출이 없다. 셋이 초록이다
- 파일 둘이라 공용 묶음이 같이 한다
- 돌면서 나온 것 — **`.store.ts`가 「훅 파일은 그 훅 이름과 같다」와 부딪혔다.** `theme.store.ts`가 `useTheme`을 내보내니 `fileNaming.ts`가 파일 이름을 `useTheme.ts`로 요구했다. ADR-015가 그 자리를 폴더와 접미사에 맡겼으므로 `stores/*.store.ts`만 훅 판정에서 빼는 면제가 섰다 — 같은 폴더의 다른 파일은 면제 밖이고, 그 경계를 테스트 둘이 지킨다
- 돌면서 나온 것 — **store 둘이 저장과 상태를 한 파일에 들고 있었다.** 디스크를 읽고 쓰는 손이 `create()` 옆에 있어 `stores`가 바로 `lib`의 일을 했다. `themeStorage.lib.ts`와 `clockStorage.lib.ts`로 떼어, store는 값을 들고 `lib`이 디스크에 닿는다 — ADR-015의 「`stores`는 누가 값을 들고 있느냐」가 그 가름이다

### AC-13 — 중복 넷이 접힌다

- 전제: 같은 이름의 export 함수가 두 자리에 산다
  - `canGoBack`·`canGoForward` — `screens/payroll/model/boundary.policy.ts`와 `shared/utils/monthBoundary.ts`
  - `dayMinutes` — `features/payrollCompute/model/dayMinutes.policy.ts`와 `features/stats/model/workTotals.policy.ts`
  - `attendanceSummaryLine` — `screens/scheduleWorker/model/attendanceColumn.policy.ts`와 `screens/stats/utils/attendanceSummaryLine.utils.ts`
- 행동: 몸이 같은 것은 하나로 접고, 다른 것은 **이름을 갈라** 무엇이 다른지 이름이 말하게 한다
- 관찰 결과: 같은 이름의 export 함수가 두 자리에 없다. 셋이 초록이다
- 묶음 6가가 `monthStart` 사본 넷을 접은 것과 같은 일이다
- 넷이 묶음을 가로지른다 — `canGoBack`·`canGoForward`는 급여와 공용, `dayMinutes`는 급여와 통계, `attendanceSummaryLine`은 근무표와 통계다. **뒤에 오는 쪽의 이동 PR이 접는다** — 둘 다 자리를 잡은 뒤에야 어느 쪽으로 접을지 보인다
- 돌면서 나온 것 — **`canGoBack`·`canGoForward`는 몸이 달라 이름을 갈랐다.** 달을 견주는 쪽은 첫 근무표 달과 이번 달을 보고, 기간을 견주는 쪽은 `Period`를 받아 승인일과 퇴사일을 본다 — 같은 질문의 두 답이 아니라 다른 질문이다. 축을 이름에 넣어 `canGoToPreviousMonth`·`canGoToNextMonth`와 `canGoToPreviousPeriod`·`canGoToNextPeriod`가 됐다
- 돌면서 나온 것 — **plan이 안 든 중복이 급여 안에 또 있었다.** `WageRateRow`(`getPayrollMonth`)와 `MemberWageRateRow`(`getWageRates`)가 몸이 같다. 같은 슬라이스라 바로 접었고 뒤의 이름을 남겼다 — `DefaultWageRateRow`와 짝이 서서 「구성원 것」과 「기본값」이 이름으로 갈린다. **중복을 찾는 축이 함수 이름뿐이었던 것이 까닭이다** — 같은 이름 export 함수는 세어 뒀는데 타입은 안 셌다
- 돌면서 나온 것 — **같은 값이 다섯 벌 선 자리가 있었다.** 성별이다. 타입이 둘(`ProfileGender`·`Gender`), 좁히는 판정이 둘(`isProfileGender`와 `PersonSheet.tsx`의 손 비교), 이름표가 넷(`GENDER_LABEL`이 화면 넷에 각자)이다. 타입과 판정은 접고 이름표는 `entities/profile/consts/` 한 벌로 모아 읽는 손을 `spellGender`로 세웠다. **급여에서 축이 함수 이름뿐이었던 것을 타입으로 넓혔는데 이번에는 이름이 다른 중복이었다** — `Gender`와 `ProfileGender`는 이름이 다르고 `GENDER_LABEL` 넷은 로컬이라 export 그물 밖이다. 같은 몸(`"female" | "male"`)과 같은 값(`여성`·`남성`)으로 찾아야 걸린다
- 돌면서 나온 것 — **다섯째 벌은 문안 결정을 받아야 접혔다.** `scheduleAdmin`의 `genderLabel()`이 「여」·「남」 한 글자였고 `schedule-admin.md`의 문안 표가 그것을 정본으로 들고 있었다. 결정은 「**값을 읽는 자리는 전부 「여성」·「남성」이고 고르는 세그먼트만 한 글자**」다 — `genderLabel()`을 걷어 `spellGender`로 접었다. 뿌리는 `account/README.md`의 ACC-002가 「성별은 「여」·「남」 둘 중 하나」로 고르는 선택지를 적은 것이었고, 그 글자가 읽는 꼴로도 읽혀 시안 캡션까지 그렇게 인용하고 있었다([관찰 040](../../observations/040-sian-captions-cite-what-they-invent.md)이 「여성」을 어긋남으로 잡은 자리고 이 결정이 그 판정을 뒤집는다). **판정 하나가 코드·문서·시안 셋에 걸쳐 열두 자리를 움직였다** — [관찰 053](../../observations/053-gender-label-copy-has-no-canon.md)
- 돌면서 나온 것 — **근태에 plan이 안 든 중복이 셋 더 있었다.** `DayAttendance`와 `MonthAttendance`가 몸이 글자까지 같고(날 키와 달 키가 같은 모양을 내는 것이 의도인데 그 사실이 타입 둘로 적혀 있었다), 질의할 열 목록 둘도 두 `.api.ts`의 사본이고, `nextMonthFirstDay`가 `nextMonthStart`의 **다섯째 사본**이었다(공용 묶음이 접은 넷에 안 들어 있었다). 앞의 둘은 `AttendanceRows` 하나로 접었다 — 날·달 중 하나를 가리키던 두 이름 대신 중립 이름을 쓴 것은 양쪽이 같이 쓰는 꼴이라서다. `screens/approvals`의 `CUSTOM_MAX_LENGTH`도 판정 파일과 `.tsx`에 각자 있었다
- 돌면서 나온 것 — **`ExcuseStatusRow`는 몸이 같아도 못 접는다.** `entities/attendance`와 `entities/payroll`에 각자 있고 다섯 열이 글자까지 같은데, 접으려면 `entities`끼리 import가 생겨 `no-cross-slice-import`에 걸린다. 올릴 자리도 없다 — `shared`에 두면 「`shared`는 도메인을 모른다」가 깨지고, `features`는 통신 계약을 소유할 층이 아니다. **사본 둘이 그 규칙의 값이다**

### AC-08 — 검사 열일곱이 선다

**번호는 여덟인데 차례는 마지막이다.** AC-09~AC-13이 뒤에 생겨 문서 차례와 번호가 어긋났다 — 번호를 다시 매기면 merge된 PR 본문과 커밋 메시지가 가리키는 이름이 깨진다.

- 전제: `house/dumb-ui`가 `.tsx`의 Supabase import·`fetch()`·쿼리 훅 호출만 잡는다. 세그먼트와 층의 뜻과 접미사를 지키는 검사가 없다
- 행동: 규칙을 더하고 `tests/lint/`에 각각의 테스트를 쓴다. [execution.md의 「집행되는 규칙」](../../4-test/execution.md#집행되는-규칙) 표에 행을 더한다 — `tests/lint/ruleCatalogue.test.ts`가 그 표를 정본으로 읽는다
  - `api/` 밖에서 Supabase 클라이언트 import 금지
  - `hooks`·`services`·`stores` 밖에서 `use*` export 금지
  - `entities/`의 Mutation 금지 · `features/`의 Query는 `entities` 둘 이상을 읽을 때만 — 이름으로 주는 면제를 안 쓴다
  - `.policy.ts`·`.reducer.ts`에서 통신·`Date.now`·`Math.random` 금지
  - 캐시 키 배열 리터럴 금지 — `queryKeys` 팩토리만 쓴다
  - `consts/` 밖에서 `export const <대문자_스네이크>` 금지 — `queryKeys`·`staleTogether`는 예외다(camel이고 통신의 약속이다)
  - `process.env`·`Constants`를 `config/` 밖에서 읽기 금지
  - `expo-*`·`react-native` SDK를 `lib/`·`ui/`·`hooks/` 밖에서 import 금지 — 타입만 import하는 것은 통과시킨다
  - `api`·`services`·`hooks`를 당기는 `.tsx`에서 상태 금지 — `className` 조립과 `isLoading` 분기는 통과시키고, 아무것도 안 당기고 상태만 든 `.tsx`도 통과시킨다
  - `.dto.ts`를 `api/` 밖에서 import 금지 — DTO는 통신의 계약이라 `api` 세그먼트를 안 떠난다
  - `services/` 밖에서 `useQuery`·`useMutation` 금지
  - `stores/` 밖에서 `create()`·`createContext` 금지
  - `ui/`에서 `api/` import 금지
  - `screens/*/ui`·`shared/ui`·`entities/*/ui`에서 `services/` import 금지 — `features/*/ui`만 자기 슬라이스의 service를 부른다
  - 접미사가 사는 세그먼트와 맞는지 — `fileNaming.ts`
  - 이름이 camelCase인지 · 폴더 이름이 camelCase인지 — `fileNaming.ts`가 AC-01·AC-02에서 이미 본다
- 관찰 결과: 각 규칙이 위반 픽스처에서 걸리고 정상 픽스처를 통과시킨다. 저장소 전체가 열일곱을 통과한다
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
| `api` | `database` `databaseTypes` `errors` `supabase` `createSupabaseClient` **`queryKeys`(다섯에서 모음)** `queryClient` `monthsQuery` |
| `model` | `error.type` `font.type` `theme.type` |
| `consts` | `error.const` `font.const` `noValue.const` `theme.const` |
| `config` | `supabase.config` `app.config` |
| `lib` | `kstToday.lib` `reduceMotion.lib` `sessionStorage.lib` `themeStorage.lib` |
| `stores` | `theme.store` |
| `utils` | `kstDate` `spellNumber` `cn`(`lib`에서 이름 바꿈) `monthBoundary` **`monthRange`(새로 선다)** `miniCalendar` `monthPicker` `dayBand` `catalogVisibility` `devDoor` `theme.utils` `fontLoading.utils` |
| `ui` | 조각 쉰하나 — 그대로 |

`shared/model`에 도메인 타입은 없고 오류·서체·테마의 꼴만 산다 — 홀의 업무가 아니라 앱 자체의 값이라 슬라이스가 없다. `theme`가 `api`가 아닌 까닭은 색과 서체가 통신과 무관한 값이기 때문이고, env를 읽는 둘은 통신 설정이 아니라 환경이 주는 값이라 `config`다.

**세그먼트가 서면서 공용 파일 다섯이 갈렸다.** 한 파일이 타입과 상수와 판정과 저장을 같이 들고 있던 자리다.

| 갈린 파일 | 나온 조각 |
| --- | --- |
| `shared/api/errors.ts` | `model/error.type`(가름의 꼴) · `api/errors`(Supabase 객체를 받는 변환) |
| `shared/utils/theme.ts` | `model/theme.type` · `consts/theme.const` · `utils/theme.utils` · `lib/themeStorage.lib` |
| `shared/utils/fontLoading.ts` | `model/font.type` · `consts/font.const` · `utils/fontLoading.utils` |
| `shared/utils/kstDate.ts` | `lib/kstToday.lib`(제가 `new Date()`를 부른다) · 나머지 여섯은 `utils`에 남는다 |
| `entities/clock/model/clock.store.ts` | `consts/clock.const` · `lib/clockStorage.lib` · `stores/clock.store` |

**`month-range`가 새로 선다.** `monthStart`와 `nextMonthStart`가 dal 넷에 사본으로 산다 — `getMonthSchedule`이 내보내고 `getMonthAttendance`·`getMyAvailability`·`getPayrollMonth`가 각자 제 사본을 든다. 내보내는 쪽을 당기는 셋(`getOpenSlots`·`getMonthAvailabilities`·`getSlotRequests`)은 지금 같은 슬라이스라 안 걸리지만 AC-07이 쪼개면 교차가 된다. 한 자리로 올리고 사본 셋을 지운다.

**zustand store 둘이 `stores/`에서 같은 접미사를 받는다.** `use*`로 불리느냐로 자리를 갈랐던 앞선 판을 AC-15가 뒤집었다 — 폴더가 성격을 말하니 `shared/stores/theme.store.ts`와 `entities/clock/stores/clock.store.ts`가 나란히 서고 쓰는 쪽은 그대로 `useTheme()`이다.

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
| `tests/lint/fileNaming.ts` | `kebab` 갈래를 `camel`로 — AC-01. 폴더 이름 검사 — AC-02. `stores/*.store.ts`를 훅 판정에서 빼는 면제 — AC-15. 접미사 검사 — AC-08 |
| `eslint-rules/supabaseClientInApi.mjs` | 신설 — `api/` 밖에서 Supabase 클라이언트 import를 막는다 |
| `eslint-rules/hooksSegment.mjs` | 신설 — `hooks/` 밖의 `use*` export를 막는다 |
| `eslint-rules/readWriteLayers.mjs` | 신설 — `entities/`의 `useMutation`과 `features/`의 `useQuery`를 막는다 |
| `eslint-rules/purePolicy.mjs` | 신설 — `.policy.ts`의 통신·시계·난수를 막는다 |
| `eslint-rules/constsSegment.mjs` | 신설 — `consts/` 밖의 `export const <대문자_스네이크>`를 막는다 |
| `eslint-rules/configSegment.mjs` | 신설 — `config/` 밖에서 `process.env`·`Constants`를 읽는 것을 막는다 |
| `eslint-rules/nativeSdkSegment.mjs` | 신설 — `lib/`·`ui/`·`hooks/` 밖에서 `expo-*`·`react-native` SDK import를 막는다 |
| `eslint-rules/dumbUi.mjs` | `.tsx`의 `useState`·`useEffect`·`useReducer`를 막는 축을 더한다 — **AC-12가 끝나야 켠다** |
| `eslint-rules/dtoSegment.mjs` | 신설 — `api/` 밖에서 `.dto.ts` import를 막는다 |
| `eslint-rules/servicesSegment.mjs` | 신설 — `services/` 밖의 `useQuery`·`useMutation`을 막는다 |
| `eslint-rules/storesSegment.mjs` | 신설 — `stores/` 밖의 `create()`·`createContext`를 막는다 |
| `eslint-rules/uiBoundary.mjs` | 신설 — `ui/`의 `api/` import와, `features/*/ui` 밖 `ui/`의 `services/` import를 막는다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` | 신설 규칙 열하나를 등록한다 |
| `tests/lint/supabaseClientInApi.test.ts` 외 열 | 신설 — 규칙마다 위반·정상 픽스처 |
| `docs/4-test/execution.md` | 「집행되는 규칙」 표에 행 열둘을 더하고 파일 이름 규칙 행의 문장을 camel과 접미사로 고친다 — `tests/lint/ruleCatalogue.test.ts`가 그 표를 정본으로 읽는다 |
| `scripts/syncEdgeShared.mts` | 복사 경로 넷 — 알림 셋이 `entities/notification/`의 `consts/`·`model/`·`utils/`로, 공휴일 하나가 `features/holiday/model/`로. AC-10이 상수를 `consts/`로 보내 그 줄이 섰다 |
| `eslint-rules/noNodeImportInEdgeShared.mjs` | 같은 경로 한 줄 |
| `tests/lint/attendanceConstants.ts` | 상수 파일 경로를 문자열로 박아 뒀다 — AC-10이 그 파일을 `consts/attendance.const.ts`로 옮겨 이 줄과 짝 테스트의 픽스처 경로가 같이 갔다 |

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
| [runtime.md](../../2-design/system/runtime.md) 「업무 상수」 | 「상수는 `src/entities/<도메인>/model/<도메인>.type.ts`에 산다」 → `consts/<도메인>.const.ts`. AC-10이 상수를 `.type.ts`에서 빼내 그 자리를 옮긴다 | AC-10(근태) |
| `tests/lint/attendanceConstants.ts` | 그 경로를 문자열로 박아 둔 한 줄 | AC-10(근태) |

**완료된 과거 plan은 안 건드린다.** [3-build 안내](../README.md#구현-계획)가 「완료된 과거 계획은 소급 변경하지 않는다」고 적는다 — `login-screens`·`rehearsal`·`stats-worker` 등 열 넘는 plan이 `shared/lib`과 kebab 경로를 들지만 그것은 당시 작업의 기록이다.

## 구현 순서

PR 하나씩 나른다. **이동하는 묶음은 앞의 것이 merge되고 나서 다음을 뗀다** — 같은 파일을 연달아 옮기므로 겹치면 충돌이 손으로 풀 수 없게 커진다. 안쪽 묶음은 그 제약이 없어 같이 돈다 — [「남은 묶음을 도메인으로 가른다」](#남은-묶음을-도메인으로-가른다)가 그 가름을 든다.

1. **AC-01 — 파일 이름 camel.** ✅ 535개를 `git mv`했다
2. **AC-02 — 폴더 이름 camel.** ✅ `screens/` 다섯을 `git mv`하고 폴더 검사를 세웠다
3. **AC-03 — 캐시 키 팩토리.** ✅ 여섯과 dal 키 함수 여섯을 `shared/api/queryKeys.ts` 하나로. 키 하나를 정본 쪽으로 되돌렸다 — 관찰 045의 겹침
4. **AC-04 — 통신을 `api/`로 + `.api.ts`** ✅ 172개를 `git mv`했다
5. **AC-05 — 훅을 `hooks/`로 + 층 가르기 + `Query`·`Mutation`** ✅ 205개를 `git mv`하고 `useStatsQueries`를 넷으로 갈랐다 — 관찰 046
6. **AC-06가 — `shared/` 재편 + 교차를 만드는 순수 함수 추출** ✅ 쉰아홉을 `git mv`하고 `monthStart` 사본 넷을 접었다. 교차가 0이 됐다
7. **AC-07 — 슬라이스 쪼개기** ✅ 268개를 `git mv`했다. 교차 0이고 깨져 있던 엣지 import 셋을 고쳤다
8. **AC-06나-1 — `model`/`utils` 가르기 + 접미사** ✅ 123개와 짝 테스트 120개를 `git mv`했다. 판정 예순하나·꼴 바꾸기 쉰여섯·타입 셋·검증 둘·store 하나
9. **이동 열 — 도메인 열을 직렬로.** PR 하나가 그 도메인의 타입과 DTO·매퍼(AC-06나-2)·`lib`(AC-09)·`consts`(AC-10)·`config`(AC-11)·`services`(AC-14)·`stores`(AC-15)·중복(AC-13)을 같이 옮긴다. 순서는 공용 → 근무표 → 급여 → 구성원 → 근태 → 알림 → 리허설 → 통계 → 인증 → QR이고, 앞의 것이 main에 든 뒤 다음을 딴다
10. **안쪽 열 — 도메인 열을 병렬로.** AC-12다. PR 하나가 그 도메인 `.tsx`의 업무 상태와 효과와 통신을 `screens/<슬라이스>/hooks/`의 controller로 빼고, 에러 코드 판정을 `model`로 내리고, 큰 파일을 책임으로 쪼갠다. worktree를 열로 떼어 같이 돈다
11. **AC-08 — 검사 열일곱** 상태 금지와 「`ui`에서 `api` import 금지」는 안쪽 열이 끝나야 켠다

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
- **DTO를 도메인 모양으로 바꾸기** — `.dto.ts`에 자리는 여기가 세우고, 매퍼로 열 이름을 옮기는 일은 [dto-to-domain-shape](dto-to-domain-shape.md)가 받는다. **도메인 축으로 못 가르기 때문이다** — DB 열 이름이 `api/` 밖 파일 쉰여덟에 닿고 `ScheduleDay` 하나가 묶음 넷(근무표·급여·통계·근태)에 걸려, 이동 PR 안에서 바꾸면 그 넷이 한 PR이 된다. 필드 축으로 가르면 열 이름 하나가 저장소 전체를 한 번에 지나고 묶음 경계를 안 본다
