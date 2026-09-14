# 계정

짝은 [domain/account.md](../../domain/account.md)와 [`../data-model/account.md`](../data-model/account.md)다.

## 함수

관리자만.

| 함수 | 하는 일 |
| --- | --- |
| `approve_member`, `reject_member`, `block_member`, `unblock_member` | 가입 승인·거절·차단·해제. 승인은 `wage_rates` 첫 행을 같이 넣는다 |
| `set_role` | 관리자 올리기·내리기. 마지막 관리자는 못 내린다 — `last_admin` |
| `set_display_name` | 관리자가 이름을 고친다. 본인은 못 고치니 여기뿐이다 |
| `link_account` | 새 구글 계정을 옛 프로필에 잇는다. 새 계정의 빈 프로필을 지운다 |
| `mark_leave`, `undo_leave` | 퇴사 처리와 되돌리기. 앞 배정이 남았으면 `has_future_assignments` |

근무자.

| 함수 | 하는 일 |
| --- | --- |
| `ensure_profile` | 첫 진입에서 자기 프로필 행을 만든다. 있으면 아무것도 안 한다 |
| `submit_profile` | 프로필 제출. 이름·성별·생년월일은 제출된 뒤 잠기고 거절되면 다시 열린다 |

연락처·사진은 함수가 아니라 `profile_private` 본인 행 직접 갱신이다 — 테이블 직접 쓰기 정책이 있는 유일한 자리.

pg_cron(`internal`) — `erase_profiles`. 매일 `left_at`이 1년 지난 프로필을 비운다.

## 비우기

`erase_profiles`가 `erased_at`을 찍은 뒤 Edge Function `erase-account`를 불러 `auth.users`를 지운다. Admin API뿐이라 service role이 필요한 자리다 — 서비스 키 자리 둘 중 하나. 지워지면 `user_id`가 null이 되는 것이 완료 표시라 큐 표가 따로 없다. 다음 날 cron이 `erased_at`은 있고 `user_id`도 있는 행을 다시 부른다.

## Next 서버가 부르는 자리

미들웨어의 세션 확인, `/auth/callback`의 코드 교환, `/auth/logout`, 첫 페이지의 승인 여부 읽기(`readAuthGate`). `auth.*`는 `shared/lib`이고 승인 여부 읽기만 `dals`다. 그 `dals`(`getApprovedAt`)는 지금 `id`로 찾는데 `user_id`로 바뀐다 — 데이터 task가 같이 고친다.
