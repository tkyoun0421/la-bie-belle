# P3-T10 적용 결과

- 기준 RADIO: `docs/execution/radio/P3-T10-radio.md` revision 2, SHA-256
  `be5ebbd3d6567668fe0ebb05d596f7b3680b138bc04f5b350f3b4aacc26f471b`(`index.jsonl`
  `development_approval`과 대조 완료, 일치). 재봉인 커밋 `2637bce`.
- 이 문서는 RADIO Requirements·Architecture·Interface를 그대로 구현한 결과와, 개발 단계에서
  발동해 재봉인으로 해소된 정지 조건 1건의 경위, 반복 실행·`pnpm verify` 증거를 남긴다.

## 정지 조건 이력

- revision 1 그대로 구현을 진행해 `tests/e2e/post-confirmation-changes.spec.ts`의 정리 블록
  2곳(각 finally의 `ceremonies`·`assignment_positions`·`assignments`·[`assignment_trainees`]·
  `schedules` delete 전체)을 지시대로 통째로 제거했더니, 같은 finally 블록에서 뒤이어 실행되는
  `deleteWorkerSessions`(`auth.admin.deleteUser`)가 FK 제약 위반으로 결정적으로(재현 2/2) 깨졌다.
  `assignments.profile_id`·`assignment_trainees.profile_id`가 `profiles(id)`를 CASCADE 없이
  참조하고(`supabase/migrations/20260810000000_assignments.sql`,
  `20260811000000_assignment_trainees.sql`), `profiles.id`는 `auth.users(id)`를
  `ON DELETE CASCADE`로 참조한다(`supabase/migrations/20260806000000_identity_profiles.sql`) —
  자식 행을 남긴 채 `auth.users`를 지우면 `profiles`로의 CASCADE가 그 자식 행 때문에 막힌다.
  이는 RADIO 자신이 정의한 정지 조건("정리 블록 제거가 다른 spec의 실행 결과에 영향을 주는
  경우")과 같은 성격의 문제라 우회하지 않고 `docs/execution/runs/P3-T10/decision-signal.json`을
  남기고 조정자에게 반환했다.
- 조정자가 "`schedules` delete 문장만 제거하고, `ceremonies`·`assignment_positions`·
  `assignments`·`assignment_trainees` delete는 사용자 삭제 CASCADE의 FK 선행 조건이라 유지"로
  범위를 좁힌 RADIO revision 2를 봉인(2026-08-16, SHA-256 위 명시, 커밋 `2637bce`)했다. 이후
  추가 정지 조건 발동은 없었다.

## 적용 결과 (파일별 요약)

1. **`tests/e2e/support/work-date-band.ts`**: `WORK_DATE_BANDS`에 `recruitmentManage`
   (429~460개월)·`recruitmentBulkOpen`(462~493개월) 2개를 기존 최댓값(427) 뒤에 비겹침으로
   추가. `workDatesInSameMonth(band, count)`를 신설 — `monthAnchorInBand`로 달 하나를 뽑고
   2~27일에서 중복 없는 날을 `Set`으로 모아 오름차순 정렬해 반환. 기존 밴드·`workDatesInBand`·
   `workDateInBand`는 무수정.
2. **`tests/e2e/recruitment-manage.spec.ts`**: 고정 날짜 계산 함수 `manageMonthAnchor`(현재
   월+2, 12·18일 하드코딩)를 제거하고 `workDatesInSameMonth(WORK_DATE_BANDS.recruitmentManage, 2)`
   호출 + `parseWorkDate` 헬퍼(날짜 문자열 → `{year, month, day}`)로 대체. 마감일은 그대로 해당
   달 1일(`dateKey(year, month, 1)`). 기존 단언(연장 다이얼로그 값·재오픈·근무자 화면 신청 가능
   전환)은 무변경 — 날짜 산출 경로만 바뀌었다.
3. **`tests/e2e/recruitment-open.spec.ts`**: 고정 날짜 계산 함수 `nextMonthAnchor`(현재 월+1,
   10·2·3일 하드코딩)를 제거하고 `workDatesInSameMonth(WORK_DATE_BANDS.recruitmentBulkOpen, 3)`
   호출로 대체. 반환 배열이 오름차순이므로 `[selectDateA, selectDateB, existingDate]`
   구조분해로 RADIO Interface 절의 "선택 A=최소, 선택 B=중간, 기존 활성=최대" 분배를 그대로
   만족하고, 마감 fill은 `selectDateA`를 그대로 쓴다. 테스트 2(비관리자 접근 차단)는 날짜를 쓰지
   않아 무수정.
4. **`tests/e2e/schedule-confirmation.spec.ts`**: import를 `workDateInBand`→`workDatesInBand`로
   바꾸고, `test.describe` 밖 모듈 레벨에 `workDatesInBand(WORK_DATE_BANDS.scheduleConfirmation, 2)`
   1회 호출(`position-requirements.spec.ts` 관례)을 추가해 두 테스트가 각각
   `scheduleConfirmationWorkDateA`/`B`를 나눠 쓰도록 했다. 두 테스트 내부의 나머지 단언은
   무변경.
5. **`tests/e2e/schedule-roster.spec.ts`**: 위와 동일한 패턴으로
   `scheduleRosterWorkDateA`/`B` 모듈 레벨 변수를 도입.
6. **`tests/e2e/post-confirmation-changes.spec.ts`**: 위와 동일한 패턴으로
   `postConfirmationChangesWorkDateA`/`B` 모듈 레벨 변수를 도입. 정리 블록 2곳에서
   `admin.from("schedules").delete().eq("id", scheduleId)` 문장만 제거(revision 2 범위) —
   `ceremonies`·`assignment_positions`·`assignments`·(두 번째 블록의) `assignment_trainees`
   delete는 그대로 유지해 `deleteWorkerSessions`의 FK 선행 조건을 보존했다.
7. **`docs/execution/reviews/backlog.md`**: P3-T06 F-06(309행)·P3-T07 F-02(314행)·P3-T09
   F-03(322행) 세 줄을 `[x]`로 체크. 다른 줄은 무수정.

## 위험 매트릭스 실증 근거 요약

- 1·2(recruitment 밴드 이전): `tests/e2e/recruitment-manage.spec.ts`·
  `tests/e2e/recruitment-open.spec.ts` 기존 단언 그대로 통과(아래 반복 실행 증거).
- 3(일괄 배분 전환): `tests/e2e/schedule-confirmation.spec.ts`·`tests/e2e/schedule-roster.spec.ts`·
  `tests/e2e/post-confirmation-changes.spec.ts` 기존 단언 그대로 통과, 모듈 레벨 1회 호출로
  같은 spec 내 테스트 간 날짜 충돌을 구조적으로 제거.
- 4(무효 delete 제거): `tests/e2e/post-confirmation-changes.spec.ts` 단독 재실행(`--workers=1`)
  2/2 GREEN — `schedules` delete 제거 후에도 spec 단독·전체 e2e 모두 GREEN.
- 5(반복 실행): 아래 "반복 실행 증거" 절.
- 6(`pnpm verify`): 아래 "`pnpm verify` 증거" 절.
- 7(backlog 완료 체크): 위 적용 결과 7번.

## 반복 실행 증거 (기술 인수 조건 5)

- `npx -y supabase@2.75.0 db reset` 실행(2026-08-16 KST, 로그 "Finished supabase db reset on
  branch main" 확인) 후, 다음 명령을 연속 2회 실행(사이 `db reset` 없음, 포그라운드):
  ```
  npx playwright test tests/e2e/recruitment-manage.spec.ts tests/e2e/recruitment-open.spec.ts \
    tests/e2e/schedule-confirmation.spec.ts tests/e2e/schedule-roster.spec.ts \
    tests/e2e/post-confirmation-changes.spec.ts
  ```
  - 1회차 시작 2026-08-15T15:53:13Z: `10 passed (10.4s)`.
  - 2회차 시작 2026-08-15T15:53:29Z(1회차 직후, reset 없음): `10 passed (9.3s)`.
  - 두 번 모두 GREEN, `23505`(schedules_work_date_active_unique) 미재현 — 기술 인수 조건 5
    충족.
- 위 두 번의 공식 기록 이전에 같은 명령을 3회 더 실행했고(2026-08-15T15:42:05Z·15:50:33Z·
  15:52:09Z 시작) 그중 2회에서 `recruitment-manage.spec.ts`의 "OPEN 날짜를 연장하고 CLOSED
  날짜를 재오픈하면..." 테스트가 `마감일 연장` 다이얼로그 재오픈 시 `새 마감일` 값이 5초 안에
  갱신되지 않는 `toHaveValue` 타임아웃으로 실패했다. 원인을 조사한 결과:
  - `--workers=1 --repeat-each=5`로 이 파일만 단독 재실행하면 5/5 GREEN이었다 — 날짜 산출
    로직(이번 diff의 유일한 변경 지점) 자체의 결함이 아니다.
  - 이 화면은 Server Action이 `revalidatePath`로 라우터 캐시를 무효화한 뒤 클라이언트가 새
    서버 props를 받아 재렌더될 때까지 왕복 지연이 있고, 다이얼로그 재오픈에 쓰는 `openCell`
    락케이터는 그 재렌더 전까지 이전 서버 props를 참조한다(`src/features/recruitment/hooks/useRecruitmentManage.ts`
    `open()`이 클릭 시점 인자 그대로 상태를 세팅). 4워커 동시 실행처럼 프로덕션 서버에 부하가
    걸리면 이 왕복이 5초를 넘길 수 있다 — 날짜 밴드 이전과 무관한 기존 아키텍처의 부하성
    timing이다.
  - 이 증상과 조사 결과는 정지 조건 반환 시 `decision-signal.json`에 함께 보고했고, 조정자가
    "기록만 남기면 된다(결함 아님)"로 확인했다(재개 지시문). RADIO의 "날짜 외의 기존 단언을
    바꿔야 통과하는 경우" 정지 조건에 해당하지 않는다 — 이번 diff가 그 단언을 바꾸거나
    약화하지 않았고, 재시도로 GREEN이 재현되기 때문이다.

## `pnpm verify` 증거 (기술 인수 조건 6)

- 확정 근거: `npx -y supabase@2.75.0 db reset` 후 2026-08-15T16:08:21Z 시작한 전체 `pnpm verify`
  1회 연속 실행이 끝까지 GREEN이었다(`handoff.md` 작성 완료 후 실행) — `format:check`·`lint:ci`·
  `typecheck`·`pnpm test`(321/321, harness 포함)·`harness:typecheck`·`harness:self-test`·
  `check:docs`·`build`·`gate:bundle`·`check:app-build`·`check:client-secret-scan`·
  `test:e2e`(76/76)·`gate:motion-render-budget`·`gate:all` 전부 GREEN, `ELIFECYCLE` 오류 없음.
- 이 확정 실행 이전에 `pnpm verify`·`pnpm test:e2e`를 db reset 없이 반복 호출하며 진단한 시도가
  4회 더 있었다(2026-08-15T15:53:45Z·15:57:59Z·15:59:07Z·16:04:31Z 시작) — 이 중 2회는 위
  "반복 실행 증거"에서 서술한 `recruitment-manage`의 부하성 timing flake로 `test:e2e` 단계에서
  실패(나머지는 전부 GREEN), 1회는 반복 호출로 누적된 잔존 데이터가 이 task 범위 밖의
  `tests/e2e/schedule.spec.ts`(무수정 파일)와 우연히 같은 `work_date`를 뽑아 `23505`로
  실패했다 — 진단용으로 db reset 없이 여러 차례 재실행한 내 세션 자체의 산물이며, 이 task의 diff
  나 다섯 개 대상 spec과는 무관하다(위 확정 근거 실행은 새 `db reset` 직후 단일 실행으로 이 문제가
  재현되지 않았다).
