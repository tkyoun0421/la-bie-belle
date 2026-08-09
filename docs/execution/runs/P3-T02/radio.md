# P3-T02 RADIO 적용 결과

- RADIO: `docs/execution/radio/P3-T02-radio.md` revision 2, SHA-256 `7f9601daba3ef32c81c670a962509c61bafd16d7dbc7a4a2eb18c581e1613ff2`
- 적용 세션: 2026-08-08~09, blocked 지점(revision 2 재봉인 직후)에서 재개해 개발 단계를 마무리

## 승인된 범위 그대로 구현한 부분

- 마이그레이션 1개(`supabase/migrations/20260809000000_position_requirements.sql`)로 `schedule_position_requirements` 신설, `positions` admin mutation 정책 3종, `copy_schedule_requirements`·`set_position_requirement`·`remove_position_requirement` DEFINER 함수와 감사, positions insert 강제 반영 트리거.
- 포지션 관리 화면(`/admin/positions`): 활성·비활성 구분 목록, 추가·수정(이름·기본 인원·성별 조건·기본 여부·비활성화), 삭제(사용 중이면 안내), 시스템 포지션 보호 배지·비활성 버튼.
- 준비 화면(`/admin/schedule/[id]`) 필요 인원 절: 첫 진입 복사, 표 표시·수정·행 삭제, 미포함 활성 포지션 배너+추가.
- admin 허브 진입 링크 1개(`src/app/(protected)/admin/page.tsx`, revision 2가 편입한 범위 그대로 — 기존 4개 링크와 같은 인라인 나열에 1개만 추가, 다른 줄 무수정).
- pgTAP 75건(`supabase/tests/18-position-requirements.test.sql`) 전부 GREEN, unit(entities·features api/hooks) 전부 GREEN, E2E(`tests/e2e/position-requirements.spec.ts`) GREEN.

## 구현 중 확정한 세부(설계 재해석이 아니라 RADIO 문구 안에서의 선택)

1. **`positions`의 정책 수 단언을 1→4로 갱신했다(`supabase/tests/04-rls-default-deny.test.sql`).** RADIO 기술 인수 조건 8이 명시적으로 허용한 F-08 교훈 그대로 — 근무자 select 정책(P1) 위에 admin insert·update·delete 정책 3개를 더해 4개가 됐다.
2. **렌더 시점 "첫 진입 복사"를 `features/requirement/api/copy-requirements.ts`(Server Action)로 직접 호출하지 않고, `entities/schedule/api/ensure-schedule-requirements-copied.ts`를 새로 만들어 호출한다.** Next.js 16은 `revalidatePath`를 렌더 중(Server Component render) 호출하면 `used "revalidatePath ..." during render which is unsupported` 예외를 던진다(`node_modules/next/dist/esm/server/web/spec-extension/revalidate.js`의 `workUnitStore.phase === 'render'` 가드, 문서: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md` — "Server Functions"에서만 호출 가능하고 렌더 중 호출은 지원 대상이 아니다). `copyRequirements` Action은 내부에서 `revalidatePath`를 호출하므로 page.tsx 렌더 안에서 직접 await할 수 없었다. `ensureScheduleRequirementsCopied`는 같은 RPC(`copy_schedule_requirements`)를 호출하지만 `revalidatePath`를 부르지 않는 순수 read/mutate 헬퍼로, `get-schedule-prep.ts`·`list-positions.ts`처럼 admin 레이아웃 게이트 + RLS/DEFINER `is_admin` 이중 방어에 기대 별도 `requireAdmin()` 호출도 두지 않았다(P3-T01 radio.md 6번 선례와 동일). `copyRequirements` Action 자체는 RADIO Architecture가 지정한 대로 삭제하지 않고 그대로 남겨 뒀다(테스트 GREEN 유지, 향후 클라이언트 트리거 재복사 등에 재사용 가능).
3. **`features/requirement/ui/RequirementTable.tsx`의 행 버튼 라벨을 "저장"/"삭제"가 아니라 "인원 저장"/"인원 삭제"로 지었다.** RADIO 위험 절이 명시한 위험("준비 화면 확장이 P3-T01 예식 E2E를 깨뜨릴 수 있다")이 실제로 발생했다 — 기존 `CeremonyListEditor`의 단일 "저장" 버튼을 `getByRole("button",{name:"저장",exact:true})`로 특정하는 `tests/e2e/ceremony-edit.spec.ts`가, 내가 새로 추가한 행별 "저장" 버튼들 때문에 동일 텍스트가 여러 개가 되어 strict mode 위반으로 깨졌다(`pnpm test:e2e` 전체 실행에서 확인). 예식 컴포넌트·예식 E2E 파일은 한 줄도 건드리지 않고, 내가 새로 만든 컴포넌트의 라벨만 고유하게 바꿔 해결했다 — "기존 예식 흐름·셀렉터를 수정하지 않는다"는 제약을 가장 보수적으로 지키는 방향이다.
4. **`copy_schedule_requirements`는 CONFIRMED 스케줄에서도 허용하고, `set_position_requirement`·`remove_position_requirement`는 CONFIRMED·CANCELLED 둘 다 거부한다.** RADIO 기술 인수 조건 2("대상 존재·CANCELLED 거부")와 조건 3("CONFIRMED·CANCELLED 거부")의 문구 차이를 그대로 반영한 것으로, "표의 정본 이원화" 불변 규칙 및 "확정 스케줄 개방은 P3-T06 소유" 비목표와 함께 읽으면 복사(생성)와 수정(변경)의 거부 범위가 다른 것이 의도된 설계로 판단했다.
5. **준비 화면의 필요 인원 절은 새 화면 모드를 만들지 않고 기존 `resolveSchedulePrepScreenMode`의 `readonly`/그 외 두 갈래만 재사용한다.** `readonly`(CONFIRMED·CANCELLED)면 인원수만 보여주는 목록, 그 외(`empty`·`editing`)면 `useRequirementEditor` 기반 편집 표를 렌더한다. RADIO Interface는 이 절의 상태 분기를 별도로 규정하지 않아, 이미 있는 상태 모델을 그대로 확장하는 쪽을 택해 새 개념을 추가하지 않았다.
6. **렌더 시점 복사는 CANCELLED 스케줄만 건너뛴다(그 외 OPEN·CLOSED·PREPARING·CONFIRMED는 항상 시도).** `copy_schedule_requirements` 함수 자체가 CANCELLED만 거부하도록 설계돼 있어(4번 항목), 페이지 쪽 가드도 동일한 조건으로 맞췄다. 실패해도(예: 42501) 화면 전체를 에러로 막지 않고 `listScheduleRequirements`가 반환하는 현재 상태로 계속 진행한다 — `activePositions`·`requirementRows` 조회 실패 시 빈 배열로 대체하는 기존 P3-T01 폴백 관례와 동일하다.
7. **포지션 편집 시트의 "기본 포지션"·"상태" 토글은 `SelectField`가 아니라 `Chip`을 썼다.** RADIO Interface는 "비활성화" 컨트롤의 구체적 위젯을 지정하지 않았고, `Chip`은 `aria-pressed`로 접근성 이름을 그대로 노출해(`DEV-a11y` 관례) 반복 결함 체크리스트의 "새 UI 요소 접근성 이름" 항목을 시트 안에서 가장 단순하게 만족한다.

## 위험 기반 테스트 매트릭스 반영

- 표의 "테스트함" 선언은 pgTAP(`supabase/tests/18-position-requirements.test.sql`, 75건 — 스키마·정책·복사·수정·삭제·트리거·경계값·권한·멱등)·unit(`entities/position`·`entities/schedule`의 model·api, `features/position`·`features/requirement`의 api·hooks)·E2E(`tests/e2e/position-requirements.spec.ts`)로 실증했다. 명령·시각·exit code는 `docs/execution/runs/P3-T02/tdd.json`을 참조한다.
- E2E는 인수 조건 7 세 갈래(포지션 추가 → 표 있는 열린 스케줄 자동 반영, 기본값 변경이 이미 복사된 표에 영향 없음, 비활성화가 새 스케줄 선택지에서 제외)를 한 시나리오 안에서 순서대로 확인한다. 픽스처는 try/finally로 정리하며, 스케줄은 이 저장소의 append-only 트리거(`schedules_reject_delete`) 때문에 실제로는 지워지지 않는다는 점까지 포함해 `ceremony-edit.spec.ts` 선례를 그대로 따랐다 — 대신 트리거가 자동 반영한 `schedule_position_requirements` 행은 `position_id` 기준으로 전부 지운 뒤 `positions` 행을 지워 재실행 시 FK 위반이 나지 않게 했다(P3-T01 F-04 교훈).
- "동시성" 행은 RADIO 비고와 동일하게 `for update` 잠금이 함수 정의에 존재한다는 구조적 확인(`pg_get_functiondef ~* 'for update'`)으로 대체했다 — pgTAP은 단일 커넥션 안에서 실제 동시 세션을 재현하지 못한다는 P2-T03 선례를 그대로 따른다.

## 미결 사항 처리

- RADIO의 유일한 미결 사항("확정 스케줄 수동 추가 개방과 추가 시점 목록 모달은 P3-T06 설계가 다룬다")은 이 task의 구현 범위 밖이라 손대지 않았다. `set_position_requirement`·`remove_position_requirement`는 설계 그대로 CONFIRMED를 거부한다.

## 2026-08-09 · 교차 검증 수정 라운드(revision 3 반영 + high/medium 4건)

- RADIO: `docs/execution/radio/P3-T02-radio.md` revision 3, SHA-256
  `7d55892eb28aacc4db7e626eb749ec2e78f11a096711fa0afe0ca0b7abb5793f`
- 기준 커밋: `1357c87`(개발 커밋) 위에 재봉인 커밋 `0184472`가 얹힌 상태에서 이어 구현. 대상은 조정자가 확정한
  R-00(revision 3 반영)·F-01(high)·F-02·F-03·F-04(medium) 5건, 전부 TDD로 고쳤다(`tdd.json` 참고).

### 발견별 구현 결정

1. **R-00 — `copy_schedule_requirements`의 거부 대상에 CONFIRMED를 추가했다.** 위 4번 항목("복사는 CONFIRMED를
   허용하고 수정만 거부한다")이 재봉인으로 뒤집혔다 — "표의 정본 이원화" 불변 규칙이 "복사는 멱등이며 확정·취소
   스케줄을 제외한다"로 확장됐기 때문이다. 호출부 `NON_COPYABLE_STATUSES`(`page.tsx`)를 `["CANCELLED"]`에서
   `["CONFIRMED", "CANCELLED"]`로 맞췄고, pgTAP의 "CONFIRMED도 복사된다" 단언을 `throws_ok(..., 'LB020', ...)`로
   교체했다. AC4가 검증하던 "CONFIRMED 스케줄은 표를 갖고 있어도 자동 반영에서 제외된다" 트리거 분기는 이제
   copy로 표를 만들 수 없어 픽스처가 사라지므로, superuser 권한의 raw insert 픽스처를 그 앞에 추가해 트리거
   단언의 의미를 유지했다 — 별도 함수·Action을 새로 만들지 않고 pgTAP 스크립트 안에서만 시뮬레이션했다.
2. **F-01 — `schedule_position_requirements_admin_all`(`for all`)을 `schedule_position_requirements_select_admin`
   (`for select`)로 좁혔다.** 저장소 관례를 다시 대조한 결과 `for all` 전례는 상태 잠금·감사가 없는 전역 설정
   `check_in_rules_admin_all` 하나뿐이고, 상태 잠금(LB020)과 감사(`requirement_set`/`requirement_removed`)가
   있는 테이블은 전부 select 전용 정책 + DEFINER 함수 쓰기 경로다(`ceremonies_select_admin`,
   `schedules`/`applications`/`scheduling_audit_logs`). `schedule_position_requirements`는 후자에 속하므로
   select 전용으로 좁혔다 — DEFINER 함수(`copy_schedule_requirements`·`set_position_requirement`·
   `remove_position_requirement`)는 RLS를 우회하므로 내부 동작은 영향받지 않는다.
   pgTAP 작성 중 Postgres RLS의 비직관적 동작을 직접 확인했다: RLS 활성 테이블에 해당 명령의 정책이 없을 때
   INSERT는 `42501`을 던지지만 UPDATE/DELETE는 대상 행이 `USING` 절에서 걸러져 **에러 없이 0건 적용**된다(로컬
   `psql`로 별도 scratch 테이블에서 실증). 그래서 update/delete 거부 단언은 `throws_ok`가 아니라
   `with attempted as (update ... returning 1) select is((select count(*) from attempted), 0, ...)`(WITH을
   최상위 절로 둔 형태 — 데이터 변경 CTE는 스칼라 서브쿼리 인자 안에 중첩할 수 없다는 Postgres 제약 때문에 이
   형태여야 파싱된다)로 썼다.
3. **F-02 — 이름 `Input`의 `disabled={isSystem}`·안내 문구를 제거했다.** DB 트리거
   `reject_system_position_change`(`20260804000000_foundation_schema.sql`)를 다시 읽어 실제로 막는 대상이
   `code`·delete·비활성화뿐이고 표시명(`name`)은 명시적으로 허용됨을 확인했다 — 트리거 예외 메시지 자체가
   "표시명만 수정할 수 있습니다"다. UI 쪽 차단은 PRD 4장·트리거·RADIO Interface 어디에도 근거가 없는 과잉
   제약이었다. 삭제·비활성화 차단은 트리거가 실제로 막는 대상과 일치하므로 그대로 남겼다.
4. **F-03 — 조회 실패를 빈 배열로 치환하지 않고 `ErrorScreen`으로 fail-closed 처리한다.** 같은 페이지의
   `getSchedulePrep` 실패 처리(이미 `ErrorScreen` 반환)와 대칭을 맞췄다 — "표시 문제"가 아니라
   `useRequirementEditor.addMissing`이 `defaultRequiredCount`로 `setRequirement`를 호출해 이미 저장된 값을
   전역 기본값으로 덮어쓰는 감사 남는 오작동으로 이어질 수 있어(봉인 불변 규칙 "전역 기본 인원수 변경은 이미
   복사된 스케줄에 전파하지 않는다" 위반), 조용한 폴백보다 fail-closed가 맞다고 판단했다. `page.tsx` 자체는
   이 저장소에 테스트 파일 전례가 하나도 없어(`find src/app -name "*.test.tsx"` 결과 0건, `config/fsd.json`의
   `appLayer` 세그먼트도 `page.tsx`를 unit test 의무에서 면제) 분기 로직을
   `views/admin-schedule/model/requirement-section-data.ts`의 순수 함수로 추출해 TDD로 고정하고, `page.tsx`는
   그 결과를 그대로 분기만 하는 얇은 어댑터로 남겼다.
5. **F-04 — admin·근무자·anon 3주체의 select/insert/update/delete 거부(또는 허용) 단언을 추가했다.** admin은
   select만 허용(F-01), insert/update/delete는 전부 거부됨을 확인했다. 근무자는 select부터 4종 전부 거부.
   anon은 `04-rls-default-deny.test.sql`이 이미 정한 범위(select·insert만 확인, update/delete는 anon 세션
   자체가 이 저장소 전반에서 검증 대상으로 삼지 않는다)를 그대로 따라 select·insert 2종만 거부 확인했다 — 근무자
   쪽만 4종으로 넓힌 건 F-04 원문이 "근무자 select·mutation 거부"를 명시했기 때문이다. `pg_policies` 개수
   단언(=1)도 함께 추가해 정책 형태 자체가 넓어지는 회귀를 막았다.

### 검증 결과

- `pnpm db:reset && pnpm db:test` GREEN(18 files, 915 assertions — 18번 파일 75→86건).
- `pnpm verify` 전체 GREEN(포맷·lint·typecheck·unit 193 files/1172 tests·harness self-test 308·check:docs·
  build·app-build·client-secret-scan·E2E 39/39·gate:all). E2E는 `pnpm build`로 프로덕션 번들을 새로 만든 뒤
  `db:reset` 직후 실행했다 — `next start`가 이전 세션의 `.next` 산출물을 그대로 재사용해 이번 라운드 수정 전
  코드로 검증될 뻔한 것을 빌드 타임스탬프 대조로 발견해 재빌드했다(아래 참고).
- TDD RED→GREEN 증거는 `docs/execution/runs/P3-T02/tdd.json`에 pgTAP 1쌍 + unit 2쌍(F-02·F-03)으로 추가했다.

### 구현 중 발견한 프로세스 함정(설계와 무관, 검증 절차 교훈)

- **`pnpm test:e2e`의 `webServer.reuseExistingServer`(비 CI 환경)가 오래된 `.next` 빌드를 재사용할 수 있다.**
  포트에 떠 있는 서버가 없어도 `next start`는 새 프로세스를 띄우되 디스크의 기존 `.next` 산출물을 그대로
  서빙한다 — 이번 라운드 코드 수정 후 첫 `pnpm test:e2e` 실행에서 CONFIRMED 스케줄 페이지가
  `ensureScheduleRequirementsCopied`를 실제로 호출해 LB020을 기록하는 로그를 봤는데, R-00 수정 후 코드라면
  `NON_COPYABLE_STATUSES`가 이를 아예 스킵해야 정상이다. `.next/BUILD_ID`와 소스 파일 mtime을 대조해 빌드가
  이번 라운드 수정 이전(당일 이른 아침) 것임을 확인했다. `pnpm build`로 재빌드한 뒤 재실행해 로그가 사라짐을
  확인했다.
- **`recruitment-manage.spec.ts`·`recruitment-open.spec.ts`는 `work_date`를 `now` 기준 고정 day-of-month
  오프셋으로 계산하고 픽스처를 정리하지 않는다.** `db:reset` 없이 `test:e2e`를 연속 두 번 돌리면 이전 실행이
  남긴 동일 `work_date` 행과 유니크 제약(`schedules_work_date_active_unique`)이 충돌해 실패한다 — 이 라운드의
  코드 변경과 무관한 기존 테스트 설계다(수정 대상 아님, backlog로도 언급되지 않아 손대지 않았다). 매 E2E 실행
  전 `db:reset`을 다시 해 우회했다.
