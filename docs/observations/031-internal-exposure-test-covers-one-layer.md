---
status: open
target: docs/2-design/system/data-access.md
date: 2026-09-29
resolved:
---

# `internal` 비노출 테스트가 세 겹 중 한 겹만 본다

## 일

`data-access.md`의 「함수 안의 규칙」이 `internal` 스키마에 세 겹을 요구한다 — `revoke all on schema internal`, `revoke all on all functions in schema internal`, `config.toml`의 노출 스키마 목록. 그리고 「그 셋이 뚫렸을 때 빨개지는 integration 테스트를 같이 낸다」고 적는다.

저장소에 선 그 테스트는 전부 같은 모양이다. 로그인한 클라이언트로 `rpc("<함수 이름>")`을 불러 오류가 나는 것을 본다. `import_holidays`가 먼저 그렇게 썼고 `expire_requests`가 따랐다.

**그 호출은 PostgREST 라우팅에서 멈춘다.** `internal`이 노출 목록에 없으니 PostgREST가 함수 이름 자체를 모르고, 요청이 Postgres까지 안 간다. `revoke` 두 줄을 통째로 지워도 테스트는 여전히 초록이다.

`profile-erasure`의 계획 단계에서 드러났다. 그 task의 AC-05가 「면제되는 쪽인데도 낸다 — 뚫렸을 때 사라지는 것이 개인정보라」로 방어를 강조한 자리라, 무엇을 실제로 막는지가 문제가 됐다.

## 볼 자리

값은 정본의 요구와 실물의 거리에 있다. 규칙이 세 겹을 말하는데 테스트가 한 겹만 보면, 다음 사람이 그 테스트를 근거로 「세 겹이 선다」고 읽는다.

grant 층까지 실제로 보려면 `authenticated` 역할로 직접 SQL을 여는 손이 필요하다. 저장소에 그 기법이 없다 — 지금 integration은 전부 슈퍼유저 psql이거나 PostgREST를 탄 클라이언트고, 그 사이가 비어 있다.

**같은 테스트가 구현 전에도 초록이다.** 대상 함수가 아직 없을 때 PostgREST가 내는 「함수 없음」과 다 만든 뒤의 「스키마를 몰라 못 찾음」이 클라이언트 쪽에서 구분이 안 된다. writer가 실패를 눈으로 보는 단계에서 이 한 줄만 통과해 버려, 막는 것이 정말 서 있는지는 구현 뒤에 다시 봐야 안다.

## 세 겹 중 하나는 아예 안 선다

구현 뒤 권한을 직접 재보니 더 큰 것이 나왔다.

```
anon          | schema_usage=f | fn_exec=t
authenticated | schema_usage=f | fn_exec=t
```

**`revoke all on all functions in schema internal from anon, authenticated`가 헛돈다.** 함수 EXECUTE는 기본으로 `PUBLIC`에 붙는데 그 줄이 `PUBLIC`에서 안 뺀다. 두 역할을 이름으로 지목해 빼봐야 `PUBLIC`을 타고 그대로 들어온다.

지금 실제로 막는 것은 둘이다 — PostgREST 라우팅과 **스키마 USAGE**. 새로 만든 스키마는 `create schema` 직후부터 `PUBLIC`에 USAGE가 없어 그 층이 저절로 섰다. 정본이 요구한 세 겹 중 「함수 revoke」 한 겹만 안 선 셈이고, 그 줄은 저장소의 `internal` 마이그레이션마다 복사돼 있다.

위험은 **USAGE를 여는 날**이다. 누가 `internal`에 클라이언트를 붙일 일이 생겨 USAGE를 열면 그 순간 모든 `internal` 함수가 같이 열린다 — 막고 있다고 적힌 줄이 안 막아서다.

고치는 길은 `revoke execute on all functions in schema internal from public`을 더하는 것이다. 방어를 줄이는 게 아니라 문서가 이미 요구한 겹을 실제로 세우는 일이라 **정본을 안 바꾸고 마이그레이션만 는다.** 저장소의 `internal` 마이그레이션 전부를 건드려 이 task의 범위 밖이고, backlog가 받는다.

## 원칙

테스트가 무엇을 안 보는지는 그 테스트를 쓸 때가 아니라 그 테스트를 근거로 삼을 때 드러난다. 여기서는 그 근거를 따지자 테스트가 아니라 **막는 줄 자체가 안 막고 있던 것**이 같이 나왔다.
