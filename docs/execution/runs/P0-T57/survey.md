# P0-T57 봉인 전 실태 조사

2026-08-18 조정 세션이 수동으로 수행했다. `design-surveyor`가 아직 없어 그 산출물 형식의 첫 실물을 겸한다. 사실만 적고 제안은 적지 않는다.

## 1. 해시가 만들어지고 검사되는 자리

- `harness/lib/radio-gate.ts:316` — `readRadioContent`가 파일 전체 UTF-8 바이트를 `createHash("sha256")`에 넣는다. 절이나 마커 개념이 없다.
- `harness/lib/radio-gate.ts:29` `checkRadioBindings` — `index.jsonl`의 `development_approval.radio_sha256`과 위 해시를 비교한다.
- `harness/lib/radio-gate.ts:320` `createRadioContentReader` — 경로당 1회 읽고 캐시한다. `runRadioGate`(`:330`)가 바인딩 검사(`:340`)와 렌즈 검사(`:350`)에 같은 reader를 넘긴다.
- 호출부는 셋이다: `harness/gates/radio.ts:1`, `harness/lib/gate-suite.ts:4`, `harness/self-test/radio-gate.test.ts:9`.

## 2. RADIO 본문을 읽는 다른 소비자

- `harness/lib/scope-gate.ts:30-62` — `radio_ref` 파일에서 `## 변경 허용 경로` 절의 첫 코드블록을 `parseAllowedPaths`(`harness/lib/radio-doc.ts`)로 파싱한다. glob 매칭은 `harness/lib/glob.ts`의 `matchesAnyGlob`이고 `**`·`*`·`?`를 지원한다. **깊이를 세는 검사는 없다.**
- `harness/lib/radio-gate.ts:178` `checkRiskLensTables` — 같은 `radio_ref` 파일에서 위험 렌즈 표를 파싱한다(`:197`에서 본문, `:201`에서 허용 경로). **렌즈 표와 허용 경로가 같은 파일에 있다는 전제가 코드에 박혀 있다.**
- 렌즈 면제는 `harness/lib/radio-gate.ts:181` `exemptTasks`로 존재하며 스냅숏 파일에서 로드된다(`:229-279`에 스키마 검증).
- `gate:handoff`·`gate:retro`·`gate:tdd`는 RADIO를 읽지 않는다 (`grep -ln "radio"` 결과 없음).

## 3. RADIO 53개의 구조 실태

- 봉인(SHA 결속)된 RADIO는 52개. `README.md` 제외.
- **개정 이력 위치**: 47개가 8행(문서 머리)에 있다. `P0-T42`만 12행. 초기 6개(`P0-T28`~`T33`)는 절 자체가 없다.
- **절 이름 편차**:
  - `범위와 비목표`·`불변 규칙`·`기술 인수 조건`·`위험 기반 테스트`가 없는 것은 초기 6개(`P0-T01`, `P0-T29`~`T33`)뿐이다. 그 이후 47개는 절 이름이 일치한다.
  - **`정지 조건` 절은 40개에 없다.** 최근 13개(P3 후반~P4, `P0-T46`~`T48` 등)에만 있다. 템플릿에 늦게 들어온 절이다.
  - `변경 허용 경로`가 없는 것은 `P0-T28`·`P0-T30` 둘이다(legacy-v2 계약 세대).
- 확정 모양·문서 개정 목록을 담은 RADIO는 `P0-T48` 하나다. 디자인 확정 절차가 `P0-T47`에서 도입되어 첫 사용자다. `P0-T48`은 468행으로 최장이고, 둘째가 `P0-T02` 372행, 나머지는 75~214행이다.

## 4. self-test의 전제

- `harness/self-test/radio-gate.test.ts` 465행. 헬퍼 `writeRadio`·`writeRadioWithRiskLens`가 RADIO 마크다운을 만들고 `:58`에서 **전체 마크다운을 해싱해** `radio_sha256`에 넣는다. 전체 파일 해싱을 전제한 픽스처가 테스트 전반의 기반이다.
- `harness/self-test/scope-gate.test.ts`도 같은 계열 픽스처를 쓴다(허용 경로 파싱).

## 5. 문서·스킬의 참조 지점

- `docs/workflow/WORKFLOW.md:116` — RADIO의 Architecture 렌즈 정의.
- `WORKFLOW.md:137` — 확정된 모양이 「RADIO의 Architecture에 들어가고 RADIO 승인 하나로 함께 봉인된다」.
- `WORKFLOW.md:151` — 문서 개정 목록 표가 「RADIO의 Architecture로 들어가 봉인된다」.
- `WORKFLOW.md:346` — worker가 「Architecture, Data model, Interface, Optimizations 또는 공통 개발 규칙의 판단은 2단계로 반환한다」.
- `.claude/skills/publish-ui/SKILL.md:16` — 확정 모양이 「RADIO Architecture에 들어가고 RADIO 승인과 함께 봉인된다」.
- `docs/standards/adr/0011-planning-radio-development-contract.md:25` — 「개발 승인은 **고정 경로 RADIO**의 revision과 정확한 **전체 UTF-8 바이트 SHA-256**에 결속한다」.
- `WORKFLOW.md:306` — 「RADIO의 revision과 정확한 전체 파일 SHA-256을 기록」.

## 6. 걸린 규칙과 게이트

- `gate:scope`는 staged 전체를 검사한다. 재봉인 커밋은 `in_progress` 자리가 비어야 커밋된다(기존 운영 사례).
- 커밋 메시지 task ID 강제(`commit-msg-gate`), pre-commit에서 저장소 게이트 6종이 돈다.
- `DEV-CODE-07` — 코드 주석 금지. 게이트 코드 수정 시에도 적용된다.

## 7. 인터뷰에서 정해야 할 것으로 보이는 긴장 (사실 관계만)

- `checkRiskLensTables`가 렌즈 표와 허용 경로를 **한 파일에서** 읽는다(§2). 렌즈 표가 다른 파일로 가면 이 함수의 읽기 대상이 갈라진다.
- `WORKFLOW.md:346`은 Architecture·Data model·Interface·Optimizations 판단을 **2단계로 반환**하라고 정한다. 방법 파일을 구현이 바꿀 수 있게 하는 것과 이 조항의 관계는 코드·문서 어디에도 정의돼 있지 않다.
- `정지 조건` 절이 40개 RADIO에 없다(§3). 계약 파일의 절 구성을 게이트가 검사한다면 이 절의 필수 여부가 정해져 있지 않다.
- `ADR-0011:25`의 「고정 경로 RADIO」 문구가 단수다. 파일이 둘이 될 때 이 문구의 개정 필요 여부는 ADR 개정 판단에 속한다.
