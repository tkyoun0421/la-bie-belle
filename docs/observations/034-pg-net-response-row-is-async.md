---
status: open
target: .claude/agents/integration-test-writer.md
date: 2026-09-29
resolved:
---

# pg_net 응답 행을 바로 세면 안 온 것을 0으로 읽는다

## 일

`profile-erasure`와 `payroll-holidays`의 통합 테스트가 「쏘았는가」를 `net._http_response`의 행 수로 셌다. 로컬에서 두 번 다 초록이었는데 CI에서 두 파일이 같은 자리에서 깨졌다.

```
Expected: 1
Received: 0
```

`net.http_post`는 `net.http_request_queue`에 요청 행만 그 자리에서 넣는다. 응답 행은 백그라운드 워커가 나중에 쓴다. 함수가 돌아온 직후에 응답 표를 세면 아직 아무것도 없다. 로컬은 워커가 먼저 닿는 쪽으로 기울었고 CI는 반대로 기울었다 — 어느 쪽도 보장이 아니다.

`erase-profiles` 테스트 하나는 CI를 두 번 탔는데도 한 번만 깨졌다. 경쟁이라는 증거다.

## 지은 것

두 파일의 헬퍼를 요청 시퀀스 쪽으로 옮겼다.

```sql
select case when is_called then last_value else 0 end
from net.http_request_queue_id_seq;
```

`net.http_post`가 이 시퀀스를 동기로 당기니 부르기 전후의 차가 쏜 횟수다. 단언 값(`0`·`1`)은 그대로 두고 세는 법만 바꿨다. 응답 표를 안 보게 되면서 워커가 얼마나 빨리 도는지와 무관해졌다.

`_http_response`가 아니라 큐를 세는 쪽이 「쏘았는가」에도 더 맞는다 — 우리가 확인하려는 것은 함수가 요청을 걸었는지지 상대가 답했는지가 아니다.

## 볼 자리

`send-push`가 다음에 같은 자리를 밟는다. 알림 Edge Function도 pg_net으로 가고, 그 테스트도 「쏘았는가」를 세게 된다.

카운터가 둘째로 오르면 `integration-test-writer` 정의문에 「pg_net은 시퀀스로 센다」를 박는다. 지금은 한 번이라 관찰로 둔다.

## 원칙

비동기 워커가 쓰는 표를 세지 말고, 부르는 쪽이 동기로 남기는 자국을 센다.
