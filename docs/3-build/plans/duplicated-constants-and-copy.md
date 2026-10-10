# 같은 값이 여러 집에 사는 자리를 정본 하나로

중복이 116 집단 395 자리다. 이 계획은 **기계가 셀 수 있는 두 축**을 닫는다 — 숫자 상수 넷과 실패 문안 하나다. 나머지 축은 집단마다 판정이 필요해 따로 간다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 E다.**

전수는 다섯 축이다.

| 축 | 집단 | 자리 | 이 계획 |
| --- | --- | --- | --- |
| 상수 | 32 | 116 | **넷을 닫는다** |
| 문안 | 19 | 114 | **가장 넓은 하나를 닫는다** |
| 함수 본문 | 21 | 60 | 밖이다 |
| 두 경로로 사는 계산 | 10 | 26 | 밖이다 |
| 타입 | 34 | 79 | 밖이다 |

### 왜 둘만 닫나

**이 둘은 정본이 이미 정해져 있거나 값이 하나뿐이라 판정이 필요 없다.** 나머지 셋은 집단마다 「같은 사실인가」를 먼저 물어야 한다 — [`mapper-tests-and-type-names`](mapper-tests-and-type-names.md)가 `PushReachable`과 `Holiday`에서 보인 것처럼, 꼴이 같아도 다른 사실이면 합치는 것이 틀린다. 타입 34 집단과 함수 21 집단은 그 판정을 집단마다 거쳐야 하므로 이 계획에 넣으면 PR이 안 닫힌다.

### 숫자 상수 넷

| 상수 | 값 | 선언 자리 | 성격 |
| --- | --- | --- | --- |
| `DAY_MS` | `24 * 60 * 60 * 1000` | **7** | 하루의 밀리초. 글자까지 같다 |
| `MINUTES_PER_HOUR` | `60` | **5** (정본 하나 포함) | 한 시간의 분 |
| `CLOCK_LENGTH` | `5` | **4** | `"HH:mm"`의 길이. `.slice(0, CLOCK_LENGTH)`로 쓴다 |
| `SCREEN_BOTTOM_PADDING` | `24` | **4** | 화면 바닥 여백. `paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom` |

`DAY_MS` 일곱 자리 — `features/payrollCompute/utils/payrollTotal.utils.ts:9`·`screens/scheduleAdmin/utils/deadlineLine.utils.ts:7`·`screens/scheduleWorker/model/monthState.policy.ts:31`·`screens/adminHome/model/vacancyCards.policy.ts:8`·`screens/payroll/model/period.policy.ts:15`·`entities/member/utils/formatElapsedDays.utils.ts:3`·`entities/availability/utils/applicationsGrouping.utils.ts:4`.

`MINUTES_PER_HOUR`는 [`spell-number-shared`](spell-number-shared.md)가 아홉 가운데 다섯을 지우고 `src/shared/utils/spellNumber.ts:3`에 하나를 세웠다. **남은 넷은 `shared` 밖이다** — `features/payrollCompute/model/paidMinutes.policy.ts:21`·`features/stats/model/workTotals.policy.ts:12`·`entities/notification/utils/when.utils.ts:6`·`entities/rehearsal/utils/rehearsalHours.utils.ts:7`.

`CLOCK_LENGTH`는 둘이 `consts` 세그먼트에 export로(`features/rehearsalEdit/consts/rehearsalEdit.const.ts:7`·`entities/rehearsal/consts/rehearsal.const.ts:3`), 둘이 지역 상수로(`features/scheduleDay/model/dayHoursForm.policy.ts:1`·`screens/scheduleAdmin/utils/adjustSheetRows.utils.ts:19`) 산다.

**`SCREEN_BOTTOM_PADDING`은 판정이 필요하다.** 네 자리 전부 `screens/<이름>/consts/`에 export로 살고 값과 쓰임이 같다. 그런데 24는 여백이라 **디자인 토큰 축일 수 있다** — 상수로 모으는 것이 맞는지, `tokens.md`의 간격 토큰에서 와야 하는지 구현이 보고하고 총괄이 정한다. lint 규칙 「하드코딩한 색과 크기」가 이미 그 축을 지킨다.

### 실패 문안 하나 — 14자리

**정본이 있다.** [data-access.md:142](../../2-design/system/data-access.md)가 「`TransportError`면 시트를 열어둔 채 「보내지 못했어요. 다시 시도해주세요」다」로 정했고 spec 다섯이 그것을 인용한다.

**그런데 그 글자를 담은 상수가 없다.** `src/shared/consts/error.const.ts`는 `ERROR_CODES` 하나만 들고, 쓰는 쪽은 `shared/model/error.type.ts`와 `shared/api/errors.ts` 둘뿐이다.

그래서 14자리가 각자 글자를 적었고 꼴이 넷이다.

| 꼴 | 수 | 자리 |
| --- | --- | --- |
| `*.const.ts`의 COPY 객체 | **9** | `workRequest` · `profileEdit` 둘 · `scheduleDay` · `memberAdmin` 둘 · `scheduleWorker` · `qr` · `membersPending` |
| `.tsx` 안의 지역 상수 | 2 | `features/availabilitySubmit/ui/DeadlineSheet.tsx:6` · `features/hallDefaults/ui/HallDefaultsSheet.tsx:8` |
| **JSX 생문안** | 2 | `features/workRequest/ui/RequestSheet.tsx:35` · `features/workRequest/ui/CancelShiftSheet.tsx:40` |
| `.ts` 지역 상수 | 1 | `screens/scheduleAdmin/model/adjustmentFailure.policy.ts:5` |

생문안 둘은 같은 슬라이스의 `workRequest.const.ts:24`에 `sendFailed`가 **이미 있는데도** `.tsx`가 그것을 안 쓰고 직접 적었다.

## 왜 고치나

실패 문안은 사용자가 가장 자주 보는 글자 가운데 하나고, 열넷에 복사돼 있으면 문안을 다듬는 날 열넷을 다 찾아야 한다. 하나를 놓치면 같은 실패에 다른 말이 나간다.

`DAY_MS`는 글자까지 같은 일곱 자리다. 값이 틀릴 일은 없지만, 그 숫자가 왜 거기 있는지를 일곱 번 다시 읽어야 한다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `src/shared/consts/time.const.ts` | 신설 — `DAY_MS`·`MINUTES_PER_HOUR`·`CLOCK_LENGTH`가 선다 |
| `src/shared/consts/error.const.ts` | `TransportError`의 문안 상수가 `ERROR_CODES` 옆에 선다 |
| `DAY_MS` 일곱 · `MINUTES_PER_HOUR` 넷 · `CLOCK_LENGTH` 넷 | 선언을 지우고 `shared/consts/time.const.ts`에서 당긴다 |
| `SCREEN_BOTTOM_PADDING` 넷 | 1번 판정에 따른다 — 상수로 모으거나 토큰에서 받는다 |
| COPY 객체 9 | `sendFailed`가 글자 대신 공용 상수를 가리킨다 |
| `.tsx` 지역 상수 2 · 지역 상수 1 | 지우고 자기 슬라이스의 COPY 객체를 쓴다 |
| JSX 생문안 2 | 같은 슬라이스의 `workRequest.const.ts`의 `sendFailed`를 쓴다 |
| `eslint-rules/noDuplicateFailureCopy.mjs` | 신설 — 그 글자가 `shared/consts/error.const.ts` 밖에 나타나는 것을 막는다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` · `tests/lint/rules.ts` · `docs/4-test/execution.md` | 규칙 하나를 켜는 다섯 자리의 나머지 넷 |

**`.tsx`는 공용 상수를 직접 당기지 않는다.** COPY 객체가 공용 상수를 가리키고 `.tsx`는 지금처럼 자기 COPY 객체를 읽는다 — 화면 문안은 그 슬라이스가 들고, 공용 상수는 그 문안의 출처다. 규칙 「`.tsx`는 더미 UI」가 지키는 축이다.

## 완료 조건

- **AC-01** `DAY_MS`·`MINUTES_PER_HOUR`·`CLOCK_LENGTH`의 선언이 각자 한 자리다. `src/shared/consts/time.const.ts`가 그 집이고 `src/shared/utils/spellNumber.ts:3`의 지역 선언도 거기서 받는다
- **AC-02** `"보내지 못했어요. 다시 시도해주세요"`라는 글자가 `src/shared/consts/error.const.ts` 한 자리에만 있다. 나머지 13자리가 그것을 가리킨다
- **AC-03** `.tsx`에 그 문안의 생문안이 0이다. 둘 다 자기 슬라이스의 COPY 객체를 읽는다
- **AC-04** `eslint-rules/noDuplicateFailureCopy.mjs`가 그것을 막고 규칙이 다섯 자리에 한 커밋으로 선다
- **AC-05** `SCREEN_BOTTOM_PADDING`의 거처가 정해지고 네 자리가 그 한 곳에서 받는다
- **AC-06** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. **`SCREEN_BOTTOM_PADDING`의 거처를 보고한다** — `tokens.md`의 간격 토큰에 24가 있는지 읽고, 상수와 토큰 중 어느 쪽이 맞는지 양쪽 비용을 적는다. 총괄의 판정을 받는다
2. `shared/consts/time.const.ts`를 세우고 `DAY_MS`·`MINUTES_PER_HOUR`·`CLOCK_LENGTH`의 선언을 모은다. 당기던 자리를 고친다
3. `shared/consts/error.const.ts`에 문안 상수를 세우고 COPY 객체 9를 그것으로 돌린다
4. `.tsx`의 생문안 둘과 지역 상수 셋을 COPY 객체로 돌린다
5. 1번 판정대로 `SCREEN_BOTTOM_PADDING`을 옮긴다
6. lint 규칙을 다섯 자리에 한 커밋으로 켠다. **자리를 다 옮긴 뒤여야 초록이 난다**
7. 검증하고 PR을 연다

실패 테스트가 따로 서지 않는다 — 값과 글자가 그대로고 사는 자리만 바뀐다. 그 불변은 기존 짝 테스트가 지키고, AC-01·02·03은 lint 규칙과 그 짝 테스트가 센다.

## 리스크

**규칙 「`consts` 밖에서 내보내는 대문자 스네이크 이름」이 자리를 좁힌다.** 상수는 `consts` 세그먼트에만 설 수 있다. 지금 지역 상수로 사는 자리(`dayHoursForm.policy.ts`·`adjustSheetRows.utils.ts`·`paidMinutes.policy.ts` 등)는 export가 아니라 걸리지 않지만, 옮긴 뒤에는 전부 `shared/consts`에서 받는다.

**`CLOCK_LENGTH`의 집으로 `entities/clock/consts`가 적혀 있었는데 그 자리는 못 쓴다.** [handoff](../../handoff.md)의 꼬리 문단이 그렇게 들었지만, 규칙 3(「같은 층 다른 슬라이스 import」)이 `entities/rehearsal`이 `entities/clock`을 당기는 것을 막는다. 네 자리 가운데 둘이 `entities`와 `features`라 `shared/consts`만 전부가 닿을 수 있는 자리다.

**`CLOCK_LENGTH`가 두 슬라이스의 `*.const.ts`에서 export다.** 그 둘을 지우면 당기던 자리가 따라 바뀌고, `rehearsal.const.ts`와 `rehearsalEdit.const.ts`에 남는 export가 있는지 확인해야 한다 — 비면 파일을 지운다.

**문안 상수의 이름이 판정 하나다.** `TRANSPORT_ERROR_COPY`처럼 까닭을 드러내는 이름이 맞는지, COPY 객체의 키 이름(`sendFailed`·`saveFailed`·`submitFailed`)이 자리마다 다른 것을 그대로 둘지다. **키 이름은 그대로 둔다** — 그 슬라이스가 무엇을 못 했는지를 키가 들고, 글자만 공용이다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다. integration은 범위 밖이다 — `api/`를 안 건드린다.
