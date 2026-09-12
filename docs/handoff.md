# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 첫 수」를 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다(태관, 2026-09-07).

## 지금 상태

**1차 화면 열한 개가 전부 문서와 시안으로 섰다.** 순서대로: 로그인·승인 대기(`docs/log/2026-09-07.md`), 근무자 근무표 보기와 근무 신청 반전(`#262`, `#265`, `#267`, `docs/log/2026-09-07-2.md`), 근무 요청·시트·달력 색 축(`#269`, `#271`, `#273`, `#275`), 대시보드(`#279`, `#281`~`#283`, `#289`, `#290`, `#294`, `#295`, `docs/log/2026-08-30.md` 계열), 가입 흐름과 하루 띠 축 반전(`#298`, `#299`, `docs/log/2026-09-10.md`), ⑦사유 승인·거절과 근태 공개(`#301`, `docs/log/2026-09-11.md`), 남은 화면 여섯 — 급여·프로필·시급·QR·직원·통계(`#302`, `docs/log/2026-09-11.md`). 각 회차의 왜는 해당 log에 있다.

**공용 정본이 여러 차례 갱신됐다.** 색·토큰(`tokens.md`)에 덮개·띠 막대 값, 반전 팔레트 role 토큰 셋, 「팔레트 칸이 `—`인 행」 규칙, 「같은 값으로 갈린 색은 자리를 비운다」 조항이 쌓였다. `components.md`에 토스트·하루 띠·앱바·탭 바가 새 조각으로 섰다. `writing.md`에 「사람이 누르는 버튼은 예외다」·「계산할 것이 없으면 `–`」가 붙었다. 브랜드 색 자리가 다섯(「안 눌리는 표식」 추가), 누를 수 있는 것은 44px 이상, 알림은 읽음·안 읽음 둘로 끝난다는 것이 사람이 직접 정한 규칙으로 박혔다. `sian-auditor`가 서서 화면 디자인 파이프라인이 「페이지 문서 → `sian-writer` → `sian-auditor`」로 CLAUDE.md에 섰고, 태그 균형 검사(`tests/lint/sian-html.ts`)가 `pnpm test`에 낀다.

**아키텍처 리뷰가 시작됐다(#302, #303).** `src/`가 9월 초 이후 정지 상태라 실제 검증 하네스를 먼저 보기로 했고 후보 다섯을 냈다. `architecture/`가 `data-model`·`api`·`runtime`·`flows` 넷으로 갈려 자리만 파였고(300줄 넘는 파일은 도메인으로 가른다는 규칙과 함께), 그중 후보 A(마크다운 문서 모듈)가 이번에 세워졌다 — `tests/lint/markdown.ts`가 마크다운 구조를 읽는 유일한 seam이고, 그 위에 `doc-links.ts`(새 링크 검사, `pnpm test`에 낌)와 `doc-map.ts`(기존 adapter)가 선다. 나머지 후보 B~E는 「열린 결정」에 남아 있다.

**PR 순서 — #301 → #302(리베이스) → #303.** #302가 #301의 커밋을 품고 있어 #301을 먼저 넣고 #302를 `main` 위로 다시 얹었다. 문서 링크 감사가 #302에서 열여섯 곳을 닫아, #303의 링크 회귀(0건)는 그 위에서만 초록이다.

**시안·문서 캔버스는 저장소 밖에 있다.** [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)가 토큰·컴포넌트·모션·근무자/관리자 화면을 모은 캔버스고, 빌드 소스는 세션 임시 폴더에 있어 저장소로 옮기지 않는 한 다음 세션이 다시 만들 수 없다. 하루 띠 비교 시안은 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832)에 따로 있다.

## 다음 첫 수

**공용으로 올릴 조각이 여섯이다.** 시안이 스스로 정해 캡션에 밝힌 값들이다 — **스위치**(프로필 알림 줄, 이 앱에서 처음), **세그먼트**(급여와 통계가 같이 쓰니 둘째 사용자가 생겼다), **더보기 팝오버**(가입 대기에 이어 직원 관리가 둘째), **가운데 Dialog 치수**, **시트 그림자**, **「더 보기」**. 값을 맞춰 보고 `components.md`에 올린다. `components.md`의 「빈 상태」 절이 아직 백지인데 새 화면 넷이 빈 상태를 그린다.

**아키텍처 리뷰가 남긴 후보 넷이 있다.** 이번에 A(마크다운 문서 모듈)를 세웠고 나머지는 열려 있다 — 아래 「열린 결정」의 첫 넷. 그중 B(서버 클라이언트 조립이 다섯 곳에 복제)는 구현이 시작되면 화면 수만큼 늘어나는 자리라 데이터 task 전에 닫는 편이 싸다.

**그다음은 구조 설계다.** `docs/2-design/architecture/` 넷(`data-model`·`api`·`runtime`·`flows`)이 자리만 파여 있다. `runtime/README.md`가 캐시 넷(Service Worker·TanStack Query·Next 서버·Supabase realtime)과 시각의 출처, 경쟁 조건을 담을 자리고, 시급·급여 금액을 RLS가 막아야 한다는 제약이 `data-model`과 `api` 양쪽에 걸린다. 그 뒤가 구현이다 — `backlog.md`의 「다음」에 대시보드 구현 task가 서 있고 데이터 task가 먼저다.

## 열린 결정

- **아키텍처 리뷰 후보 B — 서버 클라이언트 조립이 다섯 곳에 복제.** `createSupabaseServerClient(await cookies())`가 `middleware.ts:27`·`auth-gate.ts:33`·`login/actions.ts:13`·`auth/callback/route.ts:7`·`auth/logout/route.ts:6`에 있다. 호출자마다 Next의 `cookies()`를 알아야 한다. 쿠키 획득을 구현 안으로 넣은 진입점 하나를 두면 인터페이스가 줄고, 저장소가 다른 미들웨어만 인자를 받는 둘째 진입점으로 남는다. ADR-003의 「클라이언트는 `dals`에서만」은 질의를 가리켜 부딪히지 않는다.
- **후보 C — 조립 코드의 집.** `src/app/auth-gate.ts`가 `entities`와 `shared`를 같이 불러 계층 규칙에 자리가 없고, `src/app/`은 `tdd-guard-unit`이 안 봐서 짝 테스트 없이 e2e만 이 배선을 본다. 관찰 007이 연 것이고 ADR-001 계층 서술을 고치는 결정이라 리팩터만으로 안 닫힌다.
- **후보 D — `requireEnv`가 두 팩토리에 복제.** `create-supabase-server-client.ts:11-19`와 `create-supabase-browser-client.ts:3-11`이 같은 키 둘을 같은 문구로 던진다. 작아서 B에 얹어 가는 편이 맞다.
- **후보 E — `SUBSECTION` 정규식 누수.** `generate-globals-css.mts:36`이 `tokens-md.mts`를 import하면서도 `tokens-md.mts:20`과 글자까지 같은 정규식을 따로 정의한다. export 한 줄이다. `tokens-md`의 절 나누기를 `markdown.ts` 위로 옮기는 것과 묶어 갈 자리다.
- **로고 렌더를 지키는 테스트가 없다.** `public/google-g.svg`를 지워도 e2e 11개가 초록이다. 「버튼 안 로고의 `background-image`가 비어 있지 않다」는 e2e 한 줄이 후보다.
- **CI가 chromium만 돈다.** 주 타깃이 아이폰 사파리인데 webkit을 안 본다. [ADR-007](2-design/adr/ADR-007-web-pwa-over-native.md)이 PWA로 가며 치르는 값 넷 중 유일하게 열린 채로 둔 것이다.
- **뛰는 점의 진폭이 `tokens.md`에 없다.** 등장 모션의 최솟값 0.9를 빌려 썼는데(6px 점에서 0.6px 변화라 눈에 잘 안 띈다), 실제 화면을 보고 정한다.
- **Button hover 조항이 `components.md` 표에 없다.** secondary·ghost·destructive의 눌림 배경도 아직 shadcn 기본값이다.
- **`motion.md`에 `delay-*` 함정이 문서화돼 있지 않다.** core Tailwind의 `transition-delay`가 이겨서 `tw-animate-css`를 쓰려면 `[--tw-animation-delay]`로 우회해야 하는데, 이게 라이브러리 내부 변수라 이름이 바뀌면 조용히 죽는다. 잡는 테스트가 없다.
- **`pages/login.md` 25행의 가운데 덩이 위치 서술이 두 가지로 읽힌다.** "남는 공간을 위아래가 반씩 나눈다"와 "화면 한가운데에 선다"가 정확히 같은 자리가 아니다. 탭 제목("La Bie Belle" vs "라비에벨") 조항도 없다.
- **`src/` 처분.** "따로 건질 건 없을 것 같다"고 했지만 총괄이 삭제 지시로 읽지 않고 그대로 뒀다 — 되돌리기 어려운 쪽을 기본값으로 삼지 않았다. 실제로 지우려면 말해줘야 한다.
- **디자인 캔버스 빌드 소스를 저장소에 넣을지.** 지금은 세션 임시 폴더에 있어서 다음 세션이 캔버스를 다시 만들 수 없다. `docs/2-design/design-system/canvas/`가 후보고, 넣으면 `globals.css`가 바뀔 때 다시 돌려 같은 링크에 올리는 일이 회차 절차가 된다.
- **캔버스가 찾은 지적 셋을 안 고쳤다.** 저장소 시안이 그렇게 그려져 있어서 캔버스만 고치면 둘이 어긋난다. ⓐ `.lrow .lv`가 `fg.neutral-muted`인데 `components.md`는 `fg.neutral`이라 적었다 ⓑ 작은 버튼 높이가 30px인데 세로 44px 규칙과 부딪힌다 ⓒ AdminCalendar가 ListRow를 한 줄짜리로 쓰고 「마감일 당기기」가 누를 것처럼 안 보인다. 시안을 고칠지 조항을 고칠지 정한다.
- **가운데 Dialog의 치수가 `components.md`에 없다.** 토큰 이름만 있고 폭·안쪽 여백·그림자가 안 적혀 있다. `approvals.sian.html`의 근무 취소 승인 확인이 이 앱에서 그것이 실제로 서는 첫 자리라 시안이 값을 재서 그렸다. `tokens.md`의 「빈자리」로 올릴지 정한다.
- **단일 선택 목록의 규격이 `components.md`에 없다.** `approvals.md`의 거절 이유가 넷 중 하나를 고르는 자리인데 라디오도 선택 상태의 ListRow도 정본에 없다. 오른쪽 체크(`fg.brand`)로 그렸고, 같은 모양이 다른 화면에서 한 번 더 나오면 공용으로 올린다.
- **더보기 팝오버의 모양이 `components.md`에 없다.** 가입 대기 시트가 차단을 그 안에 넣었고 직원 관리가 두 번째 사용자다. 두 번 나왔으니 올릴 자리고, 시안 값을 맞춰 보고 올린다.
- **하루 띠 비교 시안**은 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832)에 있다. 옛 축과 새 축을 나란히 놓은 것이고 저장소 밖이라 같이 안 산다.
- **캔버스는 저절로 갱신되지 않는다.** 저장소를 안 보고 빌드 때 읽은 값을 품고 있다. 토큰이나 시안이 바뀌면 빌드를 다시 돌려 같은 링크에 올려야 따라온다.
- **캔버스가 Wanted Sans를 못 싣는다.** 아티팩트 CSP가 구글 폰트만 허용해서 시스템 서체로 대체된다. 자간과 줄 높이가 실제 앱과 조금 다르게 보인다.
- **구글 버튼의 Google Sans Medium.** 구글 문서가 그 서체를 적었는데 서드파티 웹에 배포되지 않아 우리 서체로 그려야 한다. 그 어긋남을 OAuth 심사가 어떻게 보는지 모른다. 버튼 이미지를 통째로 쓰면 규정에 맞지만 문구를 우리말로 못 쓴다.
- **라이트와 다크에서 구글 버튼 테마를 나눌지.** 지금은 양쪽 다 어두운 배경 하나고, 라이트와 중립 테마의 값은 `tokens.md`에 안 옮겼다. 구글이 테마별로 다른 버튼을 쓰는 것을 막지 않는다. 실제 화면을 보고 정한다.
- **알림 블록의 중립 종류를 `components.md`에 올릴지.** 「아직 안 켬」이 안내·성공·경고·오류 넷 중 어디도 아니라 `bg.neutral-weak`로 깔았다. 화면 하나를 근거로 공용 컴포넌트를 늘리기에는 일러서 미뤘다. 다른 화면에서 같은 모양이 한 번 더 나오면 그때 올린다.
- **브랜드 색이 한 화면에 둘인 자리.** 승인 대기 화면에 알약(`bg.brand-weak`)과 「알림 켜기」(`bg.brand-solid`)가 같이 선다. 무게가 갈려 지금은 지나갔지만 실제 화면에서 다시 본다. 헤더에 로고를 두는 화면이 생기면 같은 판단이 한 번 더 필요하다 — `color.md`가 그 조건을 적어뒀다.
- env가 없으면 미들웨어가 모든 요청에서 던져 앱 전체가 500이 된다. 조용한 로그아웃보다 낫다고 판단해 그렇게 갔지만, 사용자에게는 Next 기본 에러 화면이 뜬다. `error.tsx`를 다룰 때 같이 본다.
- 미들웨어에 `matcher`가 없다. 함수 안에서 정적 자원을 걸러내는데 `export const config = { matcher }`를 쓰면 실행 자체를 안 한다. 동작은 맞고 명세도 지켰으니 성능 판단으로 남겨뒀다.
- `playwright.config.ts`에 `workers: 1`과 `fullyParallel: true`가 같이 있다 — 앞이 뒤를 무의미하게 만든다. e2e가 늘면 아플 자리다.
- Next 16이 `middleware.ts`를 deprecate하고 `proxy`로 밀고 있다 — 테스트가 파일명을 못박아둬서 옮길 때 같이 고쳐야 한다.
- PR #197의 lint 규칙 표가 저장소 안에 없고 PR 본문에만 있다 — 규칙 번호 불변식(`DOCUMENTED_LINT_RULE_COUNT`)이 그 표에 기대는데 정본이 저장소 밖에 있다.
- `tests/lint/tsx-dumb-ui.test.ts:162`의 인라인 `layout.tsx` 픽스처가 아직 Geist를 가리킨다. 이 파일의 픽스처 다섯(`layout`·`page`·`providers`·`button`·`card`)이 전부 실제 소스를 베낀 인라인 사본이라, 소스가 바뀔 때마다 같은 방식으로 썩는다. `design-token-values.test.ts`처럼 `readFileSync`로 실제 파일을 읽게 옮길지는 안 정했다.
- 관리자 승인 RLS가 `security definer`를 필요로 한다. 컬럼 권한은 역할 단위라 `authenticated`에 `approved_at`을 열면 관리자든 아니든 다 열린다. 지금 스키마는 그 문을 안 열어뒀다.
- integration 테스트가 만든 사용자를 치우지 않는다. anon 키로는 `auth.users`를 못 지우고, 프로필 행 삭제는 테스트가 지키는 바로 그 정책에 걸린다. 지우려면 service role이 필요한데 금지다. `supabase/config.toml`이 IP당 5분에 서른 번으로 가입을 막는데 e2e도 이제 사용자를 만드니, 계정 task를 여러 회차 돌리면 닿는다.
- 테마를 고르는 UI와 그 선택을 어디 저장할지가 미정이다. 기기 설정을 따르되 앱에서 덮을 수 있게 하기로는 정했지만, 그 속성을 실제로 걸어줄 화면이 없다. `docs/2-design/design-system/tokens.md`의 「아직 안 정한 것」에 있다.
- 도메인 규칙의 미정 항목은 `docs/2-design/domain/`의 각 파일 "아직 안 정한 것" 절이 정본이다. 디자인 값의 미정 항목은 `docs/2-design/design-system/tokens.md`와 `docs/2-design/design-system/pages/`의 같은 이름 절이 정본이다. 여기 옮겨 적지 않는다.
- 로컬에서 연타하면 가입 rate limit에 걸린다. `supabase/config.toml`이 IP당 5분에 30번이다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- `authenticated`에 `profiles` 테이블 단위 insert와 delete 권한이 열려 있다. 정책이 없어 RLS가 전부 막는 구조다. 지금은 기본 거부라 안전하고 테스트가 delete 쪽을 지킨다.
- shadcn `accent` 매핑 — `bg.brand-weak`로 걸면 드롭다운 hover마다 브랜드 색이 깜빡여 절제 규칙과 부딪힌다. 실제 화면을 보고 `bg.neutral-weak`로 내릴지 판단이 필요하다.
- "8월 28일에 나옵니다" 예시 문장 — 어체가 합쇼체라 해요체 규칙과 어긋나고, `docs/2-design/domain/schedule.md`에 근무표 확정 마감일이 없어 앱이 날짜를 약속할 근거가 없다. `writing.md`에 확인 요청으로 달려 있다.
- 급여 확정 축하 모션 — 축하할 순간 후보로 지목됐는데 `payroll.md`가 급여를 확정하지 않는다고 못 박아 대상을 못 정했다.
- 되돌리기 어려운 동작에 별도 색을 줄지 — 출근 인증과 교대 수락 둘 다 되돌릴 길이 없는데 지금은 같은 `bg.brand-solid`라 한 화면에 브랜드 버튼이 둘 뜰 수 있다.
- `docs/2-design/design-system/tokens.md`의 "브랜드 색 출처" — 지금 brand 계열이 공식 브랜드 가이드가 아니라 홀 이미지와 웹사이트 내비게이션에서 뽑은 값이다.
- 세그먼트 목록 — 실제 파일을 보고 정한다.
- `playwright.config.ts`의 CI 리트라이 2 — e2e가 늘고 `workers: 1`까지 겹쳐 전체 실행 시간이 무거워지고 있다. 유지할지 정한다.
- CI가 1분대에서 4분대로 늘었던 것 중 analytics(logflare·vector) 몫은 껐다. 문서 전용 PR은 48초로 줄었지만, 코드가 낀 PR의 남은 시간이 여전히 아픈지는 몇 회차 더 겪고 정한다.

## 주의

- **`docs/`·`.claude/`·루트 마크다운만 바뀐 PR은 CI가 뒤쪽 넷(integration·build·e2e·supabase 기동)을 건너뛴다.** 스킵 패턴이 루트 md까지 넓다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨지는 자리가 있다.
- **`pnpm test`에 문서 구조를 지키는 검사 둘이 낀다.** `tests/lint/doc-map.ts`(CLAUDE.md 문서 지도 경로 실존 확인)와 `tests/lint/legacy-doc-paths.ts`(옛 경로 잔존 검사)다. 문서를 옮길 땐 CLAUDE.md 문서 지도를 같이 갱신하고, 옛 경로 문자열을 새로 남기지 않는다. `docs/log/`는 검사 밖이라 당시 경로를 그대로 써도 된다.
- **`feat/<슬러그>` 브랜치에서 `src/`를 고치려면 `docs/2-design/spec/<슬러그>.md`가 `status: approved`여야 한다.** `.claude/hooks/spec-gate.py`가 막는다. `feat/`가 아닌 브랜치(문서·리팩터링·수리)는 게이트 밖이다.
- **`tdd-guard-e2e.py`가 `src/screens/` 아래 순수 `.ts`도 화면으로 오판한다.** `spec_name()`이 접두사만 보고 확장자를 안 봐서, `model/` 아래 로직 파일까지 `tests/e2e/<이름>.spec.ts`를 요구할 수 있다. 관찰 006이 열려 있고 아직 안 고쳐졌다 — 이런 파일을 계획할 때 unit 테스트 작성 순서가 밀릴 수 있다.
- **여러 계층을 내려다보는 조립 코드는 `src/app/`으로 흘러가고 짝 테스트 요구가 없다.** `auth-gate.ts`가 그 예다 — entities와 shared를 같이 부르는 코드가 FSD 계층 규칙과 `tdd-guard-unit.py` 둘 다 피해 훅 사각으로 갔다. e2e만 이 배선을 검증한다. 관찰 007이 자리 규칙 자체를 총괄 결정 대상으로 올려뒀다.
- **CLAUDE.md는 이제 라우터다.** 왜에 해당하는 산문은 CLAUDE.md에 없고 ADR과 각 정본 문서(design-system README, 정의문)에 있다. CLAUDE.md만 읽고 근거를 찾으려 하지 않는다.
- **`docs/2-design/spec/`의 완료 조건은 이제 모든 task에 의무다.** ADR-002의 승격 기준(세 문장 넘으면 승격)은 ADR-005가 대체했다 — 문장 길이와 무관하게 spec이 항상 완료 조건의 집이다.
- **`.prettierignore`가 `*.md`를 거른다.** 문서에 prettier를 돌려도 아무 일도 안 한다. 저장소 전체 방침이다.
- **pre-commit 훅이 staged 파일의 포맷을 고쳐 인덱스에 다시 올린다.** 일부만 staged된 파일이 포맷에 어긋나면 고치지 않고 커밋을 막는다 — 훅이 고치면 staged 안 한 변경까지 딸려 들어가기 때문이다. 그때는 `pnpm format` 뒤에 직접 `git add` 한다.
- **`tdd-guard-unit.py`가 `tests/lint/`도 짝 테스트를 요구한다.** 감시 접두사에 `src/`와 `tests/lint/` 둘 다 있다. `tests/` 아래에서는 짝을 `__tests__/`가 아니라 형제 `<이름>.test.ts`로 찾는다 — 그 디렉터리 관례가 형제 배치라서다. `tests/e2e/`는 여전히 감시 밖이라 CI의 `pnpm test`가 대신 잡는다. `tests/lint/rule-check.ts`는 지금 짝 테스트가 없어서 이 파일을 고치려면 먼저 `rule-check.test.ts`를 써야 한다.
- **`SUBSECTION` 정규식이 `scripts/tokens-md.mts`와 `scripts/generate-globals-css.mts` 두 곳에 있다.** 표 파서 계약을 공유하는 게 아니라 마크다운 heading 정규식이 우연히 겹친 것이다. 표 형식을 바꿀 땐 둘 다 확인한다.
- **`.mts` 스크립트는 `node --experimental-strip-types`로 돈다.** `pnpm tokens:css`가 그 명령을 감싼다. `tsx`나 `ts-node` 같은 별도 실행기 의존성이 없다.
- **vitest가 `NEXT_PUBLIC_*`을 `process.env`에 안 얹는다.** Vite의 `envPrefix` 기본값이 `VITE_`라서다. env를 읽는 코드를 테스트하려면 `vi.stubEnv`로 명시로 채워야 한다. `.env.local`에 값이 있어도 소용없다.
- **`create-supabase-server-client`는 env가 없으면 던진다.** 이 팩토리를 부르는 새 테스트를 쓸 때 `vi.stubEnv`가 필요하다.
- **`tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다.** Prettier 3이 `.gitignore`를 기본 ignore 파일로 읽는다. 넣으면 `format-check.test.ts`가 만든 픽스처를 prettier가 건너뛰어 `--check`가 조용히 0으로 끝난다 — 테스트가 사실상 안 도는데 초록으로 보인다.
- **`pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으며 깨지는 일이 반복된다.** `pnpm install --frozen-lockfile`로 복구한다.
- **`pnpm typecheck`와 `pnpm build`가 보는 범위가 다르다.** 빌드는 `tsconfig.build.json`으로 테스트를 뺀 앱 코드만 본다. 테스트 파일의 타입 오류는 `pnpm typecheck`나 `pnpm test`에서만 드러난다.
- **`tests/lint/` 테스트가 worktree 여러 개를 동시에 돌리면 기본 5초 타임아웃에서 흔들린다.** `new ESLint()`가 next·typescript-eslint 설정을 통째로 로드하는 비용이 첫 테스트에 몰린다. `--testTimeout=60000`을 주면 안정적으로 통과한다.
- **`supabase/config.toml`의 analytics가 꺼져 있어 Studio에 Logs 탭이 없다.** 로그 자체는 그대로 남으니 `docker logs supabase_db_la-bie-belle`처럼 컨테이너에서 직접 읽는다. RLS가 막은 순간은 `db` 로그에 `permission denied for table ...`로 찍힌다. 화면이 붙고 API 트래픽을 화면에서 걸러 봐야 할 때가 오면 다시 켠다.
- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다. 포맷 훅도 여기 붙어 있다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- 새 개념이 코드에 등장하면 먼저 `docs/2-design/domain/`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도를 이유로 안 켜져 있다. await 빠진 Supabase 호출 같은 건 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다. 대조 테스트가 픽스처로 oklch 리터럴 문자열을 쥐고 있어서다.
- Wanted Sans는 CDN(jsdelivr) 의존이다. self-host가 아니라서 그 서비스가 죽으면 폰트가 시스템 폴백으로 떨어진다. `layout.tsx`의 `preconnect`는 지연만 줄일 뿐 가용성을 보장하지 않는다.
- CI는 `pnpm build` 앞에서 `supabase status`의 값을 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 넘긴다. `NEXT_PUBLIC_*`은 빌드 시점에 번들에 박히므로 이 순서가 바뀌면, `/`와 `/auth/logout`이 동적 라우트라 빌드는 그대로 통과하고 실행 시점에 `createSupabaseServerClient`가 던져 요청마다 500이 뜬다.
