---
status: actioned
target: docs/2-design/system/data-access.md
date: 2026-09-29
resolved:
---

# 서비스 키로도 `internal`은 못 부른다

## 일

`payroll-holidays`의 Edge Function이 `internal.import_holidays`를 부르는 자리에서 막혔다. 구현자가 로컬에 직접 쏴서 확인했다.

```
POST /rest/v1/rpc/import_holidays  (Content-Profile: internal, service role 키)
→ 406 {"code":"PGRST106","message":"Invalid schema: internal",
       "hint":"Only the following schemas are exposed: public, graphql_public"}
```

PostgREST가 노출 목록 밖의 스키마를 **라우팅 단계에서** 끊는다. 키가 무엇이든 상관없다 — service role도 거기서 멈춘다.

정본 둘이 그 자리에서 부딪혔다. `payroll/design.md`의 「공휴일 넣기」는 「`import_holidays`는 `internal`이다. Edge Function이 서비스 키로 온다」고 적는데, **무엇을 통해 오는지**를 안 적었다. `data-access.md`는 노출 목록을 `internal`을 막는 겹 중 하나로 꼽는다. 둘 다 맞는데 합치면 길이 없다.

`profile-erasure`에는 이 문제가 없었다. 그 Edge Function은 DB 함수가 아니라 Admin API(`auth.admin.deleteUser`)를 부른다 — 서비스 키를 쥔 Edge Function이 **DB 함수를 부르는 첫 자리**가 여기였다.

## 볼 자리

길이 셋이었다.

`internal`을 노출 목록에 넣는 길 — 한 줄이 모든 `internal` 함수를 같이 연다. 신원을 인자로 받는 함수들이 그 안에 있어 그 순간 남의 이름으로 쓰는 구멍이 된다.

Edge Function이 `SUPABASE_DB_URL`로 Postgres에 직접 붙는 길 — 저장소에 선례가 없고 service role보다 강한 권한을 함수에 쥐여준다.

**`public` 껍데기를 세우는 길** — `data-access.md`가 이미 「`internal` 함수는 호출자 검사를 안 한다. 껍데기가 이미 했고」로 껍데기·알맹이 관례를 든다. 새 패턴이 아니라 그 관례를 서비스 키 쪽에 적용하는 것이다.

셋째로 갔다. 껍데기의 호출자 검사가 `auth.role() = 'service_role'`이다.

## 지은 것

`data-access.md`의 「서비스 키 자리」에 줄 하나를 박았다 — 서비스 키로도 `internal`은 못 부르고, Edge Function이 DB 함수를 부를 자리에는 `public` 껍데기를 세운다는 것. `internal` 노출은 안 간다는 판정도 같이 적었다.

**`send-push`가 다음에 같은 자리를 밟는다.** 알림 Edge Function이 `notifications.pushed_at`을 찍어야 하고, 그 쓰기가 `internal` 함수를 타면 똑같이 막힌다. 그 task가 이 줄을 먼저 읽게 된다.

## 원칙

「무엇을 쥔다」를 적고 「무엇을 통해 닿는다」를 안 적으면, 쥔 것이 닿지 않는 자리가 구현까지 가서야 드러난다.
