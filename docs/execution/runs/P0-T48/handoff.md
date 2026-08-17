# P0-T48 handoff

## 2026-08-17 · 설계 진행 중 (디자인 라운드 5까지)

- 작업 식별자: P0-T48 (전역 디자인 틀 재제안과 기존 화면 퍼블리싱)
- 현재 단계: 2단계 설계 — 디자인 확정 진행 중. RADIO 미작성, 개발 승인 없음
- 기준 시각: 2026-08-17
- 기준 커밋: `8a0c84e`

### 확정된 사실

- `index.jsonl`의 P0-T48이 `proposed` → `design_pending`으로 바뀌고 `product_approval`(user, 2026-08-16)이
  기록됐다. 승인 자체는 `00-foundation.md:1027`에 산문으로 있던 것을 정본으로 옮긴 것이고 새 승인이 아니다.
- **디자인 규칙의 정본은 [`design/NOTES.md`](design/NOTES.md)다.** 라운드마다 확정된 규칙이 누적되고,
  뒤집힌 결정은 근거와 함께 남는다. 시안 `design/proposal.html`은 라운드마다 덮어쓴다.
- 라운드 1~5로 시각 언어·타이포 위계·아이콘·앱 셸·금액 가림이 확정됐다. 세부는 NOTES가 소유한다.
- 시안 발행 주소: `https://claude.ai/code/artifact/2d3506c2-1e3b-46c9-b1a5-9c257990b879`
  (같은 파일 경로로 다시 발행하면 이 주소가 갱신된다)
- `design:build` 산출물 `*.inlined.html`은 `.gitignore`에 넣었다. 글꼴을 심어 1.7MB이고 원본에서
  언제든 다시 만들 수 있다.

### 설계 인터뷰에서 정해진 범위

- 다시 퍼블리싱할 화면은 **살아있는 30개 전부**다. preview에 등록된 7종 말고 나머지 23개는 등록까지 한다.
- **달력/목록 뷰 전환**을 이 task가 흡수한다. PRD·WORKER-FLOWS·PATTERNS 문서와 e2e가 함께 움직인다.
- 일정 화면은 **항상 달력으로 시작**한다. 마지막 본 뷰를 기억하지 않아 저장소가 필요 없다.
- 지난 마감은 목록 맨 아래 「지나갔어요」 묶음으로 남긴다.
- **번들 상한 500KB → 600KB.** 근거는 `harness/lib/bundle-budget.ts`의 `BUNDLE_BUDGET_BYTES`와
  ADR-0015 결정 3, `00-foundation.md`에 함께 적는다.
- 「화면 설정」 화면을 신설하고 금액 가리기 스위치를 둔다. 저장은 기기(localStorage)까지가 이 task다.

### 미결 사항

- **task를 가를지** — 결정 주체: 사용자, 반환할 단계: 기획. 기획 승인 때의 목표는 "틀 확정과 재퍼블리싱",
  비목표는 "화면 동작·로직 변경"이었는데 지금 기능이 셋(뷰 전환·금액 가림·화면 설정) 들어와 있다.
  RADIO 쓰기 직전에 한 task로 갈지 둘로 가를지 정한다.
- `display` 32/40 단계를 FOUNDATIONS 표에서 뺄지 — 라운드 2 결과로 쓰는 자리가 없어졌다.
- 탭 선택 모션 420ms가 `FOUNDATIONS.md:137`의 대역 밖이다. 행을 더할지 대역을 넓힐지.

### 다음 행동

1. 홈 화면 라운드. 정할 것 셋 — 카드 우선순위(지금은 출근 인증 → 마감 임박 → 확정 변경 → 다음 근무 중
   하나만 뜬다), 빈 상태, 급여가 탭으로 올라갔으니 홈의 예상 급여 카드를 남길지.
2. 나머지 화면을 한 라운드에 하나씩.
3. 라운드가 끝나면 RADIO를 쓰고 봉인해 개발 승인을 받는다.

### 참고 — 이 task로 넘어온 것

- `wip/design-overhaul-p0-t48` 브랜치(구 `stash@{0}`, 36파일)에 8월 16일 세션의 구현이 있다.
  **참고만 하고 코드는 새로 옮긴다**(2026-08-17 사용자 결정). base는 `f135549`이므로
  `git diff f135549 wip/design-overhaul-p0-t48 -- src/`로 본다.
- `wip/design-overhaul-older-snapshot`(구 `stash@{1}`)은 위 브랜치에 전부 흡수됐다. 지워도 된다.

### 증거·산출물 경로

- `docs/execution/runs/P0-T48/design/NOTES.md` (디자인 규칙 정본)
- `docs/execution/runs/P0-T48/design/proposal.html` (시안, 라운드마다 덮어씀)
- `docs/execution/runs/interviews/2026-08-16-design-system-overhaul.md` (8월 16일 세션 기록)
- `docs/execution/phases/00-foundation.md` P0-T48 절
