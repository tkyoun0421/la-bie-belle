# 시스템 구성

도메인 용어가 어떤 테이블과 API와 화면 흐름이 되는지가 산다. 개념은 [`../modules/`](../modules/), 시각은 [`../design-system/`](../design-system/), 여기는 구조다.

목표 설계라는 뜻은 [설계 안내](../README.md)에 있다.

## 구성과 경계

### 경계 하나

- 적용 범위: 브라우저와 Next 서버와 Supabase 사이의 모든 호출
- 기본 계약: **브라우저가 Supabase를 바로 부른다.** Next 서버는 로그인 게이트와 첫 페이지 껍데기만 준다
- 이유: 권한을 RLS에 뒀으니 서버가 중간에 서서 검사할 것이 없고, Vercel 서버는 요청이 없으면 잠들어 깨우는 데 1~3초가 든다 — 출근 인증 버튼이 그걸 기다릴 이유가 없다. 오프라인 캐시도 브라우저가 Supabase를 직접 쥘 때 자연스럽다. 브라우저에 anon key가 보이는 것은 단점이 아니다 — 그 키는 공개용이고 권한은 세션 토큰과 RLS가 정한다

## 구성 요소의 책임

### 데이터에 닿는 코드

- 적용 범위: `from()`·`rpc()`·`storage`·`channel()`을 부르는 코드 전부
- 기본 계약: **데이터에 닿는 코드는 `dals`뿐이다.** 화면과 use-case는 `dals` 함수를 부른다
- 이유: 조항의 정본은 [ADR-003](../adr/ADR-003-supabase-and-integration-tests.md#db-접근을-한곳에-모은다)이다
- 예외: `auth.*`(세션 확인·코드 교환·로그아웃)는 데이터가 아니라 `shared/lib`에 산다 — 도메인이 없고 로컬 Supabase가 구글 OAuth를 못 돌려 integration 테스트 대상도 아니다

### Next 서버

- 적용 범위: Next 서버에서 도는 코드
- 기본 계약: Next 서버가 Supabase를 부르는 자리는 `auth.*`뿐이다 — `proxy`가 세션이 있는지 본다. 데이터를 읽거나 쓰는 서버 코드는 없다
- 이유: 승인·차단·퇴사는 클라이언트가 `profiles`를 읽어 가른다([`account/design.md`](../modules/account/design.md))

## 업무 영역 관계

### 관계 지도

```
auth.users ─? profiles ─1 profile_private
                │
                ├─< position_grants
                ├─< availabilities (work_date)
                ├─< wage_rates
                ├─< check_ins  >─ days
                ├─< excuses    >─ days
                ├─< adjustments >─ days
                ├─< notifications
                └─< push_subscriptions

halls ─< schedules ─< days ─< slots ─< assignments >─ profiles
halls ─1 hall_secrets              │        │
                                   │        ├─< cancel_requests
                                   │        └─< requests (kind=swap)
                                   └─< requests (kind=work)
                                              └─< request_candidates >─ profiles
```

`auth.users ─? profiles`는 하나 또는 없음이다. [`account/design.md`](../modules/account/design.md#프로필-신원)에 있다.

## 선택 근거·미정

### 채우는 순서

- 적용 범위: 이 문서군을 채우는 순서
- 기본 계약: `data-model` → `api` → `runtime` 순으로 채운다. `flows`는 화면 문서가 이미 각자의 문을 적어둬서 언제든 모아 그릴 수 있다
- 이유: 셋이 서로를 물고 있다 — 테이블 모양이 안 정해졌는데 무효화 규칙부터 쓰면 두 번 쓰게 된다

영역별 상세는 [modules](../modules/README.md)에 있다.
