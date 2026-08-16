# P4-T02 handoff

## 2026-08-16 · 개발 종료

- 작업 식별자: P4-T02
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-16T13:41:00Z

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P4-T02-radio.md` **revision 2**, SHA-256
  `d69380dab93e5697ef1804f661489a5478b2c47666908f5ab17e2410345937c5`(index.jsonl
  `development_approval`과 대조 완료, 일치). 착수 시점은 revision 1(SHA-256
  `147ea02ef9d2b14a25be2ae64a388c4bb246cf6f3cdbbc46658635d34fbba759`)이었다.
- 기준 커밋: `dd3ad4c`("docs(P4-T02): reseal RADIO revision 2 with public standalone service
  worker", 조정자). 구현 커밋: 이 handoff 문서를 포함하는 본 커밋 — 최종 보고에서 SHA를
  확인할 수 있다.
- **정지 조건 반환 2회**, 둘 다 재개 지시를 받아 반영했다. 상세 경위·근거는
  `docs/execution/runs/P4-T02/radio.md`.
  1. SW 등록 번들 방식(RADIO revision 1의 "확정 사실") — Turbopack이 `new URL(...)` 참조를
     번들 없이 원본 복사해 MIME `video/mp2t`로 서빙, `@/` 별칭·TypeScript 문법 잔존을 프로덕션
     빌드로 실증 → `[질문]` 반환 → 조정자가 revision 2로 재봉인(`public/push-service-worker.js`
     독립 classic script).
  2. headless Chromium `Notification.permission` 고정(`"denied"`) — 순정 홈 화면 프로브로 환경
     제약 실증 → `[질문]` 반환 → 조정자 지시로 `page.addInitScript` 스텁 채택(재봉인 없음).
- RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 정지 조건 4개는
  최종 구현 기준 모두 발동하지 않았다(1번은 재봉인으로 이미 해소된 경로를 최종 구현이 따름) —
  실증 근거는 `docs/execution/runs/P4-T02/radio.md`의 "정지 조건 점검".
- `test_mode=tdd` 준수: RED→GREEN **9쌍**(model 3파일 묶음 1쌍, api 2파일 묶음 1쌍, SW lib
  최초 구현 1쌍, hooks 최초 구현 1쌍, MoreView 정합 갱신 1쌍, pgTAP 1쌍, revision 2 재설계로
  SW 파일 자체를 다시 RED→GREEN 1쌍, revision 2로 hooks register 인자를 다시 RED→GREEN 1쌍,
  e2e 1쌍) 전부 실제 명령 실행 결과로 `docs/execution/runs/P4-T02/tdd.json`에 기록했다(18
  entries). `pnpm gate:tdd` 통과.
- `public/push-service-worker.js`가 인증 세션에서 올바른 MIME으로 서빙되고 실제로 등록됨을
  프로덕션 빌드 + 인증된 워커 세션으로 실증했다(`page.evaluate`로 `fetch`·
  `navigator.serviceWorker.register` + `.ready` 직접 호출):
  ```json
  SW_MIME_PROBE {"status":200,"contentType":"application/javascript; charset=UTF-8","bodyStart":"const DEFAULT_TITLE = \"라비에벨\";..."}
  SW_REGISTER_PROBE {"ok":true,"scriptURL":"http://localhost:3100/push-service-worker.js"}
  ```
  revision 1의 결함(`Content-Type: video/mp2t`, 원본 TypeScript 그대로 서빙)이 해소됐음을
  같은 방식으로 대조 확인했다.
- 구현 중 별개로 발견한 기존 스키마 특성(수정하지 않음, `applications_profile_id_fkey`에
  cascade 없음 — 신청까지 마친 워커는 `deleteWorkerSessions`가 원천적으로 실패)은
  `radio.md`에 기록했고, `tests/e2e/schedule.spec.ts`의 기존 선례(신청까지 마친 워커는
  삭제 자체를 생략)를 그대로 따라 우회했다. 스키마 자체는 P4-T02 허용 경로 밖이라 손대지
  않았다.

### verify 결과 요약(포그라운드, 개별 단계로 재구성)

`pnpm verify`를 한 번의 연속 명령으로 돌리면 병렬 세션(들)의 미완성 작업 때문에 첫 실패에서
멈춘다. 조정자 지시대로 "내 변경 아닌 파일 실패는 고치지 않는다"를 지키면서 각 하위 단계를
개별 실행해 내 범위의 실제 상태를 확인했다.

| 단계 | 결과 | 비고 |
| --- | --- | --- |
| format:check | 내 범위 GREEN | 전체 실행은 `src/views/schedule/model/__tests__/deadline-batches.test.ts`(미소유, untracked) 1개로 실패. 내 4개 파일만 `prettier --write`로 정리 |
| lint:ci | 내 범위 GREEN | 전체 60 errors 전부 같은 미소유 파일 1개에서만 발생(참조 대상 모듈 `deadline-batches.ts` 미완성이라 `any` 다수). `eslint -c eslint.config.ci.mjs src/features/push src/views/more ...`로 내 파일만 스코프 실행해 0 errors 확인 |
| typecheck | 내 범위 GREEN | 전체 7 errors도 같은 파일(모듈 없음 1 + implicit any 6). `tsc --noEmit` 전체 결과에서 이 파일 제외 나머지는 무오류 |
| test(vitest) | 내 범위 GREEN | 1 failed suite = 같은 파일의 import 실패(모듈 없음)뿐. **1579/1579 테스트 통과, 242/243 파일 통과** |
| harness:typecheck | GREEN | |
| harness:self-test | GREEN | 321/321 |
| check:docs | GREEN | |
| build | GREEN | `/more/notification-settings` 라우트 포함 정상 컴파일 |
| gate:bundle | **FAIL(미소유 귀책 추정, 미수정)** | `.next/static/chunks` gzip 합계 506~508KB, 상한 500KB. 실행 시점 working tree에 병렬 세션(들)의 대규모 미커밋 변경(디자인 리스타일 ~25개 뷰 파일, 신규 `src/views/schedule/ui/DeadlineBatchList.tsx`·`src/shared/ui/segmented-control.tsx`, `harness/gates/retro.ts` 등)이 함께 있어 내 기여분만 분리 측정하지 않았다(다른 세션과 동시 편집 중인 파일을 stash로 건드리는 위험을 피함) — 원문은 아래 그대로 인용 |
| check:app-build | GREEN | `--reuse-build` |
| check:client-secret-scan | GREEN | `--reuse-build` |
| test:e2e | GREEN | **86/86**. 최초 시도는 내 작업 방식 실수(수동으로 띄운 `next start`가 Playwright `webServer.env`의 `SUPER_ADMIN_EMAIL` 주입을 못 받아 `roles.spec.ts`가 거짓 실패)로 56개가 무더기 실패했다 — 수동 서버를 종료하고 `pnpm test:e2e`가 자체 `webServer`로 앱을 띄우게 하자 해소됨. `recruitment-manage.spec.ts:112`(날짜 값 불일치)는 격리 재실행 시 통과해 사전 known-flaky로 판정(P4-T01·P3-T06 handoff에 동일 spec·동일 증상 선례 있음) — 이번 전체 실행에서는 그마저 없이 86/86 |
| gate:motion-render-budget | GREEN | |
| gate:all | GREEN(이 문서 작성 후 재확인 예정) | 이 handoff 작성 전 1회 실행은 `docs/execution/runs/P4-T02/handoff.md` 부재로만 실패 |

gate:bundle 원문:
```
[gate:bundle] .next/static/chunks 정적 청크 gzip 합계가 508KB(519741바이트)로 상한 500KB(512000바이트)를 넘었습니다.
  힌트: 청크 44개, 최대 청크 72KB. 의존성을 줄이거나 상한 변경 승인을 받으세요.
```

- 전체 스테이징 후 커밋한다(부분 스테이징 없음) — `.gitignore`, `docs/execution/radio/P0-T46-radio.md`,
  `docs/execution/runs/interviews/2026-08-16-agent-team-*.md`, `docs/execution/reviews/**`,
  그리고 이번 세션 중 확인된 병렬 세션(들)의 무관 변경(`src/app/globals.css`,
  `src/app/preview/page.dev.tsx`, `src/features/application/**`, `src/shared/ui/calendar.tsx`,
  `src/shared/ui/notification-row.tsx`, `src/shared/ui/segmented-control.tsx`, `src/views/admin*/**`,
  `src/views/catalog·departed·dormant·home·login·my-profile·notifications·onboarding·pay·pending·privacy·rejected·schedule-detail/**`,
  `src/views/schedule/model/**`(`schedule-cell-state.ts`·`deadline-batches.ts`·테스트),
  `src/views/schedule/ui/DeadlineBatchList.tsx`·`schedule.mock.ts`,
  `harness/gates/retro.ts`·`harness/gates/docs.ts`·`harness/lib/retro-gate.ts`·그 self-test,
  `docs/execution/runs/interviews/2026-08-16-design-system-overhaul.md`,
  `docs/execution/runs/interviews/2026-08-16-p4-t02-design.md`)는 제외했다. push는 하지 않는다
  (ci-finisher 소관).

### 미결 사항

- gate:bundle 초과분(506~508KB vs 500KB) — 이번 커밋 범위 안에서 원인 분리를 시도하지 않았다.
  결정 주체: 조정자, 반환할 단계: 검증(리뷰어가 이 커밋만 별도로 빌드해 실측하거나, 상한 변경
  승인 여부를 판단).
- `applications_profile_id_fkey`에 cascade가 없어 신청까지 마친 워커의 e2e 정리가 원천적으로
  실패하는 기존 스키마 특성 — 결정 주체: 조정자/스키마 소유 task, 반환할 단계: 기획(스키마
  변경이 필요한지 여부 자체가 새 결정).

### 다음 행동

1. 검증 단계 진입: `docs/execution/radio/P4-T02-radio.md`(revision 2)와
   `docs/execution/runs/P4-T02/radio.md`(적용 결과, 정지 조건 2회 반환 경위 포함) 대조,
   위험 매트릭스 각 행의 실증 근거(`docs/execution/runs/P4-T02/tdd.json`, pgTAP/단위/e2e 파일)
   확인.
2. gate:bundle 위반의 최종 귀책 판단(이 커밋만 격리 빌드 등) — 조정자·리뷰어 몫.
3. `index.jsonl`의 P4-T02 상태를 `in_progress` → 검증 단계에 맞는 다음 상태로 전환하는 것은
   조정자 몫.

### 증거·산출물 경로

- 마이그레이션: `supabase/migrations/20260820000000_push_subscription_write.sql`
- pgTAP: `supabase/tests/25-push-subscriptions.test.sql`(plan 44)
- Service Worker: `public/push-service-worker.js`
- 기능 슬라이스: `src/features/push/{model,api,hooks,ui}/**`
- 화면: `src/views/notification-settings/ui/NotificationSettingsView.tsx`,
  `src/views/more/ui/MoreView.tsx`(메뉴 항목 1개), `src/views/schedule/ui/ScheduleView.tsx`
  (사전 안내 삽입 1곳)
- 라우트: `src/app/(protected)/(tabs)/more/notification-settings/page.tsx`
- dev 스크립트: `scripts/send-test-push.mjs`
- e2e: `tests/e2e/push-subscription.spec.ts`(3 test),
  `tests/e2e/support/work-date-band.ts`(`pushSubscription` 밴드 561~592 추가)
- 실기기 체크리스트: `docs/execution/runs/P4-T02/device-checklist.md`
- TDD 증거: `docs/execution/runs/P4-T02/tdd.json`(RED→GREEN 9쌍, 18 entries)
- RADIO 적용 결과(정지 조건 2회 반환 경위 포함): `docs/execution/runs/P4-T02/radio.md`
- 구현 커밋: 이 문서를 포함하는 본 커밋

## 2026-08-16 · 교차 검증 수정 라운드(F-01·F-02)

- 작업 식별자: P4-T02
- 현재 단계: 개발 종료 상태 유지, 교차 검증(`docs/execution/reviews/P4-T02-review.json`) 확정
  발견 high 2건 수정 라운드 → 다음 검증(리뷰어 재확인)
- 기준 시각: 2026-08-16T14:20:00Z

### 확정된 사실

- 기준 RADIO가 revision 2(SHA-256 `d69380dab93e5697ef1804f661489a5478b2c47666908f5ab17e2410345937c5`)
  → **revision 3**(SHA-256 `7f232a1cf8d28ec19bdbaf217e28ff4c18d2fe2b331baa737e4721d308cf2598`,
  재봉인 커밋 `80b61df`)로 바뀌었다. `index.jsonl`의 `development_approval`도 revision 3으로
  갱신됐다(조정자).
- F-01(high, 유령 구독)·F-02(high, 계정 전환 미재귀속) 둘 다
  `src/features/push/hooks/usePushSubscription.ts` 안에서 해소했다 — 허용 경로 밖 파일이
  필요하지 않아 추가 정지 조건 반환 없이 완료했다. 상세는
  `docs/execution/runs/P4-T02/radio.md`의 "교차 검증 수정 라운드" 절.
- `test_mode=tdd` 절차: `usePushSubscription.test.ts`에 새 테스트 2개(F-01 보상 해지 단언,
  F-02 재귀속 호출 단언) + 미호출 케이스 명시 테스트 1개를 추가한 뒤 구현을 이전 상태로 둔 채
  실행해 RED(2 failed | 7 passed, 2026-08-16T14:14:06Z) 확보, 구현 수정 후 같은 명령으로
  재실행해 GREEN(9/9, 2026-08-16T14:14:24Z) 확보. `docs/execution/runs/P4-T02/tdd.json`에 새
  RED→GREEN 쌍 추가(총 10쌍, 20 entries). `pnpm gate:tdd` 통과.
- 확인한 검증 단계(내 범위로 스코프): `pnpm vitest run src/features/push`(37/37),
  `pnpm exec eslint -c eslint.config.ci.mjs src/features/push`(0 errors — 테스트의 오류 코드
  문자열 리터럴을 `ERROR_CODE.COMMON_UNEXPECTED` 참조로 고쳐 통과), `tsc --noEmit`(전체
  무오류), `pnpm test`(전체 243/243 파일·1593/1593 테스트 GREEN — 이전 라운드에서 미소유
  파일 때문에 실패했던 `deadline-batches.test.ts`는 그 사이 다른 세션이 구현을 채워 이번엔
  이 실행에서도 통과했다, 내가 손대지 않음).
- 전체 verify(format/build/e2e/gate:bundle 등)는 이번 라운드에서 다시 돌리지 않았다 — 두 파일
  범위의 최소 수정이라 개발 종료 시점 handoff의 verify 결과 요약(gate:bundle 미소유 원인 추정
  포함)이 유효하다고 판단했다. 필요하면 검증 단계에서 리뷰어가 전체 재실행한다.
- 전체 스테이징 후 커밋한다(부분 스테이징 없음) — 수정 대상 2파일(`usePushSubscription.ts`,
  `usePushSubscription.test.ts`)과 `docs/execution/runs/P4-T02/{tdd.json,radio.md,handoff.md}`만
  스테이징했다. 이번 세션 중에도 계속 변하고 있는 병렬 세션(들)의 무관 파일은 손대지도
  스테이징하지도 않았다. push는 하지 않는다(ci-finisher 소관).

### 미결 사항

- 없음 — F-01·F-02는 이번 라운드로 해소됐다. F-03~F-13(medium·low)은 backlog가 소유하며 이
  task의 결정 대상이 아니다.

### 다음 행동

1. 리뷰어가 이번 수정 커밋을 F-01·F-02 원 발견과 대조해 해소를 확인한다.
2. `index.jsonl`의 P4-T02 상태 전환은 조정자 몫.

### 증거·산출물 경로

- 수정 파일: `src/features/push/hooks/usePushSubscription.ts`,
  `src/features/push/hooks/__tests__/usePushSubscription.test.ts`
- 교차 검증 원본: `docs/execution/reviews/P4-T02-review.json`(읽기 전용)
- TDD 증거: `docs/execution/runs/P4-T02/tdd.json`(새 RED→GREEN 쌍, 20 entries)
- RADIO 적용 결과(수정 라운드 상세): `docs/execution/runs/P4-T02/radio.md`
- 수정 커밋: 이 절을 포함하는 본 커밋

## 검증 종료 (조정자, 2026-08-16)

- 교차 검증 결과: `docs/execution/reviews/P4-T02-review.json` — 총점 75
  (code 70 · tests 70 · security 68 · perf 93 · arch 72), 확정 13건.
- high 2건은 revision 3 재봉인(80b61df) 후 수정 라운드 dcd49f8으로 해소:
  F-01 저장 실패 보상 해지, F-02 기존 구독 마운트 재귀속. 수정 diff 감사
  완료 — 허용 경로 5개 파일만, 병렬 세션 변경 미포함.
- medium 7·low 4는 backlog(F-03~F-13)가 소유. F-06(proxy matcher SW 제외
  누락)은 허용 경로 밖(src/proxy.ts)이라 별도 조치 필요 표기, F-09(소유자
  재지정 감사)는 P4-T08 설계에서 재론.
- 기각 2건(근거 있는 반박): 「서버 액션 동적 import 관례 이탈·배선
  무검증」은 Next.js 공식 지원·radio 기록·계층별 검증 충족으로,
  「마운트마다 register 소프트 업데이트」는 W3C Register 알고리즘(동일
  scriptURL·type·updateViaCache면 기존 registration 반환)으로 반박됐다.
- 알려진 보류: 구현 커밋 69f2dad가 병렬 디자인 세션의 미커밋 모듈
  3종(segmented-control·deadline-batches·DeadlineBatchList)을 참조해 단독
  빌드 불가 — push·CI는 그 모듈들이 커밋된 뒤 수행한다(사용자 결정,
  2026-08-16). gate:bundle 초과(506~508KB/500KB)도 병렬 변경 혼입 상태의
  측정이라 push 시점에 재측정한다.
