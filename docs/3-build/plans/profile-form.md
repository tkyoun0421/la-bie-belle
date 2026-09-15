---
sources:
  - ../../2-design/modules/account/screens/login.md#프로필-작성-짜임
  - ../../2-design/modules/account/screens/login.md#거절된-뒤
  - ../../2-design/modules/account/screens/login.md#퇴사한-뒤-짜임
  - ../../2-design/modules/account/screens/login.md#차단된-뒤-짜임
  - ../../2-design/modules/account/screens/login.md#읽기-실패-짜임
  - ../../2-design/modules/account/screens/login.md#프로필-작성-문안
  - ../../2-design/modules/account/design.md#프로필-제출연락처사진
  - ../../2-design/modules/account/design.md#사진-저장
  - ../../2-design/modules/account/README.md#acc-002
  - ../../2-design/modules/account/README.md#acc-004
  - ../../2-design/system/data-access.md#오류의-모양
---

# 프로필 작성 폼을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [login.md](../../2-design/modules/account/screens/login.md#프로필-작성-짜임)의 「프로필 작성」 — 상태 표·스텝 다섯·잠김 안내·거절된 뒤 다시 보낼 때·색·글자·여백·문안·모션 — 과 승인 대기의 [거절된 뒤](../../2-design/modules/account/screens/login.md#거절된-뒤), 그리고 [퇴사한 뒤 짜임](../../2-design/modules/account/screens/login.md#퇴사한-뒤-짜임)·[차단된 뒤 짜임](../../2-design/modules/account/screens/login.md#차단된-뒤-짜임)이다. 쓰기 함수는 [design.md](../../2-design/modules/account/design.md#프로필-제출연락처사진)의 `submit_profile`·`update_my_photo`, 사진의 자리는 [사진 저장](../../2-design/modules/account/design.md#사진-저장)이다. 값의 꼴은 [ACC-002](../../2-design/modules/account/README.md#acc-002)(성별 둘, 생년월일 여덟 자리)와 [ACC-004](../../2-design/modules/account/README.md#acc-004)(010 11자리, 앱이 하이픈)다. 함수 실패는 [data-access.md](../../2-design/system/data-access.md#오류의-모양)의 `DomainError`·`TransportError`다.

지금 코드는 `/pending`이 승인 대기 한 모습만 그린다. `PendingScreen`(`src/screens/pending/ui/pending-screen.tsx`)이 알약·제목·도는 문구·알림 영역 넷·계정 줄·로그아웃을 그리고, 이메일·사진은 `useAuthGateValue()`에서 받는다. 프로필 작성 폼도, 「거절된 뒤」도 없다 — `submitted_at`이 비어 있어도 승인 대기가 선다. 게이트 컨텍스트는 목적지·이메일·사진 셋만 준다. `/left`는 한 줄 문장이다. `src/shared/ui/`에는 Button·Card뿐이고 Input·세그먼트가 없다. `src/shared/api/error-codes.ts`와 `DomainError`·`TransportError`는 아직 없다 — 앱에서 쓰기 함수를 부르는 첫 자리가 이 task다. 마이그레이션의 `submit_profile`은 `phone`·`gender`의 꼴을 검사하지 않고, Storage 버킷과 정책은 없다. CI는 `storage-api`를 안 띄운다.

확인한 코드와 Git 기준점 — `src/screens/pending/ui/pending-screen.tsx`·`src/features/auth/ui/auth-gate.tsx`·`supabase/migrations/20260825162027_profiles.sql`이 `61c5d68`(#363).

## 완료 조건

### AC-01

**오류 기계가 선다.** `src/shared/api/error-codes.ts`가 코드 목록의 정본이고, `src/shared/api/errors.ts`가 `DomainError`(코드가 목록에 있는 예외)와 `TransportError`(그 밖의 전부)를 정의한다. `dals`의 쓰기 함수는 Supabase 오류를 이 둘로 가른다.

- 코드 목록은 마이그레이션의 `raise exception using message = '…'` 문자열 전부다. `tests/lint/`의 대조 테스트가 `supabase/migrations/*.sql`을 읽어 목록과 맞춘다 — 한쪽에만 있으면 빨갛다
- 읽기 오류는 전부 `TransportError`다

### AC-02

**`submit_profile`이 값의 꼴을 지킨다.** 배포한 적이 없어 기존 마이그레이션 파일을 고친다.

- `gender`가 `female`·`male`이 아니면 `invalid_gender`, `phone`이 `^010-\d{4}-\d{4}$`가 아니면 `invalid_phone`을 던진다. 화면이 먼저 막지만 함수가 마지막 문이다
- 나머지 검사(`not_allowed`·`already_submitted`)와 `rejected_at`을 비우는 것은 그대로다

### AC-03

**Storage 버킷 `avatars`가 선다.** 마이그레이션이 버킷과 정책을 만든다.

- `storage.buckets`에 `avatars` — `public = true`, `file_size_limit` 1MB, `allowed_mime_types` `image/webp`
- `storage.objects` 정책: 읽기는 전원(공개), insert·update·delete는 `authenticated`가 첫 폴더가 자기 `auth.uid()`인 경로에만
- CI의 `supabase start -x …`에서 `storage-api`를 뺀다 — 정책이 integration 테스트 대상이다. [execution.md](../../4-test/execution.md)의 그 줄도 따라간다

### AC-04

**`dals`가 넷 는다.** `src/entities/profile/dals/`에.

- `get-my-private-profile.ts` — `profile_private`에서 자기 행(`phone`·`birth_date`·`gender`)을 읽는다. 없으면 null
- `submit-profile.ts` — `rpc('submit_profile', …)`. 실패를 `DomainError`·`TransportError`로 가른다
- `upload-avatar.ts` — `storage.from('avatars').upload('<user_id>/<uuid>.webp', blob)` 뒤 공개 URL을 돌려준다
- `update-my-photo.ts` — `rpc('update_my_photo', { photo_url })`

### AC-05

**게이트 컨텍스트가 프로필 행을 준다.** `useAuthGateValue()`가 목적지·이메일·구글 사진에 더해 `userId`와 `['profile']` 행(`display_name`·`photo_url`·`submitted_at`·`approved_at`·`rejected_at`)을 준다. 화면은 이 값으로 상태를 가르고, 쓰기 뒤에는 `['profile']`을 무효화해 게이트가 다시 읽는다.

### AC-06

**`/pending`이 세 모습을 가른다.** `src/screens/pending/`이 프로필 행으로 판정한다.

- `submitted_at` 없음 → 프로필 작성. `rejected_at` 있음 → 승인 대기의 「거절된 뒤」. 둘 다 아니면 승인 대기의 「기다리는 중」 — 지금 화면 그대로
- 판정은 `.ts`(model)에 있고 unit 테스트가 세 경우를 본다

### AC-07

**프로필 작성 화면이 문서대로 선다.** `src/screens/pending/ui/profile-form-screen.tsx`(이름은 구현이 정한다)와 model.

- 짜임 순서: 앱바(제목 「프로필」, 오른쪽 「로그아웃」) → 안내 한 줄 「자신의 프로필을 작성해 주세요」(다 굳으면 「아래 정보가 맞나요? 틀린 부분을 누르면 다시 적을 수 있어요」) → 굳은 더미(사진·이름·성별·생년월일·연락처 순서로 쌓인다. 사진은 가운데 원, 나머지는 왼쪽 정렬 글) → 남는 공간 → 묻는 칸 하나(화면 아래 고정, 다섯이 다 굳으면 이 자리에 잠김 안내 한 줄) → BottomCTA 「보내기」. 왼쪽 정렬. 색·글자·여백은 [프로필 작성 색](../../2-design/modules/account/screens/login.md#프로필-작성-색)·[글자](../../2-design/modules/account/screens/login.md#프로필-작성-글자)·[여백과 모양](../../2-design/modules/account/screens/login.md#프로필-작성-여백과-모양) 표 그대로
- 칸은 하나고 자리가 고정이다. 답한 것이 규칙에 맞으면 칸이 통째로 더미의 제자리로 올라가 굳고 그 자리에 다음 칸이 선다. 사진은 첫 스텝 — 칸 안 원(구글 사진 `avatarUrl`, `photo_url`이 있으면 그것, 없으면 빈 면)을 누르면 파일 고르기, 아래 outline 버튼 하나 「기본 사진 쓰기」는 쓰기 없이 굳는다. 이름은 Input 한 줄(키보드 완료로 굳고 빈 채로는 안 굳는다). 성별은 세그먼트 「여」·「남」(값 `female`·`male`, 누르는 순간 굳는다). 생년월일은 Input 숫자 키패드 여덟 자리(자리표시 `19930421`, `tabular-nums`, 실존 날짜가 되는 순간 굳는다). 연락처는 Input 숫자 키패드, 숫자만 치면 `010-1234-5678` 꼴로 앱이 끊어 넣고(`tabular-nums`) 010 11자리가 되는 순간 굳는다. 「다음」 버튼은 없다 — [스텝 다섯](../../2-design/modules/account/screens/login.md#스텝-다섯)
- 굳은 글은 라벨이 없다. 첫 글 「{이름}님, 반가워요」(`text-xl font-semibold`), 나머지 「여성」·「남성」, `1993년 4월 21일`, `010-0000-0001`(`text-lg font-medium`), 줄 사이 `mt-3`, 면도 선도 없다. 원이든 글이든 전체가 버튼이다 — 누르면 더미의 그것이 작아지며 사라지고 자리가 접혀 아래 것들이 올라오며, 칸이 그 값을 든 채 그 스텝을 다시 묻는다. 고쳐서 규칙에 맞으면 자리가 다시 벌어지고 칸이 그리로 올라가 굳는다
- 인도 줄: 생년월일이 여덟 자리 찼는데 날짜가 아니거나, 생년월일·연락처를 덜 친 채 칸을 떠나면 그 칸 아래 `fg.critical` `text-xs` 한 줄 — 문안은 [프로필 작성 문안](../../2-design/modules/account/screens/login.md#프로필-작성-문안) 표. 오류 테두리는 없다. 맞게 고치면 사라지고 굳는다
- 「보내기」는 다섯이 다 굳었을 때만 눌린다. 칸이 열려 있으면 버튼 아래 줄 「빈 칸을 다 채우면 보낼 수 있어요」, 다섯이 다 굳으면 칸 자리에 잠김 안내 「이름과 성별과 생년월일은 보내고 나면 못 고쳐요」가 서고 버튼 아래 줄은 사라진다. 확인 시트는 없다
- 「보내기」 → `submit_profile`. 보내는 동안 버튼 글자가 사라지고 스피너만 남고 굳은 것은 안 눌린다. 성공하면 [보낸 뒤](../../2-design/modules/account/screens/login.md#보낸-뒤) 한 장 — 나머지가 제자리에서 사라지고 원과 「{이름}님, 반가워요」가 가운데로 모이며 커지고(끝에서 1.04배 넘침) 조각 여덟이 600ms 퍼지고 1.2초 머문다 — 뒤에 `['profile']` 무효화 → 같은 경로가 승인 대기로 바뀐다. 거절된 뒤 다시 보낸 것이면 그 한 장 없이 바로 무효화. 움직임 줄이기면 이동·조각 없이 밝기만. 토스트 없음. `TransportError`면 「보내지 못했어요. 다시 시도해주세요」를 잠김 안내 자리에 세운다 — 페이지 문서가 따로 정하지 않았다([data-access.md](../../2-design/system/data-access.md#오류의-모양)). `already_submitted`면 무효화만 한다 — 이미 보낸 것이다
- 계산(어느 스텝을 묻는지·굳는 판정·하이픈 끊기·여덟 자리 → 날짜·굳은 글 표기·「보내기」 가능 여부)은 전부 `.ts` model이고 unit 테스트가 든다
- 등장 모션은 로그인 화면과 같다(`--duration-slower`·`--stagger-step`, 순서 안내·더미·묻는 칸·버튼). 올라가기는 칸이 통째로 더미의 제자리까지 `--duration-slower`로 오르며 라벨·면은 빠지고 글자는 굳은 글의 크기·굵기로 바뀌는 것이다. 고칠 때는 더미의 그것이 `--duration-slow`로 작아지며 옅어지고 높이가 접혀 아래가 올라오고, 다시 굳을 때는 자리가 먼저 벌어진다. 다음 칸이 서는 것, 잠김 안내, 안내 한 줄의 문구 갈림은 제자리에서 `--duration-base` 밝기 변화다 — [프로필 작성 모션](../../2-design/modules/account/screens/login.md#프로필-작성-모션). 시안 `login.sian.html`의 02 프로토타입이 그 움직임의 기준이다. 인도 줄은 모션 없음. 움직임 줄이기에 이동이 빠진다

### AC-08

**사진을 바꾼다.** 사진 스텝에서 원을 누른다.

- 누르면 `<input type="file" accept="image/*">`가 열린다. 고르면 브라우저가 512px 정사각 webp로 줄인다(`src/shared/lib/resize-image.ts` — canvas, 짧은 변 기준 가운데 자르기) → `upload-avatar` → `update-my-photo` → `['profile']` 무효화 → 칸 안 원이 새 사진으로 바뀌고 곧바로 굳는다(「기본 사진 쓰기」를 다시 누르게 하지 않는다)
- 올리는 동안 원 위에 스피너, 원과 버튼 disabled. 실패하면 칸 아래 `fg.critical` `text-xs` 「사진을 올리지 못했어요. 다시 골라 주세요」, 원은 그대로
- 「보내기」와 따로 간다 — 올린 순간 저장된다. 잠김 안내에는 안 선다. 굳은 원을 누르면 사진 스텝으로 돌아와 다시 고를 수 있다
- 사진의 기본값은 구글 사진(`avatarUrl`)이고, `photo_url`이 있으면 그것이 이긴다

### AC-09

**거절된 뒤와 다시 보내기.** 승인 대기 화면이 [거절된 뒤](../../2-design/modules/account/screens/login.md#거절된-뒤) 표대로 바뀐다.

- 알약 「아직 연결 전」(점 없음, `bg.neutral-weak`), 제목 「이번엔 연결이 안 됐어요」, 도는 문구 대신 한 줄 「프로필을 고쳐서 다시 보낼 수 있어요」. 알림 영역이 사라진다. 버튼은 「다시 보내기」(primary)와 로그아웃(ghost)
- 「다시 보내기」 → 프로필 작성 화면이 지난 것 다섯을 다 굳은 채 선다 — 이름·사진은 `['profile']` 행에서, 성별·생년월일·연락처는 `get-my-private-profile`에서. 안내 한 줄은 「아래 정보가 맞나요?」, 잠김 안내와 「보내기」가 바로 서고, 고칠 것만 눌러 칸으로 내린다
- 다시 보낸 뒤 `submit_profile`이 `rejected_at`을 비우니 승인 대기 「기다리는 중」으로 돌아간다

### AC-10

**`/left`와 `/blocked`가 문서대로 선다.** `src/screens/left/ui/left-screen.tsx`가 [퇴사한 뒤 짜임](../../2-design/modules/account/screens/login.md#퇴사한-뒤-짜임) 순서(제목 「근무를 마치셨어요」 → 「지난 급여는 계속 볼 수 있어요」 → 「급여 보기」 primary → 가는 선 → 계정 한 줄 → 로그아웃 ghost)로 선다. 등장 모션 없음. 「급여 보기」는 `/payroll`로 간다 — 그 경로는 급여 task가 만든다([리스크](#리스크전환되돌리기)). `src/screens/blocked/ui/blocked-screen.tsx`는 [차단된 뒤 짜임](../../2-design/modules/account/screens/login.md#차단된-뒤-짜임) 순서(제목 「이 계정은 지금 이용할 수 없어요」 → 「궁금한 점은 관리자에게 물어보세요」 → 가는 선 → 계정 한 줄 → 로그아웃 ghost)로 선다 — 퇴사 화면에서 「급여 보기」만 뺀 것이라 틀을 같이 쓴다. 같은 틀의 셋째가 [읽기 실패 짜임](../../2-design/modules/account/screens/login.md#읽기-실패-짜임)이다 — 게이트가 `ensure_profile()`이나 `['profile']` 읽기에 실패하면 `src/features/auth/ui/gate-failed-screen.tsx`가 제목 「불러오지 못했어요」 → 「연결을 확인하고 다시 시도해 주세요」 → 「다시 시도」 primary(누르면 버튼 안 스피너, `refetch`) → 가는 선 → 계정 한 줄 → 로그아웃 순서로 선다. 성공하면 원래 목적지가 뜨고 실패하면 그대로다.

### AC-11

**공용 UI가 는다.** `src/shared/ui/`에 shadcn의 Input과 세그먼트·스피너. 토큰은 [components.md](../../2-design/design-system/components.md#input)의 Input·[세그먼트](../../2-design/design-system/components.md#세그먼트) 표를 따른다. 굳은 글 더미와 날아가는 모션은 이 화면만 쓰니 `src/screens/pending/ui/` 안이다. `src/shared/ui/`는 unit 훅 면제고 e2e가 덮는다.

### AC-12

**테스트.**

- unit: AC-06의 세 모습 판정, AC-07의 스텝 판정·굳는 판정·하이픈·여덟 자리 → 날짜·굳은 글 표기·보내기 가능 여부, `resize-image`의 크기 계산(canvas는 모의), `DomainError`·`TransportError` 가르기, 코드 목록 대조
- integration: `submit_profile`의 `invalid_gender`·`invalid_phone`, `get-my-private-profile`(본인 행·없으면 null), `submit-profile` dal의 오류 가르기(`already_submitted` → `DomainError`), Storage 정책(자기 폴더 upload 성공, 남의 폴더 실패, 공개 URL 읽기), `update-my-photo`
- e2e: 새 사용자가 `/pending`을 열면 프로필 작성이 뜨고 다섯을 채워 보내면 승인 대기로 바뀐다(DB에 `submitted_at`·`profile_private` 행); 거절된 사용자(`createRejectedUser` 헬퍼)가 열면 「거절된 뒤」가 뜨고 「다시 보내기」로 지난 값이 든 폼이 선다; 퇴사자가 `/left`를 열면 제목과 「급여 보기」가 보인다; 차단된 사용자가 `/blocked`를 열면 제목과 로그아웃만 보인다; `page.route`로 `ensure_profile` 호출을 막고 열면 「불러오지 못했어요」가 뜨고, 막은 것을 풀고 「다시 시도」를 누르면 원래 목적지가 뜬다. 기존 `pending.spec.ts`는 시드가 프로필을 안 보낸 사용자라 지금 단언(승인 대기 화면)이 깨진다 — 시드를 「보낸 사용자」로 바꾸는 것만 허용하고 단언은 안 바꾼다

### AC-13

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·`pnpm build && pnpm e2e` 전부 초록. 시안 `login.sian.html`이 문서와 맞는지 `sian-auditor`가 본다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/shared/api/error-codes.ts`·`errors.ts`·`__tests__/` · `tests/lint/error-codes.ts`와 테스트 | 코드 목록, 예외 둘, 마이그레이션 대조 | AC-01 |
| `supabase/migrations/20260825162027_profiles.sql` | `submit_profile` 꼴 검사, `avatars` 버킷과 정책 | AC-02·AC-03 |
| `.github/workflows/ci.yml` · `docs/4-test/execution.md` | `storage-api`를 띄운다 | AC-03 |
| `src/entities/profile/dals/get-my-private-profile.ts`·`submit-profile.ts`·`upload-avatar.ts`·`update-my-photo.ts`·`__tests__/*.integration.test.ts` | 읽기 하나, 쓰기 셋 | AC-04 |
| `src/features/auth/use-auth-gate.ts`·`ui/auth-gate.tsx`·`__tests__/` | 컨텍스트에 `userId`·프로필 행 | AC-05 |
| `src/screens/pending/model/*.ts`·`__tests__/` · `ui/pending-screen.tsx`·`ui/profile-form-screen.tsx`(이름은 구현이 정한다) | 세 모습 판정, 폼 계산, 화면 둘 | AC-06~AC-09 |
| `src/shared/lib/resize-image.ts`·`__tests__/` | 512px 정사각 webp | AC-08 |
| `src/screens/left/ui/left-screen.tsx` · `src/app/left/page.tsx` · `src/screens/blocked/ui/blocked-screen.tsx` · `src/app/blocked/page.tsx` · `src/features/auth/ui/gate-failed-screen.tsx`(게이트에서 부른다) | 퇴사한 뒤·차단된 뒤·읽기 실패 화면 | AC-10 |
| `src/shared/ui/input.tsx`·`segmented.tsx`·`spinner.tsx`(이름은 shadcn 관례) | 공용 UI | AC-11 |
| `tests/integration/postgres.ts` · `tests/e2e/pending.spec.ts`(시드만) · `tests/e2e/profile-form.spec.ts`·`left.spec.ts`·`blocked.spec.ts`·`gate-failed.spec.ts` | 거절 헬퍼, e2e | AC-12 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-12를 층에 배정한다. 폼 계산과 세 모습 판정은 unit, 함수·정책·dals는 integration, 화면 흐름 셋은 e2e다
2. `unit-test-writer`·`integration-test-writer`·`e2e-test-writer`가 실패 테스트를 쓴다. integration이 헬퍼(`createRejectedUser`)를 먼저 세우고 e2e가 그것을 쓴다
3. `implementer`가 오류 기계 → 마이그레이션(`db reset`) → dals → 컨텍스트 → 공용 UI → 세 모습 판정 → 프로필 작성 화면 → 사진 → 거절된 뒤 → `/left` 순으로 초록을 만든다. 컨텍스트를 먼저 넓혀야 화면이 판정할 값이 생긴다
4. `sian-auditor`가 시안과 문서를 대조하고 `pnpm build && pnpm e2e`로 spec 전부를 본다

배포한 적이 없어 호환 기간이 없다. 마이그레이션은 파일을 고치고 `db reset`이 되돌리기다.

## 리스크·전환·되돌리기

- **CI가 `storage-api`를 띄우면 integration 잡이 느려진다.** 컨테이너 하나가 더 뜬다. 정책 테스트를 CI에서 안 돌리는 길은 없다 — 버킷 정책이 틀리면 남의 사진을 덮어쓴다
- **`storage` 스키마가 없는 스택.** `storage-api`가 안 뜨면 `storage.buckets` insert가 실패해 마이그레이션 전체가 안 선다. 로컬은 기본이 켜져 있고 CI는 AC-03이 켠다
- **canvas는 jsdom에 없다.** `resize-image`의 unit은 크기 계산과 호출 순서를 모의로 보고, 실제 변환은 e2e의 사진 바꾸기(픽스처 이미지 하나)가 본다
- **「급여 보기」가 404다.** `/payroll`은 급여 task가 만든다. 그때까지 퇴사자가 누르면 Next 기본 404가 뜬다 — 퇴사 처리 화면(`members.md`)도 아직 없어 실제 퇴사자가 생기지 않는다
- **`pending.spec.ts`의 시드가 바뀐다.** 지금 시드는 프로필을 안 보낸 사용자라 이 task 뒤엔 폼이 뜬다. 단언은 그대로 두고 시드만 「보낸 사용자」로 바꾼다 — `git diff`에 단언 줄이 없어야 한다
- **옛 사진 파일이 남는다.** [사진 저장](../../2-design/modules/account/design.md#사진-저장)이 정한 대로 지우지 않는다. 정리는 나중 일이다
- **`invalid_gender`·`invalid_phone`은 화면이 먼저 막는다.** `DomainError`로 오면 화면 검사가 뚫린 것이니 `TransportError`와 같은 문안을 잠김 안내 자리에 세운다 — 페이지 문서가 따로 정하지 않았다

## 검증 방법

| 완료 조건·규칙 참조 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- |
| AC-01 | unit `src/shared/api/__tests__/`(예정), `tests/lint/error-codes.test.ts`(예정) | `pnpm test` | 코드 목록과 마이그레이션 `raise` 문자열 일치, 예외 둘 가르기 |
| AC-02·AC-03·AC-04 | integration `src/entities/profile/dals/__tests__/*.integration.test.ts`(예정) | `pnpm test:integration:run`, 로컬 Supabase(storage-api 포함) | `invalid_gender`·`invalid_phone`, 자기 폴더만 쓰기, 공개 URL 읽기 |
| AC-05 | unit `src/features/auth/__tests__/use-auth-gate.test.ts` | `pnpm test` | 컨텍스트 값에 `userId`·프로필 행 |
| AC-06·AC-07·AC-08 | unit `src/screens/pending/model/__tests__/`(예정), `src/shared/lib/__tests__/resize-image.test.ts`(예정) | `pnpm test` | 세 모습, 칸 검사, 하이픈, 날짜, 크기 계산 |
| AC-07·AC-08·AC-09·AC-10 | e2e `tests/e2e/profile-form.spec.ts`(예정)·`left.spec.ts`·`blocked.spec.ts`·`gate-failed.spec.ts` | `pnpm build && pnpm e2e` | 보내면 승인 대기, 거절된 뒤 다시 보내기, 사진 바꾸기, 퇴사·차단·읽기 실패 화면 |
| AC-11 | e2e 위 spec | 위와 같다 | 컴포넌트가 화면에 선다 |
| AC-13 | 전부 + `sian-auditor` | 위 명령 전부 | 초록, 시안 어긋남 없음 |

## 범위 밖

- 승인된 뒤 프로필을 고치는 화면(`/me`)과 연락처 직접 갱신 — [profile-screen](profile-screen.md)
- 알림 켜기의 실제 푸시 구독 — `notification-first`
- `/payroll` — 급여 task
- 옛 사진 파일 정리
- 타입 생성(`pnpm types`) — `types-generation`
