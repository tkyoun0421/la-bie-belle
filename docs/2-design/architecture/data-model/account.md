# 계정

짝은 [domain/account.md](../../domain/account.md)다. 표는 `profiles`·`profile_private` 둘이다.

## 프로필 신원

**`profiles.id`는 별도 uuid고 `user_id`가 `auth.users`를 가리킨다.** `user_id uuid unique references auth.users on delete set null`. 지금 마이그레이션은 `id = auth.users.id`(cascade)라 두 가지가 안 된다 — 새 구글 계정을 옛 프로필에 잇는 것([account.md](../../domain/account.md#구글-계정-변경))과 계정을 지우고 프로필을 남기는 것. 잇기는 `user_id`만 바꾸는 함수다. RLS 술어는 전부 `user_id = auth.uid()`가 된다. 이 전환은 `backlog.md` 「계정 데이터 구조 전환」이다.

새 로그인마다 빈 프로필을 만드는 트리거는 뗀다. 첫 진입에서 `ensure_profile()` 함수가 만들고, 잇기 함수는 그 빈 행을 지운다.

## 개인정보는 표를 가른다

`profiles(id, user_id, display_name, photo_url, role, submitted_at, approved_at, rejected_at, blocked_at, left_at, erased_at)`는 승인된 전원이 읽는다. `profile_private(profile_id, phone, birth_date, gender)`는 본인과 관리자만 읽는다. RLS가 행 단위라 한 표로는 열을 못 가른다 — 한 표면 아무 근무자나 `select phone from profiles`로 서른 명 연락처를 받는다. 지금 마이그레이션은 `profiles` 한 표에 연락처가 같이 있다 — 같은 task가 가른다.

`profile_private`의 연락처는 본인이 직접 갱신한다. 테이블 직접 쓰기 정책이 있는 유일한 자리다. 이름·성별·생년월일은 `submit_profile()` 함수로만 들어간다 — 제출된 뒤 잠기고 거절되면 다시 열리는 것을 컬럼 grant로는 못 나타낸다.

사진은 `profiles.photo_url`이다. 전원이 읽는 표라 `profile_private`로 못 옮긴다 — 사람 픽커와 대기 목록이 이름 옆에 사진을 그린다. 본인이 고치는 길은 `update_my_photo()` 함수 하나다. 전원이 읽는 표에 본인 쓰기 정책을 열지 않아서 직접 쓰기 예외는 그대로 `profile_private` 하나다. 관리자는 남의 사진을 못 고친다.

## 차단

**차단은 `blocked_at`이다.** Auth ban을 안 쓴다 — 구글 로그인은 되지만 클라이언트가 `blocked_at`을 읽어 차단 화면으로 보내고 `is_approved()`가 `blocked_at is null`을 품어 행을 안 준다. 서비스 키 자리가 안 는다.

## 퇴사 1년 뒤

**「삭제」는 비우기다.** pg_cron의 `erase_profiles()`가 매일 `left_at`이 1년 지난 프로필의 `profile_private` 행을 지우고 사진을 비우고 `erased_at`을 찍는다. 이름은 남는다 — 그게 스냅샷이다. 배정·인증·시급 FK가 그대로 살아 통계와 지난 근무표가 안 흔들린다.

`auth.users` 행은 Supabase Admin API로 지운다 — 서비스 키 자리다. 지워지면 `user_id`가 null이 되는 것이 완료 표시라 큐 표가 따로 없다.

## 아직 안 정한 것

- 본인이 올린 사진의 저장 위치 — [domain/account.md](../../domain/account.md#아직-안-정한-것)가 열려 있다. Supabase Storage면 `dals`의 `storage` 호출이 첫 자리다
