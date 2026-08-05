# P0-T05 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-06
- 개발 설계 승인: user, 2026-08-06 (revision 2 재승인)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. |
| 2 | 2026-08-06 | 구현 전 프로토타입 검증에서 worker가 발견한 기존 문서 결함 8건을 반영해 재승인했다(사용자 결정). ① heading 존재·제목 일치 검사를 `product_approval`이 기록된 task로 한정한다 — phase 절은 기획 단계에 처음 만들어지므로 proposed task에 heading을 요구하는 규칙이 워크플로와 모순이었다(P0-T36·P7-T09 위반 3건 자연 해소). ② 실결함 2파일 수정을 범위에 편입한다 — `docs/execution/runs/P0-T29/handoff.md`의 내부 링크 5건 경로 깊이 수정(깨진 참조의 기계 수정, done task의 승인·이력 불변), `docs/execution/phases/01-identity-and-staff.md`의 P1-T06 heading을 index 제목("휴면 계정 상태와 접근 차단")으로 정합. 두 파일을 변경 허용 경로에 추가했다. spec_refs·순환 검사는 오탐 0으로 설계 그대로다. |

- 관련 spec: DOCS:SDD, ADR:0001
- 적용 깊이: 일반 (CI 구성·검사 스크립트·문서 정정. DB·권한·캐시 경로 없음 — db:test는 기존 pgTAP 실행일 뿐 스키마 변경 없음)
- test mode: verification (index 등록 그대로. 신설 검사 로직은 harness self-test가 회귀 보호)
- 예정 check IDs: verify, index-failure-fixtures (index 등록 그대로)

## Requirements

### 범위와 비목표

- 범위: `.github/workflows/ci.yml`(병렬 2 job — 사용자 결정), 신설 문서 검사 명령 `check:docs`(순환·제목 일치·spec_refs 유효성·내부 링크)와 harness self-test 실패 fixture, `verify` 체인 개편(경계 검사 2종 편입·중복 빌드 제거), `no-console` error 격상, Playwright `reuseExistingServer` CI 정합, TOOLING.md 가드 서술 정정.
- 비목표(기획 승인 그대로): 루트 `tests/`·설정 파일의 도구 대상 편입, Vercel 배포·CD, 게이트 4종 체계 재편(신설 검사는 pre-commit 게이트로 승격하지 않는다).
- 설계 비목표: Markdown 링크의 heading anchor 유효성 검증(파일 존재만 검사 — anchor는 한국어 slug 규칙 의존이라 후속 소유, 미결에 기록), 기존 `gate:index` 검사의 재구현·이동.

### 불변 규칙

- CI는 로컬 `pnpm verify`와 같은 명령을 실행한다 — CI 전용 검증 논리를 워크플로 YAML 안에 두지 않는다. 유일한 CI 전용 단계는 migration 검증(`db:test`)이다(사용자 결정).
- CI 부팅 환경변수는 `.env.example` 복사로 만든다. GitHub secrets를 도입하지 않는다(공개 로컬 데모 값 — P0-T04 확정).
- 신설 검사는 이번 커밋의 기존 결함 수정(P0-T29 링크·P1-T06 heading) 후 저장소 전체에서 위반 0으로 통과해야 한다. 위반 검출력은 self-test의 의도적 실패 fixture가 증명한다. (revision 2)
- production 빌드는 `verify` 실행당 정확히 1회다.

### 기술 인수 조건

- `pnpm check:docs`가 ① 의존성 순환 ② index task와 phase 문서 heading(`### <id>. <제목>`)의 존재·제목 일치 — `product_approval`이 기록된 task에 한정(proposed 면제, revision 2) ③ `spec_refs` 유효성(접두별 실제 문서 대조) ④ docs 내부 상대 링크의 대상 파일 존재를 검사하고, 위반 시 exit 1과 파일·행 단서를 출력한다.
- harness self-test가 4종 검사 각각에 대해 의도적 실패 fixture로 검출(RED 상당)과 현재 저장소 통과(오탐 대조군)를 단언한다.
- `pnpm verify`가 `check:docs`·`check:app-build`·`check:client-secret-scan`을 포함하고 production 빌드를 1회만 실행한다. 두 check 스크립트는 단독 실행 시 여전히 자체 빌드로 동작한다.
- `eslint.config.mjs`의 `no-console`이 error다(`src/`에 console 사용이 없어 기존 통과 유지).
- `playwright.config.ts`의 `reuseExistingServer`가 CI에서 false다(`!process.env.CI`).
- `.github/workflows/ci.yml`이 push(main)·pull_request에서 `app-verify`(pnpm verify)·`db-verify`(supabase start + pnpm db:test) 2 job을 병렬 실행하고, 어느 한쪽 실패가 워크플로 실패다.
- TOOLING.md의 tdd-guard 서술이 축소된 구현(세그먼트 `__tests__/` 단일 인정, `config/fsd.json`의 `testPlacement` 계약)과 일치한다.

### 위험 기반 테스트

| 위험 | 검증 |
| --- | --- |
| 신설 검사가 정상 문서를 깨졌다고 오탐한다 | self-test 오탐 대조군 — 실제 저장소 트리에 대해 `check:docs`가 위반 0으로 통과함을 단언 |
| 실패 fixture가 공허하다(검사기가 실제로 못 잡는데 통과로 보인다) | fixture마다 정확히 그 위반 1종이 보고되는지 self-test가 위반 메시지 내용까지 단언 (`index-failure-fixtures`) |
| 중복 빌드 제거가 check 스크립트 단독 실행을 깨뜨린다 | 스크립트 단독 실행(자체 빌드)과 verify 내 실행(빌드 재사용) 두 경로를 모두 수동 재현해 handoff에 기록 |
| CI 환경이 로컬과 달라 verify가 CI에서만 실패한다 | 브랜치 push로 실제 워크플로 실행 성공을 확인하고 실행 URL을 handoff에 기록 (`verify`) |
| supabase CI 기동 실패·지연 | setup-cli 버전 고정, job 분리로 앱 검증에 영향 없음, db-verify 실행 성공 URL 기록 |

### DEV-* 적용 상태

- `DEV-CODE-07`(주석 금지)·`DEV-NAME-06`(alias import)·`DEV-TEST-06`(`__tests__/` 배치)은 harness·scripts 코드가 `src/` 밖이라 lint 강제 대상은 아니나 관행으로 따른다(주석 금지는 리뷰로 지킨다).
- `DEV-SSOT-01`: 검사 로직은 `harness/lib/`에 두고 명령 진입점은 얇게 유지한다(기존 gates 구조 관행).

## Architecture

- `harness/lib/docs-check.ts` (신규): 검사 4종의 로직. 기존 `task-index.ts`(index 파싱)·`violation.ts`(위반 형식)·`glob.ts`를 재사용한다.
  - 순환: `depends_on` 그래프 DFS로 사이클 검출, 사이클 경로를 메시지에 담는다.
  - 제목 일치: `product_approval`이 기록된 task에 한해, `doc` 필드가 가리키는 phase 문서에서 `### <id>. <제목>` heading을 찾아 부재·제목 불일치를 보고한다. proposed task는 phase 절이 기획 단계에 생기므로 검사 대상이 아니다. (revision 2)
  - spec_refs 유효성: 접두별 대조(Data model 참고). 미지의 접두도 위반이다.
  - 내부 링크: `docs/**/*.md`·`CLAUDE.md`·`README.md`의 상대 링크(`](...)`)에서 anchor(`#…`)를 뗀 대상 파일의 존재를 검사한다. 외부 URL(`http…`)은 제외.
- `harness/checks/docs.ts` (신규 디렉터리): 얇은 진입점. `package.json`에 `check:docs` 등록. gates 디렉터리에 두지 않는다 — pre-commit 게이트가 아님을 구조로 표현한다.
- `harness/self-test/docs-check.test.ts` (신규): fixture 기반. fixture는 임시 디렉터리에 최소 저장소 형태(index.jsonl + phase 문서 + 링크 문서)를 만들어 위반 4종을 각각 1개씩 재현하고, 실제 저장소 루트에 대한 오탐 대조군을 포함한다.
- `verify` 개편(`package.json`): `format:check → lint:ci → typecheck → test → harness:typecheck → harness:self-test → check:docs → build → check:app-build → check:client-secret-scan → test:e2e → gate:all`. 두 check 스크립트에 빌드 재사용 플래그(`--reuse-build`)를 추가해 verify에서는 직전 `build` 산출물을 검사만 하고, 단독 실행은 현행대로 자체 빌드한다. Playwright webServer도 기존 `.next`를 재사용한다(`pnpm start`).
- `eslint.config.mjs`: `no-console`을 error로. `eslint.config.ci.mjs`는 base를 spread하므로 자동 반영된다.
- `.github/workflows/ci.yml`: 트리거 push(main)·pull_request. `app-verify` job — checkout, pnpm/Node 설치(캐시), `pnpm install --frozen-lockfile`, Playwright 브라우저 설치(캐시), `cp .env.example .env`, `pnpm verify`. `db-verify` job — checkout, supabase CLI(setup-cli, 버전 고정), `supabase start`, `pnpm db:test`. 두 job은 독립 병렬이다.
- `docs/workflow/TOOLING.md`: 가드 탐색 서술을 "세그먼트 `__tests__/<대상>.test.<확장자>` 단일 인정(`config/fsd.json`의 `testPlacement` 계약이 정본)"으로 정정하고 P0-T38 이전 폴백 서술을 제거한다.

## Data model

`spec_refs` 접두별 유효성 규칙:

| 접두 | 대조 대상 |
| --- | --- |
| `ADR:<번호>` | `docs/standards/adr/<번호>-*.md` 파일 존재 |
| `PRD:<ID>` | `docs/product/PRD.md` 본문에 `<ID>` 문자열 존재 |
| `DOMAIN:<경계>` | `docs/product/DOMAIN.md` 본문에 `<경계>` 문자열 존재 |
| `DOCS:<이름>` | 허용 목록(`SDD`·`DDD`) 포함 여부 |
| 그 외 접두 | 위반 |

self-test 실패 fixture 4종(임시 디렉터리 생성):

| fixture | 위반 |
| --- | --- |
| 순환 | `A → B → A` depends_on |
| 제목 불일치 | index 제목과 phase heading 제목이 다름 |
| 잘못된 spec_refs | 존재하지 않는 `ADR:9999` |
| 깨진 링크 | 존재하지 않는 파일로의 상대 링크 |

## Interface

- `check:docs` 위반 출력은 기존 `violation.ts` 형식(파일·행·메시지·힌트)을 따른다. 통과 시 무출력 exit 0(기존 게이트 관례).
- check 스크립트 빌드 재사용은 `--reuse-build` 인자 1개다. 인자가 없으면 현행 동작(자체 빌드) 그대로다.
- CI job 이름은 `app-verify`·`db-verify`로 고정한다(향후 branch protection의 required checks 이름).

## Optimizations

- CI 캐시: pnpm store와 Playwright 브라우저를 캐시해 반복 실행 시간을 줄인다. 그 외 최적화 없음.

## 변경 허용 경로

```
.github/workflows/**
harness/checks/**
harness/lib/**
harness/self-test/**
package.json
pnpm-lock.yaml
playwright.config.ts
eslint.config.mjs
eslint.config.ci.mjs
scripts/**
docs/workflow/TOOLING.md
docs/execution/radio/P0-T05-radio.md
docs/execution/runs/P0-T05/**
docs/execution/runs/P0-T29/handoff.md
docs/execution/phases/01-identity-and-staff.md
docs/execution/phases/index.jsonl
```

## 미결 사항

- Markdown heading anchor 유효성 검증은 파일 존재 검사에서 제외했다 — 결정 주체: 후속 task(문서 검사 확장 필요가 생길 때), 반환할 단계: 해당 task 기획.
- main 직접 push 흐름에서는 CI가 사후 검증이다. "병합 차단"이 실효하려면 GitHub branch protection(required checks: `app-verify`·`db-verify`) 설정이 필요하며 이는 저장소 설정 화면의 1회 수동 작업이다 — 결정 주체: 사용자, 반환할 단계: P0-T05 종결 보고 시 안내.
- `db-verify`의 pgTAP 실행이 CI에서 유의미하게 느리면(supabase 기동 포함) 트리거 축소(PR만)를 후속 결정한다 — 결정 주체: 조정자+사용자, 반환할 단계: 실측 후.
