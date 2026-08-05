# P0-T34 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-04
- 개발 설계 승인: user, 2026-08-06 (revision 2 재승인)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. 설계 인터뷰 확정: shadcn 유지(파일명 예외 구역 유지), 세부 의존 vaul·sonner·react-day-picker 채택, 원시 색 lint 룰 신설, OfflineBanner 교체 편입, 폰트 저장소 커밋, 카탈로그 pageExtensions 제외. |
| 2 | 2026-08-06 | 구현 착수 전 worker가 발견한 봉인 결함을 반영해 재승인했다(사용자 결정). 기본 팔레트 비활성화와 신설 lint가 변경 허용 경로 밖 기존 파일 5개(`app/loading.tsx`, `views/status` 3종, `views/bootstrap`)를 깨뜨린다 — revision 1이 기존 화면의 기본 팔레트 사용을 전수 확인하지 않은 조정자 누락. 5개 파일의 의미 토큰 치환을 범위에 편입하고 허용 경로에 추가했다. 치환 매핑은 Data model 표가 소유하며, 팔레트에 대응 원시값이 없는 `text-gray-500`(문의 번호 메타데이터)은 `text-muted`로 근사한다(사용자 결정). |

- 관련 spec: DOCS:SDD, ADR:0001
- 적용 깊이: 일반 (UI 토큰·컴포넌트·개발 도구. DB·권한·비밀값·캐시 경로 없음)
- test mode: tdd (index 등록 그대로)
- 예정 check IDs: design-token-test, component-test, typecheck (index 등록 그대로)

## Requirements

### 범위와 비목표

- 범위: ① [FOUNDATIONS](../../product/design/FOUNDATIONS.md)의 토큰(원시 팔레트·의미 토큰 7역할·타이포 8종·radius 5종·그림자·모션·접근성 규칙)을 `globals.css`의 Tailwind v4 `@theme`와 CSS 변수로 구현 ② `Wanted Sans Variable` 직접 호스팅 ③ [COMPONENTS](../../product/design/COMPONENTS.md)의 공용 컴포넌트 10종을 `src/shared/ui`에 구현(shadcn 기반, 명세 우선) ④ 개발 전용 카탈로그 화면(프로덕션 번들 제외) ⑤ 원시 색 직접 참조를 차단하는 lint 룰 신설(사용자 결정) ⑥ `widgets/offline/OfflineBanner`를 신규 Connectivity banner 소비로 교체(사용자 결정) ⑦ 기존 화면 5개의 기본 팔레트 유틸을 의미 토큰으로 치환(revision 2).
- 비목표(기획 승인 그대로): 관리자 전용 컴포넌트 3종(Assignment roster·Staffing summary·Worker picker), 화면 조립, 데이터 연결, 서버 호출, 다크 모드.
- 설계 비목표: 완전 삭제형 dialog(대상 이름 입력 일치)는 관리자 화면 라운드가 소유한다(미결에 기록). 앱 아이콘·알림 아이콘 자산 제작은 이 task가 다루지 않는다.

### 불변 규칙

- 명세와 구현이 어긋나면 명세가 이긴다. 명세에 없는 값이 필요하면 임의로 정하지 않고 ask로 반환한다. 명세가 범위(예: 모션 120~160ms)를 주면 범위 안 단일 값을 Data model 표대로 고정한다.
- 원시 팔레트 hex는 `globals.css`의 정의 지점 한 곳에만 존재한다. 화면·컴포넌트 코드는 의미 토큰 유틸만 쓴다.
- 컴포넌트는 업무 의미(권한·유효성·서버 상태)를 결정하지 않는다 — 상태는 props로 받고 표현만 한다(COMPONENTS 원칙).
- 프로덕션 빌드 산출물에 카탈로그 라우트가 존재하지 않는다.
- 폰트를 포함해 런타임에 외부 CDN을 의존하지 않는다.
- shadcn으로 복사된 코드도 저장소 게이트 전부(주석 금지·alias import·`__tests__/` 배치·no-console)를 따른다.

### 기술 인수 조건

- `globals.css`가 Tailwind 기본 색 팔레트를 비활성화(`--color-*: initial`)하고 의미 토큰만 색 유틸로 노출한다. 원시 팔레트 14색은 `@theme` 밖 CSS 변수(`--raw-*`)로만 존재하며 의미 토큰 정의에서만 참조된다.
- `design-token-test`가 `globals.css`의 의미 토큰·타이포·radius·그림자 값을 FOUNDATIONS 표의 값과 대조 단언한다.
- 컴포넌트 10종이 `src/shared/ui`에 존재하고 명세가 정의한 상태를 표현하며, 종마다 `component-test`가 렌더·상태 전환·접근성 속성(role, aria, 접근 가능한 이름)을 단언한다.
- 신설 룰 `project/design-token-colors`가 `src/` 안 임의 색상값(`[#…]`·`rgb`·`hsl`·`oklch`)과 Tailwind 기본 팔레트 색 유틸(`-white`/`-black` 포함)을 차단하고, rule 테스트가 검출과 오탐 대조를 단언한다. 기존 `OfflineBanner`의 hex 하드코딩이 이 룰의 RED 사례였다가 교체로 GREEN이 된다.
- 기존 화면 5개(`app/loading.tsx`·`views/status` 3종·`views/bootstrap`)의 기본 팔레트 유틸이 Data model의 치환 매핑대로 의미 토큰으로 바뀌어 저장소 전체 lint 위반 0이 성립한다. (revision 2)
- `WantedSansVariable.woff2`가 라이선스 사본과 함께 저장소에 커밋되고 `next/font/local`로 로드되며, 명세의 대체 체인이 선언된다.
- dev 서버의 `/catalog`가 10종과 각 상태를 렌더하고, production 빌드의 라우트 산출물에 `/catalog`가 없다(handoff에 재현 기록).
- 터치 타깃 최소 44px, 색상 단독 상태 전달 금지(아이콘·라벨 병기), `prefers-reduced-motion` 전역 규칙이 적용되고 테스트 또는 CSS 단언으로 확인된다.
- `pnpm verify` 전체 통과.

### 위험 기반 테스트

| 위험 | 검증 |
| --- | --- |
| 토큰 값 오전사(FOUNDATIONS와 다른 hex·크기) | `design-token-test`가 문서 표 값과 문자열 대조 |
| 원시 색 우회(임의 색상값·기본 팔레트 유틸) | rule 테스트의 검출 fixture + 저장소 전체 lint 위반 0 |
| 접근성 속성 누락(이름 없는 아이콘 버튼, 달력 셀 읽기) | `component-test`가 role·aria·접근 가능한 이름을 컴포넌트마다 단언 |
| reduced motion 미적용 | `design-token-test`가 전역 미디어 규칙 존재를 단언 |
| 카탈로그가 프로덕션에 새어 들어감 | production 빌드 후 라우트 산출물 목록 재현을 handoff에 기록 |
| shadcn 복사 코드의 게이트 위반(주석·상대경로 import) | 기존 lint 룰이 pre-commit·CI에서 차단, worker가 수정 후 커밋 |
| 폰트 로드 실패 시 빈 화면 | 대체 체인 선언 + `display: swap` 동작을 handoff에 재현 기록 |

### DEV-* 적용 상태

- `DEV-NAME-05`: `src/shared/ui/**`는 shadcn 관리 구역으로 파일명 예외(kebab-case 유지, 사용자 결정). export 이름은 PascalCase를 유지한다.
- `DEV-NAME-06`·`DEV-TEST-06`·`DEV-CODE-07`: shadcn 복사 코드에도 그대로 적용된다(`components.json` alias를 `@/shared/*`로 맞춰 생성 시점부터 준수).
- `DEV-ARCH-02`: ui 세그먼트는 server module·`**/api/**`를 import하지 않는다(`config/fsd.json` 기존 계약).
- 신설: `DEV-TOKEN-01` `MUST` — 화면 코드는 원시 색을 직접 참조하지 않고 `@theme` 의미 토큰만 쓴다. 기계 강제: `project/design-token-colors`. DEVELOPMENT.md에 "디자인 토큰" 절을 신설해 소유시킨다.

## Architecture

- `src/app/globals.css`: ① `@theme` — 기본 색 팔레트 비활성화 후 의미 토큰, 타이포 크기·행간, radius 5종, 그림자(`--shadow-floating`), 모션 duration 3종, 폰트 체인 ② `:root` — 원시 팔레트 `--raw-*` 14색 ③ `@utility typo-*` 8종(크기·행간·굵기 결합 — 화면이 셋을 따로 조합하다 어긋나는 것을 방지) ④ `prefers-reduced-motion` 전역 규칙(이동·확대 제거, opacity 대체).
- 폰트: `src/shared/config/fonts.config.ts`가 `next/font/local`로 `WantedSansVariable.woff2`(같은 디렉터리 `fonts/`에 커밋, OFL 라이선스 사본 동반)를 선언하고 `--font-wanted-sans` CSS 변수로 노출, `src/app/layout.tsx`가 소비한다. 조달 출처는 wanteddev/wanted-sans 공식 release이며 버전을 handoff에 기록한다.
- `components.json`(신규): shadcn CLI 설정. aliases를 `@/shared/ui`·`@/shared/lib/cn` 규약으로 고정해 생성 코드가 처음부터 우리 경로 규칙을 따르게 한다.
- `src/shared/lib/cn.ts`(신규): `clsx` + `tailwind-merge` 조합 유틸. lib 세그먼트라 단위 테스트 필수(tdd).
- `src/shared/ui/` 컴포넌트 10종 — 파일은 kebab-case, 한 종이 복수 파일일 수 있다:

| 종 | 파일 | 기반 |
| --- | --- | --- |
| Button | `button.tsx` | shadcn(radix Slot) + cva variants: primary 56/16 · secondary 48/14 · tertiary 44 · destructive · icon 44 원형. loading은 라벨 유지 + 진행 표시 |
| Input과 선택 필드 | `input.tsx` · `select-field.tsx` | shadcn input 개조(52px·radius 14·neutral 배경, 라벨 위·오류 아래 aria 연결). select-field는 bottom-sheet를 열어 선택 |
| Bottom sheet | `bottom-sheet.tsx` | vaul. 상단 radius 20, 행 최소 52px, 본문만 스크롤 |
| Dialog | `dialog.tsx` | radix dialog. 기본 포커스는 비위험 버튼, destructive 변형 |
| Snackbar | `snackbar.tsx` | sonner 래퍼. 하단 내비·safe-area 위 배치, action(Undo) 1개, live region |
| Badge와 chip | `badge.tsx` · `chip.tsx` | badge 읽기 전용 pill, chip 선택·필터(role 구분) |
| Calendar | `calendar.tsx` | react-day-picker. 일요일 시작 고정, 셀 44px, 상태 6종(모집 없음·신청 가능·로컬 선택·신청·마감·확정)을 커스텀 셀로 렌더, 셀 접근 이름은 날짜+상태 한 문장 |
| Schedule row | `schedule-row.tsx` | 직접 구현. 날짜·요일·예정 출퇴근·포지션·상태, 행 전체 탭 |
| Notification row | `notification-row.tsx` | 직접 구현. 읽지 않음 = action 점 + 강한 제목 병행 |
| Connectivity banner | `connectivity-banner.tsx` | 직접 구현. 상단 고정 안내 + 복구 피드백 문구 |

- `src/widgets/offline/ui/OfflineBanner.tsx`: 온라인 상태 판단(hook)은 유지하고 표현을 `connectivity-banner` 소비로 교체 — hex 하드코딩 제거.
- 카탈로그: `src/views/catalog/ui/CatalogView.tsx`(10종·전 상태 나열) + `src/app/catalog/page.dev.tsx`(얇은 어댑터). `next.config.ts`의 `pageExtensions`를 개발 모드에서만 `dev.tsx`를 포함하도록 분기 — production 빌드에서는 라우트 자체가 생성되지 않는다(Next 공식 제외 기법). `config/fsd.json`의 `appLayer.exemptFiles`에 `page.dev.tsx`를 추가한다(Next 예약 파일명 변형).
- lint: `tools/eslint-plugin-project/rules/design-token-colors.mjs`(신규) + rule 테스트 + plugin index·`eslint.config.mjs` 등록. `globals.css`는 ESLint 대상 밖이라 원시 팔레트 정의 지점이 자연히 면제된다.
- 의존성 추가(전부 dependencies): 컴포넌트별 radix 패키지(shadcn 경유), `vaul`, `sonner`, `react-day-picker`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- `docs/standards/DEVELOPMENT.md`: "디자인 토큰" 절과 `DEV-TOKEN-01` 신설.

## Data model

의미 토큰 명명(FOUNDATIONS 표 → `@theme` `--color-*`). 역할 7종은 전경/배경/테두리 3열을 `<역할>`·`<역할>-surface`·`<역할>-border`로 전개한다:

| 역할 | 전경 | 배경 | 테두리 |
| --- | --- | --- | --- |
| `action` | `--color-action` | `--color-action-surface` | `--color-action-border` |
| `action-pressed` · `success` · `warning` · `danger` · `neutral` · `disabled` | 같은 규칙 | 같은 규칙 | 같은 규칙 |

원시 팔레트의 나머지 사용처는 텍스트·표면 토큰으로 흡수한다:

| 토큰 | 원시 값 | 용도 |
| --- | --- | --- |
| `--color-text-strong` | ink-950 `#0a0b0d` | 가장 강한 텍스트 |
| `--color-text` | gray-700 `#5b616e` | 보조 텍스트 |
| `--color-text-muted` | gray-600 `#7c828a` | muted(큰 텍스트·보조 장식 한정) |
| `--color-text-weak` | gray-400 `#a8acb3` | 약한 정보 |
| `--color-surface` | white `#ffffff` | 기본 배경 |
| `--color-surface-weak` | gray-100 `#f7f7f7` | 입력·약한 표면 |
| `--color-surface-strong` | gray-200 `#eef0f3` | 강한 중립 표면 |
| `--color-border` | gray-300 `#dee1e6` | 테두리·구분선 |
| `--color-on-action` | white `#ffffff` | action 배경 위 텍스트 |

`blue-200`(`#a8b8cc`)은 소비하는 의미 토큰이 없어 `--raw-*` 정의만 유지한다. 타이포 유틸은 `typo-display`(32/40·700)부터 `typo-caption`(13/18·400)까지 FOUNDATIONS 표 8행을 그대로 옮긴다. 모션 duration은 명세 범위의 중앙값으로 고정한다: `--duration-feedback: 150ms`, `--duration-value: 200ms`, `--duration-overlay: 250ms`.

기존 화면의 기본 팔레트 유틸 치환 매핑(revision 2). 기본 팔레트 비활성화 이전에 만들어진 파일 5개에 적용한다:

| 기존 유틸 | 의미 토큰 | 근거 |
| --- | --- | --- |
| `bg-gray-200` | `surface-strong` | 스켈레톤 표면(강한 중립 표면) |
| `text-gray-700` | `text` | 본문 텍스트 |
| `text-gray-600` | `text-muted` | 보조 텍스트 |
| `text-gray-500` | `text-muted` | 문의 번호 메타데이터 — 대응 원시값이 없어 근사(사용자 결정) |
| `text-blue-600` | `action` | 낮은 우선순위 텍스트 행동(링크) |

## Interface

- 컴포넌트 export는 PascalCase(`Button`, `BottomSheet`, `ConnectivityBanner` …)이고 업무 상태는 전부 props로 받는다. 도메인 타입을 import하지 않는다(entities 의존 금지 — 셀·행 내용은 프리미티브 props와 children으로 수신).
- Snackbar는 `snackbar.tsx`가 노출하는 호출 함수와 Provider 한 쌍이다. 화면은 sonner를 직접 import하지 않는다(교체 가능 경계 유지).
- Calendar 셀 상태는 `"none" | "open" | "selected" | "requested" | "closed" | "confirmed"` 6값 유니언 props로 받는다 — 값 의미는 COMPONENTS 상태 표와 1:1.
- `project/design-token-colors` 위반 메시지는 위반 클래스와 대체 지침(의미 토큰 사용)을 담는다. 기존 룰의 `resolveLocation` 관행을 따른다.

## Optimizations

- 신규 런타임 의존 합계는 약 50~60KB(min+gzip)로 React 본체 수준이다. lucide는 import한 아이콘만 번들된다.
- 폰트는 variable 1파일만 preload한다. 정적 웨이트 파일을 추가로 싣지 않는다(FOUNDATIONS 규칙).
- 카탈로그는 production 라우트에서 제외되어 번들 영향 0이다.

## 변경 허용 경로

```
src/app/globals.css
src/app/layout.tsx
src/app/loading.tsx
src/app/catalog/**
src/app/__tests__/**
src/views/catalog/**
src/views/status/**
src/views/bootstrap/**
src/widgets/offline/**
src/shared/ui/**
src/shared/lib/**
src/shared/config/**
tools/eslint-plugin-project/**
eslint.config.mjs
eslint.config.ci.mjs
config/fsd.json
next.config.ts
components.json
package.json
pnpm-lock.yaml
docs/standards/DEVELOPMENT.md
docs/execution/radio/P0-T34-radio.md
docs/execution/runs/P0-T34/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 완전 삭제형 dialog(대상 이름 입력 일치로 최종 버튼 활성화)는 관리자 화면 퍼블리싱 라운드가 소유한다 — 결정 주체: 해당 task 기획, 반환할 단계: 관리자 라운드.
- 앱 아이콘·단색 알림 아이콘 실제 자산은 별도 제작 대상(DESIGN.md) — 결정 주체: 사용자, 반환할 단계: PWA 자산이 필요한 task.
- Tailwind 기본 팔레트 비활성화로 이후 화면 task가 기본 색 유틸을 못 쓴다. 새 의미가 필요하면 FOUNDATIONS에 의미 토큰을 먼저 추가하는 것이 정본 절차다(FOUNDATIONS 변경 규칙) — 결정 주체: 사용자, 반환할 단계: 해당 화면 task 설계.
