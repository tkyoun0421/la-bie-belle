# P3-T07 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-15
- 개발 설계 승인: user, 2026-08-15

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-15 | 최초 작성. 설계 인터뷰 확정 3건 — 근무자용 배정표 조회는 SECURITY DEFINER RPC `get_confirmed_roster` 하나로 열고, 포지션 정렬은 `positions.sort_order` 컬럼을 신설해 고정 순서(팀장→스캔→메인→드레스→축가→신부 대기실→드레스실→매니저→안내)를 시드하며, 이 정렬을 관리자 준비 화면에도 함께 적용한다(기획 보강 동반). 2026-08-15 사용자 결정. |
| 2 | 2026-08-15 | 개발 단계 정지 조건 반환의 해소. revision 1의 전제 「예정 출퇴근·상태는 기존 조회로 읽는다」가 코드와 어긋났다 — `listRecruitmentSchedules`의 select에는 `planned_checkin`·`planned_checkout`이 없고, 근무자가 예정 시각을 읽는 함수가 저장소에 없다. 예정 시각은 `get_confirmed_roster` 반환 jsonb 최상위 키로 함께 반환한다(확정 스케줄은 LB027 차단 덕에 예정 시각이 항상 있다). 캘린더 공용 조회는 건드리지 않는다. 2026-08-15 사용자 결정. |

- 관련 spec: PRD:AC-05, PRD 13장(개인정보와 공개 범위), DOMAIN:SCHEDULING(INV-STAFF-03), ADR:0002, DOCS:SDD(WORKER-FLOWS 확정 스케줄 절)
- 적용 깊이: 깊음 — 개인정보 공개 경계가 본질이다. admin 전용 select 아래 있던 데이터(이름·포지션·교육생·예식)를 근무자에게 여는 새 읽기 경로가 생긴다.
- test mode: tdd
- 예정 check IDs: roster-api(RPC 권한·필드 경계·상태 게이트 pgTAP + 조회 api·그룹 계산 단위), roster-mobile-e2e(근무자 배정표 모바일 e2e)

## 전제

- 기획 승인(2026-08-15)이 소유한 제품 결정을 다시 열지 않는다: 승인 근무자 전원 열람, 포지션 그룹 문법(정식 위·구분선 아래 교육생·겸직 중복 등장), 인원 숫자 비노출, 빈 포지션 숨김, 배정표는 CONFIRMED만, OPEN 직접 진입은 모집 중 안내, 예식 전부 표시, 미배정자는 `내 배정` 없음.
- 예상 급여(P6-T02), 근무 변경 요청 활성화(P4), 확정 후 변경 표시(P3-T09 이후)는 이 task 밖이다.
- 코드 대조 확정 사실: `assignments`·`assignment_positions`·`assignment_trainees`·`ceremonies`·`schedule_position_requirements`·`profiles`(타인) 전부 admin 전용 select다. `schedules`는 `is_active_worker`로 근무자 select가 열려 있고 상태는 기존 조회(`listRecruitmentSchedules`)로 읽지만, 그 select에 `planned_checkin`·`planned_checkout`이 없어 예정 시각은 RPC 응답이 함께 반환한다(revision 2). `is_active_worker(uuid)`·`is_admin(uuid)` 헬퍼 존재. `positions`에 정렬 컬럼 없음, 시드 9종의 이름이 확정 순서와 1:1 대응(「대기실」=시드 「신부 대기실」). 다음 오류 코드 빈 자리는 LB031. `reject_system_position_change` 트리거는 code·is_active·삭제만 막아 `sort_order` 갱신과 무관하다.

## Requirements

### 범위와 비목표

범위: 읽기 RPC 하나(`get_confirmed_roster`), `positions.sort_order` 컬럼과 시드 순서, 오류 코드 1개(LB031), 근무자 상세 화면 재구성(포지션 그룹·실데이터), OPEN 직접 진입 안내, 관리자 준비 화면 포지션 정렬 적용, mock 데이터 교체, pgTAP·단위·e2e.

비목표: 쓰기 경로 변경 없음(읽기 전용 task). 배정·확정·모집 동작 무변경. 포지션 순서 편집 UI 없음(새 포지션은 목록 끝). 알림·급여·변경 요청 없음. 기존 admin 전용 select 정책 완화 없음.

### 불변 규칙

- 공개 금지 필드(시급·시급 스냅샷·휴대폰·생년월일·성별·가능 포지션 전체·출결)는 RPC 반환형에 아예 존재하지 않는다 — 화면 필터가 아니라 DB 경계에서 배제한다(PRD 13장).
- roster는 CONFIRMED 스케줄에서만 반환된다. 다른 상태는 LB031 거부다.
- 기존 테이블의 admin 전용 select 정책은 한 줄도 완화하지 않는다. 근무자 읽기는 RPC 하나뿐이다.
- 필요 인원·미달 수치는 근무자 응답에 없다.
- 미달 판정·필요 인원 표시 등 관리자 화면의 동작은 정렬 외에 바꾸지 않는다.

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- 기존 pgTAP·단위·e2e 단언이 관리자 준비 화면의 포지션 순서를 고정하고 있어 정렬 적용과 충돌하는 경우.
- 화면 재구성이 `src/shared/ui/**` 변경을 요구하는 경우.
- `src/views/home/**`(home mock 포함)을 건드려야 타입이 맞는 경우 — home 화면은 이 task 범위 밖이다.

### 기술 인수 조건

1. `get_confirmed_roster`가 승인 근무자에게 예정 출퇴근 시각, 예식 시각 목록과 배정 행(이름·포지션명·sort_order·교육생 여부·본인 여부)만 반환하고, 반환 jsonb 어디에도 시급·스냅샷·휴대폰·생년월일·성별 키가 없다(pgTAP — 키 부재를 값으로 단언).
2. 미배정 승인 근무자의 호출이 성공하고, 승인 전(pending)·비로그인 호출은 42501로 거부된다(pgTAP).
3. CONFIRMED가 아닌 스케줄(OPEN·CLOSED·CANCELLED)은 LB031, 존재하지 않는 스케줄은 22023으로 거부된다(pgTAP).
4. 겸직자는 맡은 포지션마다 행으로 등장하고, 교육생은 소속 포지션의 교육생 행으로 나오며, 정식도 교육생도 없는 포지션은 응답에 없다(pgTAP).
5. 응답 행이 `sort_order` 순으로 정렬 가능하고, 시드 9종의 sort_order가 확정 순서와 일치한다(pgTAP).
6. server action 계층이 RPC 응답을 `{ ok, data } | { ok: false, code }`로 매핑하고 42501·LB031·22023을 각각 의미 있는 코드로 옮긴다(unit).
7. 포지션 그룹 계산(평면 행 → 그룹 배열, 정식·교육생 분리, 본인 표시)이 model 순수 함수이고 겸직·교육생만·빈 입력 경계를 단위로 단언한다(unit).
8. 근무자 e2e — 확정 스케줄 상세에서 포지션 그룹·`내 배정`·교육 구분이 보이고, 그날 미배정 근무자에게 `내 배정` 섹션이 없다(e2e).
9. 관리자 준비 화면의 포지션 목록이 sort_order 순으로 나온다(unit 또는 기존 e2e 보강).
10. OPEN 스케줄을 URL로 직접 열면 배정표 없이 모집 중 안내가 나온다(e2e 또는 컴포넌트 검증 관례).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 필드 경계 | 테스트함 — pgTAP에서 반환 구조의 허용 키만 존재 단언 | 테스트함 — 금지 키(시급·스냅샷·휴대폰·생년월일·성별) 부재를 각각 단언 | 테스트함 — 교육생 행도 같은 필드 집합만 | 테스트함 — 2번 행이 함께 소유 | 해당 없음 — 읽기 멱등 | 해당 없음 — 읽기 전용 |
| 2 열람 권한 | 테스트함 — 미배정 승인 근무자 성공 | 테스트함 — pending 42501, 비로그인 42501 | 테스트함 — 본인 배정 근무자와 미배정 근무자가 같은 응답(is_self만 다름) | 테스트함 — admin도 성공(기존 권한 축소 없음) | 해당 없음 — 읽기라 재호출이 같은 응답이다 | 해당 없음 — 읽기 전용이라 경합 상태가 없다 |
| 3 상태 게이트 | 해당 없음 — 아래 실패 칸이 본체 | 테스트함 — OPEN·CLOSED·CANCELLED LB031, 미존재 22023 | 테스트함 — 확정 직후 즉시 조회 성공 | 해당 없음 — 2번 행이 소유 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 읽기 전용이라 경합 상태가 없다 |
| 4 그룹 내용 | 테스트함 — 정식·교육생 혼합 스케줄의 행 구성 단언 | 테스트함 — 빈 포지션이 응답에 없음 | 테스트함 — 겸직자 2행, 교육생만 있는 포지션(담당자 없음)도 등장 | 해당 없음 — 2번 행이 소유 | 해당 없음 — 읽기라 재호출이 같은 응답이다 | 해당 없음 — 읽기 전용이라 경합 상태가 없다 |
| 5·9 정렬 | 테스트함 — 시드 sort_order 값과 응답 정렬 단언, 준비 화면 정렬 단위 | 테스트함 — sort_order 동률(신규 포지션 기본값)은 이름순 보조 정렬 | 테스트함 — 신규 포지션이 목록 끝 | 해당 없음 — 2번 행이 소유 | 해당 없음 — 읽기라 재호출이 같은 응답이다 | 해당 없음 — 읽기 전용이라 경합 상태가 없다 |
| 6 응답 매핑 | 테스트함 — 성공 데이터 매핑 단위 | 테스트함 — 42501·LB031·22023·57P01 각 매핑 단위(22023 미매핑으로 500에 떨어진 P3-T06 F-07을 반복하지 않는다) | 해당 없음 — 코드 분기 전수가 주요 실패 칸 소유다 | 해당 없음 — 권한 거부 매핑을 주요 실패 칸이 소유한다 | 해당 없음 — 매핑은 순수 분기다 | 해당 없음 — 매핑은 순수 분기다 |
| 7 그룹 계산 | 테스트함 — 평면 행→그룹 산출 단위 | 테스트함 — 교육생이 정식 목록에 섞이면 어긋나 드러남 | 테스트함 — 겸직 중복·교육생만·빈 입력 세 경계 | 해당 없음 — 계산 계층 | 해당 없음 — 순수 함수다 | 해당 없음 — 순수 함수다 |
| 8·10 화면 | 테스트함 — e2e 확정 상세의 그룹·내 배정·교육 구분 | 테스트함 — OPEN 직접 진입이 모집 중 안내 | 테스트함 — 미배정 근무자의 `내 배정` 부재 | 테스트함 — 근무자 계정으로 실행(admin 아님) | 해당 없음 — 읽기 화면이라 제출 동작이 없다 | 해당 없음 — 읽기 화면이라 경합 상태가 없다 |

- 보충 위험: **e2e 픽스처 work_date 밴드** — 새 spec은 `work-date-band.ts`에 전용 밴드를 추가하고 spec 내 테스트끼리 겹치지 않게 결정적 날짜를 나눈다(P3-T06 backlog F-06의 무작위 충돌을 새로 만들지 않는다). **mock 교체 범위** — `confirmation.mock`은 preview 페이지와 home mock이 함께 쓴다. schedule-detail 경로만 실데이터로 바꾸고 home이 소비하는 mock 표면은 유지한다(정지 조건 참조).

### DEV-* 적용 상태

- DEV-SEC: 기본 적용 — security definer, `set search_path = public, pg_temp` 고정, revoke 후 `authenticated` execute grant, 권한 검사(`is_active_worker` or `is_admin`)는 함수 안. 개인정보 배제는 반환형에서 강제.
- DEV-DATA·DEV-SSOT: 기본 적용 — 포지션 순서 정본은 `positions.sort_order` 하나. 코드에 이름 목록을 두지 않는다.
- DEV-CACHE: 기본 적용 — RSC 서버 조회, 기존 상세 페이지 조회 관례와 동일. 새 캐시 계층 없음.
- DEV-TIME: 해당 없음 — 시간 경계 계산 없음(예식 시각은 저장값 표시).
- DEV-CODE-07·주석 금지·barrel 금지·server-only: 기본 적용.

## Architecture

- 조회는 entities 계층: `src/entities/schedule/api/get-confirmed-roster.ts` — `import "server-only"`, Supabase 서버 클라이언트로 RPC 호출, 오류 코드 매핑. 단위 테스트 필수(fsd.json api 세그먼트). 형제 `list-*` 관례를 따른다.
- 그룹 계산은 화면 로직이므로 `src/views/schedule-detail/model/roster-groups.ts` 순수 함수 신설(unit 필수). UI에 로직을 두지 않는다.
- `ScheduleDetailView`는 그룹 배열을 받아 그리기만 한다. `schedule-detail-variant.ts`를 `closed | open | confirmed` 3분기로 확장하고 OPEN 안내는 `ScheduleDetailOpenView`(ui, 테스트 면제 — e2e가 덮음)로 만든다.
- `src/app/(protected)/schedule/[id]/page.tsx`가 기존 스케줄 조회(상태 판단)에 이어 CONFIRMED일 때만 roster 조회를 호출해 배선한다.
- 관리자 준비 화면 정렬: `list-schedule-requirements.ts` 조회에 `positions.sort_order`를 포함하고 서버 코드에서 (sort_order, 이름) 순 정렬한다. 화면 동작 변경 없음. 기존 단위 테스트의 `order("position_id", { ascending: true })` 호출 단언은 새 정렬로 함께 갱신한다 — 알려진 범위 내 단언 변경이며 정지 조건이 아니다.
- DB 경계: 근무자 읽기는 `get_confirmed_roster` 정의자 함수 하나. 새 RLS 정책 없음, 기존 정책 무수정.

## Data model

- 새 마이그레이션 `supabase/migrations/20260816000000_confirmed_roster.sql` 하나. 기존 마이그레이션 소급 수정 없음.
  - `alter table positions add column sort_order integer not null default 1000`.
  - 시드 9종 update: 팀장 10, 스캔 20, 메인 30, 드레스 40, 축가 50, 신부 대기실 60, 드레스실 70, 매니저 80, 안내 90. 새 포지션은 default 1000으로 목록 끝(이름순 보조 정렬).
  - `create function get_confirmed_roster(target_schedule_id uuid) returns jsonb`:
    1. `is_active_worker(auth.uid()) or is_admin(auth.uid())` 아니면 42501.
    2. `schedules` 조회 — 없으면 22023, `status <> 'CONFIRMED'`면 LB031.
    3. `ceremonies` 시각 목록과 배정 행 집계 — `assignments`+`assignment_positions`(정식), `assignment_trainees`(교육생)를 `profiles`(이름)·`positions`(이름·sort_order)와 조인. 본인 여부는 `profile_id = auth.uid()`.
    4. `jsonb_build_object('planned_checkin', …, 'planned_checkout', …, 'ceremonies', …, 'roster', …)` 반환 — 확정 스케줄은 LB027 차단 덕에 예정 시각이 항상 있다. roster 행 필드는 name·position_name·sort_order·is_trainee·is_self뿐.
- 읽기 전용 함수라 잠금·트랜잭션 추가 결정 없음.

## Interface

- `error-codes.config.ts`에 1개 추가: LB031 `SCHEDULING_ROSTER_NOT_CONFIRMED` { http: 409, "아직 확정되지 않은 스케줄이에요" }. 기존 코드의 문구·http 무수정.
- 조회 api 응답은 기존 `{ ok, data } | { ok: false, code }` 계약. 42501 → `IDENTITY_NOT_ACTIVE`, LB031 → `SCHEDULING_ROSTER_NOT_CONFIRMED`, 22023 → `COMMON_NOT_FOUND` 매핑과 각 단위 테스트.
- 멱등·오프라인·재시도: 읽기 전용이라 기존 조회 흐름과 동일(추가 결정 없음).

## Optimizations

- roster RPC 왕복 1회(예식·예정 시각 포함). 스케줄 상태는 페이지가 이미 가진 기존 조회를 재사용한다. 그룹 계산은 클라 순수 함수로 왕복 0회.
- 실패 로그 이벤트는 기존 entities api 로깅 패턴(`scheduling_get_confirmed_roster_failed`).
- 되돌림: 컬럼·함수 추가뿐이라 drop으로 되돌릴 수 있다.

## 변경 허용 경로

```
supabase/migrations/20260816000000_confirmed_roster.sql
supabase/tests/22-confirmed-roster.test.sql
src/entities/schedule/api/get-confirmed-roster.ts
src/entities/schedule/api/__tests__/get-confirmed-roster.test.ts
src/entities/schedule/api/list-schedule-requirements.ts
src/entities/schedule/api/__tests__/list-schedule-requirements.test.ts
src/entities/schedule/model/**
src/views/schedule-detail/**
src/views/admin-schedule/**
src/app/(protected)/schedule/[id]/page.tsx
src/app/preview/page.dev.tsx
src/shared/config/error-codes.config.ts
tests/e2e/schedule-roster.spec.ts
tests/e2e/support/**
docs/execution/radio/P3-T07-radio.md
docs/execution/runs/P3-T07/**
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/views/admin-schedule/**`와 `list-schedule-requirements.ts`는 포지션 정렬 적용에만 쓰고 필요 인원·배정·확정 동작을 바꾸지 않는다. `error-codes.config.ts`는 LB031 1개 추가뿐이다. `src/entities/schedule/model/**`은 roster 타입 정리와 schedule-detail용 mock 교체에만 쓰고 home이 소비하는 mock 표면은 유지한다. `tests/e2e/support/**`는 밴드 1개 추가와 기존 헬퍼 재사용에만 쓴다.
- `docs/product/**`는 의도적으로 빠져 있다. PRD·WORKER-FLOWS·ADMIN-FLOWS·DECISIONS 수정은 기획·설계 승인 시점에 조정자가 끝낸다.
- 위 밖의 파일이 필요해지면 멈추고 반환한다.

## 미결 사항

- 포지션 순서 편집 UI — 새 포지션이 실제로 생겨 순서 조정이 필요해지는 시점의 새 task.
- 교대 후보 화면의 이름 공개 범위(PRD 13장 "이름과 교대 가능 여부만") — P4 변경 요청 task.
- 확정 후 변경 시 배정표 갱신 표시 — P3-T09 이후.
