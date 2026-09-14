# 알림

짝은 [domain/notification.md](../../domain/notification.md)다. 표는 `notifications`·`push_subscriptions` 둘이다.

## 알림 행

`notifications(profile_id, kind, subject_id, payload, created_at, read_at, claimed_at, push_attempts, pushed_at)`. 지워지지 않고 `read_at`만 찍힌다. 본인 행만 읽는다. 문안은 저장하지 않는다 — `kind`와 `payload`를 받아 화면이 `writing.md`대로 그린다.

`claimed_at`은 푸시를 잡은 시각, `pushed_at`은 성공한 시각이다. 둘이 다른 이유와 재시도는 [`../api/notification.md`](../api/notification.md)에 있다.

## 누가 넣나

**사건 알림은 같은 함수 트랜잭션 안에서 insert한다.** `approve_swap()`이 배정을 바꾸고 같은 함수 안에서 `notifications` 행을 넣는다 — 배정은 바뀌었는데 알림이 없는 상태가 안 생긴다. 「자기 행동은 안 알린다」·「전부 끝나면 한 번」 같은 묶기 규칙이 함수 안에 산다.

**시각 알림은 pg_cron이 insert한다.** 전날 저녁 9시 미리알림, 시작 10분 전, 예식 3일 전 빈자리 재촉이 여기다. 매 분 돌며 조건에 맞는 행을 넣는다. 「이미 보냈나」는 cron이 넣는 kind에만 `(profile_id, kind, subject_id)` unique로 막는다 — 사건 알림은 트랜잭션이 이미 중복을 막는다.

## 기기 구독

`push_subscriptions(profile_id, endpoint, keys, created_at) unique(endpoint)`. 기기마다 하나라 한 사람에 여럿이다. 본인 행만 읽고, 410이 오면 발송 함수가 지운다.

## 아직 안 정한 것

- 알림 끄기와 홈 화면 추가 여부를 어디 두나. `push_subscriptions` 없음만으로는 「안드로이드 안 켬」과 「아이폰 홈 추가 안 함」을 못 가른다
- 알림 하나에 기기 구독이 둘일 때 — `pushed_at`이 행에 하나라 한 기기만 성공한 것을 못 나타낸다. 서른 명 규모에서 드물어 두고 본다
