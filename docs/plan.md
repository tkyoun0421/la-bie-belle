# 계획

task는 제목 한 줄과 완료 조건으로 이뤄진다. 완료 조건은 코드가 생기기 전에 총괄이 쓴다. 끝난 task는 완료로 내리고 로그 링크를 단다.

도메인 규칙 task 셋의 완료 조건이 "아직 안 정한 것이 빈다"였는데 문자 그대로는 안 빈다. 인터뷰가 답 하나마다 부차 항목을 새로 열었기 때문이다. 조건이 열거한 항목은 전부 채워져 완료로 내렸고, 조건 문장은 나중에 고쳐 맞추지 않고 그대로 뒀다. 다음부터 이런 task의 완료 조건은 "빈다" 대신 채울 항목을 이름으로 적는다.

## 다음

- [ ] 세션 기반을 깐다 — 계정 영역의 나머지가 전부 이 위에 선다
  - 완료 조건: [docs/spec/session-foundation.md](spec/session-foundation.md). 로그인한 사람을 서버와 브라우저 양쪽에서 읽고 토큰을 만료 전에 갱신한다. 화면은 안 만든다.

## 진행

(없음)

## 완료

- [x] `tokens.md` 8절이 덮지 않는 자리 넷을 메운다 — lint task에서 `globals.css`를 교체하며 드러났다 — [docs/log/2026-08-28.md](log/2026-08-28.md)
  - 완료 조건: `@custom-variant dark`가 생겨 `dark:` 유틸리티가 두 경우를 다 따라간다. `[data-theme="dark"]`가 걸렸을 때와, 속성이 아예 없는데 기기가 다크일 때다. `[data-theme="light"]`가 걸리면 기기가 다크여도 안 따라간다. `button.tsx`가 `dark:` 클래스를 여럿 쓰는데 지금은 팔레트만 뒤집히고 유틸리티는 안 따라오는 진짜 버그다.
  - 완료 조건: `@layer base`에서 body가 배경색과 글자색을 명시로 받는다. 지금은 `color-scheme`만으로 굴러간다.
  - 완료 조건: `card.tsx`의 `CardTitle`에서 `font-heading` 클래스가 사라진다. 제목은 본문과 같은 폰트를 쓰고 굵기와 크기로만 구분하기로 정했다.
  - 완료 조건: `--font-sans`가 Wanted Sans를 가리키고 화면에 실제로 그 서체가 걸린다. jsdelivr의 조각 나눔 스타일시트를 쓰고 저장소에 폰트 파일을 넣지 않는다. `layout.tsx`에서 Geist와 Geist Mono import가 빠진다.
  - 완료 조건: 굵기가 넷으로 준다. Wanted Sans가 400부터 시작해 `font-light`(300)이 400으로 눌리기 때문이다. `tokens.md` 3절과 `foundation/typography.md`에서 `font-light`가 빠지고, 급여 금액은 `font-normal`로 바뀐다.
- [x] 값이 비어 있던 상태 토큰 셋을 채운다 — 출근 인증 버튼이 첫 화면부터 비활성을 쓴다 — [docs/log/2026-08-28.md](log/2026-08-28.md)
  - 완료 조건: `bg.neutral-disabled`(neutral-100) · `fg.neutral-disabled`(neutral-700) · `stroke.neutral-disabled`(neutral-200) 셋이 `tokens.md` 2절 표와 8절 CSS 양쪽에 있다. 계열을 나누지 않아 갈색 버튼이든 삭제 버튼이든 비활성이면 같은 회색이다.
  - 완료 조건: `bg.brand-weak-selected`(brand-100)가 2절 표와 8절 CSS 양쪽에 있다. 선택된 줄의 테두리는 이미 있는 `stroke.brand-solid`를 쓴다.
  - 완료 조건: 자릿수가 줄맞춤돼야 하는 자리에 `font-variant-numeric: tabular-nums`를 쓴다는 규칙이 `tokens.md` 3절에 한 줄로 있다. 급여 금액과 근무 시간이 그 자리다.
  - 완료 조건: `tokens.md`의 「아직 안 정한 것」에서 `selected`와 `disabled` 항목이 빠진다.
  - 완료 조건: 같은 목록에서 "라이트와 다크 중 무엇이 기본인가"도 빠진다. 기기 설정을 따르되 앱에서 덮을 수 있게 하기로 정했다. 대신 테마를 고르는 UI와 그 선택을 어디 저장할지가 새 미정 항목으로 들어간다.
  - 완료 조건: `components.md`의 destructive 규칙이 좁아진다. 빨강은 계정 탈퇴처럼 정말 되돌릴 수 없는 자리에만 쓰고 근무표 삭제는 일반 버튼이다. 빨강이 흔해지면 정작 위험한 자리에서 손이 안 멈춘다.
  - 완료 조건: `pnpm test`의 토큰 대조가 통과한다. 2절 표와 8절 CSS가 어긋나면 이 테스트가 잡는다.

- [x] 규율을 lint와 포매터로 기계화한다 — 문서에만 적힌 규칙을 CI가 막게 한다 — [docs/log/2026-08-26-4.md](log/2026-08-26-4.md)
  - 완료 조건 (경계): `pnpm lint`가 `src/` 안의 상대 경로 import를 예외 없이 잡는다. `tests/`를 가리키는 import는 예외로 뚫지 않고 `@tests/*` alias를 새로 만들어 없앤다. 역방향 레이어 import(shared→entities, entities→features, features→screens, screens→app)를 잡는다. 같은 층 다른 슬라이스 import(entities/a → entities/b)를 잡는다.
  - 완료 조건 (디자인 값): `pnpm lint`가 하드코딩한 색과 크기를 잡는다 — hex·rgb·hsl·oklch 리터럴, Tailwind 임의 값(`bg-[#...]`·`text-[13px]`·`p-[7px]`), Tailwind 기본 팔레트 유틸리티(`bg-red-500`·`text-gray-600`). 대괄호 안이 토큰을 거치면(`var()`·`--spacing()`) 통과하고 리터럴이면 걸린다. 선택자와 속성 변형은 애초에 대상이 아니다. `src/app/globals.css`를 `tokens.md` 8절 전문으로 교체하고, `pnpm test`가 둘을 oklch 문자열로 맞대어 본다.
  - 완료 조건 (`.tsx`는 더미 UI): `pnpm lint`가 `.tsx` 안의 `@supabase/*` import와 `fetch(` 호출과 TanStack Query 훅 직접 호출을 잡는다. ADR-001 「화면과 로직」의 집행이다.
  - 완료 조건 (테스트 규율): `pnpm lint`가 vitest와 Playwright의 집중 실행 표시(`.only`)를 잡는다. main에 들어가면 CI가 초록인 채로 테스트가 안 도는 자리다.
  - 완료 조건 (정리): `pnpm lint`가 `console.error`와 `console.warn`만 통과시키고 나머지 `console` 호출은 전부 잡는다. 미사용 import가 걸리고 `--fix`로 지워진다. 타입만 쓰는 import는 `import type`으로 통일된다. import 순서가 FSD 레이어 순서로 고정된다.
  - 완료 조건 (포매터): `pnpm format:check`가 있고 CI에서 돈다. Tailwind 클래스 순서가 여기 걸린다.
  - 완료 조건 (증명): 규칙마다 위반 픽스처와 그 규칙이 실제로 발동하는지 확인하는 테스트가 있다. 기존 검사는 전부 그대로 통과한다.
  - 범위 밖: type-aware lint(`no-floating-promises` 등)는 lint 속도를 이유로 안 켠다. `no-magic-numbers`, 파일명 규칙 강제, 코드 주석 금지 lint, 시크릿 스캔, a11y 규칙 추가도 이번에 안 한다.
- [x] 디자인 레퍼런스 검토 — 시안 방향을 사람이 정한다 — [docs/log/2026-08-26-4.md](log/2026-08-26-4.md)
  - 완료 조건: 방향 결정과 근거 레퍼런스가 `docs/design-system/`에 기록된다.
- [x] 교대와 출근과 알림 규칙을 확정한다 — [docs/log/2026-08-26-3.md](log/2026-08-26-3.md)
  - 완료 조건: `docs/domain/swap.md`와 `docs/domain/attendance.md`와 `docs/domain/notification.md`의 "아직 안 정한 것"이 빈다. QR 위조 대응과 iOS PWA 푸시 제약 대응이 여기 들어간다.
- [x] 계정과 근무표 규칙을 확정한다 — [docs/log/2026-08-26-3.md](log/2026-08-26-3.md)
  - 완료 조건: `docs/domain/account.md`와 `docs/domain/schedule.md`의 "아직 안 정한 것"이 빈다. 첫 관리자 부트스트랩, 가입 거절, 퇴사자 보존, 근무자가 남의 근무를 보는 범위 넷이 여기 들어간다.
- [x] 급여 규칙을 확정한다 — 법정 기준 확인을 포함한다 — [docs/log/2026-08-26-3.md](log/2026-08-26-3.md)
  - 완료 조건: `docs/domain/payroll.md`의 "아직 안 정한 것"이 빈다. 연장 기준 시간, 가산 중복, 야간 가산, 주휴수당, 휴게 공제, 휴일 8시간 초과분 여섯을 근로기준법과 맞춰 정하고 어긋난 자리는 왜 그렇게 정했는지를 같이 남긴다. 세전·실지급 구분과 주 경계·지급일·시급 소급도 정해진다.
- [x] 도메인 규칙의 집을 `docs/domain/`으로 정한다 (ADR-004) — PRD에서 규칙을 빼고 영역별 파일 여섯으로 나눴다 — [docs/log/2026-08-26-2.md](log/2026-08-26-2.md)
- [x] Supabase 바탕과 integration 테스트 층을 세운다 — [docs/log/2026-08-26.md](log/2026-08-26.md)
  - 완료 조건: `supabase start`로 뜬 로컬 DB에 붙는 integration 테스트가 하나 이상 초록불이고, `pnpm test:integration`과 CI의 integration 단계가 돈다. `tdd-guard-unit.py`가 `__tests__/<이름>.integration.test.ts`를 짝으로 인정한다.
- [x] 영속과 인증을 Supabase로 정한다 (ADR-003) — [docs/log/2026-08-26.md](log/2026-08-26.md)
- [x] integration 층에 손과 계획을 붙인다 (`integration-test-writer` 신설, `test-planner`와 `implementer` 정의문 보강) — [docs/log/2026-08-26.md](log/2026-08-26.md)
- [x] SDD·DDD·TDD 자리를 ADR-002로 정한다 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] PRD 작성 — 제품 인터뷰로 요구를 확정한다 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] 테스트 계획·작성 분리와 회차 마감 위임 — [docs/log/2026-08-25-5.md](log/2026-08-25-5.md)
- [x] subagent 여섯과 FSD 배치, TDD 훅 — [docs/log/2026-08-25-4.md](log/2026-08-25-4.md)
- [x] 프로젝트 스캐폴드 — [docs/log/2026-08-25-3.md](log/2026-08-25-3.md)
- [x] 협업 구조 확정 — [docs/log/2026-08-25.md](log/2026-08-25.md)
