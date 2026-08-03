# P0-T29 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-03 (범위 확장 갱신, 최초 승인 2026-07-24)
- 개발 설계 승인: user, 2026-08-03
- 관련 spec: DOCS:SDD, ADR:0011, ADR:0012, ADR:0013
- 적용 깊이: 일반
- test mode: tdd
- 예정 check IDs: dashboard-rubric-test, dashboard-parser-test, dashboard-render, typecheck
- revision 1은 구 하네스 기반 설계로 [ADR-0013](../../standards/adr/0013-project-layer-structure.md) 재편에 따라 Superseded 처리되었다(git 이력 보존).

## Requirements

- 범위와 비목표:
  - 범위: 정적 대시보드 생성기(`harness/dashboard/`), 준비도 루브릭 계산, 검증 결과(reviews) 파서, 단일 자체 포함 HTML 렌더, `pnpm dashboard` 명령, [ADR-0012](../../standards/adr/0012-static-operations-dashboard.md) 개정(보류 해제), 운영 계약의 대시보드 문구·경로 정합.
  - 비목표: 검증 실행 자체(P0-T32 프로세스), 실시간 감시·서버, task 상태 변경, 외부 리소스 로드.
- 불변 규칙:
  - 대시보드는 읽기 전용 파생 표시물이다. 정본(`index.jsonl`, runs, reviews)을 절대 변경하지 않는다.
  - 원본이 없거나 오래되면 값을 추정하지 않고 누락·오래됨을 표시한다.
  - 생성 실패는 task 결과를 막지 않는다(advisory).
- 기술 인수 조건:
  - 섹션 4종(진행도, 준비도 루브릭, 검증, 다음 행동·차단)이 표시되고 루브릭 점수에 근거 수치가 함께 나온다.
  - 검증 결과 부재·형식 오류 시 "결과 없음"/"형식 오류"를 안전하게 표시한다.
  - 기준 시각·기준 커밋이 표시되고 생성 시점의 원본과 일치한다.
  - `tsc --noEmit` 오류 0건, 셀프테스트 통과, 모바일 뷰포트 렌더 확인.
- 위험 기반 테스트:
  - 루브릭 계산(4영역 배점·등급 경계·legacy 제외 규칙)과 reviews 파서(정상·부재·형식 오류)를 위반 fixture로 RED부터 검증한다.
  - 렌더 결과 HTML에 섹션·기준 정보가 포함되는지 문자열 수준으로 검증한다.
- DEV-* 적용 상태:
  - `DEV-TEST-01`: 추가 결정 — 루브릭·파서·추천 로직을 순수 함수로 분리해 `node:test`로 검증한다.
  - `DEV-TEST-02`, `DEV-TEST-03`: 해당 없음 — DB·버그 수정이 아니다.
  - `DEV-TEST-04`, `DEV-TEST-05`: 추가 결정 — 생성 명령 수준 테스트와 렌더 검증을 수행한다.
  - `DEV-SEC-*`: 기본 적용 — HTML은 읽기 전용이며 비밀값·개인정보·실행 제어를 포함하지 않는다.

## Architecture

- 책임과 FSD 경계:
  - `harness/dashboard/`에 `collect.ts`(정본 수집), `rubric.ts`(준비도 계산), `reviews.ts`(검증 결과 파서), `render.ts`(HTML 생성), `main.ts`(진입점)를 둔다. `src/` FSD와 무관하다.
  - 계약 준수 40점은 기존 `harness/lib` 게이트 스위트를 재사용해 실제 게이트 실행 결과로 산출한다. 게이트 로직을 복제하지 않는다.
- 서버·보안 경계: 해당 없음 — 로컬 생성 스크립트다.
- Clean Code·SOLID·재사용: 수집·계산·렌더를 분리해 각각 단위 테스트한다. P0-T31의 TypeScript type stripping 실행 방식·제약을 그대로 따른다.
- DEV-* 적용 상태:
  - `DEV-ARCH-*`: 해당 없음 — 제품 FSD 코드가 아니다.
  - `DEV-REUSE-*`: 기본 적용 — 게이트 스위트를 재사용한다.

## Data model

- 정본과 파생 데이터:
  - 입력 정본: `docs/execution/phases/index.jsonl`(+schema), 게이트 실행 결과, `docs/execution/runs/**`(handoff·tdd 증거), `docs/execution/reviews/**`(P0-T32 형식), git HEAD.
  - 산출물: `docs/execution/dashboard/index.html` — 인라인 CSS/JS의 단일 자체 포함 파일. 커밋 대상이며 외부 리소스를 로드하지 않는다.
- 준비도 루브릭(기획 확정): 계약 준수 40(게이트 6종 통과율), 증거 완결성 25(재편 이후 완료 task의 handoff·tdd 증거 보유율, `legacy-v2` 제외), 실행 준비도 20(실행 가능 `planned` 존재 10 + `blocked` 0건 10), 문서 신선도 15(기준 커밋 최신 7 + 보류 ADR 0건 4 + 미결 부채 0건 4). 등급 경계는 90 이상 우수, 70~89 양호, 70 미만 주의.
- 검증 섹션: `<task-id>-review.json`들과 `backlog.md`를 P0-T32 형식으로 파싱해 최신 결과·영역 점수·중요도별 확정 발견·미완료 backlog를 표시한다.
- 트랜잭션·멱등성·동시성: 해당 없음 — 단일 프로세스가 산출물 하나를 다시 쓴다.
- DEV-* 적용 상태:
  - `DEV-SSOT-*`: 기본 적용 — 대시보드는 파생 표시물이며 정본을 소유하지 않는다.
  - `DEV-DATA-*`, `DEV-MIG-*`: 해당 없음.

## Interface

- 명령: `pnpm dashboard` — 성공 시 산출물 경로 한 줄 출력, 실패 시 한국어 오류와 종료 코드 1.
- 재생성 시점: task 최종 상태(`done`·`blocked`·`skipped`)·phase 경계 변경 후 AI 세션이 실행한다(운영 계약 기존 규칙). 훅·게이트로 강제하지 않는다.
- cache·offline: 해당 없음 — 정적 파일.
- 외부 계약·실패: 외부 의존성 없음. 입력 누락은 해당 섹션에 누락 표시로 처리하고 생성은 계속한다.
- DEV-* 적용 상태:
  - `DEV-CACHE-*`, `DEV-OFFLINE-*`: 해당 없음.

## Optimizations

- 기본값 유지 또는 최적화 근거: 기본값 유지 — 데이터 규모가 작아 성능 최적화가 불필요하다.
- 관측성: 산출물 상단의 기준 시각·커밋 표시가 신선도 판단 수단이다.
- 의존성: 추가 의존성 없음(P0-T31 구성 그대로).
- 복잡도·되돌림: `harness/dashboard/`와 `docs/execution/dashboard/` 삭제, `package.json` 명령 제거로 완전히 원복된다.
- DEV-* 적용 상태:
  - `DEV-OPT-*`, `DEV-DEP-*`: 기본 적용.

## 변경 허용 경로

```
harness/**
docs/execution/dashboard/**
package.json
CLAUDE.md
docs/standards/adr/0012-static-operations-dashboard.md
docs/standards/adr/README.md
docs/workflow/WORKFLOW.md
docs/execution/runs/P0-T29/**
docs/execution/phases/index.jsonl
```

## 미결 사항

없음
