# P0-T58 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-18
- 개발 설계 승인: user, 2026-08-18 (revision 1)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-18 | 최초 작성. 설계 인터뷰 확정 — 묶음 문턱은 파일 2건+ 그리고 외톨이는 최상위 영역, phase 마감은 medium 0건 + low 이월 허용. 2026-08-18 사용자 결정. 폐기 `[-]`·이월 `[>]` 표기, 마지막 ` — ` 구분자 규칙, 유예 스냅숏, 경계 채번은 설계 세부로 이 revision이 정한다. |

- 관련 spec: DOCS:SDD, ADR:0011, ADR:0012(대시보드 노출). 기획 정본은 phase 00 P0-T58 절, 실태 조사는 `runs/P0-T58/survey.md`.
- 적용 깊이: 일반 — L1 협업 계약(REVIEW·WORKFLOW) + harness 게이트·배치 코드 + backlog 정본 1회 정리. 제품 코드(`src/**`)·DB 무변경.
- 예정 check IDs: `backlog-line-format-gate`, `backlog-format-grandfather`, `backlog-stale-sweep`, `cleanup-batch-by-file`, `cleanup-task-auto-proposed`, `auto-proposed-needs-approval`, `phase-close-blocked-by-backlog`
- 선행 계약: `P0-T57` 봉인 RADIO(SHA `98ea4ee7…`)를 계약으로 삼는다(`WORKFLOW.md:53`). T57 구현이 REVIEW.md를 재봉인급으로 바꾸면 이 설계를 재점검한다.

## 전제

- 기획 승인(2026-08-18)이 소유한 결정을 다시 열지 않는다: 세울 것 넷(형식 게이트·노후 정리·자동 배치·phase 마감 조건), `REVIEW.md:197` 승인 조항 유지(자동은 `proposed`까지), 묶음 단위는 파일.
- 실태 조사(`runs/P0-T58/survey.md`)로 확인된 사실:
  - 미결 223건 = medium 123 + low 99. 형식 위반 29건은 전부 「제목 속 `—`」 양상이다.
  - 파일당 분포: 외톨이 119 · 2건 30파일 · 3건+ 13파일. 외톨이가 절반을 넘어 파일 문턱만으로는 못 덮는다.
  - task 경계 훅은 retrospector가 이미 갖고 있고, `index-gate.ts`에 phase 완료 개념은 없다(신설).
  - 대시보드는 `reviews.ts`가 backlog를 이미 읽는다. 면제 스냅숏 선례는 `config/radio-lens.json`.
  - `index.jsonl` 갱신은 task 경계로 미루는 기존 규칙(`WORKFLOW.md:53`)이 자동 기입에도 그대로 적용된다.
- 구현 주체는 조정 세션이다. harness 코드는 `test_mode=tdd`로 writer의 RED 선행.

## Requirements

### 범위와 비목표

범위: `gate:backlog` 신설(형식 검사 + 유예 스냅숏), backlog 노후 정리 1회(폐기 표기), 배치 명령 `pnpm backlog:batch` 신설(파일·영역 묶음을 `proposed`로 기입), `gate:index`에 phase 마감 검사 추가, REVIEW.md 개정(표기 3종·문턱·배치 절차), WORKFLOW 5단계에 배치 시점 명시, 대시보드 phase별 미결·자동 후보 노출, self-test, phase 00·index.jsonl 등록.

비목표: 미결 223건의 실제 소진(배치된 정비 task들의 몫). 자동 승인 — 기계는 `proposed`까지만. `critical`·`high` 처리 경로 변경. 리뷰 결과 파일(`<task-id>-review.json`) 형식 변경. retrospector 계약 변경(배치는 별도 명령이고 호출 시점만 WORKFLOW가 적는다).

### 불변 규칙

- `REVIEW.md:197`의 사용자 승인 조항은 유지된다. 자동 기입된 task는 `product_approval` 없이는 어떤 경로로도 `in_progress`가 될 수 없다.
- backlog 줄은 지우지 않는다 — 완료 `[x]`, 폐기 `[-]`, 이월 `[>]` 어느 것이든 이력이 남는다(`REVIEW.md:186` 확장이지 대체가 아니다).
- 배치 명령은 멱등이다 — 같은 미결 집합에 두 번 돌려도 후보가 중복 기입되지 않는다.
- 기입은 task 경계에서만 한다 — `index.jsonl` 스테이징 충돌 규칙(`WORKFLOW.md:53`)을 따른다.
- 이 task 안에서 정비 후보를 승인·착수하지 않는다 — 치우는 기계를 만들 뿐, 치우는 것은 승인받은 정비 task들이 한다.

### 정지 조건

- 노후 정리 중 폐기 판정이 갈리는 항목(코드가 바뀌어 유효성이 불명확)이 나오면 임의 판정하지 않고 미결로 두고 목록으로 반환한다.
- phase 마감 검사가 기존 done phase(해당 없음이 정상)를 소급 차단하는 것으로 드러나면 한정 로직 결함이므로 반환한다.
- T57 구현이 REVIEW.md의 backlog 절 구조를 바꿔 이 설계의 개정 지점이 어긋나면 재점검으로 반환한다.

### 기술 인수 조건

1. **한 줄 형식 게이트**: `gate:backlog`가 backlog의 미결(`- [ ]`)·이월(`- [>]`) 줄을 검사한다 — `- [상태] [severity] [task-id] 제목 — 근거 파일` 꼴이고, severity는 `medium`·`low`, task-id는 `P[0-9]+-T[0-9]{2}`, **구분자는 마지막 ` — `**(제목 속 `—`는 허용), 근거 파일은 공백 없는 경로 형태다(존재 여부는 안 본다). `REPOSITORY_GATES`·`COMMIT_GATES`·`package.json`에 편입된다.
2. **유예 스냅숏**: 기존 위반 29건은 `config/backlog-grandfather.json`에 줄 원문 그대로 담고 게이트가 정확 일치로 건너뛴다. 스냅숏은 생성 이후 추가 금지 — 신규 줄은 형식을 지켜야만 들어온다. 스키마 위반(중복·비문자열)은 게이트 위반이다.
3. **노후 정리 1회**: 구현 단계에서 미결 223건을 유효성 재확인해, 근거 파일이 사라졌거나 지적 대상 코드가 이미 바뀐 항목을 `- [-]`(폐기)로 바꾸고 줄 끝에 `(폐기: 사유)`를 단다. 완료 `[x]`와 구분된다 — 고친 것과 없어진 것은 다른 사실이다. 결과 집계는 handoff에 남긴다.
4. **배치 명령**: `pnpm backlog:batch`가 미결을 파싱해 ① 같은 근거 파일 2건 이상 → 파일 후보 하나, ② 남는 외톨이 → 최상위 영역 후보 하나(`src/`는 `src/<layer>` 단위, 그 외는 첫 단경 — `supabase/`·`harness/`·`docs/`·`.claude/` 등)로 묶어 `index.jsonl`에 `proposed` task로 기입한다. 모든 미결 줄이 정확히 하나의 후보에 속한다. 기입 항목은 `kind: task`·`status: proposed`·`approval_contract: dual-approval-v3`·`priority: could`·`tags: ["maintenance"]`·승인 기록 없음이고, summary가 묶은 줄들의 task-id·건수를 나열한다. ID는 실행 시점 index의 해당 phase 최대 번호 + 1부터 순차 채번한다(경계 단일 기입자 규칙이 충돌을 막는다).
5. **멱등**: 이미 기입된 후보와 같은 묶음 키(파일 경로 또는 영역)가 `proposed`·`planned`·`in_progress`로 존재하면 다시 만들지 않고, 그 묶음에 신규 줄이 늘었으면 기존 후보의 summary 건수만 갱신한다. `done`이 된 정비 task의 묶음 키는 새 미결이 쌓이면 새 후보로 다시 만들 수 있다.
6. **승인 없는 진행 차단**: `gate:index`가 `product_approval` 없는 task의 `planned`·`in_progress`·`done` 상태를 위반으로 판정한다(`proposed`·`design_pending`은 허용). 자동 기입 후보가 이 검사의 첫 대상이다.
7. **phase 마감 검사**: `gate:index`가 「어느 phase의 task가 전부 `done`(또는 `skipped`)인데 그 phase 앞으로 적힌 미결 `- [ ]`이 남아 있으면」 위반으로 판정한다 — medium은 무조건, low는 `- [>]`(이월, 줄 끝 `(이월: 대상 phase)`)로 바꾸면 통과다. medium의 이월 표기는 위반이다. 현재 어떤 phase도 전 task done이 아니므로 도입 시점 소급 차단은 없다는 것을 self-test가 단언한다.
8. **REVIEW.md 개정**: backlog 형식 절이 표기 4종(`[ ]`·`[x]`·`[-]`·`[>]`)과 마지막 ` — ` 구분자 규칙을 정의하고, `:104`의 「몇 task 주기로」가 배치 명령·문턱(파일 2건+·외톨이 영역·phase 마감 medium 0)으로 구체화되고, `:197` 승인 조항은 자동 기입이 `proposed`까지라는 문장과 함께 유지된다.
9. **WORKFLOW 개정**: 5단계(task 경계) 절차에 retrospector 뒤 `pnpm backlog:batch` 실행이 들어간다.
10. **대시보드**: phase별 미결 수(medium·low 구분)와 자동 기입된 정비 후보 목록이 노출된다. 읽기 전용 파생물 원칙(ADR-0012) 유지 — 대시보드는 backlog를 수정하지 않는다.
11. **self-test**: 형식 통과·위반(제목 속 `—` 포함)·유예 일치·유예 추가 금지, 파일·영역 묶음 산출, 멱등(재실행 무중복), 승인 없는 진행 차단, phase 마감 위반·이월 통과·소급 없음이 각각 단언된다. `pnpm verify` 전체 GREEN.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1·2 형식 게이트 | 테스트함 — 규격 줄과 유예 스냅숏 일치 줄이 통과 | 테스트함 — 구분자 없음·severity 오기·task-id 부재가 구분된 메시지로 위반, 스냅숏에 없는 위반 줄도 위반 | 테스트함 — 제목 속 `—` 여러 개는 마지막 ` — ` 기준으로 통과, `[x]`·`[-]` 줄은 검사 대상 아님 | 해당 없음 — 로컬 파일 정적 검사다 | 해당 없음 — 같은 입력에 같은 판정이다 | 해당 없음 — 읽기 전용이라 공유 상태가 없다 |
| 4·5 배치 명령 | 테스트함 — 파일 2건+와 외톨이 영역이 각각 후보로 기입되고 모든 미결이 정확히 한 후보에 속한다 | 테스트함 — 파싱 불가 줄(유예 목록)이 섞여도 명령이 중단되지 않고 그 줄은 미배치 목록으로 보고된다 | 테스트함 — 미결 0건이면 기입 없음, 같은 파일이 2건에서 3건이 되면 기존 후보 summary만 갱신 | 해당 없음 — 로컬 파일 기입이고 승인 권한은 6이 소유한다 | 테스트함 — 두 번 실행해도 후보 무중복(멱등) | 해당 없음 — task 경계 단일 기입자 규칙(`WORKFLOW.md:53`)이 직렬화한다 |
| 6 승인 차단 | 테스트함 — `proposed` 후보는 통과 | 테스트함 — `product_approval` 없는 `planned`·`in_progress`가 위반 | 테스트함 — legacy-v2 done은 검사 대상 아님(소급 금지) | 해당 없음 — 승인 주체 판정은 index 기록뿐이다 | 해당 없음 — 판정이 멱등이다 | 해당 없음 — 위와 같다 |
| 7 phase 마감 | 테스트함 — 전 task done + 미결 0(또는 low 전량 이월)이 통과 | 테스트함 — medium 1건 잔존·medium 이월 표기·low 무표기 잔존이 각각 위반 | 테스트함 — 진행 중 phase는 미결이 많아도 통과(소급 없음), task 0개 phase는 검사 대상 아님 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 |
| 3·8~10 정리·문서·대시보드 | 테스트함 — `check:docs` 링크 판정 + 대시보드 self-test에서 미결 수·후보 목록 렌더 | 테스트함 — 대시보드는 backlog 원본 부재 시 「누락」 표시(advisory) | 테스트함 — 폐기·이월 표기가 렌더에서 미결로 집계되지 않는다 | 해당 없음 — 읽기 전용 파생물이다 | 해당 없음 — 생성이 멱등이다 | 해당 없음 — 단일 프로세스가 쓴다 |

### DEV-* 적용 상태

- DEV-CODE-07(주석 금지): 기본 적용 — harness 코드 포함.
- DEV-TEST: 기본 적용 — `test_mode=tdd`, writer RED 선행, self-test 동반.
- DEV-SEC·DEV-DATA·DEV-CACHE·DEV-OFFLINE·DEV-TIME: 해당 없음 — 제품 코드·DB 무변경. backlog·후보 summary에 비밀값 금지(리뷰 계약 준용).

## Architecture

- L1 협업 계층 변경. 판정 로직 `harness/lib/backlog-gate.ts`(형식·유예), 묶음 로직 `harness/lib/backlog-batch.ts`(파싱·묶음·기입), 래퍼 `harness/gates/backlog.ts`, phase 마감·승인 차단은 index 소유자인 `harness/lib/index-gate.ts`에 얹는다 — backlog 읽기는 backlog-gate가 export하는 파서를 공유해 파싱 규칙 정본을 하나로 둔다.
- 배치는 게이트가 아니라 명령이다(`pnpm backlog:batch`) — 게이트는 막기만 하고 쓰지 않는다는 기존 관례 유지. 실행 시점은 WORKFLOW 5단계가 소유한다.
- 대시보드는 `reviews.ts`의 기존 backlog 읽기를 확장하고 렌더는 기존 페이지에 절을 더한다 — 신규 페이지를 만들지 않는다.

## Data model

해당 없음 — DB 무변경. 파일 정본: 유예는 `config/backlog-grandfather.json`(줄 원문 배열, 추가 금지), 표기 4종과 구분자 규칙은 REVIEW.md, 자동 후보는 `index.jsonl`의 `proposed` 항목(별도 파일 없음).

## Interface

- backlog 줄 상태: `[ ]` 미결 · `[x]` 완료 · `[-]` 폐기(`(폐기: 사유)` 필수) · `[>]` 이월(low 전용, `(이월: 대상 phase)` 필수).
- `config/backlog-grandfather.json`: `{"lines": ["<줄 원문>", ...]}` — 정확 일치, 추가 금지.
- 자동 후보 summary 형식: `backlog 정비 — <묶음 키>. <task-id별 건수 나열>, 총 N건.` 게이트는 형식을 검사하지 않는다(사람이 읽는 요약).
- `pnpm backlog:batch` 출력: 기입·갱신·미배치(파싱 불가) 3구분 보고.

## Optimizations

- 전부 로컬 파일 정적 처리 — 네트워크·빌드 없음. backlog 파싱은 게이트·배치·대시보드가 파서 하나를 공유해 3중 구현을 막는다.

## 변경 허용 경로

```
docs/workflow/REVIEW.md
docs/workflow/WORKFLOW.md
docs/workflow/TOOLING.md
CLAUDE.md
config/backlog-grandfather.json
harness/lib/backlog-gate.ts
harness/lib/backlog-batch.ts
harness/gates/backlog.ts
harness/lib/index-gate.ts
harness/lib/gate-suite.ts
harness/dashboard/reviews.ts
harness/dashboard/render.ts
harness/dashboard/main.ts
harness/dashboard/collect.ts
harness/self-test/backlog-gate.test.ts
harness/self-test/backlog-batch.test.ts
harness/self-test/index-gate.test.ts
harness/self-test/dashboard-collect.test.ts
harness/self-test/hook-acceptance.test.ts
package.json
docs/execution/reviews/backlog.md
docs/execution/phases/00-foundation.md
docs/execution/phases/index.jsonl
docs/execution/runs/P0-T58/**
docs/execution/radio/P0-T58-radio.md
docs/execution/reviews/**
docs/execution/retrospective/**
```

- 용도 한정: `index-gate.ts`는 승인 차단·phase 마감 검사 추가에만, `gate-suite.ts`는 `gate:backlog` 등록에만, `CLAUDE.md`·`TOOLING.md`는 명령·게이트 목록 정합 갱신에만, `backlog.md`는 노후 정리 1회(인수 조건 3)와 형식 준수 신규 줄에만 쓴다. `index.jsonl`은 P0-T58 등록·상태 전환과 배치 self-test 픽스처가 아닌 실기입 검증에만 쓴다. 기존 리뷰 결과 파일은 바꾸지 않는다.

## 미결 사항

- 영역 경계의 세분(예: `src/entities`와 `src/shared`를 합칠지)은 첫 배치 실행 결과를 보고 정비 task 승인 시점에 사람이 정한다 — 묶음 로직은 기계 규칙(첫 단경·src는 layer)만 갖는다.
- 정비 task의 변경 허용 경로 초안을 배치가 함께 제안할지는 이 task 밖이다 — 후보 승인 후 설계 인터뷰가 정한다.
