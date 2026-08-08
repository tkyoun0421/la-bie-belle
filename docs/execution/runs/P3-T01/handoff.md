# P3-T01 handoff

## 2026-08-08 · 개발 단계 착수 직후 안전 중단 (blocked)

- 작업 식별자: P3-T01 (예식 아이템과 시간 추천)
- 현재 단계: 개발(3단계) 착수 직후 안전 중단 → 다음 설계(2단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-08T05:25:08Z

### 확정된 사실

- RADIO `docs/execution/radio/P3-T01-radio.md` revision 1, SHA-256 `abb9470c92ea2967a36e50f856d896cfd92068613c9e240af466e9add4597c5a`는 index의 `development_approval`과 일치하고 `gate:radio` 통과 상태다. 봉인 본문은 이번 세션에서 수정하지 않았다.
- RADIO의 범위·Architecture·기술 인수 조건 3이 새로 만들라고 지시하는 `checkin_rules`(first_ceremony_time·checkin_time) 테이블은, P0-T03(`done`)이 이미 만든 `check_in_rules`(first_ceremony_at·recommended_check_in) 테이블과 구조·목적·seed 값(10:00→08:20, 11:00→09:10)이 완전히 같다. `docs/standards/ARCHITECTURE.md` 143행도 이 기존 테이블을 P3-T01이 필요로 하는 바로 그 규칙표로 이미 문서화하고 있다. 근거·재현 경로는 `docs/execution/runs/P3-T01/decision-signal.json`에 남겼다.
- 기존 `check_in_rules`는 RLS가 켜져 있으나 정책이 0개(default deny)라 admin CRUD를 열려면 어차피 신규 마이그레이션으로 admin 전용 정책을 추가해야 한다 — 재사용해도 신규 작업량 자체는 크게 늘지 않는다.
- pgTAP 파일명 `16-ceremony-schema.test.sql`도 RADIO가 지정한 번호이지만 P2-T05가 같은 날 `16-recruitment-applicants.test.sql`을 이미 선점했다. 의미 내용이 없는 순번 표기라 재개 시 `17-ceremony-schema.test.sql`로 진행할 계획이며 별도 결정이 필요한 사안으로 보지 않는다.
- 이번 세션에서 `src/`·`supabase/` 아래 코드·마이그레이션은 한 줄도 작성·스테이징하지 않았다. RADIO·기존 스키마·ARCHITECTURE.md·관련 pgTAP·P0-T03 handoff를 읽는 조사만 수행했다.
- `ceremonies` 테이블, `schedules`의 예정 출퇴근 컬럼, `replace_schedule_ceremonies`·`set_schedule_planned_times` 함수는 기존 스키마에 대응물이 없어 이번 충돌의 영향을 받지 않는다 — 재봉인 후 RADIO 그대로 신설하면 된다.

### 미결 사항

- 기존 `check_in_rules` 테이블을 재사용(테이블·컬럼명 유지, admin RLS 정책만 추가, 재seed 없음)할지, 새 마이그레이션으로 RENAME해 RADIO 표기에 맞출지, 아니면 다른 이유로 별개 테이블을 유지할지 — 결정 주체: 사용자(조정자 경유), 반환 단계: 설계(재사용이면 development_approval만, RENAME이면 P0-T03 회귀 범위 합의도 필요). 선택지별 트레이드오프는 `decision-signal.json`의 `open_questions`에 정리했다.
- `check_in_rules`의 DOMAIN 소유 표기(P0-T03 RADIO는 DOMAIN:ATTENDANCE 소비로 적었으나 실제 소비자는 DOMAIN:SCHEDULING인 P3-T01)를 함께 정정할지 — 결정 주체: 사용자.

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인(재사용 경로면 revision 2, development_approval만)하거나 더 무거운 RENAME 경로를 선택한다.
2. 재승인 후 개발 루프가 P3-T01을 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션은 코드 작업물이 없어 이어받을 격리 작업물이 없다 — 다음 세션은 이 handoff와 decision-signal만 읽고 처음부터 구현을 시작하면 된다. 재개 시 pgTAP 파일명은 `17-ceremony-schema.test.sql`을 쓴다.

### 증거·산출물 경로

- `docs/execution/runs/P3-T01/decision-signal.json`
- `docs/execution/radio/P3-T01-radio.md` (봉인 본문 무수정 확인)
- `supabase/migrations/20260804000000_foundation_schema.sql`·`20260804000100_foundation_reference_data.sql`(기존 `check_in_rules` 정의·seed 확인)
- `docs/standards/ARCHITECTURE.md` 143행(기존 테이블의 문서화된 목적)
