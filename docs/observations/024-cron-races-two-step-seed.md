---
status: open
target: tests/integration/postgres.ts
date: 2026-09-28
---

# cron이 픽스처를 두 번에 나눠 심는 틈에 들어온다

## 일

`payroll-data`를 구현한 뒤 전체 integration을 세 번 돌렸더니, 요청 테스트가 **회차마다 다른 케이스로 하나씩** 걸렸다. 걸린 자리는 셋 다 「요청이 아직 안 닫혀 있어야 한다」를 보는 단언이고, 실제로는 닫혀 있었다. 급여 쪽 여덟 suite 예순셋은 세 번 다 초록이었다.

급여와 무관하다는 것을 둘로 확인했다. 마이그레이션 셋을 되돌려 돌리니 요청 테스트가 전부 초록이었고, `select cron.unschedule('expire-requests')` 뒤에 돌리니 「pg_cron에 `expire-requests`가 등록됐다」 하나만 걸리고 나머지 542개가 초록이었다.

원인은 픽스처가 쓰는 psql 호출 수다. `seedWorkRequest`가 `public.requests` 행을 넣고 `seedRequestCandidate`가 `public.request_candidates` 행을 넣는데, 둘이 **다른 `execSql` 호출**이라 그 사이 수백 ms 동안 요청에 살아 있는 갈래가 하나도 없다. `internal.expire_requests()`는 그 상태를 「아무도 안 남았다」로 읽고 요청을 닫는다 — 운영에서는 맞는 판정이다. pg_cron이 매 분 돌리니 틱이 그 틈에 떨어지면 테스트가 진다.

CI에서는 아직 안 걸렸다. 걸릴 조건이 「틱과 두 호출 사이가 겹친다」라 기계가 빠를수록 덜 걸리고, 그래서 로컬에서 먼저 나왔다.

## 볼 자리

고치는 쪽은 픽스처다. 요청과 첫 갈래가 한 psql 호출에 `begin`·`commit`으로 묶여 들어가면 틈이 사라진다. 함수를 고치는 길(유예를 둔다)도 있지만 운영 동작을 테스트 사정으로 바꾸는 것이라 안 고른다.

`backlog.md`에 `test-seed-transaction`으로 세웠다.

## 원칙

픽스처가 여러 번에 나눠 심으면 그 사이의 **중간 상태도 DB에 실재한다.** 배경에서 도는 것(cron·트리거)이 그 중간 상태를 보고 제 일을 하면, 테스트는 자기가 안 만든 이유로 진다 — 「한 사실을 세우는 데 호출이 몇 번인가」가 곧 경합 창의 크기다.
