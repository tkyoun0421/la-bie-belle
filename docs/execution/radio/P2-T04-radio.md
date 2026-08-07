# P2-T04 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 기획 확정 3건(날짜 안전선·수동 복구 운영자 명령·마감 후 변경은 재오픈)과 설계 인터뷰 확정 1건(연장·재오픈 진입은 관리자 모집 달력 통합 — 2026-08-07)을 반영. 봉인된 P2-T01(전이 표)·T02(달력·관례)·T03(신청 함수) RADIO를 계약으로 삼아 선행 구현 완료 전에 설계했다(파이프라이닝). Cron 인프라는 ARCHITECTURE 예약 작업 절(Supabase Cron·매일 새벽 KST 멱등 호출 관례)을 따른다. |

- 관련 spec: PRD:AC-01, PRD:AC-02, DOMAIN:SCHEDULING, ADR:0003, ARCHITECTURE Cron과 Edge Function 절, DESIGN:ADMIN-FLOWS 모집 절
- 적용 깊이: 심화 (첫 Cron 경로·시스템 주체 감사·상태 전이 실행)
- test mode: tdd
- 예정 check IDs: recruitment-kst-boundary(마감 대상 선정의 KST 경계 pgTAP), recruitment-cron-idempotency(마감 반복 실행 멱등 pgTAP). 기획 시점 등록 그대로 유지, 의미만 정본화.

## Requirements

### 범위와 비목표

- 범위: ① 마이그레이션 1개 — 자동 마감 함수 `close_due_recruitment_schedules`(Cron·운영자 전용), 연장 함수 `extend_recruitment_deadline`, 재오픈 함수 `reopen_recruitment_schedule`, pg_cron 확장·스케줄 등록 ② pgTAP `supabase/tests/15-recruitment-closing.test.sql` ③ 오류 코드 1종(`SCHEDULING_STATUS_CONFLICT`) ④ 운영자 수동 복구 명령(package.json 스크립트) ⑤ `/admin/recruitment` 달력 확장 — 활성 모집 날짜 탭 시 관리 시트(연장·재오픈), features/recruitment Action 2종·hooks·시트 ui ⑥ E2E 관리 흐름 1본.
- 비목표(기획 승인 그대로): 요청 기반 취소·교대(P4), 마감·재오픈 알림(P4), 날짜별 신청자 조회(P2-T05), 확정 준비·확정 전이 실행(P3), 관리자 화면의 수동 복구 버튼(기획에서 배제). 설계 비목표: P2-T01 스키마·전이 표 무수정, P2-T03 신청 함수 무수정(마감 검증은 T03이 이미 소유), 기존 pgTAP 01~14 무수정.

### 불변 규칙

- **자동 마감의 대상 선정식이 정본이다**: `status = 'OPEN' and application_deadline < (now() at time zone 'Asia/Seoul')::date` — 마감일 당일은 23:59:59 KST까지 열려 있고, KST 날짜가 마감일을 지난 순간부터 닫는 대상이다. 시각 판정식은 P2-T01·T03과 같은 단일식이다.
- **자동 마감은 멱등이다**: 대상 선정이 상태 기반이라 재실행하면 대상이 비고, 상태·감사 행이 중복되지 않는다(phase 인수 조건). Cron과 수동 복구 명령은 같은 함수를 호출한다 — 복구 경로에 별도 로직이 없다.
- **자동 마감 함수는 앱 주체에 노출하지 않는다**: authenticated·anon의 execute 권한을 회수한다. 호출 주체는 pg_cron 스케줄과 운영자 명령뿐이다. 연장·재오픈 함수는 기존 관례대로 rpc 노출하되 함수 안에서 `is_admin`을 강제한다(42501).
- **날짜 안전선(기획 확정)**: 연장·재오픈의 새 마감일은 KST 오늘 이상(위반 LB021 재사용 — 과거 날짜 의미 일치)·근무일 이하(기존 CHECK 23514가 UPDATE에도 강제)만 허용하고, 근무일이 지난 스케줄은 연장·재오픈할 수 없다(LB021). 새 SQLSTATE는 만들지 않는다.
- **상태 정합**: 연장은 OPEN에서만, 재오픈은 CLOSED에서만 가능하다. 상태가 다르면 함수가 22023으로 거부하고 Action이 `SCHEDULING_STATUS_CONFLICT`로 매핑한다(달력이 낡았을 때의 안내). 전이 자체(CLOSED→OPEN)는 P2-T01 전이 트리거가 최종 강제한다.
- **감사 기록**: 본보기(사건 스케줄당 1행) 적용 — 자동 마감 `schedule_closed`(actor null — 시스템 실행, detail에 실행 경로), 연장 `deadline_extended`(이전·새 마감일을 detail에), 재오픈 `schedule_reopened`(새 마감일 detail). PII 없음.
- **재오픈 시 기존 applied 신청은 그대로 유지된다**(P2-T01 기획) — 함수는 신청 행을 건드리지 않는다.
- 마감 후 신청 변경 요청의 P2 해결책은 이 재오픈이다(기획 확정). 근무자 흐름은 변경하지 않는다.
- ui는 api를 import하지 않는다 — Action은 page가 주입한다. 시트·분기 로직은 model·hooks에 둔다.

### 기술 인수 조건

1. `close_due_recruitment_schedules()` — 마감일이 KST 어제 이전인 OPEN 스케줄 전부가 CLOSED로 바뀌고 스케줄당 감사 1행(`schedule_closed`)이 남으며, `{"closed_count":N}`을 반환한다. 마감일 당일(KST 오늘)인 스케줄은 대상이 아니다. 재실행 시 `closed_count` 0·상태·감사 무변화 — pgTAP(멱등·KST 경계).
2. 자동 마감 함수는 authenticated·anon 주체가 호출할 수 없고(권한 회수 단언), pg_cron 스케줄이 등록돼 있다(`cron.job` 존재 단언) — pgTAP.
3. `extend_recruitment_deadline` — admin이 OPEN 스케줄의 마감일을 안전선 안에서 변경하면 반영·감사 1행. 비관리자 42501, OPEN 아님 22023, 과거 새 마감일·지난 근무일 LB021, 마감>근무일 23514 — pgTAP.
4. `reopen_recruitment_schedule` — admin이 CLOSED 스케줄을 새 마감일과 함께 OPEN으로 되돌리면 반영·감사 1행·기존 applied 신청 무변화. 거부 축은 3과 동일(CLOSED 아님 22023) — pgTAP. 재오픈된 스케줄에 근무자 신청이 다시 허용된다(P2-T03 함수 기준 검증).
5. Server Action 2종(`extendRecruitmentDeadline`·`reopenRecruitmentSchedule`)이 Zod 검증(uuid·yyyy-MM-dd) 후 rpc를 호출하고 typed Result를 반환한다 — 매핑(42501→COMMON_FORBIDDEN, 22023→SCHEDULING_STATUS_CONFLICT, LB021·23514→SCHEDULING_VALIDATION, LB020→SCHEDULING_STATUS_CONFLICT, 그 외→COMMON_UNEXPECTED) — unit.
6. 관리 시트: 관리자 달력에서 활성 모집 날짜 탭 시 상태·근무일·마감일이 표시되고 OPEN이면 연장, CLOSED면 재오픈 폼이 열린다. 저장 성공 시 달력 갱신, 상태 충돌 시 새로고침 안내 — 분기·검증 로직은 model·hooks unit, 조립은 E2E.
7. 수동 복구 명령이 package.json에 있고 자동 마감 함수를 재실행한다. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과, 기존 pgTAP 01~14·기존 마이그레이션·P2-T02·T03 산출물 무수정(달력 셀 탭 분기 확장 제외 — 허용 경로 명시).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 자동 마감 | 테스트함 — 대상 전환·감사·반환값 단언 | 테스트함 — 대상 없음 실행의 0 반환 | 테스트함 — 마감일 당일 제외·어제 포함의 KST 경계 | 해당 없음 — 호출 주체 제한은 2행이 소유한다 | 테스트함 — 재실행 멱등(상태·감사 무변화) | 해당 없음 — 상태 기반 대상 선정이 재실행을 자연 직렬화하고 실경합 재현은 단일 커넥션 하네스 제약이다 |
| 2 마감 함수 노출 | 테스트함 — cron.job 등록 단언 | 테스트함 — authenticated·anon 호출 거부 | 해당 없음 — 노출 여부는 이진 속성이다 | 테스트함 — 주체 시뮬 | 해당 없음 — 거부는 상태를 만들지 않는다 | 해당 없음 — 권한 검사는 요청별 독립이다 |
| 3 연장 | 테스트함 — 반영·감사 단언 | 테스트함 — 상태·안전선 위반 거부 전수 | 테스트함 — 새 마감일 KST 오늘 당일 허용·근무일 당일 허용 | 테스트함 — 비관리자 42501 | 테스트함 — 같은 값 재연장 통과(멱등 아님이나 무해) | 해당 없음 — 단일 행 UPDATE는 DB가 직렬화한다 |
| 4 재오픈 | 테스트함 — 전환·감사·신청 유지 단언 | 테스트함 — CLOSED 아님 거부 | 테스트함 — 재오픈 후 신청 허용을 T03 함수로 확인 | 테스트함 — 비관리자 42501 | 테스트함 — 이미 OPEN인 대상 재요청이 22023으로 수렴 | 해당 없음 — 단일 행 UPDATE는 DB가 직렬화한다 |
| 5 Action | 테스트함 — 성공 Result 매핑 | 테스트함 — 코드 매핑 전수 | 테스트함 — 형식 위반 입력 거부 | 테스트함 — requireAdmin 거부 경로 | 테스트함 — 재제출 Result 수렴 | 해당 없음 — 직렬화는 DB 소유다 |
| 6 관리 시트 | 테스트함 — 상태별 폼 분기 unit | 테스트함 — 상태 충돌 안내 경로 | 테스트함 — 안전선 클라이언트 검증(과거·근무일 초과 차단) | 해당 없음 — 진입은 admin 라우트가 소유한다 | 해당 없음 — 제출 상태는 hooks가 단일화한다 | 해당 없음 — 클라이언트 상태는 단일 사용자다 |
| 7 회귀·복구 | 테스트함 — verify·db:test 전체 GREEN | 테스트함 — 기존 산출물 무수정을 커밋 범위로 확인 | 해당 없음 — 세부는 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 |

- 보충: E2E는 연장·재오픈 관리 흐름 1본(자동 마감의 시간 경계는 pgTAP 소유 — E2E로 시각을 흉내 내지 않는다). Cron의 실제 새벽 실행은 운영 환경 속성이라 테스트 대상이 아니고 등록 존재만 단언한다.

### DEV-* 적용 상태

- `DEV-TIME-01~05`: 기본 적용 — 대상 선정식·안전선 판정 전부 KST 단일식, Cron은 ARCHITECTURE의 매일 새벽 KST 관례(UTC 크론식으로 환산 등록). 새 결정 없음.
- `DEV-CACHE`: 기본 적용 — 관리 시트 저장 후 `revalidatePath`(T02와 동일). 새 캐시 없음.
- `DEV-SEC`: 추가 결정 — 자동 마감 함수는 앱 주체 execute 회수(시스템 전용), 연장·재오픈은 requireAdmin + is_admin 이중 강제.
- `DEV-ERR`: 추가 결정 — `SCHEDULING_STATUS_CONFLICT`(409) 신설. SQLSTATE 신설 없음(LB021 의미 재사용).
- `DEV-SSOT-01`: 전이 표·날짜 규칙 정본은 P2-T01. 이 task의 정본은 대상 선정식·안전선 적용 위치·감사 event 3종이며 이 RADIO가 소유한다.
- `DEV-TEST-01`: 위 렌즈 표. tdd.json 실제 실행 기록(DB·unit RED→GREEN).

## Architecture

- `supabase/migrations/<ts>_recruitment_closing.sql`:
  - `close_due_recruitment_schedules() returns jsonb` DEFINER: 대상 선정식으로 UPDATE … RETURNING → 스케줄당 감사 insert(`schedule_closed`, actor null, detail `{"trigger":"cron"}` 성격의 실행 경로 표시) → `{"closed_count":N}`. `revoke execute … from authenticated, anon`.
  - `extend_recruitment_deadline(target_schedule_id uuid, new_deadline date)` / `reopen_recruitment_schedule(target_schedule_id uuid, new_deadline date)` DEFINER: is_admin(42501) → 대상 행 `for update` 잠금·존재 확인(22023) → 상태 검증(연장 OPEN·재오픈 CLOSED, 위반 22023) → 안전선(`new_deadline < KST 오늘` 또는 `work_date < KST 오늘`이면 LB021; 마감>근무일은 CHECK 위임) → UPDATE(재오픈은 status·deadline 동시) → 감사 insert → void 또는 결과 jsonb.
  - `create extension if not exists pg_cron` + `cron.schedule('close-due-recruitments', '5 15 * * *', …)` — 15:05 UTC = 00:05 KST, ARCHITECTURE 매일 새벽 관례.
- `supabase/tests/15-recruitment-closing.test.sql`: 인수 조건 1~4. 마감 경과 픽스처는 14번과 같은 UPDATE 기법. 시스템 함수 권한 회수 단언은 `has_function_privilege`.
- `package.json`: 운영자 복구 명령 1개(예: `ops:close-recruitments`) — 로컬·운영 DB에 자동 마감 함수를 1회 실행하는 스크립트(형태는 harness 관례 안에서 구현 재량).
- `src/shared/config/error-codes.config.ts`: `SCHEDULING_STATUS_CONFLICT`(409) 추가.
- `src/entities/schedule/model/`: 관리 입력 Zod·오류 매핑 확장(기존 recruitment-open.ts 관례).
- `src/features/recruitment/`: `api/extend-recruitment-deadline.ts`·`api/reopen-recruitment-schedule.ts`(Server Action — requireAdmin→Zod→rpc→매핑→revalidatePath→stderr 로그), `hooks/useRecruitmentManage.ts`(시트 상태·제출 — unit), `ui/RecruitmentManageSheet.tsx`(shared bottom-sheet 조립, Action prop 주입).
- `src/views/admin-recruitment/`: 셀 탭 분기 확장 — 빈 날짜는 선택 토글(기존), 활성 모집 날짜는 disabled 대신 관리 대상 상태로 렌더하고 탭 시 관리 시트 오픈(분기는 model 소유). 필요 시 `src/shared/ui/calendar.tsx` 셀 상태 보강(하위 호환·기존 테스트 무수정 원칙은 T02와 동일).
- `src/app/(protected)/admin/recruitment/page.tsx`: 시트 Action 주입 추가.
- `tests/e2e/recruitment-manage.spec.ts`(신규): admin이 OPEN 날짜 연장 → 표시 갱신 확인 → (픽스처 CLOSED 날짜) 재오픈 → 근무자 신청 가능 상태 확인.

## Data model

- 신규 테이블·enum·SQLSTATE 없음. **자동 마감 반환 계약**: `{"closed_count": integer}`. **감사 event 3종(정본)**: `schedule_closed`(actor null=시스템)·`deadline_extended`(detail에 이전·새 마감일)·`schedule_reopened`(detail에 새 마감일). actor null은 시스템 실행의 표준 표기로 이 task가 확립한다.
- Action Result: `{ok:true} | {ok:false; code:ErrorCode}` — 목록형 부가 데이터 없음(단건 조작).

## Interface

- 관리자 모집 달력(`/admin/recruitment`): 활성 모집 날짜 탭 → 관리 시트(상태·근무일·마감일, OPEN=마감일 연장 폼, CLOSED=재오픈+새 마감일 폼, 저장·취소). 성공 스낵바와 달력 갱신, 상태 충돌 시 새로고침 안내.
- RPC: `extend_recruitment_deadline`·`reopen_recruitment_schedule`. 시스템: `close_due_recruitment_schedules`(pg_cron·운영자 명령 전용).
- 실행: `pnpm verify`, `pnpm db:reset && pnpm db:test`, `pnpm test:e2e`, 운영 복구는 package.json 명령.

## Optimizations

대상 선정은 부분 유니크 인덱스(work_date)와 무관하게 status 필터 스캔이다 — 스케줄 규모(월 수십 건)에서 인덱스 불요, 근거 없는 최적화를 더하지 않는다.

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/**
package.json
src/app/(protected)/admin/recruitment/**
src/entities/schedule/**
src/features/recruitment/**
src/views/admin-recruitment/**
src/shared/ui/calendar.tsx
src/shared/ui/__tests__/calendar.test.tsx
src/shared/config/error-codes.config.ts
tests/e2e/**
docs/execution/radio/P2-T04-radio.md
docs/execution/runs/P2-T04/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 선행 task(P2-T02·T03) 구현이 재봉인을 일으키면 달력·함수 관례 전제를 재점검한다(파이프라이닝 안전선). 결정 주체: 조정자(재봉인 발생 시).
- 관리자 달력의 활성 모집 셀 라벨(현재 근무자용 "신청 가능" 재사용 — P2-T02 구현 관찰)은 이 task의 셀 상태 보강에서 함께 정리할 수 있다. 시각 표현은 DESIGN COMPONENTS 안 구현 재량.
- 마감·재오픈 알림은 P4-T03 소유다.
