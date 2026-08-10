# P0-T43 handoff

## 2026-08-10 · 개발 종료

- 작업 식별자: P0-T43
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-10

### 확정된 사실

- 착수 시점의 RADIO revision 2(SHA-256 `9cc65ba2a21ad2babf972f0213fbe91d330559589d9aac66ebe6ab00e21d6146`)를 `index.jsonl`의 `development_approval`과 대조해 봉인을 확인했다. 의존 task `P0-T34`·`P0-T35`는 `done`, 저장소 전체 `in_progress`는 0건이었다.
- 개발 중 확인한 사실 2건으로 RADIO를 revision 3(SHA-256 `7d7b3a6021e26f779cc26dfaf149f123d61f32a309465d1bb0ae0460e8278ef2`)으로 재봉인했다(2026-08-10 사용자 결정) — 번들 상한 380KB→420KB, 화면 전환을 P0-T45로 분리. `gate:scope`가 결정 반영에 필요한 문서 3개를 막아 변경 허용 경로도 함께 넓혔다. revision 3의 기술 인수 조건 7건을 모두 완료했다. 각 항목의 구현 내용과 근거는 `docs/execution/runs/P0-T43/radio.md`에 있다.
- 모션 토큰 5종을 `globals.css` `@theme`에 추가하고, reduced-motion에서 시간 계열 토큰만 `0ms`로 덮는다. spring 상수 2종은 시간이 아니라 덮지 않으며 테스트가 이를 단언한다.
- `vaul`과 `sonner`의 전이 시간을 `!important` 없이 명시도만 높여 토큰에 맞췄다. `!important`를 피한 이유는 두 라이브러리가 드래그 중 인라인 스타일에 의존하기 때문이다.
- lint 규칙 `project/motion-tokens` 1종을 error로 등록했고, `chip.tsx`의 기존 `duration-[var(--duration-feedback)]` 표기가 통과함을 규칙 테스트와 `pnpm lint`로 확인했다.
- 번들 게이트를 `pnpm gate:bundle`로 만들어 `verify` 체인의 `build` 뒤에 이었다. 판정은 순수 함수이며 상한을 인자로 받는다.
- `pnpm test`(1217건) · `pnpm harness:self-test`(315건) · `pnpm typecheck` · `pnpm lint` · `pnpm build` · e2e 4건 · `pnpm check:docs` · `pnpm gate:all`이 모두 GREEN이다. RED→GREEN 증거는 `docs/execution/runs/P0-T43/tdd.json`에 있다.

### 미결 사항

- 없음. 개발 중 열린 질문 2건은 2026-08-10에 결정을 받아 RADIO revision 3과 P0-T45 신설로 반영했다.

### 다음 행동

1. 4단계 검증 — `check_ids`(motion-token · motion-lint · nav-regression · bundle-budget)와 교차 검증을 수행한다.

### 알아둘 것

- **범위 밖에서 고친 것:** `tests/e2e/global-setup.ts`의 `listUsers()` 페이지네이션 결함. 로컬 Supabase 사용자가 50명을 넘기면 고정 픽스처를 못 찾아 e2e 전체가 죽는다. 검증을 진행할 수 없어 고쳤다. 자세한 내용은 `radio.md`에 있다.
- **도구 사용 주의:** 번들 기준선 비교에 `git stash -u`를 써서 병렬 세션의 P3-T03 문서 4개가 함께 스태시에 들어갔다. `pop` 후 양쪽 변경이 모두 살아 있음을 확인했으나 약 1분간 그 파일들이 디스크에서 사라진 창이 있었다. 다음부터는 별도 워크트리나 임시 클론에서 잰다.

## 2026-08-10 · 검증 종료

- 작업 식별자: P0-T43
- 현재 단계: 검증 종료 → 다음 리팩토링
- 기준 커밋: `0fb5dcf282a708868e453b2a82b62b0e43ad91c2`

### 확정된 사실

- 등록 `check_ids` 4종이 모두 통과했다 — `motion-token`(106건), `motion-lint`(규칙 21건 + `pnpm lint`), `nav-regression`(e2e 4건), `bundle-budget`(401KB / 상한 420KB).
- 교차 검증(`opus`·`codex`)에서 확정 발견 11건이 나왔다. 기각된 발견은 없다. 결과 정본은 `docs/execution/reviews/P0-T43-review.json`이다.
- `high` 2건은 원인이 같다 — Tailwind v4가 `translate`·`scale`을 `transform` 축약이 아니라 CSS 개별 속성으로 컴파일한다는 사실을 개발에서 놓쳤다. 다이얼로그는 keyframes의 `transform`과 합성돼 250ms 동안 위치가 어긋났고, 버튼·칩은 `transition-property`를 정하는 유틸을 겹쳐 써서 색 전이가 죽었다.
- 사용자 결정(2026-08-10)으로 수정 범위를 기본값 `critical`·`high`에서 `medium`까지 넓혔다. `high` 2건과 `medium` 7건을 고쳤고 `low` 2건은 backlog에 남겼다. 수정 내용은 `radio.md`의 「검증 수정 라운드」가 소유한다.
- 수정 후 `pnpm test` 1234건 · `pnpm harness:self-test` 316건 · `pnpm typecheck` · `pnpm lint` · `pnpm build` · `pnpm gate:all` · `pnpm gate:bundle` · e2e 6건이 GREEN이다.

### 미결 사항

- 없음.

### 다음 행동

1. 5단계 리팩토링 후 `done` 전환과 대시보드 재생성.
2. P0-T44는 P0-T43이 세운 토큰 3종과 lint 규칙, 번들 게이트를 전제한다. `motion` 도입분을 더한 상한은 그 시점 실측으로 다시 정한다.
3. P0-T45는 설계 인터뷰가 남아 있다. `<ViewTransition>`이 전환을 시작하지 않는 원인 규명이 첫 안건이다.

### 알아둘 것

- **모션 단언을 문자열 수준으로 두면 안 된다.** 클래스·CSS 원문 단언만으로는 캐스케이드와 속성 합성 결함을 못 잡는다. 확정된 `high` 2건이 1217건 GREEN을 그대로 통과했다. `tests/e2e/motion.spec.ts`가 계산된 스타일과 `getAnimations()`로 보는 층이며, 이 테스트가 수정 전 상태에서 실제로 실패하는 것까지 확인했다.
- **Tailwind v4에서 `translate`·`scale`·`rotate`는 `transform`이 아니라 CSS 개별 속성이다.** `transform`을 쓰는 keyframes와 합성되고, 전이시키려면 `transition-property`에 `scale`을 따로 적어야 한다.
- **`schedules`는 append-only다.** `schedules_reject_delete` 트리거 때문에 e2e 픽스처를 지울 수 없다. 반복 실행은 정리가 아니라 23505 재사용으로 견딘다.
- `e2e-transition-worker` 접두사 사용자 14명이 수정 전 실행의 잔재로 로컬 DB에 남아 있다. 사용자 데이터라 임의로 지우지 않았다.

### 증거·산출물 경로

- 검증 결과: `docs/execution/reviews/P0-T43-review.json`
- 적용 기록: `docs/execution/runs/P0-T43/radio.md`
- TDD 증거: `docs/execution/runs/P0-T43/tdd.json`
- 봉인된 RADIO: `docs/execution/radio/P0-T43-radio.md` revision 3
