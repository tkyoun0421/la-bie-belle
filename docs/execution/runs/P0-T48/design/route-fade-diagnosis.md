# `route-fade` e2e 3건 원인 진단

조사일 2026-08-19 · 대상 `tests/e2e/tab-navigation.spec.ts` · 브랜치 `main` · HEAD `8ec4e00`

한 줄 결론: **실패 3건은 서로 다른 두 원인에서 나온다.** `:439`는 구현 결함이고,
`:338`과 `:551`은 테스트가 전환 호출을 하나로 가정해서 생긴 계수 오류다.

---

## 1. 증상

`pnpm test:e2e tests/e2e/tab-navigation.spec.ts --workers=1` → `3 failed`, `14 passed`.

| 실패 | 단언 | 실측 |
| --- | --- | --- |
| `:338` 탭 이동 페이드 | `durationOf(animations, "route-fade") > 0` | `0` |
| `:439` 상세 진입 | `durationOf(forwardAnimations, "route-fade", "old") > 0` | `0` |
| `:551` 같은 탭 재클릭 | 호출 계수 `1`을 기대 | `2` (병렬 실행에선 `3`) |

기본 설정(`fullyParallel: true`)으로 돌리면 `:502`와 `:628`이 추가로 깨진다. 이건 별건이다 —
이 파일 6개 테스트가 `WORK_DATE_BANDS.viewTransition` 한 구간을 같이 쓰고 서로의 스케줄 행을
밟는다. `--workers=1`이면 안 나온다. 아래 진단은 전부 직렬 기준이다.

`durationOf`(`tab-navigation.spec.ts:187-197`)는 `animations.find(...)?.durationMs ?? 0`이다.
지속시간이 0인 게 아니라 **그 이름의 애니메이션이 목록에 없다**는 뜻이 맞다.

실제로 도는 React는 루트의 `react-dom@19.2.8`이 아니라 Next가 벤더링한
`next/dist/compiled/react-dom`의 `19.3.0-canary-cbb046ab-20260731`이다
(`node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js:18318`).
아래 인용은 같은 코드의 development 빌드에서 줄 번호를 땄다.

---

## 2. 관측한 사실

관측은 Playwright 임시 spec에서 `document.startViewTransition`을 감싸고, 문서 전체에
`MutationObserver`(`attributeFilter: ["style"]`, `attributeOldValue`, `childList`, `subtree`)를 건 뒤
DOM 노드의 `__reactFiber$*` 프로퍼티로 파이버를 직접 읽어서 했다. 임시 spec은 조사 후 지웠다.

### 2-1. 나가는 쪽이 아예 안 붙는 게 아니다 — 탭끼리 이동하면 잘 붙는다

`/` → `/schedule`(탭 이동, `types: ["tab"]`):

```
[669ms] VT-NAME DIV.relative.overflow-hidden
        old: 'touch-action:pan-y'
        now: 'touch-action: pan-y; view-transition-name: _t_0_; view-transition-class: route-fade-out;'
[685ms] DOM  parent=DIV[data-app-shell] -removed=[DIV.relative.overflow-hidden] +added=[MAIN...]
[685ms] VT-NAME MAIN.mx-auto...
        now: 'view-transition-name: _t_1_; view-transition-class: route-fade-in;'
[688ms] READY anims = [
          '-ua-view-transition-fade-out @ ::view-transition-old(root)',
          'route-fade @ ::view-transition-old(_t_0_)',      <-- 나가는 쪽
          'route-fade @ ::view-transition-new(_t_1_)' ]     <-- 들어오는 쪽
```

`exit`가 정상으로 걸린다. 나가는 화면의 DOM 노드는 실제로 제거되고(`-removed=`), 인스턴스가
재사용되는 것도 아니다. **핸드오프에 적힌 「인스턴스가 update로 재사용돼서 `default="none"`을
탄다」 가설은 반증됐다.**

### 2-2. `(tabs)` 경계를 넘을 때만 깨진다 — 대조 실험

같은 `nav-forward` 타입, 같은 `RouteTransition`으로 출발지만 같게 두고 목적지를 바꿨다.

| 실험 | 경로 | 붙은 이름 | `ready` 시점 애니메이션 |
| --- | --- | --- | --- |
| A | `/more` → `/more/notification-settings` (둘 다 `(tabs)` 안) | old `route-fade-out`, new `route-slide-up` | `route-fade @ old(_t_0_)`, `route-fade @ new(_t_1_)`, `route-slide-y @ new(_t_1_)` |
| B | `/more` → `/pay` (둘 다 `(tabs)` 안) | 위와 같음 | 위와 같음 |
| C | `/more` → `/my-profile` (`(tabs)` 밖으로) | new `route-slide-up` **만** | `route-fade @ new(_t_0_)`, `route-slide-y @ new(_t_0_)` |

C의 DOM 변화가 A·B와 다른 지점은 하나다.

```
A/B:  parent=DIV[data-app-shell]  -removed=[MAIN...]  +added=[MAIN...]
C  :  parent=BODY                 -removed=[DIV[data-app-shell]]  +added=[MAIN...]
```

`(tabs)` 안에서 움직이면 레이아웃이 살아 있고 페이지 `<main>`만 갈린다. 경계를 넘으면
`(tabs)/layout.tsx`의 `<div data-app-shell>`째로 통째 사라진다.

방향은 상관없다. `/schedule/:id` → `/schedule`(`nav-back`)에서는 반대로 나가는 쪽(상세)만
`route-slide-down`을 받고, 들어오는 `(tabs)` 쪽에는 `route-fade-in`이 안 붙는다.
**`(tabs)` 안에 있는 `RouteTransition`이 양방향 모두 빠진다.**

### 2-3. 파이버를 읽었다 — `subtreeFlags`의 비트 25가 없다

C 시점(= `startViewTransition` 호출 직전)에 파이버 트리를 훑어 `deletions`를 찾았다.

실험 A(정상):

```
owner  : tag=0 flags=1572881 sub=181930503
deleted: tag=10 key="__PAGE__"  sub=47972357   SUB_VT=true
         └ 안에 ViewTransition 있음: ... > 30:ViewTransition
           props.exit={"tab":"route-fade-out","nav-forward":"route-fade-out",
                       "nav-back":"route-slide-down","default":"none"}
```

실험 C(깨짐):

```
owner  : tag=0 flags=524305  sub=181930503
deleted: tag=10 key="(tabs)"  sub=14417925    SUB_VT=false   <-- 여기
         └ 안에 ViewTransition 있음(직접 DFS로 확인): ... > 5:div > ... > 30:ViewTransition
           props.exit=(위와 동일)
```

`47972357 - 33554432 = 14417925`. **정확히 `1 << 25`만큼 차이 난다.**

나가는 `<main>`에서 위로 올라가며 찍은 조상 사슬(실험 C)에서 비트가 죽는 자리도 하나뿐이다.

```
tag=5  <main>                       sub=14158337
tag=30 <ViewTransition>  flags=34865152  SELF_VT=true
...(중간 전부 SUB_VT=true)...
tag=0                               sub=47972352  SUB_VT=true
tag=5  <div>  (= data-app-shell)    sub=14417920  SUB_VT=false   <-- 여기서 끊긴다
...(위로 전부 SUB_VT=false)...
tag=10 key="(tabs)"                 sub=14417920  SUB_VT=false   <-- 삭제되는 파이버
```

### 2-4. React 소스가 그렇게 하라고 적혀 있다

`completeWork`의 HostComponent(`case 5`)와 HostSingleton(`case 27`) 처리 끝에 이 줄이 있다
(`react-dom-client.development.js:12924, 12941, 12955, 13093`).

```js
bubbleProperties(workInProgress);
workInProgress.subtreeFlags &= -33554433;   // ~(1 << 25) — ViewTransitionStatic 제거
```

`ViewTransitionStatic`(`1 << 25`)은 `completeWork`의 `case 30`에서 `<ViewTransition>` 파이버에
직접 붙고(`:13509`) `bubbleProperties`로 위로 전파되는데, **호스트 엘리먼트를 만나면 거기서
끊긴다.** bailout 경로의 static mask(`1206910976`)에는 비트 25가 들어 있으니 리렌더 누락 문제가
아니라 의도된 마스킹이다.

그리고 enter/exit 커밋은 그 비트만 보고 내려간다.

```js
// commitExitViewTransitions (:14515)
if (30 === deletion.tag) { /* exit 클래스 적용 */ }
else if (0 !== (deletion.subtreeFlags & 33554432))     // <-- 여기서 false
  for (deletion = deletion.child; ...) commitExitViewTransitions(deletion);
else /* 아무것도 안 한다 */;

// commitEnterViewTransitions (:14440) — 같은 가드
else if (0 !== (placement.subtreeFlags & 33554432)) ...
```

`(tabs)` 파이버는 `SUB_VT=false`라 두 번째 가지에서 걸러지고, React는 안쪽 `RouteTransition`을
찾으러 내려가지 않는다. 그래서 `view-transition-class`가 안 붙고, `::view-transition-old(.route-fade-out)`
셀렉터가 매칭될 의사 요소 자체가 안 생긴다. CSS 값은 멀쩡하다.

### 2-5. 래퍼를 빼면 통과한다 (A/B)

`(tabs)/layout.tsx`의 `<div data-app-shell>`을 Fragment로 바꾸고 `pnpm build` 후 재실행:

```
✓  9 tab-navigation.spec.ts:439  상세 진입은 새 화면이 올라오고 뒤로 가기는 옛 화면이 내려간다
✘  6 tab-navigation.spec.ts:338
✘ 13 tab-navigation.spec.ts:551
2 failed / 15 passed
```

`:439`는 앞뒤 단언 여섯 개가 전부 통과한다. 실험 후 `git checkout --`으로 되돌리고 재빌드해
`3 failed / 14 passed` 원상태를 확인했다.

**핸드오프(`docs/execution/runs/P0-T48/handoff.md:146,172`)의 「`<div data-app-shell>` 래퍼는
아니다(Fragment로 되돌려도 실패)」는 오판이다.** Fragment로 바꿔도 `:338`·`:551`은 여전히
실패하는데, 그 둘은 원인이 다르다. 셋을 한 덩어리로 보고 래퍼를 배제한 것으로 보인다.

### 2-6. 탭 한 번 누르면 전환이 세 번 돈다

두 번째 클릭을 아예 하지 않는 대조 실험:

```
헤딩이 보인 직후(테스트가 기준선으로 읽는 지점) : 1
+300ms (테스트가 2차 클릭 후 읽는 지점)         : 2
+2300ms, 두 번째 클릭 없음                       : 3
calls: [{t:978, types:["tab"]}, {t:1271, types:null}, {t:1590, types:null}]
```

한 번의 이동이 `startViewTransition`을 세 번 부른다. 첫 번째만 전환 타입을 달고
`route-fade`/`route-slide-y`를 돌리고, 뒤 둘은 `types: []`라 `default="none"`을 타서
이름 붙은 애니메이션이 하나도 없다. 뒤 둘은 앞 전환이 `finished`가 되자마자 이어 붙는다.

DOM 변화로 보면 첫 커밋 뒤에 메타데이터 교체 한 번, 클라이언트 청크가 도착해
`RouterPullToRefresh`로 감싼 실제 화면이 들어오는 커밋 한 번이 더 있다. Next가 라우트를 여러
커밋으로 흘려보내고 React가 각 커밋을 전환으로 감싼다.

뒤 두 전환은 **눈에는 안 보인다.** React가 루트 스냅샷을 무효화하기 때문이다 —
`documentElement.style.viewTransitionName = "none"`을 넣고
`::view-transition-group(root)`에 `opacity: [0,0]`, `::view-transition`에 `width/height: [0,0]`을
`duration: 0, fill: forwards`로 건다(`:16310` 부근, 관측에서도 같은 애니메이션이 잡혔다).
계수만 늘고 화면은 그대로다.

**`:551`은 그래서 깨진다.** 두 번째 클릭이 기여하는 건 0이고, 늘어난 1은 첫 이동의 뒤따라오는
전환이다. 기준선(`afterFirstClick`)을 `<h1>`이 보이는 순간에 읽는 게 너무 이르다.

**`:338`도 같은 뿌리다.** 루프가 클릭 직전 계수를 `index`로 잡고 그 인덱스의 기록을 본다.

```
일정: index=0  클릭 후 계수=1  -> 기록 #0 을 본다   (맞음)
급여: index=1  클릭 후 계수=4  -> 기록 #1 을 본다   (앞 이동의 후속 전환. route-fade 없음 → 0)
전체: index=4  클릭 후 계수=5  -> 기록 #4
홈  : index=5  클릭 후 계수=7  -> 기록 #5
```

두 번째 반복부터 기준선이 밀려서, 클릭이 만든 전환이 아니라 **앞 이동의 후속 전환**을 검사한다.
그 기록에는 `route-fade`가 없으니 `durationOf`가 0을 돌려준다.

---

## 3. 원인

### 원인 A — `:439` (구현 결함)

React는 삭제·삽입되는 파이버와 `<ViewTransition>` 사이에 **호스트 엘리먼트(DOM 노드)가 끼면
그 경계를 못 찾는다.** `completeWork`가 호스트 엘리먼트에서 `ViewTransitionStatic` 비트를
지우고(`subtreeFlags &= -33554433`), `commitExitViewTransitions`/`commitEnterViewTransitions`가
그 비트만 보고 하강 여부를 정하기 때문이다.

`(tabs)/layout.tsx`가 `<div data-app-shell>`로 `{children}`을 감싸므로, `(tabs)` 경계를 넘는
이동에서는 삭제(또는 삽입)되는 세그먼트 파이버와 페이지의 `RouteTransition` 사이에 이 `div`가
놓인다. 그래서 `(tabs)` 쪽 화면만 `enter`/`exit`를 못 받는다.

영향 범위는 테스트 한 건보다 넓다. 상세 진입(`/schedule` → `/schedule/:id`), 상세에서 복귀,
`/more` → `/my-profile`, `/more` → `/admin`이 전부 해당한다. 나가는 쪽에 스냅샷 애니메이션이
없고 루트 그룹은 `opacity: 0`으로 무효화되므로, **옛 화면은 페이드 없이 한 프레임에 잘려 나간다.**
(이 마지막 문장은 관측한 애니메이션 목록 + React 소스에서 따온 연역이다. 화면 캡처로
눈으로 확인하지는 않았다.)

이건 봉인된 계약을 어긴다. `docs/execution/runs/P0-T45/radio.md:46-47`:

> - **상세 진입 슬라이드업**: **나가는 화면 페이드 250ms**, 들어오는 화면은 페이드 250ms와 이동 250ms …
> - **뒤로 가기 슬라이드다운**: 나가는 화면은 페이드 250ms와 이동 150ms …, **들어오는 화면 페이드 250ms**

`docs/product/design/FOUNDATIONS.md`의 모션 절도 「바텀시트·화면 전환 220~280ms · 부드러운 감속」을
응답 대역으로 못 박고, reduced-motion에서도 이동만 죽이고 페이드는 남기라고 한다
(`docs/execution/runs/P0-T45/radio.md:105`). 나가는 쪽 페이드는 시안이 요구하는 동작이 맞다.

### 원인 B — `:338`, `:551` (테스트 결함)

이동 한 번이 `startViewTransition`을 2~3번 부른다. 테스트는 1번을 가정하고,
클릭 직전 계수를 인덱스로 쓰거나 클릭 전후 계수를 비교한다. 구현이 요구를 어긴 게 아니라
계측 방식이 틀렸다. 다만 「후속 전환이 두 번 더 돈다」는 사실 자체는 기록해 둘 값어치가 있다.

---

## 4. 배제한 것

- **인스턴스 재사용(update) 가설.** 나가는 노드는 실제로 DOM에서 제거되고, 탭끼리 이동할 땐
  같은 `RouteTransition`이 `exit`를 정상으로 받는다(2-1).
- **CSS 값·셀렉터 오류.** `::view-transition-old(.route-fade-out)`은 탭 이동에서 정확히 매칭된다.
  안 도는 경우는 의사 요소가 안 생긴 것이다.
- **전환 타입 해석 오류.** `startViewTransition`에 `types: ["nav-forward"]`가 정상으로 실린다.
  같은 커밋의 들어오는 쪽은 그 타입으로 `route-slide-up`을 뽑아낸다.
- **`AppHeader`·탭 눌림 리마운트·`RouteTransition` 누락.** 앞 조사가 배제한 그대로 유효하다.
  `AppHeader`와 `AppShellTabBar`는 `RouteTransition`의 형제라 조상 사슬에 없다(2-3).
- **`applyViewTransitionToHostInstances`의 뷰포트 판정.** 이름을 붙였다 되돌리는 경로라면
  `MutationObserver`에 style 변경이 두 번 잡혀야 하는데 한 번도 안 잡혔다.
- **`prefers-reduced-motion` 전역 리셋 간섭.** 실패는 기본 컨텍스트에서 난다.
- **`<div data-app-shell>` 래퍼가 무관하다는 앞 조사의 결론.** 이건 배제가 아니라 뒤집혔다(2-5).

---

## 5. 고치는 선택지

### 원인 A

**A-1. `{children}`의 호스트 조상을 없앤다** — `(tabs)/layout.tsx`가 Fragment를 반환하고
`data-app-shell` 표식을 `<header>`나 `<nav>`로 옮긴다.

- 대가: `globals.css:434`의 `body:has([data-app-shell]) #global-offline-banner`가 후손 아무나
  걸리는 `:has()`라 표식만 옮기면 그대로 산다. `src/app/__tests__/globals.test.ts:389`가 그 블록을
  정규식으로 검사하는데 셀렉터를 안 바꾸면 무사하다. 클래스 없는 `div` 하나가 빠지는 것이라
  레이아웃 영향은 없다(A/B에서 탭바 격리·좌표 테스트 포함 15건 통과).
- 대가: 규칙이 눈에 안 보인다. 나중에 누가 셸에 래퍼를 다시 넣으면 조용히 같은 자리로 돌아간다.
  **나가는 쪽 존재를 단언하는 통과 테스트가 지금 하나도 없으므로** 가드 테스트가 같이 필요하다.
- 검증됨: `:439` 전부 통과(2-5).

**A-2. `(tabs)/layout.tsx`에도 `<ViewTransition>`을 둔다** — 셸 전체를 하나의 경계로 삼는다.

- 대가: `applyViewTransitionToHostInstances`는 경계 아래 호스트 인스턴스를 전부 훑어
  `_t_0_`, `_t_0__1`, `_t_0__2` … 로 이름을 매긴다. `AppShellTabBar`의 `<nav>`에 인라인으로
  박아 둔 `viewTransitionName: "persistent-nav"`를 전환 동안 덮어써서, 탭바 격리
  (`::view-transition-group(persistent-nav) { animation: none }`)가 깨진다. 탭바를 경계 밖으로
  빼거나 중첩 경계를 하나 더 두는 재구성이 따라온다.
- 이점: 「셸째로 나간다」는 의미가 구조에 드러나서 A-1의 「보이지 않는 규칙」 문제가 없다.

**A-3. 상세·내 정보·관리자를 `(tabs)` 안으로 옮긴다** — 경계를 넘는 이동을 없앤다.

- 대가: 라우팅 재편이고, 그 화면들이 헤더·탭바를 달게 된다. 제품 결정이라 이 자리에서 못 정한다.

**A-4. 테스트를 시안에 맞춰 낮춘다** — 나가는 쪽 단언을 뺀다.

- 대가: `P0-T45` RADIO가 명시한 「나가는 화면 페이드 250ms」를 포기한다. 상세 진입에서 옛 화면이
  잘려 나가는 것을 감시하는 마지막 눈이 사라진다. **권하지 않는다.**

### 원인 B

**B-1. 스파이가 기록과 클릭을 타입으로 짝짓게 한다** — `readTransitionAnimations(page, index)`를
「`index` 이후에 시작된 기록 중 기대한 전환 타입을 단 첫 기록」을 기다리는 형태로 바꾼다.
`installViewTransitionSpy`가 이미 `transition.ready`에서 기록하니 `types`만 같이 저장하면 된다.

- 대가: 공유 헬퍼를 손댄다. `P0-T45`가 이 단언을 「`enter`/`exit` 매핑을 뒤바꾸면 실제로 깨지는」
  형태로 설계했으므로(`runs/P0-T45/radio.md:75`), 고친 뒤 같은 조작으로 RED가 재현되는지
  다시 확인해야 한다.

**B-2. `:551`은 기준선을 안정된 뒤에 잡는다** — 계수가 더 안 늘 때까지 기다린 다음 두 번째를
누르고 비교한다.

- 대가: 정착 대기 휴리스틱이 하나 는다. 테스트가 1초쯤 느려진다.

**B-3. 타입 없는 전환을 계수에서 빼는 헬퍼를 둔다** — `:213`·`:574`·`:551`이 전부 「타입 붙은
전환이 늘었나」를 묻는 것이라 의미가 오히려 또렷해진다.

- 대가: 「호출 계수」에서 「타입 붙은 전환 계수」로 계약이 살짝 바뀐다. 순수한 호출 횟수를
  보고 싶은 회귀(예: 전환 폭주)를 못 잡는다. B-1과 함께 쓰면 중복이다.

---

## 6. 권고

**`:439`는 구현을 고친다. `:338`·`:551`은 테스트를 고친다.** 셋을 한 원인으로 묶으면 안 된다.

1. **A-1 + 가드 테스트.** `(tabs)/layout.tsx`에서 `{children}`의 호스트 조상을 없애고
   `data-app-shell`을 `<header>`로 옮긴다. 같이, `/schedule` → `/schedule/:id`에서
   `::view-transition-old`에 `route-fade`가 붙는 것을 단언하는 테스트를 남긴다 —
   `:439`가 이미 그 일을 하지만, 지금은 「나가는 쪽 존재」를 보는 유일한 눈이라 이 규칙이
   구조로 드러나지 않는다는 점을 RADIO에 한 줄 적어 두는 편이 낫다.
   구조를 명시적으로 드러내고 싶으면 A-2가 더 낫지만 탭바 격리 재구성이 딸려 온다 —
   지금 열려 있는 P0-T48 안에서 감당할 크기가 아니다.
2. **B-1로 스파이를 고치고, 고친 뒤 `enter`/`exit` 매핑을 뒤바꿔 RED가 나오는지 확인한다.**
   B-2는 B-1이 들어가면 필요 없다.
3. **후속 전환 두 건은 backlog로 남긴다.** 화면에는 안 보이지만(React가 루트 그룹을
   `opacity: 0`으로 무효화한다) 이동 한 번에 `startViewTransition`이 세 번 도는 건
   `motion-render-budget` 쪽에서 다시 만날 수 있다.
4. **핸드오프의 오판을 정정한다.** `runs/P0-T48/handoff.md:146,172`의
   「`<div data-app-shell>` 래퍼는 배제」를 지우지 않으면 다음 사람이 같은 자리를 또 피해 간다.

곁가지 하나. 병렬 실행에서만 나는 `:502`·`:628` 실패는 `WORK_DATE_BANDS.viewTransition` 한
구간을 이 파일 6개 테스트가 나눠 쓰다 부딪히는 것이다. 원인 A·B와 무관하고, 메모리에 적힌
「E2E work_date 구간 배분」 사례의 재발이다.

---

## 7. 작업 트리

조사 중 건드린 것은 임시 spec `tests/e2e/zz-diag-route-fade.spec.ts`(삭제함)와
`src/app/(protected)/(tabs)/layout.tsx`(A/B 후 `git checkout --`으로 복원, 재빌드까지 마침)뿐이다.
커밋은 하지 않았다. 복원 후 재실행 결과는 조사 전과 같은 `3 failed / 14 passed`다.

```
$ git status --short
 M .claude/skills/publish-ui/SKILL.md
 M .gitignore
 M README.md
 M docs/execution/phases/index.jsonl
 M docs/execution/runs/P0-T48/design/NOTES.md
 M docs/execution/runs/P0-T48/handoff.md
 M docs/workflow/WORKFLOW.md
 D src/shared/lib/yeild-to-main.ts
?? .claude/skills/hotfix/SKILL.md
?? diagrams/build-test.elements.json
?? diagrams/build-test.excalidraw
?? diagrams/data-storage.elements.json
?? diagrams/data-storage.excalidraw
?? diagrams/integrations-config.elements.json
?? diagrams/integrations-config.excalidraw
?? diagrams/overview.elements.json
?? diagrams/overview.excalidraw
?? diagrams/process.excalidraw
?? diagrams/request-flow.elements.json
?? diagrams/request-flow.excalidraw
?? diagrams/structure.excalidraw
?? docs/execution/radio/P0-T57-radio.md
?? docs/execution/radio/P0-T58-radio.md
?? docs/execution/runs/P0-T48/design/schedule-survey.md
?? docs/execution/runs/P0-T48/design/schedule-transcription.md
?? docs/execution/runs/P0-T57/survey.md
?? docs/execution/runs/P0-T58/survey.md
?? src/shared/lib/__tests__/yield-to-main.test.ts
?? src/shared/lib/yield-to-main.ts
```

조사 시작 시점 스냅샷과 비교하면 네 줄이 늘었다 —
`docs/execution/runs/P0-T48/design/NOTES.md`, `docs/execution/runs/P0-T48/handoff.md`,
`docs/execution/runs/P0-T48/design/schedule-survey.md`,
`docs/execution/runs/P0-T48/design/schedule-transcription.md`.
넷 다 같은 세션에서 동시에 돌던 다른 에이전트의 P0-T48 작업이고 내가 만든 게 아니다.
