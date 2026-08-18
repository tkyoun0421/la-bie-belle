# P0-T48 handoff

## 2026-08-19 · 인수 조건 41 GREEN — 원인 셋을 따로 고치고 잔여 결함 하나를 더 찾았다

`tests/e2e/tab-navigation.spec.ts` RED(4 failed :338 :365 :439 :551 / 13 passed)를 GREEN(17
passed)으로 바꿨다. 원인 셋은 지시대로 따로 다뤘고, 도중에 브리핑에 없던 넷째 결함을 하나 더
찾아 고쳤다.

**원인 A(`:439`, 구현 결함).** `(tabs)/layout.tsx`의 `<div data-app-shell>` 래퍼를 걷어 Fragment로
바꿨다 — `{children}` 위에 호스트 엘리먼트가 있으면 React `completeWork`가 그 호스트에서
`ViewTransitionStatic` 비트를 지워 `(tabs)` 경계를 넘는 이동이 `enter`도 `exit`도 못 받는다.
`data-app-shell`은 `AppHeader.tsx`의 고정(비-`aria-hidden`) 사본 하나로 옮겼다 — 스페이서 사본이
아니라 실제로 화면에 보이는 헤더 쪽을 골랐고, `AppHeader.test.tsx`에 이 속성 위치를 단언하는
테스트가 없어 자유 판단이었다. `globals.css`의 `body:has([data-app-shell])` 선택자는 자손 매칭이라
어느 자손이 속성을 들든 그대로 동작해 손대지 않았다.

**필수 검증**(RADIO 지시대로): `route-transition.tsx`의 `enter`/`exit` 내용을 일부러 맞바꿔 RED가
재현되는지 확인했다 — `expect(durationOf(...)).toBeGreaterThan(0)` 계열 단언이 다시 실패하며
`:439`와 같은 지점에서 깨지는 것을 확인한 뒤 `git diff`가 빈 diff를 낼 때까지 원복했다.

**원인 B(`:338`·`:551`, 테스트 결함).** `installViewTransitionSpy`가 `document.startViewTransition`을
가로챌 때 호출마다 `types` 배열을 함께 기록하도록 바꿨다. `readTransitionAnimations`는 더 이상
호출 순번(index)이 아니라 기대하는 전환 타입(`"tab"`·`"nav-forward"`·`"nav-back"`)으로 레코드를
찾는다 — 이동 한 번에 `startViewTransition`이 여러 번(탭 눌림 애니메이션 등 타입 없는 호출 포함)
도는데 스파이가 한 번을 가정했던 게 `:338`의 결함이었다.

`:551`("같은 탭을 다시 눌러도 전환 호출이 늘지 않는다")은 브리핑에 적힌 `readTransitionAnimations`
경로를 쓰지 않는 테스트라 그 수정만으로는 안 고쳐졌다 — 원시 호출 수를 그대로 비교하고 있었다.
디버그 로그로 확인해 보니 같은 탭을 다시 누르면 타입 없는 `startViewTransition`이 뒤늦게 하나 더
잡히는 타이밍이 있어 원시 개수 비교가 흔들렸다. `readTypedTransitionCount`(`types.length > 0`인
레코드만 세는 함수)와 `waitForTransitionSettle`(마지막 레코드 변화 후 400ms 무변화를 기다리는
함수)을 새로 만들어 클릭마다 "정착 후 타입 있는 개수"를 비교하도록 바꿨다. 진단 문서의 대안
B-2·B-3을 섞은 조합이다 — `--workers=1`로 같은 테스트만 10회 반복해 10/10 통과를 확인했다.

**원인 C(`:365`, 병렬 전용 결함).** `WORK_DATE_BANDS.viewTransition` 한 구간을 나눠 쓰는 테스트가
브리핑이 말한 여섯이 아니라 실제로는 아홉이었다(`grep`으로 전수 확인). `splitBand(band, 9)`로
아홉 구간으로 쪼개 `schedule-confirmation.spec.ts`가 쓰는 것과 같은 관용구로 각 테스트에
전용 구간을 줬다.

**넷째 결함(`:513`, 브리핑에 없던 잔여 결함).** 전체 스위트를 반복 실행하는 도중
"상세 진입은 새 화면이 올라오고 뒤로 가기는 옛 화면이 내려간다" 테스트가 `--workers=1` 단독
실행에서도 6번에 1번꼴로 flake했다 — `route-fade`의 new쪽 애니메이션 길이가 0으로 읽혔다.
디버그 덤프로 실패 케이스를 직접 잡아 보니 레코드 자체는 하나(중복 아님)였는데 그 안의
`animations` 배열이 old쪽 3개만 담고 new쪽 `route-fade` 2개가 빠져 있었다 — `transition.ready`가
풀리는 시점에 `document.getAnimations()`를 바로 부르면 new쪽 pseudo-element 애니메이션이 아직
등록되지 않는 레이스였다. `transition.ready.then()` 안에서 `requestAnimationFrame`으로 두 프레임을
더 기다린 뒤에 `document.getAnimations()`를 읽도록 고쳤다. `--workers=1`로 해당 테스트만 8회
반복해 8/8 통과를 확인했다(고치기 전 표본은 6회 중 1회 실패).

**전체 스위트 검증 중 관측한 부하.** `pnpm test:e2e tests/e2e/tab-navigation.spec.ts`(옵션 없는
그대로) 1차 실행이 `:441`("전체 화면의 목적지 셋으로 이동하면 새 화면에 슬라이드가 걸린다",
60초 타임아웃 지정된 테스트) 하나에서 `page.waitForFunction: Test ended.`로 실패했다(16
passed / 1 failed). 그 직후 같은 테스트를 `--workers=1` 단독으로 4회 반복해 4/4 통과(매회 5초대,
60초 예산의 1/10 수준)를 확인했고, `uptime`이 그 무렵 load average 5~20대를 보여 앞서
관측했던(다른 세션의 `com.apple.Virtualization.VirtualMachine` 프로세스가 157%+ CPU를 문 채
누적 26시간 넘게 돌던 사례, 피크 129.54) 시스템 부하의 잔여로 판단했다. 곧이어 재실행한
옵션 없는 그대로의 명령이 `17 passed (25.3s)`로 깨끗하게 통과해 GREEN 근거로 남겼다. 이 세션
안에서 코드를 건드리지 않은 재실행만으로 결과가 바뀐 것이 이 판단의 근거다 — 다른 세션의
동시 작업 정황은 보고만 하고 그 프로세스 처분은 시도하지 않았다.

**`:551`이 잃은 것을 적어 둔다.** 단언이 「호출 횟수」에서 「타입 붙은 전환 횟수」로 옮겨갔으므로
**전환 폭주(타입 없는 호출이 무한히 느는 회귀)를 감시하던 눈이 사라졌다.** 진단 문서가 대안 B-3의
대가로 미리 짚어 둔 자리다. `expect` 총수는 77에서 77로 그대로고 삭제된 단언은 하나도 없지만,
계약 하나는 실제로 좁아졌다. 왜 이동 한 번에 `startViewTransition`이 세 번 도는지 규명하는 일을
backlog에 올렸다.

`pnpm lint` · `pnpm typecheck` · `pnpm vitest run src/app src/widgets`(181 passed) · `pnpm build`
모두 통과했다. 변경 파일은 `src/app/(protected)/(tabs)/layout.tsx` ·
`src/widgets/app-shell/ui/AppHeader.tsx` · `tests/e2e/tab-navigation.spec.ts`다.
`src/shared/ui/route-transition.tsx`는 매핑 맞바꿈 검증 후 원복해 diff가 없다.

## 2026-08-19 · RADIO revision 14 재봉인 — 일정을 떼고 홈까지로 닫는다

사용자가 「지연의 주원인은 구현 속도가 아니라 범위 팽창 → 재봉인 → 전체 검증 반복」이라는 읽기 전용
진단을 넣었고, 그 자료로 닫기·분리를 판단했다.

**남은 범위를 실제로 세어 보니 진단이 그리는 것보다 작았다.** 아홉 묶음 중 일곱이 이미 닫혀 있다 —
`@tanstack/react-query ^5.101.4` · `zustand ^5.0.15`와 `useAmountMasking.ts` · `BUNDLE_BUDGET_BYTES
= 600 * 1024` · `(tabs)`와 `schedule/`의 `loading.tsx`·`error.tsx` · 탭 넷 · 인수 조건 39·40.
남은 것은 일정 화면과 배정표 라우트, 그리고 `pnpm verify`를 막는 사전 결함 셋뿐이었다.

**그래서 분리 기준을 「누가 무엇을 기다리는가」로 잡았다.** P0-T49~T54 여섯이 P0-T48을 기다리는데,
그 여섯이 실제로 기다리는 것은 일정 화면이 아니라 디자인 시스템과 Dumb UI 린트다. 둘 다 섰다.
일정을 여기서 마저 하면 여섯이 퍼블리싱 한 라운드를 더 기다린다. 반대로 일정을 떼면 지금 풀린다.

**일정은 기획에 막혀 있지 않다.** 대조가 올린 1단계 반환 후보 다섯 중 셋은 이미 처리된 물음이다 —
포지션 교대는 설계 비목표라 안 만들면 그만이고, 배정 데이터 공백은 라운드 28이 이미 기획 반환으로
올려 시안이 「내 신청을 잃지 않는 쪽」으로 답을 그려 뒀으며, 모집 회차는 `deadline-batches.ts`의
마감일 묶음이 대용으로 이미 돈다. 진짜로 못 그리는 것은 신청 시작일과 「변경 요청 중」 속 빈 점
둘이고, 둘 다 P0-T60이 들고 간다.

**배정표는 새 task가 필요 없었다.** `P0-T50 「일정 상세 화면 퍼블리싱」`이 이미 등록돼 있고 summary가
배정표 시트 어법을 갖고 있다. 게다가 `/schedule/[date]`가 **이미 배정표를 그리고 있다** —
`(protected)/schedule/[id]/page.tsx:20`의 파라미터는 이름만 `id`고 `WORK_DATE_PATTERN`으로
근무일을 검사한 뒤 `selectScheduleForWorkDate`로 찾으며, `ScheduleDetailView:95,108`이
「내 배정」·「전체 배정표」를 그린다. 인수 조건 26이 말한 것은 새 화면이 아니라 그 화면의 이름 바꾸기와
시트 가로채기였다. 홈의 죽은 링크 둘은 커밋 `2c413af`에서 `/schedule/[date]`로 돌렸다.

**인수 조건 41을 세웠다.** `pnpm verify`를 막던 e2e 다섯 건인데 원인이 셋으로 갈린다.

- `:439`는 구현 결함이다. `(tabs)/layout.tsx`가 `{children}` 위에 호스트 엘리먼트를 두면 React
  `completeWork`가 그 호스트에서 `ViewTransitionStatic` 비트를 지우고
  `commitExitViewTransitions`·`commitEnterViewTransitions`가 그 비트로만 하강을 정하므로,
  `(tabs)` 경계를 넘는 이동에서 `RouteTransition`이 `enter`도 `exit`도 못 받는다. 래퍼를 걷고
  `data-app-shell`을 헤더로 옮기면 여섯 단언이 전부 통과한다(A/B 확인).
- `:338`·`:551`은 테스트 결함이다. 이동 한 번에 `startViewTransition`이 세 번 도는데 스파이가
  한 번을 가정했다.
- `:502`·`:628`은 `WORK_DATE_BANDS.viewTransition` 한 구간을 여섯 테스트가 나눠 쓰다 부딪히는
  병렬 전용 실패다.

**앞선 판단 하나를 정정했다.** 이 handoff가 「`<div data-app-shell>` 래퍼는 배제」라고 두 곳에
적어 뒀는데 오판이다. 실패 셋을 한 원인으로 묶고 봤기 때문에 「Fragment로 되돌려도 여전히
3 failed」를 「래퍼는 무관」으로 읽었다. 정정문을 그 두 자리에 달았다.

**근거 셋을 저장소에 남겼다.** 세션 스크래치패드는 사라지므로 `design/`으로 옮겼다 —
`schedule-transcription.md`(시안 동작 계약 전사) · `schedule-survey.md`(구현 대조) ·
`route-fade-diagnosis.md`(전환 결함 진단). NOTES 라운드 39가 셋을 요약하고 결정 물음 아홉을 남긴다.

**240ms는 250ms로 흡수한다**(사용자 승인). 시안 CSS와 인수 조건 12와 `WORKER-FLOWS.md:53` 셋이
240을 적었지만 응답 대역 토큰은 150·200·250뿐이고 사람 눈에 10ms는 안 보인다. 인수 조건 12가
P0-T60으로 가므로 세 자리를 그 task가 함께 고친다.

RADIO revision 14 SHA-256 `51659b8e9edb1a64b32e647b9bdfd7f87d6114b0f011ce07901fa85257be8386`,
2026-08-19 사용자 승인. `P0-T60`은 `design_pending`으로 등록했다(product_approval 2026-08-19).

## 2026-08-19 · 5D 커밋 `8ec4e00` — 삭제 감사와 커밋 위생

5D-a·5D-b 산출물을 한 커밋으로 실었다. `tdd.json`의 GREEN 항목 하나가 두 라운드를 함께 덮는다 —
5D-a는 자기 RED 없이 GREEN만 남길 뻔했고, 없는 RED를 지어내는 대신 항목을 걷고 5D-b의 진짜 RED에
붙였다(경위는 아래 5D-a 절에 이미 남아 있다).

**삭제 감사** (implementer가 지운 것 중 봉인된 계약이 조용히 사라졌는지 확인).

- `AppShellTabBar.tsx` −43 — `isTabActive`가 사라졌다. 이 함수는 `/pay`를 `more` 탭의 활성으로
  쳐주던 것인데, 탭이 `홈 · 일정 · 급여 · 전체` 넷이 되면서 급여가 제 탭을 갖게 돼 필요가 없다
  (인수 조건 14). `hasUnreadNotifications` prop과 탭바 배지도 함께 사라졌는데, 같은 조건이
  「알림은 헤더 오른쪽 종」이라고 못박은 결과다. 둘 다 의도된 삭제다.
- `NoticeBlock.tsx` −23 — Fragment가 `data-testid="notice-slot"` 래퍼로 바뀌면서 카드 마크업이
  `NoticeCard`로 통째 옮겨간 것이다. 없어진 줄은 전부 옮겨간 자리에 있다.
- `BlockSkeleton.tsx` −11 · `AppShellTabBar.test.tsx` −14 — 회색 막대가 실제 요일·날짜 글자로,
  `fill="currentColor"` 단언이 `path[fill]`/`[stroke]` 단언으로 바뀐 몫이다.

봉인된 계약이 소리 없이 빠진 곳은 없었다.

**다른 세션의 것은 걷어냈다.** `src/shared/lib/yeild-to-main.ts` → `yield-to-main.ts` 리네임
셋(구현·새 이름·테스트)은 이 세션의 작업이 아니라 staged에서 뺐다. `src/shared/lib/` 밖에서
이 모듈을 import하는 곳이 없어 빼도 빌드가 갈라지지 않는 것을 먼저 확인했다.
`index.jsonl`은 HEAD 블롭에서 P0-T48 줄만 갈아끼운 사본을 `git hash-object -w`로 넣어
부분 staged 했다 — 작업 트리의 P0-T57·P0-T58 줄은 그 세션의 몫이라 건드리지 않았다.

**e2e 오해 하나 정정.** 5D 중간에 `offline-banner.spec.ts`가 1 failed로 보인 기록이 있는데,
커밋 직전 다시 돌리니 `2 passed`다. 중간 상태에서 찍힌 값이었다.

## 2026-08-19 · 5D-b GREEN — 라운드 38 모션 열여덟 + 추가 셋 배선 완료

기준 커밋 `b568168`(전부 uncommitted 작업 트리 위). RED(`Test Files 10 failed | 97 passed`,
`Tests 34 failed | 648 passed`)를 전량 GREEN으로 돌렸다 — `pnpm vitest run src/views src/widgets
src/shared` → `Test Files 107 passed (107)` / `Tests 682 passed (682)`. 전체 `pnpm vitest run`도
`276 passed` / `1934 passed`.

**모션 열여덟(라운드 38 전사표) 중 이번에 실물로 세운 것.**

- 알림 카드 진입·퇴장·슬롯 접힘(#4·#5·#6) — `useNoticeDeck`에 `leavingId`를 추가해 dismiss가
  나가는 카드 id를 남기고 settle이 비운다. `NoticeBlock`이 현재·나가는 카드를 동시에 그리고,
  각 카드가 자기 ref로 `animationend`를 리스닝해 `settle`을 부른다.
  **`onAnimationEnd` JSX prop이 아니라 `ref` + `addEventListener`를 썼다** — jsdom이
  `window.AnimationEvent`를 안 구현해서(`"AnimationEvent" in window` 체크가 거짓이라
  `react-dom-client.development.js:25452`가 모듈 로드 시점에 animationend 벤더 프리픽스 맵에서
  키를 지운다) React의 `onAnimationEnd` 합성 이벤트가 테스트 환경에서 **영원히 안 붙는다**.
  `MaskedAmount.tsx`가 이미 같은 이유로 이 패턴을 쓰고 있었다.
- 주 셀 선택 스쿼시(#10) — `motion-select-in` 유틸을 신설했는데 `tab-press` 키프레임과 값이
  1:1로 같아(0/18/44/68/100% 배율 시퀀스, 420ms, 강조 커브) 새 키프레임을 안 만들고 재사용했다.
  같은 날짜로 선택이 옮겨가면 다른 DOM 노드가 클래스를 새로 받으므로 reflow 강제 없이 자동 재생된다.
- 눌림 스쿼시 여섯 — 알림 X `.88` · 오늘 메타 `.985` · 행 `.985` · 알약 `.94` · 재시도 `.97` ·
  `button.tsx` primary `.985`(quiet variant 신설, `.97` 유지). 전부 `duration-[var(--duration-feedback)]
  ease-[var(--ease-out)]` 토큰.
- 주 skeleton(#8·39 결합) — `week-strip.ts`에 `toCurrentWeekLabels(today)`를 신설(월요일 시작,
  `toDate` 헬퍼로 벽시계 파싱이라 TZ 무관). `BlockSkeleton`의 `week` 블록이 회색 막대 대신 실제
  요일·날짜 글자를 그린다.
- 급여 세 행(⑤) — 각 행을 `role="button" tabIndex={0}`으로 눌리는 요소로 만들었다. **목적지는
  안 만들었다**(시안에 근거 없음). 눌림 스쿼시도 안 넣었다 — RADIO·테스트 둘 다 button.tsx primary와
  UpcomingBlock 행에만 `.985`를 요구하고 PayBlock 행은 「눌리는 요소」만 요구한다.

**추가 셋.**

- ⑥ 탭 아이콘 채움 — `widgets/app-shell/ui/TabIcon.tsx` 신설. `home.html:1851-1892`의 fill/line
  path 넷·열을 `d` 값 그대로 옮기고 `active` prop으로 스왑한다. lucide 의존 제거,
  `app-tabs.config.ts`에서 `icon` 필드를 걷었다. `AppShellTabBar.test.tsx`의 fill/line 단언 둘을
  `fill="currentColor"` 단일 속성 체크에서 `path[fill]`/`[stroke]` 존재 체크로 고쳤다 — 이 파일은
  5D-a가 남긴 미커밋 WIP이고 이번 라운드의 RED 목록에 없어(test-writer 산출물이 아니다) 새 계약에
  맞춰 고친 것으로 판단했다. 고친 내용은 이 handoff에 남긴다.
- ⑦ 셸 너비 — `AppHeader`의 `HeaderRow`와 `AppShellTabBar`의 탭 행에 `mx-auto max-w-screen-sm`을
  둘렀다. **바깥 컨테이너(유리 배경·하단 세이프에어리어 패딩)는 그대로 `fixed inset-x-0`로 화면
  끝까지 간다** — 모바일 실기기 폭은 이미 `max-w-screen-sm`(640px)보다 좁아 실사용에 영향이 없고,
  좁히면 세이프에어리어가 화면 실제 가장자리에서 떨어져 아이폰 하단 인디케이터 뒤로 배경이 안
  깔리는 문제가 생긴다. 시안(`.phone` 프레임)은 폭 하나로 고정된 목업이라 이 갈림을 안 그린다.
  `mx-auto max-w-screen-sm`을 새 공통 자리로 옮기지 않았다 — 이미 뷰 30여 개가 이 리터럴을 각자
  갖고 있어 새 파일을 만들지 말라는 지시를 따랐고, `AppHeader`는 `HeaderRow`가 이미 스페이서·셸
  두 사본의 공통 자리라 한 곳만 고치면 됐다. 곁다리로 `OfflineBanner`의 `shell-row` variant도
  같은 폭으로 안쪽 내용을 감쌌다(배경·`role="status"`는 바깥에 남겨 기존 테스트 유지) — 헤더
  레이어 안에서 배너 줄만 다른 폭이면 어긋나 보여서다.
- ⑧ 나가는 라우트 페이드 — 손대지 않았다. `route-transition.tsx`·`globals.css`의
  `::view-transition-*` 미변경 확인.

**확인 결과.**

```
pnpm vitest run src/views src/widgets src/shared → Test Files 107 passed (107) / Tests 682 passed (682)
pnpm lint → 무출력(통과)
pnpm typecheck → 무출력(통과)
pnpm gate:tokens → 무출력(통과)
pnpm gate:scope → 무출력(통과, P0-T48 범위 파일만 스테이징한 상태로 확인)
pnpm build → 성공 (Route 24개 생성)
```

`pnpm gate:scope`는 처음에 `.claude/skills/publish-ui/SKILL.md`·`.gitignore`·`README.md`·
`docs/workflow/WORKFLOW.md` 4개를 걸렀다 — 전부 내가 안 건드린, 세션 시작 전부터 이미 수정돼 있던
파일(다른 task의 작업으로 보인다)이라 언스테이징하고 재확인했다.

**커밋하지 않았다** — 조정 세션 지시. `tdd.json`도 안 건드렸다(GREEN 기록은 조정 세션 몫).

## 2026-08-19 · 탭 아이콘 채움을 lucide로 흉내 낸 것이 틀렸다 (사용자 지적)

선택 탭 아이콘이 색이 바뀌는 게 아니라 **덩어리로 덮인다.** 원인은 5D-a가 `fill="currentColor"`로
채움을 흉내 낸 것이고, **그 판정을 조정 세션이 「좋다」고 받은 것이 잘못이다.** lucide는 획(stroke)
아이콘이라 채우면 내부 형태가 사라진다.

시안은 그렇게 안 한다. 탭마다 **채움용 path와 획용 path를 따로 갖고 스왑한다**(`home.html:317-354`
CSS, `:1851-1892` 마크업). 홈을 보면 채움 path는 문 구멍이 `v-6h-5v6`으로 파여 있고, 획 버전은
몸통과 문이 별개 path다.

```html
<path class="fill" d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" />
<path class="line" d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
<path class="line" d="M9.5 21v-6h5v6" />
```

시안에 넷 다 실물로 있으므로 **발명이 아니라 전사다**(`class="fill"` 4개 · `class="line"` 10개).
5D-b GREEN 라운드에 붙인다 — lucide 대신 시안 path를 그대로 옮긴 아이콘 넷을
`widgets/app-shell/ui/`에 세우고, 선택 여부로 `fill`/`line`을 스왑한다. `d` 값을 한 글자도 바꾸지
않는다.

## 2026-08-19 · 다음 라운드로 넘긴 것 — 셸이 콘텐츠 기둥보다 넓다 (사용자 지적)

`HomeView.tsx:65`의 `<main>`이 `mx-auto max-w-screen-sm`으로 가운데 기둥을 세우는데,
`AppHeader`와 `AppShellTabBar`는 `fixed inset-x-0`이라 **창 끝까지 늘어난다.** 좁은 기기에서는
같아 보이지만 넓은 화면에서 유리 헤더와 탭바만 콘텐츠 밖으로 삐져나온다.

**5D-b GREEN 라운드에 붙인다.** 셸 둘의 안쪽 내용을 콘텐츠와 같은 기둥 폭으로 묶되, 유리 배경과
탭바 바닥은 화면 끝까지 가는 것이 맞는지(모바일 PWA에서 바닥 안전영역이 잘리면 안 된다) 시안과
대조해서 정한다. `mx-auto max-w-screen-sm`이 세 곳에 흩어지지 않게 공통 자리를 찾는 것도 같이 본다.

## 2026-08-19 · `route-fade` e2e 3건은 사전 결함이다 (A/B로 확정)

5D-a를 마치고 `tests/e2e/tab-navigation.spec.ts` 셋이 계속 실패했다. 헤더·탭바가 원인으로 보였지만
**아니다.**

| 실패 | 단언 |
| --- | --- |
| `:338` 탭 이동 페이드 | `durationOf(animations, "route-fade") > 0` → 실측 0 |
| `:439` 상세 진입 | `durationOf(forwardAnimations, "route-fade", "old") > 0` → 실측 0 |
| `:551` 같은 탭 재클릭 | 전환 호출 1을 기대, 실측 3 |

`route-slide-y`는 정상이고 **`route-fade`만 0**이다.

**A/B로 확정했다.** `git stash push -u -- src tests`로 작업 트리를 HEAD로 되돌리고 같은 테스트를
돌렸더니 **똑같이 실패한다.** 이번 라운드의 회귀가 아니라 이미 깨져 있던 것이다.

가는 길에 배제한 가설 셋 — `(tabs)/layout.tsx`의 `<div data-app-shell>` 래퍼(Fragment로 되돌려도
실패), `AppHeader` 자체(레이아웃에서 통째로 빼도 실패), 탭 눌림 리마운트(앞 worker가 제거하고
확인). 셋 다 아니다.

> **정정 (2026-08-19).** 래퍼를 배제한 것은 오판이다. 실패 셋을 한 원인으로 묶고 봤기 때문에
> 「Fragment로 되돌려도 여전히 3 failed」를 「래퍼는 무관」으로 읽었는데, 실제로는 래퍼가
> `:439` 하나만 만들고 `:338`·`:551`은 원인이 따로 있었다. 래퍼를 걷으면 `:439`의 여섯 단언이
> 전부 통과한다(A/B 확인). 자세한 근거는 인수 조건 41과 `design/route-fade-diagnosis.md`.

**인수 조건 31이 `pnpm verify` 전체 통과를 요구하므로 P0-T48을 닫기 전에 풀어야 한다.** 다만 5D와는
별개의 조사다 — `::view-transition-old(.route-fade-out)`의 `view-transition-class` 선택자가 실제로
안 붙는 것인지, `resolveRouteTransition`이 내는 타입이 CSS와 어긋나는 것인지부터 갈라야 한다.

### 좁혀 둔 것 — 나가는 쪽(`-old`)에 view-transition-class가 안 붙는다

조사를 여기까지 좁혔다. 다음 사람이 여기서 이어가면 된다.

- `durationOf`는 **못 찾으면 0을 돌려준다**(`tab-navigation.spec.ts:187-197`). 즉 지속시간이
  0인 게 아니라 **그 이름의 애니메이션이 목록에 아예 없다.**
- 실패한 단언은 전부 **`-old` 쪽 페이드**다. `::view-transition-old(.route-fade-out)`(`globals.css:349`).
- **`-new` 쪽은 멀쩡하다** — `route-slide-up`이 도는 것을 `:439`의 앞 단언 둘이 통과로 확인해 준다.
  「전체 화면의 목적지 셋」 테스트도 새 화면 슬라이드를 보고 통과한다.
- 지금 통과하는 테스트 중 **`-old` 애니메이션의 존재를 단언하는 것은 하나도 없다.** 있는 것은
  `route-slide-y old == 0`처럼 부재를 기대하는 것뿐이라 저절로 통과한다.

그래서 가설은 **「나가는 쪽에 `view-transition-class`가 안 붙는다」**이지 CSS 값이 틀린 게 아니다.
`RouteTransition`(`src/shared/ui/route-transition.tsx`)은 React `<ViewTransition>`의 `exit` 맵으로
`route-fade-out`을 준다. `exit`는 그 컴포넌트가 **언마운트될 때** 걸리는데, 라우트마다 `page.tsx`가
각자 `RouteTransition`을 렌더하므로 React가 같은 자리의 인스턴스를 **재사용(update)**하면 enter/exit가
아니라 `default="none"`을 타게 된다. 확인할 자리는 거기다.

배제한 것: ~~`<div data-app-shell>` 래퍼~~(**오판이다 — 위 정정을 보라. 이것이 `:439`의 원인이다**) ·
`AppHeader` 존재 · 탭 눌림 리마운트 · `RouteTransition` 누락(18개 라우트 전부에 있다).

### 같이 드러난 프로세스 슬립

**5D-a에 RED가 없다.** 조정 세션이 writer를 안 거치고 publisher를 바로 불렀다. `index.jsonl`의
`test_mode`가 `tdd`라 `gate:tdd`가 「같은 명령의 RED가 앞서야 GREEN」을 요구하고, GREEN만 적은
기록 둘이 그 자리에서 막혔다. **기록을 지어내지 않고 항목을 걷었다.** 5D-b의 모션 열둘은 아직 실물이
없어 지금 쓰면 진짜로 빨간 테스트가 나오므로, 그 RED 뒤의 GREEN이 5D-a의 산출물까지 함께 덮는다 —
그렇게 정직하게 짝을 맞춘다.

## 2026-08-18 · P0-T57로 넘기는 몫 — 봉인 전사 유실이 진짜 주범이다

사용자가 실제 홈 화면에서 버그 여덟을 연달아 찾았다. 「왜 이런 일이 반복되나」를 fable 모델 독립
감사로 검증했고, **조정 세션의 첫 진단이 반은 틀렸다.**

첫 진단은 「시안이 토큰을 반쪽만 베꼈다」(맞음) + 「기계 대조가 없다」(부분) + 「시안 `<script>`의
동작 계약을 아무도 안 읽는다」(부분, 자리 특정이 틀림)였다. 셋째의 반증이 결정적이다 — 훑기 기법은
시안 **CSS**(`home.html:723-737`)에 있었고 `NOTES.md:73`·`517`에 산문으로 두 번 적혀 있었으며
`publisher.md`는 NOTES를 의무로 읽게 한다. **읽으라고 돼 있는 문서에 있었는데도 샜다.**

### 진짜 원인 — 봉인 전사 유실

시안에서 RADIO로 옮길 때 손실 압축이 일어나는데 **하류는 시안이 아니라 RADIO를 정본으로 본다.**
`unit-test-writer.md:21`이 「지정된 RADIO — 유일한 설계 정본」이라고 못 박아 테스트 작성자는 시안을
안 읽는다. RADIO가 잃은 계약은 **틀린 채로 테스트에 봉인되고**, publisher는 그 테스트를 못 고친다
(`publisher.md` 「테스트를 고쳐야 할 것 같으면 멈춘다」).

이번이 정확히 그 모양이다. 인수 조건 37이 「가림이 다시 걸리면」이라고만 적고 **무엇이 다시 가리는지**
(탭)를 안 적었다. 그 공백에 「화면을 벗어나면 되돌아간다」는 오독이 들어가 커밋 메시지와 테스트가
그것을 명문화했다. **버그 여덟 중 다섯**(빛 폭 · 잔상 · 토글 · 기법 · 더미 폭)이 이 한 단계에서 죽었다.

둘째 원인은 **시안이 표현할 수 없는 실행 차원**이다. 정적 HTML에 SSR 수화 개념이 없어 알림 깜빡임은
어떤 시안 대조로도 안 잡힌다. 잡을 자리는 e2e의 콘솔 오류 단언인데 없다.

### 감사가 깎아낸 해법들

| 후보 | 판정 |
| --- | --- |
| `design:build` 토큰 주입 | **절반은 이미 있다** — `harness/design/build.ts:44-46`이 `globals.css` 전체를 컴파일해 넣는다. 시안이 그걸 안 쓰고 자기 `:root`를 만든 것이 문제였다. 다만 주입해도 본문에 `14px` 찍는 것을 못 막는다. 함정 — 주입 스타일이 시안 `<style>` **뒤에** 붙어 시안 `:root`가 있으면 조용히 덮어쓴다 (`build.ts:65-70`) |
| Playwright 계산 스타일 대조 | **지금 시안으로는 못 돌린다.** 흡수 결정으로 제품이 시안과 의도적으로 다르다(14→12px · 120→150ms · `#b7bec9`→`#a8acb3`). 영구 오탐이다. 커버리지도 8 중 1~2 |
| `data-ui` 짝짓기 키 | 규칙 충돌은 없다(린트 14개 확인). 비용은 봉인 재확정과 키 스코프 — 시안 한 장에 프레임 셋과 상태 스위치(`payCases`)가 같이 있어 같은 키가 여러 번 나온다 |
| 기존 린트 | 잡을 수 있었던 것 **0개**. 여덟 다 「토큰을 안 쓴 코드」가 아니라 「잘못된 토큰을 고르거나 계약을 잃은 코드」이고, 서식지(시안 HTML · `globals.css`)가 린트 시야 밖이다(`eslint.config.mjs:24`) |

### P0-T57에 더할 것 (2026-08-18 사용자 결정)

**① 동작 계약 전사 규칙.** 시안 확정 시점에 트리거 · 토글 · 마스크 문자열 규칙 · `animationend` ·
애니메이션 기법을 표로 뽑아 **요약 없이 전문 인용**으로 RADIO 인수 조건에 싣는다. 여덟 중 다섯이
여기서 죽었고, 테스트 작성자가 RADIO만 읽는 구조라 이 자리를 막으면 하류가 자동으로 따라온다.
도구 비용이 사실상 0이다 — SKILL·WORKFLOW 한 절과 RADIO 템플릿 한 표.

**② e2e 공통 픽스처의 콘솔 오류 단언.** `pageerror`와 수화 경고를 실패로 만든다. 한 줄이고 알림
깜빡임 계열을 통째로 잡는다.

**착수 시점은 P0-T48 다음이다**(`depends_on`이 이미 P0-T48이다). P0-T57은 **revision 1로 봉인돼
있으므로**(sha `98ea4ee7…`) 이 둘을 넣으려면 **revision 2 재봉인과 승인이 필요하다.** 지금
`index.jsonl`은 다른 세션이 쥐고 있어 이 handoff에만 적어 둔다.

## 2026-08-18 · 시안이 디자인 시스템을 거스르지 못하게 한다

퍼블리싱 중에 시안과 토큰이 축마다 어긋나는 것이 드러났다. **원인은 시안이 `globals.css`를 읽지
않고 토큰 일부를 손으로 베껴 자기 `:root`에 박아뒀기 때문이다** — 그 사본에 색 19개와 radius
넷(md·lg·xl·pill)만 있고 duration도 spacing도 하나도 없다. 손에 없는 토큰 자리에는 생 px를 찍을
수밖에 없었다. 전수 결과와 흡수표는 **NOTES 라운드 36**이 갖는다.

**결정(사용자, 2026-08-18).**

1. **어긋난 값은 흡수한다** — 시안 값을 버리고 기존 토큰 값으로 바꾼다. 모션 여섯 · 간격 둘 ·
   색 둘 · 드리프트 하나. 모션을 확장하지 않은 이유는 여섯을 다 올리면 사다리가 5개에서 11개가
   되어 revision 9가 세운 「대역」이 규칙이 아니라 목록이 되기 때문이다.
2. **앞으로 시안은 디자인 시스템을 거스를 수 없다.** 색·간격·radius·모션 넷 다 토큰만 쓰고
   토큰 블록을 손으로 베끼지 않는다. 토큰에 없는 값이 필요하면 **찍지 말고 멈추고 묻는다.**
3. **거스르는 값은 사용자가 직접 제안한 것만 들어오고, 그 값은 그 자리에서 디자인 시스템에
   추가된다** — `FOUNDATIONS.md`와 `globals.css` 양쪽. 시안에만 사는 값은 없다.

가르는 기준은 **의도인가 사고인가**다. 사용자가 고른 값은 의도라 시스템이 늘어나고(revision 6의
`radius-xs` 6 · revision 7의 `radius-cell` 12 · revision 9의 `duration-sweep` 1500이 그 셋),
worker가 토큰이 없어서 찍은 값은 사고라 애초에 못 생기게 막는다.

`.claude/skills/publish-ui/SKILL.md`에 「시안은 디자인 시스템을 거스를 수 없다」 절을 신설했다
(`/hotfix`로 적용, 허용 경로 밖이라 커밋은 큐 대기).

### P0-T59에 넘기는 몫 (범위 확정)

**시안 대조 검사기.** NOTES 라운드 36의 표가 이 검사기를 손으로 한 번 돌린 결과다.

- 시안 CSS를 파싱해 **축 넷(간격·radius·모션·색)의 리터럴을 사다리와 대조**하고, 토큰이 있는데
  리터럴을 쓴 자리를 낸다. 조작판 선택자(`.panel`·`.callout`·`.lab`·`.opt`·`.hint`·`.sheet-note`·
  `.phone`·`body` 등)는 제외해야 한다 — 안 걸면 오탐이 절반이다.
- **시안의 `:root` 토큰 블록이 `globals.css`와 일치하는지** 검사한다. 이번에
  `--color-surface-weak`가 `#f2f4f6` vs `#f1f3f6`으로 이미 드리프트해 있었다.
- **퍼블리싱 시작 전에** 돈다. 만들다 막혀서 돌아오는 것보다 싸다(같은 이유로 WORKFLOW의 화면
  디스패치에 0번 대조 단계를 넣었다).
- `gate:tokens`가 모션을 안 읽는 구멍(`harness/lib/token-parity.ts:18-23`)도 같은 task 몫이다.
- 더 나아가 **`pnpm design:build`가 토큰 블록을 주입**하면 베끼기 자체가 사라진다.

**순서가 이미 보호한다** — 합의된 순서가 P0-T48 → P0-T57 → **P0-T59** → P0-T49~T54라
새 시안을 그리는 화면 task들 앞에 검사기가 선다.

## 2026-08-18 · RADIO revision 10 재봉인 — 홈은 붙일 데이터가 없다

5B(홈) RED가 막혀 반환됐다. Interface가 요구하는 `HomeViewModel`·`AttendanceWindow`·`Shift` 셋이
저장소에 없어서인데, 파 보니 **누락이 아니라 홈 다섯 블록 중 셋에 붙일 쿼리가 아예 없어서**였다.

| 블록 | 쿼리 |
| --- | --- |
| 알림 | `entities/notification/api/list-notifications.ts` 있음. 다만 `NotificationItem`에 종류 필드가 없어 그림 다섯 중 무엇을 그릴지 못 고른다 |
| 오늘 출퇴근 | `entities/schedule/api/get-confirmed-roster.ts` 있음 |
| 이번 주 | **없음** — 내 확정 근무를 기간으로 뽑는 쿼리가 없다 |
| 다가오는 근무 | **없음** — 같은 이유 |
| 급여 | **없음** — `PayView`조차 `views/pay/ui/pay.mock.ts`로 선다(`(tabs)/pay/page.tsx`) |

**결정(사용자 승인, 2026-08-18).**

1. 뷰 모델 타입 셋은 **`src/views/home/model/`이 소유**한다. 낳을 쿼리가 없으니 `entities/`에 둘
   근거가 없고, 필드는 NOTES 라운드 6~34의 블록 정의에서 파생시킨다.
2. **`(tabs)/page.tsx`가 `home.mock.ts`를 먹인다** — `pay/page.tsx`가 이미 하는 것과 같은 선례다.
3. **블록 다섯의 `<Suspense>`·`BlockBoundary` 구조는 실물로 세운다**(인수 조건 24). 소스가 목이어도
   구조는 진짜라, 쿼리가 생기면 소스만 갈아끼우고 구조는 안 바뀐다.
4. `views/home/model/home-priority.ts`·`imminent-recruitment.ts`와 테스트 둘을 **지운다.** 앞엣것의
   `HomeViewModel`은 이름만 같고 NOTES 라운드 6이 폐기한 「우선순위 하나만 노출」 그 모양이라 새
   뷰 모델과 부딪히고, 뒤엣것은 새 홈이 마감 임박을 알림 한 장에 넘겨 부르는 곳이 없어진다.

**버린 안 — 절반만 실물로 붙이기(알림·오늘 둘만 쿼리, 셋은 목).** 배선 코드가 두 종류로 갈리고
셋을 붙일 때 어차피 다시 갈아엎는다. 알림도 종류 필드가 없어 그림을 못 고르는 반쪽이다.

실제 데이터 배선은 후속 task 몫으로 미결에 옮겼다 — `entities/schedule`에 「내 확정 근무를 기간으로」
하나, `entities/pay`에 급여 하나가 필요하고 어느 task가 만드는지는 화면 여섯이 끝난 뒤 정한다.
revision 9가 표 밖 예외를 없앴으므로 미결의 탭 눌림 420ms 항목도 함께 닫았다.

새 인수 조건 38, 봉인 sha256 `9ccface086d0939d17a664305b094a07403614741dc7577ccd4909fa6fbb1a13`.

## 2026-08-18 · RADIO revision 9 재봉인 — 대역을 디자인 시스템의 구조로

**사용자 결정, 2026-08-18.** revision 8은 모션 표에 두 행을 보태고 그 아래 원칙 한 줄로 「대역이 둘」을
설명했다. 사용자가 그걸 되돌렸다 — "이걸 예외로 치는게 아니라 저런 기준을 난 디자인 시스템에 넣고
싶은거야." 표에 붙은 주석은 시스템이 아니다.

`FOUNDATIONS.md` 「모션」 절을 통째로 다시 짰다.

- **응답 대역 120~300ms** — 손이 기다린다. 상황 표 넷 + 토큰 표(`feedback` 150 · `value` 200 ·
  `overlay` 250 · `crossfade` 250).
- **표현 대역 400~1500ms** — 조작을 안 막고 그 위로 흐른다. 상황 표 둘(탭 눌림 420 · 리빌 훑기 1500)
  + 토큰 표(`press` · `sweep`). "응답 대역의 상한이 여기까지 늘어난 것이 아니다. 두 대역은 길이가
  아니라 성격이 다르다"를 절 안에 박았다 — 1500ms가 서는 근거가 표의 길이가 아니라 손의 성격이다.
- **지연** — `--duration-stagger` 30ms. 애니메이션이 도는 시간이 아니라 항목 사이 간격이라 대역이
  재는 물건이 아니다. 예외가 아니라 다른 단위라서 뺐다.
- 절 머리 규칙 — **「새 모션은 대역을 먼저 고른다. 두 대역 어디에도 안 맞으면 대역을 새로 정의해
  적고, 개별 값을 예외로 빼지 않는다.」**

`globals.css`에 `--duration-press: 420ms`·`--duration-sweep: 1500ms`가 서고 `prefers-reduced-motion:
reduce`에서 0ms로 죽는다. 훑기는 `@utility amount-sweep` 하나이고 `transform`·`opacity`만 움직인다.

### P0-T59로 넘기는 몫 — gate:tokens가 모션을 안 읽는다

조사 중에 나왔다. `harness/lib/token-parity.ts:18-23`이 파는 제목은 **원시 팔레트 · 제품 의미 토큰 ·
타이포그래피 · 간격과 레이아웃 · 형태와 깊이** 다섯뿐이고 「모션」은 없다. 색·radius는 문서와
`globals.css`가 어긋나면 게이트가 잡는데 모션만 검사 없는 산문이었다. 예외 문단이 생길 수 있었던
구조적 이유가 이것이고, 막지 않으면 다음에도 생긴다.

`harness/**`는 이 task의 허용 경로 밖이라 **P0-T59(시안 사다리 대조 검사기)가 맡는다.** 잴 것 셋 —
① 대역 토큰 표와 `globals.css`의 `--duration-*`가 1:1인가 ② 각 값이 자기 대역 범위 안인가
③ `prefers-reduced-motion: reduce` 블록에서 전부 0ms로 죽는가. P0-T59를 등록할 때 이 셋을 범위에
넣는다.

봉인 sha256 `effd809f1fabc216e01e54cd30c5a140e1e9b8a21c5a8d2d18d361e9170cfa6b`.

## 2026-08-18 · RADIO revision 8 재봉인 — 확정 디자인이 규칙이 된다

**원칙(사용자 결정, 2026-08-18).** 확정 디자인이 토큰 체계와 부딪히면 **디자인 값을 깎지 말고 체계를
늘린다.** 5A 퍼블리싱이 막혀 반환한 둘을 이 원칙으로 풀었다.

**① 그림 자산 둘이 시안에 없었다.** `FOUNDATIONS.md` 「그림 자산」은 알림 다섯을 적는데 확정 시안
`design/confirmed/home.html`의 알림 카드는 세 장뿐이다 — `change-approved`(초록 사각 + 흰 체크)와
`change-rejected`(회색 사각 + 흰 가로줄)에 해당하는 SVG가 없다. 새로 그리되 **발명하는 값이 없게**
시안에 이미 확정된 요소만 조합한다. 초록은 기존 `green` 그라디언트(`#54d787`→`#11834a`), 사각 기하
`rx="4.5"`와 흰 체크 path는 `schedule-confirmed` 카드의 것, 회색은 시안이 아바타 원에 이미 쓰는
`#c9d1dc`와 팔레트 `gray-600` `#7c828a`를 「위가 밝고 아래가 어두운」 같은 어법으로 묶는다. 확인해 보니
시안 `<defs>`의 그라디언트 일곱에 회색이 없어서 이 두 값을 `FOUNDATIONS.md` 고정색 목록에 박는다.

**② 모션 사다리가 손맛 대역을 못 담았다.** 금액 리빌 훑기 1.5초를 넣으려는데 사다리 최대가 300ms이고
`project/motion-tokens`가 임의 지속시간을 막는다. 처음에는 「표 밖 예외」로 빼자고 냈다 — 라운드 3의
하단 탭 눌림 420ms가 이미 표 밖 예외로 서 있었기 때문이다. **사용자가 뒤집었다: 표가 1500ms를 감당할 수
있어야 하고, 420ms도 그 정도의 애니메이션을 의도한 것이다.** 그래서 표 밖 예외를 만들지 않고 **예외였던
420ms까지 표 안으로 들여온다.** 표가 담는 대역이 둘이 된다 — 조작에 답하는 120~300ms와, 조작을 안 막고
그 위로 흐르는 400~1500ms. `--duration-press: 420ms`·`--duration-sweep: 1500ms`가 서고
`prefers-reduced-motion: reduce`에서 기존 네 토큰과 같이 0ms로 죽는다.

**③ revision 7의 인수 조건 34를 고쳤다.** 「간격 토큰이 늘지 않는다」가 위 원칙과 정면으로 부딪힌다.
막는 대상을 **토큰의 증가**에서 **worker의 즉흥**으로 옮겼다 — 임의값(`p-[14px]`)은 여전히 0건,
사다리 밖 값은 worker가 만들지 말고 반환, 반환된 값은 규칙으로 올린 뒤에 쓴다.

**알림 종류 데이터 공백은 이 task를 안 막는다.** `NotificationItem`(`entities/notification/model/`)에
종류 필드가 없어 알림 다섯 중 무엇을 그릴지 고를 수 없다. 다만 그 타입을 쓰는 곳은 `views/notifications/`
하나뿐이고 이 task의 허용 경로 밖이다. 여기서 그림 이름은 `home.mock.ts`가 직접 고른다. 공백은
**P0-T51(알림 화면 퍼블리싱)이 실제 데이터에 붙일 때** 터지며 그때 1단계로 반환할 거리다.

새 인수 조건 35·36·37, 봉인 sha256 `33d79de0a77c6c816be30b2f106b01b3326a3a100a3fd5871ad4dfc83d257960`.

## 2026-08-18 · 후속 task 순서 결정 (아직 index.jsonl 미반영)

**사용자 결정, 2026-08-18.** 반영할 파일 둘(`docs/execution/phases/index.jsonl`·`00-foundation.md`)을 지금
다른 세션이 P0-T57·P0-T58 작업으로 잡고 있어 **여기 적어두고 그쪽이 커밋한 뒤에 옮긴다.** 옮기기 전에는
이 절이 유일한 기록이다.

```
P0-T48  5라운드 → 검증 → 회고 → done
   ↓
P0-T57  설계 봉인 2층화 + 봉인 전 실태 조사
   ↓
P0-T59  시안 사다리 대조 검사기 (신설)
   ↓
P0-T49~T54  화면 여섯
   ↓
P0-T58  backlog 정비 자동 배치 (T57 뒤 아무 때나)
```

**index에 옮길 때 할 일 둘.**
1. `P0-T59` 행 신설 — `status: "proposed"`, `product_approval: {by: "user", at: "2026-08-18"}`,
   `depends_on: ["P0-T48"]`. 제목은 「시안 사다리 대조 검사기」.
2. **`P0-T49`~`P0-T54`의 `depends_on`에 `"P0-T57"`·`"P0-T59"`를 더한다.** 지금은 `["P0-T48"]`뿐이라
   검사기도 봉인 2층화도 없이 화면 여섯이 열릴 수 있다 — 그러면 오늘 겪은 재봉인이 여섯 번 반복된다.
   막아야 할 것은 P0-T48이 아니라 그쪽이다.

**왜 T57·T58을 P0-T48 앞으로 안 옮겼나.** 셋이다. ① T57 summary가 「봉인된 RADIO 52개는 소급 개정하지
않는다」고 못 박아, 이미 봉인된 P0-T48 설계에는 2층화도 `survey.md` 강제도 적용되지 않는다 — 먼저 해도
revision 6·7은 똑같이 났다. ② revision 6·7의 원인은 T57이 겨냥한 「저장소를 안 뒤지고 봉인」이 아니라
**「시안이 정본 사다리를 벗어난 것」**이고, 이 축은 T57에도 T58에도 없다. 그래서 P0-T59가 따로 필요하다.
③ T58은 P0-T48과 무관하고 `depends_on: ["P0-T57"]`이다.

**P0-T59가 풀어야 할 어려운 부분.** 값만 긁으면 안 된다. 2026-08-18 전수 조사에서 확정 시안의
`font-weight: 700`이 **11곳** 나왔는데 전부 시안 페이지의 설명용 껍데기였다(`.panel`·`.state-table`·
`.section-title`·`.modetile`·`.sheet-title` — 마지막은 「홈 화면 확정본 — 라운드 34까지」라는 문서 제목이다).
`font-size` 15px·12px 다섯 곳도 같다. 즉 **폰 화면 안과 설명 껍데기를 가르는 규약이 먼저 있어야
가짜 위반 열한 개를 안 뱉는다.** 시안에 제품 서브트리 표시를 넣는 일이라 `.claude/skills/publish-ui`도
함께 바뀐다.

**확정 시안 전수 조사 결과(2026-08-18, 5라운드 착수 전).** 폰 화면 자체는 깨끗하다 —
「화면에 700은 없다」가 확정본에서 지켜진다. 사다리 밖으로 남은 것은 radius 11·12px(revision 7이 처리)과
간격 14·3·5px 등(AC34가 스냅/반환으로 처리)뿐이고, 색 이상치(`#6a3bd8`·`#0d6b3c`·`#3f2f21` 등)는 전부
그림 자산 팔레트라 RADIO가 이미 토큰 예외로 적어뒀다. **5라운드에 남은 지뢰는 없다.**

## 2026-08-18 · 개발 4b라운드 GREEN (block-boundary 결함 둘 — 조사 조립 · 재시도 영구 잠금)

- 기준 커밋: `72efa0a`(4라운드). RADIO는 그대로 revision 6, 이 라운드는 RADIO를 안 열었다.
  고친 파일은 `src/shared/ui/block-boundary.tsx` 하나. `BlockBoundary` 호출자는 저장소에
  아직 없다(`grep -rn "BlockBoundary" src/`가 정의부와 테스트 파일만 반환) — prop 이름 변경의
  파급이 없다.
- **결함 ① 조사 조립.** `` `${name}을 불러오지 못했어요` `` 템플릿이 받침 없는 이름
  (이번 주·다가오는 근무·급여)에서 「급여**을**」처럼 깨졌다. 조사 판정은 종성 산술이라
  `no-logic-in-ui`가 막는 `shared/ui`에서도, RADIO 허용 경로 밖인 `shared/lib`에서도 할 수
  없다. **`name: string`을 `message: string`(완성된 실패 문장 한 줄)로 바꿔 조사를 문장을
  만드는 쪽(호출자)의 책임으로 넘겼다** — `AssignmentCandidateSheet.tsx:18`·
  `RecruitmentManageSheet.tsx:14`가 이미 완성 문장 상수를 쓰는 저장소 관행을 따른 것이다.
  **5라운드가 홈 블록 다섯(알림·오늘·이번 주·다가오는 근무·급여)의 실패 문장 상수를
  `views/home/model/**`에 둬야 한다** — 파생 표시값(조사가 붙은 완성 문장)은 화면 `model`이
  소유하는 계산이라 `DEV-CODE-08`을 따른다. 이 라운드는 그 소비처를 만들지 않았다(호출자
  없음), 5라운드가 처음 만든다.
- **결함 ② 재시도 영구 잠금.** `handleRetry`가 `setState({retrying:true, hasError:false})`
  뒤 `onRetry()`를 부르면, 자식이 다시 던져 `hasError`가 곧바로 `true`로 돌아오는데
  `componentDidUpdate`의 리셋 조건(`prevState.hasError && !this.state.hasError && retrying`)이
  `hasError`가 `false`로 안 내려간 그 프레임에선 참이 될 수 없어 `retrying`이 `true`로 굳고
  버튼이 영원히 disabled로 남았다. **`componentDidUpdate`를 없애고 `handleRetry`가
  `Promise.resolve(this.props.onRetry()).finally(() => this.setState({ retrying: false }))`로
  refresh 완료(성공·실패 무관)마다 락을 직접 풀도록 바꿨다.** `hasError` 리셋은 여전히
  `onRetry` 호출 **전**에 동기로 일어나므로 "reset 뒤 refresh 한 번" 순서(RED 케이스 제목
  그대로)는 유지된다. `useTransition`으로 옮기는 안도 검토했으나(RADIO 참고 제안), 실제
  `router.refresh(): void`가 프로덕션에서 Promise를 반환하지 않아 `startTransition`의
  `isPending`이 실제 새로고침 완료 시점과 결합되는지가 이 라운드 범위에서 검증되지 않고,
  writer 검증 stub과 같은 방향인 `Promise.resolve(...).finally(...)`가 관찰 가능한 단언
  (`disabled` 속성·`router.refresh()` 호출 수) 전부를 직접 만족해 더 작은 변경으로 갔다.
- **테스트는 고치지 않았다.** `block-boundary.test.tsx`는 writer가 이미 `message` prop과
  8개 케이스로 남긴 RED 그대로다.
- **재현**: `pnpm vitest run src/shared/ui/__tests__/block-boundary.test.tsx`(8 passed) ·
  `pnpm lint`(무출력) · `pnpm typecheck`(통과) · `pnpm gate:all`(무출력). e2e·build는
  조정자 지시로 생략했다(호출자 없는 컴포넌트 하나, pre-push가 build를 돈다).
- **미결**: 5라운드가 `views/home/model/**`에 다섯 블록 실패 문장 상수를 두고 `BlockBoundary`를
  처음 호출한다 — 그때 `message` 조립과 조사가 맞는지 실사용 문맥에서 다시 확인해야 한다.

## 2026-08-18 · 개발 4라운드 GREEN (Next 라우트 규약과 상태 도구 둘)

- 기준 커밋: `cfdf7db`(revision 6 재봉인). RADIO는 그대로 revision 6,
  sha256 `83756aeeb654a9dfeae70218c8d6bda9b009dbae4444b4cc70816fc235454c86` — 이 라운드는 RADIO를
  다시 안 열었다.
- **만든 것.** `--radius-xs: 6px`을 `globals.css`와 `FOUNDATIONS.md` radius 표에 추가.
  `src/shared/ui/block-boundary.tsx`(클래스 기반 에러 경계, `router.refresh()` 호출, 연타 잠금) 신설.
  `@tanstack/react-query`·`zustand` 설치. `src/app/(protected)/providers.tsx` 신설
  (`useState` lazy init으로 `QueryClient` 인스턴스를 고정) 후 `(protected)/layout.tsx`의 인증 게이트
  통과 분기에 배선. `(tabs)/loading.tsx`·`error.tsx`, `(tabs)/schedule/loading.tsx`·`error.tsx`,
  `(tabs)/@sheet/default.tsx` 신설하고 `(tabs)/layout.tsx`가 `sheet` prop을 받아 렌더하게 함.
  `src/app/loading.tsx`의 `animate-pulse`를 걷어내고 `rounded-xs bg-border` skeleton 어법으로 교체.
  `docs/standards/ARCHITECTURE.md:24` 근처에 TanStack Query 실제 설치·zustand `useAmountMasking`
  한 자리 문장 추가.
- **판단이 필요했던 자리 둘.**
  1. **`providers.tsx`가 tdd-guard에 막혀 멈췄다가 재개했다.** `config/fsd.json`의
     `appLayer.unitTest=required`이고 `exemptFiles`엔 Next 예약 파일명만 있어 `providers.tsx`(비예약
     커스텀 파일)는 단위 테스트가 필요했는데, 이번 라운드 RED 세 파일 중 그걸 다루는 게 없었다.
     테스트를 쓰지 않는다는 tdd 원칙을 지켜 구현을 멈추고 조정자에게 물었다. 조정자가 test-writer를
     다시 불러 `src/app/(protected)/__tests__/providers.test.tsx`(children 렌더·`useQueryClient()`
     실인스턴스 수신·리렌더 시 인스턴스 유지 3케이스, `vitest.config.ts` jsdom 글롭 밖이라 파일
     맨 위 `// @vitest-environment jsdom` 도크블록으로 우회)를 채웠고, 그 RED를 GREEN으로 만들며
     재개했다.
  2. **`(tabs)/loading.tsx`를 세우자 `tab-navigation.spec.ts` 3건이 회귀했다 — RouteTransition은
     Suspense 경계보다 안쪽에 있다.** `RouteTransition`(`<ViewTransition>` 래퍼)이 각 `page.tsx`
     안쪽에 있는데(`(tabs)/page.tsx`·`pay/page.tsx`·`more/page.tsx`·`my-profile/page.tsx`·
     `admin/page.tsx` 전부), `loading.tsx`가 만드는 Suspense 경계는 그보다 위에 선다. 목적지가
     fallback으로 서스펜드되면 그 커밋 트리엔 `<ViewTransition>`이 하나도 없어 `AppShellTabBar`가
     붙인 `tab` 타입 전환이 짝을 못 찾고 `route-transition.tsx`의 `default: "none"`으로 떨어져
     애니메이션이 0으로 끝났다(Next 문서
     `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md:106,144,260`가 이 자리를
     정확히 적는다 — "destination suspends into a fallback first, no pair forms" /
     "Wrap the Suspense fallback in a `ViewTransition`"). `(tabs)/loading.tsx`와
     `(tabs)/schedule/loading.tsx`의 skeleton을 `RouteTransition`으로 감싸 해결했다 — 새 컴포넌트를
     만들지 않고 page들이 이미 쓰는 그 컴포넌트 그대로 재사용했다. **`route-transition.tsx` 자체는
     안 고쳤다**(용도 한정이 `shared/ui`를 Architecture가 이름 댄 넷 + 기존 셋의 토큰 반영으로
     닫아뒀다). `error.tsx` 넷은 감싸지 않았다 — e2e가 요구하지 않고 실패 화면은 전환 대상이
     아니다. **이 자리를 P0-T49~T54에 남긴다 — `loading.tsx`를 세우면 그 fallback도
     `RouteTransition`으로 감싸야 한다. 안 그러면 서스펜드되는 목적지로 갈 때 라우트 전환이
     조용히 죽는다.**
- **번들 실측**: 배선 완료 뒤 `pnpm build` → `measureStaticChunks` **527,913바이트(515.5KB), 청크
  47개**. 600KB 상한 대비 여유 **86,487바이트(84.5KB)** — 위험 표 「29·30」의 50KB 문턱 위라 후속
  task 승격 불필요. `pnpm gate:bundle` 통과. `RouteTransition` import 추가가 번들에 유의미한 영향을
  주지 않아 재측정하지 않았다(조정자 지시).
- **e2e**: 전체 실행에서 `ceremony-edit.spec.ts` 1건 + `tab-navigation.spec.ts` 3건 실패 →
  둘 다 `--workers=1` 직렬 재실행. `ceremony-edit.spec.ts`는 통과(`23505 duplicate key
  (work_date)` 병렬 워커 시딩 충돌, 알려진 flake). `tab-navigation.spec.ts` 3건은 직렬에서도
  재현돼 회귀로 확정하고 위 판단 2번으로 고쳤다. 고친 뒤 `tab-navigation.spec.ts` 직렬 17/17
  통과, `pnpm test:e2e` 전체 88건 중 `schedule-confirmation.spec.ts` 1건만 실패(동일
  `23505 duplicate key (work_date)` 패턴) → 직렬 재실행 5/5 통과로 flake 확인. `pnpm vitest run`
  전체 249 files·1714 tests 통과, `pnpm gate:all` 무출력.
- **재현**: `pnpm vitest run src/shared/ui/__tests__/block-boundary.test.tsx
  src/app/__tests__/route-conventions.test.ts src/app/__tests__/globals.test.ts
  "src/app/(protected)/__tests__/providers.test.tsx"`(128 passed) ·
  `pnpm build && pnpm gate:bundle`(무출력) ·
  `pnpm exec playwright test tests/e2e/tab-navigation.spec.ts --workers=1`(17 passed).
- **미결**: 없음. `@sheet/(.)roster/**` 인터셉트·`roster/[date]` 페이지·홈·일정 블록·훅 일곱·
  `useAmountMasking` 스토어는 계획대로 5라운드로 남겨뒀다.

## 2026-08-18 · RADIO revision 6 재봉인 (radius 사다리에 xs 6px)

- sha256 `83756aeeb654a9dfeae70218c8d6bda9b009dbae4444b4cc70816fc235454c86`(사용자 승인,
  2026-08-18). revision 5는 `551fa9dc…`였다.
- **왜 열었나.** 3라운드가 라운드 34 확정을 `PATTERNS.md:92`에 이관하면서 「막대는
  `--color-border` radius 6」이 승인 문서가 됐는데, `FOUNDATIONS.md:121-126`의 radius 사다리와
  `globals.css:70-74`에는 6px 칸이 없다(`sm 8 · md 14 · lg 16 · xl 20 · pill`). 설계가 6을 정할 때
  사다리를 안 봤다 — 승인 문서 둘이 어긋난 채로 4라운드 RED가 `rounded-[6px]` 임의값을 박았다.
- **무엇을 골랐나.** 임의값을 세 파일에 남기는 대신 사다리를 늘린다(사용자 결정). 그래야
  P0-T49~T54가 같은 자리에서 임의값을 다시 안 쓴다. 대안이던 「`radius-sm` 8px로 스냅」은
  라운드 34 확정값을 조정자가 바꾸는 것이라 뺐다.
- **왜 재봉인이었나.** revision 5까지의 `globals.css` 용도 한정과 `FOUNDATIONS.md` 용도 한정이
  둘 다 **닫힌 목록**이라 토큰 한 줄·표 한 행을 더하는 것도 봉인 밖이다.
- **더한 것**: 인수 조건 32(토큰이 서고 skeleton 막대 셋이 그것을 쓰며 **저장소에 `rounded-[`
  임의 radius가 0건**) · 위험 표 `32 radius 사다리` 행 · 용도 한정 두 문단에 한 줄씩. 인수 조건
  1~31과 위험 표 나머지 행은 안 건드렸다. 새 check ID는 안 만들었다 — `design-token-ladder`가
  이미 이 축을 진다.
- **4라운드 RED를 고쳐야 한다.** `src/app/__tests__/route-conventions.test.ts`가 `rounded-[6px]`을
  기대한다. `rounded-xs`로 바꾸고 「`rounded-[` 0건」 단언을 더한 뒤 GREEN으로 간다.

## 2026-08-18 · 개발 3라운드 (문서 이관 — 코드 변경 없음)

- 기준 커밋: `6b33d09`(개발 2라운드). RADIO는 여전히 revision 5,
  sha256 `551fa9dc4dbc9c0ebfe40b38e9ef69cd93353e68347514e38df4da19785ffcad`(재계산해 대조 확인) —
  이 라운드는 RADIO를 한 글자도 고치지 않았다.
- **이번 라운드는 문서 이관 전용이다.** `src/**`·`tools/**`·`config/**`·`harness/**`를 전혀
  건드리지 않았다. RADIO의 「문서 이관」 절이 줄 단위로 지정한 대로 문서 다섯을 고쳤고,
  `design/NOTES.md` 맨 아래 개정 목록 표(쉰 행)에 「상태」 열을 더해 전부 닫았다.
- **문서별로 한 것**
  - `FOUNDATIONS.md` — 좌우 여백 20→16px, 카드 문장 개정, 「블러」 절 신설(금액 숨김 7px ·
    헤더 9px+지면색 50%), 아이콘 절에 하단 탭 채움 예외·`LayoutGrid` 교체 근거 추가(「선택 상태는
    action 색」 문장 삭제), 「그림 자산」 절 신설, 모션 표에 「자리 이동 200~300ms」 행 추가 +
    탭 눌림 420ms를 표 밖 예외로 명시. **제품 의미 토큰 표(`:35-51`)는 손대지 않았다** — RADIO
    「미결 사항」 소유.
  - `PATTERNS.md` — 하단 탭 `홈·일정·급여·전체`로 교체, 하단 고정 저장 버튼에 조건부 등장 서술
    추가, 홈을 「고정 다섯 블록」으로 재서술, 「행」 절과 「빈 블록」 절 신설, 로딩·오류·오프라인
    절에 skeleton 모양과 에러 규칙(일부 실패 한 줄+다시 시도, 전부 실패 화면 한 장, 빨강 금지)
    추가.
  - `COMPONENTS.md` — Calendar 절을 라운드 28 최종 표(상태 여섯: 모집없음·마감·지난근무 통합 /
    신청가능 / 신청완료 / 확정 / ＋선택 / −선택)로 교체, Notification row에 「모두 읽음」 반전과
    홈 카드 `X`의 뜻(하루 미루기) 추가, Connectivity banner를 헤더 레이어 셋째 줄로, Bottom
    sheet에 닫기 버튼 방향 규칙(오른쪽 ✕ / 겹겹 시트 왼쪽 ←) 추가.
  - `WORKER-FLOWS.md` — 탭 목록·홈 다섯 블록 구조로 교체, 예상 급여 홈 미리보기 반전(두 자리:
    `:39`계열과 `:110`계열 모두), 근무 신청 흐름에서 undo 제거하고 추가·취소 하단 바로 교체,
    홈 주간 스트립 월요일 시작 근거 한 줄 추가, 본인 행 색을 파랑 500 글자로, 홈 버튼이 화면을
    이동시킨다는 문장 추가, 출퇴근 인증을 별도 페이지 흐름으로 재서술, 누적 예상 급여 명명 추가,
    「화면 설정」 절 신설(근무일 자동 가림 스위치). **`:80`·`:86`(포지션 교대)은 그대로 뒀다.**
  - `docs/product/DESIGN.md` — `:24` 문장을 카드 기준으로 재작성(`FOUNDATIONS.md:101`과 같은
    방향).
- **판단이 필요했던 자리 셋.**
  1. **홈 블록 개수 — 「넷」이 아니라 「다섯」으로 썼다.** NOTES 개정 목록의 「새 틀」 칸(라운드 6
     기록)과 개정 전 `PATTERNS.md:19`·`WORKER-FLOWS.md:30-35` 원문은 모두 "네 블록"이라
     적었는데, RADIO Architecture 본문(`### 코드 구조` 「홈의 다섯 블록」, `views/home/ui/`
     파일 목록 다섯 개)은 명시적으로 "고정 **다섯** 블록"이라 쓴다. RADIO가 NOTES 라운드 6
     초안보다 나중에 봉인된 정본이라 RADIO를 따랐다 — 알림·오늘·이번 주·다가오는 근무·급여
     다섯이다.
  2. **`WORKER-FLOWS.md:86`(포지션 교대) 행의 상태 라벨 — 「1단계 반환」이 아니라 「P0-T55
     이월」로 닫았다.** RADIO 219줄(「기획으로 되돌린 행」 요약 문단)은 이 행을 PRD 반환 넷과
     한데 묶어 언급하지만, RADIO Architecture의 WORKER-FLOWS.md 이관 절 자체(`:80`·`:86` 항목)는
     "개정 목록의 그 행은 「P0-T55로 이월」로 닫는다"라고 더 구체적으로 지시한다. 조정자 지시도
     "장부에서 P0-T55 이월로 닫는다"였다. 더 구체적인 지시를 따랐다 — PRD 반환 넷(인증 마감
     시각·주급 경계·금액 가림 개념·`schedule-cell-state.ts` 확정 주체는 NOTES 미결 항목이라
     장부 밖)만 「1단계 반환」이다.
  3. **Calendar 상태 표는 라운드 28 "확정" 절의 최종 6행 표를 썼다.** 같은 라운드 안에 7차
     작업 중 표(8행, 모집없음·마감·지난근무를 색 셋으로 분리)가 남아 있는데, RADIO가
     "상태 **여섯** 표"라고 못박아 세었으므로 개수가 맞는 최종 확정 절 표(모집없음·마감·지난근무
     통합 1행)를 정본으로 썼다.
- **그림 자산 절의 번들 예산 문구**는 NOTES 원문(라운드 7 시점 500KB)이 아니라 지금 실제 값인
  600KB 기준으로 서술했다 — 2라운드가 이미 `BUNDLE_BUDGET_BYTES`를 600KB로 올렸으므로
  (`harness/lib/bundle-budget.ts:8`), 문서가 그 사실과 어긋나면 안 된다.
- **개정 목록 두 행을 새로 추가했다(RADIO 지도에 없음, 조정자 지시).** `FOUNDATIONS.md` 원시
  팔레트의 `gray-300`·`gray-100` 용도 열이 1라운드 토큰 재배치 뒤에도 낡아 있었다 —
  `--color-border`는 이제 `gray-250`을 가리키는데 `gray-300` 행은 여전히 "테두리"라 적혀 실제
  소비처(`--color-neutral-border`·`--color-disabled-border`, `globals.css:30,34`)와 안 맞았고,
  `gray-100`도 "입력과 약한 표면"인데 `--color-surface-weak`가 `gray-150`으로 옮겨가 남은
  소비처는 `--color-neutral-surface`(`globals.css:29`) 하나뿐이었다. 값은 그대로 두고 용도
  문구만 고쳤다.
- **1라운드가 이미 끝낸 넷은 다시 안 했다** — 원시 팔레트 일곱 행, `:59` variable 축 문장,
  타이포 표 재배치(`display` 삭제·`caption-strong` 추가·무게 열), 사용 열. 눈으로 대조만 하고
  장부에서 `이관함`으로 닫았다.
- **못 닫은 행은 없다.** 쉰 행 + 새로 추가한 두 행 = 쉰두 행 전부 상태를 받았다 — `이관함` 47 ·
  `1단계 반환` 3(PRD 인증 마감 시각·주급 경계·금액 가림 개념) · `P0-T55 이월` 1
  (`WORKER-FLOWS.md:86`) · `5라운드 코드` 1(`deadline-batches.ts`, 파일은 손대지 않았다).
- **재현**: `pnpm gate:all`(무출력) · `pnpm check:docs`(무출력). `pnpm verify` 전체는 이번
  라운드에서 돌리지 않았다(조정자 지시 — 문서만 바뀌고 로컬 e2e가 부하로 반복 flake). 코드와
  테스트를 하나도 안 건드려 `tdd.json`에 새 기록을 넣지 않았다 — 이미 있는 라운드 1·2의
  RED→GREEN 쌍으로 `gate:tdd`가 그대로 통과한다.
- **미결**: 없음. 다음 라운드(4라운드, 홈·일정 퍼블리싱)로 넘어갈 준비가 됐다.

## 2026-08-18 · 개발 2라운드 GREEN (Dumb UI 린트·번들 상한 600KB)

- 기준 커밋: `b944dc1c15326da96d1d4d540553a2c831174c75`(개발 1라운드). 그 위에서 RADIO가
  revision 5로 올라갔다(사용자 결정, 번들 상한 600KB) —
  sha256 `551fa9dc4dbc9c0ebfe40b38e9ef69cd93353e68347514e38df4da19785ffcad`.
- 이 라운드가 한 것 다섯: (1) `HomeView.tsx:79`·`ScheduleView.tsx:122`의 남은
  `typo-display`를 `typo-headline-md`로 치환 — 클래스 문자열만. (2) `BUNDLE_BUDGET_BYTES`를
  `600 * 1024`로(측정 로직은 안 건드림). (3) `ADR-0015` 결정 3에 세 번째 인상을 기록 —
  지금 실측 508KB(519,825바이트)가 최종 실측 491.0KB에서 17KB 늘었고 원인은 아직 안 셌다는
  것, 「490KB를 넘으면 `motion/mini`로 반환」 조항을 뒤집는다는 것을 문장으로 적었다.
  (4) `tools/eslint-plugin-project/rules/no-logic-in-ui.mjs` 신설 — `segment-imports.mjs`
  관례(`loadContract`+`resolveLocation`)를 따라 비교 연산자·산술·`.length`·파생 배열
  메서드·`Date`/`Intl`/`toLocaleString`/`toFixed` 호출을 `ui` 세그먼트에서 막는다.
  `config/fsd.json`의 `ui` 세그먼트에 `noLogic: true`를 더했고, 이를 읽게 하려고
  `tools/eslint-plugin-project/lib/contract.mjs`의 `readSegment`에 `noLogic`(선택, 기본
  `false`) 파싱을 `requireServerOnly`와 같은 자리에 더했다 — RADIO 「Dumb UI」 용도 한정
  문구가 `no-logic-in-ui.mjs` 신설과 `index.mjs` 등록 한 줄이라고 적었지만, Architecture가
  「규칙이 세그먼트 이름을 하드코딩하지 않고 계약에서 읽게 하려는 것」이라고 명시해 그
  설계 의도를 이행하려면 `contract.mjs`가 그 필드를 실제로 반환해야 했다. 다른 12개
  규칙의 판정 로직은 손대지 않았고 기존 `contract.test.mjs` 15건이 그대로 통과한다.
  (5) `DEV-CODE-09`를 `SHOULD`→`MUST`로 올리고 예외를 「className 조합과 열거값 분기」
  둘로 좁혔다.
- **`Intl.*` 정적 분석 구멍 하나를 조정자 지시로 메웠다.** `new` 없이 부르는
  `Intl.NumberFormat(...).format(...)` 형태는 `NewExpression`만 보던 첫 구현이 놓쳤다.
  RED 두 건(`Intl.NumberFormat("ko").format(1000);`·`Intl.DateTimeFormat("ko").format(d);`,
  둘 다 `dateOrFormatCall` 기대)을 `no-logic-in-ui.test.mjs`에 먼저 추가해 실패를 확인한
  뒤, `CallExpression` 핸들러에 `callee.object`가 `Identifier "Intl"`인 경우의 검사를
  더해 GREEN으로 돌렸다(안쪽 `Intl.NumberFormat("ko")` 호출 노드 하나만 잡혀 리포트
  1건). 저장소에 `new` 없는 `Intl.*` 사용처가 없어 `pnpm lint`는 그대로 무출력이다.
- **린트 예외 목록(26개, `eslint.config.mjs` 맨 끝 블록)**: 전수 스캔(모든 `ui` 세그먼트
  파일에 규칙을 켠 채 개별 lint)으로 얻었다 — `src/features/**/ui` 11개, `src/shared/ui/**`
  2개(`calendar.tsx`·`select-field.tsx`, 16개 중 2개라 「대량」 기준 미달로 질문 없이
  진행), `src/views/**/ui` 11개(`preview/ui/PreviewView.tsx` 포함), `src/widgets/pull-to-refresh/ui/PullToRefresh.tsx`
  1개, **그리고 `src/views/schedule/ui/ScheduleView.tsx`·`DeadlineBatchList.tsx` 2개.**
  홈(`HomeView.tsx`)은 스캔 결과 위반이 전혀 없어 예외 목록에 없다 — AC20을 그대로
  지킨다. `ScheduleView.tsx`는 RADIO가 명시적으로 허락한 경우다(①에서 고친 파일이 규칙에
  걸리면 예외로 올리고 보고하라). **`DeadlineBatchList.tsx`는 RADIO가 이름을 대지 않은
  세 번째 파일이라 판단이 필요했다** — `ScheduleView.tsx`가 그 컴포넌트를 렌더하고
  `git log`로 확인한바 두 파일 다 P4-T02 시절 코드로 이번 라운드 전 커밋(`b944dc1`)이
  "홈·일정 화면은 publisher 몫이라 typo-display를 그대로 뒀다"고 명시적으로 건드리지
  않았다. `src/views/schedule/**`는 RADIO Architecture가 「전면 재작성」이라고 이미
  선언한 범위라 같은 근거(publisher가 다시 쓸 파일)가 `DeadlineBatchList.tsx`에도
  적용된다고 보고 같은 처리를 했다. **AC20의 문구("홈·일정의 ui 파일에 예외가 하나도
  없다")를 문자 그대로 지키지 못한 지점이니 조정자가 재검토할 것.** 예외 목록 위에
  「P0-T49~T54가 자기 화면 줄을 지운다」 한 줄은 **안 남겼다** — `DEV-CODE-07`이 코드
  주석을 저장소 전체(리뷰로 유지되는 `src/` 밖 포함)에서 금지한다는 CLAUDE.md 해석을
  따랐다. 확신이 서지 않아 비워두고 여기 보고한다.
- **조정자 판정 — `DeadlineBatchList.tsx` 예외는 그대로 둔다.** AC20은 task를 닫을 때 서는
  조건이지 라운드마다 서는 조건이 아니다. RADIO Architecture가 `src/views/schedule/**`를
  「전면 재작성」으로 이미 선언했으므로 `DeadlineBatchList.tsx`도 5라운드가 다시 쓰는 파일이고,
  `ScheduleView.tsx`와 성격이 같다. 규칙을 화면 재작성보다 먼저 켠 라운드 순서가 낳은
  일시 상태다. **5라운드의 종료 조건에 「`eslint.config.mjs`에서 `src/views/schedule/ui/`로
  시작하는 예외 두 줄을 지운다」를 넣는다** — 그것이 서야 AC20이 선다.
- **조정자 판정 — 예외 목록 위 주석을 안 남긴 것이 맞다.** `DEV-CODE-07`은 `src/` 밖에서도
  적용되고 리뷰로 지킨다. 그 빚이 빚이라는 사실은 RADIO Architecture와 이 handoff가 진다.
- **번들 실측**: 빌드 뒤 `measureStaticChunks` 실측 519,850바이트(507.7KB, 청크 44개,
  최대 청크 71.6KB) — 조정자가 별도로 잰 519,852바이트와 사실상 같다(빌드마다 수 바이트
  변동). 600KB 상한 대비 여유 약 92.3KB, `pnpm gate:bundle` 통과.
- **재현**: `pnpm vitest run tools/eslint-plugin-project/rules/__tests__/no-logic-in-ui.test.mjs`
  (41 passed) · `pnpm vitest run src/app/__tests__/globals.test.ts`(107 passed) ·
  `pnpm lint`(무출력) · `pnpm gate:bundle`(무출력) · `pnpm verify`.
- **`pnpm verify` 로컬 재현 기록 — e2e만 반복적으로 flake했다.** 같은 작업 트리로 6회
  실행하는 동안 format·lint:ci·typecheck·unit(1693 passed)·harness:self-test·check:docs·
  build·gate:bundle·check:app-build·check:client-secret-scan은 매번 예외 없이 통과했다.
  `test:e2e`만 회차마다 다른 스펙에서 실패했다(1건 → 2건 → 8건 → 4건 → 8건 →
  `e2e5`에서 0건 통과). 실패 원인은 전부 `Test timeout` · `toHaveURL`/`toBeVisible` 대기
  초과였고 로직 단언 실패가 아니었다. `uptime`이 이 구간에서 load average 20~63을
  오갔다(`5 users` 동시 세션) — 로컬 리소스 경합으로 판정했다(조정자 대조 결론과 일치).
  마지막 `verify` 시도(`e2e에서만` 깨짐, 8개 스펙)의 깨진 스펙만
  `pnpm exec playwright test <8개 파일> --workers=1`로 직렬 재실행해 24/24 통과를
  확인했다 — `assignment-eligibility`·`assignment-trainee`·`position-requirements`·
  `recruitment-flow`·`recruitment-notifications`·`roles`·`schedule-confirmation`·
  `worker-management` 여덟 spec 파일.
- **미결**: `docs/execution/reviews/backlog.md:372`의 508KB 행 닫힘과 `P0-T56`(번들 원인
  규명) 신설은 이 커밋에 없다 — 조정자 소유라 손대지 않았다. `docs/execution/phases/00-foundation.md`의
  P0-T56~P0-T58 절 추가도 같은 이유로 이 커밋 밖이다(내 diff가 아니다).

## 2026-08-18 · 개발 1라운드 GREEN (토큰·타이포 이관)

- 기준 커밋: `ce2e605ee1edb2dd70fbeafba909d9ab594bd75b` (RADIO revision 4,
  sha256 `0a284bc45a7514db4fc30ef22b28471aac4c74e8a0d9c75bdaa9fe5f721bf51e`).
- **아래 「설계 봉인」 절의 「revision 1」 표기는 그 세션 시점 기준으로 지금은 낡았다** —
  `index.jsonl`의 실제 `development_approval`은 revision 4다. 이 절을 다시 손대지 않았으니
  다음 세션이 revision 4 기준으로 읽어라.
- 이 라운드가 한 것 넷: (1) `globals.css` `:root`에 원시 팔레트 7행(blue-800/100/50/25,
  gray-800/250/150) 추가, `@theme`에 의미 토큰 6개(`--color-canvas`·`-ink-800`·`-action-deep`·
  `-action-tint-weak`·`-action-tint`·`-action-tint-strong`) 신설, `--color-border`→
  `--raw-gray-250`·`--color-surface-weak`→`--raw-gray-150` 참조 교체, `body` 배경을
  `--color-canvas`로 교체. (2) `@utility typo-*` 8개 재정의(`typo-display` 삭제,
  `typo-caption-strong` 신설). (3) `typo-display` 사용처를 그레마다 치환 — 화면 제목 h1
  `typo-headline-md`, `PayView.tsx:152` 금액 `typo-title`. **홈·일정(`HomeView.tsx`·
  `ScheduleView.tsx`)의 `typo-display`는 손대지 않았다** — publisher 몫이라 그대로 둠. (4)
  `FOUNDATIONS.md` 원시 팔레트 표·타이포그래피 표 갱신.
- **재현**: `pnpm vitest run src/app/__tests__/globals.test.ts` (106 passed) ·
  `pnpm gate:tokens`(무출력 exit 0) · `pnpm verify`(아래 미결 둘을 빼면 통과, 근거는
  `docs/execution/runs/P0-T48/tdd.json`의 green 기록).
- **미결 1 — `gate:bundle` 508KB/500KB 초과.** 이 라운드 변경 전 HEAD에서도 동일하게
  실패함을 `git stash` 대조로 확인했다(내 변경과 무관). `docs/execution/reviews/backlog.md:372`에
  P0-T47 리뷰가 이미 올려둔 항목이라 새로 만들지 않았다.
  `--` `pnpm check:app-build` · `check:client-secret-scan` · `test:e2e`(88개 중 하나 flaky
  work_date 충돌, 단독 재실행 시 통과) · `gate:motion-render-budget` · `gate:all`은 모두
  개별로 통과 확인했다.
- **미결 2 — `no-logic-in-ui` RED.** `tools/eslint-plugin-project/rules/__tests__/no-logic-in-ui.test.mjs`가
  아직 커밋 안 된 채 작업 트리에 있다(다음 라운드 「Dumb UI 린트」 몫). 이 커밋에 포함하지
  않았다 — 검증 중에는 잠시 치워뒀다가 그대로 복원했다.
- **치환 개수 불일치**: RADIO는 「스물넷 h1 + 금액 1 = 스물다섯」이라 적었는데, 실제 grep
  전수 확인 결과 h1은 23개(홈·일정 포함)뿐이라 합계 24다. 셈이 하나 어긋나 있을 뿐 지시
  자체(치환 대상·클래스명)는 분명해 진행했다. 다음 라운드가 문서 정본을 다시 셀 때 참고.

## 2026-08-18 · 설계 봉인 (디자인 라운드 34까지)

- 작업 식별자: P0-T48 (전역 디자인 틀 재제안과 기존 화면 퍼블리싱)
- 현재 단계: **3단계 개발 진행 중.** RADIO revision 1이 봉인됐고 `index.jsonl`의 상태가 `in_progress`다
- 기준 시각: 2026-08-18 (개발 설계 승인 직후)
- 이어받는 세션이 읽을 순서: 이 파일 → [`../../radio/P0-T48-radio.md`](../../radio/P0-T48-radio.md)(봉인된 정본) →
  [`design/NOTES.md`](design/NOTES.md)(라운드 근거)

### 봉인된 것

- **RADIO**: `docs/execution/radio/P0-T48-radio.md` revision 1,
  sha256 `6fbd292690c539927bc6a5abb3e61696c15f2a12490e302d4411cd71c1b1b973`.
  `index.jsonl`의 `development_approval`이 이 해시를 물고 있다 — **RADIO를 한 글자라도 고치면
  해시를 다시 박아야 한다.**
- `test_mode`가 `verification` → **`tdd`**로 바뀌었다. `check_ids` 여덟이 섰다.
- 개발 단계 순서: `unit-test-writer`(컴포넌트 RED) → `publisher`(GREEN·UI 커밋) → `implementer`.
  RADIO의 「변경 허용 경로」가 좁다 — `src/features/**`·`src/entities/**`·`PRD.md`는 안 열린다.

### 봉인 직전에 찾은 것 (RADIO가 갖는다)

- **시안이 쓰는 색값 아홉 중 일곱이 문서에도 `globals.css`에도 없었다.** 개정 목록이 둘만
  적어뒀고 라운드 27 행은 틴트가 이미 있다고 잘못 적었다. 장부에 여섯 행을 올렸다.
- **홈 스트립은 월요일 시작, 일정 달력은 일요일 시작이다.** 급여 주 경계가 `PRD.md:346`에 걸린
  기획 물음이라 이 task가 못 정한다 — 문서에 왜 다른지만 적는다.
- **토큰 셋이 스물한 화면에 번진다** — `--color-border` · `--color-surface-weak` · `typo-display`
  삭제(사용처 25곳). 이관 범위는 두 화면인데 영향은 앱 전체다.

### 확정된 사실

- `index.jsonl`의 P0-T48이 `in_progress`이고 승인 둘이 다 기록돼 있다. 저장소에 다른
  `in_progress`는 없다.
- **디자인 규칙의 근거는 `design/NOTES.md`가 갖고, 봉인된 정본은 RADIO다.** 라운드 1~34가 전부
  확정이며 화면 계약은 `design/confirmed/<화면>.html`이다. 이관이 끝나면 정본이
  `docs/product/design/**`로 옮겨간다.
- 시안 발행 주소: `https://claude.ai/code/artifact/2d3506c2-1e3b-46c9-b1a5-9c257990b879`
  — 발행 시 이 주소를 `url` 인자로 넘겨야 같은 링크가 유지된다. favicon은 `🎨`로 고정.
- **`proposal.html`은 인터랙티브 프로토타입이다.** 흐름 — 덮어쓰기 →
  `pnpm design:build docs/execution/runs/P0-T48/design/proposal.html` → 산출물
  `proposal.inlined.html`을 Artifact 발행. `design:build`가 `<script>`를 보존한다.
  `*.inlined.html`은 `.gitignore`에 있다.
- 조작판(기기 옆)이 상태를 조작한다 — 오늘(인증 창)·다가오는 근무(3건/1건/없음)·이번 주
  (근무 3회/1회/빈 주)·알림·시각.

### 진행 방식 (이어받을 때 그대로)

한 라운드에 하나를 정한다. 앞 라운드에서 정한 규칙은 다음 화면에 그대로 적용하고, 다르게 가면
**그 자리에 근거를 NOTES에 남긴다.** 시안 파일은 라운드마다 덮어쓴다. 사용자 승인 문구가
나오기 전에는 확정으로 적지 않는다.

**Bold를 많이 쓰지 말라는 것이 사용자 상수 지침이다.** 화면에 700은 없다.

### 라운드 22 이후 확정된 것 (요약 — 세부는 전부 NOTES가 소유)

- **라운드 23 급여 블록** — 상하 여백은 **현행 유지**(행 상하 12 · 카드 상하 4, 행 규칙 개정
  없음). 행 앵커 그림 셋을 낱개 검수해 다시 그렸다: **초록 지폐 + ₩** · **호박·파랑·초록 막대
  셋** · **보라 오름 꺾은선 + 화살촉**. 어법은 알림 그림과 같다(다색 그라디언트 · 배경 블록
  없음). 보라 `#b18cff`→`#6a3bd8`가 새 고정색이다. 같은 라운드에서 **리빌 빛이 도는 중 다시
  가려지면 빛이 즉시 사라지게** 고쳤다.
- **라운드 24 계층 확정** — 무게가 600·500 체계로 내려왔고(700 없음), 26/34는 **카운트다운
  하나**, 순서 규칙에 **한 줄 좌우**가 세 번째 꼴로 들어왔다. 표를 코드와 대조하다 어긋난 곳
  셋을 고쳤다(알약 13/18 · 더보기 400 · 모달 명단 15/22 → 16/24). 죽은 CSS도 걷었다.
- **라운드 25 헤더 블러** — 헤더가 콘텐츠 위에 떠 있고 스크롤하면 카드가 그 뒤로 지나가며
  비친다. `blur(9px)` + 지면색 50%, 상태 표시줄(24) + 헤더(56)를 한 레이어 80으로 묶었다.
- **라운드 26 알약 무게** — 「확인」 알약 600 → **400**(확정).

- **라운드 27 D 배지와 오늘의 포지션** — **D-2까지만 파랑 틴트**다(D-1 `#cfe0fc`, D-2 `#e4edfd`,
  글자는 둘 다 `#0c3f9c`, **D-3부터 회색**). 진한 `#0052ff`는 버튼 하나의 것이라 배지에 쓰지
  않는다. **D-0은 만들지 않았다** — 오늘 근무는 「다가오는 근무」에 들어오지 않고(블록은 D-1부터
  시작), 오늘의 포지션 배치도는 **「오늘」 카드의 발치**가 연다. 라운드 22가 만든 같은 바닥
  시트를 쓴다.

### 라운드 28에서 뒤집힌 전제 (이어받을 때 먼저 알 것)

**모집은 한 달에 한 번 쭉 열린다.** 7월 말에 8월치를 통째로 받고, 보통 마감이 하나이며 가끔
추가 모집이 붙는다(2026-08-18 사용자 정정). `deadline-batches.ts`가 여러 묶음 전제로 서 있어
개정 목록에 올렸다. 화면은 **한 회차를 기본 모양**으로 잡고 여럿이면 **마감 임박순**으로 쌓는다.

**빈 상태는 이제 시안에서 정한다.** `publish-ui` 스킬의 「대표 상태 하나만 그린다」를 뒤집었다
(2026-08-18 사용자 지시). 화면마다 아무 데이터도 없을 때 · 일부만 있을 때 · 값이 0이거나 이름이
아주 길 때를 정하고 NOTES에 적는다. **로딩·에러·오프라인은 아직 전역 규칙이 없다** — 다음
라운드에서 한 번 정하고 화면마다 다시 묻지 않는다.

**부딪히면 디자인이 이긴다.** 1단계 기획이 2단계 설계 중에 흔들리면 디자인을 접지 말고 기획
문서를 개정 목록에 올린다(2026-08-18 사용자 결정, `WORKFLOW.md`에 들어갔다). **넷은 예외로
1단계 반환이다** — 없는 데이터 · 권한과 PII · 돈과 시각 · 기획이 「만들지 않는다」고 적은 기능.

### task를 갈랐다 (2026-08-18)

화면이 21개라 RADIO 하나가 다 덮으면 봉인이 안 되고 마지막 화면까지 개발이 묶인다. 쪼개는
경계를 **「정본을 어디에 세우느냐」**로 잡았다.

- **P0-T48(이 task)은 좁아졌다** — 전역 틀 확정 + **`docs/product/design/**`로 정본 이관** +
  홈·일정 두 화면 퍼블리싱. 뒤따르는 task가 남의 run 폴더를 안 읽게 하는 것이 이 task의 몫이다.
- **P0-T49~T54** 화면 묶음 여섯이 `design_pending`으로 섰다(인증·상태 8 / 일정 상세 / 알림 2 /
  급여 / 더보기·프로필 3 / 관리자 4). **P0-T54는 착수 전에 더 가를지 정한다.**
- **P0-T55 포지션 교대 요청 기획**이 `proposed`로 섰다 — `WORKER-FLOWS.md:86`이 막아둔 기능이라
  기획 승인이 먼저다. 시안은 이미 `confirmed/schedule.html`에 그려져 있다.

### 다음 행동

3단계 개발이다. RADIO Architecture가 순서를 갖고 있다.

1. **토큰 이관** — `FOUNDATIONS.md` 원시 팔레트 일곱 행 + `globals.css` 의미 토큰 여섯.
   `pnpm gate:tokens`가 판정한다.
2. **타이포 재배치** — 표 여덟 행, `@utility typo-*` 여덟 블록, `typo-display` 25곳 치환.
3. **규칙 이관** — 개정 목록 쉰 행을 문서별로 닫는다. RADIO의 「문서 이관」 절이 줄 단위로 적었다.
4. **홈·일정 퍼블리싱** — `confirmed/*.html` 계약대로. preview에 홈 아홉 · 일정 일곱 시나리오.

### 일정 화면이 남긴 것 (라운드 28, 확정)

세부는 NOTES의 **「일정 화면」 확정 규칙 절**과 `confirmed/schedule.html`이 갖는다. 다른 화면에
그대로 번지는 것만 적는다.

- **오늘 표시는 칸을 두르는 실선 1px `#e5e8eb`**다. 라운드 1의 밑줄을 개정했다.
- **시트 닫기는 머리 오른쪽 ✕**, 겹겹 시트는 머리 왼쪽 ←. **홈 확정본도 같이 고쳤다** —
  발치 파란 `닫기` 버튼이 없어졌다. 시트는 앱에서 하나다.
- **행은 라벨 위 · 값 아래**, 값 18/26 500. 다만 **여러 줄이 이어지는 목록 항목은 16/24 400**이다
  — 홈의 18/26은 카드에 한 줄씩만 설 때의 값이다.
- **`WORKER-FLOWS.md:47-48`의 undo를 없앴다.** 저장하면 바가 걷히고 토스트 하나다.
- **담는 말과 내는 말을 가른다** — 「모두 선택」·「선택됨」은 담기, 「신청하기」·「신청 완료」는 내기.

### 기획으로 돌아간 물음 (변동 없음)

- **주급** — `PRD.md:346`은 「날짜별 금액과 월별 합계」. 주 경계 · 월별 합계 유지 · 달 걸친
  근무 귀속을 기획이 정해야 한다. 시안은 월~일 가정.
- **받은 총급여 불가** — `PRD.md:375`. 시안은 「누적 예상 급여」 명명.
- **인증을 닫는 시각** — `PRD.md:301` 주변에 없다(라운드 8부터 이월).

- **「확정」이 누구의 확정인가** — `schedule-cell-state.ts:20-29`가 스케줄 status를 먼저 보고 내
  신청을 덮는다. 이 화면에는 배정 데이터가 안 온다(`listRecruitmentSchedules` +
  `listOwnApplications`뿐).
- **포지션 교대 승인 규칙 셋** — P0-T55로 섰다.

### 미결 사항

**봉인 뒤에는 RADIO의 「미결 사항」이 정본이다.** 여섯 — `action`·`action-pressed` 의미 토큰
판정(화면 둘로는 판단이 안 서 P0-T49~T54로) · 모션 대역의 탭 눌림 420ms(`FOUNDATIONS.md:137`) ·
긴 이름 말줄임 기준(`model` 몫) · D 배지 형태 검수 · 홈 목 데이터 요일 · 주간 스트립 주 경계
(기획 대기). `display` 32/40과 로딩·에러·오프라인 전역 규칙은 닫혔다. task 분할도 2026-08-18에
닫혔다.

**문서 개정 목록(NOTES 맨 아래 표)이 이 task의 핵심 산출물이다.** 라운드 28이 여섯 행을 더했다 —
`WORKER-FLOWS.md:47-48`(undo 폐기) · `:71`(본인 행) · `:86`(포지션 교환 금지 뒤집기) ·
라운드 22 시트 닫기 · `deadline-batches.ts`(다중 묶음 전제) · 계층 표 18/26. 앞선 라운드가 올린
것과 합쳐 **정본 이관 때 전부 닫아야 한다.**

### 참고 — 이 task로 넘어온 것

- `wip/design-overhaul-p0-t48` 브랜치(base `f135549`)는 참고만, 코드는 새로 옮긴다(2026-08-17
  사용자 결정). `wip/design-overhaul-older-snapshot`은 전부 흡수됐다. 지워도 된다.

### 증거·산출물 경로

- `docs/execution/runs/P0-T48/design/NOTES.md` (디자인 규칙 정본)
- `docs/execution/runs/P0-T48/design/confirmed/home.html` (**홈 확정본** — 퍼블리싱 계약)
- `docs/execution/runs/P0-T48/design/confirmed/schedule.html` (**일정 확정본** — 라운드 28)
- `docs/execution/runs/P0-T48/design/proposal.html` (진행 중 라운드의 시안. 라운드마다 덮어쓴다.
  지금은 일정 화면 확정본과 같은 내용이다)
- `docs/execution/runs/interviews/2026-08-16-design-system-overhaul.md`
- `docs/execution/phases/00-foundation.md` P0-T48 절
