# P2-T01 handoff

## 2026-08-07 · 개발 종료

- 작업 식별자: P2-T01
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- RADIO(revision 1, SHA-256 `968b1f16ef1172672c4e26445a9c23254aa22349c99bba64c84a672805cf7e12`)를 구현 시작 전 `index.jsonl`의 `development_approval`과 대조해 일치를 확인했다. 의존 task P1-T07은 done, test_mode는 tdd다.
- `supabase/migrations/20260807040000_recruitment_schema.sql`(신규, 유일한 신규 마이그레이션): enum 2종(`schedule_status` 5값 `OPEN|CLOSED|PREPARING|CONFIRMED|CANCELLED`, `application_status` 2값 `applied|withdrawn`) · 테이블 3종.
  - `schedules`: `work_date`·`application_deadline` NOT NULL date, `application_deadline <= work_date` CHECK, `status` 기본값 `OPEN`, `revision` 기본값 1, `set_updated_at`(기존 함수 재사용, 재정의 없음) BEFORE UPDATE 트리거. 부분 유니크 `schedules_work_date_active_unique on (work_date) where status <> 'CANCELLED'`로 활성 중복을 강제한다.
  - BEFORE INSERT 트리거 `reject_past_schedule_dates`: `work_date`·`application_deadline` 둘 다 `(now() at time zone 'Asia/Seoul')::date`보다 이르면 `LB021`.
  - BEFORE UPDATE 트리거 `enforce_schedule_status_transition`: RADIO Data model의 전이 표(`OPEN→CLOSED`·`CLOSED→OPEN`·`CLOSED→PREPARING`·`PREPARING→CONFIRMED`·`OPEN|CLOSED|PREPARING→CANCELLED`) 밖의 상태 변경은 `LB020`, 상태 무변경 UPDATE는 통과.
  - BEFORE DELETE 트리거(공용 함수 `reject_append_only_mutation`, `tg_table_name`·`tg_op`로 메시지 생성): `schedules`·`applications` DELETE와 `scheduling_audit_logs` UPDATE/DELETE를 `LB022`로 거부한다.
  - `applications(id, schedule_id fk not null, profile_id fk not null, status application_status default 'applied', unique(schedule_id, profile_id))`. `applied↔withdrawn`은 UPDATE로 자유 전이(유니크·삭제 금지·enum이 불변을 강제, 별도 전이 트리거 없음).
  - `scheduling_audit_logs(seq bigint generated always as identity primary key, event not null 공백 금지 CHECK, actor_profile_id/schedule_id/application_id 참조, detail jsonb default '{}', created_at)`. 기록 주체(DEFINER 함수)는 후속 task 소유 — 이 task는 테이블·제약만 만들었다.
  - RLS: 3테이블 모두 enable. `schedules_select_active_worker`(`is_active_worker(auth.uid()) or is_admin(auth.uid())`), `applications_select_own_or_admin`(`auth.uid() = profile_id or is_admin(auth.uid())`) — RADIO Architecture 절 문구를 그대로 옮겼다(`(select ...)` initplan 래핑은 RADIO 원문에 없어 추가하지 않았음, `is_admin` 단독 정책 선례(`profiles_select_admin` 등)도 래핑하지 않는 관행과 일치). `scheduling_audit_logs`는 정책 0개(default deny). 세 테이블 모두 쓰기 정책 없음(직접 INSERT/UPDATE는 authenticated·anon·admin 포함 전 주체에서 42501 또는 행 필터로 거부 — 기존 `positions`/`check_in_rules` 패턴과 동일).
- `supabase/tests/12-recruitment-schema.test.sql`(신규, `plan(129)`): 기술 인수 조건 1~6 전부를 단언한다.
  - AC1: enum 라벨·테이블·PK·NOT NULL·기본값·컬럼 타입 메타데이터 + NOT NULL/FK/CHECK(공백 event) 위반 insert 거부(23502·23503·23514) + `revision`·`status` 기본값의 실제 insert 기반 함수적 확인.
  - AC2(활성 중복): `OPEN`·`CLOSED`·`PREPARING`·`CONFIRMED` 4개 활성 상태 각각과의 중복 23505 개별 단언(같은 insert 재시도의 동일 23505 수렴 포함) + `CANCELLED`뿐인 날짜의 재생성 허용(동일 근무일에 CANCELLED 1행 + 새 OPEN 1행 공존 확인).
  - AC4(전이 표): 허용 전이 7종 전부(OPEN→CLOSED·CLOSED→OPEN·CLOSED→PREPARING·PREPARING→CONFIRMED·OPEN/CLOSED/PREPARING→CANCELLED)를 lives_ok+최종 상태 단언, 표 밖 조합 13종 전수(OPEN→PREPARING/CONFIRMED, CLOSED→CONFIRMED, PREPARING→OPEN/CLOSED, CONFIRMED→OPEN/CLOSED/PREPARING/CANCELLED, CANCELLED→OPEN/CLOSED/PREPARING/CONFIRMED)를 LB020 거부로 단언, 상태 무변경 UPDATE 통과(OPEN·종단 CANCELLED 양쪽), 표 밖 전이 재시도의 동일 LB020 수렴 1건. AC2에서 만든 전이 결과 행을 AC4에서 재사용해 픽스처를 중복 생성하지 않았다.
  - AC3(날짜 규칙): 마감>근무일 CHECK 23514, KST 오늘 이전 근무일 LB021, 근무일은 미래여도 마감일만 과거인 경우의 LB021(날짜 두 축을 분리 검증), KST 당일 값 허용(경계 포함, 실제 반영 확인).
  - AC5(신청 제약): 단일 행 insert(기본 `applied`) → 중복 23505 → 다른 근무자 신청은 허용 → `applied↔withdrawn` 양방향 UPDATE 반영 확인 → `schedules`/`applications` DELETE LB022 → `scheduling_audit_logs` UPDATE/DELETE LB022(거부 후 행 보존 확인).
  - AC6(RLS): 비활성 주체 0 rows 단언 전에 `schedules`·`applications` 행 존재를 superuser 컨텍스트에서 먼저 증명(P1-T07 F-01 공허 단언 방지 교훈 적용) → active 근무자·admin의 schedules 조회 허용 → pending·rejected·dormant·departed·anon 5주체 개별 0 rows → applications 본인 조회 허용·타인 근무자 0 rows·admin 조회 허용·anon 0 rows → `scheduling_audit_logs` anon 0 rows(정책 부재) → 쓰기 축: anon·active 근무자·admin 3주체 × 3테이블의 직접 INSERT 거부(42501)·UPDATE 필터 통과(lives_ok, 실제 변경 없음 확인)를 개별 단언.
- TDD 증거(`docs/execution/runs/P2-T01/tdd.json`): DB 계층 1쌍. RED는 마이그레이션 파일을 작업 트리 밖(스크래치패드)으로 옮긴 뒤 `pnpm db:reset && pnpm db:test`를 실제 실행해 얻었다(제약 없는 상태 — `relation "schedules" does not exist` 등 31개 실패, exit 1). 마이그레이션을 원복한 뒤 같은 명령을 재실행해 GREEN을 확인했다(exit 0, 기존 01~11 포함 12파일 627 tests 전부 통과). 과정에서 `work_date like '2099-05-%'`가 `date ~~ unknown` 연산자 부재로 하드 실패해 `between` 비교로 고쳤다(설계 판단 아님, 테스트 SQL 문법 오류 수정).
- 검증 결과: `pnpm verify` 전체 GREEN — format/lint/typecheck/vitest(unit)/harness typecheck·self-test/check:docs/next build/check:app-build/client-secret-scan/playwright e2e(30/30)/`gate:all`(4게이트) 전부 통과. 기존 `supabase/tests/01~11`·기존 마이그레이션 9개는 `git diff`로 무수정을 확인했다(`git status --porcelain supabase/`가 신규 2파일만 보고).

### 미결 사항

- `CONFIRMED→CANCELLED`(확정 후 취소) 허용 여부는 P3 기획 인터뷰가 결정한다(RADIO 원문 미결 사항 그대로 이월). 결정 주체: 사용자(P3 시점).
- 신청 조회 성능 인덱스(profile별·schedule별)는 P2-T03·T05의 실제 조회 패턴 확정 시 재검토한다(RADIO 원문 미결 사항 그대로 이월). 결정 주체: 사용자(해당 설계 시점).

### 다음 행동

1. 교차 검증(opus·codex)을 진행하고 `docs/execution/reviews/P2-T01-review.json`을 남긴다.
2. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로

- `docs/execution/runs/P2-T01/tdd.json` — 실제 명령 실행의 RED→GREEN 기록(DB 1쌍).
- 신규 마이그레이션: `supabase/migrations/20260807040000_recruitment_schema.sql`. 신규 pgTAP: `supabase/tests/12-recruitment-schema.test.sql`(`plan(129)`, 전부 통과).
- RADIO: `docs/execution/radio/P2-T01-radio.md`(revision 1, SHA-256 `968b1f16ef1172672c4e26445a9c23254aa22349c99bba64c84a672805cf7e12`, 무수정).
- `docs/execution/phases/index.jsonl`: P2-T01을 `in_progress`로 전환(개발 시작 시점).
