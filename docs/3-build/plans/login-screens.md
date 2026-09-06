# 로그인 화면과 승인 대기 화면 — 구현 계획

[spec](../../2-design/spec/login-screens.md)의 셋째 고리다. 화면 설계는 [pages/login.md](../../2-design/design-system/pages/login.md)가 정본이고, 여기는 라우트·파일 배치·테스트 인프라처럼 코드가 되기 직전의 결정만 적는다.

## 라우트

- `/login` — 로그인 화면. `src/app/login/page.tsx`가 `src/screens/login/`을 그린다
- `/pending` — 승인 대기 화면. `src/app/pending/page.tsx`가 `src/screens/pending/`을 그린다. 도메인은 이 상태를 따로 이름짓지 않고 「승인 시각이 비어 있으면 아직 승인 전」이라고만 적어서([account.md](../../2-design/domain/account.md)), 라우트 이름은 화면 이름(승인 대기)에서 딴다
- `/` — 홈. 지금의 스캐폴드 카드(`src/app/page.tsx`의 통신 포함)를 걷어내고, 대시보드 task가 채울 최소 자리만 남긴다
- `/auth/callback` — 구글 OAuth 콜백. [session-foundation.md](../../2-design/spec/session-foundation.md)가 이 task로 넘긴 의무다. 기존 `/auth/logout`의 형제로 둔다

분기 규칙은 [pages/login.md](../../2-design/design-system/pages/login.md) 7행 그대로다 — 세션이 없으면 `/login`, 세션이 있고 승인 시각이 비었으면 `/pending`, 차 있으면 `/`. 세 라우트 각각이 서버에서 이 규칙을 읽어 제자리가 아니면 redirect 한다. 판정은 아래 순수 함수 한 곳에 모은다.

## 로직 파일

`.tsx`는 더미 UI(ADR-001)이므로 계산은 전부 `.ts`로 나온다. 테스트 짝이 붙는 파일들이다.

- `src/shared/lib/resolve-auth-destination.ts` — 세션 유무 × 승인 시각 → 목적지(`/login` | `/pending` | `/`) 순수 함수
- `src/shared/lib/create-supabase-browser-client.ts` — 브라우저용 Supabase 클라이언트 팩토리. 세션 기반 task에서 미뤄 온 절반이다
- `src/shared/lib/handle-auth-callback.ts` — 콜백 분기(code 없음 / 교환 실패 / 성공)의 순수 로직. `route.ts`는 여기 위임만 한다
- `src/screens/pending/model/notification-prompt.ts` — 알림 영역 세 모습(아직 안 켬 / 켠 뒤 / 아이폰 안내)의 전이 판정
- `src/entities/profile/dals/` — 승인 시각을 읽는 함수 추가. DB 접근은 dals에 모은다(ADR-003)

## 테스트 인프라 결정

- **승인된 사용자 재현** — 테스트 전용 헬퍼가 로컬 Supabase의 postgres에 직결해 `approved_at`을 채운다. service role 키는 ADR-003이 관리자 배치 작업으로 좁혀뒀으니 테스트에도 안 푼다. 로컬 DB 직결은 그 경계 밖이고, integration과 e2e가 같은 헬퍼를 쓴다
- **알림의 범위** — 브라우저 권한 요청 UI까지다. 실제 push 구독(VAPID, 구독 토큰 저장)은 어느 설계 문서에도 없으니 범위 밖이고, 그 일이 올 때 설계부터 한다
- **권한 거부 뒤의 모습** — 열린 결정이라 테스트로 못 박지 않는다

## 안 담은 것

구글 로그인의 성공 경로 전체(버튼 → 구글 → 콜백 → 세션)는 자동 검증이 없다. 로컬에 구글 OAuth 설정이 없고 구글이 자동화 브라우저를 막는다 — session-foundation.md가 정한 대로 사람이 손으로 본다.
