---
sources:
  - ../../proposals/docs-authoring-playbook.md
  - ../../2-design/adr/ADR-010-authoring-guides-in-stage-readmes.md
  - docs-sdlc-coherence.md
---

# SDLC 문서의 작성법과 틀을 정본에 옮기고 활성 문서를 그 틀로 다시 쓴다 — 구현 계획

[제안](../../proposals/docs-authoring-playbook.md)을 채택해 실행하는 비기능 task다. 결정은 [ADR-010](../../2-design/adr/ADR-010-authoring-guides-in-stage-readmes.md)에 있다. 틀과 절별 작성법의 본문은 제안서가 정본이고 여기 옮겨 적지 않는다. 여기는 입력, 완료 조건, 바꿀 파일, 묶음 순서, 리스크, 검증이다. 이 plan 자체가 제안서 9장의 비기능 plan 틀로 쓴 첫 문서다.

## 입력 명세·기준

- 제안서 2~13장의 틀과 작성법, 15.1의 채택 항목. 채택하며 달리 정한 넷은 제안서 「결정 기록」에 있다
- [docs-sdlc-coherence plan](docs-sdlc-coherence.md)의 묶음 D·E·F — 이 plan이 이어 나른다. 그 plan의 묶음 A~C는 #335·#336·#337과 C2 PR로 끝났다
- 기준 커밋은 C2 PR이 merge된 main이다. `2-design/`은 `system/`·`modules/`·`design-system/`·`spec/`·`adr/`로 서 있고 옛 폴더 셋은 없다

## 완료 조건

### AC-01

- 전제: 제안서 3~13장이 든 문서 종류
- 행동: 작성자가 그 종류의 소유 README를 연다
- 관찰 결과: 「용도·작성 시점 / 필요한 입력 / 복사용 틀 / 절별 질문 / 검토 기준」이 그 README 한 곳에 있고, 제안서에만 남은 현행 규칙이 없다
- 근거: ADR-010

### AC-02

- 전제: 단계 README 여섯과 `modules/README.md`
- 행동: 읽는다
- 관찰 결과: 여섯은 「역할 / 문서 지도 / 입력과 산출물 / 다음 단계로 넘기는 조건」, `modules/README.md`는 「영역 지도 / 공통 용어 / 영역 사이의 책임과 의존 / 경계의 미정」이다. 기존 문장은 절 아래로 옮겨졌고 지워지지 않았다

### AC-03

- 전제: `backlog.md`·`handoff.md`
- 행동: 읽는다
- 관찰 결과: backlog는 표 한 곳(`작업 ID / 작업 / 상태 / 선행 작업 ID / spec 또는 plan / 검증·완료 근거`, 상태 다섯), handoff는 「다음 작업 / 재개 맥락」이다. 옛 행의 문장은 그대로고 열린 결정·상시 주의·완료 목록은 소유 문서로 갔다. `session-recorder`가 이 형식을 읽고 쓴다

### AC-04

- 전제: `modules/<영역>/README.md`·`design.md` 열둘, 화면 문서 열넷(대시보드 분할 뒤 열여섯), `system/` 넷
- 행동: 제안서 5~7장의 틀과 대조한다
- 관찰 결과: 절 순서가 틀과 같고 규칙 ID·행위 앵커가 유지된다. 결정 내용은 옮기기 전과 같다 — 새 규칙·새 상태·새 문안이 없다. 판정 예시·상태 전이·계약 표의 행마다 그 근거 규칙 ID가 있다

### AC-05

- 전제: `system/screens/dashboard.md`와 짝 시안
- 행동: 출근 인증과 사유 작성을 뺀다
- 관찰 결과: `modules/attendance/screens/check-in.md`·`excuse.md`와 시안 셋이 서고 대시보드가 둘을 링크한다. `sian-auditor`가 문서와 시안의 어긋남 0을 PR 본문에 남긴다

### AC-06

- 전제: `tests/lint/`
- 행동: `pnpm test`
- 관찰 결과: 규칙 ID 앵커·`sources` 경로 실존, backlog 선행 작업 ID 실존, intent·spec·plan 슬러그 일치, 승인 뒤 `sources` 변경 PR의 영향 확인 절 — 넷이 돌고 초록이다. 과거 완료 작업은 범위 밖으로 둔다

### AC-07

- 전제: 제안서 둘(`docs-sdlc-coherence`·`docs-authoring-playbook`)과 sdlc plan
- 행동: 완료 기준을 대조한다
- 관찰 결과: 두 제안서에 완료 기록이 있고 sdlc plan의 완료 기준 다섯이 전부 선다. 통신 지연 규칙(ATT-017) → attendance/design → check-in 화면 → 테스트 자리까지 링크로 따라가진 것을 PR 본문이 보인다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `docs/README.md` | 공통 작성법(2장), 협업 기록 틀(13.2·13.3), 변경 전파 | AC-01 |
| `docs/{1-plan,2-design,3-build,4-test,5-deploy,6-maintain}/README.md` | 네 절 틀, 문서 종류별 작성법 | AC-01·AC-02 |
| `docs/2-design/{modules,design-system}/README.md`, `docs/{proposals,observations}/README.md` | 예외 틀과 작성법 표 | AC-01·AC-02 |
| `docs/4-test/{strategy,execution}.md` | test-planner 정의문·ADR-003의 층 기준, README의 실행 항목 | AC-01 |
| `docs/5-deploy/{environments,procedure}.md`, `docs/6-maintain/{monitoring,response,metrics}.md` | 틀과 머리. 미정은 미정으로 | AC-01 |
| `docs/backlog.md`·`docs/handoff.md`·`docs/CHANGELOG.md` | 새 형식 | AC-03 |
| `.claude/agents/{session-recorder,test-planner,implementer,pr-diff,sian-writer,sian-auditor,docs-researcher}.md` | 읽을 작성법 링크, 새 형식 | AC-03 |
| `docs/2-design/modules/*/README.md`·`design.md` | 5장 틀 | AC-04 |
| `docs/2-design/modules/*/screens/*.md`·`system/screens/*.md`와 시안 | 7장 틀, 대시보드 분할 | AC-04·AC-05 |
| `docs/2-design/system/*.md` | 6.1 틀, 공통 조항 틀 | AC-04 |
| `docs/1-plan/{prd,roadmap,scenarios,metrics}.md`·`intent/schedule-admin.md` | 4장 틀 | AC-04 |
| `docs/2-design/spec/dashboard.md`·활성 plan | `sources` frontmatter | AC-06 |
| `tests/lint/` | 검사 넷 | AC-06 |
| `REVIEW.md` | 영향 검토 축 | AC-06 |

## 구현 순서

PR 하나가 묶음 하나다. 브랜치는 `docs/authoring-playbook-<글자>`. 각 PR이 혼자 CI 초록이어야 하고, 형식을 바꾼 문서와 그것을 읽는 검사·정의문은 같은 PR에 탄다. 작성법이 먼저 서야 그 틀로 다시 쓸 수 있으니 순서가 곧 의존이다.

1. **A. 채택 기록** — 제안 `accepted`와 결정 기록, ADR-010, 이 plan, backlog·handoff, sdlc plan에 D·E·F를 잇는 줄
2. **B1. 공통 작성법과 기획·설계·구현 README** — `docs/README.md`(2장·변경 전파), `1-plan`·`2-design`·`3-build` README를 네 절 틀로 세우고 4·5·6.1·6.2·7·8·9장의 작성법을 옮긴다. `2-design/README.md`의 기존 절(갈래의 경계·규칙 ID·sources·파일 종류별 절 순서·spec·화면 문서)은 새 절 아래로. `design-system`·`modules`·`proposals`·`observations` README도 여기
3. **B2. 검증·배포·운영** — `4-test`·`5-deploy`·`6-maintain` README를 네 절 틀로. `strategy.md`에 test-planner의 「층을 고르는 법」·「integration을 고르는 기준」·「중복을 만들지 않는다」와 ADR-003의 테스트 층 조항, `execution.md`에 README의 훅·문서 검사·돌릴 때·integration과 e2e를 실행 항목 틀로. `5-deploy` README의 CI 문단을 `procedure.md`(빌드 전 env 주입)와 `execution.md`로, `environments.md`는 11.1 틀. `6-maintain`의 최소 안내를 세 파일 머리로. `test-planner` 정의문은 strategy를 읽는다
4. **C. 상태 소유권** — `docs/README.md` 협업 기록 작성법(13.2·13.3), backlog 표, handoff 두 절, CHANGELOG 머리, `session-recorder`·`implementer`·`pr-diff` 정의문, `REVIEW.md` 영향 검토 축, `spec/dashboard.md`와 진행 중 plan에 `sources`
5. **D. 계정 시범** — `modules/account/` README·design·screens 넷을 5·7장 틀로. 여기서 답하기 어렵거나 겹치는 항목은 B1의 작성법을 고친다
6. **E. 나머지 영역 다섯** — README·design 열을 5장 틀로
7. **F1. system 넷** — `system/` 넷을 6.1 틀과 공통 조항 틀로
8. **F2. 대시보드 분할** — `dashboard.md`에서 `check-in.md`·`excuse.md`를 빼고 셋을 7장 틀로 쓴다. `sian-writer`가 시안 셋, `sian-auditor`가 대조
9. **F3. 나머지 화면 일곱** — `schedule-worker`·`schedule-admin`·`qr`·`payroll`·`wages`·`approvals`·`stats`를 7장 틀로. 시안은 그대로 두고 `sian-auditor`가 절 이동 뒤에도 어긋남 0인지 본다
10. **G. 기획** — `prd`·`roadmap`·`scenarios`·`metrics`·`intent/schedule-admin`을 4장 틀로. 목표선 숫자는 채우지 않는다
11. **H. 검사와 마감** — `tests/lint/` 넷, 전파 확인, 두 제안서 완료 기록, sdlc plan 완료 기준 체크, backlog 행 `done`

각 묶음의 분업은 이렇다. 총괄이 B1·B2·C의 작성법 본문과 D~G의 판정 예시·상태 전이·계약 표를 확인하고, subagent가 옮기기·틀 맞추기·시안·검사 코드를 만든다. `docs-researcher`가 묶음마다 옮기기 전 문장 목록을 뽑아 옮긴 뒤와 대조한다.

## 리스크·전환·되돌리기

- **결정이 바뀌는 것** — 틀에 맞추다 문장을 새로 쓰면 결정이 섞여 들어온다. 매 PR에 `scripts/check-moved-lines.mts`를 돌려 옛 문장이 새 파일에 있는지 세고, 없는 줄은 PR 본문에 이유를 적는다. D~G는 문장 재구성이 허용되니 검사가 남긴 줄이 많아지는데, 그 줄마다 「같은 뜻의 새 문장」을 PR 본문이 짝지어 보인다
- **표를 채우려고 규칙을 만드는 것** — 판정 예시·상태 전이·계약 표는 규칙 ID가 근거인 행만 둔다. 근거 없는 행은 「미정」 절의 Q-nn으로 간다
- **정의문·검사가 옛 절 이름을 읽는 것** — 절 이름이 바뀌는 PR에 그것을 읽는 정의문·검사를 같이 태운다. `design-map.ts`·`sian-html.ts`·`doc-links.ts`가 그 자리다
- **되돌리기** — 묶음이 PR 하나라 squash 커밋 하나를 revert하면 그 묶음 전이 돌아간다. B1 이후 묶음은 B1의 작성법에 기대니 B1을 되돌리면 뒤를 다 되돌린다
- **다른 세션과의 충돌** — 제안서 파일은 다른 세션이 만들었다. A가 그 파일을 처음 커밋한다

## 검증 방법

| 완료 조건·규칙 참조 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- |
| AC-01·AC-02 | 수동 — README 열고 절 순서 대조 | `pr-diff` | 절 넷, 작성법 다섯 항목 |
| AC-01~AC-04 | `tests/lint/doc-links.ts`·`doc-map.ts`·`design-map.ts`·`legacy-doc-paths.ts` | `pnpm test` | 초록 |
| AC-04 | 문장 보존 | `node --experimental-strip-types scripts/check-moved-lines.mts origin/main <옛> -- <새>` | 남은 줄이 PR 본문의 짝 목록과 같다 |
| AC-05 | `sian-auditor` | 정의문 | 어긋남 0 |
| AC-06 | `tests/lint/` 새 검사 넷과 짝 테스트 | `pnpm test` | 초록, 회귀 케이스 포함 |
| 전부 | 매 PR | `pnpm lint` · `pnpm format:check` · `pnpm typecheck` · `pnpm test`, `pnpm tokens:css` 결과가 `src/app/globals.css`와 같다 | 초록 |

## 안 하는 것

완료된 spec·plan·ADR·log의 소급 형식 변경, `spec/dashboard.md` 본문 재작성(착수 task가 한다 — `sources`만 붙인다), 배포·운영 문서의 실제 값(첫 출시 준비 task), 지표 목표선, release·incident·evidence 파일 생성, 문서 사이트, 생성기·스키마 검사.
