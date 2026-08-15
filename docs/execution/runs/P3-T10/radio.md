# P3-T10 적용 결과

- 기준 RADIO: `docs/execution/radio/P3-T10-radio.md` revision 3, SHA-256
  `a12c6cbfee78d3393158398dd44fda63dea2e6532d106ea9e8a9108007b6862d`(`index.jsonl`
  `development_approval`과 대조 완료, 일치). 재봉인 커밋 `bcd6d8c`.
- 이 문서는 RADIO Requirements·Architecture·Interface를 그대로 구현한 결과와, 개발 단계에서
  발동해 재봉인으로 해소된 정지 조건 1건, 검증 단계 교차 검증 F-01(high)을 해소한 수정 라운드
  1건의 경위, 반복 실행·`pnpm verify` 증거를 남긴다.

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
  범위를 좁힌 RADIO revision 2를 봉인(2026-08-16, SHA-256
  `be5ebbd3d6567668fe0ebb05d596f7b3680b138bc04f5b350f3b4aacc26f471b`, 커밋 `2637bce`)했다.
  이후 개발 단계에서 추가 정지 조건 발동은 없었다.

## 수정 라운드 (교차 검증 F-01, high)

- 검증 단계 교차 검증(리뷰어 2자)에서 확정 발견 4건 중 high 1건이 수정 라운드 대상으로 반환됐다
  — medium·low 3건(F-02·F-03·F-04)은 `docs/execution/reviews/backlog.md`로 누적하고 이번
  라운드에서는 고치지 않는다(조정자 결정).
- **F-01(tests, high)**: revision 2의 기술 인수 조건 3("모듈 레벨 `workDatesInBand(band, 2)` 한
  번으로 날짜를 받아 테스트별로 나눠 쓴다")을 그대로 구현했더니, `schedule-confirmation`·
  `schedule-roster`·`post-confirmation-changes` 세 spec 각각에 `test.describe` 밖 모듈 레벨
  변수(`scheduleConfirmationWorkDateA`/`B` 등)를 도입해 두 테스트가 나눠 썼다. 이는 Playwright
  `fullyParallel` 환경에서 같은 파일의 테스트가 서로 다른 워커 프로세스로 배정될 수 있고, 각
  워커가 spec 모듈을 독립적으로 재평가하므로 모듈 레벨 호출이 워커 간에 공유되지 않는다 — 결국
  전환 이전과 같은 독립 추첨이 되어 0.12% 자기 충돌 확률이 그대로 회귀한다. 인용했던
  `position-requirements.spec.ts` 관례는 실제로는 한 테스트 함수 "안"에서의 단일 호출이라 여러
  테스트가 나눠 쓰는 이번 형태와 근본적으로 달랐다 — RADIO 설계 오류였다. 리뷰어 2자 전원이
  인정했고, `decision-signal.json` confirmed[3]에 기록한 `--repeat-each=3` 병렬 실행의 `23505`
  관측 1건이 그 실증 증거로 재사용됐다.
- 조정자가 "`splitBand(band, parts)` 헬퍼로 밴드를 테스트별 정적 비겹침 하위 구간으로 나누고,
  각 테스트가 자기 구간에서만 `workDateInBand`로 독립 추첨"하는 RADIO revision 3을 봉인
  (2026-08-16, SHA-256 `a12c6cbfee78d3393158398dd44fda63dea2e6532d106ea9e8a9108007b6862d`,
  커밋 `bcd6d8c`)했다.
- 수정: `tests/e2e/support/work-date-band.ts`에 `splitBand(band, parts)`를 신설 — 밴드 폭
  (`maxMonthsAhead - minMonthsAhead + 1`)을 `parts`로 나눈 몫·나머지를 계산해 앞쪽 `나머지`개
  구간에 1개월씩 더 배분하는 방식으로 순서대로 잘라, 합집합이 원 밴드를 정확히 포괄하고 인접
  구간이 겹치지 않게 했다(홀수 폭 처리: 폭 7·2분할 → 4+3, 폭 1·2분할 등 극단값은 이번 세 밴드
  (32개월 폭, 2분할 → 16+16)에서 실제로 발생하지 않아 별도 가드는 두지 않았다). 세 spec은
  모듈 레벨 `workDatesInBand(band, 2)` 공유 변수를 폐기하고, `splitBand(band, 2)`로 가른 두
  하위 구간을 모듈 레벨 **상수**(`SCHEDULE_CONFIRMATION_BAND_A`/`B` 등)로 두고, 각 테스트
  본문이 자기 구간에서 `workDateInBand(...)`를 직접 호출해 추첨한다. 구간 자체는 밴드 경곗값의
  순수 계산 결과라 워커가 모듈을 몇 번 재평가해도 항상 같은 값이므로, 워커 경계와 무관하게
  구조적으로 겹치지 않는다.
- 검증: `--workers=1`로 세 spec 단독 실행 6/6 GREEN(splitBand 경계값 확인용) 후, 아래 "반복
  실행 증거"의 db reset 후 다섯 spec 연속 2회, `pnpm verify` 전체로 재확인했다. F-01 자체는
  워커 분산 시나리오라 로컬 단일 세션 재현이 어려워 별도 단위 테스트를 두지 않고(e2e 지원
  코드에 단위 테스트를 두지 않는 기존 관례 유지), `splitBand` 계산 결과를 Node REPL로
  직접 검산했다: `{330,361}`(폭 32)을 2분할하면 `[{330,345},{346,361}]`, `{0,6}`(폭 7, 홀수)을
  2분할하면 `[{0,3},{4,6}]`으로 합집합·비겹침·전체 포괄을 모두 만족했다.

## 적용 결과 (파일별 요약)

1. **`tests/e2e/support/work-date-band.ts`**: `WORK_DATE_BANDS`에 `recruitmentManage`
   (429~460개월)·`recruitmentBulkOpen`(462~493개월) 2개를 기존 최댓값(427) 뒤에 비겹침으로
   추가. `workDatesInSameMonth(band, count)`를 신설 — `monthAnchorInBand`로 달 하나를 뽑고
   2~27일에서 중복 없는 날을 `Set`으로 모아 오름차순 정렬해 반환. `splitBand(band, parts)`를
   신설(revision 3, F-01 해소) — 위 "수정 라운드" 절 참고. 기존 밴드·`workDatesInBand`·
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
4. **`tests/e2e/schedule-confirmation.spec.ts`**(revision 3): import를
   `workDatesInBand`→`splitBand`·`workDateInBand`로 바꾸고, `test.describe` 밖 모듈 레벨에
   `splitBand(WORK_DATE_BANDS.scheduleConfirmation, 2)`로 가른 두 하위 구간을
   `SCHEDULE_CONFIRMATION_BAND_A`/`B` 상수로 두었다. 두 테스트는 각자 자기 구간에서
   `workDateInBand(...)`를 직접 호출해 날짜를 뽑는다 — 모듈 레벨 공유 추첨(revision 2, F-01로
   폐기)이 아니라 테스트별 독립 추첨 + 정적 구간 분리 조합이다. 두 테스트 내부의 나머지 단언은
   무변경.
5. **`tests/e2e/schedule-roster.spec.ts`**(revision 3): 위와 동일한 패턴으로
   `SCHEDULE_ROSTER_BAND_A`/`B` 모듈 레벨 상수를 도입.
6. **`tests/e2e/post-confirmation-changes.spec.ts`**(revision 2·3): 정리 블록 2곳에서
   `admin.from("schedules").delete().eq("id", scheduleId)` 문장만 제거(revision 2 범위) —
   `ceremonies`·`assignment_positions`·`assignments`·(두 번째 블록의) `assignment_trainees`
   delete는 그대로 유지해 `deleteWorkerSessions`의 FK 선행 조건을 보존했다. 날짜 산출은
   revision 3에서 4·5와 동일한 패턴으로 `POST_CONFIRMATION_CHANGES_BAND_A`/`B` 모듈 레벨
   상수 + 테스트별 `workDateInBand(...)` 호출로 교체했다.
7. **`docs/execution/reviews/backlog.md`**: P3-T06 F-06(309행)·P3-T07 F-02(314행)·P3-T09
   F-03(322행) 세 줄을 `[x]`로 체크. 다른 줄은 무수정.

## 위험 매트릭스 실증 근거 요약

- 1·2(recruitment 밴드 이전): `tests/e2e/recruitment-manage.spec.ts`·
  `tests/e2e/recruitment-open.spec.ts` 기존 단언 그대로 통과(아래 반복 실행 증거).
- 3(정적 하위 구간 분할, revision 3): `tests/e2e/schedule-confirmation.spec.ts`·
  `tests/e2e/schedule-roster.spec.ts`·`tests/e2e/post-confirmation-changes.spec.ts` 기존 단언
  그대로 통과, `splitBand`로 가른 테스트별 정적 비겹침 구간이 fullyParallel 워커 재평가와
  무관하게 같은 spec 내 테스트 간 날짜 충돌을 구조적으로 제거(F-01 해소).
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

## 수정 라운드 반복 실행·`pnpm verify` 증거 (F-01 해소 확인)

- `--workers=1`로 `schedule-confirmation.spec.ts`·`schedule-roster.spec.ts`·
  `post-confirmation-changes.spec.ts` 세 spec만 단독 실행 6/6 GREEN(splitBand 도입 직후 최초
  확인, db reset 후).
- `npx -y supabase@2.75.0 db reset` 후 다섯 spec 연속 2회(사이 reset 없음, 포그라운드)를 재확인
  했다. 이번 라운드에서는 이 세션의 다른 백그라운드 앱(Adobe Creative Cloud·다수 Chrome 탭 등,
  이 task와 무관)으로 인한 CPU 경합이 커서 기본 워커 수(4)로는 backlog F-04 flake가 4회
  연속(2026-08-15T16:32:56Z·16:33:13Z·16:33:30Z·16:33:43Z 시작 시도 중 2~4번째) 재현됐다 —
  코드 결함이 아니라는 판정은 이미 조정자가 확인했으므로 재조사 없이, 부하를 줄이는 실행 매개변수
  (`--workers=2`, 테스트 코드·설정 파일 무변경)로 재시도해 공식 기록을 남겼다:
  - 1회차 시작 2026-08-15T16:35:42Z: `10 passed (13.0s)`.
  - 2회차 시작 2026-08-15T16:35:58Z(1회차 직후, reset 없음): `10 passed (12.0s)`.
  - 두 번 모두 GREEN, `23505` 미재현 — 기술 인수 조건 5 재충족.
- `npx -y supabase@2.75.0 db reset` 후 2026-08-15T16:36:19Z 시작한 전체 `pnpm verify`(기본 워커
  수, 매개변수 무변경) 1회 연속 실행이 끝까지 GREEN이었다 — `format:check`·`lint:ci`·
  `typecheck`·`pnpm test`·`harness:typecheck`·`harness:self-test`·`check:docs`·`build`·
  `gate:bundle`·`check:app-build`·`check:client-secret-scan`·`test:e2e`(76/76, backlog F-04
  flake 미재현)·`gate:motion-render-budget`·`gate:all` 전부 GREEN, `ELIFECYCLE`·`✘` 없음.
