# P3-T09 handoff

## 2026-08-15 · 개발 종료

- 작업 식별자: P3-T09
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-15T14:54:43Z(마지막 전체 `pnpm verify` GREEN 실행 로그 타임스탬프 기준)

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P3-T09-radio.md` revision 3, SHA-256
  `d137651f7d9e851a0960fefbfa833a32191e677fc0bac2b514c5cb27916632b3`(`index.jsonl`
  `development_approval`과 대조 완료, 일치). 재봉인 커밋 `5cce577`.
- `docs/execution/phases/index.jsonl`의 P3-T09 상태는 `planned` → `in_progress`. **`done`으로는
  올리지 않았다** — 조정자 몫.
- 개발 단계 중 정지 조건이 2회 발동했고 둘 다 조정자의 RADIO 재봉인(사용자 승인)으로 해소됐다 —
  상세 경위는 `docs/execution/runs/P3-T09/radio.md` "정지 조건 이력" 절에 있다.
  - revision 1 → 2(커밋 `1a21c9e`): 확정 후 읽기 전용을 단언하던 기존 e2e 3파일
    (`ceremony-edit`·`schedule-confirmation`·`assignment-eligibility`)이 허용 경로 밖이었다 —
    세 파일을 추가하고 갱신 용도를 읽기 전용 단언의 새 동작 정합으로 한정.
  - revision 2 → 3(커밋 `5cce577`): `pnpm verify` 전체 실행 중 AC8(교육 칩 숨김)이 허용 경로 밖
    `tests/e2e/assignment-trainee.spec.ts`의 direction2 시나리오와 충돌하는 것을 발견 — 그
    파일을 추가하고 갱신 용도를 direction2만 direct RPC로 재정렬하는 것으로 한정.
- RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 구현 중 확정한 세부
  5건(설계 재해석이 아닌 구체화)과 pgTAP 5파일·e2e 4파일의 기존 단언 갱신 전체 목록은
  `docs/execution/runs/P3-T09/radio.md`에 남겼다.
- `test_mode=tdd` 준수: RED→GREEN 다수 쌍(pgTAP 1쌍 + 기존 5파일 정합화 1쌍, 오류 코드 매핑
  3쌍, 취소 기능 트리오 2쌍, 인원 계산·칩 숨김·읽기 전용 좁히기·4분기 변형·roster 확장·변경
  안내 표시 각 1쌍, e2e 1쌍) 전부 실제 명령 실행 결과로 `docs/execution/runs/P3-T09/tdd.json`에
  기록했다(entries 29건, red 14 / green 15). `pnpm gate:tdd` 통과.
- `pnpm verify`를 포그라운드로 완전한 한 번의 연속 실행으로 최종 확인했다(스크래치패드 로그,
  저장소 밖 `verify-run5.log`). `format:check`·`lint:ci`·`typecheck`·`pnpm test`(220 files /
  1450 tests)·`harness:typecheck`·`harness:self-test`·`check:docs`·`build`·`gate:bundle`·
  `check:app-build`·`check:client-secret-scan`·`test:e2e`(76/76)·`gate:motion-render-budget`
  전부 GREEN. `gate:all`도 이 handoff 작성 후 재확인 예정(작성 시점 직전 실행에서는
  `gate:handoff`만 파일 부재로 실패 — 예상된 순서).
- 이번 실행 직전에 `npx -y supabase@2.75.0 db reset`을 했다 — `tests/e2e/recruitment-manage.spec.ts`·
  `tests/e2e/recruitment-open.spec.ts`(둘 다 이 task의 diff와 무관, 미수정)가 고정 날짜(현재
  월+2, 12·18일)를 쓰고 정리하지 않아 같은 세션에서 반복 실행하면 자기 자신과 충돌하는
  `23505 schedules_work_date_active_unique`를 재현했기 때문이다. 이는 P3-T10이 이미 소관하는
  알려진 결함(`work-date-band.ts` 미적용)이고, `db reset` 직후 단독 재실행(4/4 GREEN)과 전체
  `pnpm verify` 재실행(76/76 GREEN) 둘 다로 diff와 무관함을 실증했다. `assignment-eligibility`의
  1회성 무작위 밴드 충돌(다른 실행에서 1회 관측)도 `--workers=1` 단독 재실행(2/2 GREEN)으로 같은
  방식으로 무관성을 확인했다.
- pre-commit 훅(gate 4종 + lint-staged + 증분 typecheck + 단위 테스트) 통과 확인 예정 — 아래
  "다음 행동" 참고, 이 handoff 작성 시점까지는 아직 커밋하지 않았다.
- 이 세션 시작 전부터 있던 무관한 `.gitignore` 수정(로컬 스킬 보관 방식 변경)은 스테이징하지
  않고 그대로 뒀다 — RADIO 허용 경로 밖, 이 task 범위 아님.
- push는 하지 않는다(ci-finisher 소관).

### 미결 사항

- 없음 — RADIO 범위 안에서 결정이 필요한 항목은 남지 않았다. `recruitment-manage`·
  `recruitment-open`의 고정 날짜 자기 충돌은 P3-T10 소관으로 이미 배정돼 있어 여기서 결정할
  사항이 아니다(위 확정된 사실 절에서 이번에도 diff와 무관함을 재확인했다는 점만 기록).

### 다음 행동

1. 관련 파일 전체를 스테이징해 커밋 1개를 만들고(`feat(P3-T09): ...`, task ID 포함, 부분 스테이징
   금지, `.gitignore` 제외), pre-commit 훅 통과를 확인한다.
2. 검증 단계 진입: 이번 구현 커밋을 기준으로 리뷰어가
   `docs/execution/radio/P3-T09-radio.md`(revision 3)와
   `docs/execution/runs/P3-T09/radio.md`(적용 결과) 대조, 위험 매트릭스 11행 각각의 실증 근거
   (`docs/execution/runs/P3-T09/tdd.json`, pgTAP 23번 파일·단위·e2e) 확인.
3. `index.jsonl`의 P3-T09 상태를 `in_progress` → 검증 단계에 맞는 다음 상태로 전환하는 것은
   조정자 몫.
4. `recruitment-manage.spec.ts`·`recruitment-open.spec.ts`의 고정 날짜 자기 충돌 근본 수정은
   P3-T10에서 처리한다 — 이번 task는 그 두 파일을 건드리지 않았다.

### 증거·산출물 경로

- `supabase/migrations/20260817000000_post_confirmation_changes.sql` — 신설 마이그레이션.
- `supabase/tests/23-post-confirmation-changes.test.sql` — 신설 pgTAP(82문항).
- `supabase/tests/12-recruitment-schema.test.sql`·`17-ceremony-schema.test.sql`·
  `18-position-requirements.test.sql`·`19-assignments.test.sql`·`22-confirmed-roster.test.sql` —
  기존 CONFIRMED 거부 단언 갱신(상세는 `docs/execution/runs/P3-T09/radio.md`의 표).
- `src/features/confirmation/api/cancel-schedule.ts`·`hooks/useCancelSchedule.ts`·
  `ui/CancelScheduleDialog.tsx` — 취소 기능 트리오(신설).
- `src/views/admin-schedule/model/cancellation-impact.ts`(신설)·`candidate-buckets.ts`(칩 숨김
  확장)·`schedule-prep-screen.ts`(읽기 전용 좁히기)·`ui/AdminSchedulePrepView.tsx`(취소 버튼 배선).
- `src/views/schedule-detail/model/schedule-detail-variant.ts`(4분기)·`revision-notice.ts`(신설)·
  `ui/ScheduleDetailCancelledView.tsx`(신설)·`ui/ScheduleDetailView.tsx`(변경 안내 렌더).
- `src/entities/schedule/model/{ceremony-manage,requirement-manage,confirmed-roster}.ts`·
  `confirmed-roster.mock.ts`·`src/features/assignment/api/replace-position-assignments.ts`·
  `src/shared/config/error-codes.config.ts` — 오류 코드 3종(LB032~034) 매핑, revision·revisedAt
  확장.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`·`src/app/(protected)/schedule/[id]/page.tsx`
  — 취소 액션 배선, 4분기 변형 렌더.
- `tests/e2e/post-confirmation-changes.spec.ts`(신설 2건), `tests/e2e/ceremony-edit.spec.ts`·
  `tests/e2e/schedule-confirmation.spec.ts`·`tests/e2e/assignment-eligibility.spec.ts`·
  `tests/e2e/assignment-trainee.spec.ts`(기존 단언 갱신, 목록은 runs/radio.md),
  `tests/e2e/support/work-date-band.ts`(밴드 1개 추가).
- `docs/execution/runs/P3-T09/radio.md` — 적용 결과·정지 조건 이력·기존 단언 갱신 전체 목록.
- `docs/execution/runs/P3-T09/tdd.json` — RED→GREEN 증거 29건(red 14 / green 15),
  `pnpm gate:tdd` GREEN.
- 스크래치패드(저장소 밖) `verify-run5.log` — 마지막 전체 `pnpm verify` GREEN 로그(`test`
  220 files/1450 tests, `test:e2e` 76/76, `db reset` 직후 실행).
