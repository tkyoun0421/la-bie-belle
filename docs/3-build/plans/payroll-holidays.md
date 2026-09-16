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

pg_cron 작업 하나(`fetch_holidays`)와 Edge Function 하나(`import-holidays`)가 이 task의 산출이다. **표도 화면도 안 만든다** — `holidays`와 `import_holidays`는 [`payroll-data`](payroll-data.md#ac-05)가 이미 냈다.

선행이 둘이다. [`payroll-data`](payroll-data.md)가 받을 그릇을 냈고, [`edge-function-import`](edge-function-import.md)가 Edge Function이 `supabase/functions` 밖을 import할 수 있는지를 확인했다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **계기와 호출이 갈린다.** Postgres 함수가 외부 HTTP를 못 부른다. pg_cron이 조건을 보고 `pg_net`으로 Edge Function을 쏘면 그 함수가 공공 API를 부르고 결과를 `import_holidays`에 넘긴다
- **날마다 도는 것이 곧 재시도다.** 실패 큐가 없다. 실패하면 아무것도 안 넣고 다음 날 cron이 같은 조건을 다시 본다([PAY-023](../../2-design/modules/payroll/README.md#pay-023))
- **완료 표시가 데이터 자체다.** 「받아진 해가 있나」가 조건이고 받았다는 것을 적는 열이 없다. [`erase_profiles`](../../2-design/modules/account/design.md#비우기)가 `user_id`의 유무를 보는 것과 같은 꼴이다
- **한 해에 실제로 밖을 부르는 것은 한 번이다.** 그 한 번이 성공하면 이듬해까지 안 부른다. 날마다 도는 cron이 대부분의 날에 질의 하나만 하고 끝난다

`send-push`가 서비스 키를 쓰는 첫 자리고 이것이 둘째다([서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리)).

## 완료 조건

### AC-01

**cron 작업 하나.**

`fetch_holidays()` — `internal` 스키마다. pg_cron이 날마다 한 번 부른다.

- **다음 해 `api` 행이 하나라도 있으면 아무것도 안 한다.** 그 질의 하나로 끝나는 날이 한 해의 대부분이다
- 없으면 `pg_net`으로 Edge Function `import-holidays`를 쏜다. 응답을 안 기다린다 — 결과는 그 함수가 `import_holidays`로 넣는다
- **다음 해만 본다.** 올해가 비어 있는 것은 이 함수가 못 고친다 — 첫 배포 때 손으로 채우는 것이 [리스크](#리스크전환되돌리기)의 전환 항목이다
- 도는 시각은 새벽이다. 사람이 안 쓰는 시간에 밖을 부른다

### AC-02

**Edge Function 하나.**

`supabase/functions/import-holidays/index.ts`

- 공공 API(한국천문연구원 특일 정보)를 부른다. **API 키는 Edge Function secret이다** — 저장소에 안 들어간다([공휴일 받기](../../2-design/modules/payroll/design.md#공휴일-받기))
- 받은 목록을 `{ holiday_date, name }` 배열로 바꿔 `import_holidays(p_year, p_rows)`에 넘긴다. 서비스 키로 부른다
- **실패하면 아무것도 안 넣는다.** 부분 성공이 없다 — 한 해치를 통째로 넣거나 아무것도 안 넣는다
- 응답이 비어 있으면 `import_holidays`를 안 부른다. [payroll-data AC-05](payroll-data.md#ac-05)가 빈 목록을 방어하지만 여기서도 안 보낸다
- 로그에 성공·실패와 넣은 건수를 남긴다. 사람이 안 보는 동작이라 로그가 유일한 창이다

### AC-03

**쏘는 자리의 설정.**

- `pg_net`과 `pg_cron` 확장이 선다. [`profile-erasure`](../../backlog.md)와 알림이 같은 둘을 쓴다 — **먼저 선 쪽이 만들고 뒤는 `create extension if not exists`다**
- Edge Function 주소와 서비스 키는 `vault`에 둔다. 마이그레이션에 값이 안 들어간다
- cron 등록이 마이그레이션에 든다. 로컬에서도 같은 줄이 돌아 `pnpm test:integration:run`이 작업의 존재를 본다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_fetch_holidays.sql` | `internal.fetch_holidays`, cron 등록, 확장 | AC-01·AC-03 |
| `supabase/functions/import-holidays/index.ts` | 공공 API 호출과 `import_holidays` 넘기기 | AC-02 |
| `supabase/functions/import-holidays/__tests__/` | 응답 파싱과 빈 응답 | AC-02 |
| `.env.example` | secret 이름만 (값은 없다) | AC-03 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `integration-test-writer` → `implementer` → `pr-diff`. [`payroll-data`](payroll-data.md)와 [`edge-function-import`](edge-function-import.md)가 둘 다 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-03을 배정한다. **unit이 거의 없다** — 파싱 하나뿐이고 나머지는 integration이다
2. `integration-test-writer`가 `fetch_holidays`의 조건 분기를 쓴다. 다음 해가 찼을 때와 비었을 때다
3. `implementer`가 확장 → cron 함수 → Edge Function 순으로 초록을 만든다
4. `pr-diff`가 diff를 본다 — **API 키나 서비스 키가 커밋에 든 줄이 없는지.** 공개 저장소라 이 확인이 이 task에서 가장 중요하다
5. 배포 뒤 첫 실행을 손으로 확인하고 결과를 backlog에 적는다

## 리스크·전환·되돌리기

- **시크릿이 저장소에 들어갈 위험이 이 task에서 가장 높다.** API 키와 서비스 키 둘을 다룬다. `.env`는 로컬만이고 pre-commit 훅이 패턴을 본다 — 그 위에 `pr-diff`가 한 겹 더 본다
- **로컬에서 밖을 못 부른다.** integration은 `fetch_holidays`가 쏘는지까지만 보고 실제 API 응답은 안 본다. Edge Function 쪽은 응답을 가짜로 넣어 파싱만 본다 — **진짜 응답으로 한 번 도는 것은 배포 뒤 손 확인이다**
- **공공 API 응답 모양이 바뀌면 조용히 실패한다.** 사람이 안 보는 동작이라 실패가 알림으로 안 온다. 한 해가 비어 있는 것을 눈치채는 자리가 없다 — 1차에서는 로그가 전부고, 공휴일이 계산에 안 쓰여([PAY-024](../../2-design/modules/payroll/README.md#pay-024)) 비어 있어도 급여가 안 틀린다. 가산을 붙이는 날에 이 구멍을 먼저 닫는다
- **올해 데이터를 이 함수가 못 채운다.** 다음 해만 본다. **첫 배포 전에 올해와 내년을 손으로 한 번 넣는 것이 전환 항목이다** — 함수를 직접 부르면 된다
- 되돌리기는 cron 등록을 지우는 마이그레이션이다. Edge Function은 배포를 내린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 다음 해가 찼는데도 날마다 밖을 부른다 | integration `tests/integration/holidays-cron.test.ts`(예정) | `pnpm test:integration:run` | 행이 있으면 `pg_net` 호출이 0 |
| AC-01 | 비었는데 안 쏜다 | integration 위 | 위와 같다 | 행이 없으면 호출이 1 |
| AC-02 | 빈 응답이 그 해를 비운다 | unit `supabase/functions/import-holidays/__tests__/`(예정) | `pnpm test` | 빈 배열이면 `import_holidays`를 안 부른다 |
| AC-02 | 응답 파싱이 날짜를 잘못 읽는다 | unit 위 | `pnpm test` | `20261003`이 `2026-10-03`이 된다 |
| AC-03 | 키가 커밋에 든다 | 수동 — `pr-diff`가 diff 전문을 본다 | — | 키 문자열이 어느 파일에도 없다 |
| AC-01 | 첫 실행이 안 돈다 | 수동 — 배포 뒤 다음 해 행을 본다 | 운영 | 새벽 한 번 뒤 그 해 `api` 행이 선다 |

- 배정하지 않은 것: 진짜 공공 API 응답으로 한 해를 받는 것 — 로컬에서 밖을 안 불러 배포 뒤 손으로 본다
- 막힌 것: 지금은 없다. [`edge-function-import`](edge-function-import.md)가 열려 있으면 이 task가 못 선다

## 범위 밖

- `holidays` 표와 `import_holidays`·`set_holiday` 함수 — [`payroll-data`](payroll-data.md#ac-05)
- 날 상세의 임시공휴일 스위치 — [`payroll-adjust`](../../backlog.md)
- 공휴일 가산 계산 — [PAY-024](../../2-design/modules/payroll/README.md#pay-024)가 1차 밖으로 뺐다
- 받기 실패를 사람에게 알리는 길 — 위 리스크에 적었다. 1차 밖이다
- 알림 쪽 Edge Function `send-push` — 알림 영역
