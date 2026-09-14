# 알림

짝은 [domain/notification.md](../../domain/notification.md)다. 키는 `['notifications']`(`useInfiniteQuery` + `range()` 50건)와 `['notifications', 'unread']`(안 읽은 수, `head: true` count 질의)다. 무효화는 [`README.md`](README.md#무효화-표)에 있다.

## 읽음은 누른 행만, 낙관적으로

domain대로 ✕·CTA·답 셋 중 하나를 눌러야 읽음이다. 목록을 훑는 것으로는 안 바뀐다. 누른 행의 `read_at`을 즉시 칠하고 `mark_notifications_read`를 보낸다. 실패하면 되돌린다 — 다시 나타난 행을 사람이 다시 누른다.

## 푸시 수신

Service Worker의 `push` 이벤트가 알림을 **항상** 띄운다 — iOS는 푸시를 받고 알림을 안 띄우는 일이 반복되면 구독을 회수한다. 누르면 `notificationclick`이 `payload`의 화면을 연다. 앱이 열려 있으면 `postMessage`로 `['notifications']`를 무효화한다. 사건이 닿는 도메인 키(강제 변경이면 `['schedule']`)는 탭 복귀 재조회에 맡긴다. 푸시가 안 오는 기기는 탭 복귀 때 다시 읽는 것이 전부다.

## 구독

로그인 뒤 첫 화면에서 `'Notification' in window`를 먼저 본다 — iOS Safari 탭에는 이 객체가 없고 홈 화면 앱에만 있다. `permission === 'granted'`면 `pushManager.getSubscription()`으로 구독을 받아 `save_push_subscription`을 부른다. 권한은 있는데 구독이 없을 수 있고 `endpoint`가 바뀌는 일도 있어 매 진입에 보낸다 — 함수는 `endpoint` upsert다. `default`면 알림 설정 화면의 버튼이 사용자 제스처 안에서 묻는다. 진입 즉시 권한을 묻지 않는다.
