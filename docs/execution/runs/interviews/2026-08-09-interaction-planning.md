# 인터랙션 도입 기획 인터뷰 handoff

- 작업 식별자: P0-T43 (인터랙션 기반) · P0-T44 (화면별 인터랙션 효과)
- 현재 단계: 기획 승인 종료 → 다음 설계(RADIO) 인터뷰
- 기준 시각: 2026-08-09

## 확인된 사실 (사용자 답변·요약본 승인)

- **기획 승인(user, 2026-08-09).** 정정본 요약본을 승인 형식으로 확인받았다.
- 모션 성격은 **전면 허용**. `ease-out` 절제가 아니라 spring과 튕김을 쓰고 오버슈트 폭에 상한을 두지 않는다.
- 범위는 전면 — 기반·화면 전환·화면별 효과를 모두 포함한다.
- 햅틱은 넣지 않는다. iOS Safari가 `navigator.vibrate`를 지원하지 않아 기기별로 경험이 갈리는 비용을 감수하지 않는다.
- task는 둘로 나눈다. 기반(P0-T43)이 서고 나서 화면별 효과(P0-T44)가 같은 토큰을 쓴다.
- 실행 순서는 P3-T03보다 앞이다. 나중에 하면 P3에서 만들 배정·확정 화면을 되돌아가 고쳐야 한다.
- reduced-motion은 **구현하되 비중을 낮춘다** — 토큰 계층에서 한 번에 처리하고 검증은 자동 테스트 한 건으로 끝낸다. 승인된 문서 조항(DESIGN.md 접근성 기본값, FOUNDATIONS.md 모션 절)은 그대로 둔다.
- 사용 기기는 비교적 최신이라 저사양 프레임 저하 우려는 접는다. 대신 성능은 **번들 상한선·애니메이션 속성 제한·목록 렌더 시간** 셋으로 지킨다.

## 해석 (요약본에 명시 후 승인으로 함께 확정)

- "토스처럼"은 오버슈트 상한 없음을 뜻하며, 구체적인 stiffness·damping 값은 설계에서 정한다.
- 전면 범위를 고르면서도 분할을 택한 것은 한 번에 다 넣되 검증은 나눠 받겠다는 뜻으로 읽었다.
- 성능 기준 셋을 모두 고른 것은 자동 측정 가능한 방어선을 겹쳐 두겠다는 뜻으로 읽었다.

## 인터뷰 중 바로잡힌 것

- 조정자가 "바텀시트에 transition이 한 줄도 없어 툭 나타난다"고 보고했으나 **부정확**했다. 컴포넌트 파일만 grep한 결과였고, 실제로는 `vaul` 1.1.2가 슬라이드와 드래그를 이미 제공한다. `sonner` 2.0.7의 스낵바도 자체 애니메이션을 갖는다. 실제로 정지 상태인 것은 radix 기반 다이얼로그(`globals.css`에 keyframes 없음), 버튼·칩의 눌림(`transition-colors`만 있음), 스케줄 행, 화면 전환이다. 이 정정으로 기반 task가 "컴포넌트 다섯 개 재작성"에서 "빈 곳 채우기 + 타이밍 조율"로 줄었다.
- 화면 전환에 애니메이션 라이브러리가 필요하다고 전제했으나, Next.js 16 App Router가 React `<ViewTransition>`을 설정 없이 지원한다(`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`). 전환은 번들 증가 없이 브라우저 API로 처리하고, `motion`은 vaul·sonner·ViewTransition 어디에도 없는 동작에만 쓴다.

## 미결 사항 (설계 단계 소유)

- spring 상수의 구체값(stiffness·damping)과 요소별 배분.
- 번들 상한의 구체 숫자. 2026-08-09 기준선은 정적 청크 gzip 합계 367KB, 최대 청크 71.6KB다. Next 16 Turbopack 빌드가 라우트별 First Load JS 표를 찍지 않아 청크 합계를 기준선으로 삼았다.
- `motion` 도입을 ADR로 승격할지 여부. ARCHITECTURE의 스택을 바꾸는 결정이다.
- 화면 전환에서 Safari 동작 차이를 어디까지 맞출지.
- 애니메이션 속성 제한 lint 규칙의 구현 위치와 범위. `tools/eslint-plugin-project/`의 `design-token-colors`(101줄)가 선례다.
- 목록 렌더 시간 기준선의 측정 방식과 허용 폭.

## 정합화 반영

- `docs/product/design/FOUNDATIONS.md` 모션 절: spring·튕김 금지 삭제, spring 정의 방식·토큰 정본·애니메이션 속성 제한 추가. 타이밍 표와 reduced-motion·햅틱 조항은 유지.
- phase 문서 `00-foundation.md`에 P0-T43·P0-T44 절 신설(목표·비목표·인수 조건·주요 경계 사례).
- index: 두 task를 `design_pending`으로 신설하고 `product_approval`(user, 2026-08-09) 기록.
- 결정 대장에는 넣지 않는다. `decision` 스킬의 배치 규칙이 도메인 경계(IDENTITY·SCHEDULING·ATTENDANCE·NOTIFICATIONS·PAY)별 항목만 다루는데, 모션 정책은 어느 경계에도 속하지 않는 디자인 시스템 결정이다. 정본은 FOUNDATIONS.md 모션 절이 소유한다.

## 다음 행동

1. P0-T43 설계(RADIO) 인터뷰 — 모션 토큰 구조, `<ViewTransition>` 적용 지점, `motion` 도입 범위와 ADR 승격 여부, lint 규칙 설계, 번들 측정의 CI 결합을 다룬다.
2. P0-T43이 `planned`가 된 뒤 P0-T44 설계로 넘어간다.
