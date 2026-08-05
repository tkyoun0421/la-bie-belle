# P0-T03 RADIO 개발 설계

- 상태: Approved
- revision: 3
- 기획 승인: user, 2026-08-04
- 개발 설계 승인: user, 2026-08-05 (revision 3 재승인)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-04 | 최초 작성. |
| 2 | 2026-08-04 | 구현 착수 후 드러난 두 가지를 정정해 재승인했다(사용자 결정). ①`check_in_rules`를 구간표에서 **정확 대응표**로 바꿨다. PRD의 초기 규칙이 점 값 두 개뿐이라 구간으로 만들면 PRD에 없는 경계를 설계가 지어내야 했다. `EXCLUDE USING gist`는 `UNIQUE` 하나로 대체된다. ②RLS 기본 거부의 인수 조건 문구를 실제 Postgres 동작에 맞게 고쳤다. Supabase가 `anon`·`authenticated`에 테이블 권한을 기본 부여하므로 읽기는 에러가 아니라 0행이 되고 쓰기만 `42501`로 거부된다. |
| 3 | 2026-08-05 | 검증 단계의 교차 리뷰(P0-T03-review.json) 확정 발견을 사용자 승인으로 반영해 재봉인했다. ①로컬 `[analytics]` 비활성화를 승인 정본에 편입했다(Interface 절). ②지각 기준 인수 조건의 자기 모순을 해소했다 — 지각 판정은 P5-T05 소유이며 이 task는 규칙표 값만 둔다(F-02). ③참조 데이터 멱등성을 `ON CONFLICT DO NOTHING`(모든 unique 충돌 흡수)으로 정정했다. 표시명이 바뀐 DB에 재적용해도 `code` 충돌로 중단되지 않는다(F-05). ④RLS 인수 조건을 실동작대로 정밀화했다 — `42501` 거부는 INSERT에 성립하고 UPDATE·DELETE는 행 필터로 영향 0행이며, 정책 0개 자체를 pgTAP이 단언한다(F-04). ⑤위험표의 경계값 항목을 실제 스키마에 맞게 정정했다 — 정확도·반경은 하한만 존재한다(F-06). ⑥`default_hourly_wage` 초기값 12000이 자리표시자임을 명시하고 확인 주체를 P7-T04로 지정했다(F-07). |

- 관련 spec: PRD:INV-STAFF-02, DOMAIN:SCHEDULING, DOMAIN:ATTENDANCE, ADR:0001
- 적용 깊이: 심화 (DB·권한·참조 데이터)
- test mode: tdd
- 예정 check IDs: supabase-reset, foundation-seed, schema-constraints, rls-default-deny

## Requirements

### 범위와 비목표

- 범위: Supabase CLI 로컬 개발 환경, migration 디렉터리 구조, 공통 enum과 timestamp·감사 컬럼 규약, `positions`·`venue_settings`·`check_in_rules` 세 테이블, 운영 초기 데이터 migration, 로컬 전용 seed, pgTAP 테스트 하네스.
- 비목표: 다중 장소·다중 홀(PRD 비목표), 포지션 관리 화면과 API(P3-T02), `audit_log` 테이블(P1-T04), 스케줄·신청·배정 테이블(P2-T01), 출퇴근 테이블(P5-T02), 인증·역할과 실제 RLS 정책(P1), Supabase 생성 타입의 애플리케이션 배치(소비자가 생기는 P1).

### 불변 규칙

- 시간은 `timestamptz`로 저장하고 날짜 표현과 마감 계산은 `Asia/Seoul`을 쓴다([ARCHITECTURE](../../standards/ARCHITECTURE.md) PostgreSQL 절).
- 권한 파생은 관리자가 편집할 수 있는 표시명이 아니라 변경 불가능한 code로 판정한다([PRD](../../product/PRD.md) 4장·당일 팀장 절).
- 시스템 포지션(`team_lead`)은 삭제도 비활성화도 되지 않는다.
- seed는 로컬 개발에서만 실행된다. 운영 초기 데이터는 migration이 넣는다.
- 포지션 목록의 정본은 DB다. seed도 PRD 표도 정본이 아니다.

### 기술 인수 조건

- `supabase db reset`이 빈 DB에서 migration → seed 순으로 오류 없이 끝난다. 두 번 연속 실행해도 결과가 같다.
- seed 후 `positions` 9행의 표시명·기본 필요 인원·성별 조건이 PRD 4장 표와 정확히 일치한다.
- 운영 경로(`supabase db push`, migration만 적용)로도 포지션 9종과 venue 설정이 들어가며, 같은 migration을 다시 적용해도 행이 중복되지 않는다.
- `team_lead` 포지션의 `DELETE`와 `is_active = false` UPDATE가 DB에서 실패한다.
- `venue_settings`가 GPS 반경 100m·위치 정확도 한도 100m를, `check_in_rules`가 PRD 초기 규칙표 두 행을 담는다. 지각 판정(예정 출근 시각 1분 초과)은 이 task가 아니라 P5-T05의 출결 계산이 소유한다(revision 3).
- 세 테이블 모두 RLS가 켜져 있고 정책이 0개라, `anon`과 `authenticated`의 **읽기는 0행, INSERT는 `42501` 거부, UPDATE·DELETE는 행 필터로 영향 0행**이다. 정책 0개 자체를 pgTAP이 단언한다(revision 3).

### 위험 기반 테스트

이 task의 위험은 "migration이 통과했으니 스키마가 맞다"는 착시다. 제약과 RLS는 실제로 위반을 시도해야 드러난다.

| 위험 | 검증 계층 | 배치 |
| --- | --- | --- |
| Happy path — 스키마와 seed가 PRD와 일치 | 실제 PostgreSQL | pgTAP: 컬럼·타입·행 값 대조 |
| 주요 실패 — 시스템 포지션 삭제·비활성화 | 실제 PostgreSQL | pgTAP: `throws_ok`로 DELETE와 UPDATE 각각 |
| 경계값 — venue 설정 `CHECK` 제약(위도·경도 범위, 반경·정확도 하한, 시급 비음수) | 실제 PostgreSQL | pgTAP: 경계 안팎 각 1건. 반경·정확도는 하한(`> 0`)만 존재한다(revision 3) |
| 권한 — RLS 기본 거부 | 실제 PostgreSQL | pgTAP: `anon`·`authenticated` role로 전환해 SELECT 0행, INSERT `42501`, UPDATE·DELETE 영향 0행, 정책 0개 단언(revision 3) |
| 중복 요청 — migration·seed 재실행 | 실제 PostgreSQL | pgTAP: 재적용 후 행 수·값 불변과 표시명 변경 후 재적용 무중단 단언(revision 3) |
| 동시성 | 해당 없음 | 참조 데이터이고 이 task에 동시 변경 경로가 없다 |

오탐 대조군을 함께 둔다. 시스템 code가 없는 일반 포지션은 삭제와 비활성화가 **성공해야** 한다. 이게 없으면 "전부 막는" 구현도 통과한다.

### DEV-* 적용 상태

- `DEV-SSOT-01`: 추가 결정 — 포지션의 정본은 DB이며 seed는 로컬 편의, PRD 표는 초기값 명세다. 셋의 역할을 문서로 구분한다.
- `DEV-DATA-01`: 기본 적용.
- `DEV-DATA-02`, `DEV-SEC-01`: 추가 결정 — 시스템 포지션 보호와 삭제 차단을 UI가 아니라 DB에서 강제한다.
- `DEV-DATA-03`: 해당 없음 — 이 task에 서버 요청 경로가 없다.
- `DEV-DATA-04`: 기본 적용 — 아래 Data model의 `NOT NULL`·`CHECK`·`UNIQUE`·RLS로 강제한다.
- `DEV-DATA-05`: 해당 없음 — 여러 데이터를 바꾸는 command가 없다.
- `DEV-SEC-02`: 기본 적용 — 로컬 Supabase 자격 증명은 `.env`에 두고 저장소에 넣지 않는다.
- `DEV-SEC-03`: 추가 결정 — 권한 파생을 표시명에서 code로 옮긴 것이 이 항목의 우회·악용 대응이다. 회귀 테스트는 위 표의 권한 행이다.
- `DEV-SEC-05`: 해당 없음 — 감사 대상 command가 없다. `audit_log`는 P1-T04.
- `DEV-TEST-01`: 기본 적용 — 위 위험 표가 인수 조건별 렌즈와 계층이다.
- `DEV-TEST-02`: 기본 적용 — mock 없이 로컬 Postgres에서 검증한다.
- `DEV-CODE-07`: 기본 적용 — SQL에도 설명 주석을 쓰지 않는다. 제약과 함수 이름이 의도를 드러내게 한다.
- `DEV-CACHE-*`, `DEV-OFFLINE-*`, `DEV-ERR-*`: 해당 없음 — 클라이언트 경로가 없다.

## Architecture

- 이 task의 산출물은 전부 `supabase/` 아래이며 `src/`에 코드를 만들지 않는다. FSD 계층 판단이 발생하지 않는다.
- Supabase 생성 타입은 만들지 않는다. 소비자가 없는 상태에서 만들면 굳기만 하고 검증되지 않는다. `api/generated/` 배치 규약은 P0-T02가 `exemptPaths`로 이미 세워 뒀으므로 첫 소비자가 생기는 P1이 그대로 쓴다.
- 도메인 책임: `positions`는 `DOMAIN:SCHEDULING`이 소유한다. `venue_settings`와 `check_in_rules`는 `DOMAIN:ATTENDANCE`가 소비하지만 운영 설정이라 관리 주체는 관리자다.
- 서버 경계: 이 task에는 애플리케이션 서버 코드가 없다. 경계는 RLS 하나이며 기본 거부로 닫아 둔다.

## Data model

### 공통 규약

모든 도메인 테이블이 따르며 이후 task가 반복 결정하지 않는다.

- 기본키는 `uuid`이고 기본값은 `gen_random_uuid()`다.
- 모든 테이블은 `created_at timestamptz NOT NULL DEFAULT now()`를 갖는다.
- 변경 가능한 테이블은 `updated_at timestamptz NOT NULL DEFAULT now()`를 갖고 트리거로 갱신한다. append-only 테이블은 `updated_at`을 두지 않는다.
- 감사 대상 테이블은 행위자 컬럼 이름을 `created_by`·`updated_by`로 통일한다. FK는 `profiles`가 생기는 P1-T02에서 붙인다.
- 열거값은 Postgres `enum` 타입을 쓴다. 값이 운영 중 늘어날 수 있는 것은 enum이 아니라 참조 테이블로 둔다.

### enum

- `gender`: `male`, `female`
- `gender_requirement`: `any`, `male`, `female`

`gender_requirement`를 `gender`와 분리한다. 성별은 사람의 속성이고 성별 조건은 포지션의 제약이라 값 집합이 다르며(`any`), 한쪽이 늘어날 때 다른 쪽이 끌려가면 안 된다.

### positions

| 컬럼 | 타입 | 제약 |
| --- | --- | --- |
| `id` | uuid | PK |
| `code` | text | `UNIQUE`, nullable |
| `name` | text | `NOT NULL`, `UNIQUE`, `CHECK (length(btrim(name)) > 0)` |
| `default_required_count` | int | `NOT NULL`, `CHECK (default_required_count >= 0)` |
| `gender_requirement` | gender_requirement | `NOT NULL` |
| `is_default` | boolean | `NOT NULL DEFAULT false` |
| `is_active` | boolean | `NOT NULL DEFAULT true` |
| `created_at`·`updated_at` | timestamptz | 공통 규약 |

- `code`가 `NULL`이면 관리자가 만든 일반 포지션이고, 값이 있으면 시스템이 의미를 아는 포지션이다. 현재 유일한 값은 `team_lead`다.
- 시스템 포지션 보호는 트리거로 강제한다. `code IS NOT NULL`인 행의 `DELETE`를 막고, `UPDATE`로 `is_active`가 `false`가 되거나 `code`가 바뀌는 것도 막는다. `name` 변경은 허용한다.
- 트리거를 쓰는 이유: 이 규칙은 "특정 행의 특정 컬럼 조합"이라 `CHECK`로 표현할 수 없다. `CHECK`는 다른 행이나 삭제 연산을 볼 수 없다.
- `default_required_count`에 상한을 두지 않는다. 홀 운영 규모를 모르는 상태의 임의 상한은 근거 없는 제약이다.
- **`positions`를 참조하는 FK는 모두 `ON DELETE RESTRICT`를 쓴다.** 이 task에는 참조 테이블이 없어 적용 대상이 0건이며, 규약의 정본은 [ARCHITECTURE](../../standards/ARCHITECTURE.md) 주요 테이블 절이다. 첫 적용과 검증은 P1-T05다.

### venue_settings

단일 행 설정 테이블이다. 다중 장소는 PRD가 명시한 비목표다.

| 컬럼 | 타입 | 제약 |
| --- | --- | --- |
| `id` | uuid | PK |
| `latitude` | numeric(9,6) | `NOT NULL`, `CHECK (latitude BETWEEN -90 AND 90)` |
| `longitude` | numeric(9,6) | `NOT NULL`, `CHECK (longitude BETWEEN -180 AND 180)` |
| `gps_radius_m` | int | `NOT NULL`, `CHECK (gps_radius_m > 0)` |
| `location_accuracy_limit_m` | int | `NOT NULL`, `CHECK (location_accuracy_limit_m > 0)` |
| `default_hourly_wage` | int | `NOT NULL`, `CHECK (default_hourly_wage >= 0)` |
| `created_at`·`updated_at` | timestamptz | 공통 규약 |

- 행이 하나뿐임을 `CREATE UNIQUE INDEX ON venue_settings ((true))`로 강제한다. 애플리케이션이 "첫 행"을 고르는 관례에 기대지 않는다.
- 금액은 원 단위 정수다. 부동소수를 쓰지 않는다.
- 좌표 실측값은 운영 배포 때 넣는다. migration에는 홀의 대략 좌표를 넣고 실제 값은 관리자가 설정한다. 좌표는 개인정보가 아니라 사업장 정보다.
- 초기 시급 12000원은 좌표와 같은 자리표시자다(revision 3). PRD는 시스템 기본 시급의 존재만 정하고 금액을 정하지 않으며, 정본은 관리자 설정이고 실제 값 확인은 P7-T04가 맡는다.

### check_in_rules

ARCHITECTURE가 정의한 "첫 예식 시작 시각과 추천 출근 시각의 규칙표"다.

| 컬럼 | 타입 | 제약 |
| --- | --- | --- |
| `id` | uuid | PK |
| `first_ceremony_at` | time | `NOT NULL`, `UNIQUE` |
| `recommended_check_in` | time | `NOT NULL` |
| `created_at`·`updated_at` | timestamptz | 공통 규약 |

- 첫 예식 시각 하나에 추천 출근 시각 하나가 대응하는 정확 대응표다. `UNIQUE`가 표를 함수로 만든다.
- 구간표로 만들지 않는다(revision 2). PRD 「시간 추천」의 초기 규칙은 첫 예식 `10:00` → 출근 `08:20`, `11:00` → `09:10` 두 점뿐이다. 구간으로 옮기려면 PRD에 없는 경계를 설계가 지어내야 하고, 그것은 승인 범위 밖의 제품 결정이다.
- 표에 없는 첫 예식 시각(예: `10:30`)을 어떻게 다룰지는 시간 추천 로직이 정한다. P3-T01 범위다.
- 지각 판정(예정 출근 1분 초과)은 이 표가 아니라 출결 계산이 소유한다. P5-T05 범위이며 여기서는 규칙표 값만 둔다.

### RLS

- 세 테이블 모두 `ENABLE ROW LEVEL SECURITY`를 켜고 **정책을 하나도 만들지 않는다.** Postgres에서 RLS가 켜지고 정책이 없으면 모든 행이 거부된다. `anon`과 `authenticated`에서 읽기·쓰기가 전부 막힌다.
- 실제 정책은 역할(`user_roles`)이 생기는 P1-T04에서 붙인다. 역할 개념 없이 쓴 임시 정책은 P1에서 지워야 하고, 그 사이 잘못 열려 있을 위험이 임시 편의보다 크다.
- `service_role`은 RLS를 우회하므로 migration과 seed는 영향받지 않는다.

### migration과 seed의 분리

| 파일 | 실행 시점 | 내용 |
| --- | --- | --- |
| `supabase/migrations/*_schema.sql` | 로컬·운영 모두 | enum, 세 테이블, 제약, 트리거, RLS |
| `supabase/migrations/*_reference_data.sql` | 로컬·운영 모두 | 포지션 9종, venue 기본 설정, 출근 규칙표 |
| `supabase/seed.sql` | 로컬 `db reset`만 | 개발 편의 데이터. 현재는 비어 있다 |

- 참조 데이터를 seed가 아니라 migration에 두는 것이 기획 결정의 구현이다. Supabase CLI는 `db push`에서 migration만 적용하고 `seed.sql`은 `db reset`에서만 실행하므로, 도구 기본 동작이 "seed는 로컬 전용"을 이미 보장한다.
- 참조 데이터 migration은 `ON CONFLICT DO NOTHING`으로 멱등하게 쓴다(revision 3 — `name`만 지정하면 표시명이 바뀐 DB에서 `code` UNIQUE 충돌이 재적용을 중단시킨다). migration은 한 번만 돌지만 `db reset` 반복과 복구 시나리오에서 안전해야 한다.
- 관리자가 나중에 값을 바꿔도 이 migration은 다시 돌지 않으므로 덮어쓰지 않는다.
- down migration은 만들지 않는다. Supabase CLI가 지원하지 않으며 되돌림은 보상 migration으로 한다.

## Interface

이 task는 애플리케이션 인터페이스를 만들지 않는다. 외부 계약은 CLI 명령뿐이다.

| 명령 | 내용 |
| --- | --- |
| `supabase start` / `stop` | 로컬 스택 기동·정지 |
| `supabase db reset` | 빈 DB에서 migration → seed 재적용 |
| `supabase test db` | pgTAP 테스트 실행 |
| `pnpm db:reset` / `db:test` | 위 둘의 package script 별칭 |

- `pnpm verify`에는 붙이지 않는다. Docker와 로컬 Supabase 기동이 필요해 의존성 없는 환경에서 실패하며, CI 통합은 P0-T05가 소유한다.
- 등록 check `schema-constraints`와 `rls-default-deny`는 `supabase test db` 안의 pgTAP 파일로 실행한다.
- `supabase/config.toml`의 `[analytics]`는 비활성화한다(revision 3, 2026-08-05 사용자 승인). analytics 컨테이너 기동 지연이 `db reset`을 간헐 실패시켜(켠 상태 3회 중 2회 실패, 끈 상태 5회 연속 성공 실측) 등록 check `supabase-reset`의 결정성을 해친다. 로컬 개발 스택 설정이며 운영 환경과 무관하다.

## Optimizations

- 인덱스는 제약이 만드는 것(PK, `UNIQUE`, `EXCLUDE`) 외에 추가하지 않는다. 세 테이블 모두 행이 수십 개 수준이고 조회 패턴이 아직 없다. 근거 없는 인덱스는 만들지 않는다(`DEV-OPT`).
- pgTAP은 Supabase CLI에 내장되어 새 의존성이 없다.
- Vitest 기반 DB 통합 하네스는 이 task에서 만들지 않는다. 검증할 애플리케이션 코드가 없어 소비자 없는 선행 추상화가 된다. 첫 DB 접근 코드가 생기는 P1이 세운다. 역할 분담(pgTAP은 DB 내부 불변, Vitest는 애플리케이션 통합)은 사용자 결정이며 이 task에서는 pgTAP만 실체를 갖는다.

## 변경 허용 경로

```
supabase/**
package.json
.env.example
.gitignore
docs/execution/radio/P0-T03-radio.md
docs/execution/runs/P0-T03/**
docs/execution/reviews/**
docs/execution/phases/index.jsonl
docs/execution/phases/00-foundation.md
docs/execution/dashboard/**
docs/standards/ARCHITECTURE.md
```

## 미결 사항

- venue 좌표와 기본 시급의 실측값은 운영 배포 시점에 관리자가 설정한다. migration에 넣는 초기 좌표·시급 12000원은 자리표시자이며 P7-T04(프로덕션 설정)가 실제 값을 확인한다.
