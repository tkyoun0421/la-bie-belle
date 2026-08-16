# P4-T02 RADIO 개발 설계

- 상태: Sealed
- revision: 2
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-16 (revision 1·2)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-16 | 최초 작성. 기획 결정 3건(권한 진입점 두 곳 병행, dev 스크립트 테스트 발송, 실기기 확인 P7-T06 이월)의 구현 설계. |
| 2 | 2026-08-16 | 정지 조건 1 접촉으로 SW 등록 방식 재설계(사용자 승인). Turbopack이 `new URL(<파일>, import.meta.url)`을 번들 없이 정적 자산 원본 복사로 처리해(MIME `video/mp2t`, `@/` 별칭·TypeScript 미변환) revision 1의 번들 등록이 성립하지 않음을 프로덕션 빌드로 확인. SW를 `public/push-service-worker.js` 독립 classic script로 이동, `model/push-display`·`lib` 배선 파일 폐지, 실파일 직접 단위 테스트로 대체. |

- 관련 spec: PRD:AC-11, PRD 9장(알림 — 권한 진입점 두 곳), DOMAIN:NOTIFICATIONS, ADR:0005(만료 구독 비활성화), WORKER-FLOWS 알림과 푸시 권한 절
- 적용 깊이: 중간 — push_subscriptions 쓰기 RPC 2종 신설, public 독립 Service Worker 1개, 새 화면 1개(알림 설정)와 시트 1개(사전 안내), 제품 서버 로직 변경 없음(발송은 T08).
- test mode: tdd
- 예정 check IDs: push-subscription-api(RPC upsert·비활성·권한 pgTAP + 훅·판정 단위), push-device-checklist(실기기 체크리스트 문서 — 수행은 P7-T06)

## 전제

- 기획 승인(2026-08-16)이 소유한 제품 결정을 다시 열지 않는다: 권한 요청 진입점은 첫 근무 신청 저장 성공 후 사전 안내(기존 정본)와 더보기 알림 설정 두 곳, 어느 쪽도 사용자 행동 뒤에만 브라우저 권한 요청. 테스트 발송은 dev 스크립트(제품 표면 무추가). 실기기 수신 확인은 체크리스트 문서 작성까지 — 수행은 P7-T06.
- 코드 대조 확정 사실: PWA manifest(`src/app/manifest.ts`)·아이콘·env는 P0에 준비돼 있다 — `.env.example`에 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`·`VAPID_PRIVATE_KEY`·`VAPID_SUBJECT`가 있고 `src/shared/model/env.ts`가 public 키를 필수로 검증하며 `env.client.ts`가 이미 노출한다 — env 스키마 변경 없음. Service Worker는 없다. Next.js 16 가이드(`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`)의 `new URL(<워커 파일>, import.meta.url)` 번들 방식은 이 저장소에서 성립하지 않는다 — Turbopack이 SW 참조를 번들 없이 정적 자산 원본 복사로 처리해 `.ts`가 MIME `video/mp2t`로 서빙되고 `@/` 별칭·TypeScript 문법이 그대로 남는 것을 프로덕션 빌드로 확인(2026-08-16, revision 2). 가이드의 예시 SW가 import 없는 독립 파일이라 성립하는 방식이며, 같은 가이드가 public 서빙 변형(`/sw.js` headers 절)도 담고 있다. 채택: `public/push-service-worker.js` 독립 classic script — public 정적 서빙이 올바른 MIME을 주고 루트 경로라 `scope: "/"`에 `Service-Worker-Allowed` 헤더도 불필요, `updateViaCache: "none"`이 갱신 캐시를 덮어 `next.config` 변경 없음. `push_subscriptions` 스키마(endpoint unique, p256dh·auth, disabled_at, 본인 select RLS만)는 P4-T01이 만들었고 쓰기 경로가 없다. 더보기 메뉴는 `src/views/more/ui/MoreView.tsx`의 정적 목록이고, 신청 저장 흐름의 호스트는 `src/views/schedule/ui/ScheduleView.tsx`(`useApplicationBatch`)다. `shared/ui`에 토글 컴포넌트는 없다 — 기존 `button`·`bottom-sheet`로 충분해 신설하지 않는다. e2e 밴드 마지막 사용은 528~559(notifications). fsd 대조(2026-08-16): `config/fsd.json`의 appLayer는 unitTest required(exemptFiles는 page·layout 계열뿐)이고 lib·model·hooks·api 세그먼트도 required, ui는 exempt. `public/`은 fsd·lint 밖이지만 SW 단위 테스트는 `src/features/push/lib/__tests__/`에 두어 vitest node 프로젝트(`src/**/*.test.ts`)가 실파일을 검증한다. 기존 단언 대조(2026-08-16): `tests/e2e/tab-navigation.spec.ts`에는 더보기 메뉴 목록 단언이 없고, `src/views/more/ui/__tests__/MoreView.test.tsx`가 링크 개수를 고정 단언한다(`toHaveLength(2)`) — 메뉴 항목 추가 시 이 테스트의 정합 갱신이 필요하다.

## Requirements

### 범위와 비목표

범위: 마이그레이션 1개(구독 저장·해지 RPC 2종), public 독립 Service Worker(push 표시·클릭 이동 포함, 실파일 직접 단위 테스트), `features/push`(actions·훅·판정 model·사전 안내 시트), 알림 설정 화면(`/more/notification-settings`)과 더보기 메뉴 항목 1개, ScheduleView 사전 안내 삽입, dev 발송 스크립트(`scripts/send-test-push.mjs`, web-push devDependency), 실기기 체크리스트 문서, pgTAP 25번, e2e 1 spec(밴드 561~592).

비목표: outbox 소비자·자동 발송·재시도(P4-T08), 알림 생성 확대(P4-T03), 관리자 테스트 버튼 등 제품 표면 추가, 실기기 확인 수행(P7-T06), `beforeinstallprompt` 커스텀 설치 버튼(가이드 비권장), 오프라인 캐싱(SW는 push·notificationclick만).

### 불변 규칙

- 브라우저 권한 요청은 두 진입점의 명시적 사용자 행동(`알림 받기` 선택, 설정에서 켜기) 뒤에만 일어난다. 앱 진입·화면 마운트가 권한 팝업을 만들지 않는다. Service Worker 등록 자체는 권한과 무관하므로 진입점 화면에서 lazy 등록한다.
- 구독 쓰기는 RPC로만 한다. `save_push_subscription`은 endpoint 기준 upsert(재구독 시 `disabled_at` 해제, 같은 기기의 계정 전환 시 소유자 재지정)이고, `remove_push_subscription`은 본인 행만 `disabled_at`을 찍는다 — 행 삭제 없음(ADR-0005 비활성화).
- 구독 상태의 정본은 브라우저 `pushManager.getSubscription()`이고 DB는 발송 대상 목록이다. 둘이 어긋나면(브라우저에 구독 없음·권한 회수) 화면은 꺼짐으로 표시하고 DB 행은 다음 켜기에서 upsert로 수렴한다.
- SW는 import 없는 독립 classic script다 — 푸시 페이로드 해석(제목·본문·target)과 클릭 이동 경로 계산을 파일 안에 담되, 단위 테스트가 public 실파일을 `self` 스텁으로 직접 import해 단언한다(중복 사본 금지 — 같은 로직을 model에 두 벌 두지 않는다). target 모양은 P4-T01 `NotificationTarget`과 동일하다.
- 거부·미지원·iOS 미설치 상태에서도 앱 내 알림함은 정상 동작하고, 설정 화면이 해당 상태를 안내한다(WORKER-FLOWS).
- 새 테이블·컬럼·오류 코드 없음. `push_subscriptions` 스키마와 기존 RLS 정책은 무수정 — 쓰기 RPC와 그 검증만 더한다.

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- Service Worker 등록·번들이 `next.config.ts` 또는 `src/shared/ui/**` 변경을 요구하는 경우.
- 사전 안내 삽입이 `ScheduleView.tsx` 한 파일과 `features/push` 밖의 신청 흐름(`features/application/**`) 수정을 요구하는 경우.
- `public/push-service-worker.js`에 push·notificationclick 밖의 책임(오프라인 캐싱·fetch 가로채기 등)이 필요하다고 판단되는 경우.
- `pushManager.subscribe` 실호출 없이는 성립하지 않는 e2e 단언이 인수 조건에 필요하다고 판단되는 경우 — CI에서 푸시 서비스 왕복은 불안정하므로 범위 재협상.

### 기술 인수 조건

1. `save_push_subscription`: 신규 저장, 같은 endpoint 재호출 멱등(1행 유지·값 갱신), 다른 endpoint는 별도 행(다기기), disabled 행 재구독 시 `disabled_at` null 복원, 다른 계정이 쓰던 endpoint는 현재 사용자로 소유자 재지정(pgTAP — 값 단언).
2. `remove_push_subscription`: 본인 행만 `disabled_at` 기록, 남의 endpoint no-op(0행), 재호출 멱등, 행 삭제 없음(pgTAP).
3. 권한 행렬·RLS: 두 RPC는 authenticated만 grant(anon·service_role 거부 3롤 단언), `push_subscriptions` 직접 insert/update가 클라이언트 롤에서 차단됨을 단언(P4-T01 F-02 교훈 선반영, pgTAP).
4. 구독 상태 판정 순수 함수: unsupported / ios-not-installed / permission-denied / ready / subscribed 분기와 그 우선순위(단위 — RED 먼저).
5. 사전 안내 노출 판정 순수 함수: 신청 저장 성공 + 미구독 + 권한 미거부 + 기노출 아님일 때만 true, localStorage 키 1회 기록(판정은 순수 함수 단위, 저장 접근은 훅).
6. 알림 설정 화면: 켜기 행동 뒤에만 권한 요청·구독 저장 action 호출, 끄기 시 브라우저 unsubscribe + 해지 action, 미지원·거부·iOS 미설치 안내 렌더(훅·액션 단위 + e2e는 화면 진입과 안내 분기).
7. 첫 신청 저장 성공 후 사전 안내 시트가 뜨고 `알림 받기`가 권한 요청으로, `나중에`가 시트 종결·재노출 없음으로 이어진다(e2e — 밴드 561~592, 권한 요청 자체는 시트 노출·분기까지 단언).
8. SW 동작: 단위 테스트(`src/features/push/lib/__tests__/` 아래, node 프로젝트)가 `public/push-service-worker.js` 실파일을 `self` 스텁으로 직접 import해 — push·notificationclick 리스너 등록, push 페이로드 → `showNotification` 옵션(제목·본문·아이콘·data.target), `notificationclick` target → 이동 경로(`/schedule/<date>`·`/pay`, 알 수 없는 값·누락 필드는 `/notifications` 폴백)를 단언한다(단위 — RED 먼저).
9. dev 스크립트가 활성 구독 전체(또는 지정 profile)로 테스트 푸시를 발송하고, 410/404 응답의 구독을 service role로 `disabled_at` 마킹한다(수동 실행 — 사용 절차는 체크리스트 문서에).
10. 실기기 체크리스트 문서(`docs/execution/runs/P4-T02/device-checklist.md`)가 Android Chrome·홈 화면 설치 iPhone의 설치→켜기→수신→클릭 이동 확인 절차를 담는다 — 수행은 P7-T06.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1·2 구독 RPC | 테스트함 — 저장·해지·재구독 값 단언 | 테스트함 — 남의 endpoint no-op | 테스트함 — 다기기 2행·계정 전환 재지정·disabled 복원 | 테스트함 — 3 행이 소유 | 테스트함 — upsert·해지 멱등 | 해당 없음 — endpoint unique가 DB 경계에서 강제 |
| 3 행렬·RLS | 해당 없음 — 본체가 거부 단언 | 테스트함 — anon·service_role 거부, 직접 쓰기 차단 | 해당 없음 — 이진 분기 | 테스트함 — 본체 | 해당 없음 — 거부가 멱등 | 해당 없음 — 정책 평가 |
| 4·5 판정 함수 | 테스트함 — 상태 5분기·노출 조건 | 테스트함 — 거부·기노출이면 false | 테스트함 — iOS 미설치 vs 설치, 분기 우선순위 | 해당 없음 — 순수 함수 | 해당 없음 — 순수 함수 | 해당 없음 — 순수 함수 |
| 6·7 화면·시트 | 테스트함 — 켜기 흐름 훅 단위(모킹) + e2e 진입·시트 분기 | 테스트함 — 미지원·거부 안내 렌더 | 테스트함 — 나중에 후 재노출 없음(localStorage) | 테스트함 — e2e 근무자 계정 | 해당 없음 — 켜기 재클릭은 upsert 멱등이 1 소유 | 해당 없음 — 단일 기기 흐름 |
| 8 SW 동작 | 테스트함 — 실파일 import로 페이로드→옵션·target→경로 | 테스트함 — 알 수 없는 target 폴백 | 테스트함 — 페이로드 누락 필드 | 해당 없음 — 표시 계층 | 해당 없음 — 이벤트 단위 처리 | 해당 없음 — 이벤트 단위 처리 |
| 9·10 스크립트·문서 | 해당 없음 — 수동 도구·문서(존재와 절차를 검증 단계에서 확인) | 해당 없음 — 수동 도구 | 해당 없음 — 수동 도구 | 해당 없음 — service role 로컬 전용 | 해당 없음 — 수동 도구 | 해당 없음 — 수동 도구 |

- 보충 위험: **`pushManager.subscribe` 실호출은 자동 테스트에서 배제한다** — CI 푸시 서비스 왕복이 불안정하므로 훅 단위는 모킹, e2e는 시트·안내·화면 분기까지(정지 조건 4). **기존 단언 대조 결과(전제 참조)** — tab-navigation e2e는 더보기 목록을 단언하지 않아 무수정, `MoreView.test.tsx`의 링크 개수 단언(2)만 3으로 갱신한다(알려진 범위 갱신, 허용 경로 포함). **ScheduleView 삽입**은 신청 저장 성공 콜백 뒤 시트 렌더 한 곳이다 — 기존 신청 로직 무수정. **e2e 밴드** — 사전 안내 시나리오만 스케줄 시딩이 필요하며 전용 밴드 561~592, 다중 테스트는 splitBand.

### DEV-* 적용 상태

- DEV-SEC: 기본 적용 — RPC 2종 definer·`search_path = public, pg_temp`(P4-T01 F-04 교훈)·revoke 후 authenticated grant. 구독 자격 증명(p256dh·auth)은 응답으로 되돌려주지 않는다(RPC는 상태만 반환).
- DEV-DATA·DEV-SSOT: 기본 적용 — 발송 대상 정본은 push_subscriptions, 브라우저 구독 상태 정본은 pushManager. 전용 상태 테이블 없음.
- DEV-TIME: 기본 적용 — disabled_at·created_at은 서버 시각. 경계 계산 없음.
- DEV-CACHE: 기본 적용 — 설정 화면은 서버 상태 조회 없이 브라우저 구독 상태 기준(왕복 0), action 후 재검증 불필요.
- DEV-OFFLINE: 해당 없음 — SW는 push 전용, 오프라인 캐싱 비목표.
- DEV-CODE-07·주석 금지·barrel 금지·server-only: 기본 적용.

## Architecture

- `public/push-service-worker.js` — import 없는 독립 classic script: `push`는 페이로드를 해석해 `showNotification`, `notificationclick`은 target을 경로로 바꿔 `clients.openWindow`/focus. 훅이 `navigator.serviceWorker.register("/push-service-worker.js", { scope: "/", updateViaCache: "none" })`로 lazy 등록한다. 단위 테스트는 `src/features/push/lib/__tests__/`에서 실파일을 직접 import해 단언한다(revision 2 — 번들 등록 불가로 재설계).
- `src/features/push/` — `api/save-push-subscription.ts`·`api/remove-push-subscription.ts`(server action, RPC 호출, 기존 오류 매핑, 단위 필수), `hooks/usePushSubscription.ts`(SW lazy 등록·권한 요청·subscribe/unsubscribe·상태), `model/push-support.ts`(상태 판정 순수 함수)·`model/push-priming.ts`(노출 판정), `ui/PushPrimingSheet.tsx`(bottom-sheet 재사용). `model/push-display`·`lib/push-service-worker.ts`는 두지 않는다 — SW 로직의 정본은 public 실파일 하나다.
- `src/views/notification-settings/` — `ui/NotificationSettingsView.tsx`(안내 분기 + 켜기·끄기, 계산 없음). 라우트 `src/app/(protected)/(tabs)/more/notification-settings/page.tsx`.
- `src/views/more/ui/MoreView.tsx` — `알림 설정` 항목 1개 추가(기존 목록 관례).
- `src/views/schedule/ui/ScheduleView.tsx` — 신청 저장 성공 콜백 뒤 PushPrimingSheet 렌더 한 곳.
- `scripts/send-test-push.mjs` — web-push(devDependency)로 활성 구독에 발송, 410/404는 service role로 disabled_at 마킹. 앱 런타임과 무관한 로컬 도구.

## Data model

- 새 마이그레이션 `supabase/migrations/20260820000000_push_subscription_write.sql` 하나.
  - `save_push_subscription(target_endpoint text, target_p256dh text, target_auth text) returns void` — definer, `search_path = public, pg_temp`, 미인증 42501. endpoint 충돌 시 profile_id·키·`disabled_at = null` 갱신(upsert).
  - `remove_push_subscription(target_endpoint text) returns void` — 본인(profile_id = auth.uid()) 행만 `disabled_at = now()`, 이미 disabled면 시각 유지(멱등).
  - 두 함수 revoke 전체 후 authenticated grant.
- 테이블·컬럼·RLS 정책·오류 코드 변경 없음.

## Interface

- server action 2종은 `{ ok } | { ok: false, code }` 관례, 새 오류 코드 없음(42501은 기존 매핑).
- 푸시 페이로드 계약: `{ title, body, target }` — P4-T01 notifications 행과 동일 모양, T08 소비자가 같은 계약을 쓴다.
- env 변경 없음(공개 키는 `env.client.ts` 기존 노출, `VAPID_PRIVATE_KEY`·`VAPID_SUBJECT`는 dev 스크립트만 읽음).
- `package.json`은 web-push devDependency 1개 추가뿐.

## Optimizations

- 설정 화면·시트는 서버 왕복 0(브라우저 상태 기준), 켜기·끄기 각 1왕복(action). SW 등록은 진입점 화면 lazy.
- 되돌림: RPC drop, SW 엔트리·화면 제거로 되돌린다. 데이터 마이그레이션 없음.

## 변경 허용 경로

```
supabase/migrations/20260820000000_push_subscription_write.sql
supabase/tests/25-push-subscriptions.test.sql
public/push-service-worker.js
src/features/push/**
src/views/notification-settings/**
src/views/more/ui/**
src/views/schedule/ui/ScheduleView.tsx
src/app/(protected)/(tabs)/more/notification-settings/page.tsx
scripts/send-test-push.mjs
package.json
pnpm-lock.yaml
tests/e2e/push-subscription.spec.ts
tests/e2e/support/**
docs/execution/runs/P4-T02/**
docs/execution/radio/P4-T02-radio.md
docs/execution/phases/index.jsonl
```

- 용도 한정: `public/push-service-worker.js`는 push·notificationclick 처리만(오프라인 캐싱·fetch 가로채기 금지 — 필요해지면 정지 조건), `src/views/more/ui/**`는 메뉴 항목 1개 추가와 `MoreView.test.tsx` 링크 개수 단언 정합 갱신(2→3)에만, `ScheduleView.tsx`는 사전 안내 시트 삽입 한 곳, `package.json`·`pnpm-lock.yaml`은 web-push devDependency 1개, `tests/e2e/support/**`는 밴드 1개 추가(561~592)와 헬퍼 재사용에만 쓴다.
- `docs/product/**`·`docs/execution/reviews/**`는 의도적으로 빠져 있다. 정합화·backlog는 조정자 몫.
- 위 밖의 파일이 필요해지면 멈추고 반환한다.

## 미결 사항

- 실발송·재시도·만료 자동 처리(pushsubscriptionchange 계열 포함)는 P4-T08 설계 몫 — 이 task의 만료 처리는 dev 스크립트의 410/404 마킹과 재구독 수렴까지다.
- 알림 클릭 딥링크의 알림함 밖 진입(푸시 → 상세 직행) 계약은 이 task의 `public/push-service-worker.js`가 소유하고, T03·T08은 페이로드 계약(`{ title, body, target }`)으로 재사용한다.
- VAPID 실키 생성·Vercel env 등록은 배포 준비(P7-T04) 몫 — 로컬은 `.env.example` 절차.
