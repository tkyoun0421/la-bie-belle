# 디자인 시스템 개편 handoff

## 2026-08-16 · 기획 진행 중 (승인 전)

- 작업 식별자: 디자인 시스템 개편 (task ID 미부여, `P0-T47` 이후 예정)
- 현재 단계: 기획 진행 중 → 다음도 기획 (승인 게이트 미통과)
- 기준 시각: 2026-08-16

### 확정된 사실

사용자가 시안을 보고 고른 방향이다. **승인 게이트는 통과하지 않았고 `index.jsonl`에 task가 없다.**

- 시각 언어는 토스식 **회색 지면 + 흰 카드**로 간다. 지면 `#f1f3f6`, 카드 `#ffffff`, 그림자 없음. 대비를 배경색 차이로만 만든다.
- 지면색은 화면마다 가르지 않는다. 전 화면 회색으로 통일한다.
- 달력 셀은 **숫자 하나만** 넣는다. 범례, `open` 표시용 점, 셀 안 배지를 모두 뺀다. 오늘은 숫자 아래 밑줄로 표시한다.
- 셀·행의 상태 색 규칙은 한 문장이다. **채움이 진할수록 확정에 가깝다.** 다만 원색으로 채우지 않는다.
- 선택 색은 **C3안**이다. 확정은 이미 끝난 결정이고 지금 할 일은 신청이라, 화면에서 가장 강한 파랑은 하단 "신청하기" 버튼 하나가 되어야 한다.
- 브랜드 원색 `#0052ff`는 그대로 둔다. `DESIGN.md:55`가 앱 아이콘을 그 색으로 정해뒀다. 화면에서 쓰는 강도만 낮춘다.
- 타이포 스케일은 기존 `typo-*` 8단계를 유지한다. "글자가 크다"는 인상은 스케일이 아니라 어느 자리에 어느 단계를 썼는지의 문제였다.
- 일정 화면은 **달력과 목록 두 뷰**를 두고 사용자가 오간다. 기본값은 달력이다.
- 목록 뷰는 **마감 묶음** 형태다. `applicationDeadline`이 같은 날짜끼리 묶고 헤더에 마감을 한 번만 쓴다. 헤더의 "모두 선택"은 "이번에 열린 모집 전부 신청"이라는 뜻이 된다.

코드에서 확인한 사실도 함께 적는다.

- 신청 시점에 존재하는 데이터는 `workDate`, `applicationDeadline`, `status`, `applicationStatus` 넷뿐이다(`src/entities/schedule/model/recruitment-schedule.ts:15-20`). 근무 시간과 포지션은 확정 후 배정에서 생기므로 신청 화면에 놓을 수 없다.
- 일괄 생성은 공통 마감일을 쓴다(`docs/execution/phases/02-recruitment.md:31`). 다만 `P2-T04`가 마감 연장과 재오픈을 허용하므로 갈리는 경우도 생긴다. 마감 묶음 구조는 두 경우를 모두 그린다.
- `/preview`가 화면 7종을 실제 컴포넌트로 렌더링한다(`src/app/preview/page.dev.tsx`). `page.dev.tsx`는 개발 모드에서만 라우팅된다. 별도 디자인 도구를 두면 정본이 둘로 갈리므로 이곳을 시안 정본으로 삼는다.

### 화면이 시안과 달랐던 진짜 원인

사용자가 `/preview`에서 "시안과 다른 화면"이라고 지적했고, 파고들어 셋을 찾았다. 앞의 둘은 이전 작업분이 살아있었어도 그대로 남았을 문제다.

1. **지면 회색이 한 번도 적용된 적 없다.** `globals.css`의 `body{}`가 어떤 `@layer`에도 속하지 않아 Tailwind의 `.bg-canvas`(`@layer utilities`)를 항상 이겼다. CSS 캐스케이드에서 unlayered 규칙은 특이도와 무관하게 layered 규칙을 이긴다. 빌드된 CSS에서 `.bg-canvas`는 881줄(utilities 레이어 372~1379줄 안), `body {`는 1532줄로 레이어 밖이었다. 지면색을 `layout.tsx`의 클래스가 아니라 `globals.css`의 `body` 규칙에서 정하도록 고쳤다.
2. **DayPicker 스타일시트가 어디에도 import되지 않았다.** `react-day-picker/style.css`를 아무도 부르지 않아 달력이 기본 레이아웃 CSS 없이 raw table로 렌더링됐다. 남의 CSS를 들여와 덮어쓰는 대신 `classNames`를 전부 직접 지정했다.
3. **목록 화면이 아예 없었다.** 시안 `schedule-styles.html`의 C1·C2·C3 셋 다 마감 묶음 목록이고 달력은 한 줄도 없다. 달력 셀 색만 바꿔서는 닮을 수 없었다.

### 작업 트리 소실 사건

이 세션 도중 디자인 변경 15개 파일이 작업 트리에서 통째로 사라졌다. `git restore` 계열로 되돌아간 것으로 보이며 reflog에는 흔적이 없다. 같은 기간 HEAD가 `b7e53ab`에서 `dd3ad4c`로 세 커밋 움직였고, 그 커밋들은 전부 P4-T02다. 직후 한 번 더 untracked 파일(신규 테스트)만 사라졌다.

사용자 승인을 받아 전부 재적용했다. **커밋하지 않으면 또 사라질 수 있다.** 지금은 `in_progress` task가 없어 `gate:scope`가 커밋을 막는다.

### 미결 사항

- **task 부여와 기획 승인** — 결정 주체: 사용자, 반환할 단계: 기획. `P0-T47`(문서 개정) → `P0-T48`(토큰·`shared/ui`) → `P0-T49~51`(화면군) 5분할을 제안했으나 승인받지 않았다.
- **뷰 전환의 기본값 해석** — 결정 주체: 사용자, 반환할 단계: 기획. 지금은 매번 달력으로 시작한다. 마지막에 본 뷰를 기억하게 하려면 `localStorage`가 필요하다.
- **지나간 날짜의 목록 노출** — 결정 주체: 사용자, 반환할 단계: 기획. 지금은 맨 아래 "지나갔어요" 묶음에 넣었다. 신청 화면이니 빼는 선택지도 있다.
- **뷰 전환은 기능 추가다** — 반환할 단계: 기획. `PRD`, `design/WORKER-FLOWS.md`, `design/PATTERNS.md`(세그먼트 토글이 새 공통 패턴)가 함께 움직인다.
- **`DESIGN.md:24` 재작성** — 반환할 단계: 설계. "카드, 색상, 팝업을 남용하지 않는다"는 카드가 없던 시절 방침이다. 새 언어는 카드가 구조의 중심이다.
- **`notification-settings` 화면은 손대지 않았다** — P4-T02가 만드는 중인 미커밋 파일이라 건드리면 충돌한다. 그 task가 끝난 뒤 같은 언어로 맞춘다.

### 다음 행동

1. 값을 `docs/product/design/FOUNDATIONS.md`에 적는다. `DESIGN.md:14`가 "실제 CSS·Tailwind 토큰은 구현 시 이 문서에서 파생한다"고 정해뒀으므로 문서가 먼저다.
2. `P0-T47`부터 정식 절차로 다시 넣는다. 지금 코드는 승인 없이 만든 확인용이다.
3. 목록 뷰의 e2e를 추가한다. 세그먼트 전환과 "모두 선택"이 신청 저장까지 이어지는지 확인하는 흐름이 아직 없다.

### 증거·산출물 경로

미커밋 코드 변경이다. 게이트를 통과할 수 없어 커밋하지 않았다.

새로 만든 것

- `src/views/schedule/model/deadline-batches.ts` — 마감일로 묶고 임박순 정렬, 지난 마감은 묶음 하나로 뒤에. 테스트 8개
- `src/views/schedule/ui/DeadlineBatchList.tsx` — 시안 C3. 좌측 3px 바와 연한 칩, 행 배경은 칠하지 않는다
- `src/shared/ui/segmented-control.tsx` — 달력/목록 전환. `role="radiogroup"`
- `src/views/schedule/ui/schedule.mock.ts`의 `SCHEDULE_DEADLINE_BATCHES` — 시안과 같은 구성(마감 2개 + 지난 묶음)

고친 것

- `src/app/globals.css` — 토큰 8개와 `--raw-*` 8개 추가, `body` 배경을 `--color-canvas`로
- `src/shared/ui/calendar.tsx` — 배지 제거, 상태 색 교체, `classNames`로 캡션·요일 헤더·그리드 직접 지정
- `src/views/schedule/model/schedule-cell-state.ts` — 상태 파생을 `toScheduleEntryState`로 뽑아 달력과 목록이 같은 규칙을 쓰게
- `src/features/application/hooks/useApplicationBatch.ts` — `selectMany` 추가. `toggle` 반복으로는 "모두 선택"을 만들 수 없다. 테스트 2개
- `src/app/preview/page.dev.tsx` — 일정 시나리오에 목록 3종 추가
- `HomeView` · `PayView` · `NotificationsView` · `MoreView` · `notification-row` · `ApplicationChangeBar` — 카드화

검증은 `pnpm typecheck` 통과, `pnpm lint` 통과, `pnpm vitest run` 243파일 1588개 전부 통과다.

시안은 저장소 밖 임시 산출물이라 주소로 남긴다. 확정 뒤에는 `/preview`가 정본이 되므로 시안은 버린다.

- 홈 카드 언어 5안: `https://claude.ai/code/artifact/476d2459-ffa2-4811-ae6f-1bc2c1f5106e`
- 일정 화면: `https://claude.ai/code/artifact/4a241921-c5c5-4dfd-855a-4e315dc33b44`
