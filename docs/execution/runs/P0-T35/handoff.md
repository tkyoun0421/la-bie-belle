# P0-T35 handoff

## 2026-08-06 · 개발 단계 종료

- 작업 식별자: P0-T35 (근무자 핵심 화면 퍼블리싱)
- 현재 단계: 개발 종료 → 다음 검증(조정자 교차 검증)
- 기준 시각: 2026-08-06, 기준 커밋: `11df49c`(RADIO 봉인 커밋 — 이 기록은 그 위 작업 트리 변경이다)

### 확정된 사실

- entities 4슬라이스(schedule·attendance·pay·notification)의 model 세그먼트를 RADIO가 지정한 파일 구성 그대로 구현했다. 각 타입 파일과 `*.mock.ts`는 `__tests__/<name>.test.ts`(타입 형태)·`__tests__/<name>.mock.test.ts`(목 시나리오 불변 규칙) 두 테스트로 나눠 tdd-guard의 "세그먼트당 정확히 매칭되는 테스트 파일" 요구를 만족시켰다.
- `assignment.ts`(배정표 행 DTO)는 `{ name, positions[], isTrainee, isMe }`만 갖는다. 전화번호·성별·시급·출결 필드가 타입 수준에서 존재하지 않음을 `Extract<keyof AssignmentRosterRow, ForbiddenKeys> extends never` 컴파일 타임 단언으로 고정했다.
- `views/home/model/home-priority.ts`(`deriveHomePriority`)는 RADIO Data model 절이 명시한 순수 함수 요구를 그대로 구현했다: 출퇴근 가능 → 마감 임박 신청 → 확정 변경 확인 → 다음 근무 → 빈 상태 5단계 우선순위를 판정하고, 우선순위별 단위 테스트로 순서를 고정했다.
- `widgets/app-shell/ui/AppShellTabBar.tsx`는 홈·일정·알림·전체 4탭을 아이콘+텍스트로 항상 표시하고, `usePathname` 기준 선택 탭만 action색, 읽지 않은 알림은 점(숫자 아님)으로 표시한다.
- 근무자 화면 6종(홈·일정·확정 상세·예상 급여·알림함·전체)을 모두 목 props 기반 정적 컴포넌트로 구현하고 각각 렌더 테스트를 붙였다: 홈은 우선순위 5종 + GPS 확인 중·성공·실패 3종을 포함해 11개 케이스, 일정은 달력 상태 5종(모집 없음·모집 중·신청·마감·확정, 선택은 상호작용으로 확인) + Undo 스낵바, 확정 상세는 예정 출퇴근→내 배정→전체 배정표(기본 펼침·본인 강조·교육생 배지)→예식 시간→근무 변경 요청(비활성 자리표시) 순서와 개인정보 미노출, 예상 급여는 "예상" 문구·차이 안내·금액 숨김 토글·리허설 추가/삭제(Undo 포함), 알림함은 오늘/이번 주/이전 그룹과 모두 읽음, 전체는 예상 급여 진입 항목 하나만 가진 최소판이다.
- `views/preview/ui/PreviewView.tsx`는 화면×시나리오 등록표(`screens` prop)를 받아 선택 UI만 그리는 제네릭 컴포넌트로 구현했다. 실제 화면·시나리오 등록은 `src/app/preview/page.dev.tsx`(app 레이어)가 모든 views 슬라이스를 import해 조립한다 — **구현 중 발견한 RADIO 구체화 필요 사항**: 최초 설계대로 `views/preview`가 다른 views 슬라이스(home·schedule 등)를 직접 import하면 `project/layer-direction`(같은 계층의 다른 슬라이스 직접 import 금지)에 위배되어 `pnpm lint`가 10건의 에러로 차단했다. app 레이어만 여러 views 슬라이스를 조합할 수 있는 유일한 위치이므로, 화면×시나리오 조합(ReactNode 배열)을 app 레이어에서 만들어 `PreviewView`에 props로 내려주는 구조로 바꿔 해소했다 — RADIO의 "화면×시나리오 선택 UI" 요구·"production 라우트에 없음" 요구·"shared/ui 미변경" 제약은 모두 그대로 지켰고, 새 제품·기술 결정은 없다(기존 DEV-ARCH-01 레이어 방향 규칙을 지키는 구현 세부 사항).
- `(tabs)` route group에 layout(AppShellTabBar 조립)·홈·일정·알림·전체·예상급여 5개 route를, 그룹 밖에 `schedule/[id]`(탭 없음·뒤로가기)를 조립했다. 각 production route는 entities/views 목 시나리오 1개를 import해 view에 전달하는 것 외의 로직이 없다(일정·알림함 route만 `next/navigation`의 `useRouter().push(...)` 한 줄로 상세 이동을 배선한다 — 순수 네비게이션 배선이며 업무 로직이 아니다).
- `src/app/page.tsx`·`src/views/bootstrap/`를 제거하고 `(tabs)/page.tsx`(홈)로 대체했다. `tests/e2e/bootstrap.spec.ts`를 삭제하고 `tests/e2e/home.spec.ts`로 교체했다 — 헤딩 텍스트를 의도적으로 깨뜨려 RED(exit 1, `04:15:01Z`)를 재현한 뒤 되돌려 GREEN(exit 0, `04:15:14Z`)을 확인했다.
- **production 라우트 재현**: `pnpm build` 후 라우트 목록은 `/`, `/_not-found`, `/manifest.webmanifest`, `/more`, `/notifications`, `/pay`, `/schedule`, `/schedule/[id]`이며 `/preview`는 없다(P0-T34의 `pageExtensions` NODE_ENV 분기를 설정 변경 없이 그대로 재사용).
- **서버 접근 grep 재현**: `grep -rn "shared/api\|supabase\|fetch(" src/app/(tabs) src/app/schedule src/app/preview src/views/home src/views/schedule src/views/schedule-detail src/views/pay src/views/notifications src/views/more src/views/preview src/widgets/app-shell src/entities` → 0건.
- **참고(수정 아님, 이번 라운드 발견)**: 이 작업 트리에 실제 `.env`/`.env.local`이 없어 `pnpm build`·`pnpm check:client-secret-scan`이 즉시 차단됐다(둘 다 `env.server.ts`의 `import "server-only"` 검증과 secret-scan 스크립트가 요구). `.env.example`에 이미 있는 placeholder 값을 그대로 `.env`·`.env.local`로 복사해 로컬 검증을 통과시켰다 — 둘 다 `.gitignore`의 `.env.*` 패턴으로 무시되며 커밋 대상이 아니다. 이 공유 작업 트리에 처음부터 두 파일이 없었던 것은 P0-T35 범위 밖의 개발 환경 부트스트랩 공백이다.
- **참고(수정 아님, 이번 라운드 발견)**: `pnpm build`가 여전히 "Found 1 warning while optimizing generated CSS"(`bg-[var(--raw-*)]`, P0-T34 fix cycle에서 이미 문서화된 것과 동일 원인 — `docs/execution/reviews/P0-T34-review.json`의 발견 설명 문자열)를 낸다. 이번에 새로 확인된 사실: `pnpm dev`(Turbopack dev 모드)에서는 같은 CSS가 경고가 아니라 **모든 라우트를 500으로 깨뜨리는 하드 오류**다(`/`, `/preview` 둘 다 재현). 원인 파일은 조정자 소유(`docs/execution/reviews/**`)이거나 P0-T34·P0-T35 RADIO가 변경을 금지한 `globals.css`/Tailwind 콘텐츠 스캔 설정이라 이번 범위에서 고치지 않았다. `pnpm verify`가 쓰는 경로(`pnpm build` 프로덕션 빌드, `pnpm test:e2e`의 `next start`)는 이 dev 전용 하드 실패를 타지 않아 검증 자체는 영향받지 않았지만, 실제 로컬 `pnpm dev` 개발 경험은 이 저장소 전체에서 현재 깨져 있다.

### 미결 사항

- `bg-[var(--raw-*)]` 빌드 경고와 `pnpm dev` 하드 실패의 근본 해소(Tailwind 콘텐츠 스캔을 `src/`로 좁히는 등)는 P0-T34 handoff가 이미 범위 밖으로 기록했고 이번에도 다루지 않았다 — 결정 주체: 사용자, 반환할 단계: 별도 task(globals.css/Tailwind 설정 변경은 두 RADIO 모두의 범위 밖).
- 공유 작업 트리에 `.env`/`.env.local`이 없던 문제는 로컬에서 `.env.example`을 복사해 우회했을 뿐 저장소에 반영되지 않는다 — 결정 주체: 사용자/조정자, 반환할 단계: 개발 환경 부트스트랩 문서화 또는 별도 task.
- `근무 변경 요청`(진입점만 비활성 자리표시), 전체 메뉴 정식판, 금액 숨김 토글의 영속 여부는 RADIO 미결 사항 그대로 다음 라운드로 남긴다.
- 재교차검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 `in_progress`로 남긴다.

### 다음 행동

1. 조정자가 화면 6종·entities 4슬라이스·app-shell·라우팅을 교차 검증한다.
2. 통과 확인 후 `index.jsonl`의 P0-T35를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `src/entities/{schedule,attendance,pay,notification}/model/**`(타입·목·테스트)
- `src/views/home/model/home-priority.ts`(+ 테스트)
- `src/widgets/app-shell/ui/AppShellTabBar.tsx`(+ 테스트)
- `src/views/{home,schedule,schedule-detail,pay,notifications,more,preview}/ui/**`(뷰·목·테스트)
- `src/app/(tabs)/**`, `src/app/schedule/[id]/page.tsx`, `src/app/preview/page.dev.tsx`, `src/app/layout.tsx`(SnackbarProvider 추가)
- `tests/e2e/home.spec.ts`(구 `bootstrap.spec.ts` 대체)
- `docs/execution/runs/P0-T35/tdd.json`(RED→GREEN 전 구간 기록)
- `docs/execution/phases/index.jsonl`(P0-T35 `in_progress`)

## 2026-08-06 · 교차 검증 확정 12건(F-01~F-08, F-12~F-15) + Tailwind 스캔 한정 수정

- 작업 식별자: P0-T35 (근무자 핵심 화면 퍼블리싱)
- 현재 단계: RADIO revision 2(SHA `c73a2b49...`, 커밋 `c73b5df`) 편입분 수정 → 다음 재교차검증
- 기준 시각: 2026-08-06, 기준 커밋: `c73b5df`(RADIO revision 2 재봉인 커밋 — 이 절은 그 위 작업 트리 변경이다). 발견 정본: `docs/execution/reviews/P0-T35-review.json`.
- 수정 커밋: 이 handoff 절을 포함하는 커밋(직후 `git log -1`로 확인). `worker_done` 보고에 정확한 SHA를 남긴다.

### 확정된 사실

- **선행(Tailwind 스캔 한정)**: `globals.css`의 `@import "tailwindcss"`를 `@import "tailwindcss" source(none);` + `@source "../";`로 바꿔 스캔 범위를 `src/`로 한정했다. `docs/execution/reviews/*.json` 같은 문서 파일 안 `bg-[var(--raw-*)]` 문자열을 더는 클래스 후보로 오인하지 않는다. `pnpm build`의 CSS 경고가 사라졌고, `pnpm dev`로 `/`를 재현하면 200과 정상 렌더를 확인했다(이전에는 전 라우트 500).
- F-01(high): `src/app/preview/page.dev.tsx` 최상단에 `"use client"`를 선언해 서버 컴포넌트가 클라이언트 컴포넌트에 함수 prop을 직렬화 없이 넘기던 RSC 경계 위반을 없앴다. `pnpm dev`로 `/preview`를 재현해 200과 함께 화면·시나리오 선택 UI, 홈 화면 콘텐츠("다음 근무" 등)가 실제로 렌더됨을 확인했다(이전에는 500).
- F-02(high): `AppShellTabBar`에 `min-h-16`을 줘 안정된 높이를 만들고, `ScheduleView`의 하단 저장 바를 `bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]`로 탭바 위에 쌓았다. 새 e2e(`tests/e2e/schedule.spec.ts`)로 신청하기 버튼의 bounding box가 탭바보다 위에 있고 실제 클릭이 통과함을 RED(겹침으로 실패, y=711 > 665)→GREEN으로 확인했다.
- F-03(high): `PayView`의 리허설 수정 바텀시트에 날짜·시작·종료 `Input`을 추가하고 `저장하기`가 값을 반영하도록 구현했다(이전에는 값 표시와 삭제만 있었다). 테스트 이름을 실제 동작(수정 후 목록·합계 반영)과 일치시켰다.
- F-04(medium): 시급 상수·시간 파싱·금액 계산을 `entities/pay/model/rehearsal-entry.ts`(`calculateRehearsalHours`·`calculateRehearsalAmount`·`MOCK_REHEARSAL_HOURLY_RATE`)로 옮기고 `RehearsalEntry`에 `hourlyRate`(생성 시 시급 스냅샷) 필드를 추가했다. `PayView`는 더 이상 계산을 소유하지 않고 이 함수만 호출한다. `날짜별 내역`과 `리허설`·`합계` 금액을 `rehearsalEntries` 상태에서 매번 다시 계산해, 추가·수정·삭제가 즉시 화면 전체에 반영된다.
- F-05(medium): `views/home/model/home-priority.ts`의 `HomePriority`와 `views/home/ui/HomeView.tsx`의 `HomeViewModel` 중복 유니언을 하나(`HomeViewModel`, `home-priority.ts` 소유)로 합쳤다. `home.mock.ts`의 모든 홈 시나리오를 `deriveHomePriority(facts)` 호출로 재작성해 `priority`를 fixture가 직접 지정하지 않게 했다.
- F-06(medium): `HOME_ATTENDANCE_SUCCESS`를 `HomeView.test.tsx`와 `preview` 등록표(`GPS 성공`)에 추가했다. `AttendanceSection`의 성공 분기가 `confirmedAt`을 `HH:mm`으로 표시하고(`서버 확인 시각 08:58`), 확인 중 분기에는 `Loader2` 회전 스피너를 추가했다.
- F-07(medium): `HomeView.test.tsx`에 모든 출퇴근 상태(가능·확인중·성공·실패 3종)를 순회하며 `/수정/`·`/삭제/` 이름의 버튼이 없음을 단언하는 회귀 테스트를 추가했다(`PRD:INV-ATT-01`).
- F-08(medium): `estimated-pay.mock.ts`의 `ESTIMATED_PAY_WITH_REHEARSAL`을 `HEAVY_REHEARSAL_ENTRIES`(새 fixture) 기반의 독립 시나리오로 다시 만들었다(더 이상 `WITH_ITEMS`의 별칭이 아니다). `confirmation.mock.ts`에 `NO_TRAINEE_ROSTER`(교육생 없는 대조군)를 추가해 `GENERAL_CONFIRMATION`이 쓰게 하고, `TRAINEE_CONFIRMATION`은 기존 교육생 포함 roster를 유지해 두 시나리오가 실제로 구분되게 했다. `날짜별 내역`이 `rehearsalEntries`에서 파생되도록 바뀌어(F-04) `REHEARSAL_ENTRIES` 개수와 내역 줄이 항상 일치한다. `preview` 등록표에 `공통` 화면(로딩·오류, 오류는 기존 `views/status/ui/ErrorScreen` 재사용)과 `예상 급여`의 `리허설 포함` 시나리오를 추가했다.
- F-09(medium, 코드 변경 없음): 목 소유 구조를 재확인해 기록한다 — 원자 도메인 fixture(`ATTENDANCE_*`, `CONFIRMED_ROSTER`, `REHEARSAL_ENTRIES` 등)는 `entities/*/model/*.mock.ts`가 소유하고, 여러 원자를 화면 형태로 조합한 시나리오 목(`home.mock.ts`, `schedule.mock.ts`, `pay.mock.ts`, `notifications.mock.ts`)은 해당 view의 `ui` 세그먼트가 소유한다. `(tabs)`의 각 route는 조합 목 import 한 줄과 view 전달만 갖는다(`onOpenDetail`/`onNavigate` 콜백 배선은 순수 네비게이션이며 업무 로직이 아니다). RADIO revision 2가 이 구조를 정문으로 정정했으므로 코드 이동은 하지 않았다.
- F-12(low): `ScheduleDetailView.test.tsx`의 순서 테스트가 이제 `h2` 순서(`["내 배정","전체 배정표","예식 시간"]`)와 본문 텍스트 인덱스 비교로 실제 DOM 순서를 단언하고, 강조 테스트는 본인 행에 `bg-action-surface` 클래스가 있고 다른 행에는 없음을 확인한다. `CONFIRMED_ROSTER`의 본인 이름을 `"나"`에서 `"정하은"`으로 바꿔 화면 표시 텍스트("나")와 fixture 데이터를 분리했다.
- F-13(low): `PayView`의 합계·일반/리허설 금액·날짜별 내역·리허설 기록 목록, `ScheduleDetailView`의 예정 출퇴근·예식 시간에 `tabular-nums`를 적용했다.
- F-14(low): `ScheduleDetailView`의 정식 담당자 포지션을 평문에서 `Badge tone="action"`으로 바꿨다(교육생은 기존 neutral `교육` badge 유지).
- F-15(low): `AppShellTabBar`의 읽지 않음 점에 `sr-only` "읽지 않음." 텍스트를 추가해 알림 탭의 접근 이름에 반영되게 했다. `HomeView`의 GPS 상태 영역을 `role="status" aria-live="polite"`로 감쌌다.
- **dev 재현 3건(최종)**: `pnpm dev` 기동 후 `curl`로 확인 — `/` 200(정상 렌더), `/preview` 200(화면·시나리오 선택 UI 렌더), `/schedule` 200(달력·하단 신청하기 바 렌더). 세 경로 모두 dev 서버 로그에 오류 없음.
- 검증 결과: `pnpm verify` 전체 통과 — `format:check`·`lint:ci`·`typecheck`·`test`(62 files, 423 tests)·`harness:typecheck`·`harness:self-test`(156/156)·`check:docs`·`build`(경고 없음)·`check:app-build`·`check:client-secret-scan`·`test:e2e`(2/2, `home.spec.ts`+신규 `schedule.spec.ts`)·`gate:all`.

### 미결 사항

- F-10(금액 숨김 로컬 미유지), F-11(오프라인 비활성 부재)은 지시대로 범위 밖 이월이며 이번 절에서 다루지 않았다.
- `.env`/`.env.local` 부트스트랩 공백은 이전 절 기록 그대로 미해결이다.
- 재교차검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 `in_progress`로 남긴다.

### 다음 행동

1. 조정자가 F-01~F-08·F-12~F-15와 Tailwind 스캔 한정 수정을 재교차검증한다.
2. 통과 확인 후 `index.jsonl`의 P0-T35를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로(이번 수정)

- `src/app/globals.css`(Tailwind `@source` 한정)
- `src/app/preview/page.dev.tsx`("use client", GPS 성공·리허설 포함·공통 로딩/오류 등록)
- `src/widgets/app-shell/ui/AppShellTabBar.tsx`(+ 테스트) — F-02·F-15
- `src/views/schedule/ui/ScheduleView.tsx` — F-02
- `src/views/pay/ui/PayView.tsx`, `pay.mock.ts`(+ 테스트) — F-03·F-04·F-08·F-13
- `src/entities/pay/model/rehearsal-entry.ts`, `rehearsal-entry.mock.ts`, `estimated-pay.mock.ts`(+ 각 테스트) — F-04·F-08
- `src/views/home/model/home-priority.ts`(+ 테스트), `src/views/home/ui/HomeView.tsx`, `home.mock.ts`(+ 테스트) — F-05·F-06·F-07·F-15
- `src/entities/schedule/model/assignment.mock.ts`, `confirmation.mock.ts`(+ 각 테스트) — F-08·F-12
- `src/views/schedule-detail/ui/ScheduleDetailView.tsx`(+ 테스트) — F-12·F-13·F-14
- `tests/e2e/schedule.spec.ts`(신규) — F-02
- `docs/execution/runs/P0-T35/tdd.json`(RED→GREEN 기록 추가)
