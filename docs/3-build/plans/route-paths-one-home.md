# 경로 글자가 한 집에 산다

경로가 아홉 집에 흩어져 있고 그중 다섯은 정본에 없다. 상수 한 집으로 모으고 타입이 그 상수를 가리키게 한다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 F다.** 제안서가 「다섯 집」이라 적었으나 전수로 세니 **아홉**이고, 축이 셋으로 갈린다.

**실물 라우트는 23개다.** `src/app/`의 `.tsx` 파일 이름이 URL이라([ADR-005](../../2-design/adr/ADR-005-sdlc-stage-folders-and-artifact-chain.md)의 예외 자리) 그것이 최종 정본이다 — `_catalog`와 `__test/session`은 개발용이라 뺀다.

### 축 1 — 경로 상수가 세 집에 흩어졌다

| 집 | 무엇 |
| --- | --- |
| `src/shared/consts/navigation.const.ts` | `*_PATH` 18개와 `ORIGIN_*` 둘. export 20개다 |
| `src/entities/qr/consts/qr.const.ts:1` | `CHECK_IN_PATH = "/check-in"` |
| `src/screens/retry/consts/retry.const.ts:1` | `RETRY_PATH = "/retry"` |

`/check-in`은 종이 QR에 실려 나가는 경로다. 그것이 정본 밖에 사는 것은 중복이 아니라 **어긋날 수 있는 계약**이다.

### 축 2 — 경로가 타입으로도 산다

| 자리 | 꼴 |
| --- | --- |
| `src/entities/session/model/session.type.ts:1` | `AuthDestination = "/login" \| "/pending" \| "/blocked" \| "/left" \| "/"` |
| `src/features/auth/model/auth.type.ts:3` | `EntryDecision = AuthDestination \| "/retry"` |

리터럴 유니온이라 **글자가 타입 자리에 박힌다.** 상수를 바꿔도 이 타입은 안 따라온다 — `typeof`로 가리키게 해야 한 자리가 된다.

### 축 3 — 리터럴을 본문에 박은 자리 넷

| 자리 | 무엇 |
| --- | --- |
| `src/entities/notification/model/destination.policy.ts` | 여섯 — `/schedule?date=`·`/schedule?month=`·`/admin/schedule?date=`·`/`·`/check-in`·`/admin/approvals` |
| `src/entities/session/model/resolveAuthDestination.policy.ts` | 다섯(`/login`·`/pending`·`/blocked`·`/left`·`/`)과 `GATE_PATHS` 배열의 넷 |
| `src/features/auth/lib/decideEntry.lib.ts:27` | `/retry` |
| `src/screens/notifications/consts/notifications.const.ts:1` | `BACK_BEARING_PREFIXES`의 둘 — `/admin/schedule`·`/admin/approvals` |

### 정본에 없는 경로가 다섯이다

| 경로 | 지금 어디 사나 |
| --- | --- |
| `/check-in` | `qr.const.ts`에 상수로, `destination.policy.ts`에 리터럴로 |
| `/retry` | `retry.const.ts`에 상수로, `auth.type.ts`와 `decideEntry.lib.ts`에 리터럴로 |
| `/schedule` | 어디에도 상수가 없다. `destination.policy.ts`의 템플릿 둘에만 |
| `/pending` | 어디에도 상수가 없다. `resolveAuthDestination.policy.ts`와 `session.type.ts`에만 |
| `/blocked` | 같다 |

## 왜 고치나

`router.push`에 맨 문자열을 넣은 자리는 0이고 템플릿 리터럴 일곱도 모두 상수를 끼운다 — **화면 쪽은 이미 규율이 섰다.** 남은 것은 상수 자체가 여러 집에 사는 것이고, 그래서 라우트 파일 이름을 바꾸면 무엇을 같이 고쳐야 하는지 한 자리에서 안 보인다.

`/check-in`은 종이에 인쇄돼 나간 뒤에는 못 바꾼다. 그 글자가 두 자리에 살면 한쪽만 고치는 날이 온다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `src/shared/consts/navigation.const.ts` | 빠진 다섯이 선다 — `/schedule`·`/check-in`·`/pending`·`/blocked`·`/retry`. 전부 `as const`다 |
| `src/entities/qr/consts/qr.const.ts` | `CHECK_IN_PATH`를 지운다. 당기는 자리가 정본에서 받는다 |
| `src/screens/retry/consts/retry.const.ts` | `RETRY_PATH`를 지운다. 파일에 남는 것이 없으면 파일도 지운다 |
| `src/entities/session/model/session.type.ts` | `AuthDestination`이 `typeof LOGIN_PATH \| …` 꼴로 상수를 가리킨다 |
| `src/features/auth/model/auth.type.ts` | `EntryDecision`의 `"/retry"`가 `typeof RETRY_PATH`가 된다 |
| 축 3의 네 자리 | 리터럴을 상수로 바꾼다. 템플릿은 `` `${WORKER_SCHEDULE_PATH}?date=${…}` `` 꼴이다 |
| `eslint-rules/noRoutePathLiteral.mjs` | 신설 — `src/app/` 밖에서 `"/…"` 꼴 경로 리터럴을 막는다. `navigation.const.ts`는 면제다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` · `tests/lint/rules.ts` · `docs/4-test/execution.md` | 규칙 하나를 켜는 다섯 자리의 나머지 넷 |

**규칙 3이 막지 않는다.** `shared`는 모든 층이 직접 당길 수 있어 `entities/session`과 `entities/notification`이 각자 `shared/consts`에서 받는다.

**규칙 「`consts` 밖에서 내보내는 대문자 스네이크 이름」이 자리를 정한다.** 경로 상수는 `consts` 세그먼트에만 설 수 있고 `shared/consts/navigation.const.ts`가 그 자리다.

## 완료 조건

- **AC-01** `src/shared/consts/navigation.const.ts`가 실물 라우트 23개에 닿는 경로 상수를 전부 든다. 빠진 다섯이 선다
- **AC-02** 경로 상수를 내보내는 파일이 `navigation.const.ts` 하나다. `qr.const.ts`와 `retry.const.ts`에 경로가 없다
- **AC-03** `AuthDestination`과 `EntryDecision`이 글자 대신 `typeof <상수>`를 든다. 상수를 고치면 타입이 따라온다
- **AC-04** 축 3의 네 자리가 상수를 당긴다. `src/app/` 밖 `.ts`·`.tsx`에 경로꼴 리터럴이 0이다
- **AC-05** `eslint-rules/noRoutePathLiteral.mjs`가 그것을 막고 규칙이 다섯 자리에 한 커밋으로 선다
- **AC-06** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 빠진 다섯을 `navigation.const.ts`에 세운다
2. 축 2의 타입 둘을 `typeof`로 돌린다. **여기서 깨지는 자리가 나온다** — 리터럴 유니온을 쓰던 곳이 좁은 타입을 못 받으면 보고한다
3. 축 3의 네 자리를 상수로 돌린다
4. `qr.const.ts`와 `retry.const.ts`의 경로를 지우고 당기던 자리를 정본으로 돌린다
5. lint 규칙을 다섯 자리에 한 커밋으로 켠다. **자리를 다 옮긴 뒤여야 초록이 난다**
6. 검증하고 PR을 연다

실패 테스트가 따로 서지 않는다 — 글자가 그대로고 사는 자리만 바뀌어 관찰 가능한 동작이 안 변한다. 그 불변은 기존 짝 테스트가 지키고, AC-01·02·04는 lint 규칙과 그 짝 테스트가 센다.

## 리스크

**축 2가 이 묶음에서 가장 위험하다.** `AuthDestination`은 `resolveAuthDestination`의 반환 타입이고 `resolveGateMove`가 그 값을 `pathname`과 비교한다. `typeof` 꼴로 바꾸면 값은 같지만 타입 추론이 달라질 수 있다 — `GATE_PATHS`가 `readonly string[]`이라 `includes`가 넓은 타입을 받는데, 상수를 쓰면 그 배열의 타입도 좁아진다.

**`/schedule`의 상수 이름을 정해야 한다.** `navigation.const.ts`에 이미 `ADMIN_SCHEDULE_PATH`가 있어 짝이 필요하다. 근무자 쪽이라 `WORKER_SCHEDULE_PATH`가 `WORKER_HOME_PATH`와 결이 맞는다.

**`BACK_BEARING_PREFIXES`는 경로가 아니라 접두사다.** 상수로 바꿔도 「어느 경로로 돌아가나」를 판정하는 목록이라는 성격은 남는다. 값만 상수에서 받고 목록 자체는 그 자리에 둔다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다. integration은 범위 밖이다 — `api/`를 안 건드린다. **e2e는 경로가 바뀌지 않음을 지키는 자리인데 기기 빌드가 없어 못 돌린다** — 경로 글자가 하나도 안 바뀌는 것이 AC라 `src/app/`의 파일 이름과 대조해 확인한다.
