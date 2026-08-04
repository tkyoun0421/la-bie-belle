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
