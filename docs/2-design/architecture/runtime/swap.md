# 교대

짝은 [domain/swap.md](../../domain/swap.md)다. 키는 [`schedule.md`](schedule.md)의 `['requests']`를 같이 쓴다 — 교대는 `requests`의 한 `kind`다. 무효화는 [`README.md`](README.md#무효화-표)에 있다.

## 전부 응답을 기다린다

교대 요청·수락·수락 취소·승인 전부 남에게 닿는다. 낙관적인 것이 없다.

## 승인 경쟁

관리자가 `approve_swap`을 누르는 사이 요청자가 근무 취소를 냈거나 다른 관리자가 강제 변경을 했으면 `stale`이다. 화면은 요청 카드를 「바뀜」으로 바꾸고 `['requests']`·`['schedule']`을 다시 읽는다.

## 갈래 만료

갈래마다 `expires_at`이 다르다. 받는 쪽 화면의 카운트다운은 자기 갈래 값이고, 요청자 화면은 가장 늦은 갈래까지 「기다리는 중」이다. 전부 만료되면 `expire_requests` cron이 요청을 닫고 알림이 온다 — 화면이 세지 않는다.
