---
status: approved
---

# 그림자 토큰을 셋으로 늘리고 생성기가 표의 모든 줄을 읽게 한다

시안 열한 개가 바텀시트와 팝오버 그림자를 각자 값으로 들고 있었고, 그 값이 시안끼리 글자까지 같았다. `tokens.md` 5절에 `shadow-card` 한 줄뿐이라 정본에 올릴 자리가 없었던 것이다. 표를 세 줄로 늘렸는데 `scripts/generate-globals-css.mts`가 그림자 표를 `requireOne`으로 읽어 한 줄이 아니면 던진다 — 문서가 테스트 입력이라 표를 늘리는 순간 `pnpm test`가 깨진다. 생성기와 짝 테스트를 같이 고친다.

## 완료 조건

- `tokens.md` 5절 그림자 표가 `shadow-card`·`shadow-pop`·`shadow-sheet` 세 줄이다. 값은 시안이 들고 있던 그대로다 — `shadow-sheet`의 다크 칸은 `none`이 아니라 `0 -1px 0 var(--stroke-neutral)`이다.
- 생성기가 그림자 표의 줄 수를 못박지 않는다. 첫 줄 `shadow-card`는 지금처럼 `--surface-shadow`로 나온다 — 이름을 바꾸면 8.3 다리와 기존 테스트가 같이 움직여야 하고 그럴 이유가 없다. 둘째 줄부터는 `--surface-shadow-<유틸에서 shadow- 뗀 이름>`으로 나온다(`--surface-shadow-pop`, `--surface-shadow-sheet`). 라이트 값은 `:root`에, 다크 값은 `@media (prefers-color-scheme: dark)`와 `[data-theme="dark"]` 양쪽에 선다.
- 값 칸에 `var(--stroke-neutral)`처럼 다른 변수가 들어 있어도 그대로 옮겨 적는다. 생성기가 값을 해석하지 않는다.
- `tokens.md` 8.3 다리에 `--shadow-pop: var(--surface-shadow-pop)`과 `--shadow-sheet: var(--surface-shadow-sheet)` 두 줄이 있고, 생성된 `globals.css`에 그대로 나온다. Tailwind가 `shadow-pop`·`shadow-sheet` 유틸을 만든다.
- `pnpm tokens:css`를 돌린 `src/app/globals.css`가 커밋된다. 기존 `--surface-shadow`와 `--shadow-card` 줄은 글자까지 그대로다.
- `tests/lint/generate-globals-css.test.ts`가 그림자 표 세 줄 픽스처로 `--surface-shadow-pop`·`--surface-shadow-sheet`가 라이트·다크 세 블록에 서는 것과, 한 줄 픽스처에서 둘째 줄 변수가 안 나오는 것을 확인한다. 「리스크 C」의 기존 단언은 고치지 않는다.

## 범위 밖

- `shadow-card`의 변수 이름을 `--surface-shadow-card`로 맞추는 것. 지금 이름이 세 곳(생성기·8.3 다리·테스트)에 박혀 있고 셋을 같이 옮길 값이 없다.
- 스위치 손잡이 그림자. `tokens.md` 「빈자리」에 남겼다 — 실제 화면을 보고 정한다.
- 시안을 새 토큰 이름으로 고치는 것. 시안은 자기 CSS 변수를 쓰고 `globals.css`를 안 읽는다. 시안이 `components.md`와 어긋난 자리는 `sian-auditor`가 따로 잡는다.
