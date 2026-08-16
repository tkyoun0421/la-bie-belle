# P4-T03 RADIO 적용 결과

- 기준 RADIO: `docs/execution/radio/P4-T03-radio.md` **revision 1**, SHA-256
  `26cbf12e316941d1224f8fea4927c55dd2f004d0d1dd784ba522c0e505d744b2`(index.jsonl
  `development_approval`과 대조 완료, 일치). 재봉인 없음 — 개발 중 정지 조건 반환도 없었다.
- 기준 커밋: `063bdde`("docs(P4-T03): seal RADIO revision 1 and queue the task as planned",
  조정자). 구현 커밋: 이 문서를 포함하는 본 커밋 — 최종 보고에서 SHA를 확인할 수 있다.

## 적용 결과 요약

RADIO의 Requirements·Architecture·Data model·Interface 절 그대로 구현했다.

- `supabase/migrations/20260821000000_recruitment_change_notifications.sql`: helper
  `notify_schedule_recipients(...)`(confirm_schedule의 CTE 패턴 함수화, `revoke execute`로
  `public·anon·authenticated·service_role` 전부 차단) + `open_recruitment_schedules`(모집
  오픈 알림, aggregate=최소 work_date 스케줄 id·revision 1·수신자 `is_active_worker` 전원) +
  `replace_schedule_ceremonies`·`set_schedule_planned_times`·`replace_position_assignments`
  (변경 알림, revision=`bump_confirmed_revision` 반환값·수신자는 시간·예식은 현재
  배정자∪교육생, 배정은 전후 합집합) 재정의. requirement RPC 2종·`cancel_confirmed_schedule`·
  `confirm_schedule`은 무수정.
- 딥링크 `{screen:"schedule", month}`: `NotificationTarget` 타입 확장, 신설
  `notification-path.ts`(순수 함수, 단위 RED 먼저), `list-notifications.ts` 파서 확장,
  `NotificationsPageClient.tsx` 인라인 삼항 → model 함수 대체, `push-service-worker.js`
  schedule 분기 추가.
- pgTAP `supabase/tests/26-recruitment-change-notifications.test.sql`(plan 45) — AC1~5 전부
  값 단언으로 커버.
- e2e `tests/e2e/recruitment-notifications.spec.ts`(신설, 2 test) + `work-date-band.ts`
  `recruitmentNotifications` 밴드(594~625) 1행 추가.

## 구현 중 확정한 세부(설계 재해석이 아닌 구체화)

1. **helper 파라미터 `p_` 접두**: RADIO의 helper 시그니처
   `notify_schedule_recipients(event_type, aggregate uuid, target_revision int, recipient_ids
   uuid[], title, body, target jsonb)`를 그대로 파라미터명으로 쓰면 `INSERT INTO notifications
   (...) SELECT ...`에서 컬럼명과 충돌해 42702(모호한 컬럼 참조)가 난다. `event_type`·`title`·
   `body`·`target`을 각각 `p_event_type`·`p_title`·`p_body`·`p_target`으로 바꿨다(나머지
   3개도 통일). 시그니처의 순서·타입·개수·반환은 그대로다 — 이름만 바뀐 구체화.
2. **`perform bump_confirmed_revision` → `select ... into new_confirmed_revision`**: RADIO
   불변 규칙이 "revision은 bump_confirmed_revision 반환값"이라 못박았으므로, 기존
   `perform`(반환값 버림) 호출을 값을 잡아두는 `select into`로 바꿨다. 3개 RPC(ceremonies·
   planned_times의 두 호출 지점·assignments)에서 모두 적용했다. 부수효과·트랜잭션 순서는
   그대로이고 반환값을 버리지 않고 담아두는 차이뿐이라 정지 조건 1번("기존 본문 수정
   요구")에 해당하지 않는다고 판단했다 — 알림 블록이 그 값을 쓰기 위한 선행 선언이다.
3. **`replace_position_assignments`의 변경 전 교육생 상태 포집 위치**: 수신자 합집합
   계산에는 "변경 전" 배정자·교육생이 필요하다. 기존 본문은 diff 계산 직전에
   `previous_ids`(변경 전 배정자)를 이미 조회하고 있어 그 위치에 `notify_previous_trainee_ids`
   조회를 나란히 추가했고, `notify_final_trainee_ids`는 기존 `trainee_touched` 분기 직후에
   `case when trainee_touched then trainee_ids else notify_previous_trainee_ids end`로
   확정했다. 두 추가 모두 읽기 전용 쿼리이고 기존 블로킹·검증·감사·반환 로직의 순서나 결과를
   바꾸지 않는다 — RADIO가 허용한 "그에 필요한 선언 추가"의 범위로 판단했다(정지 조건 1번
   미해당).
4. **pgTAP AC1 "admin 전용 계정" 픽스처**: RADIO 본문은 이 계정의 정확한 상태를 명시하지
   않는다. 코드 대조(`grant_admin_role`은 `status='active'`를 요구, `is_active_worker`는
   status만 보고 역할은 안 봄) + `DOMAIN.md`("관리자도 근무자를 겸할 수 있다")로,
   "admin 전용"이 성립하려면 admin 역할은 있지만 `status`가 `active`가 아닌 픽스처가 필요하다고
   판단해 `status='pending'` + admin 역할 raw insert로 구성했다. 이 계정은 정확히 의도대로
   `recruitment_opened` 미수신을 pgTAP이 단언한다.
5. **e2e 안정화 `test.describe.configure({ mode: "serial" })`**: 신규 파일 2 test를 병렬
   기본값으로 돌리면 로컬 Supabase GoTrue의 `admin.auth.admin.deleteUser()` 동시 호출이
   `AuthRetryableFetchError: Database error deleting user`로 실패했다. 기존 미변경 spec
   파일(`notifications.spec.ts`·`post-confirmation-changes.spec.ts`)을 나란히 병렬 실행해도
   같은 오류가 재현돼, 로컬 환경의 사전 존재 특성이지 이 task의 결함이 아님을 확인했다.
   `tests/e2e/recruitment-flow.spec.ts`의 선례를 따라 내 파일 안에서만
   `test.describe.configure({ mode: "serial" })`를 추가해 흡수했다 — `worker-session.ts`
   등 공유 파일은 손대지 않았다.

## 정지 조건 점검

- **"알림 블록 추가가 4종 RPC의 기존 본문(차단·검증·감사·반환) 수정을 요구하는 경우"**:
  발동하지 않음. 4개 RPC 모두 알림 insert 블록 + 그에 필요한 선언(위 2·3항)만 추가했고,
  기존 차단·검증·감사·반환 로직은 문자 단위로 그대로다 — `open_recruitment_schedules`·
  `replace_schedule_ceremonies`·`set_schedule_planned_times`는 알림 블록 이전 부분을 직전
  마이그레이션(20260807050000·20260817000000)과 `diff`로 대조해 동일함을 확인했다.
  `replace_position_assignments`는 최종본(20260818000000) 기준으로 동일 대조했다.
- **"`NotificationTarget` 확장이 `src/shared/ui/**` 변경을 요구하는 경우"**: 발동하지
  않음 — 경로 계산은 전부 `entities/notification/model`·`views/notifications/ui`·
  `public/push-service-worker.js`에서 끝났고 `src/shared/ui/notification-row.tsx` 등은
  건드리지 않았다(이번 세션의 `git status`에 그 파일이 modified로 보이는 건 병렬 세션
  변경이며 스테이징 대상에서 제외했다 — 아래 "확정 사실" 참고).
- **"모집 오픈 수신자 계산에 새 인덱스·테이블이 필요하다고 판단되는 경우"**: 발동하지
  않음 — `profiles.status`만 보는 `is_active_worker` 술어 스캔 하나로 충분했고, 새 인덱스나
  테이블을 추가하지 않았다.

## 위험 기반 테스트 매트릭스 반영(실증 근거)

- 1 모집 오픈: pgTAP AC1 — 활성 근무자 8명 각 1건(모두 `status='active'`인 8개 픽스처가
  `is_active_worker` 통과), pending·dormant·departed·rejected·admin 전용(위 4번) 5종
  미수신, 최소 work_date 스케줄 aggregate, 재기록 시도 무증가(notifications·outbox 둘 다).
- 2·3 변경 알림: pgTAP AC2(배정 — 빠짐·추가·유지·교육생 전후 합집합)·AC3a(예식)·AC3b(시간,
  no-op 재저장 포함) — 수신자 집합·title·body·target 값 단언, 무관 근무자 미수신.
- 4 제외 경로: pgTAP AC4 — requirement RPC 2종·`cancel_confirmed_schedule` 저장 후
  notifications 0건.
- 5 멱등·트랜잭션: pgTAP AC5 — helper 직접 호출 3롤(`anon`·`authenticated`·`service_role`)
  거부(`has_function_privilege` false), 같은 키 재삽입 흡수, 롤백 시나리오는 LB030(빈
  테이블에서 트리거 유도) 사용.
- 6 딥링크: `notification-path.test.ts` 5문항(schedule-detail·pay·schedule+유효
  month·schedule+불량 month 2종·미지 screen) — RED(모듈 부재)→GREEN. `list-notifications.ts`
  파서 신규 2문항 — RED(schedule screen 파싱 실패)→GREEN. `push-service-worker.test.ts`
  신규 2문항(schedule+유효 month·schedule+불량 month) — RED(git stash로 원본 되돌려 재현)
  →GREEN(stash pop).
- 7 e2e: `recruitment-notifications.spec.ts` 2 test — 확정 알림 클릭 →
  `/schedule/<date>`, 모집 오픈 알림 클릭 → `/schedule?month=<month>`. 밴드 594~625,
  `splitBand`로 2분할.

## 정합 갱신(허용 경로 안의 기존 mock 전제 단언 갱신)

- 없음 — RADIO가 "낮은 영향"으로 미리 확인해 둔 `src/views/notifications/ui/__tests__/**`도
  실제로는 이번 변경으로 기존 단언이 깨지지 않았다(model 함수로의 대체가 반환값을 그대로
  보존). `NotificationsPageClient.tsx` 자체에는 전용 단위 테스트 파일이 없다(RADIO가 명시한
  대체 대상 1곳은 `notification-path.ts`의 단위 테스트로 이미 커버).

## 확정 사실(스테이징 경계)

- 이번 세션 시작 시점부터 작업 트리에 병렬 세션(들)의 대규모 미커밋 변경(디자인 리스타일
  ~25개 뷰 파일, `.claude/agents/**`, `harness/gates/retro.ts`·`docs.ts` 등 신규 게이트,
  `docs/execution/radio/P0-T46-radio.md`·`P0-T47-radio.md`, `docs/execution/retrospective/**`,
  `src/shared/ui/calendar.tsx`·`notification-row.tsx`·`segmented-control.tsx`,
  `src/views/schedule/model/deadline-batches.ts` 등)가 함께 있었다. RADIO의 변경 허용 경로
  목록에 없는 파일은 전부 스테이징에서 제외했다 — 상세 목록은
  `docs/execution/runs/P4-T03/handoff.md`.
