---
sources:
  - ../../2-design/modules/account/screens/members.md#목록
  - ../../2-design/modules/account/screens/members.md#사람-시트
  - ../../2-design/modules/account/screens/members.md#퇴사-확인
  - ../../2-design/modules/account/screens/members.md#퇴사한-사람-시트
  - ../../2-design/modules/account/screens/members.md#검색
  - ../../2-design/modules/account/screens/members.md#퇴사-구획
  - ../../2-design/modules/account/screens/members.md#목록-문안
  - ../../2-design/modules/account/screens/members.md#사람-시트-문안
  - ../../2-design/modules/account/screens/members.md#퇴사-확인-문안
  - ../../2-design/modules/account/screens/members.md#퇴사한-사람-시트-문안
  - ../../2-design/modules/account/design.md#이름-고치기
  - ../../2-design/modules/account/design.md#관리자-올리기내리기
  - ../../2-design/modules/account/design.md#퇴사-처리와-되돌리기
  - ../../2-design/modules/account/design.md#퇴사-1년-뒤
  - ../../2-design/modules/account/README.md#acc-002
  - ../../2-design/modules/account/README.md#acc-008
  - ../../2-design/modules/account/README.md#acc-009
  - ../../2-design/modules/account/README.md#acc-010
  - ../../2-design/modules/account/README.md#acc-011
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/navigation.md#뒤로
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/runtime.md#tanstack-query-규칙
  - ../../2-design/design-system/components.md#listrow
  - ../../2-design/design-system/components.md#button
  - ../../2-design/design-system/components.md#badge
  - ../../2-design/design-system/components.md#더보기-팝오버
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/design-system/components.md#토스트
  - ../../2-design/design-system/components.md#빈-상태
  - ../../2-design/modules/payroll/screens/wages.md#사람-시트
---

# 직원 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [members.md](../../2-design/modules/account/screens/members.md)다 — [목록](../../2-design/modules/account/screens/members.md#목록)·[사람 시트](../../2-design/modules/account/screens/members.md#사람-시트)·[퇴사 확인](../../2-design/modules/account/screens/members.md#퇴사-확인)·[퇴사한 사람 시트](../../2-design/modules/account/screens/members.md#퇴사한-사람-시트)의 상태 표, [검색](../../2-design/modules/account/screens/members.md#검색)·[퇴사 구획](../../2-design/modules/account/screens/members.md#퇴사-구획)·[이름 고치기](../../2-design/modules/account/screens/members.md#이름-고치기)·[관리자로 올리기와 내리기](../../2-design/modules/account/screens/members.md#관리자로-올리기와-내리기)·[퇴사 처리](../../2-design/modules/account/screens/members.md#퇴사-처리)·[되돌리기](../../2-design/modules/account/screens/members.md#되돌리기)의 짜임, [색](../../2-design/modules/account/screens/members.md#색)·[글자](../../2-design/modules/account/screens/members.md#글자)·[여백과 모양](../../2-design/modules/account/screens/members.md#여백과-모양) 표, 문안 표 넷, [모션](../../2-design/modules/account/screens/members.md#모션)이다. 쓰기 함수는 [design.md](../../2-design/modules/account/design.md)의 `set_display_name`·`set_role`·`mark_leave`·`undo_leave`고, 비우기는 [퇴사 1년 뒤](../../2-design/modules/account/design.md#퇴사-1년-뒤)의 `erase_profiles`다. 규칙은 [ACC-002](../../2-design/modules/account/README.md#acc-002)(성별·생년월일은 아무도 못 고친다)·[ACC-008](../../2-design/modules/account/README.md#acc-008)(마지막 관리자)·[ACC-009](../../2-design/modules/account/README.md#acc-009)(이름은 관리자만, 과거도 같이 바뀐다)·[ACC-010](../../2-design/modules/account/README.md#acc-010)(앞 배정이 남으면 퇴사 처리가 안 된다)·[ACC-011](../../2-design/modules/account/README.md#acc-011)(퇴사한 사람도 로그인한다, 1년 뒤 비워진다)다. 경로 `/admin/members`와 「관리자만」은 [navigation.md](../../2-design/system/navigation.md#경로), 앱바 뒤로 `/admin`은 [뒤로](../../2-design/system/navigation.md#뒤로)다. 함수 실패는 [data-access.md](../../2-design/system/data-access.md#오류의-모양)의 `DomainError`·`TransportError`고, 이 화면의 코드는 `last_admin`·`has_future_assignments`·`not_allowed`다. 캐시 키는 `['members']`, 무효화는 design.md의 행위별 계약이다. 이 화면의 쓰기는 넷 다 응답을 기다린다 — 이름 고치기도 시트 안에서 일어나 실패를 그 자리에 세워야 한다([design.md](../../2-design/modules/account/design.md#프로필-제출연락처사진)).

정본에서 확인한 셋이 plan의 방향을 정한다.

- **검색은 클라이언트 필터다.** `['members']`는 승인된 전원을 한 질의로 받는다 — [읽기 범위](../../2-design/system/runtime.md#읽기-범위)의 「프로필 서른」이 그 키고 `max_rows` 1000 안이다. [검색](../../2-design/modules/account/screens/members.md#검색)이 「치면 두 구획이 같이 걸러진다」·「검색은 접힌 줄도 찾는다」고 했으니 이미 받아둔 목록을 글자로 거르는 것이지 서버에 다시 묻는 것이 아니다. 계산은 `.ts` model이다
- **1년 경계는 `erased_at`이다.** [퇴사 구획](../../2-design/modules/account/screens/members.md#퇴사-구획)이 접는 것은 「퇴사한 지 1년이 지나 비워진 사람」이고 「펼친 것은 되돌릴 수 있는 사람이고 접힌 것은 이름만 남은 사람」이다. 비워졌다는 사실은 [퇴사 1년 뒤](../../2-design/modules/account/design.md#퇴사-1년-뒤)의 `erase_profiles()`가 찍는 `erased_at`이고, 「1년」은 그 cron이 도는 조건이지 화면이 세는 값이 아니다. 화면이 `left_at + 1년`을 따로 세면 cron이 돌기 전 하루 동안 「접혔는데 되돌릴 수 있는 사람」이 생겨 선이 뜻과 어긋난다. 그래서 접힘·비워진 시트·더보기 없음은 전부 `erased_at is not null` 하나로 가른다
- **퇴사 처리의 남은 배정 검사는 이 task 밖이다.** `has_future_assignments`는 [schedule/design.md](../../2-design/modules/schedule/design.md#배정)의 `assignments`(살아 있는 행, `days.work_date`)를 읽어야 던질 수 있고, Dialog의 「10월 3일 안내 · 10월 4일 안내」와 「근무표로 가기」(`/admin/schedule?date=&from=members`)도 그 표와 화면이 있어야 선다. `schedule` task가 `blocked`라 이 갈래를 [선행이 갈린 자리](#ac-11)로 뺀다. 시급 값도 같다 — `wage_rates`는 [payroll/design.md](../../2-design/modules/payroll/design.md#시급-이력은-사람마다-실제-행이다)의 표고 `payroll` task가 `blocked`다

지금 코드에는 관리자 화면이 하나도 없다. `src/app/` 아래 라우트는 `/`·`/login`·`/pending`·`/blocked`·`/left`·`/auth/*`뿐이고 `/admin`이 없다. 게이트(`src/features/auth/use-auth-gate.ts`)는 목적지·이메일·구글 사진만 주고 `role`을 안 준다 — `resolveGateMove`는 게이트 경로 밖이면 승인된 사람 누구나 통과시켜 근무자가 `/admin/members`를 열어도 안 막는다. `get-my-profile.ts`는 `role`을 이미 읽는다. `src/entities/profile/dals/`에는 `ensure-profile`·`get-my-profile` 둘뿐이고 명단을 읽는 dal이 없다. `src/shared/ui/`는 Button·Card뿐이라 ListRow·Badge·앱바·바텀시트·Dialog·토스트·더보기 팝오버·빈 상태가 전부 없다. 마이그레이션 `supabase/migrations/20260825162027_profiles.sql`에는 `is_approved`·`is_admin`·`ensure_profile`·`submit_profile`·`update_my_photo`·`approve_member`·`reject_member`가 있고 `set_display_name`·`set_role`·`mark_leave`·`undo_leave`·`erase_profiles`·`block_member`·`unblock_member`는 없다. `assignments`·`wage_rates` 표도 없다. `is_admin()`은 `role = 'admin'`만 보고 `left_at`·`blocked_at`을 안 본다. `tests/integration/postgres.ts`에 `createApprovedUser`·`createAdminUser`·`createBlockedUser`·`createLeftUser`가 있고 「비워진 사람」 헬퍼는 없다. `tests/e2e/`에 관리자 spec이 없다. `src/shared/api/error-codes.ts`와 `DomainError`·`TransportError`, Input·스피너는 [profile-form plan](profile-form.md)의 AC-01·AC-11이 만든다 — 이 plan은 그것을 선행으로 쓰고 다시 만들지 않는다.

확인한 코드와 Git 기준점 — `src/features/auth/use-auth-gate.ts`·`src/shared/lib/resolve-auth-destination.ts`·`src/entities/profile/dals/get-my-profile.ts`·`supabase/migrations/20260825162027_profiles.sql`·`tests/integration/postgres.ts`가 `5615cb2`(#365).

선행 task가 둘이다. `profile-form`(오류 기계·Input·스피너)은 반드시 앞이다. [가입 대기](members-pending.md)는 순서가 안 정해졌다 — ListRow·앱바·바텀시트·토스트·더보기 팝오버·빈 상태·이니셜 원·관리자 경로 보호처럼 두 화면이 같이 쓰는 자리는 **가입 대기 task가 먼저 만들면 그것을 쓰고, 이 task가 먼저면 여기서 만든다.** 어느 쪽이 먼저든 정본은 [components.md](../../2-design/design-system/components.md)라 모양은 같다. 파일 이름은 그 plan의 [변경 파일](members-pending.md#변경-파일)을 따른다 — 둘이 다른 이름으로 같은 조각을 만들지 않게.

## 완료 조건

### AC-01

**쓰기 함수 넷이 선다.** `supabase/migrations/20260825162027_profiles.sql`에 더한다 — 배포한 적이 없어 파일을 고치는 것은 profile-form과 같은 이유다. 넷 다 [함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙)대로 첫 줄이 `is_admin()` 검사고 아니면 `not_allowed`, `security definer`·`set search_path = ''`다.

- `set_display_name(profile_id uuid, display_name text)` — `profiles.display_name`을 바꾼다. 다듬은 값이 빈 문자열이면 `invalid_name`을 던진다 — 화면이 먼저 막지만 함수가 마지막 문이다(profile-form AC-02의 `invalid_gender`와 같은 결). 대상 행이 없으면 `not_allowed`
- `set_role(profile_id uuid, role text)` — `role`이 `member`·`admin`이 아니면 `invalid_role`. 대상이 재직자(`approved_at`이 있고 `left_at`·`blocked_at`이 없다)가 아니면 `not_allowed` — 퇴사한 사람 시트에는 역할 버튼이 없으니 버튼이 잘못 켜진 것이다. `admin`을 `member`로 내리는데 그러면 관리자가 하나도 안 남으면 `last_admin`. 셈은 [ACC-008](../../2-design/modules/account/README.md#acc-008)대로 재직 중이고 차단되지 않은 관리자다 — 퇴사하거나 차단된 관리자는 안 센다. 자기 자신을 내리는 것은 마지막이 아닌 한 막지 않는다
- `mark_leave(profile_id uuid)` — 대상이 재직자가 아니면 `not_allowed`. 이미 `left_at`이 있으면 `already_done`(재시도가 두 번 닿은 것, 화면은 성공으로 처리). 대상이 마지막 관리자면 `last_admin` — 퇴사시켜도 관리자가 사라지니 내리기와 같은 문이다([ACC-008](../../2-design/modules/account/README.md#acc-008)). `left_at = now()`. `has_future_assignments` 검사는 [AC-11](#ac-11)이 든다 — 지금은 `assignments` 표가 없어 남은 배정이 있을 수 없고, 표가 서는 마이그레이션이 이 함수를 `create or replace`로 고쳐 검사를 넣는다
- `undo_leave(profile_id uuid)` — `erased_at`이 있으면 `not_allowed`(비워진 사람 시트에는 더보기가 없다). `left_at`이 없으면 `already_done`. `left_at = null`. 시급·배정 행은 안 건드린다 — 「시급이 그대로 살아 있다」([되돌리기](../../2-design/modules/account/screens/members.md#되돌리기))

`src/shared/api/error-codes.ts`에 `last_admin`·`invalid_name`·`invalid_role`·`already_done`이 든다 — 대조 테스트가 마이그레이션의 `raise` 문자열과 맞추니 빠뜨리면 빨갛다. `has_future_assignments`는 [AC-11](#ac-11)이 함수에 넣을 때 같이 든다.

### AC-02

**`['members']` dal이 선다.** `src/entities/profile/dals/get-members.ts`.

- `profiles`에서 `approved_at`이 있고 `blocked_at`이 없는 행 전부 — `id`·`display_name`·`photo_url`·`role`·`left_at`·`erased_at`과 `profile_private(phone, birth_date, gender)` 임베딩을 한 질의로 받는다. 차단된 사람은 [가입 대기](../../2-design/modules/account/screens/members-pending.md)의 「차단한 사람」이 자리라 여기 없다([members.md](../../2-design/modules/account/screens/members.md#목적과-진입) — 「차단도 거기 있다」)
- 정렬·가르기는 질의가 아니라 model이 한다([AC-03](#ac-03))
- 비워진 사람은 `profile_private` 행이 지워져 임베딩이 `null`이다 — 그 `null`이 화면의 「연락처·생년월일이 없다」다
- 관리자 세션은 `profile_private`가 다 오고, 근무자 세션은 RLS가 `profile_private`를 안 줘 `null`이다 — 오류가 아니라 빈 값이다([읽기](../../2-design/system/data-access.md#읽기)). 화면은 관리자만 여니 근무자 결과는 integration이 「새지 않는다」를 보는 자리다
- 읽기 오류는 전부 `TransportError`다

쓰기 dal은 넷 — `set-display-name.ts`·`set-role.ts`·`mark-leave.ts`·`undo-leave.ts`. `rpc()`로 부르고 실패를 `DomainError`·`TransportError`로 가른다.

### AC-03

**목록 계산이 `.ts` model에 있다.** `src/screens/members/model/`.

- 가르기 — `left_at`이 없으면 재직자, 있으면 퇴사. 퇴사 중 `erased_at`이 없으면 펼친 줄, 있으면 접힌 줄
- 정렬 — 재직자는 이름 가나다순(`localeCompare`, `ko`)이고 관리자를 위로 올리지 않는다. 퇴사는 `left_at` 늦은 순
- 검색 — 칸의 글자가 이름에 들어 있는 줄만 남긴다. 재직자·펼친 줄·접힌 줄 셋에 다 건다. 맞는 줄이 접힌 쪽에 있으면 그 줄이 「더 보기」 없이 바로 선다. 한쪽 구획이 비면 그 구획은 머리글째 사라지고, 둘 다 비면 「맞는 이름이 없어요」다. 칸이 비어 있으면 거르지 않는다
- 「더 보기」 표시 여부 — 검색 중이 아니고 접힌 줄이 하나라도 있을 때만
- 빈 상태 판정 — 받은 행이 0이면 빈 상태고 검색 칸도 없다
- 역할 버튼 잠금 — 관리자가 하나뿐이고 연 사람이 그 관리자면 잠긴다. 연 사람이 나인지는 게이트가 주는 `profileId`([AC-10](#ac-10))로 안다
- 표기 — 퇴사한 날과 시트의 퇴사 안내는 `2026년 6월 30일`(연도가 붙는다, Asia/Seoul로 바꿔 그린다), 생년월일은 `1993년 4월 21일`, 성별은 `female`·`male`을 「여성」·「남성」으로([login.md](../../2-design/modules/account/screens/login.md#프로필-작성-문안)의 굳은 글 표기와 같다 — 이 화면 문서에는 성별 값의 표기가 없어 같은 영역의 표기를 따른다), 연락처는 저장된 `010-0000-0001` 그대로다

전부 unit 테스트가 든다.

### AC-04

**목록이 문서대로 선다.** `src/app/admin/members/page.tsx`가 `src/screens/members/ui/members-screen.tsx`(이름은 구현이 정한다)에 위임한다.

- 짜임 순서: 앱바(뒤로 → `/admin`, 제목 「직원」) → 검색 칸(`mt-2`, 자리표시 「이름으로 찾기」, Input `rounded-md` `p-3`) → 재직자 목록(`mt-4`) → 퇴사 구획(가는 선 `my-4`, 머리글 「퇴사」 `py-2` `text-xs font-medium` `fg.neutral-subtle`, 줄, 「더 보기」). 화면 좌우 `px-6`. 색·글자·여백은 [색](../../2-design/modules/account/screens/members.md#색)·[글자](../../2-design/modules/account/screens/members.md#글자)·[여백과 모양](../../2-design/modules/account/screens/members.md#여백과-모양) 표 그대로
- 재직자 줄은 ListRow — 왼쪽 사진 40px 원, 제목 이름 `text-base font-medium`, 관리자면 제목 뒤 `gap-2`에 Badge brand 「관리자」, 보조 정보 연락처 `text-sm` `tabular-nums`, 오른쪽 화살표. `py-4`. 「님」이 없다
- 퇴사 줄은 ListRow — 사진 투명도 60%, 이름은 `fg.neutral` 그대로, 오른쪽 값 퇴사한 날 `text-sm` `tabular-nums` `fg.neutral-subtle`, 화살표. 연락처를 안 그린다. 비워진 사람은 사진 자리가 빈 면이다
- 「더 보기」는 [Button](../../2-design/design-system/components.md#button)의 「목록을 접는 더 보기」 — ghost, 목록 폭, `text-sm`. 누르면 접힌 줄이 그 자리에 펼쳐지고 버튼은 사라진다
- 퇴사한 사람이 한 명도 없으면 구획이 통째로 없다 — 가는 선도 머리글도 없다
- 검색 중 두 구획이 다 비면 목록 자리에 [빈 상태](../../2-design/design-system/components.md#빈-상태)의 제목만 — 「맞는 이름이 없어요」, 아래 줄과 버튼 없음. 되돌리는 길은 칸을 비우는 것뿐이다
- 아직 승인된 사람이 없으면 빈 상태 제목 「아직 승인된 사람이 없어요」와 아래 줄 「가입을 승인하면 여기 서요」, 검색 칸이 없다
- 목록에 primary 버튼이 없다. brand는 관리자 배지뿐이다
- 사진이 없는 사람은 가입 대기와 같은 이니셜 원이다 — 이 화면 문서에는 없고 [members-pending.md](../../2-design/modules/account/screens/members-pending.md#값이-빈-자리)가 「목록 줄에서도 같다」고 정한 조각을 그대로 쓴다
- 첫 진입에 캐시가 없으면 스켈레톤이다([로딩](../../2-design/system/runtime.md#로딩)). 조각이 `components.md`에 없어 가입 대기 plan이 화면 안에 둔 목록 덩이를 이 화면이 둘째로 쓰며 `src/shared/ui/`로 올린다 — 그 plan이 「둘째 화면이 나오면 올린다」고 적은 자리다. 가입 대기가 아직이면 같은 식으로 이 화면 안에 둔다
- 등장 모션이 없다. 퇴사 처리·되돌리기 뒤 줄이 옮겨갈 때 화면 사이를 날아가지 않는다 — 위에서 사라지고 아래에 나타난다

### AC-05

**사람 시트가 선다.** 재직자 줄을 누르면 [바텀시트](../../2-design/design-system/components.md#dialog와-바텀시트)가 `--duration-slow`로 올라온다. 시트는 history에 든다 — `pushState`고 브라우저 뒤로가 시트를 닫으며 화면을 떠나지 않는다([navigation.md](../../2-design/system/navigation.md#뒤로)의 「시트는 history에 든다」).

- 짜임 순서: 사진 56px 원과 이름 `text-lg font-semibold`(관리자면 배지가 이름 뒤) → 프로필 넷(연락처·성별·생년월일·시급, 이름표 `text-sm` `fg.neutral-muted`, 값 `text-base` `fg.neutral`, 줄 `py-3`) → `mt-6` → 「이름 고치기」 → `gap-3` → 「관리자로 올리기」/「관리자에서 내리기」 → 더보기. 시트 안쪽 `p-6`, 위쪽만 `rounded-lg`. 오른쪽 위에 더보기(⋯)
- 연락처는 오른쪽에 수화기(`fg.neutral`)가 서고 누르면 `tel:` 링크로 전화가 걸린다. 성별·생년월일은 값만이고 아무 버튼도 없다. 시급 줄은 payroll이 붙일 때까지 없다 — [AC-11](#ac-11)
- 버튼 셋(이름 고치기·역할 바꾸기·더보기)은 다 secondary고 전폭이다. 시트를 처음 열었을 때 primary가 없다
- 역할 버튼 라벨은 지금 역할이 근무자면 「관리자로 올리기」, 관리자면 「관리자에서 내리기」다. 마지막 관리자면 버튼이 비활성(회색)이고 아래에 「관리자가 한 명뿐이라 내릴 수 없어요」 `text-xs` `fg.neutral-subtle`
- 더보기를 누르면 [더보기 팝오버](../../2-design/design-system/components.md#더보기-팝오버)가 아이콘 바로 아래 오른쪽 끝을 맞춰 열리고 항목은 「퇴사 처리」 하나다. 글자는 `fg.neutral`이다 — 빨갛지 않다. 덮개가 없고 밖을 누르면 닫히고 등장 모션이 없다

### AC-06

**이름 고치기.** 「이름 고치기」를 누르면 새 시트를 겹치지 않고 시트 안쪽이 입력으로 바뀐다.

- 짜임: 제목 「이름」 → Input에 지금 이름이 채워져 있다 → 아래 줄 「지난 근무표와 급여에 뜨는 이름도 같이 바뀌어요」 → 하단 버튼 둘 「뒤로」(secondary)·「저장」(primary). 시트에서 primary가 서는 유일한 때다
- 다듬은 값이 빈 칸이거나 지금 이름 그대로면 「저장」이 안 눌린다. 같은 이름 둘을 안 막는다([ACC-009](../../2-design/modules/account/README.md#acc-009))
- 관리자가 자기 줄을 열어도 「이름 고치기」가 있다([ACC-009](../../2-design/modules/account/README.md#acc-009)) — 잠그는 것은 근무자의 「나」 화면이다
- 「저장」 → `set_display_name`. **응답을 기다린다** — 보내는 동안 「저장」이 글자 자리에 스피너를 물고 입력과 「뒤로」가 잠긴다. 성공하면 토스트 「이름을 바꿨어요」와 무효화 — `['profile']`·`['members']`·`['schedule']`([이름 고치기](../../2-design/modules/account/design.md#이름-고치기))에 `['payroll']`을 더한다([무효화 표](../../2-design/system/runtime.md#무효화-표)의 「`['schedule']`을 무효화하는 함수는 `['payroll']`도」). 실패하면 입력이 그대로 남고 오류가 시트 안에 선다 — `TransportError`면 「보내지 못했어요. 다시 시도해주세요」, `invalid_name`이면 버튼이 잘못 켜진 것이라 새로 읽는다([members.md](../../2-design/modules/account/screens/members.md#이름-고치기))
- 「뒤로」는 값을 버리고 시트의 원래 모습으로 돌아간다

### AC-07

**관리자로 올리기·내리기.** 버튼을 누르면 가운데 [Dialog](../../2-design/design-system/components.md#dialog와-바텀시트) 하나다 — 시트를 쌓지 않는다.

- 제목·본문은 [사람 시트 문안](../../2-design/modules/account/screens/members.md#사람-시트-문안) 표 — 「관리자로 올릴까요?」/「근무표와 급여와 다른 사람의 프로필을 모두 볼 수 있게 돼요」, 「관리자에서 내릴까요?」/「관리자 화면에 못 들어가고 자기 근무만 보게 돼요」. 왼쪽 「닫기」 secondary, 오른쪽은 「올리기」·「내리기」 secondary다([사람 시트 문안](../../2-design/modules/account/screens/members.md#사람-시트-문안) 표)
- 확인 → `set_role`. 응답을 기다린다 — 버튼이 글자 자리에 스피너를 물고 잠긴다([design.md](../../2-design/modules/account/design.md#프로필-제출연락처사진)의 「남에게 닿는다」). 성공하면 Dialog와 시트가 닫히고 토스트 「관리자로 올렸어요」/「관리자에서 내렸어요」, `['members']` 무효화. 목록의 그 줄 배지가 붙거나 빠진다
- 내린 사람이 나면 `['profile']`을 무효화하고 그 자리에서 `/`로 간다([members.md](../../2-design/modules/account/screens/members.md#화면-상태와-흐름)). 남이 나를 내렸을 때는 아무것도 안 한다 — 내 기기는 다음 진입이나 탭 복귀에 `['profile']`을 읽고 옮긴다
- `DomainError` `last_admin` → Dialog를 닫고 `['members']`를 무효화한다. 다시 읽힌 목록으로 [AC-03](#ac-03)의 잠금 판정이 돌아 버튼이 잠기고 안내 줄이 선다 — 둘이 동시에 다른 관리자를 내렸을 때다. `not_allowed` → 같은 처리(버튼이 잘못 켜진 것, 새로 읽기). `TransportError` → Dialog를 열어둔 채 「보내지 못했어요. 다시 시도해주세요」

### AC-08

**퇴사 처리 — 배정이 없으면.** 더보기의 「퇴사 처리」를 누르면 가운데 Dialog다.

- 제목 「퇴사 처리할까요?」, 본문 「근무표와 근무 신청이 닫히고 지난 급여만 볼 수 있어요」, 왼쪽 「닫기」, 오른쪽 「퇴사 처리」 secondary — destructive가 아니다
- 「퇴사 처리」 → `mark_leave`. 응답을 기다린다. 성공하면 Dialog와 시트가 닫히고 그 줄이 재직자 목록에서 빠져 퇴사 구획 맨 위에 선다(퇴사한 날 늦은 순). 퇴사 구획이 없던 화면이면 그때 가는 선·머리글이 생긴다. 토스트 「퇴사 처리했어요」, `['members']` 무효화. 그 사람에게 푸시가 안 간다
- `already_done`은 성공으로 처리한다. `not_allowed` → 시트를 닫고 새로 읽기. `TransportError` → Dialog를 열어둔 채 「보내지 못했어요. 다시 시도해주세요」
- 「배정이 남아 있으면」 갈래는 [AC-11](#ac-11)이다. 그때까지 이 Dialog는 배정을 안 묻는다

### AC-09

**퇴사한 사람 시트와 되돌리기.** 퇴사 구획의 줄을 누르면 재직자 시트와 같은 틀이 올라온다.

- 다른 것 셋 — 이름 아래에 「2026년 6월 30일에 퇴사했어요」가 선다, 「이름 고치기」와 역할 버튼이 없다, 더보기 항목이 「퇴사 되돌리기」다. 프로필 넷은 그대로 선다(시급은 [AC-11](#ac-11))
- 「퇴사 되돌리기」 → Dialog 「퇴사를 되돌릴까요?」/「다시 근무표에 배정할 수 있게 돼요」, 「닫기」·「되돌리기」(secondary). 확인 → `undo_leave`. 응답을 기다린다. 성공하면 시트가 닫히고 그 줄이 퇴사 구획에서 빠져 재직자 목록의 가나다 자리로 돌아온다. 토스트 「퇴사를 되돌렸어요」, `['members']` 무효화. 시한이 없다 — 비워지기 전까지 아무 때나 된다
- 비워진 사람(`erased_at`이 있다)의 시트는 이름과 퇴사 안내, 그 아래 「1년이 지나 연락처와 사진은 지웠어요」뿐이다. 프로필 넷이 없고 사진 자리가 빈 면이고 더보기가 없다
- 오류 처리는 [AC-08](#ac-08)과 같다

### AC-10

**관리자 경로 보호와 게이트 확장.** 가입 대기 task가 먼저 만들면 그것을 쓴다.

- `useAuthGateValue()`가 `role`과 `profileId`를 더 준다. `get-my-profile.ts`가 `role`·`id`를 이미 읽으니 컨텍스트에 싣기만 한다. profile-form AC-05가 넓히는 컨텍스트(`userId`·프로필 행)와 같은 자리다 — 먼저 merge된 쪽 위에 얹는다
- `resolveGateMove`가 `/admin` 아래를 「관리자만」으로 가른다 — 승인된 근무자가 `/admin/members`를 열면 `/`로 보낸다([navigation.md](../../2-design/system/navigation.md#경로)의 「근무자가 열면 `/`로 보낸다」). 판정은 `.ts`고 unit 테스트가 든다. `proxy`는 안 건드린다 — 세션 유무만 보는 것이 [runtime.md](../../2-design/system/runtime.md#캐시-네-계층)의 결정이다

### AC-11

**선행이 갈린 자리 셋.** 이 task의 PR에 들어오지 않는다. 각각 그 선행이 서는 task의 plan이 이 절을 잇는다.

- **남은 배정 검사와 막는 Dialog — `schedule` 뒤.** `mark_leave`가 살아 있는 `assignments`(`ended_at is null`) 중 `days.work_date`가 오늘(`(now() at time zone 'Asia/Seoul')::date`) 이후인 행이 있으면 `has_future_assignments`를 던진다. 화면은 버튼을 누르기 전에 그 목록을 읽어 두고([오류의 모양](../../2-design/system/data-access.md#오류의-모양) — 「목록이 필요한 자리는 버튼을 누르기 전에 화면이 읽어둔다」) 있으면 [배정이 남아 있으면 — 막는다](../../2-design/modules/account/screens/members.md#배정이-남아-있으면--막는다)의 Dialog — 제목 「앞으로 배정된 근무가 남아 있어요」, 본문에 날짜와 자리 셋까지와 「외 n건」, 아래 줄, 버튼 하나 「근무표로 가기」 → 가장 가까운 배정 날의 `/admin/schedule?date=&from=members`. 그때 `error-codes.ts`에 `has_future_assignments`가 든다. 그 전까지 [ACC-010](../../2-design/modules/account/README.md#acc-010)은 「배정이 있을 수 없다」로 참이다
- **시급 값 — `payroll` 뒤.** 사람 시트의 시급 줄 값은 `wage_rates`의 살아 있는 행이고 `12,000원` 꼴이다([wages.md](../../2-design/modules/payroll/screens/wages.md#사람-시트)). 퇴사한 사람도 그때 값이 그대로 선다. **그 전까지 시급 줄이 아예 없다** — 붙이는 것은 payroll 쪽이다([members.md](../../2-design/modules/account/screens/members.md#사람-시트-짜임)). 시트의 프로필은 그때까지 셋이다
- **비우기 — 별도 task.** `erase_profiles`(pg_cron, `internal`)와 Edge Function `erase-account`는 [비우기](../../2-design/modules/account/design.md#비우기)의 것이고 이 화면은 `erased_at`을 읽기만 한다. backlog의 `profile-erasure` 행이 그 자리고 `edge-function-import` 스파이크 뒤다. 그때까지 「비워진 사람」은 테스트 헬퍼가 `erased_at`을 찍고 `profile_private` 행을 지워 만든다

### AC-12

**공용 UI가 는다.** `src/shared/ui/`에 [components.md](../../2-design/design-system/components.md) 토큰대로. 가입 대기 task가 먼저 만든 것은 그대로 쓴다.

- 두 화면이 같이 쓰는 것 — ListRow(`list-row.tsx`), 앱바(`app-bar.tsx`), 바텀시트(`sheet.tsx`), 토스트(`toast.tsx` — 성공·안내 둘, 알약, 화면 아래 56px), 더보기 팝오버(`dropdown-menu.tsx`), 빈 상태(`empty-state.tsx`), 이니셜 원(`avatar.tsx`)
- 이 화면이 첫 자리인 것 — Badge(brand, `badge.tsx`), 가운데 Dialog(`dialog.tsx` — 좌우 32px, `shadow-pop`, 버튼 둘 같은 폭), 「목록을 접는 더 보기」(Button ghost의 쓰임이라 파일이 따로 없다)
- profile-form이 만드는 것 — Input, 스피너, `DomainError`·`TransportError`

`src/shared/ui/`는 unit 훅 면제고 e2e가 덮는다. 시트가 history에 드는 것(`pushState`·`popstate`로 닫기)은 바텀시트 조각의 책임이다 — 가입 대기가 먼저 만들었는데 그 동작이 없으면 여기서 더한다.

### AC-13

**테스트.**

- unit: AC-03의 가르기·정렬·검색·「더 보기」 여부·빈 상태·잠금·표기, AC-10의 `/admin` 판정, 쓰기 dal의 오류 가르기(`last_admin` → `DomainError`, 통신 실패 → `TransportError`), 코드 목록 대조(`tests/lint/`)
- integration(로컬 Supabase): 함수 넷의 관리자 검사(근무자가 부르면 `not_allowed`), `set_display_name`의 값 반영과 `invalid_name`, `set_role`의 올리기·내리기·`invalid_role`·`last_admin`(관리자 하나일 때 자기를 내린다)·관리자 둘일 때 자기를 내리면 통과·퇴사자에게 부르면 `not_allowed`·퇴사한 관리자는 셈에 안 들어 남은 하나를 내리면 `last_admin`, `mark_leave`의 `left_at`과 두 번 부르면 `already_done`과 마지막 관리자면 `last_admin`, `undo_leave`의 `left_at` 비움과 비워진 사람이면 `not_allowed`, `get-members`(관리자는 `profile_private`가 오고 근무자는 `null`, 차단된 사람은 없고, 비워진 사람은 임베딩이 `null`). 헬퍼 `createErasedUser`(`left_at`·`erased_at`을 찍고 `profile_private` 행을 지운다)를 `tests/integration/postgres.ts`에 더한다
- e2e(`tests/e2e/members.spec.ts`): 관리자가 `/admin/members`를 열면 재직자 줄과 배지가 보이고 검색 칸에 치면 맞는 줄만 남는다; 줄을 눌러 이름을 고치면 목록의 이름이 바뀐다(DB `display_name`); 「관리자로 올리기」를 확인하면 배지가 붙는다; 더보기의 「퇴사 처리」를 확인하면 줄이 퇴사 구획으로 옮겨가고 「퇴사 되돌리기」로 돌아온다(DB `left_at`); 비워진 사람이 있으면 「더 보기」가 서고 누르면 펼쳐진다; 근무자가 `/admin/members`를 열면 `/`로 간다. 시드는 `createAdminUser`·`createApprovedUser`·`createLeftUser`·`createErasedUser`다

### AC-14

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·`pnpm build && pnpm e2e` 전부 초록. 시안 `members.sian.html`이 문서와 맞는지 `sian-auditor`가 본다 — backlog의 `popover-dark-ring`(시안이 든 팝오버 다크 ring)이 이 화면에 닿으니 그때 같이 잡는다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/20260825162027_profiles.sql` | `set_display_name`·`set_role`·`mark_leave`·`undo_leave` | AC-01 |
| `src/shared/api/error-codes.ts` | `last_admin`·`invalid_name`·`invalid_role`·`already_done` 추가 | AC-01 |
| `src/entities/profile/dals/get-members.ts`·`set-display-name.ts`·`set-role.ts`·`mark-leave.ts`·`undo-leave.ts`·`__tests__/*.integration.test.ts` | 읽기 하나, 쓰기 넷 | AC-02·AC-13 |
| `src/screens/members/model/*.ts`·`__tests__/` | 가르기·정렬·검색·잠금·표기 | AC-03 |
| `src/features/members/*.ts`·`__tests__/` | `['members']` query, 이름·역할·퇴사·되돌리기 mutation과 무효화, 오류 판정(이름은 구현이 정한다. 가입 대기 plan이 같은 슬라이스에 둔 것과 나란히) | AC-06~AC-09 |
| `src/screens/members/ui/members-screen.tsx`·`member-sheet.tsx`(이름은 구현이 정한다) · `src/app/admin/members/page.tsx` | 목록·시트·Dialog 셋 | AC-04~AC-09 |
| `src/shared/lib/resolve-auth-destination.ts`·`__tests__/` · `src/features/auth/use-auth-gate.ts`·`ui/auth-gate.tsx`·`__tests__/` | `/admin` 관리자만, 컨텍스트에 `role`·`profileId` — 가입 대기가 먼저면 `profileId`만 더한다 | AC-10 |
| `src/shared/ui/badge.tsx`·`dialog.tsx` · (가입 대기가 아직이면) `list-row.tsx`·`app-bar.tsx`·`sheet.tsx`·`toast.tsx`·`dropdown-menu.tsx`·`empty-state.tsx`·`avatar.tsx` | 공용 UI | AC-12 |
| `tests/integration/postgres.ts` · `tests/e2e/members.spec.ts` | `createErasedUser`, e2e | AC-13 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. `profile-form`이 merge된 뒤에 시작한다 — 오류 기계와 Input이 거기서 온다.

1. 가입 대기 task의 상태를 본다. merge됐으면 그쪽이 만든 공용 UI·게이트 확장·경로 보호를 [변경 파일](#변경-파일)에서 빼고, 안 됐으면 여기서 만든다. 둘이 같은 파일을 동시에 만들면 뒤에 merge되는 쪽이 충돌을 푼다
2. `test-planner`가 AC-01~AC-10·AC-12를 층에 배정한다. 계산·판정은 unit, 함수·dal·RLS는 integration, 화면 흐름은 e2e다
3. `unit-test-writer`·`integration-test-writer`·`e2e-test-writer`가 실패 테스트를 쓴다. integration이 `createErasedUser`를 먼저 세우고 e2e가 그것을 쓴다. integration은 로컬 Supabase가 떠 있어야 실패를 확인한다 — 함수가 없어 `function ... does not exist`로 실패하는 것이 첫 빨강이다
4. `implementer`가 마이그레이션(`db reset`) → 코드 목록 → dals → 게이트·경로 보호 → model → 공용 UI → 목록 → 시트 → 이름 고치기 → 역할 Dialog → 퇴사 Dialog → 퇴사한 사람 시트·되돌리기 순으로 초록을 만든다. 게이트가 `role`·`profileId`를 줘야 화면이 잠금과 「나」를 판정하고, model이 서야 목록이 그릴 값이 생긴다
5. `sian-auditor`가 시안과 문서를 대조하고 `pnpm build && pnpm e2e`로 spec 전부를 본다
6. AC-11의 셋을 `schedule`·`payroll`·비우기 task의 plan이 잇도록 backlog 행에 적는다

배포한 적이 없어 호환 기간이 없다. 마이그레이션은 파일을 고치고 `db reset`이 되돌리기다.

## 리스크·전환·되돌리기

- **`mark_leave`가 한동안 배정을 안 본다.** `assignments` 표가 없어 검사를 넣을 수 없고, 표가 없으니 남은 배정도 있을 수 없다. `schedule` task의 마이그레이션이 이 함수를 `create or replace`로 고치며 검사를 넣고 그 integration 테스트를 같이 내야 한다 — 그 plan에 이 줄이 안 실리면 [ACC-010](../../2-design/modules/account/README.md#acc-010)이 DB에서 안 지켜진 채 근무표가 선다. backlog 행의 선행·후속에 적어 잊지 않게 한다
- **`is_admin()` 좁히기가 가입 대기 task에 있다.** 퇴사·차단된 관리자의 세션이 관리자 함수를 못 부르게 하는 것은 [members-pending plan](members-pending.md#ac-02a)이 마이그레이션에 넣는다. 그쪽이 먼저 merge되니 이 task는 좁혀진 함수 위에 선다 — 순서가 뒤집히면 여기서 넣는다
- **앱바 뒤로가 404다.** `/admin`(관리자 홈)은 `schedule` task의 화면이다. 구현이 전 영역의 설계가 끝난 뒤에 도니 그 사이가 짧다 — profile-form의 「급여 보기」와 같은 자리다. 그때까지 e2e는 직접 URL로 들어간다
- **가입 대기와 같은 파일을 만든다.** 공용 UI·게이트·경로 보호가 겹친다. 구현 순서 1이 그것을 가른다. 두 브랜치가 같이 열려 있으면 `pr-diff`가 `src/shared/ui/`의 중복 파일을 본다
- **`localeCompare`의 가나다순이 환경마다 다를 수 있다.** Node와 브라우저의 ICU가 달라 unit이 통과해도 화면 순서가 다를 수 있다. e2e가 이름 셋의 순서를 한 번 본다
- **비워진 사람이 실제로는 안 생긴다.** `erase_profiles`가 없어 배포 뒤 1년이 지나도 `erased_at`이 안 찍힌다. 「더 보기」·비워진 시트는 테스트 시드로만 서고, 비우기 task가 서기 전까지 실제 화면에는 안 나온다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 근무자가 함수를 부른다, 마지막 관리자가 내려간다, 비워진 사람이 되돌아간다 | integration `src/entities/profile/dals/__tests__/set-role.integration.test.ts`·`mark-leave.integration.test.ts`·`undo-leave.integration.test.ts`·`set-display-name.integration.test.ts`(예정) | `pnpm test:integration:run`, 로컬 Supabase | `not_allowed`·`last_admin`·`invalid_role`·`invalid_name`·`already_done`, 값 반영 |
| AC-01 | 코드 목록과 마이그레이션이 어긋난다 | unit `tests/lint/error-codes.test.ts`(profile-form이 만든다) | `pnpm test` | 네 코드가 양쪽에 있다 |
| AC-02 | 근무자에게 연락처가 샌다, 차단된 사람이 목록에 든다 | integration `src/entities/profile/dals/__tests__/get-members.integration.test.ts`(예정) | `pnpm test:integration:run` | 관리자는 `profile_private`가 오고 근무자는 `null`, 차단·비워진 사람 처리 |
| AC-03 | 정렬·검색·접힘·잠금 판정이 틀린다 | unit `src/screens/members/model/__tests__/`(예정) | `pnpm test` | 가나다순, 늦은 순, 접힌 줄 검색, 관리자 하나일 때 잠금, 표기 |
| AC-04·AC-05·AC-06·AC-07·AC-08·AC-09 | 화면 흐름이 끊긴다, 쓰기 뒤 목록이 안 바뀐다 | e2e `tests/e2e/members.spec.ts`(예정) | `pnpm build && pnpm e2e`, 로컬 Supabase | 줄·배지·검색·이름 고치기·올리기·퇴사 처리·되돌리기·「더 보기」 |
| AC-10 | 근무자가 `/admin/members`를 연다 | unit `src/shared/lib/__tests__/resolve-auth-destination.test.ts` + e2e 위 spec | `pnpm test`, `pnpm e2e` | `/`로 간다 |
| AC-12 | 조각이 화면에 안 선다, 브라우저 뒤로가 시트를 안 닫는다 | e2e 위 spec | 위와 같다 | 시트가 열리고 `goBack`에 닫히며 URL이 그대로다 |
| AC-14 | 시안이 문서와 어긋난다 | `sian-auditor` | — | 어긋남 없음 |

- 배정하지 않은 것: `tel:` 링크가 실제로 전화를 거는지 — 브라우저가 하는 일이라 링크의 `href`만 e2e가 본다. 사진 투명도 60%·토큰 값 — `sian-auditor`와 디자인 값 lint가 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 남은 배정 검사와 막는 Dialog, 「근무표로 가기」 — [AC-11](#ac-11), `schedule` 뒤
- 시급 값 — [AC-11](#ac-11), `payroll` 뒤
- `erase_profiles`·`erase-account` — 비우기 task
- 관리자 홈 `/admin` — `schedule` task
- 가입 승인·거절·차단 — `members-pending`
- 계정 잇기·손으로 프로필 지우기 — 1차 밖([members.md](../../2-design/modules/account/screens/members.md#안-담은-것))
- 타입 생성(`pnpm types`) — `types-generation`

