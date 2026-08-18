# P0-T48 RADIO 개발 설계

- 상태: Approved
- revision: 7
- 기획 승인: user, 2026-08-16 (범위 축소 2026-08-18)
- 개발 설계 승인: user, 2026-08-18

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 7 | 2026-08-18 | **radius 사다리에 `cell` 12px를 만들고 11px를 그리로 합친다**(사용자 결정). 5라운드 착수 전 시안 전수 조사에서 사다리 밖 radius 둘이 더 나왔다 — `.dbadge`·`.sk-anchor`의 **11px**와 `.wnum`(주간 스트립 칸)·`.dcell.today`(달력 오늘 칸)의 **12px**다. revision 6이 세운 인수 조건 32가 `rounded-[` 임의값을 0건으로 막았고 Architecture의 코드 구조가 `d-badge.tsx`를 「32px radius 11」이라 직접 적었으므로, 그대로 두면 publisher가 첫 파일에서 막힌다. **1px 차이라 하나로 합친다** — 1라운드가 `#f1f3f6`·`#f2f4f6`을 같은 근거로 합친 선례를 따른다. 이름은 `radius-cell`이다. 크기 이름(xs·sm·md·lg·xl)에는 8과 14 사이가 비어 있고, 같은 표의 `radius-pill`이 이미 역할 이름이라 관례 밖이 아니다. 더해 **간격은 토큰을 늘리지 않는다** — 사다리 밖 간격값은 사다리로 스냅하고, 스냅이 화면을 무너뜨리면 멈추고 반환한다. `.phone` 28px는 시안의 폰 프레임이라 제품 UI가 아니다. 2026-08-18 사용자 결정. |
| 6 | 2026-08-18 | **radius 사다리에 `xs` 6px 칸을 만든다**(사용자 결정). 라운드 34가 skeleton 막대를 「`--color-border` radius 6」으로 정했고 3라운드가 그것을 `PATTERNS.md:92`에 이관했는데, `FOUNDATIONS.md`의 radius 사다리(`sm 8 · md 14 · lg 16 · xl 20 · pill`)와 `globals.css`에는 **6px 칸이 없다.** 설계가 6을 정할 때 사다리에 그 칸이 없다는 것을 못 봤다 — 승인된 문서 둘이 서로 어긋난 상태다. 임의값 `rounded-[6px]`을 세 파일에 박는 대신 사다리를 늘린다. 그래야 P0-T49~T54가 같은 자리에서 임의값을 다시 안 쓴다. revision 5까지의 `globals.css` 용도 한정과 `FOUNDATIONS.md` 용도 한정이 둘 다 **닫힌 목록**이라 이 한 줄을 더하는 것도 재봉인이다. 2026-08-18 사용자 결정. |
| 5 | 2026-08-18 | **번들 상한을 600KB로 올린다**(사용자 결정). 지금 실측이 508KB로 이미 500KB를 넘겼고(`backlog.md:372`, P0-T47이 원인은 그 변경분 밖이라고 기록), revision 4가 `@tanstack/react-query`와 `zustand`를 더하면 더 벌어진다. 인수 조건이 `pnpm verify` 통과를 요구하므로 이대로면 task를 못 닫는다. **이건 ADR 개정이다** — 상한의 정본은 harness 상수가 아니라 `ADR-0015` 결정 3이고, 그 문서가 「490KB를 넘으면 상한을 올리는 대신 `motion/mini` 전환을 설계로 반환한다」고 못 박아뒀다. 그 대안은 같은 ADR이 이미 배제했다(`AnimatedAmount`가 쓰는 훅 셋이 mini에 없다). 조항을 뒤집는 것이므로 harness 상수와 함께 ADR 개정 이력에 올린다. 번들을 실제로 줄이는 일은 별도 task다 — 이번에는 감시선만 올린다. `harness/lib/bundle-budget.ts`·`harness/self-test/**`·`docs/standards/adr/0015-motion-library-scope.md`를 변경 허용 경로에 더한다. 2026-08-18 사용자 결정. |
| 4 | 2026-08-18 | **Next 파일 규약을 쓰고 상태 도구 둘을 들인다**(사용자 결정 셋). ① 라우트별 `loading.tsx`·`error.tsx`를 세우고 홈의 블록 다섯을 `<Suspense>`로 감싸 스트리밍한다 — 봉인된 설계가 `HomeSkeleton.tsx`·`HomeFailure.tsx`로 손수 짜던 것을 프레임워크가 준다. ② 배정표 시트를 **병렬 + 인터셉팅 라우트**로 올려 뒤로가기로 닫히고 링크로 열리게 한다. 겹겹 시트가 URL 겹이 되므로 `useSheetStack`이 없어진다. ③ `ARCHITECTURE.md:24`가 이미 정해둔 **TanStack Query를 설치**하고(지금까지 `package.json`에 없었다) 일정 목록의 지난 회차 무한 스크롤이 쓴다. ④ **zustand**를 금액 가림 설정 하나에만 쓴다 — 화면을 가로지르는 유일한 클라이언트 상태다. 데이터 로딩 구조가 바뀌므로 revision 1의 비목표 「서버·데이터 변경 안 함」을 **부분 개방**한다 — 쿼리 함수는 그대로 두고 **누가 언제 부르나**만 바꾼다. 2026-08-18 사용자 결정. |
| 3 | 2026-08-18 | **화면 상태를 둘 자리를 적는다.** revision 2가 「`ui`는 로직을 모른다」를 박았는데 `model`은 `config/fsd.json`이 `forbidImports: ["react","react-dom"]`로 막아 `useState`를 못 담는다. revision 1의 Architecture가 `model` 파일만 이름을 대고 React 상태의 자리를 안 적어 **시트가 열렸나·무엇을 골랐나·금액이 열렸나가 갈 곳이 없었다.** 세 갈래로 가른다 — `model`은 판정, `hooks`는 상태와 전이, `ui`는 표현. 홈 훅 셋·일정 훅 셋·공용 훅 둘을 Architecture에 더한다. `views/*/hooks/`는 이 저장소에서 처음 쓰는 자리지만 `fsd.json`이 이미 정의한 세그먼트라 새 계약이 아니다. 2026-08-18 사용자 지적. |
| 2 | 2026-08-18 | **Dumb UI를 규칙으로 박고 기계가 지키게 한다**(사용자 지시). `DEV-CODE-09`가 이미 「`ui`는 표현과 이벤트 배선만 소유한다」고 적었는데 `SHOULD`이고 예외 조항 「표현용 조건부 렌더」가 뒷문이라 지켜지지 않았다 — 지금 `HomeView.tsx`가 그 증거다. `MUST`로 올리고 예외를 좁히며, `project/no-logic-in-ui` 린트를 신설해 `ui` 파일에서 값 비교·산술·`.length`·파생 배열 메서드·`Date`/`Intl`/포맷 호출을 error로 막는다. 열거값 `===` 분기와 JSX 안의 목록 `map`은 통과한다. 이 task가 홈·일정을 새로 쓰므로 **규칙을 먼저 세우지 않으면 새 화면이 같은 자리에 로직을 다시 심는다.** `docs/standards/DEVELOPMENT.md`·`tools/eslint-plugin-project/**`·`eslint.config.mjs`·`config/fsd.json`을 변경 허용 경로에 더한다. 2026-08-18 사용자 결정. |
| 1 | 2026-08-18 | 최초 작성. 디자인 라운드 1~34가 닫힌 뒤의 이관 설계다. 확정 규칙의 정본은 `runs/P0-T48/design/NOTES.md`이고 화면 계약은 `design/confirmed/home.html`·`schedule.html`이다. 이 RADIO는 그 둘을 L3 정본(`docs/product/design/**` + `globals.css`)으로 옮기는 경로와 두 화면의 퍼블리싱 구조만 정한다. `test_mode`를 `verification`에서 `tdd`로 바꾼다. |

- 관련 spec: DOCS:SDD, ADR:0014(FSD 뷰 레이어 이름)
- 적용 깊이: 일반 — 표시 계층과 문서다. 서버 경계·DB·RLS·권한·개인정보·금액 계산 로직을 건드리지 않는다. 금액은 이미 계산된 값을 받아 가리고 여는 표시 규칙만 다룬다.
- test mode: tdd
- 예정 check IDs: global-template-sealed, home-schedule-republished, design-token-ladder, typo-scale-reweight, home-empty-states, home-failure-states, schedule-calendar-grammar, preview-state-matrix, dumb-ui-lint, route-convention-states, roster-sheet-intercept, client-state-boundaries, bundle-budget-600

## 기획 승인 이후의 정정

기획 승인 시점의 `test_mode`는 `verification`이었다. `DEVELOPMENT.md:212`가 verification을 "문서·설정·기계적 생성 task"로 한정하는데, 이 task는 홈·일정 두 화면의 컴포넌트를 새로 쓴다. 렌더되는 코드가 생기므로 `tdd`가 맞다. 승인 범위를 넓히는 것이 아니라 이미 승인된 "두 화면을 퍼블리싱한다"를 실행 가능한 형태로 확정한 결과다.

## Requirements

### 범위와 비목표

범위는 아홉이다.

① **색 토큰 이관** — 시안이 쓰는 파랑 사다리 넷과 회색 셋을 `FOUNDATIONS.md` 원시 팔레트에 올리고 `globals.css`의 의미 토큰이 그것을 가리키게 한다. `gate:tokens`가 통과한다.

② **타이포 유틸리티 재배치** — 라운드 24의 무게 체계를 `FOUNDATIONS.md` 타이포그래피 표와 `@utility typo-*` 여덟 블록에 반영한다. 화면에서 700이 사라진다.

③ **규칙 이관** — NOTES의 확정 규칙 열여섯 절을 `FOUNDATIONS.md`·`COMPONENTS.md`·`PATTERNS.md`·`WORKER-FLOWS.md`·`DESIGN.md`로 옮기고, NOTES 맨 아래 개정 목록 쉰 행을 전부 닫는다.

④ **홈 퍼블리싱** — `confirmed/home.html` 계약대로 다섯 블록을 세운다. 빈 상태·로딩·에러·오프라인까지 포함한다.

⑤ **일정 퍼블리싱** — `confirmed/schedule.html` 계약대로 달력·목록 두 뷰와 바닥 시트를 세운다. 같은 네 상태를 포함한다.

⑥ **Dumb UI 강제** — `DEV-CODE-09`를 `MUST`로 올리고 `project/no-logic-in-ui` 린트를 신설한다. `ui`는 판정된 값을 받아 그릴 뿐 계산을 모른다.

⑦ **라우트 규약** — 라우트별 `loading.tsx`·`error.tsx`, 블록별 `<Suspense>` 스트리밍, 배정표 시트를 병렬 + 인터셉팅 라우트로.

⑧ **상태 도구 둘** — TanStack Query 설치와 Provider(`ARCHITECTURE.md:24`의 적용), zustand로 금액 가림 설정 하나.

⑨ **번들 상한 600KB** — `ADR-0015` 결정 3 개정과 `harness/lib/bundle-budget.ts` 상수.

두 화면의 모든 상태는 `/preview`에 목 데이터로 등록된다.

설계 비목표는 여섯이다.

- **나머지 열아홉 화면.** P0-T49~T54가 맡는다. 이 task가 `docs/product/design/**`에 정본을 세워두면 그쪽은 남의 run 폴더를 안 읽는다.
- **포지션 교대.** `WORKER-FLOWS.md:86`이 만들지 말라고 적은 기능이라 기획 승인이 먼저다(P0-T55). 시안(`confirmed/schedule.html`)에 그려져 있지만 코드로 옮기지 않는다. 바닥 시트 발치의 `근무 변경 요청` 버튼은 `근무 취소` 한 갈래만 연다.
- **출퇴근 인증 화면.** 라운드 34 후속에서 별도 페이지로 정해졌고 화면 자체는 P0-T49다. 홈의 파랑 버튼은 `/attendance`로 이동만 하고 그 페이지는 이 task가 만들지 않는다.
- **쿼리·스키마·RLS.** `entities/*/api/**`의 쿼리 함수 본문, DB 스키마, RLS 정책을 건드리지 않는다. revision 4가 여는 것은 **누가 언제 부르나**뿐이다 — `page.tsx`가 한 번에 `await`하던 것을 블록별 async 서버 컴포넌트가 각자 `await`한다. 반환 타입과 인자는 그대로다. 새로 만드는 서버 진입점은 지난 회차 더 불러오기 하나이고 기존 쿼리를 감싼다.
- **금액 가림의 계정 저장.** zustand + `persist`로 기기에 둔다. `profiles` 컬럼·RLS·서버 왕복은 후속 task가 저장 계층만 갈아끼운다. 스토어 인터페이스는 그대로 산다.
- **기획으로 돌아간 물음 넷.** 주급의 주 경계(`PRD.md:346`), 인증을 닫는 시각(`PRD.md:298-300`), 「확정」이 누구의 확정인가(`schedule-cell-state.ts:20-29`), 포지션 교대 승인 규칙. 해당 PRD 줄을 이 task가 고치지 않는다. 화면은 NOTES가 적은 가정대로 그린다.
- **`action`·`action-pressed` 의미 토큰의 배경·테두리 판정.** 아래 「미결 사항」이 근거를 갖는다.

### 불변 규칙

- **화면에 700이 한 글자도 없다.** 가장 무거운 것이 600, 값은 500이다. 사용자 상수 지침이다.
- **가장 강한 파랑 `#0052ff`는 지금 눌러야 할 버튼 하나의 것이다.** 배지·틴트·선택 상태는 사다리의 다른 단을 쓴다.
- **디자인 계약의 정본은 이관 후 `docs/product/design/**`다.** NOTES는 근거 기록으로 남고 코드가 읽는 정본이 아니다. 이관이 끝나면 두 곳이 같은 말을 하고, 이후 어긋나면 L3가 이긴다.
- **토큰의 정본은 `FOUNDATIONS.md`다**(P0-T47 확정). `globals.css`가 문서를 따르고 `gate:tokens`가 강제한다.
- **이미 쓰이는 토큰의 값을 바꾸는 것은 시안이 그 값을 실제로 쓸 때만 한다.** 쓰지 않는 행은 손대지 않는다 — 근거 없이 찍으면 다음 화면이 그것을 근거로 삼는다.
- **금액은 근무일에 자동으로 가려지고, 가려진 동안 실제 값을 렌더하지 않는다.** 고정 폭 더미에 blur 7px과 `aria-hidden`을 준다. 블러만 걸면 글자 폭이 자릿수를 드러내고 낭독기가 값을 그대로 읽는다.
- **출퇴근 시각은 서버가 만든다**(INV-ATT-01). 이 task의 화면은 받은 값을 표시할 뿐이고 클라이언트 시계로 인증 성립을 판정하지 않는다.
- **예상 급여는 예정 시간 계산 값이다**(INV-PAY-01). 「받은 총급여」라는 표현을 쓰지 않는다. 이름은 「누적 예상 급여」다.
- **빨강을 쓰지 않는다.** 로딩 실패도, 연결 끊김도, 변경 미반영도 빨강이 아니다. 빨강은 위치 권한 실패 같은 진짜 오류에만 남는다.
- **자리는 셋이다.** `model`이 **판정**을 갖고(React 금지, 렌더 없이 테스트가 돈다), `hooks`가 **상태와 전이**를 갖고(`useState`·`useReducer`·`useEffect`), `ui`가 **표현**을 갖는다. 훅은 상태를 들되 판정은 `model`에 묻는다 — 「선택된 날이 18일」은 상태라 훅이고, 「그날 발치에 무엇이 뜨나」는 판정이라 `model`이다. 훅에 `.length === 0`이 들어오면 그건 `model`로 내려가야 한다는 신호다.
- **`ui`는 로직을 모른다.** 받은 값을 그리고 이벤트를 올려보낼 뿐이다. 빈 상태 판정·D-n 계산·남은 시간·금액 포맷·정렬·자르기·개수 세기가 전부 `model`이고, `ui`가 받는 것은 **이미 판정된 열거값과 이미 만들어진 목록**이다. `list.length === 0 ? 빈화면 : 목록`은 표현이 아니라 판정이다 — 그 줄이 `ui`에 있으면 다음 화면이 그것을 근거로 삼는다.
- `DEV-CODE-07` — 새 컴포넌트에 설명 주석을 넣지 않는다.
- **프레임워크가 주는 것을 손으로 짜지 않는다.** 첫 페인트는 `loading.tsx`, 라우트 실패는 `error.tsx`, 블록별 지연은 `<Suspense>`, 시트 겹은 URL 겹이다. 같은 일을 컴포넌트 상태로 다시 만들면 뒤로가기·새로고침·링크 공유가 전부 어긋난다.
- **반짝임을 넣지 않는다.** 지금 `src/app/loading.tsx`가 `animate-pulse`를 쓰는데 라운드 34가 shimmer를 금지했다. 라우트 규약을 세우며 함께 걷는다.
- **`ui`가 `useQuery`를 부르지 않는다.** 클라이언트 페치도 `hooks`가 갖고 `ui`는 결과를 프롭으로 받는다. Dumb UI 규칙은 데이터 출처를 가리지 않는다.
- **No barrel files** — 실제 경로로 import한다.

### 기술 인수 조건

1. `FOUNDATIONS.md` 원시 팔레트에 `blue-800` `#0c3f9c` · `blue-100` `#cfe0fc` · `blue-50` `#e4edfd` · `blue-25` `#f2f6fd` · `gray-800` `#3a3f4a` · `gray-250` `#e5e8eb` · `gray-150` `#f1f3f6` 일곱 행이 있고, `globals.css` `:root`에 같은 이름의 `--raw-*` 일곱 개가 있다.
2. `globals.css` `@theme`에 `--color-canvas`·`--color-ink-800`·`--color-action-deep`·`--color-action-tint-weak`·`--color-action-tint`·`--color-action-tint-strong` 여섯이 신설되고, `--color-border`가 `--raw-gray-250`을, `--color-surface-weak`가 `--raw-gray-150`을 가리킨다.
3. `FOUNDATIONS.md` 타이포그래피 표가 여덟 행이고 `display` 행이 없다. `headline-lg` 26/34 600 · `headline-md` 22/30 600 · `title` 18/26 500 · `body` 16/24 400 · `body-strong` 16/24 500 · `label` 14/20 600 · `caption` 13/18 400 · `caption-strong` 13/18 500이다. `@utility typo-*` 여덟 블록이 표와 일치한다. `typo-display` 블록이 없고 저장소 전체에 `typo-display` 사용처가 없다.
4. `pnpm gate:tokens`가 통과한다.
5. NOTES 맨 아래 개정 목록의 쉰 행이 전부 대상 문서에 반영되고, 각 행이 「닫힘」으로 표시된다.
6. 홈이 다섯 블록을 위에서 아래로 세운다 — 알림 한 장 · 오늘 출퇴근 · 이번 주 · 다가오는 근무 · 급여. 알림과 오늘 둘만 데이터가 없을 때 통째로 접히고 아래 블록이 올라온다.
7. 홈의 빈 상태 다섯이 계약대로 렌더된다 — 근무 없는 날(오늘 블록 접힘) · 빈 주(스트립 흐림 + 발치 `—`) · 다가오는 근무 없음(앵커 없는 한 줄 + 더보기) · 급여 셋 다 없음(한 줄로 접힘) · 알림 없음(블록 접힘, 종 점은 남음).
8. 로딩 skeleton이 아는 값(화면 제목·블록 이름표·요일·날짜)을 가리지 않고, 막대 색이 `--color-border` radius 6이며 반짝임이 없다.
9. 부분 실패가 그 블록 자리에 「〈블록 이름〉을 불러오지 못했어요」와 「다시 시도」 알약을 세우고 산 블록은 산다. 전부 실패면 화면 한 장으로 바뀌되 헤더와 탭바가 남는다.
10. 오프라인 배너가 헤더 레이어의 셋째 줄로 들어가 레이어 높이가 80에서 120이 되고, 콘텐츠가 그 뒤로 지나간다. 변경 버튼이 비활성이 되고 라벨이 이유를 말한다.
11. 일정 달력 셀이 숫자와 점만 갖는다. 선택 칸에만 `#cfe0fc` 채움이 들어가고 방향은 숫자 색이 말한다. 오늘은 칸을 두르는 실선 1px `#e5e8eb`다.
12. 일정 하단 변경 바가 변경 0에서 없고 1개부터 240ms로 올라오며 탭바 자리를 덮는다. 개수를 추가·취소로 나눠 센다. 저장 뒤 undo가 없다.
13. 일정 목록이 회차 단위로 쌓이고 마감 임박순이며, 지난 회차가 접힌 채 두 회차씩 무한 스크롤된다.
14. 하단 탭이 `홈 · 일정 · 급여 · 전체` 넷이고 선택 탭만 `gray-800` 채움이다. 알림은 헤더 오른쪽 종이다.
15. `/preview`에 홈 아홉 시나리오와 일정 일곱 시나리오가 등록된다.
16. 홈 주간 스트립이 월요일 시작이고 일정 달력이 일요일 시작이며, 두 화면이 왜 다른지가 `WORKER-FLOWS.md`에 한 줄로 적힌다.
17. `DEV-CODE-09`가 `SHOULD`에서 **`MUST`**로 오르고 예외가 「className 조합과 열거값 분기」 둘로 좁혀진다.
18. `project/no-logic-in-ui`가 `eslint.config.mjs`에 `error`로 켜지고, `ui` 세그먼트 파일에서 비교 연산자(`< > <= >=`) · 산술(`- * / %`) · `.length` 접근 · 파생 배열 메서드(`filter`·`reduce`·`sort`·`slice`·`find`·`some`·`every`·`flatMap`) · `Date`/`Intl`/`toLocaleString`/`toFixed` 호출을 잡는다. 열거값 `===`·`!==` 분기와 **JSX 표현식 안의 `map`**은 통과한다. `__tests__`와 `*.mock.ts`는 대상이 아니다.
19. 규칙이 **기본 `error`**이고, 아직 이관 안 된 화면만 `eslint.config.mjs`가 경로를 이름으로 대어 끈다. 그 예외 목록이 P0-T49~T54에서 한 줄씩 줄어든다. 새 파일은 목록에 없으므로 처음부터 규칙 아래 선다.
20. **홈·일정의 `ui` 파일에 이 규칙의 예외가 하나도 없다.**
21. React 상태가 `views/*/hooks/`와 `shared/hooks/`에만 있다. `views/home/ui/**`·`views/schedule/ui/**`에 `useState`·`useReducer`가 없고, `model` 파일이 `react`를 import하지 않는다(`fsd.json`의 `forbidImports`가 이미 막지만 새 `model` 파일이 실제로 그 아래 서는지 확인한다).
22. 훅 일곱(홈 둘 · 일정 셋 · 공용 둘)이 `useCamelCase` 이름 규약을 지키고 각자 단위 테스트를 갖는다(`fsd.json`의 `hooks` 세그먼트가 `unitTest: required`다).
23. `(tabs)` 아래에 `loading.tsx`와 `error.tsx`가 있고, `schedule/`에도 각자 있다. 둘 다 `(tabs)/layout.tsx`의 헤더와 탭바를 남긴 채 안쪽만 바꾼다. `src/app/loading.tsx`의 `animate-pulse`가 걷히고 라운드 34의 skeleton 어법을 따른다.
24. 홈의 블록 다섯이 각자 `<Suspense fallback>`과 에러 경계 안에 서고, 한 블록이 실패해도 나머지 넷이 렌더된다. `(tabs)/layout.tsx`의 `listNotifications()`도 Suspense 뒤로 물러나 종 점이 탭 트리를 막지 않는다.
25. **「전부 실패」의 경계가 셸이다.** `(protected)/layout.tsx`의 프로필 조회가 실패하면 화면 한 장이고, 블록별 실패는 블록 자리에서 말한다. 스트리밍에서는 다섯 블록이 각자 실패하는 것과 요청 자체가 실패하는 것이 다른 사건이라, revision 1의 「다섯 중 넷은 블록별, 다섯 다는 한 장」을 이렇게 옮긴다.
26. 배정표가 `(tabs)/roster/[date]`에 라우트로 서고 `@sheet/(.)roster/[date]`가 그것을 가로채 바닥 시트로 띄운다. 홈의 오늘 카드 발치와 일정의 확정 날짜가 **같은 주소**를 연다. 뒤로가기로 닫히고 새로고침하면 전체 화면으로 열린다. 겹겹 시트는 URL 겹(`/roster/[date]/change`)이라 `useSheetStack`이 없다.
27. `@tanstack/react-query`가 설치되고 `QueryClientProvider`가 `(protected)` 아래 클라이언트 경계에 선다. 일정 목록의 지난 회차 무한 스크롤이 `useInfiniteQuery`로 돈다.
28. `zustand`가 설치되고 `shared/hooks/useAmountMasking.ts` 하나만 스토어다. `persist`로 기기에 남고 SSR 수화 경고가 없다. 다른 화면 상태는 스토어에 안 올라간다.
29. `BUNDLE_BUDGET_BYTES`가 `600 * 1024`이고 `pnpm gate:bundle`이 통과한다. `ADR-0015` 결정 3에 세 번째 인상의 근거와 실측이 적히고 개정 이력에 행이 오른다. **「490KB를 넘으면 올리는 대신 `motion/mini`」 조항을 뒤집는다는 것을 문장으로 적는다** — 조용히 지우지 않는다.
30. `backlog.md:372`의 508KB 행이 닫히고, **번들을 실제로 줄이는 후속 task가 `proposed`로 선다.** 이번 인상은 감시선을 올린 것이지 문제를 푼 것이 아니다.
31. `pnpm verify`가 통과한다.
32. `--radius-xs: 6px`이 `globals.css`에 서고 `FOUNDATIONS.md`의 radius 표에 `radius-xs` 행이 오른다. skeleton 막대 셋(`src/app/loading.tsx`·`(tabs)/loading.tsx`·`(tabs)/schedule/loading.tsx`)이 임의값이 아니라 그 토큰을 쓴다. **저장소에 `rounded-[` 임의 radius가 하나도 없다.**
33. `--radius-cell: 12px`이 서고 `FOUNDATIONS.md` radius 표에 행이 오른다. **D 배지 · 앵커 칸 · 주간 스트립 날짜 칸 · 달력 오늘 칸 넷이 같은 `rounded-cell`을 쓴다** — 시안의 11px와 12px가 하나로 합쳐진 자리다.
34. **간격 토큰이 늘지 않는다.** `--spacing-*`와 `FOUNDATIONS.md` 간격 표가 이 task 전후로 같다. 시안의 사다리 밖 간격은 사다리 값으로 스냅하고, 스냅이 화면을 무너뜨리는 자리는 고치지 말고 반환한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1~4 토큰 사다리 | 테스트함 — `gate:tokens`가 무출력·exit 0 | 테스트함 — 문서와 css 값을 어긋나게 두면 두 위치와 값을 보고 | 테스트함 — `--raw-gray-150`을 지우면 미해결 참조로 잡힘, `--color-border` 값 변경이 기존 화면 렌더에 번지는 범위를 스냅샷으로 확인 | 해당 없음 — CSS 선언에 실행 권한이 없다 | 해당 없음 — 선언은 멱등 | 해당 없음 — 빌드 시점에 한 번 평가된다 |
| 3 타이포 재배치 | 테스트함 — 여덟 유틸리티의 세 선언이 표와 일치 | 테스트함 — `display`를 쓰던 자리가 남아 있으면 빌드가 클래스를 못 찾음을 확인 | 테스트함 — **화면 전체에 `font-weight: 700`이 없음을 단언**, `caption-strong` 신설이 기존 `caption` 사용처를 안 건드림 | 해당 없음 — 표시 계층 | 해당 없음 — 순수 스타일 | 해당 없음 — 정적 CSS다 |
| 5 규칙 이관 | 테스트함 — `gate:docs`가 링크·제목·spec 참조를 판정 | 해당 없음 — 사람이 읽는 산문이라 실패 분기가 없다 | 테스트함 — 개정 목록의 쉰 행 각각에 대응하는 문장이 대상 문서에 있는지 사람이 대조하고 결과를 handoff에 남긴다 | 해당 없음 — 실행 권한이 없는 문서다 | 해당 없음 — 멱등한 파일 쓰기 | 해당 없음 — 한 사람이 순서대로 고친다 |
| 6·7 홈 블록과 빈 상태 | 테스트함 — 데이터 있는 날 다섯 블록이 순서대로 렌더 | 테스트함 — 알림·오늘이 비면 접히고 아래가 올라옴, 나머지 셋은 빈 채로 자리를 지킴 | 테스트함 — **다섯 빈 상태가 동시에 온 날**(근무 없음·빈 주·다가오는 근무 없음·급여 없음·알림 없음)에 블록 셋만 남고 문장 행이 안 눌림, 급여 값 자리가 `0원`이 아니라 `—` | 해당 없음 — 홈은 본인 데이터만 받는다 | 해당 없음 — 표시 전용이라 요청을 안 낸다 | 해당 없음 — 서버 상태를 안 바꾼다 |
| 8 로딩 skeleton | 테스트함 — 막대가 서버 값 자리에만 깔림 | 테스트함 — 아는 값(제목·이름표·요일)이 덮이면 실패 | 테스트함 — 반짝임 애니메이션 부재, `prefers-reduced-motion`에서도 모양이 같음 | 해당 없음 — 표시 계층 | 해당 없음 — 상태 표시일 뿐이다 | 테스트함 — 일부 블록만 도착한 중간 상태에서 산 블록과 막대가 섞여 섬 |
| 9 에러 상태 | 테스트함 — 부분 실패가 그 블록에만 서고 산 블록은 삶 | 테스트함 — 전부 실패에서 화면 한 장, 헤더·탭바 생존 | 테스트함 — **경계는 「전부 실패」다.** 다섯 중 넷 실패는 블록별, 다섯 다 실패는 한 장. 어느 쪽에도 빨강이 없음을 단언 | 해당 없음 — 실패 표시에 권한 분기가 없다 | 테스트함 — 「다시 시도」 연타가 요청을 겹치지 않게 비활성으로 잠김 | 해당 없음 — 재시도는 읽기 쿼리 무효화라 공유 상태가 없다 |
| 10 오프라인 배너 | 테스트함 — 배너가 뜨면 헤더 레이어 120, 콘텐츠 padding-top 120 | 테스트함 — 변경 버튼 비활성과 라벨 교체 | 테스트함 — 배너가 뜬 채로 시트가 열려도 겹치지 않음, 복구 시 토스트 하나 | 해당 없음 — 연결 상태에 권한이 없다 | 테스트함 — 끊김·복구가 빠르게 반복돼도 배너가 하나만 서고 토스트가 겹치지 않음 | 해당 없음 — 브라우저 이벤트 하나를 구독한다 |
| 11 달력 셀 어법 | 테스트함 — 여섯 상태가 표대로 숫자 색·점·채움을 가짐 | 테스트함 — 손댈 수 없는 날이 눌려도 되튐이 없고 상태가 안 변함 | 테스트함 — **확정이면서 변경 요청 중인 날**(파란 점이 속이 빔), 지난 근무면서 오늘인 날(회색 점 + 실선 테두리) | 해당 없음 — 셀 렌더에 권한 분기가 없다 | 테스트함 — 같은 날을 두 번 누르면 선택이 원상복구되고 변경 개수가 0으로 돌아감 | 해당 없음 — 로컬 선택 상태다 |
| 12 변경 바 | 테스트함 — 1개부터 올라오고 추가·취소를 나눠 셈 | 테스트함 — 저장 실패 시 바가 안 걷히고 선택이 살아 있음 | 테스트함 — 변경 0에서 바 부재, 추가만·취소만인 경우 문구가 한쪽만 적음 | 해당 없음 — 신청 권한은 서버가 판정하고 이 task는 배선하지 않는다 | 테스트함 — 「신청하기」 연타에 버튼이 잠기고 토스트가 하나 | 해당 없음 — 서버 배선은 기존 `useApplicationBatch`가 갖고 이 task가 안 바꾼다 |
| 13 목록 무한 스크롤 | 테스트함 — 열린 회차가 마감 임박순, 지난 회차가 두 개씩 붙음 | 테스트함 — 더 없을 때 「더 없어요」로 끝남 | 테스트함 — 열린 회차 0개, 지난 회차 0개, 지난 회차 1개(두 개 미만) | 해당 없음 — 목 데이터를 받는 표시 계층이다 | 테스트함 — 바닥 도달 이벤트가 연속으로 와도 같은 회차를 두 번 안 붙임 | 해당 없음 — 로컬 배열을 자른다 |
| 14 탭바 | 테스트함 — 네 탭과 `/pay` 활성 매핑 | 테스트함 — `/pay`가 `more` 활성으로 묶이던 기존 동작이 사라짐 | 테스트함 — 선택 탭이 `gray-800` 채움이고 파랑을 안 씀 | 해당 없음 — 탭 표시에 권한 분기가 없다 | 해당 없음 — 라우팅이다 | 해당 없음 — 라우터 상태 하나 |
| 15 preview | 테스트함 — 두 화면 열여섯 시나리오가 목록에 뜨고 선택되면 렌더 | 테스트함 — 시나리오 배열이 비면 렌더가 깨지지 않음 | 해당 없음 — 목록 유무의 이진 판정 | 해당 없음 — **preview는 목 데이터 전용이다.** 실데이터·서버 호출·인증을 붙이지 않는다 | 해당 없음 — 요청을 안 낸다 | 해당 없음 — 로컬 선택 상태다 |
| 16 주 시작 요일 | 테스트함 — 스트립이 월요일부터, 달력이 일요일부터 렌더 | 해당 없음 — 요일 배열 상수라 실패 분기가 없다 | 테스트함 — 달을 넘는 주(8/31이 9월 첫 주에 드는 경우)에 스트립이 이어짐 | 해당 없음 — 표시 계층 | 해당 없음 — 순수 계산 | 해당 없음 — 로컬 상태다 |
| 17~20 Dumb UI | 테스트함 — 열거값 분기와 JSX `map`이 통과 | 테스트함 — `list.length === 0` · `new Date(x) - Date.now()` · `shifts.filter(...)`가 각각 error | 테스트함 — **`__tests__`와 `*.mock.ts` 면제가 실제로 먹는지**, `model`·`hooks` 파일은 대상이 아님, 예외 목록에 있는 경로가 조용히 통과함 | 해당 없음 — 정적 분석이다 | 해당 없음 — 순수 판정 | 해당 없음 — ESLint가 파일마다 독립 판정한다 |
| 21·22 상태의 자리 | 테스트함 — 훅 일곱이 각자 단위 테스트로 상태 전이를 단언 | 테스트함 — 같은 날 두 번 누르기·마지막 알림 끄기·화면 재마운트에서 상태가 규칙대로 움직임 | 테스트함 — **`useAmountReveal`이 화면 복귀로 열릴 땐 리빌 빛을 안 켠다**(손으로 열 때만), 가림 설정이 꺼져 있으면 근무일에도 안 가려짐 | 해당 없음 — 로컬 상태에 권한이 없다 | 테스트함 — 알림 끄기 연타에 카드가 한 장씩만 넘어감 | 해당 없음 — 훅 하나가 한 컴포넌트 트리를 산다 |
| 23~25 라우트 상태 | 테스트함 — `loading.tsx`·`error.tsx`가 탭 셸을 남긴 채 안쪽만 바꿈 | 테스트함 — 한 블록만 던지면 그 자리만 실패하고 넷이 삶, 셸이 던지면 화면 한 장 | 테스트함 — **다섯 블록이 다 던져도 헤더·탭바가 살아 있음**, `animate-pulse`가 저장소에 안 남음 | 해당 없음 — 실패 표시에 권한 분기가 없다 | 테스트함 — 「다시 시도」가 경계 `reset()` + `router.refresh()`를 한 번만 부름 | 테스트함 — 블록이 서로 다른 시각에 도착해도 순서와 자리가 안 바뀜 |
| 26 시트 라우트 | 테스트함 — 홈·일정 양쪽에서 같은 주소가 열리고 시트로 뜸 | 테스트함 — 직접 방문·새로고침에서 전체 화면으로 열림 | 테스트함 — **뒤로가기가 겹을 하나씩 벗김**(`/roster/x/change` → `/roster/x` → 원래 화면), 없는 날짜는 not-found | 해당 없음 — 명단 권한은 서버 쿼리가 판정하고 이 task가 안 바꾼다 | 테스트함 — 같은 주소를 두 번 밀어도 시트가 하나 | 해당 없음 — 라우터 상태 하나 |
| 27·28 상태 도구 | 테스트함 — Provider가 서고 무한 스크롤이 두 회차씩 붙음 | 테스트함 — 더 불러오기 실패 시 목록이 살아 있고 재시도가 가능 | 테스트함 — **zustand `persist`의 SSR 수화**(첫 렌더가 서버와 같음), 저장값이 없을 때의 기본값 | 해당 없음 — 가림 설정은 기기에만 있고 서버로 안 간다 | 테스트함 — 바닥 도달 연타가 같은 페이지를 두 번 안 부름 | 해당 없음 — 쿼리 키 하나에 요청 하나 |
| 29·30 번들 상한 | 테스트함 — `gate:bundle`이 새 상한에서 통과 | 테스트함 — 상한을 넘긴 fixture에서 여전히 위반을 보고 | 테스트함 — **의존성 둘을 넣은 뒤의 실측을 숫자로 기록**하고 600KB 대비 여유를 적는다. 여유가 50KB 아래면 후속 task를 `should`로 올린다 | 해당 없음 — 빌드 산출물을 읽는 판정이다 | 해당 없음 — 재실행이 같은 결과 | 해당 없음 — 빌드 뒤 한 번 잰다 |
| 33·34 칸 radius와 간격 | 테스트함 — `gate:tokens`가 `radius-cell`을 문서와 css 양쪽에서 찾아 짝을 맞춤 | 테스트함 — 배지·칸 넷이 같은 유틸리티를 쓰는지 컴포넌트 테스트로 확인 | 테스트함 — **`p-`·`m-`·`gap-` 임의값과 사다리 밖 값이 0건**(`project/spacing-scale`이 무출력), `--spacing-*` 목록이 task 전후 동일 | 해당 없음 — CSS 선언에 실행 권한이 없다 | 해당 없음 — 선언은 멱등 | 해당 없음 — 빌드 시점에 한 번 평가된다 |
| 32 radius 사다리 | 테스트함 — `gate:tokens`가 `radius-xs`를 문서와 css 양쪽에서 찾아 짝을 맞춤 | 테스트함 — 문서 행만 넣고 css를 빼면 미해결로 잡힘 | 테스트함 — **저장소 전수 검사로 `rounded-[` 임의값이 0건**, skeleton 막대 셋이 전부 `rounded-xs` | 해당 없음 — CSS 선언에 실행 권한이 없다 | 해당 없음 — 선언은 멱등 | 해당 없음 — 빌드 시점에 한 번 평가된다 |
| 31 verify | 테스트함 — `pnpm verify` 전체 통과 | 테스트함 — `gate:tokens`·`gate:docs`가 이관 누락을 잡는지 확인 | 해당 없음 — 통과 여부의 이진 판정 | 해당 없음 — CI 실행 권한은 기존 그대로다 | 해당 없음 — 재실행이 같은 결과 | 해당 없음 — 게이트가 순차로 돈다 |

핵심 위험 넷을 따로 적는다.

**`--color-border` 값 변경이 두 화면 밖으로 번진다.** `#dee1e6` → `#e5e8eb`는 이 토큰을 쓰는 모든 화면의 선을 함께 바꾼다. 두 값의 차이가 작아 눈에 안 띄지만 「기계 치환이라 렌더가 그대로」는 아니다. 이관 대상은 두 화면인데 영향은 스물한 화면이다. 되돌리는 비용이 낮고(토큰 한 줄) 방향이 정본과 맞으므로 바꾸되, 다른 화면의 렌더 변화는 P0-T49~T54가 각자 확인한다. `--color-surface-weak` `#f7f7f7` → `#f1f3f6`도 같다.

**`display` 유틸리티 삭제가 스물한 화면을 건드린다.** 사용처를 세어보니 스물다섯 곳이고 전부 화면 제목의 `<h1>`이다(`src/views/**` 스무 파일 · `src/app/(protected)/admin/page.tsx` · `src/app/__tests__/globals.test.ts:76` · `PayView.tsx:152`의 금액 하나). 문서는 원래 `display`를 금액, `headline-lg`를 화면 제목이라고 적었는데 코드가 제목에 `display`를 쓰고 있어 문서와 코드가 이미 어긋나 있다. 라운드 2가 화면 제목을 22/30으로 내렸으므로 스물다섯 곳이 `typo-headline-md`로 간다(`PayView.tsx:152`의 금액만 `typo-title` 18/26). 두 화면 밖으로 나가는 치환이지만 대안이 없다 — 남기면 열아홉 화면에 32/40 700이 살아 「화면에 700이 없다」가 거짓이 된다. 방향이 정본과 같고 그 화면들은 P0-T49~T54가 어차피 다시 그린다. `--color-border` 값 변경과 같은 성격의 번짐이다.

**빈 상태 판정이 `ui`로 새기 쉽다.** 「셋 다 비면 한 줄로 접힌다」·「알림과 오늘만 접힌다」·「전부 실패면 한 장」은 전부 조건 판정이다. `ui`에 `if`를 늘어놓으면 다음 화면이 그걸 복사한다. 판정은 `views/home/model/home-blocks.ts`가 갖고 `ui`는 판정 결과인 열거값을 받는다.

**preview가 계약 검사 자리다.** 컴포넌트 테스트는 프롭 하나씩을 보지만 「다섯 빈 상태가 동시에 온 날」이나 「배너가 뜬 채로 시트가 열린」 조합은 눈으로 봐야 잡힌다. 열여섯 시나리오는 스크린샷 회귀가 아니라 사람이 훑는 목록이고, 그 목록이 빠짐없는지는 시나리오 이름을 NOTES의 상태 표와 대조해 확인한다.

### DEV-* 적용 상태

- `DEV-SSOT-01`: 추가 결정 — 디자인 규칙의 정본을 NOTES에서 `docs/product/design/**`로 옮긴다. 이관이 끝나면 NOTES 머리에 「정본은 L3다」를 적어 두 곳이 정본을 다투지 않게 한다.
- `DEV-TOKEN-01`: 기본 적용 — 화면은 의미 토큰만 쓴다. 원시 hex를 컴포넌트에 직접 적지 않는다. 예외는 그림 자산 안의 고정색이고 NOTES 「그림 자산」 절이 근거를 갖는다.
- `DEV-ARCH`: 추가 결정 — 홈의 블록 다섯과 일정의 두 뷰를 `views/*/ui/`에 둔다. 더해 **`views/*/hooks/`를 처음 세운다** — 지금까지 `hooks`는 `features/`와 `shared/`에만 있었지만 `fsd.json`이 레이어를 가리지 않고 정의한 세그먼트라 새 계약이 아니다. 계층 순서와 의존 방향은 그대로다.
- `DEV-ARCH-06`: 부분 적용 — `"use client"`는 훅을 쓰는 leaf에만 붙인다. `HomeView`·`ScheduleView` 전체를 클라이언트로 만들지 않는다. 두 화면 다 상호작용이 블록 단위라 경계를 아래로 밀 수 있다.
- `DEV-NAME-*`: 기본 적용 — `config/fsd.json`의 세그먼트 규칙을 따른다. `ui`는 컴포넌트, `model`은 판정, 테스트는 세그먼트 옆 `__tests__`.
- `DEV-TEST-01`: 기본 적용 — tdd. `unit-test-writer`가 컴포넌트 RED를 남기고 `publisher`가 GREEN을 만든다. 증거는 `runs/P0-T48/tdd.json`.
- `DEV-CODE-07`: 기본 적용 — 설명 주석 금지.
- `DEV-CODE-09`: **추가 결정** — `SHOULD`에서 `MUST`로 올리고 예외를 「className 조합과 열거값 분기」 둘로 좁힌다. 지금 문구의 「표현용 조건부 렌더」가 판정을 표현으로 위장시키는 뒷문이다. `project/no-logic-in-ui`가 강제한다.
- `DEV-SEC`·`DEV-DATA`: 해당 없음 — 서버 모듈과 스키마를 안 만든다. 기존 쿼리의 반환 타입만 읽는다.
- `DEV-TIME`: 부분 적용 — 카운트다운과 D-n이 시간을 센다. 계산은 `model`이 하고 기준 시각을 프롭으로 받아 테스트가 시계를 고정한다. 인증 성립 판정은 하지 않는다.
- `DEV-CACHE`·`DEV-OFFLINE`: 부분 적용 — 오프라인 배너와 재시도가 기존 `widgets/offline`과 TanStack Query 무효화에 붙는다. 캐시 키와 전략을 새로 만들지 않는다.

## Architecture

### 문서 이관 — 어느 문서 어느 줄을 무엇으로 바꾸는가

개정 목록의 쉰 행을 문서별로 묶었다. 행의 근거는 NOTES의 라운드 기록이 갖는다.

**`docs/product/design/FOUNDATIONS.md`**

- `:9-26` 원시 팔레트 표 — 일곱 행을 더한다. `blue-800` `#0c3f9c`(확정 상태 글자) · `blue-100` `#cfe0fc`(D-1 배지, 선택 칸) · `blue-50` `#e4edfd`(확정 틴트, D-2) · `blue-25` `#f2f6fd`(신청함 틴트) · `gray-800` `#3a3f4a`(선택 탭 채움) · `gray-250` `#e5e8eb`(hairline, 오늘 테두리, skeleton 막대) · `gray-150` `#f1f3f6`(지면, 약한 표면). 기존 행의 값은 그대로 둔다.
- `:28-38` 제품 의미 토큰 표 — **손대지 않는다.** 근거는 「미결 사항」이다.
- `:52` variable 축 문장 — 굵기 목록을 `400·500·600`으로 고친다. 700이 사라졌다.
- `:54-63` 타이포그래피 표 — `display` 행을 빼고 `caption-strong` 13/18 500을 넣는다. 무게 열을 라운드 24로 바꾼다. 표 아래에 무게가 기본값이고 자리마다 override한다는 한 줄을 더한다.
- `:56-57` 사용 열 — `headline-lg`를 「카운트다운」으로, `headline-md`를 「화면 제목」으로 고친다. 금액은 `title` 18/26이다.
- `:90` 좌우 여백 — 20px를 16px로 고친다.
- `:92` 카드 문장 — 「카드로 모든 구획을 감싸지 않는다」를 「카드가 구조의 중심이고 구획은 배경색 차이로 나눈다. 카드 사이에는 선을 쓰지 않고, 한 카드 안에서 행을 나누는 hairline만 허용한다」로 바꾼다.
- `:109-122` 형태와 깊이 — 「블러」 절을 더한다. 금액 숨김 7px(읽지 못하게)과 헤더 9px + 지면색 50%(뒤에 뭔가 있다고 알리게) 둘을 나눠 적는다.
- `:126-131` 아이콘 — 하단 탭 선택만 채움 예외이고 채움 색이 `gray-800`이라는 것, `Menu`를 `LayoutGrid`로 바꾼 이유를 적는다. `:128`의 「선택 상태는 action 색」을 지운다.
- `:124-131` 뒤 — 「그림 자산」 절을 신설한다. 토큰 예외인 이유, 알림 다섯과 급여 앵커 셋, 애플 이모지 어법, 28px 기본·24px 하한, 고정색 목록, 빨강 금지, 진짜 이모지를 안 쓰는 이유.
- `:135-139` 모션 표 — 「자리 이동 200~300ms」 행을 더한다. 탭 눌림 420ms는 표 아래 예외로 따로 적는다.

**`docs/product/design/PATTERNS.md`**

- `:7` 하단 탭 — `홈 · 일정 · 급여 · 전체`로 고치고 선택 표시를 `gray-800` 채움으로 바꾼다.
- `:13` 하단 고정 저장 버튼 — 조건부 등장(변경 0이면 안 뜬다)을 「깊은 작업」의 한 꼴로 적는다.
- `:19` 홈 — 「상황에 따라 바꾼다」를 「고정 다섯 블록. 자리는 같고 안의 내용이 바뀐다. 데이터가 없으면 없다고 말하고, 통째로 접히는 것은 알림과 오늘 둘뿐이다」로 바꾼다.
- 「행」 절 신설 — 앵커 32 · 라벨 위 값 아래 · 오른쪽 하나만 · 행 상하 12 + hairline · 카드 상하 4 · 더보기 행. 한 행에 목적지 하나. 여러 줄이 이어지는 목록 항목은 16/24 400.
- `:22` 빈 상태 — 「이유와 다음 행동을 함께 제공한다」 한 줄뿐이라 모양이 없다. 「빈 블록」 절로 넓힌다 — 앵커 없는 안 눌리는 quiet 한 줄(16/24 400) + 더보기 유지. 배지에 낱말을 넣지 않는다. 값 자리가 있으면 `—`이고 블러도 탭도 없다.
- `:73-82` 로딩·오류·오프라인 — `:75`의 skeleton에 모양을 적는다(막대 `--color-border` radius 6, 반짝임 없음, 아는 것은 안 가림). **에러 규칙을 신설한다** — 일부 실패는 블록 자리에 한 줄 + 「다시 시도」 알약, 전부 실패면 화면 한 장(헤더·탭바 생존), 빨강 금지.

**`docs/product/design/COMPONENTS.md`**

- `:64-85` Calendar — 셀을 숫자만으로 바꾸고 오늘을 칸 두르는 실선 1px `#e5e8eb`로 고친다. 상태 여섯 표를 라운드 28 표로 갈아끼운다. 점은 「내가 근무하는(했던) 날」 하나만 뜻하고 확정은 파랑, 지난 근무는 회색, 변경 요청 중은 속이 빈다. 채움 `#cfe0fc`는 「이번에 손댄 칸」에만 남는다.
- `:129-134` Notification row — 「모두 읽음이 없다」를 뒤집는다. 홈 카드의 `X`는 읽음이 아니라 그날 하루 미루기이고, 종 점은 알림 화면에서 읽거나 「모두 읽음」을 눌러야 꺼진다. 홈 블록에 안 오는 알림도 점을 만든다. 모양은 P0-T51이 그린다.
- `:136-140` Connectivity banner — 헤더 레이어의 셋째 줄(80 → 120)로 고친다. 색 `warning-surface` + `warning`, 문구에 읽기 전용을 붙인다. 비활성 이유는 버튼 라벨이 진다.
- 「바닥 시트」 절 — 닫기는 머리 오른쪽 ✕, 겹겹 시트는 머리 왼쪽 ←. 시트는 앱에서 하나다.

**`docs/product/design/WORKER-FLOWS.md`**

- `:30` 탭 넷 — `PATTERNS.md:7`과 같이 갱신한다.
- `:30-35` 홈 우선순위 다섯 단계 — 다섯 블록 구조와 블록별 상태표로 갈아끼운다.
- `:39`·`:110` 예상 급여 비표시 — 홈에 가린 금액을 둔다로 뒤집는다. 같은 자리에 **지난 달 fallback을 걷는다**를 적는다. 급여 행 셋의 자리는 지난주 · 이번 달 · 연 누적으로 고정이고 이름이 달을 넘나들지 않는다.
- `:45` 주 시작 요일 — 일정 달력은 일요일 시작 그대로 둔다. 그 아래에 **홈 주간 스트립은 월요일 시작**이라는 것과 이유(스트립은 급여 주를 그리고 달력은 달력 관습을 그린다)를 한 줄로 적는다. 급여 주의 경계 자체는 `PRD.md:346`에 걸린 기획 물음이라 이 task가 정하지 않는다. 문서에 적어두지 않으면 다음 화면이 둘 중 아무거나 베낀다.
- `:47`·`:49-50` undo — 없앤다. 변경 0이면 바가 없고 1개부터 240ms로 올라오며 개수를 추가·취소로 나눠 센다. 저장하면 바가 걷히고 토스트 하나다.
- `:71` 본인 행 — action tint를 파랑 500 글자로 바꾼다.
- `:80`·`:86` 포지션 교대 — **이 task가 고치지 않는다.** P0-T55의 기획 승인 뒤에 열린다. 개정 목록의 그 행은 「P0-T55로 이월」로 닫는다.
- `:90` 홈의 행동 하나 — 파랑 버튼 하나는 유지하되 그 버튼이 화면을 이동시킨다는 것을 적는다.
- `:94-95` 인증 — 홈 카드 안이 바뀌는 것이 아니라 별도 페이지로 넘어가고 끝나면 홈으로 돌아온다로 고친다. 화면은 P0-T49다. `:96`(핀 + 잔잔한 원)과 `:97`(좌표·거리·정확도 숨김)은 그대로 산다.
- `:117` 누적 급여 — 「누적 예상 급여」 명명을 적고 실제 지급이 아님을 붙인다.
- 「화면 설정」 화면 신설 — 「근무일 자동 가림」 스위치를 소유한다.

**`docs/product/DESIGN.md`**

- `:24` — 「카드, 색상, 팝업을 남용하지 않는다」를 카드 기준으로 다시 쓴다. `FOUNDATIONS.md:92`와 같은 방향이다.

**기획으로 되돌린 행 넷**은 문서를 고치지 않고 개정 목록에서 「1단계 반환」으로 닫는다 — `PRD.md:298-300`(인증 마감 시각) · `PRD.md:346`(주급 경계) · `WORKER-FLOWS.md:86`(포지션 교대) · `schedule-cell-state.ts:20-29`(「확정」의 주체). `PRD`에 금액 가림 개념을 적는 행도 여기 든다. 금액 가림은 화면 규칙이 아니라 제품 정책이고 PRD 개정은 기획 승인이 먼저다.

`deadline-batches.ts`의 다중 묶음 전제는 코드 행이라 아래 「코드 구조」가 받는다.

### 토큰 구조

`globals.css` `:root`에 원시 일곱을 더한다.

```
--raw-blue-800: #0c3f9c;
--raw-blue-100: #cfe0fc;
--raw-blue-50:  #e4edfd;
--raw-blue-25:  #f2f6fd;
--raw-gray-800: #3a3f4a;
--raw-gray-250: #e5e8eb;
--raw-gray-150: #f1f3f6;
```

`@theme`의 의미 토큰은 이렇게 붙는다.

```
--color-canvas:            var(--raw-gray-150);
--color-surface-weak:      var(--raw-gray-150);
--color-border:            var(--raw-gray-250);
--color-ink-800:           var(--raw-gray-800);
--color-action-deep:       var(--raw-blue-800);
--color-action-tint-weak:  var(--raw-blue-25);
--color-action-tint:       var(--raw-blue-50);
--color-action-tint-strong: var(--raw-blue-100);
```

`--color-surface-weak`가 `#f7f7f7`에서 `#f1f3f6`으로, `--color-border`가 `#dee1e6`에서 `#e5e8eb`로 바뀐다. 시안은 약한 표면에 `#f2f4f6`을 썼는데 지면 `#f1f3f6`과 채널당 1 차이라 하나로 합쳤다. 두 값이 눈으로 안 갈리는데 이름이 둘이면 다음 화면이 아무거나 고른다.

`body`의 배경은 `--color-surface`에서 `--color-canvas`로 바뀐다. 라운드 1의 「지면」이 실제로 서는 자리다.

타이포 유틸리티 여덟은 표를 따라 다시 쓴다. `typo-display` 블록을 지우고 스물다섯 사용처를 치환한다 — 화면 제목 스물넷은 `typo-headline-md`, `PayView.tsx:152`의 금액 하나는 `typo-title`이다. `typo-caption-strong`이 신설된다.

무게는 유틸리티의 기본값이고 자리마다 Tailwind의 `font-normal`·`font-medium`·`font-semibold`로 덮는다. 라운드 24가 정한 열한 쌍 중 여덟이 기본값이고 셋이 override다 — 모달 제목 16/24 600 · 더보기 14/20 400 · D 배지와 선택 탭 13/18 600.

### Dumb UI 린트

`project/no-logic-in-ui`는 기존 플러그인 관례를 그대로 따른다 — `tools/eslint-plugin-project/lib/contract.mjs`의 `loadContract(cwd)`로 `config/fsd.json`을 읽고 `resolveLocation(filename, cwd)`으로 세그먼트를 판정한다. `segment !== "ui"`면 아무것도 안 한다. 새 파일 둘이다.

- `tools/eslint-plugin-project/rules/no-logic-in-ui.mjs`
- `tools/eslint-plugin-project/rules/__tests__/no-logic-in-ui.test.mjs`

**막는 것 다섯.**

| 무엇 | 왜 |
| --- | --- |
| 비교 연산자 `<` `>` `<=` `>=` | 값을 견주는 것은 판정이다. 열거값 분기는 `===`로 충분하다 |
| 산술 `-` `*` `/` `%`와 단항 `-` | 남은 시간·합계·비율은 `model`이 낸다 |
| `.length` 접근 | 「비었나」와 「몇 개인가」가 `ui`에 들어오는 가장 흔한 문이다 |
| `filter` `reduce` `sort` `slice` `find` `some` `every` `flatMap` | 목록을 골라내고 줄 세우는 것은 판정이다. **`map`은 JSX 표현식 안일 때만 통과한다** — 그건 렌더링이지 파생이 아니다 |
| `new Date` · `Date.now` · `Intl.*` · `toLocaleString` · `toLocaleDateString` · `toFixed` | 시각과 포맷은 `model` 몫이다. `ui`는 완성된 문자열을 받는다 |

**통과시키는 것.** `===`·`!==` 열거값 분기, `&&`·`||`·`??`·`?.`, 템플릿 리터럴과 `cn()`의 className 조합, JSX 안의 목록 `map`. `__tests__` 아래와 `*.mock.ts`는 대상이 아니다 — 목 데이터는 값을 만드는 것이 일이다.

`+`는 막지 않는다. 문자열 이음과 덧셈을 정적으로 가르려면 타입 정보가 필요하고, 그 복잡도만큼의 값이 없다. 산술 `+`가 새면 리뷰가 잡는다.

**켜는 방식이 중요하다.** `eslint.config.mjs`에서 규칙을 **기본 `error`**로 켜고, 아직 이관 안 된 화면만 `files:` 블록으로 경로를 **이름 대어 끈다**. 반대로(이관된 화면만 켜기) 하면 새로 만드는 파일이 규칙 밖에서 태어난다. 예외 목록은 갚아야 할 빚의 목록이고 P0-T49~T54가 자기 화면 줄을 지운다. 홈·일정은 이 task가 다시 쓰므로 목록에 오르지 않는다.

`config/fsd.json`은 `ui` 세그먼트에 `noLogic: true` 한 필드를 더한다. 규칙이 세그먼트 이름을 하드코딩하지 않고 계약에서 읽게 하려는 것이고, `CLAUDE.md`가 적은 「ESLint와 tdd-guard가 한 파일을 읽는다」를 지킨다.

### 라우트 구조

Next 16의 파일 규약이 이 화면들이 필요로 하는 것을 거의 다 갖고 있다. 손으로 짜던 것을 규약으로 옮긴다.

```
src/app/(protected)/
  layout.tsx                          프로필 게이트 — 여기가 실패하면 「화면 한 장」이다
  providers.tsx                       QueryClientProvider (클라이언트 경계)
  (tabs)/
    layout.tsx                        헤더 레이어 + 탭바 + @sheet 슬롯
    loading.tsx                       탭 셸 안의 첫 페인트
    error.tsx                         라우트 실패 — 헤더·탭바는 남는다
    page.tsx                          홈 — 블록 다섯을 Suspense로 감싼다
    schedule/
      page.tsx · loading.tsx · error.tsx
    roster/[date]/
      page.tsx                        직접 방문·새로고침에서의 전체 화면
      change/page.tsx                 근무 변경 요청 (겹)
    @sheet/
      default.tsx                     null — 시트가 없을 때
      (.)roster/[date]/page.tsx       가로채서 바닥 시트로
      (.)roster/[date]/change/page.tsx
```

**시트가 라우트인 이유.** 모바일에서 뒤로가기로 시트가 닫히는 것이 기대 동작인데 컴포넌트 상태로는 그게 공짜로 안 온다. 라우트로 올리면 뒤로가기·새로고침·링크 공유가 전부 따라온다. 겹겹 시트의 깊이가 URL 겹이 되므로 revision 3이 적은 `shared/hooks/useSheetStack.ts`는 **없앤다** — 라우터가 이미 스택이다. 홈의 오늘 카드 발치와 일정의 확정 날짜가 같은 주소를 여는 것이 「시트는 앱에서 하나다」를 코드로 지킨다.

**블록별 스트리밍.** `page.tsx`는 데이터를 안 기다린다. 블록마다 async 서버 컴포넌트를 두고 `<Suspense fallback={<블록 skeleton/>}>`으로 감싸면 먼저 온 블록부터 그려진다. 지금은 `page.tsx`가 전부 `await`한 뒤 한 번에 그려서, 느린 쿼리 하나가 화면 전체를 잡는다. `(tabs)/layout.tsx`의 `listNotifications()`도 같은 문제라 종 점을 Suspense 뒤로 민다.

**에러 경계는 클라이언트 클래스 컴포넌트 하나다.** Next에는 컴포넌트 단위 `error.tsx`가 없으므로 `shared/ui/block-boundary.tsx`를 만들어 블록마다 두른다. 새 의존성(`react-error-boundary`)을 들이지 않는다 — 잡고 `reset`을 주는 클래스 하나면 된다. 「다시 시도」는 `reset()` 뒤 `router.refresh()`다.

**「전부 실패」가 셸로 옮겨간다.** 스트리밍에서는 블록 다섯이 각자 실패하는 것과 요청 자체가 못 서는 것이 다른 사건이다. 프로필 조회(`(protected)/layout.tsx`)가 실패하면 화면 한 장, 블록이 실패하면 블록 자리. 사용자가 보는 결과는 revision 1이 정한 것과 같고 경계를 세는 방식만 바뀐다.

**첫 페인트의 skeleton.** `src/app/loading.tsx`가 지금 `animate-pulse`를 쓰는데 라운드 34가 shimmer를 금지했다. 라우트별 `loading.tsx`를 세우며 루트 것도 함께 고친다.

### 상태 도구 둘

**TanStack Query** — `ARCHITECTURE.md:24`가 클라이언트 캐시로 이미 정해뒀는데 `package.json`에 없었다. 이 task에서 실제로 쓰는 자리는 **일정 목록의 지난 회차 무한 스크롤** 하나다(`useInfiniteQuery`). 나머지는 서버 컴포넌트가 읽으므로 쿼리 클라이언트를 안 탄다 — 블록 재시도도 `router.refresh()`이지 `invalidateQueries`가 아니다. revision 1의 위험 표가 「재시도는 읽기 쿼리 무효화」라고 적은 것은 **틀렸고** 여기서 바로잡는다. Provider는 세우되 쓰지 않는 곳에 억지로 끼우지 않는다.

지난 회차를 클라이언트가 더 부르려면 서버 진입점이 하나 필요하다. `features/recruitment/api/list-past-rounds.ts`를 만들어 기존 `listRecruitmentSchedules`를 감싼다 — 쿼리 본문을 안 고치고 호출 경로만 연다.

**zustand** — 스토어는 하나다. `shared/hooks/useAmountMasking.ts`가 「근무일 자동 가림」 설정을 갖고 `persist`로 기기에 남긴다. 화면을 가로지르는 유일한 클라이언트 상태이고(홈과 급여 화면이 같은 것을 본다), 나머지 화면 상태는 전부 화면 단위라 훅으로 둔다. SSR에서 수화가 어긋나지 않게 `skipHydration`을 쓰고 마운트 뒤에 되살린다 — 안 그러면 첫 렌더가 서버와 달라진다.

### 코드 구조

두 화면의 블록은 **`views/*/ui/`에 둔다.** `widgets/`는 「독립된 화면 블록」이고 홈의 다섯 블록은 홈 화면의 구성 요소다. 다른 화면이 쓰기 시작하면 그때 올린다 — 지금 올리면 쓰는 곳이 하나인 위젯이 다섯 생긴다. 예외는 이미 `widgets/`에 있는 셋(`app-shell`·`offline`·`pull-to-refresh`)이고 그대로 쓴다.

**홈**

- `views/home/model/home-blocks.ts` — 블록 다섯의 표시 판정. 입력은 화면이 받는 뷰 모델이고 출력은 블록마다 `filled | empty | hidden | failed | loading` 다섯 중 하나다. 「알림과 오늘만 접힌다」·「급여 셋 다 비면 한 줄」·「전부 실패면 한 장」이 여기 있고 `ui`에는 조건이 없다.
- `views/home/model/countdown.ts` — 인증 창 두 단계와 예정 시각 초과 뒤집기. 기준 시각을 인자로 받는다.
- `views/home/model/upcoming-shifts.ts` — D-n 계산, 내일부터 최대 셋, 배지 색 층위 셋.
- `views/home/hooks/useNoticeDeck.ts` — 알림 카드의 현재 장, 오늘 끈 목록(기기 저장), 교체 애니메이션 단계. 마지막 장을 끄면 블록이 접힌다는 판정은 `home-blocks.ts`가 하고 훅은 「몇 장 남았나」만 든다.
- `views/home/hooks/useWeekSelection.ts` — 주간 스트립에서 고른 날. 근무 없는 날은 안 눌리므로 선택될 수 없고, 같은 날을 다시 누르면 주 요약으로 돌아온다.
- `views/home/ui/HomeView.tsx` — 블록 다섯을 순서대로 놓고 판정 결과를 넘긴다. 훅을 여기서 부르고 그 값을 `model`에 먹여 나온 열거값만 아래로 내린다.
- `views/home/ui/NoticeBlock.tsx` · `TodayBlock.tsx` · `WeekStripBlock.tsx` · `UpcomingBlock.tsx` · `PayBlock.tsx`
- `views/home/ui/EmptyRow.tsx` — 빈 블록 한 줄. 앵커 없이, 안 눌리게, 16/24 400.
- `views/home/ui/FailedRow.tsx` — 실패 한 줄 + 「다시 시도」 알약. `EmptyRow`와 골격이 같고 오른쪽 자리만 찬다.
- `views/home/ui/BlockSkeleton.tsx` — 블록별 `<Suspense fallback>`. 아는 값을 남기고 서버 값 자리에만 막대를 깐다. 화면 한 장짜리 skeleton은 `(tabs)/loading.tsx`가 갖고, 전부 실패 화면은 `(tabs)/error.tsx`가 갖는다.
- `views/home/ui/home.mock.ts` — preview 아홉 시나리오의 목 데이터. 목 데이터의 요일을 실제 달력에 맞춘다(라운드 28이 찾은 어긋남).

**일정**

- `views/schedule/model/schedule-cell-state.ts` — 라운드 28 표의 여섯 상태로 다시 쓴다. **내 신청을 마감이 덮지 않게** 고친다. 「확정」이 누구의 확정인가는 기획 반환이라, 이 화면은 받는 데이터(`listRecruitmentSchedules` + `listOwnApplications`)로 말할 수 있는 것만 말한다.
- `views/schedule/model/deadline-batches.ts` — 회차가 보통 하나라는 전제로 고친다. 여럿이면 마감 임박순으로 쌓는다.
- `views/schedule/model/application-diff.ts` — 변경을 추가·취소로 나눠 세는 판정.
- `views/schedule/hooks/useScheduleViewMode.ts` — 달력·목록 전환.
- `views/schedule/hooks/useApplicationDraft.ts` — 로컬 선택 초안. 저장된 신청과 지금 손댄 칸을 들고, 추가·취소 개수 판정은 `application-diff.ts`에 묻는다.
- `views/schedule/hooks/usePastRounds.ts` — 지난 회차 무한 스크롤. `useInfiniteQuery`로 `features/recruitment/api/list-past-rounds.ts`를 두 회차씩 부르고 끝을 안다.
- `views/schedule/ui/ScheduleView.tsx` — 달력·목록 두 뷰와 바닥 시트를 얹는다. 훅 셋을 여기서 부른다.
- `views/schedule/ui/ScheduleCalendar.tsx` · `CalendarFooter.tsx`(세 줄) · `RecruitmentRoundList.tsx`(회차 카드와 무한 스크롤)
- `views/schedule/ui/RosterSheet.tsx` — 배정표 바닥 시트. 발치의 `근무 변경 요청`은 `근무 취소` 한 갈래만 연다.
- `views/schedule/ui/schedule.mock.ts` — preview 일곱 시나리오.
- `views/schedule/ui/DeadlineBatchList.tsx` — `RecruitmentRoundList.tsx`가 대신하므로 지운다.

**공용**

- `shared/hooks/useAmountReveal.ts` — 금액이 열렸나. 기본 가림 여부(`maskedByDefault`)를 **인자로 받는다** — 「오늘이 근무일인가」는 도메인이라 `shared`가 알면 안 된다. 「손으로 열었나」를 함께 들어 리빌 빛이 화면 복귀·상태 전환에서는 안 돌게 한다. 화면을 벗어나면 되돌아가는 것은 마운트마다 초기화되기 때문이다. 「스위치는 앱 전체 하나」는 `useAmountMasking` 스토어가 갖고 「열림은 화면 단위」는 이 훅이 갖는다. 닫기 아이콘이 ✕인가 ←인가는 시트가 라우트라 URL 깊이가 정한다.
- `shared/hooks/useAmountMasking.ts` — zustand 스토어. 「근무일 자동 가림」 설정 하나를 갖고 `persist`로 기기에 남긴다. 이 task의 유일한 전역 상태다.
- `shared/ui/masked-amount.tsx` — 금액 가림. 가려진 동안 더미를 blur 7px + `aria-hidden`으로 깔고, 손으로 열 때만 회백 빛이 1.5초 훑는다. 가림이 다시 걸리면 훑기가 즉시 사라진다.
- `shared/ui/anchor-illustration.tsx` — 그림 자산 여덟(알림 다섯 + 급여 앵커 셋)을 인라인 SVG로 갖는다. 32×32 앵커 칸, 알림만 28px.
- `shared/ui/d-badge.tsx` — D-n 배지. 32px radius 11, 색 층위 셋.
- `shared/ui/skeleton-bar.tsx` — 막대 하나. `--color-border` radius 6, 애니메이션 없음.
- `shared/ui/block-boundary.tsx` — 블록 하나를 두르는 클라이언트 에러 경계. 잡으면 실패 한 줄과 「다시 시도」를 보여주고 `reset()` 뒤 `router.refresh()`를 부른다.
- `widgets/app-shell/ui/AppShellTabBar.tsx` — 탭 넷과 `gray-800` 채움, 눌림 420ms. `/pay`를 `more` 활성으로 묶던 `:15-17`을 고친다.
- `widgets/app-shell/ui/AppHeader.tsx` — 상태 표시줄 24 + 헤더 56을 한 레이어 80으로 묶고 `blur(9px)` + 지면색 50%. 배너가 뜨면 120이 된다.
- `widgets/offline/ui/OfflineBanner.tsx` — 헤더 레이어의 셋째 줄로 들어가게 고친다.

**preview**

`views/preview/ui/PreviewView.tsx`의 구조를 그대로 쓴다. 홈 아홉 — 기본 · 인증 창 열리기 전 · 인증 창 열린 뒤 · 예정 시각 초과 · 근무 없는 날 · 전부 빈 날 · 로딩 · 부분 실패 · 전부 실패. 일정 일곱 — 달력 기본 · 달력 선택 중 · 열린 모집 없음 · 목록 기본 · 목록 지난 회차만 · 배정표 시트 · 오프라인. 오프라인 배너는 두 화면 모두에 조합으로 뜬다.

## Data model

해당 없음 — DB 스키마·마이그레이션·RLS 변경이 없다. 기존 쿼리(`listRecruitmentSchedules`·`listOwnApplications`·`confirmation.ts`·`get-schedule-prep.ts`)의 반환 타입을 읽기만 한다.

## Interface

- `toHomeBlocks(input: HomeViewModel, now: Date): HomeBlockPlan` — 블록 다섯의 상태와 순서를 낸다. `HomeBlockPlan`은 블록 이름과 `filled | empty | hidden | failed | loading`의 쌍 배열이다. `hidden`인 블록은 배열에서 빠진다.
- `toCountdown(window: AttendanceWindow, now: Date): CountdownState` — 열리기 전·열린 뒤·초과 셋 중 하나와 남은 초.
- `toUpcomingShifts(shifts: readonly Shift[], today: string): UpcomingShift[]` — 내일부터 D-n 오름차순 최대 셋. 배지 층위를 함께 낸다.
- `toScheduleCellStates(...)` — 서명은 그대로 두고 반환 상태를 라운드 28의 여섯으로 바꾼다.
- `toApplicationDiff(saved: Set<string>, selected: Set<string>): { added: number; removed: number }`
- `<MaskedAmount value={number} masked={boolean} onReveal={() => void} />` — 가려진 동안 `value`를 DOM에 안 넣는다.
- `<AnchorIllustration name={IllustrationName} size={28 | 32} />` — 이름 여덟 중 하나. 24px 미만을 받지 않는다.
- preview 시나리오 계약: `PreviewScreen[]`에 홈·일정 두 항목, 각 항목의 `scenarios[]` 이름이 NOTES의 상태 표와 1:1로 대응한다.

## Optimizations

- 블록 판정이 순수 함수라 테스트가 렌더 없이 돈다. 다섯 빈 상태의 조합은 컴포넌트가 아니라 `home-blocks.test.ts`가 훑는다.
- 그림 자산을 인라인 SVG로 두면 요청이 안 생기고 `bundle-budget.ts:8`의 500KB 예산에 눌리지 않는다. 컬러 이모지 웹폰트는 서브셋해도 예산 밖이라 택하지 않았다.
- skeleton에 애니메이션이 없어 `motion-render-budget.ts`가 세는 반복 애니메이션이 늘지 않는다.
- 목록의 지난 회차는 두 회차씩 붙이므로 첫 렌더가 열린 회차만 그린다.
- 되돌림: 토큰은 `globals.css`에서 값을 원래대로 돌리면 되고, 화면은 컴포넌트 파일을 되돌리면 된다. DB와 서버에 흔적이 없다.

## 변경 허용 경로

```
docs/product/DESIGN.md
docs/product/design/FOUNDATIONS.md
docs/product/design/PATTERNS.md
docs/product/design/COMPONENTS.md
docs/product/design/WORKER-FLOWS.md
docs/execution/radio/P0-T48-radio.md
docs/execution/runs/P0-T48/**
docs/execution/reviews/**
docs/execution/retrospective/**
docs/execution/phases/00-foundation.md
docs/execution/phases/index.jsonl
src/app/globals.css
src/app/__tests__/**
src/shared/ui/**
src/widgets/app-shell/**
src/widgets/offline/**
src/views/home/**
src/views/schedule/**
src/views/preview/**
src/views/**/ui/*.tsx
src/app/(protected)/(tabs)/**
src/app/(protected)/admin/page.tsx
tools/eslint-plugin-project/**
eslint.config.mjs
config/fsd.json
docs/standards/DEVELOPMENT.md
docs/standards/ARCHITECTURE.md
package.json
pnpm-lock.yaml
src/app/(protected)/**
src/app/loading.tsx
src/app/error.tsx
src/shared/hooks/**
src/features/recruitment/api/list-past-rounds.ts
src/features/recruitment/api/__tests__/list-past-rounds.test.ts
harness/lib/bundle-budget.ts
harness/self-test/bundle-budget.test.ts
docs/standards/adr/0015-motion-library-scope.md
```

용도 한정을 넷으로 나눠 적는다.

**문서.** `FOUNDATIONS.md`는 원시 팔레트 일곱 행 추가, 타이포 표 재배치, 좌우 여백과 카드 문장 개정, 블러·그림 자산 두 절 신설, 모션 표 한 행 추가, **radius 표에 `radius-xs` 6px·`radius-cell` 12px 두 행 추가(revision 6·7)**에 한정한다. **제품 의미 토큰 표의 값을 바꾸지 않는다.** `PATTERNS.md`·`COMPONENTS.md`·`WORKER-FLOWS.md`·`DESIGN.md`는 위 「문서 이관」이 줄 단위로 적은 것에 한정하고, `WORKER-FLOWS.md:80`·`:86`(포지션 교대)은 건드리지 않는다. **`docs/product/PRD.md`는 허용 경로에 없다** — 기획 반환 물음 넷은 이 task가 안 고친다. `docs/execution/reviews/**`는 이 task의 리뷰 결과와 backlog 누적 줄에, `docs/execution/retrospective/**`는 회고에 한정한다. `00-foundation.md`는 P0-T48 절의 `test_mode` 정정과 완료 기록에 한정한다.

**토큰.** `globals.css`는 원시 일곱 추가, 의미 토큰 여섯 신설, `--color-border`·`--color-surface-weak`의 참조 교체, `body` 배경 교체, `@utility typo-*` 여덟 재배치와 `typo-display` 삭제, **`--radius-xs: 6px`·`--radius-cell: 12px` 두 줄 추가(revision 6·7)**에 한정한다. 모션 토큰·reduced-motion 블록·vaul/sonner 셀렉터를 건드리지 않는다.

**화면.** `src/views/home/**`와 `src/views/schedule/**`는 전면 재작성이다. `src/shared/ui/**`는 위 Architecture가 이름을 댄 넷의 신설과 기존 `button`·`calendar`·`segmented-control`의 토큰 반영에 한정하고, 다른 shadcn 컴포넌트를 갈아엎지 않는다. `src/widgets/app-shell/**`는 탭 넷·채움 색·눌림·헤더 레이어에, `src/widgets/offline/**`는 배너를 셋째 줄로 옮기는 데 한정한다. `src/app/(protected)/(tabs)/**`는 두 화면의 라우트가 새 view에 넘기는 프롭을 맞추는 데만 쓴다 — 데이터 로딩 방식과 쿼리를 바꾸지 않는다.

**치환 전용.** `src/views/**/ui/*.tsx`(홈·일정·preview 제외)와 `src/app/(protected)/admin/page.tsx`는 **`typo-display` 클래스 문자열 치환에만** 쓴다 — 화면 제목 스물넷은 `typo-headline-md`, `PayView.tsx:152`의 금액은 `typo-title`. 마크업 구조·프롭·조건·문구·다른 클래스를 건드리지 않는다. 열아홉 화면의 모양을 이 task가 고치는 것이 아니라 지워지는 유틸리티를 대체하는 것뿐이다. 나머지는 P0-T49~T54가 각자 다시 그린다.

**Dumb UI(revision 2).** `tools/eslint-plugin-project/**`는 `no-logic-in-ui.mjs` 신설과 `index.mjs` 등록 한 줄에 한정한다 — 기존 열세 규칙의 판정 로직을 고치지 않는다. `eslint.config.mjs`는 새 규칙을 `error`로 켜고 아직 이관 안 된 화면의 예외 블록을 두는 데 한정한다. `config/fsd.json`은 `ui` 세그먼트에 `noLogic: true` 한 필드를 더하는 데 한정하고 다른 세그먼트의 `unitTest`·`verifiedBy`·`forbidImports`를 건드리지 않는다 — 이 파일은 `tdd-guard.sh`도 읽으므로 잘못 만지면 훅이 같이 움직인다. `docs/standards/DEVELOPMENT.md`는 `DEV-CODE-09` 한 줄을 `MUST`로 올리고 예외를 좁히는 데 한정하며, 다른 `DEV-*` 규칙을 손대지 않는다.

**라우트와 상태 도구(revision 4).** `src/app/(protected)/**`는 라우트 규약 파일(`loading.tsx`·`error.tsx`·`@sheet` 슬롯·`roster` 라우트)과 블록별 Suspense 재구성, `providers.tsx` 신설에 한정한다 — **인증 게이트(`resolveProfileAccess`)와 리다이렉트 규칙을 건드리지 않는다.** `package.json`·`pnpm-lock.yaml`은 `@tanstack/react-query`와 `zustand` 두 의존성 추가에 한정한다. `src/shared/hooks/**`는 `useAmountReveal`·`useAmountMasking` 둘 신설에 한정하고 기존 셋(`useOnlineStatus`·`useSwipeAction`·`useReducedMotion`)을 안 고친다. `src/features/recruitment/api/list-past-rounds.ts`는 **기존 쿼리를 감싸는 서버 진입점 하나**이고 파일 이름으로 못 박았다 — `features/**` 전체가 열린 것이 아니다. `docs/standards/ARCHITECTURE.md`는 TanStack Query가 실제로 서고 zustand가 한 자리에 들어왔다는 것을 적는 데 한정한다.

**번들 상한(revision 5).** `harness/lib/bundle-budget.ts`는 `BUNDLE_BUDGET_BYTES` 한 줄에 한정한다 — 측정 로직(`STATIC_CHUNK_DIRECTORY` 재귀·gzip 계산)을 건드리지 않는다. P0-T43이 그 재귀를 고친 이력이 있어 손대면 조용한 허위 통과를 되살릴 수 있다. `harness/self-test/bundle-budget.test.ts`는 새 상한을 반영하는 데 한정한다. `docs/standards/adr/0015-motion-library-scope.md`는 결정 3에 세 번째 인상을 적고 개정 이력에 행을 더하는 데 한정하며, **결정 1·2·4·5와 앞선 개정 이력 행을 건드리지 않는다.** `index.jsonl`의 P0-T44·P0-T45 행에 있는 `bundle-budget-500`·`bundle-budget-500-hold` check ID는 **그대로 둔다** — 끝난 task의 이력이다.

**안 여는 것.** `src/entities/**`·`src/views/**/model/**`(홈·일정 제외)·`supabase/**`·`harness/**`·`docs/product/PRD.md`는 허용 경로에 없다. `src/features/**`도 위에 이름을 댄 파일 둘 말고는 닫혀 있다. 일정의 신청 배선은 기존 `useApplicationBatch`를 그대로 쓰고, 신청 데이터의 모양이 부족하면 고치지 말고 질문으로 반환한다. `--color-border`와 `--color-surface-weak` 값 변경이 다른 화면의 렌더를 바꾸더라도 그 확인은 P0-T49~T54의 몫이다.

## 미결 사항

- **`action`·`action-pressed` 의미 토큰의 배경·테두리.** `FOUNDATIONS.md:32-33`의 `#eef4ff`·`#b8ceff`·`#e2ebff`를 홈·일정 시안이 한 번도 안 쓴다. 시안의 파란 테두리는 로딩 스피너와 변경 요청 중인 빈 점 둘뿐이고 파란 채움은 전부 틴트 사다리다. 새 틴트로 갈면 근거 없이 찍는 것이고, 두면 죽은 값이 남는다. 화면 둘로는 판단이 안 서므로 P0-T49~T54가 파란 테두리 표면을 쓰는지 보고 정한다.
- **모션 대역의 탭 눌림 420ms.** 표에 행으로 올리면 「버튼 피드백 120~160ms」와 부딪히고, 예외로 적으면 표가 규칙을 다 못 담는다. 예외로 적되 P0-T49~T54에서 같은 성격의 값이 더 나오면 표를 다시 짠다.
- **긴 이름 말줄임.** 오늘 카드 오른쪽 포지션 이름과 알림 카드 두 줄 넘침의 기준값. 계산은 `model`이 하기로 정했으나 값을 아직 안 정했다. 실제 데이터의 이름 길이를 보고 퍼블리싱 중에 정한다.
- **D 배지 형태 검수.** 색 층위는 라운드 27이 정했고 32px·radius 11이라는 형태는 라운드 7 수준의 검수를 안 받았다. 퍼블리싱하며 실제 렌더로 본다.
- **홈 목 데이터의 요일.** 시안은 「8월 18일 월요일」인데 2026-08-18은 화요일이다. 퍼블리싱 때 맞춘다.
- **508KB가 어디서 늘었나.** `ADR-0015`가 기록한 최종 실측은 491.0KB인데 지금 508KB다. 17KB가 언제 어디서 붙었는지 아무도 안 셌다. 상한을 올리는 것으로 감시선은 되찾지만 원인은 그대로 남는다. 후속 task가 청크별로 재고 줄인다.
- **TanStack Query가 이 task에서 얼마나 쓰이나.** 실제 사용처는 지난 회차 무한 스크롤 하나뿐이다. 서버 컴포넌트가 읽는 나머지는 쿼리 클라이언트를 안 탄다. `ARCHITECTURE.md:24`를 코드로 세우는 값어치는 있지만, 이 task만 놓고 보면 Provider가 거의 비어 있다. P0-T52(급여)·P4 계열이 실제 클라이언트 페치를 얹으며 채운다.
- **Dumb UI 예외 목록의 규모.** 규칙을 켜면 아직 이관 안 된 열아홉 화면 중 몇 곳이 걸릴지 아직 안 셌다. 구현 첫 단계가 전수 확인이고, 예외로 끄는 경로가 늘어나는 것 자체는 예상된 빚이다. 다만 `src/shared/ui/**`(shadcn 파생)가 대량으로 걸리면 그건 화면 task가 아니라 공용 컴포넌트의 문제라 별도 판단이 필요하다 — 그 자리에서 멈추고 묻는다.
- **주간 스트립의 주 경계.** 월요일 시작은 NOTES가 적은 가정이고 확정이 아니다. `PRD.md:346`이 「날짜별 금액과 월별 합계」라 급여 주의 시작일·월별 합계 존치·달에 걸친 근무의 귀속 셋이 기획 몫으로 남아 있다. 기획이 답하면 스트립의 요일 배열 상수 하나가 바뀐다.
