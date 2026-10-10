---
status: accepted
---

# 중복과 책임 과적을 묶음 여덟로 갈라 순서를 정한다

기준점은 `ffc3dce2`다. 범위는 `src/` 전체 781 파일 36,094줄(테스트와 생성물 밖)이고, 네 축을 전수로 쟀다 — 큰 파일의 책임 수, 같은 일을 다른 꼴로 하는 자리, SSOT 위반, `screens`에 남은 계산의 거처.

**층 규칙은 지켜진다.** `screens`에 `services`·`api`가 0이라 흐름이 아래로만 가고, `features/api` 49개 중 48개가 쓰기만 하고, service 75개 전부가 `client`를 인자로 받고, `useRouter`를 쓰는 22자리가 전부 `screens/*/hooks`와 `src/app`이다. 고칠 것은 경계가 아니라 **경계 안에 쌓인 중복과 한 자리에 모인 무게**다.

## 문제와 근거

### 값이 어긋난 중복 다섯 — 둘은 정본과 어긋난다

| # | 자리 | 어긋남 | 정본의 판정 |
| --- | --- | --- | --- |
| 1 | `screens/payroll/model/period.policy.ts`의 `periodSpan` 對 `features/payrollCompute/model/dateSpan.policy.ts`의 `monthSpan` | 앞은 `${month}-31`을 박고 뒤는 `lastDayOf(month)`를 센다 | **지금은 증상이 없다** — 그 `span`이 DB로 안 가고 `isInSpan`의 문자열 비교만 거쳐 `2026-02-28 <= 2026-02-31`이 참이다. `DateSpan`의 계약이 「그 기간의 첫날과 끝날」인데 2월 31일은 날이 아니라서 결함이고, 그 값이 질의 범위로 가거나 화면에 글자로 나가는 날 터진다. `monthSpan`은 이번 회차에 고쳤고 `periodSpan`은 안 고쳤다 |
| 2 | `features/payrollCompute/utils/summary.utils.ts:22`·`payrollSummary.utils.ts:18`의 `spellWorkedHours` | 30분을 `0시간 30분`으로 적는다 | [writing.md:163](../2-design/design-system/writing.md) — 「한 시간이 안 되면 `30분`이다 — `0시간 30분`으로 쓰지 않는다」 |
| 3 | `entities/rehearsal/utils/spellTotal.utils.ts:5`의 `spellMinutes`·`features/payrollCompute/utils/historyRows.utils.ts:33`의 `spellLength` | 0분을 `0분`으로 적는다 | 같은 줄 — 「0분인 자리만 `0시간`이다」 |
| 4 | `PushReachableRow` | `entities/member/api/member.dto.ts:38`은 nullable, `entities/notification/api/notification.dto.ts:19`는 비-nullable, `getPushReachable.api.ts:6`의 `ViewRow`가 셋째 사본 | 생성물의 `push_reachable.Row`가 nullable이라 `member.dto.ts`와 `ViewRow`가 DB와 맞는다 — **그 둘은 같은 사실에 다른 이름이다.** `notification.dto.ts`의 것은 뷰 row가 아니라 `getPushReachable.api.ts:31`이 null을 걸러낸 뒤 매퍼에 넣는 입구라 `.dto.ts`가 그 자리가 아니다. **같은 뷰의 같은 열을 두 자리가 다르게 다룬다** — `listMembers`는 `has_device`가 비면 거짓으로 살리고 `getPushReachable`은 그 행을 버린다. 어느 쪽이 맞는지는 뷰 정의와 업무 규칙이 필요해 이 묶음 밖이다 |
| 5 | `Holiday` | `entities/payroll/model/payroll.type.ts:31`은 `{holidayDate, source, name \| null}`, `features/holiday/model/holiday.schema.ts:1`은 `{date, name}` | DB와 맞는 쪽은 `entities/payroll`이다. 뒤쪽은 외부 공휴일 API 응답을 파싱하는 자리라 **다른 사실일 수 있고**, 같은 이름을 쓴 탓에 섞인다 |

2와 3이 사용자가 보는 값을 틀리게 적는 자리다. 시간 길이를 말로 옮기는 손이 다섯인데 **정본과 맞는 것은 `features/adjustment/utils/spellHours.utils.ts`의 `spellHours` 하나고 넷이 틀리다.**

| 함수 | 0분 | 30분 | 90분 |
| --- | --- | --- | --- |
| `spellHours` (`features/adjustment`) | `0시간` | `30분` | `1시간 30분` |
| `spellMinutes` (`entities/rehearsal`) | **`0분`** | `30분` | `1시간 30분` |
| `spellLength` (`features/payrollCompute/utils/historyRows`) | **`0분`** | `30분` | `1시간 30분` |
| `spellWorkedHours` (`summary.utils`) | `0시간` | **`0시간 30분`** | `1시간 30분` |
| `spellWorkedHours` (`payrollSummary.utils`) | `0시간` | **`0시간 30분`** | `1시간 30분` |

[`spell-number-shared`](../backlog.md) 행이 이 판정을 이미 적었는데 그 행이 든 경로가 그 뒤 이동했고 0분 축의 두 자리는 안 들었다. 옮길 본문이 이미 있으니 `spellHours`를 `shared/utils`로 올리고 넷을 지운다.

### mutation 뒤처리가 셋으로 갈려 눈에 보이는 차이를 만든다

mutation service 44개 가운데 42개가 `invalidateQueries`로 뒤처리한다(예외 둘은 로그아웃과 재진입이고 까닭이 있다). `setQueryData`는 한 자리도 없고 `refetch`는 전부 사용자가 누르는 「다시」다. 갈린 것은 **그 함수를 부르는 꼴**이다.

| 꼴 | 수 | `isSuccess`가 서는 시점 |
| --- | --- | --- |
| `void invalidate(...)` | 21 | 요청만 날리고 바로 |
| `return invalidate(...)` | 15 | 새 데이터가 온 뒤 |
| `await invalidate(...)` | 6 | 새 데이터가 온 뒤 |

조각 controller 아홉이 `useEffect(() => { if (isSuccess) onDone() })`로 시트를 닫는다. 그래서 이 차이가 「시트가 닫힌 뒤 낡은 값이 한 틱 보이나」로 나타나고, 같은 동작이 슬라이스마다 다르다.

### 조각의 상태 계약이 꼴과 이름으로 갈린다

조각 controller 48개 중 읽는 것이 23개다. 그 23개가 상태를 내주는 꼴이 둘이다.

| 꼴 | 수 | 타입이 실수를 잡나 |
| --- | --- | --- |
| `state` 한 필드(문자열 union) | 16 | **안 잡는다** — `rows`가 늘 붙어 있어 pending일 때 `rows: []`를 읽어도 컴파일이 통과한다 |
| 판별 union | 5 | **잡는다** — ready 아닌 가지에서 `rows`에 손대면 막힌다 |

호출부 생김새는 거의 같다. 문자열 union 쪽도 이름이 또 갈린다 — 「기다리는 중」이 `pending` 13 對 `loading` 8, 끝 상태가 `ready` 14 · `rows` 5 · 그 밖 2다. 쓰기 쪽은 여섯으로 갈렸고(`sending` 7 · `saving` 5 · `uploading` 2 · `confirming` 1 · `closing` 1), 실패는 반쯤 글자 반쯤 참거짓이다(`failed: boolean` 10 對 `failedLine: string | null` 5).

상태별 그림을 누가 드느냐도 13 對 8로 갈렸다. [ADR-016](../2-design/adr/ADR-016-fragments-own-their-data.md)이 「조각이 `ReactNode`로 받는다」고 못박았는데 여덟이 자기가 import해 그린다. 가르는 축을 찾아보면 **슬라이스 단위로만 갈린다** — `features/stats` 다섯과 `entities`의 목록 조각 일곱은 전부 받고, `features/payrollCompute` 다섯과 `entities/schedule` 둘은 전부 자기가 그린다. 조각의 성격이 아니라 그 슬라이스를 쓴 회차가 갈랐다.

### 경로 글자가 다섯 집에 산다

`router.push`에 맨 문자열을 넣은 자리는 0이고 템플릿 리터럴 일곱도 모두 상수를 끼운다. 문제는 경로 글자 자체다.

| 집 | 무엇 |
| --- | --- |
| `shared/consts/navigation.const.ts` | 상수 22개. 정본이다 |
| `entities/notification/model/destination.policy.ts` | `"/schedule?date="`·`"/check-in"` 등을 문자열로 박는다. **그 둘은 `navigation.const.ts`에 없다** |
| `entities/session/model/resolveAuthDestination.policy.ts` | `"/login"`·`"/left"`·`"/"`. 셋 다 상수에 같은 값이 또 있다 |
| `entities/qr/consts/qr.const.ts` | `CHECK_IN_PATH = "/check-in"`. 경로 상수의 둘째 집이다 |
| `screens/notifications/consts/notifications.const.ts` | `BACK_BEARING_PREFIXES` |

`/check-in`은 종이 QR에 실려 나가는 경로다. 그것이 두 자리에 문자열로 사는 것은 중복이 아니라 어긋날 수 있는 계약이다.

### 책임이 한 자리에 모인 controller 넷

| 파일 | 줄 | 하는 일 | service | 쪼갤 금 |
| --- | --- | --- | --- | --- |
| `screens/scheduleAdmin/hooks/useDayDetail.ts` | 655 | 16 | **0** | 조정 묶음이 깨끗하고, 사람 고르기와 칸 구조가 `commit` 하나에 함께 매달린다 |
| `screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts` | 594 | 21 | 23 (query 9 · mutation 14) | 76줄(512–587)이 `DayDetailInput` 조립이다 |
| `screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts` | 368 | 17 | 9 | 모으는 달과 확정된 달 두 모드가 `cellStateOf`·`pressDay` 안에서 if로 갈린다 |
| `screens/stats/hooks/useStatsScreen.ts` | 248 | **21** | 6 | **`tab`이 일곱 자리에서 갈린다** — 질의 켜기·`sources`·값 Map·빈 판정·목록 상태·라벨, 그리고 탭별 조립 셋. 탭을 하나 더하면 일곱 자리를 다 손본다 |

`useDayDetail`이 655줄인데 service가 0인 것이 짝의 까닭이다 — query도 mutation도 안 부르고 **콜백 열다섯을 입력으로 받는다**. 그래서 `useScheduleAdminScreen`의 76줄이 그 조립에만 쓰인다. 두 파일이 한 덩이로 묶여 있다.

### 같은 일을 여러 controller가 각자 한다

| 반복되는 일 | 자리 수 | 비고 |
| --- | --- | --- |
| 토스트 들기(`useState<string \| null>` + `dismissToast`) | 10 | `useDayDetail`과 `useScheduleAdminScreen`이 같은 화면 안에서 각자 든다. 한쪽은 `{kind, message}`, 한쪽은 문자열 |
| 서버 시계 조립 | 13 | 그중 셋은 세 줄이 글자까지 같다 |
| 달 고르기 + 옮길 때 곁 상태 씻기 | 5 | 씻는 상태가 넷·다섯·넷으로 다르다 |
| 세션 → 프로필 두 겹 | 5 | 셋은 거기서 `role`·`isAdmin`까지 더 짠다 |
| mutation 성공 보고 닫고 씻기 | 4 | **하나만** `useCloseSheetOnSuccess`로 뽑아 두 번 쓴다 |
| 날짜별 Map을 루프로 짜기 | 4 | **하나만** `utils`로 내렸다 |
| 시트 열림을 합집합 타입으로 들기 | 4 | 네 가지 꼴이다 |
| 라우터 파라미터 심기 | 2 | 글자까지 같다 |
| `clockLabel = clock.slice(0, 5)` | 7 | 「시각을 HH:MM으로 자르기」 전체 |

### 중복 116 집단이 395 자리에 산다

| 축 | 집단 | 자리 |
| --- | --- | --- |
| 상수 | 32 | 116 |
| 문안 | 19 | 114 |
| 함수 본문 | 21 | 60 |
| 두 경로로 사는 계산 | 10 | 26 |
| 타입 | 34 | 79 |

가장 넓은 둘은 `"보내지 못했어요. 다시 시도해주세요"` 14자리와 `"닫기"` 27자리다. 앞의 것은 [data-access.md](../2-design/system/data-access.md)가 `TransportError`의 기본값으로 정했고 spec 다섯이 그것을 인용하는데도 열넷에 복사돼 있고, 둘은 JSX 생문안이다. 상수 쪽은 `MINUTES_PER_HOUR` 아홉, `DAY_MS` 일곱, `CLOCK_LENGTH` 넷, `SCREEN_BOTTOM_PADDING` 넷이다. Skeleton 조각은 같은 모양이 5·2·2자리에 각자 선다.

### `screens`에 남은 계산 쉰넷 가운데 스물일곱이 갈 데가 또렷하다

| 갈 자리 | 수 |
| --- | --- |
| `shared` | 10 |
| `entities` | 11 |
| `features` | 6 |
| `screens`가 맞다 | 8 (못 올라가는 넷 포함) |
| 애매하다 | 19 |

가장 또렷한 셋 — `screens/profile/model/hasRehearsalGrant.policy.ts`는 이미 `src/app/me/rehearsals.tsx`가 당겨 자기 슬라이스를 떠나 있고, `screens/adminStats/utils/chartValues.utils.ts`는 `features/stats` 하나만 당기는데 그 슬라이스에 자리가 이미 서 있고, `screens/scheduleWorker/model/attendanceColumn.policy.ts`는 프로덕션에서 아무도 안 써서 옮겨도 깨질 호출부가 없다.

못 올라가는 넷은 까닭이 서로 다르다. `dayDetail.type.ts`(224줄, 타입 14개)는 controller 계약이면서 `features` 셋을 한 번에 당긴다. `adjustSheetRows.utils.ts`는 `features/adjustment`와 `features/payrollCompute` 둘이 한 파일에 있어 규칙 3이 양쪽을 막는다. `positionRow.type.ts`는 쪼개도 남는 것이 그 화면의 뷰 꼴이다.

**애매한 열아홉이 갈래 다섯으로 모인다.** 그 다섯이 ADR-015 가름표의 구멍이다.

| 갈래 | 수 | 무엇이 안 풀렸나 |
| --- | --- | --- |
| import은 0인데 모양이 도메인 하나다 | 4 | 타입을 import하지 않고 손으로 다시 선언해 「당기는 도메인 슬라이스」가 0으로 센다 |
| 문안인가 함수인가 | 3 | 0 슬라이스라 `shared`지만 ADR은 화면 문안을 `consts`로 박았다 |
| 세그먼트가 애매하다 | 2 | `qrSvg`가 `utils`인가 `lib`인가, `pressNotification`의 `.policy.ts`가 효과를 돌린다 |
| 한 파일에 자리가 둘이다 | 3 | 쪼개면 갈린다 |
| 화면 상태를 인자로 받는다 | 3 | 가름표 마지막 줄이 「읽는다」를 인자까지 세는지 안 적혀 있다 |

그리고 **재수출이 셈을 더럽힌다.** `screens`의 `model` 파일 셋이 `shared/utils/kstDate`를 재수출하고, `entities/schedule/utils/formatScheduleDate.utils.ts`도 `kstDateOf`를 그렇게 내보낸다. 그 탓에 네 파일의 「당기는 도메인 슬라이스 수」가 겉으로 1, 실제로는 0이다. 가름표를 기계가 세게 하려면 재수출을 먼저 걷어야 셈이 맞는다.

### 테스트가 안 보는 자리

짝 테스트가 없는 `.ts`는 423개 중 89개인데 75개가 `api`고 그중 73개는 integration 짝을 가진다. 정책대로다. 남는 구멍은 둘이다.

**`.mapper.ts` 여섯** — `attendance`·`excuse`·`profile`·`payroll`·`notification`·`hall`. 매퍼 12개 중 절반만 짝이 있다. 매퍼는 DTO를 도메인 타입으로 옮기는 자리라 필드를 잘못 매핑하면 조용히 틀린 값이 화면에 간다. [관찰 061](../observations/061-untyped-mocks-let-typecheck-pass.md)과 겹치면 DTO가 바뀌어도 아무 테스트가 안 깨진다.

**`shared/ui`의 계산하는 조각 넷** — `TrendChart`(197줄 가운데 79줄이 계산이고 62줄은 React를 하나도 안 쓴다)·`RowBars`·`ScheduleDayCell`·`DashedOutline`. ADR-001이 `shared/ui`를 TDD 훅에서 빼둔 자리다.

[`chart-math-out-of-tsx`](../backlog.md) 행을 두 자리 고친다. `RatioBand`는 몫을 계산하지 않는다 — `flexGrow: entry.share.value`로 비율을 RN flex에 넘기고 파일 안의 산술은 색 집기 한 줄이다. 대신 그 행이 안 든 `ScheduleDayCell`이 점선 테두리 기하를 계산한다.

## 추천과 대안

### 묶음 여덟

| 묶음 | 무엇 | 집행 | 기존 행 |
| --- | --- | --- | --- |
| **A. 어긋난 값 다섯** | `periodSpan`의 2월, 시간 길이 문안 넷, `PushReachableRow` 셋, `Holiday` 둘 | 실패 테스트가 먼저 선다 | [`spell-number-shared`](../backlog.md)를 키운다 |
| **B. mutation 뒤처리 한 꼴** | 42자리를 한 꼴로. `isSuccess`를 새 데이터 뒤에 세울지부터 정한다 | lint 규칙 하나 | 새 행 |
| **C. 재수출 걷기** | `screens`의 `model` 셋과 `entities/schedule/utils` 하나 | lint 규칙 하나 | 새 행. **D의 선행이다** |
| **D. 계산 쉰넷의 거처** | 또렷한 27건을 옮기고, 애매한 19건의 갈래 다섯으로 ADR-015를 벼린다 | 가름표가 기계가 세는 꼴이 된다 | 새 행 |
| **E. 중복 모으기** | 상수 32·문안 19·함수 21 집단. **plan은 그 가운데 숫자 상수 넷과 실패 문안 하나와 시각 자르기만 닫는다** — 함수·계산·타입 축은 집단마다 「같은 사실인가」를 물어야 한다 | `"보내지 못했어요"`는 lint 규칙 하나 | [`duplicated-constants-and-copy`](../backlog.md)를 키운다 |
| **F. 경로 한 집** | 다섯 집을 `navigation.const.ts` 하나로. `/schedule`·`/check-in`을 거기 세운다 | lint 규칙 하나 | 새 행 |
| **G. 조각 상태 계약** | 판별 union으로 21자리, 이름 하나로, 그림은 `ReactNode`로 여덟 자리 | 규칙 한 줄 | [`fragments-own-their-data`](../backlog.md)의 남은 묶음 |
| **H. controller 쪼개기** | 넷의 무게를 덜고 반복되는 일 **여섯**을 공통 훅으로. 시각 자르기는 E가, 시트 열림 union은 G가 받고 라우터 파라미터 둘은 안 뽑는다 | 줄 수 상한 | 무게는 같은 행의 AC-04, 반복은 [`controller-common-hooks`](../backlog.md) |

### 순서

A가 먼저다. 시간 길이 문안 넷이 사용자가 보는 값을 틀리게 적고 테스트가 안 잡았다. 정본과 맞는 본문이 이미 한 자리에 있으니 옮기기만 한다.

B를 둘째에 둔다. 작고, 고치면 「시트 닫힌 뒤 한 틱」이 사라진다.

C를 셋째에 둔다. 혼자서는 값이 없지만 D의 셈을 바로잡는다. 재수출이 남아 있으면 「도메인 슬라이스 몇을 당기나」가 거짓을 센다.

E와 F를 넷째 묶음에 함께 둔다. 둘 다 기계가 세고 lint가 막는다. F는 `/check-in`이 종이에 실려 나가서 급하고, E는 395자리라 한 번에 안 된다 — 가장 넓은 둘(`"보내지 못했어요"` 14, `MINUTES_PER_HOUR` 9)부터 민다.

D의 나머지, G, H는 그 뒤다. D의 애매한 열아홉과 G의 「`isSuccess`를 언제 세우나」는 결정이 먼저 필요하고, H는 `fragments-own-their-data`가 안 닫혀 있다.

### 대안

**현행 유지.** 층 규칙이 지켜지니 당장 무너지지 않는다. 비용은 A가 남는 것이다 — 시간 길이가 화면마다 다르게 적히고 `periodSpan`은 날이 아닌 날짜를 계속 낸다. 유지의 비용이 아니라 이미 난 빚이다.

**한꺼번에.** 묶음 여덟을 한 PR로 밀면 395자리와 54건이 한 diff에 들어온다. 리뷰가 불가능하고, 되돌릴 단위가 없다.

**묶음을 더 쪼갠다.** E를 축마다 넷으로 가르는 길이 있다. 그러면 행이 열하나가 되고, 상수와 문안이 같은 파일(`*.const.ts`)에 살아 같은 파일을 네 번 건드린다. 여덟이 되돌릴 단위와 파일 겹침의 균형점이다.

## 적용 범위

갱신할 정본 — [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 가름표(D의 갈래 다섯), [ADR-016](../2-design/adr/ADR-016-fragments-own-their-data.md)의 조각 상태 계약(G), [writing.md](../2-design/design-system/writing.md)의 「더보기 / 더 보기」(정본에 그 줄이 없다).

새로 설 lint 규칙 다섯 — 재수출 금지(C), `onSuccess` 꼴(B), 경로 글자(F), `TransportError` 기본 문안(E), 조각 상태 계약(G). 각각 다섯 자리를 한 커밋에 건드린다.

범위 밖 — `shared/api/databaseTypes.ts`(생성물), 적용된 마이그레이션, `src/app/_catalog.tsx`, 시안 `.html`.

미정 세 가지. **하나** — `isSuccess`를 새 데이터가 온 뒤에 세울지. 기다리는 꼴이 맞으면 42자리가 `await`로 가고 시트 닫힘이 한 틱 늦는다. **둘** — `Holiday` 둘이 다른 사실인지. 다른 사실이면 이름만 가르고 모양은 둔다. **셋** — 「더보기」와 「더 보기」 중 어느 쪽인지. 정본에 그 줄이 없다.

## 이행과 완료 기준

묶음마다 단명 브랜치 하나, PR 하나다. A는 실패 테스트가 먼저 서고(TDD 훅이 짝 없는 새 `.ts`를 막는다), C·F는 규칙을 마지막에 켠다(자리를 다 옮긴 뒤여야 초록이 난다).

완료를 세는 수 — A는 어긋난 다섯이 0이고 2월을 단언하는 테스트가 선다. B는 `onSuccess` 꼴이 하나고 규칙이 둘째 꼴을 막는다. C는 재수출이 0이다. D는 또렷한 27건이 제자리고 가름표가 애매한 열아홉을 판정한다. E는 가장 넓은 둘이 한 집이다. F는 경로 글자가 한 집이고 `/schedule`·`/check-in`이 거기 있다. G는 조각 23개의 상태 꼴이 하나고 그림을 자기가 그리는 자리가 0이다. H는 controller 넷이 각각 200줄 아래다.

매퍼 여섯과 `shared/ui` 조각 넷의 짝 테스트는 A와 함께 선다 — 그 둘이 A의 어긋남을 다시 들이지 않게 막는 자리다.

## 판단할 항목

다섯을 다 판정했다. 결정 기록이 든다.

## 결정 기록

**순서는 제안서대로 간다.** A(값이 틀리는 축) → B(mutation 뒤처리) → C(재수출 걷기) → E·F(중복·경로) → D·G·H. 작고 기계가 집행할 수 있는 것부터 가고, C가 D의 셈을 바로잡는 선행이라 그 앞에 선다.

**`isSuccess`는 새 데이터가 온 뒤에 선다.** 42자리를 `await invalidate(...)` 한 꼴로 모은다. 시트가 닫히는 것이 한 틱 늦는 값을 치르고 「닫힌 뒤 낡은 값이 보이는」 자리를 없앤다. 지금 `void` 21자리가 고칠 자리고, 둘째 꼴을 막는 lint 규칙이 그 뒤에 선다.

**`Holiday` 둘은 다른 사실이다.** `features/holiday/model/holiday.schema.ts`의 것은 외부 공휴일 API 응답을 파싱한 결과로 `features/holiday/utils/holiday.mapper.ts`의 `toHolidayImportEntry` 하나가 읽는다. `entities/payroll/model/payroll.type.ts`의 것은 DB에 사는 행이고 `source`가 「어디서 왔나」를 든다. 모양은 그대로 두고 이름만 가른다 — 파싱 결과 쪽이 새 이름을 받는다.

**「더보기」로 붙여 쓴다.** 저장소가 붙여쓰기 3자리 對 띄어쓰기 2자리고 UI 관례가 그쪽이다. [writing.md](../2-design/design-system/writing.md)에 그 줄이 없어 생긴 구멍이니 묶음 E가 그 한 줄을 세운다.

**H는 둘로 갈린다.** controller 넷의 무게를 덜어 각각 200줄 아래로 두는 것은 [`fragments-own-their-data`](../backlog.md)의 AC-04가 이미 든다. 반복되는 일 아홉(토스트 10자리·서버 시계 13자리·달 고르기 5자리·세션에서 프로필 5자리)을 공통 훅으로 뽑는 것은 그 행 밖이라 따로 선다.
