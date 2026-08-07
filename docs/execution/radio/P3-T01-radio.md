# P3-T01 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-08
- 개발 설계 승인: user, 2026-08-08

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-08 | 최초 작성. 기획 확정 5건(버림 규칙 추천·규칙표 CRUD 포함·시각순 재정렬·OPEN 중 허용·경계 1~12/당일/분 단위)을 반영. 봉인된 P2-T04(관리 시트)·P2-T05(시트 확장) RADIO를 계약으로 삼아 선행 구현 완료 전에 설계했다(파이프라이닝). 선행 재봉인 시 시트 진입점 전제를 재점검한다. |

- 관련 spec: PRD 6장(예식과 근무 시간), DOMAIN:SCHEDULING, ADR:0003(2026-08-08 개정 반영), DESIGN:ADMIN-FLOWS 예식과 시간 절
- 적용 깊이: 심화 (급여로 이어지는 예정 시각·시간 경계·새 스키마)
- test mode: tdd
- 예정 check IDs: ceremony-time-domain(생성·재정렬·추천 규칙의 pgTAP·unit), ceremony-edit-e2e(예식 생성→수정→재추천 확인 E2E). 기획 시점 등록 그대로 유지, 의미만 정본화.

## Requirements

### 범위와 비목표

- 범위: ① 마이그레이션 1개 — `ceremonies`·`checkin_rules` 테이블, `schedules`에 예정 출퇴근 컬럼, admin 전용 RLS, 교체·저장 DEFINER 함수와 감사 ② 추천 규칙 순수 모델(버림 간격·마지막 예식 +2시간) ③ 관리자 스케줄 준비 화면(`/admin/schedule/[id]`) — 예식 개수+첫 시각 생성, 목록 미리보기, 개별 수정, 추천 표시·덮어쓰기, 재추천 확인창 ④ 규칙표 최소 CRUD 화면 ⑤ T04 관리 시트에 준비 화면 진입 링크 추가 ⑥ pgTAP·unit·E2E.
- 비목표(기획 그대로): 포지션·필요 인원·배정(P3-T02~T05), 확정·경고·revision(P3-T06), 근무자 노출(P3-T07 — ceremonies의 근무자 select 정책도 T07이 연다), 시간대별 포지션 데이터. 설계 비목표: 기존 테이블 구조 변경 없음(schedules 컬럼 추가만), P2 산출물 봉인 계약 무수정(시트는 링크 1개 추가의 하위 호환 확장).

### 불변 규칙

- **예식·예정 출퇴근 시각은 근무일의 로컬 시각이다**: PostgreSQL `time` 타입으로 저장하고 tz 변환을 하지 않는다(`DEV-TIME-01`·`03` — 업무 날짜 `date`는 schedules 소유). 초 단위는 저장하지 않는다(분 단위 기획 경계).
- **교체 의미론**: 예식 저장은 스케줄의 예식 전체를 목표 목록으로 교체하는 원자 함수 1회다. 저장 시 시각순 정렬·같은 시각 중복 거부(23505 아님 — 함수 검증 22023)·개수 1~12 검증을 함수가 수행한다. 같은 목록 재저장은 무변경 통과(멱등)한다.
- **확정 전 상한**: `CONFIRMED`·`CANCELLED` 스케줄의 예식·예정 시각 변경은 함수가 거부한다(`SCHEDULING_STATUS_CONFLICT` 409 매핑). OPEN·CLOSED·PREPARING은 허용한다(ADR-0003 개정).
- **추천은 파생, 저장은 명시**: 출퇴근 추천값은 서버에 저장하지 않는 계산 결과이고, 관리자가 저장할 때만 `schedules`의 예정 출퇴근 컬럼에 쓰인다. 첫·마지막 예식이 바뀌면 재추천 값을 확인창으로 보여주고 확인 시에만 덮어쓴다.
- **버림 추천 규칙은 순수 모델 한 곳이 소유한다**: 규칙표 행 목록과 첫 예식 시각을 입력받아 출근 추천을 반환한다. 규칙표가 비어 있으면 추천 없음(수동 입력)이다.
- 권한: 예식·예정 시각·규칙표의 조회·변경은 admin 전용이다(RLS + 함수 `is_admin` 이중). ui는 api를 import하지 않고 page가 Action을 주입한다(관례).
- 감사: 예식 교체·예정 시각 저장은 `scheduling_audit_logs`에 스케줄당 1행(`ceremonies_replaced`·`planned_times_set`, PII 없는 detail)을 남긴다. 규칙표 CRUD는 전역 설정으로 감사 대상이 아니다.

### 기술 인수 조건

1. `replace_schedule_ceremonies(target_schedule_id uuid, ceremony_times time[]) returns jsonb` — is_admin(42501) → 대상 `for update` 잠금·존재(22023) → 상태 검증(CONFIRMED·CANCELLED 거부) → 개수 1~12·중복 거부(22023) → 시각순 정렬 저장(전체 교체) → 실제 변경 시 감사 1행 → 결과 반환. 같은 목록 재저장은 무변경·감사 0행 — pgTAP.
2. `set_schedule_planned_times(target_schedule_id uuid, checkin time, checkout time)` — 같은 검증 관례로 예정 출퇴근을 저장하고 감사 1행을 남긴다. checkin < checkout 검증(22023) — pgTAP.
3. `checkin_rules`는 admin 전용 RLS로 직접 CRUD한다. `first_ceremony_time` 유니크, 초기 규칙 2행(10:00→08:20, 11:00→09:10) seed — pgTAP.
4. 추천 모델: 1시간 간격 생성(개수+첫 시각), 버림 간격 출근 추천(이하 최근접 규칙, 없으면 최이른 규칙 간격, 규칙표 공백 시 null), 마지막 예식 +2시간 퇴근(자정 넘김은 23:59로 캡하고 화면에 안내) — unit(D 경계·정렬·중복·1~12).
5. 준비 화면: 개수+첫 시각 입력 → 목록·추천 미리보기 → 개별 수정(분 단위) → 저장. 첫·마지막 예식 변경 시 재추천 확인창, 확인 시에만 예정 시각 갱신. 규칙표 CRUD 화면과 T04 시트의 진입 링크 — model·hooks unit, 조립 E2E.
6. E2E(ceremony-edit-e2e): admin이 준비 화면 진입 → 3개 예식 생성(11:00 시작) → 2번째를 12:10으로 수정 → 시각순 표시 확인 → 첫 예식 10:00으로 변경 → 재추천 확인창 승인 → 예정 출근 08:20 반영 확인.
7. `pnpm verify`·`pnpm db:reset && pnpm db:test` 전체 통과. 기존 pgTAP·마이그레이션 무수정.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 예식 교체 | 테스트함 — 생성·수정·재정렬 저장 | 테스트함 — 확정 후 거부·미존재 22023 | 테스트함 — 0개·13개 거부, 1·12개 허용, 동시각 중복 거부 | 테스트함 — 비관리자 42501 | 테스트함 — 같은 목록 재저장 무변경·감사 0행 | 테스트함 — for update 잠금으로 직렬화 |
| 2 예정 시각 | 테스트함 — 저장·감사 1행 | 테스트함 — checkin≥checkout 거부 | 테스트함 — 자정 경계 23:59 캡 | 테스트함 — 비관리자 42501 | 테스트함 — 같은 값 재저장 무변경 | 해당 없음 — 단일 행 갱신이다 |
| 3 규칙표 | 테스트함 — CRUD와 seed 2행 | 테스트함 — 중복 first_ceremony_time 거부 | 테스트함 — 빈 규칙표 추천 null | 테스트함 — 비관리자 RLS 거부 | 해당 없음 — 유니크가 소유 | 해당 없음 — 저빈도 설정 편집이다 |
| 4 추천 모델 | 테스트함 — 예시 규칙 전 케이스(10:00·10:30·11:00·12:00·09:00) | 테스트함 — 규칙표 공백 null | 테스트함 — 간격 경계 정각·+2h 자정 캡 | 해당 없음 — 순수 함수다 | 해당 없음 — 순수 함수다 | 해당 없음 — 순수 함수다 |
| 5 화면 | 테스트함 — 생성→수정→저장 상태 전이 unit | 테스트함 — 저장 실패 시 로컬 보존 | 테스트함 — 재추천 확인창 3경로(승인·거부·무변경) | 해당 없음 — 라우팅 인증이 소유 | 해당 없음 — 제출 상태 hooks 단일화 | 해당 없음 — 단일 사용자 편집이다 |
| 6 E2E | 테스트함 — 인수 조건 6 전 구간 | 테스트함 — 확정 스케줄 진입 시 편집 불가 표시 | 테스트함 — 12:10 분 단위 수정 | 테스트함 — admin 세션 픽스처 | 해당 없음 — 세부는 1·5행 소유 | 해당 없음 — 단일 세션이다 |
| 7 회귀 | 테스트함 — verify·db:test GREEN | 테스트함 — 기존 산출물 무수정 확인 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 |

- 보충 위험: P2-T04·T05 구현 전이라 시트 실물이 없다. 재봉인 시 진입 링크 전제를 재점검한다. 퇴근 +2시간의 자정 넘김 캡은 심야 예식 현실성이 낮아 캡+안내로 두며, 실제 필요가 생기면 새 기획으로 연다.

### DEV-* 적용 상태

- `DEV-TIME-01`·`03`: `time`(로컬 시각)과 `date`(업무 날짜) 타입 분리, KST 경계는 date가 소유(기본 적용).
- `DEV-TIME-05`: 추천·생성 로직은 입력 주입 순수 함수와 경계값 테스트(기본 적용).
- `DEV-SSOT-01`: 추천 규칙·검증 경계는 순수 모델과 DB 함수 한 곳씩 소유, 값 중복 없음(기본 적용).
- `DEV-SEC`: admin 전용 RLS·함수 이중 검증, 근무자 노출은 P3-T07 소유(기본 적용).
- `DEV-TEST-01`: tdd — RED→GREEN 증거를 runs에 남긴다(기본 적용).
- `DEV-CODE-07`: 설명 주석 금지(기본 적용).

## Architecture

- `supabase/migrations/<ts>_ceremony_schema.sql`: `ceremonies`(id, schedule_id FK, starts_at time, unique(schedule_id, starts_at)), `checkin_rules`(first_ceremony_time time unique, checkin_time time) + seed 2행, `schedules`에 `planned_checkin time`·`planned_checkout time` 추가, admin 전용 RLS(select 포함), `replace_schedule_ceremonies`·`set_schedule_planned_times` DEFINER 함수(`set search_path` 고정·감사 insert), 함수 실행 권한 관례.
- `supabase/tests/16-ceremony-schema.test.sql`(pgTAP): 인수 조건 1~3. 픽스처·주체 시뮬은 13~15번 관례.
- `src/shared/config/error-codes.config.ts`: 기존 `SCHEDULING_STATUS_CONFLICT` 재사용, 신규 코드 없음.
- `src/entities/schedule/model/ceremony-times.ts`: 1시간 간격 생성·시각순 정렬·중복 검사·버림 추천·+2h 퇴근(자정 캡) 순수 함수 — unit.
- `src/entities/schedule/api/get-schedule-prep.ts`(`server-only`, admin — 스케줄+예식+예정 시각+규칙표 일괄 조회).
- `src/features/ceremony/`: `api/replace-ceremonies.ts`·`api/set-planned-times.ts`(Server Action — requireAdmin→Zod→rpc→매핑→revalidatePath→stderr 로그), `api/manage-checkin-rules.ts`(규칙표 CRUD Action), `hooks/useCeremonyEditor.ts`(목록 편집·재추천 확인 상태 — unit), `ui/`(예식 목록 편집기·재추천 확인창·규칙표 편집 — Action prop 주입).
- `src/views/admin-schedule/`: 준비 화면 조합(`model/`에 화면 분기 로직). `src/app/(protected)/admin/schedule/[id]/page.tsx` 신설(서버 조회·Action 주입).
- `src/features/recruitment/ui/RecruitmentManageSheet`: 준비 화면 진입 링크 1개 추가(하위 호환).
- `tests/e2e/ceremony-edit.spec.ts`(신규): 인수 조건 6.

## Data model

- 정본: `schedules`(상태·업무 날짜·예정 출퇴근), `ceremonies`(스케줄별 시각 목록), `checkin_rules`(전역 규칙표). 예식 순서는 저장하지 않는다 — 시각순이 순서다.
- `ceremonies`는 append-only가 아니다 — 교체 함수가 delete+insert(또는 동등)로 전체를 갱신하고 감사가 이력을 남긴다. 확정 시점 스냅샷은 P3-T06 소유(ADR-0003).
- RLS: 세 대상 모두 admin 전용(select·mutation). 근무자 select는 P3-T07이 연다.
- 트랜잭션: 함수 1회 = 1트랜잭션, `for update` 잠금으로 상태 검증과 적용 사이 전이를 막는다(관례).

## Interface

- 준비 화면(`/admin/schedule/[id]`): 예식 없음 → 개수+첫 시각 생성 폼. 있음 → 시각순 목록·개별 수정·추가·삭제, 추천 출퇴근 표시·수정·저장, 첫·마지막 변경 시 재추천 확인창. 확정 스케줄은 읽기 전용 표시.
- 규칙표 화면(준비 화면 내 시트 또는 하위 절): 행 목록·추가·수정·삭제.
- 진입: T04 관리 시트의 「예식·시간 관리」 링크 → 준비 화면.
- Server Action Result 관례: 성공 `{ok:true,...}` / `{ok:false, code}` — 42501→`IDENTITY_NOT_ACTIVE`, 상태 충돌→`SCHEDULING_STATUS_CONFLICT`, 22023→`SCHEDULING_VALIDATION`, 그 외→`COMMON_UNEXPECTED`.
- 실행: `pnpm verify`, `pnpm db:reset && pnpm db:test`, `pnpm test:e2e`.

## Optimizations

- 조회는 준비 화면 진입 시 1회 일괄. 클라이언트 캐시 없음, 저장 후 `revalidatePath`(관례).
- 새 dependency 없음. 되돌림은 마이그레이션 롤백 스크립트 없이 화면·함수 제거로 가능(테이블은 잔존 허용, 정본 규칙에 따라 삭제하지 않음).
- 추천 계산은 규칙표 행 수(한 자릿수)에 선형 — 성능 고려 불필요.

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/**
src/app/(protected)/admin/schedule/**
src/entities/schedule/**
src/features/ceremony/**
src/features/recruitment/**
src/views/admin-schedule/**
src/shared/config/**
tests/e2e/**
docs/execution/radio/P3-T01-radio.md
docs/execution/runs/P3-T01/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- P2-T04·T05 재봉인 시 시트 진입 링크 전제를 재점검한다. 결정 주체: 조정자(재봉인 발생 시).
