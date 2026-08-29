# 계획

task는 제목 한 줄과 완료 조건으로 이뤄진다. 완료 조건은 코드가 생기기 전에 총괄이 쓴다. 끝난 task는 완료로 내리고 로그 링크를 단다.

도메인 규칙 task 셋의 완료 조건이 "아직 안 정한 것이 빈다"였는데 문자 그대로는 안 빈다. 인터뷰가 답 하나마다 부차 항목을 새로 열었기 때문이다. 조건이 열거한 항목은 전부 채워져 완료로 내렸고, 조건 문장은 나중에 고쳐 맞추지 않고 그대로 뒀다. 다음부터 이런 task의 완료 조건은 "빈다" 대신 채울 항목을 이름으로 적는다.

## 다음

- [ ] `src/app/globals.css`를 `tokens.md`에서 생성한다
  - 완료 조건: `tokens.md`의 토큰 표를 입력으로 `src/app/globals.css`를 만드는 스크립트가 있고 `pnpm` 명령 하나로 돈다.
  - 완료 조건: 지금 `globals.css`를 그대로 다시 만들어낸다. 첫 실행이 파일을 안 바꾸면 손으로 옮겨 적은 사본이 정확했다는 뜻이고, 바꾸면 그 차이가 곧 그동안 어긋나 있던 자리다. 어느 쪽이든 결과를 로그에 남긴다.
  - 완료 조건: `pnpm test`가 생성 결과와 저장된 파일이 어긋날 때 실패한다. `token-css-parity`가 하던 일을 이쪽이 받고, 8절 전문과 `globals.css`를 사람이 맞추는 절차가 사라진다.
  - 완료 조건: `tokens.md` 8절이 문서에서 무엇이 되는지 정해진다. 생성의 입력이 앞 절의 표라면 8절 전문은 생성물의 사본이라, 지우든 생성물을 그대로 붙이든 하나를 고른다. 사람이 읽을 자리가 필요하면 남기는 쪽에 근거를 적는다.
  - 왜: 지금은 같은 값이 두 곳에 살고 사람이 손으로 맞춘다. 파리티 테스트가 있는 이유가 정확히 "두 곳이 어긋난다"는 것이라, 표에서 생성하면 맞출 일도 검사할 일도 사라진다. 토큰 하나를 고치는 데 문서와 코드를 같이 여는 것도 없어진다.
  - 범위 밖: 토큰 값 자체를 바꾸는 것. 7절 대비값 검사는 아래 별도 task다.

- [ ] `tokens.md` 7절의 대비값을 기계가 재게 한다
  - 완료 조건: `pnpm test`가 「측정한 조합」 표의 모든 줄을 1절 팔레트 hex에서 WCAG 공식으로 다시 계산해 대조한다. 어긋나면 실패한다.
  - 완료 조건: 같은 검사가 「떨어진 조합」 표에도 걸린다. 그 표의 값은 무엇을 왜 탈락시켰는지의 근거라, 틀리면 잘못된 탈락이 굳는다.
  - 완료 조건: 「측정한 조합」에 든 줄이 4.5:1 아래로 내려가면 실패한다. 표가 스스로 "전부가 기준을 넘는다"고 적어놨으니 그 문장이 참인지도 기계가 본다.
  - 왜: `on bg.neutral` 여덟 줄이 틀린 채 있었다. 일곱은 neutral-00이 아니라 neutral-100 면으로 잰 값이었고 하나는 소수점이 어긋났다. 판정이 뒤집히는 자리는 없었지만 손으로 재고 손으로 옮겨 적는 한 같은 일이 또 난다.
  - 범위 밖: 대비 계산기를 화면에 붙이는 것. 새 조합을 만들 때 사람이 값을 구하는 방법은 그대로 둔다.

## 진행

(없음)

## 완료

- [x] 로그인 화면과 승인 대기 화면의 디자인을 정한다 — 눈으로 보고 고른다 — [docs/log/2026-08-29.md](log/2026-08-29.md)
  - 완료 조건: 두 화면의 시안을 사람이 보고 고른다. 값을 글로 먼저 정하지 않는다 — 상태 토큰과 서체를 그렇게 정했고, 그 방식이 통했다.
  - 완료 조건: 승인 대기 화면에 무엇을 담고 무엇을 안 담는지가 정해진다. 로그인한 계정을 드러낼지, 승인까지 얼마나 걸리는지 약속할지, 관리자에게 연락할 길을 줄지가 그 목록이다. 약속할 근거가 없는 문장은 안 쓴다 — 근무표 확정 마감일이 `docs/domain/schedule.md`에 없어서 "8월 28일에 나옵니다"를 못 쓴 것과 같은 이유다.
  - 완료 조건: 고른 것이 `docs/design-system/` 아래 기록된다. 페이지별 디자인 문서의 첫 파일이라 그 틀도 같이 정해진다 — `README.md`가 산출물로 적어뒀는데 실제 파일이 아직 하나도 없다.
  - 범위 밖: 구현과 퍼블리싱. 다음 task다. 이름 입력 폼과 관리자 승인 화면도 여기 없다.
- [x] 세션 배선의 조용한 실패 둘을 드러낸다 — 인증 위에 승인과 권한이 쌓이기 전에 바닥을 정리한다 — [docs/log/2026-08-28-3.md](log/2026-08-28-3.md)
  - 완료 조건: `NEXT_PUBLIC_SUPABASE_URL`이나 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 없으면 `createSupabaseServerClient`가 그 자리에서 던진다. 지금은 `?? ""`로 빈 문자열을 넘겨서 env를 빠뜨린 배포가 "아무도 로그인 안 되는 정상 앱"으로 조용히 돈다. `NEXT_PUBLIC_*`은 빌드 시점에 번들에 박히니 CI의 env 주입이 `pnpm build`보다 뒤로 밀려도 아무것도 안 잡는다.
  - 완료 조건: 쿠키 쓰기가 실패해도 캐시 금지 헤더는 응답에 실린다. 지금은 `catch`의 `return`이 헤더를 넘기는 루프까지 건너뛴다. 두 일은 독립인데 하나가 다른 하나를 막고 있고, 막히는 쪽이 하필 토큰 실린 응답이 캐시에 남는 걸 방지하는 장치다.
  - 완료 조건: `.tsx` 더미 UI 규칙이 간접 호출을 못 잡는다는 한계가 문서에 있다. `@/shared/lib/`를 한 겹 거치면 `house/dumb-ui`가 통과시킨다 — `src/app/page.tsx`가 지금 그 상태다. 규칙의 버그가 아니라 type-aware lint를 안 켜기로 한 결정의 대가라, 그 둘을 같이 적는다.
  - 범위 밖: 미들웨어의 `matcher`. 지금은 함수 안에서 정적 자원을 걸러내는데 `export const config = { matcher }`를 쓰면 실행 자체를 안 한다. 동작은 맞고 명세도 지켰으니 열린 결정으로 둔다.
- [x] 세션 기반을 깐다 — 계정 영역의 나머지가 전부 이 위에 선다 — [docs/log/2026-08-28-2.md](log/2026-08-28-2.md)
  - 완료 조건: [docs/spec/session-foundation.md](spec/session-foundation.md). 로그인한 사람을 서버와 브라우저 양쪽에서 읽고 토큰을 만료 전에 갱신한다. 화면은 안 만든다.
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
