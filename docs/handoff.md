# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**사람 손이 필요한 것과 판정 대기가 남았다.** 어제 아홉 행이 닫혔고([docs/log/2026-10-18.md](log/2026-10-18.md)) 설정값이 빠진 빌드의 화면, 시트 손잡이, 통계·급여 조각의 신분 받기, Bash 쓰기를 보는 훅, integration의 로컬 가드와 자기 데이터 정리가 섰다. 코드와 단위 테스트는 초록이고, 남은 것은 사람 손과 기기 확인이다.

1. **Supabase 원격 프로젝트의 Redirect URLs에 두 줄을 넣는다(사람 손).** `labiebelle://auth/callback`과 `exp://**/--/auth/callback`이다. 빠지면 로그인이 오류 없이 돌아오지 못한다. 로컬 `supabase/config.toml`에는 이미 든다. 자리는 [environments.md](5-deploy/environments.md)다.
2. **실기기 확인.** 로그인(구글 왕복의 네 계정 경우, 창 닫기, 안드로이드 복귀 때 not-found, 라이트·다크 버튼 톤), 테마(시스템 테마인 다크 기기가 다크로 뜨는지, 라이트를 고른 뒤 OS를 다크로 바꿔도 라이트로 남는지), 차트(통계 화면의 값 라벨 위치와 1·4·7·10월 라벨, 막대 폭, 근무표 칸의 점선 테두리, 출근 기록 없는 달의 출근율이 `–`인지), 등장 모션(움직임 줄이기를 끈 콜드 스타트에 다섯 요소가 70ms씩 어긋나 8px 아래에서 올라오는지, 켠 콜드 스타트는 이동 없이 밝기만 바뀌는지, 실패 줄이 떠도 등장이 다시 안 도는지)에 더해 어제와 오늘 것이 있다.
   - 시트 푸터에 `flex-1` 버튼 둘이 나란히 설 때 폭을 반씩 나누는지, 모든 버튼이 눌리는 동안 줄고 `disabled`·`loading`이면 안 주는지(구글 버튼의 `busy` 포함)
   - 스켈레톤 빛 줄이 끊김 없이 흐르고 한 바퀴 돌아 다시 시작할 때 이음새가 튀지 않는지, 동작 줄이기를 켜면 빛 줄이 없고 끄면 다시 흐르는지, 빛 줄이 둥근 모서리(`rounded-xl`·`rounded-sm`) 안에서 잘려 보이는지, 카드 여럿이 한 화면에 설 때 깜빡임으로 읽히지 않는지
   - 앱을 켠 채 OS 설정을 바꾼 뒤 로그인 화면에 들어가면 등장 모션이 바뀐 설정을 따르는지
   - 기기 시계를 하루 돌려도 오늘이 서버 날짜인지(근무표 오늘 강조·통계 다음 달·관리자 홈 오늘 타일)
   - env 두 값을 비운 빌드에서 스플래시가 내려가고 「앱을 열 수 없어요」 한 장이 뜨는지, 버튼이 없는지, 값이 찬 빌드는 전처럼 입장 판정대로 가는지
   - 시트 손잡이는 `DraggableSheet`를 쓰는 화면이 없어 화면에서 안 보인다 — `sheets-not-draggable`이 서야 볼 수 있다
   - iOS Expo Go는 SDK 57을 못 띄워 개발 빌드가 필요하다
3. **디자인 결정(사람).** [`error-screen-design`](backlog.md) — `AppUnavailable`의 생김새는 `RetryScreen`을 빌린 임시 꼴이다.
4. **판정 대기는 그대로다.**
   - [`sheets-not-draggable`](backlog.md) — 화면 시트 15곳이 끌어 닫기 없는 `SheetLayer`를 쓰고 손잡이를 단 `DraggableSheet`는 쓰는 곳이 0이다. 시트를 끌어 닫게 바꿀지, 손잡이만 그릴지
   - [`query-failure-reaches-the-screen`](backlog.md) — 화면 일곱(adminHome·profile·wages·membersPending·blocked·left·종 점)의 읽기 실패가 정본에 없다. wages는 실패하면 스켈레톤이 끝없이 돈다. 빈 `.catch` 여섯도 같은 판정을 기다린다 — 그래서 그 검사를 안 켰다
   - [`canon-and-code-divergence-fixes`](backlog.md) — 판정 일곱, 추천은 행에 있다
   - [`day-sheet-missing-day-is-not-failure`](backlog.md) · [`payroll-screen-duplicates-fragment-state`](backlog.md) · [`dto-derives-from-generated-types`](backlog.md) — 각 행이 판정 하나씩을 든다
   - [`attendance-checkin`](backlog.md) — 사람 손이 닿는 문(NCP 대표 계정과 지도 키)이 먼저다
   - 어제 나온 판정 후보 넷 — [`requests-closed-30-days`](backlog.md)(문서를 코드의 `closed_at is null`에 맞출지) · [`monthly-assignment-count-canon`](backlog.md)(한 달 배정 수 341·600쯤·천쯤 셋을 하나로) · [`runtime-unbounded-keys-table`](backlog.md)(`runtime.md`의 「전체를 읽는 키는 셋」이 코드와 안 맞는다) · [`my-reads-filter-by-profile`](backlog.md)(관리자가 근무자 화면을 쓰는지 미확인)
5. **결정 없이 할 후보.** 어제 넷이 닫혔다([docs/log/2026-10-19.md](log/2026-10-19.md)). 남은 것은 테스트 셋이다 — [`default-wage-side-effect-lock`](backlog.md)(`set_default_wage`가 승인자 전원에게 오늘 행을 넣어, 잠금 밖에서 행 수를 세는 테스트가 동시 회차에 흔들린다) · [`blocked-guard-coverage`](backlog.md)(`is_approved()`의 `blocked_at` 조건과 `set_default_wage`의 `blocked_at is null` 갈래를 지키는 테스트가 없다) · [`e2e-comment-blocked-user`](backlog.md)(`members-pending.yaml` 머리말이 옛 차단 헬퍼 꼴을 적는다). [`e2e-seed-cleanup`](backlog.md)은 기기 빌드가 서야 검증할 수 있어 기다린다. [`attendance-column-label`](backlog.md)은 `attendance-excuse`가 서야 풀린다.

## 재개 맥락

**로그인 흐름은 lib · service · controller 셋이고 취소는 실패 줄을 안 낸다.** `features/auth/lib/signInWithGoogle.lib.ts`가 창을 열고 돌아온 주소에서 코드를 꺼내 `handleAuthCallback`으로 잇고, service가 `decideEntry`까지 가서 `decided`·`cancelled`·`failed`로 알린다. 버튼 톤은 `dark:` 변형으로 둘을 다 그려 하나만 보인다. `auth/callback` 딥링크는 `src/app/+native-intent.ts`가 `/login`으로 돌린다. 문안 「로그인하지 못했어요. 다시 눌러 주세요」는 아직 「제안」이다.

**테마는 OS 값을 직접 읽어 `light`나 `dark`로만 넣는다.** `ThemeColorScheme`에 `null`이 없다. react-native-css의 `Appearance` 리스너가 먼저 걸리고 `followOsColorScheme`가 `_layout.tsx`의 effect에서 나중에 걸려 같은 이벤트에서 고른 테마로 다시 적용한다 — 순서는 소스로 읽었고 기기로는 못 봤다. `logic` 프로젝트에서 `react-native` 대역은 구현의 import에 안 닿는다([관찰 072](observations/archive/072-react-native-mock-misses-in-logic-project.md), 정의문과 execution에 반영). 실제 모듈을 import해 `Object.assign`으로 갈거나 `tests/setup/appearance.ts`의 `stubAppearance`를 쓴다.

**기존에 남아 있던 두 위험도 그대로다.** `scheduleAdmin`의 조각 열둘이 `DayDetailPositionRow`(`screens/scheduleAdmin/model/dayDetail.type.ts`) 때문에 `features` 슬라이스 셋(`adjustment`·`scheduleAssign`·`scheduleConfirm`)을 당겨 못 내려간다. 통계 화면이 같은 달의 급여를 두 경로(차트 집계와 조각의 `empty` 판정)로 계산한다 — `TrendChart`를 조각으로 올려야 풀린다. 신분은 이제 아래로 흐른다 — 통계·급여 조각 훅은 `profileId`를 인자로 받고 화면 controller(`useStatsScreen`·`usePayrollScreen`)가 `useMyStanding`으로 한 번 읽어 심는다. 통계 화면은 `identity`(`pending`·`failed`·`absent`·`ready`)로 자리를 가른다.

**1000행 넘게 쌓이는 표는 `shared/api/readAllPages.ts`로 읽는다.** `getWageRates`·`getPayrollMonth`·`getMonthAvailabilities`·`getMonthAttendance`의 `check_ins`가 쓴다. 페이지 사이에 행이 흔들리지 않게 정렬 키를 고정해야 한다. **`max_rows`(1000)는 응답 합이 아니라 맨 위 결과에 한 번, 부모 행 하나의 임베딩 배열에 한 번씩 따로 걸린다** — 근무표 한 달은 임베딩 합이 천을 넘어도 안 잘려 `readAllPages`를 안 쓴다(`runtime.md` 「읽기 범위」). 감사는 읽기 서른넷에서 끝났다. `claim_notifications`는 한 번에 오래된 500행만 잡고, 그 너머는 매분 `retry_push` 회차가 나눠 잡는다. 동시 호출이 서로 다른 행을 잡는 것은 integration이 연결 둘로 증명한다.

**움직임 줄이기는 `shared/lib/reduceMotion.lib.ts`의 `trackReduceMotion`이 처음 부를 때 `reduceMotionChanged` 구독을 한 번 걸고 떼지 않는다.** `useReduceMotion`이 모듈이 기억한 마지막 값으로 시작하고 읽기 전과 실패는 줄이기(참)다. 이벤트 뒤에 풀린 읽기는 마지막 값을 덮지 않는다. 이징은 `shared/lib/motionEasing.lib.ts`의 `EASE_OUT`(`Easing.bezier(0, 0, 0.2, 1)`) 하나고 125ms는 `shared/consts/motion.const.ts`의 `DURATION_FAST_MS`가 든다. `Rise`·`PressScale`은 `ReduceMotion.Never`고 `Segment`·`Draggable`은 OS 설정이 켜지면 건너뛴다. 상수는 `tests/lint/motionTokens.ts`가 `tokens.md`와 값으로 대조한다.

**`PressScale`은 래퍼 없는 `Animated.createAnimatedComponent(Pressable)` 하나다.** `className`이 눌림 transform을 받는 요소에 그대로 닿는다. `style`은 `StyleProp<ViewStyle>`이라 함수 꼴을 못 받는다. Button이 그 안에 서서 `disabled || loading`이면 줄지 않고, Skeleton은 `reduceMotion` prop 없이 `useReduceMotion()`을 스스로 읽고, 빛 줄은 `shared/hooks/useSkeletonShimmer.ts`가 덩이 폭을 `onLayout`으로 재서 1.6초(`SHIMMER_INTERVAL_MS`) linear로 흘린다. `Skeleton`이 덩이에 언제나 `onLayout`을 달아 동작 줄이기가 켜진 채 마운트돼도 폭을 재 두므로 설정이 꺼지면 바로 흐른다.

**reanimated mock의 `Easing`은 가짜라 `tests/setup/reanimatedCalls.ts`가 실물 `react-native-reanimated/src/Easing`을 끼운다.** `lib/module` 경로는 ESM이라 components 갈래가 vm-modules로 돌 때 못 읽는다. 이징을 단언하는 테스트는 이 setup을 지난다.

**「오늘」은 `entities/clock/hooks/useServerToday.ts`가 `useServerNow`에서 뽑은 KST 날짜 문자열이고 `kstToday`는 없다.** controller 여덟이 부르고 entities의 `useScheduleAgenda`·`useDaySheet`는 `today`를 입력으로 받는다(같은 층의 `entities/clock`을 당길 수 없다). 날수 셈은 `shared/utils/kstDate.ts`의 `daysUntil`이 든다. 마감 줄 문장은 정본이 둘로 박아 `deadlineLine`과 `applicationsDeadlineLine`을 합치지 않는다. `deadlineLine`은 `today` 날짜 문자열을 받는다.

**프로필 질의 이름이 뒤집혔다.** `useMyProfileQuery`는 `Profile`을, 연락처를 합친 `MyProfile`은 `useMyProfileWithContactQuery`가 낸다. 문서에 옛 이름이 남은 자리는 대부분 기록이다.

**테스트 대역은 실물 서명으로 적는다.** 이름 붙은 상수는 `typeof`로도 남는 필드가 안 잡혀서 빌더와 상수에 반환 타입을 달았다. 상수 전체에 표기를 붙일지는 `fixture-constants-typed`가 든다. 계획이 센 수는 grep이면 하한이다(관찰 075).

**통합 테스트는 병렬 워크트리에서 믿기 어렵다.** 공유 로컬 DB에 다른 워크트리의 마이그레이션이 먼저 올라가 있으면 `migration up`이 멈춘다. 그때는 jest만 돌리고 PR에 적는다. 시작 전에 globalSetup이 붙을 곳이 이 저장소의 로컬 Supabase인지 보고 원격·LAN URL이면 하나도 안 돌린다 — 기기용 LAN 주소를 넣은 셸이면 `EXPO_PUBLIC_SUPABASE_URL`을 비우고 돌린다. 가입 헬퍼가 만든 사용자는 파일이 끝날 때 지워지고, 중단한 회차가 남긴 것은 `pnpm test:purge`가 6시간 뒤에 치운다. 달·연도는 `freshMonth`·`freshYear`로 비었는지 세어 고르고, where 없는 `delete from`은 `tests/lint/unscopedDelete.ts`가 문다. watchman이 파일을 다시 수집하면 jest가 조용히 0건을 내고, 새 worktree의 첫 실행은 3분쯤 매달린다(`pnpm test -- --no-watchman`, `--`가 빠지면 0.2초에 출력 없이 끝난다). 둘 다 판정이 `docs/4-test/execution.md` 「돌릴 때」에 선다.

**`as`는 `memberOf`가 만든 가드 한 자리로 모인다.** 실행 코드의 `as`는 셋(Expo Router `Href` 둘과 동작이 바뀌어 안 건드린 하나)이다. 가드를 만들어 돌려주는 고차 함수는 반환 타입이 함수 타입이라 규칙 47의 밖이고, 이름 없는 인라인 가드도 밖이다.

**규칙 15가 새 함수마다 짝 테스트를 먼저 요구한다.** 구현자는 테스트를 못 쓰니 막힌 자리는 리턴에 적고, 작성자가 짝을 먼저 세운 뒤에 옮긴다 — 일곱이 그렇게 `model`로 갔다(#564). 새 폴더를 `src/` 아래 두면 `scripts/syncEdgeShared.mts`의 `FOLDERS`를 먼저 본다.

**규칙 45는 읽기 상태 어휘로 문다.** 글자 하나라도 어휘에 들면 `flat`이다. 묶음 여섯이 닫힌 지금 중첩 삼항의 남은 셋은 `fragmentOf`가 `failed` 가지를 강제한 손으로 세운 판별 union이라 맞는 자리다.

**구현자 시간은 리턴의 벽시계 초로 잰다.** 측정이 둘이다 — 55분(되돌림 18분)과 804초(되돌림 0회). 세 묶음쯤 쌓이면 「검증을 CI에 맡길까」를 수로 정한다. 계획이 센 수는 그 수를 내는 스크립트가 함께 있어야 한다(관찰 071).

**jest는 워커 셋, `waitFor`는 5초다.** `jest.config.js`가 `maxWorkers: 3`·`workerIdleMemoryLimit: "512MB"`를 들고 전체가 47초다. `tests/setup/asyncUtilTimeout.ts`는 `configure`를 `build/config`에서 당긴다 — 입구에서 당기면 `tests/lint`가 실행마다 다른 자리에서 깨진다.

**조각의 세 질문과 세 분기가 `shared`의 손 둘에 산다.** `fragmentOf`는 읽기 하나나 튜플을 받고 `empty`의 선택성을 오버로드 넷으로 담는다 — `failed`와 `emptyValue`는 무인자 값 콜백이라 `retry`와 `reason`을 호출부가 클로저로 담아 온다. 가름의 순서는 `error` → `data === undefined` → `empty` → `ready`고 **`error`가 있으면 `data`가 와 있어도 `failed`다.** `FragmentView`는 가지 순서를 `ready` → `failed` → `empty`로 두어 남는 것이 `pending`이다 — 닿지 않는 기본 분기가 없다.

**공용 손을 Controller 타입으로 쓰면 규칙 45가 꺼진다.** `house/fragment-state-contract`가 별칭의 annotation이 `TSUnionType`이나 `TSTypeLiteral`일 때만 가지를 본다. 그래서 **Controller 타입은 파일마다 인라인 union으로 남기고 손은 값만 만든다.** 그 규율을 `house/controller-type-not-generic`(46)이 지킨다 — 가름이 「타입 인자가 붙었나」라서 한 파일의 AST로 끝난다. 타입 인자 없는 맨 이름 별칭(`= MemberWaitRowsController`)은 통과한다.

**`.tsx` 둘은 손을 안 쓴다.** `entities/member/ui/MemberRows.tsx`는 `empty` 가지에서 `reason`에 따라 주변 UI를 같이 그릴지 가르고, `entities/profile/ui/ProfileCard.tsx`는 조기 반환이 아니라 부분만 가른다.

**정본에서 떨어진 조각 자리가 하나 남아 있다.** `screens/payroll/hooks/usePayrollScreen.ts:74`가 조각들과 같은 질문 넷을 묻는데 **4겹 삼항**이고, 타입이 판별 union이 아니라 **납작한 글자 union**이며, 이름이 `pending`이 아니라 **`loading`**이다. 규칙 45가 못 잡는 까닭은 그 별칭이 `*Controller`가 아니라 `PayrollListState`라서다. `payroll-screen-duplicates-fragment-state`가 그 자리를 든다.

**빠짐을 막는 검사가 저장소에 0건이다.** 생성된 DB 타입 밖에 `never`로 막은 자리가 없다. 나란한 `if`로 union을 가르면 가지가 늘 때 마지막 `return`이 조용히 받는다 — 지금은 `ready`가 데이터를 들어 타입이 대개 잡지만, 데이터 없는 가지를 더하면 안 잡는다.

**가름의 축이 「무엇을 아는가」다.** 베껴 선언한 타입도 아는 것이고, 인자는 그 타입을 당길 때만 셈이고, 화면 문안을 내면 그 화면을 아는 것이고, 조각이 호출부와 맺는 props 타입(투영)은 베낀 것이 아니고, 인자가 평평해도 그 값이 한 자리에서만 오면 거기를 아는 것이다. 조항 전부가 [ADR-016](2-design/adr/ADR-016-fragments-own-their-data.md)에 섰다. [ADR-015](2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 세그먼트 열에는 비동기만으로는 `lib`이 아니라는 것과, 받은 손을 순서대로 부르는 것은 controller의 일이라는 것이 더해졌다.

**조각 controller의 상태는 판별 union 하나, 이름은 넷(`pending`·`failed`·`empty`·`ready`)과 쓰는 중 하나(`sending`)다.** 실패는 `failedLine: string | null`이다. 본보기는 `features/stats/hooks/useStatsAttendance.ts`, 규칙은 `house/fragment-state-contract`(45)가 지킨다.

**controller 공용 훅 다섯이 섰다.** `useServerNow`(`entities/clock`)·`useToast`(`shared/hooks`, `{ kind, message } | null`)·`useMonthCursor`(`shared/hooks`)·`useMyStanding`(`features/auth`)·`useCloseSheetOnSuccess`(`shared/hooks`). 토스트 `kind`는 「해냈나」로 가른다 — 끝낸 일을 알리면 `success`, 안 됐거나 그냥 알려주면 `info`다. `kind`를 단언하는 테스트가 없던 자리라 바뀌는 날 조용히 틀릴 수 있으니 고칠 때 `toast?.kind`도 같이 본다.

**mutation의 `onSuccess` 뒤처리는 둘로만 모인다.** 키 하나면 그 프로미스를 그대로 돌려주고, `staleTogether` 루프는 `Promise.all`로 함께 기다린다. 사용자가 누르는 「다시」(`refetch`)는 이 축 밖이고 규칙(`house/mutation-settle-shape`, 41)도 `onSuccess` 안만 본다.

**경로 글자는 `shared/consts/navigation.const.ts` 한 집이다.** `house/no-route-path-literal`(44)이 `src/app/` 밖의 경로꼴 리터럴을 막는다. `"/"` 하나는 경로인지 구분자인지 AST로 못 갈라 기계가 못 막는다 — `resolveAdminGuard.policy.ts`의 `AdminGuardMove`가 그 자리고 사람이 본다.

**검사 번호가 51까지다** — 51(`house/typed-mock-fn`)은 `jest.fn`의 타입 인자가 함수 타입이고 그 안에 `unknown`이 있으면 문다 — 대역은 `jest.fn<typeof 실물>()`로 적고 실물은 `import type`으로 당긴다. 48(`type-file-no-runtime`)은 `.type.ts`·`.dto.ts`의 런타임 선언을, 49(`services-no-hooks-import`)는 services가 hooks를 당기는 것을, 50(`hooks-export-use-only`)은 `hooks/`의 `use*`가 아닌 export를 문다. 접미사가 제 세그먼트에 사는지(`fileNaming`)와 문서의 검사 수(`docCounts`)는 `tests/lint/`가 센다. 47(`house/type-guard-name`)은 반환 타입이 서술어인 함수의 이름이 `is`로 시작하게 문다. **하나를 켜려면 한 커밋에 다섯 자리를 건드린다** — `eslint-rules/<이름>.mjs`·`index.mjs`·`eslint.config.mjs`·`tests/lint/rules.ts`·`docs/4-test/execution.md`. 베낀 도메인 꼴을 막는 검사는 못 세웠다 — ESLint가 파일 하나의 AST만 보고 `tests/lint/`로 재도 거짓 양성이 안 사라진다(규칙 3이 import를 막아 베낄 수밖에 없는 자리가 대부분이었다).

**CI가 job 넷(`checks`·`bundle`·`db`·`secrets`)으로 병렬이다.** `impact.yml`이 PR 본문의 「영향 확인」만 따로 보고, `db`는 `api/`에 안 닿는 변경이면 건너뛴다. 생성 타입 대조가 `database-types.ts`(없는 경로)를 보던 죽은 게이트였던 것을 고쳐 `databaseTypes.ts`를 본다. **브랜치 보호의 필수 검사는 `ci`와 `impact` 둘이다** — 영향 확인 절이 없는 PR은 merge되지 않는다.

**`grep` 한 줄로 셀 때 여러 줄 import·여러 줄 타입 선언 안의 이름이 안 보인다.** 이번 회차에 다섯 번 틀렸다. 경유지·이름으로 파일을 먼저 찾고(`grep -rl`) 그 파일을 열어 세는 쪽이 맞다.

**죽은 export는 `tests/lint/deadExports`가 센다.** 테스트만 당기는 `src` 파일은 열린 backlog 행이나 열린 관찰의 이름을 단 면제 표에 있어야 하고, 행이 닫히면 면제가 빨개진다. **빈 `.catch` 여섯은 검사가 없다** — `query-failure-reaches-the-screen`의 판정이 서야 켠다.

**`.api.ts`는 통신 함수와 `DB`만 내고 service는 도메인 타입을 안 든다.** 도메인 타입은 `model/<슬라이스>.type.ts`, 통신이 받는 의존성은 `.dto.ts`에 산다. 에러 클래스는 `shared/model/errors.ts`에 산다.

**로그아웃은 권한을 요청하지 않고 토큰을 읽어 지운다.** 세션 읽기 실패는 `/retry`로 가고 캐시가 있는 실패는 옛 값으로 판정한다(`failed`가 `error !== null && profile === undefined`).

**본보기 셋.** 쓰기 조각은 `features/memberAdmin/{ui/MemberSheet.tsx, hooks/useMemberSheet.ts}`. 읽기 조각은 `entities/payroll/hooks/useWageRows.ts`(상태 이름)와 `features/stats/hooks/useStatsAttendance.ts`(판별 union). 경계는 `shared/ui/QueryBoundary.tsx`다.

**옮기지 않기로 한 것들.** `useDayDetail`의 mutation 아홉은 `pick → commit → pending → run`을 지나 조각 하나로 못 접힌다. `pending`의 폼 로직은 형제 셋이 같은 상태를 읽어 아무도 혼자 못 가진다. `adjustSheetRows.utils.ts`·`stats/utils/chartValues.utils.ts`는 `features` 둘을 당겨 규칙 3이 양쪽을 막아 `screens`에 머문다.

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시키고, spec이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다. backlog 행이 「미작성 — 행이 완료 조건이다」인 task는 plan을 먼저 써야 `src/`가 열린다(관찰 067, 열림 — 056과 함께 `.claude/hooks/spec-gate.py`를 target으로 든 관찰이 둘이라 증축 문턱 셋에는 아직 못 미친다).

**`backlog.md` 행 본문에 `|`를 쓰지 않는다.** `tests/lint/backlogIds.ts`의 `cells`가 `.split("|")`로 쪼개 escape를 모른다.

**Edge Function을 타입 검사하는 자리가 없다.** Deno 런타임이라 `tsconfig.json`이 `exclude`하고 CI에 Deno가 없다. `erase-account`·`import-holidays`가 섰고 `send-push`가 셋째다.

**TDD·spec 훅은 Bash로 쓰는 정해진 꼴(리다이렉션·`tee`·`sed -i`·`cp`·`mv`·`touch`)도 본다.** 인터프리터가 쓰는 파일(`python3 - <<EOF`·`node -e`)과 `git mv`·`ln`·`cp -r`은 못 본다. Bash에서는 내용을 모르므로 새 파일은 경로 기준으로 짝 테스트를 요구하고 타입·상수만 담을 파일은 Write로 쓴다. 판정은 `docs/4-test/execution.md` 「훅」에 선다. `internal` 함수는 PostgREST 라우팅과 스키마 USAGE에 더해 `PUBLIC` 실행 권한도 걷혔다(#582). 새 `internal` 함수는 같은 마이그레이션에서 `revoke execute on function internal.<이름> from public`을 두고, 빠지면 `internalGrants` integration이 빨개진다 — 글로 적을지는 `internal-function-revoke-rule`이 든다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e·Suspense), NCP 대표 계정과 지도 키, 3D 석 장, 로컬 Supabase 구글 프로바이더.

회차 기록은 [docs/log/2026-10-19.md](log/2026-10-19.md)다 — 통계 다시 시도가 신분을 되살리고 옛 profile과 차단 픽스처와 기본 시급 잠금이 정리됐다(#617·#618). 그 앞은 [docs/log/2026-10-18.md](log/2026-10-18.md)다 — 설정값이 빠진 빌드가 한 장을 그리고 훅이 Bash 쓰기를 보고 integration이 자기 데이터를 치운다(#602~#615). 그 앞은 [docs/log/2026-10-17.md](log/2026-10-17.md)다 — 푸시 대기열 상한과 흐르는 스켈레톤 빛 줄(#595~#601). 그 앞은 [docs/log/2026-10-16.md](log/2026-10-16.md)다 — 읽기 상한 감사가 끝나고 「오늘」이 서버 시각이 되고 모션 정본 후속이 코드로 내려갔다(#590~#593). 그 앞은 [docs/log/2026-10-15.md](log/2026-10-15.md)다 — 1000행 상한과 `internal` 권한이 닫히고 로그인 등장 모션이 섰다(#579~#588). 그 앞은 [docs/log/2026-10-14.md](log/2026-10-14.md)다 — 로그인 화면과 구글 흐름이 서고 시스템 테마가 OS 다크를 따르게 됐다(#572~#576). 그 앞은 [docs/log/2026-10-13.md](log/2026-10-13.md)(감사 묶음 여덟과 발견 둘, #551~#570)이고 그 앞은 [docs/log/2026-10-12.md](log/2026-10-12.md)(선언형 묶음 여섯과 구현자 시간 측정, #537~#549)와 [docs/log/2026-10-10.md](log/2026-10-10.md)(리팩터링 묶음 여덟, #516~#528)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
