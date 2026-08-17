# P0-T46 설계(RADIO) 인터뷰 handoff

- 작업 식별자: P0-T46 (에이전트 팀 확장)
- 현재 단계: RADIO 승인 종료 → index 등록 대기(task 경계) → 구현
- 기준 시각: 2026-08-16
- 개발 설계 승인: user, 2026-08-16 — `docs/execution/radio/P0-T46-radio.md` revision 1,
  SHA-256 `e53d02a1f06d91a61827d3b568d4e32775c67f083a25188cf3d07ed943c5302d`

## 승인 경과

- 요약본 제시 → coach 스킬 추가(사용자) → coach 결과 폴더 분리·자동화 안 함·대시보드 노출
  결정(사용자) → 반영 후 "승인" 명시. 봉인 전 수정이라 revision은 1 유지.
- 자동화 논의 결과: 훅·주기 실행·권장 배지 전부 채택 안 함 — `/coach`는 사람 전용,
  산출물은 `pnpm dashboard`의 coaching.html이 표시.

## index 등록 보류 사유와 등록 내용

P4-T01이 `in_progress`라 WORKFLOW 파이프라이닝 규칙(worker 공유 파일의 인터뷰 갱신은
task 경계까지 보류)에 따름. P4-T01 경계 도달 시 아래 한 줄을 `index.jsonl`에 추가하고
phase 00에 P0-T46 절을 쓴다.

주의: index 스키마의 `spec_refs` 패턴은 `PRD:*`·`DOMAIN:*`·`ADR:NNNN`·`DOCS:SDD|DDD`만
허용한다 — WORKFLOW 문서를 직접 가리킬 수 없어 `ADR:0012`(대시보드 개정)·`ADR:0013`
(계층 구조)을 쓴다.

```json
{"schema_version": 3, "kind": "task", "id": "P0-T46", "phase": "P0", "title": "에이전트 팀 확장", "summary": "테스트 writer 3종·docs-curator·retrospector·explainer 신설과 implementer 개정(GREEN 전담), gate:retro 신규·gate:docs 편입, 회고 저장소와 /coach 스킬, 대시보드 회고·코칭 페이지(ADR-0012 revision 3). 제품 코드 무변경.", "status": "planned", "priority": "should", "depends_on": [], "doc": "docs/execution/phases/00-foundation.md", "spec_refs": ["ADR:0012", "ADR:0013"], "verification": ["에이전트 6종 신설·implementer 개정이 RADIO Interface 표와 일치", "WORKFLOW 3·5단계와 인터뷰·보고 절 개정", "gate:retro 신규(면제 스냅숏)·gate:docs 편입이 gate:all·pre-commit에서 동작하고 self-test GREEN", "대시보드 3페이지 생성과 ADR-0012 revision 3", "/coach 스킬 신설(사람 전용, coaching/ 산출, 대시보드 노출)", "pnpm verify 전체 GREEN과 P0-T46 자기 회고의 gate:retro 통과"], "tags": ["workflow", "agents", "harness", "dashboard"], "updated_at": "2026-08-16", "approval_contract": "dual-approval-v3", "product_approval": {"by": "user", "at": "2026-08-16"}, "test_mode": "verification", "check_ids": ["verify", "retro-gate-selftest"], "radio_ref": "docs/execution/radio/P0-T46-radio.md", "development_approval": {"by": "user", "at": "2026-08-16", "radio_revision": 1, "radio_sha256": "e53d02a1f06d91a61827d3b568d4e32775c67f083a25188cf3d07ed943c5302d"}}
```

## revision 2·3 개정 (2026-08-16, 등재 전)

**revision 2** — `explainer`를 서브 에이전트에서 `explain` 스킬로 바꾸는 개정을 사용자가 승인했다. 아직 구현 전이라 되돌릴 코드가 없어 이 시점 개정이 가장 쌌다.

**revision 3** — 구현 중 전제 오류가 드러나 허용 경로를 넷 늘렸다(사용자 승인). 게이트 묶음에 항목을 더하면 그 묶음을 고정 배열로 단언한 기존 self-test가 깨지고, `COMMIT_GATES` 추가는 훅 픽스처가 갖춰야 할 파일을 늘린다. `TOOLING.md`·`CLAUDE.md`의 게이트 목록도 갱신 대상이었다.

사유 전문은 RADIO 개정 이력의 해당 행에 있다.

**위 코드블록의 등재용 JSON은 revision 1 기준이라 그대로 쓰면 안 된다.** 등재 시 아래를 쓴다 — `radio_revision` 3, 새 SHA, `verification` 두 항목 문구 수정.

```json
{"schema_version": 3, "kind": "task", "id": "P0-T46", "phase": "P0", "title": "에이전트 팀 확장", "summary": "테스트 writer 3종·docs-curator·retrospector 신설과 implementer 개정(GREEN 전담), gate:retro 신규·gate:docs 편입, 회고 저장소와 /coach·explain 스킬, 대시보드 회고·코칭 페이지(ADR-0012 revision 3). 제품 코드 무변경.", "status": "planned", "priority": "should", "depends_on": [], "doc": "docs/execution/phases/00-foundation.md", "spec_refs": ["ADR:0012", "ADR:0013"], "verification": ["에이전트 5종 신설·implementer 개정이 RADIO Interface 표와 일치", "WORKFLOW 3·5단계와 인터뷰·보고 절 개정", "gate:retro 신규(면제 스냅숏)·gate:docs 편입이 gate:all·pre-commit에서 동작하고 self-test GREEN", "대시보드 3페이지 생성과 ADR-0012 revision 3", "/coach·explain 스킬 신설(coach는 사람 전용, explain은 양쪽 호출)", "pnpm verify 전체 GREEN과 P0-T46 자기 회고의 gate:retro 통과"], "tags": ["workflow", "agents", "harness", "dashboard"], "updated_at": "2026-08-16", "approval_contract": "dual-approval-v3", "product_approval": {"by": "user", "at": "2026-08-16"}, "test_mode": "verification", "check_ids": ["verify", "retro-gate-selftest"], "radio_ref": "docs/execution/radio/P0-T46-radio.md", "development_approval": {"by": "user", "at": "2026-08-16", "radio_revision": 3, "radio_sha256": "2b23e0bc0e1f8cbb3ad5290fca11c1386f35636564938b030f0bdb4b92db39b9"}}
```

기획 handoff(`2026-08-16-agent-team-planning.md`)의 explainer 서술과 모델 배정 줄은 **그때의 결정 기록이라 고치지 않는다.** 현재 정본은 RADIO revision 3이다.

## 작업 트리 현황 (커밋 안 된 인터뷰 산출물)

- `docs/execution/radio/P0-T46-radio.md` (봉인본 — 이후 본문 수정 금지, 수정 필요 시 재봉인)
- `docs/execution/runs/interviews/2026-08-16-agent-team-planning.md`
- `docs/execution/runs/interviews/2026-08-16-agent-team-design.md` (이 파일)

P4-T01 worker(사용자의 다른 탭)가 같은 저장소에서 작업 중 — 위 파일들은 P4-T01의 허용
경로 밖이라 충돌 없음. `index.jsonl`·`00-foundation.md`만 경계까지 손대지 않는다.

## 다음 행동

1. P4-T01 경계 도달 확인(`in_progress` 소멸) 후 index 등록·phase 00 절 추가.
2. P0-T46을 `in_progress`로 전환하고 구현 — 구현 주체는 조정 세션(`.claude/**` 소유).
   구현 순서 권장: gate:retro·gate:docs(+self-test) → 회고 저장소·exempt.json 스냅숏 →
   대시보드 2페이지 → 에이전트 6종·implementer 개정 → WORKFLOW·ADR-0012 개정 →
   /coach 스킬 → retrospector 첫 실행(P0-T46 자기 회고) → verify → 커밋.
3. 검증 단계에서 교차 검증(reviewer 2자) 수행 — L1·harness 변경도 예외 아님.
