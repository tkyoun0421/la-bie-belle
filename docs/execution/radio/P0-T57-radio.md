# P0-T57 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-18
- 개발 설계 승인: user, 2026-08-19 (revision 2)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-18 | 최초 작성. 설계 인터뷰 확정 — 계약·방법 2파일 분리(마커 안 기각), 방법 파일은 worker 직접 수정 + 기록 강제, 오판 백스톱은 메인 세션 diff 감사 + 리뷰어 2자 대조, src 세그먼트 깊이 규칙 + 전 루트 최상위 통짜 금지, 조사 전원 필수 + 명시 면제 목록, ADR-0016 신규 + 0011 개정 표시. 2026-08-18 사용자 결정. |
| 2 | 2026-08-19 | 외부 교차 리뷰(codex, t57-design-review worktree) 발견 반영 — ① 신 형식 판별을 파일 존재에서 index 명시 필드(`radio_format`·`method_ref`)로 전환하고 방법 파일 누락·삭제를 fail-closed 위반으로, ② 계약급 사실 소유 규칙(불변·권한·오류·외부 인터페이스·예산은 계약 절 소유), ③ 최종 방법 patch의 리뷰 결속과 마지막 변경 후 재감사, ④ 기획 29건 분해 산술 정정(직접 효과 2~3건), ⑤ survey 재현성 필드·면제 승인 스키마. |

- 관련 spec: DOCS:SDD, ADR:0011(개정 대상), ADR:0016(신설). 기획 정본은 phase 00 P0-T57 절, 실태 조사는 `runs/P0-T57/survey.md`.
- 적용 깊이: 일반 — L1 협업 계약(WORKFLOW·REVIEW·에이전트·스킬) + harness 게이트 코드. 제품 코드(`src/**`)·DB 무변경.
- 예정 check IDs: `radio-contract-method-split`, `legacy-radio-unchanged`, `method-change-log-required`, `confirmed-shape-in-contract`, `radio-test-minimum-set`, `allowed-path-segment-depth`, `survey-required-for-seal`, `design-surveyor-contract`

## 전제

- 기획 승인(2026-08-18)이 소유한 결정을 다시 열지 않는다: 2파일 분리와 그 사유(마커 안 기각 — `WORKFLOW.md:306`의 「전체 파일 SHA」 문구 보존, 마커 누락의 조용한 봉인 이탈 차단), 원인 3종별 처방. 근거 수치(재봉인 29건 분해, 소요 시간 1.8/2.0/13.2h)는 phase 00 P0-T57 절이 정본이다.
- 실태 조사(`runs/P0-T57/survey.md`)로 확인된 사실:
  - 해시는 `harness/lib/radio-gate.ts:316`이 파일 전체 UTF-8 바이트로 계산하고, `checkRadioBindings`가 `index.jsonl`의 `radio_sha256`과 대조한다. 절·마커 개념이 없다.
  - `checkRiskLensTables`(`radio-gate.ts:178`)가 렌즈 표와 변경 허용 경로를 **같은 `radio_ref` 파일에서** 읽는다. 렌즈 면제 스냅숏은 `config/radio-lens.json`(`exemptTasks`, 사전순·중복 없음 스키마)이다.
  - `gate:scope`(`scope-gate.ts`)는 `radio_ref` 파일의 `## 변경 허용 경로` 첫 코드블록을 `parseAllowedPaths`(`radio-doc.ts`)로 파싱한다. glob 깊이 검사는 없다.
  - 봉인된 RADIO 52개 중 47개가 개정 이력을 8행(머리)에 두고, `정지 조건` 절은 40개에 없다. 확정 모양·문서 개정 목록을 담은 것은 `P0-T48` 하나다.
  - self-test 픽스처(`radio-gate.test.ts:58`)는 전체 마크다운 해싱을 전제한다.
  - `gate:handoff`·`gate:retro`·`gate:tdd`는 RADIO를 읽지 않는다.
- 구현 주체는 조정 세션이다 — `.claude/**`·`docs/workflow/**`는 조정자 소유 경로다. harness 게이트 코드는 `test_mode=tdd`에 따라 writer가 RED를 먼저 남긴다.
- **이 RADIO 자신은 구 형식(단일 파일·전체 해싱)이다.** 게이트가 분리를 아직 모르는 부트스트랩 단계라 당연하며, 새 형식 첫 사용자는 이 task 이후 봉인되는 task다.
- 외부 교차 리뷰(2026-08-19, codex)로 확인된 사실:
  - 기획 정본의 29건 분해에 산술 불일치가 있다 — 구현발 결정 15건의 원인 열거가 6+2+3=11건이고, `P3-T10`·`P3-T01`이 두 원인 목록에 이중 계상돼 있다.
  - 재봉인 표본 대조 결과 2파일 분리의 직접 제거 효과는 2~3/29건으로 추정된다(방법만 바뀐 실증 표본은 `P1-T02` revision 2·3). 이 task의 정당화는 분리 단독이 아니라 조사(정적 미조사 6건 중 3~5건 예방 추정)·경로 깊이·방법 변경 왕복 제거의 합산이다.

## Requirements

### 범위와 비목표

범위: `gate:radio`·`gate:scope`의 신 형식 인식(계약 해싱 범위·방법 기록 강제·최소 집합 대조·경로 깊이 검사·조사 존재 검사), `index.schema.json`에 `radio_format`·`method_ref` 필드 등재, `config/radio-lens.json`에 `surveyExemptTasks` 키 추가, `design-surveyor` 에이전트 신설, WORKFLOW·REVIEW·publish-ui 스킬·radio README(템플릿) 개정, ADR-0016 신설과 ADR-0011 개정 표시, 기획 정본 수치 정정, self-test, phase 00·index.jsonl 등록.

비목표: 제품 코드·DB·`src/**` 변경. 봉인된 RADIO 52개의 소급 개정·재해싱. 승인 게이트 수 변경(2개 유지). backlog 소진과 정비 task 자동 배치(`P0-T58`). `tdd.json` 형식·`gate:tdd` 로직 변경. reviewer·implementer 외 에이전트 계약 변경.

### 불변 규칙

- 계약 파일(`<task-id>-radio.md`)의 봉인은 지금과 동일하게 **전체 파일 UTF-8 바이트 SHA-256**이다. `radio_ref`·`radio_sha256`·`radio_revision`의 의미는 바뀌지 않는다(ADR-0011:25 보존).
- 신·구 형식의 판별은 파일 존재가 아니라 **index의 명시 필드**다. `radio_format: "contract-method-v1"`과 `method_ref`가 기록된 task만 신 형식이고, 두 필드가 없는 기존 RADIO 52개는 검사·해싱 동작이 지금과 완전히 같다. 신설 검사(방법 기록·깊이·조사)는 신 형식 task에만 적용된다.
- **fail-closed**: 신 형식 task에서 `method_ref`가 가리키는 파일의 부재·staged 삭제는 구 형식 전환이 아니라 게이트 위반이다. 방법 파일을 지우는 것으로 신설 검사를 끌 수 있는 경로는 없다.
- 관찰 가능한 불변 규칙·권한·오류 모드·외부 인터페이스 계약·성능 예산은 **계약 파일 절이 소유한다.** 방법 파일의 Architecture·Data model·Interface·Optimizations는 구현 배치와 구조만 담고, 계약급 사실은 계약 절을 참조로만 가리킨다.
- 방법 파일 변경은 기록 없이는 커밋되지 않는다 — 완화가 아니라 승인을 기록으로 대체하는 것이며, 조용한 변경은 구 형식보다도 좁아진다.
- `design-surveyor`는 읽기 전용이고 제안을 쓰지 않는다. 산출물에 "이렇게 하라"가 들어가면 설계 판단이 승인 게이트 밖으로 새는 경로가 된다(`reviewer`가 조정자 의견을 받지 않는 것과 같은 원리).
- 이중 승인 게이트·`in_progress` 최대 1·기존 done 무소급 등 WORKFLOW 기존 불변 규칙은 그대로다.

### 정지 조건

- 신설 검사를 신 형식에 한정했는데도 기존 봉인 52개 중 위반이 검출되는 경우 — 한정 로직의 결함 신호이므로 우회하지 않고 반환한다.
- `WORKFLOW.md:346`(방법 판단의 2단계 반환) 개정이 다른 승인 규칙과 충돌하는 문장을 만나는 경우 — 조용히 조정하지 않고 결정 신호로 반환한다.
- 기존 self-test 픽스처 수정 범위가 변경 허용 경로를 넘는 경우.

### 기술 인수 조건

1. **신 형식 인식**: 판별은 index 항목의 `radio_format: "contract-method-v1"`과 `method_ref`(방법 파일 경로) 두 필드다. 신 형식 task는 계약 파일 전체 바이트만 해싱하고 방법 파일은 해시에 들어가지 않는다. 두 필드가 없는 task는 기존 동작 그대로다. 방법 파일의 존재·부재는 판별에 영향을 주지 않으며, 신 형식 task에서 `method_ref` 파일이 없으면 위반이다(fail-closed). `index.schema.json`에 두 필드가 등재된다.
2. **방법 기록 강제**: 커밋 게이트에서 staged 방법 파일이 HEAD와 다른데 그 diff에 `## 변경 기록` 표의 신규 행이 없으면 위반이다. 행 형식은 `| 날짜 | 절 | 사유 |`이고 게이트는 행 추가 여부만 기계 검사한다(내용 판정은 메인 세션 diff 감사와 리뷰어 몫). 방법 파일의 staged **삭제**는 기록 여부와 무관하게 위반이다.
3. **위험 테스트 최소 집합**: 계약 파일의 `### 위험 기반 테스트 최소 집합` 절에 테스트 ID 목록이 있고, 렌즈 표는 `-method.md`에 있다. `checkRiskLensTables`는 신 형식에서 표를 `-method.md`에서 읽고, 최소 집합의 모든 ID가 표에 존재하는지 대조한다 — ID를 표에서 지우려면 최소 집합 줄도 지워야 하므로 계약 SHA가 깨진다. 추가·계층 이동은 표만 건드리니 기록으로 끝난다.
4. **경로 깊이 검사**(신 형식 한정): 변경 허용 경로 선언에서 ① `src/` 아래는 `src/<layer>/<slice>/` 접두 없이 `**`에 도달하는 glob을 거부한다(`src/app/**` 계열은 Next 예약 경로라 예외). ② 어느 루트든 첫 단경에서 끝나는 통짜(`docs/**`·`supabase/**`·`harness/**`·`*`·`**` 류)를 거부한다. 둘째 단경부터는 봉인 승인이 본다.
5. **조사 봉인 조건**(신 형식 한정): `development_approval`이 기록된 task에 `docs/execution/runs/<task-id>/survey.md`가 없으면 위반이다. 면제는 `config/radio-lens.json`의 `surveyExemptTasks`에 오른 항목만 받으며, 항목 스키마는 `{"id": "<task-id>", "approved": "user, YYYY-MM-DD"}`다(ID 사전순·중복 없음, `approved` 누락은 스키마 위반). 면제 추가는 해당 task의 승인 요약본에 명시된 경우에만 한다.
6. **design-surveyor 계약**: `.claude/agents/design-surveyor.md`가 존재하고 tools는 `Read, Grep, Glob`뿐이다. 본문이 조사 4축(재사용 가능한 것·도구/플랫폼 제약·기존 자산 실태·걸린 DEV-*와 게이트), 산출물 단일 경로(`runs/<task-id>/survey.md`), 사실 전용·제안 금지를 명시한다. survey 머리에는 기준 commit SHA와 조사에 쓴 명령·검색식을 기록한다 — 수치가 재현 가능해야 한다. 산출물 작성은 조정 세션이 보고를 받아 수행한다(에이전트에 Write를 주지 않는다).
7. **WORKFLOW 개정**: ① 설계 단계에 봉인 전 조사 절차(surveyor 디스패치, 산출물, 면제)가 들어간다. ② 봉인 절이 2파일 구조·방법 기록 강제·worker 직접 수정과 복귀 직후 메인 세션 diff 감사를 적는다. ③ `:346`의 방법 절(Architecture·Data model·Interface·Optimizations) 판단 반환 조항이 개정된다 — 계약(범위·불변 규칙·정지 조건·인수 조건·확정 모양·개정 목록·허용 경로)에 닿는 판단은 지금처럼 `[질문]` 반환, 방법 안 판단은 worker가 기록과 함께 직접 수정. ④ `:137`·`:151`의 확정 모양·문서 개정 목록 귀속이 Architecture에서 계약 파일의 `## 확정 모양`·`## 문서 개정 목록` 절로 바뀐다. ⑤ 마지막 방법 파일 변경 이후 메인 세션 diff 재감사 없이 task를 `done`으로 바꾸지 않는다는 결속이 5단계에 적힌다.
8. **REVIEW 개정**: 검증 단계 리뷰어 입력에 방법 파일의 변경 기록과 **봉인 시점 대비 최종 patch 전체**가 명시적으로 들어가고, 「방법으로 위장된 계약 변경」과 「계약급 사실(불변·권한·오류·외부 인터페이스·예산)이 방법 파일에만 존재」가 발견되면 `critical`로 분류된다는 것이 중요도 표에 적힌다.
9. **publish-ui 스킬 개정**: `SKILL.md:16`의 「RADIO Architecture에 들어가고」가 계약 파일 `## 확정 모양` 절로 바뀐다.
10. **ADR**: `adr/0016-radio-contract-method-split.md`가 신설되고(2파일 구조·기록 강제·경로 규칙·조사 의무·신구 형식 공존), `adr/0011` 상단에 「봉인 파일 구성과 방법 기록은 ADR-0016이 개정한다」 한 줄이 붙는다. 0011 본문은 무수정이다. `adr/README.md` 목록에 0016이 오른다.
11. **radio README(템플릿) 개정**: `docs/execution/radio/README.md`가 신 형식의 두 파일 절 구성(계약: 전제·범위와 비목표·불변 규칙·정지 조건·기술 인수 조건·위험 기반 테스트 최소 집합·확정 모양·문서 개정 목록·변경 허용 경로 / 방법: Architecture·Data model·Interface·Optimizations·위험 기반 테스트 표·미결 사항·변경 기록)을 적고, **계약급 사실 소유 규칙**(불변·권한·오류·외부 인터페이스·예산은 계약 절이 소유, 방법 절은 배치·구조만)을 명시한다. 계약 파일의 개정 이력은 계약 재봉인의 기록으로 계약 파일에 남는다.
12. **self-test**: 신 형식 해싱 범위, legacy 무변경(`radio_format` 없는 task), 신 형식의 방법 파일 부재·staged 삭제 위반(fail-closed), `method_ref` 경로와 실제 파일 불일치 위반, 기록 강제 위반·통과, 최소 집합 대조(삭제 검출·추가 통과), 깊이 검사(거부 5종·통과 4종 이상), 조사 부재 위반·면제 통과, 면제 스키마 위반(`approved` 누락 포함)이 각각 단언된다. `pnpm verify` 전체 GREEN.
13. **기획 정본 산술 정정**: `00-foundation.md`의 P0-T57 절이 29건 분해의 불일치(구현발 결정 15건 대비 원인 열거 11건, `P3-T10`·`P3-T01` 이중 계상)를 해소하고, 기대 효과를 「2파일 분리 직접 2~3건 + 봉인 전 조사 3~5건 예방 추정」으로 명시한다. 수치의 정본은 phase 문서라는 원칙(전제 절)은 유지된다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 신 형식 해싱 | 테스트함 — self-test에서 `radio_format`이 기록된 픽스처의 계약 SHA가 계약 파일 바이트만으로 일치 | 테스트함 — 방법 파일 내용을 바꿔도 계약 SHA 검사가 통과하고, 계약 파일 한 바이트 변경은 불일치 위반 | 테스트함 — `radio_format` 없는 task는 방법 파일이 있어도 legacy, 신 형식의 방법 파일 부재·삭제는 위반(fail-closed), `method_ref` 경로 불일치도 위반 | 해당 없음 — 로컬 파일 정적 검사라 실행 권한 개념이 없다 | 해당 없음 — 같은 입력에 같은 판정인 순수 함수다 | 해당 없음 — 읽기 전용이라 공유 상태가 없다 |
| 2 방법 기록 강제 | 테스트함 — 변경 기록 행과 함께 바뀐 `-method.md`는 통과 | 테스트함 — 행 없이 바뀌면 위반 1건, 행만 있고 본문 무변경도 통과(기록 과잉은 막지 않는다) | 테스트함 — `## 변경 기록` 절 자체가 없는 `-method.md` 변경은 위반 | 해당 없음 — 위와 같다 | 해당 없음 — 판정이 멱등이다 | 해당 없음 — pre-commit이 순차로 돈다 |
| 3 최소 집합 대조 | 테스트함 — 최소 집합 ID 전부가 표에 있으면 통과 | 테스트함 — 표에서 ID 행을 지우면 대조 위반, 최소 집합 줄을 지우면 SHA 불일치 | 테스트함 — 최소 집합 0개(절만 있음)와 표에만 있는 잉여 ID는 통과 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 |
| 4 경로 깊이 | 테스트함 — 세그먼트 깊이·둘째 단경 glob이 통과 | 테스트함 — `src/views/**`·`docs/**`·`**` 각각 구분된 메시지로 거부 | 테스트함 — `src/app/**` 예외 통과, 구 형식 RADIO의 얕은 선언은 검사 대상 아님 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 |
| 5 조사 봉인 조건 | 테스트함 — `survey.md` 있는 신 형식 승인 통과 | 테스트함 — 부재 시 위반, `surveyExemptTasks` 스키마 위반(비정렬·중복·`approved` 누락) 시 스냅숏 위반 | 테스트함 — 면제 목록에 오른 task는 부재여도 통과, 구 형식 task는 검사 대상 아님 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 |
| 6~11 문서·에이전트 계약 | 테스트함 — `check:docs`가 링크·제목을 판정하고 교차 검증 리뷰가 내용을 본다 | 해당 없음 — 사람이 읽는 계약이라 실패 분기가 없다 | 해당 없음 — 값이 아니라 문장이다 | 해당 없음 — 실행 권한이 없는 문서다 | 해당 없음 — 멱등한 파일 쓰기 | 해당 없음 — 사람이 한 번에 하나씩 고치는 문서다 |

### DEV-* 적용 상태

- DEV-CODE-07(주석 금지): 기본 적용 — harness 코드 포함.
- DEV-TEST: 기본 적용 — 게이트 로직 변경은 self-test 동반, `test_mode=tdd`로 writer의 RED 선행.
- DEV-SEC·DEV-DATA·DEV-CACHE·DEV-OFFLINE·DEV-TIME: 해당 없음 — 제품 코드·DB 무변경. 조사 산출물·변경 기록에 비밀값을 쓰지 않는다(리뷰 계약 준용).

## Architecture

- L1 협업 계층 변경이다. 판정 로직은 `harness/lib/radio-gate.ts`(신 형식 판별·해싱 범위·최소 집합·조사)와 `harness/lib/scope-gate.ts` 또는 `radio-doc.ts`(경로 깊이 — 파싱 소유자인 `parseAllowedPaths` 곁에 두고 두 게이트가 공유), 방법 기록 검사는 staged 대조가 필요하므로 커밋 게이트 계열에 둔다. 배치 관례는 기존 게이트를 따른다.
- 신·구 형식 공존은 판별 함수 하나(index 항목의 `radio_format`·`method_ref`를 읽는 `radioFormatOf`)로 격리한다 — 각 검사가 스스로 legacy를 걸러내는 분기를 반복하지 않고, 파일 시스템 상태는 판별에 관여하지 않는다.
- `checkRiskLensTables`의 본문 읽기 대상만 신 형식에서 `-method.md`로 갈라진다. 허용 경로 읽기는 계약 파일 그대로다.
- `design-surveyor`는 인터뷰(1~2단계) 트랙에서 돌므로 `in_progress` 직렬 트랙과 겹치지 않는다(`WORKFLOW.md:53` 기존 규칙에 의존, 신설 규칙 없음).

## Data model

해당 없음 — DB 무변경. 파일 정본: 면제는 `config/radio-lens.json`의 `surveyExemptTasks`(기존 `exemptTasks`와 병렬 키, 같은 스키마 규율), 조사 산출물은 `runs/<task-id>/survey.md`, 방법 변경 기록은 `-method.md`의 `## 변경 기록` 표.

## Interface

- `design-surveyor` frontmatter: model `sonnet`, tools `Read, Grep, Glob`.
- `-method.md` 변경 기록 행 형식: `| 날짜 | 절 | 사유 |` — 게이트는 행 추가 여부만 검사한다.
- index 항목 신설 필드: `radio_format`(현재 유일값 `"contract-method-v1"`)·`method_ref`(저장소 상대 경로). `index.schema.json`에 선택 필드로 등재하고 둘은 함께만 존재할 수 있다.
- `config/radio-lens.json`: `{"exemptTasks": [...], "surveyExemptTasks": [{"id": "...", "approved": "user, YYYY-MM-DD"}, ...]}` — ID 사전순·중복 없음, `approved` 필수.
- 게이트 위반 메시지는 기존 관례(파일·행 단서·수정 힌트)를 따르고 깊이 거부 3종(src 얕음·통짜·와일드카드 단독)을 구분한다.

## Optimizations

- 신설 검사는 전부 로컬 파일 정적 검사다 — 네트워크·빌드 없음. 방법 기록 검사의 staged 대조는 git 프로세스 1회로 한정한다.

## 변경 허용 경로

```
.claude/agents/design-surveyor.md
.claude/skills/publish-ui/SKILL.md
docs/workflow/WORKFLOW.md
docs/workflow/REVIEW.md
docs/workflow/TOOLING.md
CLAUDE.md
docs/standards/adr/0016-radio-contract-method-split.md
docs/standards/adr/0011-planning-radio-development-contract.md
docs/standards/adr/README.md
docs/execution/radio/README.md
config/radio-lens.json
harness/lib/radio-gate.ts
harness/lib/radio-doc.ts
harness/lib/scope-gate.ts
harness/lib/gate-suite.ts
harness/gates/radio.ts
harness/self-test/radio-gate.test.ts
harness/self-test/scope-gate.test.ts
harness/self-test/hook-acceptance.test.ts
package.json
docs/execution/phases/00-foundation.md
docs/execution/phases/index.jsonl
docs/execution/phases/index.schema.json
docs/execution/runs/P0-T57/**
docs/execution/radio/P0-T57-radio.md
docs/execution/reviews/**
docs/execution/retrospective/**
```

- 용도 한정: `ADR-0011`은 상단 개정 표시 한 줄에만, `CLAUDE.md`·`TOOLING.md`는 게이트·절차 서술의 정합 갱신에만, `gate-suite.ts`는 커밋 게이트 등록에만, `hook-acceptance.test.ts`는 픽스처 저장소가 신설 검사를 통과하는 데 필요한 최소 추가에만 쓴다. `index.jsonl`은 P0-T57 등록·상태 전환에만 쓴다.

## 미결 사항

- 계약 파일의 절 완비(예: `정지 조건` 필수 여부)는 게이트가 검사하지 않고 템플릿 관행으로 남는다 — 게이트는 소비하는 것만 검사한다는 이 task의 원칙. 완비 강제가 필요해지면 별도 제안으로 올린다.
- 리뷰어 감사의 형식화 위험(백스톱 무뎌짐)과 변경 기록·survey의 형식화 위험은 이 task가 해소하지 못한다. `P0-T58`의 backlog 지표가 간접 감시가 된다.
- 성공 측정: 신 형식 첫 10~15개 task에서 task당 재봉인 횟수·2회 이상 비율·봉인→done 소요(1.8/2.0/13.2h와 동일 방식), 재봉인 원인 재분류, survey가 예방한 결정 신호 수, 방법 변경 기록 대비 실제 절 불일치 수를 회고(`retrospector`)가 누적한다. 측정 항목의 정본화는 별도 제안으로 올린다.
