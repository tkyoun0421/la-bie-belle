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
