---
sources:
  - ../../2-design/modules/account/screens/profile.md#화면-상태와-흐름
  - ../../2-design/modules/account/screens/profile.md#프로필-짜임
  - ../../2-design/modules/account/screens/profile.md#연락처-고치기
  - ../../2-design/modules/account/screens/profile.md#사진-고치기
  - ../../2-design/modules/account/screens/profile.md#화면-고르기
  - ../../2-design/modules/account/screens/profile.md#프로필-문안
  - ../../2-design/modules/account/screens/profile.md#프로필-모션
  - ../../2-design/modules/account/design.md#프로필-제출연락처사진
  - ../../2-design/modules/account/design.md#사진-저장
  - ../../2-design/modules/account/design.md#로그아웃퇴사차단-뒤-기기-정리
  - ../../2-design/modules/account/README.md#acc-002
  - ../../2-design/modules/account/README.md#acc-003
  - ../../2-design/modules/account/README.md#acc-004
  - ../../2-design/modules/account/README.md#acc-008
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/navigation.md#세-층
  - ../../2-design/system/navigation.md#뒤로
  - ../../2-design/system/data-access.md#쓰기
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/runtime.md#tanstack-query-규칙
  - ../../2-design/modules/account/design.md#소유-데이터
  - ../../2-design/design-system/components.md#탭-바
  - ../../2-design/design-system/components.md#listrow
  - ../../2-design/design-system/components.md#하나-고르는-목록
  - ../../2-design/design-system/components.md#토스트
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/modules/notification/README.md#ntf-021
  - ../../2-design/modules/notification/design.md#기기-주소-저장과-삭제
---

# 「나」 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [profile.md](../../2-design/modules/account/screens/profile.md)다 — 상태 표·짜임 여덟·시트 셋·색·글자·여백·문안·모션 전부. 쓰기는 [design.md](../../2-design/modules/account/design.md#프로필-제출연락처사진)의 둘이다. 연락처는 `profile_private` 본인 행 직접 갱신(테이블 직접 쓰기 정책이 있는 유일한 자리), 사진은 [Storage에 올린 뒤](../../2-design/modules/account/design.md#사진-저장) `update_my_photo`다. 잠긴 셋의 근거는 [ACC-002](../../2-design/modules/account/README.md#acc-002), 고치는 둘은 [ACC-003](../../2-design/modules/account/README.md#acc-003), 번호 꼴은 [ACC-004](../../2-design/modules/account/README.md#acc-004), 역할 줄과 관리자 모드는 [ACC-008](../../2-design/modules/account/README.md#acc-008)이다. 경로는 [navigation.md](../../2-design/system/navigation.md#경로)의 `/me`(승인됨)고, 탭 바가 곧 이동이며 관리자 홈의 뒤로가 `/me`다([세 층](../../2-design/system/navigation.md#세-층)·[뒤로](../../2-design/system/navigation.md#뒤로)). 함수 실패는 [data-access.md](../../2-design/system/data-access.md#오류의-모양)의 `DomainError`·`TransportError`고, 연락처와 사진은 둘 다 응답을 기다린다 — 시트 안에서 일어나 실패를 그 자리에 세워야 해서다([design.md](../../2-design/modules/account/design.md#프로필-제출연락처사진)). 공용 조각의 토큰은 [components.md](../../2-design/design-system/components.md)의 탭 바·ListRow·하나 고르는 목록·토스트·Dialog와 바텀시트 표다.

**선행은 [profile-form](profile-form.md)이다.** 그 plan이 세우는 것을 여기서 다시 만들지 않는다 — 오류 기계(`src/shared/api/error-codes.ts`·`errors.ts`), Input·세그먼트·스피너, `avatars` 버킷과 정책, dals 넷(`get-my-private-profile`·`submit-profile`·`upload-avatar`·`update-my-photo`), `resize-image`, 게이트 컨텍스트의 `userId`·프로필 행. 이 plan은 그 위에 선다.

지금 코드에는 `/me`가 없다. `src/app/` 아래 라우트는 `auth/callback`·`auth/logout`·`login`·`pending`·`blocked`·`left`·`/`(빈 `<main>`)뿐이고 `me`·`schedule`·`payroll`·`admin` 폴더가 없다. `src/screens/`는 `login`·`pending` 둘이다. 탭 바·ListRow·스위치·바텀시트·Dialog·토스트는 코드 어디에도 없고 `src/shared/ui/`는 Button·Card뿐이다(profile-form 뒤에 Input·세그먼트·스피너가 는다). `package.json`에 sonner·vaul이 없고 shadcn은 `@base-ui/react` 위다. 게이트 컨텍스트(`useAuthGateValue`)는 지금 목적지·이메일·구글 사진 셋이고, profile-form AC-05가 `userId`와 프로필 행(`display_name`·`photo_url`·`submitted_at`·`approved_at`·`rejected_at`)을 더한다 — `id`(profile_id)와 `role`은 `MyProfileRow`에 있지만 컨텍스트에는 아직 없다. `resolveGateMove`는 승인된 사람이 게이트 밖 경로에 있으면 그대로 두니 `/me`는 라우트만 있으면 선다. `src/app/layout.tsx`의 `<head>`에는 서체 링크뿐이고 인라인 스크립트도 `data-theme`도 없다. `globals.css`는 `[data-theme="dark"]`·`:root:not([data-theme="light"])` 갈래를 이미 받는다([tokens.md 8.1](../../2-design/design-system/tokens.md#81-뼈대)). QueryClient는 `providers.tsx`의 기본값 하나고 `persistQueryClient`·IndexedDB 영속이 없다. 로그아웃은 `<form action="/auth/logout" method="post">`가 `signOut()` 뒤 `/login`으로 303이다. 마이그레이션 `20260825162027_profiles.sql`에는 `profile_private_update_own` 정책과 `grant update (phone)`, `update_my_photo`, `profiles.role`(`member`·`admin`)과 `is_admin()`이 있다. `profile_private`에는 `email` 열도 `phone`의 꼴 check 제약도 없다 — 둘 다 이 plan이나 앞선 task가 더한다. `push_subscriptions` 표와 `save_push_subscription`·`remove_push_subscription`은 없다. 테스트 헬퍼는 `createApprovedUser`·`createAdminUser`·`createBlockedUser`·`createLeftUser`(`tests/integration/postgres.ts`)와 `seedSessionForUser`(`tests/e2e/support/session.ts`)가 있고, `profile_private` 행을 심는 헬퍼는 없다. 편집 훅은 `src/screens/<이름>/`과 `src/app/<이름>/page.tsx`에 `tests/e2e/<이름>.spec.ts`를 요구한다. `.tsx`는 `@supabase/supabase-js` import·`fetch`·`useQuery`·`useMutation`이 금지다(`house/dumb-ui`).

확인한 코드와 Git 기준점 — `src/features/auth/use-auth-gate.ts`·`src/shared/lib/resolve-auth-destination.ts`·`src/app/layout.tsx`·`src/app/auth/logout/route.ts`·`supabase/migrations/20260825162027_profiles.sql`·`tests/e2e/home.spec.ts`가 `5615cb2`(#365).

## 완료 조건

### AC-01

**`/me`가 선다.** `src/app/me/page.tsx`가 `src/screens/me/ui/me-screen.tsx`(이름은 구현이 정한다)를 위임한다. 게이트 컨텍스트가 프로필 행에 `id`·`role`을 더 준다 — profile-form AC-05의 행 위에 둘을 얹는 것이고 `MyProfileRow`에 이미 있는 값이다. 연락처 갱신이 `profile_id`를, 역할 줄과 관리자 모드 줄이 `role`을 쓴다.

### AC-02

**탭 바가 공용 조각으로 선다.** `src/shared/ui/tab-bar.tsx`. 이 화면이 첫 자리다.

- 넷 — 홈 `/`, 근무표 `/schedule`, 급여 `/payroll`, 나 `/me`. 경로는 [navigation.md](../../2-design/system/navigation.md#경로) 표 그대로고 `<a>`(Next `Link`)다. 지금 탭은 `usePathname()`으로 가르고 진하기로만 표시한다(`fg.neutral` / `fg.neutral-subtle`). 브랜드 색·배지 없음
- 토큰과 크기는 [components.md](../../2-design/design-system/components.md#탭-바) 표 — `bg.neutral`, 위쪽 선 `stroke.neutral`, `min-h-14`, 아이콘 24px, `text-xs`, `gap-1`, 아래 여백에 `env(safe-area-inset-bottom)`
- 화면 맨 아래 고정. 이 task에서 붙는 자리는 `/me` 하나다 — 대시보드·근무표·급여 화면은 각자의 task가 같은 조각을 붙인다
- `/schedule`·`/payroll`은 각자의 task가 설 때까지 라우트가 없어 Next 기본 404다. 구현이 전 영역이 선 뒤에 한꺼번에 도니 링크만 경로표대로 든다 — [리스크](#리스크전환되돌리기)

### AC-03

**공용 조각 셋이 는다.** `src/shared/ui/`에 shadcn 관례 이름으로. 훅 면제고 e2e가 덮는다.

- **ListRow** — [components.md](../../2-design/design-system/components.md#listrow). 가운데 제목 필수, 왼쪽·보조 정보·오른쪽(값·화살표·체크·스위치 자리) 선택. 누를 수 있는 줄만 `bg.neutral-weak-pressed`와 화살표. 구분선은 왼쪽 콘텐츠 시작점부터. [하나 고르는 목록](../../2-design/design-system/components.md#하나-고르는-목록)은 ListRow에 오른쪽 체크(`fg.brand`)를 세운 것이다
- **바텀시트와 Dialog** — [components.md](../../2-design/design-system/components.md#dialog와-바텀시트). 시트는 화면 폭, 위 두 모서리만 `rounded-lg`, `shadow-sheet`, `--duration-slow`로 오르내린다. Dialog는 가운데, 양옆 32px, `shadow-pop`·`stroke.surface`, 제목 `text-lg font-semibold`, 본문 `text-sm`, 버튼 둘 같은 폭. 왼쪽은 언제나 「닫기」(secondary). **시트는 history에 든다** — 열리면 `pushState`, `popstate`(안드로이드 뒤로·iOS 가장자리 스와이프)가 시트를 닫고 화면은 그대로다([navigation.md](../../2-design/system/navigation.md#뒤로))
- **토스트** — [components.md](../../2-design/design-system/components.md#토스트). 알약, `bg.neutral-solid-soft`·`fg.neutral-contrast`, 왼쪽 16px 면 아이콘, 버튼 없음. 뜨는 높이는 화면 아래 무엇이 서느냐로 — 탭 바 위면 80px. 이 화면은 탭 바가 있으니 80px다

### AC-04

**화면이 문서대로 선다.** [프로필 짜임](../../2-design/modules/account/screens/profile.md#프로필-짜임) 순서고 색·글자·여백은 [색](../../2-design/modules/account/screens/profile.md#프로필-색)·[글자](../../2-design/modules/account/screens/profile.md#프로필-글자)·[여백과 모양](../../2-design/modules/account/screens/profile.md#프로필-여백과-모양) 표 그대로, 문안은 [프로필 문안](../../2-design/modules/account/screens/profile.md#프로필-문안) 표 그대로다.

1. 앱바 「나」 — 제목형(`text-lg font-semibold`), 뒤로 없음
2. 사진과 이름 — 88px 원 가운데, 오른쪽 아래 28px 연필(닿는 면 44px, 면 `bg.neutral`·테두리 `stroke.neutral`). 원과 연필 둘 다 [사진 고치기](#ac-06)를 연다. 아래 이름(`text-xl font-semibold`, 안 눌린다) → 역할 한 줄(「근무자」·「관리자」, `role`로 가른다) → 안내 「이름·성별·생년월일은 관리자가 고쳐요」(`text-xs` `fg.neutral-subtle`). 사진은 `photo_url`이 있으면 그것, 없으면 구글 사진(`avatarUrl`)
3. 잠긴 것 — ListRow 둘, 「성별」·「생년월일」. 오른쪽 값(「여성」·「남성」, `1993년 4월 21일` `tabular-nums`). 화살표·누름 배경 없음. 값은 `get-my-private-profile`에서 온다
4. 가는 선 `stroke.neutral` `my-2`
5. 고치는 것 — ListRow 「연락처」, 오른쪽 값(`010-0000-0001` `tabular-nums`)과 화살표. 누르면 [연락처 고치기](#ac-05)
6. 설정 — ListRow 「화면」, 오른쪽 지금 값(「기기 설정대로」·「밝게」·「어둡게」)과 화살표. 누르면 [화면 고르기](#ac-07). **「알림」 줄은 `notification-first`가 그 위에 붙인다** — 이 task는 그리지 않고 자리도 비우지 않는다([범위 밖](#범위-밖))
7. 관리자 모드 — `role === 'admin'`일 때만 ListRow 「관리자 모드」, 화살표. 누르면 `/admin`으로 간다. 브랜드 색 안 쓴다
8. 로그아웃 — Button ghost, 가운데, `text-sm font-medium`, `mt-10`. 확인 안 묻는다. 기존 `<form action="/auth/logout" method="post">` 그대로다
9. 탭 바 — 「나」가 지금 탭

등장 모션 없음. 시트가 오르내리는 것 외에 움직이지 않는다([프로필 모션](../../2-design/modules/account/screens/profile.md#프로필-모션)). 화면이 읽는 것은 `['profile']`(게이트 컨텍스트)과 `get-my-private-profile`이다. 성별·생년월일·연락처 표기(`female` → 「여성」, `1993-04-21` → `1993년 4월 21일`, `01000000001` → `010-0000-0001`)와 역할 글자·관리자 줄 표시 여부·사진 URL 고르기는 전부 `src/screens/me/model/*.ts`고 unit 테스트가 든다.

### AC-05

**연락처를 고친다.** 바텀시트 [연락처 고치기](../../2-design/modules/account/screens/profile.md#연락처-고치기).

- 제목 「연락처」 → Input 하나(라벨 「휴대폰 번호」, 자리표시 `01012345678`, 숫자 키패드, `tabular-nums`) → 「닫기」(secondary)·「저장」(primary). 열 때 지금 번호가 채워지고 커서가 끝에 간다
- 숫자만 받아 `010-1234-5678` 꼴로 앱이 끊어 넣는다 — profile-form AC-07의 하이픈 함수를 그대로 쓴다. 쓰는 중에는 도움말 「숫자만 적으면 돼요」, 오류 테두리 없음. 010 11자리가 아니거나 지금 번호 그대로면 「저장」이 안 눌린다([profile.md](../../2-design/modules/account/screens/profile.md#연락처-고치기)). 「저장」이 안 눌리는데 칸을 떠났으면(blur) 오류 테두리와 「010으로 시작하는 11자리를 적어 주세요」 — 지금 번호 그대로인 것은 오류가 아니라 버튼만 잠긴다
- 「저장」 → `src/entities/profile/dals/update-my-phone.ts` — `from('profile_private').update({ phone }).eq('profile_id', …).select('phone').single()`. 갱신된 행이 없으면(RLS가 걸러 0행) 실패로 본다. 표의 check 제약(AC-05a)에 걸리면 Postgres가 `23514`를 주는데 코드 목록에 없는 것이라 `TransportError`다 — 화면이 먼저 막아 사람 손으로는 못 닿는 자리다
- **응답을 기다린다.** 캐시를 미리 칠하지 않는다 — 시트가 화면을 덮고 있어 미리 칠해도 보이지 않고, 실패를 시트 안에 세워야 한다([design.md](../../2-design/modules/account/design.md#프로필-제출연락처사진)). 보내는 동안 「저장」은 글자 대신 스피너고 「닫기」와 칸이 잠긴다. 성공하면 `['profile', 'private']`을 무효화하고 시트가 닫히고 토스트 「연락처를 바꿨어요」. 실패하면 시트는 열린 채 시트 안에 「보내지 못했어요. 다시 시도해주세요」(`fg.critical` `text-xs`, 버튼 위) — 문안은 [data-access.md](../../2-design/system/data-access.md#오류의-모양)의 `TransportError` 공통이다

### AC-05a

**표가 연락처 꼴의 마지막 문이다.** 배포한 적이 없어 마이그레이션 파일 `20260825162027_profiles.sql`을 고친다. `profile_private.phone`에 `^010-\d{4}-\d{4}$` check 제약을 건다([design.md](../../2-design/modules/account/design.md#소유-데이터)). 직접 갱신이라 `submit_profile`의 `invalid_phone` 검사를 안 지나서다. 화면이 먼저 막으니 사람 손으로는 안 닿고, integration이 규칙 밖 값의 거부를 본다.

### AC-06

**사진을 고친다.** 바텀시트 [사진 고치기](../../2-design/modules/account/screens/profile.md#사진-고치기). 제목 「사진」, ListRow 셋 — 「사진 고르기」·「구글 사진으로」·「닫기」.

- **사진 고르기** — `<input type="file" accept="image/*">` → `resize-image`(512px 정사각 webp) → `upload-avatar` → `update-my-photo` → `['profile']` 무효화 → 시트 닫힘 → 토스트 「사진을 바꿨어요」. profile-form AC-08과 같은 사슬이다. 올리는 동안 줄 셋이 안 눌리고 시트 위쪽 원에 스피너. 실패하면 시트가 안 닫히고 시트 안에 「사진을 올리지 못했어요. 다시 골라 주세요」(`fg.critical` `text-xs`) — 통신이 끊긴 자리뿐이라 문구를 가르지 않는다
- **구글 사진으로** — `update_my_photo(구글 사진 URL)`. 구글 URL은 게이트 컨텍스트의 `avatarUrl`이다. 성공하면 `['profile']` 무효화 → 시트 닫힘 → 토스트 「사진을 바꿨어요」. 실패는 사진 고르기와 같은 문안. **지금 쓰는 것이 구글 사진이거나 구글 사진이 없으면 이 줄이 없다** — `photo_url`이 비었거나 `avatarUrl`과 같을 때, 그리고 `avatarUrl` 자체가 없을 때다([profile.md](../../2-design/modules/account/screens/profile.md#사진-고치기)). 받아올 것이 없으면 되돌릴 데도 없다. 판정은 model이고 unit이 셋을 본다
- 자르는 화면 없음. 지우는 길 없음

### AC-07

**화면(테마)을 고른다.** [화면](../../2-design/modules/account/screens/profile.md#화면)·[화면 고르기](../../2-design/modules/account/screens/profile.md#화면-고르기).

- `src/shared/lib/theme.ts` — 키 `theme`, 값 `light`·`dark`. 「기기 설정대로」는 키를 지운다(값이 없는 것이 기본과 같은 뜻이다). `readThemeChoice(storage)`는 그 밖의 값을 전부 「기기 설정대로」로 읽는다. `applyThemeChoice(root, choice)`는 `light`·`dark`면 `data-theme`을 걸고 「기기 설정대로」면 뗀다. unit이 셋을 본다
- `src/shared/lib/theme-boot-script.ts` — `<head>`에 넣을 인라인 스크립트 **문자열**. `localStorage`의 `theme`이 `light`·`dark`면 `document.documentElement`에 `data-theme`을 건다. `try/catch`로 감싼다(사파리 비공개 모드는 `localStorage` 접근이 던진다). unit이 jsdom에서 그 문자열을 실행해 `theme.ts`와 같은 결과를 내는지 본다 — 둘이 갈라지면 빨갛다
- `src/app/layout.tsx`의 `<head>`에 `<script dangerouslySetInnerHTML={{ __html: themeBootScript }} />`. 첫 페인트 전에 돈다. 기존 `home.spec.ts`의 「body가 라이트와 다크에서 다른 색」은 키가 없을 때 속성이 안 걸리니 그대로 통과한다
- 바텀시트 — 제목 「화면」, 하나 고르는 목록 셋 「기기 설정대로」·「밝게」·「어둡게」. 지금 것 오른쪽에 체크(`fg.brand`). 누르는 즉시 `applyThemeChoice` + `localStorage` 쓰기 + 시트 닫힘. 저장 버튼·토스트 없음. 줄의 오른쪽 값이 따라 바뀐다
- 계정에 안 둔다. 쓰기 함수도 dal도 없다

### AC-08

**관리자 모드.** `role === 'admin'`에게만 줄이 선다. 누르면 `/admin`(Next `Link`). 근무자에게는 DOM에도 없다. `/admin`은 관리자 홈 task가 만들고 그때까지는 404다 — 탭 셋과 같은 자리다([리스크](#리스크전환되돌리기)).

### AC-09

**로그아웃.** 기존 POST 폼 그대로다. [기기 정리](../../2-design/modules/account/design.md#로그아웃퇴사차단-뒤-기기-정리)의 `queryClient.clear()`·IndexedDB 영속본 삭제·시각 오프셋 삭제·`remove_push_subscription`은 그 넷이 아직 코드에 없어 붙일 자리가 없다 — 영속·시각·푸시를 세우는 task가 각자 붙인다. 전체 페이지 이동이라 메모리 캐시는 어차피 새로 선다.

### AC-10

**테스트.**

- unit: AC-04의 표기·역할·관리자 줄·사진 URL 판정, AC-05의 「저장」 가능 여부(꼴과 같은 번호 둘 다), AC-06의 「구글 사진으로」 줄 표시 판정 셋, AC-07의 `theme.ts` 셋과 부트 스크립트 대조
- integration: `update-my-phone` dal — 본인 행 갱신 성공과 갱신 뒤 값, 남의 `profile_id`로 부르면 0행이라 `TransportError`, 규칙 밖 꼴(`0101234`)이면 check 제약이 거부한다(AC-05a). 기존 `profile-private.integration.test.ts`가 정책을 이미 보니 정책 테스트를 다시 쓰지 않는다. `update_my_photo`도 기존 테스트가 있다
- e2e `tests/e2e/me.spec.ts`: 승인된 사용자(`createApprovedUser` + `profile_private` 행을 심는 헬퍼 — `tests/integration/postgres.ts`에 더한다, 이름은 구현이 정한다)가 `/me`를 열면 이름·역할 「근무자」·성별·생년월일·연락처가 보이고 관리자 모드 줄이 없다; 관리자(`createAdminUser`)에게는 역할 「관리자」와 관리자 모드 줄이 있다; 연락처 줄 → 시트 → `01000000002` 입력 → 저장 → 시트 닫힘·토스트·줄 값 `010-0000-0002`·DB 값; `page.route`로 `profile_private` PATCH를 막고 저장하면 시트가 열린 채 오류 문구; 화면 줄 → 「어둡게」 → `html[data-theme="dark"]`, 새로고침 뒤 `domcontentloaded`에 이미 걸려 있다, 「기기 설정대로」 → 속성 없음; 사진 줄 → 「사진 고르기」 → 픽스처 이미지 → 토스트와 `<img>` src 변경(storage-api 필요 — profile-form AC-03이 CI에 켠다); `photo_url`이 없는 사용자에게 「구글 사진으로」 줄이 없다; 탭 바 넷이 보이고 「나」가 지금 탭이다; 시트를 연 채 `history.back()`이면 시트만 닫히고 `/me`에 남는다
- 승인 안 된 사용자가 `/me`를 열면 `/pending`으로 간다 — 기존 `gate.spec.ts`의 규칙이라 한 줄만 더한다

### AC-11

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·`pnpm build && pnpm e2e` 전부 초록. 시안 `profile.sian.html`이 문서와 맞는지 `sian-auditor`가 본다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/app/me/page.tsx` · `src/features/auth/use-auth-gate.ts`·`ui/auth-gate.tsx`·`__tests__/` | 라우트, 컨텍스트에 `id`·`role` | AC-01 |
| `src/shared/ui/tab-bar.tsx` | 탭 바 | AC-02 |
| `src/shared/ui/list-row.tsx`·`sheet.tsx`·`dialog.tsx`·`toast.tsx`(이름은 shadcn 관례) | ListRow, 바텀시트·Dialog(history 포함), 토스트 | AC-03 |
| `src/screens/me/model/*.ts`·`__tests__/` · `ui/me-screen.tsx`·시트 셋(이름은 구현이 정한다) | 표기·판정, 화면과 시트 | AC-04~AC-08 |
| `src/features/profile/*.ts`·`__tests__/`(이름은 구현이 정한다) | `useMutation` 훅 — 연락처·사진 둘, 둘 다 응답을 기다린다. `.tsx`는 `useMutation`을 못 부른다 | AC-05·AC-06 |
| `src/entities/profile/dals/update-my-phone.ts`·`__tests__/update-my-phone.integration.test.ts` | 연락처 직접 갱신 | AC-05 |
| `supabase/migrations/20260825162027_profiles.sql` | `profile_private.phone` check 제약 | AC-05a |
| `src/shared/lib/theme.ts`·`theme-boot-script.ts`·`__tests__/` · `src/app/layout.tsx` | 테마 읽기·적용, `<head>` 부트 스크립트 | AC-07 |
| `tests/integration/postgres.ts` · `tests/e2e/me.spec.ts`·`gate.spec.ts`(한 줄) | `profile_private` 심기 헬퍼, e2e | AC-10 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. profile-form이 main에 든 뒤 시작한다 — 오류 기계·dals·Input·컨텍스트·버킷이 그쪽 것이다.

1. `test-planner`가 AC-01~AC-11을 층에 배정한다. 표기·판정·테마 함수는 unit, `update-my-phone`은 integration, 화면·시트·테마 복원·탭 바는 e2e다
2. `unit-test-writer`·`integration-test-writer`·`e2e-test-writer`가 실패 테스트를 쓴다. integration이 `profile_private` 심기 헬퍼를 먼저 세우고 e2e가 그것을 쓴다
3. `implementer`가 컨텍스트(`id`·`role`) → `theme.ts`와 부트 스크립트 → 공용 조각(ListRow → 시트·Dialog → 토스트 → 탭 바) → `update-my-phone` dal과 훅 → model → 화면 → 시트 셋(화면 고르기 → 연락처 → 사진) 순으로 초록을 만든다. 컨텍스트와 테마가 먼저인 것은 화면이 그 값을 읽어야 서기 때문이고, 공용 조각이 화면보다 먼저인 것은 화면이 그 조각으로 짜이기 때문이다
4. `sian-auditor`가 `profile.sian.html`과 문서를 대조하고 `pnpm build && pnpm e2e`로 spec 전부를 본다

배포한 적이 없어 호환 기간이 없다. 마이그레이션은 AC-05a의 check 제약 한 줄만 는다 — 기존 파일을 고치는 것이고 되돌리기는 그 줄을 빼는 것이다.

## 리스크·전환·되돌리기

- **탭 셋과 관리자 모드가 갈 곳이 없다.** `/`는 빈 `<main>`이고 `/schedule`·`/payroll`·`/admin`은 라우트가 없어 Next 기본 404다. 구현이 전 영역의 설계가 끝난 뒤에 도니 그 사이가 짧고, 각 화면 task가 자기 경로를 세우면서 저절로 메워진다. 그때까지 링크는 경로표대로 든다 — profile-form의 「급여 보기」와 같다
- **알림 줄이 빠진 채 선다.** 짜임 여섯째의 「알림」 스위치는 `push_subscriptions`·`save_push_subscription`·`remove_push_subscription`이 마이그레이션에 없고 끄기가 저장되는 자리가 [notification/design.md Q-01](../../2-design/modules/notification/design.md#아직-안-정한-것)에 열려 있어 `notification-first` 몫이다. 그때까지 연락처 아래에 「화면」 줄이 바로 오고 자리를 비워 두지 않는다 — 그 task가 줄을 그 위에 끼워 넣는다
- **「구글 사진으로」의 값.** `update_my_photo(구글 URL)`로 `photo_url`에 구글 URL을 쓴다 — 「다시 받아온다」의 그대로다. profile-form의 「기본 사진 쓰기」는 쓰지 않아 `photo_url`이 비어 있으니, 그 사람의 사진은 목록·픽커(`profiles`만 읽는다)에 안 보인다. 이 task가 고칠 자리가 아니다
- **e2e 시드에 구글 사진이 없다.** `seedSessionForUser`의 사용자는 `user_metadata`에 사진이 없어 `avatarUrl`이 null이다 — 문서가 「구글 사진이 없으면 줄이 없다」고 정한 그 경우다. 줄이 없는 쪽만 e2e가 보고, 있는 쪽의 판정은 unit이 본다
- **iOS 홈 화면 앱의 `popstate`.** 시트를 history에 넣는 규칙은 [navigation.md](../../2-design/system/navigation.md#뒤로)가 기기 테스트로 남겼다 — `ios-home-screen-checks`
- **테마 스크립트가 CSP에 걸린다.** 지금 CSP 헤더가 없다. 나중에 `script-src`를 좁히면 nonce가 필요하다 — 배포 task가 본다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 컨텍스트에 `id`·`role`이 없어 화면이 판정을 못 한다 | unit `src/features/auth/__tests__/use-auth-gate.test.ts` | `pnpm test` | 컨텍스트 값에 `id`·`role` |
| AC-01·AC-10 | 승인 안 된 사람이 `/me`를 본다 | e2e `tests/e2e/gate.spec.ts` | `pnpm build && pnpm e2e` | `/pending`으로 간다 |
| AC-02 | 탭 넷·지금 탭 표시가 틀린다 | e2e `tests/e2e/me.spec.ts`(예정) | 위와 같다 | 링크 넷의 `href`, 「나」가 `aria-current` |
| AC-03 | 시트가 뒤로에 안 닫히거나 화면을 떠난다 | e2e `me.spec.ts`(예정) | 위와 같다 | `history.back()` 뒤 시트 없음·URL `/me` |
| AC-04 | 성별·생년월일·연락처 표기, 역할 글자, 관리자 줄, 사진 URL이 틀린다 | unit `src/screens/me/model/__tests__/`(예정) | `pnpm test` | 표기 셋·역할 둘·줄 유무·URL 우선순위 |
| AC-04·AC-08 | 화면 짜임이 안 서거나 근무자에게 관리자 줄이 보인다 | e2e `me.spec.ts`(예정) | `pnpm build && pnpm e2e` | 근무자·관리자 각각의 줄 목록 |
| AC-05 | 남의 행을 고치거나 실패를 성공으로 본다 | integration `src/entities/profile/dals/__tests__/update-my-phone.integration.test.ts`(예정) | `pnpm test:integration:run`, 로컬 Supabase | 본인 행 갱신값, 남의 행은 `TransportError` |
| AC-05a | 화면을 우회한 값이 표에 들어간다 | integration 같은 파일(예정) | 위와 같다 | `0101234`·`01012345678`이 거부된다 |
| AC-05 | 저장 뒤 줄 값·토스트, 실패 시 시트가 닫힌다 | e2e `me.spec.ts`(예정) — `page.route`로 PATCH 차단 | `pnpm build && pnpm e2e` | 성공 경로와 실패 경로 둘 |
| AC-06 | 사진 사슬이 끊기거나 구글 줄 판정이 틀린다 | unit model(예정), e2e `me.spec.ts`(예정) | `pnpm test` / `pnpm build && pnpm e2e`, storage-api 켠 로컬 Supabase | 줄 유무, 올린 뒤 `<img>` src와 토스트 |
| AC-07 | 새로고침에 테마가 깜빡이거나 부트 스크립트와 `theme.ts`가 갈린다 | unit `src/shared/lib/__tests__/theme*.test.ts`(예정), e2e `me.spec.ts`(예정) | `pnpm test` / `pnpm build && pnpm e2e` | 부트 스크립트 결과 = `applyThemeChoice` 결과, `domcontentloaded`에 `data-theme` |
| AC-07 | 기존 라이트·다크 미디어 쿼리 검사가 깨진다 | e2e `tests/e2e/home.spec.ts` | `pnpm build && pnpm e2e` | 그대로 초록 |
| AC-09 | 로그아웃 뒤 로그인으로 안 간다 | e2e `tests/e2e/logout.spec.ts` | 위와 같다 | 그대로 초록 |
| AC-11 | 시안과 문서가 어긋난다 | `sian-auditor` | — | 어긋남 없음 |

- 배정하지 않은 것: 「알림」 줄 전부 — 이 task 밖이다. 「구글 사진으로」의 성공 경로 e2e — 시드에 구글 사진이 없다(unit이 판정을, 기존 `update-my-photo` integration이 함수를 본다). 시트의 iOS 가장자리 스와이프 — `ios-home-screen-checks`
- 막힌 것: 지금은 없다

## 범위 밖

- **「알림」 줄(스위치·끄기 Dialog·권한 거부 안내).** 정본이 정한 것은 이렇다 — 끄면 통째로([NTF-021](../../2-design/modules/notification/README.md#ntf-021)), 기기 구독은 `push_subscriptions`에 `save_push_subscription`·`remove_push_subscription`으로 저장·삭제([notification/design.md](../../2-design/modules/notification/design.md#기기-주소-저장과-삭제)), 프로필 컬럼은 없다. 정본이 안 정한 것은 「끄기」가 저장되는 자리다([Q-01](../../2-design/modules/notification/design.md#아직-안-정한-것)) — 구독을 지우는 것만으로는 「매 진입에 보낸다」가 다음 진입에 다시 구독한다. 표·함수도 마이그레이션에 없다. 그래서 줄 전부가 `notification-first`(또는 그 뒤의 후속 task) 몫이고, 문안·Dialog·권한 거부 안내의 정본은 그대로 [profile.md](../../2-design/modules/account/screens/profile.md#알림)다
- 로그아웃 뒤 기기 정리 넷 — 영속·시각·푸시 task
- `/`·`/schedule`·`/payroll`·`/admin` 화면 — 각자의 task
- 프로필 작성 폼·`/left`·`/blocked`·오류 기계·버킷·`resize-image` — [profile-form](profile-form.md)
- 타입 생성 — `types-generation`
