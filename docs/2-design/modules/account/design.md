# 계정 — 설계

짝은 [README.md](README.md)다. 계정의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

업무 규칙은 [README.md](README.md#업무-규칙)의 `ACC-001`부터 `ACC-011`까지다.

공통 스키마·권한·컬럼 규약과 읽기·쓰기·타입·에러 계약은 [system/data-access.md](../../system/data-access.md), 캐시 계층·시각은 [system/runtime.md](../../system/runtime.md), 시스템 경계는 [system/architecture.md](../../system/architecture.md)를 따른다.

## 소유 데이터

표는 `profiles`·`profile_private` 둘이다.

| 테이블 | 파일 | 한 줄 |
| --- | --- | --- |
| `profiles` | account | 사람 하나. 이름·사진·역할·승인·차단·퇴사·비움 시각. `user_id`가 `auth.users`를 가리킨다 |
| `profile_private` | account | 연락처·생년월일·성별. 본인과 관리자만 |

읽기 RLS는 기본값을 좁힌다.

| 표 | 누가 읽나 |
| --- | --- |
| `profile_private` | 본인 행과 관리자 |

키는 `['profile']`(본인)·`['members']`(관리자 명단)·`['members', 'pending']`이다. 무효화 키는 행위마다 적고 공통 규칙은 [system/runtime.md](../../system/runtime.md#무효화-표)에 있다.

### 프로필 신원

**`profiles.id`는 별도 uuid고 `user_id`가 `auth.users`를 가리킨다.** `user_id uuid unique references auth.users on delete set null`. 잇기는 `user_id`만 바꾸는 함수다. RLS 술어는 전부 `user_id = auth.uid()`가 된다.

새 로그인마다 빈 프로필을 만드는 트리거는 뗀다. 첫 진입에서 `ensure_profile()` 함수가 만들고, 잇기 함수는 그 빈 행을 지운다.

### 개인정보는 표를 가른다

`profiles(id, user_id, display_name, photo_url, role, submitted_at, approved_at, rejected_at, blocked_at, left_at, erased_at)`는 승인된 전원이 읽는다. `profile_private(profile_id, phone, birth_date, gender)`는 본인과 관리자만 읽는다. RLS가 행 단위라 한 표로는 열을 못 가른다 — 한 표면 아무 근무자나 `select phone from profiles`로 서른 명 연락처를 받는다.

`profile_private`의 연락처는 본인이 직접 갱신한다. 테이블 직접 쓰기 정책이 있는 유일한 자리다. 이름·성별·생년월일은 `submit_profile()` 함수로만 들어간다 — 제출된 뒤 잠기고 거절되면 다시 열리는 것을 컬럼 grant로는 못 나타낸다.

사진은 `profiles.photo_url`이다. 전원이 읽는 표라 `profile_private`로 못 옮긴다 — 사람 픽커와 대기 목록이 이름 옆에 사진을 그린다. 본인이 고치는 길은 `update_my_photo()` 함수 하나다. 전원이 읽는 표에 본인 쓰기 정책을 열지 않아서 직접 쓰기 예외는 그대로 `profile_private` 하나다. 관리자는 남의 사진을 못 고친다.

### 차단

**차단은 `blocked_at`이다.** Auth ban을 안 쓴다 — 구글 로그인은 되지만 클라이언트가 `blocked_at`을 읽어 차단 화면으로 보내고 `is_approved()`가 `blocked_at is null`을 품어 행을 안 준다. 서비스 키 자리가 안 는다.

### 퇴사 1년 뒤

**「삭제」는 비우기다.** pg_cron의 `erase_profiles()`가 매일 `left_at`이 1년 지난 프로필의 `profile_private` 행을 지우고 사진을 비우고 `erased_at`을 찍는다. 이름은 남는다 — 그게 스냅샷이다. 배정·인증·시급 FK가 그대로 살아 통계와 지난 근무표가 안 흔들린다.

`auth.users` 행은 Supabase Admin API로 지운다 — 서비스 키 자리다. 지워지면 `user_id`가 null이 되는 것이 완료 표시라 큐 표가 따로 없다.

## 행위별 구현 계약

### 첫 진입과 게이트

- 규칙: [ACC-001](README.md#acc-001)·[ACC-006](README.md#acc-006)·[ACC-007](README.md#acc-007)·[ACC-011](README.md#acc-011)
- 입력·전제: `proxy`가 세션 쿠키만 본다 — 없으면 `/login`이다. 구글 로그인은 `auth.signInWithOAuth`가 페이지를 떠났다 돌아오니 돌아온 자리에서 이 순서가 돈다. `ensure_profile()`을 부르고 `['profile']`을 읽는다
- 읽고 쓰는 데이터: `ensure_profile`이 첫 진입에서 자기 프로필 행을 만든다. 있으면 아무것도 안 한다
- 권한: 승인됐는지·차단됐는지·퇴사했는지는 앱이 뜬 뒤 `['profile']`을 읽고 가른다. 이유는 [system/runtime.md](../../system/runtime.md#캐시-네-계층)에 있다 — 서버가 판정을 그리면 껍데기를 캐시할 수 없다
- 처리와 경쟁: 읽는 자리는 껍데기 하나다 — 앱이 뜰 때와 탭 복귀에 읽고 라우트 전환은 그 값을 쓴다. 탭을 옮길 때마다 빈 화면이 끼지 않는다. 읽는 동안은 아무것도 안 그린다
- 결과와 실패: `['profile']`이 `blocked_at`을 들면 차단 화면, `left_at`을 들면 퇴사 화면, `approved_at`이 없으면 `/pending`이다. 없던 사람이면 `/pending`의 프로필 입력 폼이다
- 캐시 갱신: `staleTime`이 0이고 영속하지 않는다 — 차단당한 사람이 옛 프로필로 근무표를 더 보는 일이 없게

### 프로필 제출·연락처·사진

- 규칙: [ACC-002](README.md#acc-002)·[ACC-003](README.md#acc-003)·[ACC-004](README.md#acc-004)
- 입력·전제: 프로필 제출은 `submit_profile`이다
- 읽고 쓰는 데이터: 이름·성별·생년월일은 제출된 뒤 잠기고 거절되면 다시 열린다. 연락처는 함수가 아니라 `profile_private` 본인 행 직접 갱신이다 — 테이블 직접 쓰기 정책이 있는 유일한 자리. 사진은 `update_my_photo`가 자기 `profiles.photo_url`을 바꾼다
- 권한: 본인 행뿐이고 관리자도 남의 것은 못 바꾼다([개인정보는 표를 가른다](#개인정보는-표를-가른다))
- 처리와 경쟁: 이름 변경(`set_display_name`)과 연락처 변경(`profile_private` 직접 갱신)은 즉시 칠하고 실패면 되돌린다. 승인·거절·차단·역할 변경은 응답을 기다린다 — 남에게 닿는다

### 가입 승인·거절·차단·해제

- 규칙: [ACC-006](README.md#acc-006)·[ACC-007](README.md#acc-007)
- 입력·전제: `approve_member`, `reject_member`, `block_member`, `unblock_member`가 가입 승인·거절·차단·해제다
- 읽고 쓰는 데이터: 승인은 `wage_rates` 첫 행을 같이 넣는다
- 처리와 경쟁: 응답을 기다린다 — 남에게 닿는다
- 캐시 갱신: `approve_member`는 `['members']` `['payroll']`, `reject_member`·`block_member`·`unblock_member`는 `['members']`다

### 관리자 올리기·내리기

- 규칙: [ACC-008](README.md#acc-008)
- 입력·전제: `set_role`이 관리자 올리기·내리기다
- 결과와 실패: 마지막 관리자는 못 내린다 — `last_admin`
- 캐시 갱신: `['members']`

### 이름 고치기

- 규칙: [ACC-009](README.md#acc-009)
- 입력·전제: `set_display_name`으로 관리자가 이름을 고친다
- 권한: 본인은 못 고치니 여기뿐이다
- 캐시 갱신: `set_display_name`과 `submit_profile`은 `['profile']` `['members']` `['schedule']`

### 계정 잇기

- 규칙: [README.md](README.md#용어)의 프로필
- 입력·전제: `link_account`가 새 구글 계정을 옛 프로필에 잇는다
- 읽고 쓰는 데이터: 새 계정의 빈 프로필을 지운다

### 퇴사 처리와 되돌리기

- 규칙: [ACC-010](README.md#acc-010)·[ACC-011](README.md#acc-011)
- 입력·전제: `mark_leave`, `undo_leave`가 퇴사 처리와 되돌리기다
- 결과와 실패: 앞 배정이 남았으면 `has_future_assignments`
- 캐시 갱신: `['members']`

### 로그아웃·퇴사·차단 뒤 기기 정리

- 규칙: [ACC-006](README.md#acc-006)·[ACC-011](README.md#acc-011)
- 입력·전제: `auth.signOut()` 뒤다. 퇴사·차단은 `['profile']` 읽기가 그 값을 든 순간 같은 처리를 한다
- 처리와 경쟁: 푸시 구독은 로그아웃에서 `remove_push_subscription`을 먼저 부른다. 차단·퇴사는 서버가 이미 안 보내니 남겨도 된다
- 캐시 갱신: `queryClient.clear()`와 IndexedDB 영속본 삭제, 시각 오프셋 삭제다 — 남의 근무표가 기기에 남지 않게

### 비우기

- 규칙: [ACC-011](README.md#acc-011)
- 입력·전제: pg_cron(`internal`) — `erase_profiles`. 매일 `left_at`이 1년 지난 프로필을 비운다
- 읽고 쓰는 데이터: `erase_profiles`가 `erased_at`을 찍은 뒤 Edge Function `erase-account`를 불러 `auth.users`를 지운다
- 권한: Admin API뿐이라 service role이 필요한 자리다 — 서비스 키 자리 둘 중 하나
- 처리와 경쟁: 지워지면 `user_id`가 null이 되는 것이 완료 표시라 큐 표가 따로 없다. 다음 날 cron이 `erased_at`은 있고 `user_id`도 있는 행을 다시 부른다

## UI 연결

`proxy`의 세션 확인, `/auth/callback`의 코드 교환, `/auth/logout`. 전부 `auth.*`라 `shared/lib`이다.

`link_account`(계정 연결)는 1차에 없다 — [README.md](README.md#아직-안-정한-것).

화면은 [login](screens/login.md)·[profile](screens/profile.md)·[members-pending](screens/members-pending.md)·[members](screens/members.md)다.

## 코드와의 차이

목표와 지금 코드가 다른 자리다.

| 목표 조항 | 확인한 코드와 Git 기준점 | 차이 | 전환 작업·검증 근거 |
| --- | --- | --- | --- |
| [프로필 신원](#프로필-신원) — `profiles.id`와 `user_id`의 분리 | `supabase/migrations/20260825162027_profiles.sql`, `e4ecf84` | 지금 마이그레이션은 `id = auth.users.id`(cascade)라 두 가지가 안 된다 — 새 구글 계정을 옛 프로필에 잇는 것([README.md](README.md#용어))과 계정을 지우고 프로필을 남기는 것 | `account-data` — [backlog.md](../../../backlog.md) |
| [개인정보는 표를 가른다](#개인정보는-표를-가른다) — `profile_private` 분리 | `supabase/migrations/20260825162027_profiles.sql`, `e4ecf84` | 지금 마이그레이션은 `profiles` 한 표에 연락처가 같이 있다 — 같은 task가 가른다 | `account-data` — [backlog.md](../../../backlog.md) |
| [첫 진입과 게이트](#첫-진입과-게이트) — 서버 판정을 클라이언트로 | `src/middleware.ts`, `8585ec8`. `src/features/auth/read-auth-gate.ts`, `3adcb7b` | 지금 코드는 `src/middleware.ts`가 세션을 갱신하고 `src/features/auth/read-auth-gate.ts`가 서버에서 `approved_at`을 읽어 가른다 | `auth-entry` — [backlog.md](../../../backlog.md) |
| [UI 연결](#ui-연결) — `readAuthGate`·`getApprovedAt` 이동 | `src/features/auth/read-auth-gate.ts`, `3adcb7b`. `src/entities/profile/dals/get-approved-at.ts`, `9467c13` | 지금 코드의 첫 페이지 승인 여부 읽기(`readAuthGate`·`getApprovedAt`)는 클라이언트로 옮긴다([첫 진입과 게이트](#첫-진입과-게이트)) | `auth-entry` — [backlog.md](../../../backlog.md) |

## 아직 안 정한 것

### Q-01

- 질문: 본인이 올린 사진의 저장 위치
- 영향: Supabase Storage면 `dals`의 `storage` 호출이 첫 자리다
- 필요한 근거와 대안: [README.md](README.md#아직-안-정한-것)가 열려 있다
