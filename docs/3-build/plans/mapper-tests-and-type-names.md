# 이름이 사실과 어긋난 자리를 갈라 짝 테스트로 못 박는다

같은 이름이 두 사실을 들고, 다른 이름이 한 사실을 든다. 그 자리를 가르고 매퍼 여섯에 짝 테스트를 세운다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 A 가운데 뒤쪽 절반이다.** 앞쪽 절반(시간 길이 문안과 `periodSpan`)은 [`spell-number-shared`](spell-number-shared.md)가 닫았다.

### 셋이 한 PR인 까닭

`entities/*/api`와 `entities/*/utils`의 같은 경계다. 그리고 **매퍼 짝 테스트를 쓰면 이름 결정이 먼저 와야 한다** — 짝 테스트가 없는 여섯 가운데 `notification.mapper.ts`가 바로 `PushReachable` 이름이 어긋난 자리다. 그 매퍼의 입구가 무엇인지 안 정하고는 단언을 쓸 수 없다.

### `PushReachable` — 선언 셋인데 성격이 둘이다

제안서가 「`PushReachableRow` 셋」이라 적었지만 사본 셋이 아니다. **둘은 같은 사실에 다른 이름이고, 하나는 다른 사실에 같은 이름이다.**

| 자리 | 꼴 | 무엇인가 |
| --- | --- | --- |
| `entities/member/api/member.dto.ts:38` `PushReachableRow` | `profile_id: string \| null` · `has_device: boolean \| null` | 뷰 `push_reachable`의 row |
| `entities/notification/api/getPushReachable.api.ts:6` `ViewRow` (지역) | 같다 | 같다 |
| `entities/notification/api/notification.dto.ts:19` `PushReachableRow` | `profile_id: string` · `has_device: boolean` | 뷰 row가 아니라 **좁힌 뒤 `toPushReachable`에 넣는 입구** |

**DB 정본이 nullable이다.** `src/shared/api/databaseTypes.ts`의 `push_reachable` 뷰가 두 열을 `string | null`·`boolean | null`로 낸다. 앞의 둘이 정본과 맞고, 셋째는 애초에 DTO가 아니다 — `getPushReachable.api.ts:31`이 `row.profile_id !== null && row.has_device !== null`로 좁힌 뒤 그 꼴을 만들어 넘긴다.

**선례가 그 자리를 이미 정해 뒀다.** `entities/member/api/member.dto.ts`가 `QualificationRow`(nullable 뷰 row)와 `FilledQualificationRow`(좁힌 꼴)를 **같은 `.dto.ts`에 나란히** 들고, `getQualifications.api.ts:9`가 `function isFilled(row: QualificationRow): row is FilledQualificationRow`로 좁혀 `.filter(isFilled).map(toQualification)`을 한다. 매퍼는 좁힌 꼴만 받는다.

그래서 **틀린 것은 자리가 아니라 이름이다.** 좁힌 꼴이 `.dto.ts`에 사는 것은 선례대로고, 그것이 뷰 row와 **같은 이름**인 것이 틀렸다. 좁히는 일이 `api/` 안에서 일어나므로 그 꼴도 `api/`의 말이다.

**null을 두 자리가 다르게 다룬다.** 같은 뷰의 같은 열인데 갈린다.

| 자리 | `has_device`가 null이면 | `profile_id`가 null이면 |
| --- | --- | --- |
| `entities/member/api/listMembers.api.ts:66` | `?? false`로 살린다 | 그 행을 버린다 |
| `entities/notification/api/getPushReachable.api.ts:31` | 그 행을 버린다 | 그 행을 버린다 |

**이 갈림의 판정은 이 계획 밖이다.** 뷰가 어떤 경우에 null을 내는지가 업무 규칙이고, 그 답에 따라 둘 중 하나가 틀린다. 이 계획은 **지금 동작을 바꾸지 않고** 짝 테스트로 그 차이를 드러내 기록만 한다 — 고치려면 뷰의 정의를 읽고 업무 규칙을 정해야 하므로 따로 간다.

### `Holiday` — 다른 사실에 같은 이름

| 자리 | 꼴 | 무엇인가 |
| --- | --- | --- |
| `features/holiday/model/holiday.schema.ts:1` | `{date, name}` | 외부 공휴일 API 응답을 파싱한 결과 |
| `entities/payroll/model/payroll.type.ts:31` | `{holidayDate, source, name}` | DB에 저장된 행 |

둘은 사는 층도 다르고 들고 있는 사실도 다르다. **꼴을 합치지 않는다** — 이름만 가른다. 앞의 것은 `parseHolidayApiResponse`만 쓰고 `toHolidayImportEntry`가 받아 뒤의 것으로 옮긴다.

### 매퍼 여섯에 짝 테스트가 없다

매퍼 12개 가운데 여섯이다. 내보내는 함수가 모두 13개다.

| 매퍼 | export | 줄 |
| --- | --- | --- |
| `entities/payroll/utils/payroll.mapper.ts` | 5 | 54 |
| `entities/attendance/utils/attendance.mapper.ts` | 2 | 39 |
| `entities/notification/utils/notification.mapper.ts` | 2 | 27 |
| `entities/profile/utils/profile.mapper.ts` | 2 | 32 |
| `entities/excuse/utils/excuse.mapper.ts` | 1 | 15 |
| `entities/hall/utils/hall.mapper.ts` | 1 | 10 |

**왜 빠져나갔나.** 검사 15(「내보내는 함수마다 그것을 부르는 짝 테스트가 먼저 있어야 한다」)가 lint 규칙이 아니라 훅이다 — `.claude/hooks/tdd-guard-unit.py`가 `src/`를 쓰는 순간에만 본다. 그 훅보다 먼저 있던 파일은 아무도 세지 않는다. 지금 그 여섯을 고치려 하면 훅이 막는다.

**실물을 세는 검사가 선다.** 선례가 둘이다 — `tests/lint/fileNaming.test.ts:365`의 「저장소 실물에 위반이 없다」와 `tests/lint/databaseTypes.test.ts:246`이 같은 꼴이다.

## 왜 고치나

매퍼는 DB가 준 꼴을 도메인 타입으로 옮기는 자리다. 필드를 잘못 맞추면 아무 데서도 안 터지고 **조용히 틀린 값이 화면에 간다.** [관찰 061](../../observations/061-untyped-mocks-let-typecheck-pass.md)과 겹치면 DTO가 바뀌어도 깨지는 테스트가 없다.

이름이 겹친 자리는 다음 사람이 「이미 있으니 쓰자」로 틀린 쪽을 당긴다. `notification.dto.ts`의 `PushReachableRow`를 뷰 row로 믿고 쓰면 null이 온 날 터진다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| 매퍼 여섯의 `__tests__/<이름>.mapper.test.ts` | 신설. export 13개가 각자 불린다 |
| `tests/lint/` 새 검사 | 저장소 실물에서 짝 테스트 없는 `.ts`를 세어 매퍼가 0임을 못 박는다. 검사 15의 훅이 못 보는 자리다 |
| `entities/notification/api/notification.dto.ts` | 좁힌 꼴의 이름이 `FilledPushReachableRow`가 되고, 뷰 row `PushReachableRow`가 그 옆에 선다 |
| `entities/notification/api/getPushReachable.api.ts` | 지역 `ViewRow`를 지운다. `getQualifications.api.ts`의 꼴을 따라 `isFilled` type guard로 좁히고 `.filter(isFilled).map(toPushReachable)`을 한다 |
| `entities/notification/utils/notification.mapper.ts` | `toPushReachable`의 입구가 `FilledPushReachableRow`다 |
| `features/holiday/model/holiday.schema.ts` | `Holiday`를 외부 응답임이 드러나는 이름으로 바꾼다 |
| `entities/payroll/model/payroll.type.ts` | `Holiday`는 그대로 둔다 — DB 행이 그 이름의 임자다 |

**뷰 row는 슬라이스마다 자기 `.dto.ts`에 선언한다.** 규칙 3이 같은 층 슬라이스끼리 import를 막아 `entities/notification`이 `entities/member`의 `.dto.ts`를 당길 수 없다. `shared`로 올리는 길도 있지만 **저장소가 이미 반대로 정해 뒀다** — `ExcuseStatusRow`가 `attendance.dto.ts:11`과 `payroll.dto.ts:21`에 글자 하나까지 같은 꼴로 둘 선다. `.dto.ts`는 손으로 선언하는 자리고 `databaseTypes.ts`에서 파생하는 DTO가 한 자리도 없다 — 정본은 생성된 그 파일이고 `.dto.ts`는 질의가 고르는 열만 적는다. 같은 뷰라도 슬라이스가 고르는 열이 다를 수 있으니 한 자리로 묶으면 그 자유가 사라진다.

## 완료 조건

- **AC-01** 매퍼 여섯에 짝 테스트가 서고 export 13개가 각자 불린다. 필드를 하나라도 잘못 옮기면 깨진다
- **AC-02** `tests/lint/`의 새 검사가 저장소 실물에서 `.mapper.ts` 전부에 짝 테스트가 있음을 센다. 그 검사가 `DOCUMENTED_LINT_RULE_COUNT`와 `docs/4-test/execution.md`에 선다
- **AC-03** `PushReachableRow`라는 이름이 뷰 row 하나만 가리킨다. 좁힌 꼴은 `FilledPushReachableRow`고 같은 `.dto.ts`에 선다 — `FilledQualificationRow`의 선례대로다. `getPushReachable.api.ts`의 지역 `ViewRow`가 사라지고 `isFilled` type guard가 그 일을 한다
- **AC-04** `Holiday`라는 이름이 DB 행만 가리킨다. 외부 응답 쪽은 다른 이름이고 꼴은 안 바뀐다
- **AC-05** null을 다르게 다루는 두 자리가 짝 테스트로 드러난다 — `listMembers`는 `has_device: null`을 `false`로 살리고 `getPushReachable`은 그 행을 버린다는 것이 단언으로 선다. **동작은 안 바꾼다**
- **AC-06** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. **이름이 이미 정해졌다** — 뷰 row는 `PushReachableRow`로 슬라이스마다, 좁힌 꼴은 `FilledPushReachableRow`로 같은 `.dto.ts`에, 외부 응답 쪽 `Holiday`는 AC-04가 든다. 보고할 판정이 남지 않았다
2. 매퍼 여섯의 짝 테스트를 쓴다. `notification.mapper.ts`는 1번이 끝난 뒤다
3. 이름을 가른다. `notification.dto.ts`의 `PushReachableRow`를 지우고 좁힌 꼴을 매퍼 옆으로 옮긴다
4. `Holiday`를 바꾼다 — `features/holiday` 쪽만이다
5. 실물을 세는 검사를 세운다. **매퍼 여섯이 다 찬 뒤여야 초록이 난다**
6. 검증하고 PR을 연다

**훅이 2번을 막지 않는다** — 짝 테스트를 먼저 쓰는 것이 훅이 요구하는 순서 그대로다. 3번과 4번이 매퍼 본문을 건드리는데 그때는 짝이 이미 있다.

## 리스크

**`payroll.mapper.ts`의 export 다섯이 가장 무겁다.** 54줄에 다섯이면 하나가 열 줄 안쪽이라 단언이 짧겠지만, 급여는 금액을 옮기는 자리라 필드 하나가 틀리면 돈이 틀린다. 그 다섯을 먼저 쓰고 나머지를 뒤에 둔다.

**이름을 바꾸면 당기는 자리가 따라 바뀐다.** `Holiday`는 `features/holiday` 안에서만 쓰여 좁지만, 뷰 row 타입은 두 슬라이스가 읽어 1번의 판정에 매달린다.

**AC-05가 「고치지 않고 드러낸다」다.** 짝 테스트가 지금 동작을 그대로 단언하므로, 뒤에 업무 규칙을 정해 한쪽을 고치면 그 단언이 깨진다. **그것이 의도다** — 깨지는 테스트가 그 자리를 다시 보게 만든다. 단언 이름에 「지금은 이렇다」를 담지 않고 무엇을 하는지만 적는다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다 — `pnpm test -- <경로>`는 pnpm이 플래그를 먹는다. integration은 범위 밖이다 — `api/`의 질의를 안 바꾸고 타입 이름과 그 자리만 바꾼다.
