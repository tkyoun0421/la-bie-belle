# DB 열 이름을 `api` 안에서 끝낸다

`.dto.ts`가 선 뒤에도 그 꼴이 화면까지 그대로 닿는다. 매퍼를 세워 `api`를 떠나는 값이 도메인 모양이 되게 하고, 그 뒤로는 `work_date`가 `api` 밖에 없게 한다.

## 입력 명세·기준

**정본은 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 「파일 이름」이다** — `[domain].dto.ts`가 통신이 주고받는 꼴을, `<이름>.mapper.ts`가 꼴 바꾸기를 든다. [fsd-read-write-layers](fsd-read-write-layers.md)의 AC-06나가 「`.api.ts`가 돌려주기 전에 `utils/`의 `.mapper.ts`를 불러 도메인 모양으로 바꾼다」를 적고, 이 계획이 그 뒷겹을 든다.

**저장소에서 확인한 것.**

- DB 열 이름이 `api/` 밖 **파일 일흔**에 닿는다. `profile_id` 259회 · `work_date` 225회 · `ended_at` 128회 · `display_name` 119회 · `starts_at`·`ends_at` 각 93회가 그 밖에서 읽힌다
- **`.dto.ts`를 직접 당기는 자리가 쉰셋이다.** 그 가운데 `services/`가 절반이고 나머지는 `screens`와 `features`의 `utils`·`model`이다
- **DTO를 안 당기면서 그 꼴을 베낀 파일이 서른다섯이다.** `{ starts_at: string | null; ends_at: string | null; count: number | null }` 꼴을 자기 타입으로 선언해 구조로 맞춘다. **`.dto.ts` import를 막는 검사는 이 자리를 못 본다** — 경계가 서려면 「`api/` 밖에 snake_case 필드가 없다」를 재야 한다
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

- 전제: `api/` 밖에서 `.dto.ts`를 당기는 자리가 쉰셋이라 규칙을 켤 수 없다
- 행동: AC-01·AC-02가 끝난 뒤 규칙을 켜고 `execution.md`의 「집행되는 규칙」 표에 행을 더한다
- 관찰 결과: `pnpm lint`가 0건이다

### AC-04 — `api/` 밖에 snake_case 필드가 없다를 검사가 잰다

- 전제: AC-03의 규칙은 **import만 본다.** DTO를 안 당기고 그 꼴을 베낀 파일이 서른다섯이라, 규칙을 켜도 그 자리는 그대로 남는다
- 행동: `api/` 밖에서 snake_case 속성 이름을 **타입으로 선언하는 것**을 막는 검사를 세운다. 읽는 자리는 재지 않는다 — 타입이 camelCase면 그것을 snake로 읽는 자리를 `pnpm typecheck`가 잡고, 읽기까지 재면 DB가 **든 값**을 키로 쓰는 표(`Record<NotificationKind, X>`의 `signup_approved` 꼴)와 객체 리터럴의 키가 같이 걸려 거짓이 열 배가 된다
- 면제 넷: `api/`(DB가 주는 꼴이 사는 자리) · `databaseTypes.ts`(생성물) · `<이름>.mapper.ts`(꼴을 바꾸는 유일한 손이라 양쪽을 다 본다) · `src/app/`(URL과 쿼리 파라미터의 이름은 밖에서 온다 — Supabase auth의 `access_token`이 그 자리다)
- 관찰 결과: AC-02의 전수 검사가 기계의 눈이 된다. `pnpm lint`가 0건이다

## 구현 순서

**도메인 축으로 가른다.** 「필드 축으로 가른다」가 앞선 판정이었고 그 까닭이 「DTO 하나가 묶음 넷에 걸쳐 도메인 축으로는 못 가른다」였는데, 그 제약은 [fsd-read-write-layers](fsd-read-write-layers.md)의 이동 PR 열이 직렬로 도는 동안의 것이었다. 그 열이 끝나 제약이 사라졌고, 도메인 축이 **매퍼 하나를 한 번에 완성한다** — 필드 축은 매퍼가 필드 절반만 옮기는 중간 상태를 PR마다 남기고 도메인 타입이 `{ work_date: string; endsAt: string | null }` 꼴로 선다.

섞인 파일은 두 꼴을 든다. 「되돌리기」가 든 그 상태가 도메인 축에도 그대로 선다 — 끝난 도메인의 필드는 camelCase, 안 끝난 도메인의 필드는 snake_case고 타입이 맞는다.

1. AC-01 — 도메인마다 매퍼를 세우고 그 도메인의 필드를 한 번에 옮긴다. 본보기 하나를 직렬로 세워 꼴을 박고 나머지를 병렬로 돈다
2. AC-02 — 도메인 열하나가 다 돌면 찬다
3. AC-03 — import 규칙을 켠다
4. AC-04 — 꼴을 베끼는 길을 막는 검사를 세운다

## 리스크·전환·되돌리기

**테스트 단언이 바뀐다.** [ADR-002](../../2-design/adr/ADR-002-sdd-ddd-tdd.md)의 「`implementer`는 받은 테스트의 단언을 못 바꾼다」가 이 작업에는 안 걸린다 — 단언이 보는 업무 규칙은 그대로고 필드 이름만 바뀐다. 그 구분을 PR 본문이 밝힌다.

**되돌리기는 PR 단위다.** 도메인 하나씩 가른 PR이라 어느 지점에서 멈춰도 저장소가 선다 — 끝난 도메인의 필드는 camelCase, 안 끝난 도메인의 필드는 snake_case로 한 파일에 섞여 있어도 타입이 맞는다.

**같은 꼴인데 못 접는 자리가 셋이다.** 도메인 축으로 돌면서 드러났다.

- `payroll.dto.ts`와 `attendance.dto.ts`의 `ExcuseStatusRow`가 같은 `excuse_status` 뷰를 글자까지 같은 다섯 필드로 받는다. 접으려면 `entities` 하나가 다른 `entities`를 당겨야 하고 그 길은 `no-cross-slice-import`가 막는다. 같은 벽이 `session/model/resolveAuthDestination.policy.ts`의 `ProfileStanding`과 `profile` 도메인 사이에도 선다
- `features/holiday/model/holiday.schema.ts`의 `HolidayRow`가 `payroll`의 것과 이름·필드가 겹치지만 베낀 대상이 다르다 — 외부 공휴일 API 응답을 DB에 **쓰는** 길이라 읽기 DTO와 축이 다르다
- `features/hallDefaults/api/setHallDefaults.api.ts`의 `HallDefaultsInput`이 `HallDefaults`와 필드가 같아졌지만 그것이 베낀 것은 열 이름이 아니라 `set_hall_defaults` RPC의 인자 이름이다

**열 이름이 아닌 snake_case가 둘 있다.** 알림 `payload`의 jsonb 키(`work_date`·`start_at`·`actor_name`)는 DB 트리거가 그 이름으로 쓰는 **내용**이고, `Record<NotificationKind, X>` 표의 키(`signup_approved` 꼴)는 DB가 든 **값**이다. 둘 다 마이그레이션 없이는 못 바꾸고 AC-04의 검사도 안 본다 — 타입 선언만 재기 때문이다.

**전역 치환이 다른 도메인 필드를 먹는다.** `starts_at`·`ends_at`·`work_date`·`profile_id`는 도메인 여럿의 DTO에 같은 이름으로 산다. 본보기를 돌면서 그 사고가 났다 — 한 도메인을 고치려고 넓게 치환해 `ScheduleDay`에서 온 필드까지 바꿨고 되돌리는 데 더 걸렸다. 타입 이름으로 자리를 확인하고 좁혀서 고친다.

## 검증 방법

- `pnpm lint` · `pnpm typecheck` · `pnpm test`
- `pnpm test:integration` — `.api.ts`의 반환 꼴이 바뀌므로 로컬 Supabase에 붙는 테스트가 그 꼴을 본다
- 열 이름 전수 검사 — `api/`와 `supabase/`와 `databaseTypes.ts` 밖에서 snake_case 필드 접근을 센다

## 여기서 안 하는 것

- **DTO 파일 세우기** — [fsd-read-write-layers](fsd-read-write-layers.md)의 이동 PR 열이 한다. 이 계획은 그것이 다 끝난 뒤 시작한다
- **DB 열 이름 바꾸기** — 마이그레이션은 안 건드린다. snake_case가 Postgres의 관례고 그것이 맞다
- **이름만 바꾸는 매퍼 여섯의 짝 테스트** — 열하나 중 중첩을 펴는 다섯(`workRequest`·`schedule`·`member`·`rehearsal`·`availability`)에는 테스트가 섰다. 거기서는 `row.slots.days.starts_at`을 `endsAt`에 넣어도 둘 다 `string`이라 컴파일이 통과해, 같은 타입 필드를 바꿔치기한 실수를 잡는 눈이 테스트뿐이다. 남은 여섯은 이름만 바꿔 `pnpm typecheck`가 누락과 오타를 다 잡고 그 위의 단언은 타입을 두 번 적는 것이 된다 — `toMonthWindow`의 기존 테스트가 그 증거다. TDD 훅이 `src/entities/`를 볼지와 함께 판정할 자리다
- **이름이 거짓이 된 service 고치기** — `useMyProfileRowQuery`가 `Profile`을 돌려주면서 이름에 `Row`를 든다. 당기는 자리가 아홉이라 따로 떼낸다
