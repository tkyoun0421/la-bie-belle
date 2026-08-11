# P0-T45 handoff

## 2026-08-11 · 교차 검증 수정 라운드 종료

- 작업 식별자: P0-T45 (화면 전환)
- 현재 단계: 개발(3단계) 종료 → 다음 검증(교차 리뷰 재확인)
- 기준 커밋: `83b9d0d`(조정자가 RADIO revision 4 재봉인·`index.jsonl` 갱신을 먼저 커밋한 지점 — 이번 구현 커밋의 부모)

### 확정된 사실

- 교차 검증(opus·codex)이 revision 3 구현(커밋 `610dfbf`)에 대해 확정 10건(high 4·medium 4·low 2), 종합 78점, `critical` 없음을 냈다. 사용자가 F-01~F-05(high 4건 + MUST 위반 medium 1건) 다섯 건만 이번 라운드 범위로 지정했고, F-06~F-10은 backlog로 명시적으로 미뤘다.
- RADIO가 revision 4(SHA-256 `0084c924676ccf12804eecf565d22026944ffca1c84c5a055f978d80608b5762`)로 재봉인됐다 — 불변 규칙 두 줄(상위 문서 우선, `filter` 배제)과 화면 전환 220~280ms 대역 추가, `notifications/page.tsx`의 「용도 한정」을 "이미 있는 이동에 전환 타입을 붙이는 것"까지 확대.
- F-01~F-05를 전부 해소했다 — HomeView 두 링크·알림 `router.push`에 `nav-forward` 태깅(F-01), 크로스페이드를 순차에서 동시 재생으로 바꾸고 `--duration-crossfade`를 200ms→250ms로 올려 전환 총 시간을 400ms에서 250ms로 낮춤(F-02, `FOUNDATIONS.md:120`의 220~280ms 대역 안), e2e 6건 신설(전체 화면 목적지 셋·알림→예상급여·뒤로 가기 네 경우)과 탭 페이드 커버리지를 4쌍 전부로 확대(F-03), `installViewTransitionSpy`를 인덱스 동기화 + `pseudoElement` 방향 판정 구조로 재설계(F-04), `route-fade` 키프레임에서 `filter: blur()` 제거(F-05). 각 항목의 근거와 F-02의 값 선정 이유(스킬 레시피가 아니라 `FOUNDATIONS.md`와 기존 `--duration-overlay` 토큰에 근거)는 `docs/execution/runs/P0-T45/radio.md`의 「교차 검증 수정 라운드(revision 4)」 절이 소유한다.
- `pnpm db:reset` 뒤 `pnpm verify` 전체(format·lint·typecheck·unit 1340건·harness·check:docs·build·gate:bundle·check:app-build·check:client-secret-scan·e2e 67건·gate:motion-render-budget·gate:all)가 GREEN이다. DB 초기화 전 1회차에서 `recruitment-manage.spec.ts`·`recruitment-open.spec.ts` 각 1건이 work_date 23505 충돌로 실패했으나 이 task와 무관한 기존 시딩 데이터 잔존 문제였다(재초기화 뒤 통과).
- 최종 번들 실측 491.31KB(503,097바이트), 상한 500KB(512,000바이트) 대비 여유 8,903바이트(8.69KB). F-01의 `HomeView.tsx` prop 추가로 이전 실측(503,070바이트) 대비 27바이트 늘었다 — F-02·F-05는 CSS만 바꿔 이 지표에 영향이 없다.
- `docs/execution/runs/P0-T45/tdd.json`에 이번 라운드 RED→GREEN 3쌍(6건)을 추가로 기록했다 — HomeView 컴포넌트 테스트 2건(`transitionTypes` 유무), `RouteTransition`의 `enter`/`exit` 매핑을 통째로 뒤바꿔 만든 e2e 4건 묶음(F-04 방향·MoreView 슬라이드·알림 슬라이드·탭 페이드), 테스트 어서션을 임시로 반대로 뒤집어 만든 e2e 5건 묶음(미지원 환경 상세 진입·뒤로 가기 네 경우). 실제 명령 실행 시각으로만 기록했다.
- 「전환이 끝나기 전에 뒤로 가기를 눌러도 화면이 안착한다」 e2e를 처음 짤 때 `page.getByRole("button", ...).click()` 직후 바로 `page.goBack()`을 부르면 클릭이 촉발한 `router.push`가 히스토리에 반영되기 전에 뒤로 가기가 먼저 실행돼 간헐적으로 실패했다(빈 페이지로 튐). `page.waitForURL(...)`로 URL이 상세 경로로 바뀐 것만 확인한 뒤 `goBack()`을 부르도록 고쳐 5회 반복 실행으로 안정성을 확인했다.

### 미결 사항

- F-06(탭 바 격리 e2e가 격리 CSS를 관찰하지 않음)·F-07(전환 타입 리터럴 산재)·F-08(reduced-motion 정규식 과대 포착)·F-09(`--duration-crossfade` 존재 단언 부재)·F-10(`AppShellTabBar.tsx:33`의 도달 불가 분기)은 사용자가 이번 라운드 범위 밖으로 명시했다 — backlog로 남는다.
- Phase 1 handoff가 남긴 미결 사항(HomeView 두 링크에 `transitionTypes` 없음)은 이번 라운드의 F-01로 해소됐다.
- `admin/page.tsx` 안 5개 하위 링크(가입 승인·역할 관리 등)에 `transitionTypes`가 없는 것은 F-01~F-05 목록에 없어 손대지 않았다 — 이번 결정 신호는 아니다.

### 다음 행동

1. 4단계 검증 — 이번 라운드로 해소된 5건에 대한 재확인과 나머지 확정 findings의 backlog 편입을 조정자가 진행한다.

### 증거·산출물 경로

- 구현 커밋 — 기준 커밋 `83b9d0d` 대비 diff
- `docs/execution/runs/P0-T45/radio.md`(「교차 검증 수정 라운드(revision 4)」 절 — F-01~F-05 해소 방식, F-02 값 근거, 번들 재실측)
- `docs/execution/runs/P0-T45/tdd.json`(이번 라운드 RED→GREEN 3쌍 추가)
- `tests/e2e/tab-navigation.spec.ts`(11건 → 17건)
- `src/views/home/ui/__tests__/HomeView.test.tsx`(2건 순증)
- `src/views/home/ui/HomeView.tsx`, `src/app/(protected)/(tabs)/notifications/page.tsx`, `src/app/globals.css`

## 2026-08-11 · 개발 단계 종료

- 작업 식별자: P0-T45 (화면 전환)
- 현재 단계: 개발(3단계) 종료 → 다음 검증(교차 리뷰)
- 기준 시각: 2026-08-11T05:46:13Z
- 기준 커밋: `ba60cdf`(revision 2 재봉인 handoff 정정 커밋 — 이 handoff가 속한 구현 커밋의 부모)

### 확정된 사실

- 개발 중 두 차례 멈추고 질문으로 반환했으며, 둘 다 사용자 결정으로 재봉인됐다 — (1) revision 1 → 2: 인수 조건 3(탭 밖 진입 확대)이 요구하는 `src/views/more/**`·`src/views/home/**`가 「변경 허용 경로」에 빠져 있어 정정, (2) revision 2 → 3: reduced-motion 페이드가 "새 토큰 금지" 규칙과 P0-T43의 기존 시간 토큰 4종 reduced-motion 리셋 사이에서 충돌해 전용 토큰 `--duration-crossfade` 신설. 두 경위의 근거·선택지는 `docs/execution/runs/P0-T45/radio.md`의 「revision 1 → 3, 재봉인 두 번의 경위」가 소유한다.
- RADIO `docs/execution/radio/P0-T45-radio.md` revision 3, SHA-256 `f954ee29aa1c798b2c6b927b594a6570a915465693f3d570fa736fd53f597dec`가 index의 `development_approval`과 일치한다. 이 revision 3 재봉인 본문과 index의 `in_progress` 전환은 이번 구현 커밋에 함께 포함된다 — 조정자가 두 파일을 미리 커밋하지 않고 작업 트리에 남겨 둔 것을 그대로 이어받았다(재봉인 당시 지시: "네 커밋에 이 두 파일을 함께 넣어라").
- 기술 인수 조건 9건을 전부 완료했다. 상세 구현 내용·근거·테스트 기법 정정(`document.getAnimations()`로 애니메이션 "이름"이 아니라 "지속시간"을 봐야 정확하다는 것)·구현이 RADIO 서술보다 단순해진 지점(reduced-motion 전용 CSS 오버라이드가 불필요해져 제거)은 `docs/execution/runs/P0-T45/radio.md`가 소유한다.
- 로컬 Supabase를 `pnpm db:reset`으로 초기화한 뒤 `pnpm verify` 전체(format·lint·typecheck·unit 1338건·harness typecheck·harness self-test 321건·check:docs·build·gate:bundle·check:app-build·check:client-secret-scan·e2e 61건·gate:motion-render-budget·gate:all)가 GREEN이다. 초기화 전 로컬 실행에서 `recruitment-manage.spec.ts`·`recruitment-open.spec.ts` 각 1건이 이 저장소에 이미 있는 알려진 문제(로컬 재실행 시 잔존 스케줄 행과의 work_date 23505 충돌)로 실패한 바 있으나, 두 파일 모두 이번 세션에서 손대지 않았고 P0-T45 범위 밖이다 — DB 초기화 뒤에는 두 spec도 포함해 61건 전부 통과했다.
- 최종 번들 실측 491.28KB(503,070바이트, gzip 청크 38개), 상한 500KB(512,000바이트) 대비 여유 8,930바이트(8.72KB) — 최소 배치 직후 실측과 동일하다. CSS만 늘고 `.next/static/chunks`의 `.js` 총량은 변하지 않았다.
- `docs/execution/runs/P0-T45/tdd.json`에 RED→GREEN 7쌍(14건)을 실제 명령 실행 시각으로 기록했다. 이 중 5쌍은 코드에 실재하는 지점(CSS 선언 유무·`viewTransitionName` 유무·`--duration-crossfade` reduced-motion 리셋 포함 여부)을 임시로 원상태로 되돌려 만든 진짜 RED다. 인수 조건 7(겹침)의 두 e2e(다른 탭 요청 시 마지막 화면 안착, 같은 탭 재클릭 시 계수 불변)는 GREEN만 기록했다 — 두 동작 모두 이 task가 작성한 코드가 아니라 Next.js Router 자체가 보장하는 것이라 의미 있는 RED를 만들 수 없었다. `checkTddEvidence` 게이트는 task당 최소 1쌍만 요구하므로 게이트를 막지 않는다. 근거는 `docs/execution/runs/P0-T45/radio.md`의 「TDD 증거를 남기지 않은 두 검사」에 있다.
- RADIO의 「미결 사항」이 요구한 F-08(`PullToRefresh`의 상시 `translateY(0px)`가 전환 스냅샷을 왜곡하는지) 확인을 실제 빌드에서 수행했다 — 홈·일정·알림·예상급여 네 화면의 `RouterPullToRefresh` 하위 트리에 `absolute`/`fixed` 자손이 없고, 스크린샷으로 직접 확인한 결과 왜곡은 관찰되지 않았다. 결정 신호로 반환할 사안이 아니라고 결론지었다.
- `AppShellTabBar.tsx`의 기존 컴포넌트 테스트, `ScheduleView.tsx`·`ScheduleDetailView.tsx`·`ScheduleDetailClosedView.tsx`·`MoreView.tsx`·`HomeView.tsx`의 기존 컴포넌트 테스트가 전부 무수정 상태로 통과한다 — 회귀 없음.

### 미결 사항

- 없음. RADIO의 「미결 사항」 절 중 F-08은 위에서 확인 완료, `loading.tsx` Suspense reveal 전환 여부와 관리자 하위 내비게이션 재검토는 이 task 범위 밖으로 위임된 그대로다.
- `HomeView.tsx`의 confirmation-change·next-shift 두 `/schedule/${date}` 링크는 `transitionTypes`가 없어 브라우저 기본(없음) 전환으로 남아 있다 — RADIO Architecture 절이 명시한 것은 deadline-application 분기(탭 이동, 인수 조건 2) 하나뿐이라 손대지 않았다. 회귀는 아니나, 두 링크가 실제로는 상세 진입(인수 조건 3 영역)에 해당하므로 후속 검토 대상이라고 `docs/execution/runs/P0-T45/radio.md`에 남겼다. 결정 주체: 사용자(조정자 경유), 반환 단계: 설계(후속 task로 제안).

### 다음 행동

1. 4단계 검증 — 등록 `check_ids`(`view-transition-fired`·`tab-fade`·`detail-slide`·`persistent-nav-isolation`·`reduced-motion-fade`·`transition-overlap`·`bundle-budget-500-hold`)와 교차 검증을 수행한다.
2. 위 "미결 사항"의 HomeView 두 링크 건은 검증 단계에서 발견으로 다룰지, 후속 제안으로 분리할지 조정자가 판단한다.

### 알아둘 것

- **로컬 e2e 재실행 전 `pnpm db:reset`을 권한다.** `schedules`가 append-only라 랜덤 날짜를 쓰는 일부 spec은 같은 날 두 번째 로컬 실행에서 23505로 죽을 수 있다. CI는 매번 DB를 새로 세우므로 재현되지 않는다.
- **`document.getAnimations()`로 View Transition CSS를 검증할 때는 애니메이션 "이름의 존재"가 아니라 "지속시간"을 봐야 한다.** 지속시간 0인 애니메이션도 이름은 잡힌다.

### 증거·산출물 경로

- 구현 커밋 — 기준 커밋 `ba60cdf` 대비 전체 diff(RADIO revision 3 재봉인 본문·index `in_progress` 전환 포함)
- `docs/execution/runs/P0-T45/radio.md`(재봉인 경위 2건, 인수 조건 9건 상세, 테스트 기법 정정, F-08 확인 결과)
- `docs/execution/runs/P0-T45/tdd.json`(7개 RED→GREEN 쌍)
- `tests/e2e/tab-navigation.spec.ts`(신규 6건 + 기존 4건 + 기존 인수 조건 1건 = 11건)
- `src/shared/config/app-tabs.config.ts`, `src/shared/model/route-transition.ts`, `src/shared/ui/route-transition.tsx`
- `src/app/globals.css`, `src/app/__tests__/globals.test.ts`
- `src/widgets/app-shell/ui/AppShellTabBar.tsx`, `src/views/schedule/ui/ScheduleView.tsx`, `src/views/schedule-detail/ui/*`, `src/views/more/ui/MoreView.tsx`, `src/views/home/ui/HomeView.tsx`
- `src/app/(protected)/**/page.tsx`(15개, 전환 래퍼 배치)
