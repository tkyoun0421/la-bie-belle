# 계정

짝은 [domain/account.md](../../domain/account.md)다. 키는 `['profile']`(본인)·`['members']`(관리자 명단)·`['members', 'pending']`이다. 무효화는 [`README.md`](README.md#무효화-표)에 있다.

## 게이트는 세션만, 판정은 클라이언트가

`proxy`가 세션 쿠키만 본다 — 없으면 `/login`이다. 승인됐는지·차단됐는지·퇴사했는지는 앱이 뜬 뒤 `['profile']`을 읽고 가른다. 이유는 [`README.md`](README.md#캐시-네-계층)에 있다 — 서버가 판정을 그리면 껍데기를 캐시할 수 없다.

`['profile']`이 `blocked_at`을 들면 차단 화면, `left_at`을 들면 퇴사 화면, `approved_at`이 없으면 `/pending`이다. `staleTime`이 0이고 영속하지 않는다 — 차단당한 사람이 옛 프로필로 근무표를 더 보는 일이 없게. 읽는 자리는 껍데기 하나다 — 앱이 뜰 때와 탭 복귀에 읽고 라우트 전환은 그 값을 쓴다. 탭을 옮길 때마다 빈 화면이 끼지 않는다. 읽는 동안은 아무것도 안 그린다.

## 로그인 뒤

`ensure_profile()`을 부르고 `['profile']`을 읽는다. 없던 사람이면 `/pending`의 프로필 입력 폼이다. 구글 로그인은 `auth.signInWithOAuth`가 페이지를 떠났다 돌아오니 돌아온 자리에서 이 순서가 돈다.

## 로그아웃·퇴사·차단

`auth.signOut()` 뒤 `queryClient.clear()`와 IndexedDB 영속본 삭제, 시각 오프셋 삭제다. 퇴사·차단은 `['profile']` 읽기가 그 값을 든 순간 같은 처리를 한다 — 남의 근무표가 기기에 남지 않게. 푸시 구독은 로그아웃에서 `remove_push_subscription`을 먼저 부른다. 차단·퇴사는 서버가 이미 안 보내니 남겨도 된다.

## 낙관적인 것

이름·연락처 변경(`set_display_name`·`submit_profile`)은 즉시 칠하고 실패면 되돌린다. 승인·거절·차단·역할 변경은 응답을 기다린다 — 남에게 닿는다.
