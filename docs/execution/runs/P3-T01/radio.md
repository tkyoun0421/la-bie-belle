# P3-T01 RADIO 적용 결과

- RADIO: `docs/execution/radio/P3-T01-radio.md` revision 2, SHA-256 `5d85abeb2cbbc56332389142e01df135b1321eb3dca3cb1531f631525b8d76b3`
- 적용 세션: 2026-08-08, blocked 지점(revision 2 재봉인 직후)에서 재개해 개발 단계를 마무리

## 승인된 범위 그대로 구현한 부분

- 마이그레이션 1개(`supabase/migrations/20260808020000_ceremony_schema.sql`)로 `ceremonies` 신설, 기존 `check_in_rules`에 admin 전용 정책 추가, `schedules`에 `planned_checkin`·`planned_checkout` 컬럼 추가, `replace_schedule_ceremonies`·`set_schedule_planned_times` DEFINER 함수와 감사 로그.
- 추천 순수 모델(`src/entities/schedule/model/ceremony-times.ts`): 1시간 간격 생성·시각순 정렬·중복 검사·버림 추천·+2h 퇴근(자정 23:59 캡).
- 관리자 스케줄 준비 화면(`/admin/schedule/[id]`), 규칙표 CRUD, T04 관리 시트 진입 링크, pgTAP·unit·E2E.
- `check_in_rules`는 RPC가 아니라 직접 테이블 CRUD로 구현했다 — 이는 이탈이 아니라 기술 인수 조건 3 원문("admin 전용 RLS 정책 추가로 직접 CRUD한다")을 그대로 따른 것이다.

## 구현 중 확정한 세부(설계 재해석이 아니라 RADIO 문구 안에서의 선택)

1. **`schedules`에 새 select 정책을 추가하지 않았다.** RADIO의 Architecture 절 문장은 "admin 전용 RLS(select 포함)"라고 서술하지만, 같은 RADIO의 비목표 절은 "schedules 컬럼 추가와 `check_in_rules` RLS 정책 추가만(컬럼·제약·seed 무수정)"이라고 더 구체적으로 못 박는다. 기존 `schedules_select_active_worker` 정책이 이미 `is_admin(auth.uid())` OR-절을 포함해 admin의 select 접근이 실제로 막혀 있지 않았으므로, 더 구체적인 비목표 문구를 따라 컬럼 추가만 하고 새 정책은 만들지 않았다.
2. **상태 충돌(CONFIRMED·CANCELLED 거부)에 기존 `LB020` SQLSTATE를 재사용했다.** RADIO 기술 인수 조건 1·2는 이 실패를 `22023`(검증 실패)과 구분되는 별도 코드로 요구하고, `SCHEDULING_STATUS_CONFLICT` 매핑을 Interface 절이 지정한다. 신규 코드를 만들지 않고 기존 관례(SQLSTATE 재사용)를 따라 `LB020`을 그대로 재사용했다.
3. **`ceremonies` 테이블에 `created_at`·`updated_at`을 추가하지 않았다.** RADIO Architecture 절이 나열한 컬럼(`id, schedule_id, starts_at`, unique)에 없고, 교체 함수가 매번 delete+insert로 전체를 갱신하므로 행 단위 시각 이력이 의미가 없다고 판단했다.
4. **RPC 반환 JSON 키를 snake_case(`ceremony_times`)로 통일했다.** 프로젝트의 기존 DEFINER 함수(`apply_recruitment_changes` 등)가 모두 snake_case로 반환하고 TS 계층에서 camelCase로 변환하는 관례를 따랐다.
5. **`get-schedule-prep.ts`는 내부에서 `requireAdmin()`을 다시 호출하지 않는다.** `/admin` 레이아웃의 서버 게이트 + RLS 이중 방어로 이미 충분하고, `find-worker-detail.ts`·`list-applicants-by-schedule.ts` 등 기존 admin 전용 조회 API가 같은 관례를 쓴다.
6. **`SchedulePrep`·`SchedulePrepCheckInRule` 타입을 `entities/schedule/api/get-schedule-prep.ts`가 아니라 `entities/schedule/types/schedule-prep.ts`로 뺐다.** RADIO Architecture 절은 이 타입을 어디 둘지 명시하지 않았는데, `ui` 세그먼트는 `config/fsd.json`의 `forbidImports`로 `**/api/**` import가 막혀 있어(서버 전용 코드가 클라이언트 번들에 섞이는 것을 방지) 화면 컴포넌트가 이 타입을 직접 쓰려면 `api/` 밖에 둬야 했다. `entities/identity/types/worker.ts`(`WorkerDetail` 등)가 같은 패턴의 기존 선례다.
7. **재추천 확인창과 별개로 "예정 시각 직접 저장" 경로(`savePlannedTimesManually`/`PlannedTimesEditor`)를 뒀다.** RADIO Interface 절의 "추천 출퇴근 표시·수정·저장"이 재추천 확인창과 별도의 문장으로 서술돼 있어, 관리자가 추천을 기다리지 않고도 예정 출퇴근을 직접 입력·저장할 수 있는 경로로 해석해 구현했다. 두 경로 모두 `set_schedule_planned_times` 함수 하나로 수렴한다.
8. **에러 표시는 훅 내부 `showSnackbar` 호출로 통일했다.** 초안에서는 `errorCode` 상태를 그대로 노출했으나, 프로젝트 전역의 기존 훅(`useOpenRecruitment`·`useWorkerInfoForm` 등)이 모두 `showSnackbar(ERROR_CODES[code].message)` 패턴을 쓰는 것과 일치시켰다.

## 위험 기반 테스트 매트릭스 반영

- 표의 "테스트함" 선언은 전부 pgTAP(`supabase/tests/17-ceremony-schema.test.sql`)·unit(`ceremony-times`·`ceremony-manage`·`get-schedule-prep`·`replace-ceremonies`·`set-planned-times`·`manage-checkin-rules`·`useCeremonyEditor`·`useCheckInRuleActions`·`schedule-prep-screen` 테스트)·E2E(`tests/e2e/ceremony-edit.spec.ts`)로 실증했다. 자세한 명령·시각·exit code는 `docs/execution/runs/P3-T01/tdd.json`을 참조한다.
- "동시성" 행은 RADIO 비고와 동일하게 `for update` 잠금이 함수 정의에 존재한다는 구조적 확인(`pg_get_functiondef ~* 'for update'`)으로 대체했다 — pgTAP은 단일 커넥션 안에서 실제 동시 세션을 재현하지 못한다는 P2-T03 선례를 그대로 따른다.

## 미결 사항 처리

- RADIO의 유일한 미결 사항("P2-T04·T05 재봉인 시 시트 진입 링크 전제를 재점검한다")은 이번 세션 착수 시점에 두 task가 모두 이미 done 상태이자 재봉인 없이 완료돼 있어 재점검 대상이 아니었다. `RecruitmentManageSheet.tsx`의 실제 구조를 확인해 그 위에 링크 1개를 하위 호환으로 추가했다.
