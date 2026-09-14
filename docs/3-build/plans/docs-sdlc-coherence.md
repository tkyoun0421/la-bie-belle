# SDLC를 유지하며 설계를 업무 영역으로 모은다

[제안](../../proposals/docs-sdlc-coherence.md)을 채택해 실행하는 비기능 task다. 결정은 [ADR-009](../../2-design/adr/ADR-009-design-modules-and-stage-links.md)에 있다. 목표 구조·이관 명세·파일 종류별 절 순서는 제안서가 정본이고 여기 옮겨 적지 않는다. 여기는 실행 묶음, 묶음마다 같이 바꿀 소비자, 검증 방법, 완료 기준이다.

**옮기되 바꿔 쓰지 않는다.** 이동은 문장 단위다. 원문의 문장을 지우거나 고쳐 쓰지 않고 자리만 옮긴다. 링크 경로는 새 자리로 고친다. 예외는 아래 「채택하며 정한 것」 둘뿐이다.

## 채택하며 정한 것

제안서가 발견한 불일치 둘은 다음으로 닫는다. 정본에 반영하는 자리는 각 PR이다.

- **연락처 수정** — [account/design.md](../../2-design/modules/account/design.md#행위별-구현-계약)가 정본이다. `profile_private` 본인 행 직접 갱신이고 함수가 아니다. [account/design.md](../../2-design/modules/account/design.md#프로필-제출연락처사진)의 「이름·연락처 변경(`set_display_name`·`submit_profile`)」은 「이름 변경(`set_display_name`)과 연락처 변경(`profile_private` 직접 갱신)」으로 고친다. 낙관적 처리는 그대로다.
- **통신 지연** — [attendance/README.md](../../2-design/modules/attendance/README.md#누가-보나)가 정본이다. 「누른 시각과 닿은 시각이 5분 넘게 다르면」이다. 그러려면 닿은 시각이 저장돼야 하니 `check_ins`에 `received_at`(서버 `now()`)을 더한다. [attendance/design.md](../../2-design/modules/attendance/design.md#인증은-화면이-열린-동안-다시-시도한다)의 「둘이 5분 넘게 다르면」은 「`received_at`과 `reported_at`이 5분 넘게 다르면」으로 고친다. `checked_at`은 판정용으로 그대로다. 10분 초과 지연의 처리는 정하지 않는다.

## 규칙 ID

`modules/<영역>/README.md`의 굵은 첫 문장 규칙마다 바로 위에 `### <접두>-<번호>` 제목을 둔다. 접두는 ACC·SCH·SWP·ATT·PAY·NTF, 번호는 문서 순서로 001부터다. 굵은 첫 문장이 없는 절(schedule의 「근무표의 생애」 등)은 총괄이 규칙 문장을 골라 같은 꼴로 붙인다. 용어 절과 「아직 안 정한 것」에는 붙이지 않는다. ID 제목의 앵커는 `#att-003`이다.

## 작업 ID

작업 ID는 파일 슬러그다. intent·spec·plan이 있는 task는 그 파일명, 없는 task는 backlog 행에서 정한 kebab-case 슬러그다. 뒤에 파일이 생기면 그 슬러그를 쓴다.

## 묶음

PR 하나가 묶음 하나다. 각 PR이 혼자 CI 초록이어야 하고, 문서 이동과 그 경로를 읽는 검사·정의문·설정은 같은 PR에 탄다. 브랜치는 `docs/sdlc-coherence-<글자>`다.

묶음 D·E·F는 [docs-authoring-playbook plan](docs-authoring-playbook.md)이 이어 나른다 — 옮긴 문서를 틀에 맞춰 다시 쓰는 일과 한 번에 하기 위해서다. 그 plan의 완료가 이 plan의 완료다.

### A. 채택 기록

제안 status → `accepted`와 결정 기록, ADR-009, 이 plan, ADR-004·ADR-005의 후속 결정 링크, backlog·handoff 갱신.

### B. 골격과 계정 시범

- `docs/README.md` — 문서 지도 정본. CLAUDE.md의 「문서 지도」는 이 파일을 링크하는 한 줄로 줄이고, `doc-map.ts`는 `docs/README.md`를 읽는다
- `2-design/README.md` — 설계 지도, 공통 기준 적용 규칙, 파일 종류별 절 순서, 규칙 ID 형식, `sources` 형식, 화면 작성 틀(design-system README에서 옮김)
- `2-design/modules/README.md` — `domain/README.md`를 옮기고 영역별 design·screens 링크를 더한다
- `2-design/modules/account/` — `README.md`(domain/account + 규칙 ID), `design.md`(data-model·api·runtime의 account를 행위별로 통합, 연락처 결정 반영), `screens/`(login·profile·members-pending·members 문서와 시안, flows/account의 화면별 흐름을 각 문서의 「흐름」 절로)
- 옛 파일 삭제: `domain/account.md`, `architecture/{data-model,api,runtime,flows}/account.md`, `design-system/pages/{login,profile,members-pending,members}.*`
- 소비자: `sian-html.ts`·`design-map.ts`(screens 글롭과 지도 대조), `.prettierignore`, `architecture/README.md` 도메인 지도 행, `design-system/README.md` 지도, `prd.md`·ADR-002·ADR-004·spec·plans·observations의 account 링크, 정의문(docs-researcher·architecture-advisor·sian-writer·sian-auditor)

### C. 나머지 영역과 system

- `2-design/system/{architecture,data-access,runtime,navigation}.md` — architecture/README와 네 폴더 README를 제안서 배정표대로 가른다. 영역별 문단은 해당 design으로
- `modules/{schedule,attendance,payroll,swap,notification}/` — README(규칙 ID)·design(통신 지연 결정 반영)·screens(schedule-worker·schedule-admin → schedule, qr → attendance, payroll·wages → payroll)
- `system/screens/{dashboard,approvals,stats}` — 이동만. dashboard 추출은 D
- flows 다섯을 화면 문서의 「흐름」 절과 design의 행위별 계약으로 분배. flows/attendance의 출근 인증·사유 흐름은 D까지 dashboard 문서에 둔다
- `architecture/`·`domain/`·`design-system/pages/` 삭제, `legacy-doc-paths.ts`에 세 경로 추가
- 소비자: B와 같은 검사·정의문, backlog 「대기」 행의 링크, handoff 링크, `design-system/README.md`의 페이지 목록 제거

### D. dashboard 추출

`system/screens/dashboard.md`에서 출근 인증·위치·QR·성공·실패·재시도를 `modules/attendance/screens/check-in.md`로, 사유 작성·제출·실패·닫기를 `modules/attendance/screens/excuse.md`로 뺀다. 시안도 `sian-writer`가 같은 셋으로 나누고 `sian-auditor`가 문서와 대조한다. 대시보드는 둘을 링크한다. 화면 상태·문안·시각을 새로 정하지 않는다.

### E. 검증·배포·운영과 상태 소유권

- `4-test/` — `strategy.md`에 test-planner 정의문의 「층을 고르는 법」·「integration을 고르는 기준」·「중복을 만들지 않는다」와 ADR-003의 테스트 층 조항을 옮기고 정의문은 여기를 가리킨다. README의 훅·문서 검사·돌릴 때·integration과 e2e는 `execution.md`로. `evidence/`는 자리만
- `5-deploy/` — README의 CI 문단을 `procedure.md`(빌드 전 env 주입 순서)와 `4-test/execution.md`(테스트 실행)로, 알아둘 것을 `environments.md`로. `releases/`는 자리만
- `6-maintain/` — README의 최소 안내를 `monitoring.md`·`response.md`·`metrics.md`의 머리로. `incidents/`는 자리만
- 단계 README 여섯을 「역할 / 문서 지도 / 입력과 산출물 / 다음 단계로 넘기는 조건」으로 세운다. 기존 문장은 절 아래로 옮긴다
- `backlog.md` — 표 한 곳. `작업 ID / 작업 / 상태 / 선행 작업 ID / spec 또는 plan / 검증·완료 근거`, 상태는 `candidate / blocked / ready / active / done`. 행의 문장은 그대로 옮긴다
- `handoff.md` — 「다음 작업」「재개 맥락」 두 절. 열린 결정·상시 주의·완료 목록은 소유 문서로
- 정의문: `session-recorder`(handoff·backlog 새 형식), `test-planner`(strategy 참조), `implementer`·`pr-diff`(접촉 금지 문서 경로)
- 활성 spec·plan에 `sources` frontmatter — `spec/dashboard.md`, 진행 중 plan

### F. 검사와 전파 확인

- `tests/lint/`에 넷 — 규칙 ID 참조(`#xxx-nnn` 앵커가 실존)·`sources` 경로 실존, backlog 표의 선행 작업 ID가 표에 있음, 기능의 intent·spec·plan 슬러그 일치, spec `approved` 뒤 `sources` 문서가 바뀐 PR에 검토 기록(본문의 「영향 확인」 절)이 있음. 과거 완료 작업과 비기능 task는 범위 밖으로 둔다
- `REVIEW.md`에 영향 검토 축 — 기준을 고친 PR이 `sources`로 그것을 든 spec·plan을 봤는지
- 전파 확인 — 통신 지연 규칙(ATT-nnn) → attendance/design → 화면 문서 → 테스트 자리까지 링크로 따라가지는지 PR 본문에 남긴다
- 제안서에 완료 기록, backlog 행 done

## 검증

- 매 PR: `pnpm lint` · `pnpm format:check` · `pnpm typecheck` · `pnpm test`. `pnpm tokens:css` 결과가 `src/app/globals.css`와 같다
- 매 PR: 문장 보존 검사 — 옛 파일의 제목·목차·링크가 아닌 줄이 새 파일 어딘가에 그대로 있는지 스크립트로 센다. 없는 줄은 PR 본문에 이유와 함께 적는다(허용되는 것은 「채택하며 정한 것」 둘과 지도·안내 문장뿐)
- 매 PR: `pr-diff`가 삭제 파일과 총괄 문서 접촉을 본다
- D: `sian-auditor` 결과를 PR 본문에

## 완료 기준

- [ ] 제안서 「완료 기준」 열한 항목이 전부 선다
- [ ] 연락처 수정과 통신 지연이 위 결정대로 정본 한 곳에 적히고 다른 문서는 링크한다
- [ ] 옛 경로 셋(`2-design/domain/`·`2-design/architecture/`·`design-system/pages/`)이 `legacy-doc-paths.ts`에 있고 `docs/log/` 밖에 남지 않는다
- [ ] 화면 문서·시안 14쌍이 소유 위치에 있고 `sian-html.ts`·`design-map.ts`가 그 자리를 읽는다
- [ ] 정의문 전부가 새 경로를 가리킨다. 옛 경로를 읽는 정의문이 없다

## 안 하는 것

문서 사이트, 새 작업 관리 시스템, `src/` FSD 재편, 배포 플랫폼 결정, 배포·운영 상세 내용 작성(첫 출시 준비 task), 10분 초과 통신 지연의 정책, 과거 완료 spec·plan의 소급 형식 변경, 페이지 문서 본문의 절 순서 재배열.
