# publishing-first 인터뷰 handoff

## 2026-08-04 · 기획 종료

- 작업 식별자: P0-T34(디자인 시스템 코드 구현), P0-T35(근무자 핵심 화면 퍼블리싱)
- 현재 단계: 기획 종료 → 다음 설계(RADIO)
- 기준 시각: 2026-08-04

### 확정된 사실

- 사용자 결정: 기능 구현보다 **퍼블리싱과 디자인을 먼저** 한다. 화면을 눈으로 확인한 뒤 기능을 붙여 UI 재작업을 줄이는 것이 목적이다.
- 진행 순서는 **기반 전체를 먼저 끝낸 뒤 퍼블리싱**이다. `P0-T01 → T02 → T03 → T04 → T05 → T34 → T35 → P1-T01…` 순서이며, Supabase·CI까지 갖춘 뒤 화면 작업에 들어간다. 이 선택으로 P0-T04(환경변수와 애플리케이션 셸)를 쪼갤 필요가 없어졌다. 앱 셸이 먼저 만들어지고 퍼블리싱이 그 위에 화면을 올린다.
- 퍼블리싱 범위는 **근무자 핵심 흐름 먼저**다. 관리자 화면과 관리자 전용 컴포넌트 3종(Assignment roster, Staffing summary, Worker picker)은 다음 라운드로 미룬다.
- 화면 데이터는 **도메인 타입 기반 목**이다. [Domain](../../../product/DOMAIN.md)의 DTO를 `src/entities/*/model` 타입으로 먼저 정의하고 목 데이터를 그 타입으로만 만든다. 기능 구현 때 목만 실제 조회로 갈아끼우면 화면은 그대로 남는 것이 설계 의도다.
- 디자인은 새로 그리지 않는다. P0-T08이 남긴 [디자인 시스템 명세](../../../product/DESIGN.md) 740줄이 이미 토큰·컴포넌트 13종·화면 흐름을 정의하고 있어, 이번 작업은 그 명세를 코드로 옮기는 것이다.
- **글꼴 교체(사용자 결정)**: `Pretendard Variable` → `Wanted Sans Variable`. [Foundations](../../../product/design/FOUNDATIONS.md)의 타이포그래피 절을 정본으로 수정했다. 자산은 [wanteddev/wanted-sans](https://github.com/wanteddev/wanted-sans)가 SIL Open Font License로 배포하며, 앱에서 직접 호스팅하고 외부 CDN을 런타임에 의존하지 않는다. variable 축 하나로 표의 굵기(400·600·700)를 모두 표현한다. 아직 코드가 없는 시점이라 구현 영향은 없다.
- 실행 순서를 문서가 아니라 계약으로 만들기 위해 **P1-T01(Google OAuth)의 `depends_on`에 P0-T35를 추가**했다. 게이트가 이 순서를 강제하므로 퍼블리싱 전에 기능 구현을 시작할 수 없다.
- P0 phase의 목표와 종료 조건에 화면 기반을 추가했다. 두 task는 제품 승인(user, 2026-08-04)을 받아 `design_pending`이다.

### 미결 사항

- 관리자 화면 퍼블리싱과 남은 근무자 화면(로그인·가입·승인 대기·휴면·근무 변경 요청 제출·전체 메뉴·탈퇴)의 라운드 구성 — 결정 주체: 사용자, 반환할 단계: 기획. P0-T35 완료 후 다시 다룬다.
- 글꼴 자산의 서브셋 범위(한글 전체 vs 동적 서브셋)와 로드 전략(`next/font/local` 사용 여부) — 결정 주체: 없음, 반환할 단계: 설계. P0-T34 RADIO에서 정한다.

### 다음 행동

1. P0-T34의 설계(RADIO) 인터뷰를 진행하고 승인 후 `planned`로 전환한다. P0-T35는 P0-T34에 의존하므로 그 뒤에 설계한다.
2. 다만 두 task 모두 `P0-T05`까지의 기반이 선행이라 실제 실행은 P0-T01부터 시작한다. P0-T01~T05는 아직 `proposed`이므로 기획 인터뷰가 먼저 필요하다.

### 증거·산출물 경로

- `docs/execution/phases/00-foundation.md` (P0-T34·P0-T35 절, phase 목표·종료 조건)
- `docs/execution/phases/index.jsonl` (P0-T34·P0-T35 = `design_pending`, P1-T01 의존성)
- `docs/product/design/FOUNDATIONS.md` (글꼴 정본)
