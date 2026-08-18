# 일정 화면 퍼블리싱 — 읽기 전용 대조

대조 대상
- 시안: `docs/execution/runs/P0-T48/design/confirmed/schedule.html` (2512줄, 이하 `시안:줄`)
- 구현: `src/views/schedule/**`, 그리고 그 화면이 실제로 그리는 `src/shared/ui/calendar.tsx`·`segmented-control.tsx`, `src/features/application/ui/ApplicationChangeBar.tsx`
- 규칙: `docs/execution/runs/P0-T48/design/NOTES.md`(이하 `NOTES:줄`), `docs/product/design/FOUNDATIONS.md`, `docs/execution/radio/P0-T48-radio.md`(이하 `RADIO:줄`), `eslint.config.mjs`, `docs/standards/DEVELOPMENT.md`

시안 판정에서 조작판·설명 영역(`.panel`·`.sheet-note`·`.callout`·`.state-table`·`.section-*`·`.modetile`·`.samples`)은 제품 UI가 아니므로 제외했다. 판정 근거는 `.phone` 안쪽 마크업(`시안:1205-1304`)과 그것이 쓰는 CSS·스크립트뿐이다.

---

## 1. 구조 차이

### 1-A. 시안에 있는데 구현에 없는 것 (12건)

1. **달력 발치 세 줄이 통째로 없다.** 시안은 카드 발치에 요약 줄·마감 줄·`N일 모두 선택` 버튼 셋을 둔다 — `시안:1238-1242`(`calFoot`·`calDue`·`allBtn`), CSS `시안:602-628`, 렌더 `시안:1944-1973`, 확정 규칙 `NOTES:388-391`·`NOTES:843-854`. 구현의 달력 블록은 `Calendar` 한 덩어리로 끝난다 — `ScheduleView.tsx:128-137`.
2. **요약 줄의 세 갈래 셈이 없다.** 시안은 `신청 가능 N일 · 신청 N일 · 근무 N일` 순으로, **저장된 것만**, 0인 갈래는 빼고 센다 — `시안:1935-1948`, `NOTES:773-775`. 구현에 대응하는 model 함수가 없다.
3. **가장 급한 마감 줄이 없다.** `<b>8월 18일</b>까지 신청할 수 있어요` / 빈 달이면 `지금은 열려 있는 모집이 없어요` — `시안:1950-1961`.
4. **`N일 모두 선택` 버튼과 그 비활성 상태가 없다.** 고를 게 없으면 `선택할 날짜가 없어요`로 비활성 — `시안:1963-1973`, `NOTES:390`·`NOTES:853-854`.
5. **셀의 점이 없다.** 확정은 파란 점 5px, 지난 근무는 회색 점, 변경 요청 중이면 속 빈 점 — `시안:560-575`·`시안:1168-1171`, `NOTES:371-372`. `calendar.tsx`에 점을 그리는 코드가 없다.
6. **`done`(지난 근무) 상태가 없다.** 시안은 `base === "confirmed" && day < TODAY`를 `done`으로 가른다 — `시안:1852`. 구현 `schedule-cell-state.ts:10-13`의 `ScheduleEntryState`는 `open | selected | requested | closed | confirmed` 다섯뿐이고 `toScheduleEntryState`가 today를 아예 안 받는다(`schedule-cell-state.ts:15-19`).
7. **목록이 「회차 카드」가 아니다.** 시안 카드 머리행은 왼쪽 D 배지 · 라벨 `신청 기간 · 근무 N일` · 값 `7월 28일 ~ 8월 18일` · 오른쪽 `N일 모두 선택` 알약 — `시안:2026-2044`, `NOTES:396-399`·`NOTES:836-838`. 구현 머리행은 `N일 남음`(위) + 마감 날짜 캡션(아래) + `모두 선택` 버튼 — `DeadlineBatchList.tsx:126-154`. D 배지가 없고 모집 기간 시작일이 없다.
8. **「지난 모집」 섹션과 무한 스크롤이 없다.** 배지 `끝`, 접힌 카드, 두 회차씩, 끝나면 `더 없어요` — `시안:2067-2107`·`시안:2395-2405`, `NOTES:398-399`·`NOTES:839-840`, RADIO 인수 조건 13(`RADIO:104`). 구현은 지난 것을 `deadline: null` 묶음 하나로 맨 뒤에 붙인다 — `deadline-batches.ts:83-85`.
9. **배정표 바닥 시트가 없다.** 확정·지난 근무 날짜를 누르면 열린다 — `시안:2206-2240`·`시안:2324-2329`, `NOTES:407-410`. 라우트도 없다: `src/app/(protected)/(tabs)/@sheet/`에 `default.tsx` 하나뿐이고 `roster/[date]`가 없다. RADIO 인수 조건 26(`RADIO:117`)과 Architecture(`RADIO:320-326`)가 요구한 자리다. `NOTES:1118-1119`가 홈 감사에서 이미 같은 결함을 적었다.
10. **`근무 변경 요청` 겹 시트가 없다** — `시안:2242-2263`. (교대 겹 `시안:2265-2289`는 RADIO 비목표라 제외.)
11. **하단 변경 바의 등장 애니메이션·탭바 덮기가 없다.** 시안은 `position: absolute; bottom: 0`으로 탭바 자리를 덮고 `translateY(110%)`에서 올라온다 — `시안:821-841`, `NOTES:404`·`NOTES:865`. 구현은 탭바 **위**에 뜬다 — `ApplicationChangeBar.tsx:34`의 `bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]`.
12. **당김 새로고침 슬롯의 시안 형태가 다르다.** 시안은 높이 0→44 슬롯 + 20px 스피너 — `시안:266-291`·`시안:1218`. 구현은 `RouterPullToRefresh`(`ScheduleView.tsx:120`)이고 `NOTES:1067`이 이미 「다름 — 터치 드래그 `translateY`」로 판정했다.

### 1-B. 구현에만 있는 것 (8건)

1. **`PushPrimingSheet`** — `ScheduleView.tsx:14,152`. 시안 `.phone` 안에 대응물이 없다.
2. **undo 분기** — `ApplicationChangeBar.tsx:18-31`의 `방금 변경한 N개 날짜 되돌리기`. 시안은 undo를 없앴다(`시안:1700-1707`, `NOTES:402`·`NOTES:1367`), `WORKER-FLOWS.md:56-57`도 이미 「Undo는 없다」로 개정됐다.
3. **셀 안 상태 배지 글자** — `calendar.tsx:34-38,80-84`가 `신청`·`마감`·`확정`을 셀 안에 9px로 찍는다. 라운드 1의 「셀에 배지·범례를 넣지 않는다」와 정면 충돌 — `시안:1366-1368`, `NOTES:385-386`.
4. **선택 셀의 체크 아이콘** — `calendar.tsx:79`. 시안은 파란 네모박스 하나다 — `시안:577-582`.
5. **`applicationCount` 우상단 카운트 배지** — `calendar.tsx:85-92`. 시안에 없다.
6. **`모두 해제` 토글** — `DeadlineBatchList.tsx:152`. `NOTES:390`이 「「모두 해제」는 없다」, `NOTES:860-861`이 그 기능이 이미 신청한 날까지 취소로 만들던 결함을 적었다.
7. **행 왼쪽 세로 막대(`before:` 바)** — `DeadlineBatchList.tsx:25-28,63-68`. 시안 행에는 앵커가 비어 있다(`시안:2048-2054`, `NOTES:750-751`).
8. **행 오른쪽 사각 칩** — `DeadlineBatchList.tsx:11-15,88-96`(`rounded-sm`). 시안은 pill 알약이고 낱말도 다르다(3-C 참조).

### 1-C. 순서가 다른 것 (2건)

1. **목록 행의 라벨/값 순서.** 시안 머리행은 라벨 위(`신청 기간 · 근무 8일`) 값 아래(`7월 28일 ~ 8월 18일`) — `시안:2034-2040`, `NOTES:873`. 구현은 값 위(`N일 남음`) 캡션 아래(마감 날짜) — `DeadlineBatchList.tsx:128-139`.
2. **지난 것의 자리.** 시안은 열린 회차 전부 → `지난 모집` 제목 → 지난 카드들 → `더 없어요` — `시안:2063-2064`·`시안:2070`. 구현은 열린 묶음 뒤에 이름 없는 묶음 하나를 붙인다 — `deadline-batches.ts:83-85`, 라벨은 `지나갔어요` — `DeadlineBatchList.tsx:131`.

---

## 2. 값 차이

**굵기 700 먼저.** 시안 파일 안의 `font-weight: 700`은 여섯 곳이고 전부 조작판·설명 영역이다 — `시안:60`(`.sheet-title`) · `시안:111`(`.panel h2`) · `시안:131`(`.panel-group > span`) · `시안:937`(`.state-table th`) · `시안:956`(`.section-title`) · `시안:990`(`.modetile h3`). `.phone` 안쪽 제품 UI에는 700이 한 글자도 없다. 불변 규칙(`RADIO:73`)과 부딪히지 않는다.

### 2-A. 세그먼트 (7건)

| 항목 | 시안 | 구현 |
| --- | --- | --- |
| 통 radius | `--radius-pill` (`시안:420`) | `rounded-md` 14px (`segmented-control.tsx:29`) |
| 통 배경 | `--color-surface-weak` `#f2f4f6`→코드 `#f1f3f6` (`시안:421`) | `bg-surface-strong` `#eef0f3` (`segmented-control.tsx:29`) |
| 통 padding | 3px (`시안:419`) | `p-1` 4px (`segmented-control.tsx:29`) |
| 칸 사이 | gap 2px (`시안:418`) | `gap-1` 4px (`segmented-control.tsx:29`) |
| 칸 radius | pill (`시안:428`) | `rounded-sm` 8px (`segmented-control.tsx:42`) |
| 글자 | 14/20, 선택 500 · 비선택 400 muted (`시안:429-433,443`) | `typo-caption font-semibold` 13/18 600 양쪽 다 (`segmented-control.tsx:42`) |
| 칸 높이 | 36px (`시안:426`) | `py-1.5`로 자동 (`segmented-control.tsx:42`) |

`NOTES:758-759`와 `NOTES:1372`가 「세그먼트 선택 500 / 비선택 400」을 계층 표에 더하라고 적었다.

### 2-B. 달력 셀 (8건)

| 항목 | 시안 | 구현 |
| --- | --- | --- |
| 셀 높이 | 46px (`시안:504`) | 지정 없음, day-picker 기본 (`calendar.tsx:73` `size-11`) |
| 판 크기 | 38×38 (`시안:520-521`) | 44×44 (`calendar.tsx:73` `size-11`) |
| 판 radius | 12px = `radius-cell` (`시안:524`) | `rounded-md` 14px (`calendar.tsx:73`) |
| 숫자 | 16/24 (`시안:529-530`) | `typo-caption` 13/18 (`calendar.tsx:73`) |
| 오늘 | 칸 전체 `inset 0 0 0 1px var(--color-border)` `#e5e8eb` + radius 12 (`시안:535-538`) | 판에 `ring-1 ring-action ring-inset` — 색이 `#0052ff` (`calendar.tsx:75`) |
| 상태 표현 | 채움은 선택 칸에만, 나머지는 숫자 색 (`시안:540-558`) | 상태마다 배경 채움 (`calendar.tsx:24-32`) |
| 선택 채움 | `--color-action-tint-strong` `#cfe0fc` (`시안:579`) | `bg-action-surface` `#eef4ff` + `text-action` (`calendar.tsx:27`) |
| 요일 머리 | 26px 높이 13/18 muted (`시안:490-497`) | day-picker 기본 |

오늘 테두리의 `ring-action`은 「가장 강한 파랑은 버튼 하나의 것」(`RADIO:74`, `NOTES:786-788`)과 부딪힌다. `bg-action-surface` `#eef4ff`는 RADIO 미결 사항(`RADIO:494`)이 「시안이 한 번도 안 쓴다」고 지목한 값이다.

### 2-C. 목록 카드와 행 (9건)

| 항목 | 시안 | 구현 |
| --- | --- | --- |
| 카드 안 여백 | `padding: 4px 16px` (`시안:395`) | `px-1 py-1.5` = 4px/6px (`DeadlineBatchList.tsx:125`) |
| 카드 사이 | 12px (`시안:694-697`, `NOTES:879`) | `gap-2.5` 10px (`DeadlineBatchList.tsx:118`) |
| 행 padding | `12px 0` (`시안:646`) | `px-3 py-2.5` (`DeadlineBatchList.tsx:61`) |
| 행 안 gap | 14px (`시안:644`) | `gap-2.5` 10px (`DeadlineBatchList.tsx:61`) |
| 행 radius | 없음 (`시안:641-653`) | `rounded-md` (`DeadlineBatchList.tsx:61`) |
| 행 구분선 | `1px solid var(--color-border)` `#e5e8eb` (`시안:655-657`) | `h-px bg-canvas` `#f1f3f6` (`DeadlineBatchList.tsx:158`) |
| 날짜 행 값 | 16/24 **400** (`시안:717-721`, `NOTES:877-878`) | `typo-body-strong` 16/24 500 (`DeadlineBatchList.tsx:74`) |
| 머리행 값 | 18/26 500 (`시안:672-674`) | `typo-label` 14/20 600 (`DeadlineBatchList.tsx:128`) |
| 알약 | height 34, `padding 0 14`, radius pill, 13/18 400 (`시안:756-769`) | `rounded-sm px-2 py-0.5 typo-caption font-semibold` (`DeadlineBatchList.tsx:91`) |

`모두 선택` 버튼도 시안은 pill 어법(`시안:2042`)인데 구현은 `rounded-sm bg-surface-strong px-2.5 py-1 typo-caption font-semibold`다(`DeadlineBatchList.tsx:150`).

### 2-D. 하단 변경 바 (5건)

| 항목 | 시안 | 구현 |
| --- | --- | --- |
| 자리 | `absolute bottom: 0`, 탭바를 덮음 (`시안:822-833`) | 탭바 위 `bottom-[calc(4rem+...)]` (`ApplicationChangeBar.tsx:34`) |
| 높이 | 64px + `padding 0 16` (`시안:831-832`) | `p-4`로 자동 (`ApplicationChangeBar.tsx:34`) |
| 왼쪽 글자 | `신청 +N`(success `#087a4b`) · `취소 −N`(muted), 13/18 (`시안:2122-2123`, `시안:880-890`) | `{changeCount}개 변경`, `typo-label text-text-strong` (`ApplicationChangeBar.tsx:35`) |
| 버튼 | height 44, `padding 0 20`, `radius-lg`, 14/20 600 (`시안:869-873`) | 공용 `Button` 기본 (`ApplicationChangeBar.tsx:36-43`) |
| 본문 하단 여백 | 바가 탭바를 덮으므로 96px 성격 | `pb-nav-action-safe` 112px (`ScheduleView.tsx:121`) — FOUNDATIONS.md:112-115 기준 「탭 바 위에 떠 있는 행동 바」용 값 |

### 2-E. 바닥 시트 (3건, 배정표를 세울 때)

| 항목 | 시안 | 구현(`shared/ui/bottom-sheet.tsx`) |
| --- | --- | --- |
| 제목 | 16/24 600 (`시안:1089-1094`) | `typo-title` 18/26 500 (`bottom-sheet.tsx:37`) |
| 최대 높이 | 76% (`시안:1038`) | `max-h-[85vh]` (`bottom-sheet.tsx:33`) |
| 딤 | `rgba(10,11,13,0.4)` (`시안:1018`) | `bg-text-strong/40` — 값 일치 (`bottom-sheet.tsx:30`) |

행 어법은 `padding 10px 0` · 16/24 · 행 사이 hairline · 본인은 `--color-action-deep` 500 — `시안:1102-1129`. 대응 구현 없음.

### 2-F. 낱말 (5건)

| 자리 | 시안 | 구현 |
| --- | --- | --- |
| 신청 완료 상태 이름 | `신청 완료` (`시안:1784`) | `신청` (`calendar.tsx:18`), `신청함` (`DeadlineBatchList.tsx:12,18`) |
| 담은 상태 이름 | `신청에 추가함` (`시안:1781`) | `선택됨` (`calendar.tsx:17`, `DeadlineBatchList.tsx:19`) |
| 취소 예정 알약 | `취소` + `−` 아이콘 (`시안:1984-1988`) | 대응 없음 |
| 저장 토스트 | `신청이 완료되었어요` (`시안:2348`, `NOTES:402`) | `근무 가능일을 변경했어요` (`useApplicationBatch.ts:27`) |
| 빈 목록 | `지금은 열려 있는 모집이 없어요` (`시안:2013`, `NOTES:412-413`) | `이번 달 모집이 아직 없어요` (`DeadlineBatchList.tsx:112`) |

---

## 3. 동작·모션 차이

### 3-A. 시안에 선언됐는데 구현에 없는 모션 (7건)

1. **셀 선택 되튐 420ms.** `animation: selectIn 420ms cubic-bezier(0.32,0.72,0,1)`, `transform-origin: 50% 100%` — `시안:577-600`. `NOTES:1076`이 「#10 주 셀 선택 — 없음」으로 판정했다. 유틸리티는 이미 있다: `globals.css:331-334` `motion-select-in`. `calendar.tsx`가 안 쓴다.
2. **변경 바 슬라이드업.** `translateY(110%)` → `0`, 240ms 강조 커브 — `시안:835-841`. 구현에 전이가 없다(`ApplicationChangeBar.tsx:20,34`).
3. **행 눌림 scale .985.** 시안 `시안:652,659-661`. 구현 `DeadlineBatchList.tsx:62`가 `active:scale-[0.985]` + `duration-[var(--duration-feedback)]`로 이미 맞다 — **일치하는 유일한 항목**. 다만 시안의 헤더 행·과거 행에도 같은 눌림이 붙는데(모든 `.trow`) 구현의 `모두 선택` 버튼만 `active:scale-95`로 다르다(`DeadlineBatchList.tsx:150`, 시안 알약은 `.94` — `시안:774-776`).
4. **바닥 시트 슬라이드업 260ms + 딤 페이드 200ms** — `시안:1021,1044`. 시트 자체가 없다. `NOTES:1081-1082`가 「#15·#16 — 없음」.
5. **당김 새로고침 슬롯 높이 200ms** — `시안:271`. 형태가 다르다(1-A-12).
6. **스피너 700ms linear infinite** — `시안:284`. `NOTES:1097`이 `animate-spin` 그대로 쓰기로 결정했으므로 값 차이는 해소됐으나, 시안의 20px·2px 테두리·top-color action(`시안:278-285`)을 쓰는 자리가 구현에 없다.
7. **토스트 180ms 등장 + 1400ms 유지** — `시안:892-915`, `시안:2437-2444`. 구현은 sonner 기본값(`NOTES:1083` 「다름」).

### 3-B. 이벤트·분기가 다른 것 (5건)

1. **확정 날짜 탭의 목적지.** 시안 `시안:2325-2328`: `confirmed`·`done`이면 배정표 시트를 연다. 구현 `ScheduleView.tsx:101-107`: `OPEN`이 아니면 무조건 `/schedule/{date}` 상세로 push. 마감 날짜만 상세로 가는 것이 시안(`시안:2330-2332`)이다.
2. **`모두 선택`의 의미.** 시안은 **담기 전용**이다 — 달력 발치 버튼은 열린 날 전부를 `pending`에 add만 하고(`시안:2407-2413`), 목록 머리행도 add만 한다(`시안:2369-2382`). 구현은 `!allSelected`로 토글해서 해제까지 한다 — `DeadlineBatchList.tsx:144-149`.
3. **`모두 선택`이 세는 수.** 시안은 아직 안 담은 것만 센다(`N일 모두 선택`) — `시안:1967-1973`·`시안:2022-2024`. 구현은 라벨에 수가 없다.
4. **저장 후 상태.** 시안은 바가 걷히고 토스트 하나 — `시안:2345-2349`. 구현은 undo 바가 그 자리에 남는다 — `ApplicationChangeBar.tsx:18-31`.
5. **취소 표시.** 시안은 저장된 신청을 다시 누르면 `removed`(박스 + muted 숫자)로 남는다 — `시안:1857`, `시안:1984-1988`. 구현은 `open`으로 되돌아가 흔적이 사라진다 — `schedule-cell-state.ts:26-29`.

---

## 4. 로직이 UI에 남아 있는 곳

### 4-A. `eslint.config.mjs`의 예외 두 줄

`eslint.config.mjs:112-113`이 `src/views/schedule/ui/DeadlineBatchList.tsx`와 `src/views/schedule/ui/ScheduleView.tsx`를 이름으로 대어 `project/no-logic-in-ui`를 끈다(`eslint.config.mjs:116` `rules: { "project/no-logic-in-ui": "off" }`). RADIO 인수 조건 19~20(`RADIO:110-111`)이 「예외 목록이 P0-T49~T54에서 한 줄씩 줄어든다」·「**홈·일정의 `ui` 파일에 이 규칙의 예외가 하나도 없다**」이므로, 이 두 줄은 **이번 task가 지워야 하는 줄**이다.

### 4-B. 예외를 지우면 터지는 것 — 15건 (실측)

플러그인을 스크래치패드 probe 설정으로 두 파일에만 걸어 실제로 돌린 결과다(저장소 파일은 손대지 않았다).

`DeadlineBatchList.tsx` — 11건
| 줄:칸 | 무엇 | 코드 |
| --- | --- | --- |
| 39:17 | `new Date` | `format(new Date(\`${workDate}T00:00:00\`), …)` |
| 43:17 | `new Date` | `format(new Date(\`${deadline}T00:00:00\`), …)` |
| 109:7 | `.length` | `if (batches.length === 0)` |
| 120:28 | `filter` | `batch.rows.filter((row) => row.selectable)` |
| 122:11 | `>` 비교 | `selectable.length > 0` |
| 122:11 | `.length` | 같은 줄 |
| 122:36 | `every` | `selectable.every((row) => row.state === "selected")` |
| 141:16 | `>` 비교 | `{selectable.length > 0 ? (` |
| 141:16 | `.length` | 같은 줄 |
| 146:23 | `map` (JSX 밖) | `onToggleBatch(selectable.map(...), !allSelected)` — 콜백 인자라 JSX 통과 예외를 못 받는다 |
| 158:18 | `>` 비교 | `{index > 0 ? <div …/> : null}` |

`ScheduleView.tsx` — 4건
| 줄:칸 | 무엇 | 코드 |
| --- | --- | --- |
| 61:31 | `new Date` | `new Date(\`${monthParam}-01T00:00:00\`)` |
| 66:9 | `filter` | `schedules.filter((s) => s.status !== "CANCELLED")` |
| 66:9 | `map` (JSX 밖) | 같은 체인의 `.map(...)` — `new Map()` 인자라 통과 못 함 |
| 132:22 | `new Date` | `new Date(\`${today}T00:00:00\`)` |

### 4-C. 린트가 못 잡지만 규칙 위반인 것 (3건)

`no-logic-in-ui.mjs:108-134`는 **MemberExpression 호출**만 본다. 평범한 식별자 호출은 안 걸린다.

1. `DeadlineBatchList.tsx:39,43` — `format(...)`(date-fns) 자체는 통과한다. 그러나 `RADIO:295`가 「시각과 포맷은 `model` 몫이다. `ui`는 완성된 문자열을 받는다」이고 `DEV-CODE-09`(`DEVELOPMENT.md:124`)도 같다. 날짜 라벨은 `model`로 내려가야 한다 — 홈이 그렇게 했다(`src/views/home/model/date-labels.ts:8-14`).
2. `ScheduleView.tsx:112,116` — `format(date, DATE_KEY_FORMAT)`.
3. `ScheduleView.tsx:52-58,95-117` — `handleApply`·`handleSelectWorkDate`가 분기 판정을 든다. `RADIO:82`가 「상태와 전이는 `hooks`, 판정은 `model`」이라 정했고 Architecture(`RADIO:372-374`)가 `useScheduleViewMode`·`useApplicationDraft` 둘을 명시했는데, 지금은 `useState`가 `ui` 안에 있다(`ScheduleView.tsx:49-50`). 인수 조건 21(`RADIO:112`)이 「`views/schedule/ui/**`에 `useState`·`useReducer`가 없다」다.

### 4-D. 참고 — `views/schedule/hooks/`가 아직 없다

`find src/views/schedule -type f` 결과에 `hooks/`가 없다. 인수 조건 22(`RADIO:113`)가 「훅 일곱(홈 둘 · 일정 **셋** · 공용 둘)이 각자 단위 테스트를 갖는다」인데 홈 둘(`views/home/hooks/`)과 공용 둘만 서 있다.

---

## 5. 기존 테스트가 굳혀 놓은 잘못된 계약

### 5-A. 시안과 정면으로 어긋나는 단언 (7건)

1. **`src/views/schedule/model/__tests__/schedule-cell-state.test.ts:118-128`** — 「savedApplied에는 있지만 pending에서 빠지면(철회 예정) **open으로 되돌아간다**」. 시안은 `removed`(파란 박스 + muted 숫자)로 남긴다 — `시안:1857`, `시안:1474-1479`. 라운드 28의 3차 지적(`NOTES:649-654`)이 정확히 이 결함을 잡은 것이다. **가장 비싼 항목** — 이 단언이 살아 있으면 취소 표시를 만들 수 없다.
2. **`src/views/schedule/ui/__tests__/ScheduleView.test.tsx:58-66`** — 「마감·**확정** 날짜를 탭하면 상세 라우트로 이동」하고 `push`가 `/schedule/2026-08-07`로 불렸다고 단언한다. 시안은 확정이면 배정표 시트다 — `시안:2325-2328`. RADIO 인수 조건 26(`RADIO:117`)이 「홈의 오늘 카드 발치와 일정의 확정 날짜가 같은 주소를 연다」.
3. **`ScheduleView.test.tsx:83-85`** — `방금 변경한 1개 날짜 되돌리기` 버튼 존재를 단언. undo는 폐기됐다 — `시안:1700-1707`, `NOTES:1367`, `WORKER-FLOWS.md:56-57`.
4. **`ScheduleView.test.tsx:78`** — `1개 변경`. 시안은 `신청 +1` — `시안:2122`.
5. **`ScheduleView.test.tsx:82`** — `근무 가능일을 변경했어요`. 시안은 `신청이 완료되었어요` — `시안:2348`.
6. **`ScheduleView.test.tsx:44`** — `8월 4일 신청`. 시안 상태 이름은 `신청 완료` — `시안:1784`.
7. **`ScheduleView.test.tsx:55,108,123`** — `8월 3일 선택됨`. 시안 상태 이름은 `신청에 추가함` — `시안:1781`.

### 5-B. 모델을 통째로 굳혀 놓은 것 (3건)

8. **`deadline-batches.test.ts` 전체(8개 케이스)** — 「마감일이 같은 일정을 한 묶음으로」라는 축을 굳힌다. 시안·NOTES의 축은 **모집 회차**다 — `NOTES:396-399`, RADIO Architecture `RADIO:370`(「회차가 보통 하나라는 전제로 고친다」), NOTES 개정 목록 `NOTES:1371`(상태 「5라운드 코드」). 특히 `deadline-batches.test.ts:64-85`가 지난 것을 `deadline: null` 묶음 하나로 맨 뒤에 두는 것을 단언해, 「지난 모집 회차별 카드 + 무한 스크롤」과 충돌한다.
9. **`deadline-batches.test.ts:116`** — 상태가 `["requested", "selected"]` 둘뿐이라고 단언. 시안 알약은 넷이다(`신청`·`선택됨`·`신청 완료`·`취소` — `시안:1976-1992`).
10. **`schedule-cell-state.test.ts:58-68`** — 「CONFIRMED는 pending 여부와 무관하게 confirmed」. 시안은 오늘보다 이전이면 `done`으로 갈라야 하므로(`시안:1852`) `toScheduleEntryState`가 기준 날짜를 받아야 한다. 지금 서명에는 그 인자가 없다(`schedule-cell-state.ts:15-19`).

### 5-C. 공백 — 아무 테스트도 안 덮는 계약 (2건)

11. **「마감돼도 내 신청을 잃지 않는다」.** 시안이 명시로 그렇게 그렸고(`시안:1757-1758`) RADIO Architecture가 「**내 신청을 마감이 덮지 않게** 고친다」(`RADIO:369`)고 적었다. 현재 구현은 status를 먼저 본다(`schedule-cell-state.ts:20-25`). `CLOSED` + `applicationStatus: "applied"` 조합을 검사하는 테스트가 한 건도 없다.
12. **빈 달의 발치 문구.** `ScheduleView.test.tsx:88-92`는 「신청 가능 버튼이 없다」만 본다. 「지금은 열려 있는 모집이 없어요」와 「선택할 날짜가 없어요」를 확인하는 단언이 없다 — `NOTES:412-413`.

---

## 6. 디자인 시스템에 없는 값 (의견만)

`FOUNDATIONS.md`의 간격 표(`:83-97`)·radius 표(`:121-129`)·모션 토큰(`:196-234`)과 대조했다.

### 6-A. 간격 사다리 밖 (12건)

| 값 | 자리 | 시안 근거 | 의견 |
| --- | --- | --- | --- |
| 14px | `.trow` 안 gap | `시안:644` | 12(`space-3`)로 스냅 가능해 보인다. 다만 앵커가 32px인 홈 행 어법(`PATTERNS.md` 「행」 절)과 나란히 재보는 편이 낫다 |
| 14px | `.pill` 좌우 padding | `시안:762` | 12 또는 16으로 스냅. 알약 하나뿐이라 흡수가 싸 보인다 |
| 34px | `.pill` 높이 | `시안:761` | 32(`space-8`)로 스냅. 다만 D 배지가 32이므로 나란히 서면 같은 높이가 되어 오히려 정렬이 맞는다 |
| 38×38 | `.dpad` | `시안:520-521` | 40(`space-10`)이 가장 가깝다. 셀 46 안에서 상하 4px씩 남는 구성이라 스냅하면 3px씩으로 좁아진다 — 실물로 봐야 판단이 선다 |
| 46px | `.dcell` 높이 | `시안:504` | 사다리 밖. 48(`space-12`)로 올리면 한 달 6주 기준 12px이 늘어난다 |
| 26px | `.dhead` 높이 | `시안:493` | 24(`space-6`)로 스냅 가능해 보인다 |
| 3px | `.seg` 통 padding | `시안:419` | 2(`space-0.5`) 또는 4(`space-1`) |
| 1px | `.trow-label` margin-bottom | `시안:725` | 0으로 걷거나 2(`space-0.5`) |
| 28px | `.empty` 상하 padding | `시안:815` | 24 또는 32 |
| 84px | `.toast` bottom | `시안:897` | 하단 고정 요소 여백 절(`FOUNDATIONS.md:106-117`)의 성격이다. sonner 기본 위치를 쓰면 사라진다 |
| 64px | `.changebar` 높이 | `시안:831` | 탭바와 같은 값이고 `spacing-nav-safe` 96 = 64 + safe-area의 근거가 이미 문서에 있다(`FOUNDATIONS.md:112`). `min-h-16`으로 흡수 가능 |
| 5px / 7px / 1.5px | 점 지름·바닥 거리·빈 점 테두리 | `시안:562-567`, `시안:1170` | 장식 치수다. 간격 사다리의 대상인지부터가 판단 지점 — 아이콘 stroke처럼 「형태와 깊이」 쪽에 이름을 주는 길도 있다 |

### 6-B. radius (1건, 이미 해결)

`.dbadge` radius 11px(`시안:737`)은 RADIO 인수 조건 33(`RADIO:124`)이 이미 `radius-cell` 12로 스냅하라고 정했다. `globals.css:76`에 `--radius-cell: 12px`이 서 있고 `d-badge.tsx:6`이 `rounded-cell`을 쓴다.

### 6-C. 모션 (2건)

1. **240ms — 변경 바 등장.** `시안:836`, 인수 조건 12(`RADIO:103`), `WORKER-FLOWS.md:53`이 셋 다 「240ms」를 글자로 적었다. 응답 대역 토큰은 150·200·250뿐이다(`FOUNDATIONS.md:196-201`). `NOTES:1099-1100`의 흡수 규칙(「260·280→overlay 250」)을 그대로 쓰면 250이 답이다. 의견: `--duration-overlay` 흡수가 자연스러워 보이나, **인수 조건과 승인된 문서 두 곳이 240을 명시**하고 있어 조용히 250으로 바꾸면 세 문서와 어긋난다. 사람 결정이 필요하다.
2. **1400ms — 토스트 유지 시간.** `시안:2443`. 지속시간이 아니라 대기라 대역 밖이고 `--duration-stagger`(지연)와도 성격이 다르다. sonner 기본을 쓰면 값 자체가 사라진다.

### 6-D. 색 (3건)

1. `rgba(10, 11, 13, 0.86)` — 토스트 배경 `시안:901`. 토큰 없음. sonner 기본을 쓰면 회피된다.
2. `rgba(10, 11, 13, 0.4)` — 딤 `시안:1018`. `bg-text-strong/40`이 같은 값이고 `bottom-sheet.tsx:30`이 이미 쓴다. 새 토큰 불필요.
3. `--color-pick-out: #e5e8eb` — `시안:28`에 선언만 있고 파일 전체에서 사용처가 0건이다(grep 1회 = 선언 줄). 죽은 선언으로 보인다.

### 6-E. 시안 안의 죽은 CSS (3건, 참고)

`.batch-foot`(`시안:622-624`) · `.block-label`(`시안:398-405`) · `.trow-value-quiet`(`시안:681-684`) 셋 다 마크업에 사용처가 없다. 퍼블리싱 대상이 아니다.

---

## 7. 허용 경로 밖

`RADIO:423-470`의 목록과 `RADIO:472-490`의 용도 한정을 기준으로 판정했다.

### 7-A. 목록에 아예 없는 파일 (3건)

1. **`src/features/application/hooks/useApplicationBatch.ts`** — 저장 토스트 문구가 이 파일 안에 있다(`:27` `근무 가능일을 변경했어요`, `:182` `showSnackbar(SNACKBAR_MESSAGE)`). 시안의 `신청이 완료되었어요`(`시안:2348`)로 바꾸려면 이 파일을 고쳐야 한다. `RADIO:490`이 「`src/features/**`도 위에 이름을 댄 파일 둘 말고는 닫혀 있다」이고, **같은 줄이 「일정의 신청 배선은 기존 `useApplicationBatch`를 그대로 쓰고, 신청 데이터의 모양이 부족하면 고치지 말고 질문으로 반환한다」고 못 박았다.**
   - 우회로 하나: `views/schedule/ui`에서 자기 토스트를 따로 띄우면 저장 한 번에 토스트가 둘 뜬다. 좋은 답이 아니다.
   - 반대로 **추가·취소 분리 카운트는 우회가 된다** — 훅이 `savedApplied`·`pending` 둘을 그대로 내주므로(`useApplicationBatch.ts:217-218`) `views/schedule/model/application-diff.ts`(RADIO Interface `RADIO:410`)에서 계산할 수 있다. 훅을 안 고쳐도 된다.
   - undo도 우회된다 — 훅이 내주는 `undo`를 안 쓰면 그만이다(`useApplicationBatch.ts:224`).
2. **`src/features/application/ui/ApplicationChangeBar.tsx`** — `src/features/application/ui/`는 허용 경로에 없다(`src/views/**/ui/*.tsx`는 views 한정). 시안의 변경 바는 자리·높이·문구·애니메이션이 전부 다르므로(2-D) 새 컴포넌트를 `views/schedule/ui/`에 세우는 길이 열려 있고, 그러면 이 파일은 **쓰이지 않는 채 남는다**. 지우는 것은 허용 경로 밖이다.
3. **`src/features/push/ui/PushPrimingSheet.tsx`** — 마찬가지로 밖이다. 다만 `ScheduleView.tsx:152`에서 **호출을 걷는 것**은 views 안의 변경이라 허용 경로 안이다. 시안에 이 시트가 없으니 걷는 것이 맞아 보이는데, **홈에서는 이 시트를 어떻게 처리했는지** 확인이 안 됐다(`HomeView.tsx`에 없음) — 알림 권한 유도가 앱에서 사라지는지 여부는 사람 판단이 필요하다.

### 7-B. 목록에는 있으나 용도 한정을 넘는 파일 (2건)

4. **`src/shared/ui/calendar.tsx`** — 경로는 `src/shared/ui/**`로 열려 있다(`RADIO:439`). 그러나 용도 한정이 「위 Architecture가 이름을 댄 넷의 신설과 기존 `button`·`calendar`·`segmented-control`의 **토큰 반영**에 한정」(`RADIO:480`)이다. 필요한 변경은 토큰 반영이 아니라 구조 개조다 — 배지 삭제(`:34-38,80-84`), 체크 아이콘 삭제(`:79`), 카운트 배지 삭제(`:85-92`), 점 신설, 상태별 채움 제거, 오늘 표시를 판에서 칸으로 이동, 셀·판 치수 변경.
   - 애매한 점: RADIO Architecture는 `views/schedule/ui/ScheduleCalendar.tsx`를 **새 파일로** 이름 댔다(`RADIO:376`). 달력을 views로 다시 그리면 `shared/ui/calendar.tsx`의 용도 한정을 안 건드린다. 다만 그러면 shared의 `Calendar`가 쓰는 곳이 0이 되고(`grep` 결과 `ScheduleView.tsx` 외 사용처 없음) `CalendarCellState` 타입을 `schedule-cell-state.ts:4,11`이 import하고 있어 정리가 필요하다. **어느 쪽인지 RADIO가 답하지 않는다.**
5. **`src/shared/ui/segmented-control.tsx`** — 같은 한정. radius·배경·글자 크기·굵기가 전부 바뀌어야 하는데(2-A) 「토큰 반영」의 범위인지 애매하다. `grep` 결과 이 컴포넌트를 쓰는 곳도 `ScheduleView.tsx:16` 하나다.

### 7-C. 확실히 닫혀 있어 손댈 수 없는 것 (2건)

6. **`src/entities/schedule/model/recruitment-schedule.ts`** — `RADIO:490` 「안 여는 것: `src/entities/**`」. 회차 시작일 같은 필드를 더할 수 없다.
7. **`src/entities/schedule/api/list-recruitment-schedules.ts`** — 같은 이유. 이 쿼리는 `work_date`를 **한 달 범위로만** 자른다(`:24-32`). 지난 회차 무한 스크롤에 필요한 크로스-먼스 조회는 `src/features/recruitment/api/list-past-rounds.ts`(허용, `RADIO:465`)로만 열 수 있다.

---

## 8. 1단계로 돌려보내야 할 것

### 8-A. 없는 데이터를 요구한다 (4건)

1. **모집 회차라는 개념이 데이터에 없다.** 시안 목록 카드는 「회차 하나 = 카드 하나」이고 머리행 값이 `7월 28일 ~ 8월 18일`(모집 기간)이다 — `시안:2034-2040`, `NOTES:396`·`NOTES:836`. `schedules` 테이블에는 회차 id도 배치 키도 없다 — `supabase/migrations/20260807040000_recruitment_schema.sql:4-13`(`id`·`work_date`·`application_deadline`·`status`·`revision`·`created_at`·`updated_at`). `open_recruitment_schedules`가 한 번에 여러 날을 꽂지만(`20260807050000_recruitment_batch_open.sql:36-38`) 배치를 식별하는 값을 안 남긴다. 마감일로 묶는 지금 방식(`deadline-batches.ts:62-73`)이 회차의 대용일 뿐이다.
2. **「신청 기간 시작일」(`7월 28일`)이 어디에도 없다.** `created_at`이 근사값이 될 수는 있으나 `RecruitmentSchedule` 타입(`recruitment-schedule.ts:14-19`)에도, 쿼리 select 목록(`list-recruitment-schedules.ts:29`)에도 없다. 둘 다 허용 경로 밖이다. **「모집이 언제 열렸나」를 근무자에게 보여주는가**는 제품 결정이다.
3. **배정 데이터가 이 화면에 안 온다.** 시안 스스로 두 번 적었다 — `시안:1196-1202`(callout)와 `시안:1752-1759`. 받는 것은 `listRecruitmentSchedules`와 `listOwnApplications`뿐이라, ① 내가 신청한 날이 마감되면 신청이 사라지고 ② 스케줄이 확정되면 내가 배정 안 됐어도 「확정」으로 칠해진다. `RADIO:68`이 이것을 「기획으로 돌아간 물음 넷」 중 하나(`schedule-cell-state.ts:20-29`)로 이미 올려뒀고, `NOTES:1241`도 「1단계 반환」이다. **시안은 「내 신청을 잃지 않는 쪽」으로 그렸는데 그 판정 규칙 자체가 아직 안 정해졌다.**
4. **「변경 요청 중」 상태의 출처가 없다.** 시안은 속 빈 점으로 표현한다 — `시안:1620-1631`, `시안:1168-1171`. 근무 변경 요청을 담는 테이블도 API도 없다(`grep` 결과 `src/entities`·`src/features`에 change-request 계열 0건). 기존 진입점은 **비활성 자리표시**다 — `ScheduleDetailView.tsx:146`, 그 사실을 테스트가 굳혔다(`ScheduleDetailView.test.tsx:124-127`). 요청을 보낼 수 없으면 이 상태에 도달할 길이 없다.

### 8-B. 안 만들기로 한 기능 (1건)

5. **포지션 교대.** 시안이 겹 시트까지 그려뒀다 — `시안:2265-2289`, `시안:2258-2260`. `WORKER-FLOWS.md:86`은 「만들지 않는다」였고 사용자가 뒤집었으나 기획 승인이 먼저다. `RADIO:64`(설계 비목표)가 「시안에 그려져 있지만 **코드로 옮기지 않는다**. 바닥 시트 발치의 `근무 변경 요청` 버튼은 `근무 취소` 한 갈래만 연다」로 못 박았고, `NOTES:1369`가 「P0-T55 이월」이다. 시안 스스로도 `시안:1577-1592`에서 「디자인 라운드가 정할 일이 아니다」라고 적었다. **퍼블리싱이 이 겹을 만들면 안 된다.**
   - 파생: 시안의 `근무 변경 요청` 시트(`시안:2242-2263`)는 유형 **둘**을 보여준다. RADIO는 하나만 열라고 했다. 유형이 하나뿐인데 「유형을 고르는 겹」을 유지할지, 발치 버튼이 바로 `근무 취소`로 가게 할지가 정해지지 않았다.

### 8-C. 시각이 서버 생성 규칙과 어긋나는가 (해당 없음)

`INV-ATT-01`(출퇴근 시각은 서버가 만든다)에 걸리는 자리는 이 화면에 없다. 시안의 시각 계산은 D-n(`시안:2031-2033`)과 「지난 근무인가」(`시안:1852`) 둘뿐이고, 둘 다 서버가 준 `today`를 기준으로 삼는 파생값이다. 구현도 이미 `today`를 프롭으로 받는다(`ScheduleView.tsx:34`, `page.tsx:35` `seoulToday()`). `DEV-TIME` 부분 적용 판정(`RADIO:184`)과 일치한다.

### 8-D. 개인정보·금액을 새로 드러내는가 (해당 없음, 조건부)

배정표 시트는 이름과 포지션만 쓰고 전화번호·성별·시급·출결을 안 보여준다 — `시안:2159-2183`, `WORKER-FLOWS.md:82`. 금액은 이 화면에 없다. 다만 **확정 배정표를 누가 여는가**는 이미 승인돼 있으므로(`WORKER-FLOWS.md:77`) 새로 드러내는 것이 아니다.

---

## 애매해서 판단을 안 내린 것

1. **상태 개수가 문서마다 다르다.** `RADIO:369`·`RADIO:409`는 「라운드 28 표의 **여섯** 상태」, 위험 표(`RADIO:144`)도 「여섯 상태」인데, 확정 규칙 표(`NOTES:374-381`)와 시안 표(`시안:1423-1480`)는 **여덟 행**이고 시안 스크립트 `STATE_NAME`(`시안:1778-1787`)도 여덟이다. 여기에 「변경 요청 중」 변형까지 더하면 아홉이다. 어느 수가 인수 조건인지 판단하지 않았다.
2. **달력을 shared에 둘지 views로 옮길지** — 7-B-4 참조.
3. **240ms를 250으로 흡수할지** — 6-C-1 참조.
4. **`pb-nav-action-safe`(112)와 `pb-nav-safe`(96) 중 무엇인지.** 변경 바가 탭바를 덮으므로(`NOTES:404`) 바가 뜬 동안 필요한 여백은 96 성격인데, 바가 없을 때는 탭바만 피하면 되므로 역시 96이다. 그렇다면 지금의 112(`ScheduleView.tsx:121`)가 과한 값으로 보이나, FOUNDATIONS.md:117이 「화면마다 다른 값을 쓰고 있다면 그건 그 화면을 다시 볼 이유다」라고 적어 두어 임의로 정하지 않았다.
5. **`PushPrimingSheet`를 걷으면 알림 권한 유도가 앱에서 사라지는지** — 7-A-3 참조.
