# P1-T07 handoff

## 2026-08-07 · 개발 종료

- 작업 식별자: P1-T07
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- RADIO(revision 1, SHA-256 `f70193a279e499d1ba9e7398f14d0506a0e916838bd98f21bcf2bf0f4a5f5401`)를 구현 시작 전 `index.jsonl`의 `development_approval`과 대조해 일치를 확인했다. 의존 task P1-T05·P1-T06은 done, test mode는 verification이라 tdd.json 기록은 해당 없다(src/ 코드 무변경).
- `supabase/tests/11-authorization-matrix.test.sql`(신규, 유일한 산출물, `plan(96)`): ARCHITECTURE 10장 권한 매트릭스의 P1 행 6종(본인 프로필 조회·휴대폰 수정, 가능 포지션·시급, 다른 사람 개인정보, 관리자 임명·해제, 휴면 해제, 수동 휴면) × 주체 10종(anon·pending·rejected·dormant·departed·active 본인·active 타인·팀장 후보·admin·super_admin)의 허용·거부 조합을 전수 단언한다. 픽스처는 기존 파일과 겹치지 않는 전용 UUID 대역(`f1000000-0000-0000-0000-0000000000XX`)을 쓰고, active·dormant 픽스처에는 P1-T06 CHECK가 요구하는 `inactivity_anchor_at`을 채웠다. 주체 시뮬은 `set local role authenticated/anon` + `request.jwt.claim.sub`로만 실행하고(픽스처 준비만 superuser), service role 주체의 단언은 없다.
- 거부 단언은 기존 확립 오류 계약을 그대로 재사용했다 — 권한 거부 `42501`(모든 행의 비인가 주체), 상태 부적합 `LB010`(수동 휴면 대상이 active가 아닐 때, admin 주체로도 재확인)·`LB011`(휴면 해제 대상이 dormant가 아닐 때, pending·rejected·departed·active 본인·팀장 후보 각각 개별 단언), 시급 범위 `LB001`(admin의 관리 범위도 벗어나면 거부됨을 경계값으로 추가 확인), 비활성 포지션 `LB002`(admin의 포지션 부여 관리도 비활성 포지션에는 거부됨을 확인), RLS select 차단은 0 rows(anon·비활성 4종·타인 근무자·팀장 후보가 각 행에서 개별 단언).
- 팀장 후보 동일성은 두 층으로 확인된다 — ① 행별 스윕(행1~6) 안에서 팀장 후보가 일반 근무자와 동일한 허용·거부 결과를 받는지 개별 단언, ② 파일 말미의 전용 "팀장 후보 동일성" 절에서 `effective_roles`가 일반 근무자와 동일하게 `{worker}`뿐임, `is_admin=false`, 본인 포지션 보유 행은 본인만 읽을 수 있고 타인은 읽을 수 없음(팀장이라고 예외 없음), admin 게이트 함수 호출도 일반 근무자와 동일하게 거부됨을 재확인한다.
- 상태를 바꾸는 행(5 휴면 해제·6 수동 휴면)은 스윕용 안정 픽스처(주체 10종, 01~10)를 절대 변형하지 않도록 설계했다 — 실제 전이(성공 경로)는 행별 전용 대상 픽스처(20~27번대)에서만 일어나고, 거부 시도는 상태를 바꾸지 않으므로 안정 픽스처가 이후 행에서도 동일한 축을 계속 대표한다. 유일한 예외는 행5의 "dormant 본인" 허용 사례로, 스윕용 dormant 축(04번)이 다른 행(1·2·3·4·6)에서 계속 dormant로 남아야 하므로 전용 대상(21번)을 대신 써서 자기 재활성화를 시연했다 — 두 픽스처 모두 dormant 상태이므로 축의 의미는 그대로 유지된다.
- 가능 포지션·시급(행2)의 "가능 포지션"은 `worker_position_eligibilities`(본인이 가능한 포지션 목록, 본인/admin만 읽기)로 해석했다 — 일반 `positions` 카탈로그(모든 active 근무자가 읽을 수 있음, P1-T05 revision 2 DEV-SEC 이중 강제로 이미 확정·04에서 테스트됨)와는 다른 리소스다. 이 해석만이 RADIO의 "타인 근무자 거부" 서술과 실제 RLS 동작(카탈로그는 타인도 읽을 수 있음)을 모순 없이 동시에 만족시킨다 — 설계 변경이 아니라 이미 승인된 두 사실을 모순 없이 잇는 구현 판단으로 보고 `[질문]`으로 멈추지 않았다.
- 스팟 체크: 행4의 admin 거부 단언 하나를 일시적으로 `lives_ok`로 바꿔 pgTAP이 실제로 실패(`died: 42501`)를 잡아내는지 확인한 뒤 원복했다(`git status`로 잔여물 없음 확인) — 단언들이 실제 권한 로직을 검증하고 있음을 재현으로 확인했다.
- 기존 `supabase/tests/01~10-*.test.sql`은 픽스처 포함 무수정(diff 없음, `git status --porcelain supabase/tests/`로 확인). `pnpm db:reset && pnpm db:test` GREEN(11 파일, 498 tests = 기존 402 + 신규 96). `pnpm verify` 전체 GREEN(format·lint·typecheck·vitest 832·harness self-test 248·build·e2e 30·gate:all 포함 exit 0).

### 미결 사항

- 없음. RADIO의 미결 사항(병렬 커넥션 동시성 인프라, medium·low backlog)은 이 task 밖의 별도 주기로 그대로 이월된다.

### 다음 행동

1. 교차 검증(opus·codex)을 진행하고 `docs/execution/reviews/P1-T07-review.json`을 남긴다.
2. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로

- 신규 pgTAP: `supabase/tests/11-authorization-matrix.test.sql`(plan 96, 유일한 산출물).
- 검증 로그(재현 가능): `pnpm db:reset && pnpm db:test` → `Files=11, Tests=498 ... Result: PASS`. `pnpm verify` → exit 0(gate:all 포함).
- RADIO: `docs/execution/radio/P1-T07-radio.md`(revision 1, SHA-256 `f70193a279e499d1ba9e7398f14d0506a0e916838bd98f21bcf2bf0f4a5f5401`, 무수정).
