# P2-T03 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 기획 확정 2건(Undo 범위 포함·마감은 상태+시각 이중 검증)과 설계 인터뷰 확정 1건(Undo는 다음 변경 전까지 유지 — 2026-08-07)을 반영. 봉인된 P2-T01(스키마)·P2-T02(달력 확장·반환값 관례·감사 단위) RADIO를 계약으로 삼아 P2-T02 구현 완료 전에 설계했다(파이프라이닝 보정). P2-T02 재봉인이 생기면 달력·관례 전제를 재점검한다. |

- 관련 spec: PRD:AC-02, DOMAIN:SCHEDULING, ADR:0003, DESIGN:WORKER-FLOWS 근무 신청 절
- 적용 깊이: 심화 (근무자 첫 쓰기 경로·batch 멱등 의미론·일정 탭 실데이터 전환)
- test mode: tdd
- 예정 check IDs: application-api(함수·Action 계약 — pgTAP·unit), worker-application-e2e(달력 선택→batch 저장→Undo 흐름 — Playwright). 기획 시점 등록 그대로 유지, 의미만 정본화.

## Requirements

### 범위와 비목표

- 범위: ① 마이그레이션 1개 — `apply_recruitment_changes` DEFINER 함수(활성 근무자 검증·대상 전수 검증·목표 상태 멱등 적용·감사 기록) ② pgTAP `supabase/tests/14-recruitment-application.test.sql` ③ 오류 코드 1종(`SCHEDULING_APPLICATION_BLOCKED`) ④ `entities/schedule` 신청 조회 api·입력 스키마·오류 매핑 확장 ⑤ `features/application`(Server Action·batch 상태 hooks·하단 저장/되돌리기 ui) ⑥ `views/schedule` 실데이터 전환(화면 로직 model 분리 포함)과 `(tabs)/schedule` 서버 컴포넌트 전환 ⑦ 기존 `tests/e2e/schedule.spec.ts`를 실데이터 흐름으로 갱신(스텁 대체 — 기존 E2E 무수정 원칙의 명시적 예외).
- 비목표(기획 승인 그대로): 자동 마감·연장·재오픈(P2-T04), 날짜별 신청자·신청 수 조회(P2-T05), 홈의 마감 임박 카드와 마감·확정 날짜 상세 화면의 내용 확장(P2-T05 — 기존 스텁 상세 라우트로의 이동만 유지), 예식·배정·확정(P3), 알림(P4). 설계 비목표: P2-T01 스키마·트리거·정책 무수정, P2-T02 산출물 무수정(달력 확장 재사용), 기존 pgTAP 01~13 무수정.

### 불변 규칙

- **batch는 목표 상태 의미론이고 멱등이다**: 입력은 「applied로 만들 스케줄」과 「withdrawn으로 만들 스케줄」 두 집합이다. 이미 목표 상태인 항목은 변경 없이 통과하고, 실제 전이만 감사에 남는다. 같은 batch 재실행은 추가 효과가 없다(Undo·재시도 안전의 근거).
- **원자성**: 함수 한 번이 한 트랜잭션. 대상 중 하나라도 신청 불가(OPEN 아님·마감 시각 경과)면 아무것도 바꾸지 않고 차단 날짜 목록을 반환값으로 돌려준다(P2-T02 반환값 관례).
- **마감 이중 검증(기획 확정)**: 함수가 상태 OPEN과 마감 시각(`(now() at time zone 'Asia/Seoul')::date <= application_deadline` — 마감일 23:59:59 KST까지 허용과 동치)을 둘 다 본다. P2-T04 Cron 지연과 무관하게 마감 후 신청·철회는 거부된다.
- **Undo(설계 인터뷰 확정 — 다음 변경 전까지 유지)**: 저장 성공 시 직전 저장 상태와의 diff를 클라이언트가 기억하고, 「방금 변경한 N개 날짜 되돌리기」를 스낵바와 별개로 하단 영역에 유지한다. 소멸 시점은 ① 사용자가 달력 선택을 새로 바꾸기 시작 ② 다음 batch 저장 성공 ③ 화면 이탈. Undo 실행은 반대 방향 batch를 같은 Action으로 보내는 것이며 서버에 별도 상태·경로가 없다. 마감이 지난 날짜가 포함되면 일반 규칙으로 거부된다.
- **감사 기록**: P2-T02가 정한 본보기(사건이 일어난 스케줄당 1행)를 따른다 — 실제 전이마다 `application_applied` 또는 `application_withdrawn` 1행, `schedule_id`·`application_id`·`actor_profile_id` 채움, detail은 PII 없는 batch 정보만.
- 권한: 신청·철회는 active 근무자만(권한 매트릭스). 서버 경계는 세션 인증을 확인하고, active 검증의 정본은 함수의 `is_active_worker`다(위반 42501 → `IDENTITY_NOT_ACTIVE` 매핑). 다른 사용자의 신청 상태는 RLS(`applications_select_own_or_admin`)가 노출을 막는다.
- ui 세그먼트는 api를 import하지 않는다 — Server Action은 page가 주입한다. 화면 로직(셀 상태 매핑·선택 diff·Undo 상태)은 model·hooks에 둔다.
- 월 이동은 `month` searchParam 서버 리렌더 + 클라이언트 선택 유지(P2-T02 관례). private 데이터 클라이언트 캐시 없음, 저장 성공 후 `revalidatePath`.

### 기술 인수 조건

1. `apply_recruitment_changes(apply_schedule_ids uuid[], withdraw_schedule_ids uuid[]) returns jsonb` — active 근무자 호출 시 두 집합의 목표 상태를 원자 적용하고 `{"applied_count":N,"withdrawn_count":M,"blocked_dates":[]}`를 반환한다. 신청은 행 insert(기본 applied) 또는 기존 행 UPDATE, 철회는 기존 행 withdrawn UPDATE다. 이미 목표 상태인 항목은 무변경 통과(멱등)한다 — pgTAP.
2. 대상 중 OPEN이 아니거나 마감 시각이 지난 스케줄이 하나라도 있으면 아무 변경 없이 `blocked_dates`에 해당 근무일만 담아 반환한다. 존재하지 않는 스케줄 id·빈 두 배열·두 배열 교집합·null 원소는 22023, 비활성 주체(pending·dormant·departed·anon)는 42501 — pgTAP.
3. 실제 전이마다 감사 1행(event·actor·schedule_id·application_id 단언)이 남고, 무변경 통과·차단 반환 경로는 감사 0행이다 — pgTAP.
4. Server Action `applyRecruitmentChanges`는 Zod 검증(uuid 배열 2개·중복 제거·교집합 금지·합산 1개 이상·상한 366) 후 rpc를 호출하고 typed Result를 반환한다 — 성공 `{ok:true, appliedCount, withdrawnCount}`, 차단 `{ok:false, code:SCHEDULING_APPLICATION_BLOCKED, blockedDates}`, 매핑(42501→IDENTITY_NOT_ACTIVE, 23505→SCHEDULING_APPLICATION_BLOCKED, 22023→SCHEDULING_VALIDATION, 그 외→COMMON_UNEXPECTED) — unit.
5. 일정 탭: 실데이터 달력(모집 없는 날만 disabled, 마감·확정 날짜 탭 시 기존 상세 라우트 이동), 로컬 선택 diff·변경 개수·`신청하기`, 저장 성공 시 스낵바 + 하단 되돌리기 유지(소멸 3조건), 저장 실패 시 로컬 선택 보존 — 셀 상태·diff·Undo 로직은 model·hooks unit, 조립은 E2E.
6. E2E(`schedule.spec.ts` 갱신): 근무자 로그인 → 일정 탭 → 모집 날짜 2개 선택 + 기존 신청 1개 해제 → 저장 → 셀 상태 반영 확인 → 되돌리기 → 원상 복귀 확인.
7. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과, 기존 pgTAP 01~13·기존 마이그레이션 무수정, P2-T02 산출물 무수정.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 batch 적용 | 테스트함 — 신청·철회 혼합 batch의 행·값 단언 | 테스트함 — 차단 시 전체 미적용 | 테스트함 — 이미 목표 상태 항목 무변경 통과·재신청(withdrawn→applied) 허용 | 해당 없음 — 주체별 허용·거부는 2행이 소유한다 | 테스트함 — 같은 batch 재실행 무효과(멱등) | 해당 없음 — profile×schedule 유니크가 DB에서 직렬화하고 실경합 재현은 단일 커넥션 하네스 제약이다 |
| 2 차단·입력·권한 | 테스트함 — 전 대상 유효 시 통과 | 테스트함 — 마감 경과·비OPEN 포함 시 blocked_dates 반환 | 테스트함 — 마감일 당일 KST 허용 경계·CLOSED/CANCELLED 대상 차단 | 테스트함 — 비활성 4종·anon 42501 주체 시뮬 | 테스트함 — 차단 재시도 동일 반환 수렴 | 해당 없음 — 거부는 상태를 만들지 않는다 |
| 3 감사 기록 | 테스트함 — 전이당 1행·값 단언 | 테스트함 — 차단 경로 감사 0행 | 테스트함 — 무변경 통과 항목 감사 0행 | 해당 없음 — 기록 주체는 함수 내부 고정이다 | 테스트함 — 멱등 재실행 감사 0행 | 해당 없음 — 전이와 같은 트랜잭션이다 |
| 4 Server Action | 테스트함 — 성공 Result 매핑 | 테스트함 — 코드 매핑 전수 | 테스트함 — 교집합·상한·빈 입력 거부 | 테스트함 — 미인증 거부 경로 | 테스트함 — 재제출 Result 수렴 | 해당 없음 — 직렬화는 DB 소유다 |
| 5 화면 로직 | 테스트함 — 셀 상태·diff·Undo 상태 전이 unit | 테스트함 — 저장 실패 시 로컬 보존·Undo 미생성 | 테스트함 — Undo 소멸 3조건·월 이동 시 선택 유지 | 해당 없음 — 페이지 진입은 인증 라우팅이 소유한다 | 해당 없음 — 제출 상태는 hooks가 단일화한다 | 해당 없음 — 클라이언트 상태는 단일 사용자다 |
| 6 E2E | 테스트함 — 선택→저장→반영→Undo 왕복 | 테스트함 — 저장 후 셀 상태 확인 | 테스트함 — 기존 신청 해제 포함 혼합 batch | 테스트함 — 근무자 로그인 픽스처 경로 | 해당 없음 — 세부는 1·4행이 소유한다 | 해당 없음 — 단일 세션 시나리오다 |
| 7 회귀 | 테스트함 — verify·db:test 전체 GREEN | 테스트함 — 기존 산출물 무수정을 커밋 범위로 확인 | 해당 없음 — 세부는 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 |

- 보충: 마감 시각 정밀 경계(23:59:59 vs 자정)는 date 비교(`<= application_deadline`)로 표현되어 초 단위 경계가 없다. CLOSED 전환·연장·재오픈의 시간 경계는 P2-T04 소유다.

### DEV-* 적용 상태

- `DEV-TIME-01~05`: 기본 적용 — 마감 판정은 함수의 KST date 비교 단일식, 화면 표시는 서버 KST 오늘 주입(P2-T02 관례). 새 결정 없음.
- `DEV-CACHE-01~05`: 기본 적용 — P2-T02와 동일(서버 컴포넌트 요청별 조회·revalidatePath 단일 무효화). 로컬 선택·Undo 기억은 캐시가 아니라 화면 상태다.
- `DEV-SEC`: 기본 적용 — 함수 is_active_worker 정본 + RLS 노출 차단 + 세션 인증 경계.
- `DEV-ERR`: 추가 결정 — `SCHEDULING_APPLICATION_BLOCKED`(409) 신설. SQLSTATE 신설 없음.
- `DEV-SSOT-01`: 상태·마감·이력 규칙의 정본은 P2-T01, 감사 단위의 정본은 P2-T02. 이 task의 정본은 batch 목표 상태 의미론과 Undo 소멸 규칙이며 이 RADIO가 소유한다.
- `DEV-TEST-01`: 위 렌즈 표. tdd.json 실제 실행 기록(DB·unit RED→GREEN).

## Architecture

- `supabase/migrations/<ts>_recruitment_application.sql`: `apply_recruitment_changes` DEFINER 함수, `set search_path` 고정. 순서: `auth.uid()` 확인(없으면 42501) → `is_active_worker` 검증(아니면 42501) → 입력 검증(둘 다 빈 배열·교집합·null 원소 22023) → 대상 스케줄 잠금 조회(`for update` — 상태·마감 검증과 적용 사이 전이 방지) → 존재하지 않는 id 22023 → OPEN 아님·마감 경과 항목의 `work_date` 집계 → 있으면 즉시 차단 반환 → 목표 상태 적용(신청: 기존 행 없으면 insert, withdrawn 행이면 UPDATE applied — 유니크 23505는 발생 시 그대로 전파; 철회: applied 행 UPDATE withdrawn; 이미 목표 상태면 건너뜀) → 실제 전이마다 감사 insert → 반환.
- `supabase/tests/14-recruitment-application.test.sql`(pgTAP): 인수 조건 1~3. 마감 경과 픽스처는 유효 마감일로 insert 후 `application_deadline`을 과거로 UPDATE해 구성한다(날짜 트리거는 INSERT 전용 — P2-T01 정본 그대로). 픽스처·주체 시뮬·행 존재 증명 선행은 13번 관례.
- `src/shared/config/error-codes.config.ts`: `SCHEDULING_APPLICATION_BLOCKED`(409) 추가.
- `src/entities/schedule/`: `model/application-changes.ts`(Zod 입력 스키마·오류 매핑 확장 — recruitment-open.ts 관례), `api/list-own-applications.ts`(`server-only`, 월 범위 본인 신청 조회 — RLS가 본인 행만 반환), `model/recruitment-schedule.ts` DTO 재사용(신청 상태 결합 DTO 추가 허용).
- `src/features/application/`: `api/apply-recruitment-changes.ts`(Server Action — 세션 확인→Zod→rpc→매핑→`revalidatePath`→구조화 stderr 로그), `hooks/useApplicationBatch.ts`(savedApplied·pending·diff·제출 상태·마지막 batch 기억·Undo 소멸 3조건 — unit), `ui/`(하단 변경 개수·저장·되돌리기 바 — Action prop 주입).
- `src/views/schedule/`: 스텁 ScheduleView를 실데이터 props(스케줄+본인 신청+KST 오늘+month)로 전환, `toCellState` 등 화면 로직을 `model/`로 이동(unit — P0 스텁의 ui 내 로직을 해소), 마감·확정 탭 시 기존 `/schedule/[date]` 이동 유지. 스낵바 문구는 WORKER-FLOWS 그대로.
- `src/app/(protected)/(tabs)/schedule/page.tsx`: 클라이언트 스텁을 서버 컴포넌트로 전환 — `month` searchParam(기본 KST 이번 달)·월 범위 조회(`list-recruitment-schedules` 재사용 + 본인 신청)·Action 주입. mock import 제거(`schedule.mock.ts`는 catalog·preview가 계속 쓰면 잔존 허용).
- `tests/e2e/schedule.spec.ts`: 실데이터 흐름으로 재작성(인수 조건 6). 근무자 세션은 기존 support 관례 재사용, 모집 픽스처는 DB seed 또는 admin 함수 호출로 구성.

## Data model

- 신규 테이블·enum·SQLSTATE 없음. **함수 반환 계약(정본)**: `{"applied_count": integer, "withdrawn_count": integer, "blocked_dates": date 문자열 배열}` — `blocked_dates`가 비어 있지 않으면 두 count는 0이고 어떤 변경도 없었다는 뜻이다. 부분 성공은 표현 불가능하다.
- **감사 규격**: 실제 전이당 1행 — event `application_applied`|`application_withdrawn`, `actor_profile_id`=호출 근무자, `schedule_id`·`application_id` 채움, detail `{"batch_size": N}`(PII 없음). P2-T02 본보기의 적용이다.
- Action Result: `{ok:true; appliedCount:number; withdrawnCount:number} | {ok:false; code:ErrorCode; blockedDates?:string[]}` — `blockedDates`는 `SCHEDULING_APPLICATION_BLOCKED`에서만 채워진다.
- **Undo 상태(클라이언트 정본)**: 마지막 저장 성공의 {이전 savedApplied, 이후 savedApplied} 쌍. 소멸 3조건(새 로컬 변경 시작·다음 저장 성공·화면 이탈)은 이 RADIO가 소유한다.

## Interface

- 일정 탭(`/schedule`, active 근무자·관리자 공용): 월 달력(모집 없는 날 disabled·본인 신청 상태 표시), 하단 바(변경 N개·`신청하기`·저장 후 `방금 변경한 N개 날짜 되돌리기`), 저장 스낵바 `근무 가능일을 변경했어요`, 차단 시 차단 날짜 안내와 달력 갱신, 마감·확정 날짜 탭 시 상세 라우트 이동.
- Server Action: `applyRecruitmentChanges({applyScheduleIds, withdrawScheduleIds})` — 위 Result 계약. RPC: `apply_recruitment_changes`.
- 실행: `pnpm verify`, `pnpm db:reset && pnpm db:test`, `pnpm test:e2e`.

## Optimizations

조회는 기존 인덱스(부분 유니크 work_date 선두·applications 유니크)를 그대로 탄다. 신청 조회 성능 인덱스는 P2-T05 재검토 항목 그대로 이월(추측 최적화 없음).

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/**
src/app/(protected)/(tabs)/schedule/**
src/entities/schedule/**
src/features/application/**
src/views/schedule/**
src/shared/config/error-codes.config.ts
tests/e2e/**
docs/execution/radio/P2-T03-radio.md
docs/execution/runs/P2-T03/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- P2-T02 구현이 재봉인을 일으키면 달력 확장·반환값 관례 전제를 재점검한다(파이프라이닝 보정의 안전선). 결정 주체: 조정자(재봉인 발생 시).
- 마감·확정 날짜 상세 화면의 내용 확장은 P2-T05 기획이 소유한다.
- 신청 조회 성능 인덱스는 P2-T05 재검토 항목 그대로 이월한다.
