# 일정 화면 — 동작·모션 계약 전사

대상: `docs/execution/runs/P0-T48/design/confirmed/schedule.html` (2512줄, 전문 통독)
방식: 라운드 38(홈)과 같은 전사. 해석하지 않고 시안에 적힌 값을 그대로 옮긴다. 줄 번호는 `:NNN`.

## 센 것

| 항목 | 수 | 비고 |
| --- | ---: | --- |
| `@keyframes` | 3 | `spin` `:287` · `tabPress` `:364` · `selectIn` `:584` |
| `animation:` 선언 | 3 | `:284` `:361` `:581` |
| `transition:` 선언 | 9 | `:271` `:435` `:652` `:771` `:836` `:856` `:907` `:1021` `:1044` — 이 중 `:435`·`:907`은 두 속성이라 전이 속성 수로는 11 |
| **눈에 보이는 모션** | **13** | 아래 표. keyframe 3 + 전이 10(셰브런 회전은 전이 없는 즉시 변화라 포함) |
| `addEventListener` 호출부 | 13 | 그중 셋이 `forEach` 안이라 실행 시 바인딩은 **22개** |
| `classList` 조작 | 13 | `add` 5 · `remove` 5 · `toggle` 3 |
| 셀 상태 | 8 | `none` `closed` `open` `requested` `confirmed` `done` `added` `removed` |
| 상태 전이 규칙 | 14 | 셀 6 · 시트 5 · 하단 바 2 · 지난 모집 1 |
| `animationend` / `transitionend` | **0** | 아래 「끝을 무엇이 판정하는가」 참조 |
| `@media` / `prefers-reduced-motion` | **0** | 시안에 없음 (홈과 같음) |

---

## 1. 모션 열셋

지속시간은 여덟 가지뿐이다 — `120ms` `160ms` `180ms` `200ms` `240ms` `260ms` `420ms` `700ms`.
JS 타이머는 별도로 `1100ms`(새로고침) · `1400ms`(토스트).

| # | 무엇 | 시안 | 트리거 | 선언 그대로 | 생명주기 |
| --- | --- | --- | --- | --- | --- |
| 1 | 새로고침 슬롯 높이 0→44 | `:266-276` | `body`의 `wheel`, 누적 90 초과 | `.refresh { height: 0; overflow: hidden; transition: height 200ms ease; }` → `.refresh.on { height: 44px; }` | `setTimeout` **1100ms** 뒤 `on` 제거 (`:2465-2469`) |
| 2 | 스피너 회전 | `:278-291` | 상시 (DOM에 항상 존재) | `animation: spin 700ms linear infinite;` · `@keyframes spin { to { transform: rotate(360deg); } }` | 없음 — 슬롯 높이가 0이라 안 보일 뿐 계속 돈다 |
| 3 | 탭 눌림 스쿼시 `tabPress` | `:360-380` | `.tab` 클릭 | `.tab.pressed svg { animation: tabPress 420ms cubic-bezier(0.32, 0.72, 0, 1); }` · fill-mode 없음 · iteration 1 · delay 0 · `.tab svg { transform-origin: 50% 100%; }` (`:329`) | 핸들러가 **모든** `.tab`에서 `pressed` 제거 → `void tab.offsetWidth`로 reflow 강제 → 다시 `add`. 끝나고 클래스를 떼는 코드는 없다 |
| 4 | 세그먼트 배경·글자색 전환 | `:424-444` | `aria-pressed` 변경 | `transition: background 160ms ease, color 160ms ease;` → `[aria-pressed="true"] { background: var(--color-surface); color: var(--color-text-strong); font-weight: 500; }` | 없음. `font-weight`는 전이 대상이 아니라 즉시 바뀐다 |
| 5 | 셀 선택 되튐 `selectIn` | `:577-600` | `.dcell`이 `st-added`/`st-removed`가 될 때 | `.dcell.st-added .dpad, .dcell.st-removed .dpad { background: var(--color-action-tint-strong); transform-origin: 50% 100%; animation: selectIn 420ms cubic-bezier(0.32, 0.72, 0, 1); }` · fill-mode 없음 · iteration 1 | **`renderCalendar()`가 매번 `dgrid.innerHTML`을 통째로 갈아 끼우므로**(`:1933`) 렌더마다 자동 재생 — 아래 「재생 부작용」 참조 |
| 6 | 목록 행 눌림 | `:641-661` | `.trow:active` | `transition: transform 120ms ease;` → `transform: scale(0.985);` | 없음 |
| 7 | 알약 눌림 | `:756-776` | `.pill:active` | `transition: transform 120ms ease;` → `transform: scale(0.94);` | 없음 |
| 8 | 하단 변경 바 슬라이드업 | `:821-841` | `changebar.classList.toggle("on", count > 0)` | `.changebar { transform: translateY(110%); transition: transform 240ms cubic-bezier(0.32, 0.72, 0, 1); }` → `.changebar.on { transform: translateY(0); }` | `on` 토글만. 내려간 뒤 텍스트를 지우지 않는다(#renderBar 참조) |
| 9 | 버튼 눌림 | `:843-861` | `.button:active` | `transition: transform 120ms ease;` → `transform: scale(0.985);` | 없음 |
| 10 | 토스트 | `:892-915` | `showToast()` | `.toast { opacity: 0; transform: translate(-50%, 12px); transition: opacity 180ms ease, transform 180ms ease; }` → `.toast.on { opacity: 1; transform: translate(-50%, 0); }` | `clearTimeout` 후 `setTimeout` **1400ms** — 연속 호출 시 타이머 리셋(디바운스) `:2437-2444` |
| 11 | 시트 딤 페이드 | `:1014-1027` | `openSheet()` / `closeSheet()` | `.scrim { background: rgba(10, 11, 13, 0.4); opacity: 0; pointer-events: none; transition: opacity 200ms ease; }` → `.scrim.on { opacity: 1; pointer-events: auto; }` | `on` 토글만 |
| 12 | 바닥 시트 슬라이드업 | `:1029-1049` | `openSheet()` / `closeSheet()` | `.bs { transform: translateY(100%); transition: transform 260ms cubic-bezier(0.32, 0.72, 0, 1); }` → `.bs.on { transform: translateY(0); }` | `on` 토글만. 닫아도 `innerHTML`은 그대로 남는다 |
| 13 | 지난 모집 셰브런 회전 | `:713-715` | `.chevron-open` 클래스 부착 | `.chevron-open { transform: rotate(90deg); }` — **`transition` 선언이 없다** | 없음 — 0ms로 튄다. 회전은 `renderList()`가 DOM을 다시 그리며 붙이므로 전이가 있어도 재생될지 불확실하다 |

### 이징 — 시안이 쓰는 값은 둘뿐

| 이징 | 쓰인 곳 |
| --- | --- |
| `cubic-bezier(0.32, 0.72, 0, 1)` — 네 곳 | `:361` tabPress · `:581` selectIn · `:836` 변경 바 · `:1044` 바닥 시트 |
| `ease` 키워드 — 여덟 속성 | `:271` 새로고침 · `:435` 세그먼트 ×2 · `:652` 행 · `:771` 알약 · `:856` 버튼 · `:907` 토스트 ×2 · `:1021` 딤 |
| `linear` — 하나 | `:284` 스피너 |

**라운드 38이 홈에서 확정한 `--ease-emphasized`(같은 `cubic-bezier(0.32, 0.72, 0, 1)`)를 일정도 네 곳에서 쓴다.** 홈에 있던 `ease-in`은 일정에 없다.

### 지속시간 — 홈의 흡수표와 비교

| 값 | 일정에서 쓰인 곳 | 홈 라운드 38 흡수 |
| --- | --- | --- |
| 120ms | 행·알약·버튼 눌림 | `feedback` 150 |
| **160ms** | **세그먼트 배경·색 전환** | 홈 목록에 없다 — 새 값 |
| 180ms | 토스트 | `value` 200 |
| 200ms | 새로고침 슬롯 · 딤 | `value` 200 |
| **240ms** | **하단 변경 바** | 홈 목록에 없다 — 새 값 (홈의 시트는 260) |
| 260ms | 바닥 시트 | `overlay` 250 |
| 420ms | tabPress · selectIn | `press` |
| 700ms | 스피너 | `animate-spin` 그대로 |

**새 값 둘(160·240)만 사람이 결정하면 나머지는 홈이 이미 흡수했다.**

### `tabPress`와 `selectIn`은 키프레임이 글자 하나까지 같다

```
0%   { transform: scale(1, 1); }
18%  { transform: scale(1.22, 0.78); }
44%  { transform: scale(0.95, 1.06); }
68%  { transform: scale(1.1, 0.91); }
100% { transform: scale(1, 1); }
```

`:364-380`(tabPress)과 `:584-600`(selectIn)이 동일하다. 지속시간·이징(420ms · emphasized)도 같고,
`transform-origin: 50% 100%`도 같다(`:329` · `:580`). 시안 본문 `:1402-1404`이 「앱 전체가 쓰는 선택
어법 … 하단 탭 · 홈 「이번 주」 스트립과 같은 되튐 420ms」라고 명시한다 — **이름만 둘이지 계약은 하나다.**

### 모션이 **없는** 곳 (놓치기 쉬운 음의 계약)

| 무엇 | 상태 |
| --- | --- |
| `.dpad` 배경 `--color-action-tint-strong` | `transition` 없음 — 되튐이 도는 동안 배경은 이미 켜져 있다 |
| 선택 **해제** | 퇴장 모션 없음. 클래스가 사라지며 배경·되튐이 즉시 사라진다 |
| `.dcell.today` 테두리 | `box-shadow: inset 0 0 0 1px var(--color-border)` — 전이 없음 |
| 뷰 전환(달력↔목록) | `.block { display: none }` ↔ `.block.on { display: flex }` (`:293-300`) — **전이 불가능한 속성**. 즉시 스위치 |
| 시트 세 겹 사이 이동 | `bs.innerHTML` 통째 교체. 겹 사이 전환 모션 없음 |
| `:hover` | 시안 전체에 **0건** |
| `:focus` / `:focus-visible` | 시안 전체에 **0건** — 키보드 포커스 링은 UA 기본에 맡긴다 |
| `prefers-reduced-motion` | 없음 (홈과 같음. 코드 쪽 `globals.css` 와일드카드가 자동 적용) |

---

## 2. 애니메이션의 끝을 무엇이 판정하는가

**`animationend`도 `transitionend`도 시안에 한 줄도 없다.** 끝을 판정하는 수단은 셋뿐이다.

| 수단 | 위치 | 무엇을 판정하나 |
| --- | --- | --- |
| `void tab.offsetWidth` (reflow 강제) | `:2427` | 끝 판정이 아니라 **재시작 판정**. `pressed`를 떼고 → reflow → 다시 붙여야 같은 탭 연타 시 되튐이 다시 돈다 |
| `setTimeout(…, 1100)` | `:2465-2469` | 새로고침 슬롯이 열려 있는 시간. 200ms 전이와 무관한 매직넘버 |
| `setTimeout(…, 1400)` | `:2441-2443` | 토스트 유지 시간. 180ms 전이와 무관한 매직넘버 |

`selectIn`(#5)은 재시작 장치조차 없다 — **DOM 재생성이 곧 재시작**이다. `renderCalendar()`가
`dgrid.innerHTML = cells`로 31개 셀을 통째로 새로 만들기 때문에 `render()`가 불릴 때마다
그 시점에 `st-added`/`st-removed`인 **모든** 셀이 동시에 되튄다.

### 재생 부작용 — 시안이 실제로 그렇게 동작한다

`render()`를 부르는 곳은 아홉이다(`:2308` `:2319` `:2336` `:2347` `:2357` `:2366` `:2380` `:2388` `:2402` `:2412` `:2417` `:2508`).
그중 셀 상태를 안 바꾸는 것까지 포함해 **전부** 달력을 다시 그린다. 결과:

- 셀을 두 번째로 고르면 첫 번째로 고른 셀도 같이 되튄다.
- 목록 뷰에서 「모두 선택」을 누르면 그 배치의 모든 날이 동시에 되튄다(달력은 안 보이지만 다시 그려진다).
- 지난 모집 카드를 펼치기만 해도(`:2388`) 선택된 셀 전부가 되튄다.
- 무한 스크롤로 지난 모집을 더 불러와도(`:2402`) 마찬가지다.

**이것이 의도인지 사고인지는 시안이 말하지 않는다.** 다만 홈 라운드 38이 같은 항목(#10)을
「DOM 재생성으로 자동 재생」이라고 계약으로 적었다.

---

## 3. 이벤트 핸들러 스물둘 (호출부 열셋)

| # | 대상 | 이벤트 | 옵션 | 무엇이 바뀌나 | 조건 |
| --- | --- | --- | --- | --- | --- |
| 1 | `#scrim` | `click` | — | `closeSheet()` → `scrim`·`bs`에서 `on` 제거 | 없음 |
| 2 | `#bs` | `click` (위임) | — | `event.target.closest("[data-act]")` — 아래 별표 | `hit` 없으면 무시 |
| 3 | `#dgrid` | `click` (위임) | — | `closest(".dcell")` → `togglePick(Number(data-day))` | `!cell \|\| cell.disabled` 면 무시 |
| 4 | `#saveBtn` | `click` | — | `saved = new Set(pending)` → `render()` → `showToast("신청이 완료되었어요")` | 없음. 비활성 조건도 없다 |
| 5~9 | `[data-group] .opt` ×5 | `click` | — | `state[key] = data-value` → (`key === "month"`면 `resetPick()`) → `render()` | 조작판 — 시안 밖 도구 |
| 10 | `#seg` | `click` (위임) | — | `closest("[data-view]")` → `state.view = data-view` → `render()` | `hit` 없으면 무시 |
| 11 | `#viewList` | `click` (위임) | — | 세 분기 — 아래 별표 | 순서대로 `[data-batch]` → `[data-past]` → `[data-day]` |
| 12 | `#body` | `scroll` | `{ passive: true }` | `pastShown = Math.min(PAST.length, pastShown + 2)` → `render()` | 셋 다 통과해야: `state.view === "list"` · `pastShown < PAST.length` · `scrollTop + clientHeight >= scrollHeight - 80` |
| 13 | `#allBtn` | `click` | — | 이달 `baseOf(day) === "open"`인 날을 전부 `pending.add` → `render()` | 없음 (`disabled`가 막는다) |
| 14 | `#resetPick` | `click` | — | `resetPick()` → `render()` | 조작판 — 시안 밖 도구 |
| 15~18 | `.tab` ×4 | `click` | — | 모든 탭에서 `aria-current` 제거 + `pressed` 제거 → 이 탭에 `aria-current="page"` → `void offsetWidth` → `pressed` 부착 → 토스트 | `data-tab !== "일정"`일 때만 토스트 |
| 19~21 | `[data-toast]` ×3 | `click` | — | `showToast(el.getAttribute("data-toast"))` | 종 · 지난달 · 다음달 |
| 22 | `#body` | `wheel` | `{ passive: true }` | 새로고침 슬롯 열기 | 아래 별표 |

### ★ #2 — 바닥 시트 위임 (`:2297-2322`)

| `data-act` | 하는 일 |
| --- | --- |
| `change` | `openChangeSheet()` — `bs.innerHTML`만 갈아 끼운다. `classList` 안 건드림 |
| `pickSwap` | `openSwapSheet()` — 같음 |
| `back` | `openSheet(sheetDay)` — **항상 첫 겹으로 간다** (셋째 겹에서 눌러도 둘째 겹을 건너뛴다) |
| `close` | `closeSheet()` |
| `reqCancel` | `changing.add(sheetDay)` → `closeSheet()` → `render()` → 토스트 `"취소 요청을 보냈어요"` |
| `reqSwap` | 위와 동일하되 토스트가 `` `${data-name} 님에게 교대를 요청했어요` `` |
| `cancelReq` | `changing.delete(sheetDay)` → `closeSheet()` → `render()` → 토스트 `"변경 요청을 거뒀어요"` |

`reqCancel`/`reqSwap`은 한 분기에 묶여 있고 토스트 문구만 삼항으로 갈린다.

### ★ #11 — 목록 위임 (`:2369-2393`)

| 분기 | 조건 | 하는 일 |
| --- | --- | --- |
| 배치 머리행 | `closest("[data-batch]")` | `data-batch`를 `","`로 쪼개 `filter(Boolean).map(Number)` → **전부 `pending.add`** → `render()`. **토글이 아니라 더하기만 한다** |
| 지난 모집 머리행 | `closest("[data-past]")` | `pastOpen`에 index를 토글 → `render()` |
| 날짜 행 | `closest("[data-day]")` | `togglePick(Number(data-day))` |

배치 머리행은 `pickable.length === 0`일 때 `disabled` 속성이 붙는다(`:2029`). 핸들러는
`disabled`를 확인하지 않는다 — 브라우저가 `disabled` 버튼의 click을 안 쏘는 것에 기댄다.
`#dgrid`(#3)는 명시적으로 `cell.disabled`를 검사하는데 여기는 안 한다. **두 위임의 방어 수준이 다르다.**

### ★ #22 — 휠 새로고침 (`:2455-2476`)

```
if (refreshing) return;
if (body.scrollTop <= 0 && event.deltaY < 0) {
  pull += -event.deltaY;
  if (pull > 90) {
    pull = 0; refreshing = true;
    refresh.classList.add("on");
    setTimeout(function () {
      refresh.classList.remove("on");
      refreshing = false;
      showToast("새로 불러왔어요");
    }, 1100);
  }
} else { pull = 0; }
```

- 임계값 **90**(픽셀 아닌 `deltaY` 누적). 아래로 굴리거나 스크롤이 최상단이 아니면 `pull = 0`으로 리셋.
- 슬롯이 열려 있는 동안 데이터는 아무것도 안 바뀐다 — `render()`를 안 부른다. 토스트만 뜬다.
- 홈 라운드 38 #1과 같은 계약(누적 90 · 1100ms 타이머).

---

## 4. 상태 전이

### 4-1. 달력 셀 — 여덟 상태

`cellState(day)` (`:1850-1860`)는 이 순서로 판정한다.

```
base = data().base[day] || "none"
1) base === "confirmed" && day < TODAY  → "done"     // TODAY = 17, 부등호는 strict
2) base !== "open"                      → base        // none | closed | confirmed
3) pending && !saved                    → "added"
4) !pending && saved                    → "removed"
5) pending (&& saved)                   → "requested"
6) 나머지                                → "open"
```

| 상태 | `aria-label` 꼬리 (`STATE_NAME`) | 박스(`.dpad`) | 숫자(`.dnum`) | 점(`::after`) | 누를 수 있나 |
| --- | --- | --- | --- | --- | --- |
| `none` | 모집 없음 | — | `--color-text-muted` `#7c828a` | — | `disabled` |
| `closed` | 마감 | — | `--color-text-muted` | — | 누르면 토스트 |
| `open` | 신청 가능 | — | `--color-text-strong` `#0a0b0d` / 500 | — | 예 |
| `requested` | 신청 완료 | — | `--color-action-deep` `#0c3f9c` / 500 | — | 예 |
| `confirmed` | 확정 | — | `--color-action-deep` / 500 | `background: var(--color-action-deep)` | 예 → 시트 |
| `done` | 지나간 확정 근무 | — | `--color-text-muted` | `background: var(--color-text-weak)` `#a8acb3` | 예 → 시트 |
| `added` | 신청에 추가함 | `--color-action-tint-strong` `#cfe0fc` + `selectIn` | `--color-text-strong` / 500 | — | 예 |
| `removed` | 신청을 취소함 | `--color-action-tint-strong` + `selectIn` | `--color-text-muted` | — | 예 |

점 기하: `.dcell.st-confirmed::after, .dcell.st-done::after` (`:560-571`) —
`position: absolute; left: 50%; bottom: 7px; width: 5px; height: 5px; margin-left: -2.5px; border-radius: var(--radius-pill); content: "";`

### 4-2. 셀 전이 — 무엇이 무엇으로 가나

| 시작 | 사건 | 끝 |
| --- | --- | --- |
| `open` | 셀 클릭 → `pending.add` | `added` |
| `added` | 셀 클릭 → `pending.delete` | `open` |
| `requested` | 셀 클릭 → `pending.delete` | `removed` |
| `removed` | 셀 클릭 → `pending.add` | `requested` |
| `added` | `신청하기` (`saved = new Set(pending)`) | `requested` |
| `removed` | `신청하기` | `open` |
| `closed` | 셀 클릭 | 상태 안 바뀜 — 토스트 `"8월 N일 상세로 갑니다"` |
| `confirmed` / `done` | 셀 클릭 | 상태 안 바뀜 — `openSheet(day)` |
| `none` | — | `disabled`라 클릭 자체가 없다 |

`togglePick(day)` (`:2324-2337`) 분기 순서: ① `confirmed \|\| done` → 시트 ② `baseOf(day) !== "open"` → 토스트 ③ 나머지 → `pending` 토글 + `render()`.

### 4-3. 「변경 요청 중」 — 아홉째 상태가 아니라 덧칠

`changing` Set(`:1764`)이 진다. `cellMarkup`(`:1903`)이 `changing.has(day)`면 클래스에 `" chg"`를 더한다.

```
.dcell.chg::after { background: transparent; box-shadow: inset 0 0 0 1.5px var(--color-action-deep); }   /* :1168-1171 */
```

- **`::after`가 이미 있는 셀에만 먹는다** — 즉 `confirmed`·`done`뿐. 다른 상태에 `chg`가 붙어도 `content`가 없어 아무 일도 안 일어난다.
- 소스 순서상 `:1168`이 `:573`(`st-done::after` 회색 채움)보다 뒤라 **`done` + `chg`면 링이 회색이 아니라 `--color-action-deep`**이 된다. 다만 `done` 날은 시트에 변경 버튼이 없어 실제로는 도달 불가.
- `chg`는 셀 색만 바꾼다. 하단 바 개수(`changeCount`)에도 목록 알약에도 안 잡힌다.

### 4-4. 바닥 시트 세 겹 — 한 요소 안에서 `innerHTML`만 갈린다

`#bs` 하나가 세 겹을 다 진다. `.on`은 첫 겹을 열 때만 붙고 닫을 때만 떨어진다.

| 겹 | 함수 | 머리 | 몸 | 발치 |
| --- | --- | --- | --- | --- |
| 1 배정표 | `openSheet(day)` `:2206-2240` | 제목 `8월 N일 {요일}` + 캡션 `라비에벨 그랜드홀` + `XICON` | `ASSIGN.groups` 넷 → `bs-group-title` + `.brow` (본인은 `class="me"` + `" (나)"`, 교육생은 `.brow-tag` `교육생`) | 세 갈래 ↓ |
| 2 유형 선택 | `openChangeSheet()` `:2242-2263` | `BACK` + 제목 `근무 변경 요청` + 캡션 `8월 N일 {요일}` + `XICON` | `.brow` 둘 — `근무 취소`(`이 날 근무를 못 하게 됐어요`) · `포지션 교대 요청`(`같은 날 다른 포지션의 근무자와 자리를 바꿔요`), 각각 `CHEV` | `<p class="caption">상대와 관리자가 모두 수락해야 바뀌어요.</p>` |
| 3 상대 선택 | `openSwapSheet()` `:2265-2289` | `BACK` + 제목 `포지션 교대 요청` + 캡션 `맡을 수 있는 포지션만 보여요` + `XICON` | `swapCandidates()` 결과 → 이름 + 부제 포지션 + `CHEV` | **없다** |

겹 1의 발치 세 갈래 (`:2232-2237`):

| 조건 | 발치 |
| --- | --- |
| `past` — `cellState(day) === "done"` | 캡션 `지나간 근무예요. 변경할 수 없어요.` (버튼 없음) |
| `asked` — `changing.has(day)` | 캡션 `변경 요청을 보냈어요. 관리자 확인을 기다리는 중이에요.` + 버튼 `변경 요청 거두기` (`data-act="cancelReq"`) |
| 나머지 | 버튼 `근무 변경 요청` (`data-act="change"`) |

`past`가 `asked`보다 먼저 검사되므로 **지난 근무는 요청 중이어도 「지나간 근무예요」만 뜬다.**

`swapCandidates()` (`:2193-2204`): `myPosition()`(= `ASSIGN.me`가 든 그룹 이름)과 같은 그룹은 제외,
`ASSIGN.myPositions`에 없는 그룹도 제외, 남은 그룹의 `people`만 담는다. **`trainees`는 어느 그룹에서도 안 담긴다.**
시안 데이터로는 이수민(드레스) · 최은지(안내) · 한지우(안내) 셋. 김서연(팀장)은 `myPositions`에 팀장이 없어 빠진다.

시트 닫힘 (`closeSheet()` `:2291-2294`): `scrim`·`bs`에서 `on` 제거만. **`bs.innerHTML`을 안 비운다** —
마지막 겹이 DOM에 남고, 260ms 내려가는 동안 계속 보인다. `sheetDay`도 리셋 안 한다.

### 4-5. 하단 변경 바

`renderBar()` (`:2109-2125`):

```
added   = pending 중 saved에 없는 날의 수
removed = saved 중 pending에 없는 날의 수
count   = added + removed
changebar.classList.toggle("on", count > 0);
if (count === 0) return;                    // ← 여기서 끝. changeText를 안 건드린다
```

- `count === 0`이면 **직전 텍스트가 그대로 남은 채** 바가 내려간다. 240ms 슬라이드 중 글자가 안 깜빡이게 하는 효과지만, 시안이 명시한 계약이 아니라 코드 순서의 결과다.
- 텍스트: `<span class="delta delta-pos">신청 +N</span>` · `<span class="delta delta-neg">취소 −N</span>`, 구분자는 `" · "`.
- **빼기 기호가 U+2212 `−`다**(`:2123`). 반면 D 배지는 ASCII 하이픈 `D-1`(`:2032`). 두 글자가 다르다.
- 색: `.delta-pos { color: var(--color-success) #087a4b }` · `.delta-neg { color: var(--color-text-muted) #7c828a }`.
- 버튼 라벨은 늘 `신청하기` 고정. 비활성 상태가 없다.

### 4-6. 지난 모집 펼침

`pastOpen` Set에 index 토글 → `renderList()`가 다시 그리며 `.chevron-open`을 붙이고, 펼쳤을 때만
`batch.worked` 각 항목을 `<div class="trow">`(버튼 아님) + `<span class="pill">근무</span>`로 깐다.

`pastShown` (초기 2) → `body` scroll이 바닥 80px 안에 들면 `+2`씩, `PAST.length`(6)에서 멈춘다.
발치 캡션: `pastShown < PAST.length`면 `불러오는 중…`, 아니면 `더 없어요` (`:2103-2105`).

---

## 5. 화면 컨트롤 — 렌더 규칙

### 달력 발치 세 줄 (`:1238-1242`)

| 요소 | 규칙 |
| --- | --- |
| `#calFoot` | `신청 가능 N일` · `신청 N일` · `근무 N일` 중 0이 아닌 것만 `" · "`로 잇는다. 전부 0이면 빈 문자열 → `.cal-foot .caption:empty { display: none }`(`:618-620`)이 줄을 없앤다 |
| `#calDue` | 열린 날이 하나라도 있는 배치 중 `left` 최소인 것 → `<b>{deadline}</b>까지 신청할 수 있어요`. 없으면 `지금은 열려 있는 모집이 없어요`. **`innerHTML`로 넣는다** |
| `#allBtn` | `pickable === 0`이면 `disabled` + `선택할 날짜가 없어요`, 아니면 `{pickable}일 모두 선택` |

`counts.work`는 `base === "confirmed"`를 **과거·미래 구분 없이** 센다(`:1938`). `mixed`에서 확정 여덟 중
여섯(3·5·8·11·13·15)은 이미 `done`으로 그려지는데도 「근무 8일」로 합산된다.

### 목록 카드 (`:1994-2065`)

배치는 `batch.days` 중 `baseOf(day) === "open"`인 날만 남기고, 남은 날이 0인 배치는 통째로 빠진다.
정렬은 `batch.left` 오름차순. 전부 빠지면 `<div class="card"><p class="caption empty">지금은 열려 있는 모집이 없어요</p></div>` + 지난 모집.

머리행: `D-{left}` 배지 + `신청 기간 · 근무 {N}일` 라벨 + `{start} ~ {deadline}` 값 + 알약.
배지 등급 (`:2031`): `left === 1` → `.dbadge-d1`(`--color-action-tint-strong` 채움), `left === 2` → `.dbadge-d2`(`--color-action-tint`), 그 외 기본(`--color-surface-weak`).
지난 모집 배지는 `끝` 글자에 등급 없음.

날짜 행: `8월 {day}일 {DOW[(firstDow + day - 1) % 7]}` + `pillMarkup(day)`.

`pillMarkup` (`:1976-1992`):

| 셀 상태 | 알약 |
| --- | --- |
| `added` | `.pill.pill-added` + `＋` 아이콘(`M12 5v14M5 12h14`) + `선택됨` — 글자색 `--color-success` |
| `removed` | `.pill.pill-removed` + `−` 아이콘(`M5 12h14`) + `취소` — 글자색 `--color-text-muted` |
| `requested` | `.pill.pill-requested` `신청 완료` — `--color-action-tint` 채움 / `--color-action-deep` 글자 |
| 나머지 | `.pill` `신청` |

알약은 전부 `<span>`이다 — **누를 수 있는 것은 행 전체**다. 그런데 `.pill:active { transform: scale(0.94) }`가
`<span>`에도 걸려 있어, 행을 누르면 행(0.985)과 알약(0.94)이 **동시에 다른 배율로 줄어든다.**

---

## 6. 시안에만 있는 값 — 사다리에 없는 것

### 낯선 반지름 (토큰은 14/16/20/pill뿐, `:33-36`)

| 값 | 어디 | 비고 |
| --- | --- | --- |
| **`12px`** | `.dpad` `:524` · `.dcell.today` `:536` | 토큰 없음. 두 곳이 같은 값을 쓴다 |
| **`11px`** | `.dbadge` `:737` | 토큰 없음. **홈 라운드 38에도 같은 `11px`가 나왔다** — 같은 값이 두 화면에 있으므로 우연이 아닐 수 있다 |
| `20px 20px 0 0` | `.bs` `:1041` | 값은 `--radius-xl`과 같은데 **토큰을 안 쓰고 리터럴로 적었다** |
| `20px` | `.panel` `:103` | 조작판 — 시안 밖 도구라 무시해도 된다 |

### 낯선 치수

| 값 | 어디 | 비고 |
| --- | --- | --- |
| `height: 46px` | `.dcell` `:504` | 아래 「어긋난 값」 참조 |
| `38px × 38px` | `.dpad` `:522-523` | |
| `height: 26px` | `.dhead` `:493` | |
| `height: 34px` | `.pill` `:761` | |
| `height: 36px` | `.seg button` `:426`, `.seg { gap: 2px; padding: 3px }` `:418-419` | 2·3px는 사다리 밖 |
| `height: 44px` | `.changebar .button` `:871` | `.button` 기본은 `52px`(`:846`). 변경 바 안에서만 44 |
| `height: 64px` | `.tabbar` `:305` · `.changebar` `:831` | 둘이 같은 값 — 바가 탭바를 정확히 덮는다 |
| `bottom: 84px` | `.toast` `:897` | `64 + 20` |
| `padding: 80px 16px 16px` | `.phone-body` `:256` | 헤더 `24 + 56` |
| `1.5px` | `.dcell.chg::after` box-shadow `:1170` | 반픽셀 |
| `2.5px` | `.dcell::after` `margin-left: -2.5px` `:567` | 5px 점의 절반 |
| `stroke-width: 2.4` | `.pill svg` `:798` | 다른 svg는 전부 `2`. 알약 아이콘만 2.4 |
| `blur(9px)` | `.phone-header` `:207-208` | 홈과 같은 9px |
| `rgba(241, 243, 246, 0.5)` | `.phone-header` `:206` | `--color-canvas`의 50% — 토큰 아님 |
| `rgba(10, 11, 13, 0.4)` | `.scrim` `:1018` | `--color-text-strong`의 40% |
| `rgba(10, 11, 13, 0.86)` | `.toast` `:901` + `color: #fff` | 0.86 · `#fff` 리터럴 |
| `max-height: 76%` | `.bs` `:1038` | |
| `translateY(110%)` | `.changebar` `:835` | 100%가 아니라 110% — 그림자 여유 |
| `margin: -10px …` | `.cal-nav` `:468` · `.bs-icon` `:1068` · `.bs-icon.lead` `:1076` | 44px 타겟을 만들면서 시각 여백은 유지하는 음수 마진 |
| `margin: 0 0 1px` | `.trow-label` `:725` | 1px |
| `margin: 20px 4px 8px` | `.past-title` `:687` | |
| `-80` | scroll 임계 `:2400` | 바닥에서 80px |
| `90` | wheel 누적 임계 `:2461` | |

### 타이포 — 시안이 쓰는 조합

| 크기/행간/무게 | 어디 |
| --- | --- |
| 22/30 600 | `.screen-title` `:213-215` |
| 18/26 500 | `.trow-value` `:672-674` — 목록 카드 머리행 |
| 16/24 400 | `.trow-value.trow-date` `:718-720` — 날짜 행. `.trow-value`의 18/26 500을 덮어쓴다 |
| 16/24 500 | `.cal-month` `:456-458` |
| 16/24 500 | `.dnum` `:529-530` (무게는 상태별 500 or 기본) |
| 16/24 600 | `.bs-title` `:1091-1093` |
| 16/24 400 | `.brow` `:1112-1113` |
| 14/20 600 | `.button` `:852-854`, `.button-quiet`는 400(`:866`) |
| 14/20 400→500 | `.seg button` `:431-432`, 선택 시 500(`:443`) |
| 13/18 | `.caption` · `.dhead` · `.trow-label` · `.dbadge`(600) · `.pill` · `.brow-tag` · `.brow-sub` · `.bs-group-title`(500) · `.past-title`(500) · `.toast` |
| `font-variant-numeric: tabular-nums` | `.cal-month` `.dnum` `.trow-value` `.dbadge` `.delta` |

---

## 7. 목업 데이터

### `ASSIGN` (`:1765-1775`)

```
{ hall: "라비에벨 그랜드홀",
  me: "윤태관",
  myPositions: ["메인", "드레스", "안내"],
  groups: [ { name, people: string[], trainees: string[] }, … ] }
```

넷: 팀장(김서연/—) · 메인(윤태관·박지호/정하윤) · 드레스(이수민/—) · 안내(최은지·한지우/—).

**시안 본문 `:1543-1544`은 「포지션 순서는 고정 아홉이다 — 팀장 · 스캔 · 메인 · 드레스 · 축가 · 신부 대기실 · 드레스실 · 매니저 · 안내」라고 못 박는데 데이터는 넷뿐이다.** 「아무도 없는 포지션은 뺀다」는 규칙과 맞물리면 모순은 아니지만, **아홉 순서 배열이 시안 어디에도 코드로 없다** — 화면 코드가 그 순서를 어디서 받아야 하는지 시안이 말하지 않는다.

### `months` (`:1799-1837`)

```
{ firstDow: number, length: number, base: { [day]: state }, saved: number[], batches: Batch[] }
Batch = { start: string, deadline: string, days: number[], left: number }
```

- `mixed` — `firstDow: 6`(8/1 토), `length: 31`, 확정 8일(3·5·8·11·13·15·17·19) · 마감 2일(7·18) · 열림 8일(20·21·22·24·26·27·29·31), `saved: [20, 22]`, 배치 둘.
- `quiet` — 확정 셋(5·8·13), 열림·배치 없음.
- `none` — 전부 빈 값.

요일 검산: `firstDow: 6`, `TODAY = 17` → `DOW[(6 + 16) % 7] = DOW[1] = "월"`. 2026-08-17은 월요일 — **맞다.**
`left` 검산: 배치1 마감 8/18 → D-1 ✓, 배치2 마감 8/25 → D-8 ✓.
`saved: [20, 22]`는 둘 다 `base`가 `"open"` ✓.
`batches`의 `days` 합집합(20·21·22·24·26·27·29·31)이 `base`의 `open` 여덟과 정확히 일치 ✓.

### `PAST` (`:1790-1797`) — **자기모순**

```
{ start: "6월 26일", deadline: "7월 20일", worked: ["7월 3일 금", "7월 8일 수", "7월 11일 토", "7월 17일 금", "7월 25일 토"] }
```

살아 있는 배치는 **신청 마감 뒤에 근무가 온다**(배치1: 마감 8/18, 근무 8/20~27).
그런데 `PAST` 여섯 중 **다섯이 마감일보다 앞선 근무일을 담고 있다.**

| # | 신청 기간 | 마감 전 근무 | 마감 후 근무 |
| ---: | --- | --- | --- |
| 0 | 6/26 ~ **7/20** | 7/3 · 7/8 · 7/11 · 7/17 (넷) | 7/25 |
| 1 | 5/27 ~ **6/19** | 6/5 · 6/13 (둘) | 6/20 |
| 2 | 4/26 ~ **5/21** | 5/2 · 5/9 · 5/16 (셋) | 5/30 |
| 3 | 3/27 ~ **4/18** | 4/4 (하나) | 4/18은 마감일 당일 |
| 4 | 2/25 ~ **3/20** | 3/7 · 3/14 (둘) | 3/21 |
| 5 | 1/27 ~ **2/18** | 2/7 (하나) | 2/21 |

「신청 마감 7월 20일」인 모집에 「7월 3일 근무」가 들어 있다 — **신청하기 17일 전에 이미 일했다는 뜻**이라
말이 안 된다. 홈 시안의 마스킹 자릿수 오타와 같은 갈래의 데이터 오류다.
(요일 표기 `금`·`수`·`토`는 2026년 달력과 **전부 맞다** — 틀린 것은 마감일과의 앞뒤 관계뿐이다.)

### 그 밖

- `DOW = ["일","월","화","수","목","금","토"]` `:1777`
- `STATE_NAME` `:1778-1787` — 8쌍, `aria-label` 꼬리에만 쓴다
- `TODAY = 17` `:1788` — 하드코딩
- `SAMPLES` `:2478-2487` — 문서용 여덟 칸(12 none · 18 closed · 21 open · 20 requested · 19 confirmed · 8 done · 24 added · 22 removed). `paintSamples()`가 `#sampleA`에 `<span>`으로 그린다. **`.dcell`이 아니라 `<span class="dcell">`이라 `disabled`가 없고 `:1179-1182`가 `cursor: default`로 눌러 놓는다.** 화면 밖 물건

---

## 8. 갈 곳이 없는 링크·버튼

| 무엇 | 시안 | 시안이 말하는 목적지 | 현재 처리 |
| --- | --- | --- | --- |
| 헤더 종 | `:1208` | 알림 화면 | `data-toast="알림 화면으로 갑니다"` |
| 지난달 `‹` | `:1228` | 7월 달력 | `data-toast="7월로 갑니다"` — **월 이동이 구현돼 있지 않다.** `months`가 `mixed/quiet/none` 세 프리셋뿐이고 `cal-month`는 `2026년 8월` 하드코딩(`:1231`) |
| 다음달 `›` | `:1232` | 9월 달력 | `data-toast="9월로 갑니다"` |
| 마감된 날 셀 | `:2331` | 모집 상세 | `showToast("8월 " + day + "일 상세로 갑니다")` — **상세 화면 자체가 시안에 없다** |
| 탭 `홈` | `:1255` | 홈 | `showToast("홈 화면으로 갑니다")` |
| 탭 `급여` | `:1274` | 급여 | `showToast("급여 화면으로 갑니다")` |
| 탭 `전체` | `:1285` | 전체 | `showToast("전체 화면으로 갑니다")` |
| 배정표 시트 | `openSheet` | — | **시안 안에서 실제로 열린다.** 홈 라운드 38이 「`/roster/[date]` 라우트가 없다」고 지적한 그 시트와 같은 물건 — 일정 화면은 라우트가 아니라 인라인 시트로 그렸다. **두 화면이 같은 시트를 여는 방식이 다르다** |

### 탭바 부작용

`.tab` 핸들러(`:2420-2433`)는 **어느 탭을 눌러도** 모든 탭에서 `aria-current`를 떼고 눌린 탭에 붙인다.
그래서 `홈`을 누르면 화면은 일정 그대로인데 **탭바 강조만 홈으로 옮겨간다.** 토스트만 뜨고 안 돌아온다.
시안 밖 목업 편의인지 계약인지 판단하지 않는다.

---

## 9. 어긋난 값 — 시안 안에서 서로 맞지 않는 것

| # | 무엇 | 한쪽 | 다른 쪽 | CSS |
| ---: | --- | --- | --- | --- |
| 1 | **셀 높이** | `:1497` 「셀 높이가 **46 → 50으로 늘었다**」 | `:1534` 「칸 높이를 **50 → 46으로 줄여**」 | `.dcell { height: 46px }` `:504` — CSS는 뒤쪽 문장 편 |
| 2 | 셀 폭 | `:1516` 「칸 전체(**47×46**)」 | `.dcell`은 `grid-template-columns: repeat(7, 1fr)` — 폭 고정값 없음 | 폰 393 − 본문 패딩 32 − 카드 패딩 32 = 329, 329/7 = **47** — 계산은 맞다 |
| 3 | 본인 행 어법 | `:1548` 「`WORKER-FLOWS.md:71`은 **action tint**와 `나`」 | `:1549` 「라운드 22 확정본은 **파랑 500 글자**」 | `.brow .me { color: var(--color-action-deep); font-weight: 500 }` `:1126-1129` — 시안이 후자를 택했다고 본문이 명시 (충돌은 이미 해소 선언됨) |
| 4 | 포지션 개수 | `:1543` 「고정 아홉」 | `ASSIGN.groups` 넷 | 「아무도 없는 포지션은 뺀다」로 설명 가능하지만 **아홉 순서 배열이 코드에 없다** |
| 5 | 「확정 근무만 남은 달」 | 조작판 힌트 `:1335` | `quiet`의 확정 셋(5·8·13)이 전부 `TODAY(17)` 이전 → 전부 `done`(회색 점)으로 그려진다 | 힌트가 말하는 「확정」이 화면엔 안 나온다 |
| 6 | 근무 일수 | `#calFoot`의 `근무 8일` | 그중 여섯은 이미 `done` | `:1938`이 과거·미래를 안 가른다 |
| 7 | 빼기 기호 | 하단 바 `취소 −1` = U+2212 | D 배지 `D-1` = ASCII 하이픈 | `:2123` vs `:2032` |
| 8 | 겹 3 발치 | `:1615` 「그 자리에 **「상대와 관리자가 모두 수락해야 바뀌어요」**를 넣었다 … **세 겹 다 같은 시트**」 | `openSwapSheet()`에 발치 캡션이 **없다**. 그 문구는 겹 2에만 있다 | 실제로 보내는 버튼은 겹 3에 있는데 승인 안내는 겹 2에 있다 |
| 9 | `back` 동선 | 겹 3의 `BACK`은 「뒤로」 | `act === "back"` → `openSheet(sheetDay)` — 겹 1로 점프 | `:2303` |
| 10 | 방어 수준 | `#dgrid`는 `cell.disabled` 검사 | `#viewList`의 `[data-batch]`는 안 함 | `:2341` vs `:2370` |
| 11 | `PAST` 마감/근무 순서 | 위 7절 표 | — | 여섯 중 다섯이 모순 |

---

## 10. 죽은 선언 — 시안이 쓰지 않는 CSS

| 선택자 | 줄 | 비고 |
| --- | --- | --- |
| `.batch-foot` | `:622-624` | HTML·JS 어디에도 안 붙는다 |
| `.block-label` | `:398-405` | 같음 |
| `.trow-value-quiet` | `:681-684` | 같음 |
| `.modebench` · `.modetile` 계열 | `:972-1010` | 다른 라운드 목업에서 남은 것. 화면과 무관 |
| `cellMarkup(day, cls, interactive)`의 `cls`·`interactive` | `:1900` | 호출부가 `cellMarkup(day)` 하나뿐(`:1931`)이라 늘 `undefined` |
| `pastMarkup()`의 `if (pastShown === 0) return ""` | `:2068` | `pastShown`은 2에서 시작해 늘기만 한다 |

---

## 11. 접근성 — 시안이 선언한 것과 비운 것

| 무엇 | 상태 |
| --- | --- |
| 셀 `aria-label` | `8월 {day}일 {STATE_NAME[st]}` — **요일이 빠져 있다.** 목록 행에는 요일이 있다 |
| `#dhead` | `aria-hidden="true"` (`:1236`) — 요일 머리줄을 AT에서 통째로 감춘다 |
| `.dcell.st-blank` | `<span>`이고 `aria-label` 없음. 포커스 대상도 아님 |
| `.bs` | `role="dialog" aria-modal="true"` (`:1301`) — **닫혀 있을 때도 그대로다.** `hidden`·`inert`·포커스 트랩·`aria-labelledby` 없음 |
| `.toast` | `role`·`aria-live` 없음 — 스크린 리더가 못 읽는다 |
| `.changebar` | `aria-live` 없음 |
| `.tab` | `<button>`에 `aria-current="page"` |
| `.seg button` | `aria-pressed` 토글 |
| `:focus-visible` | 시안 전체에 **0건** |

---

## 확실하지 않은 것

- **`selectIn`의 전체 재생이 의도인지.** `render()`가 달력을 통째로 다시 그리므로 이미 선택된 칸까지 매번 되튄다는 것은 코드에서 확정적으로 읽히지만, 시안 본문에는 「이번에 손댄 칸은 전부 같은 파랑 박스를 얻는다」(`:1402`)까지만 있고 **재생 범위를 말하는 문장이 없다.** 홈 라운드 38이 같은 구조를 계약으로 적었으므로 그쪽에 맞추면 되겠지만, 「매번 전부」인지 「방금 누른 것만」인지는 사람이 정할 일이다.
- **`.chevron-open`에 전이가 없는 것이 의도인지.** 다른 모든 상태 변화에는 전이가 붙어 있는데 셰브런만 없다. 다만 `renderList()`가 DOM을 새로 만들기 때문에 전이를 붙여도 재생될지 자체가 불확실하다 — 시안이 그래서 뺐는지, 그냥 빠뜨렸는지 판단 못 하겠다.
- **`renderBar()`가 `count === 0`에서 텍스트를 안 지우는 것이 의도인지.** 240ms 슬라이드 중 글자 깜빡임을 막는 효과가 있어 의도로 읽을 수도 있지만, 코드에 그 의도를 드러내는 것이 없다.
- **탭바 강조가 눌린 탭으로 옮겨가는 것.** 시안 목업의 편의(실제 라우팅이 없어서)인지, 실제 화면에서도 그래야 하는지 구분할 근거가 시안에 없다. 실제 앱에서는 라우팅이 강조를 옮기므로 결과가 같아 보일 수 있으나, 「일정에 머문 채 홈 강조」라는 중간 상태는 시안에만 있는 것일 수 있다.
- **`.dbadge`의 `11px`.** 홈 시안에도 같은 `11px`가 있다는 것은 라운드 38 기록으로 알지만, 홈의 그 `11px`가 같은 컴포넌트(D 배지)인지 다른 것인지 이 파일만 보고는 확인 못 했다.
- **`quiet` 프리셋의 뜻.** 조작판 힌트는 「확정 근무만 남은 달」인데 화면에는 지난 근무만 나온다. 데이터를 잘못 넣은 것인지, `TODAY`를 옮겨 보라는 뜻인지 시안이 말하지 않는다.
- **`PAST`의 `worked` 날짜가 「그 모집으로 잡힌 근무」가 아니라 「그 기간에 한 근무」일 가능성.** 라벨이 `신청 기간 · 근무 N일`이라 전자로 읽었고 살아 있는 배치도 전자로 동작하지만, 후자로 읽으면 모순이 아니게 된다. 어느 쪽인지는 기획이 답할 일이다.
