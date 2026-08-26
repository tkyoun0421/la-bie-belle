# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

`docs/domain/`의 여섯 파일이 전부 첫 인터뷰를 돌았다. 급여를 시작으로 근무표·교대·출근·계정·알림 순서로 채워졌고, 급여 인터뷰 도중 "앱이 내는 급여는 지급 근거가 아니라 근무자용 예상치"라는 전제가 뒤집혀 나머지 다섯 파일의 결이 그 위에서 다시 잡혔다. `payroll.md`를 잠갔던 "이 절이 다 채워지기 전에는 급여 계산 코드를 쓰지 않는다"가 풀려 급여를 포함한 도메인 규칙 쪽 자물쇠가 전부 열렸다.

각 파일에 인터뷰 도중 새로 열린 미정 항목이 남아 있다. 급여는 공휴일 API 실패와 임시공휴일 처리, 근무표는 확정 뒤 날을 새로 여는 경우, 교대는 요청 겹침과 재요청, 출근은 사유 승인 거절과 QR 교체 인지, 계정은 차단 해제·퇴사 상태 로그인·계정 잇기, 알림은 알림 끈 사람에 대한 관리자 인지와 금요일 알림 겹침이다. 전부 계산이나 화면 흐름을 막지 않는 자리다.

알고 남긴 구멍이 둘 있다. 급여 쪽은 연장 기준 9시간·가산 중복 없음·야간 없음·공휴일 없음·주휴 없음·휴게 무공제 여섯이 5인 이상 사업장의 법정 기준과 어긋난다. 출근 쪽은 고정 QR이 원격에서도 사진 한 장으로 뚫릴 수 있다. 둘 다 `docs/domain/`에 왜 이렇게 정했는지와 함께 남아 있다.

subagent 자동 스폰이 상시 요청으로 풀렸다. `CLAUDE.md`에 총괄이 스스로 판단해 부르는 게 기본이라고 박혀 있고, `docs-researcher`·`explorer`·`web-researcher` 정의문의 description도 "일이 생기면 먼저 스폰한다"로 갈렸다.

Supabase 바탕은 지난 회차 그대로다. `profiles` 테이블 하나와 RLS 정책 둘과 가입 트리거가 `supabase/migrations/`에 있다. select 정책은 본인 행이면 승인 전이든 후든 항상 보여주고, update 정책은 본인 행에 한해 열리되 `approved_at`은 컬럼 권한으로 잠가 자가발급을 막는다. integration 층은 `__tests__/<이름>.integration.test.ts` 자리에서 `pnpm test:integration`으로 돌고, CI는 lint → test → integration → build → e2e 다섯 단계다.

제품 코드는 여전히 integration 테스트 한 파일(`src/entities/profile/dals/__tests__/profile.integration.test.ts`)뿐이다. `dals` 실행 코드도 화면도 없다.

## 다음 첫 수

디자인 레퍼런스 검토다. 도메인 규칙 여섯이 다 채워져 기능 쪽 자물쇠는 풀렸지만, 디자인이 먼저 서면 퍼블리싱이 기능과 병렬로 붙는다. 사람이 그쪽을 먼저 치우기로 정했다.

`docs/design-system/`에는 지금 `README.md`(순서·퍼블리싱·검수 루프 규칙)뿐이고 시안 방향도 디자인 시스템 문서도 없다. 레퍼런스를 모으는 일은 `web-researcher`에 스폰하고, 어느 방향으로 갈지는 사람이 고른다. 고르고 나면 디자인 시스템 문서 전개를 스폰한다.

기능 task는 그다음이다. 계정(가입과 승인)이 가장 밑바닥이라 다른 화면이 전부 그 위에 선다.

## 열린 결정

- 도메인 규칙의 미정 항목은 `docs/domain/`의 각 파일 "아직 안 정한 것" 절이 정본이다. 여기 옮겨 적지 않는다.
- 관리자 승인 경로가 없다. 컬럼 권한은 역할 단위라 `authenticated`에 `approved_at`을 열면 관리자든 아니든 다 열린다. `security definer` 함수로 가야 한다. 지금 스키마는 그 문을 안 열어뒀다.
- integration 테스트가 사용자를 안 치운다. `tests/integration/supabase.ts`가 사용자를 만들기만 하고 치우는 길을 안 준다. anon 키로는 `auth.users`를 못 지우고 프로필 행 삭제는 테스트가 지키는 바로 그 정책에 걸린다. 지우려면 service role이 필요한데 금지다. 한 번 돌 때 일곱이 로컬 DB에 쌓인다. 무작위 UUID라 지금은 무해하지만 "프로필 전체 목록" 같은 걸 검증하려 들면 걸린다.
- 로컬에서 연타하면 가입 rate limit에 걸린다. `supabase/config.toml`이 IP당 5분에 30번인데 한 번에 일곱을 쓴다. 5분 안에 네 번 넘게 돌리면 막힌다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- CI가 1분대에서 4분 36초로 늘었다. Supabase 이미지 pull이 대부분이다. `config.toml`의 analytics를 끄면 logflare와 vector가 빠져 줄지만, 실제로 아픈지 몇 회차 겪고 정하는 편이 낫다.
- `authenticated`에 `profiles` 테이블 단위 insert와 delete 권한이 열려 있다. 정책이 없어 RLS가 전부 막는 구조다. 지금은 기본 거부라 안전하고 테스트가 delete 쪽을 지킨다.
- 디자인 시안 방향 — 사람이 레퍼런스를 검토한 뒤 정한다.
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다.
- `~/orca/workspaces/la-bie-belle/ladyfish` worktree — 61d7703에 멈춰 있다. 살릴 작업이 있는지 사람이 판단할 몫이다.
- `playwright.config.ts`의 CI 리트라이 2 — 지금은 e2e가 하나뿐이라 티가 안 나지만, 리트라이는 불안정한 테스트를 가려준다. spec이 쌓이면 유지할지 정한다.

## 주의

- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- shadcn CLI 기본 preset(base-nova)이 Radix 대신 `@base-ui/react` 기반이다. 디자인 시스템 방향 결정 때 참고.
- 새 개념이 코드에 등장하면 먼저 `docs/domain/`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/spec/<task>.md`로 승격한다(ADR-002). 첫 기능 task부터 이 기준을 적용한다.
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
