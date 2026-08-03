# P0-T29 RADIO 개발 설계

- 상태: Superseded(구조 재편으로 재설계 필요)
- revision: 1
- 기획 승인: user, 2026-07-24 (유효)
- 개발 설계 승인: 무효 — 2026-08-03 [ADR-0013](../../standards/adr/0013-project-layer-structure.md) 구조 재편으로 철회
- 무효 사유: 이 설계는 제거된 하네스의 파일 구조(`.agents/**`)와 옛 문서 경로를 전제한다. 근거 결정 [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md)도 보류 상태다. P0-T29는 제품 승인만 보존한 채 `design_pending`으로 반환되었고, 새 RADIO는 P0-T31 하네스 재구축 이후 설계 단계에서 다시 승인한다.
- 아래 본문은 재설계의 출발점으로만 참조하며 현재 실행 근거가 아니다.
- 관련 spec: DOCS:SDD, ADR:0011, ADR:0012
- 적용 깊이: 일반
- test mode: tdd
- 예정 check IDs: dashboard-decision-contract, dashboard-refresh-contract, dashboard-data, dashboard-smoke, runner-lifecycle, runner-blocked

## Requirements

- 범위와 비목표:
  - `.agents/dashboard/index.html`의 정적 생성 구조를 유지하면서, 실행 상태를 읽기 전용으로 해석한 단일 다음 행동, 후보, 직접 의존성·차단 사유, phase 진행과 신선도 상태를 표시한다.
  - task 최종 상태(`done`, `blocked`, `skipped`)와 phase 경계 상태를 처리하는 종료 경로는 readiness 보고서와 dashboard projection을 갱신한다.
  - dashboard 갱신 실패는 task 결과를 막지 않는다. 실패·오래됨 상태와 안전한 오류 요약을 남기며 이전 데이터를 최신인 것처럼 표시하지 않는다.
  - task 승인, 상태 전환, 구현 실행, 자동 task 선택, 실시간 서버·파일 감시, 전체 의존성 그래프와 새 외부 의존성은 범위 밖이다.
- 불변 규칙:
  - 추천은 advisory이며 `index.jsonl`과 task 실행 상태의 정본을 변경하지 않는다.
  - 추천 우선순위는 `in_progress` → `blocked` → `planned` → `design_pending` → `proposed`, 동순위에서는 `must` → `should` → `could` → index 선언 순서다.
  - readiness ROI는 개선안 정렬에만 쓰고 실행 경로 추천을 바꾸지 않는다.
- 기술 인수 조건:
  - manifest와 HTML은 기준 시각·기준 commit·신선도 상태를 표시하고, 원본 누락·갱신 실패를 명시한다.
  - 단일 추천 DTO는 action kind, 대상 task/phase, 이유 코드, 직접 선행 조건, 차단 사유와 관련 문서 경로를 가진다.
  - 성공과 blocked 종료 경로가 같은 refresh 계약을 사용하며, 상태·추천·신선도·모바일 렌더링을 회귀 검증한다.
- 위험 기반 테스트:
  - 단위/계약: 각 workflow 상태와 동순위 결정에서 action kind, target, 후보와 직접 조건을 검증한다.
  - 통합: 성공·blocked 종료 경로가 refresh를 호출하고, readiness 또는 dashboard 생성 실패가 task 결과를 바꾸지 않으며 stale/failed manifest를 남기는지 검증한다.
  - 브라우저 smoke: manifest의 추천·신선도·직접 경로가 생성 HTML에 표시되고 모바일 렌더링 오류가 없는지 검증한다.
  - 권한·RLS·DB·외부 서비스는 이 로컬 읽기 전용 task에 해당 없다.
- DEV-* 적용 상태:
  - `DEV-TEST-01`, `DEV-TEST-04`, `DEV-TEST-05`: 추가 결정 — 순수 추천 정책, 종료 경로, 정적 HTML 관찰 동작을 각각 검증한다.
  - `DEV-TEST-02`, `DEV-TEST-03`: 해당 없음 — DB/RLS나 버그 수정이 아니다.
  - `DEV-SEC-01`, `DEV-SEC-02`, `DEV-SEC-04`: 기본 적용 — HTML은 읽기 전용이며 비밀값·개인정보·실행 제어를 포함하지 않는다.
  - `DEV-SEC-03`, `DEV-SEC-05`: 해당 없음 — 권한·개인정보·민감 command 변경이 아니다.

## Architecture

- 책임과 FSD 경계:
  - 하네스의 순수 workflow projection 모듈이 index·workflow contract에서 실행 상태, 후보와 구조화된 recommendation DTO를 계산한다.
  - refresh orchestration 모듈이 readiness 생성, dashboard manifest 기록과 HTML 생성을 조정한다.
  - `dashboard.mjs`는 manifest와 정적 UI 생성만 담당하고 task 상태·승인을 변경하지 않는다.
  - 성공 task 완료 경로와 `integrateBlockedTask` 경로는 공통 refresh 진입점을 명시 호출한다. phase 진행은 task 상태에서 파생하며 별도 상태를 만들지 않는다.
- 서버·보안 경계:
  - 로컬 Node script만 사용하며 브라우저는 포함된 JSON을 표시하고 제어 요청을 전송하지 않는다.
  - 오류에는 파일 경로·비밀값·작업물 내용 대신 안전한 코드와 요약만 기록한다.
- Clean Code·SOLID·재사용:
  - 추천 계산, refresh 상태 기록, HTML 렌더링을 분리한다. recommendation DTO와 freshness schema는 한 모듈이 소유한다.
  - 기존 workflow contract와 index loader를 재사용하며, UI framework·그래프 library·불필요한 abstraction은 추가하지 않는다.
- DEV-* 적용 상태:
  - `DEV-ARCH-01`~`DEV-ARCH-04`: 해당 없음 — Next.js/FSD 제품 코드가 아니다.
  - `DEV-ARCH-05`, `DEV-CODE-01`~`DEV-CODE-06`, `DEV-REUSE-01`~`DEV-REUSE-05`: 기본 적용 — 하네스 책임을 작고 명확한 모듈로 분리하고 실제 공통 계약만 재사용한다.
  - `DEV-ERR-01`~`DEV-ERR-06`: 추가 결정 — 예상 가능한 refresh 실패는 manifest 상태로 표현하고 task 상태를 롤백하거나 자동 재시도하지 않는다.

## Data model

- 정본과 파생 데이터:
  - 정본은 `docs/phases/index.jsonl`, workflow contract, `.agents/reports/ai-readiness/latest.json`이다.
  - 새 파생물 `.agents/reports/dashboard/latest.json`은 `schema_version`, `generated_at`, `source_commit`, 입력 식별값, `fresh|stale|failed` 상태, 안전한 마지막 오류, execution projection, recommendation DTO, 후보와 phase summary를 소유한다.
  - `.agents/dashboard/index.html`은 manifest에서만 생성하는 표시물이다. dashboard가 없거나 생성 실패해도 정본 task 상태는 변하지 않는다.
- schema·RLS·migration:
  - 로컬 JSON 파일만 추가하며 PostgreSQL schema, migration, RLS는 변경하지 않는다.
- 트랜잭션·멱등성·동시성:
  - manifest와 HTML은 임시 파일을 완성한 뒤 원자적 rename으로 교체한다.
  - 한 번에 하나의 `in_progress` task와 기존 runner lifecycle을 전제로 한다. 같은 입력의 재생성은 동일한 execution projection을 만들며, 생성 시각만 새로 기록한다.
  - refresh 실패 시 기존 성공 생성물을 덮어쓰지 않고, 별도 freshness 상태 기록 또는 안전한 fallback HTML로 실패를 노출한다.
- 감사·보존·복구:
  - refresh 상태는 파생 운영 보고서이며 task 감사 로그가 아니다. 마지막 성공 metadata와 실패 요약만 보존하고 다음 성공 생성에서 갱신한다.
- DEV-* 적용 상태:
  - `DEV-SSOT-01`~`DEV-SSOT-05`, `DEV-DATA-01`: 추가 결정 — index/readiness를 정본, manifest/HTML을 명시적 파생물로 유지한다.
  - `DEV-DATA-02`~`DEV-DATA-05`, `DEV-MIG-01`~`DEV-MIG-05`: 해당 없음 — 인증·DB·transaction·migration 변경이 없다.
  - `DEV-TIME-01`~`DEV-TIME-05`: 추가 결정 — 생성 시각은 Node가 생성한 ISO UTC instant로 기록하고 업무 날짜·클라이언트 시각을 사용하지 않는다.

## Interface

- 입력·DTO·Result:
  - refresh 입력은 index entries, workflow contract 결과, Git 기준 commit과 선택적 readiness report다.
  - recommendation DTO는 `action_kind`, `task_id`, `phase_id`, `reason_code`, `reason`, `direct_dependencies`, `blockers`, `doc_path`를 가진다. 화면 한국어 문구는 이 DTO에서 파생한다.
  - refresh 결과는 성공 시 `fresh`, 원본 누락 또는 현재 입력과 불일치하면 `stale`, 생성 예외면 `failed`로 구조화한다.
- cache·offline:
  - 정적 HTML은 브라우저에서 네트워크 요청·공유 cache·영속 업무 cache를 사용하지 않는다. refresh할 때만 로컬 정본을 다시 읽는다.
- 외부 계약·실패:
  - 새 외부 API, 브라우저 mutation, runtime server는 없다. readiness 보고서가 없거나 갱신에 실패해도 execution projection은 안전하게 표시하고 readiness 영역은 누락/오래됨으로 표시한다.
- DEV-* 적용 상태:
  - `DEV-CACHE-01`~`DEV-CACHE-06`, `DEV-OFFLINE-01`~`DEV-OFFLINE-04`: 추가 결정 — 정적 표시물은 cache 정본이 아니며 매 refresh에 원본을 읽는다.
  - `DEV-OBS-01`~`DEV-OBS-04`: 추가 결정 — refresh 성공·실패·입력 기준 commit·최종 freshness를 JSON과 실행 로그에서 관측한다.
  - `DEV-OBS-05`: 해당 없음 — 외부 관측·경보는 도입하지 않는다.

## Optimizations

- 기본값 유지 또는 최적화 근거:
  - 기본값 유지 — 현재 task 수와 로컬 정적 생성 규모에서는 캐시, 파일 감시, 그래프 렌더러나 병렬 처리보다 동기식 생성과 명확한 실패 상태가 낮은 복잡도다.
  - 예방적 설계로 원자적 파일 교체와 구조화된 DTO를 사용한다. 전체 의존성 그래프는 만들지 않고 직접 경로만 계산한다.
- 관측성:
  - manifest와 check log에 refresh 상태, 시각, 기준 commit, 오류 코드·안전 요약을 기록한다. 외부 telemetry는 추가하지 않는다.
- 의존성:
  - 새 production 또는 개발 의존성을 추가하지 않고 Node 표준 라이브러리와 기존 harness 모듈만 사용한다.
- 복잡도·되돌림:
  - manifest와 refresh 모듈은 기존 dashboard generator와 분리해 되돌릴 수 있다. 문제 시 advisory 추천 영역을 제거해도 index·runner 계약은 영향을 받지 않는다.
- DEV-* 적용 상태:
  - `DEV-OPT-01`~`DEV-OPT-05`: 추가 결정 — 측정 없는 runtime 최적화 대신 작은 입력·동기식 생성과 직접 경로 제한을 유지한다.
  - `DEV-DEP-01`~`DEV-DEP-05`: 추가 결정 — 새 의존성 없음; Node 표준 라이브러리와 기존 harness를 우선한다.

## 미결 사항

없음
