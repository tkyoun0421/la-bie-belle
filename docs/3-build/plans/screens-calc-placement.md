# `screens`에 남은 계산이 자기 자리로 간다

`screens`에 계산 쉰넷이 남았고 스물일곱은 갈 데가 또렷하다. 애매했던 열아홉은 기준이 벼려져 갈린다.

다시 센 결과는 [전수 표](#셈의-결과--쉰넷을-파일마다-다시-셌다)가 든다 — 스물여덟이 올라가고 스물여섯이 머문다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 D다.** [`reexport-launders-layers`](reexport-launders-layers.md)가 선행이다 — 재수출이 남아 있으면 「무엇을 아는가」의 셈이 거짓을 센다.

### 또렷한 스물일곱

| 갈 자리 | 수 |
| --- | --- |
| `shared` | 10 |
| `entities` | 11 |
| `features` | 6 |

가장 또렷한 셋 — `screens/profile/model/hasRehearsalGrant.policy.ts`는 이미 `src/app/me/rehearsals.tsx`가 당겨 자기 슬라이스를 떠나 있고, `screens/adminStats/utils/chartValues.utils.ts`는 `features/stats` 하나만 당기는데 그 슬라이스에 자리가 서 있고, `screens/scheduleWorker/model/attendanceColumn.policy.ts`는 프로덕션에서 아무도 안 쓴다.

### `screens`가 맞는 여덟 — 못 올라가는 넷의 까닭이 다르다

`dayDetail.type.ts`(224줄, 타입 14개)는 controller 계약이면서 `features` 셋을 한 번에 당긴다. `adjustSheetRows.utils.ts`는 `features/adjustment`와 `features/payrollCompute` 둘이 한 파일에 있어 규칙 3이 양쪽을 막는다. `positionRow.type.ts`는 쪼개도 남는 것이 그 화면의 뷰 꼴이다.

### 애매했던 열아홉 — 기준이 벼려졌다

갈래 다섯이 **기준의 구멍**이었고 ADR 둘에 조항이 섰다.

| 갈래 | 수 | 무엇이 안 풀렸나 | 이제 무엇이 답하나 |
| --- | --- | --- | --- |
| import은 0인데 모양이 도메인 하나다 | 4 | 타입을 베껴 선언해 셈이 0으로 났다 | **베껴 선언한 것도 아는 것이다** |
| 문안인가 함수인가 | 3 | 0 슬라이스라 `shared`인데 ADR은 화면 문안을 `consts`로 박았다 | **화면 문안을 내면 그 화면을 아는 것이다** |
| 세그먼트가 애매하다 | 2 | `qrSvg`가 `utils`인가 `lib`인가, `pressNotification`의 `.policy.ts`가 효과를 돌린다 | **비동기만으로는 `lib`이 아니다** · **받은 손을 순서대로 부르는 것은 controller의 일이다** |
| 한 파일에 자리가 둘이다 | 3 | 쪼개면 갈린다 | **가름은 파일이 한 책임일 때만 답한다** |
| 화면 상태를 인자로 받는다 | 3 | 「읽는다」를 인자까지 세는지 안 적혀 있었다 | **인자의 타입을 당길 때만 아는 것이다** |

조항이 사는 자리 — 베낀 타입·인자·화면 문안·한 책임은 [ADR-016의 「「안다」를 어떻게 세나」](../../2-design/adr/ADR-016-fragments-own-their-data.md)이고, 세그먼트 둘은 [ADR-015의 세그먼트 열](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)이다.

### 세그먼트 둘의 판정

`src/screens/qr/utils/qrSvg.utils.ts`는 세 줄이고 `qrcode` 패키지를 불러 SVG 글자를 `Promise`로 낸다. 같은 글자를 넣으면 같은 그림이 나오고 바깥을 안 건드린다 — **`utils`가 맞다.** `lib`을 가르는 축은 「무엇에 닿나」고 기다림은 그 축이 아니다.

`src/screens/notifications/model/pressNotification.policy.ts`는 `navigate`와 `markRead`를 인자로 받아 **차례로 부르고 실패를 삼킨다.** 자기가 통신하지 않아 규칙 「`policy`의 통신·시계·난수 금지」는 통과하지만, 하는 일이 판정이 아니라 흐름이다 — **controller(`screens/notifications/hooks/`)로 간다.** 그 안의 판정(`withOrigin`이 「돌아갈 자리를 달아야 하나」를 보는 것)만 `policy`에 남는다.

## 셈의 결과 — 쉰넷을 파일마다 다시 셌다

`.const.ts` 열아홉은 대상이 아니다 — 화면 문안은 그 화면이 아는 것이라 거기가 제자리다. 남은 쉰넷을 파일마다 열어 셌고 **스물여덟이 올라가고 스물여섯이 머문다.** 「또렷한 27 · 애매한 19 · 머무는 8」과 다른 까닭은 **문안 축이 셋보다 넓었기 때문이다** — 아무 도메인도 안 당기면서 그 화면의 말을 내는 파일이 열둘이고, 앞선 셈은 그것을 `shared`로 보냈다.

### 올라간 스물여덟

| 파일 | 아는 것 | 간 자리 |
| --- | --- | --- |
| `adminHome/model/miniViewDensity.policy.ts` | 없음 — `workDate` 한 자리는 투영 | `shared/model` |
| `adminHome/model/tileMonth.policy.ts` | 없음 — 평평한 값 | `shared/model` |
| `qr/utils/qrSvg.utils.ts` | 없음 — `qrcode` 하나 | `shared/utils` |
| `rehearsal/model/rehearsalDayCell.policy.ts` | 없음 — 분을 받아 셀 꼴을 낸다 | `shared/model` |
| `rehearsal/model/rehearsalGuard.policy.ts` | 없음 — 참거짓 셋 | `shared/model` |
| `scheduleAdmin/model/adjustChoiceState.policy.ts` | 없음 — 숫자 입력 다루기 | `shared/model` |
| `scheduleAdmin/model/adjustmentFailure.policy.ts` | 없음 — `shared`의 실패 문안 | `shared/model` |
| `scheduleAdmin/model/adminCalendarDayState.policy.ts` | `shared/ui`의 셀 상태 | `shared/model` |
| `scheduleAdmin/model/monthEmptyState.policy.ts` | 없음 — 달과 지금 | `shared/model` |
| `scheduleWorker/model/calendarDayState.policy.ts` | `shared/ui`의 셀 상태 | `shared/model` |
| `scheduleWorker/utils/submissionSelection.utils.ts` | 없음 — 글자 목록 토글 | `shared/utils` |
| `stats/utils/moneyLabel.utils.ts` | 없음 — 값을 낸다 | `shared/utils` |
| `profile/model/hasRehearsalGrant.policy.ts` | `entities/member` | `entities/member/model` |
| `scheduleAdmin/model/confirmGate.policy.ts` | `entities/schedule` — `openedAt`·`confirmedAt`을 베꼈다 | `entities/schedule/model` |
| `scheduleAdmin/model/mergeTarget.policy.ts` | `entities/schedule` | `entities/schedule/model` |
| `scheduleAdmin/utils/deadlineLine.utils.ts` | `entities/schedule` | `entities/schedule/utils` |
| `scheduleAdmin/utils/positionRows.utils.ts` | `entities/schedule` | `entities/schedule/utils` |
| `scheduleWorker/model/monthState.policy.ts` | `entities/schedule` — `MonthWindow`를 그대로 베꼈다 | `entities/schedule/model` |
| `scheduleAdmin/model/holidaySwitch.policy.ts` | `entities/payroll` | `entities/payroll/model` |
| `scheduleAdmin/model/slotRequestBadge.policy.ts` | `entities/workRequest` — `SlotRequest` 세 자리를 베꼈다 | `entities/workRequest/model` |
| `scheduleWorker/model/incomingRequest.policy.ts` | `entities/workRequest` | `entities/workRequest/model` |
| `scheduleWorker/model/attendanceColumn.policy.ts` | `entities/attendance` | `entities/attendance/model` |
| `adminStats/utils/chartValues.utils.ts` | `features/stats` + 도메인 둘 | `features/stats/utils` |
| `payroll/model/period.policy.ts` | `features/payrollCompute` | `features/payrollCompute/model` |
| `payroll/model/boundary.policy.ts` | `Period` 하나 | `features/payrollCompute/model` |
| `scheduleAdmin/utils/absenceMinutes.utils.ts` | `features/payrollCompute` | `features/payrollCompute/utils` |
| `scheduleAdmin/utils/adjustmentCount.utils.ts` | `features/payrollCompute` + `entities/payroll` | `features/payrollCompute/utils` |
| `scheduleAdmin/model/notifyReach.policy.ts` | `entities/member` + `entities/notification` | `features/scheduleConfirm/model` |

### 머문 스물여섯

| 파일 | 머무는 까닭 |
| --- | --- |
| `adminHome/model/homeTileSummary.policy.ts` | 화면 문안 |
| `adminHome/model/todayStatus.policy.ts` | 화면 문안 — 밴드의 띠 이름까지 |
| `adminHome/model/vacancyCards.policy.ts` | 화면 문안 + 화면 const |
| `adminHome/utils/approvalsLine.utils.ts` | 화면 문안 |
| `membersPending/utils/formatSentAt.utils.ts` | 화면 문안 |
| `notifications/hooks/pressNotification.ts` | 흐름이라 `hooks`로 내려갔다 |
| `pending/model/notificationPrompt.policy.ts` | 짝 테스트가 화면 const를 당긴다 |
| `pending/model/pendingForm.policy.ts` | 쪼갠 뒤 남은 `stageOfProfile`이 화면 단계를 낸다 |
| `pending/model/pendingForm.type.ts` | 화면 단계 |
| `pending/utils/notificationPromptCopy.utils.ts` | 화면 const |
| `qr/model/qrFullscreen.type.ts` | controller 계약 |
| `qr/utils/fullscreenQrSize.utils.ts` | 화면 const |
| `qr/utils/qrPaper.utils.ts` | 화면 const + 종이 문안 |
| `qr/utils/qrStartLine.utils.ts` | 화면 문안 |
| `scheduleAdmin/model/confirmAffordance.policy.ts` | 화면 문안 |
| `scheduleAdmin/model/dayDetail.type.ts` | controller 계약 + `features` 셋 |
| `scheduleAdmin/model/dragGesture.policy.ts` | 화면 const |
| `scheduleAdmin/model/openModeSelection.policy.ts` | 화면 문안 |
| `scheduleAdmin/model/pickOutcome.policy.ts` | 화면 타입 |
| `scheduleAdmin/model/positionRow.type.ts` | 화면 타입 |
| `scheduleAdmin/utils/adjustSheetRows.utils.ts` | `features` 둘 — 규칙 3 |
| `scheduleAdmin/utils/confirmChangeCopy.utils.ts` | 화면 타입 |
| `scheduleAdmin/utils/dayDetailRows.utils.ts` | 화면 뷰 + 문안 |
| `scheduleAdmin/utils/dragId.utils.ts` | 짝 테스트가 화면의 버리는 자리 식별자를 당긴다 |
| `scheduleWorker/utils/workerCopy.utils.ts` | 화면 문안 |
| `stats/utils/chartValues.utils.ts` | `features` 둘 + 화면 const — 규칙 3 |

### 조항이 답한 자리

| 조항 | 답한 수 | 어디서 |
| --- | --- | --- |
| 베껴 선언한 것도 아는 것이다 | 3 | `monthState`·`confirmGate`·`slotRequestBadge` |
| 화면 문안을 내면 그 화면을 아는 것이다 | 12 | 아무 도메인도 안 당기면서 그 화면의 말을 내는 자리 |
| 인자의 타입을 당길 때만 아는 것이다 | 10 | 평평한 값만 받아 `shared`로 간 자리 |
| 가름은 파일이 한 책임일 때만 답한다 | 2 | `pendingForm.policy`·`pressNotification` |
| 비동기만으로는 `lib`이 아니다 | 1 | `qrSvg` |
| 받은 손을 순서대로 부르는 것은 controller의 일이다 | 1 | `pressNotification` |

**조항 하나가 더 필요했다.** 짝 테스트가 그 화면의 `consts`를 당기는 파일은 그 화면을 안다 — `notificationPrompt.policy.ts`와 `dragId.utils.ts`가 `shared`로 올라갔다가 그 import 때문에 되돌아왔다. 셈을 소스 파일만 보고 하면 그 자리가 안 보인다.

**문안 축이 「화면마다 다를 수 있나」로 갈렸다.** 도메인의 말(「공휴일」·「요청 N건 대기 중」·「스케줄 신청 마감」·근태 상태 이름)은 그 도메인과 함께 올라갔고, 그 화면의 지시와 상태 문장(「열 날을 고르세요」·「승인할 일」·「근무표가 아직 없어요」)은 머물렀다.

## 왜 고치나

기준에 구멍이 있으면 파일마다 사람이 판정하고, 판정이 회차마다 달라진다. [관찰 065](../../observations/065-no-home-for-cross-feature-calculation.md)가 「집이 없다」로 닫혔다가 뒤집힌 자리가 그 꼴이다 — 실제 의존이 아니라 보이는 의존으로 판정했다.

구멍이 메워지면 **기계가 센다.** 베낀 타입 축은 lint가 보고, 나머지는 사람이 같은 답을 낸다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| 또렷한 27 | `shared` 10 · `entities` 11 · `features` 6으로 `git mv`하고 import를 고친다 |
| 애매했던 19 | 새 조항으로 다시 세어 갈린 대로 옮긴다. **결과를 표로 남긴다** |
| `src/screens/qr/utils/qrSvg.utils.ts` | 자리는 그대로고 `shared/utils`로 올라간다 — 도메인을 하나도 모른다 |
| `src/screens/notifications/model/pressNotification.policy.ts` | 흐름이 `hooks`로 간다. `withOrigin`은 거기서 안 내보내는 손으로 남는다 — 내보내려면 짝 테스트가 먼저 서야 한다 |
| 자리가 둘인 3 | 먼저 쪼갠다. 쪼갠 조각마다 다시 묻는다 |
| 검사 자리 | 안 선다 — 까닭은 [위](#베낀-도메인-꼴은-기계가-못-센다)다. 규칙 수는 45로 그대로고 `docs/4-test/execution.md`도 그대로다 |

## 완료 조건

- **AC-01** `screens`에 남는 계산이 「그 화면을 아는」 것뿐이다. 못 올라가는 넷은 까닭이 plan에 적힌 그대로다
- **AC-02** 또렷한 27이 `shared` 10 · `entities` 11 · `features` 6으로 옮겨지고 당기던 자리가 따라간다
- **AC-03** 애매했던 19가 새 조항으로 갈리고 **그 결과가 표로 남는다** — 파일마다 어느 조항이 답했는지 적는다
- **AC-04** `qrSvg`가 `shared/utils`에 서고, `pressNotification`의 흐름이 controller로 올라가 `.policy.ts`에 판정만 남는다
- **AC-05** 자리가 둘인 세 파일이 쪼개진다
- **AC-06** ~~`eslint-rules/noCopiedDomainShape.mjs`가 베껴 선언한 도메인 꼴을 막고, 규칙이 다섯 자리에 한 커밋으로 선다~~ — **뺐다.** 까닭은 [아래](#베낀-도메인-꼴은-기계가-못-센다)다
- **AC-07** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 베낀 도메인 꼴은 기계가 못 센다

**ESLint로는 애초에 못 한다.** `eslint.config.mjs`의 `parserOptions`에 `project`가 없어 규칙이 한 파일의 AST만 본다. 「다른 파일의 도메인 타입과 필드가 같나」는 파일을 가로지르는 비교라 거기서 할 수 없다. 그 자리는 소스 전체를 한 번에 읽는 `tests/lint/`고 선례가 `fileNaming.ts`와 `databaseTypes.ts`다.

**그래서 `tests/lint/`로 재 보고 껐다.** `typescript`의 AST로 `src/entities/*/model/`의 객체 타입 예순과 나머지 전부를 맞췄다.

| 셈법 | 걸린 수 | 무엇이 걸렸나 |
| --- | --- | --- |
| 필드 집합이 똑같다 | 4 | 내보내지도 않은 제네릭 제약 `{minutes, count}`가 `RehearsalTotal`과 같다고 걸렸다 |
| 같은 도메인 타입의 세 자리 이상을 쓴다 | 7 | 여섯이 `entities` 슬라이스끼리라 규칙 3이 import를 막은 자리다 — 베낀 것이 아니라 베낄 수밖에 없는 자리다 |

`entities`끼리와 `api/`를 빼고 내보낸 타입만 남겨도 거짓 양성이 안 사라진다. `useGrantPositionMutation`의 `GrantPositionInput {profileId, position}`이 `Qualification`과 글자까지 같은데, 그것은 **mutation이 호출부와 맺는 계약**이고 ADR-016이 「조각이 호출부와 맺는 props 타입은 베낀 것이 아니다」로 이미 빼놓은 꼴이다. 거기까지 거르면 남는 셈이 아무것도 안 잡는다 — 이 작업이 찾은 유일한 참 양성(`MonthWindow`를 베낀 `monthState`)은 자리를 옮겨 이미 없다.

**켜지 않는 쪽이 싸다.** 거짓 양성이 남는 검사는 다음 사람이 덮고, 덮인 검사는 아무것도 지키지 못한다. DB 말투를 베낀 축은 규칙 38(`api` 밖의 snake_case 필드 선언)이 이미 물고 있어, 안 물린 자리는 **도메인 타입을 import할 수 있는데 그 필드를 자기 이름으로 다시 적은 자리** 하나다. 그 자리는 사람이 본다.

## 작업 순서

**선행이 하나다** — [`reexport-launders-layers`](reexport-launders-layers.md)가 merge된 뒤여야 셈이 맞는다.

1. **재수출이 걷혔는지 확인하고 쉰넷을 다시 센다.** 새 조항으로 갈린 결과를 표로 적어 보고한다 — 2번 걸음 전에 총괄이 그 표를 본다
2. 자리가 둘인 셋을 먼저 쪼갠다. 쪼개야 나머지 셈이 맞는다
3. `shared`로 가는 것부터 옮긴다. 당기는 쪽이 가장 많아 import 치환이 가장 넓다
4. `entities`와 `features`로 옮긴다. **규칙 3을 밟는 자리가 나오면 멈추고 보고한다** — 같은 층 슬라이스끼리 못 당긴다
5. `qrSvg`와 `pressNotification`을 옮긴다
6. lint 규칙을 다섯 자리에 한 커밋으로 켠다. **자리를 다 옮긴 뒤여야 초록이 난다**
7. 검증하고 PR을 연다

실패 테스트가 따로 서지 않는다 — 옮기는 일이라 관찰 가능한 동작이 안 바뀌고 그 불변은 기존 짝 테스트가 지킨다. **`pressNotification`은 예외다** — 흐름이 controller로 가면 그 짝 테스트도 따라가고, `policy`에 남는 판정의 짝 테스트가 새로 선다.

## 리스크

**규칙 3이 옮기는 길을 막을 수 있다.** 같은 층 슬라이스끼리 서로를 못 당겨서, `entities`로 올리려는 파일이 `entities` 둘을 당기면 거기 앉을 데가 없다 — 그러면 `features`다. ADR-016이 「도메인 여럿을 맞추면 `features`」로 이미 답했지만, 옮기기 전에는 몇이 그 갈래로 가는지 모른다. 1번 걸음의 표가 그 수를 센다.

**`adjustSheetRows.utils.ts`는 쪼개도 안 올라갈 수 있다.** 한 파일에 `features` 둘이 있어 쪼개면 각각 한 슬라이스만 당긴다 — 그러면 올라간다. 그런데 쪼갠 뒤 두 조각이 서로를 부르면 규칙 3이 다시 막는다. 쪼개 보고 보고한다.

**`dayDetail.type.ts` 224줄은 이 계획에서 안 건드린다.** controller 계약이면서 `features` 셋을 당기는데, 그것을 푸는 일은 [`fragments-own-their-data`](fragments-own-their-data.md)의 AC-04(controller 무게 덜기)와 한 덩이다. 여기서 쪼개면 그 작업과 충돌한다.

**`grep` 한 줄로 센 수는 틀린다.** [`reexport-launders-layers`](reexport-launders-layers.md)가 소비처를 여섯으로 셌다가 아홉이 나왔다 — `grep`이 맞는 줄 하나만 출력해서 **여러 줄로 쓴 import 블록 안의 이름이 안 보였다.** 1번 걸음의 쉰넷도 같은 셈법으로 섰다. **파일을 `grep -rl`로 먼저 찾고 그 파일을 열어 세야 맞는다** — 표를 내기 전에 그 방법으로 다시 센다.

**새 조항이 또 다른 애매함을 만들 수 있다.** 「화면 문안을 내면 그 화면을 안다」가 넓다 — 글자를 조금이라도 만들면 전부 `screens`로 가면 `shared`의 꼴 바꾸는 도구(`spellWon`·`spellDuration`)가 흔들린다. **가름은 「그 글자가 화면마다 다를 수 있나」다** — `spellDuration`의 `1시간 30분`은 어느 화면에서도 같고, 「이 날 넣은 리허설이 없어요」는 그 화면의 말이다. 1번 걸음에서 그 축으로 갈리지 않는 자리가 나오면 보고한다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다. integration은 범위 밖이다 — `api/`를 안 건드린다.
