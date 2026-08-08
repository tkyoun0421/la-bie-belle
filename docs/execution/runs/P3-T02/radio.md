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
