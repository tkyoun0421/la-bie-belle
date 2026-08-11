# P0-T45 RADIO 적용 기록

- 대상 RADIO: `docs/execution/radio/P0-T45-radio.md` revision 3
- 승인 SHA-256: `f954ee29aa1c798b2c6b927b594a6570a915465693f3d570fa736fd53f597dec`
- 개발 세션 기준 시각: 2026-08-11
- 상태: 완료. 인수 조건 9건 전부 충족, `pnpm verify` GREEN.

## revision 1 → 3, 재봉인 두 번의 경위

구현 중 두 번 멈춰서 질문했고, 두 번 다 사용자 결정으로 재봉인됐다. 재발 방지로 경위를 남긴다.

### revision 1 → 2: 허용 경로 누락

착수 전 RADIO 전문을 인터뷰 문서와 대조하던 중, 인수 조건 3("전체 탭에서 예상급여·내 정보·관리자 화면으로 들어갈 때 새 화면이 아래에서 올라온다")을 실행하려면 `src/views/more/**`(`MoreView.tsx`의 세 링크)와 `src/views/home/**`(`HomeView.tsx`의 일정 CTA)를 고쳐야 하는데, revision 1의 「변경 허용 경로」에 두 세그먼트가 빠져 있었다. 구현을 시작하지 않고 질문으로 반환했고, revision 2가 두 경로를 추가해 재봉인됐다.

### revision 2 → 3: reduced-motion 페이드 지속시간이 봉인 규칙 두 개와 충돌

인수 조건 6("reduced-motion에서는 미끄러지거나 올라오는 움직임이 사라지고 짧은 페이드만 남는다")을 e2e로 검증하려고 `document.getAnimations()`로 실제 재생 중인 애니메이션을 찍었더니, reduced-motion에서 페이드까지 함께 사라졌다. 원인은 내 reduced-motion CSS가 `var(--duration-feedback)`을 참조했는데, P0-T43이 이미 같은 미디어 쿼리에서 그 토큰을 포함한 시간 토큰 4종 전부를 `0ms`로 덮고 있었기 때문이다(`globals.css:314`, `globals.test.ts:226-235`가 그 사실을 단언 중이었다). "레시피의 시간 값은 P0-T43 토큰만 쓰고 새 토큰을 만들지 않는다"는 불변 규칙과 "reduced-motion에서도 페이드는 남는다"는 인수 조건 6이 동시에 성립할 수 없는 상태였다. 리터럴 값(`150ms`)으로 바꾸면 즉시 고쳐지는 것을 검증만 하고 되돌린 뒤 질문으로 반환했다.

사용자 결정은 리터럴이 아니라 전용 토큰 신설(`--duration-crossfade`)이었다 — 리터럴은 `--duration-feedback`이 나중에 바뀌어도 따라가지 않아 조용히 어긋나고, P0-T44에서 이미 같은 종류의 문제를 리터럴이 아니라 재봉인으로 토큰을 넣어 풀었던 선례가 있었기 때문이다. `--duration-feedback`을 reduced-motion에서 살리는 대안은 배제됐다 — 그 토큰을 `button.tsx`·`chip.tsx`·`schedule-row.tsx`·`PullToRefresh.tsx`가 함께 쓰고 있어, 되살리면 완료된 P0-T43·P0-T44의 눌림 반응이 네 군데에서 함께 되살아나기 때문이다. revision 3이 `--duration-crossfade` 신설과 "reduced-motion에서 0으로 덮지 않는 유일한 시간 토큰"이라는 규칙을 추가해 재봉인됐다.

## 완료한 인수 조건

### 1. 호출 발동 (정지 조건)

최소 배치(`route-transition.tsx` 래퍼 + 홈·일정 탭 페이지 + `schedule/[id]` 페이지 + 달력 셀 클릭의 `startTransition`/`addTransitionType`)만으로 먼저 세우고, `tests/e2e/tab-navigation.spec.ts`의 호출 계수 e2e로 RED(래퍼 무력화 → 계수 0, P0-T43과 같은 실패 재현) → GREEN(복원 → 계수 증가)을 실측한 뒤에야 나머지로 넘어갔다.

### 2. 탭 이동

홈·일정·알림·전체 4개 탭 사이 이동은 `route-fade-in`/`route-fade-out`만 걸리고 `route-slide-y`는 걸리지 않는다. `document.getAnimations()`의 `effect.getComputedTiming().duration`으로 실측했다(단순히 애니메이션 "이름의 존재 여부"만 보면 0초짜리 애니메이션도 이름이 잡혀 오탐이 난다는 것을 첫 시도에서 확인하고 지속시간 비교로 바꿨다 — 아래 "테스트 기법 정정" 참고).

### 3. 탭 밖 진입

달력 셀 → 상세, 전체 탭의 예상급여·내 정보·관리자 링크 모두 `nav-forward` 태그로 `route-slide-up`이 걸린다. 상세 화면 안의 뒤로 가기 링크는 `nav-back` 태그로 `route-slide-down`이 걸린다. 두 방향 모두 `route-fade`와 `route-slide-y`가 동시에 양의 지속시간을 갖는 것을 e2e로 확인했다.

### 4. 브라우저 뒤로 가기

`popstate` 경로는 원래부터 이 task가 손대지 않는 플랫폼 제약이다. P0-T43이 남긴 회귀 테스트가 그대로 유지된다.

### 5. 탭 바 격리

`<nav>`에 `style={{ viewTransitionName: "persistent-nav" }}`, CSS에 `::view-transition-group(persistent-nav) { animation: none; z-index: 100; }`. 전환 전후 `boundingBox()`가 동일하고 `getComputedStyle(nav).viewTransitionName`이 `"persistent-nav"`임을 e2e로 확인했다.

### 6. 미지원과 reduced-motion

미지원 환경(`document.startViewTransition` 삭제)에서 탭 4개 왕복이 정상 렌더된다(P0-T43이 남긴 회귀 테스트). reduced-motion에서는 `route-slide-y`의 지속시간이 0(P0-T43의 기존 토큰 리셋이 그대로 적용)이고 `route-fade`는 양의 지속시간을 유지한다(`--duration-crossfade`가 리셋 대상에서 빠졌으므로) — "움직임은 사라지고 페이드만 남는다"는 요구를 CSS 캐스케이드만으로 만족한다. reduced-motion 전용 오버라이드 규칙은 필요 없어 넣지 않았다(아래 "구현이 RADIO 서술보다 단순해진 지점" 참고).

### 7. 겹침

전환 도중 다른 탭을 연속으로 누르면 마지막 요청 화면에 안착하고 이전 화면 헤딩은 사라진다. 같은 탭을 다시 눌러도 호출 계수가 늘지 않는다. 둘 다 e2e로 확인했다 — 다만 이 두 검사는 RED→GREEN 증거를 남기지 않았다(아래 "TDD 증거를 남기지 않은 두 검사" 참고).

### 8. 번들

최종 실측 503,070바이트(491.28KB), 상한 512,000바이트 대비 여유 8,930바이트(8.72KB). 최소 배치 직후 실측(503,070바이트)과 전체 배선 완료 후 실측이 동일하다 — CSS만 늘었고 `.next/static/chunks`의 `.js` 총량(gate:bundle이 재는 대상)은 변하지 않았다.

### 9. 회귀

`pnpm test`(1338/1338), `pnpm exec playwright test`(61/61, `tab-navigation.spec.ts`의 기존 4건 포함) 전부 통과. `pnpm verify` 전체 GREEN.

## 테스트 기법 정정 — 애니메이션 "이름"이 아니라 "지속시간"으로 판정해야 한다

reduced-motion e2e를 처음 `names.not.toContain("route-slide-y")` 식으로 짰더니, reduced-motion에서도 `route-slide-y`라는 이름 자체는 `document.getAnimations()`에 여전히 잡혔다(지속시간 0인 애니메이션도 브라우저가 `Animation` 객체를 잠깐 만든다). 이름의 존재만 보면 "움직임이 사라졌다"를 오판한다. `animation.effect.getComputedTiming().duration`을 함께 읽어 0인지 양수인지로 바꾼 뒤에야 정확해졌다. `tab-navigation.spec.ts`의 `installViewTransitionSpy`가 `{name, durationMs}` 쌍을 기록하고 `durationOf()` 헬퍼로 비교한다.

## 구현이 RADIO 서술보다 단순해진 지점 — reduced-motion 전용 오버라이드가 불필요해졌다

revision 3 봉인 당시엔 reduced-motion에서 `route-slide-down`/`route-slide-up`에 페이드만 남은 별도 `animation` 선언을 오버라이드로 얹는 그림이었다(revision 2까지의 구현이 실제로 그렇게 되어 있었다). `--duration-crossfade`를 fade 쪽 지속시간·지연으로 전부 옮기고 나니, reduced-motion에서 `route-slide-y`의 지속시간(`--duration-feedback`·`--duration-overlay`, 둘 다 P0-T43이 0으로 덮는 토큰)만 자연히 0이 되고 `route-fade`는 그대로 재생된다 — 오버라이드 없이 캐스케이드만으로 "움직임 사라짐 + 페이드 유지"가 성립한다. 그래서 이전에 넣었던 `::view-transition-old(.route-slide-down)`/`::view-transition-new(.route-slide-up)`의 reduced-motion 오버라이드 두 규칙을 제거했다 — 남겨 뒀다면 죽은 코드였고, CSS 총량도 그만큼 줄었다(번들 여유에 유리한 쪽으로 작용).

`::view-transition-group(*) { animation-duration: 0s !important; ... }`(브라우저 기본 group 모프 애니메이션을 reduced-motion에서 죽이는 규칙)는 그대로 남겼다 — 이건 P0-T43 토큰과 무관하고, `route-fade`/`route-slide-y`와 다른 의사 요소(`::view-transition-group`)를 겨냥하므로 이번 정리와 별개다.

## 구현 세부사항과 RADIO 서술 사이 차이

- **`addTransitionType?.()` optional chaining**: `ScheduleView.tsx`에서 `addTransitionType("nav-forward")`를 그대로 부르면 Vitest(플레인 `react` 19.2.8, canary 아님)에서 `TypeError: addTransitionType is not a function`이 났다. Next의 클라이언트 번들은 canary를 alias하므로 프로덕션에서는 항상 존재해 옵셔널 체이닝이 아무것도 건너뛰지 않는다 — 테스트 환경 격차를 흡수하는 방어 코드이지 설계 변경이 아니라고 판단해 질문 없이 처리했다.
- **HomeView의 다른 두 `/schedule/${date}` 링크는 손대지 않았다**: RADIO Architecture 절이 "일정으로 가는 CTA 링크"(단수, deadline-application 분기)만 명시했고, 이는 인수 조건 2(탭 이동)에 해당한다. confirmation-change·next-shift 분기의 `/schedule/${date}` 링크는 상세로 바로 들어가는 이동이라 인수 조건 3(탭 밖 진입) 영역이며, RADIO Architecture가 이 두 링크를 언급하지 않아 손대지 않았다. 태그가 없으면 해당 두 링크는 브라우저 기본 전환(없음)으로 남는다 — 회귀는 아니지만 후속 검토 대상으로 남는다.
- **관리자 하위 라우트 6개 포함**: 최초 탐색에서 `admin/schedule/[id]`·`admin/workers/[id]`를 놓쳤다가 `pnpm build`의 라우트 목록에서 발견해 마저 감쌌다. `src/app/(protected)/**/page.tsx`는 15개 전부 래퍼로 감쌌다.
- **`--duration-crossfade` 값**: `200ms`로 정했다. 스킬 레시피의 `--duration-enter`(210ms, `--duration-value` 매핑값)에 가장 가깝고, "페이드는 위치·크기가 아니라 불투명도 변화"라는 인수 조건 6의 근거와 같은 결의 값이라고 판단했다. RADIO는 구체적인 ms 값을 정하지 않았다 — 이 부분은 구현 재량으로 처리했다.

## TDD 증거를 남기지 않은 두 검사

인수 조건 7(겹침)의 "다른 탭 요청 시 마지막 화면 안착"과 "같은 탭 재클릭 시 계수 불변" 두 e2e는 GREEN만 기록하고 RED→GREEN 쌍을 만들지 않았다. 두 동작 모두 Next.js Router 자체가 보장하는 것(연속 push의 마지막 요청 우선, 동일 URL 재푸시의 no-op)이라 이 task가 작성한 코드에는 이를 구현하는 별도 로직이 없다 — 의미 있는 RED를 만들려면 실제로 있지도 않은 버그를 조작해서 만들어야 했다. 대신 나머지 4개 e2e(탭 페이드, 상세 슬라이드, 탭 바 격리, reduced-motion 페이드)는 전부 코드에 실재하는 지점(CSS 선언·`viewTransitionName` 유무)을 임시로 원상태로 되돌려 RED를 만들고 복원해 GREEN을 만드는 방식으로 진짜 RED→GREEN을 남겼다(타임스탬프는 `runs/P0-T45/tdd.json` 참고). `checkTddEvidence` 게이트는 task당 최소 1쌍만 요구하므로 이 두 검사가 게이트를 막지는 않는다.

## F-08 확인 결과 — 관찰된 왜곡 없음

`PullToRefresh`의 상시 `translateY(0px)`가 전환 스냅샷 기하를 어긋나게 하는지 실제 빌드에서 확인했다. 홈·일정·알림·예상급여 네 화면의 `RouterPullToRefresh` 하위 트리에는 `position: absolute`/`fixed` 자손이 없다 — 즉 이 transform이 컨테이닝 블록을 바꿔도 위치가 바뀔 자손 자체가 없다. `translateY(0px)`는 오프셋이 0이라 스냅샷 픽셀에도 영향이 없다. 스크린샷으로 네 화면의 탭 전환을 직접 확인했고, 전환 도중 캡처된 프레임은 있었지만(스킬 레시피 자체가 순차 크로스페이드라 옛 화면이 다 사라진 뒤 새 화면이 나타나는 구간이 있다 — 버그 아님, 레시피 그대로다) 레이아웃이 어긋나거나 잘리는 왜곡은 없었다. F-08은 이 task 범위에서 결정 신호로 반환할 사안이 아니라고 결론지었다.
