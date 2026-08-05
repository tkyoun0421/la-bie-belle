# P0-T29 handoff

## 2026-08-03 · 설계(실행 직전 구체화) 종료

- 작업 식별자: P0-T29 (운영 의사결정 대시보드)
- 현재 단계: 설계 종료 → 다음 개발
- 기준 시각: 2026-08-03

### 확정된 사실

- 기획 승인(user, 2026-08-03 범위 확장 갱신)과 개발 설계 승인(user, 2026-08-03)이 모두 있고, 승인 정본은 `docs/execution/radio/P0-T29-radio.md`(revision 2)다.
- 승인 SHA-256 `4cf8c6cf3a7dd5e2d0b8d6a6f9e3ddfa678fff517aa24bafcb3e0b7e0c533bc7`과 실제 RADIO 파일 해시가 일치함을 실행 전에 확인했다. RADIO 본문은 수정하지 않는다.
- 의존 task 3개(P0-T28, P0-T31, P0-T32)가 모두 `done`이다.
- `docs/execution/phases/index.jsonl`에서 P0-T29를 `planned` → `in_progress`로 바꿨다. 같은 줄의 다른 필드와 다른 task는 손대지 않았다(`updated_at`은 이미 `2026-08-03`).
- 실행 환경: Node v22.14.0, pnpm 8.15.2, 기준 커밋 `ac68f255b2e4e2e36bc3d13e504edfb73b9d2c0e`, 작업 트리 clean.
- P0-T31의 실행 방식을 그대로 따른다. `node --experimental-strip-types --disable-warning=ExperimentalWarning`, `.ts` 확장자 import, erasable 문법만, 런타임 의존성 0개.

#### 구현 파일 목록 (RADIO Architecture 절의 구체화)

RADIO가 지정한 5개 모듈에 더해, 순수 계산 책임이 다른 두 조각을 별도 파일로 분리한다. 파일 목록 결정은
[운영 계약](../../../workflow/WORKFLOW.md#실행-직전의-구체화)이 이 단계에 맡긴 범위이며, 승인된 동작·범위는 바뀌지 않는다.

- `harness/dashboard/collect.ts` — 정본 수집. `index.jsonl`(+schema 검증은 게이트 재사용), 게이트 6종 실행 결과,
  `docs/execution/runs/**` 증거 존재 여부와 최신 handoff 미결 항목, `docs/execution/reviews/**`, 보류 ADR, git HEAD·작업 트리 상태.
- `harness/dashboard/rubric.ts` — 준비도 루브릭 100점 계산(4영역, 근거 수치 포함). 순수 함수.
- `harness/dashboard/reviews.ts` — P0-T32 결과 파일·backlog 파서. 순수 함수(부재·형식 오류 안전 처리).
- `harness/dashboard/progress.ts` — 진행도 집계(전체·phase별 완료율, 상태별 집계, `in_progress`, 실행 가능 후보, `blocked`). 순수 함수.
- `harness/dashboard/next-action.ts` — 단일 다음 행동 추천과 근거·차단 사유·대안 후보. 순수 함수.
- `harness/dashboard/render.ts` — 단일 자체 포함 HTML 생성(인라인 CSS/JS, 외부 리소스 0, 모바일 우선). 순수 함수.
- `harness/dashboard/main.ts` — 진입점. 수집 → 계산 → 렌더 → `docs/execution/dashboard/index.html` 기록, 경로 한 줄 출력.
- `package.json` — `dashboard` 스크립트 1개 추가.
- `CLAUDE.md` — Commands 절에 `pnpm dashboard`와 대시보드 산출물 설명 추가.
- `docs/standards/adr/0012-static-operations-dashboard.md` — 새 범위로 개정(보류 해제, 상태 Accepted, 개정 이력 명시).
- `docs/standards/adr/README.md` — ADR 표의 0012 상태 일치.
- `docs/workflow/WORKFLOW.md` — 대시보드 산출물 위치·재생성 시점 문구 정합(계약 의미 변경 없음).
- `docs/execution/dashboard/index.html` — 생성 산출물.
- `docs/execution/runs/P0-T29/handoff.md`(이 파일), `docs/execution/runs/P0-T29/tdd.json`.

계약 준수 40점은 `harness/lib/`의 게이트 판정 함수를 그대로 호출해 산출한다. 게이트 로직을 대시보드에 복제하지 않는다.

#### 테스트 목록과 작업 순서 (RED → GREEN 단위)

테스트는 기존 셀프테스트와 같은 집을 쓴다(`harness/self-test/`). 그래야 `pnpm harness:self-test` 회귀에 자동으로 포함된다.
각 단위는 "위반·경계 fixture 테스트 작성 → RED 기록 → 구현 → GREEN 기록" 순서다.
명령은 모두 `node --experimental-strip-types --disable-warning=ExperimentalWarning harness/self-test/<파일>`이다.

1. `dashboard-rubric.test.ts` (check `dashboard-rubric-test`) — 4영역 배점, 만점·0점 경계, 등급 경계(90/89/70/69),
   `legacy-v2` 제외와 재편 기준(P0-T30 이후) 필터, 증거 부분 보유 비율, 근거 수치 문자열 존재.
2. `dashboard-reviews.test.ts` (check `dashboard-parser-test`) — `example-review.json` 정상 파싱, 파일 부재("결과 없음"),
   깨진 JSON·필드 누락·점수 범위 위반·`agreed_by` 1명("형식 오류"), backlog 미완료·완료 줄 구분, task ID 형식이 아닌 파일 제외.
3. `dashboard-render.test.ts` (check `dashboard-render`) — 섹션 4종 제목, 기준 시각·기준 커밋 문자열, 모바일 viewport meta,
   외부 리소스 참조 0건, HTML 이스케이프.
4. `dashboard-progress.test.ts` (등록 check 밖의 추가 테스트) — 완료율·상태 집계, 실행 가능 후보 판정, 추천 우선순위와 차단 사유.

#### 실행 명령 (RADIO Interface 절의 구체화)

- 생성: `pnpm dashboard` → `docs/execution/dashboard/index.html` 경로 한 줄 출력, 실패 시 한국어 오류와 종료 코드 1.
- 등록 check 4종: 위 테스트 파일 1~3의 단독 실행 + `pnpm harness:typecheck`(`typecheck`).
- 회귀: `pnpm harness:self-test`, `pnpm gate:all`.

### 미결 사항

- 문서 신선도의 "기준 커밋 = 현재 HEAD 7점"은 생성 시점 기준으로 판정한다. 생성기는 산출물에 기록할 기준 커밋과 저장소 HEAD를
  같은 실행에서 읽으므로, 이 하위 점수는 git HEAD를 읽지 못할 때만 0이 된다. 커밋되지 않은 작업 트리 변경 여부는 점수에 반영하지 않고
  근거 문구로만 표시한다 — 사후 확인 주체: 사용자, 반환할 단계: 설계(불수용 시 RADIO Data model 절만 개정).
- 계약 준수 40점의 "게이트 6종" 중 `commit-msg`는 메시지 파일 인자가 필요해 `gate:all`에 없다. 대시보드는 HEAD 커밋 메시지를
  `checkCommitMessage`에 넣어 6번째 게이트로 판정한다 — 사후 확인 주체: 사용자, 반환할 단계: 설계.
- 그 밖의 새 제품·기술 결정은 없다. RADIO의 미결 사항도 "없음"이다.

### 다음 행동

1. 위 순서 1번(`dashboard-rubric.test.ts`)부터 RED → GREEN 사이클을 진행하고 매 실행을 `docs/execution/runs/P0-T29/tdd.json`에 기록한다.

### 증거·산출물 경로

- `docs/execution/radio/P0-T29-radio.md` (승인 정본, 수정 금지)
- `docs/execution/phases/index.jsonl` (P0-T29 = `in_progress`)
- `docs/execution/runs/P0-T29/handoff.md` (이 파일)

## 2026-08-03 · 개발 종료

- 작업 식별자: P0-T29
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-03

### 확정된 사실

- 4개 단위를 모두 RED → GREEN 순서로 구현했다. 실행 기록은 `docs/execution/runs/P0-T29/tdd.json`에 10건 남았다(RED 5, GREEN 5).
  - `dashboard-rubric.test.ts`: RED 10:23Z(12개 중 11개 실패) → GREEN 10:24Z(12/12)
  - `dashboard-reviews.test.ts`: RED 10:25Z(14개 중 8개 실패) → GREEN 10:26Z(14/14)
  - `dashboard-progress.test.ts`: RED 10:28Z(11개 전부 실패) → GREEN 10:29Z(11/11)
  - `dashboard-render.test.ts`: RED 10:29Z(12개 전부 실패) → GREEN 10:32Z(12/12)
  - `dashboard-rubric.test.ts` 2차: RED 10:34Z(보류 ADR·미결 부채 출처 표기 1개 실패) → GREEN 10:34Z(13/13)
- 각 단위의 RED는 위반·경계 fixture로 만들었다.
  - 루브릭: 4영역 배점, 만점·0점, 등급 경계 90/89/70/69, 게이트 결과 누락, 증거 대상 없음(0/0), 증거 부분 보유(3/4 → 19점), `legacy-v2`와 재편 이전(P0-T28) task 제외, 항목별 근거 문자열 존재.
  - 파서: `example-review.json` 정상 파싱, 파일 이름 규칙(`P0-T29-review.json` 인정 / `example-review.json` 제외), 깨진 JSON, 필수 필드 누락, 점수 범위·소수·영역 키 위반, `agreed_by` 1명, `participants` 1명, 알 수 없는 중요도·영역, 결과 없음, 형식 오류 표시, 최신 결과 선택, 중요도 그룹, backlog 미완료·완료 구분과 코드블록 예시 제외.
  - 렌더: 섹션 4종, 기준 시각·커밋, 커밋 누락 표시, viewport meta, 외부 리소스 0건, HTML 이스케이프, 근거 수치 표시, 결과 없음·형식 오류, 다음 행동·근거, `<details>` 접기, 실제 산출물 파일 계약.
- 구현 파일은 설계 단계 목록과 같다. `harness/dashboard/`의 `collect.ts`·`rubric.ts`·`reviews.ts`·`progress.ts`·`next-action.ts`·`render.ts`·`main.ts` 7개다.
- 게이트 재사용을 위해 `harness/lib/gate-suite.ts`에 `REPOSITORY_GATES`(id + 실행 함수 5종)를 추가하고 기존 `ALL_GATES`가 그 목록에서 파생되도록 바꿨다. 게이트 실행 순서와 동작은 그대로다. 대시보드는 이 목록을 그대로 호출하고, 6번째 게이트인 `commit-msg`는 HEAD 커밋 메시지를 `checkCommitMessage`에 넣어 판정한다.
- `pnpm dashboard` 명령을 `package.json`에 추가했다. 실행 방식은 P0-T31과 동일하다(`node --experimental-strip-types`).
- 문서를 정합화했다. [ADR-0012](../../../standards/adr/0012-static-operations-dashboard.md)를 revision 2로 개정해 상태를 `Accepted`로 바꾸고 개정 이력 표를 넣었다(위치·섹션 4종·루브릭 배점·advisory 원칙). `adr/README.md` 표, `docs/workflow/WORKFLOW.md`의 새 `운영 대시보드` 절과 리팩토링 단계 6번, `CLAUDE.md`의 Commands·구조·문서 표를 맞췄다.

### 미결 사항

- 설계 단계에 적은 2건(기준 커밋 점수의 판정 시점, `commit-msg` 게이트를 HEAD 메시지로 판정)이 그대로 유효하다.
- `docs/product/DESIGN.md`(16행)와 `docs/standards/ARCHITECTURE.md`(77~85행)에 "대시보드 구현체 없음 / ADR-0012 보류" 문구가 남아 있다. 두 파일은 이번 RADIO의 변경 허용 경로가 아니라 손대지 않았다 — 결정 주체: 사용자, 반환할 단계: 설계(다음 문서 task에서 두 줄 수정).
- `docs/execution/phases/00-foundation.md`의 P0-T29 절도 `현재 상태: design_pending`으로 남아 있다. 같은 이유로 변경 허용 경로 밖이다 — 결정 주체: 사용자, 반환할 단계: 설계.

### 다음 행동

1. 등록 check 4종(`dashboard-rubric-test`, `dashboard-parser-test`, `dashboard-render`, `typecheck`)과 `pnpm harness:self-test`·`pnpm gate:all` 회귀, 실제 `pnpm dashboard` 생성을 실행해 검증 단계를 마친다.

### 증거·산출물 경로

- `harness/dashboard/`(7개), `harness/self-test/dashboard-*.test.ts`(4개), `harness/lib/gate-suite.ts`
- `package.json`, `CLAUDE.md`, `docs/workflow/WORKFLOW.md`, `docs/standards/adr/0012-static-operations-dashboard.md`, `docs/standards/adr/README.md`
- `docs/execution/runs/P0-T29/tdd.json`

## 2026-08-03 · 검증 종료

- 작업 식별자: P0-T29
- 현재 단계: 검증 종료 → 다음 리팩토링
- 기준 시각: 2026-08-03

### 확정된 사실

- 등록 check 4종을 모두 실행해 통과했다(명령 앞부분 `node --experimental-strip-types --disable-warning=ExperimentalWarning`는 생략).
  - `dashboard-rubric-test`: `harness/self-test/dashboard-rubric.test.ts` → 13/13 통과, 종료 코드 0.
  - `dashboard-parser-test`: `harness/self-test/dashboard-reviews.test.ts` → 14/14 통과, 종료 코드 0.
  - `dashboard-render`: `harness/self-test/dashboard-render.test.ts` → 13/13 통과, 종료 코드 0. 생성된 `docs/execution/dashboard/index.html`을 직접 읽어 섹션 4종·기준 시각·40자 커밋·viewport meta·외부 리소스 0건을 확인하는 케이스를 포함한다.
  - `typecheck`: `pnpm harness:typecheck` → 오류 0건, 종료 코드 0.
- 회귀와 생성도 통과했다.
  - `pnpm harness:self-test`: 111개 전부 통과(기존 60개 + 이번 51개), 종료 코드 0.
  - `pnpm gate:all`: 출력 없이 종료 코드 0. `pnpm gate:tdd` 단독 실행도 종료 코드 0으로 `tdd.json` 형식을 확인했다.
  - `pnpm dashboard`: `docs/execution/dashboard/index.html` 한 줄 출력, 종료 코드 0.
- 변경 파일 21개를 모두 staged 상태로 두고 `pnpm gate:scope`를 실행해 종료 코드 0을 확인한 뒤 `git reset`으로 원복했다. 승인된 변경 허용 경로 밖 파일이 없다.
- 생성된 산출물의 실제 값으로 인수 조건을 확인했다.
  - 준비도 86점 · 양호. 계약 준수 40/40(게이트 6/6), 증거 완결성 25/25(증거 4/4), 실행 준비도 10/20(실행 가능 planned 0건, blocked 0건), 문서 신선도 11/15(기준 커밋 일치 7, 보류 ADR 0건 4, 미결 부채 15건으로 0).
  - 진행도 23/78 · 29%, phase P0 23/29 · 79%, 현재 `in_progress`는 P0-T29, 다음 후보 없음.
  - 검증 섹션은 `결과 없음`을 표시한다. 아직 `<task-id>-review.json`이 없고 backlog 미완료 항목도 없다.
  - 다음 행동은 "P0-T29를 마치고 done으로 전환한다"이며 근거·선행 조건이 함께 표시된다.
  - 상단에 기준 시각(ISO 8601)·기준 커밋 40자·작업 트리 상태가 표시된다. 커밋되지 않은 변경이 있으면 그 사실을 문장으로 알린다.
- 산출물은 9.7KB 단일 HTML이며 외부 리소스 참조가 0건이다(`http`, `<link`, `src=`, `@import`, `url(` 모두 없음). 모바일 우선 레이아웃이고 720px 이상에서만 본문 폭을 제한한다. 상세 의존성과 해결된 backlog는 `<details>`로 접혀 있다.
- 인수 조건 대응: 섹션 4종·근거 수치(DOCS:SDD, ADR:0012), 결과 부재·형식 오류 안전 표시(ADR:0012), 기준 시각·커밋 일치(ADR:0012), 읽기 전용·advisory(ADR:0011, ADR:0012), 모바일 정보 위계(ADR:0012).

### 미결 사항

- 개발 종료 시점의 미결 5건이 그대로 유효하다(기준 커밋 점수 판정 시점, `commit-msg` 게이트 판정 방식, `DESIGN.md`·`ARCHITECTURE.md`·`00-foundation.md`의 잔여 문구 3건).
- 준비도의 "미결 부채 0건" 4점은 현재 구조상 거의 항상 0점이다. 완료된 task의 handoff에 남은 사후 확인 항목이 계속 누적되기 때문이다. 부채 해소 경로(사용자 확인 후 handoff 갱신 또는 별도 목록)가 없다 — 결정 주체: 사용자, 반환할 단계: 기획(루브릭 의미 변경이므로 설계 단계 단독으로 정할 수 없다).

### 다음 행동

1. 동작을 바꾸지 않는 범위에서 중복과 명명을 정리하고 같은 검증을 다시 실행한다.

### 증거·산출물 경로

- `docs/execution/dashboard/index.html`
- `docs/execution/runs/P0-T29/tdd.json`
- `harness/self-test/dashboard-render.test.ts` (산출물 계약 케이스)

## 2026-08-03 · 리팩토링 종료

- 작업 식별자: P0-T29
- 현재 단계: 리팩토링 종료 → 다음 교차 검증(4단계 잔여 절차)
- 기준 시각: 2026-08-03

### 확정된 사실

- 관찰 가능한 동작을 유지한 채 정리했다.
  - `render.ts`: backlog 한 줄 포맷이 미완료·해결 목록에 복제돼 있어 `backlogLine`으로 합쳤다. `escapeHtml`은 모듈 밖에서 쓰지 않아 export를 없앴다. 빈 목록에 빈 문구를 넘기면 빈 `<p>`가 남던 것을 아무것도 렌더링하지 않도록 고쳤다. 진행률 막대 너비를 정수로 반올림해 `width:46.666666666666664%` 같은 값이 나오지 않게 했다.
  - `reviews.ts`: 발견 항목의 필드 오류 메시지에 `findings[n].` 접두사가 없어 어느 항목의 오류인지 알 수 없던 것을 고쳤다. backlog 파싱의 불필요한 `undefined` 비교를 없앴다.
  - `render.ts`가 소유하던 산출물 경로 상수 `DASHBOARD_PATH`를 렌더 모듈로 옮겨 `main.ts`와 산출물 검증 테스트가 같은 값을 쓴다.
- 정리 후 재검증 결과: check 4종 통과(13/13, 14/14, 13/13, 타입 오류 0), `pnpm harness:self-test` 111/111 통과, `pnpm gate:all` 종료 코드 0, `pnpm dashboard` 재생성 성공.
- 재생성한 산출물의 준비도는 86점 · 양호다. 감점은 실행 준비도 10점(실행 가능한 `planned` 0건 — P0-T29가 마지막 승인 task다)과 문서 신선도 4점(완료 task handoff의 미결 항목 누적)이다.
- **P0-T29는 `in_progress`로 남겼다.** [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 이 task 변경분의 3자 교차 검증이 아직 남아 있다. 검증 결과와 `done` 전환은 메인 에이전트가 교차 검증을 주관한 뒤에 처리한다.
- 이번 작업은 commit하지 않았다.

### 미결 사항

- 기준 커밋 점수(7점)의 판정 시점 — 생성 시점에는 항상 충족되므로 실질적으로 git HEAD를 읽지 못할 때만 0이 된다 — 사후 확인 주체: 사용자, 반환할 단계: 설계.
- `commit-msg` 게이트를 HEAD 커밋 메시지로 판정하는 방식 — 6종 통과율을 채우기 위한 선택이다 — 사후 확인 주체: 사용자, 반환할 단계: 설계.
- 준비도의 "미결 부채 0건" 항목에 부채 해소 경로가 없어 사실상 상시 0점이다 — 결정 주체: 사용자, 반환할 단계: 기획.
- `docs/product/DESIGN.md`, `docs/standards/ARCHITECTURE.md`, `docs/execution/phases/00-foundation.md`에 "대시보드 구현체 없음 / ADR-0012 보류 / P0-T29 design_pending" 문구가 남아 있다. 세 파일 모두 이번 RADIO의 변경 허용 경로 밖이라 손대지 않았다 — 결정 주체: 사용자, 반환할 단계: 설계.
- 산출물은 생성할 때마다 기준 시각이 바뀌므로 커밋 diff가 매번 발생한다. 재생성 시점 규칙(최종 상태·phase 경계 변경 후)을 지키면 문제되지 않지만, 불필요한 재생성은 피해야 한다 — 결정 주체: 사용자, 반환할 단계: 없음(정보).

### 다음 행동

1. 메인 에이전트가 [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 이 task의 변경분을 `main`·`codex`·`opus` 3자로 교차 검증하고 결과를 `docs/execution/reviews/P0-T29-review.json`과 backlog에 기록한다.
2. 교차 검증에서 `critical`이 없으면 P0-T29를 `done`으로 갱신하고, `pnpm dashboard`를 다시 실행해 최종 상태를 반영한 뒤 사용자에게 보고한다.

### 증거·산출물 경로

- `harness/dashboard/`(7개), `harness/self-test/dashboard-*.test.ts`(4개), `harness/lib/gate-suite.ts`
- `docs/execution/dashboard/index.html`
- `docs/execution/runs/P0-T29/handoff.md`, `docs/execution/runs/P0-T29/tdd.json`
- `docs/execution/phases/index.jsonl` (P0-T29 = `in_progress`)

## 2026-08-03 · 교차 검증 중간 중단(세션 종료)

- 작업 식별자: P0-T29
- 현재 단계: 검증(교차 리뷰 진행 중 세션 종료로 중단)
- 기준 시각: 2026-08-03 (기준 커밋 ac68f25, 작업 트리에 미커밋 구현 14개 파일)

### 확정된 사실

- [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 독립 리뷰 2자(main, opus)를 수행했다. codex는 미참여(플러그인 명령이 모델 호출 금지 설정) — 결과 기록 시 `participants_note`에 남길 것.
- opus 영역 점수: 코드 품질 84, 테스트 72, 보안 96, 성능 90, 아키텍처 정합 76. 최종 영역 점수 확정은 수정 반영 후 메인이 재판정한다.
- 2자 모두 인정한 확정 발견:
  - F-01 [high/architecture] 신선도 "기준 커밋 최신" 7점이 구조상 상시 만점 — `harness/dashboard/main.ts:43-44`가 같은 값을 양쪽 인자에 전달, `rubric.ts:231` 비교가 죽은 코드. ADR-0012 Consequences 문구와 모순.
  - F-02 [medium/architecture] 게이트 6종 중 scope·commit-msg는 생성 맥락에서 실패 불가 — 40점 중 약 13점이 상수 (`collect.ts:90`).
  - F-03 [medium/code_quality] 게이트 실행이 try/catch 밖 — git 부재 시 생성 전체 중단, RADIO "누락 표시 후 계속" 위반 (`collect.ts:92`).
  - F-04 [medium/tests] `collect.ts`·`main.ts` 무테스트, RADIO가 약속한 생성 명령 수준 테스트 부재.
  - F-05 [medium/tests] `runs/P0-T29/tdd.json` 마지막 GREEN(10:34Z)이 리팩토링 이후 최종 코드(≥10:38Z)를 안 덮음 — 수정 후 전체 GREEN 재기록 필요.
  - F-06 [low] `next-action.ts:64` 근거 문구가 미계산 "의존성 순서"를 단정 → "index 등록 순서"로 정정.
  - F-07 [low] `collect.ts:66-67` git 프로세스 중복(%s·%B) → 1회로.
  - F-08 [low] 미결 부채 집계가 "마지막 handoff 절이 전체를 재기술한다"는 비보장 가정에 의존 (`collect.ts:179`).
  - M-1 [medium/architecture] reviews 파서가 `total`=5영역 평균 규칙(REVIEW.md 명문)을 미검증 (`reviews.ts:251-254`). 부속 지적 `agreed_by ⊆ participants` 미검증은 low(명문 규칙 아님, 방어적 검증).
- 반박으로 폐기: M-2(증거 대상 0건 시 만점) — REVIEW.md의 "판단 재료 없으면 100점 + 사실 명시" 명문 규칙과 ADR-0012 "보유율" 정의, 기존 테스트가 현행 동작을 의도로 확정.
- 사용자 결정 2건(2026-08-03 승인):
  - F-01 해법: 기준 커밋 7점을 **"재생성 직전에 커밋되어 있던 기존 index.html의 기록 커밋 vs 현재 HEAD"**로 재해석해 재생성 규칙 준수를 실측한다. ADR-0012 문구와 일치하게 됨.
  - F-02 해법: 계약 준수 40점 분모를 **저장소 게이트 4종**(index, radio, handoff, tdd)으로 한정하고 커밋 문맥 2종(scope, commit-msg)은 참고 표시만. 관련 기획 문구 "게이트 6종 통과율"은 "저장소 게이트 통과율"로 개정.
- 확정 발견 수정 에이전트를 투입했으나 착수 직후 세션 종료로 중단 — **코드 변경 없음**. 작업 트리는 리팩토링 종료 시점 그대로다.

### 미결 사항

- F-01·F-02 해법 구현 + ADR-0012·00-foundation 루브릭 문구 개정(00-foundation은 변경 허용 경로 밖 — 재개 시 경로 추가 승인 또는 별도 처리 필요).
- F-03~F-07 수정과 신규 테스트, 수정 후 `pnpm harness:self-test` 전체 GREEN을 tdd.json에 재기록.
- F-08·M-1 처리 — M-1(total 평균 검증)은 P0-T33의 REVIEW.md·파서 개정과 묶어 처리 가능.
- 최종 영역 점수 재판정 → `docs/execution/reviews/P0-T29-review.json` + backlog 기록(medium·low 발견) → critical 없음 확인 후 `done` 전환 → `pnpm dashboard` 재생성 → 커밋·push(사용자 기승인 패턴).
- P0-T33 등록(사용자 승인됨, 2026-08-03): 이름 `verify` — `.claude/skills/verify/SKILL.md` + `.claude/agents/reviewer.md` 정의. **구조 변경**: 리뷰어는 서브 에이전트 2자(Opus 서브 에이전트 + Codex CLI 직접 호출, Codex 모델은 지정하지 않음), 메인 에이전트는 리뷰하지 않고 두 리뷰의 병합·중요도 판독만 담당. REVIEW.md 개정 + example fixture·파서(`agreed_by` 최소 인원 규칙) 조정 포함.
- P0-T32가 남긴 미결: 수동 전체 스캔 결과 파일명 규칙, check 스크립트 하네스 등록 여부, docs/README.md에 REVIEW.md 항목 추가.

### 다음 행동

1. 확정 발견 수정(F-01~F-07, 사용자 결정 2건 반영) 후 재검증.
2. 메인이 최종 점수 판정, `P0-T29-review.json`·backlog 기록(participants: main·opus, 2자 진행 사유 기재).
3. P0-T29 `done` 전환 → 대시보드 재생성 → 커밋·push.
4. P0-T33 기획·설계 인계 기록 후 연속 루프로 구현.

### 증거·산출물 경로

- 리뷰·교차 확인 전문: 세션 내 서브 에이전트 기록(요지는 본 handoff에 수록)
- 작업 트리: 미커밋 14개 파일(P0-T29 구현), `git stash` 없음

## 2026-08-04 · 교차 검증 종결과 done 전환

- 작업 식별자: P0-T29
- 현재 단계: 검증 종료(교차 검증 포함) → task 종결
- 기준 시각: 2026-08-04

### 확정된 사실

- 확정 발견을 사용자 결정 2건(2026-08-03)대로 수정 반영했다. 단위별 RED → GREEN을 `tdd.json`에 재기록했다(추가 8건, 총 18건).
  - F-01: 재생성 준수 7점을 커밋된 기존 산출물의 `base-commit` marker로 실측한다. `render.ts`가 marker를 심고, `collect.ts`의 `artifactFreshness`가 marker 커밋 이후 대시보드 재생성 없이 `docs/execution/phases/`를 바꾼 커밋을 세어 fresh/stale/첫 생성/판독 불가를 구분한다. 상태 변경과 재생성이 같은 커밋이면 준수로 본다.
  - F-02: 계약 준수 40점 분모를 저장소 게이트 4종(index·radio·handoff·tdd)으로 한정했다. scope·commit-msg는 `referenceGates`로 분리해 근거 문장에 "참고(점수 제외)"로만 표시한다.
  - F-03: 게이트 실행을 게이트별 try/catch로 격리했다. 실행 실패는 `errored` 표시와 수집 알림으로 남고 생성은 계속된다.
  - F-04: `dashboard-collect.test.ts` 신설 — 비git 환경 안전 동작, 실행 실패 격리, 재생성 준수 판정 4상태, 임시 저장소에서의 `main.ts` 실행(경로 출력·marker 포함 산출물)을 검증한다.
  - F-05: 위 재기록으로 최종 코드의 GREEN 증거를 확보했다.
  - F-06: next-action 근거 문구를 "index 등록 순서"로 정정하고 테스트로 고정했다.
  - F-07: HEAD subject·body를 `%B` 1회로 읽고 subject는 첫 줄에서 파생한다. 부수 수정: `git show`류 실패 시 git stderr가 생성 출력에 새지 않도록 stdio를 막았다.
- 재검증 전부 통과: 등록 check 4종, `pnpm harness:self-test` 120/120, `pnpm gate:all` 종료 코드 0, `pnpm dashboard` 재생성.
- 기획 문구 개정: ADR-0012 루브릭 표(저장소 게이트 통과율, 재생성 준수 판정 방식 명시)와 `CLAUDE.md` 요약.
- 최종 점수를 main이 판정해 `docs/execution/reviews/P0-T29-review.json`에 기록했다(participants: main·opus, codex 불참 사유 명기). 영역 점수 90/88/96/92/88, 종합 91. 확정 발견 9건(M-1은 F-09로 재부여) 중 7건 해소, 2건 미해결(F-08 low, F-09 medium)은 backlog에 남겼다.
- critical 없음을 확인하고 P0-T29를 `done`으로 전환했다. 최종 대시보드: 준비도 86 양호(계약 40/40, 증거 25/25, 실행 10/20 — 실행 가능한 planned 0건, 신선도 11/15 — 완료 task handoff의 미결 항목 누적).
- 세션 중 사용자 측 편집으로 `package.json`에 `browserslist` 필드가 추가되어 함께 커밋된다(하네스 동작과 무관).

### 미결 사항

- F-08(low)·F-09(medium)는 backlog 추적. F-09는 P0-T33의 REVIEW.md·파서 개정과 함께 처리한다.
- `docs/product/DESIGN.md`·`docs/standards/ARCHITECTURE.md`의 "대시보드 구현체 없음 / ADR-0012 보류" 잔여 문구 — 결정 주체: 사용자, 반환할 단계: 설계(다음 문서 task에서 두 줄 수정).
- P0-T32가 남긴 미결 3건(수동 전체 스캔 결과 파일명, check 스크립트 등록, docs/README.md의 REVIEW.md 항목) — 결정 주체: 사용자.

### 다음 행동

1. `docs/execution/phases/00-foundation.md`의 P0-T29 절 상태·루브릭 문구를 종결 상태와 일치시킨다(변경 허용 경로 밖이므로 별도 워크플로우 정비 커밋).
2. P0-T33(verify 스킬·reviewer 에이전트)을 기획·설계 인계 기록과 함께 등록하고 승인 후 연속 루프로 구현한다.

### 증거·산출물 경로

- `docs/execution/reviews/P0-T29-review.json`, `docs/execution/reviews/backlog.md`
- `docs/execution/runs/P0-T29/tdd.json` (18건)
- `docs/execution/dashboard/index.html`
- `docs/execution/phases/index.jsonl` (P0-T29 = `done`)
