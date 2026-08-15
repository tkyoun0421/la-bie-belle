# P3-T09 적용 결과

- 기준 RADIO: `docs/execution/radio/P3-T09-radio.md` revision 3, SHA-256
  `d137651f7d9e851a0960fefbfa833a32191e677fc0bac2b514c5cb27916632b3`(`index.jsonl`
  `development_approval`과 재개 시점 대조 완료, 일치).
- 이 문서는 RADIO Requirements·Architecture·Data model·Interface를 그대로 구현한 결과, 구현 중
  확정한 세부(설계 재해석이 아닌 구체화), 그리고 RADIO 변경 허용 경로 절이 요구한 「기존 단언
  갱신 목록」을 남긴다.

## 정지 조건 이력

- revision 1 봉인 후 개발 착수 전 검토 단계에서, 「확정 후 읽기 전용을 단언하는 기존 e2e 3파일
  (ceremony-edit·schedule-confirmation·assignment-eligibility)」이 허용 경로에 없다는 사실을
  확인 — 확정 후 편집 개방이 이번 task의 본체라 이 단언들은 필연적으로 깨진다. 이는 RADIO
  자신이 정의한 정지 조건("기존 pgTAP·단위·e2e가 「CONFIRMED에서 수정 RPC 거부」를 인수 조건으로
  단언해 이번 개방과 충돌하는 경우")에 해당해 조정자에게 반환했다.
- 조정자가 세 파일을 허용 경로에 추가하고 갱신 용도를 "읽기 전용 단언의 새 동작(편집 가능·취소
  버튼) 정합으로 한정"하는 RADIO revision 2를 봉인(2026-08-15, SHA-256
  `ebeef1bfe223e3d0b98b71494582568ff85a0593645669fc42e4a38d3123d296`)했다.
- `pnpm verify` 전체 실행(`test:e2e` 단계)에서 두 번째 정지 조건을 발견했다: 승인된 AC8(다른
  포지션 정식 배정자에게 교육생 선택지 미표시, `candidate-buckets.ts`)이 허용 경로 밖 파일
  `tests/e2e/assignment-trainee.spec.ts`의 direction2 시나리오와 충돌했다 — 그 시나리오는 다른
  포지션에 정식 배정된 근무자의 「교육」 버튼을 UI로 클릭해 DB 거부(LB024)를 확인하는데, 칩 숨김
  으로 그 버튼 자체가 렌더되지 않아 클릭이 불가능해졌다(`--workers=1` 단독 재실행으로도 재현 확인,
  제 diff가 원인임을 `git show HEAD:src/views/admin-schedule/model/candidate-buckets.ts`로 대조
  확정). 이 파일은 RADIO 허용 경로 밖이라 우회하지 않고 조정자에게 반환했다.
- 조정자가 해당 파일을 허용 경로에 추가하고 갱신 용도를 "direction2 시나리오만 UI 클릭 대신
  direct RPC 호출로 LB024 거부를 확인하도록 재정렬(DB 거부 단언 보존, 다른 시나리오·단언 무수정)"
  으로 한정하는 RADIO revision 3을 봉인(2026-08-15, SHA-256 위 명시, 커밋 `5cce577`)했다. 이후
  추가 정지 조건 발동은 없었다.

## 구현 중 확정한 세부

1. **PREPARING의 근무자 상세 변형 매핑**: `deriveScheduleDetailVariant`는 PREPARING을 `closed`로
   묶는다. RADIO는 "closed·open·confirmed·cancelled 4분기"만 명시하고 PREPARING의 소속을
   특정하지 않았다 — PREPARING은 근무자에게 모집 마감과 동일하게 "닫힘" 취급이 기존 관례(마감
   안내 문구 공유)라 새 CANCELLED 분기만 신설하고 PREPARING은 기존 closed 취급을 유지했다.
2. **취소는 revision을 올리지 않는다**: `cancel_confirmed_schedule`은 `bump_confirmed_revision`을
   호출하지 않고 별도의 `schedule_cancelled` 감사만 남긴다. RADIO Data model 절이 취소를 "데이터
   삭제 없음"으로만 규정하고 revision 증가 여부를 명시하지 않았으나, Interface 절의 "저장 1회 =
   revision 1 계약"은 수정 RPC 5종에 한정된 표현이고 취소는 그 5종에 속하지 않는다 — 취소 후에도
   근무자 화면의 "n월 n일 HH:mm에 변경됐어요" 안내가 마지막 실제 내용 변경 시각을 계속 가리키게
   하려는 목적으로, revision·revised_at 계약을 건드리지 않았다.
3. **`ScheduleDetailView`의 `revision`·`revisedAt` prop을 optional로 선언**: 두 값 모두 필수로
   선언하면 `src/app/preview/page.dev.tsx`(RADIO 허용 경로 밖)의 호출부가 타입 오류를 낸다.
   `revision?: number`(미지정 시 1로 기본값 처리)·`revisedAt?: string`(미지정 시 안내 미표시)로
   선언해, 허용 경로 밖 파일을 건드리지 않고도 `pnpm typecheck`를 통과시켰다. 실제 화면
   (`page.tsx`)은 항상 두 값을 넘긴다.
4. **관리자 준비 화면의 "스케줄 확정" 버튼 조건**: 기존 `mode !== "readonly"` 단일 조건에
   `&& schedulePrep.status !== "CONFIRMED"`를 더했다. CONFIRMED는 이제 `mode`가
   readonly가 아니라 editing이 되므로(READONLY_STATUSES를 `["CANCELLED"]`로 좁힘), 확정 버튼과
   취소 버튼이 동시에 보이지 않도록 상태 값으로 직접 분기했다.
5. **`bump_confirmed_revision`의 `section` 명명**: 마이그레이션 내부에서 각 수정 RPC가 넘기는
   `section` 값은 `'ceremonies'`·`'planned_times'`·`'requirements'`·`'assignments'` 네 가지로
   RPC별 1:1 대응시켰다. RADIO Data model 절은 `section text` 인자만 규정하고 값 집합을 정하지
   않아, 감사 조회·디버깅 편의를 위해 RPC 이름을 그대로 반영하는 값을 택했다.

## 기존 단언 갱신 목록 (변경 허용 경로 절이 요구한 목록)

### pgTAP

| 파일 | plan 변화 | 갱신 내용 |
| --- | --- | --- |
| `supabase/tests/12-recruitment-schema.test.sql` | 129→130(+1) | CONFIRMED→CANCELLED 전이를 거부하던 `throws_ok(LB020)` 단언을 제거하고, 그 자리에 (a) 다른 CONFIRMED 이탈 시도들이 상태를 바꾸지 못했다는 `is()`, (b) CONFIRMED→CANCELLED가 이제 허용된다는 `lives_ok`, (c) 전이 후 상태가 CANCELLED로 반영됐다는 `is()` 3건으로 재구성. |
| `supabase/tests/17-ceremony-schema.test.sql` | 65→67(+2) | CONFIRMED 스케줄(`2099-11-03`)에서 `replace_schedule_ceremonies`·`set_schedule_planned_times`를 거부하던 `throws_ok(LB020)` 2건을 각각 `lives_ok` + revision이 1만큼 늘었는지 확인하는 `is()`로 전환(1쌍당 순증 +1, 총 +2). |
| `supabase/tests/18-position-requirements.test.sql` | 86→89(+3) | CONFIRMED 스케줄(`2099-12-05`)에서 `set_position_requirement`·`remove_position_requirement`를 거부하던 `throws_ok(LB020)` 단언을, 포지션을 `팀장`에서 `스캔`으로 바꿔 재구성 — `lives_ok`(추가, revision 1→2)·`throws_ok(LB034)`(마지막 행 삭제 거부)·삭제 후 revision 불변 `is()`를 추가하고, 뒤이은 AC4 픽스처가 같은 스케줄에 raw insert하는 `팀장` 행과 충돌하지 않도록 정리용 raw `delete`를 픽스처 앞에 추가. |
| `supabase/tests/19-assignments.test.sql` | 95→95(0) | 시급 미설정 프로필(`...002`)을 CONFIRMED 스케줄(`2099-09-02`, `팀장`)에 배정하려는 시도의 기대 오류 코드를 `'LB020'`(CONFIRMED 거부)에서 `'LB030'`(시급 미설정 거부)으로 2건 교체 — CONFIRMED 자체는 더 이상 거부 사유가 아니고 시급 없음이 새 거부 사유이므로, `throws_ok` 개수는 그대로에 기대 코드만 바뀜. |
| `supabase/tests/22-confirmed-roster.test.sql` | 42→46(+4) | `get_confirmed_roster` 응답에 `revision`·`revised_at` 키가 추가됐음을 반영 — 최상위 키 개수 단언을 4→6으로 수정하고, 두 키의 존재(`? 'revision'`, `? 'revised_at'`) `ok()` 2건과 값 일치(`revision = 1`, `revised_at`이 `scheduling_audit_logs`의 해당 감사 행 `created_at`과 일치) `is()` 2건을 추가. |

### e2e (revision 2가 허용한 3파일, 읽기 전용 단언을 새 동작에 맞춰 정합)

| 파일 | 갱신 내용 |
| --- | --- |
| `tests/e2e/ceremony-edit.spec.ts` | CONFIRMED 스케줄 진입 시 읽기 전용 문구만 확인하던 테스트를 "확정된 스케줄은 예식·예정 시각을 편집할 수 있고 취소 버튼이 보인다(P3-T09)"로 이름을 바꾸고, 예식 인풋에 값이 실제로 편집 가능한지(`getByLabel("예식 1")` value 확인)·"저장" 버튼 노출·"스케줄 취소" 버튼 노출·"스케줄 확정" 버튼 부재를 단언하도록 재작성. 기존 읽기 전용 문구 부재 확인은 유지(반대 방향 검증으로 남김). |
| `tests/e2e/schedule-confirmation.spec.ts` | 확정 직후 읽기 전용 안내(`READONLY_NOTICE`) 노출을 확인하던 마지막 단언을, 확정 버튼(`confirmTrigger`)이 사라지고 "스케줄 취소" 버튼이 나타나는 것으로 교체. 테스트 제목에 "(P3-T09)"를 덧붙여 갱신 이력을 남김. 그 앞의 확정 흐름(경고 다이얼로그·확정 성공) 단언은 무수정. |
| `tests/e2e/assignment-eligibility.spec.ts` | CONFIRMED 스케줄의 후보 목록 항목에 배정 버튼이 없음을 확인하던 단언을, 같은 포지션 버튼을 눌러 배정 시트가 실제로 열리고("필요 1 / 배정 0" 노출) `Escape`로 닫히는 것으로 교체(확정 후에도 배정 시트가 열리는 새 동작 반영). 테스트 제목에 "확정 스케줄에서도 배정 시트가 열린다(P3-T09)"를 덧붙임. 그 앞의 자격 검사·배정 저장·교체 단언은 무수정. |

### e2e (revision 3이 허용한 1파일, 칩 숨김과 충돌하는 시나리오만 재정렬)

| 파일 | 갱신 내용 |
| --- | --- |
| `tests/e2e/assignment-trainee.spec.ts` | "AC2·AC3·AC4" 테스트의 direction2 시나리오(다른 포지션에 정식 배정된 근무자를 UI로 교육 등록 시도 → 저장 시점 DB 거부 확인)를, 같은 파일의 gender-mismatch 시나리오(197~205행)가 이미 쓰던 direct RPC 패턴으로 재정렬했다 — `authenticatedAdminClient.rpc("replace_position_assignments", { trainee_profile_ids: [alreadyAssignedWorker.id], ... })` 호출 후 `error.code === "LB024"`와 원본 Postgres 메시지("이미 다른 포지션에 정식 배정되어 있어 교육생으로 지정할 수 없습니다")를 단언한다. UI 클릭(`getByRole("button", { name: "교육" })`)과 매핑된 UI 문구(`TRAINEE_ALREADY_ASSIGNED_MESSAGE`) 단언은 제거했다 — AC8 칩 숨김으로 그 버튼 자체가 더는 렌더되지 않기 때문이다. DB 상태 확인(트레이니 행 0개·기존 정식 배정 유지)과 direction1·duplicate 시나리오는 무수정. |

- 기존 CONFIRMED 거부 단언 중 위 목록에 없는 것(P3-T06의 확정 재시도 LB029, P3-T07의 「CONFIRMED
  아닌 상태」 LB031 등)은 이 task와 무관해 그대로 뒀다 — RADIO 정지 조건 절의 예외 명시와 일치.
- 위 목록 밖의 다른 기존 단언(값·개수)은 약화하지 않았다.

## 위험 매트릭스 실증 근거 요약

- 1(revision·감사)·2(구조 차단)·3(추가 스냅샷)·4(취소)·5(권한)·6(roster 확장):
  `supabase/tests/23-post-confirmation-changes.test.sql`(신설, 82문항) + 위 표의 12·17·18·19·22
  갱신으로 실증.
- 7(관리자 UX): `tests/e2e/post-confirmation-changes.spec.ts`(신설 2건) +
  `tests/e2e/ceremony-edit.spec.ts`·`tests/e2e/schedule-confirmation.spec.ts` 갱신 케이스로 실증.
- 8(칩 숨김): `src/views/admin-schedule/model/__tests__/candidate-buckets.test.ts` 신규 단언.
- 9·10(근무자 표시): `src/views/schedule-detail/model/__tests__/revision-notice.test.ts`(신설),
  `src/views/schedule-detail/model/__tests__/schedule-detail-variant.test.ts`(4분기),
  `src/views/schedule-detail/ui/__tests__/ScheduleDetailView.test.tsx`(안내 렌더 2건),
  `tests/e2e/post-confirmation-changes.spec.ts`(AC1·AC9, AC4·AC7·AC10)로 실증.
- 11(인원 계산): `src/views/admin-schedule/model/__tests__/cancellation-impact.test.ts`(신설
  4건)로 실증.
