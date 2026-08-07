# P2-T01 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 설계 인터뷰 확정 3건(단일 행 신청 + 전이 사건 기록·전이 표 DB 트리거 최종 강제·스케줄 읽기 active 근무자 한정 — 2026-08-07)을 반영. SCHEDULING 도메인의 첫 스키마로 시간 규칙은 DEV-TIME-01~05를 그대로 적용하고, P1-T07 교차 검증 교훈(읽기 축 명시 단언·공허 단언 방지 픽스처)을 선반영한다. |

- 관련 spec: PRD:AC-01, PRD:AC-02, DOMAIN:SCHEDULING, ADR:0003
- 적용 깊이: 심화 (DB 스키마·RLS·시간 경계 — 이후 P2~P3 전이 구현이 전부 이 위에 선다)
- test mode: tdd
- 예정 check IDs: schedule-migration, recruitment-state-transition (index에 기획 시점 기록 완료)

## Requirements

### 범위와 비목표

- 범위: ① 마이그레이션 1개 — enum 2종(`schedule_status` 5값·`application_status` 2값), 테이블 3종(`schedules`·`applications`·`scheduling_audit_logs`), 날짜 CHECK·과거 금지 트리거·활성 중복 부분 유니크·전이 표 트리거·append-only 강제·RLS ② pgTAP `supabase/tests/12-recruitment-schema.test.sql`. 그 외 파일 없음(src/ 코드 없음 — 소비는 P2-T02 이후).
- 비목표(기획 승인 그대로): 취소 전이 실행(P3), 일괄 오픈 API(P2-T02), 신청 API·상태 갱신 함수(P2-T03), 자동 마감 Cron·연장·재오픈(P2-T04), 화면(P2-T05). 설계 비목표: 기존 pgTAP 01~11·vitest·E2E 무수정, 기존 마이그레이션 무수정, DEFINER 함수 신설 없음(전이·기록의 실행 주체는 후속 task).

### 불변 규칙

- **스케줄 상태 전이 표의 정본은 이 RADIO의 Data model이고, 최종 강제는 DB 트리거다**(설계 인터뷰 확정). 후속 task(T02·T04·P3)의 전이 함수가 표를 잘못 구현해도 트리거가 거부한다. 표 확장(P3의 취소·확정 흐름)은 새 마이그레이션 + 이 RADIO의 재봉인 없이 P3 RADIO가 소유한다 — 이 task는 현재 spec(PRD 173~190행·ADR-0003)이 소유한 전이만 허용한다.
- 업무 날짜는 PostgreSQL `date`, 경계 판정은 Asia/Seoul이다(DEV-TIME-03). 마감 시각(23:59:59 KST)은 저장하지 않는 파생이며 실행은 P2-T04 소유다. 과거 금지 판정 기준은 `(now() at time zone 'Asia/Seoul')::date`다.
- 같은 근무일의 활성 모집은 하나다 — `CANCELLED` 제외 부분 유니크 인덱스로 강제한다(기획 확정).
- 신청은 profile×schedule 단일 행이 `applied↔withdrawn`을 오가고(재신청 자유 — PRD 189행), 행 삭제는 트리거로 거부한다. 전이 사건의 기록처는 `scheduling_audit_logs`(append-only, `seq` identity 정렬 — P1-T05 교훈)이며 기록 주체는 후속 task의 DEFINER 함수다. 이 task는 테이블·제약만 만든다.
- RLS: `schedules` 읽기는 active 근무자·관리자만(설계 인터뷰 확정 — `is_active_worker` 기반, 비활성·anon 거부를 명시 단언), `applications` 읽기는 본인·관리자만(권한 매트릭스), `scheduling_audit_logs`는 정책 부재(default deny — 조회 화면은 후속 task 소유). 세 테이블 모두 쓰기 정책을 만들지 않는다.
- 거부 오류 계약: 전이 표 밖 상태 UPDATE `LB020`, 날짜 규칙 위반(마감>근무일은 CHECK 23514, 과거 날짜는 트리거 `LB021`), append-only 위반(스케줄·신청 DELETE, 감사 UPDATE/DELETE) `LB022`. 활성 중복은 부분 유니크 23505.
- 읽기 축 단언은 공허하지 않아야 한다 — 비활성 주체 거부(0 rows) 단언 전에 해당 데이터가 실제로 존재함을 같은 파일에서 증명한다(P1-T07 F-01 교훈).

### 기술 인수 조건

1. enum 2종·테이블 3종·`revision integer not null default 1`이 생성되고 FK(`applications.profile_id`→profiles, `applications.schedule_id`→schedules)·NOT NULL이 pgTAP으로 단언된다.
2. 같은 근무일에 `CANCELLED`가 아닌 스케줄이 이미 있으면 두 번째 insert가 23505로 거부되고, `CANCELLED`뿐인 날짜에는 재생성이 허용된다.
3. `application_deadline > work_date` insert가 CHECK으로, KST 오늘 이전 `work_date` 또는 `application_deadline` insert가 트리거 `LB021`로 거부된다. 당일 값은 허용된다.
4. 전이 표(Data model) 안의 상태 UPDATE는 전부 허용되고 표 밖 조합(예: OPEN→PREPARING, OPEN→CONFIRMED, CONFIRMED→OPEN, CANCELLED→아무 상태)은 전부 `LB020`으로 거부된다 — 조합 전수 pgTAP.
5. `applications`는 profile×schedule 유니크가 강제되고 `applied↔withdrawn` 양방향 UPDATE가 허용되며, `schedules`·`applications` DELETE와 `scheduling_audit_logs` UPDATE/DELETE는 `LB022`로 거부된다.
6. RLS 읽기 축: active 근무자·admin의 `schedules` 조회 허용(행 존재 증명 포함), anon·pending·rejected·dormant·departed의 조회 0 rows, `applications`는 본인·admin만 행이 보이고 타인 근무자 0 rows, 세 테이블 직접 INSERT/UPDATE가 authenticated 주체에서 거부된다 — 전부 주체 시뮬 pgTAP.
7. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과, 기존 pgTAP 01~11 무수정.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 스키마 생성 | 테스트함 — 테이블·enum·기본값·FK 단언 | 테스트함 — NOT NULL·FK 위반 insert 거부 | 테스트함 — revision 기본값 1 단언 | 해당 없음 — 스키마 형태는 주체 분기가 없다 | 해당 없음 — 마이그레이션은 1회 실행이다 | 해당 없음 — 단일 트랜잭션 마이그레이션이다 |
| 2 활성 중복 금지 | 테스트함 — 서로 다른 근무일 생성 허용 | 테스트함 — 활성 상태 4종 각각과의 중복 23505 | 테스트함 — CANCELLED만 있는 날짜의 재생성 허용 | 해당 없음 — 제약은 주체 무관 DB 강제다 | 테스트함 — 같은 insert 재시도가 동일 23505로 수렴 | 해당 없음 — 유니크 인덱스가 경합을 DB에서 직렬화한다 |
| 3 날짜 규칙 | 테스트함 — 당일·미래 조합 생성 허용 | 테스트함 — 마감>근무일 CHECK·과거 날짜 LB021 | 테스트함 — KST 오늘 당일 값 허용(경계 포함) | 해당 없음 — 제약은 주체 무관 DB 강제다 | 해당 없음 — 거부는 상태를 만들지 않는다 | 해당 없음 — 판정은 행 단위 즉시 계산이다 |
| 4 전이 표 강제 | 테스트함 — 허용 전이 전 조합 UPDATE 성공 | 테스트함 — 표 밖 전 조합 LB020 거부 | 테스트함 — CANCELLED·CONFIRMED 종단 상태의 이탈 거부 | 해당 없음 — 트리거는 주체 무관 최종 강제다(주체별 쓰기는 6행 소유) | 테스트함 — 동일 전이 재실행이 표 검증을 다시 통과·거부 | 해당 없음 — 행 잠금 경합은 전이 함수(후속 task) 소유다 |
| 5 신청 제약 | 테스트함 — 단일 행 전이 왕복·유니크 단언 | 테스트함 — 중복 신청 행 23505·DELETE LB022 | 테스트함 — 감사 테이블 UPDATE/DELETE 거부 | 해당 없음 — 제약은 주체 무관 DB 강제다 | 테스트함 — 같은 위반 재시도의 동일 거부 | 해당 없음 — 유니크가 DB에서 직렬화한다 |
| 6 RLS 읽기·쓰기 축 | 테스트함 — active·admin 조회 허용(행 존재 증명 선행) | 테스트함 — authenticated 직접 INSERT/UPDATE 거부 | 테스트함 — 비활성 4종 각각의 0 rows 개별 단언 | 테스트함 — anon 포함 주체 시뮬 전수(P1-T05·T07 교훈) | 해당 없음 — 조회는 상태를 만들지 않는다 | 해당 없음 — 요청별 독립 판정이다 |
| 7 회귀 | 테스트함 — verify·db:test 전체 GREEN | 테스트함 — 기존 01~11 무수정을 커밋 범위로 확인 | 해당 없음 — 세부는 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 |

- 보충: 마감 시각(23:59:59 KST) 실행과 그 경계 테스트는 P2-T04 소유다. 이 task의 시간 경계는 생성 시점 과거 금지 판정뿐이다.

### DEV-* 적용 상태

- `DEV-TIME-01~05`: 기본 적용 — 업무 날짜 `date` 2종, KST 판정식 단일화, 감사 시각 서버 `timestamptz`, 당일 경계 pgTAP. 새 결정 없음.
- `DEV-DATA-04`·`DEV-DATA-05`: 기본 적용 — CHECK·부분 유니크·전이 트리거·append-only 트리거로 DB 최종 강제. 다중 변경 command는 후속 task 소유.
- `DEV-SEC`·AC-12: 기본 적용 — RLS 읽기 정책 + 쓰기 정책 부재, 비활성·anon 명시 단언.
- `DEV-SSOT-01`: 전이 표·날짜 규칙의 정본은 이 RADIO Data model, DB 제약은 그 투영. 문서와 어긋나면 트리거가 아니라 문서를 따른다(재봉인 경로).
- `DEV-ERR-08`: 추가 결정 — SQLSTATE `LB02x` 대역을 SCHEDULING 도메인에 배정(LB020 전이, LB021 날짜, LB022 append-only). identity의 LB00x·LB01x와 겹치지 않는다.
- `DEV-TEST-01`: 위 렌즈 표. tdd.json 실제 실행 기록(DB RED→GREEN — 제약 없는 상태의 실패 단언 선행).

## Architecture

- `supabase/migrations/<ts>_recruitment_schema.sql`:
  - `create type schedule_status as enum ('OPEN','CLOSED','PREPARING','CONFIRMED','CANCELLED')` · `create type application_status as enum ('applied','withdrawn')`.
  - `schedules(id uuid pk default gen_random_uuid(), work_date date not null, application_deadline date not null, status schedule_status not null default 'OPEN', revision integer not null default 1, created_at/updated_at timestamptz — 기존 `set_updated_at` 트리거 재사용, check (application_deadline <= work_date))`.
  - 부분 유니크: `create unique index on schedules (work_date) where status <> 'CANCELLED'`.
  - BEFORE INSERT 트리거(스케줄): `work_date`·`application_deadline`이 `(now() at time zone 'Asia/Seoul')::date`보다 이전이면 `LB021`.
  - BEFORE UPDATE 트리거(스케줄): `old.status → new.status`가 전이 표 밖이면 `LB020`(상태 무변경 UPDATE는 통과).
  - BEFORE DELETE 트리거(스케줄·신청): `LB022`. `scheduling_audit_logs` BEFORE UPDATE/DELETE: `LB022`.
  - `applications(id uuid pk, schedule_id fk not null, profile_id fk not null, status application_status not null default 'applied', created_at/updated_at, unique(schedule_id, profile_id))`.
  - `scheduling_audit_logs(seq bigint generated always as identity, event text not null check(length(btrim(event)) > 0), actor_profile_id uuid, schedule_id uuid, application_id uuid, detail jsonb not null default '{}', created_at timestamptz not null default now())` — identity_audit_logs 관례 답습, 기록 주체는 후속 DEFINER 함수.
  - RLS enable 3종 + `schedules_select_active_worker`(`is_active_worker(auth.uid()) or is_admin(auth.uid())`) + `applications_select_own_or_admin`(`auth.uid() = profile_id or is_admin(auth.uid())`). 쓰기 정책·감사 조회 정책 없음.
- `supabase/tests/12-recruitment-schema.test.sql`(pgTAP): 인수 조건 1~6 단언. 픽스처 UUID 전용 대역, active·dormant 픽스처 anchor 값 포함(P1-T06 CHECK), 주체 시뮬은 기존 관행(`set local role` + `request.jwt.claim.sub`).

## Data model

- **스케줄 상태 전이 표(정본)**: `OPEN→CLOSED`(자동·수동 마감, P2-T04) · `CLOSED→OPEN`(연장·재오픈, P2-T04) · `CLOSED→PREPARING`(확정 준비 진입, P3) · `PREPARING→CONFIRMED`(확정, P3) · `OPEN|CLOSED|PREPARING→CANCELLED`(취소, P3). `CONFIRMED`·`CANCELLED`는 이 표에서 종단이다 — 확정 후 변경은 상태 되돌림 없이 revision 증가(ADR-0003), `CONFIRMED→CANCELLED`(확정 후 취소) 허용 여부는 P3 기획이 소유하며 필요 시 P3 마이그레이션이 표를 확장한다.
- 신청 전이: `applied↔withdrawn` 양방향, 단일 행. 상태 2종이라 별도 전이 트리거는 두지 않고 유니크·삭제 금지·enum이 불변을 강제한다.
- 마감 시각은 저장하지 않는다 — `application_deadline`(date) + 23:59:59 KST 파생이며 실행·판정은 P2-T04 소유.
- 감사 detail은 PII 없음(identity 관례 답습).

## Interface

사용자 인터페이스 없음. 소비 인터페이스는 후속 task가 소유한다. 실행 인터페이스는 `pnpm db:reset && pnpm db:test`.

## Optimizations

부분 유니크 인덱스가 활성 중복 검사와 근무일 조회를 겸한다. 그 외 인덱스는 조회 패턴이 생기는 후속 task에서 근거와 함께 추가한다(추측 최적화 없음).

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/**
docs/execution/radio/P2-T01-radio.md
docs/execution/runs/P2-T01/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- `CONFIRMED→CANCELLED`(확정 후 취소) 허용 여부는 P3 기획 인터뷰가 결정한다. 결정 주체: 사용자(P3 시점).
- 신청 조회 성능 인덱스(profile별·schedule별)는 P2-T03·T05의 실제 조회 패턴 확정 시 추가를 재검토한다.
