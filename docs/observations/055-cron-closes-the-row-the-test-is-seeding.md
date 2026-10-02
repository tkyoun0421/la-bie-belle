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

## 둘째 자리가 하루 만에 왔다

같은 끼어듦이 다른 테스트에서 또 났다 — PR #504의 CI에서 `respondRequest.api.integration.test.ts`의 「거절하면 그 갈래만 declined고 남은 pending이 있으면 요청은 안 닫힌다」가 `DomainError: request_closed`로 넘어졌다. 그 PR은 `features/workRequest`를 한 줄도 안 건드렸고 바로 앞 실행은 613 전부 초록이었다.

씨 뿌리는 꼴이 글자까지 같았다 — 요청 행을 먼저 세우고 `await createApprovedUser()`를 **두 번** 부른 뒤 후보를 넣는다. 그 두 `await`가 창이다.

**한 자리를 고치면 다음 자리가 또 온다**는 것이 이걸로 드러났다. `seedWorkRequest`를 부르는 테스트 파일이 일곱이고 그중 넷이 뒤에서 사용자를 만든다.

## 기계가 대신할 수 있나

**됐다 — 되돌리는 자리를 씨 뿌리는 손으로 옮겼다.** `tests/integration/postgres.ts`의 `seedRequestCandidate`가 **안 지난 pending을 넣은 뒤 그 요청의 `closed_at`을 되돌린다.** 그 함수가 세우는 불변이 「안 지난 pending이 하나라도 있으면 그 요청은 닫힌 것이 아니다」고, `expire_requests()`가 닫는 조건이 바로 그 불변의 부정이라, 후보를 넣은 자리에서 되돌리면 **부르는 쪽이 순서를 신경 쓸 일이 없다.**

지난 후보를 넣을 때는 안 되돌린다 — 그때는 닫히는 것이 맞는 모습이고, 만료를 재는 테스트가 그 갈래를 본다. 가름은 `expiresAt`이 널이거나 앞으로인지다.

첫 자리에 손으로 넣었던 `reopenRequest`는 걷었다 — 공용 손이 같은 일을 해서 사본이 됐다.

[관찰 052](052-first-come-race-test-flakes.md)와 **다른 축이다.** 그쪽은 테스트가 일부러 만든 경쟁이 서버 함수에서 흔들린 것이고, 이쪽은 **서버가 혼자 도는 배치가 테스트의 전제를 밖에서 깬 것**이다. 자기 자리를 cron이 건드리는 테스트는 「씨를 다 뿌린 뒤 전제를 한 번 못 박는다」가 그 꼴이고, `expire_requests` 말고도 cron으로 도는 함수가 늘면 같은 자리가 또 생긴다.

**검사로는 안 세운다.** 「cron이 건드리는 표에 씨를 뿌리는 테스트」를 기계가 알아보려면 함수마다 어느 표를 건드리는지를 알아야 하고, 그 지도는 지금 없다. 대신 **씨 뿌리는 손이 제가 세우는 불변을 되돌리는 것**이 그 자리의 꼴이다 — cron으로 도는 함수가 늘면 그 함수가 보는 불변을 세우는 픽스처에 같은 줄이 선다.
