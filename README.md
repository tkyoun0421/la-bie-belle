# la-bie-belle

작은 매장의 근무표·출근·급여를 한곳에서 보는 웹 앱이다. 근무자는 근무표를 보고 신청하고 출근을 찍고 급여를 확인한다. 관리자는 근무표를 만들어 확정하고 가입과 사유를 승인한다. 무엇을 만드는지는 [PRD](docs/1-plan/prd.md)에, 용어와 규칙은 [modules](docs/2-design/modules/)에 있다.

## 실행

Node 22, pnpm 8.15.2. 로컬 Supabase는 Docker가 필요하다.

```sh
pnpm install
cp .env.example .env        # 로컬 Supabase 값을 채운다
pnpm dev
```

- `pnpm lint` · `pnpm typecheck` · `pnpm test` — 코드와 문서 검사
- `pnpm test:integration` — 로컬 Supabase를 띄우고 붙는 테스트
- `pnpm e2e` — Maestro 플로우. 기기나 시뮬레이터에 앱이 올라가 있어야 돈다

clone 뒤 한 번 `git config core.hooksPath .githooks`를 돈다. 시크릿 패턴과 포맷을 커밋 전에 검사한다.

## 문서

- [CLAUDE.md](CLAUDE.md) — 문서 지도. 무엇이 어디 있는지의 정본
- [docs/handoff.md](docs/handoff.md) — 지금 상태와 다음 첫 수
- [docs/backlog.md](docs/backlog.md) — task 보드

이 저장소는 공개다. 문서와 시안의 이름·전화번호·좌표는 전부 가짜다.
