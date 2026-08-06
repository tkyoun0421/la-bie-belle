# P1-T02 RADIO 개발 설계

- 상태: Approved
- revision: 3
- 기획 승인: user, 2026-08-06
- 개발 설계 승인: user, 2026-08-06 (revision 2·3은 MUST 위계가 정한 보정 — 아래 개정 이력)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. 기획 인터뷰 확정 6건(enum 5종 전체·휴대폰 unique·성별 2값·연령 하한 없음·정적 문의 문구·처리방침 편입) 반영. 기존 E2E와의 충돌 2건(지원 코드 insert·탭 진입 전제)을 설계에 명시. |
| 2 | 2026-08-06 | 구현 전 발견된 정본 충돌 보정: P0-T03이 사람 속성용으로 예약한 기존 `gender` enum이 있는데 revision 1이 `profile_gender` 신설을 지시해 `DEV-SSOT-01` MUST와 충돌했다. MUST는 RADIO로 면제되지 않으므로 기존 `gender` 재사용으로 정정(값 집합 male·female 불변, 사용자 재량 없는 위계 보정). |
| 3 | 2026-08-06 | 구현 전 발견된 레이어 충돌 보정: `require-active-profile` 헬퍼를 `shared/lib`에 두면 shared→entities import가 `DEV-ARCH-01` MUST에 막히고 자체 조회 구현은 `DEV-REUSE-04`·`DEV-SSOT-01` MUST를 어긴다. 파일 위치만 `entities/identity/api`로 이동(함수 이름·시그니처·첫 줄 소비 계약·소비자 전부 불변, 사용자 재량 없는 위계 보정). |

- 관련 spec: PRD:AC-12, DOMAIN:IDENTITY, ADR:0002
- 적용 깊이: 심화 (PII 수집 시작점 — 서버 검증·RLS·상태 가드가 본체다)
- test mode: tdd (index에 봉인 시 기록)
- 예정 check IDs: profile-api, pending-approval-e2e (index에 기획 시점 기록 완료)

## Requirements

### 범위와 비목표

- 범위: ① profiles 확장 마이그레이션(status enum 5종·폼 필드 4종·unique·CHECK) + RLS insert 정책 + pgTAP ② 가입 제출 Server Action(서버 검증·typed Result·오류 코드 레지스트리 신설) ③ 온보딩 자리표시를 실제 가입 폼으로 교체 ④ `/pending` 승인 대기 화면 ⑤ 상태 가드(무프로필→온보딩, pending→대기 화면, 서버 경계 강제) + 이후 task가 소비할 활성 상태 요구 헬퍼 ⑥ `/privacy` 처리방침 정적 페이지 + 폼 동의 문구 + 로그인 화면 링크(F-14 해소) ⑦ E2E·pgTAP 확장.
- 비목표(기획 승인 그대로): 승인·거절 처리(P1-T03), 역할(P1-T04), 프로필 수정(P1-T05), 상태 전이 로직·휴면(P1-T06), pending 중 재제출, SMS 본인 인증, 관리자 연락처 설정. 설계 비목표: proxy의 DB 조회 도입(상태 가드는 레이아웃·액션 계층이 소유), 기존 인증 흐름(P1-T01) 변경.

### 불변 규칙

- 상태 전이 규칙·의미의 정본은 P1-T06이다. 이 task는 enum 값 선언과 `pending` 생성만 소유한다.
- 검증·차단은 서버가 정본이다: Zod 서버 검증 + DB 제약(unique·CHECK·RLS)의 이중 강제. 클라이언트 검증은 보조다(`DEV-SEC`, `DEV-SSOT-04` — 의미 정본은 서버 스키마, DB 제약은 방어적 투영).
- Server Action 실패는 `{ ok: false, code, fieldErrors? }`(code는 레지스트리 ErrorCode)다(`DEV-ERR-08`). 신설 코드는 `error-codes.config.ts`가 소유한다.
- RLS는 본인 행 · `pending` 상태의 insert만 허용한다. update·delete 정책은 만들지 않는다(이후 task 소유).
- 기존 E2E 시나리오(미인증 리다이렉트·로그인·세션 주입 진입·로그아웃)는 유지하되, 상태 가드 도입에 따라 세션 주입 사용자의 전제를 "active 프로필 보유"로 갱신한다. E2E 지원 코드의 profiles insert는 새 필수 컬럼을 채우도록 갱신한다 — 시나리오 의미는 불변, 픽스처 전제만 갱신이다.
- P1-T01이 만든 인증 경계(proxy·getUser·fail-closed)는 바뀌지 않는다.

### 기술 인수 조건

1. profile 없는 인증 사용자가 `/onboarding`에서 이름·휴대폰·성별·생년월일 폼을 보고, 유효 제출 시 `pending` 프로필이 생성되며 `/pending`으로 이동한다.
2. 서버 검증이 필수값·형식을 강제한다: 이름 비공백, 휴대폰 한국 형식 정규화(숫자만 저장), 생년월일 유효 날짜·미래 불가(연령 하한 없음), 성별 male·female. 위반은 필드별 `fieldErrors`와 레지스트리 코드로 반환된다.
3. 휴대폰 중복이 DB unique로 차단되고 전용 코드·"이미 가입된 번호" 안내가 반환된다.
4. pending 사용자가 보호 탭·`/onboarding`에 접근하면 `/pending`으로 보내지고, `/pending`은 대기 상태와 정적 문의 문구를 렌더한다(삭제 기한 연장 표현 없음 — 디자인 정본 준수).
5. active 프로필 사용자는 탭 접근이 유지되고 `/onboarding`·`/pending` 접근 시 홈으로 보내진다.
6. 브라우저 요청 조작이 서버에서 차단된다: 프로필 보유 사용자의 가입 제출 재호출이 코드와 함께 거부되고, 활성 상태 요구 헬퍼가 pending 사용자를 거부하는 계약이 테스트로 고정된다(AC-12).
7. RLS pgTAP: 본인·pending insert 허용, 타인 id·비pending 상태 insert 차단, 중복 insert 차단, 익명 차단, update·delete 기본 거부 유지(값 단언 포함).
8. `/privacy`가 공개 경로로 렌더되고, 가입 폼 하단에 동의 문구(제출 = 동의), 로그인 화면에 처리방침 링크가 있다(F-14 backlog 해소).
9. E2E: 가입 완주(무프로필 주입 사용자 → 폼 제출 → `/pending` 도달), pending 사용자의 탭 접근이 `/pending`으로 리다이렉트, 프로필 보유 사용자의 제출 재호출 거부.
10. `pnpm verify` 전체와 `pnpm db:test` 통과. 기존 E2E 시나리오가 갱신된 픽스처로 계속 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 가입 완주 | 테스트함 — 폼 제출→pending 행→/pending E2E와 액션 통합 테스트 | 테스트함 — 검증 실패 시 행 미생성·fieldErrors 반환 | 테스트함 — 공백 이름·잘못된 날짜 형식 각각 거부 | 테스트함 — 미인증 제출이 거부됨 | 테스트함 — 제출 성공 직후 재제출이 프로필 보유 코드로 거부 | 해당 없음 — 동시 제출은 PK·unique 제약이 DB에서 원자적으로 강제한다 |
| 2 서버 검증 | 테스트함 — 유효 입력의 정규화 저장(하이픈 제거) 단위 테스트 | 테스트함 — 필드별 위반이 각자 코드·fieldErrors로 반환 | 테스트함 — 하이픈·공백 포함 번호 정규화, 미래 생년월일 거부, 잘못된 성별 값 거부 | 해당 없음 — 입력 검증 자체는 권한 판정이 없다 | 해당 없음 — 검증은 상태를 만들지 않는다 | 해당 없음 — 순수 함수 검증이다 |
| 3 휴대폰 중복 | 테스트함 — 신규 번호 통과 | 테스트함 — 기존 번호 제출이 전용 코드로 거부(통합) | 테스트함 — 하이픈 표기만 다른 같은 번호가 정규화 후 중복으로 판정 | 해당 없음 — 중복 판정에 권한 분기가 없다 | 테스트함 — 같은 번호 재제출이 같은 코드로 일관 거부 | 해당 없음 — unique 제약이 DB에서 원자적으로 강제한다 |
| 4 pending 차단 | 테스트함 — /pending 렌더(상태·문의 문구) 단위 테스트 | 테스트함 — pending 사용자의 탭 접근이 /pending으로 가는 E2E | 테스트함 — pending 사용자의 /onboarding 접근도 /pending으로 | 테스트함 — 차단이 서버 경계(레이아웃·헬퍼)에서 강제됨을 E2E로 | 해당 없음 — 리다이렉트는 멱등 GET이다 | 해당 없음 — 요청별 독립 판정이다 |
| 5 active 통과 | 테스트함 — active 픽스처의 탭 접근 유지 E2E(기존 시나리오 갱신) | 테스트함 — active 사용자의 /onboarding·/pending 접근이 홈으로 | 해당 없음 — 두 상태 외 값은 P1-T06 전이 소유라 이번 분기 대상이 아니다 | 테스트함 — 판정 입력이 서버 조회 프로필임을 통합 테스트로 | 해당 없음 — 리다이렉트는 멱등 GET이다 | 해당 없음 — 요청별 독립 판정이다 |
| 6 조작 차단 | 테스트함 — 활성 상태 요구 헬퍼의 허용 경로 단위 테스트 | 테스트함 — pending·무프로필 사용자를 코드와 함께 거부 | 테스트함 — 프로필 보유자의 가입 재호출 거부(E2E 포함) | 테스트함 — 헬퍼 우회 없이 RLS가 최종 방어임을 pgTAP으로 | 테스트함 — 거부 응답이 반복 호출에도 일관됨 | 해당 없음 — 판정은 요청별 독립이고 쓰기는 DB 제약이 강제한다 |
| 7 RLS | 테스트함 — 본인 pending insert 허용 pgTAP | 테스트함 — 타인 id·비pending 상태·익명 insert 차단 pgTAP | 테스트함 — 중복 insert·update·delete 거부(값 단언 포함) | 테스트함 — service role 없이 사용자 경로로 검증 | 해당 없음 — 제약 위반은 상태를 바꾸지 않는다 | 해당 없음 — PK·unique가 원자적으로 강제한다 |
| 8 처리방침 | 테스트함 — /privacy 렌더·폼 동의 문구·로그인 링크 단위 테스트 | 해당 없음 — 정적 콘텐츠라 실패 경로가 없다 | 해당 없음 — 정적 콘텐츠라 경계 입력이 없다 | 테스트함 — /privacy가 미인증에도 공개임을 판정 테스트로 | 해당 없음 — 정적 페이지다 | 해당 없음 — 정적 페이지다 |
| 9 E2E·회귀 | 테스트함 — 가입 완주·pending 차단·재호출 거부 E2E | 테스트함 — 기존 E2E(로그인·로그아웃·주입 진입)가 갱신 픽스처로 통과 | 테스트함 — E2E 지원 코드의 profiles insert가 새 필수 컬럼을 채움 | 해당 없음 — 시나리오별 권한은 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — E2E는 격리 세션을 쓴다(P1-T01 확립) |

- 보충: 인수 조건 10(verify·db:test 전체)은 표 밖 총괄 검증이다. 동시 제출·동시 중복의 경합은 애플리케이션 락 없이 PK·unique 제약의 원자성에 위임하며, 그 판정의 실재는 7행 pgTAP이 소유한다.

### DEV-* 적용 상태

- `DEV-SEC`·`DEV-SSOT-04`: 검증 의미 정본은 서버 Zod 스키마(entities), DB 제약은 방어적 투영. 상태 가드는 서버 경계(레이아웃·액션 헬퍼)가 강제하고 UI는 보조.
- `DEV-ERR-01`·`DEV-ERR-08`: 예상 실패는 typed Result + 레지스트리 코드. 신설 코드는 `IDENTITY_*` 접두로 레지스트리에 등록.
- `DEV-CODE-08`·`DEV-CODE-09`·`DEV-ARCH-06`: 폼 오케스트레이션은 hooks, 검증·정규화는 entities model, 화면은 서버 컴포넌트 + 폼 client leaf. 공유 경로 상수는 기존 `auth-routes.config.ts` 확장.
- `DEV-TEST-01`: 위 렌즈 표. RED→GREEN 증거를 `tdd.json`에 남긴다.

## Architecture

- `supabase/migrations/<ts>_identity_signup_profile.sql`: `profile_status` enum 선언(5종). 성별은 P0-T03이 사람 속성용으로 예약해 둔 기존 `gender` enum(male·female)을 재사용한다(revision 2 — `profile_gender` 신설 없음). profiles에 `name text not null`, `phone text not null unique`, `gender gender not null`, `birth_date date not null`, `status profile_status not null default 'pending'` 추가(기존 행은 리셋 환경에만 존재하므로 단순 추가), phone CHECK(`^01[0-9]{8,9}$`), 본인·pending insert RLS 정책. `supabase/tests/06-profiles-signup.test.sql`(pgTAP).
- `src/entities/identity/model/signup.ts`: Zod 스키마(4필드)·`normalizePhone`·검증 메시지 코드 매핑 — 단위 테스트 소유. `model/profile-gate.ts`: `resolveProfileGate(profile | null, pathname)` 순수 함수 — 무프로필→온보딩, pending→/pending, active→탭(온보딩·pending 접근 시 홈) 판정.
- `src/entities/identity/api/find-own-profile.ts`: status 포함 조회로 확장(기존 typed Result 계약 유지).
- `src/features/signup/api/submit-signup.ts`(Server Action, server-only): getUser → 프로필 부재 확인 → Zod 검증 → insert(pending) → `/pending` redirect. 실패는 `{ ok: false, code, fieldErrors? }`. `src/features/signup/hooks/useSignupForm.ts`: `useActionState` 오케스트레이션. `src/features/signup/ui/SignupForm.tsx`: client leaf(배선만).
- `src/entities/identity/api/require-active-profile.ts`(server-only): 이후 모든 활성 기능 Server Action이 첫 줄에서 소비할 헬퍼 — active가 아니면 레지스트리 코드로 거부. 이번 task에서 계약·테스트를 확립한다. features(rank 3)→entities(rank 4) 방향이라 모든 미래 Server Action이 규칙 위반 없이 소비한다(revision 3 — shared/lib에서 이동).
- `src/app/(tabs)/layout.tsx`: 서버에서 프로필 조회 → `resolveProfileGate` 적용(무프로필·pending 리다이렉트). `src/app/onboarding/page.tsx`·`src/app/pending/page.tsx`도 같은 판정 소비. proxy는 무수정(인증만 — DB 조회 없음 유지).
- `src/views/onboarding/ui/OnboardingView.tsx`: 자리표시 → 폼 화면(서버 컴포넌트, SignupForm 조립 + 동의 문구·/privacy 링크). `src/views/pending/ui/PendingView.tsx`: 대기 상태 + 정적 문의 문구. `src/views/privacy/ui/PrivacyPolicyView.tsx`: 처리방침 정적 콘텐츠. `src/views/login/ui/LoginView.tsx`: 하단 낮은 계층에 /privacy 링크 추가(F-14).
- `src/shared/config/auth-routes.config.ts`: `/pending`·`/privacy` 상수 추가. `src/shared/lib/route-access.ts`: 공개 목록에 `/privacy` 추가(정확 열거 유지).
- `src/shared/config/error-codes.config.ts`: `IDENTITY_PROFILE_EXISTS`·`IDENTITY_PHONE_TAKEN`·`IDENTITY_VALIDATION`·`IDENTITY_PROFILE_REQUIRED`·`IDENTITY_NOT_ACTIVE` 등 신설(정확 집합은 구현에서 최소로, 레지스트리 관례 준수).
- `tests/e2e/`: signup.spec.ts 신설(가입 완주·pending 차단·재호출 거부), 지원 코드의 프로필 픽스처를 필수 컬럼·상태 인자로 확장(기존 주입 사용자는 active 픽스처).
- `.github/workflows/ci.yml` 무수정(P1-T01 구성 그대로).

## Data model

- `profiles` 최종 스키마(이 task 이후): `id`(auth.users FK) · `name` · `phone`(정규화 숫자, unique) · `gender`(male·female) · `birth_date` · `status`(5종, default pending) · `created_at`. 컬럼 의미·수정 흐름의 이후 확장은 P1-T05·T06 소유.
- 앱 코드는 TypeScript `enum` 키워드를 쓰지 않는다(사용자 결정, 저장소 관행 그대로 — 현재 사용 0건). 상태·성별 값 집합은 `entities/identity/model`의 Zod `z.enum`이 앱 의미 정본이고 union 타입을 유도하며, DB enum은 저장 계층의 방어적 투영이다(`DEV-SSOT-04`).
- 오류 코드 정본은 `error-codes.config.ts` — 코드·HTTP 상태·기본 한국어 문구를 레지스트리가 소유하고 UI는 소비만 한다.
- 상태 판정 계약은 `resolveProfileGate` 한 곳이 소유하며 레이아웃·페이지·테스트가 같은 함수를 소비한다(`DEV-SSOT-01`).

## Interface

- 리다이렉트 규칙: 무프로필 × 보호 탭·/pending → `/onboarding` · pending × 보호 탭·/onboarding → `/pending` · active × /onboarding·/pending → 홈. 콜백의 기존 분기(무프로필→온보딩)는 유지되고 pending 분기가 추가된다.
- 가입 폼 UX: 디자인 정본(WORKER-FLOWS 가입 절) — 한 화면 4필드, 성별에 배정 조건 설명, 하단 고정 `가입 신청하기`, 하단 동의 문구("제출하면 개인정보 처리방침에 동의한 것으로 보아요" + 링크).
- 오류 표시: 필드별 인라인(fieldErrors), 전역 실패는 레지스트리 문구. 오류 원문·스택 미노출(`DEV-ERR-03`).

## Optimizations

- 레이아웃의 프로필 조회는 요청당 1회 단건(PK)이다. 캐시·중복 제거는 실측 근거가 생길 때까지 도입하지 않는다.

## 변경 허용 경로

```
src/app/**
src/views/onboarding/**
src/views/pending/**
src/views/privacy/**
src/views/login/**
src/features/signup/**
src/entities/identity/**
src/shared/lib/**
src/shared/config/**
supabase/migrations/**
supabase/tests/**
tests/**
docs/execution/radio/P1-T02-radio.md
docs/execution/runs/P1-T02/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 처리방침 본문 문안(수집 항목·보관 기간·삭제 정책 서술)은 PRD의 계정 정리 규칙(ACCT-CLEANUP-01)과 정합해야 한다 — 구현이 초안을 작성하고 사용자가 검증 단계에서 문안을 확인한다. 결정 주체: 사용자.
- rejected 사용자의 화면(거절 안내)은 P1-T03 소유다 — 이 task의 가드는 rejected를 pending과 같은 대기 화면으로 보낸다(임시, P1-T03이 분리).
