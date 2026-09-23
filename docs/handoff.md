# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 사람 손이다 — 기계만으로 닫을 task가 또 없다.** `expo-scaffold`의 실기기 확인과 `sian-native-pass`의 시안 승인, 그리고 총괄이 정할 결정 둘([navigation Q-03](2-design/system/navigation.md#q-03)·[runtime Q-01](2-design/system/runtime.md#q-01))이 남는다. `ready`로 선 화면 task 넷(`profile-form`·`members-pending`·`profile-screen`·`members`)은 전부 `expo-scaffold`를 선행으로 들어서 그 확인 뒤에 풀린다. `lint-rule-catalogue`·`pending-screen-copy`·`admin-home-split`·`admin-home-sian` 넷은 이번 회차로 `done`이다.

**관리자 홈의 짝 시안도 섰다.** [admin-home.sian.html](2-design/system/screens/admin-home.sian.html)이 목업 여섯이고 원본에서 01절을 빼며 02~10을 01~09로 내렸다. 잘라 붙이지 않고 `sian-writer`가 문서를 읽어 새로 그렸다 — 열 절이 CSS 한 덩이를 나눠 써서 잘라내면 죽은 규칙이 따라온다. **감사가 문서에 없는 조합을 잡았다**: 확정 전 목업에 빈 자리 카드와 오늘 현황 실값이 같이 서 있었다. 카드는 확정 뒤 조건이고 오늘 현황은 확정 전에 「–」라, **근무표 상태 하나가 그 목업의 나머지를 다 정한다** — 미니뷰의 「오늘」 표식까지(확정 전 시나리오는 9월 29일이라 10월 미니뷰에 오늘이 없다). 목업을 상태별로 다시 짜고 재감사에서 어긋남이 없었다.

**관리자 홈이 근무표 문서에서 나왔다.** 거기서 열리는 문이 근무표만이 아니라 승인할 일·가입 대기·직원·시급·QR·통계까지라 근무표 한 영역이 소유할 화면이 아니다. 상태 표·짜임·문안·모션 네 덩이를 글자 그대로 옮기고 경로 깊이만 고쳤고, 들어오는 링크 23곳과 영역 지도를 같이 돌렸다. 옮기다 드러난 자리 둘도 고쳤다 — 「빈 자리 재촉」이 타일 요약 줄 승격이라고 적은 것은 카드로 바뀐 뒤의 옛 서술이었고, 「이 파일의 모든 바텀시트가 같다」는 파일 단위 선언이 첫 화면 절에 얹혀 있어서 `## 모션` 머리로 올렸다.

**「영향 확인」 게이트는 파일 이름을 하나씩 찾는다.** `navigation.md`나 `components.md`처럼 여럿이 `sources`로 드는 문서를 건드리면 받는 spec·plan 서른하나가 걸리고, PR 본문의 그 절에 각 파일 이름이 글자로 있어야 통과한다(판정은 `tests/lint/sources-impact.ts`의 basename 대조다). 산문으로 「전수 확인했다」고만 적으면 막힌다.

**lint 규칙 표가 저장소로 들어왔다.** [execution.md 「집행되는 규칙」](4-test/execution.md#집행되는-규칙)이 정본이고 `tests/lint/rules.ts`가 코드용 사본이다 — 전에는 정본이 PR 본문에만 있어서 `DOCUMENTED_LINT_RULE_COUNT = 14`가 무엇에 근거한 수인지 저장소에서 확인할 수 없었다. **`ENFORCED_RULE_COUNT`는 줄 수가 아니라 마지막 번호다** — 줄은 열일곱, 번호는 1~18이고 미배정 셋(6·7·8)이 빠지며 한 번호를 규칙 ID 둘이 나눠 가진 자리가 둘이다.

**승인 대기 화면의 넷째 도는 문구는 1차에 안 선다.** 그 자리를 다른 문구로 메우지 않고 셋만 돌린다 — 넷째 줄이 소개하는 교대가 2차고, 1차 기능 중 그 자리에 세울 것이 없다.

**`e2e-runner`가 닫혔다 — 러너는 Maestro다.** 근거는 [ADR-013](2-design/adr/ADR-013-e2e-runner-maestro.md)이고 셋이다. Expo가 자기 Detox 템플릿을 지우고 공식 e2e 문서로 Maestro를 들었다. Detox는 `expo prebuild`로 네이티브 디렉터리를 꺼내라고 해서 ADR-011의 관리 흐름 선택을 되돌린다. Detox의 딥링크에 안드로이드·iOS 양쪽 열린 버그가 있고 우리 여정의 시작점이 거기다 — 종이 QR과 OAuth 콜백이 딥링크다. 뒤집을 수 있었던 한 가지(앱을 죽이고 상태를 남긴 채 다시 띄우기)는 `stopApp`·`killApp`과 `clearState` 없는 `launchApp`으로 닫혔다.

**게이트가 다시 문다.** `tests/e2e/`가 서면서 `tdd-guard-e2e.py`의 「쓸 자리가 없으면 아무것도 안 막는다」 면제가 사라졌다 — 디렉터리가 없어도 이제 막는다. 찾는 짝을 `.spec.ts`에서 `.yaml`로 바꿨고 [관찰 006](observations/archive/006-tdd-guard-e2e-screens-ts.md)을 같은 PR에서 닫았다(`.tsx`만 화면으로 본다 — `src/screens/` 아래 순수 계산 `.ts`가 화면으로 오판되던 자리다). 플로우는 `login.yaml` 하나뿐이니 **나머지 라우트를 고치려 들면 훅이 막는다.** 그것이 이 task가 세운 압력이고, 막히면 그 화면의 플로우를 먼저 쓰는 것이 답이다.

**한 번도 안 돌렸다.** Maestro는 기기나 시뮬레이터에 올라간 앱을 `appId`(`com.labiebelle.app`)로 찾아 띄우는데 그 EAS 빌드가 없다. Expo 공식 문서도 e2e에 설치 가능한 `.apk`·`.app`을 요구한다. CI 단계를 못 세운 이유도 같다.

**세션을 심는 방법이 열린 채 남았다.** Maestro는 앱 내부를 안 봐서 코드로 세션을 넣을 수 없고, 웹 시절 쿠키 헬퍼는 같이 걷혔다. 로그인 뒤 화면에 처음 닿는 task가 딥링크·화면 조작·테스트용 경로 중에서 정한다. `strategy.md`의 「세션을 심어 화면으로 바로 들어가는 헬퍼」 문장이 있는 헬퍼를 가리키고 있었고 그것을 고쳤다.

**`file-naming`이 닫혔다 — 규약은 셋이다.** 부르는 이름이 있는 파일은 그 이름을 쓴다. 컴포넌트(`.tsx`)는 PascalCase(JSX가 `<NotBuiltYet />`으로 부른다), 훅은 그 훅 이름과 같은 camelCase(`useAuthGate.ts`), 나머지는 kebab-case다. **판정은 이름 꼴이 아니라 파일이 무엇을 담았는지로 한다** — `.tsx`는 ADR-001이 더미 UI로 못박아서 곧 컴포넌트고, `export function use[A-Z]`를 내놓으면 훅이다. 정본은 [CLAUDE.md](../CLAUDE.md)의 「코드 구조」고 `tests/lint/file-naming.ts`가 `src`·`tests`·`scripts`·`eslint-rules`에서 본다. 훅 판정에서 `tests/`를 뺐다 — 거기 픽스처가 훅 코드를 글자로 들고 있어서 내용으로 판정하면 검사 파일들이 전부 훅으로 읽힌다.

**이 결정에 대가가 하나 있고 이미 밟았다.** 규약에 케이스 차원을 들이면 macOS·윈도우가 대소문자를 안 구별해 `Foo.ts`와 `foo.ts`가 OS에는 한 파일, git에는 두 파일이 된다. kebab으로 통일하면 그 차원이 없어지는데(bulletproof-react가 그 길이다) 우리는 부르는 이름을 맞추려고 PascalCase를 골랐다. 검사가 그 짝을 막지만 **macOS에서는 그 검사가 무는 것을 실물로 확인할 수 없다** — 두 파일이 동시에 존재할 수 없다. 규약을 들인 그 자리에서 `rm`이 추적 중인 파일을 지웠고 [관찰 017](observations/017-case-insensitive-rm-deleted-a-tracked-file.md)이 든다.

**`src/app/`은 규약 밖이다.** Expo Router가 `src/app/`을 라우팅 뿌리로 읽는 것을 `.expo/types/router.d.ts`의 경로 유니언으로 확인했다 — `src/app/check-in.tsx`가 `/check-in`이고 그 주소는 [navigation.md](2-design/system/navigation.md#딥링크)가 종이 QR에 실린다고 적은 것이다. Expo Router 문서는 라우트 파일의 케이스를 규정하지 않아서 이 판단은 우리 것이다. `docs/`와 슬러그는 ADR-005가, `.claude/hooks/`는 파이썬 관례가, `supabase/migrations/`는 타임스탬프 순서가 가진다.

**이 조합을 규정한 이름난 문서는 없다.** Airbnb는 Pascal+camel(kebab 언급 없음), Google TypeScript는 snake_case, bulletproof-react는 컴포넌트까지 전부 kebab, Angular·Vue는 kebab이다. React·Next.js·Expo 공식 문서는 파일 케이스 규약 자체가 없다. 셋으로 가른 것은 우리 판단이고 근거는 「부르는 이름과 파일 이름을 맞춘다」 한 줄이다.

**`types-generation`이 닫혔다.** `pnpm types`가 `supabase gen types typescript --local --schema public --schema internal`을 감싸 `src/shared/api/database-types.ts`를 만들고 prettier까지 한 덩이로 먹인다 — 두 단계가 갈리면 CI가 다시 뽑을 때마다 세미콜론 차이로 헛빨간불이 난다. CI는 `pnpm test:integration:run`(그 안에 `supabase migration up`이 있다) 뒤에 다시 뽑아 `git diff --exit-code`를 본다.

**DB 없이 무는 대조를 따로 세웠다.** `tests/lint/database-types.ts`가 마이그레이션이 만든 표·뷰·함수를 생성 타입과 이름으로 맞춘다 — Docker 없는 자리에서도 물어서, 마이그레이션을 더하고 `pnpm types`를 안 돌린 PR이 `pnpm test`에서 걸린다. 같은 파일이 `SupabaseClient`를 직접 가져오는 파일도 잡는다. 둘 다 일부러 깨뜨려 무는 것을 확인했다.

**클라이언트를 받는 자리 스물아홉이 `Db`가 됐다.** `Db = SupabaseClient<Database>`고 `src/shared/api/database.ts`가 내놓는다. 맨 `SupabaseClient`는 스키마가 `any`라 `from("없는표")`도 `tsc`를 통과했다. 타입을 물리자 integration 테스트에서 오류 스물아홉이 드러났고 — 함수 이름을 `string`으로 받는 헬퍼, 인자 없는 함수에 `{}`, RLS가 막는 것을 보는 insert가 필수 열을 안 채운 자리 — 전부 단언을 그대로 두고 타입만 맞췄다.

**생성기가 함수 인자의 nullable을 못 적는다.** `pg_proc`에 그 정보가 없어서 NULL을 받는 인자도 non-null로 나온다. `check_in`의 `p_lat`·`p_lng`·`p_qr_code`와 `decide_excuse`의 `p_reason`이 그 자리고, SQL에 `default null`을 적어 생성 타입이 선택 인자로 내게 했다 — 호출자가 그 키를 빼고 부르면 PostgREST가 SQL 기본값으로 채워서 DB에 가는 값이 같다. 배포 전이라 `20260922091505_attendance_functions.sql`을 직접 고쳤다(`is_approved()` 때와 같은 판단이다).

**`ready`에 기계만으로 닫을 것이 안 남았다.** 남은 것은 전부 실기기 확인이나 사람의 판단 뒤다.

**`edge-function-import`가 닫혔다 — 결론은 「못 한다」다.** edge-runtime 컨테이너가 `supabase/functions` 하나만 마운트해서(`docker inspect`로 확인) `deno.json`이 `../../src/`를 맵핑해도 그 경로가 컨테이너 안에 없다. **맵핑 자체는 돈다** — `_shared/` 안쪽을 가리키면 통했다. 심볼릭 링크도 타깃이 마운트 밖이라 끊긴다.

**복사도 `cp`만으론 안 된다.** Deno가 import에 `.ts` 확장자를 요구하는데 `src/`는 확장자를 안 적어서 `Maybe add a '.ts' extension`으로 부팅이 깨진다. 확장자를 붙여 옮기니 통했다 — 복사 단계가 옮기면서 import 지정자를 고쳐야 한다는 뜻이고, 그 단계는 `notification-push`의 plan 몫이다. 결론은 [notification/design.md 「푸시 보내기」](2-design/modules/notification/design.md#푸시-보내기)가 든다. 스파이크 파일은 지웠다.

**`font-subset`이 닫혔다.** Wanted Sans 넷 합계가 **9,256KB에서 1,753KB로 줄었다** — 7.3MB가 설치 크기에서 빠졌고 `pnpm bundle`의 자산 목록으로 서브셋만 들어간 것을 확인했다. 원본은 `assets/fonts/`에 남고 앱은 `assets/fonts/subset/`을 읽는다.

남긴 글자는 2,527자고 **집합의 정본이 `tests/lint/font-subset.ts`다** — 상용 2,350자를 표로 안 적고 EUC-KR 완성형 영역(lead `0xB0`–`0xC8`, trail `0xA1`–`0xFE`)을 디코더로 풀어 낸다. 만들어진 `.ttf`의 `cmap`을 읽어 그 집합이 다 들었는지 `pnpm test`가 본다 — 글자가 빠지면 그 자리만 시스템 서체로 떨어지고 앱이 안 죽어서 다른 검사가 못 잡는 자리다.

**상용 2,350자가 기준인 근거가 실측으로 확인됐다.** 음절 11,172자를 다 넣으면 Regular 한 장이 9%만 줄고(2,345KB → 2,129KB), 상용만 남기면 81% 줄었다(→ 443KB). 대신 **이름이 상용 밖 음절을 쓰는 사람은 그 글자만 기기 기본 서체로 떨어진다** — 실제로 생기면 그 음절을 집합에 더해 다시 만든다.

**시안이 쓰는 닫기 기호가 원본 서체에 없다.** 「✕」(U+2715)가 Wanted Sans에 없어서 서브셋에 담을 수 없고 지금도 시스템 서체로 떨어진다 — `cmap` 실측에서 드러났다. 「×」(U+00D7)나 「✗」(U+2717)로 바꾸는 것을 `sian-sync`가 받아뒀다.

**`typed-routes-gate`가 닫혔다.** `.expo/types/`가 `.gitignore` 안이라 CI에 라우트 타입이 없었고, 없으면 `Href`가 `string`으로 떨어져 `router.replace("/없는경로")`가 `pnpm typecheck`를 통과했다. 만드는 명령은 `expo customize tsconfig.json`이다 — Expo CLI의 `setupTypedRoutes`가 Metro나 개발 서버 없이 도는 진입점이 그것 하나고 `expo export`(= `pnpm bundle`)로는 안 생긴다. `pnpm routes:types`가 그것을 부른 뒤 **생성물을 다시 읽어 판정한다** — 생성이 조용히 실패한 상태와 정상 상태가 종료 코드로는 구별되지 않아서다. 판정 규칙 넷은 `tests/lint/route-types.ts`에 있고 [execution.md](4-test/execution.md#pnpm-routestypes)가 근거를 든다. 이것이 `claimed-guards-audit`이 남긴 습관의 첫 적용이다 — 「검사가 잡는다」를 적을 때 잡는 파일 이름을 같이 적었다.

**spec 게이트는 열렸지만 그것으로 화면 task가 풀리지 않는다.** 화면이 있는 task 스물하나 전부에 spec이 서고 `approved`다 — 남은 미작성은 cron·Edge Function·배포 문서처럼 화면이 없는 것뿐이다. `spec-gate.py`가 이제 `feat/<슬러그>` 브랜치의 `src/` 쓰기를 통과시킨다. 그래도 화면 task 열넷은 여전히 `expo-scaffold`(실기기 확인 — 사람 손)에 막혀 있다. spec은 게이트 조건 중 하나였을 뿐이고, 그 조건이 풀렸다고 남은 조건까지 풀리지는 않는다.

**안드로이드 실기기 확인을 한 번 돌렸고 결과가 [evidence](4-test/evidence/expo-scaffold.md)에 있다.** 저장소 첫 evidence 파일이다. AC-04(기기 다크 모드를 따른다)와 AC-09(세션 없이 열면 `/login`)가 닫혔다 — AC-04는 plan이 「v4의 `[data-theme]`는 네이티브가 거부한다」를 근거로 `prefers-color-scheme`로 옮긴 자리라 그 옮김이 도는 것을 처음 본 것이다.

**남은 것이 셋으로 갈린다.** iOS는 **Expo Go로 영영 안 된다** — App Store의 Expo Go가 SDK 54에서 멈췄고 프로젝트는 57이다([Expo Go의 한계](4-test/execution.md#expo-go의-한계)). 개발 빌드가 서야 AC-01의 iOS 절반이 닫히고, 같은 빌드가 Maestro 플로우 실행도 막고 있다. AC-07·AC-08은 로그인이 필요한데 로컬 Supabase에 구글 프로바이더가 없다. AC-02·AC-03의 팔레트 대조·AC-05·AC-10은 잴 조각과 누를 조각이 화면에 서야 판정할 수 있어 첫 화면 task를 기다린다 — 자리표시자로 통과를 적지 않는다.

**AC-05는 통과로 안 적었다.** 글자가 그려지는 것이 서체 로드의 증거가 아니다 — `shouldRenderApp`이 `loaded || error !== null`이라 서체가 실패해도 화면이 그려진다.

**AC-04의 「앱에서 덮는다」를 `profile-screen`으로 넘겼다.** 골격의 몫은 기기 설정을 따르는 것까지고, 고르는 자리가 `/me`라 고를 수 없는 값을 저장하는 배선은 검증할 수 없다. `profile-screen` AC-05가 그 조건을 이미 들고 있어 spec은 안 고쳤다.

`payroll-data`는 `rehearsal`이 화면(`/me/rehearsals`)을 들어 이 병목에 묶인다.

**구글 로그인 왕복은 별도로 막혀 있다.** 로컬 Supabase에 구글 프로바이더가 없어 `/auth/v1/authorize`가 400으로 끝난다 — 실 Supabase 프로젝트와 구글 OAuth 클라이언트가 서야 보이고, 그 자리는 [environments.md Q-01·Q-03](5-deploy/environments.md#q-01)이다.

**`sian-native-pass`도 `active`로 남아 있다.** 시안 열여섯이 ADR-012(브랜드 파랑, 헐거운 밀도) 기준으로 갱신돼 아티팩트로 올라갔고 사람의 승인을 기다린다.

**`plans-restate`는 `blocked`고 `expo-scaffold`가 선행이다.** 남은 plan 열둘이 골격 위에서 파일 배치와 검증 명령을 채우길 기다린다.

## 재개 맥락

**spec 양식에 상태 격자가 들어갔다.** `## 상태 격자` 절 여덟 줄(빈 상태·로딩·실패·권한 없음·경계·재진입·동시 변경·성공 직후)과 AC별 「검증 층」 한 줄이 [2-design/README.md](2-design/README.md#spec)의 정본이고, `tests/lint/spec-grid.ts`가 이것이 찼는지 본다. 검사는 `status`로 안 가른다 — `### AC-NN`으로 조건을 나눈 spec이면 승인 뒤에도 격자를 다시 잰다. 승인을 면제 조건으로 두면 스물을 승인한 순간 검사 대상이 하나도 안 남는 구멍이 실제로 났었다. AC를 안 나눈 옛 명세 `login-screens.md`만 밖이다.

**화면이 있는 task 전부에 spec이 섰다 — 스물하나, 전부 `approved`.** 새 양식으로 걸린 빈 자리들 — `profile-form`(보내는 사이 차단되면 `submit_profile`의 `not_allowed`), `members`(마지막 관리자를 누르는 순간 서버가 다시 센다), `attendance-qr`(관리자 둘이 잇따라 뽑으면 먼저 인쇄한 종이가 그 순간 죽는다), `notification-settings`(권한 상태를 읽는 동안 스위치를 꺼진 모양으로 두면 끈 것처럼 보인다), `stats-admin`(일부 달만 읽기 실패하면 값 없는 달과 모양이 같아 안 갈린다), `payroll-view`·`stats-*`(쓰기가 없어 「성공 직후」가 해당 없음). 승인 근거 절마다 기준점 커밋과 승인 범위, 그 spec이 스스로 든 제한이 적혀 있다 — 승인 판정 자체는 총괄이 세션에 위임했다.

**완료 조건의 자리를 spec 하나로 좁혔다.** 살아 있는 기능 plan 열둘이 완료 조건 104개를 중복으로 품고 있었다 — [3-build/README.md](3-build/README.md)가 「완료 조건은 spec과 `2-design/`이 정본이라 여기 다시 적지 않는다」고 이미 적었는데 지키는지 볼 수 있는 문장이 아니었다. 판정을 절 이름으로 풀었다 — 기능 plan에 `## 완료 조건` 절이 있으면 그 기능의 spec이 없다는 뜻이고, 열둘은 `## 구현 산출물`이 됐다. AC 번호와 본문은 안 건드려서 `attendance-excuse`가 무는 `schedule-worker.md#ac-09`가 그대로 산다.

**데이터 task 셋이 전부 들어갔다** — `schedule-data`([PR #386](https://github.com/tkyoun0421/la-bie-belle/pull/386)), `attendance-data`([PR #387](https://github.com/tkyoun0421/la-bie-belle/pull/387)), `notification-data`([PR #388](https://github.com/tkyoun0421/la-bie-belle/pull/388)). 선행 없는 데이터 task가 더 없다.

**`plan-sources-gate`와 `claimed-guards-audit`가 닫혔다.** `findImpacted`가 이제 `doc.tracked`를 보고, spec은 `status: approved`, plan은 완료 머리글이 없으면 추적 대상이다. `claimed-guards-audit`([PR #390](https://github.com/tkyoun0421/la-bie-belle/pull/390))는 정본이 「기계가 지킨다」고 적은 주장 서른다섯을 훑어 구멍 셋을 메웠다 — RLS를 안 켠 표를 잡는 `tests/lint/table-rls.ts`, 전화번호 형식 제약과 `invalid_phone`, `notifications`의 부분 unique다. 새 주장을 적을 때 파일 이름을 같이 적는 것이 이 감사가 남긴 습관이다.

**승인 전에 불려야 하는 함수가 있다.** 알림 함수 넷이 `is_approved()`를 안 쓴다 — [NTF-016](2-design/modules/notification/README.md#ntf-016)이 알림 켜기를 승인 대기 화면에 뒀고 [NTF-006](2-design/modules/notification/README.md#ntf-006)의 가입 승인이 승인 전에 가야 하는 유일한 알림이라, 승인을 요구하면 그 알림이 배달 경로를 잃는다. 대신 `auth.uid()`로 프로필이 잡히고 `blocked_at`·`left_at`이 둘 다 널인지를 본다. [data-access.md 「함수 안의 규칙」](2-design/system/data-access.md#함수-안의-규칙)에 조항으로 섰고 `submit_profile`이 전례다.

**기기 주소는 사람이 아니라 기기를 가리킨다.** 한 기기를 A가 쓰다 로그아웃하고 B가 로그인하면 Expo가 같은 문자열을 준다 — `save_push_token`의 upsert가 `token` 충돌에서 `profile_id`를 부르는 사람으로 옮기지 않으면 A의 알림이 B의 폰에 뜬다.

**퇴사자가 승인된 사람과 똑같이 읽히던 것을 고쳤다.** `is_approved()`가 `left_at`을 빠뜨렸던 자리를 `schedule-data`에서 잡아 `20260825162027_profiles.sql`을 직접 고쳤다(배포 전이라 마이그레이션을 고치는 것이 되돌리기다). `is_admin()`은 아직 `role`만 본다 — 같은 계약을 어기고 있고 `members-pending`이 받아뒀다.

**총괄이 정할 것 둘이 여전히 열려 있다.** [navigation Q-03](2-design/system/navigation.md#q-03) — 종이 QR을 앱 없는 기기로 찍으면 무엇이 뜨나. [runtime Q-01](2-design/system/runtime.md#q-01) — 오래 안 열었다 여는 앱이 무엇을 다시 읽나.

회차 기록은 `docs/log/2026-09-23.md`다. 그 앞 [2026-09-22](log/2026-09-22.md)가 서체·세션·딥링크·진입 판정을 세웠고, 이번 회차는 네 갈래다 — spec 양식에 상태 격자를 더하고 화면 task 스물의 spec을 세워 승인한 것(#391·#392), `claimed-guards-audit`이 사실로만 남기고 넘긴 자리를 포함해 기계만으로 닫히는 task 다섯을 마저 닫은 것(#394~#398: 라우트 타입 게이트, 서체 서브셋, Edge Function import 불가 확인, 생성 타입 대조, 파일 이름 규약), e2e 러너를 Maestro로 정해 `e2e-runner`를 닫은 것(#400), 그리고 lint 규칙 표를 저장소로 들이고 승인 대기 문안을 1차 기준에 맞추고 관리자 홈을 문서·시안 둘 다 근무표에서 갈라낸 것(#404~#407) — 마지막 갈래에서 `navigation.md`·`components.md`처럼 팬아웃이 큰 문서를 건드리면 「영향 확인」 게이트가 받는 문서 서른한 개의 이름을 본문에 하나씩 요구한다는 것이 드러났다([관찰 018](observations/018-sources-impact-basename-cost-scales-with-fanout.md)).

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
