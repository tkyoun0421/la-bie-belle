# P0-T03 handoff

## 2026-08-04 · 개발 종료

- 작업 식별자: P0-T03 (Supabase 로컬 개발과 초기 스키마)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-04
- 승인 정본: `docs/execution/radio/P0-T03-radio.md` **revision 2**(Approved), 봉인 해시 `b85e09cf813beaa8…`
- **미승인 변경 1건이 작업 트리에 있다.** 아래 미결 사항의 `[analytics]` 항목을 먼저 읽는다.

### 확정된 사실

- **TDD로 진행했다.** pgTAP 테스트 4파일 70개를 먼저 쓰고 테이블이 없는 상태에서 RED(`relation "public.positions" does not exist`, exit 1)를 확인한 뒤 migration으로 GREEN을 얻었다.
- **migration 2개.** `20260804000000_foundation_schema.sql`이 enum 2종, 테이블 3종, 제약, 트리거, RLS를 만들고, `20260804000100_foundation_reference_data.sql`이 포지션 9종·venue 설정·출근 규칙 2행을 넣는다. 참조 데이터가 seed가 아니라 migration에 있는 것이 "seed는 로컬 전용" 기획 결정의 구현이다.
- **`supabase/seed.sql`은 빈 파일이다.** 없으면 `db reset`이 `no files matched pattern` 경고를 낸다. 개발 편의 데이터가 생기면 여기 넣는다.
- **참조 데이터 migration이 멱등하다.** 같은 SQL을 두 번 더 적용해도 `positions=9`, `venue_settings=1`, `check_in_rules=2`로 변하지 않는다. 포지션과 규칙표는 `on conflict do nothing`, venue는 `where not exists`를 쓴다.
- **`db reset` 연속 2회 결과가 같다.** 포지션 전체를 이름·인원·성별 조건·기본 여부로 직렬화해 대조했다.

### 설계 대비 변경 2건

1. **`check_in_rules`를 구간표에서 정확 대응표로**(revision 2, 사용자 결정). revision 1은 `first_ceremony_from`~`first_ceremony_to` 구간이었는데, PRD 「시간 추천」의 초기 규칙은 첫 예식 `10:00` → 출근 `08:20`, `11:00` → `09:10` 두 점뿐이다. 구간으로 옮기려면 PRD에 없는 경계(`10:00~10:59` 같은)를 설계가 지어내야 했고 그것은 승인 범위 밖의 제품 결정이다. `first_ceremony_at time UNIQUE`로 바꾸니 PRD와 1:1로 맞고 `EXCLUDE USING gist`도 `UNIQUE` 하나로 대체됐다. 표에 없는 시각을 어떻게 다룰지는 P3-T01이 정한다.
2. **RLS 기본 거부의 인수 조건 문구 정정**(revision 2, 사용자 결정). revision 1은 "읽기·쓰기가 모두 실패한다"였으나 실제 동작이 다르다. Supabase는 `anon`·`authenticated`에 public 테이블 전체 권한(`arwdDxtm`)을 기본 부여하므로, RLS가 켜지고 정책이 없으면 **읽기는 에러가 아니라 0행**이 되고 쓰기만 `42501`로 거부된다. 문구대로 검증했다면 테스트가 틀린 것을 확인하게 됐다.

### 절차 기록

- **등록 check `supabase-reset`이 비결정적이었다.** `supabase db reset`이 3회 중 2회 `Restarting containers` 직후 `Error status 502`로 exit 1을 냈다. migration은 매번 정상 적용됐고 CLI의 재시작 후 상태 확인만 실패했다. 원인은 analytics 컨테이너(Logflare)의 재시작 지연이었다. 대응은 미결 사항으로 남았다.
- 처음에는 `db reset`의 exit 코드를 파이프 뒤 `PIPESTATUS`로 읽으려 했는데 zsh에서 값이 비어 나와 성공으로 오독할 뻔했다. 리다이렉트 후 `$?`로 직접 읽어 확인했다.
- pgTAP 테스트 파일 1번은 참조 데이터가 이미 들어간 DB에서 돌기 때문에 `venue_settings`·`check_in_rules`를 트랜잭션 안에서 먼저 비운다. 그러지 않으면 단일 행 제약과 `UNIQUE` 때문에 정상 삽입 테스트가 실패한다. 트랜잭션은 `rollback`으로 끝나므로 실제 데이터는 그대로다.

### 검증 사각을 막은 장치

- **오탐 대조군.** 시스템 포지션 보호 테스트(03번 파일)는 `team_lead`의 삭제·비활성화·code 변경이 막히는 것만 보지 않고, 일반 포지션의 생성·비활성화·삭제가 **성공하는 것**과 `team_lead`의 표시명 변경이 **성공하는 것**까지 확인한다. 이게 없으면 "전부 막는" 구현도 통과한다.
- **경계값.** `venue_settings`는 `gps_radius_m = 0`과 `latitude = 91`이 거부되는 것과 함께 `gps_radius_m = 1`, `location_accuracy_limit_m = 1`, `default_hourly_wage = 0`이 허용되는 것을 함께 본다.

### 미결 사항

- **`[analytics]` 비활성화가 승인 대기 중이다** — 결정 주체: 사용자, 반환할 단계: 설계. 조정자가 판단해 `supabase/config.toml`의 `[analytics]`를 껐고 그 상태로 `db reset`이 5회 연속 exit 0이 되는 것을 확인했다. 그러나 사용자 승인을 받지 않은 설계 변경이라 RADIO revision 3으로 봉인하지 않고 revision 2로 되돌렸다. **작업 트리의 `config.toml` 변경은 승인되지 않은 상태로 남아 있다.**
  - 승인하면: RADIO에 revision 3 절을 추가하고 재봉인한다.
  - 승인하지 않으면: `config.toml`을 되돌리고 `supabase-reset` check의 비결정성을 다른 방법으로 해소해야 한다. 재시도로 감싸는 안은 실패를 숨기는 것이라 권하지 않는다.
  - 근거 실측: analytics 켠 상태 3회 중 2회 실패, 끈 상태 5회 연속 성공.

- **`positions`를 참조하는 FK가 아직 0건이다.** `ON DELETE RESTRICT` 규약은 ARCHITECTURE에 세웠으나 적용 대상이 없어 검증할 수 없다. 설계 단계에서 결정한 대로 첫 참조 테이블이 생기는 P1-T05가 맡는다.
- **venue 좌표가 자리표시자다.** migration에 넣은 `37.566500, 126.978000`은 실제 홀 좌표가 아니다. 운영 배포 시점에 관리자가 설정하며 P7-T04가 확인한다.
- **`pnpm verify`에 DB 검사가 없다.** Docker와 로컬 Supabase 기동이 필요해 의존성 없는 환경에서 깨진다. CI 통합은 P0-T05가 소유한다. 그때까지 `pnpm db:test`는 사람이 실행한다.

### 다음 행동

0. `[analytics]` 비활성화 승인 여부를 먼저 정한다. 등록 check `supabase-reset`의 결정성이 여기 달려 있다.
1. 등록 check 4종(`supabase-reset`·`foundation-seed`·`schema-constraints`·`rls-default-deny`)을 실행해 검증 단계를 마친다.
2. 교차 검증을 리뷰어 2자로 진행하고 결과를 `docs/execution/reviews/P0-T03-review.json`에 남긴다.

### 증거·산출물 경로

- `supabase/migrations/20260804000000_foundation_schema.sql`
- `supabase/migrations/20260804000100_foundation_reference_data.sql`
- `supabase/seed.sql` (빈 파일)
- `supabase/config.toml` (analytics 비활성 — **승인 대기**)
- `supabase/tests/01-schema-constraints.test.sql` (38)
- `supabase/tests/02-reference-data.test.sql` (9)
- `supabase/tests/03-system-position.test.sql` (8)
- `supabase/tests/04-rls-default-deny.test.sql` (15)
- `docs/execution/runs/P0-T03/tdd.json` (RED→GREEN 기록)
- `package.json` (`db:start`·`db:stop`·`db:reset`·`db:test`)

## 2026-08-05 · 검증 종료

- 작업 식별자: P0-T03 (Supabase 로컬 개발과 초기 스키마)
- 현재 단계: 검증 종료 → 다음 리팩토링·완료 보고
- 기준 시각: 2026-08-05
- 기준 커밋: 92cb8857364009e96e0b28ddb92603ce1544fd81

### 확정된 사실

- `[analytics]` 비활성화를 사용자가 2026-08-05 승인했다. 정본 반영(RADIO revision 3 재봉인)은 아직 수행되지 않았다 — 미결 사항 참조.
- 등록 check 4종 통과(2026-08-05): `supabase db reset` 2회 연속 성공(멱등), `supabase test db` 4파일 70건 전부 통과. `foundation-seed`·`schema-constraints`·`rls-default-deny`는 pgTAP 파일이 담당한다.
- 인수 조건 3번의 실행 증거 보강: 데이터가 있는 DB에 참조 데이터 migration을 psql로 재적용해 `INSERT 0 0`과 행 수 9/1/2 무변경을 확인했다. 자동 테스트는 아니다(F-03).
- 교차 검증 완료(opus·codex 2자, 전원 인정 기준): 확정 발견 8건(medium 7, low 1), 총점 88. 정본은 `docs/execution/reviews/P0-T03-review.json`.

### 미결 사항

- **F-01 재봉인**: 승인된 `[analytics]` 결정을 RADIO revision 3으로 추가하고 `development_approval`을 새 해시로 재봉인해야 한다. 승인 주체는 사용자, 반환 단계는 설계(재봉인 절차)다.
- **medium 확정 발견 6건(F-02~F-07)의 수정 여부·시점**: 사용자 결정. backlog에 누적했다.
- 판단이 갈려 기각된 발견 2건을 기록만 남긴다. ①트리거 함수 search_path 미고정(opus 주장 — 공통 규약으로 복제될 우려, codex 반박 — SECURITY INVOKER·내장 함수만 사용해 구체적 영향 없음) ②시스템 포지션 code 부여 방향의 보호 공백(codex 반박 — 승인 범위 밖 제안). 둘 다 확정 발견이 아니며 점수 근거로 쓰지 않았다.

### 다음 행동

1. RADIO revision 3(analytics 결정 반영)과 재봉인을 사용자에게 승인받아 F-01을 해소한다.
2. 사용자가 수정을 지시한 확정 발견을 개발 단계에서 처리한다. 나머지는 backlog에 유지한다.
3. 위가 끝나면 P0-T03을 `done`으로 전환하고 검증 산출물을 커밋한다.

### 증거·산출물 경로

- `docs/execution/reviews/P0-T03-review.json` (확정 발견·점수 정본)
- `docs/execution/reviews/backlog.md` (medium·low 8건 누적)
- 재적용 실측 절차: `docker exec supabase_db_la-bie-belle psql`로 `20260804000100_foundation_reference_data.sql` 재실행

## 2026-08-05 · 리팩토링·완료 보고

- 작업 식별자: P0-T03 (Supabase 로컬 개발과 초기 스키마)
- 현재 단계: 리팩토링 종료 → task `done`
- 기준 시각: 2026-08-05

### 확정된 사실

- 사용자 승인(2026-08-05)으로 교차 검증 확정 발견 medium 6건(F-02~F-07)을 이 task 개발 단계에서 수정하고, RADIO를 revision 3으로 재봉인했다. 새 봉인 해시는 `index.jsonl`의 `development_approval`이 정본이다.
- F-05는 DEV-TEST-03대로 실패 재현 테스트를 먼저 추가했다: 표시명 변경 후 재적용 테스트가 `23505`로 RED(05:17Z), `ON CONFLICT DO NOTHING` 수정 후 GREEN(05:18Z). 증거는 `tdd.json`.
- pgTAP은 70건에서 **95건**으로 늘었고 전부 통과한다: CHECK 거부 4건(F-06), 재적용 멱등성·표시명 변경 재적용 6건(F-03·F-05), 정책 0개 단언·UPDATE·DELETE 무영향 15건(F-04).
- RLS 인수 조건 문구를 실동작대로 정밀화했다(INSERT만 `42501`, UPDATE·DELETE는 영향 0행). `index.jsonl` verification 6번과 RADIO 인수 조건을 함께 고쳤다.
- 지각 기준 소유권 충돌(F-02)은 phase 문서와 RADIO 양쪽에 조정 기록을 남겼다 — 임계값은 P5-T05 소유.
- 시급 12000원은 좌표와 같은 자리표시자로 명시하고 P7-T04 확인 항목에 편입했다(F-07).

### 미결 사항

- F-08(low): tdd.json의 2026-08-04 `db reset` RED는 소급 판별이 불가능해 backlog에 미해결로 남긴다. 이후 task부터 RED 실패 사유 요약을 handoff에 함께 남긴다.
- 기각 발견 2건(search_path, code 부여 방향)은 검증 종료 절 기록 그대로다.

### 다음 행동

- 없음. P0-T03은 `done`이다. 다음 후보는 index.jsonl의 `design_pending`(P0-T34·P0-T35)과 `proposed` 큐가 정한다.

### 증거·산출물 경로

- `supabase/migrations/20260804000100_foundation_reference_data.sql` (ON CONFLICT 수정)
- `supabase/tests/01·02·04-*.test.sql` (95건으로 확장)
- `docs/execution/runs/P0-T03/tdd.json` (2026-08-05 RED→GREEN 추가)
- `docs/execution/radio/P0-T03-radio.md` (revision 3)
- `docs/execution/reviews/backlog.md` (F-01~F-07 `[x]`)
