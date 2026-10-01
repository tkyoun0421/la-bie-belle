---
sources:
  - ../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md
  - ../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md
  - ../../2-design/system/runtime.md
---

# FSD 층 재편 — 구현 계획

[ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)를 코드에 전개한다. 이름을 camelCase로 바꾸고, 캐시 키를 팩토리로 모으고, 세그먼트를 다섯으로 모으면서 성격 접미사를 같이 달고, 층의 뜻을 읽기와 쓰기로 가르고, 타입을 빼내고, 뭉친 슬라이스를 쪼갠다.

## 입력 명세·기준

**정본은 ADR-015다.** 층의 뜻, 세그먼트 다섯의 판정 기준, 슬라이스 쪼개는 기준, 이름 규약, 검사 여덟이 거기 산다. 이 계획은 그것을 몇 번에 나눠 어떤 순서로 옮기는지만 적는다.

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
- `queryKeys.ts`가 다섯 군데에 산다 — `features/`의 `schedule`·`notification`·`rehearsal`·`profile`·`members`
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

### AC-02 — 폴더 이름이 camelCase가 된다

- 전제: `screens/`의 슬라이스 폴더 다섯이 kebab이다
- 행동
  - `git mv`로 `admin-home`·`admin-stats`·`members-pending`·`schedule-admin`·`schedule-worker`를 camel로
  - `fileNaming.ts`에 폴더 이름 검사를 더한다 — `src/app/`과 `eslint-rules/`는 밖이다
  - `src/app/`의 라우트 파일이 그 폴더를 import하는 자리를 고친다
- 관찰 결과: 하이픈 든 폴더가 `src/app/`과 `eslint-rules/` 밖에 없다. 셋이 초록이다
- `screens/` 슬라이스가 라우트와 1:1인 것은 그대로다 — `/admin-home` 라우트의 슬라이스가 `screens/adminHome`이다

### AC-03 — 캐시 키가 팩토리 하나가 된다

- 전제: `queryKeys.ts`가 `features/` 아래 다섯 슬라이스에 흩어져 있고, 쓰는 쪽이 배열 리터럴을 손으로 적는 자리가 있다
- 행동
  - 다섯을 `src/shared/api/queryKeys.ts` 하나로 모으고 **팩토리 객체**로 쓴다 — `queryKeys.schedule.all`과 `queryKeys.schedule.month(month)` 꼴
  - 배열 리터럴로 키를 적은 자리를 전부 팩토리 호출로 바꾼다
  - 키 문자열이 [runtime.md](../../2-design/system/runtime.md)의 표와 같은지 대조한다
- 관찰 결과: 키 문자열이 하나도 안 바뀐다. `pnpm test`가 초록이고 캐시 무효화 동작이 그대로다. 다섯 파일이 사라지고 하나가 선다
- 왜 여기인가: 쓰기 슬라이스가 성공한 뒤 낡게 할 키는 읽기 슬라이스의 것이고, `no-cross-slice-import`가 그 import를 막는다. 이것이 안 서면 AC-07이 막힌다

### AC-04 — 통신이 `api/`로 모이고 `.api.ts`가 된다

- 전제: 데이터 접근이 `entities/*/dals/`와 `features/stats/api/` 둘로 갈려 있다
- 행동
  - `entities/*/dals/` 74개를 `entities/*/api/`로 옮기면서 이름을 `[action].api.ts`로 바꾼다
  - `features/stats/api/`도 접미사를 붙인다
  - 짝 테스트도 같이 — `getMonthSchedule.api.test.ts`
- 관찰 결과: `dals` 폴더가 없고 `api/` 아래 모든 파일이 `.api.ts`다. 셋이 초록이다
- 이동과 이름을 한 묶음에서 한다 — 같은 파일을 두 번 옮기면 rename 추적이 두 번 끊긴다
- 손으로 판정할 하나: `avatarsBucket.ts`는 버킷 주소를 읽고 파일을 올려 둘을 다 하는데, 둘 다 통신이라 `api/`다

### AC-05 — 훅이 `hooks/`로 가고 층이 갈리고 접미사가 붙는다

- 전제: 훅 58개가 `features/*/model/`에 순수 계산과 섞여 있고, 읽는 dal과 그 쿼리 훅이 두 층에 떨어져 있다
- 행동
  - 쿼리 훅 17개를 `entities/<도메인>/hooks/`로 내리고 `use[Action]Query.ts`로 — **export 이름도 같이 바뀐다**
  - 뮤테이션 훅 37개를 `features/<use-case>/hooks/`로 올리고 `use[Action]Mutation.ts`로
  - 쓰는 dal 49개를 `entities/*/api/` → `features/<use-case>/api/`로 올린다
  - 호출부(`screens/`·`src/app/`)의 훅 이름을 다 고친다
- 관찰 결과: `entities/`에 `useMutation`이 없고 `features/`에 `useQuery`가 없다. 읽는 dal과 그 쿼리 훅이 같은 슬라이스에 있다. 셋이 초록이다
- 손으로 판정할 넷
  - `useSavePushToken` — 쿼리도 뮤테이션도 아니고 앱 진입에 주소를 보내는 효과다. 쓰기 쪽이라 `features/pushSwitch/hooks/useSavePushTokenMutation.ts`
  - `usePayrollMonths`·`useRehearsalMonths`·`useScheduleMonths` — 다른 쿼리를 조합해 달 목록을 낸다. 읽기 쪽이라 각 `entities/<도메인>/hooks/use[X]MonthsQuery.ts`
- 같이 고치는 두 줄: `scripts/syncEdgeShared.mts`와 `eslint-rules/noNodeImportInEdgeShared.mjs`가 보는 경로

### AC-06 — 타입이 빠지고 `model`·`utils`가 갈리고 접미사가 붙는다

- 전제: 타입 선언 360개가 파일 192개에 흩어져 있고, 순수 함수가 판정과 꼴 바꾸기로 안 갈려 있다
- 행동
  - 도메인의 모양을 말하는 타입을 `[domain].type.ts`로 뺀다. 함수 하나의 인자 꼴처럼 좁은 타입은 그 파일에 남긴다
  - 순수 함수를 판정(`model`)과 꼴 바꾸기(`utils`)로 갈라 옮기고 `[domain].policy.ts`·`[domain].utils.ts`로 모은다
  - 바깥 값 검증을 `[domain].schema.ts`로 — `validateProfile`과 홀리데이 API 응답 파싱이 그 자리다
  - zustand store를 `[domain].store.ts`로
  - `shared/lib/` 29개를 `api`·`hooks`·`utils` 셋으로 가르고, 층이 틀린 열을 `features/auth`·`entities/session`·`entities/clock`으로 옮긴다
- 관찰 결과: `utils/`의 함수가 참·거짓이나 허용·금지를 안 돌려준다. `[domain].type.ts`를 열면 그 도메인의 모양이 한 파일에서 읽힌다. 셋이 초록이다
- 왜 여기인가: 접미사가 성격을 말하므로 성격을 정하는 이 묶음에서 같이 붙인다

### AC-07 — 슬라이스가 쪼개진다

- 전제: `features/schedule` 하나에 훅 서른이, `entities/schedule`에 dal 서른이 들어 있다
- 행동: `entities` 7→16, `features` 9→20으로 쪼갠다. 슬라이스 폴더 이름은 camel이다
- 관찰 결과: 슬라이스마다 「이 슬라이스는 무엇을 하나」에 한 문장으로 답할 수 있다. `no-cross-slice-import`가 한 건도 안 걸린다 — 걸리면 그 import가 위 층으로 올라가야 하는 조립이다
- `screens/`는 안 쪼갠다

### AC-08 — 검사 여덟이 선다

- 전제: `house/dumb-ui`가 `.tsx`의 Supabase import·`fetch()`·쿼리 훅 호출만 잡는다. 세그먼트와 층의 뜻과 접미사를 지키는 검사가 없다
- 행동: 규칙을 더하고 `tests/lint/`에 각각의 테스트를 쓴다. [execution.md의 「집행되는 규칙」](../../4-test/execution.md#집행되는-규칙) 표에 행을 더한다 — `tests/lint/ruleCatalogue.test.ts`가 그 표를 정본으로 읽는다
  - `api/` 밖에서 Supabase 클라이언트 import 금지
  - `hooks/` 밖에서 `use*` export 금지
  - `entities/`에서 `useMutation` 금지 · `features/`에서 `useQuery` 금지
  - `.policy.ts`에서 통신·`Date.now`·`Math.random` 금지
  - 캐시 키 배열 리터럴 금지 — `queryKeys` 팩토리만 쓴다
  - 접미사가 사는 세그먼트와 맞는지 — `fileNaming.ts`
  - 이름이 camelCase인지 · 폴더 이름이 camelCase인지 — `fileNaming.ts`가 AC-01·AC-02에서 이미 본다
- 관찰 결과: 각 규칙이 위반 픽스처에서 걸리고 정상 픽스처를 통과시킨다. 저장소 전체가 여덟을 통과한다

## 변경 파일

**아래 표는 현재 이름으로 배정을 적는다.** 이름 자체는 AC-01이 camel로, AC-06이 접미사로 바꾼다 — 배정과 이름을 한 표에 섞으면 어느 묶음이 무엇을 하는지 읽히지 않는다.

### 슬라이스 배정 — entities 16

| 슬라이스 | 읽는 dal | 쿼리 훅 | 모델·제약 |
| --- | --- | --- | --- |
| `schedule` | `get-month-schedule` `get-first-schedule-month` `get-open-slots` | `useMonthSchedule` `useMonthWindow` `useOpenSlots` `useScheduleMonths` | `positions` |
| `availability` | `get-my-availability` `get-month-availabilities` | `useMyAvailability` `useMonthAvailabilities` | — |
| `work-request` | `get-slot-requests` `get-pending-approvals` | `useSlotRequests` `usePendingApprovals` | — |
| `qualification` | `get-qualifications` | `useQualifications` | — |
| `hall` | `get-hall-defaults` | `useHallDefaults` | — |
| `attendance` | `get-day-attendance` `get-month-attendance` | — | `attendance-status` `attendance-summary` `constants` `communication-delay` |
| `excuse` | `get-my-excuses` | — | — |
| `qr` | `get-qr-code` | `useQrCode` | `check-in-url` `export-qr-paper` |
| `profile` | `get-my-profile` `profile-private` | `useMyProfile` | `can-save-display-name` `format-birth-date` `validate-profile` |
| `member` | `list-members` | `useMembers` | `is-last-admin` `sort-members` `filter-members` `search-members` `format-elapsed-days` |
| `notification` | `get-notifications` `count-unread-notifications` `get-push-reachable` | `useNotifications` `useUnreadCount` | `title` `when` `destination` `reach-state` `reach-message` `profile-notification-row` `push-message` `push-result` `app-entry` `types` |
| `payroll` | `get-payroll-month` `get-wage-rates` | `useWageRates` `usePayrollMonths` | `day-amount` `day-minutes` `wage-at` `payroll-days` `payroll-total` `holiday-api-response` |
| `rehearsal` | `get-all-rehearsals` `get-my-rehearsals` | `useAllRehearsals` `useMyRehearsals` `useRehearsalMonths` | `rehearsal-hours` `kind-for-date` `can-add-on` `spell-total` |
| `clock` | `get-server-now` | — | `server-clock` `server-clock-store` |
| `stats` | — | `useStatsQueries` | `trend` `my-totals` `work-totals` `person-days` `attendance-inputs` |
| `session` | `get-current-user` | — | `decide-entry` `resolve-entry-destination` `resolve-admin-guard` `google-photo-of` |

### 슬라이스 배정 — features 20

| 슬라이스 | 바꾸는 것 | 쓰는 dal | 뮤테이션 훅 |
| --- | --- | --- | --- |
| `schedule-day` | 관리자가 날을 만들고 열고 닫고 시간을 고친다 | `create-schedule` `open-day` `close-day` `set-day-hours` | `useCreateSchedule` `useOpenDay` `useCloseDay` `useSetDayHours` |
| `schedule-slot` | 관리자가 자리를 더하고 빼고 합치고 나눈다 | `add-slot` `remove-slot` `merge-slots` `split-slot` | `useAddSlot` `useRemoveSlot` `useMergeSlots` `useSplitSlot` |
| `schedule-assign` | 관리자가 사람을 배정하고 뺀다 | `add-assignment` `remove-assignment` | `useAddAssignment` `useRemoveAssignment` |
| `schedule-confirm` | 관리자가 확정하고 확정 뒤 강제로 고친다 | `confirm-schedule` `force-change` | `useConfirmSchedule` `useForceChange` |
| `availability-submit` | 근무자가 신청하고 관리자가 마감일을 정한다 | `submit-availability` `set-application-deadline` | `useSubmitAvailability` `useSetApplicationDeadline` |
| `work-request` | 근무 요청을 보내고 받고 취소 요청을 판정한다 | `send-work-request` `respond-request` `create-cancel-request` `decide-cancel-request` | `useSendWorkRequest` `useRespondRequest` `useCreateCancelRequest` `useDecideCancelRequest` |
| `qualification-grant` | 관리자가 포지션 자격을 준다 | `grant-position` | `useGrantPosition` |
| `hall-defaults` | 관리자가 홀 기본값을 고친다 | `set-hall-defaults` | `useSetHallDefaults` |
| `attendance-checkin` | 근무자가 출근을 인증한다 | `check-in` | — (그 task가 세운다) |
| `excuse` | 근무자가 사유를 내고 관리자가 판정한다 | `submit-excuse` `decide-excuse` | — (그 task가 세운다) |
| `qr-admin` | 관리자가 QR을 새로 뽑고 홀 위치를 고친다 | `rotate-qr` `set-hall-location` | `useRotateQr` |
| `profile-edit` | 본인이 프로필·연락처·사진을 고친다 | `submit-profile` `ensure-profile` `set-display-name` `update-my-contact` `update-my-photo` `avatars-bucket` | `useUpdateContact` `useUpdatePhoto` `useSetDisplayName` |
| `member-admin` | 관리자가 승인·차단·퇴사·역할을 바꾼다 | `approve-member` `reject-member` `block-member` `unblock-member` `mark-leave` `undo-leave` `set-role` | `useMarkLeave` `useUndoLeave` `useSetRole` |
| `wage-admin` | 관리자가 시급을 고치고 되돌린다 | `set-wage` `set-default-wage` `reset-wage-to-default` | `useSetWage` `useSetDefaultWage` `useResetWageToDefault` |
| `adjustment` | 관리자가 급여를 조정한다 | `set-adjustment` | `useSetAdjustment` |
| `holiday` | 공휴일을 받고 고친다 | `set-holiday` | `useSetHoliday` |
| `notification-read` | 알림을 읽음으로 표시한다 | `mark-notifications-read` | `useMarkNotificationsRead` |
| `push-switch` | 기기 주소를 올리고 알림을 켜고 끈다 | `save-push-token` `remove-push-token` `set-notifications-enabled` | `useNotificationSwitch` `useSavePushToken` + `model/push-deps` `model/push-permission` |
| `rehearsal-edit` | 관리자가 리허설을 더하고 고치고 뺀다 | `add-rehearsal` `edit-rehearsal` `remove-rehearsal` | `useAddRehearsal` `useEditRehearsal` `useRemoveRehearsal` |
| `auth` | 세션을 만들고 끊고 잇는다 | — (OAuth라 dal이 없다) | `model/sign-out` `model/auth-redirect` `model/handle-auth-callback` `hooks/wire-auto-refresh` `lib/session-storage` |

### shared 재편

**이 표는 `shared/` 전체다** — `shared/lib`의 스물아홉뿐 아니라 이미 `shared/api`에 사는 `database`·`errors` 같은 것도 든다. 떠나는 열을 뺀 열아홉이 `shared/lib`에서 온다.

| 세그먼트 | 담는 것 |
| --- | --- |
| `api` | `database` `database-types` `errors` `error-codes` `supabase` `create-supabase-client` **`query-keys`(다섯에서 모음)** `query-client` `read-supabase-env` `read-app-url` |
| `hooks` | `useTheme` `useFontLoading`(`font-loading`에서 이름 바꿈) |
| `utils` | `kst-date` `spell-number` `cn`(`utils`에서 이름 바꿈) `month-boundary` `mini-calendar` `month-picker` `day-band` `no-value` `reduce-motion` `catalog-visibility` `dev-door` `theme` |
| `ui` | 조각 쉰하나 — 그대로 |

`shared/`에 `model`이 안 선다 — 도메인이 없어 담을 것이 없다. `theme`가 `utils`인 까닭은 색과 서체가 통신과 무관한 값이기 때문이고, env를 읽는 둘은 통신 설정이라 `api`다.

**`shared/lib`를 떠나는 열.** 인증 흐름은 로그인이라는 use case에 매여 있어 「어느 기능에도 매이지 않은 것」이 아니고, 서버 시각은 `entities/clock`이 이미 있는데 거기 안 들어가 있었다 — 그 슬라이스에 파일이 하나뿐인 것이 그 증거다.

| 가는 곳 | 파일 | 왜 |
| --- | --- | --- |
| `features/auth` | `auth-redirect` `handle-auth-callback` `sign-out` `wire-auto-refresh` `session-storage` | 세션을 만들고 끊고 잇는 쓰기다 |
| `entities/session` | `get-current-user` `resolve-admin-guard` `resolve-auth-destination` | 누가 들어왔고 어디로 보낼 수 있나 — 읽기와 제약이다 |
| `entities/clock` | `server-clock` `server-clock-store` | 이미 그 슬라이스가 있다 |

**`entities/session`이 새로 선다.** `features/auth`에 지금 있는 순수 판정 셋(`decide-entry`·`resolve-entry-destination`·`google-photo-of`)도 여기로 내린다. 로그인은 읽기와 쓰기가 한 use case에 섞인 유일한 자리인데, 가르면 「누가 들어왔나」(읽기·제약)와 「세션을 만들고 끊는다」(쓰기)로 깔끔히 나뉘어 lint 규칙에 예외를 둘 필요가 없다.

### 검사·설정

| 파일 | 바꿀 책임 |
| --- | --- |
| `tests/lint/fileNaming.ts` | `kebab` 갈래를 `camel`로 — AC-01. 폴더 이름 검사 — AC-02. 접미사 검사 — AC-08 |
| `eslint-rules/supabaseClientInApi.mjs` | 신설 — `api/` 밖에서 Supabase 클라이언트 import를 막는다 |
| `eslint-rules/hooksSegment.mjs` | 신설 — `hooks/` 밖의 `use*` export를 막는다 |
| `eslint-rules/readWriteLayers.mjs` | 신설 — `entities/`의 `useMutation`과 `features/`의 `useQuery`를 막는다 |
| `eslint-rules/purePolicy.mjs` | 신설 — `.policy.ts`의 통신·시계·난수를 막는다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` | 규칙 넷을 등록한다 |
| `tests/lint/supabaseClientInApi.test.ts` 외 셋 | 신설 — 규칙마다 위반·정상 픽스처 |
| `docs/4-test/execution.md` | 「집행되는 규칙」 표에 행 넷을 더하고 파일 이름 규칙 행의 문장을 camel과 접미사로 고친다 — `tests/lint/ruleCatalogue.test.ts`가 그 표를 정본으로 읽는다 |
| `scripts/syncEdgeShared.mts` | 복사 경로를 `entities/notification/model/`로 |
| `eslint-rules/noNodeImportInEdgeShared.mjs` | 같은 경로 한 줄 |

### 경로·이름을 적은 활성 정본

문장이 코드를 가리키는 자리는 그 코드를 옮기는 커밋에서 같이 고친다. **지금은 그 문장들이 현재 코드를 맞게 적고 있어** 미리 고치지 않는다 — 코드와 문서가 한 커밋에서 맞아야 중간 상태에 거짓 문장이 안 생긴다.

| 문서 | 고칠 문장 | 같이 가는 묶음 |
| --- | --- | --- |
| `CLAUDE.md` 「코드 구조」 | 「부르는 이름이 없는 나머지는 kebab-case다」와 `fileNaming.ts` 경로 | AC-01 |
| [execution.md](../../4-test/execution.md) 「집행되는 규칙」 | 파일 이름 규칙 행의 kebab 문장과 검사 파일 이름 | AC-01 |
| [ADR-005](../../2-design/adr/ADR-005-sdlc-stage-folders-and-artifact-chain.md) | 문서 슬러그는 kebab 그대로다 — **안 고친다**, 코드 이름과 다른 축이다 | — |
| [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md) 「레이어」 | 「`shared/lib`에 공용 유틸이 산다」 → `shared/utils` | AC-06 |
| [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md) 「화면과 로직」 | `house/dumb-ui` 설명의 `@/shared/lib/` 경로 | AC-06 |
| [ADR-003](../../2-design/adr/ADR-003-supabase-and-integration-tests.md) | 「`auth.*`는 `shared/lib`에 산다」 → `features/auth`와 `entities/session` | AC-06 |
| [architecture.md](../../2-design/system/architecture.md) | 같은 예외 문장 | AC-06 |
| [account/design.md](../../2-design/modules/account/design.md) | 「전부 `auth.*`라 `shared/lib`이다」 | AC-06 |
| [spec/ui-kit.md](../../2-design/spec/ui-kit.md) | 「자리」와 AC의 순수 계산 경로 둘 | AC-06 |
| [execution.md](../../4-test/execution.md) | 테스트 명령 예시의 `src/shared/lib/__tests__/` 경로 | AC-06 |

**완료된 과거 plan은 안 건드린다.** [3-build 안내](../README.md#구현-계획)가 「완료된 과거 계획은 소급 변경하지 않는다」고 적는다 — `login-screens`·`rehearsal`·`stats-worker` 등 열 넘는 plan이 `shared/lib`과 kebab 경로를 들지만 그것은 당시 작업의 기록이다.

## 구현 순서

묶음 여덟을 PR 하나씩 나른다. 앞 묶음이 merge되고 나서 다음을 뗀다 — 같은 파일을 연달아 옮기므로 겹치면 충돌이 손으로 풀 수 없게 커진다.

1. **AC-01 — 파일 이름 camel.** ✅ 535개를 `git mv`했다
2. **AC-02 — 폴더 이름 camel.** `screens/` 다섯과 폴더 검사
3. **AC-03 — 캐시 키 팩토리.** 다섯을 `shared/api/queryKeys.ts` 하나로. 키 문자열을 한 글자도 안 바꾼다
4. **AC-04 — 통신을 `api/`로 + `.api.ts`**
5. **AC-05 — 훅을 `hooks/`로 + 층 가르기 + `Query`·`Mutation`**
6. **AC-06 — 타입 빼기 + `model`/`utils` 가르기 + 나머지 접미사**
7. **AC-07 — 슬라이스 쪼개기**
8. **AC-08 — 검사 여덟**

**이동과 이름을 한 묶음에서 한다.** 앞선 판은 이동(묶음 3~5)과 접미사(묶음 6)를 갈랐는데, 그러면 같은 파일을 두 번 옮기고 rename 추적이 두 번 끊긴다. 지금은 각 파일이 한 번만 움직인다 — 그 자리의 성격이 정해지는 묶음에서 이름까지 받는다.

**묶음마다 커밋을 둘로 가른다.** 이름·자리만 바꾸는 커밋과 참조를 고치는 커밋이다. 섞이면 git이 rename 추적을 놓쳐 `git log --follow`가 끊긴다.

**이동만 하는 묶음(1·2·4·5·7)에 새 테스트를 만들지 않는다.** [3-build 안내](../README.md#구현-계획)가 「문서만 고치는 작업은 관련 기존 문서 검사로 확인하며 형식만 베끼는 새 테스트를 만들지 않는다」고 적는데, 파일 이동도 같다 — 기존 테스트가 새 경로에서 그대로 초록인 것이 그 묶음의 완료 조건이다. 테스트를 쓰는 묶음은 8뿐이고, 묶음 3과 6은 기존 테스트가 새 호출 꼴로 바뀐다.

## 리스크·전환·되돌리기

**사용자 대면 동작이 하나도 안 바뀐다.** 묶음 1~7은 파일 자리와 이름과 import만 고치고 묶음 8은 검사만 더한다. 마이그레이션도 없다.

**되돌리기 단위는 PR 하나다.** 묶음 1·2·4·5·6·7은 `git mv`와 치환뿐이라 revert 한 번으로 돌아간다. 묶음 3은 키 문자열을 안 바꿔 revert해도 캐시가 깨지지 않는다.

**이름만 바꾸는 커밋과 import를 고치는 커밋을 가른다.** 한 커밋에 섞이면 git이 rename 추적을 놓쳐 `git log --follow`가 끊긴다. 묶음 1이 가장 크니 거기서 특히 지킨다.

**macOS에서 `git mv`가 케이스만 바뀌는 짝을 놓칠 수 있다.** 파일 시스템이 대소문자를 안 구별해 `foo-bar.ts` → `fooBar.ts`는 글자가 겹치지 않아 안전하지만, 첫 글자만 바뀌는 자리가 있으면 `git mv -f`가 필요하다. 묶음 1이 끝난 뒤 `git status`가 깨끗한지 확인한다 — [관찰 017](../../observations/017-case-insensitive-rm-deleted-a-tracked-file.md)이 그 축에서 한 번 물렸다

**TDD 훅을 우회하지 않는다.** `git mv`가 Bash라 훅이 안 보는 것은 [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md)이 알고 남긴 구멍이고, 테스트를 짝으로 같이 옮기므로 그 구멍으로 테스트 없는 코드가 들어오지 않는다. 짝이 깨진 자리가 있으면 `pnpm test`가 그 파일을 못 찾아 빨개진다.

**가장 큰 위험은 묶음이 겹치는 것이다.** 다른 task가 같은 기간에 `src/`를 고치면 충돌이 수백 줄이 된다. 이 task가 도는 동안 다른 코드 task를 띄우지 않는다.

**묶음 7에서 `no-cross-slice-import`가 걸릴 수 있다.** 쪼갠 슬라이스끼리 부르는 자리가 나오면 그것은 위 층(`screens`)이 조립할 일이다. 그 목록이 길면 쪼개는 단위가 틀린 것이므로 묶음 7을 멈추고 배정 표를 고친다.

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
| AC-06 | 업무 판정이 `utils`에 숨는다 | 손 확인 | — | `utils/`의 함수가 참·거짓이나 허용·금지를 안 돌려준다 |
| AC-06 | 접미사가 세그먼트와 어긋난다 | 새 검사(묶음 8) | `pnpm test -- fileNaming` | 묶음 8이 선 뒤 초록 |
| AC-07 | 쪼갠 슬라이스끼리 import가 생긴다 | 기존 lint 규칙 | `pnpm lint` | `no-cross-slice-import` 0건 |
| AC-07 | 슬라이스 이름이 라우트와 어긋난다 | 손 확인 | — | `screens/`는 안 건드렸다 |
| AC-08 | 규칙이 정상 코드를 막는다 | unit | `tests/lint/supabaseClientInApi.test.ts` 외 셋 (신설) | 위반 픽스처에서 걸리고 정상에서 통과 |
| AC-08 | 규칙 표가 실제 규칙과 어긋난다 | 기존 검사 | `pnpm test -- ruleCatalogue` | 초록 |

**e2e는 안 돈다.** 기기 빌드가 없어 `pnpm e2e`가 실행 불가다([execution](../../4-test/execution.md)). 이 task는 사용자 대면 동작을 안 바꾸므로 e2e가 막는 자리도 없다.

## 여기서 안 하는 것

- **`.tsx`의 로직 걷기** — 별도 task(`dumb-ui-widen`)가 받는다. 성격이 다르다. 이동이 아니라 추출이고, 빼낸 `.ts`에 짝 테스트가 필요해 TDD를 탄다
- **`screens/` 쪼개기** — ADR-001이 라우트 이름으로 묶었다
- **`widgets` 층 신설** — ADR-001이 「화면 조립 덩이가 실제로 반복되면 그때」로 미뤘고 아직 그 반복이 관찰되지 않았다
- **문서 슬러그 이름 바꾸기** — ADR-005가 kebab으로 가지고 있고 코드 파일과 다른 축이다. `docs/`와 브랜치 이름은 그대로 kebab이다
- **검증 라이브러리 들이기** — `[domain].schema.ts`에 자리를 비워두지만 zod를 넣는 것은 별도 결정이다
