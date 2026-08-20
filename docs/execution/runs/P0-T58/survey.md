# P0-T58 봉인 전 실태 조사

2026-08-18 조정 세션이 수동으로 수행했다(P0-T57의 조사 의무를 선취 적용). 사실만 적고 제안은 적지 않는다.

## 1. backlog 실태

- `docs/execution/reviews/backlog.md` 373행. 완료 `- [x]` 139건, 미결 `- [ ]` 223건. 미결은 전부 `medium`(123)·`low`(99)다 — `critical`·`high`는 형식상 backlog에 오지 않는다(`REVIEW.md:183`).
- 성장 속도: 2026-08-08 224행에서 2026-08-17 373행. 하루 16.5행.
- **미결 223건 중 29건이 한 줄 형식을 어긴다** — 제목 안에 `—`가 또 들어가 `근거 파일` 필드가 기계 파싱되지 않는다.
- 파일당 미결 분포: 1건짜리 파일 119개, 2건 30개, 3건 10개, 4건 1개, 5건 2개. **외톨이(1건)가 119건으로 절반을 넘는다.**
- phase별 미결: P0 74 · P2 46 · P1 40 · P3 39 · P4 23.

## 2. 소비 규칙의 현재 위치

- `REVIEW.md:104` — 「`medium`·`low`는 backlog에 누적했다가 몇 task 주기로 정비 task 하나에 묶어 일괄 처리한다」(2026-08-07 사용자 결정). 주기·문턱·트리거는 없다.
- `REVIEW.md:197` — 「backlog 항목을 task로 만드는 것은 사용자 승인이 있을 때만 한다」. 같은 절 `:198` — 「검증 결과가 곧바로 `planned` task가 되지 않는다」. 승격은 1단계(기획) 경유.
- `REVIEW.md:186` — 「해결하면 줄을 지우지 않고 `- [x]`로 바꾼다. 발견 이력은 남긴다」. 폐기·이월 표기는 정의돼 있지 않다.
- 실제 소비 사례는 P3뿐 — `P3-T08`(단언 10건·e2e 위생 7건 흡수), `P3-T10`·`P3-T11`(명시 종결). 「no fix round required」로 닫힌 `P1-T04`(13건)·`P1-T03`(9건)·`P2-T02`(9건)는 발견 전량이 미결로 남았다.

## 3. 끼울 자리

- `retrospector`(`.claude/agents/retrospector.md:3`)가 「task를 닫기 직전에」 실행된다 — task 경계 훅이 이미 존재한다.
- `harness/lib/index-gate.ts`에는 phase 완료·마감 개념이 없다(`grep phase` 결과는 스키마 오류 힌트 문자열뿐). phase-마감 검사는 신설이다.
- 대시보드는 `harness/dashboard/reviews.ts`가 backlog를 이미 읽는다(`main.ts`·`render.ts`·`collect.ts`에도 참조).
- 게이트 배치 관례: 로직 `harness/lib/<name>-gate.ts`, 래퍼 `harness/gates/<name>.ts`, `gate-suite.ts`의 `REPOSITORY_GATES`·`COMMIT_GATES` 등록, self-test 동반.
- 면제·유예 스냅숏 선례: `config/radio-lens.json`(`exemptTasks`, 사전순·중복 없음 스키마, self-test 전수 대조).

## 4. 채번과 동시성

- task ID 최대치는 `P0-T58`(이 task). ID는 재사용·삭제 금지(`CLAUDE.md`).
- `index.jsonl`은 진행 중 task의 worker도 수정하는 파일이라, 인터뷰로 인한 갱신은 task 경계로 미룬다(`WORKFLOW.md:53`) — 자동 기입도 같은 파일을 쓰므로 같은 제약을 받는다.
- 병렬 세션(사용자의 다른 탭)이 같은 시기에 index를 수정할 수 있다 — 2026-08-18 현재도 P0-T48 세션이 작업 트리에 T48 갱신을 얹어둔 상태다.

## 5. 걸린 규칙

- `DEV-CODE-07` 주석 금지 — harness 코드 포함.
- 리뷰 계약의 비밀값 금지(`REVIEW.md:191`) — backlog·결과 파일 공통.
- 커밋 메시지 task ID 강제, `gate:scope`의 staged 전수 검사.

## 6. 인터뷰에서 정해야 할 것으로 보이는 긴장 (사실 관계만)

- 형식 위반 29건의 위반 양상이 「제목 속 `—`」라 구분자 파싱 규칙(첫 `—`냐 마지막 `—`냐)이 정의되지 않으면 검사기를 만들 수 없다.
- 자동 기입이 `proposed`를 만들 때 ID 채번이 병렬 세션의 채번과 충돌할 수 있다(§4).
- `REVIEW.md:186`이 완료 표기만 정의해, 노후 폐기·low 이월을 적을 표기가 없다.
