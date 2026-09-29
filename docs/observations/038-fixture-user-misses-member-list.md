---
status: open
target: tests/integration/postgres.ts
date: 2026-09-29
resolved:
---

# 픽스처가 만든 사람이 직원 목록에 안 잡힌다

## 일

`notification-settings`의 integration 작성자가 `listActiveMembers`를 부르는 테스트를 쓰다 빈 결과를 받았다. 사람은 만들어져 있었다.

`tests/integration/postgres.ts`의 `createApprovedUser`·`createLeftUser`가 `submit_profile`을 안 거쳐 `submitted_at`을 널로 남긴다. `listActiveMembers`·`listLeftMembers`는 `.not("submitted_at", "is", null)`을 걸어 그 사람을 아예 안 낸다. 작성자가 로컬 헬퍼로 `submitted_at`을 채워 우회하고 그 사실을 보고에 적었다.

## 값

픽스처가 만드는 사람은 승인까지 간 사람인데 화면이 읽는 조건을 하나 안 채운다. 두 DAL을 integration으로 보는 다음 task도 같은 자리에서 멈추고, 멈춘 사람이 매번 제 우회를 만든다.

## 제안

픽스처가 `submitted_at`을 같이 채우거나, 채우는 헬퍼를 `postgres.ts`에 세워 우회가 한 곳에 살게 한다. 앞의 것이면 이미 선 테스트가 그 값에 기대는지부터 본다.
