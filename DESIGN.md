# Design System — 라비에벨 Ops

## Product Context
- **What this is:** 단일 웨딩홀 예도팀 운영을 위한 모바일 우선 PWA. 공고 생성, 신청, 배정, 대타 승인, 체크인, 예상 급여 확인까지 한 흐름으로 다룬다.
- **Who it's for:** 라비에벨 예도팀의 어드민, 팀장, 팀원.
- **Space/industry:** 웨딩홀 현장 운영, hospitality staffing, deskless workforce ops.
- **Project type:** 내부 운영용 제품. 감성 랜딩 페이지가 아니라 실제로 매일 켜는 앱이다.

## Aesthetic Direction
- **Direction:** Soft Productive Clarity
- **Decoration level:** restrained
- **Mood:** 색감과 버튼/입력 감도는 [토스 채용](https://toss.im/career/jobs)처럼 밝고 정돈되게 간다. 대신 화면 구조는 [무신사 메인](https://www.musinsa.com/main/musinsa/recommend?gf=A)처럼 `웹 페이지`보다 `태블릿 앱 셸`에 가깝게 잡는다. 즉 넓게 퍼진 브라우저 레이아웃이 아니라, 고정 폭 캔버스 안에서 섹션이 안정적으로 쌓이는 앱 뷰가 기준이다.
- **Reference sites:** https://toss.im/career/jobs , https://www.musinsa.com/main/musinsa/recommend?gf=A , https://ui.shadcn.com/

## Status
- **Current status:** v0 디자인 방향 확정본. 구현 가이드로는 사용하지만 픽셀 단위 최종 시안은 아니다.
- **What is locked:** 색 공기, 타이포 톤, shadcn 컴포넌트 감도, 앱 셸 중심 정보 구조, 운영 앱다운 화면 위계.
- **What is still flexible:** 실제 섹션 수, 카드 배치, 화면별 우선순위, 카피 디테일, 상태 배지 구성.
- **Logo:** 미정. 지금은 텍스트 워드마크나 임시 마크로 진행한다.
- **Preview scope:** 현재 메인 프리뷰는 `공통 메인 대시보드` 기준이다. 어드민 콘솔은 별도 화면 군으로 본다.

## Core Rule
- **토스에서 가져올 것:** 컬러 공기, 여백 감도, 버튼과 입력 필드의 부드러운 표면감, 명확한 타이포 위계.
- **토스에서 가져오지 않을 것:** 랜딩 페이지형 히어로 구조, 채용 공고 리스트 중심 IA, 기사 카드형 사이드 칼럼, 마케팅 페이지 같은 흐름.
- **무신사에서 가져올 것:** 태블릿 앱처럼 느껴지는 고정 폭 셸, 상단 앱 크롬, 탭 스트립, 섹션이 선반처럼 차분히 이어지는 구조.
- **무신사에서 가져오지 않을 것:** 커머스 배너 과밀도, 상품 카드 대량 배열, 검은색 위주의 브랜드 톤 전체 복제.

## Design Principles
- 첫 화면은 `브랜드 소개`가 아니라 `오늘 운영 현황`을 먼저 보여준다.
- 시각 언어는 밝고 부드럽지만, 정보 구조는 빠르게 스캔되는 운영 대시보드여야 한다.
- 큰 제목은 쓰되 랜딩 페이지처럼 과장하지 않는다. 상단 배너는 한 문단 소개가 아니라 오늘 상태 요약과 액션을 담는다.
- 레이아웃은 반응형 웹 페이지보다 `태블릿 앱 프레임`처럼 보여야 한다. 넓은 브라우저 캔버스에 퍼지지 않고, 중앙의 고정 폭 앱 영역 안에서 모든 것이 정리돼야 한다.
- 화면은 떠 있는 카드 모음보다 붙어 있는 앱 패널처럼 보여야 한다. 바깥 상하 여백과 과한 border-radius는 쓰지 않는다.
- 카드, 리스트, 테이블을 섞되 모두 같은 블루 톤 공기 안에서 통일한다.
- 블루는 브랜드 포인트와 상태 강조에만 쓴다. 화면 전체를 파란색으로 덮지 않는다.
- `오늘 예식`, `내 근무`, `미체크인`, `공지`처럼 모두가 봐야 하는 일 단위 상태가 홈 중심이어야 한다.
- shadcn UI 기본 구조를 유지하고 토큰, 대비, 간격으로 느낌을 만든다.

## Typography
- **Display:** `Pretendard` 800
- **Heading:** `Pretendard` 700
- **Body:** `Pretendard` 400/500
- **UI/Labels:** `Pretendard` 500/600
- **Data:** `Pretendard` + `font-variant-numeric: tabular-nums`
- **Code:** `IBM Plex Mono`
- **Loading:** 실제 구현은 `next/font/local` 또는 정적 Pretendard 폰트를 사용한다. Variable은 쓰지 않는다.
- **Scale:**
  - Display XL: 40/48
  - Display L: 32/40
  - Heading L: 26/34
  - Heading M: 20/28
  - Heading S: 18/26
  - Body L: 16/26
  - Body M: 14/22
  - Label: 13/18
  - Meta: 12/16

## Color
- **Approach:** bright-neutral with calm blue accents
- **Primary:** `#2B7FFF`
- **Primary hover:** `#1D6EF2`
- **Secondary:** `#191F28`
- **Accent:** `#EAF4FF`
- **Accent strong:** `#D8EBFF`
- **Neutrals:**
  - `#FFFFFF` canvas
  - `#FCFDFE` surface
  - `#F6F9FC` surface-soft
  - `#ECF2F8` surface-tint
  - `#E5EAF0` border-soft
  - `#D6DEE8` border-strong
  - `#8B95A1` text-muted
  - `#4E5968` text-subtle
  - `#191F28` text-strong
- **Semantic:**
  - success `#16A34A`
  - warning `#D97706`
  - error `#DC2626`
  - info `#2B7FFF`
- **Dark mode:** 나중 단계. 첫 버전 디자인 기준은 라이트 모드 고정으로 잡는다.

## Spacing
- **Base unit:** 8px
- **Density:** spacious but operational
- **Scale:** 2xs(4) xs(8) sm(12) md(16) lg(24) xl(32) 2xl(40) 3xl(56) 4xl(72)

## Layout
- **Approach:** tablet-first app shell
- **Grid:**
  - mobile: 4 columns
  - tablet: 8 columns
  - desktop: 12 columns
- **Preferred app canvas:** 1024px ~ 1180px
- **Max content width:** 1180px
- **Tablet shell:** 어두운 상단 앱 크롬 + 검색/빠른 진입 바 + 탭 스트립 + 밝은 본문 캔버스.
- **Desktop shell:** 데스크톱에서도 브라우저 전체를 다 쓰지 않고, 태블릿 앱 캔버스를 가운데에 둔다. 다만 바깥에 떠 있는 카드처럼 보이게 하지 않는다.
- **Shared dashboard:** 로그인 후 모든 역할이 먼저 보는 공통 홈. 오늘 예식, 내 근무 또는 내 상태, 팀 공지, 빠른 진입 액션이 같이 보인다.
- **Role-specific pages:** 팀장 운영 화면, 팀원 체크인/급여 화면은 공통 홈에서 진입하는 세부 작업 화면으로 둔다.
- **Admin console:** 운영 홈과 분리된 별도 콘솔. 승인 대기, 팀원 관리, 포지션 관리, 급여 규칙, 템플릿 관리처럼 낮은 빈도지만 권한이 강한 작업을 다룬다.
- **Mobile shell:** 상단 앱 바, 핵심 배너, 요약 카드 세로 스택, 카드형 작업 목록. 하단 탭 또는 핵심 CTA 허용.
- **Forbidden layout patterns:**
  - 채용 사이트형 초대형 히어로 + 검색바 메인 구조
  - 기사 카드가 우측에 길게 늘어선 미디어 레이아웃
  - 콘텐츠보다 브랜딩이 앞서는 랜딩 페이지 구조
  - 승인/설정/조직 관리 같은 어드민 기능을 팀장 일일 운영 홈에 섞는 구조
  - 초광폭 데스크톱 웹처럼 좌우로 길게 퍼지는 구조

## Motion
- **Approach:** minimal-functional
- **Easing:** enter `cubic-bezier(0.2, 0.8, 0.2, 1)`, exit `cubic-bezier(0.4, 0, 1, 1)`
- **Duration:** micro(80ms) short(160ms) medium(220ms)
- **Usage:** 버튼 hover, 카드 hover, 탭 전환, badge 상태 변화 정도만 사용한다.

## Component Rules
- **Top app bar:** 무신사처럼 앱 크롬 역할을 하는 어두운 상단 바를 둔다. 다만 내부 카드와 본문은 밝게 유지한다.
- **Search / quick bar:** 상단 크롬 아래에 밝은 검색 또는 빠른 진입 바를 둔다. 검색창이라기보다 앱 내 이동 허브에 가깝다.
- **Top tabs:** 상단 탭 스트립은 앱 섹션 전환용이다. 웹 페이지 메뉴보다 태블릿 앱 탭 바에 가까워야 한다.
- **Status banner:** 랜딩 페이지 hero가 아니라 `오늘 대시보드 배너`다. 오늘 예식 수, 공통 상태, 공지, 역할별 주요 CTA를 함께 둔다.
- **Buttons:** shadcn `Button` 기준. primary는 파란 단색, secondary는 흰색 배경 + 회청 border, ghost는 텍스트 강조만. 모서리는 둥글게 말고 플랫한 직사각형에 가깝게 간다.
- **Inputs:** shadcn `Input`, `Select` 기준. 배경은 pure white, border는 연한 청회색, focus ring은 `#2B7FFF`.
- **Tabs/filters:** pill 느낌보다 평평한 탭 바와 직사각형 필터에 가깝게 간다.
- **Cards:** 그림자보다 border와 표면 대비로 구분한다. 흰 카드 안에 블루 tint strip이나 soft badge로만 포인트를 준다. 모서리는 거의 주지 않는다.
- **Event rows:** 포스터형 카드가 아니라 운영 보드 row여야 한다. 예식 시간, 포지션 충원 상태, 대타 상태를 한 줄 또는 두 줄 안에서 읽을 수 있어야 한다.
- **Badges:** `대타 승인`, `교육`, `미체크인`, `출근 완료` 같은 운영 상태를 색과 텍스트로 짧게 표시한다.
- **Onboarding gate:** 경고창처럼 만들지 말고 체크리스트 카드처럼 보여준다.

## Screen Notes
- **공통 메인 대시보드:** 모두가 봐야 하는 `오늘 예식`, `내 근무/내 상태`, `공지`, `빠른 액션`을 먼저 보여준다. 역할에 따라 강조 카드만 다르게 노출한다.
- **팀장 작업 화면:** 공고 생성, 포지션 배정, 대타 승인, 체크인 예외 처리 같은 고빈도 운영 작업을 다룬다.
- **팀원 작업 화면:** 위치 체크인, 예상 급여, 신청/취소, 내 확정 상태를 다룬다.
- **대타 승인 화면:** 후보 리스트와 행사 맥락이 같이 보여야 한다. 누가 어떤 포지션으로 신청했는지 바로 비교 가능해야 한다.
- **급여 화면:** 숫자는 또렷하되 회계 제품처럼 차갑지 않게. 예상 급여와 계산 규칙 요약을 함께 둔다.
- **어드민 콘솔:** 시각 톤은 같게 유지하되 운영 홈보다 더 단정하고 유틸리티 중심이어야 한다. 승인 대기 사용자, 팀 기본 설정, 포지션 자격, 템플릿, 급여 규칙이 핵심이다.
- **어드민 콘솔 홈 섹션:** `승인 대기`, `팀원-포지션 자격`, `예식 템플릿`, `급여 규칙` 네 덩어리가 기본 뼈대다.
- **어드민 콘솔 밀도:** 카드보다 테이블과 폼 비중이 높아도 된다. 대신 여백과 색 공기는 운영 앱과 같은 계열을 유지하고, 운영 홈과 같은 sharp-edge 리듬을 유지한다.

## Copy Tone
- 짧고 단정하게 쓴다.
- 운영 문구는 감탄사 없이 즉시 이해되게 쓴다.
- 예시:
  - `대타 승인 대기 2건`
  - `교육 인원 1명 필요`
  - `위치 확인 후 체크인`
  - `예상 급여 103,500원`

## shadcn Tokens
- **Radius:** `--radius: 0rem`
- **Background:** `#FFFFFF`
- **Foreground:** `#191F28`
- **Card:** `#FFFFFF`
- **Card foreground:** `#191F28`
- **Popover:** `#FFFFFF`
- **Popover foreground:** `#191F28`
- **Primary:** `#2B7FFF`
- **Primary foreground:** `#F8FBFF`
- **Secondary:** `#F6F9FC`
- **Secondary foreground:** `#191F28`
- **Muted:** `#F6F9FC`
- **Muted foreground:** `#8B95A1`
- **Accent:** `#EAF4FF`
- **Accent foreground:** `#1D4ED8`
- **Border:** `#E5EAF0`
- **Input:** `#E5EAF0`
- **Ring:** `#2B7FFF`

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-08 | `Pretendard` 단일 폰트 채택 | shadcn UI와 실제 구현 감도를 가장 안정적으로 맞추기 위해 |
| 2026-04-08 | 토스 채용의 시각 언어만 참고 | 색감, 버튼, 여백은 좋지만 레이아웃까지 가져오면 운영 앱 정체성이 약해지기 때문 |
| 2026-04-08 | 앱 셸 중심 IA 고정 | 이 제품은 채용 페이지가 아니라 매일 쓰는 운영 도구이기 때문 |
| 2026-04-08 | 밝은 화이트/블루/뉴트럴 팔레트 채택 | 전체 공기를 덜 회색으로 만들면서도 상태 구분을 선명하게 유지하기 위해 |
| 2026-04-08 | 태블릿 앱 뷰 기준 채택 | 컨텐츠 양이 많지 않고, 넓은 웹보다 고정 폭 앱 셸이 제품 성격에 더 잘 맞기 때문 |
| 2026-04-08 | 상하 외곽 여백과 라운드 최소화 | 떠 있는 웹 카드보다 붙어 있는 운영 앱 패널처럼 보여야 하기 때문 |
