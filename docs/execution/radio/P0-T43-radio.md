# P0-T43 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-09
- 개발 설계 승인: user, 2026-08-10

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-10 | 최초 작성. 설계 인터뷰 확정 4건 — `motion` 라이브러리는 P0-T44로 이월해 이 task의 새 의존성을 0으로 두고, 번들 상한은 `pnpm verify` 체인에서 막고, 모션 토큰 정본은 색상과 같은 자리인 `globals.css` `@theme`로 하며(FOUNDATIONS 재개정), lint는 애니메이션 속성 제한과 토큰 강제를 규칙 하나로 묶는다. 조사에서 `--duration-*` 토큰 3종이 이미 존재하고 `globals.test.ts`가 그 값을 단언하며 실사용처는 `chip.tsx` 한 곳뿐임을 확인했고, `<ViewTransition>`이 Next 16.3.0 번들 React와 `@types/react` canary 타입으로 experimental 플래그 없이 사용 가능함을 확인했다. |

- 관련 spec: DOCS:SDD(FOUNDATIONS 모션 절·접근성 절), ADR:0001
- 적용 깊이: 일반 — UI와 빌드 도구다. 권한·개인정보·금액·출퇴근·DB·외부 서비스가 없다.
- test mode: tdd
- 예정 check IDs: motion-token(토큰 정의·reduced-motion 덮어쓰기 단언), motion-lint(새 규칙 위반·허용 케이스), transition-e2e(전환 동작·미지원 렌더·reduced-motion), bundle-budget(정적 청크 gzip 상한)

## Requirements

### 범위와 비목표

- 범위: ① `globals.css` 모션 토큰 — 기존 `--duration-feedback`·`--duration-value`·`--duration-overlay` 값 유지, `--ease-out`·`--ease-spring` 추가, reduced-motion에서 토큰 값 자체를 덮어씀 ② 정지 상태 요소 채우기 — `dialog`(진입·이탈), `button`·`chip`·`schedule-row`(눌림 피드백) ③ `vaul` 바텀시트와 `sonner` 스낵바의 타이밍을 토큰에 맞춤 ④ 화면 전환 — React `<ViewTransition>`으로 하단 탭 4개 이동과 스케줄 목록→상세 모프, `tsconfig.json`에 canary 타입 참조 추가 ⑤ lint 규칙 1종 신설 ⑥ 번들 상한 게이트를 verify 체인에 추가 ⑦ 기존 테스트 갱신과 신규 테스트.
- 비목표(기획 그대로): 화면별 효과 4종은 P0-T44 소유(목록 stagger·숫자 롤링·당겨서 새로고침·스와이프). 햅틱. 바텀시트·스낵바 라이브러리 교체.
- 설계 비목표: `motion` 라이브러리 도입과 물리 기반 spring은 P0-T44 소유 — 이 task는 CSS `cubic-bezier` 근사로 처리하고 새 production 의존성을 만들지 않는다. Safari의 View Transitions 동작 차이를 맞추는 작업. 성능 예산 문서 신설(상한값만 이 task가 정한다). 색상·타이포·간격 토큰 변경.

### 불변 규칙

- **모션 값의 정본은 `globals.css` `@theme` 하나다.** 화면·컴포넌트 코드는 토큰을 참조만 하고 시간·easing을 직접 쓰지 않는다. 색상 토큰과 같은 자리·같은 방식이며, 어긋나면 `DEV-SSOT-01` 위반이다.
- **기존 duration 3종의 값은 바꾸지 않는다.** `globals.test.ts`가 150ms·200ms·250ms를 단언하고 FOUNDATIONS 타이밍 표가 그 대역을 소유한다. 이 task는 easing만 더한다.
- **reduced-motion은 토큰 계층에서 한 번에 처리한다.** 컴포넌트마다 분기하지 않는다. 조작 자체(시트 드래그·버튼 탭)는 막지 않고 움직임만 제거한다.
- **애니메이션 대상은 `transform`과 `opacity`뿐이다.** 레이아웃을 다시 계산시키는 속성은 lint가 막는다.
- **새 production 의존성을 만들지 않는다.** `<ViewTransition>`은 Next가 번들하는 React에서 오고 타입은 `@types/react`에 이미 있다.

### 기술 인수 조건

1. **토큰**: `--ease-out`·`--ease-spring`이 `@theme`에 있고, duration 3종의 값이 그대로이며, `prefers-reduced-motion: reduce`에서 모션 토큰 값이 0으로 덮인다.
2. **정지 요소**: 다이얼로그가 진입·이탈에서 움직이고, 버튼·칩·스케줄 행이 눌림에 반응한다. 모든 값이 토큰에서 온다.
3. **라이브러리 조율**: `vaul`과 `sonner`의 전이 시간이 토큰 값과 일치하고, 두 라이브러리를 교체하거나 감싸는 래퍼를 새로 만들지 않는다.
4. **화면 전환**: 하단 탭 4개 이동과 스케줄 목록→상세 진입에서 전환이 동작하고, View Transitions 미지원 환경에서도 화면이 정상 렌더된다.
5. **lint**: 레이아웃 속성 애니메이션과 토큰 밖 임의값을 error로 막고, `var(--duration-*)`·`var(--ease-*)` 참조 표기는 통과시킨다.
6. **번들**: `pnpm verify`가 build 뒤에 정적 청크 gzip 합계를 재고 380KB를 넘으면 실패한다. 2026-08-09 기준선은 367KB다.
7. **회귀**: `globals.test.ts`의 reduced-motion 단언이 새 방식에 맞게 갱신되고 `pnpm verify`가 GREEN이다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 토큰 | 테스트함 — easing 정의·duration 3종 유지 | 테스트함 — reduced-motion에서 값 0 덮어쓰기 | 테스트함 — 덮어쓰기가 focus ring 등 비모션 규칙을 건드리지 않음 | 해당 없음 — 정적 CSS다 | 해당 없음 — 선언 1회다 | 해당 없음 — 빌드 산출물이다 |
| 2 정지 요소 | 테스트함 — 다이얼로그 진입·이탈, 눌림 상태 클래스 | 테스트함 — 토큰 미참조 하드코딩 값 없음 | 테스트함 — 연속 탭에서 상태가 끼이지 않음 | 해당 없음 — 표현 계층이다 | 해당 없음 — 상태 전이가 멱등이다 | 해당 없음 — 단일 요소다 |
| 3 라이브러리 조율 | 테스트함 — 시트·스낵바 전이 시간이 토큰과 일치 | 테스트함 — 라이브러리 기본 동작(드래그·자동 닫힘) 무손상 | 해당 없음 — 값 일치는 1행 소유 | 해당 없음 — 표현 계층이다 | 해당 없음 — 라이브러리 소유다 | 테스트함 — 시트와 스낵바 동시 표시에서 타이밍 충돌 없음 |
| 4 화면 전환 | 테스트함 — 탭 4개 이동·목록→상세 진입 | 테스트함 — 미지원 환경에서 정상 렌더 | 테스트함 — 전환 중 뒤로 가기·연속 탭 이동 | 해당 없음 — 라우팅 인증이 소유 | 테스트함 — 같은 탭 재선택이 전환을 다시 걸지 않음 | 테스트함 — 전환 도중 다른 라우트 요청 |
| 5 lint | 테스트함 — 위반 코드에서 error | 테스트함 — `var(--duration-*)` 참조 통과 | 테스트함 — 수식어(`hover:`·`md:`) 붙은 표기 판정 | 해당 없음 — 정적 분석이다 | 해당 없음 — 규칙이 순수 함수다 | 해당 없음 — 정적 분석이다 |
| 6 번들 | 테스트함 — 상한 이하에서 통과 | 테스트함 — 초과 시 verify 실패 | 테스트함 — 빌드 산출물 부재 시 명확한 사유 | 해당 없음 — 로컬·CI 동일 실행이다 | 해당 없음 — 측정이 멱등이다 | 해당 없음 — 순차 실행이다 |
| 7 회귀 | 테스트함 — verify GREEN | 테스트함 — 기존 globals 단언 갱신 후 통과 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 |

- 보충 위험: `chip.tsx`가 이미 `duration-[var(--duration-feedback)]` 표기를 쓴다 — 새 규칙이 `var(--)` 참조를 허용하지 않으면 기존 코드가 걸린다. 규칙 테스트에 이 표기를 통과 케이스로 넣는다. `tsconfig.json`에 canary 타입을 열면 ViewTransition 외의 React 실험 API도 타입상 통과하게 된다 — 리뷰에서 확인할 대상이며 기계 강제는 이 task 범위 밖이다.

### DEV-* 적용 상태

- `DEV-TOKEN-01`: 추가 결정 — 색상에 한정된 규칙을 모션 값까지 넓힌다. 기계 강제는 새 lint 규칙이 맡고, `DEVELOPMENT.md`의 해당 문구를 함께 갱신한다.
- `DEV-SSOT-01`: 기본 적용 — 모션 값의 정본은 `globals.css` 하나다.
- `DEV-DEP-01`: 해당 없음 — 새 production 의존성이 없다. `motion` 도입 승인은 P0-T44 RADIO가 받는다.
- `DEV-TEST-01`: 기본 적용 — tdd, RED→GREEN 증거를 `runs/P0-T43`에 남긴다.
- `DEV-CODE-07`: 기본 적용 — 설명 주석 금지.
- `DEV-ARCH`: 기본 적용 — `shared/ui`와 `app` 계층만 손대며 의존 방향을 바꾸지 않는다.
- `DEV-SEC`·`DEV-DATA`·`DEV-TIME`·`DEV-CACHE`·`DEV-OFFLINE`: 해당 없음 — 서버 경계·데이터·시간 계산·캐시가 없다.

## Architecture

- `src/app/globals.css`: `@theme`에 easing 토큰 추가, `prefers-reduced-motion` 블록에서 모션 토큰 값을 덮어쓴다. 기존 전역 `*` 규칙은 서드파티 애니메이션까지 잡는 안전망으로 남긴다.
- `src/shared/ui/{dialog,button,chip,schedule-row}.tsx`: 토큰 참조 클래스만 추가한다. props 시그니처와 컴포넌트 경계는 바꾸지 않는다.
- `src/app/(protected)/**`: 탭 레이아웃과 스케줄 상세 라우트에 `<ViewTransition>` 배치. 용도 한정이며 기존 라우팅 구조·인증 흐름을 수정하지 않는다.
- `tools/eslint-plugin-project/rules/motion-tokens.mjs`: `design-token-colors`와 같은 구조로 Tailwind 클래스 토큰을 분류한다. `eslint.config.mjs`의 `project/*` 블록에 error로 등록한다.
- `harness/gates/`: 번들 게이트 1종. 기존 게이트와 같은 violation 보고 형식을 쓴다.

## Data model

- 해당 없음 — DB 스키마·마이그레이션·RLS 변경이 없다.

## Interface

- 컴포넌트 공개 props에 변경이 없다. 모션은 클래스와 토큰으로만 들어간다.
- `<ViewTransition>`은 레이아웃과 라우트 컴포넌트에서 children을 감싸는 형태로만 쓴다. 전환 이름은 목록→상세 모프에 필요한 지점에만 부여한다.
- 번들 게이트는 `pnpm verify` 체인의 build 뒤 단계로 노출되고 단독 실행도 가능하다.

## Optimizations

- 새 dependency 0. `<ViewTransition>`은 Next 번들 React에서 오므로 번들 증가가 사실상 없다.
- 애니메이션 대상을 `transform`·`opacity`로 묶어 레이아웃 재계산을 피한다. lint가 이를 강제한다.
- 되돌림은 토큰 추가분 제거, 컴포넌트 클래스 되돌리기, `<ViewTransition>` 래핑 해제, lint 규칙과 게이트 비활성으로 가능하다. DB·서버·의존성 변화가 없어 되돌림 비용이 낮다.

## 변경 허용 경로

```
src/app/globals.css
src/app/__tests__/**
src/app/(protected)/**
src/shared/ui/**
tools/eslint-plugin-project/**
eslint.config.mjs
eslint.config.ci.mjs
tsconfig.json
harness/gates/**
harness/lib/**
harness/tests/**
package.json
tests/e2e/**
docs/standards/DEVELOPMENT.md
docs/execution/radio/P0-T43-radio.md
docs/execution/runs/P0-T43/**
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/app/(protected)/**`는 `<ViewTransition>` 배치에 한정하며 라우팅 구조·인증 흐름·화면 내용을 수정하지 않는다. `src/shared/ui/**`는 모션 클래스 추가와 그 테스트에 한정하며 props·구성 요소를 바꾸지 않는다. `docs/standards/DEVELOPMENT.md`는 `DEV-TOKEN-01` 문구를 모션까지 넓히는 수정에 한정한다. `package.json`은 verify 체인에 게이트를 잇는 수정에 한정하며 dependencies를 추가하지 않는다.

## 미결 사항

- `--ease-spring`의 `cubic-bezier` 구체값은 구현 중 실기기에서 조정하되 FOUNDATIONS 타이밍 대역 안에 둔다. 대역을 벗어나야 하면 설계로 반환한다.
- 물리 기반 spring과 `motion` 도입 승인은 P0-T44 설계가 다룬다. 결정 주체: P0-T44 인터뷰.
- canary 타입 개방으로 다른 React 실험 API가 타입상 열리는 문제의 기계적 차단은 이 task 범위 밖이다. 필요해지면 별도 제안으로 올린다.
