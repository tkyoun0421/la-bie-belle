# DB 열 이름을 `api` 안에서 끝낸다

`.dto.ts`가 선 뒤에도 그 꼴이 화면까지 그대로 닿는다. 매퍼를 세워 `api`를 떠나는 값이 도메인 모양이 되게 하고, 그 뒤로는 `work_date`가 `api` 밖에 없게 한다.

## 입력 명세·기준

**정본은 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 「파일 이름」이다** — `[domain].dto.ts`가 통신이 주고받는 꼴을, `<이름>.mapper.ts`가 꼴 바꾸기를 든다. [fsd-read-write-layers](fsd-read-write-layers.md)의 AC-06나가 「`.api.ts`가 돌려주기 전에 `utils/`의 `.mapper.ts`를 불러 도메인 모양으로 바꾼다」를 적고, 이 계획이 그 뒷겹을 든다.

**저장소에서 확인한 것.**

- DB 열 이름이 `api/` 밖 **파일 쉰여덟**에 닿는다. `work_date` 92회 · `profile_id` 79회 · `display_name` 42회 · `ended_at` 41회 · `starts_at`·`ends_at` 각 35회가 그 밖에서 읽힌다
- 테스트에서도 읽는다 — 같은 열 이름이 `__tests__` 안에 사백 넘게 있다. 단언이 DB 열 이름으로 쓰여 있어 매퍼를 세우면 그 단언도 바뀐다
- **DTO 하나가 묶음 넷에 걸친다.** `ScheduleDay`를 근무표·급여(`features/payrollCompute`)·통계(`features/stats`·`screens/stats`·`screens/adminStats`)·근태가 당긴다. 도메인 축으로 가른 PR 안에서는 못 바꾼다
- `api/`가 이미 꼴을 바꾸는 자리는 하나다 — `getMonthWindow`가 `application_deadline`·`confirmed_at`을 camelCase로 옮긴다

## 왜 따로 떼나

**도메인 축으로 가를 수 없다.** [fsd-read-write-layers](fsd-read-write-layers.md)의 이동 PR은 묶음 하나가 제 도메인의 파일만 만지는 것을 전제로 직렬로 돈다. 매퍼는 그 전제를 깬다 — `ScheduleDay`의 열 이름을 바꾸면 급여와 통계의 판정 함수가 같은 PR에서 바뀌어야 하고, 그러면 묶음 넷이 한 PR이 된다.

**필드 축으로 가르면 갈라진다.** 열 이름 하나를 고르면 그것을 읽는 자리가 저장소 전체에서 한 번에 바뀐다 — `work_date` → `workDate`는 치환 하나고 묶음 경계를 안 본다. 그래서 묶음 열이 전부 자리를 잡은 뒤 이 계획이 필드로 가른다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `entities/*/utils/<이름>.mapper.ts` | 신설 — DTO 하나를 도메인 모양으로 옮긴다 |
| `entities/*/model/<도메인>.type.ts` | 매퍼가 내는 도메인 모양을 든다 |
| `entities/*/api/*.api.ts` | 돌려주기 전에 매퍼를 부른다. 반환 타입이 DTO에서 도메인 타입으로 바뀐다 |
| `api/` 밖 파일 쉰여덟 | 필드 이름이 camelCase로 |
| 그 짝 테스트 | 단언의 열 이름이 같이 바뀐다 |
| `eslint-rules/dtoSegment.mjs` | `api/` 밖에서 `.dto.ts` import를 막는 규칙이 이 계획이 끝나야 켜진다 |

## 완료 조건

### AC-01 — 매퍼가 선다

- 전제: `.api.ts` 스물둘이 `.returns<DTO>()`로 생 행을 그대로 내보낸다
- 행동: DTO를 내보내는 `.api.ts`마다 짝 매퍼를 세워 도메인 모양으로 옮긴다. 반환 타입을 도메인 타입으로 바꾼다
- 관찰 결과: `.api.ts`의 반환 타입에 `.dto.ts`의 이름이 없다. 셋이 초록이다

### AC-02 — DB 열 이름이 `api` 밖에 없다

- 전제: 열 이름이 `api/` 밖 파일 쉰여덟에 닿는다
- 행동: 필드 축으로 가른다 — 열 이름 하나씩 치환하고 그 짝 테스트의 단언을 같이 고친다
- 관찰 결과: `api/`와 `supabase/` 밖에 snake_case 필드 접근이 없다. 셋이 초록이다
- `databaseTypes.ts`는 밖이다 — 생성물이라 DB 열 이름이 그 안에 사는 것이 맞다

### AC-03 — `dtoSegment` 규칙이 켜진다

- 전제: `api/` 밖에서 `.dto.ts`를 당기는 자리가 있어 규칙을 켤 수 없다
- 행동: AC-01·AC-02가 끝난 뒤 규칙을 켜고 `execution.md`의 「집행되는 규칙」 표에 행을 더한다
- 관찰 결과: `pnpm lint`가 0건이다

## 구현 순서

1. AC-01 — 슬라이스마다 매퍼를 세운다. 이 걸음에서는 매퍼가 꼴을 안 바꿔도 된다(항등 매퍼) — 자리를 먼저 세워 AC-02가 한 자리만 고치게 한다
2. AC-02 — 열 이름을 하나씩 고친다. 치환 하나가 저장소 전체를 지나므로 PR을 필드 묶음으로 가른다
3. AC-03 — 규칙을 켠다

## 리스크·전환·되돌리기

**테스트 단언이 바뀐다.** [ADR-002](../../2-design/adr/ADR-002-sdd-ddd-tdd.md)의 「`implementer`는 받은 테스트의 단언을 못 바꾼다」가 이 작업에는 안 걸린다 — 단언이 보는 업무 규칙은 그대로고 필드 이름만 바뀐다. 그 구분을 PR 본문이 밝힌다.

**되돌리기는 PR 단위다.** 필드 하나씩 가른 PR이라 어느 지점에서 멈춰도 저장소가 선다 — 고친 필드는 camelCase, 안 고친 필드는 snake_case로 섞여 있어도 타입이 맞는다.

## 검증 방법

- `pnpm lint` · `pnpm typecheck` · `pnpm test`
- `pnpm test:integration` — `.api.ts`의 반환 꼴이 바뀌므로 로컬 Supabase에 붙는 테스트가 그 꼴을 본다
- 열 이름 전수 검사 — `api/`와 `supabase/`와 `databaseTypes.ts` 밖에서 snake_case 필드 접근을 센다

## 여기서 안 하는 것

- **DTO 파일 세우기** — [fsd-read-write-layers](fsd-read-write-layers.md)의 이동 PR 열이 한다. 이 계획은 그것이 다 끝난 뒤 시작한다
- **DB 열 이름 바꾸기** — 마이그레이션은 안 건드린다. snake_case가 Postgres의 관례고 그것이 맞다
