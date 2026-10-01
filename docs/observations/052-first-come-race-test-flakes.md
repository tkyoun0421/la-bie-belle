---
status: open
target: src/features/workRequest/api/__tests__/
date: 2026-10-02
resolved:
---

# 선착순 테스트가 CI에서 한 번 흔들렸다

PR #493의 CI에서 integration 하나가 넘어졌다.

```
FAIL src/features/workRequest/api/__tests__/respondRequest.api.integration.test.ts
  ● 선착순 — 둘이 동시에 수락하면 하나만 통과하고 나머지는 slot_full
    Expected length: 1
    Received length: 0
```

`fulfilled`가 0이라 **둘 다 거절됐다.** 하나는 통과하고 하나는 `slot_full`을 받아야 하는 자리다.

그 PR이 이 파일에 한 일은 `DomainError`의 import 경로 한 줄이고, 재실행은 통과했다(612→613 전부 초록). 경쟁 자체가 흔들린 것이다.

## 무엇이 흔들렸나

테스트가 `Promise.allSettled`로 `respond_request`를 둘 동시에 부른다. 서버 함수가 자리를 잠그고 수를 세는데, 둘이 같은 행을 같은 순간에 집으면 Postgres가 한쪽을 직렬화 실패로 되돌릴 수 있다 — 그 되돌림은 `slot_full`이 아니라 다른 오류로 올라오고, 테스트는 양쪽을 `rejected`로 센다.

CI 기계가 로컬보다 느려 두 호출이 더 촘촘히 겹치는 것이 조건일 수 있다. main의 최근 CI 여덟 번은 전부 초록이라 흔들림은 이번이 처음 보인 것이다.

## 기계가 대신할 수 있나

**아직 모른다 — 한 번이다.** 되돌림이 어느 오류로 올라오는지 안 봤고, 함수가 `for update`로 잠그는지 수만 세는지도 안 봤다. 축 둘 중 하나다.

- 서버 함수가 경쟁을 덜 타게 — 자리 수 세기를 잠금 안으로 넣으면 둘째가 반드시 `slot_full`을 본다
- 테스트가 직렬화 실패를 `slot_full`과 같이 받게 — 그러면 단언이 무엇을 지키는지가 흐려진다

앞쪽이 맞는 축이지만 한 번 흔들린 것으로 서버 함수를 고치는 것은 이르다. **두 번째가 보이면 이 관찰을 근거로 연다.** 그때까지는 재실행이 값이 싸다.
