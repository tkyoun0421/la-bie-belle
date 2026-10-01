---
sources:
  - ../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md
  - ../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md
  - ../../2-design/system/runtime.md
---

# FSD 층 재편 — 구현 계획

[ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)를 코드에 전개한다. 층의 뜻을 읽기와 쓰기로 가르고, 세그먼트를 여섯으로 모으고, 뭉친 슬라이스를 쪼갠다.

## 입력 명세·기준

**정본은 ADR-015다.** 층의 뜻, 세그먼트 여섯의 판정 기준, 슬라이스 쪼개는 기준, lint 규칙 넷이 거기 산다. 이 계획은 그것을 몇 번에 나눠 어떤 순서로 옮기는지만 적는다.

**저장소에서 확인한 것.**

- `entities/*/dals/` 74개 — 읽기 24 · 쓰기 49 · **둘 다 하는 파일 0** · 손 판정 1
- `features/*/model/use*.ts` 58개 — 쿼리만 17 · 뮤테이션만 37 · **둘 다 하는 파일 0** · 손 판정 4
- `rpc()`를 부르는 dal 49개와 `from()`을 쓰는 dal 25개가 **한 파일에 겹치지 않는다**
- import 1658개 중 1654개가 `@/` 절대 경로다. 상대 경로는 4개
- 바뀌는 import — `dals/` 273줄 · `features/*/model/` 331줄 · `shared/lib/` 198줄
- `query-keys.ts`가 다섯 군데에 산다 — `features/`의 `schedule`·`notification`·`rehearsal`·`profile`·`members`
- 실제 경로를 박은 검사·스크립트 넷 — `scripts/sync-edge-shared.mts`, `eslint-rules/no-node-import-in-edge-shared.mjs`, `tests/lint/attendance-constants.ts`, `eslint-rules/no-visual-utility-class.mjs`

**Git 기준점**은 ADR-015가 merge된 커밋이다.

## 완료 조건

### AC-01 — 캐시 키가 한 자리에 모인다

- 전제: `query-keys.ts`가 `features/` 아래 다섯 슬라이스에 흩어져 있다
- 행동: 다섯을 `src/shared/config/query-keys.ts` 하나로 모으고 import를 고친다
- 관찰 결과: 키 문자열이 하나도 안 바뀐다. `pnpm test`가 초록이고 캐시 무효화 동작이 그대로다. 다섯 파일이 사라지고 하나가 선다
- 왜 먼저인가: 쓰기 슬라이스가 성공한 뒤 낡게 할 키는 읽기 슬라이스의 것이고, `no-cross-slice-import`가 그 import를 막는다. 이것이 안 서면 AC-04가 막힌다

### AC-02 — 세그먼트가 여섯으로 모인다

- 전제: 데이터 접근이 `dals`와 `api` 둘로 갈려 있고, 훅과 순수 계산이 `model` 한 폴더에 섞여 있다
- 행동: `git mv`로 옮긴다
  - `entities/*/dals/` → `rpc()` 쓰는 것은 `api/`, `from()`·`storage` 쓰는 것은 `db/`
  - `features/*/model/use*.ts` → `features/*/hooks/`
  - `features/stats/api/` → 그대로(이미 맞다)
  - `shared/lib/` → `api`·`config`·`hooks`·`utils` 넷으로
- 관찰 결과: **파일 내용이 한 줄도 안 바뀐다.** import 경로 치환만 있다. `pnpm lint`·`pnpm typecheck`·`pnpm test` 셋이 초록이다
- 손으로 판정할 하나: `profile/dals/avatars-bucket.ts`는 `storage.from`과 `.from` 둘을 다 쓴다 — 버킷 주소를 읽고 파일을 올리므로 `db/`다

### AC-03 — 층이 읽기와 쓰기로 갈린다

- 전제: 읽는 dal과 그 쿼리 훅이 두 층에 떨어져 있다
- 행동
  - 쿼리 훅 17개를 `features/*/hooks/` → `entities/<도메인>/hooks/`로 내린다
  - 쓰는 dal 49개를 `entities/*/api|db/` → `features/<use-case>/api|db/`로 올린다
  - 순수 계산 중 업무 판정인 것을 `features/*/model/` → `entities/<도메인>/model/`로 내린다
  - `shared/lib`의 열하나를 `features/auth`·`entities/session`·`entities/clock` 셋으로 옮긴다
- 관찰 결과: `entities/`에 `useMutation`이 없고 `features/`에 `useQuery`가 없다. 읽는 dal과 그 쿼리 훅이 같은 슬라이스에 있다
- 손으로 판정할 넷
  - `useSavePushToken` — 쿼리도 뮤테이션도 아니고 앱 진입에 주소를 보내는 효과다. 쓰기 쪽이므로 `features/push-switch/hooks/`
  - `usePayrollMonths`·`useRehearsalMonths`·`useScheduleMonths` — 다른 쿼리를 조합해 달 목록을 낸다. 읽기 쪽이므로 각 `entities/<도메인>/hooks/`
- 같이 고치는 두 줄: `scripts/sync-edge-shared.mts`와 `eslint-rules/no-node-import-in-edge-shared.mjs`가 보는 경로가 `features/notification/model/`에서 `entities/notification/model/`로 바뀐다. 복사 대상(`push-message.ts`·`push-result.ts`)이 순수 계산이라 그쪽으로 간다

### AC-04 — 슬라이스가 쪼개진다

- 전제: `features/schedule` 하나에 훅 서른이, `entities/schedule`에 dal 서른이 들어 있다
- 행동: `entities` 7→16, `features` 9→20으로 쪼갠다. 쪼갠 뒤 이름은 ADR-015의 기준(entities는 도메인, features는 use case)으로 정하고 이 계획의 「변경 파일」 표가 든다
- 관찰 결과: 슬라이스마다 「이 슬라이스는 무엇을 하나」에 한 문장으로 답할 수 있다. `no-cross-slice-import`가 한 건도 안 걸린다 — 걸리면 그 import가 위 층으로 올라가야 하는 조립이다
- `screens/`는 안 건드린다

### AC-05 — lint 규칙 넷이 선다

- 전제: `house/dumb-ui`가 `.tsx`의 Supabase import·`fetch()`·쿼리 훅 호출만 잡는다. 세그먼트와 층의 뜻을 지키는 규칙이 없다
- 행동: 규칙 넷을 더하고 `tests/lint/`에 각각의 테스트를 쓴다. [execution.md의 「집행되는 규칙」](../../4-test/execution.md#집행되는-규칙) 표에 행을 더한다 — `tests/lint/rule-catalogue.test.ts`가 그 표를 정본으로 읽는다
  - `api/` 아래 파일에서 `from()` 금지
  - `db/` 아래 파일에서 `rpc()` 금지
  - `hooks/` 밖에서 `use*` export 금지
  - `entities/`에서 `useMutation` 금지 · `features/`에서 `useQuery` 금지
- 관찰 결과: 각 규칙이 위반 픽스처에서 걸리고 정상 픽스처를 통과시킨다. 저장소 전체가 네 규칙을 통과한다

## 변경 파일

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
| `clock` | `get-server-now` | — | `server-clock` + `store/server-clock-store` |
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

| 세그먼트 | 담는 것 |
| --- | --- |
| `api` | `database` `database-types` `errors` `error-codes` `supabase` `create-supabase-client` |
| `config` | **`query-keys`(다섯에서 모음)** `query-client` `theme` `read-supabase-env` `read-app-url` |
| `hooks` | `useTheme` `useFontLoading`(`font-loading`에서 이름 바꿈) |
| `utils` | `kst-date` `spell-number` `cn`(`utils`에서 이름 바꿈) `month-boundary` `mini-calendar` `month-picker` `day-band` `no-value` `reduce-motion` `catalog-visibility` `dev-door` |
| `ui` | 조각 쉰하나 — 그대로 |

**`shared`를 떠나는 열하나.** 인증 흐름은 로그인이라는 use case에 매여 있어 「어느 기능에도 매이지 않은 것」이 아니고, 서버 시각은 `entities/clock`이 이미 있는데 거기 안 들어가 있었다 — 그 슬라이스에 파일이 하나뿐인 것이 그 증거다.

| 가는 곳 | 파일 | 왜 |
| --- | --- | --- |
| `features/auth` | `auth-redirect` `handle-auth-callback` `sign-out` `wire-auto-refresh` `session-storage` | 세션을 만들고 끊고 잇는 쓰기다 |
| `entities/session` | `get-current-user` `resolve-admin-guard` `resolve-auth-destination` | 누가 들어왔고 어디로 보낼 수 있나 — 읽기와 제약이다 |
| `entities/clock` | `server-clock` `server-clock-store` | 이미 그 슬라이스가 있다 |

**`entities/session`이 새로 선다.** `features/auth`에 지금 있는 순수 판정 셋(`decide-entry`·`resolve-entry-destination`·`google-photo-of`)도 여기로 내린다. 로그인은 읽기와 쓰기가 한 use case에 섞인 유일한 자리인데, 가르면 「누가 들어왔나」(읽기·제약)와 「세션을 만들고 끊는다」(쓰기)로 깔끔히 나뉘어 lint 규칙에 예외를 둘 필요가 없다.

### 검사·설정

| 파일 | 바꿀 책임 |
| --- | --- |
| `eslint-rules/segment-boundary.mjs` | 신설 — `api/`의 `from()`과 `db/`의 `rpc()`를 막는다 |
| `eslint-rules/hooks-segment.mjs` | 신설 — `hooks/` 밖의 `use*` export를 막는다 |
| `eslint-rules/read-write-layers.mjs` | 신설 — `entities/`의 `useMutation`과 `features/`의 `useQuery`를 막는다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` | 규칙 셋을 등록한다 |
| `tests/lint/segment-boundary.test.ts` 외 둘 | 신설 — 규칙마다 위반·정상 픽스처 |
| `docs/4-test/execution.md` | 「집행되는 규칙」 표에 행 셋을 더한다 — `tests/lint/rule-catalogue.test.ts`가 그 표를 정본으로 읽는다 |
| `scripts/sync-edge-shared.mts` | 복사 경로를 `entities/notification/model/`로 |
| `eslint-rules/no-node-import-in-edge-shared.mjs` | 같은 경로 한 줄 |

### 경로를 적은 활성 정본 — 묶음 2가 같이 고친다

`shared/lib`을 경로로 든 문장이 활성 문서 다섯에 있다. **지금은 그 문장이 현재 코드를 맞게 적고 있어** 미리 고치지 않는다 — 묶음 2가 파일을 옮기는 커밋에서 같이 고친다. 코드와 문서가 한 커밋에서 맞아야 중간 상태에 거짓 문장이 안 생긴다.

| 문서 | 고칠 문장 |
| --- | --- |
| [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md) 「레이어」 | 「`shared/lib`에 공용 유틸이 산다」 → `shared/utils` |
| [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md) 「화면과 로직」 | `house/dumb-ui` 설명의 `@/shared/lib/` 경로 |
| [ADR-003](../../2-design/adr/ADR-003-supabase-and-integration-tests.md) | 「`auth.*`는 `shared/lib`에 산다」 → `features/auth`와 `entities/session` |
| [architecture.md](../../2-design/system/architecture.md) | 같은 예외 문장 |
| [account/design.md](../../2-design/modules/account/design.md) | 「전부 `auth.*`라 `shared/lib`이다」 |
| [spec/ui-kit.md](../../2-design/spec/ui-kit.md) | 「자리」와 AC의 순수 계산 경로 둘 |
| [execution.md](../../4-test/execution.md) | 테스트 명령 예시의 `src/shared/lib/__tests__/` 경로 |

**완료된 과거 plan은 안 건드린다.** [3-build 안내](../README.md#구현-계획)가 「완료된 과거 계획은 소급 변경하지 않는다」고 적는다 — `login-screens`·`rehearsal`·`stats-worker` 등 열 넘는 plan이 `shared/lib` 경로를 들지만 그것은 당시 작업의 기록이다.

## 구현 순서

묶음 다섯을 PR 하나씩 나른다. 앞 묶음이 merge되고 나서 다음을 뗀다 — 같은 파일을 연달아 옮기므로 겹치면 충돌이 손으로 풀 수 없게 커진다.

1. **AC-01 — 캐시 키 모으기.** 다섯 `query-keys.ts`를 `shared/config/query-keys.ts`로 모은다. 키 문자열을 한 글자도 안 바꾼다. 기존 테스트가 그대로 초록인 것이 검증이다
2. **AC-02 — 세그먼트 옮기기.** `git mv`와 import 치환만. 파일 내용 변경 0줄
3. **AC-03 — 층 가르기.** 쿼리 훅 17개를 내리고 쓰는 dal 49개를 올린다. 손 판정 다섯을 위 표대로. `sync-edge-shared.mts`와 그 lint 규칙의 경로 두 줄을 같이 고친다
4. **AC-04 — 슬라이스 쪼개기.** 위 두 표대로 폴더를 만들고 옮긴다. `no-cross-slice-import`가 걸리는 자리는 위 층으로 올릴 조립이므로 그 자리를 목록으로 남긴다
5. **AC-05 — lint 규칙 넷.** 실패 테스트를 먼저 쓰고 규칙을 만든다. 규칙이 서야 다음 task가 이 경계를 지킨다

**이동만 하는 묶음(2·3·4)에 새 테스트를 만들지 않는다.** [3-build 안내](../README.md#구현-계획)가 「문서만 고치는 작업은 관련 기존 문서 검사로 확인하며 형식만 베끼는 새 테스트를 만들지 않는다」고 적는데, 파일 이동도 같다 — 기존 테스트가 새 경로에서 그대로 초록인 것이 그 묶음의 완료 조건이다. 테스트를 쓰는 묶음은 5뿐이다.

## 리스크·전환·되돌리기

**사용자 대면 동작이 하나도 안 바뀐다.** 묶음 1~4는 파일 자리와 import만 고치고 묶음 5는 검사만 더한다. 마이그레이션도 없다.

**되돌리기 단위는 PR 하나다.** 묶음 2·3·4는 `git mv`와 치환뿐이라 revert 한 번으로 돌아간다. 묶음 1은 키 문자열을 안 바꿔 revert해도 캐시가 깨지지 않는다.

**TDD 훅을 우회하지 않는다.** `git mv`가 Bash라 훅이 안 보는 것은 [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md)이 알고 남긴 구멍이고, 테스트를 짝으로 같이 옮기므로 그 구멍으로 테스트 없는 코드가 들어오지 않는다. 짝이 깨진 자리가 있으면 `pnpm test`가 그 파일을 못 찾아 빨개진다.

**가장 큰 위험은 묶음이 겹치는 것이다.** 다른 task가 같은 기간에 `src/`를 고치면 충돌이 수백 줄이 된다. 이 task가 도는 동안 다른 코드 task를 띄우지 않는다.

**묶음 4에서 `no-cross-slice-import`가 걸릴 수 있다.** 쪼갠 슬라이스끼리 부르는 자리가 나오면 그것은 위 층(`screens`)이 조립할 일이다. 그 목록이 길면 쪼개는 단위가 틀린 것이므로 묶음 4를 멈추고 배정 표를 고친다.

## 검증 방법

| 완료 조건 | 깨질 수 있는 것 | 테스트 층·위치 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 키 문자열이 바뀌어 캐시 무효화가 어긋난다 | 기존 unit·integration 전부 | `pnpm test` | 초록. `query-keys.ts`가 하나만 남는다 |
| AC-01 | 모은 파일이 `runtime.md`의 키 표와 어긋난다 | 손 확인 | — | `shared/config/query-keys.ts`의 키가 [runtime.md](../../2-design/system/runtime.md)와 일치 |
| AC-02 | import 치환이 빠져 모듈을 못 찾는다 | 타입 검사 | `pnpm typecheck` | 초록 |
| AC-02 | `dals`가 남거나 `api`/`db` 배정이 틀린다 | 손 확인 | `find src -type d -name dals` | 결과 없음 |
| AC-03 | `entities`에 뮤테이션이, `features`에 쿼리가 남는다 | 새 lint 규칙(묶음 5) | `pnpm lint` | 묶음 5가 선 뒤 0건 |
| AC-03 | Edge Function 복사가 빠진 경로를 본다 | 기존 integration | `pnpm test:integration` | `import-holidays`·`send-push` 관련 초록 |
| AC-04 | 쪼갠 슬라이스끼리 import가 생긴다 | 기존 lint 규칙 | `pnpm lint` | `no-cross-slice-import` 0건 |
| AC-04 | 슬라이스 이름이 라우트와 어긋난다 | 손 확인 | — | `screens/`는 안 건드렸다 |
| AC-05 | 규칙이 정상 코드를 막는다 | unit | `tests/lint/segment-boundary.test.ts` 외 둘 (신설) | 위반 픽스처에서 걸리고 정상에서 통과 |
| AC-05 | 규칙 표가 실제 규칙과 어긋난다 | 기존 검사 | `pnpm test -- rule-catalogue` | 초록 |
| 전부 | 파일 이름 규칙 위반 | 기존 검사 | `pnpm test -- file-naming` | 초록 — 훅은 camelCase, 나머지 kebab-case |

**e2e는 안 돈다.** 기기 빌드가 없어 `pnpm e2e`가 실행 불가다([execution](../../4-test/execution.md)). 이 task는 사용자 대면 동작을 안 바꾸므로 e2e가 막는 자리도 없다.

## 여기서 안 하는 것

- **`.tsx`의 로직 걷기** — 별도 task(`dumb-ui-widen`)가 받는다. 성격이 다르다. 이동이 아니라 추출이고, 빼낸 `.ts`에 짝 테스트가 필요해 TDD를 탄다
- **`screens/` 쪼개기** — ADR-001이 라우트 이름으로 묶었다
- **`widgets` 층 신설** — ADR-001이 「화면 조립 덩이가 실제로 반복되면 그때」로 미뤘고 아직 그 반복이 관찰되지 않았다
