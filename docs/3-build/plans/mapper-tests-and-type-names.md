# 이름이 사실과 어긋난 자리를 갈라 짝 테스트로 못 박는다

같은 이름이 두 사실을 들고, 다른 이름이 한 사실을 든다. 그 자리를 가르고 매퍼 여섯에 짝 테스트를 세운다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 A 가운데 뒤쪽 절반이다.** 앞쪽 절반(시간 길이 문안과 `periodSpan`)은 [`spell-number-shared`](spell-number-shared.md)가 닫았다.

### 셋이 한 PR인 까닭

`entities/*/api`와 `entities/*/utils`의 같은 경계다. 그리고 **매퍼 짝 테스트를 쓰면 이름 결정이 먼저 와야 한다** — 짝 테스트가 없는 여섯 가운데 `notification.mapper.ts`가 바로 `PushReachable` 이름이 어긋난 자리다. 그 매퍼의 입구가 무엇인지 안 정하고는 단언을 쓸 수 없다.

### `PushReachable` — 선언 셋이고 꼴은 하나여야 한다

제안서가 「`PushReachableRow` 셋」이라 적었다. 셋 맞지만 **갈라야 할 두 사실이 아니라 하나로 모을 한 사실이다.**

| 자리 | 꼴 |
| --- | --- |
| `entities/member/api/member.dto.ts:38` `PushReachableRow` | `profile_id: string \| null` · `has_device: boolean \| null` |
| `entities/notification/api/getPushReachable.api.ts:6` `ViewRow` (지역) | 같다 |
| `entities/notification/api/notification.dto.ts:19` `PushReachableRow` | `profile_id: string` · `has_device: boolean` |

**DB 정본은 nullable이 아니다.** 뷰를 세운 마이그레이션이 이렇다.

```sql
create view public.push_reachable as
select
  profiles.id as profile_id,
  exists (
    select 1 from public.push_tokens
    where push_tokens.profile_id = profiles.id
  ) as has_device
from public.profiles
where public.is_admin();
```

`profile_id`는 `profiles.id`고 그것이 기본 키라 **절대 null이 아니다.** `has_device`는 `exists(...)`고 SQL의 `EXISTS`는 참이나 거짓만 내 **null이 될 수 없다.** 두 열 다 값이 보장된다.

**`databaseTypes.ts`가 nullable로 적는 것은 생성기의 한계다.** 뷰는 열의 NOT NULL 정보를 안 들고 있어 생성기가 모든 뷰 열을 보수적으로 nullable로 적는다. **정본은 마이그레이션이고 생성 파일은 손실이 있는 투영이다.** `tests/lint/databaseTypes.ts`도 그 일치를 요구하지 않는다 — 「마이그레이션의 객체가 생성 타입에 있나」와 「맨 client를 쓰나」 둘만 본다.

**저장소가 이미 실제 보장을 적는다.** `member.dto.ts`의 `MemberSummaryRow`가 `id: string`(기본 키라 non-null)과 `display_name: string | null`을 나란히 든다 — 생성기가 테이블 열에는 NOT NULL을 옮기므로 그 파일이 실제 보장과 맞는다. **`.dto.ts`의 꼴은 DB가 보장하는 것이고, 뷰에서는 생성 파일이 그것을 못 전한다.**

그래서 **틀린 것은 non-nullable로 적은 셋째가 아니라 nullable로 적은 앞의 둘이다.** 셋을 하나로 모으되 꼴은 non-nullable 쪽이다.

### null을 다르게 다루는 두 자리는 닿을 수 없는 가지다

| 자리 | 지금 하는 일 |
| --- | --- |
| `entities/member/api/listMembers.api.ts:66` | `profile_id === null`이면 행을 버리고 `has_device ?? false`로 살린다 |
| `entities/notification/api/getPushReachable.api.ts:31` | 둘 중 하나라도 null이면 행을 버린다 |

**둘 다 올 수 없는 값을 막는다.** 뷰가 null을 못 내므로 어느 쪽도 돌지 않는 가지고, 「어느 쪽이 맞나」는 물을 것이 없다. [`spell-number-shared`](spell-number-shared.md)의 `0분`이 마이그레이션의 제약으로 닿을 수 없다고 밝혀진 것과 같은 꼴이다.

**지금 있는 integration 테스트가 그것을 이미 단언한다.** `src/entities/notification/api/__tests__/getPushReachable.api.integration.test.ts:30`이 기기 없는 사람의 `hasDevice`를 `false`로 단언한다 — 그 행이 **버려지지 않고 거짓으로 온다.** null이면 버려졌을 자리다.

**그래서 두 가지를 걷는다.** 동작은 안 바뀐다 — 닿을 수 없는 가지라서다.

**`getPushReachable`을 부르는 프로덕션 코드가 없다.** 저장소 전체에서 그 함수를 쓰는 것은 자기 integration 테스트뿐이다. 지우지 않는다 — 푸시를 보내는 자리가 아직 안 섰을 뿐이고 뷰와 매퍼와 테스트가 다 서 있다. 이 계획은 그 사실만 적는다.

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

이름이 겹친 자리는 다음 사람이 「이미 있으니 쓰자」로 한쪽을 당긴다. 같은 이름이 꼴 둘을 들면 nullable 쪽을 당긴 코드가 올 수 없는 null을 막는 가지를 또 쓴다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| 매퍼 여섯의 `__tests__/<이름>.mapper.test.ts` | 신설. export 13개가 각자 불린다 |
| `tests/lint/` 새 검사 | 저장소 실물에서 짝 테스트 없는 `.ts`를 세어 매퍼가 0임을 못 박는다. 검사 15의 훅이 못 보는 자리다 |
| `entities/notification/api/notification.dto.ts` | `PushReachableRow`가 그대로 남는다 — 그 꼴이 뷰의 보장과 맞는다 |
| `entities/notification/api/getPushReachable.api.ts` | 지역 `ViewRow`와 null을 막는 가지를 지운다. 자기 `.dto.ts`의 `PushReachableRow`로 받아 바로 `map(toPushReachable)`을 한다 |
| `entities/member/api/member.dto.ts` | `PushReachableRow`의 두 열이 non-nullable이 된다 — 뷰의 보장과 맞춘다 |
| `entities/member/api/listMembers.api.ts` | `profile_id === null` 가지와 `?? false`를 지운다. `flatMap`이 `map`으로 돌아간다 |
| `entities/notification/utils/notification.mapper.ts` | 안 바뀐다 — 입구가 이미 `PushReachableRow`다 |
| `entities/notification/utils/__tests__/notification.mapper.test.ts` | `FilledPushReachableRow`를 당기던 줄이 `PushReachableRow`로 돌아가고 `@ts-expect-error`와 `eslint-disable`이 사라진다 |
| `features/holiday/model/holiday.schema.ts` | `Holiday`를 외부 응답임이 드러나는 이름으로 바꾼다 |
| `entities/payroll/model/payroll.type.ts` | `Holiday`는 그대로 둔다 — DB 행이 그 이름의 임자다 |

**뷰 row는 슬라이스마다 자기 `.dto.ts`에 선언한다.** 규칙 3이 같은 층 슬라이스끼리 import를 막아 `entities/notification`이 `entities/member`의 `.dto.ts`를 당길 수 없다. `shared`로 올리는 길도 있지만 **저장소가 이미 반대로 정해 뒀다** — `ExcuseStatusRow`가 `attendance.dto.ts:11`과 `payroll.dto.ts:21`에 글자 하나까지 같은 꼴로 둘 선다. `.dto.ts`는 손으로 선언하는 자리고 `databaseTypes.ts`에서 파생하는 DTO가 한 자리도 없다 — 정본은 생성된 그 파일이고 `.dto.ts`는 질의가 고르는 열만 적는다. 같은 뷰라도 슬라이스가 고르는 열이 다를 수 있으니 한 자리로 묶으면 그 자유가 사라진다.

## 완료 조건

- **AC-01** 매퍼 여섯에 짝 테스트가 서고 export 13개가 각자 불린다. 필드를 하나라도 잘못 옮기면 깨진다
- **AC-02** `tests/lint/`의 새 검사가 저장소 실물에서 `.mapper.ts` 전부에 짝 테스트가 있음을 센다. 그 검사가 `DOCUMENTED_LINT_RULE_COUNT`와 `docs/4-test/execution.md`에 선다
- **AC-03** `PushReachableRow`라는 이름이 꼴 하나만 가리킨다. 두 슬라이스가 각자 `.dto.ts`에 선언하고 두 열이 **non-nullable**이다 — 뷰가 그것을 보장한다. `getPushReachable.api.ts`의 지역 `ViewRow`가 사라진다
- **AC-04** `Holiday`라는 이름이 DB 행만 가리킨다. 외부 응답 쪽은 다른 이름이고 꼴은 안 바뀐다
- **AC-05** null을 막는 가지가 두 자리에서 사라진다 — `listMembers`의 `?? false`와 `profile_id === null`, `getPushReachable`의 `!== null` 둘이다. **동작은 안 바뀐다** — 뷰가 null을 못 내므로 닿을 수 없는 가지고, `getPushReachable.api.integration.test.ts:30`이 기기 없는 사람도 `hasDevice: false`로 온다고 이미 단언한다
- **AC-06** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. **이름과 꼴이 이미 정해졌다** — `PushReachableRow` 하나고 두 열이 non-nullable이며 슬라이스마다 자기 `.dto.ts`에 선다. 외부 응답 쪽 `Holiday`는 AC-04가 든다. 보고할 판정이 남지 않았다
2. 매퍼 여섯의 짝 테스트를 쓴다. `notification.mapper.ts`는 1번이 끝난 뒤다
3. 꼴을 모은다. `member.dto.ts`의 두 열을 non-nullable로 하고 지역 `ViewRow`를 지우고 null을 막는 가지 셋을 걷는다
4. `Holiday`를 바꾼다 — `features/holiday` 쪽만이다
5. 실물을 세는 검사를 세운다. **매퍼 여섯이 다 찬 뒤여야 초록이 난다**
6. 검증하고 PR을 연다

**훅이 2번을 막지 않는다** — 짝 테스트를 먼저 쓰는 것이 훅이 요구하는 순서 그대로다. 3번과 4번이 매퍼 본문을 건드리는데 그때는 짝이 이미 있다.

## 리스크

**`payroll.mapper.ts`의 export 다섯이 가장 무겁다.** 54줄에 다섯이면 하나가 열 줄 안쪽이라 단언이 짧겠지만, 급여는 금액을 옮기는 자리라 필드 하나가 틀리면 돈이 틀린다. 그 다섯을 먼저 쓰고 나머지를 뒤에 둔다.

**이름을 바꾸면 당기는 자리가 따라 바뀐다.** `Holiday`는 `features/holiday` 안에서만 쓰여 좁지만, 뷰 row 타입은 두 슬라이스가 읽어 1번의 판정에 매달린다.

**AC-05가 거는 것은 마이그레이션 한 장이다.** 뷰가 `exists(...)`와 기본 키로 값을 보장하므로 가지를 걷는 것이 안전하다. 뒤에 그 뷰를 `left join`으로 고치면 null이 올 수 있고 **그때는 아무 검사도 못 막는다** — `tests/lint/databaseTypes.ts`가 꼴의 일치를 안 본다. 그 뷰를 고치는 사람이 `.dto.ts`를 같이 봐야 한다.

**`@ts-expect-error`로 미리 쓴 단언은 극성이 뒤집힌다.** 아직 없는 타입 이름을 당길 때 그 지시자를 쓰면 **지금 초록이고, 이름이 생기는 순간 「쓸모없는 지시자」로 `TS2578`이 난다.** 「지금 빨강 → 구현 뒤 초록」이 아니다. 구현이 그 지시자를 떼는 것이 마지막 걸음이고, 그 빨강이 떼라고 알리는 신호다. 메모리의 「대상 없는 테스트가 typecheck를 죽인다」가 그 꼴을 정했다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다 — `pnpm test -- <경로>`는 pnpm이 플래그를 먹는다. integration은 범위 밖이다 — `api/`의 질의를 안 바꾸고 타입 이름과 그 자리만 바꾼다.
