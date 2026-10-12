---
status: proposed
---

# 리팩터 뒤 전체 감사

`src` 802 파일(테스트 467 밖)과 `scripts` 14, `supabase/functions` 3, `tests/` 69, `eslint-rules` 38을 TypeScript AST로 전수 훑었다. 코드는 한 줄도 안 고쳤다. 앞선 감사 셋 — [codebase-refactor-triage](codebase-refactor-triage.md), [declarative-refactor-triage](declarative-refactor-triage.md), [canon-and-code-divergence](canon-and-code-divergence.md) — 가 든 자리는 가리키기만 하고 다시 세지 않았다. 문서가 거짓이 된 자리는 셋째 감사의 축이라 여기서는 코드 쪽 하나만 본다.

`pnpm lint`는 초록이다(7초). 아래 자리는 규칙이 안 보는 자리라 초록인 채로 남아 있다.

**결론 셋.**

1. **로그아웃이 push 토큰을 안 지운다.** `features/auth/lib/signOut.lib.ts:15`의 `DEVICE_CLEANUP_NOT_WIRED_YET`이 `removePushToken`과 `clearPersistedState`를 빈 함수로 꽂고, `useSignOutMutation`이 그것을 그대로 쓴다. [account/design.md](../2-design/modules/account/design.md):123은 「기기 주소는 로그아웃에서 `remove_push_token`을 먼저 부른다」고 적었고, `removePushToken.api.ts`는 테스트만 당긴다.
2. **실패를 한 번도 읽지 않는 controller가 아홉이다.** service 셋이 반환 객체에서 `error`를 빼고(`session-error-is-swallowed`와 같은 꼴), controller 파일 아홉에는 `error`·`isError`·`failed`라는 낱말이 하나도 없다. `useWagesScreen`의 상태 union은 `pending`·`empty`·`ready` 셋이라 질의가 실패하면 「비었다」로 그려진다.
3. **짝 테스트가 이름을 안 부르는 export가 쉰여섯이다.** 규칙 15는 파일을 쓰는 순간만 보고 저장소 전체를 보는 검사는 매퍼 열둘에만 있다. 짝 파일은 있는데 그 안이 한 번도 부르지 않는 export가 39 파일에 56개고, 짝이 없는 `model`·`lib`·`stores` 파일이 여덟이다.

**진행 중인 묶음이 하나 있다.** `effect-derived-values`가 `useEffect`의 파생 상태·`useEffectEvent`·`useReducer`·평평한 union 셋을 고친다. 그 축은 세기만 했다 — setter를 부르는 effect 14(setter만 부르는 것 4), 한 손이 setter 둘 이상 28, 중첩 삼항 3, `as` 단언 3, 평평한 글자 union 상태 별칭 5. **묶음 진행 중, merge 뒤 다시 센다.** 새로 찾은 것은 없다.

## 축 ① — 죽은 가지

export 2,200개를 모아 import 그래프에 맞췄다. 라우트 파일의 default export와 `index.ts` 재수출은 밖이다.

| 가름 | 수 | 거짓 양성으로 뺀 것 |
| --- | --- | --- |
| 어디서도 import 안 되는 export | 373 — 값 17 · 타입 356 | 값 가운데 `CHECK_IN_WINDOW_CLOSE_HOUR_KST`(`tests/lint/attendanceConstants.ts`가 글자로 읽는 대조 대상) · `Constants`·`TablesInsert`·`TablesUpdate`(생성물) · `eslint-rules/index.mjs` default(`eslint.config.mjs`가 당긴다 — 루트 파일을 안 훑었다) · `scripts/moduleAliasHooks.mjs`의 `resolve`(Node loader API) |
| 테스트만 import하는 값 export | 361 — `src` 42 | `_shared`로 복사돼 Edge Function이 부르는 다섯(`parseHolidayApiResponse`·`toHolidayImportEntry`·`splitPushResults`·`buildPushMessages`·`chunkPushMessages`) |
| 프로덕션 어디서도 import 안 하는 `src` 파일 | 17 | Edge 공유 셋 |

### 아무도 안 부르는 값

| 자리 | 무엇 | 무게 |
| --- | --- | --- |
| `src/shared/ui/DraggableSheet.tsx` | 50줄 파일을 아무도 당기지 않는다. [관찰 028](../observations/028-sheet-handle-doc-and-piece-disagree.md)이 가리키는 그 조각이다 | 중간 |
| `src/entities/attendance/consts/attendance.const.ts:13` | `EXCUSE_BODY_MAX_LENGTH` — 코드도 테스트도 대조도 안 읽는다 | 낮음 |
| `src/entities/schedule/model/schedule.type.ts:3` · `src/screens/adminHome/model/homeTileSummary.policy.ts:1` | `Position`·`HomeTileState` — 자기 파일에서도 안 쓰는 타입 | 낮음 |
| `attendanceStatus.policy.ts:28` `excuseDeadlineAt` · `AdjustChoiceSheet.tsx:9`·`DayDetailCard.tsx:9`의 `*_TEST_ID` · `Text.tsx:4` `MAX_FONT_SIZE_MULTIPLIER` | 자기 파일에서만 쓰는데 export가 붙어 있다 | 낮음 |

타입 356 가운데 352는 `*Props`처럼 자기 파일에서 쓰는 것이다. export만 군더더기고 지우면 TS가 잡는다.

### 테스트만 부르는 프로덕션 코드 — 파일 14

프로덕션에서 아무도 부르지 않는 함수·상수가 27이고, 그 가운데 파일 전체가 그런 것이 14다. 지울 자리가 아니라 **막힌 task를 기다리는 자리**가 대부분이다.

| 기다리는 행 | 파일 |
| --- | --- |
| `attendance-checkin` (blocked) | `features/attendanceCheckin/api/checkIn.api.ts` — 그 슬라이스에 파일이 이것 하나다 |
| `attendance-excuse` (blocked) | `entities/excuse/api/getMyExcuses.api.ts` · `features/excuse/api/decideExcuse.api.ts` · `submitExcuse.api.ts` · `entities/attendance/model/attendanceColumn.policy.ts` · `communicationDelay.policy.ts` · `utils/summarizeAttendanceStatuses.utils.ts` |
| `hall-location` (blocked) | `features/qrAdmin/api/setHallLocation.api.ts` |
| 로그인 화면 (`src/app/login.tsx`가 `NotBuiltYet`) | `features/auth/lib/handleAuthCallback.lib.ts` · `utils/authRedirect.utils.ts` |
| 결론 1 | `features/pushSwitch/api/removePushToken.api.ts` |
| 드는 행이 없다 | `entities/notification/api/getPushReachable.api.ts` · `shared/lib/reduceMotion.lib.ts`의 `motionDistance` |

파일은 살았는데 함수만 아무도 안 부르는 것이 열셋 더 있다 — `entities/clock/model/serverClock.policy.ts`의 `remainingMs`·`isExpired`, `features/payrollCompute/model/period.policy.ts`의 `periodMonthKeys`·`isInPeriod`, `utils/payrollTotal.utils.ts`의 `weekTotals`·`monthTotal`, `entities/schedule/utils/agendaRow.utils.ts`의 `filterAgendaDays`, `entities/session/model/resolveAuthDestination.policy.ts`의 `resolveGateMove`, `shared/model/miniViewDensity.policy.ts`의 `miniViewDensity`, `shared/consts/font.const.ts`의 `FONT_ASSETS`, `entities/attendance/consts/attendance.const.ts`의 `CHECKED_AT_DEVICE_TOLERANCE_MINUTES`, `entities/attendance/api/getDayAttendance.api.ts`의 `getDayAttendance`, `entities/notification/api/getNotifications.api.ts`의 `NOTIFICATION_COLUMNS`. 테스트가 당기니 초록이고, 그래서 안 보인다.

`NotBuiltYet`을 그리는 라우트가 셋이다 — `/`(`(tabs)/index.tsx`)·`/check-in`·`/login`.

### 도달 불가 분기

**없다.** `switch` 열 가운데 `default`가 있는 것은 `period.policy.ts:147` 하나고, 그것은 글자를 union으로 좁히는 입구라 산 가지다. 상수 조건 `if`와 좌우가 같은 비교는 0이다.

## 축 ② — 그물이 없는 자리

[strategy.md](../4-test/strategy.md)는 계산·변환·검증·전이를 unit에, DB 계약을 integration에 두고, 조각 `.tsx`는 그 안에 동작이 있을 때만 짝을 붙인다. 그 기준으로 세그먼트마다 셌다. 「실행 export」는 함수·클래스·함수 표현식을 내보내는 파일이다.

| 세그먼트 | 파일 | 실행 export 있음 | 짝 없음 | 어느 테스트도 안 당김 | 짝은 있는데 안 부르는 export |
| --- | --- | --- | --- | --- | --- |
| `api` | 94 | 79 | 1 | 0 | 11 |
| `config` | 4 | 4 | 0 | 0 | 0 |
| `consts` | 60 | 0 | — | — | — |
| `hooks` | 79 | 79 | 0 | 0 | 0 |
| `lib` | 17 | 13 | 3 | 1 | 0 |
| `model` | 125 | 80 | 3 | 2 | 23 |
| `services` | 75 | 75 | 0 | 0 | 0 |
| `stores` | 3 | 3 | 2 | 0 | 0 |
| `ui` | 214 | 213 | 206 | 204 | 3 |
| `utils` | 103 | 103 | 0 | 0 | 19 |

`api`의 하나는 `shared/api/supabase.ts` 싱글턴이라 밖이다. `ui` 206은 정책대로 밖이되, React 상태·효과를 들고 짝이 없는 `shared/ui` 일곱은 따로 본다.

### 짝이 없는 파일 여덟

| 자리 | 무엇 | 무게 |
| --- | --- | --- |
| `src/entities/attendance/model/excuseDecision.policy.ts` | `isExcuseDecision` — 어느 테스트도 안 당긴다 | 중간 |
| `src/entities/notification/model/notificationKind.policy.ts` | `isNotificationKind` — 어느 테스트도 안 당긴다. Edge Function이 복사해 쓰는 폴더다 | 중간 |
| `src/shared/model/error.type.ts` | `DomainError`·`TransportError` 클래스 — 테스트 96개가 당기지만 그 둘을 재는 테스트는 없다 | 중간 |
| `src/entities/clock/lib/clockStorage.lib.ts` | `readStoredOffset`·`writeStoredOffset` — 어느 테스트도 안 당긴다 | 중간 |
| `src/shared/lib/openPhone.lib.ts` · `themeStorage.lib.ts` | 다른 테스트가 지나가며 당긴다 | 낮음 |
| `src/entities/clock/stores/clock.store.ts` · `src/shared/stores/theme.store.ts` | store 둘 — 다른 테스트 하나씩이 당긴다 | 낮음 |

### 짝은 있는데 이름을 안 부른다 — 39 파일 56 export

규칙 15가 「새로 서는 함수를 짝이 부르나」를 파일을 쓰는 순간 보는데, `git mv`와 이름 바꾸기와 테스트 뒤 추가는 그 순간 밖이다. `api` 11 · `model` 23 · `utils` 19 · `ui` 3이다.

대표 셋 — `entities/member/api/listMembers.api.ts`의 `listPendingMembers`·`listBlockedMembers`(integration 짝이 안 부른다), `features/memberAdmin/api/approveMember.api.ts`의 `approveMember`·`rejectMember.api.ts`의 `rejectMember`(짝 파일 이름은 같은데 그 함수를 안 부른다), `entities/profile/model/profile.schema.ts`의 `isProfileGender`·`isValidPhone`(검증 함수 둘을 짝이 안 재다).

### 동작을 들고 짝이 없는 `.tsx` 일곱

전부 `shared/ui`다 — `DayBand`·`Draggable`·`DragProvider`·`FloatingToast`·`Input`·`Segment`·`TrendChart`. `TrendChart`는 `chart-math-out-of-tsx` 행(candidate)이 들고, `FloatingToast`는 `effect-derived-values`가 건드린다.

## 축 ③ — 동작이 틀릴 수 있는 자리

실행은 못 하니 꼴로 찾았다.

| 자리 | 무엇 | 무게 |
| --- | --- | --- |
| `src/features/auth/lib/signOut.lib.ts:15` · `services/useSignOutMutation.ts:19` | `DEVICE_CLEANUP_NOT_WIRED_YET` — 로그아웃이 토큰 삭제와 영속 상태 정리를 빈 함수로 받는다. 정본은 account/design.md:123 | **높음** |
| `src/features/auth/services/useRetryEntryMutation.ts:28` · `useSignOutMutation.ts:37` · `src/features/pushSwitch/services/useNotificationSwitchMutation.ts:50` | 반환 객체에 `error`가 없다. 셋째는 `onError`가 `setWanted(null)`만 해서 토글이 되돌아가고 까닭은 어디에도 안 보인다. `useSessionUserQuery`는 `session-error-is-swallowed` 행이 든다 | **높음** |
| controller 9 파일 | `error`·`isError`·`failed`라는 낱말이 0 — `screens/adminHome/hooks/useAdminHomeScreen.ts` · `blocked/hooks/useBlockedScreen.ts` · `left/hooks/useLeftScreen.ts` · `membersPending/hooks/useMembersPendingScreen.ts` · `profile/hooks/useProfileScreen.ts` · `retry/hooks/useRetryScreen.ts` · `wages/hooks/useWagesScreen.ts` · `features/stats/hooks/useStatsMonthNav.ts` · `src/app/me/rehearsals.tsx`. `useQuery`는 던지지 않으니 `QueryBoundary`도 못 본다 | **높음** |
| `src/screens/wages/hooks/useWagesScreen.ts:21` | 상태 union이 `pending`·`empty`·`ready` — `failed` 가지가 없어 실패가 `members ?? []`를 거쳐 「비었다」가 된다 | 높음 |
| `useAdminHomeScreen.ts:224` · `usePayrollScreen.ts:108` · `useProfileScreen.ts:116` · `useScheduleWorkerScreen.ts:299` | `unreadCount.data ?? 0` — 기다리는 중과 실패가 「0」이라 배지가 사라진다 | 중간 |
| `src/screens/rehearsal/hooks/useRehearsalScreen.ts:107·115` | 파일 안에 `pending`·`isLoading` 분기가 없고 `all.data ?? []`·`days ?? []`로 바로 계산해 기다리는 동안 `totalLabel`이 「0시간」이다. `effect-derived-values`가 같은 파일을 건드린다 | 중간 |
| `src/features/pushSwitch/services/useSavePushTokenMutation.ts:30·46` | `void savePushToken(…).catch(() => {})` — 토큰 저장 실패가 어디로도 안 간다. 알림이 안 오는데 아무 표시가 없다 | 중간 |
| `src/screens/notifications/hooks/pressNotification.ts:20` | `markRead` 실패를 `catch { return; }`로 삼킨다 — 눌렀는데 읽음이 안 찍힌 채 조용하다 | 낮음 |
| `src/entities/profile/api/getMyProfile.api.ts:24` | `takeProfileReadFailure()` — 프로덕션 repository가 테스트 문(`src/app/__test/session.tsx`)의 모듈 플래그를 읽는다. `__DEV__` 게이트는 그 라우트에만 있다 | 낮음 |
| `historyRows.utils.ts:68` · `payrollTotal.utils.ts:24` · `yearRows.utils.ts:25` | 비교 함수가 `? 1 : -1`로 같은 키에 0을 안 돌려준다. 키(날짜·주·달)가 유일해 지금은 결과가 같다 | 낮음 |

### 세었으나 자리를 못 가린 꼴

- `?? []` 93(`src` 90) — `api` 29는 `if (error) throw` 뒤라 안전하다. `hooks` 48은 파일 단위로만 봤다 — 파일 안에 `pending`·`isLoading`이 하나도 없는 것이 `useRehearsalScreen` 하나고, 나머지는 식마다 가드가 있는지 안 따라갔다.
- `?? ""` 65 — `displayName`·`phone`·`email`의 `null`을 빈 글자로 삼키는 자리가 `hooks`·`services`에 39다. 「없음」 문안 `NO_VALUE`가 따로 있다. 빈 줄로 그릴 자리인지는 판정이다.
- 빈 `.catch(() => {})` 9 — `SplashScreen` 2 · `AsyncStorage` 2 · `getServerNow` 1 · `getPushPermission` 2 · `savePushToken` 2. 앞의 다섯은 실패해도 할 일이 없는 자리다.
- `void` 호출 20 — `invalidateQueries`·`refetch`를 뺀 수다. 실패 경로를 손으로 안 따라갔다.
- `catch`가 기본값을 돌려주는 자리 7 — `decideEntry.lib.ts:27`의 `RETRY_PATH`처럼 설계된 것과 `pushPermission.lib.ts:62`의 `token: null`처럼 실패가 「토큰 없음」과 한 값으로 섞이는 것을 안 갈랐다. `catch`가 `error`를 받지 않고 상태만 바꾸는 자리 3(`usePendingEditor.ts:51`·`usePhotoSheet.ts:56`·`useScheduleAdminScreen.ts:307`)은 실패를 표시하니 문제가 아니다.
- `[0].x` 접근 5 — `isLastAdmin.policy.ts:15`·`pickPhoto.lib.ts:39`·`MonthPickerSheet.tsx:68`·`TrendChart.tsx:61·68`. 앞에 길이 가드가 있는지 하나씩 안 읽었다.
- `Date.now()` 2(`useServerNow`·`_layout.tsx`의 `adopt` — 설계상 그 자리) · `new Date()` 1(`shared/lib/kstToday.lib.ts:3`). `kstToday()`를 부르는 `hooks`가 열이라 「오늘」이 기기 날짜다 — 서버 시계 `useServerNow`와 다른 축이다.
- 빈 `catch` 0 · 로그만 하는 `catch` 0.

## 축 ④ — 정본이 적은 이름이 실물에 없다

[modules/*/design.md](../2-design/modules/) 여섯의 백틱 토큰 876개를 SQL(`supabase/migrations`)·생성 타입·코드 식별자에 맞췄다. 경로 어긋남은 셋째 감사가 든 `src/features/notification/model/` 셋 말고 없다.

| 이름 | 문서 | 실물 | 드는 행 |
| --- | --- | --- | --- |
| `hall_location_changes` · `effective_on` · `invalid_radius` | attendance/design.md:13·85·87 | 표가 없고 함수의 코드는 `bad_radius` | `hall-location`(blocked) — 그 행이 개명을 안다 |
| `too_late` | attendance/design.md:69·70 | `check_in`은 `window_closed`·`too_far`·`invalid_qr`만 낸다 | `attendance-checkin`(blocked) |
| `post_announcement` · `retry_push` · `emit_reminders` | notification/design.md:112·142·161 · schedule/design.md:213·223 | 없음 | `notification-emit`·`notification-schedule`(blocked) |
| `revoke_position` | schedule/design.md:164 | `grant_position`만 있다 | **없다** |
| `approve_swap` · `create_swap_request` | schedule/design.md:183 · swap/design.md 전체 | 없음 | **없다** — `schedule-requests`(done)가 「교대는 swap이 소유한다」로 넘겼다 |

거짓 양성으로 뺀 것 — `link_account`(문서 자신이 「1차에 없다」), `security_definer`(SQL은 띄어 쓴다), `profiles.id`(두 글자 열 이름이 셈 밖), `retryDelay`·`prefetchQuery`(TanStack Query), `writing.md`·`deno.json`·`approvals.md`(파일 이름), `supabase/functions/_shared/`(런타임 생성).

## 축 ⑤ — 중복

함수 본문 709개(AST 노드 25 이상)를 두 겹으로 해시했다 — 글자 그대로와, 식별자·리터럴을 자리표시자로 바꾼 꼴.

| 가름 | 집단 | 자리 |
| --- | --- | --- |
| 글자까지 같은 본문 | 8 | 19 |
| 꼴만 같은 본문 | 19 | 66 |

### 글자까지 같은 여덟

| 집단 | 자리 |
| --- | --- |
| `*Loading.tsx` 셋 | `ApplicationsLoading`·`ApprovalsLoading`·`MembersLoading`·`ScheduleCalendarLoading`·`ScheduleWorkerLoading`(5) · `AdminStatsLoading`·`StatsLoading`(2) · `PayrollViewLoading`·`WagesLoading`(2) |
| `positionRank` | `entities/schedule/model/daySheet.policy.ts:19` · `features/stats/model/workTotals.policy.ts:128` — `rule-15-blocked-functions-to-model` 행이 든다 |
| `adminAttendanceLine` = `monthAttendanceLine` | `features/stats/utils/attendanceLine.utils.ts:13` · `monthAttendanceLine.utils.ts:3` |
| `adminAttendanceShares` = `attendanceRatioShares` | `features/stats/utils/attendanceLine.utils.ts:22` · `attendanceShares.utils.ts:13` |
| `formatBareDate` = `bareDate` | `entities/schedule/utils/formatScheduleDate.utils.ts:7` · `entities/workRequest/utils/approvalDetail.utils.ts:25` |
| `minutesOfClock` | `entities/rehearsal/utils/rehearsalHours.utils.ts:10` · `features/payrollCompute/model/paidMinutes.policy.ts:22` |

`rule-15-blocked-functions-to-model`의 일곱 가운데 이 셈에 걸린 것은 `positionRank` 둘이다. 나머지 여섯은 hook 안 비공개 함수라 서로 꼴이 다르다.

### 꼴만 같은 것 가운데 큰 둘

**mutation service 28이 한 꼴이다.** 여섯 집단(7·6·5·4·3·3)이 `useMutation` + `invalidateQueries` + `useCallback` 보호의 네 문장을 똑같이 쓴다. 묶음 B가 뒤처리를 한 꼴로 모은 결과라 중복은 의도된 것이고, 공장으로 뽑을지는 판정이다.

**상태 조각이 겹친다.** `*Loading.tsx` 17 · `*Failed.tsx` 8 · `*Empty.tsx` 10 가운데 글자까지 같은 Loading이 9, 꼴까지 넓히면 13이고 Failed는 두 집단 8이 같은 꼴이다. ADR-016이 상태 그림을 `screens/<슬라이스>/ui`에 둔 까닭은 문안이 화면마다 달라서인데, Loading에는 문안이 없다.

**같은 이름 다른 본문** — `features/stats/utils/chartValues.utils.ts`(45줄)와 `screens/stats/utils/chartValues.utils.ts`(124줄). 둘을 다른 화면이 각각 당긴다.

## 축 ⑥ — 이름이 거짓인 자리

ADR-015의 세그먼트 뜻과 접미사 열여섯을 기준으로 봤다. **0인 축이 많다** — `is*`·`has*`·`can*`이 불리언이 아닌 것 0, 훅인데 `use*`가 아닌 것 0, 접미사가 제 세그먼트 밖에 산 것 0, 열여섯 밖 접미사 0, `consts`가 환경을 읽거나 함수를 내는 것 0, 순수 접미사(`.policy`·`.utils`·`.mapper`·`.reducer`·`.schema`)가 통신·React를 값으로 당기는 것 0.

| 자리 | 무엇 | 무게 |
| --- | --- | --- |
| `hooks/` 9 파일 | `use*`인데 안에서 훅을 하나도 안 부른다 — `features/adjustment/hooks/useAdjustChoiceSheet.ts` · `useAdjustSheet.ts` · `qualificationGrant/hooks/useQualificationSheet.ts` · `scheduleAssign/hooks/usePersonPickerSheet.ts` · `usePersonSheet.ts` · `scheduleConfirm/hooks/useConfirmChangeSheet.ts` · `scheduleSlot/hooks/useDiscardSlotSheet.ts` · `useSlotSheet.ts` · `screens/scheduleAdmin/hooks/usePositionRow.ts`. 입력을 받아 객체를 돌려주는 순수 함수다. `useServerNow`는 zustand selector를 불러 거짓 양성으로 뺐다 | 중간 |
| `src/shared/model/error.type.ts:5·16` | `.type.ts`는 「런타임에 아무것도 안 한다」인데 클래스 둘이 산다 | 중간 |
| `src/entities/schedule/api/getMonthSchedule.api.ts:64` | `liveAssignmentCount` — 계산이 `.api.ts`에 살고 `screens` hooks 둘이 당긴다 | 중간 |
| `src/entities/rehearsal/api/getMyRehearsals.api.ts:11` | `monthRange` — `shared/utils/monthRange.ts`와 이름이 같은 유틸이 `.api.ts` 안에 있다 | 낮음 |
| `src/entities/member/api/listMembers.api.ts:13` | repository가 `sortMembers.policy`의 판정을 부른다. ADR-015 집행 표의 「`api` → `model` 0」 자리다 | 중간 |
| `.api.ts` 15 파일 | `*Input`·`*Params`·`CheckInDeps`·`HallLocation` 타입을 `.api.ts`가 내보낸다. 그 가운데 `AddAssignmentInput`을 `screens` hooks 둘과 `model` 하나가 당긴다 — 규칙 37은 `.dto.ts`만 본다 | 중간 |
| `services` 6 파일 | 도메인 타입을 service 파일이 내보낸다 — `WorkMonth`(`useWorkMonthsQuery.ts`) · `AttendanceMonth`(`useAttendanceMonthsQuery.ts`) · `AttendanceByMonth` · `PayrollByMonth` · `MemberKind` · `NotificationSwitch`. `utils` 둘이 그것을 당긴다 | 낮음 |
| `src/shared/hooks/useToast.ts:4` | `ToastState` 타입을 `screens/scheduleAdmin/model/dayDetail.type.ts`가 당긴다 — `model`이 `hooks`를 본다 | 낮음 |
| `src/screens/notifications/hooks/pressNotification.ts` | `hooks/` 폴더에 훅이 아닌 함수 파일. 접미사도 없다 | 낮음 |
| `.tsx` 4 | 대문자 상수 export — `*_TEST_ID` 둘 · `MAX_FONT_SIZE_MULTIPLIER` · `TONE_CLASS`. 규칙 34가 `.tsx`를 면제한다 | 낮음 |

접미사 없는 `.ts`는 21이다 — `shared/api` 8 · `shared/utils` 12 · 위의 `pressNotification.ts`. ADR-015가 「도메인이 없는 것은 안 붙인다」고 했으니 앞의 스물은 그 뜻 안이다. `*Row` 별칭 33이 `api` 밖에 있는 것은 ADR-015가 「뷰 꼴은 남는다」로 둔 자리고 셋째 감사가 수를 셌다.

## 축 ⑦ — 층을 건넌 자리

`pnpm lint`가 0이다. 아래는 규칙이 안 보는 축을 import 그래프로 센 것이다.

| 축 | 수 | 거짓 양성 | 남는 것 |
| --- | --- | --- | --- |
| `hooks` → `api` 값 | 62 | 60 — `shared/api/supabase` 싱글턴 58 · `queryKeys` 2. ADR-015가 「손잡이를 받는 것」으로 허용 | 2 — `liveAssignmentCount`(`useAdminHomeScreen.ts:24` · `useScheduleAdminScreen.ts:30`) |
| `hooks`·`model` → `.api.ts` 타입 | 4 | 1 — `DB` | 3 — `AddAssignmentInput`(`useDayDetail.ts:25` · `useScheduleAdminScreen.ts:50` · `dayDetail.type.ts:17`) |
| `services` → `hooks` | 1 | 0 | `features/payrollCompute/services/useMyPayrollViewDaysQuery.ts:5` → `useServerNow` |
| `api` → `model` 값 | 5 | 4 — `DomainError`·`TransportError`·`memberOf`는 ADR-015가 그 자리로 보냈다 | 1 — `listMembers.api.ts:13` |
| `api` → `utils` 값 | 34 | 33 — 매퍼 22 · `monthRange` 10 · `filterMembers` 1 | 1 — `getMyProfile.api.ts:2` → `devDoor` |
| `utils` → `services` 타입 | 4 | 0 | `chartValues.utils.ts` 둘이 `WorkMonth`·`AttendanceMonth`를 |
| `model` → `hooks` 타입 | 1 | 0 | `dayDetail.type.ts:1` → `ToastState` |
| `src/app/*.tsx` → `api`·`services`·`lib`·`stores`·`model`·`utils` 값 | 22 | — | 파일 6 — `_layout.tsx` 8 · `(tabs)/_layout.tsx` 4 · `me/rehearsals.tsx` 4 · `__test/session.tsx` 3 · `admin/_layout.tsx` 2 · `_catalog.tsx` 1 |
| `.tsx` → `consts` 값 | 110 (이름 153) | COPY 74 · TEST_ID 14 · 레이아웃 수치 45 · 탭 선택지 4 · 문안 낱개 7 · 기타 2 | 업무 상수 7 — `PHONE_LENGTH`(`ContactSheet.tsx`) · `GENDER_OPTIONS`(`PendingEditor.tsx`) · `COUNT_MAX_LENGTH`(`RehearsalFormSheet.tsx`) · `CANCEL_REJECT_REASONS`·`CUSTOM_REJECT_MAX_LENGTH`·`CUSTOM_REJECT_REASON`(`ApprovalDetailSheet.tsx`) · `CANCEL_REASON_MAX_LENGTH`(`CancelShiftSheet.tsx`) |
| `entities` → `features` · `shared` → 위 층 · `screens` ↔ `screens` · 같은 층 다른 슬라이스 · 세그먼트 없는 파일 | 0 | | |

**`src/app/`은 세그먼트가 없어 규칙 9·23·24·26·39가 안 문다.** `_layout.tsx`가 `useEffect` 다섯으로 `getServerNow`·`serverClockStore`·`decideEntry`·`wireAutoRefresh`를 직접 부른다 — controller 없는 화면 `.tsx`가 하는 일이다. `me/rehearsals.tsx`는 `useQualificationsQuery`를 `{ data, isLoading }`로 받아 축 ③의 아홉에도 든다.

## 축 ⑧ — 기계가 셀 수 있는데 사람이 세는 자리

### 문서의 수

| 수 | 자리 | 지금 | 세는 법 | 검사 자리 |
| --- | --- | --- | --- | --- |
| 「검사 열일곱」 | `CLAUDE.md`:27 · ADR-015:295 | 집행 표 행 19 | 표 행 셈 | 셋째 감사가 안 든 수다. `tests/lint/docCounts`가 그 표를 읽어 세면 된다 |
| 「열여섯 꼴」 · 「세그먼트는 열」 | `CLAUDE.md`:31·27 | 맞다 — 셋째 감사가 확인했다 | 접미사 표 행 셈 · 폴더 이름 셈 | 코드 쪽에 대조할 표가 없어 다음에도 사람이 센다. `fileNaming.ts`에 접미사→세그먼트 표를, `eslint-rules`에 세그먼트 목록 하나를 세운다 — 지금은 규칙 넷이 부분집합을 각자 든다(`constsSegment`·`dumbUi`·`nativeSdkSegment`·`uiValueImport`) |
| 규칙 줄 46 · 번호 47 | execution.md:238 | 맞다 | `ruleCatalogue.test.ts`가 이미 센다 | — |
| 행이 든 수 — `effect-derived-values` 14, `modern-react-hooks`의 `useCallback` 259 · 한 손 둘 이상 32 | backlog.md:113·114 | 14 · **179** · **28**(plan은 30 — 셈 조건이 다르다) | AST | 행은 그 순간의 기록이다. CI가 아니라 **띄우는 순간**에 구현자가 다시 센다 — `plan-preflight`가 그 자리다 |

### 검사 카탈로그의 빈 자리

위 축에서 찾은 꼴 가운데 ESLint 규칙이나 `tests/lint`로 박을 수 있는 것이다. 지금 자리 수가 0인 것도 그물이 없으면 적었다.

| 꼴 | 지금 자리 | 집행 자리 | 비고 |
| --- | --- | --- | --- |
| 접미사가 제 세그먼트에 사는가 | 0 | `tests/lint/fileNaming.ts` | ADR-015:307이 「`fileNaming.ts`가 본다」고 적었는데 그 검사가 없다. 지금 0이라 초록인 채로 그물이 없다 |
| 짝 테스트가 export 이름을 부르는가 | 56 | `tests/lint/pairCallsExports` | `mapperPairTests.ts`의 꼴을 `model`·`utils`·`api`·`lib`·`services`·`hooks`로 넓힌다 |
| 아무도 import하지 않는 export | 값 17 · 파일 14 | `tests/lint/deadExports` | 허용 — `src/app` default · `index.ts` · `syncEdgeShared.mts`의 ENTRIES 사슬 · 대조 테스트가 글자로 읽는 상수 |
| `services`가 반환 객체에서 `error`를 뺀다 | 4 | house 규칙 | `services/`의 return 객체 리터럴에 `data`·`isPending`·`isLoading`이 있으면 `error`·`isError`가 있어야 한다 |
| controller가 Query 결과의 `error`를 안 읽는다 | 9 파일 | house 규칙 | `use*Query` 결과를 받은 변수·바인딩에서 `error`·`isError`·`status`를 한 번도 안 읽으면 |
| `.api.ts`가 타입·계산을 내보낸다 / `hooks`·`model`이 `.api.ts`를 import | 15 · 2 · 3 | 규칙 37 확장 | `.dto.ts`만 보던 것을 `.api.ts`까지 |
| `.type.ts`·`.dto.ts`에 런타임 선언 | 2 | house 규칙 | 클래스·변수·함수 선언 금지 |
| `services` → `hooks` import | 1 | house 규칙 | 흐름은 아래로만 |
| `hooks/`에 `use*`가 아닌 export | 1 | 규칙 30의 역방향 | 지금은 `use*`가 `hooks` 밖에 있는 것만 본다 |
| 빈 `.catch(() => {})` | 9 | house 규칙 | 허용 목록(`SplashScreen`·`AsyncStorage`) 밖 금지 |
| `.tsx`가 `consts`의 업무 상수를 당긴다 | 7 | 규칙 39 확장 | 판정 뒤 — 어느 이름 꼴이 업무 상수인지 |
| `src/app/*.tsx`의 `useEffect`와 `api`·`lib` 직접 호출 | 6 파일 22 | 규칙 9·23·24의 범위 | 판정 뒤 — `src/app`에 controller를 두나 |
| 평평한 글자 union 상태 별칭 | 5 | 규칙 45 확장 | `flat-state-unions-remainder` 행이 「규칙 45의 구멍」을 든다 |

## 묶음 제안

총괄이 그대로 backlog에 옮길 수 있게 행 꼴로 적는다. 크기는 자리 수다.

| 슬러그 | 설명 | 의존 | 크기 |
| --- | --- | --- | --- |
| `signout-removes-push-token` | `DEVICE_CLEANUP_NOT_WIRED_YET`을 걷고 `useSignOutMutation`이 `removePushToken.api`와 영속 상태 정리를 꽂는다. 정본은 account/design.md:123이다. `removePushToken.api.ts`의 integration 짝은 이미 있고, `signOut.lib`의 짝이 빈 함수 꼴을 단언하면 그 단언을 먼저 본다 | — | 2 파일 |
| `query-failure-reaches-the-screen` | service 셋(`useRetryEntryMutation`·`useSignOutMutation`·`useNotificationSwitchMutation`)이 `error`를 돌려주고, 실패 낱말이 0인 controller 아홉이 `failed` 가지를 세운다 — `useWagesScreen`의 union에 `failed`를 더하고 `unreadCount.data ?? 0` 넷을 `pending`·`failed`로 가른다. `services` 반환 꼴 규칙 하나를 마지막에 켠다 | `session-error-is-swallowed` | services 3 · controller 9 · 자리 4 |
| `pair-tests-name-every-export` | 짝이 안 부르는 export 56을 부르게 하고 짝이 없는 여덟(`isExcuseDecision`·`isNotificationKind`·`error.type.ts` 클래스 둘·`clockStorage.lib`·`openPhone.lib`·`themeStorage.lib`·store 둘)에 테스트를 세운다. `unit-test-writer`가 먼저다. `mapperPairTests.ts`를 전 세그먼트로 넓힌 `pairCallsExports`를 마지막에 켠다 | — | 39 + 8 파일 |
| `dead-exports-pruned` | `DraggableSheet.tsx`(관찰 028의 판정이 먼저다)·`EXCUSE_BODY_MAX_LENGTH`·`Position`·`HomeTileState`를 지우고 export 군더더기 넷을 내린다. 테스트를 위해서만 export한 열은 그 테스트가 내부를 재는 것이 맞는지 본다. `deadExports` 검사를 세우고 기다리는 파일 열넷은 허용 목록이 아니라 **행 이름**으로 적는다 — 그 행이 닫히면 목록에서 빠진다 | — | 자리 16 · 파일 14 |
| `api-exports-only-transport` | `liveAssignmentCount`를 `entities/schedule/model`로, `getMyRehearsals.api`의 `monthRange`를 `shared/utils/monthRange`로, `*Input` 열다섯을 `.dto.ts`나 `.type.ts`로, `listMembers.api`의 정렬 호출을 service 쪽으로, `getMyProfile.api`의 `devDoor`를 `api` 밖으로 옮긴다. 규칙 37을 `.api.ts`까지 넓힌다 | — | 자리 21 |
| `domain-types-leave-services` | service 여섯의 도메인 타입을 `[domain].type.ts`로, `ToastState`를 `shared/model`로 옮기고 `useMyPayrollViewDaysQuery`가 `useServerNow` 대신 시각을 인자로 받는다. `chartValues.utils.ts` 둘의 이름을 가른다 | — | 자리 10 |
| `loading-fragments-share-one-body` | 글자까지 같은 Loading 9와 꼴이 같은 Failed 8을 `shared/ui` 하나씩으로 모은다. 문안이 든 Failed는 `failedLine`을 props로 받는다 | — | 자리 17 |
| `audit-checks-into-catalog` | 위 표의 검사 가운데 판정이 필요 없는 일곱 — 접미사↔세그먼트·`.type.ts` 런타임·`services → hooks`·`hooks/`의 비훅·빈 `.catch`·`docCounts`·`segments.mjs`의 SEGMENTS — 를 규칙 카탈로그에 더한다. 번호는 48부터다 | 앞의 묶음들이 자리를 0으로 만든 뒤 | 검사 7 |

순서는 위에서 아래다. 첫 둘이 사용자가 보는 동작을 고치고, 셋째가 그물을 깔고, 나머지는 그 그물 위에서 간다.

## 판정할 항목

여기서 결정하지 않는다.

1. **막힌 task를 기다리는 코드 열넷을 프로덕션에 두나.** `checkIn.api`·excuse 여섯·`setHallLocation.api`·auth 둘·`getPushReachable.api`가 테스트만 통과시키며 산다. 두면 `deadExports` 검사가 행 이름으로 면제해야 하고, 지우면 그 task가 다시 쓴다.
2. **`use*`인데 훅을 안 부르는 순수 controller 아홉.** ADR-016의 「조각마다 `hooks/use<조각>.ts`」와 React의 「훅을 안 부르면 `use`를 안 붙인다」가 부딪힌다. 이름을 두고 ADR-016에 그 사실을 적는 길과, 순수한 것은 `model/<조각>.policy.ts`로 보내고 `hooks/`에는 훅만 두는 길이 갈린다.
3. **`src/app/` 레이아웃의 controller 일.** `_layout.tsx` 하나가 effect 다섯과 직접 호출 여덟을 든다. `screens/root/hooks/useRootLayout.ts` 같은 자리를 만들어 규칙 9·23·24를 `src/app`까지 넓히나, 아니면 `src/app`은 밖이라고 execution.md에 적힌 대로 두나.
4. **`.tsx`가 `consts`를 당기는 110.** 문안 묶음·테스트 ID·레이아웃 수치는 두고 업무 상수 일곱만 막나, 아니면 전부 controller를 거치게 하나. 전자면 「업무 상수」의 이름 꼴(`*_MAX_LENGTH`·`*_OPTIONS`·`*_REASONS`)이 규칙에 박힌다.
5. **「오늘」의 정본.** `kstToday()`가 기기 날짜를 읽고 hooks 열이 그것으로 달과 날을 고른다. 서버 시계가 정본이면 `useServerNow`에서 날짜를 뽑는 손이 하나 서야 한다.
6. **mutation service 28의 한 꼴을 공장으로 뽑나.** `useInvalidatingMutation(client, fn, keys)` 하나면 28 파일이 두 줄이 된다. 대가는 service 파일을 열었을 때 `useMutation`이 안 보이는 것과 규칙 25·33·41이 공장 안을 봐야 하는 것이다.
7. **`?? ""` 39.** 이름·전화·이메일이 `null`일 때 빈 글자로 그리는 것이 맞나, `NO_VALUE`가 맞나. writing.md가 답할 자리다.
8. **정본이 적었는데 코드도 행도 없는 함수 셋.** `revoke_position`과 swap 둘. 행을 세우나, design.md에 「미정」을 박나.
9. **Loading 조각 공용화.** ADR-016이 상태 그림을 화면에 둔 까닭은 문안인데 Loading에는 문안이 없다. 공용으로 올리면 그 절에 「문안이 없는 상태 그림은 `shared/ui`」가 붙는다.

## 확인 필요

억지로 판정하지 않았다.

1. `useUnreadCountLine`은 `useUnreadCountSuspenseQuery`를 써서 실패가 경계로 던져지는 꼴이라 축 ③의 아홉에서 뺐다. 그 경계가 어느 `QueryBoundary`인지, 배지 하나의 실패가 화면 전체를 실패로 그리는지는 실기기로만 본다 — ADR-016이 같은 조건을 적었다.
2. `hooks`의 `?? []` 48 — 식마다 pending 가드가 있는지는 파일 단위로만 봤다. 파일에 가드 낱말이 없는 것은 `useRehearsalScreen` 하나다.
3. `void` 호출 20의 실패 경로 — `useScheduleAdminScreen.ts:550`의 `void grantAndAssign(…)`처럼 mutation 사슬을 기다리지 않는 자리가 있는데 손으로 안 따라갔다.
4. `ReachState`(`entities/notification/model/reachState.policy.ts:3`)와 `RehearsalDayCellState` — 평평한 글자 union인데 `flat-state-unions-remainder`가 든 셋 밖이다. `ReachState`는 `loading`과 도메인 상태 넷을 한 union에 둔다. 그 행이 같이 가는지는 그 행이 답한다.
5. 접미사 없는 `shared` 스물 — 「도메인이 없다」는 판정은 사람 몫이고, `shared/api/monthsQuery.ts`처럼 Query 꼴 이름을 가진 것이 `services`가 아닌 까닭은 안 가렸다.
6. Edge Function 셋의 `catch → return null` 셋 — 다른 실행 환경이라 범위 밖으로 뺐다.
7. 자기 파일에서만 쓰는 타입 352 — export가 필요한 것인지(테스트가 import하는지) 하나씩 안 가렸다.

## 세는 법

다음 감사가 다시 세야 한다. 스크립트는 커밋하지 않았고 전부 `node --experimental-strip-types`로 돌린 `.mts`다. 공통 손 하나(`walk.mts`)가 파일을 걷고 `ts.createSourceFile`로 파싱하고, import를 `@/`·`@tests/`·`@scripts/`·상대 경로로 풀어 실제 파일에 맞춘다. **`grep`은 두 번 틀린다** — 여러 줄 `import` 블록 안의 이름을 놓치고 한 줄에 둘 있는 것을 하나로 센다. 이 감사에서도 `.tsx` → `consts`를 `grep`으로 세면 40이 나오고 AST로 세면 110이다.

| 센 것 | 조건 | 거짓 양성을 뺀 법 |
| --- | --- | --- |
| 죽은 export | 파일마다 export 선언(함수·클래스·변수·타입·`export { }`·default)을 모으고, 모든 파일의 `import`·`export … from`·`import()`·`require`·`jest.mock` 지정자를 풀어 「누가 이 이름을 당기나」를 셌다. 당기는 쪽이 테스트인지로 「테스트만」을 갈랐다. 자기 파일 안 식별자 수가 1을 넘으면 「자기 파일에서 씀」 | 생성물(`databaseTypes.ts`), 대조 테스트가 글자로 읽는 상수, `syncEdgeShared.mts`가 복사하는 폴더의 함수, 루트 설정 파일이 당기는 것, Node loader API를 읽어서 뺐다 |
| 그물 | 세그먼트마다 `.ts`·`.tsx`의 실행 export(함수·클래스·함수 표현식 변수)를 세고 `__tests__/<stem>.test.ts`·`.integration.test.ts`의 존재와, 그 짝의 본문이 export 이름을 `\b이름\b`로 담는지를 봤다 | 싱글턴 `supabase.ts` |
| 동작 | `catch`절(빈 것·`console`만·`return`만·변수 없음), `.catch(() => {})`, `void` 호출, `?? []`·`?? ""`·`?? 0`, `Date.now()`·인자 없는 `new Date()`, `sort`의 화살표 비교 함수가 0을 못 돌려주는 꼴, `use*Query` 결과의 destructure와 변수에서 `error`·`isError`·`status`를 읽나, `services`의 return 객체 리터럴, `switch`의 default 유무, 상수 조건·좌우 같은 비교, `[n].x` 접근 | `?? []`는 `api`의 `if (error) throw` 뒤를 읽어서 뺐다. controller 아홉은 파일 전체에 실패 낱말이 0인 것으로 좁혔다 |
| 정본 이름 | design.md 여섯의 백틱 토큰을 경로·snake 이름·`표.열`·camel 이름·대문자·Pascal로 갈라, 경로는 실존, snake는 마이그레이션 SQL의 세 글자 이상 식별자와 생성 타입, camel·Pascal·대문자는 코드의 모든 식별자에 맞췄다 | 문서 자신이 「없다」고 적은 것, SQL이 띄어 쓰는 수식어, 두 글자 열, TanStack 이름, 파일 이름, 런타임 생성 폴더를 읽어서 뺐다. 남은 것은 막힌 행이 드는지로 갈랐다 |
| 중복 | 함수 본문(선언·화살표·메서드)의 AST를 두 번 직렬화했다 — 글자 그대로와, 지역 식별자를 등장 순서의 번호로·리터럴을 종류별 번호로 바꾸고 속성 이름은 둔 꼴. 노드 25 미만은 뺐다 | 꼴 집단에서 글자까지 같은 것을 가려 둘로 나눴다 |
| 이름 | `is*`·`has*`·`can*`의 반환 타입이 서술어·`boolean`인지, 없으면 return 식이 비교·부정·`some`·`includes` 류인지로 추론. `use*`는 본문에서 `use[A-Z]` 호출이 있나. 접미사는 파일 이름의 `.<접미사>.ts`를 ADR-015 표의 세그먼트에 맞췄다. `.type.ts`·`.dto.ts`의 top-level 런타임 선언, `.api.ts`의 타입 export와 동사 꼴이 아닌 함수 export, `services`·`hooks`의 타입 export | zustand selector 호출을 훅으로 다시 셌다(`useServerNow`). `countUnreadNotifications`는 동사 목록에 `count`가 빠져 걸린 것이다 |
| 층 | 값 import(타입만 아닌 것)의 세그먼트 행렬을 만들고, ADR-015의 흐름(ui → hooks → services → api, model·utils·consts는 아무것도 안 봄)에 거스르는 축 28개를 각각 셌다 | `shared/api/supabase`·`queryKeys`·`database`는 ADR-015가 「손잡이를 받는 것」으로 허용한 자리라 뺐다. 매퍼·`monthRange`·`error.type.ts`의 클래스도 ADR-015가 보낸 자리다 |
| 진행 중 묶음 | effect의 setter 호출(`setTimeout` 류 제외)·정리 함수, 한 손 안의 setter 수, 중첩 삼항 깊이, `as`(`as const`는 이름이 `const`인 `TypeReferenceNode`라 따로 뺀다), 글자 리터럴만의 union 별칭 | 세기만 하고 자리를 안 열었다 |

문서의 수는 `CLAUDE.md`·ADR-015·ADR-016·execution.md·backlog.md에서 「열일곱」·「열여섯」·「열」·`[0-9]+자리`·`[0-9]+개` 꼴을 긁어 코드 쪽 셈과 하나씩 맞췄다. 짐작한 수는 없다.
