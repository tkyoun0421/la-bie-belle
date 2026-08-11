# P0-T45 RADIO 적용 기록

- 대상 RADIO: `docs/execution/radio/P0-T45-radio.md` revision 4
- 승인 SHA-256: `0084c924676ccf12804eecf565d22026944ffca1c84c5a055f978d80608b5762`
- 개발 세션 기준 시각: 2026-08-11
- 상태: 완료. 인수 조건 9건 전부 충족, 교차 검증 확정 10건 중 이번 라운드 대상 5건(F-01~F-05) 해소, `pnpm verify` GREEN.

## revision 1 → 4, 재봉인 세 번의 경위

구현 중 두 번 멈춰서 질문했고(revision 1→2, 2→3), 이후 교차 검증 결과로 한 번 더 재봉인됐다(revision 3→4, 질문 없이 사용자가 수정 범위를 지정). 재발 방지로 경위를 남긴다.

### revision 1 → 2: 허용 경로 누락

착수 전 RADIO 전문을 인터뷰 문서와 대조하던 중, 인수 조건 3("전체 탭에서 예상급여·내 정보·관리자 화면으로 들어갈 때 새 화면이 아래에서 올라온다")을 실행하려면 `src/views/more/**`(`MoreView.tsx`의 세 링크)와 `src/views/home/**`(`HomeView.tsx`의 일정 CTA)를 고쳐야 하는데, revision 1의 「변경 허용 경로」에 두 세그먼트가 빠져 있었다. 구현을 시작하지 않고 질문으로 반환했고, revision 2가 두 경로를 추가해 재봉인됐다.

### revision 2 → 3: reduced-motion 페이드 지속시간이 봉인 규칙 두 개와 충돌

인수 조건 6("reduced-motion에서는 미끄러지거나 올라오는 움직임이 사라지고 짧은 페이드만 남는다")을 e2e로 검증하려고 `document.getAnimations()`로 실제 재생 중인 애니메이션을 찍었더니, reduced-motion에서 페이드까지 함께 사라졌다. 원인은 내 reduced-motion CSS가 `var(--duration-feedback)`을 참조했는데, P0-T43이 이미 같은 미디어 쿼리에서 그 토큰을 포함한 시간 토큰 4종 전부를 `0ms`로 덮고 있었기 때문이다(`globals.css:314`, `globals.test.ts:226-235`가 그 사실을 단언 중이었다). "레시피의 시간 값은 P0-T43 토큰만 쓰고 새 토큰을 만들지 않는다"는 불변 규칙과 "reduced-motion에서도 페이드는 남는다"는 인수 조건 6이 동시에 성립할 수 없는 상태였다. 리터럴 값(`150ms`)으로 바꾸면 즉시 고쳐지는 것을 검증만 하고 되돌린 뒤 질문으로 반환했다.

사용자 결정은 리터럴이 아니라 전용 토큰 신설(`--duration-crossfade`)이었다 — 리터럴은 `--duration-feedback`이 나중에 바뀌어도 따라가지 않아 조용히 어긋나고, P0-T44에서 이미 같은 종류의 문제를 리터럴이 아니라 재봉인으로 토큰을 넣어 풀었던 선례가 있었기 때문이다. `--duration-feedback`을 reduced-motion에서 살리는 대안은 배제됐다 — 그 토큰을 `button.tsx`·`chip.tsx`·`schedule-row.tsx`·`PullToRefresh.tsx`가 함께 쓰고 있어, 되살리면 완료된 P0-T43·P0-T44의 눌림 반응이 네 군데에서 함께 되살아나기 때문이다. revision 3이 `--duration-crossfade` 신설과 "reduced-motion에서 0으로 덮지 않는 유일한 시간 토큰"이라는 규칙을 추가해 재봉인됐다.

### revision 3 → 4: 교차 검증 수정 라운드

revision 3 봉인 커밋(`610dfbf`) 이후 교차 검증(opus·codex)이 자동으로 돌아 확정 10건(high 4·medium 4·low 2), 종합 78점, `critical` 없음을 냈다. 사용자가 이 중 F-01~F-05(high 4건 + MUST 위반 medium 1건) 다섯 건만 이번 라운드 범위로 정했고, F-06~F-10은 backlog로 명시적으로 미뤘다. revision 4가 불변 규칙 두 줄("애니메이션 CSS는 스킬 레시피를 복사하되 상위 문서가 이긴다", "애니메이션 대상은 transform과 opacity뿐이다")과 화면 전환 220~280ms 대역을 추가하고, `notifications/page.tsx`의 「용도 한정」을 "이미 있는 이동에 전환 타입을 붙이는 것"까지 열어 재봉인됐다.

## 교차 검증 수정 라운드(revision 4) — F-01~F-05

### F-01 · 탭 밖 이동 셋에 전환 타입이 없었다

`HomeView.tsx`의 confirmation-change·next-shift 두 분기가 각각 렌더하는 `/schedule/${date}` 링크(레이블 "확인하기"·"상세 보기")에 `transitionTypes={["nav-forward"]}`를 붙였다. `notifications/page.tsx`의 `router.push`는 `startTransition` 콜백 안에서 `addTransitionType?.("nav-forward")`를 먼저 호출한 뒤 실행하도록 감쌌다 — 목적지를 고르는 삼항식(`item.target.screen === "schedule-detail" ? ... : "/pay"`)은 한 글자도 바꾸지 않았다. revision 4가 「용도 한정」을 "이미 있는 이동에 전환 타입을 붙이는 것"까지 넓혀 둔 덕에 이 지점이 허용 범위 안에 들어왔다.

새 e2e 두 건(전체 화면 목적지 셋, 알림 목록 → 예상 급여)과 `HomeView.test.tsx`의 컴포넌트 테스트 두 건으로 덮었다 — HomeView의 두 분기는 `page.tsx`가 `confirmationChange: null, nextShift: null`을 하드코딩해 프로덕션에서 e2e로 도달할 경로 자체가 없어(F-03 조사 중 확인), `next/link`를 목으로 바꿔 `transitionTypes`를 `data-transition-types` 속성으로 노출한 뒤 단언했다.

### F-02 · 전환 총 시간이 400ms였다

`FOUNDATIONS.md:120`(L2 제품 문서, RADIO보다 상위)이 "바텀시트·화면 전환"을 220~280ms로 정한다. 고친 전 상태는 탭 전환 기준으로 옛 화면 200ms 소멸과 새 화면 200ms **지연 후** 200ms 등장이 이어져(`animation: ... 200ms both route-fade;`에 `--duration-crossfade`만큼의 delay가 걸려 있었다) 끝나는 시점이 400ms였다. 슬라이드 경로(`route-slide-up`/`route-slide-down`)도 같은 지연 구조였다.

고친 방식은 지연을 없애 옛 화면과 새 화면의 페이드를 동시에(겹쳐서) 재생하는 것이다 — 순차 크로스페이드에서 동시 크로스페이드로 바꿨다. `--duration-crossfade` 값은 `200ms`에서 `250ms`로 올렸다. 근거는 다음 두 가지이며, 스킬 레시피의 `--duration-enter`(210ms)는 근거로 쓰지 않았다(지난 라운드에서 바로 이 근거를 들었다가 F-02로 지적받았다):

1. `FOUNDATIONS.md:120`의 220~280ms 대역 안에 있어야 한다.
2. `--duration-overlay`(250ms)가 이미 존재하는 토큰이고, F-02 원문이 직접 "이 대역에 맞춰 만들어진 토큰"이라고 짚었다 — 새 리터럴을 대역 안 아무 값이나 골라 넣는 대신, 이미 같은 대역을 위해 만들어진 기존 토큰의 값을 재사용해 값의 출처를 하나로 좁혔다.

세 전환 종류 모두 끝나는 시점을 다시 계산했다(모두 `--duration-crossfade`=250ms, `--duration-overlay`=250ms, `--duration-feedback`=150ms, 지연 없음 기준):

- **탭 페이드**(`route-fade-out`/`route-fade-in`): 양쪽 다 250ms, 동시 시작·동시 종료 → 끝나는 시점 **250ms**.
- **상세 진입 슬라이드업**(`route-fade-out` + `route-slide-up`): 나가는 화면 페이드 250ms, 들어오는 화면은 페이드 250ms와 이동(`--duration-overlay`) 250ms가 지연 없이 동시 재생 → 끝나는 시점 **250ms**.
- **뒤로 가기 슬라이드다운**(`route-slide-down` + `route-fade-in`): 나가는 화면은 페이드 250ms와 이동(`--duration-feedback`) 150ms가 동시 재생(둘 중 긴 쪽 250ms), 들어오는 화면 페이드 250ms → 끝나는 시점 **250ms**.

세 경로 모두 220~280ms 대역 안이다. 이동(`route-slide-y`) 쪽 지속시간은 이번 라운드에서 건드리지 않았다 — F-02는 "끝나는 시점"만 문제 삼았고, 페이드의 지연을 없애는 것만으로 세 경로 전부가 대역에 들어왔다.

### F-03 · e2e가 위험 표에서 "테스트함"으로 선언한 경로를 안 돌았다

`tests/e2e/tab-navigation.spec.ts`에 다음을 추가·확장했다:

- **탭 페이드**: 홈→일정 한 쌍만 보던 것을 홈→일정→알림→전체→홈 네 쌍 전부로 넓혔다.
- **슬라이드 목적지 셋**: 전체 탭의 예상급여·내 정보·관리자 링크로 각각 이동하며 `::view-transition-new`에 페이드·슬라이드가 함께 걸리는지 확인한다. 관리자 링크를 보려면 admin 역할이 필요해 `recruitment-manage.spec.ts`의 `createAdminSession` 패턴을 이 파일에 로컬로 복제한 `signInAdminWorker`를 새로 만들었다(기존 관례대로 스펙 파일 간 공유하지 않았다 — F-07이 지적하는 산재 문제와 같은 종류라 이번 범위 밖으로 남겼다).
- **알림 → 예상 급여**: 알림 목록에서 "예상 급여가 갱신됐어요" 행을 눌러 `/pay`로 이동하는 경로를 검증했다. 나머지 두 목 알림(`schedule-detail` 목표)은 `2026-08-09`라는 리터럴 날짜에 스케줄을 시딩해야 해 날짜 충돌 위험이 있어 피했다.
- **미지원 환경**: 탭 4개 왕복만 보던 것에 달력 셀 → 상세 진입까지 이어 붙였다 — `document.startViewTransition` 삭제가 하드 네비게이션(`page.goto`) 이후에도 유지되는지, 상세 화면이 API 없이도 정상 렌더되는지 함께 확인한다.
- **브라우저 뒤로 가기**: 인수 조건 4의 네 경우를 각각 별도 e2e로 만들었다 — 일반(전환이 끝나고 400ms 지난 뒤 뒤로 가기, 새 전환이 생기지 않는지 계수로 확인), 전환 도중(클릭 직후 URL이 상세로 바뀌는 것만 `page.waitForURL`로 확인하고 즉시 `goBack`), 진입 직후 즉시(상세 화면이 완전히 뜬 직후 지연 없이 `goBack`), 연타(`page.evaluate`로 `history.back()`을 동기 두 번 호출).

HomeView의 confirmation-change·next-shift 두 링크는 e2e로 도달 불가능해(위 F-01 절 참고) 컴포넌트 테스트로 별도 처리했다.

### F-04 · 진입과 복귀의 단언이 글자 그대로 같았다

`installViewTransitionSpy`를 다시 짰다. 이전엔 `window.__lastTransitionAnimations` 하나짜리 배열을 `transition.ready`가 비동기로 덮어썼고, 읽기가 그 비동기 완료와 동기화되지 않아 두 번째 읽기가 첫 전환의 값을 관측할 수 있었다. 지금은 `window.__transitionRecords: { done: boolean; animations: TransitionAnimation[] }[]`로 바꿔 `startViewTransition` 호출 시점에 자리를 동기적으로 예약하고(`index = records.length`), `transition.ready` 완료 시 그 자리만 채운다. 읽기 쪽 `readTransitionAnimations(page, index)`는 `page.waitForFunction`으로 해당 인덱스의 `done`이 `true`가 될 때까지 기다린 뒤 값을 가져온다 — 호출 직전에 잡은 인덱스로만 읽으므로 다른 전환의 값을 관측할 수 없다.

각 `TransitionAnimation`에 `animation.effect.pseudoElement`(`KeyframeEffect`로 캐스팅)를 읽어 `"::view-transition-old("`/`"::view-transition-new("` 접두어로 `side: "old" | "new" | "other"`를 함께 기록한다. 방향 단언을 새 화면(`route-slide-y`, `side: "new"`)과 옛 화면(`side: "old"`)으로 갈라, 진입은 `new`에서만 슬라이드가 양의 지속시간을 갖고 `old`에서는 0(또는 존재하지 않음)임을, 복귀는 반대임을 확인한다. `RouteTransition`의 `nav-forward`/`nav-back` 매핑을 서로 바꿔서 이 단언이 실제로 깨지는 것을 RED로 실측했다(아래 "F-04 회귀 재현" 참고).

### F-05 · `route-fade`가 `filter: blur()`를 애니메이션하고 있었다

`globals.css`의 `route-fade` 키프레임에서 `filter: blur(3px) → blur(0)`을 제거하고 `opacity`만 남겼다. `DEV-TOKEN-01`이 애니메이션 대상을 `transform`·`opacity`로 제한하는 MUST 규칙이고, `FOUNDATIONS.md:125`도 같은 제한을 명시한다. `::view-transition-old`/`::view-transition-new`는 화면 전체 스냅샷이라 블러가 화면 전체에 걸리는 문제였다. 스킬 레시피 원본엔 블러가 들어 있었지만 revision 4의 "상위 문서가 이긴다" 규칙에 따라 뺐다.

### F-04 회귀 재현

수정 전 스파이/단언 구조로는 `RouteTransition`의 `enter`/`exit` 매핑을 통째로 바꿔도(진입에 슬라이드 대신 페이드만, 복귀에 슬라이드를 얹는 식) 옛 단언(`route-fade > 0`, `route-slide-y > 0`을 방향 구분 없이 확인)이 그대로 통과했다. 고친 단언은 이 조작에 실제로 실패한다 — `route-transition.tsx`의 `enter`/`exit`를 서로 뒤바꾸고(`tab`도 함께: `route-fade-in` → `route-slide-up`) 빌드해 방향 테스트·슬라이드 목적지 테스트·알림 테스트·탭 페이드 테스트 4건이 한 번에 실패하는 것을 확인한 뒤 되돌렸다(RED→GREEN 타임스탬프는 `runs/P0-T45/tdd.json` 참고).

### backlog로 남긴 것

F-06(탭 바 격리 e2e가 격리 CSS를 관찰하지 않음)·F-07(전환 타입 리터럴 산재)·F-08(reduced-motion 정규식 과대 포착)·F-09(`--duration-crossfade` 존재 단언 부재)·F-10(`AppShellTabBar.tsx:33`의 도달 불가 분기)은 이번 라운드 범위 밖이다. `admin/page.tsx` 안의 5개 하위 링크(가입 승인·역할 관리 등)에 `transitionTypes`가 없는 것도 F-01~F-05 목록에 없어 손대지 않았다.

## 완료한 인수 조건

### 1. 호출 발동 (정지 조건)

최소 배치(`route-transition.tsx` 래퍼 + 홈·일정 탭 페이지 + `schedule/[id]` 페이지 + 달력 셀 클릭의 `startTransition`/`addTransitionType`)만으로 먼저 세우고, `tests/e2e/tab-navigation.spec.ts`의 호출 계수 e2e로 RED(래퍼 무력화 → 계수 0, P0-T43과 같은 실패 재현) → GREEN(복원 → 계수 증가)을 실측한 뒤에야 나머지로 넘어갔다.

### 2. 탭 이동

홈·일정·알림·전체 4개 탭 사이 이동은 `route-fade-in`/`route-fade-out`만 걸리고 `route-slide-y`는 걸리지 않는다. `document.getAnimations()`의 `effect.getComputedTiming().duration`으로 실측했다(단순히 애니메이션 "이름의 존재 여부"만 보면 0초짜리 애니메이션도 이름이 잡혀 오탐이 난다는 것을 첫 시도에서 확인하고 지속시간 비교로 바꿨다 — 아래 "테스트 기법 정정" 참고).

### 3. 탭 밖 진입

달력 셀 → 상세, 전체 탭의 예상급여·내 정보·관리자 링크 모두 `nav-forward` 태그로 `route-slide-up`이 걸린다. 상세 화면 안의 뒤로 가기 링크는 `nav-back` 태그로 `route-slide-down`이 걸린다. 두 방향 모두 `route-fade`와 `route-slide-y`가 동시에 양의 지속시간을 갖는 것을 e2e로 확인했다.

### 4. 브라우저 뒤로 가기

`popstate` 경로는 원래부터 이 task가 손대지 않는 플랫폼 제약이다. P0-T43이 남긴 회귀 테스트가 그대로 유지된다. F-03 수정 라운드에서 인수 조건 4가 나열한 네 경우(일반·전환 도중·진입 직후 즉시·연타)를 각각 e2e로 덮었다 — 자세한 내용은 "교차 검증 수정 라운드(revision 4)"의 F-03 절을 참고한다.

### 5. 탭 바 격리

`<nav>`에 `style={{ viewTransitionName: "persistent-nav" }}`, CSS에 `::view-transition-group(persistent-nav) { animation: none; z-index: 100; }`. 전환 전후 `boundingBox()`가 동일하고 `getComputedStyle(nav).viewTransitionName`이 `"persistent-nav"`임을 e2e로 확인했다.

### 6. 미지원과 reduced-motion

미지원 환경(`document.startViewTransition` 삭제)에서 탭 4개 왕복이 정상 렌더된다(P0-T43이 남긴 회귀 테스트). reduced-motion에서는 `route-slide-y`의 지속시간이 0(P0-T43의 기존 토큰 리셋이 그대로 적용)이고 `route-fade`는 양의 지속시간을 유지한다(`--duration-crossfade`가 리셋 대상에서 빠졌으므로) — "움직임은 사라지고 페이드만 남는다"는 요구를 CSS 캐스케이드만으로 만족한다. reduced-motion 전용 오버라이드 규칙은 필요 없어 넣지 않았다(아래 "구현이 RADIO 서술보다 단순해진 지점" 참고).

### 7. 겹침

전환 도중 다른 탭을 연속으로 누르면 마지막 요청 화면에 안착하고 이전 화면 헤딩은 사라진다. 같은 탭을 다시 눌러도 호출 계수가 늘지 않는다. 둘 다 e2e로 확인했다 — 다만 이 두 검사는 RED→GREEN 증거를 남기지 않았다(아래 "TDD 증거를 남기지 않은 두 검사" 참고).

### 8. 번들

최종 실측 503,070바이트(491.28KB), 상한 512,000바이트 대비 여유 8,930바이트(8.72KB). 최소 배치 직후 실측(503,070바이트)과 전체 배선 완료 후 실측이 동일하다 — CSS만 늘었고 `.next/static/chunks`의 `.js` 총량(gate:bundle이 재는 대상)은 변하지 않았다.

**교차 검증 수정 라운드(revision 4) 이후 재실측**: 503,097바이트(491.31KB), 상한 512,000바이트 대비 여유 8,903바이트(8.69KB). F-01이 `HomeView.tsx`의 `Link` 두 곳에 `transitionTypes` prop을 추가하며 27바이트 늘었다 — F-02·F-05는 `globals.css`만 바꿔 이 지표(`.js` gzip 합계)에 영향이 없다. `harness/lib/bundle-budget.ts`의 `measureStaticChunks(root)`로 `pnpm build` 직후 직접 실측했다(38개 청크, 최대 청크 73,292바이트).

### 9. 회귀

`pnpm test`(1338/1338), `pnpm exec playwright test`(61/61, `tab-navigation.spec.ts`의 기존 4건 포함) 전부 통과. `pnpm verify` 전체 GREEN.

**교차 검증 수정 라운드(revision 4) 이후**: `pnpm test`(1340/1340, `HomeView.test.tsx`에 2건 순증), `pnpm exec playwright test`(67/67, `tab-navigation.spec.ts`가 11건에서 17건으로 늘었다 — F-03이 새로 추가한 6건: 전체 화면 목적지 셋·알림→예상급여·뒤로 가기 네 경우). `recruitment-manage.spec.ts`·`recruitment-open.spec.ts`가 `work_date` 유니크 제약 충돌(23505)로 한 차례 실패했으나 이 task와 무관한 기존 시딩 데이터 잔존 문제였다 — `pnpm db:reset` 뒤 재실행해 67/67 전부 통과했다. `pnpm verify` 전체 GREEN.

## 테스트 기법 정정 — 애니메이션 "이름"이 아니라 "지속시간"으로 판정해야 한다

reduced-motion e2e를 처음 `names.not.toContain("route-slide-y")` 식으로 짰더니, reduced-motion에서도 `route-slide-y`라는 이름 자체는 `document.getAnimations()`에 여전히 잡혔다(지속시간 0인 애니메이션도 브라우저가 `Animation` 객체를 잠깐 만든다). 이름의 존재만 보면 "움직임이 사라졌다"를 오판한다. `animation.effect.getComputedTiming().duration`을 함께 읽어 0인지 양수인지로 바꾼 뒤에야 정확해졌다. `tab-navigation.spec.ts`의 `installViewTransitionSpy`가 `{name, durationMs}` 쌍을 기록하고 `durationOf()` 헬퍼로 비교한다.

## 구현이 RADIO 서술보다 단순해진 지점 — reduced-motion 전용 오버라이드가 불필요해졌다

revision 3 봉인 당시엔 reduced-motion에서 `route-slide-down`/`route-slide-up`에 페이드만 남은 별도 `animation` 선언을 오버라이드로 얹는 그림이었다(revision 2까지의 구현이 실제로 그렇게 되어 있었다). `--duration-crossfade`를 fade 쪽 지속시간·지연으로 전부 옮기고 나니, reduced-motion에서 `route-slide-y`의 지속시간(`--duration-feedback`·`--duration-overlay`, 둘 다 P0-T43이 0으로 덮는 토큰)만 자연히 0이 되고 `route-fade`는 그대로 재생된다 — 오버라이드 없이 캐스케이드만으로 "움직임 사라짐 + 페이드 유지"가 성립한다. 그래서 이전에 넣었던 `::view-transition-old(.route-slide-down)`/`::view-transition-new(.route-slide-up)`의 reduced-motion 오버라이드 두 규칙을 제거했다 — 남겨 뒀다면 죽은 코드였고, CSS 총량도 그만큼 줄었다(번들 여유에 유리한 쪽으로 작용).

`::view-transition-group(*) { animation-duration: 0s !important; ... }`(브라우저 기본 group 모프 애니메이션을 reduced-motion에서 죽이는 규칙)는 그대로 남겼다 — 이건 P0-T43 토큰과 무관하고, `route-fade`/`route-slide-y`와 다른 의사 요소(`::view-transition-group`)를 겨냥하므로 이번 정리와 별개다.

## 구현 세부사항과 RADIO 서술 사이 차이

- **`addTransitionType?.()` optional chaining**: `ScheduleView.tsx`에서 `addTransitionType("nav-forward")`를 그대로 부르면 Vitest(플레인 `react` 19.2.8, canary 아님)에서 `TypeError: addTransitionType is not a function`이 났다. Next의 클라이언트 번들은 canary를 alias하므로 프로덕션에서는 항상 존재해 옵셔널 체이닝이 아무것도 건너뛰지 않는다 — 테스트 환경 격차를 흡수하는 방어 코드이지 설계 변경이 아니라고 판단해 질문 없이 처리했다.
- **HomeView의 다른 두 `/schedule/${date}` 링크는 손대지 않았다**: RADIO Architecture 절이 "일정으로 가는 CTA 링크"(단수, deadline-application 분기)만 명시했고, 이는 인수 조건 2(탭 이동)에 해당한다. confirmation-change·next-shift 분기의 `/schedule/${date}` 링크는 상세로 바로 들어가는 이동이라 인수 조건 3(탭 밖 진입) 영역이며, RADIO Architecture가 이 두 링크를 언급하지 않아 손대지 않았다. 태그가 없으면 해당 두 링크는 브라우저 기본 전환(없음)으로 남는다 — 회귀는 아니지만 후속 검토 대상으로 남는다.
- **관리자 하위 라우트 6개 포함**: 최초 탐색에서 `admin/schedule/[id]`·`admin/workers/[id]`를 놓쳤다가 `pnpm build`의 라우트 목록에서 발견해 마저 감쌌다. `src/app/(protected)/**/page.tsx`는 15개 전부 래퍼로 감쌌다.
- **`--duration-crossfade` 값(최초 결정, 이후 교차 검증 F-02로 정정됨)**: 최초엔 `200ms`로 정했고, 스킬 레시피의 `--duration-enter`(210ms, `--duration-value` 매핑값)에 가장 가깝다는 것을 근거로 들었다. 이 근거가 잘못됐다 — 교차 검증 F-02가 지적한 대로 RADIO보다 상위인 L2 제품 문서(`FOUNDATIONS.md:120`)가 화면 전환을 220~280ms로 이미 정해 두었는데, 그 문서를 확인하지 않고 스킬 레시피 값을 근거로 삼았다. 정정된 값과 근거는 "교차 검증 수정 라운드(revision 4)" 절을 참고한다.

## TDD 증거를 남기지 않은 두 검사

인수 조건 7(겹침)의 "다른 탭 요청 시 마지막 화면 안착"과 "같은 탭 재클릭 시 계수 불변" 두 e2e는 GREEN만 기록하고 RED→GREEN 쌍을 만들지 않았다. 두 동작 모두 Next.js Router 자체가 보장하는 것(연속 push의 마지막 요청 우선, 동일 URL 재푸시의 no-op)이라 이 task가 작성한 코드에는 이를 구현하는 별도 로직이 없다 — 의미 있는 RED를 만들려면 실제로 있지도 않은 버그를 조작해서 만들어야 했다. 대신 나머지 4개 e2e(탭 페이드, 상세 슬라이드, 탭 바 격리, reduced-motion 페이드)는 전부 코드에 실재하는 지점(CSS 선언·`viewTransitionName` 유무)을 임시로 원상태로 되돌려 RED를 만들고 복원해 GREEN을 만드는 방식으로 진짜 RED→GREEN을 남겼다(타임스탬프는 `runs/P0-T45/tdd.json` 참고). `checkTddEvidence` 게이트는 task당 최소 1쌍만 요구하므로 이 두 검사가 게이트를 막지는 않는다.

## F-08 확인 결과 — 관찰된 왜곡 없음

`PullToRefresh`의 상시 `translateY(0px)`가 전환 스냅샷 기하를 어긋나게 하는지 실제 빌드에서 확인했다. 홈·일정·알림·예상급여 네 화면의 `RouterPullToRefresh` 하위 트리에는 `position: absolute`/`fixed` 자손이 없다 — 즉 이 transform이 컨테이닝 블록을 바꿔도 위치가 바뀔 자손 자체가 없다. `translateY(0px)`는 오프셋이 0이라 스냅샷 픽셀에도 영향이 없다. 스크린샷으로 네 화면의 탭 전환을 직접 확인했고, 전환 도중 캡처된 프레임은 있었지만(스킬 레시피 자체가 순차 크로스페이드라 옛 화면이 다 사라진 뒤 새 화면이 나타나는 구간이 있다 — 버그 아님, 레시피 그대로다) 레이아웃이 어긋나거나 잘리는 왜곡은 없었다. F-08은 이 task 범위에서 결정 신호로 반환할 사안이 아니라고 결론지었다.
