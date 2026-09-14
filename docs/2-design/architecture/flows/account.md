# 계정

짝은 [domain/account.md](../../domain/account.md)다. 화면은 `login.md`(로그인·프로필 작성·승인 대기·퇴사한 뒤)·`profile.md`·`members-pending.md`·`members.md`다.

## 가입

`/login` 구글 버튼 → OAuth가 페이지를 떠났다 `/auth/callback`으로 돌아온다 → `ensure_profile()` → `/pending` 프로필 작성 → 「보내기」(`submit_profile`) → 같은 경로가 승인 대기로 바뀐다 → 관리자가 `/admin/members/pending`에서 승인(`approve_member`) → 가입 승인 알림 → 근무자가 앱을 열면 `/`.

거절되면 `/pending`이 「거절된 뒤」로 바뀌고 「다시 보내기」가 프로필 작성으로 돌아간다. 지난 값이 들어 있다.

## 로그아웃

`/pending`·`/left`의 앱바, `/me`의 줄. `auth.signOut()` 뒤 `/login`이다. 캐시 삭제는 [`../runtime/account.md`](../runtime/account.md).

## 관리자 되기·내려오기

`/admin/members`에서 관리자가 올리고 내린다(`set_role`). 본인이 자신을 내리면 그 자리에서 `/`로 간다. 남이 나를 내리면 내 기기는 다음 진입이나 탭 복귀에 `['profile']`을 읽고 옮긴다 — 즉시가 아니다.

## 퇴사·차단

`/admin/members`에서 퇴사 처리(`mark_leave`). 앞 배정이 남았으면 Dialog가 막고 「근무표로 가기」가 가장 가까운 배정 날의 날 상세(`/admin/schedule?date=&from=members`)를 연다. 처리된 사람은 다음 진입부터 `/left`고 거기서 급여만 연다.

차단(`block_member`)과 해제(`unblock_member`)는 `/admin/members/pending`의 더보기 「차단한 사람」에서 한다. 차단된 사람은 `/blocked`다 — `login.md`가 「로그인 화면에 그리는지 다른 자리로 보내는지」를 열어뒀는데 여기서 다른 자리로 정했다.

## 안 그린다

`link_account`(계정 연결)는 1차에 없다 — [domain/account.md](../../domain/account.md#아직-안-정한-것).
