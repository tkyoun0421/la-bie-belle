---
sources:
  - ../../2-design/modules/payroll/design.md#공휴일
  - ../../2-design/modules/payroll/design.md#공휴일-넣기
  - ../../2-design/modules/payroll/design.md#공휴일-받기
  - ../../2-design/modules/payroll/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/payroll/README.md#pay-023
  - ../../2-design/modules/payroll/README.md#pay-024
  - ../../2-design/modules/payroll/README.md#pay-027
  - ../../2-design/modules/account/design.md#비우기
  - ../../2-design/modules/notification/design.md#푸시-보내기
  - ../../2-design/system/data-access.md#서비스-키-자리
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/architecture.md#경계-하나
---

# 공휴일 받기를 만든다 — 구현 계획

## 입력 명세·기준

정본은 [payroll/design.md](../../2-design/modules/payroll/design.md#공휴일-받기)의 [공휴일 받기](../../2-design/modules/payroll/design.md#공휴일-받기)와 [행위 밖의 실행 동작](../../2-design/modules/payroll/design.md#행위-밖의-실행-동작)이다. 업무 규칙은 [PAY-023](../../2-design/modules/payroll/README.md#pay-023)이다.

pg_cron 작업 하나(`fetch-holidays`)와 Edge Function 하나(`import-holidays`), 그리고 그 함수가 부르는 파싱 순수 함수가 이 task의 산출이다. **표도 화면도 안 만든다** — `holidays`와 `import_holidays`는 [`payroll-data`](payroll-data.md#ac-05)가 이미 냈다.

선행이 둘이고 둘 다 끝났다. [`payroll-data`](payroll-data.md)가 받을 그릇을 냈고, [`edge-function-import`](edge-function-import.md)가 Edge Function이 `supabase/functions` 밖을 import할 수 있는지를 확인했다 — **못 한다**는 것이 그 답이다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **계기와 호출이 갈린다.** Postgres 함수가 외부 HTTP를 못 부른다. pg_cron이 조건을 보고 `pg_net`으로 Edge Function을 쏘면 그 함수가 공공 API를 부르고 결과를 `import_holidays`에 넘긴다
- **날마다 도는 것이 곧 재시도다.** 실패 큐가 없다. 실패하면 아무것도 안 넣고 다음 날 cron이 같은 조건을 다시 본다([PAY-023](../../2-design/modules/payroll/README.md#pay-023))
- **완료 표시가 데이터 자체다.** 「받아진 해가 있나」가 조건이고 받았다는 것을 적는 열이 없다. [`erase_profiles`](../../2-design/modules/account/design.md#비우기)가 `user_id`의 유무를 보는 것과 같은 꼴이다
- **한 해에 실제로 밖을 부르는 것은 한 번이다.** 그 한 번이 성공하면 이듬해까지 안 부른다. 날마다 도는 cron이 대부분의 날에 질의 하나만 하고 끝난다

서비스 키를 쥐는 자리가 이것으로 셋이 된다 — `send-push`와 `erase-account`에 `import-holidays`가 붙는다. 그중 `erase-account`는 이미 섰다([`profile-erasure`](profile-erasure.md#ac-03)). [서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리)가 아직 둘이라 적고 있어 **그 절을 셋으로 고치는 것도 이 task가 한다.**

## 완료 조건

### AC-01

**cron 작업 하나.**

`internal.fetch_holidays()` — pg_cron이 날마다 한 번 부른다.

- **다음 해 `api` 행이 하나라도 있으면 아무것도 안 한다.** 그 질의 하나로 끝나는 날이 한 해의 대부분이다
- 없으면 `pg_net`으로 Edge Function `import-holidays`를 쏜다. 응답을 안 기다린다 — 결과는 그 함수가 `import_holidays`로 넣는다
- **다음 해만 본다.** 올해가 비어 있는 것은 이 함수가 못 고친다 — 첫 배포 때 손으로 채우는 것이 [리스크](#리스크전환되돌리기)의 전환 항목이다. 올해에 `api` 행이 있고 다음 해가 비어 있으면 그날도 쏜다
- 주소와 서비스 키는 `vault`에서 읽는다. 항목 이름은 [AC-03](#ac-03)이 든다
- **쏘는 단계가 예외를 삼킨다.** `begin ... exception when others then raise warning ...; end`로 감싼다. vault 항목이 비면 `net.http_post`가 예외를 던지는데 그것이 밖으로 나가면 cron 작업이 날마다 실패로 남는다. `internal.erase_profiles`가 같은 손을 쓴다(`supabase/migrations/20260929091501_profile_erasure.sql`)
- **`internal` 스키마라 호출자 검사가 없다.** cron만 부른다. `security invoker`로 둔다 — `internal`에 걸린 의도된 예외다([함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙))
- **로컬 테스트가 vault 항목을 스스로 만든다.** 이름만 있고 값이 없으면 `net.http_post`가 아예 안 불려 쏘는 조건을 못 본다. 테스트가 `beforeAll`에서 `vault.create_secret`으로 로컬 전용 가짜 주소를 넣고 끝나며 지운다 — [`profile-erasure`](profile-erasure.md#ac-02)가 낸 길이다. `seed.sql`은 `supabase db reset`마다 도는 전역 상태라 안 쓴다

### AC-02

**Edge Function 하나.**

`supabase/functions/import-holidays/index.ts`

- 공공 API(한국천문연구원 특일 정보)를 부른다. **API 키는 Edge Function secret이다** — 저장소에 안 들어간다([공휴일 받기](../../2-design/modules/payroll/design.md#공휴일-받기))
- **호출자가 service role인지 먼저 본다.** 게이트웨이의 `verify_jwt`는 유효한 토큰인지만 봐서 anon 키도 통과한다. 안 막으면 인증된 클라이언트 아무나 이 주소를 되풀이해 불러 **우리 공공 API 쿼터를 태운다.** `supabase/functions/erase-account/index.ts`가 그 검사를 이미 하니 같은 손을 쓴다
- 받은 목록을 `{ holiday_date, name }` 배열로 바꿔 `import_holidays(p_year, p_rows)`에 넘긴다. 서비스 키로 부른다
- **부르는 것은 `public` 껍데기다.** 서비스 키로도 `internal`은 PostgREST가 라우팅을 안 해 `PGRST106`으로 막힌다([서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리)). 이 task가 `public.import_holidays(p_year, p_rows)`를 세우고 그 첫 줄이 `auth.role() = 'service_role'`을 본 뒤 `internal.import_holidays`를 부른다. 알맹이는 `payroll-data`가 낸 그대로 안 건드린다
- **같은 날짜가 두 번 들어가면 통째로 실패한다.** `internal.import_holidays`의 `insert ... on conflict do update`가 한 문장 안의 중복 행을 못 받는다(`ON CONFLICT DO UPDATE command cannot affect row a second time`). 열두 달을 합칠 때 `holiday_date`로 한 번 거른다 — 한 번 걸리면 그 해가 영영 안 들어온다
- **실패하면 아무것도 안 넣는다.** 부분 성공이 없다 — 한 해치를 통째로 넣거나 아무것도 안 넣는다. 열두 달 중 한 달이 실패해도 그 해를 안 넣고 다음 날 cron이 같은 조건을 다시 본다
- 응답이 비어 있으면 `import_holidays`를 안 부른다. [payroll-data AC-05](payroll-data.md#ac-05)가 빈 목록을 방어하지만 여기서도 안 보낸다
- 로그에 성공·실패와 넣은 건수를 남긴다. 사람이 안 보는 동작이라 로그가 유일한 창이다

#### 공공 API의 모양

엔드포인트는 `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo`다. 여섯 가지가 구현을 묶는다.

- **한 해를 한 번에 못 받는다.** `solYear`와 `solMonth`를 넘겨 **달마다 부른다 — 한 해에 열두 번이다.** `solMonth`는 1~9월이 `"01"`~`"09"` 꼴이다
- `_type=json`을 붙여야 JSON이 온다. `numOfRows`는 기본이 10이라 넉넉히 키운다
- 응답 봉투가 `response.body.items.item`이다
- 항목은 `{ dateKind, dateName, isHoliday, locdate, seq }` 꼴이고 **`locdate`가 문자열이 아니라 숫자다**(`20261003`)
- **`isHoliday`가 `"Y"`인 것만 공휴일이다.** 특일 정보에는 절기와 기념일도 섞여 오고 그것들은 `"N"`이다 — 안 거르면 쉬는 날이 아닌 날이 급여 계산에 든다
- **항목이 하나면 `item`이 배열이 아니라 객체 하나로 온다.** 공공데이터포털 계열의 알려진 동작이고 그 자리에서 파싱이 깨진 사례가 보고돼 있다
- **결과가 없으면 `items`가 빈 객체가 아니라 빈 문자열 `""`로 올 수 있다.** 같은 포털의 다른 API에서 확인된 패턴이다. 이 API 고유의 재현 사례는 못 찾았고 **확정이 아니라 방어다**

#### 파싱이 사는 자리

**파싱은 `src/`에 순수 함수로 산다.** `src/features/payroll/model/holiday-api-response.ts`가 둘을 낸다.

```ts
export function toIsoDate(rawDate: number | string): string;   // 20261003 → "2026-10-03"
export function parseHolidayApiResponse(body: unknown): { holiday_date: string; name: string }[];
```

`parseHolidayApiResponse`가 위 응답 모양을 전부 방어한다 — 봉투 중첩, 단일 객체, 빈 문자열 `items`, `isHoliday`가 `"Y"`가 아닌 항목 거르기. **모양이 어긋나면 빈 배열이다.** Edge Function은 이 함수를 부르고 그 위에서 판단을 안 한다.

**`supabase/functions/import-holidays/__tests__/`는 죽은 자리라 안 쓴다.** `tsconfig.json`이 `supabase/functions`를 `exclude`하고 Jest의 `testMatch`가 `src/**/__tests__/**`만 본다 — 거기 둔 테스트는 아무도 안 돌린다.

**`_shared/` 복사 단계는 이 task 밖이다.** Deno가 `supabase/functions` 밖을 못 읽어 `src/`의 함수를 복사해 넣는 단계가 따로 필요한데, [notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기)가 그 단계를 알림 task 몫으로 이미 지정했다. CI가 지금 edge-runtime을 아예 안 띄워(`.github/workflows/ci.yml`의 `supabase start -x ... edge-runtime`) **이 task의 검증은 그 단계 없이 선다** — 파싱은 Jest가 `src/`에서 직접 보고, 쏘는 쪽은 integration이 `pg_net` 호출까지만 본다.

### AC-03

**쏘는 자리의 설정.**

- `pg_net`과 `pg_cron` 확장이 선다. [`profile-erasure`](profile-erasure.md#ac-04)가 `pg_net`을, [`schedule-requests`](schedule-requests.md#ac-04)가 `pg_cron`을 이미 켰다 — 이 task는 `create extension if not exists`로 지난다
- Edge Function 주소와 서비스 키는 `vault`에 둔다. **항목 이름이 `import_holidays_url`과 `import_holidays_service_role_key`다** — `erase_account_url`·`erase_account_service_role_key`가 같은 꼴로 앞섰다. 마이그레이션에는 이름만 들어가고 값이 안 들어간다
- **한국 시각 새벽 3시에 하루 한 번이다.** crontab은 UTC로 읽혀 `0 18 * * *`다. `erase-profiles`가 새벽 4시(`0 19 * * *`)라 한 시간 앞에 둔다 — 둘이 같은 시각에 몰릴 이유가 없고 갈라두면 로그를 읽기 쉽다
- **작업 이름은 `fetch-holidays`다.** `cron.job`을 읽는 테스트가 그 이름으로 단언하고 `erase-profiles`·`expire-requests`가 같은 꼴로 앞섰다
- 등록하는 문장이 `internal.fetch_holidays()`를 부른다
- cron 등록이 마이그레이션에 든다. 로컬에서도 같은 줄이 돌아 `pnpm test:integration:run`이 작업의 존재를 본다
- `supabase/config.toml`에 `[functions.import-holidays]` 항목이 선다

## 변경 파일

| 파일 | 책임 |
| --- | --- |
| `supabase/migrations/<타임스탬프>_fetch_holidays.sql` | 확장, `internal.fetch_holidays`, `public.import_holidays` 껍데기, cron 등록 |
| `supabase/functions/import-holidays/index.ts` | 열두 달 호출, 파싱 함수 부르기, 껍데기에 넘기기, 호출자 검사 |
| `src/features/payroll/model/holiday-api-response.ts` | `toIsoDate`·`parseHolidayApiResponse` |
| `src/features/payroll/model/__tests__/holiday-api-response.test.ts` | 그 짝 |
| `src/entities/payroll/dals/__tests__/fetch-holidays.integration.test.ts` | cron 조건과 등록 |
| `supabase/config.toml` | `[functions.import-holidays]` |
| `.env.example` | secret 이름만 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`integration-test-writer` → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-03을 배정한다. unit은 파싱 하나고 나머지가 integration이다
2. `unit-test-writer`가 `toIsoDate`와 `parseHolidayApiResponse`를 쓴다. 정상 응답과 어긋난 넷(단일 객체, 빈 문자열 `items`, `isHoliday`가 `"N"`, 모양 자체가 다른 것)이 입력이다
3. `integration-test-writer`가 `fetch_holidays`의 조건 분기를 쓴다. 다음 해가 찼을 때, 비었을 때, 올해만 찼을 때, vault가 비었을 때 넷이다
4. `implementer`가 확장 → cron 함수 → 파싱 함수 → Edge Function 순으로 초록을 만든다
5. `pr-diff`가 diff를 본다 — **API 키나 서비스 키가 커밋에 든 줄이 없는지.** 공개 저장소라 이 확인이 이 task에서 가장 중요하다
6. 배포 뒤 첫 실행을 손으로 확인하고 결과를 [backlog.md](../../backlog.md)에 적는다

## 리스크·전환·되돌리기

- **시크릿이 저장소에 들어갈 위험이 이 task에서 가장 높다.** API 키와 서비스 키 둘을 다룬다. `.env`는 로컬만이고 pre-commit 훅이 패턴을 본다 — 그 위에 `pr-diff`가 한 겹 더 본다
- **응답 모양은 조사로 모은 것이고 우리 키로 직접 불러 본 것이 아니다.** 위에 적은 여섯 가지는 공개 문서와 남이 보고한 사례에서 나왔다. **실제 응답으로 한 번 확인하는 것은 배포 뒤 손 확인이다**
- **로컬에서 밖을 못 부른다.** integration은 `fetch_holidays`가 쏘는지까지만 보고 실제 API 응답은 안 본다. 파싱은 가짜 응답으로 unit이 본다
- **공공 API 응답 모양이 바뀌면 조용히 실패한다.** 사람이 안 보는 동작이라 실패가 알림으로 안 온다. 한 해가 비어 있는 것을 눈치채는 자리가 없다 — 1차에서는 로그가 전부고, 공휴일이 계산에 안 쓰여([PAY-024](../../2-design/modules/payroll/README.md#pay-024)) 비어 있어도 급여가 안 틀린다. 가산을 붙이는 날에 이 구멍을 먼저 닫는다
- **모양이 어긋나면 빈 배열이라 실패가 「0건」으로 보인다.** 파싱이 던지지 않고 빈 배열을 내니 Edge Function이 보는 것은 응답이 빈 것과 같다. 로그가 그 둘을 갈라 적어야 사람이 배포 뒤에 읽는다
- **올해 데이터를 이 함수가 못 채운다.** 다음 해만 본다. **첫 배포 전에 올해와 내년을 손으로 한 번 넣는 것이 전환 항목이다** — 함수를 직접 부르면 된다
- 되돌리기는 cron 등록을 지우는 마이그레이션이다 — `cron.unschedule`로 항목을 뺀다. Edge Function은 배포를 내린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 다음 해가 찼는데도 날마다 밖을 부른다 | integration `src/entities/payroll/dals/__tests__/fetch-holidays.integration.test.ts`(예정) | `pnpm test:integration:run`, 로컬 Supabase | 다음 해 `api` 행이 있으면 `net._http_response`의 최대 id가 안 는다 |
| AC-01 | 비었는데 안 쏜다 | integration 위 | 위와 같다 | 다음 해가 비면 그 id가 하나 는다 |
| AC-01 | 올해 행을 보고 다음 해를 안 본다 | integration 위 | 위와 같다 | 올해에 `api` 행이 있어도 다음 해가 비면 여전히 호출 1 |
| AC-01 | vault가 비어 cron 작업이 날마다 실패로 남는다 | integration 위 | 위와 같다 | 항목이 없어도 함수가 예외 없이 끝난다 |
| AC-03 | crontab 항목이 안 서거나 시각이 틀리다 | integration 위 — `cron.job`을 읽는다 | 위와 같다 | `fetch-holidays` 이름의 행이 하나고 스케줄이 `0 18 * * *` |
| AC-02 | 숫자 날짜를 잘못 읽는다 | unit `src/features/payroll/model/__tests__/holiday-api-response.test.ts`(예정) | `pnpm test` | `toIsoDate(20261003)`이 `"2026-10-03"` |
| AC-02 | 항목이 하나일 때 파싱이 깨진다 | unit 위 | `pnpm test` | `item`이 객체 하나로 와도 한 건으로 읽는다 |
| AC-02 | 빈 결과가 예외로 튄다 | unit 위 | `pnpm test` | `items`가 빈 문자열이면 빈 배열 |
| AC-02 | 공휴일이 아닌 날이 급여 계산에 든다 | unit 위 | `pnpm test` | `isHoliday`가 `"N"`인 항목이 빠진다 |
| AC-02 | 정상 응답을 옮기다 값이 어긋난다 | unit 위 | `pnpm test` | `{ holiday_date, name }[]`로 정확히 옮겨진다 |
| AC-02 | 껍데기를 아무나 불러 그 해 공휴일을 갈아엎는다 | integration `src/entities/payroll/dals/__tests__/fetch-holidays.integration.test.ts` | `pnpm test:integration:run` | 로그인한 클라이언트의 `rpc("import_holidays")`가 거절된다 |
| AC-03 | 키가 커밋에 든다 | 수동 — `pr-diff`가 diff 전문을 본다 | — | API 키와 서비스 키 문자열이 어느 파일에도 없다 |
| AC-01 | 첫 실행이 안 돈다 | 수동 — 배포 뒤 다음 해 행을 본다 | 운영 | 새벽 한 번 뒤 그 해 `api` 행이 선다 |

- 배정하지 않은 것
  - `import_holidays`의 `internal` 노출 — [`payroll-data`](payroll-data.md#ac-05)의 테스트가 이미 본다
  - 진짜 공공 API 호출 — 로컬에서 밖을 못 부른다
  - Edge Function이 실제로 도는 것 — CI가 edge-runtime을 안 띄운다
- 막힌 것: 지금은 없다

## 범위 밖

- `holidays` 표와 `import_holidays`·`set_holiday` 함수 — [`payroll-data`](payroll-data.md#ac-05)
- `src/`를 `supabase/functions/_shared/`로 옮기는 복사 단계 — [notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기)가 알림 task 몫으로 정했다
- 날 상세의 임시공휴일 스위치 — [`payroll-adjust`](payroll-adjust.md)
- 공휴일 가산 계산 — [PAY-024](../../2-design/modules/payroll/README.md#pay-024)가 1차 밖으로 뺐다
- 받기 실패를 사람에게 알리는 길 — 위 리스크에 적었다. 1차 밖이다
- 알림 쪽 Edge Function `send-push` — 알림 영역
