# P0-T47 RADIO 개발 설계

- 상태: Approved
- revision: 4
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-17

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 4 | 2026-08-17 | `.gitignore`를 변경 허용 경로에 더한다. 커밋 직전에 `.claude/skills/publish-ui/`가 `.gitignore`의 `.claude/skills/*` 규칙에 걸려 저장소에 들어가지 않는다는 것이 드러났다. revision 1이 이 경로를 허용 경로에 넣고 `CLAUDE.md`가 이 파일을 규칙 정본으로 링크하므로, 예외 한 줄이 없으면 봉인된 설계가 성립하지 않는다. `coach`·`decision`·`explain`·`loop-mode`·`verify`가 이미 같은 방식으로 예외 처리돼 있어 새 관례를 만드는 것도 아니다. 용도는 `!.claude/skills/publish-ui/` 한 줄 추가에 한정한다. 2026-08-17 사용자 결정. |
| 3 | 2026-08-17 | 두 가지를 연다. 첫째, FOUNDATIONS 간격 표에 반 칸 `space-0.5`(2px)·`space-1.5`(6px)·`space-2.5`(10px)를 더한다. 린트를 켜자 19군데가 걸렸는데 전부 배지·칩·행 내부의 밀집 간격이었다 — `gap-1.5` 6곳, `gap-2.5` 3곳, `gap-0.5` 3곳 등. 이 값들은 Tailwind 기본 스케일에 있어 지금까지 아무 저항 없이 쓰였고, 실제로 4px 리듬으로 대체하면 배지 내부가 눈에 띄게 벌어진다. 값을 고쳐 리듬을 지키는 길도 있었으나 그건 이 task의 비목표인 "값이 옳은지의 판정"에 들어간다. 표에 올리되 「밀집한 내부 요소에만」이라는 사용 조건을 함께 적어 구획 간격으로 새어 나가지 않게 막는다. 둘째, `pb-[env(safe-area-inset-bottom,0px)]`이 임의값으로 걸렸다. FOUNDATIONS 「간격과 레이아웃」이 "하단 고정 행동은 `env(safe-area-inset-bottom)`을 포함한다"고 이미 규정하므로 문서가 승인한 패턴을 문서 파생 린트가 막는 자기모순이다. `env(`를 담은 임의값은 판정 대상에서 뺀다 — 픽셀 상수를 우회하는 구멍이 아니다. revision 2의 범위 ⓪과 FOUNDATIONS 용도 한정이 `space-0` 한 행에 묶여 있어 함께 연다. 2026-08-17 사용자 결정. |
| 2 | 2026-08-17 | FOUNDATIONS 간격 표에 `space-0` = `0px`를 더한다. revision 1의 불변 규칙은 "간격은 문서에 적힌 값만 쓴다"인데 표에 `0`이 없고, `gap-0`·`p-0`·`py-0`이 `shared/ui`의 세 파일과 `views/schedule/ui/DeadlineBatchList.tsx`에 실사용 중이라 규칙을 그대로 적용하면 `pnpm verify`가 통과하지 못한다. RED 작성 중 `unit-test-writer`가 발견해 반환했다. `0`을 린트의 예외 목록에 넣는 길도 있었으나, 예외를 두면 "표에 있는 값만"이라는 규칙이 한 번 깨지고 다음 예외를 막을 근거가 사라진다. 표에 넣어 규칙이 예외 없이 성립하게 한다. revision 1의 용도 한정이 FOUNDATIONS를 "하단 고정 요소 여백 절 추가에 한정"했으므로 그 문구도 함께 연다. 2026-08-17 사용자 결정. |
| 1 | 2026-08-17 | 최초 작성. 설계 인터뷰 확정 14건 — 시안 HTML은 Tailwind를 실제로 빌드해 CSS를 인라인하고 글꼴은 base64로 심고, 3안은 모바일 프레임 가로 배치, WORKFLOW에는 2단계 안의 하위 절로 넣고, 시안 커밋은 기존 인터뷰 산출물 규칙을 따르고, 개발 단계 구현은 `publisher` 서브 에이전트가 맡고, 빌드는 harness 정식 명령으로 두고, 시안 파일은 덮어쓰되 라운드 기록은 문서로 남기고, 토큰 정본은 FOUNDATIONS이며 `gate:tokens`가 다섯 표 전부를 대조하고, 간격은 `--spacing-*`로 `globals.css`에 명시하고 문서 밖 값은 린트로 막되 하단 고정 요소 여백은 목적 토큰 둘로 정당화하고, 온보딩의 근거 없는 144px는 같은 성격 화면과 같은 `p-6`로 맞추고, `test_mode`는 실행 코드가 생겨 `tdd`로 바꾼다. 2026-08-17 사용자 결정. |

- 관련 spec: DOCS:SDD, ADR:0013(프로젝트 레이어 구조)
- 적용 깊이: 일반 — 파이프라인 계약과 하네스 도구다. 권한·개인정보·금액·출퇴근 원본·DB·외부 서비스가 없다. `src/**`는 토큰 추가와 클래스 문자열 치환만 받으며 렌더가 바뀌는 곳은 온보딩 한 줄뿐이다.
- test mode: tdd
- 예정 check IDs: publish-ui-skill-contract, design-stage-doc-consistency, token-parity-color, token-parity-scale, design-build-inline-css, spacing-scale-lint, nav-safe-token-swap

## 기획 승인 이후의 정정

기획 승인 시점의 `test_mode`는 `docs_only`였다. 설계 인터뷰에서 `gate:tokens`와 시안 빌드 스크립트라는 실행 코드가 확정되어 `tdd`로 바꾼다. 승인 범위를 넓히는 것이 아니라 이미 승인된 "규칙을 세운다"를 실행 가능한 형태로 확정한 결과다. 2026-08-17 사용자 결정.

## Requirements

### 범위와 비목표

- 범위: ⓪ FOUNDATIONS 간격 표에 `space-0`(0px)과 반 칸 `space-0.5`(2px)·`space-1.5`(6px)·`space-2.5`(10px) 추가, 그리고 반 칸의 사용 조건 한 줄 ① `WORKFLOW.md` 2단계에 「디자인 확정」 하위 절 신설과 디스패치 순서 개정 ② `/publish-ui` 스킬 문서 작성 — 규칙 정본 ③ `publisher` 서브 에이전트 문서 작성 — 스킬을 읽고 따른다 ④ 시안 HTML에 CSS와 글꼴을 인라인하는 harness 명령 ⑤ `gate:tokens` 신설과 `gate:all`·pre-commit 편입 ⑥ `unit-test-writer`·`implementer` 에이전트 문서에 분업 반영 ⑦ `CLAUDE.md`·`DESIGN.md`에 정본 관계 반영 ⑧ `globals.css`에 간격 토큰 명시와 하단 고정 요소 여백 토큰 둘 신설 ⑨ 문서 밖 간격값을 막는 `project/spacing-scale` 린트 규칙 ⑩ 기존 하단 여백 클래스의 기계 치환과 온보딩 여백 정리.

- 설계 비목표: 실제 화면 디자인과 전역 틀 확정 — P0-T48 소유다. 승인 게이트 신설 — 디자인은 설계 게이트에 흡수한다. Figma 연동. 기존 토큰 값 변경 — 게이트는 현재 값이 일치하는지만 본다. `views/**/model/**`의 소유 이전. **하단 여백 값이 화면마다 옳은지의 판정** — `pb-24`는 `(tabs)` 밖 관리자 화면과 `my-profile`에도 관행처럼 복사돼 있어 근거가 화면마다 다르다. 이 task는 값에 이름을 줄 뿐이고 값이 옳은지는 P0-T48이 재퍼블리싱하며 판정한다. 이름을 주는 것과 값을 판정하는 것은 다른 일이다.

### 불변 규칙

- **승인 게이트는 두 곳뿐이다.** 디자인 확정은 RADIO 승인 안에 들어간다. `approval_contract`는 `dual-approval-v3` 그대로이고 `index.schema.json`에 승인 필드를 더하지 않는다.
- **토큰의 정본은 `docs/product/design/FOUNDATIONS.md`다.** `globals.css`가 문서를 따른다. 불일치가 발견되면 문서를 코드에 맞추는 것이 아니라 코드를 문서에 맞춘다. `DESIGN.md`의 「변경 규칙」 첫 줄과 같은 방향이다.
- **`/publish-ui`가 규칙 정본이다.** `publisher` 에이전트 문서는 허용 경로·토큰 승인·시안 보관·preview 원칙을 복제하지 않고 스킬을 가리킨다.
- **preview는 목 데이터 전용이다.** 실데이터·서버 호출·인증을 붙이지 않는다.
- **이미 쓰이는 토큰의 값 변경은 멈추고 묻는다.** 새 토큰 추가는 자유다.
- **시안 HTML은 자립해야 한다.** 외부 CSS·CDN·폰트·이미지를 참조하지 않는다. Artifact가 그것들을 차단한다.
- **간격은 문서에 적힌 값만 쓴다.** 문서 밖 숫자를 쓰려면 값이 아니라 이름과 근거를 먼저 문서에 만든다. 근거 없는 값에 이름을 주지 않는다 — 그러면 규칙이 거짓말이 된다.
- **린트는 문서가 이미 승인한 패턴을 막지 않는다.** 문서에서 파생된 규칙이 문서와 충돌하면 규칙이 틀린 것이다. `env(safe-area-inset-bottom)`이 그 경우다.
- **기계 치환은 값을 바꾸지 않는다.** `pb-24` → `pb-nav-safe`는 둘 다 96px라 화면이 그대로다. 이 task에서 화면 모양이 바뀌는 곳은 온보딩 한 줄뿐이다.
- `DEV-CODE-07` — 새로 쓰는 하네스 코드에도 설명 주석을 넣지 않는다.

### 기술 인수 조건

1. `WORKFLOW.md` 2단계에 「디자인 확정」 절이 있고, 디자인을 거치는 판정 시점(설계 인터뷰에서 변경 경로 초안에 `views/**/ui`가 들어오는 순간)이 적힌다.
2. `WORKFLOW.md`의 「테스트 작성과 구현의 분리」가 새 디스패치 순서를 적는다 — `unit-test-writer`(컴포넌트 RED) → `publisher`(GREEN·UI 커밋) → 남은 writer → `implementer`.
3. `.claude/skills/publish-ui/SKILL.md`가 허용 경로, 금지 경로, 토큰 변경 승인, 시안 보관, preview 목 데이터 원칙, 시안 제안 방식을 담는다.
4. `.claude/agents/publisher.md`가 개발 단계 구현 절차와 커밋 규칙을 담고 규칙 정본으로 스킬을 가리킨다.
5. `pnpm design:build <입력.html>`이 그 파일이 쓴 Tailwind 클래스만 뽑은 CSS를 `<style>`로 인라인하고, `WantedSansVariable.woff2`를 base64 `data:` URI로 `@font-face`에 심은 산출물을 낸다. 산출물에 외부 참조가 없다.
6. `pnpm gate:tokens`가 FOUNDATIONS의 다섯 표와 `globals.css`를 대조하고, 어긋나면 어느 토큰이 문서 몇 줄과 코드 몇 줄에서 다른지 적어 exit 1로 끝난다. 일치하면 아무것도 출력하지 않고 exit 0이다.
7. `gate:tokens`가 `gate:all`과 pre-commit에 들어간다.
8. `pnpm harness:self-test`에 `gate:tokens`와 `design:build`의 회귀가 있다.
9. `globals.css`의 `@theme`에 문서 간격 표의 열세 값이 `--spacing-0`~`--spacing-12`로 명시된다. 반 칸은 Tailwind가 `.` 을 이스케이프해 읽으므로 `--spacing-0\.5` 형태로 적는다. 하단 고정 요소 여백 토큰 `--spacing-nav-safe`(96px)·`--spacing-nav-action-safe`(112px)가 있다.
10. `project/spacing-scale` 린트 규칙이 `p`·`m`·`gap`·`space` 계열 유틸리티에서 문서 밖 숫자를 막고(`0`과 반 칸은 표에 있으므로 허용이며 규칙에 숫자 예외 목록을 두지 않는다), `eslint.config.mjs`에 `error`로 켜진다. 크기 계열(`h`·`w`·`size`)은 대상이 아니다 — `h-11`(44px 터치 타깃)은 간격 리듬이 아니다. 임의값은 막되 `env(`를 담은 것은 대상이 아니다 — FOUNDATIONS가 이미 규정한 패턴이다.
11. 기존 `pb-24`·`pb-28`이 `pb-nav-safe`·`pb-nav-action-safe`로 바뀌고 렌더 결과가 그대로다. `OnboardingView`의 `pb-36`은 제거돼 `p-6`만 남는다.
12. `pnpm verify`가 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1~4 문서·에이전트 계약 | 테스트함 — `gate:docs`가 링크·제목·`spec_refs`를 판정 | 해당 없음 — 사람이 읽는 계약이라 실패 분기가 없다 | 해당 없음 — 값이 아니라 문장이다 | 해당 없음 — 실행 권한이 없는 문서다 | 해당 없음 — 멱등한 파일 쓰기 | 해당 없음 — 사람이 한 번에 하나씩 고치는 문서다 |
| 5 design:build 산출물 | 테스트함 — 최소 HTML의 클래스 규칙이 `<style>`에 들어감 | 테스트함 — 입력 부재·비 `.html` 확장자에서 exit 1 | 테스트함 — 프레임 3개여도 `@font-face`는 하나 | 해당 없음 — 로컬 파일 변환이다 | 테스트함 — 같은 입력 재실행이 같은 산출물 | 해당 없음 — 단일 프로세스가 파일 하나를 읽고 하나를 쓴다 |
| 6~8 gate:tokens | 테스트함 — 일치 fixture에서 무출력·exit 0 | 테스트함 — 어긋난 fixture에서 문서·코드 두 위치와 값을 보고 | 테스트함 — **표를 지운 fixture에서 통과하지 않음**, `var(--raw-*)` 미해결 참조를 위반으로 보고 | 해당 없음 — 파일 두 개를 읽을 뿐이다 | 테스트함 — 반복 실행이 같은 결과 | 해당 없음 — 읽기 전용 판정이라 공유 상태가 없다 |
| 9 간격 토큰 명시 | 테스트함 — `globals.test.ts`가 열 값과 하단 여백 토큰 둘의 존재·값을 단언 | 테스트함 — 값이 문서와 다르면 `gate:tokens` 위반 | 테스트함 — 명시 안 한 숫자(`p-7`)는 동적 계산이 계속 받아줌을 확인 | 해당 없음 — CSS 선언에 실행 권한이 없다 | 해당 없음 — 선언은 멱등 | 해당 없음 — 빌드 시점에 한 번 평가된다 |
| 10 spacing-scale 린트 | 테스트함 — 문서 값 사용이 통과 | 테스트함 — 문서 밖 숫자에서 error, `0`과 반 칸은 표에 있어 통과 | 테스트함 — 크기 계열(`h-11`·`size-11`)은 대상 아님, 임의값(`pb-[92px]`)과 목적 토큰(`pb-nav-safe`) 판정, `env()` 임의값은 통과 | 해당 없음 — 정적 분석이다 | 해당 없음 — 순수 판정 | 해당 없음 — ESLint가 파일마다 독립 판정한다 |
| 11 하단 여백 치환 | 테스트함 — 치환 전후 렌더 결과 동일 | 테스트함 — 치환 누락 파일이 남으면 린트가 잡음 | 테스트함 — `OnboardingView`만 `p-6`으로 바뀌는 유일한 렌더 변화 | 해당 없음 — 표시 계층 | 해당 없음 — 문자열 치환은 멱등 | 해당 없음 — 렌더 결과에 공유 상태가 없다 |
| 12 verify | 테스트함 — `pnpm verify` 전체 통과 | 테스트함 — 새 게이트가 `gate:all`과 pre-commit 양쪽에서 도는지 확인 | 해당 없음 — 통과 여부의 이진 판정 | 해당 없음 — CI 실행 권한은 기존 그대로다 | 해당 없음 — 재실행이 같은 결과 | 해당 없음 — 게이트가 순차로 돈다 |

- **핵심 위험은 게이트의 거짓 통과다.** 파서가 표를 못 읽고 빈 목록을 얻으면 "비교할 것이 없어 통과"가 된다. self-test는 일치 사례뿐 아니라 **표를 일부러 어긋나게 만든 fixture**에서 위반이 잡히는지, **표를 지운 fixture**에서 파서가 조용히 통과하지 않는지를 함께 단언한다.
- 표 다섯 개는 열 구성이 서로 다르다. 원시 팔레트는 `토큰|값|용도`, 의미 토큰은 `역할|전경|배경|테두리`, 타이포는 `스타일|크기/행간|굵기|사용`, 간격은 `토큰|값`, 형태는 `토큰|값|사용`이다. 표마다 파서를 나누고 각 파서에 fixture를 붙인다.
- **간격 토큰을 신설해 대조를 1:1로 만든다.** 지금 `globals.css`에는 간격 변수가 없고 Tailwind 기본값 `--spacing: 0.25rem`이 `p-4`=16px를 동적 계산할 뿐이다. 문서 표의 열 값을 `--spacing-0`~`--spacing-12`로 명시하면 `p-4` 같은 기존 클래스가 그대로 그 토큰을 읽는다 — Tailwind의 spacing 네임스페이스에 들어가기 때문이다. 값이 같아 기존 화면 364군데를 하나도 안 고쳐도 렌더가 변하지 않는다. 명시하지 않은 숫자(`p-7` 등)는 동적 계산이 계속 받아주므로 토큰만으로는 막히지 않고, 그래서 린트 규칙이 따로 필요하다.
- **하단 고정 요소 여백은 간격 리듬이 아니다.** 탭 바(`min-h-16`, 64px)와 그 위에 뜨는 `ApplicationChangeBar`(`bottom-[calc(4.75rem+safe-area)]`)를 피하려는 값이라 4px 리듬 표와 다른 개념이다. 목적 토큰 둘로 이름을 주고 FOUNDATIONS에 근거를 적는다. 근거가 확인된 값은 이 둘뿐이라 세 번째는 만들지 않는다.
- **타이포는 변수가 아니라 `@utility typo-*` 블록이다.** `font-size`·`line-height`·`font-weight` 세 선언을 블록에서 뽑아 문서의 `크기/행간`·`굵기`와 맞춘다.
- **의미 토큰 표의 한 행이 코드의 토큰 셋에 대응한다.** `action` 행의 전경·배경·테두리가 `--color-action`·`--color-action-surface`·`--color-action-border`다. 이 매핑을 게이트가 명시적으로 갖는다.
- `globals.css`의 색 토큰 상당수가 `var(--raw-*)` 참조다. 게이트는 참조를 한 단계 풀어 최종 hex로 비교한다. 풀리지 않는 참조는 위반으로 보고한다 — 조용히 건너뛰면 거짓 통과가 된다.
- 보충 위험: **`design:build`가 Tailwind를 실제로 돌린다.** `@tailwindcss/cli`가 없고 `@tailwindcss/postcss`만 있으므로 postcss를 코드에서 호출한다. 빌드가 깨지면 시안을 못 만든다. self-test는 최소 HTML 하나를 넣어 산출물에 그 클래스의 규칙이 들어 있고 외부 참조가 없음을 단언한다.

### DEV-* 적용 상태

- `DEV-SSOT-01`: 추가 결정 — 토큰의 정본을 FOUNDATIONS로 명시하고 `gate:tokens`로 강제한다. 지금은 같은 사실이 문서와 코드 두 곳에 있고 강제가 없다.
- `DEV-TOKEN-01`: 기본 적용 — 시안 HTML도 의미 토큰만 쓴다. 원시 hex를 시안에 직접 적지 않는다.
- `DEV-TEST-01`: 기본 적용 — tdd, RED→GREEN 증거를 `runs/P0-T47`에 남긴다.
- `DEV-CODE-07`: 기본 적용 — 설명 주석 금지.
- `DEV-DEP-01`: 추가 결정 — 새 의존성을 넣지 않는다. 시안 빌드는 이미 있는 `@tailwindcss/postcss`와 `postcss`를 코드에서 호출한다.
- `DEV-ARCH`: 해당 없음 — `src/**`의 계층과 의존 방향이 바뀌지 않는다. 파일이 새로 생기거나 옮겨 가지 않는다.
- `DEV-SEC`·`DEV-DATA`·`DEV-TIME`·`DEV-CACHE`·`DEV-OFFLINE`: 해당 없음 — 서버 경계·데이터 스키마·시간 계산·캐시·오프라인이 없다.

## Architecture

하네스 코드는 기존 관례를 그대로 따른다 — 판정 로직은 `harness/lib/`, 실행 진입점은 `harness/gates/`, 회귀는 `harness/self-test/`.

- `harness/lib/token-parity.ts`: FOUNDATIONS의 다섯 표와 `globals.css`를 읽어 불일치 목록을 내는 순수 함수. 표별 파서 다섯 개와 의미 토큰 매핑표를 갖는다. 파일을 읽는 경로만 인자로 받아 fixture로 테스트된다.
- `harness/gates/tokens.ts`: `runTokenParityGate`를 호출하고 `reportViolations`로 끝내는 다섯 줄짜리 진입점. `gate:index`·`gate:radio`와 같은 모양이다.
- `harness/lib/gate-suite.ts`: `REPOSITORY_GATES`와 `COMMIT_GATES` **두 배열 모두**에 더한다. 이 파일은 배열을 따로 두어 `gate:all`(전자)과 pre-commit(후자)이 서로 다른 목록을 읽는다. 한쪽만 더하면 `pnpm verify`는 잡는데 커밋은 통과하거나 그 반대가 된다.
- `harness/design/build.ts`: 시안 HTML 경로를 받아 CSS를 인라인한 산출물을 쓰는 진입점. `@tailwindcss/postcss`를 코드에서 호출하고 입력 HTML을 스캔 대상으로 준다.
- `harness/self-test/token-parity.test.ts`: 일치·불일치·표 누락 세 fixture. 표를 지운 fixture에서 위반이 나오는지가 거짓 통과를 막는 자리다.
- `harness/self-test/design-build.test.ts`: 최소 HTML로 산출물에 규칙이 들어가고 외부 참조가 없음을 단언한다.
- `harness/self-test/fixtures/token-parity/`: 위 세 fixture의 FOUNDATIONS 발췌와 `globals.css` 발췌.
- `.claude/skills/publish-ui/SKILL.md`: 규칙 정본. 허용·금지 경로, 토큰 변경 승인 절차, 시안 제안 방식과 배치, 시안 보관과 라운드 기록, preview 목 데이터 원칙, Artifact 발행 절차.
- `.claude/agents/publisher.md`: 개발 단계 worker. 봉인된 시안을 React로 옮기는 절차, 컴포넌트 테스트 GREEN, UI 커밋, `[질문]` 반환 경로. 규칙은 스킬을 가리킨다.
- `.claude/agents/unit-test-writer.md`: 컴포넌트 테스트를 맡는다는 것과 그 RED가 `publisher`의 GREEN 앞에 온다는 순서를 더한다.
- `.claude/agents/implementer.md`: `publisher`가 세운 UI 프롭에 배선한다는 것과 UI 파일을 임의로 고치지 않는다는 것을 더한다.
- `docs/workflow/WORKFLOW.md`: 2단계에 「디자인 확정」 절, 「테스트 작성과 구현의 분리」에 새 디스패치 순서.
- `docs/workflow/TOOLING.md`: `gate:tokens`와 `pnpm design:build`를 명령 목록에 더한다.
- `src/app/globals.css`: `@theme`에 `--spacing-0`~`--spacing-12` 열세 개(반 칸 셋 포함)와 `--spacing-nav-safe`·`--spacing-nav-action-safe` 둘을 더한다. 기존 토큰과 `@utility` 블록은 건드리지 않는다.
- `tools/eslint-plugin-project/rules/spacing-scale.mjs`: `p`·`m`·`gap`·`space` 계열 유틸리티의 숫자 부분이 허용 목록에 있는지 보는 규칙. 허용 목록의 정본은 `config/fsd.json`이 아니라 이 규칙 옆의 상수이며, FOUNDATIONS와의 일치는 `gate:tokens`가 본다. `tools/eslint-plugin-project/index.mjs`에 등록하고 `eslint.config.mjs`에서 `error`로 켠다.
- `src/views/**` 15개 파일: `pb-24` → `pb-nav-safe`, `pb-28` → `pb-nav-action-safe` 기계 치환. `OnboardingView`만 `pb-36`을 지워 `p-6`으로 남긴다. 대상은 `admin-positions`·`admin-schedule`·`admin`(4)·`catalog`·`home`·`more`·`my-profile`·`notification-settings`·`notifications`·`onboarding`·`pay`·`schedule`.
- `docs/product/design/FOUNDATIONS.md`: 「간격과 레이아웃」에 하단 고정 요소 여백 절을 더한다 — 토큰 둘, 각 값, 무엇을 피하려는 여백인지. 간격 표에는 `space-0`과 반 칸 셋을 행으로 더하고 반 칸의 사용 조건을 적는다. 기존 행의 값은 그대로 둔다.
- `docs/product/DESIGN.md`: 「변경 규칙」에 토큰 정본이 FOUNDATIONS이고 `gate:tokens`가 강제한다는 것을 적는다.
- `CLAUDE.md`: 명령 목록과 문서 지도에 위 둘을 반영한다. 승인 게이트 조항은 그대로 둔다.
- `package.json`: `gate:tokens`, `design:build` 스크립트 추가와 `verify`에 `gate:tokens` 편입(`gate:all`을 통해 자동으로 들어오므로 `verify` 문자열은 바뀌지 않는다).

## Data model

- 해당 없음 — DB 스키마·마이그레이션·RLS 변경이 없다.

## Interface

- `pnpm design:build <입력.html> [--out <출력.html>]`. 출력 경로를 안 주면 입력과 같은 디렉터리에 `<이름>.inlined.html`을 쓴다. 입력이 없거나 확장자가 `.html`이 아니면 exit 1.
- `runTokenParityGate(root: string): Violation[]` — 기존 게이트와 같은 서명. 위반 메시지는 `FOUNDATIONS.md:<줄> / globals.css:<줄>` 두 위치와 기대값·실제값을 담는다.
- `pnpm gate:tokens` — 통과 시 무출력·exit 0, 위반 시 목록과 exit 1. 기존 게이트 관례 그대로다.
- 시안 산출물의 계약: `<style>` 하나에 CSS 전부와 `@font-face` 하나, 외부 `<link>`·`<script src>`·원격 이미지 없음, 모바일 프레임 3개 가로 배치, 각 프레임 상단에 안 이름과 한 줄 설명.
- 간격 토큰 이름은 Tailwind의 spacing 네임스페이스를 따라 `--spacing-N`이고, 문서 표의 이름은 `space-N`이다. 게이트가 이 한 글자 차이의 매핑을 명시적으로 갖는다.
- `/publish-ui` 호출 계약: 대상 화면과 라운드 의도를 받아 시안을 만들고 `docs/execution/runs/<task-id>/design/`에 쓴 뒤 Artifact로 발행한다. 파일은 덮어쓰고 라운드마다 무엇이 왜 바뀌었는지는 같은 디렉터리의 `NOTES.md`에 누적한다.

## Optimizations

- 게이트는 파일 두 개를 읽고 문자열을 비교할 뿐이라 pre-commit에 붙는 비용이 사실상 없다.
- `design:build`는 입력 HTML만 스캔 대상으로 주므로 산출물이 프로젝트 전체 CSS가 아니라 그 시안이 쓴 규칙만 담는다. 시안 한 장이 수백 KB로 붓지 않는다.
- 시안 파일을 덮어쓰므로 `runs/`가 라운드마다 불어나지 않는다. 되돌아볼 근거는 `NOTES.md`의 라운드 기록이 갖는다.
- 되돌림: `gate-suite.ts`에서 한 줄 빼면 게이트가 파이프라인에서 빠지고, 스킬·에이전트 문서를 지우면 절차가 사라진다. `src/**`와 DB에 흔적이 없어 되돌림 비용이 낮다.

## 변경 허용 경로

```
harness/lib/**
harness/gates/**
harness/design/**
harness/self-test/**
tools/eslint-plugin-project/**
eslint.config.mjs
package.json
.gitignore
src/app/globals.css
src/app/__tests__/**
src/views/**/ui/*.tsx
.claude/skills/publish-ui/**
.claude/agents/publisher.md
.claude/agents/unit-test-writer.md
.claude/agents/implementer.md
CLAUDE.md
docs/workflow/WORKFLOW.md
docs/workflow/TOOLING.md
docs/product/DESIGN.md
docs/product/design/FOUNDATIONS.md
docs/execution/radio/P0-T47-radio.md
docs/execution/runs/P0-T47/**
docs/execution/phases/00-foundation.md
docs/execution/phases/index.jsonl
```

- 용도 한정: `harness/lib/**`는 `token-parity.ts` 신설과 `gate-suite.ts`의 배열 한 줄 추가에만 쓴다 — 기존 게이트의 판정 로직을 고치지 않는다. `package.json`은 스크립트 두 줄 추가에 한정하고 의존성을 더하지 않는다. `.gitignore`는 `!.claude/skills/publish-ui/` 한 줄 추가에만 쓰고 다른 무시 규칙을 건드리지 않는다. `.githooks/**`는 허용 경로에 없다 — 훅은 `harness/gates/pre-commit.ts`를 부르고 그 진입점이 `COMMIT_GATES`를 읽으므로 편입이 `gate-suite.ts` 안에서 끝난다. `.claude/agents/unit-test-writer.md`와 `implementer.md`는 분업 순서를 적는 데만 쓰고 기존 계약(RED 무수정, `[질문]` 반환, 커밋 규칙)을 바꾸지 않는다. `docs/product/DESIGN.md`는 「변경 규칙」에 정본 관계를 적는 데 한정하고 토큰 값·원칙·화면 범위를 바꾸지 않는다. `docs/product/design/FOUNDATIONS.md`는 하단 고정 요소 여백 절 추가와 간격 표에 `space-0`·반 칸 셋을 행으로 더하고 반 칸의 사용 조건 한 줄을 적는 데 한정하고, 기존 표의 **값을 바꾸지 않는다** — 행 추가와 값 변경은 다르다. `CLAUDE.md`는 명령 목록과 문서 지도 반영에 한정하며 「Non-negotiable rules」의 승인 게이트 조항은 건드리지 않는다. `docs/execution/phases/00-foundation.md`는 P0-T47 절의 `test_mode` 정정과 범위 추가에 한정한다.

- `src/**`의 용도 한정이 특히 좁다. `src/app/globals.css`는 **토큰 추가에만** 쓰고 기존 토큰 값·`@utility` 블록·reduced-motion 블록을 건드리지 않는다. `src/views/**/ui/*.tsx`는 **하단 여백 클래스 문자열 치환에만** 쓴다 — 마크업 구조·프롭·조건·문구·다른 클래스를 바꾸지 않는다. `OnboardingView`의 `pb-36` 제거가 이 task에서 렌더가 바뀌는 유일한 지점이다. `src/app/__tests__/**`는 새 토큰이 존재하고 값이 문서와 같은지 단언하는 데 쓴다.

## 미결 사항

- 글꼴 base64가 시안 한 장을 약 1.6MB로 만든다(원본 1.2MB). Artifact 상한 16MB 안이라 문제없지만, 한 페이지에 프레임을 여럿 두어도 `@font-face`는 하나만 두도록 빌드가 보장해야 한다. 서브셋으로 100KB 아래로 줄이는 길은 `fonttools` 같은 새 의존성이 필요해 택하지 않았다 — 필요해지면 후속 제안이다.
- `pb-24`가 `(tabs)` 밖 관리자 화면과 `my-profile`에도 쓰인다. 탭 바가 안 붙는 화면에 96px가 옳은지는 이 task가 판정하지 않는다. P0-T48이 재퍼블리싱하며 화면별로 본다.
- `--spacing-nav-safe`의 96px는 탭 바 64px + 여유 32px라는 현재 값의 사후 설명이다. 실제 안전 여백을 `calc(var(--spacing-16) + env(safe-area-inset-bottom))` 같은 식으로 유도할지는 P0-T48에서 판단한다. 지금 바꾸면 렌더가 달라져 기계 치환이 아니게 된다.
