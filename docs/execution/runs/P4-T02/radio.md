# P4-T02 RADIO 적용 결과

- 기준 RADIO: `docs/execution/radio/P4-T02-radio.md` **revision 3**, SHA-256
  `7f232a1cf8d28ec19bdbaf217e28ff4c18d2fe2b331baa737e4721d308cf2598`(index.jsonl
  `development_approval`과 대조 완료, 일치). 최초 착수 시점은 revision 1, SHA-256
  `147ea02ef9d2b14a25be2ae64a388c4bb246cf6f3cdbbc46658635d34fbba759`였고, 개발 종료 시점은
  revision 2, SHA-256 `d69380dab93e5697ef1804f661489a5478b2c47666908f5ab17e2410345937c5`였다.
- 기준 커밋: `dd3ad4c`("docs(P4-T02): reseal RADIO revision 2 with public standalone service
  worker"). revision 1 봉인 커밋은 `a6bf642`, revision 3 재봉인 커밋은 `80b61df`. 개발 종료
  구현 커밋은 `69f2dad`.

## 교차 검증 수정 라운드(F-01·F-02, revision 3, `docs/execution/reviews/P4-T02-review.json`)

교차 검증(opus·codex, base `dd3ad4c` → head `69f2dad`)에서 high 2건이 전원 인정으로 확정됐다.
둘 다 `src/features/push/hooks/usePushSubscription.ts` 안이라 재봉인 뒤 같은 파일만 고쳤다.

- **F-01(high) — 유령 구독**: `pushManager.subscribe` 성공 뒤 `savePushSubscription`이 실패해도
  방금 만든 브라우저 구독을 되돌리지 않아, 재방문 시 등록 effect가 `getSubscription()`으로
  `subscribed=true`를 고정시켜 켜기 버튼이 사라지고 DB 발송 대상에는 없는 상태가 영구화됐다.
  `subscribe()`의 저장 실패 분기에 `await subscription.unsubscribe()`를 추가해 보상 해지하고
  `{ ok: false }`를 반환하도록 고쳤다 — 결과를 fire-and-forget하지 않고 await해 테스트가 실제
  호출 완료를 관측할 수 있게 했다(`no-floating-promises`도 이 형태를 요구한다).
- **F-02(high) — 계정 전환 미재귀속**: 마운트 시 `getSubscription()` 존재만으로 `subscribed`를
  세팅하고 `save_push_subscription`을 부르지 않아, 같은 브라우저에서 계정이 바뀌어도 DB
  endpoint 소유자가 이전 계정으로 남았다. 등록 effect가 기존 구독을 발견하면(existing !== null)
  `savePushSubscription`을 호출해 현재 계정으로 재귀속·수렴시키도록 고쳤다. 구독이 없는
  마운트는 이 호출 자체가 없어 봉인 Optimizations의 "구독 없는 대다수 마운트는 왕복 0"이
  그대로 유지된다(revision 3이 이 한 경우에 한해 "왕복 0"을 갱신했으므로 재귀속 왕복 1회
  자체는 설계 위반이 아니다).
- 재귀속 호출이 실패해도(네트워크 등) 별도 처리를 추가하지 않았다 — 기존 `registerAndSync`의
  바깥 `try/catch`가 이미 함수 전체의 예외를 `setRegistration(null)`로 흡수하는 구조를 그대로
  둔 것이고, 이 흡수 로직 자체를 넓히는 건 F-03(훅 전체 오류 피드백 부재, medium)에 속해
  이번 라운드에서 손대지 않았다.
- medium·low 발견(F-03~F-13)은 backlog로 이관됐고 이번 라운드에서 고치지 않았다.
- `test_mode=tdd` 절차: `src/features/push/hooks/__tests__/usePushSubscription.test.ts`에 새
  테스트 2개(F-01 보상 해지·F-02 재귀속 호출) + 기존 미호출 케이스를 명시하는 테스트 1개를
  추가한 뒤, 구현을 이전 상태로 둔 채 실행해 RED(2 failed | 7 passed) 확보, 구현 수정 후 같은
  명령으로 재실행해 GREEN(9/9) 확보. `docs/execution/runs/P4-T02/tdd.json`에 새 RED→GREEN
  쌍으로 기록, `pnpm gate:tdd` 통과.
- 검증: `pnpm vitest run src/features/push`(37/37), 스코프 `eslint -c eslint.config.ci.mjs
  src/features/push`(0 errors, `project/error-code-literal`이 테스트의 문자열 리터럴
  `"COMMON_UNEXPECTED"`를 잡아 `ERROR_CODE.COMMON_UNEXPECTED` 참조로 고침), `tsc --noEmit`
  전체 무오류.

## 정지 조건 반환 1회차 — SW 번들 방식(revision 1 → 2, 재봉인)

RADIO revision 1은 Next.js 16 공식 PWA 가이드의 `new URL(<파일>, import.meta.url)`을
`navigator.serviceWorker.register`에 넘기는 번들 방식을 "확정 사실"로 전제했다. 구현해
`pnpm build`로 확인한 결과 Turbopack이 이 참조를 번들 없이 정적 자산 원본 복사로 처리해
`.ts` 파일이 MIME `video/mp2t`로 서빙되고 `@/` 별칭·TypeScript 문법이 그대로 남는 것을
프로덕션 서버 curl로 실증했다(`Content-Type: video/mp2t`, body가 원본 소스 그대로).
가이드의 예시 SW가 import 없는 완전 독립 파일이라 우연히 성립하는 방식이고, RADIO가 추가로
요구한 "model에 위임"이 이 메커니즘과 양립 불가능하다고 판단해 `[질문]`으로 반환했다(정지
조건 1 해당 판단). 조정자가 사용자 승인으로 revision 2를 재봉인했다 — `public/push-service-worker.js`를
import·export 없는 독립 classic script로 옮기고, `model/push-display.ts`·`lib/push-service-worker.ts`
(및 각 테스트)는 폐지, 훅 등록을 `navigator.serviceWorker.register("/push-service-worker.js",
{scope, updateViaCache})`로 교체하는 것으로 재설계됐다. RED→GREEN 근거는
`docs/execution/runs/P4-T02/tdd.json`의 `pnpm vitest run
src/features/push/lib/__tests__/push-service-worker.test.ts` RED→GREEN 쌍(SW 파일 자체 재설계)과
`pnpm vitest run src/features/push/hooks/__tests__/usePushSubscription.test.ts` RED→GREEN 쌍
(register 호출 인자 교체).

## 정지 조건 반환 2회차 — headless Chromium 알림 권한 고정(재봉인 불요)

revision 2 적용 후 AC7 e2e(`tests/e2e/push-subscription.spec.ts`)를 처음 실행하자 사전 안내
시트가 뜨지 않았다. 원인을 좁혀보니 이 저장소의 Playwright 설정(headless Chromium,
`devices["Pixel 5"]`)에서는 `context.newContext({ permissions: ["notifications"] })`로 권한을
명시적으로 부여해도 `Notification.permission`이 항상 `"denied"`로 고정된다 — 앱 코드와 무관한
순정 홈 화면에서도 동일함을 프로브로 확인했다(headless 컨텍스트에는 알림 UI를 띄울 화면이
없어 자동화 시 항상 거부로 취급하는 Chromium의 알려진 특성). `pushManager.subscribe` 실호출
불안정을 이유로 든 정지 조건 4와 같은 계열이지만 한 단계 더 앞선 지점이라 `[질문]`으로
반환했다. 조정자 판단: 재봉인 불요 — "봉인된 AC7의 e2e 몫은 시트 노출·분기까지 단언이고
`subscribe` 실호출은 이미 배제돼 있다, `addInitScript` 스텁은 훅 단위 mock과 같은 급의 테스트
배관"이라는 근거였다. 지시대로 구현했다:

- `tests/e2e/push-subscription.spec.ts`에 `page.addInitScript`로 `Notification.permission`을
  `"default"`로, `Notification.requestPermission`을 호출 횟수를 기록하고 `"granted"`를
  resolve하는 스텁으로 교체하는 헬퍼(`stubNotDeniedPermission`)를 추가했다.
- AC7 시트 노출 테스트를 둘로 나눴다 — "알림 받기 클릭 → 권한 요청 호출"(스텁 호출 횟수만
  단언, 그 뒤 `subscribe()`의 실제 네트워크 왕복 결과는 단언하지 않음 — 지시 문면 그대로
  "실팝업 아님, 권한 요청 호출로 이어지는 것까지"만 확인) / "나중에 → 재노출 없음"(스텁된
  상태에서 시트가 실제로 닫히고 두 번째 저장에도 다시 뜨지 않는 것까지 단언, 원래 초안과 동일한
  흐름).
- 거부 분기(headless 환경의 자연 상태, 스텁 없음)는 설정 화면 진입 테스트 1개로 유지해 AC6
  안내 렌더를 단언한다 — 원래 "켜기 버튼" 단언에서 "거부 안내 문구" 단언으로 바꿨다(이 환경에서
  자연히 도달하는 분기가 거부이므로).
- RED→GREEN 근거는 `tdd.json` 마지막 두 항목(`pnpm exec playwright test
  tests/e2e/push-subscription.spec.ts`).

## 구현 중 발견한 별개의 기존 스키마 특성(P4-T02 범위 밖, 수정하지 않음)

2회차 GREEN 시도 중 두 사전 안내 테스트가 `deleteWorkerSessions`에서 "Database error deleting
user"로 실패했다. `supabase_auth` 컨테이너 로그로 실제 원인을 확인하니 `update or delete on
table "profiles" violates foreign key constraint "applications_profile_id_fkey" on table
"applications" (23503)"` — `applications_profile_id_fkey`에 cascade가 없어, 신청(신청하기)까지
마친 워커는 auth 사용자 삭제가 원천적으로 실패하는 기존 스키마 특성이다. `applications` 테이블은
RADIO 허용 경로 밖이고 이번 task 소관도 아니라 스키마를 고치지 않았다. 대신 `tests/e2e/schedule.spec.ts`가
이미 같은 이유로 신청까지 마친 워커는 `deleteWorkerSessions`를 호출하지 않고 `context.close()`만
하는 선례를 확인해 그대로 따랐다(두 사전 안내 테스트만 해당, 설정 화면 테스트는 신청을 만들지
않아 기존대로 삭제한다). 스키마 자체의 cascade 부재는 이 문서에 기록만 하고 별도 조치는
조정자·다음 태스크 판단에 맡긴다.

## 적용 결과 요약

RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. Data model(RPC 2종),
`features/push`(model 2개·api 2개·hooks 2개·ui 1개), `views/notification-settings`,
`views/more/ui/MoreView.tsx` 메뉴 항목 1개, `views/schedule/ui/ScheduleView.tsx` 사전 안내
삽입 1곳, `public/push-service-worker.js`, `scripts/send-test-push.mjs`,
`supabase/tests/25-push-subscriptions.test.sql`(pgTAP 44문항),
`tests/e2e/push-subscription.spec.ts`(3 test, 밴드 561~592), `device-checklist.md`가 정본이다.

## 구현 중 확정한 세부(설계 재해석이 아닌 구체화)

1. **`server-only`/`env.client` 즉시 평가 회피를 위한 동적 import.** `usePushSubscription.ts`의
   `subscribe`/`unsubscribe`가 `features/push/api/*`(server action, `import "server-only"`)와
   `@/shared/config/env.client`(필수 env 미설정 시 즉시 throw)를 정적 import하면 `ScheduleView.tsx`가
   단순히 마운트만 돼도(테스트 렌더 포함) 즉시 예외가 난다 — 프로브 테스트로 실증. RADIO가 손대지
   말라고 못박은 `ScheduleView.test.tsx`가 실제로 깨지는 것을 막기 위해 두 모듈 모두 클릭 핸들러
   내부에서만 `await import(...)`로 지연 로드하도록 했다. 렌더만으로는 절대 평가되지 않는다.
2. **`PushPrimingSheet`의 `open`을 useState+useEffect가 아닌 완전 파생값으로 설계.** 최초 시도는
   `trigger` 변화를 감지해 `setOpen(true)`를 하는 `useEffect`였는데
   `react-hooks/set-state-in-effect` 린트에 걸렸다. `open = hasSaved && status !== "unsupported"
   && shouldShowPushPriming(...)`로 매 렌더 계산하도록 바꿨다 — "나중에 이후 재노출 없음" 요구도
   `markShown()`이 `alreadyShown`을 true로 바꾸면 다음 렌더에 자동으로 `open`이 false가 돼
   부수 효과 없이 성립한다.
3. **`usePushSubscription`의 `isStandalone`/`permission` 초기값을 lazy `useState` 이니셜라이저로
   계산.** 같은 린트 규칙 위반을 피하기 위해 마운트 시 1회만 계산하고, `pushApiSupported`가
   false인 환경(구형 브라우저·SSR)에서 `Notification`/`matchMedia` 접근으로 죽지 않도록
   `detectPushApiSupported()` 가드를 앞세웠다.
4. **`urlBase64ToUint8Array`의 반환값을 `pushManager.subscribe`에 넘길 때 `as BufferSource`
   캐스팅.** `Uint8Array<ArrayBufferLike>`가 DOM lib의 `BufferSource`에 구조적으로 안 맞는
   TypeScript strict 오류를 해결했다. 값 자체는 표준 Web Push 문서 그대로다.
5. **`MoreView.tsx`에 로컬 상수로 경로 정의.** `NOTIFICATION_SETTINGS_PATH`를
   `shared/config/auth-routes.config.ts`에 추가하려던 최초 시도는 그 파일이 RADIO 허용 경로
   밖이라 되돌리고, `MoreView.tsx` 안의 로컬 const로 바꿨다(허용 경로는 `src/views/more/ui/**`).
6. **`PushPrimingSheet`·`NotificationSettingsView`(ui 세그먼트) 전용 단위 테스트를 만들지
   않았다.** `config/fsd.json`의 ui 세그먼트는 `unitTest: exempt`이고, RADIO 인수 조건 6·7도
   "훅·액션 단위 + e2e"까지만 요구해 이 두 파일은 배선·렌더만 담당하며(계산 없음) 실질 로직은
   `usePushSubscription`/`usePushPriming`/`shouldShowPushPriming` 단위 테스트가 이미 덮는다.
7. **e2e MIME/등록 실증 방법.** `page.evaluate`로 `fetch("/push-service-worker.js")`와
   `navigator.serviceWorker.register(...)` + `navigator.serviceWorker.ready`를 직접 호출해
   실제 인증 세션에서 `Content-Type: application/javascript; charset=UTF-8`, `200`,
   `registration.active.scriptURL`이 채워지는 것을 확인했다(상세 근거는
   `docs/execution/runs/P4-T02/handoff.md`). `page.waitForResponse`로 SW 자체의 네트워크
   요청을 잡으려던 첫 시도는 Playwright가 서비스워커 스레드의 요청을 페이지 이벤트로 노출하지
   않아 30초 타임아웃으로 실패해 방법을 바꿨다.

## 정지 조건 점검

- **SW 등록·번들이 `next.config.ts`/`src/shared/ui/**` 변경을 요구하는 경우** — 1회차에서
  발동, revision 2 재봉인(public 독립 스크립트)으로 해소. 최종 구현은 `next.config.ts`·
  `src/shared/ui/**` 어느 쪽도 건드리지 않았다(`git diff --stat`로 확인).
- **사전 안내 삽입이 `ScheduleView.tsx` 한 파일과 `features/application/**` 밖의 신청 흐름
  수정을 요구하는 경우** — 발동하지 않았다. `useApplicationBatch`는 무수정, `ScheduleView.tsx`에
  `handleApply` 래퍼(성공 시 신호 증가) + `<PushPrimingSheet trigger={...} />` 렌더 한 곳만
  추가했다. `ScheduleView.test.tsx`는 손대지 않았고 회귀 없이 통과한다.
- **`public/push-service-worker.js`에 push·notificationclick 밖의 책임(오프라인 캐싱 등)이
  필요하다고 판단되는 경우** — 발동하지 않았다. 최종 파일은 두 리스너와 그 보조 함수만 담는다.
- **`pushManager.subscribe` 실호출 없이는 성립하지 않는 e2e 단언이 필요한 경우** — 2회차에서
  같은 계열(권한 자체가 headless에서 상수 고정)로 발동, 조정자가 재봉인 없이 스텁 방식으로
  해소를 지시했다(위 "2회차" 절 참고). 최종 e2e는 `subscribe()`의 실제 네트워크 결과를 어디서도
  단언하지 않는다 — "알림 받기 클릭 → 권한 요청 스텁 호출"까지만 확인한다.

## 위험 기반 테스트 매트릭스 반영(실증 근거)

- 1·2 구독 RPC, 3 권한 행렬·RLS: `supabase/tests/25-push-subscriptions.test.sql`(pgTAP
  44문항) — RED(함수 부재로 27/44 실패)→GREEN(`Files=25, Tests=1467, PASS`).
- 4·5 판정 함수: `src/features/push/model/__tests__/push-support.test.ts`(9문항)·
  `push-priming.test.ts`(6문항).
- 6·7 화면·시트: `usePushSubscription.test.ts`(6문항)·`usePushPriming.test.ts`(3문항) +
  `tests/e2e/push-subscription.spec.ts`(3 test — 거부 안내, 알림 받기→권한 요청, 나중에→재노출
  없음).
- 8 SW 동작: `src/features/push/lib/__tests__/push-service-worker.test.ts`(4문항, public 실파일
  직접 import).
- 9·10 스크립트·문서: `scripts/send-test-push.mjs`(구문·타입체크·부분 스모크), 
  `docs/execution/runs/P4-T02/device-checklist.md`.

## 정합 갱신(허용 경로 안의 기존 단언 갱신)

- `src/views/more/ui/__tests__/MoreView.test.tsx`의 링크 개수 단언을 2→3으로 갱신하고 "알림
  설정" 링크 검증을 추가했다. RED(MoreView.tsx에 링크 추가 전, 1 failed)→GREEN(5/5) 확인.
- `tests/e2e/support/work-date-band.ts`에 `pushSubscription: { minMonthsAhead: 561,
  maxMonthsAhead: 592 }` 밴드 1개만 추가했다(직전 `notifications` 밴드 528~559 다음 구간,
  겹침 없음).
