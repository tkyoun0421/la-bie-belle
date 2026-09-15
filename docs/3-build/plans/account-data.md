---
sources:
  - ../../2-design/modules/account/design.md#소유-데이터
  - ../../2-design/modules/account/design.md#행위별-구현-계약
  - ../../2-design/modules/account/README.md#업무-규칙
  - ../../2-design/system/data-access.md#읽기-rls-기본값
  - ../../2-design/adr/ADR-003-supabase-and-integration-tests.md#권한을-db에-둔다
---

# 계정 데이터 구조를 전환한다 — 구현 계획

## 입력 명세·기준

정본은 [design.md](../../2-design/modules/account/design.md#소유-데이터)와 [design.md](../../2-design/modules/account/design.md#행위별-구현-계약)다. 업무 규칙은 [README.md](../../2-design/modules/account/README.md#업무-규칙)에 있다.

지금 저장소의 `supabase/migrations/20260825162027_profiles.sql`은 `profiles` 한 표에 `id = auth.users.id`(cascade)다. 정본이 정한 모양과 세 군데가 어긋난다 — 프로필 신원이 구글 계정에 묶여 있어 계정을 잇거나 계정만 지우는 길이 없고, 개인정보가 같은 표에 있어 열 단위로 못 가리고, 새 로그인마다 트리거가 빈 프로필을 만든다. 마이그레이션 하나가 셋을 같이 뒤집는다. 기존 integration 테스트 둘과 그 헬퍼도 「본인만 읽는다」를 전제로 쓰여 같이 간다.

배포한 적이 없어 기존 마이그레이션 파일을 고친다. 새 파일로 `alter table`을 쌓으면 PK를 갈아 끼우는 줄이 길어지고, 최종 모습을 보려면 파일 둘을 겹쳐 읽어야 한다. 로컬과 CI는 `supabase db reset`으로 처음부터 만든다.

확인한 코드와 Git 기준점은 셋이다 — `supabase/migrations/20260825162027_profiles.sql`이 `e4ecf84`, `tests/integration/postgres.ts`와 `src/entities/profile/dals/get-approved-at.ts`가 `9467c13`이다.

## 완료 조건

### AC-01

**표.**

- `supabase/migrations/20260825162027_profiles.sql`이 표 둘을 만든다. `profiles(id uuid primary key default gen_random_uuid(), user_id uuid unique references auth.users (id) on delete set null, display_name text, photo_url text, role text not null default 'member' check (role in ('member', 'admin')), submitted_at timestamptz, approved_at timestamptz, rejected_at timestamptz, blocked_at timestamptz, left_at timestamptz, erased_at timestamptz, created_at timestamptz not null default now())`와 `profile_private(profile_id uuid primary key references public.profiles (id) on delete cascade, phone text, birth_date date, gender text)`다. 파일명은 그대로 둔다 — 새 타임스탬프를 받을 이유가 없다
- `user_id`에 부분 인덱스가 아니라 `unique` 제약을 건다. null이 여럿 들어올 수 있어야 한다 — 계정을 지운 프로필이 여럿이면 전부 null이다
- `create_profile_for_new_user()` 함수와 `on_auth_user_created` 트리거가 사라진다

### AC-02

**판정 함수.**

- `public.is_approved()`가 현재 사용자의 프로필이 승인됐고 차단되지 않았는지 돌려준다 — `approved_at is not null and blocked_at is null`. `security definer`에 `set search_path = ''`이고 RLS 정책이 이 함수를 부른다. `blocked_at is null`을 품는 근거는 [design.md](../../2-design/modules/account/design.md#차단)다
- `public.is_admin()`이 현재 사용자의 `role`이 `'admin'`인지 돌려준다. 관리자 함수의 권한 검사와 `profile_private` 읽기 정책이 부른다
- 둘 다 세션이 없거나 프로필이 없으면 거짓이다

### AC-03

**RLS.**

- `profiles` 읽기 — 본인(`user_id = (select auth.uid())`)이거나 `is_approved()`다. 승인 전에도 본인 행은 읽는다. 그래야 `/pending`이 자기 상태를 그린다. 기본값을 좁히는 근거는 [data-access.md](../../2-design/system/data-access.md#읽기-rls-기본값)의 예외 「승인 전은 자기 `profiles`·`profile_private` 행만 읽는다」다
- `profiles`에 직접 쓰기 정책이 없다. `insert`·`update`·`delete` 권한을 `authenticated`에서 회수한다 — 이 표를 바꾸는 길은 함수뿐이다
- `profile_private` 읽기 — 본인이거나 `is_admin()`
- `profile_private` 쓰기 — 본인 행의 `phone`만. `update` 권한을 회수하고 `grant update (phone)`을 준다. `insert`·`delete` 권한은 없다. 저장소에서 테이블 직접 쓰기 정책이 있는 유일한 자리다

### AC-04

**근무자 함수.**

전부 `security definer`에 `set search_path = ''`이고, 부르는 사람의 프로필을 `auth.uid()`로 찾는다.

- `ensure_profile()` — 자기 프로필 행이 없으면 `user_id`만 채운 행을 넣고, 있으면 아무것도 안 한다. 두 번 불러도 행이 하나다. 세션이 없으면 던진다
- `submit_profile(display_name text, phone text, birth_date date, gender text)` — `profiles.display_name`과 `submitted_at`을 채우고 `profile_private` 행을 넣는다(이미 있으면 갱신). 이미 제출됐고 `rejected_at`이 비어 있으면 `already_submitted`로 던진다 — 거절된 뒤에는 다시 받는다. 거절 뒤 재제출은 `rejected_at`을 비운다
- `update_my_photo(photo_url text)` — 자기 행의 `photo_url`만 바꾼다. 인자는 주소 문자열이다 — 사진을 어디 두는지는 [design.md](../../2-design/modules/account/design.md#q-01)가 열려 있고, 이 task는 주소를 받아 쓰는 자리까지만 만든다

### AC-05

**관리자 함수.**

`is_admin()`이 거짓이면 `forbidden`으로 던진다.

- `approve_member(profile_id uuid)` — `approved_at`을 찍고 `rejected_at`을 비운다. 이미 승인된 사람이면 아무것도 안 한다
- `reject_member(profile_id uuid)` — `rejected_at`을 찍는다. 이미 승인된 사람은 `already_approved`로 던진다

`approve_member`는 [design.md](../../2-design/modules/account/design.md#가입-승인거절차단해제)가 정한 대로 `wage_rates` 첫 행도 같이 넣어야 한다. 그 표가 아직 없어 이번에는 `profiles`만 만진다 — 시급 행을 넣는 줄과 그것을 보는 integration 한 줄은 급여 task가 이 함수를 다시 열어 더한다. 급여 task의 완료 조건에 그 줄이 들어가야 승인된 사람의 급여 화면이 빈 채로 남지 않는다.

### AC-06

**바꿀 코드.**

- `src/entities/profile/dals/get-approved-at.ts`가 `eq("id", userId)`를 `eq("user_id", userId)`로 바꾼다. 승인 판정을 클라이언트로 옮기는 일은 이 task가 아니다 — [backlog.md](../../backlog.md)의 `auth-entry` 행이다
- `tests/integration/postgres.ts`의 `approveProfile`이 `where user_id = ...`로 찾는다. `createApprovedUser`가 그 뒤로도 승인된 사용자를 돌려준다
- `tests/integration/supabase.ts`의 `createSignedInUser`가 가입 뒤 `ensure_profile()`을 부른다. 트리거가 빠지면 가입만으로는 프로필 행이 없고, 지금 테스트 셋은 행이 있다는 전제 위에 서 있다 — 프로필 행을 만드는 자리도 헬퍼 하나로 남는다
- `src/entities/profile/dals/__tests__/get-approved-at.integration.test.ts`의 세 단언은 그대로다. 헬퍼가 `ensure_profile()`을 부른 뒤라 전제가 그대로 선다

### AC-07

**integration 테스트.**

기존 `src/entities/profile/dals/__tests__/profile.integration.test.ts`의 「남의 프로필은 한 행도 읽지 못한다」는 전제가 뒤집혔다 — 승인된 사람은 남의 프로필을 읽는다. 그 파일을 새 규칙으로 다시 쓰고, 함수마다 파일을 가른다. 아래가 한 줄씩 테스트다.

- 읽기 — 승인 전에도 본인은 자기 프로필을 읽는다 / 승인 전에는 남의 프로필을 한 행도 못 읽는다 / 승인되면 남의 프로필도 읽는다 / 차단되면 남의 프로필을 다시 못 읽는다 / 로그아웃 상태로는 한 행도 못 읽는다
- `profiles` 직접 쓰기 — 본인이 자기 `display_name`을 직접 못 고친다 / 자기 `approved_at`을 못 찍는다 / 자기 행을 못 지운다 / 남의 `photo_url`을 못 고친다
- `profile_private` — 본인은 자기 행을 읽는다 / 남의 행은 못 읽는다 / 관리자는 남의 행을 읽는다 / 본인은 자기 `phone`을 직접 고친다 / 본인이 자기 `birth_date`는 직접 못 고친다 / 남의 `phone`을 못 고친다
- `ensure_profile` — 처음 부르면 행이 생긴다 / 두 번 불러도 행이 하나다 / 다른 사람이 부르면 그 사람 행이 따로 생긴다
- `submit_profile` — 제출하면 `profiles.display_name`과 `submitted_at`과 `profile_private` 행이 같이 찬다 / 두 번째 제출은 `already_submitted`로 막힌다 / 거절된 뒤에는 다시 제출된다
- `update_my_photo` — 본인이 부르면 자기 `photo_url`이 바뀐다 / 남의 프로필은 안 바뀐다(관리자가 불러도 마찬가지)
- `approve_member` — 관리자가 부르면 `approved_at`이 찍힌다 / 거절됐던 사람을 승인하면 `rejected_at`이 비워진다 / 관리자가 아니면 `forbidden`으로 막힌다
- `reject_member` — 관리자가 부르면 `rejected_at`이 찍힌다 / 이미 승인된 사람은 `already_approved`로 막힌다 / 관리자가 아니면 `forbidden`으로 막힌다
- `is_approved`·`is_admin` — 세션 없이 부르면 거짓이다 / 프로필이 없으면 거짓이다

헬퍼는 `tests/integration/postgres.ts`에 관리자 사용자와 차단된 사용자를 만드는 것이 는다. 승인 데이터를 손으로 넣는 자리가 헬퍼 하나로 남아야 한다.

### AC-08

**검증.**

- `pnpm test:integration:run`이 초록이다
- `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다
- e2e가 고치지 않은 채 초록이다. 로그인과 승인 대기 화면의 동작이 바뀌지 않는다 — 트리거가 빠졌으니 로그인 뒤 프로필이 생기는 자리를 확인한다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/20260825162027_profiles.sql` | 표 둘과 제약, 판정 함수 둘, RLS와 grant, 근무자 함수 셋, 관리자 함수 둘 | AC-01·AC-02·AC-03·AC-04·AC-05 |
| `tests/integration/postgres.ts` | `approveProfile`이 `user_id`로 찾기, 관리자·차단 사용자 헬퍼 | AC-06·AC-07 |
| `tests/integration/supabase.ts` | `createSignedInUser`가 가입 뒤 `ensure_profile()`을 부른다 | AC-06 |
| `src/entities/profile/dals/get-approved-at.ts` | 읽는 열을 `user_id`로 | AC-06 |
| `src/entities/profile/dals/__tests__/get-approved-at.integration.test.ts` | 단언은 그대로. 헬퍼 전제만 바뀐다 | AC-06 |
| `src/entities/profile/dals/__tests__/profile.integration.test.ts`와 함수별 새 테스트 파일 | 새 RLS 규칙으로 다시 쓰기. 파일은 함수마다 가른다 | AC-07 |

## 구현 순서

기능 task 파이프라인이 CLAUDE.md의 흐름이라 `test-planner` → `integration-test-writer` → `implementer` 순서다.

1. `test-planner`가 AC-07의 목록을 층에 배정한다. 목록이 먼저 층으로 갈려야 어느 파일에 무엇이 들어가는지 정해진다
2. `integration-test-writer`가 배정받은 목록으로 실패하는 테스트를 쓴다. `tests/integration/postgres.ts`의 관리자·차단 사용자 헬퍼가 그 테스트의 입력이라 같이 온다
3. `implementer`가 마이그레이션(AC-01~AC-05)과 `get-approved-at.ts`(AC-06)를 고쳐 그 빨간불을 초록으로 바꾼다. 표와 함수가 먼저 서야 테스트가 붙을 자리가 생긴다
4. e2e가 고치지 않은 채 초록인지 본다(AC-08). 트리거가 빠진 뒤 로그인 흐름이 어디서 막히는지는 여기서만 드러난다

배포한 적이 없어 읽기·쓰기의 호환 기간이 없고, 되돌리기는 `supabase db reset`이다 — 마이그레이션 파일을 되돌리고 다시 reset하면 옛 모양으로 돌아온다.

## 리스크·전환·되돌리기

- **트리거가 빠진 자리** — 로그인 뒤 프로필이 생기는 자리를 확인한다(AC-08). `ensure_profile()`을 부르는 자리가 서기 전까지 로그인만 한 사람에게는 프로필 행이 없다
- **기존 integration 테스트의 전제** — 「남의 프로필은 한 행도 읽지 못한다」가 뒤집힌다(AC-07). 고친 테스트가 새 규칙을 다시 적는 것이지 옛 규칙을 통과시키려고 단언을 낮춘 것이 아니어야 한다
- **정본과 이 plan이 갈리는 자리** — [design.md](../../2-design/modules/account/design.md#가입-승인거절차단해제)는 승인이 `wage_rates` 첫 행을 같이 넣는다고 정했고 이 plan은 `profiles`만 만진다(AC-05). 그 표가 없어서 벌어진 간격이고 급여 task가 닫는다
- **사진 저장 위치** — [design.md](../../2-design/modules/account/design.md#q-01)가 열린 채라 `update_my_photo`는 주소를 받아 쓰는 자리까지만 선다(AC-04). 저장 위치가 정해지면 그 주소를 만드는 자리가 따로 온다

## 검증 방법

| 완료 조건·규칙 참조 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- |
| AC-01·AC-02 | integration — 판정 함수와 표 제약을 보는 새 테스트 파일(예정) | `pnpm test:integration:run`, 로컬 Supabase | 초록 |
| AC-03 | integration — 읽기·`profiles` 직접 쓰기·`profile_private` 테스트 파일(예정) | `pnpm test:integration:run`, 로컬 Supabase | 초록 |
| AC-04 | integration — `ensure_profile`·`submit_profile`·`update_my_photo` 테스트 파일(예정) | `pnpm test:integration:run`, 로컬 Supabase | 초록 |
| AC-05 | integration — `approve_member`·`reject_member` 테스트 파일(예정) | `pnpm test:integration:run`, 로컬 Supabase | 초록 |
| AC-06 | integration — `src/entities/profile/dals/__tests__/get-approved-at.integration.test.ts` | `pnpm test:integration:run`, 로컬 Supabase | 초록 |
| AC-07 | 위 파일들과 `tests/integration/postgres.ts`의 헬퍼 | `pnpm test:integration:run`, 로컬 Supabase | 목록 한 줄마다 테스트 하나 |
| AC-08 | 저장소 전체 검사와 e2e | `pnpm lint` · `pnpm typecheck` · `pnpm test`, `pnpm build` 뒤 `pnpm e2e` | 초록. e2e 파일 변경이 0이다 |

## 범위 밖

- 인증 진입 전환. `middleware.ts`를 `proxy.ts`로 바꾸고 `readAuthGate`의 승인 판정을 클라이언트 `['profile']`로 옮기는 일은 `backlog.md`의 다음 task다([design.md](../../2-design/modules/account/design.md#첫-진입과-게이트)) — [backlog.md](../../backlog.md)의 `auth-entry` 행이다
- `block_member`·`unblock_member`·`set_role`·`set_display_name`·`link_account`·`mark_leave`·`undo_leave`. 열은 이번에 만들지만 함수는 그 화면을 그리는 task가 만든다. 1차 릴리스 목록에 없다([roadmap](../../1-plan/roadmap.md#릴리스-목록))
- `erase_profiles()`와 pg_cron 등록, Edge Function `erase-account`. 퇴사가 1년 지난 데이터가 아직 없다
- `wage_rates` 표와 `approve_member`의 시급 행. 급여 task다
- 사진 저장 위치와 업로드 경로. `update_my_photo`가 받는 주소를 누가 만드는지는 [design.md](../../2-design/modules/account/design.md#q-01)가 연 채다
- 타입 생성(`pnpm types`). 별도 task다
- 관리자 화면. 함수만 만들고 부르는 화면은 그 task가 만든다
