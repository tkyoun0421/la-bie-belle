# P3-T07 handoff

## 2026-08-15 · 개발 종료

- 작업 식별자: P3-T07
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-15T07:01:04Z(GREEN e2e 재실행 로그 타임스탬프 기준)

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P3-T07-radio.md` revision 2, SHA-256
  `fa3c7d7d7beb8bac3d7c6d631d5aba06787d6e779fec4c56aad5336a5e0a2eba`(index.jsonl
  `development_approval`과 재개 시점 대조 완료, 일치).
- 기준 커밋: `9476b2e`("docs(P3-T07): reseal RADIO revision 2 returning planned times from the
  roster RPC").
- `docs/execution/phases/index.jsonl`의 P3-T07 상태를 `planned` → `in_progress`로 전환했다.
  **`done`으로는 올리지 않았다** — 조정자 몫이다.
- 개발 단계 중 정지 조건이 1회 발동했고 조정자의 RADIO revision 2 재봉인(사용자 승인, 커밋
  `9476b2e`)으로 해소됐다 — 상세 경위는 `docs/execution/runs/P3-T07/radio.md` "정지 조건 이력"
  절에 있다.
- RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 구현 중 확정한 세부
  5건(설계 재해석이 아닌 구체화)과 위험 매트릭스 8행 대비 실증 근거는
  `docs/execution/runs/P3-T07/radio.md`에 전부 남겼다.
- `test_mode=tdd` 준수: RED→GREEN 9쌍(pgTAP 1쌍, `confirmed-roster` 모델 1쌍, `get-confirmed-roster`
  api 1쌍, `roster-groups` 2쌍, `schedule-detail-variant` 1쌍, `confirmed-roster.mock` 1쌍,
  `ScheduleDetailView` 1쌍, `list-schedule-requirements` 1쌍, e2e 1쌍) 전부 실제 명령 실행 결과로
  `docs/execution/runs/P3-T07/tdd.json`에 기록했다. `pnpm gate:tdd` 통과.
- `pnpm verify`를 완전한 한 번의 연속 실행으로 두 차례 돌렸다(스크래치패드 로그, 저장소 밖). 두
  번 모두 e2e 74개 중 `recruitment-manage.spec.ts:114`·`recruitment-open.spec.ts:80`만 실패했고,
  이번 task가 추가한 `schedule-roster.spec.ts` 2개를 포함한 나머지 72개는 전부 GREEN.
  `format`·`lint:ci`·`typecheck`·`pnpm test`(216 files / 1420 tests)·`harness:typecheck`·
  `harness:self-test`·`check:docs`·`build`·`gate:bundle`·`check:app-build`·
  `check:client-secret-scan`도 두 번 모두 GREEN. e2e 실패 이후 중단된 나머지 verify 단계
  (`gate:motion-render-budget`·`gate:all` 중 `gate:handoff` 제외)도 개별 실행으로 GREEN을
  확인했다.
- 실패한 두 e2e는 사전에 알려진 flaky 케이스(P3-T10 소관, `work-date-band.ts` 미적용으로 인한
  `23505 duplicate key ... schedules_work_date_active_unique`)로 확인했다. 격리 검증: 두 spec을
  각각 `--workers=1`로 단독 실행해도 동일한 work_date 충돌로 실패함을 확인했다 — 이 task의 diff와
  무관함을 실증했다(내가 추가한 `scheduleRoster` 밴드는 두 spec이 쓰는 밴드와 겹치지 않는
  `363~394`개월 구간이다).
- pre-commit 훅(gate 4종 + lint-staged + 증분 typecheck + 단위 테스트) 통과 확인 예정 — 아래
  "다음 행동" 참고, 이 handoff 작성 시점까지는 아직 커밋하지 않았다.
- 이 세션 시작 전부터 있던 무관한 `.gitignore` 수정은 스테이징하지 않고 그대로 뒀다(RADIO 허용
  경로 밖, 이 task 범위 아님).
- push는 하지 않는다(ci-finisher 소관).

### 미결 사항

- 없음 — RADIO 범위 안에서 결정이 필요한 항목은 남지 않았다. `recruitment-manage`·
  `recruitment-open` 두 e2e의 근본 수정(work-date-band 적용)은 P3-T10 소관으로 이미 배정돼 있어
  여기서 결정할 사항이 아니다.

### 다음 행동

1. 관련 파일 전체를 스테이징해 커밋 1개를 만들고(`feat(P3-T07): ...`, task ID 포함, 부분 스테이징
   금지), pre-commit 훅 통과를 확인한다.
2. 검증 단계 진입: 이번 구현 커밋을 기준으로 리뷰어가
   `docs/execution/radio/P3-T07-radio.md`와 `docs/execution/runs/P3-T07/radio.md`(적용 결과) 대조,
   위험 매트릭스 8행 각각의 실증 근거(`docs/execution/runs/P3-T07/tdd.json`, pgTAP/단위/e2e 파일)
   확인.
3. `index.jsonl`의 P3-T07 상태를 `in_progress` → 검증 단계에 맞는 다음 상태로 전환하는 것은
   조정자 몫.
4. 필요 시 `pnpm verify`를 한 번 더 돌려 flaky 두 e2e가 이번엔 통과하는지(비결정적 워커 스케줄링이라
   매번 다름) 재확인 가능 — 실패해도 위 격리 증거로 이미 무관성 입증됨.

### 증거·산출물 경로

- 마이그레이션: `supabase/migrations/20260816000000_confirmed_roster.sql`
- pgTAP: `supabase/tests/22-confirmed-roster.test.sql`(plan 42)
- 엔티티 모델: `src/entities/schedule/model/confirmed-roster.ts` +
  `__tests__/confirmed-roster.test.ts`(4문항), `confirmed-roster.mock.ts` +
  `__tests__/confirmed-roster.mock.test.ts`(4문항)
- 엔티티 API: `src/entities/schedule/api/get-confirmed-roster.ts` +
  `__tests__/get-confirmed-roster.test.ts`(5문항),
  `src/entities/schedule/api/list-schedule-requirements.ts`(정렬 적용) +
  `__tests__/list-schedule-requirements.test.ts`(17문항)
- 화면 로직: `src/views/schedule-detail/model/roster-groups.ts` +
  `__tests__/roster-groups.test.ts`(10문항),
  `src/views/schedule-detail/model/schedule-detail-variant.ts`(3분기 확장) +
  `__tests__/schedule-detail-variant.test.ts`(5문항)
- 화면: `src/views/schedule-detail/ui/ScheduleDetailView.tsx`(재구성) +
  `__tests__/ScheduleDetailView.test.tsx`(11문항),
  `src/views/schedule-detail/ui/ScheduleDetailOpenView.tsx`(신규, 테스트 면제)
- 배선: `src/app/(protected)/schedule/[id]/page.tsx`, `src/app/preview/page.dev.tsx`
- 오류 코드: `src/shared/config/error-codes.config.ts`(LB031 1개 추가)
- e2e: `tests/e2e/schedule-roster.spec.ts`(2 test), `tests/e2e/support/work-date-band.ts`
  (`scheduleRoster` 밴드 추가)
- TDD 증거: `docs/execution/runs/P3-T07/tdd.json`(RED→GREEN 9쌍)
- RADIO 적용 결과: `docs/execution/runs/P3-T07/radio.md`
