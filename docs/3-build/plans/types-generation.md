---
sources:
  - ../../2-design/system/data-access.md#생성-타입
  - ../../2-design/system/data-access.md#컬럼-이름-규칙
---

# 타입을 표에서 뽑고 그 뽑기가 안 밀리게 막는다

[data-access.md 「생성 타입」](../../2-design/system/data-access.md#생성-타입)이 「타입은 표에서 뽑는다」고 적어둔 지 오래인데 저장소에 생성 타입이 없다. 그 절이 한 절 안에서 자기를 부정한다 — 기본 계약은 「CI가 마이그레이션 뒤 다시 뽑아 diff가 0인지 본다」고 하고 구현 참조는 「아직 없음 — 지금은 `pnpm types`도 CI 검사도 없다」고 한다. `claimed-guards-audit`이 이것을 사실로 남기고 이 task에 넘겼다.

지금은 `createClient`가 아무 타입도 안 물어서 dal 스물이 스키마가 `any`인 클라이언트를 받는다. `from("없는표")`도 `rpc("없는함수")`도 `tsc`를 통과하고, 표를 바꿔도 아무것도 안 무는 상태다.

## 완료 조건

- **AC-01** `pnpm types`가 로컬 DB에서 타입을 뽑아 `src/shared/api/database-types.ts`에 쓴다. 스키마는 `public`과 `internal` 둘이다 — `internal`을 빼면 integration 테스트가 직접 부르는 함수들이 타입에 없다. 뽑은 뒤 prettier를 먹여서 저장소 포맷과 같은 꼴로 들어간다.
  - 검증 층: unit(`tests/lint/database-types.test.ts`)과 명령 실행
- **AC-02** 뽑기가 조용히 절반만 되는 경우를 스크립트가 직접 판정한다. 마이그레이션이 만든 표·뷰·함수를 생성물과 대조해 빠진 것이 있으면 이름을 찍고 종료 코드 1이다. 종료 코드만 보면 성공과 절반 성공이 구별되지 않는다.
  - 검증 층: unit
- **AC-03** 같은 대조가 `pnpm test`에서도 돈다. DB 없이 이름만 맞추니 Docker가 없는 자리에서도 문다 — 마이그레이션을 더하고 `pnpm types`를 안 돌린 PR이 여기서 걸린다.
  - 검증 층: unit
- **AC-04** CI가 마이그레이션을 올린 뒤 다시 뽑아 `git diff`가 비었는지 본다. 단계는 `pnpm test:integration:run` 다음이다 — 그 명령이 `supabase migration up`을 품는다. CLI 버전은 로컬과 같은 `2.75.0`을 박은 채로 둔다.
  - 검증 층: CI
- **AC-05** 클라이언트를 받는 자리가 전부 생성 타입을 물린 별명 하나를 쓴다. `src/shared/api/database.ts`의 `Db`가 그것이고, `SupabaseClient`를 직접 가져오는 파일이 그 하나 말고 또 있으면 `pnpm test`가 문다.
  - 검증 층: unit
- **AC-06** 함수 인자에 `null`을 넘기는 자리가 SQL 쪽 `default null`로 풀린다. 생성기는 인자의 nullable을 못 적어서(`pg_proc`에 그 정보가 없다) NULL을 받는 인자도 non-null로 낸다. `check_in`의 `p_lat`·`p_lng`·`p_qr_code`와 `decide_excuse`의 `p_reason`이 그 자리고, 기본값을 적으면 생성 타입이 선택 인자로 내서 호출자가 그 키를 빼고 부른다. DB에 가는 값은 같다 — PostgREST가 안 보낸 인자를 SQL 기본값으로 채운다.
  - 검증 층: integration(기존 단언 그대로 통과)
- **AC-07** 절차와 한계가 [data-access.md 「생성 타입」](../../2-design/system/data-access.md#생성-타입)과 [execution.md](../../4-test/execution.md#pnpm-types)에 들어간다. 자기부정하던 두 문장이 사라지고 구현 참조가 실제 파일을 가리킨다.
  - 검증 층: 문서 검사

## 범위 밖

- `dals`가 `.returns<T>()`로 적어둔 행 타입을 생성 타입에서 끌어오는 것. 지금은 손으로 적은 행 타입과 생성 타입이 나란히 산다. 별명이 서면 dal마다 `Database["public"]["Tables"][…]["Row"]`로 갈아탈 수 있지만 그것은 dal 스물의 시그니처를 건드리는 별 task다.
- 원격 프로젝트에 붙는 `supabase gen types --linked`. 배포 파이프라인이 EAS 설정과 같이 서는 자리다.
- `graphql_public` 스키마. 쓰지 않아서 `--schema`에서 뺐다.
