---
status: actioned
target: src/entities/schedule/api/__tests__/expireRequests.api.integration.test.ts
date: 2026-10-03
resolved: 2026-10-03
---

# 매 분 도는 cron이 테스트가 씨 뿌리는 중인 행을 닫았다

PR #503의 CI에서 integration 하나가 넘어졌다.

```
FAIL src/entities/schedule/api/__tests__/expireRequests.api.integration.test.ts
  ● internal.expire_requests — 매 분 도는 만료 배치 › 안 지난 pending이 하나라도 남으면 안 닫힌다
    expect(received).toBeNull()
    Received: "2026-10-02T20:06:00.005741+00:00"
```

받은 값이 **분 경계에 5밀리초가 붙은 시각**이다. 그 PR은 `entities/schedule`을 한 줄도 안 건드렸고 재실행은 통과했다(613 전부 초록).

## 무엇이 흔들렸나

`internal.expire_requests()`는 테스트가 손으로 부르는 함수이기만 한 게 아니라 **`cron.schedule(…, '* * * * *')`로 매 분 혼자 돈다**(`supabase/migrations/20260927091506_schedule_requests.sql`). 함수의 조건은 「안 지난 pending 후보가 **없으면** 닫는다」다.

테스트의 씨 뿌리는 순서가 그 조건을 한동안 참으로 만들어 뒀다.

```ts
const requestId = seedWorkRequest(…);           // 요청 행이 선다 — 후보가 0이다
const expiredCandidate = await createApprovedUser();   // ← 이 사이에 분이 오면
const liveCandidate = await createApprovedUser();      // ← 요청이 닫힌다
seedRequestCandidate(…, pastIso(1));
seedRequestCandidate(…, futureIso(1));
```

사용자 둘을 만드는 몇 초 동안 그 요청에는 후보가 하나도 없다. cron이 그 창에 들어오면 조건이 참이라 `closed_at`이 박히고, 테스트가 재 보려던 전제(「안 지난 pending이 하나 남아 있다」)가 호출 전에 이미 깨져 있다.

실제로 닫히는 갈래를 보는 나머지 둘은 `not.toBeNull()`이라 cron이 먼저 닫아도 단언이 그대로 선다 — **같은 끼어듦이 한 테스트에서만 보이는 까닭이다.**

## 왜 아무것도 안 울었나

| 검사 | 왜 못 보나 |
| --- | --- |
| `pnpm test` | integration은 거기서 안 돈다 — 로컬 Supabase가 필요하다 |
| 로컬 `pnpm test:integration` | 창이 분에 한 번 열려 대개 안 겹친다. 느린 CI 기계에서 더 자주 겹친다 |
| 단언 자체 | 깨진 것은 단언이 아니라 **단언 앞의 전제**다. 실패 메시지가 「닫혔다」만 말하고 누가 닫았는지는 안 말한다 |

## 기계가 대신할 수 있나

**고쳤다.** 사용자 둘을 요청보다 먼저 만들어 창을 밀리초로 줄이고, 후보를 다 넣은 뒤 `closed_at`을 한 번 되돌린다 — 그 뒤로는 후보가 다 있어 cron이 다시 닫을 수 없다.

[관찰 052](052-first-come-race-test-flakes.md)와 **다른 축이다.** 그쪽은 테스트가 일부러 만든 경쟁이 서버 함수에서 흔들린 것이고, 이쪽은 **서버가 혼자 도는 배치가 테스트의 전제를 밖에서 깬 것**이다. 자기 자리를 cron이 건드리는 테스트는 「씨를 다 뿌린 뒤 전제를 한 번 못 박는다」가 그 꼴이고, `expire_requests` 말고도 cron으로 도는 함수가 늘면 같은 자리가 또 생긴다.

**검사로는 안 세운다.** 「cron이 건드리는 표에 씨를 뿌리는 테스트」를 기계가 알아보려면 함수마다 어느 표를 건드리는지를 알아야 하고, 그 지도는 지금 없다. 대신 이 관찰이 다음 사람이 같은 실패 메시지에서 찾을 자리다.
