# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

Supabase 바탕이 섰다. `profiles` 테이블 하나와 RLS 정책 둘과 가입 트리거가 `supabase/migrations/`에 있다. 가입하면 트리거가 짝 프로필을 만들고 `display_name`과 `approved_at`은 비워둔다. select 정책은 본인 행이면 승인 전이든 후든 항상 보여주고, update 정책은 본인 행에 한해 열리되 `approved_at`은 컬럼 권한으로 잠가 자가발급을 막는다. 승인 여부는 참거짓 컬럼이 아니라 `approved_at`이 비었는지로만 판정한다.

integration 층이 실제로 돈다. 자리는 대상과 같은 레벨의 `__tests__/<이름>.integration.test.ts`이고, `pnpm test:integration`이 로컬 Supabase를 띄워 돈다(`supabase start && supabase migration up && vitest run --project integration`). `tdd-guard-unit.py`가 이 확장자를 unit 테스트와 나란히 짝으로 인정한다. CI는 lint → test → integration → build → e2e 다섯 단계다.

subagent가 열하나가 됐다. `integration-test-writer`가 늘었고, `test-planner`와 `implementer` 정의문에 integration 층을 다루는 절이 들어갔다.

`test-planner` → writer 셋 → `implementer` → `pr-diff` 흐름이 이번에 처음 코드 위에서 한 바퀴 돌았다. 다음 기능 task부터는 이 길이 이미 닦여 있다.

제품 코드는 아직 없다. `src/` 아래에는 integration 테스트 한 파일(`src/entities/profile/dals/__tests__/profile.integration.test.ts`)뿐이고 `dals` 실행 코드도 화면도 없다.

## 다음 첫 수

사람이 다음 중에서 고른다.

- 디자인 레퍼런스 검토 — `plan.md`에 남은 task다. 시안 방향을 사람이 정한다.
- 첫 화면 task 쪼개기 — 바탕이 섰으니 실제 기능으로 들어간다. 온보딩(이름 넣기)과 관리자 승인이 가장 앞에 있다. 지금 스키마가 그 둘을 이미 반쯤 받치고 있다.

## 열린 결정

- 관리자 승인 경로가 없다. 컬럼 권한은 역할 단위라 `authenticated`에 `approved_at`을 열면 관리자든 아니든 다 열린다. `security definer` 함수로 가야 한다. 지금 스키마는 그 문을 안 열어뒀다.
- integration 테스트가 사용자를 안 치운다. `tests/integration/supabase.ts`가 사용자를 만들기만 하고 치우는 길을 안 준다. anon 키로는 `auth.users`를 못 지우고 프로필 행 삭제는 테스트가 지키는 바로 그 정책에 걸린다. 지우려면 service role이 필요한데 금지다. 한 번 돌 때 일곱이 로컬 DB에 쌓인다. 무작위 UUID라 지금은 무해하지만 "프로필 전체 목록" 같은 걸 검증하려 들면 걸린다.
- 로컬에서 연타하면 가입 rate limit에 걸린다. `supabase/config.toml`이 IP당 5분에 30번인데 한 번에 일곱을 쓴다. 5분 안에 네 번 넘게 돌리면 막힌다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- CI가 1분대에서 4분 36초로 늘었다. Supabase 이미지 pull이 대부분이다. `config.toml`의 analytics를 끄면 logflare와 vector가 빠져 줄지만, 실제로 아픈지 몇 회차 겪고 정하는 편이 낫다.
- `authenticated`에 `profiles` 테이블 단위 insert와 delete 권한이 열려 있다. 정책이 없어 RLS가 전부 막는 구조다. 지금은 기본 거부라 안전하고 테스트가 delete 쪽을 지킨다.
- 디자인 시안 방향 — 사람이 레퍼런스를 검토한 뒤 정한다.
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다.
- `~/orca/workspaces/la-bie-belle/ladyfish` worktree — 61d7703에 멈춰 있다. 살릴 작업이 있는지 사람이 판단할 몫이다.
- 퇴사자와 지난 근무표 보존 — 급여 때문에 생각보다 급하다. 사람이 나가도 지난 정산 기록은 남아야 하고 근무표에서는 안 보여야 한다. 첫 기능 task 전에 정하는 편이 낫다.
- `playwright.config.ts`의 CI 리트라이 2 — 지금은 e2e가 하나뿐이라 티가 안 나지만, 리트라이는 불안정한 테스트를 가려준다. spec이 쌓이면 유지할지 정한다.

## 주의

- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- shadcn CLI 기본 preset(base-nova)이 Radix 대신 `@base-ui/react` 기반이다. 디자인 시스템 방향 결정 때 참고.
- 새 개념이 코드에 등장하면 먼저 `docs/domain.md`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/spec/<task>.md`로 승격한다(ADR-002). 첫 기능 task부터 이 기준을 적용한다.
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
