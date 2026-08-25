# ADR-003 — Supabase와 integration 테스트 층

2026-08-26에 정했다.

## 결정

영속과 인증은 Supabase로 간다. 권한은 RLS로 DB에서 막는다. DB에 닿는 코드는 `dals` 세그먼트 한곳에 모으고, 그 층은 unit 대신 integration 테스트로 검증한다. `tdd-guard-unit.py`는 integration 테스트를 짝으로 인정하도록 고친다.

## 스택

**Supabase.** Postgres에 인증과 스토리지가 붙어 온다. 근무자 서른 명 규모에서 무료 티어로 버틴다.

**인증은 Supabase Auth의 구글 OAuth.** PRD가 정한 가입 경로가 구글 하나뿐이라 따로 만들 것이 없다.

**푸시는 웹 표준 Web Push.** Supabase 밖이다. 외부 서비스에 묶지 않고 비용도 없다. iOS는 사용자가 홈화면에 앱을 추가해야만 푸시가 오므로, 온보딩에서 그 안내를 해야 한다.

## 권한을 DB에 둔다

RLS로 막는다. "자기 급여만 읽는다"를 Postgres 정책으로 쓰고, 앱 코드의 버그가 남의 급여를 흘리지 못하게 한다.

가입 승인도 여기서 막는다. 승인되지 않은 계정은 정책에 걸려 어느 테이블에서도 행을 못 받는다. 화면에서 숨기는 것과 다르다.

**서비스 키를 쓰면 RLS가 통째로 꺼진다.** Supabase의 service role key는 모든 정책을 우회한다. 서버에서도 사용자 세션으로 붙는다. 이 키가 필요한 자리는 관리자 배치 작업뿐이고, 그때는 왜 필요한지를 코드 옆이 아니라 이 문서에 먼저 적는다.

## DB 접근을 한곳에 모은다

Supabase 클라이언트는 `dals` 세그먼트에서만 부른다. ADR-001의 세그먼트 목록에 이미 있던 이름이다. 화면과 use-case는 `dals`의 함수만 쓴다.

한곳에 모이면 integration 테스트가 무엇을 겨냥할지 분명해지고, 나중에 DB를 바꿔도 그 자리만 고친다.

## 테스트 층

**자리.** integration 테스트는 대상과 같은 레벨의 `__tests__/<이름>.integration.test.ts`에 둔다. 루트에 몰지 않는다. 훅이 이미 같은 레벨을 보고 있어 판정이 단순해지고 대상과 테스트가 붙어 있다.

**DB.** 로컬 Supabase다. `supabase start`로 Docker에 Postgres를 띄우고 거기 붙는다. 내 노트북과 CI가 같은 것을 쓴다.

**러너.** vitest를 파일명으로 두 갈래로 나눈다. `pnpm test`는 unit만 돌아 빠르고, `pnpm test:integration`은 Docker를 띄우고 돈다.

**CI.** lint → test → integration → build → e2e 순이다. 단계가 하나 는다.

**RLS도 테스트한다.** "근무자 A로 로그인해 B의 급여를 읽으면 빈 결과가 나온다"를 integration 테스트로 박는다. RLS는 SQL에 사는 규칙이라 TypeScript 테스트로는 확인되지 않는다.

**마이그레이션.** 스키마는 `supabase/migrations/`에 SQL로 쌓는다. RLS 정책도 여기 산다.

## 훅을 고친다

지금 `tdd-guard-unit.py`는 짝 후보를 하나만 본다. `__tests__/<이름>.test.ts`가 없으면 막는다.

여기에 후보를 하나 더한다. `__tests__/<이름>.test.ts`나 `__tests__/<이름>.integration.test.ts` **둘 중 하나**가 있으면 통과한다. 막을 때의 안내 문구도 두 길을 다 알려준다.

`SKIP_PREFIXES`는 늘리지 않는다. 지금의 `src/app/`과 `src/shared/ui/` 둘로 끝이다.

## 왜 예외로 빼지 않았나

`dals` 경로를 예외 목록에 넣는 길도 있었다. 훅을 거의 안 고쳐도 되니 싸다. 그러나 그 폴더 아래는 테스트가 아예 없어도 통과하게 된다. 급여 계산에 닿는 코드가 거기 사는데 무검증 구멍을 파는 셈이다.

ADR-001이 "탈출구를 두지 않는다"를 정했고 "훅은 세그먼트 이름을 모른다"도 정했다. 경로 예외는 둘 다 깬다.

지금 고르는 길은 예외가 아니라 다른 증거를 받는 것이다. 짝 테스트가 없으면 여전히 못 쓴다. unit이 맞지 않는 층에 integration을 요구할 뿐이다.

mock으로 unit을 채우는 길도 버렸다. 가짜 DB를 넣으면 테스트가 초록불이어도 RLS 정책이 맞는지, 실제 Postgres에서 급여 집계가 맞는지 알 수 없다. 그 층에서 unit 테스트는 확인해주는 것이 거의 없다.

## 남는 위험

**로컬은 초록불인데 CI가 빨간불일 수 있다.** `pnpm test`가 unit만 돌기 때문이다. integration을 잊고 커밋하면 CI에서 걸린다. `implementer` 정의문의 검증 명령에 `pnpm test:integration`을 넣어야 막힌다.

**CI가 느려진다.** Supabase 컨테이너를 띄우느라 검사 시간이 1분대에서 몇 분으로 는다. 이 선택의 실제 값이다.

**RLS 정책은 SQL에 산다.** TypeScript 리뷰로는 안 잡히고 마이그레이션 파일을 열어봐야 보인다. 정책을 고치는 PR은 반드시 그 정책의 integration 테스트를 같이 낸다.

**개발에 Docker가 필요해진다.** 새 사람이 합류하면 `supabase start`가 도는 환경부터 만들어야 한다.
