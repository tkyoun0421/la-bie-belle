# 에이전트 팀 확장 기획 인터뷰 handoff

- 작업 식별자: P0-T46 (예정 — index 등록 보류 중, 아래 미결 참조)
- 현재 단계: 기획 승인 종료 → 다음 설계(RADIO) 인터뷰
- 기준 시각: 2026-08-16
- 기획 승인: user, 2026-08-16 (요약본 2회 제시 후 "승인" 명시, 이후 회고 대시보드 페이지 추가 승인)

## 확인된 사실 (사용자 답변·요약본 승인)

- **테스트 작성·구현 분리, writer 3종.** `unit-test-writer`(단일 계층 순수 로직,
  `src/**/__tests__`) · `integration-test-writer`(features↔entities↔shared 가로지르는 테스트,
  파일 위치·러너는 기존 Vitest 규칙 유지, 담당만 계약 구분) · `e2e-test-writer`(`tests/e2e/**`,
  `work-date-band.ts` 구간 배분 준수 명시). 조정자가 RADIO 테스트 목록을 구역별 배분,
  필요한 writer만 순차 디스패치(in_progress 1 유지, 같은 worktree).
- **RED 중간 커밋 불가(강제된 결정).** pre-commit이 unit test를 실행하므로 커밋은 GREEN 후
  한 번. `tdd.json`은 RED(writer 기록)·GREEN(implementer 기록) 두 기록자.
- **implementer 개정.** GREEN 전담, 테스트 수정 필요 시 직접 고치지 않고 `[질문]` 반환.
  `test_mode=tdd` 아닌 task는 기존대로 implementer 단독.
- **docs-curator.** 최신화 1순위(코드 현실과 어긋난 문서 탐지), SSOT 준수 검사(L1~L5 정본
  소유권 위반·중복 서술 — 의미 판단이라 에이전트 몫), 문서·폴더 구조 관리. 경미 수정
  (링크·상호참조·오탈자·대시보드)은 직접, PRD·DOMAIN·ADR·봉인 RADIO 내용 변경은 제안만.
  커밋은 in_progress 없는 task 경계에서만.
- **retrospector.** 5단계 종료 시점(마무리 커밋 전) 디스패치 — 산출물이 done 커밋에 포함.
  `runs/<id>`·`reviews/<id>-review.json`·CI·handoff에서 사례 추출,
  `docs/execution/retrospective/cases.md` 누적(backlog.md 한 줄 형식 벤치마킹), 제안은
  `proposals.md`. 제안의 task화는 사용자 승인 시만. 모델 opus.
- **gate 2종, 둘 다 강제(사용자 선택: "둘 다 gate로").** `gate:retro` — done task마다
  cases.md에 해당 ID 항목 없으면 차단, 기존 done은 시행일 기준 면제(소급 기록 금지와 정합).
  `gate:docs` — 마크다운 내부 링크·상호참조 깨짐 기계 검사. SSOT 의미 검사는 gate 아님.
  둘 다 `gate:all`·pre-commit·CI 편입, harness self-test 추가.
- **explainer.** 기술 산출물의 인간 눈높이 통역 전담. ① task done·루프 종료 보고를 주니어
  개발자 눈높이 요약으로, ② 승인 게이트 결정용 요약본·AskUserQuestion 선택지 초안을 구체
  시나리오로. 읽기 전용(Read·Grep·Glob), 파일·커밋 없음, 모델 opus, Humanize KR 규칙 적용
  명시. WORKFLOW 공통 인터뷰 계약 5항·연속 루프 일괄 보고 절에 경유 관례 명시(gate 없음).
- **`/coach` 스킬(2026-08-16 추가 승인).** 프로젝트를 레이어로 갈라 축별 병목·오류·개선점을
  정리하고 중요도(critical·high·medium·low)순 상위 10개 내외를 제안. 에이전트 대신 스킬로
  구현(사용자가 형태 위임, 조정자 판단: 파이프라인 단계 worker가 아닌 온디맨드 전체 점검이라
  verify 수동 스캔과 같은 계열) — 사람 전용 호출, 결과는 전용 폴더
  `docs/execution/coaching/<날짜>-coach.md`(2026-08-16 사용자 결정으로 reviews와 분리).
  훅·주기 자동 실행 없음 — 스킬로만 두고 사람이 실행, 산출물은 대시보드 coaching 페이지로
  노출(2026-08-16 사용자 결정, "신호만 자동" 제안은 채택 안 함).
- **회고 대시보드 페이지(2026-08-16 추가 승인).** `pnpm dashboard`가 cases.md·proposals.md를
  렌더한 회고 전용 페이지를 별도로 생성하고 index.html에서 링크. ADR-0012(산출물
  index.html 한 파일 계약) 개정 필요.
- 모델 배정: writer 3종·docs-curator는 sonnet, retrospector·explainer는 opus.
  reviewer·ci-finisher는 기존 유지.

## 비목표

- 제품 코드·동작 변경. integration 테스트 구역 신설(러너·CI·fsd.json 인프라) — 사용자가
  "기존 러너 안 구분"을 선택, 구역 신설은 필요해지면 별도 task.
- reviewer·ci-finisher 계약 변경.

## 문서 정합화 결과

- 이 handoff만 작성. phase 00 절·index.jsonl 등록은 보류 — P4-T01이 `in_progress`라
  WORKFLOW 파이프라이닝 규칙(worker 공유 파일의 인터뷰 갱신은 task 경계까지 미룸)에 따름.
- PRD·DOMAIN·DECISIONS: 해당 없음 — L1 협업 계층 변경이라 제품 결정이 없다.

## 미결 사항 (다음 단계 소유)

- P4-T01 task 경계에서 index.jsonl에 P0-T46 등록(`design_pending` + `product_approval`
  2026-08-16)과 phase 00 절 추가.
- RADIO 몫: 에이전트 6종 `.md` 프론트매터·본문 확정, WORKFLOW 3단계·task 경계 절 개정문,
  gate 2종 구현 설계(검사 대상·면제 기준일·self-test), tdd.json 두 기록자 형식,
  retrospective/ 형식 README, ADR-0012 개정안(회고 페이지), `test_mode`·`check_ids`.

## 다음 행동

1. P0-T46 설계(RADIO) 인터뷰 — 위 미결 사항이 대상.
2. task 경계 도달 시 index.jsonl·phase 00 정합화.
