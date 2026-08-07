# P2-T02 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 설계 인터뷰 확정 3건(이미 활성 모집이 있는 날짜는 달력에서 선택 불가·충돌 처리는 기획 원안 유지(전체 롤백 + 충돌 날짜 안내)·충돌 목록은 DB 함수 반환값으로 전달, 감사 기록은 생성 스케줄당 1행 — 2026-08-07)을 반영. SCHEDULING 도메인의 첫 수직 슬라이스(DB 함수→Action→화면→E2E)로, P2-T01 스키마·제약을 소비만 하고 재정의하지 않는다. |

- 관련 spec: PRD:AC-01, DOMAIN:SCHEDULING, ADR:0003, DESIGN:ADMIN-FLOWS 모집 절
- 적용 깊이: 심화 (SCHEDULING 첫 쓰기 경로·감사 기록 본보기·달력 상호작용 — P2-T03~T05가 이 관례 위에 선다)
- test mode: tdd
- 예정 check IDs: recruitment-batch-create(함수·Action 계약 — pgTAP·unit), admin-recruitment-e2e(달력 선택→생성 흐름 — Playwright). 기획 시점 등록 그대로 유지, 의미만 정본화.

## Requirements

### 범위와 비목표

- 범위: ① 마이그레이션 1개 — `open_recruitment_schedules` DEFINER 함수(관리자 검증·충돌 집계·일괄 생성·감사 기록) ② pgTAP `supabase/tests/13-recruitment-batch-open.test.sql` ③ SCHEDULING 오류 코드 2종 추가 ④ `entities/schedule` 조회 api·DTO·오류 매핑 model ⑤ `features/recruitment`(Server Action·제출 hooks·제출 ui) ⑥ `views/admin-recruitment` + `/admin/recruitment` 라우트 + admin 홈 링크 ⑦ shared Calendar의 셀 선택 가능성 일반화 ⑧ E2E `tests/e2e/recruitment-open.spec.ts`.
- 비목표(기획 승인 그대로): 근무자 신청·철회(P2-T03), 자동 마감·연장·재오픈(P2-T04), 날짜별 신청자 조회 화면(P2-T05), 예식·배정 상세(P3), 모집 오픈 푸시(P4). 설계 비목표: P2-T01 스키마·트리거·RLS 정책 무수정(정책 수 단언 583·588·594행과 충돌 없음), 기존 pgTAP 01~12·기존 마이그레이션·기존 E2E 무수정, 근무자 스케줄 탭(views/schedule) 무수정.

### 불변 규칙

- **원자성과 충돌 처리(기획 원안, 2026-08-07 인터뷰 재확인)**: 함수 한 번이 한 트랜잭션이다. 선택 날짜 중 활성 모집(CANCELLED 제외)이 이미 있는 날짜가 하나라도 있으면 아무것도 생성하지 않고 충돌 날짜 목록을 반환값으로 돌려준다. 예외 메시지 파싱으로 목록을 전달하지 않는다. 사전 집계를 비집고 들어온 동시 생성은 P2-T01 부분 유니크 23505가 최종 거부하고 전체 롤백된다.
- **달력 선택 불가 규칙(설계 인터뷰 확정)**: 이미 활성 모집이 있는 날짜와 KST 오늘 이전 날짜는 달력에서 선택할 수 없다(disabled). 화면 차단은 편의이고 최종 강제는 DB다 — 충돌은 함수 집계·23505, 과거 날짜는 P2-T01 트리거 LB021.
- **감사 기록 단위(설계 인터뷰 확정)**: 생성 스케줄당 1행 — event `schedule_opened`, `actor_profile_id`=호출 관리자, `schedule_id` 채움, detail은 PII 없는 배치 정보(`batch_size`)만. 이 단위가 SCHEDULING 감사 기록의 본보기가 된다.
- 날짜 규칙(과거 금지·마감≤근무일)과 활성 중복 정의는 P2-T01 정본을 소비만 한다 — 함수·Action에서 재구현하지 않고 SQLSTATE를 매핑한다(DEV-SSOT).
- 권한 이중 강제: Server Action `requireAdmin` + 함수 내 `is_admin` 42501. 화면 진입로(admin 홈 링크)는 admin 역할만 노출한다.
- ui 세그먼트는 api를 import하지 않는다(fsd `forbidImports`) — Server Action은 page가 View에 주입한다(admin approvals 관례).
- 월 이동은 `month` searchParam 서버 리렌더로 처리하고 선택 상태는 클라이언트가 유지한다(월 경계 제약 없음 — 기획). private 데이터의 클라이언트 캐시는 두지 않는다(DEV-CACHE-03·04) — 서버 컴포넌트가 요청마다 조회하고 생성 후 `revalidatePath`로 갱신한다.

### 기술 인수 조건

1. `open_recruitment_schedules(work_dates date[], application_deadline date) returns jsonb` — admin 호출 시 입력을 중복 제거한 날짜 전부에 `OPEN` 스케줄을 생성하고 `{"created_count": N, "conflict_dates": []}`를 반환한다. 활성 모집이 있는 날짜가 하나라도 있으면 `created_count` 0, `conflict_dates`에 그 날짜들만 담고 스케줄·감사 행을 만들지 않는다 — pgTAP.
2. 비관리자 주체(active 근무자·pending·anon)의 함수 호출은 42501로 거부되고, 빈 배열·null 원소는 22023으로 거부된다 — pgTAP.
3. 생성 스케줄당 감사 1행이 남고(event·actor·schedule_id·detail 단언), 날짜 규칙 위반(과거 LB021·마감>근무일 23514)이 전파되면 스케줄·감사 행이 하나도 남지 않는다 — pgTAP.
4. Server Action `openRecruitmentSchedules`는 Zod 검증(yyyy-MM-dd 형식·1개 이상·중복 제거·상한 366) 후 rpc를 호출하고 typed Result를 반환한다 — 성공 `{ok:true, createdCount}`, 충돌 `{ok:false, code:SCHEDULING_DATE_CONFLICT, conflictDates}`, SQLSTATE 매핑(42501→COMMON_FORBIDDEN, 23505→SCHEDULING_DATE_CONFLICT, LB021·23514·22023→SCHEDULING_VALIDATION, 그 외→COMMON_UNEXPECTED) — unit.
5. 화면: 활성 모집 날짜·과거 날짜 disabled, 빈 날짜 다중 선택·해제, 선택 수 요약, 공통 마감일 입력(마감≤가장 이른 선택 날짜·오늘 이후 클라이언트 검증), 제출 후 성공 스낵바와 충돌 안내가 동작한다 — 셀 상태·선택 로직은 model·hooks unit, 조립은 E2E.
6. E2E: 관리자 로그인 → `/admin/recruitment` → 기존 활성 모집 날짜가 disabled임을 확인 → 빈 날짜 2개 이상 선택 + 마감일 입력 → 생성 → 성공 안내와 해당 날짜의 disabled 전환을 확인한다.
7. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과, 기존 pgTAP 01~12·기존 마이그레이션·기존 E2E·shared Calendar 기존 테스트 무수정 통과(Calendar 확장은 하위 호환).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 함수 생성·충돌 | 테스트함 — N개 생성·반환값·행 존재 단언 | 테스트함 — 충돌 1개 포함 시 전체 미생성 + 목록 반환 | 테스트함 — CANCELLED만 있는 날짜 생성 허용·당일 날짜 허용·입력 중복 제거 | 해당 없음 — 주체별 허용·거부는 2행이 소유한다 | 테스트함 — 같은 호출 재실행이 전부 충돌로 수렴 | 해당 없음 — 경합 23505 전체 롤백은 P2-T01이 강제하고 실경합 재현은 단일 커넥션 하네스 제약(기존 backlog 과제)이다 |
| 2 함수 권한·입력 | 테스트함 — admin 허용 | 테스트함 — active 근무자·pending·anon 42501 | 테스트함 — 빈 배열·null 원소 22023 | 테스트함 — 주체 시뮬 pgTAP | 테스트함 — 거부 재시도 동일 코드 수렴 | 해당 없음 — 거부는 상태를 만들지 않는다 |
| 3 감사 기록 | 테스트함 — 스케줄당 1행·값 단언 | 테스트함 — 날짜 위반 롤백 시 감사 0행 | 테스트함 — detail 규격(batch_size)·PII 부재 | 해당 없음 — 기록 주체는 함수 내부 고정이다 | 테스트함 — 충돌 반환 경로는 감사 0행 | 해당 없음 — 1행과 같은 트랜잭션이다 |
| 4 Server Action | 테스트함 — 성공 Result 매핑 | 테스트함 — SQLSTATE별 코드 매핑 전수 | 테스트함 — 형식 오류·상한 초과·중복 입력 정리 | 테스트함 — requireAdmin 거부 경로 | 테스트함 — 재제출이 충돌 Result로 수렴 | 해당 없음 — 직렬화는 DB 소유다 |
| 5 화면 로직 | 테스트함 — 셀 상태 매핑·선택 토글 unit | 테스트함 — 마감일 클라이언트 검증 위반 시 제출 차단 | 테스트함 — KST 오늘 경계(당일 선택 가능)·월 이동 시 선택 유지 | 해당 없음 — 진입 가드는 라우트·링크 노출이 소유한다 | 해당 없음 — 제출 상태는 hooks가 단일화한다 | 해당 없음 — 클라이언트 상태는 단일 사용자다 |
| 6 E2E | 테스트함 — 선택→생성→반영 흐름 | 테스트함 — 기존 활성 모집 날짜 disabled 확인 | 테스트함 — 생성 직후 같은 날짜 disabled 전환 | 테스트함 — admin 로그인 픽스처 경로 | 해당 없음 — 세부는 1·4행이 소유한다 | 해당 없음 — 단일 세션 시나리오다 |
| 7 회귀 | 테스트함 — verify·db:test 전체 GREEN | 테스트함 — 기존 산출물 무수정을 커밋 범위로 확인 | 해당 없음 — 세부는 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 |

- 보충: 마감일 이후의 자동 CLOSED 전환·연장·재오픈과 그 시간 경계는 P2-T04 소유다. 이 task의 시간 경계는 달력 disabled 판정(서버 KST 오늘)과 생성 시점 DB 강제뿐이다.

### DEV-* 적용 상태

- `DEV-TIME-01~05`: 기본 적용 — 과거 disabled 판정은 서버가 계산한 KST 오늘 문자열과 달력 날짜 키의 문자열 비교(브라우저 시간대 무관), 최종 강제는 DB LB021. 새 결정 없음.
- `DEV-CACHE-01~05`: 추가 결정 — 이 화면은 클라이언트 쿼리 캐시를 두지 않는다. 서버 컴포넌트가 요청마다 월 범위를 조회하고, 생성 성공 후 `revalidatePath(ADMIN_RECRUITMENT_PATH)`가 유일한 무효화 주체다.
- `DEV-SEC`: 기본 적용 — requireAdmin + 함수 is_admin 이중 강제, 화면은 편의 차단.
- `DEV-ERR`: 추가 결정 — `SCHEDULING_DATE_CONFLICT`(409)·`SCHEDULING_VALIDATION`(422)을 error-codes.config에 신설. SQLSTATE 신설 없음(기존 LB021·23514·23505·42501·22023 소비).
- `DEV-SSOT-01`: 날짜·중복 규칙 정본은 P2-T01 RADIO와 DB 제약. 이 task의 정본은 함수 반환 계약과 감사 기록 단위이며 Data model 절이 소유한다.
- `DEV-TEST-01`: 위 렌즈 표. tdd.json 실제 실행 기록(DB·unit RED→GREEN).

## Architecture

- `supabase/migrations/<ts>_recruitment_batch_open.sql`:
  - `open_recruitment_schedules(work_dates date[], application_deadline date) returns jsonb`, `security definer` + `set search_path` 고정(기존 함수 관례). 순서: `auth.uid()` 호출자 확인 → `is_admin` 아니면 42501 → 빈 배열·null 원소 22023 → `distinct unnest`로 중복 제거 → 활성 모집 충돌 집계(`work_date = any(...) and status <> 'CANCELLED'`) → 충돌 있으면 즉시 `{"created_count":0,"conflict_dates":[...]}` 반환 → 없으면 `insert ... returning`으로 일괄 생성(상태 기본값 OPEN·마감일 공통 적용, 날짜 규칙은 기존 CHECK·트리거가 검증) → 생성 행마다 `scheduling_audit_logs` insert(event `schedule_opened`, actor, schedule_id, detail `{"batch_size": N}`) → `{"created_count":N,"conflict_dates":[]}` 반환.
  - RLS 정책·테이블·트리거 신설 없음. 감사 insert는 DEFINER 소유자 권한으로 통과한다(정책 부재 default deny는 rpc 직접 쓰기에만 적용).
- `supabase/tests/13-recruitment-batch-open.test.sql`(pgTAP): 인수 조건 1~3. 픽스처는 기존 관례(전용 UUID 대역, active 픽스처 `inactivity_anchor_at` 포함 — P1-T06 CHECK), 주체 시뮬 `set local role` + `request.jwt.claim.sub`, 비어 있지 않은 단언은 행 존재 증명 선행(P1-T07 교훈).
- `src/shared/config/error-codes.config.ts`: SCHEDULING 2종 추가. `src/shared/config/auth-routes.config.ts`: `ADMIN_RECRUITMENT_PATH = "/admin/recruitment"` 추가.
- `src/shared/ui/calendar.tsx`: 셀 선택 가능성 일반화 — `CalendarDateState`에 명시 `disabled` 플래그(미지정 시 기존 `none`만 disabled 규칙 유지 — 하위 호환), 관리자 흐름용 셀 상태 `selectable`(선택 가능한 빈 날짜) 추가. 기존 근무자 흐름 상태·기존 테스트 무수정 통과.
- `src/entities/schedule/model/recruitment-schedule.ts`: DB 행 DTO(id·workDate·applicationDeadline·status)와 행 매핑. `model/recruitment-open.ts`: 입력 Zod 스키마(형식·1개 이상·중복 제거·상한 366)와 `mapRecruitmentRpcErrorCode`(worker-update.ts 관례). `api/list-recruitment-schedules.ts`: `server-only`, 기간(월 범위) 조회 — RLS 읽기 정책 하에서 admin 세션으로 실행된다. 기존 `work-schedule.ts`(P0 근무자 탭 목업 타입)는 무수정.
- `src/features/recruitment/`: `api/open-recruitment-schedules.ts`(Server Action — requireAdmin→Zod→rpc→매핑→`revalidatePath`→구조화 stderr 로그, grant-position 관례), `hooks/useOpenRecruitment.ts`(제출 상태·결과 분기 — unit), `ui/`(마감일 입력·선택 요약·제출 버튼 블록 — Action은 prop 주입).
- `src/views/admin-recruitment/`: `model/`(스케줄 행→셀 상태 매핑, 선택 집계·마감일 클라이언트 검증 — unit), `ui/RecruitmentOpenView.tsx`(Calendar + features ui 조립, 월 이동 searchParam 반영, 성공 스낵바·충돌 안내).
- `src/app/(protected)/admin/recruitment/page.tsx`: `month` searchParam 파싱(기본값 KST 이번 달)·KST 오늘 계산·월 범위 조회 후 View에 데이터·Action 주입. `src/app/(protected)/admin/page.tsx`: 「모집 오픈」 링크 추가.
- `tests/e2e/recruitment-open.spec.ts`: 기존 support(super-admin-fixture 등) 재사용, 인수 조건 6.

## Data model

- 신규 테이블·enum·SQLSTATE 없음. **함수 반환 계약(정본)**: `{"created_count": integer, "conflict_dates": date 문자열 배열}` — `conflict_dates`가 비어 있지 않으면 `created_count`는 0이고 어떤 행도 생성되지 않았다는 뜻이다. 부분 성공 상태는 표현 불가능하다.
- **감사 기록 규격(정본, SCHEDULING 본보기)**: 생성 스케줄당 1행 — `event = 'schedule_opened'`, `actor_profile_id` = 호출 관리자, `schedule_id` = 생성 행, `application_id` null, `detail = {"batch_size": N}`(PII 없음). 배치 소속은 detail 공통 값으로만 식별한다.
- Action Result: `{ok:true; createdCount:number} | {ok:false; code:ErrorCode; conflictDates?:string[]}` — `conflictDates`는 `SCHEDULING_DATE_CONFLICT`에서만 채워진다.

## Interface

- 화면 `/admin/recruitment`(admin 전용): 월 달력(빈 날짜 선택 가능, 활성 모집·과거 날짜 disabled, DESIGN COMPONENTS 달력 규격 준수), 공통 마감일 입력, 선택 날짜 수 요약(ADMIN-FLOWS), 생성 버튼. 성공 시 "모집 N건을 열었어요" 스낵바와 달력 갱신, 충돌 시 충돌 날짜 안내와 달력 갱신. admin 홈에 「모집 오픈」 진입 링크.
- Server Action: `openRecruitmentSchedules({dates, applicationDeadline})` — 위 Result 계약. RPC: `open_recruitment_schedules`.
- 실행: `pnpm verify`, `pnpm db:reset && pnpm db:test`, `pnpm test:e2e`.

## Optimizations

월 범위 조회는 P2-T01 부분 유니크 인덱스(work_date 선두)를 그대로 탄다. 신규 인덱스·캐시 없음(추측 최적화 없음 — 신청 조회 인덱스는 P2-T03·T05 재검토 항목 그대로).

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/**
src/app/(protected)/admin/recruitment/**
src/app/(protected)/admin/page.tsx
src/entities/schedule/**
src/features/recruitment/**
src/views/admin-recruitment/**
src/shared/ui/calendar.tsx
src/shared/ui/__tests__/calendar.test.tsx
src/shared/config/auth-routes.config.ts
src/shared/config/error-codes.config.ts
tests/e2e/**
docs/execution/radio/P2-T02-radio.md
docs/execution/runs/P2-T02/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 날짜 규칙의 UPDATE 경로 안전망(연장·재오픈 시 유효성)은 P2-T01 검증에서 이월된 P2-T04 설계 렌즈다. 결정 주체: 사용자(P2-T04 설계 시점).
- 달력 disabled 셀의 배지 문구·시각 표현 상세는 DESIGN COMPONENTS 규격 안에서 구현 재량이다.
- 신청 조회 성능 인덱스는 P2-T03·T05 재검토 항목 그대로 이월한다.
