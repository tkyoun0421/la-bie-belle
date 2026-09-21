# 시스템 구성

도메인 용어가 어떤 테이블과 API와 화면 흐름이 되는지가 산다. 개념은 [`../modules/`](../modules/), 시각은 [`../design-system/`](../design-system/), 여기는 구조다.

앱은 스토어에서 받는 네이티브 앱이다([ADR-011](../adr/ADR-011-expo-native-app.md)). 우리가 돌리는 서버는 없다.

목표 설계라는 뜻은 [설계 안내](../README.md)에 있다.

## 구성과 경계

### 경계 하나

- 적용 범위: 앱과 Supabase 사이의 모든 호출
- 기본 계약: **앱이 Supabase를 바로 부른다.** 사이에 우리 서버가 없다
- 이유: 권한을 RLS에 뒀으니 서버가 중간에 서서 검사할 것이 없다. 서버를 두면 띄워두는 값이 들고, 잠들었다 깨는 서버라면 출근 인증 버튼이 그 시간을 기다린다. 오프라인 캐시도 앱이 Supabase를 직접 쥘 때 자연스럽다. 앱 안에 anon key가 박히는 것은 단점이 아니다 — 그 키는 공개용이고 권한은 세션 토큰과 RLS가 정한다
- 예외: 키를 숨길 수 있다고 보지 않는다. 설치된 앱은 뜯어볼 수 있으므로 번들에 박은 것은 전부 공개된 값이다. 숨겨야 하는 값은 Edge Function 안에만 둔다

## 구성 요소의 책임

### 데이터에 닿는 코드

- 적용 범위: `from()`·`rpc()`·`storage`·`channel()`을 부르는 코드 전부
- 기본 계약: **데이터에 닿는 코드는 `dals`뿐이다.** 화면과 use-case는 `dals` 함수를 부른다
- 이유: 조항의 정본은 [ADR-003](../adr/ADR-003-supabase-and-integration-tests.md#db-접근을-한곳에-모은다)이다
- 예외: `auth.*`(세션 확인·코드 교환·로그아웃)는 데이터가 아니라 `shared/lib`에 산다 — 도메인이 없고 로컬 Supabase가 구글 OAuth를 못 돌려 integration 테스트 대상도 아니다

### 세션을 드는 자리

- 적용 범위: 로그인 뒤 토큰을 두는 곳과 앱이 다시 뜰 때 읽는 곳
- 기본 계약: **기기의 안전한 저장소에 든다.** 구글 로그인이 끝나면 딥링크로 앱에 돌아오고 그 자리에서 토큰을 받아 넣는다. 앱이 다시 뜨면 거기서 읽어 세션을 세운다
- 이유: 쿠키를 읽어주는 서버가 없다. 토큰은 다른 앱이 못 읽는 자리에 둬야 한다
- 예외: 승인·차단·퇴사는 세션과 별개다. 세션이 있어도 그 판정은 앱이 `['profile']`을 읽어 한다([`account/design.md`](../modules/account/design.md))

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
                └─< push_tokens

halls ─< schedules ─< days ─< slots ─< assignments >─ profiles
halls ─1 hall_secrets              │        │
                                   │        ├─< cancel_requests
                                   │        └─< requests (kind=swap)
                                   └─< requests (kind=work)
                                              └─< request_candidates >─ profiles
```

`auth.users ─? profiles`는 하나 또는 없음이다. [`account/design.md`](../modules/account/design.md#프로필-신원)에 있다.

영역별 상세는 [modules](../modules/README.md)에 있다.
