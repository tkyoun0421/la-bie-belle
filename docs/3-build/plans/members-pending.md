---
sources:
  - ../../2-design/modules/account/screens/members-pending.md
  - ../../2-design/modules/account/design.md#가입-승인거절차단해제
  - ../../2-design/modules/account/design.md#차단
  - ../../2-design/modules/account/design.md#소유-데이터
  - ../../2-design/modules/account/screens/login.md#거절된-뒤-다시-보낼-때
  - ../../2-design/design-system/writing.md#숫자와-단위
  - ../../2-design/modules/account/README.md#acc-001
  - ../../2-design/modules/account/README.md#acc-007
  - ../../2-design/modules/account/README.md#상태-전이
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/navigation.md#뒤로
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/runtime.md#tanstack-query-규칙
  - ../../2-design/design-system/components.md#listrow
  - ../../2-design/design-system/components.md#더보기-팝오버
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/design-system/components.md#토스트
  - ../../2-design/design-system/components.md#빈-상태
  - ../../2-design/modules/notification/README.md#ntf-031
  - ../../2-design/modules/notification/README.md#ntf-032
---

# 가입 대기 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [members-pending.md](../../2-design/modules/account/screens/members-pending.md) 전부다 — 목록·상세 시트·거절과 차단 확인·끝난 뒤·차단한 사람의 상태 표, 짜임과 토큰, 문안, 모션. 쓰기 함수는 [design.md](../../2-design/modules/account/design.md#가입-승인거절차단해제)의 `approve_member`·`reject_member`·`block_member`·`unblock_member`고, 응답을 기다리며 무효화 키는 `approve_member`가 `['members']` `['payroll']`, 나머지 셋이 `['members']`다. 차단이 `blocked_at`인 것은 [차단](../../2-design/modules/account/design.md#차단), 목록에 뜨는 조건은 [ACC-001](../../2-design/modules/account/README.md#acc-001), 거절과 차단의 차이는 [ACC-007](../../2-design/modules/account/README.md#acc-007), 허용 전이는 [상태 전이](../../2-design/modules/account/README.md#상태-전이)다. 경로 `/admin/members/pending`과 「`/admin` 아래는 관리자만이다. 근무자가 열면 `/`로 보낸다」는 [navigation.md](../../2-design/system/navigation.md#경로), 앱바 뒤로가 `/admin`으로 가는 명시 이동인 것과 시트가 history에 드는 것은 [뒤로](../../2-design/system/navigation.md#뒤로)다. 함수 실패는 [data-access.md](../../2-design/system/data-access.md#오류의-모양)의 `DomainError`·`TransportError`고, 캐시 키와 다시 읽는 때는 [runtime.md](../../2-design/system/runtime.md#tanstack-query-규칙)다. 조각은 [components.md](../../2-design/design-system/components.md)의 앱바·ListRow·더보기 팝오버·Dialog와 바텀시트·토스트·빈 상태다.

역할을 가르는 것은 서버가 아니라 클라이언트다. `proxy`는 세션 쿠키만 보고, 승인·차단·퇴사와 역할은 앱이 뜬 뒤 `['profile']`을 읽어 가른다([runtime.md](../../2-design/system/runtime.md#캐시-두-계층)·[design.md](../../2-design/modules/account/design.md#첫-진입과-게이트)). 이 화면의 「관리자만」도 같은 자리다 — `['profile']` 행의 `role`을 게이트가 읽어 근무자를 `/`로 보낸다. 데이터는 함수의 `is_admin()`이 막는다.

푸시는 이 task에서 안 나간다. 새 신청이 들어와도 관리자에게 안 가고([NTF-032](../../2-design/modules/notification/README.md#ntf-032)), 거절도 안 간다([NTF-031](../../2-design/modules/notification/README.md#ntf-031)). 승인만 그 사람에게 가는데([notification/README.md](../../2-design/modules/notification/README.md#ntf-006)) 그 알림 행은 `approve_member`가 같은 트랜잭션에서 `notifications`에 넣는 것이고([notification/design.md](../../2-design/modules/notification/design.md#누가-넣나)), 그 표와 전송 얼개는 `notification-first`가 세운다. 그래서 여기서는 승인 함수에 알림 줄이 없고 `notification-first`가 이 함수를 다시 열어 더한다 — `wage_rates` 첫 행을 급여 task에 미룬 [account-data plan](account-data.md)과 같은 결이다.

지금 코드는 이렇다. 마이그레이션 `supabase/migrations/20260825162027_profiles.sql`에 `approve_member`·`reject_member`가 있고 `src/entities/profile/dals/__tests__/approve-member.integration.test.ts`·`reject-member.integration.test.ts`가 관리자 검사·`already_approved`·`rejected_at` 비우기를 본다. `block_member`·`unblock_member`는 없다 — [account-data plan](account-data.md)이 「함수는 그 화면을 그리는 task가 만든다」고 넘긴 자리가 여기다. `approve_member`는 `approved_at is null`인 행만 갱신하고 이미 처리된 행이면 조용히 0행이다. `is_admin()`·`is_approved()`는 `approved_at`만 보고 `left_at`·`blocked_at`을 안 본다 — [data-access.md](../../2-design/system/data-access.md#쓰기)가 둘을 좁혔으니 이 task가 고친다. `profile_private`에 `email` 열이 없고 `ensure_profile()`이 그것을 안 채운다. `src/entities/profile/dals/`에는 `ensure-profile.ts`·`get-my-profile.ts` 둘뿐이고 대기 목록·차단 목록을 읽는 dal도, 함수 넷을 부르는 dal도 없다. `src/app/`에 `admin/`이 없고 `src/screens/`에는 `login`·`pending`·`left`·`blocked`뿐이다. 게이트(`src/shared/lib/resolve-auth-destination.ts`·`src/features/auth/use-auth-gate.ts`)는 `approvedAt`·`blockedAt`·`leftAt` 셋만 보고 `role`을 모른다 — 승인된 근무자가 `/admin/members/pending`을 열면 `resolveGateMove`가 `null`을 돌려줘 그대로 선다. `getMyProfile`은 `role`을 이미 읽는다. `src/shared/ui/`에는 Button·Card뿐이고 앱바·ListRow·바텀시트·더보기 팝오버·토스트·빈 상태·이니셜 원이 없다. `tests/integration/postgres.ts`에 `createAdminUser`·`createBlockedUser`가 있고 「프로필을 보낸 사용자」 헬퍼는 없다. `tests/e2e/`에 관리자 화면 spec이 없다.

선행은 [profile-form](profile-form.md)이다. 오류 기계 `src/shared/api/error-codes.ts`·`errors.ts`와 마이그레이션 대조 테스트([AC-01](profile-form.md#ac-01)), 게이트 컨텍스트가 주는 프로필 행([AC-05](profile-form.md#ac-05)), 스피너([AC-11](profile-form.md#ac-11))를 여기서 다시 만들지 않고 쓴다. 대기 목록에 사람이 서려면 프로필을 보내는 화면이 먼저 있어야 하기도 하다.

확인한 코드와 Git 기준점 — 위 파일들이 `5615cb2`(#365).

## 완료 조건

### AC-01

**함수 둘이 는다.** 배포한 적이 없어 마이그레이션 파일 `20260825162027_profiles.sql`을 고친다.

- `block_member(profile_id uuid)` — 첫 줄이 `is_admin()` 검사고 아니면 `not_allowed`. `blocked_at = now()`를 찍는다
- `unblock_member(profile_id uuid)` — 같은 검사. `blocked_at`을 비운다
- 둘 다 `security definer`, `set search_path = ''`, 표는 `public.profiles`로 부른다([함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙))
- `unblock_member`는 `blocked_at`과 `submitted_at`을 같이 비운다([design.md](../../2-design/modules/account/design.md#가입-승인거절차단해제)). 풀린 사람이 다음에 앱을 열면 프로필 작성이 지난 값을 들고 선 모습이고, 보내야 대기 목록에 다시 뜬다([login.md](../../2-design/modules/account/screens/login.md#거절된-뒤-다시-보낼-때))

### AC-02

**이미 처리된 사람을 함수가 거른다.** `approve_member`·`reject_member`·`block_member`는 대상이 더는 「제출됨」(`submitted_at`이 있고 `approved_at`·`rejected_at`·`blocked_at`이 없다)이 아니면 `already_decided`를 던진다 — 둘이 같은 사람을 동시에 열었을 때 늦게 누른 쪽이 받는 신호다([끝난 뒤](../../2-design/modules/account/screens/members-pending.md#끝난-뒤)·[data-access.md](../../2-design/system/data-access.md#오류의-모양)). 지금은 `approve_member`가 0행으로 조용히 끝나 화면이 성공으로 읽는다.

- `reject_member`의 기존 `already_approved`는 `already_decided`로 합친다. 코드가 하나면 화면의 판정도 하나다
- `error-codes.ts` 목록에 `already_decided`가 들고 마이그레이션 대조 테스트가 따라간다

### AC-02a

**퇴사하거나 차단된 관리자가 관리자 함수를 못 부른다.** `is_admin()`·`is_approved()`가 `left_at`·`blocked_at`이 비어 있을 때만 참이다([data-access.md](../../2-design/system/data-access.md#쓰기)). 지금은 `approved_at`만 본다. 관리자 함수를 처음 여럿 쓰는 자리가 이 화면이라 여기서 고친다 — 화면은 `['profile']`이 그 값을 든 순간 사람을 게이트 밖으로 옮기지만, 세션을 들고 있는 동안의 호출은 표가 막아야 한다.

### AC-02b

**상세 시트의 「구글 계정」이 표에서 온다.** `profile_private`에 `email` 열이 들고 `ensure_profile()`이 `auth.users`에서 옮겨 적는다([design.md](../../2-design/modules/account/design.md#소유-데이터)). 관리자는 `auth.users`를 못 읽어서다. 이미 프로필이 있는 사람도 다음 진입에 채워지도록 `ensure_profile()`이 빈 `email`을 만나면 갱신한다.

### AC-03

**dals가 여섯 는다.** `src/entities/profile/dals/`에.

- `get-pending-members.ts` — `['members', 'pending']`. `profiles`에서 `submitted_at is not null`·`approved_at is null`·`rejected_at is null`·`blocked_at is null`인 행을 `submitted_at` 오름차순으로 읽는다(오래 기다린 사람이 위). `profile_private(email, phone, birth_date, gender)`를 PostgREST 임베딩으로 같이 받는다 — 관리자만 그 행이 실린다([개인정보는 표를 가른다](../../2-design/modules/account/design.md#개인정보는-표를-가른다)). 열은 `id`·`display_name`·`photo_url`·`submitted_at`
- `get-blocked-members.ts` — `['members', 'blocked']`([design.md](../../2-design/modules/account/design.md#소유-데이터)의 키 목록). `blocked_at is not null`인 행을 `blocked_at` 내림차순으로. 열은 `id`·`display_name`·`photo_url`·`blocked_at`
- `approve-member.ts`·`reject-member.ts`·`block-member.ts`·`unblock-member.ts` — `rpc()` 하나씩. 실패를 `DomainError`·`TransportError`로 가른다
- 상세 시트의 「구글 계정」은 `profile_private.email`이다(AC-02b) — 대기 목록의 임베딩에 같이 실린다

### AC-04

**게이트가 역할을 가른다.** `resolveGateMove`가 `/admin` 아래 경로에서 `role`이 `admin`이 아니면 `/`를 돌려준다. 승인 전·차단·퇴사는 지금처럼 각자의 게이트 경로다. `ProfileStanding`에 `role`이 들고, `useAuthGateValue()`가 주는 프로필 행에 `role`이 없으면 더한다. 판정은 `.ts`고 unit 테스트가 관리자·근무자·`/admin` 밖 경로 셋을 본다.

### AC-05

**경로가 선다.** `src/app/admin/members/pending/page.tsx`가 `src/screens/members-pending/ui/`의 화면을 위임한다. 앱바 뒤로는 `/admin`으로 가는 명시 이동이다 — `history.back()`이 아니다([뒤로](../../2-design/system/navigation.md#뒤로)). `/admin`은 근무표 task가 세울 때까지 404다 — [리스크](#리스크전환되돌리기).

### AC-06

**목록이 문서대로 선다.** [목록 짜임](../../2-design/modules/account/screens/members-pending.md#목록-짜임)이다.

- 앱바(뒤로·제목 「가입 대기」·오른쪽 더보기) → ListRow 여럿. 하단 버튼 없음, 찾기 없음, 체크박스 없음
- 줄은 [줄 하나](../../2-design/modules/account/screens/members-pending.md#줄-하나) 표 — 사진(`size-10` 원, 없으면 회색 원에 이름 첫 글자), 이름 `text-base font-medium`, 보조 정보 `text-sm`, 오른쪽 화살표. 구분선은 이름 왼쪽 끝부터. 색·글자·여백은 [목록 색](../../2-design/modules/account/screens/members-pending.md#목록-색)·[글자](../../2-design/modules/account/screens/members-pending.md#목록-글자)·[여백과 모양](../../2-design/modules/account/screens/members-pending.md#목록-여백과-모양) 표 그대로. 브랜드 색 없음
- 보조 정보는 [목록 문안](../../2-design/modules/account/screens/members-pending.md#목록-문안) — 「오늘 보냈어요」·「어제 보냈어요」·「3일 전에 보냈어요」. 단위는 [writing.md](../../2-design/design-system/writing.md#숫자와-단위)의 「지난 시간」 — 오늘·어제는 말로, 그 전은 `n일 전`(6일까지)·`n주 전`(4주까지)·`n달 전`(11달까지)·`n년 전`이다. 「오늘」은 Asia/Seoul 달력 날짜로 가른다([시각 컬럼](../../2-design/system/runtime.md#시각-컬럼))
- 더보기 팝오버에 「차단한 사람」 하나
- 빈 상태는 목록 자리에 「기다리는 사람이 없어요」 한 줄(`text-sm` `fg.neutral-subtle`, 제목 없음, 그림·버튼 없음) — [빈 상태](../../2-design/modules/account/screens/members-pending.md#빈-상태)·[components.md](../../2-design/design-system/components.md#빈-상태)
- 등장 모션 없음. 줄이 사라질 때는 오른쪽으로 밀리며 `--duration-base`, 아래 줄이 올라온다. 움직임 줄이기면 밝기만 — [목록 모션](../../2-design/modules/account/screens/members-pending.md#목록-모션)
- 첫 진입에 캐시가 없으면 스켈레톤, 있으면 옛 목록을 보이고 뒤에서 갱신([로딩](../../2-design/system/runtime.md#로딩)). 스켈레톤 조각은 `components.md`에 아직 없다 — [리스크](#리스크전환되돌리기)
- 상대 시간 문안(오늘·어제·n일 전)과 정렬은 `.ts` model이고 unit 테스트가 든다. `now`는 인자로 받는다

### AC-07

**상세 시트가 문서대로 선다.** 줄을 누르면 [바텀시트](../../2-design/design-system/components.md#dialog와-바텀시트)가 아래에서 `--duration-slow`로 올라온다. [상세 시트 짜임](../../2-design/modules/account/screens/members-pending.md#상세-시트-짜임)이다.

- 오른쪽 위 더보기 → 사진(`size-16`, 없으면 이니셜 원) → 이름(`text-xl font-semibold`) → 값 넷(성별·생년월일·연락처·구글 계정, 라벨 `text-sm` `fg.neutral-muted`, 값 `text-base`, 한 줄 `py-3`) → 보낸 시각(`text-xs` `fg.neutral-subtle`) → 버튼 둘(「거절」 secondary·「승인」 primary, 가로로 반씩, `gap-3`). 여백은 [상세 시트 여백과 모양](../../2-design/modules/account/screens/members-pending.md#상세-시트-여백과-모양) 표
- 성별은 「여성」·「남성」, 생년월일은 「1992년 3월 4일(34세)」 — 나이는 문서 예시대로 만 나이고 `tabular-nums`. 연락처는 `010-0000-0001` 꼴 그대로 `tabular-nums`. 보낸 시각은 「9월 9일(수) 21:04에 보냈어요」, Asia/Seoul
- 더보기 팝오버에 「차단하기」 하나, 글자 `fg.critical`
- 시트는 history에 든다 — 열리면 `pushState`, 안드로이드 뒤로와 iOS 가장자리 스와이프가 시트를 닫고 화면을 떠나지 않는다([뒤로](../../2-design/system/navigation.md#뒤로))
- 나이 셈·표기(성별 글자, 날짜, 시각 문안, 이니셜)는 `.ts` model이고 unit 테스트가 든다

### AC-08

**승인.** 「승인」을 누르면 확인 없이 `approve-member`를 부른다. 응답을 기다린다 — 버튼 글자 자리에 스피너, 시트 안 버튼 전부 잠김([낙관적 업데이트](../../2-design/system/runtime.md#낙관적-업데이트)). 성공하면 시트가 닫히고 성공 토스트 「{이름} 님을 승인했어요」, 줄이 오른쪽으로 밀리며 사라진다. `['members']`·`['payroll']`을 무효화한다.

### AC-09

**거절과 차단.** 「거절」이나 더보기의 「차단하기」를 누르면 시트가 새로 뜨지 않고 안쪽이 `--duration-base`로 바뀐다 — 사진과 이름은 남고 값 넷과 보낸 시각 자리에 물음이 선다. 더보기 아이콘은 감춘다. 문안은 [거절과 차단 확인 문안](../../2-design/modules/account/screens/members-pending.md#거절과-차단-확인-문안) 표 — 제목 `text-base font-medium`, 아래 줄 `text-sm` `fg.neutral-muted`, 왼쪽 「닫기」, 오른쪽 「거절」(secondary)·「차단」(destructive).

- 「닫기」는 상세 모습으로 돌아간다. 시트가 통째로 닫히지 않는다
- 「거절」 → `reject-member`, 「차단」 → `block-member`. 응답을 기다리고 성공하면 시트 닫힘·성공 토스트(「{이름} 님을 안 받았어요」·「{이름} 님을 차단했어요」)·줄이 오른쪽으로 사라짐. `['members']`를 무효화한다
- 토스트는 [components.md](../../2-design/design-system/components.md#토스트)의 알약이고 「되돌리기」가 없다. 화면 아래 56px — 탭 바도 BottomCTA도 없는 화면이다

### AC-10

**실패와 늦은 쪽.** 셋 다 같다.

- `already_decided`(`DomainError`)면 시트가 닫히고 안내 토스트 「이미 처리된 사람이에요」, `['members', 'pending']`을 다시 읽어 목록을 새로 그린다
- `not_allowed`면 버튼이 잘못 켜진 것이다 — 시트를 닫고 새로 읽는다([data-access.md](../../2-design/system/data-access.md#오류의-모양) 표)
- `TransportError`면 시트를 열어둔 채 「보내지 못했어요. 다시 시도해주세요」를 버튼 위에 세운다 — 페이지 문서가 따로 정하지 않아 [data-access.md](../../2-design/system/data-access.md#오류의-모양)의 문안이다. 재시도는 사람이 같은 버튼을 다시 누르는 것이다
- 판정(어느 오류에 시트를 닫나, 무엇을 다시 읽나)은 `.ts`고 unit 테스트가 든다

### AC-11

**차단한 사람.** 목록 앱바 더보기의 「차단한 사람」이 [차단한 사람 짜임](../../2-design/modules/account/screens/members-pending.md#차단한-사람-짜임)의 목록을 연다.

- 앱바 제목 「차단한 사람」, 줄마다 사진·이름·보조 정보, 오른쪽에 「차단 풀기」 secondary 알약. 상세 시트가 없다. 줄은 차단한 순서의 역순
- 보조 정보는 [차단한 사람 문안](../../2-design/modules/account/screens/members-pending.md#차단한-사람-문안) — 「오늘 차단했어요」·「어제 차단했어요」·「2주 전에 차단했어요」. 단위는 AC-06과 같은 [writing.md](../../2-design/design-system/writing.md#숫자와-단위) 규칙이라 같은 순수 함수를 쓴다
- 「차단 풀기」 → 확인 시트. 물음 「{이름} 님의 차단을 풀까요」·아래 줄 「다시 로그인할 수 있게 돼요」·「닫기」·「차단 풀기」(primary). 사진과 이름은 안 세운다. history에 든다
- 「차단 풀기」 → `unblock-member`. 응답을 기다리고 성공하면 시트 닫힘·성공 토스트 「{이름} 님의 차단을 풀었어요」·줄이 빠짐. `['members']`와 `['members', 'blocked']`를 무효화한다. `submitted_at`도 같이 비워지니(AC-01) 그 사람이 대기 목록에 바로 뜨지 않는다. 실패는 AC-10과 같다
- 빈 상태 「차단한 사람이 없어요」
- 경로는 `/admin/members/blocked`고 앱바 뒤로는 `/admin/members/pending`으로 가는 명시 이동이다([navigation.md](../../2-design/system/navigation.md#경로)). `src/app/admin/members/blocked/page.tsx`가 선다

### AC-12

**공용 UI가 는다.** `src/shared/ui/`에 앱바·ListRow·바텀시트·더보기 팝오버·토스트·빈 상태·이니셜 원(이름은 shadcn 관례). 이 화면이 더보기 팝오버의 첫 자리고 [직원 관리](../../2-design/modules/account/screens/members.md)가 둘째다([규칙과 부딪힌 자리](../../2-design/modules/account/screens/members-pending.md#규칙과-부딪힌-자리)). 토큰과 값은 [components.md](../../2-design/design-system/components.md)의 각 표 — 팝오버는 면 `bg.neutral`·테두리 `stroke.surface`·`shadow-pop`·최소 148px·덮개 없음·등장 모션 없음. profile-form이 앱바를 먼저 `src/shared/ui/`에 세웠으면 그것을 쓴다. `src/shared/ui/`는 unit 훅 면제고 e2e가 덮는다.

「승인」이 이 화면의 유일한 브랜드 면이다. 팝오버 다크 ring은 정본이 `none`이라 시안이 아니라 `components.md`를 따른다(backlog `popover-dark-ring`).

### AC-13

**테스트.**

- unit: AC-04의 역할 판정, AC-06의 상대 시간 함수(오늘·어제·일·주·달·해 경계 여섯), AC-07의 나이·날짜·시각·이니셜·성별 표기, AC-10의 오류 판정, dals의 오류 가르기(대역), 코드 목록 대조
- integration: `block_member`·`unblock_member`의 관리자 검사(`not_allowed`)와 `blocked_at` 찍기·비우기(해제는 `submitted_at`도 비운다), AC-02 — 관리자 둘이 같은 사람에게 승인 뒤 거절·차단 뒤 승인을 부르면 늦은 쪽이 `already_decided`를 받는다, AC-02a — 퇴사·차단된 관리자에게 `is_admin()`이 `false`고 그 세션이 `approve_member`를 부르면 `not_allowed`다, AC-02b — `ensure_profile()`이 `email`을 채우고 관리자가 대기 목록 임베딩에서 그것을 읽는다, `get-pending-members`(보낸 사람만 뜨고 로그인만 한 사람·거절된 사람·차단된 사람·승인된 사람은 안 뜬다, `submitted_at` 오름차순, 관리자에게는 `profile_private`가 실리고 승인된 근무자에게는 안 실린다), `get-blocked-members`(내림차순), 함수 뒤 `is_approved()`가 차단된 사람에게 `false`인 것(기존 `is-approved-is-admin.integration.test.ts`에 한 줄)
- e2e(`tests/e2e/members-pending.spec.ts`): 관리자(`createAdminUser` + `seedSessionForUser`)가 `/admin/members/pending`을 열면 보낸 사람 둘이 오래 기다린 순서로 보인다; 줄을 누르면 시트에 이름·값 넷(구글 계정 포함)·보낸 시각·버튼 둘이 보인다; 「승인」을 누르면 토스트가 뜨고 줄이 사라지며 DB `approved_at`이 찍힌다; 「거절」 → 확인 → 「거절」이면 `rejected_at`; 더보기 「차단하기」 → 「차단」이면 `blocked_at`이 찍히고 `/admin/members/blocked`에 뜨며 「차단 풀기」 → 확인이면 목록에서 빠지고 DB의 `blocked_at`·`submitted_at`이 둘 다 비었다; 시트가 열린 사이 다른 관리자 클라이언트가 같은 사람을 승인하면 「이미 처리된 사람이에요」가 뜨고 줄이 사라진다; 비었으면 「기다리는 사람이 없어요」; 승인된 근무자(`createApprovedUser`)가 같은 경로를 열면 `/`로 간다; 세션 없이 열면 `/login`이다. 헬퍼 「프로필을 보낸 사용자」(`createSubmittedUser` — `submit_profile`을 부른다)는 profile-form이 안 세웠으면 여기서 `tests/integration/postgres.ts` 옆에 세운다

### AC-14

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·`pnpm build && pnpm e2e` 전부 초록. `sian-auditor`가 `members-pending.sian.html`과 문서를 대조한다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/20260825162027_profiles.sql` | `block_member`·`unblock_member`, 셋의 `already_decided` 검사, `is_admin()`·`is_approved()` 좁히기, `profile_private.email`과 `ensure_profile()` | AC-01·AC-02·AC-02a·AC-02b |
| `src/shared/api/error-codes.ts` · `tests/lint/error-codes.test.ts` | `already_decided` 추가, `already_approved` 제거(profile-form이 세운 목록에) | AC-02 |
| `src/entities/profile/dals/get-pending-members.ts`·`get-blocked-members.ts`·`approve-member.ts`·`reject-member.ts`·`block-member.ts`·`unblock-member.ts`·`__tests__/*.integration.test.ts` | 읽기 둘, 쓰기 넷 | AC-03 |
| `src/shared/lib/resolve-auth-destination.ts`·`__tests__/` · `src/features/auth/use-auth-gate.ts`·`ui/auth-gate.tsx`·`__tests__/` | `role`로 `/admin` 아래를 가른다 | AC-04 |
| `src/app/admin/members/pending/page.tsx` · `src/app/admin/members/blocked/page.tsx` | 위임 | AC-05·AC-11 |
| `src/features/members/*.ts`·`__tests__/` | 대기·차단 목록 query, 승인·거절·차단·해제 mutation과 무효화, 오류 판정(이름은 구현이 정한다) | AC-08~AC-11 |
| `src/screens/members-pending/model/*.ts`·`__tests__/` · `ui/*.tsx` | 상대 시간·나이·표기·정렬, 목록·시트·확인·차단 목록 화면 | AC-06~AC-11 |
| `src/shared/ui/app-bar.tsx`·`list-row.tsx`·`sheet.tsx`·`dropdown-menu.tsx`·`toast.tsx`·`empty-state.tsx`·`avatar.tsx`(이름은 shadcn 관례) | 공용 UI | AC-12 |
| `tests/integration/postgres.ts` 또는 `supabase.ts` · `tests/e2e/members-pending.spec.ts` · `src/entities/profile/dals/__tests__/is-approved-is-admin.integration.test.ts` | 보낸 사용자 헬퍼, e2e, 차단 뒤 `is_approved()` | AC-13 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. profile-form이 merge된 뒤 시작한다 — 오류 기계·게이트 컨텍스트·스피너·보낸 사용자 헬퍼를 거기서 받는다.

1. `test-planner`가 AC-01~AC-13을 층에 배정한다. 상대 시간·나이·역할 판정·오류 판정은 unit, 함수·목록 읽기·RLS 임베딩은 integration, 화면 흐름은 e2e다
2. `unit-test-writer`·`integration-test-writer`·`e2e-test-writer`가 실패 테스트를 쓴다. integration이 헬퍼(보낸 사용자)를 먼저 세우고 e2e가 그것을 쓴다. `block_member`가 없어 integration이 함수 없음으로 빨갛고, 화면이 없어 e2e가 경로 없음으로 빨갛다
3. `implementer`가 마이그레이션(`db reset`) → 코드 목록 → dals → 게이트 `role` → 공용 UI → model → 목록 → 상세 시트와 승인 → 거절·차단 확인 → 실패·늦은 쪽 → 차단한 사람 순으로 초록을 만든다. 게이트를 먼저 넓혀야 e2e의 근무자 리다이렉트가 서고, 공용 UI가 먼저 서야 화면 셋이 같은 조각을 쓴다
4. `sian-auditor`가 시안과 문서를 대조하고 `pnpm build && pnpm e2e`로 spec 전부를 본다

배포한 적이 없어 호환 기간이 없다. 마이그레이션은 파일을 고치고 `db reset`이 되돌리기다.

## 리스크·전환·되돌리기

- **마이그레이션 한 파일을 여러 task가 고친다.** `20260825162027_profiles.sql`을 profile-form(AC-02의 꼴 검사)·profile-screen(check 제약)·이 task(함수 넷·`email`·`is_admin()`)가 각각 고친다. 배포 전이라 파일을 고치는 쪽이 맞지만 merge 순서가 엉키면 충돌한다 — 앞선 task가 main에 든 뒤 시작한다
- **`/admin`이 404다.** 관리자 홈은 근무표 task가 만든다. 구현이 전 영역의 설계가 끝난 뒤에 도니 그 사이가 짧고, 그 task가 서면 앱바 뒤로와 「나」의 「관리자 모드」 줄이 저절로 이어진다 — profile-form의 `/payroll`과 같은 자리다. 그때까지 e2e는 `page.goto('/admin/members/pending')`으로 들어간다
- **역할은 클라이언트가 가르고 데이터는 함수가 막는다.** 게이트가 뚫려도 `is_admin()`이 `not_allowed`를 던지고 `profile_private`는 RLS가 안 준다. 게이트 테스트가 빠져도 새는 것은 화면 껍데기뿐이다
- **승인 알림 줄이 없다.** `approve_member`가 `notifications`에 넣어야 하는데 표가 없다. `notification-first`가 이 함수를 다시 열어 더한다 — 그 task의 완료 조건에 「승인 함수의 insert와 integration 한 줄」이 들어가야 승인된 사람이 알림을 못 받는 채 남지 않는다. `wage_rates` 첫 행은 급여 task가 같은 식으로 더한다([account-data plan](account-data.md))
- **「오늘」이 기기 시계다.** `server_now()`와 오프셋([서버 시각](../../2-design/system/runtime.md#서버-시각))이 아직 없다. model은 `now`를 인자로 받으니 오프셋이 서면 부르는 쪽만 바뀐다. 기기 시계가 하루 틀리면 「오늘 보냈어요」가 「어제」로 뜨는 정도다
- **스켈레톤 조각이 없다.** `components.md`가 「아직 안 정한 것」에 뒀다. 목록 회색 덩이 하나를 이 화면 안(`src/screens/members-pending/ui/`)에 두고 둘째 화면이 나오면 올린다 — 조각을 정하는 것이 아니라 자리를 미루는 것이다
- **시트와 history.** `pushState`로 넣은 시트를 iOS 홈 화면 앱의 가장자리 스와이프가 `popstate` 없이 닫을 수 있다 — backlog `ios-home-screen-checks`. e2e는 chromium이라 안드로이드 뒤로 쪽만 본다
- **기존 integration 테스트가 흔들릴 수 있다.** AC-02가 「제출됨」 검사를 더하면 `approve-member.integration.test.ts`의 첫 케이스(`createSignedInUser`는 프로필을 안 보냈다)가 코드를 받는다. 시드를 보낸 사용자로 바꾸는 것만 허용하고 단언은 안 바꾼다 — `git diff`에 단언 줄이 없어야 한다
- **`createBlockedUser`가 승인된 사람을 차단한다.** 상태 전이 표에는 「제출됨 → 차단」뿐이다. 이 헬퍼는 `/blocked` e2e의 시드고 그대로 둔다. 차단 목록 테스트는 보낸 사용자를 `block_member`로 차단한다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01·AC-02 | 근무자가 차단·해제를 부른다. 이미 처리된 사람을 두 번째 관리자가 다시 처리한다 | integration `src/entities/profile/dals/__tests__/block-member.integration.test.ts`·`unblock-member.integration.test.ts`·`approve-member.integration.test.ts`(예정·수정) | `pnpm test:integration:run`, 로컬 Supabase | `not_allowed`, `blocked_at`·`submitted_at` 찍힘·비워짐, 늦은 쪽이 `already_decided` |
| AC-02a | 퇴사·차단된 관리자의 세션이 관리자 함수를 부른다 | integration `is-approved-is-admin.integration.test.ts`(수정) | 위와 같다 | `is_admin()`이 `false`, 함수는 `not_allowed` |
| AC-02b | 상세 시트의 구글 계정이 빈다 | integration `get-pending-members.integration.test.ts`(예정) | 위와 같다 | `ensure_profile()` 뒤 `email`이 차고 임베딩에 실린다 |
| AC-02 | 코드 목록과 `raise` 문자열이 어긋난다 | `tests/lint/error-codes.test.ts`(profile-form이 세운다) | `pnpm test` | 한쪽에만 있는 코드 없음 |
| AC-03 | 로그인만 한 사람·거절·차단·승인된 사람이 대기 목록에 섞인다. 근무자에게 `profile_private`가 실린다 | integration `get-pending-members.integration.test.ts`·`get-blocked-members.integration.test.ts`(예정) | 위와 같다 | 보낸 사람만 오름차순, 관리자에게만 임베딩 |
| AC-04 | 승인된 근무자가 `/admin` 아래에 선다 | unit `src/shared/lib/__tests__/resolve-auth-destination.test.ts` · e2e `tests/e2e/members-pending.spec.ts`(예정) | `pnpm test` · `pnpm build && pnpm e2e` | 근무자는 `/`, 관리자는 그대로 |
| AC-06·AC-07·AC-10·AC-11 | 상대 시간·나이·시각 표기, 오류 판정이 틀린다 | unit `src/screens/members-pending/model/__tests__/`·`src/features/members/__tests__/`(예정) | `pnpm test` | 오늘·어제·n일 전 경계(Asia/Seoul 자정), 만 나이, 요일, 오류별 시트 처분 |
| AC-05~AC-11 | 목록·시트·승인·거절·차단·해제·늦은 쪽·빈 상태·뒤로가 화면에서 끊긴다 | e2e `tests/e2e/members-pending.spec.ts`(예정) | `pnpm build && pnpm e2e`, 로컬 Supabase | 토스트 문안, 줄 사라짐, DB 시각 열, 「이미 처리된 사람이에요」 |
| AC-12 | 조각이 토큰과 어긋난다 | e2e 위 spec · `sian-auditor` | 위와 같다 | 조각이 화면에 서고 시안과 문서가 맞다 |
| AC-14 | 무엇이든 | 전부 | 위 명령 전부 | 초록 |

- 배정하지 않은 것: 줄이 오른쪽으로 밀리는 모션과 시트 안쪽이 바뀌는 모션의 시간값 — e2e가 `--duration-*`를 재지 않는다. `sian-auditor`와 눈으로 본다. iOS 스와이프 — 실기기(`ios-home-screen-checks`)
- 막힌 것: 지금은 없다

## 범위 밖

- 관리자 홈 `/admin`과 「나」의 「관리자 모드」 줄 — 근무표·프로필 task
- `approve_member`의 `notifications` insert — `notification-first`. `wage_rates` 첫 행 — 급여 task
- 직원 관리(`/admin/members`)의 이름 고치기·역할·퇴사 — [members.md](../../2-design/modules/account/screens/members.md)의 task
- `server_now()`와 시각 오프셋 — 그것을 처음 쓰는 근무표 task
- 스켈레톤 조각과 「통신 없음」 띠의 공용화 — `components.md`가 열어뒀다
- 타입 생성(`pnpm types`) — `types-generation`
