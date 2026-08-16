# P3-T08 검증 기록

RADIO: `docs/execution/radio/P3-T08-radio.md` (revision 1, SHA-256 `feebb61484ca40ee8b12d35cf029778f317e38e18fe9235686bb0d83cdd88b4b`, 봉인 커밋 `c345f30`).

test_mode: `verification` — RED/GREEN 사이클 대신 번들별 결과와 전체 검증 GREEN 기록을 남긴다.

## 수정 라운드 — F-01(high, 교차 검증)

교차 검증에서 리뷰어 2자 전원이 지적: 봉인 RADIO 기술 인수 조건 1("e2e `insertSchedule`이 4상태 유니언을 받고 최소 1개 e2e가 CLOSED 또는 PREPARING 경로를 지난다")이 미이행이었다. `insertSchedule` 유니언은 4상태로 넓혔지만, 저장소 전체에서 실제로 CLOSED·PREPARING 상태로 스케줄을 만들어 관리자 준비 화면의 수정 RPC 경로(편집→저장)를 통과시키는 e2e가 0건이었다(`tab-navigation.spec.ts`의 직접 CLOSED insert는 근무자 라우트 렌더 확인용이라 이 조건을 충족하지 않는다).

고침: `tests/e2e/position-requirements.spec.ts`에 `"필요 인원 저장은 PREPARING 스케줄의 준비 화면에서도 성공한다(P3-T08 F-01)"` 테스트를 신설했다. PREPARING 상태로 스케줄을 직접 insert(+예식 1건, "편집" 모드 진입 조건 충족)하고, `/admin/schedule/[id]` 화면에서 매니저 포지션 필요 인원을 3으로 입력→"인원 저장" 클릭→`schedule_position_requirements.required_count`가 실제로 3으로 반영됐는지, 스케줄 상태가 여전히 `PREPARING`인지(부작용으로 상태가 바뀌지 않는지)를 단언한다. 기존 테스트와 날짜가 겹치지 않도록 `WORK_DATE_BANDS.positionRequirements`를 `splitBand(..., 2)`로 나눠 신규 테스트 전용 서브밴드를 썼다(기존 assignment-trainee F-03 사례의 밴드 공유 실수를 반복하지 않기 위함).

완료 절차: `npx -y supabase@2.75.0 db reset` → `position-requirements.spec.ts` 단독 GREEN(2 passed) → `pnpm verify` 포그라운드 — 1차 시도에서 `recruitment-manage.spec.ts:112`(backlog 329 기존 무관 flake, 단독 재실행으로 `2 passed` 확인) 발생 → 2차 시도에서 전 단계 통과(e2e 82 passed, 신설 테스트 포함), 종료 코드 0.

## 번들 1 — 축 단위 공백

- CLOSED·PREPARING 픽스처·허용 단언: pgTAP 18(+19)·19(+11)·20(+12)번에 편입.
- 감사 actor 단언 복구: 17번(+1, `ceremonies_replaced`), 19번(기존 편입분에 포함, 전원 해제 감사 포함), 21번(+1, `schedule_confirmed`), 22번(+1, 픽스처 삽입 행 기준 `schedule_confirmed`), 23번(+1, `schedule_revised`) — 총 17~23번 전 파일에 최소 1건씩 존재.
- 확정→배정표 단일 여정 e2e 신설: `tests/e2e/confirmation-roster-journey.spec.ts` (밴드 `confirmationJourney { 495, 526 }`), 테스트 1건.
- 한 계층뿐인 규칙 6건:
  - 확정 차단 4종 e2e(`schedule-confirmation.spec.ts`): 기존 LB026(예식 없음) 유지 + 신설 LB027(예정 시각 미설정)·LB028(필요 인원 미작성)·LB030(시급 미설정) 3건, 총 3개 신설 테스트.
  - 교육 칩 숨김 e2e(`assignment-trainee.spec.ts`): 1건 신설.
  - 마지막 예식 단독 변경 재추천 단위: `useCeremonyEditor.test.ts` +1, `ceremony-times.test.ts` +2.
  - 전역 기본값 비전파 pgTAP(18번), 필요 0 포지션 정식 배정 pgTAP(19번), 기본 포지션 지정·해제 전이 pgTAP(19번) — 18·19번 plan 증가분에 포함.

## 번들 2 — backlog 단언 계열 10건 흡수

체크된 10개 항목(원본 backlog.md 줄 301, 302, 303, 313, 315, 324, 327, 328, 253, 307)을 각 목표 pgTAP 파일(18·19·20·21·22·23번)과 `candidate-buckets.test.ts`(AC8 경계값, +1)에 반영. 동시 확정(F-04, 21번)은 병렬 트랜잭션이 pgTAP 단일 연결 한계로 실증 불가해 재호출 LB029 거부·revision 불변·겸직자 스냅샷 불변 단언 3건으로 대체 종결하고 사유를 backlog.md 해당 줄에 병기했다.

## 번들 3 — UI 단위 테스트 10종 + 스모크 1건

승인 관례(`ApprovalActionButtons.test.tsx`) 깊이로 렌더·상호작용·콜백 단언을 갖춘 11개 신규 파일, 총 58개 테스트:

| 파일 | 테스트 수 |
|---|---|
| `features/confirmation/ui/__tests__/ConfirmScheduleDialog.test.tsx` | 6 |
| `features/confirmation/ui/__tests__/CancelScheduleDialog.test.tsx` | 4 |
| `features/assignment/ui/__tests__/AssignmentCandidateSheet.test.tsx` | 11 |
| `features/requirement/ui/__tests__/MissingPositionsBanner.test.tsx` | 4 |
| `features/requirement/ui/__tests__/RequirementTable.test.tsx` | 5 |
| `features/ceremony/ui/__tests__/CeremonyGenerateForm.test.tsx` | 3 |
| `features/ceremony/ui/__tests__/CeremonyListEditor.test.tsx` | 5 |
| `features/ceremony/ui/__tests__/CheckInRuleEditor.test.tsx` | 6 |
| `features/ceremony/ui/__tests__/PlannedTimesEditor.test.tsx` | 7 |
| `features/ceremony/ui/__tests__/RecommendationConfirmDialog.test.tsx` | 6 |
| `views/admin-schedule/ui/__tests__/AdminSchedulePrepView.test.tsx`(스모크) | 1 |

제품 코드는 무수정. Vaul Drawer 기반 컴포넌트는 jsdom `setPointerCapture` 미구현으로 `fireEvent.click`을 쓰고(기존 `PositionEditSheet.test.tsx` 관례와 동일), 접힘 `<details>` 상태는 `.toBeVisible()`/`.not.toBeVisible()`로 단언했다.

## 번들 4 — e2e 위생 7건

1. `ceremony-edit.spec.ts` — 죽은 `schedules` delete 호출 제거.
2. `position-requirements.spec.ts` — 죽은 `schedules` delete 호출 2건 제거.
3. `assignment-eligibility.spec.ts` — try/finally로 context.close 보장.
4. `assignment-eligibility.spec.ts` — 겸직 테스트에 `splitBand` 적용.
5. `assignment-schedule-fixtures.ts` — 이메일 접두사 `e2e-assignment-eligibility-*` → `e2e-assignment-*` 중립화.
6. `work-date-band.ts` — `workDatesInSameMonth`에 count>26 가드 추가.
7. 날짜 헬퍼 사본 통합 — `schedule.spec.ts` 전면 치환(로컬 `pad`/`pickDistinctDays`/`dateKey` 제거, `workDatesInSameMonth` 사용), `tab-navigation.spec.ts` 중복 2블록 치환(`workDateInBand`+`parseWorkDate` 사용). `recruitment-manage.spec.ts`·`recruitment-open.spec.ts`는 이미 `workDatesInSameMonth`를 쓰고 있어 무수정(사유를 backlog.md에 병기).

해당 backlog.md 줄 7건(원본 줄 247, 252, 275, 294, 300, 330, 331) 모두 완료 체크됨.

## 픽스처 정합 수정 (제품 코드 무관, 테스트 픽스처 버그 수정)

- `18-position-requirements.test.sql`: 신설 CLOSED/PREPARING 복사 단언의 기대 활성 포지션 수를 9→10으로 정정(직전 AC4 섹션이 `신규활성포지션`을 미리 추가해 두어 실제 카운트가 10임을 확인). 설명 문자열도 "9개"→"10개"로 함께 정정.
- `19-assignments.test.sql`: PREPARING `replace_position_assignments` 단언의 대상 프로필을 F2(`...003`, 파일 앞부분에서 이미 `deactivate_worker`로 비활성화됨)에서 F1(`...002`, 파일 전체에서 계속 active·동일 자격 보유)로 교체.

## 전체 검증 순서와 결과

지시된 순서대로 실행, 모두 GREEN:

1. `npx -y supabase@2.75.0 db reset` — 성공.
2. `npx -y supabase@2.75.0 test db` — `Files=23, Tests=1297, Result: PASS`.
3. `pnpm test` (Vitest 전체) — `Test Files 232 passed (232)`, `Tests 1516 passed (1516)`.
4. `pnpm test:e2e` 연속 2회(리셋 없이):
   - 1회차: `81 passed (1.2m)`.
   - 2회차: 첫 시도에서 `recruitment-manage.spec.ts:112`(마감 연장 다이얼로그 `toHaveValue` 5초 타임아웃)가 실패 — backlog 329에 기록된 기존 무관 flake(제품 코드 소유, load-heavy `toHaveValue`)와 동일 패턴. `npx playwright test tests/e2e/recruitment-manage.spec.ts` 단독 재실행으로 `2 passed`를 확인해 flake로 판정. 전체 재실행 결과 `81 passed (1.4m)`으로 GREEN.
5. `pnpm verify` 포그라운드 전체 실행 — 1차 시도에서 `test:e2e` 단계 중 동일한 `recruitment-manage.spec.ts:112` flake가 다시 발생, 체인 스크립트 특성상 전체 재실행. 2차 시도에서 format·lint·typecheck·`pnpm test`·harness·`check:docs`·`build`·`gate:bundle`·`check:app-build`·`check:client-secret-scan`·`test:e2e`(81 passed)·`gate:motion-render-budget`·`gate:all` 전 단계 통과, 종료 코드 0.

새/보강 단언 요약(수정 라운드 반영 전, 최초 완료 시점): pgTAP 7파일 합계 +57(1240→1297), UI 단위 신규 11파일 58개, 기존 단위 파일 보강(+useCeremonyEditor 1, +ceremony-times 2, +candidate-buckets 1), e2e 신규 5개 테스트(schedule-confirmation +3, assignment-trainee +1, confirmation-roster-journey +1 신설 파일).

수정 라운드(F-01) 반영 후 최종 e2e 신규 테스트는 6개(위 5개 + `position-requirements.spec.ts` 1개), `pnpm test:e2e` 전체는 82개로 GREEN.
