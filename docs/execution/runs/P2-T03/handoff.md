# P2-T03 handoff

## 2026-08-07 · 개발 중단(blocked)

- 작업 식별자: P2-T03
- 현재 단계: 개발 진행 중 → `blocked`(허용 경로 밖 수정 필요 발견) → 다음 설계(RADIO 재봉인 또는 범위 조정)
- 기준 시각: 2026-08-07T20:55:00Z(2026-08-08 KST 새벽)

### 확정된 사실

- 기준 커밋: `2251948`(HEAD, 착수 시점). RADIO revision 1, SHA-256 `6f4db8a069fa4ed1b4634a3c178f37757dc57d8c91b0be08f077d97f81400930`(`index.jsonl`의 `development_approval`과 일치 확인 후 착수)를 그대로 구현했다.
- **완료된 부분(모두 RED→GREEN, 회귀 없음)**:
  - `supabase/migrations/20260808000000_recruitment_application.sql`: `apply_recruitment_changes(apply_schedule_ids uuid[], withdraw_schedule_ids uuid[]) returns jsonb` — RADIO Architecture 절이 명시한 순서(세션→active 근무자→입력 검증→잠금 조회→존재 확인→차단 집계→목표 상태 적용→감사)를 그대로 구현했다.
  - `supabase/tests/14-recruitment-application.test.sql`(pgTAP 40건): happy path 혼합 batch, 멱등 재실행, withdrawn→applied 재신청, CLOSED·CANCELLED·마감 경과 차단(전체 미적용), 마감 당일 KST 허용 경계, 존재하지 않는 id·빈 배열·null 배열·null 원소·교집합 22023, 비활성 4종(pending·rejected·dormant·departed)·anon 42501을 감사 행 스코프 단언(F-04류 전역 카운트 의존 회피)과 함께 검증한다. `pnpm db:reset && pnpm db:test` 최종 GREEN(14 파일 699 tests, 기존 01~13 무수정 통과).
  - `src/shared/config/error-codes.config.ts`: `SCHEDULING_APPLICATION_BLOCKED`(409) 추가.
  - `src/entities/schedule/model/application-changes.ts`(Zod 두 uuid 배열 입력·중복 제거·교집합 금지·합산 1~366·오류 매핑 42501→IDENTITY_NOT_ACTIVE/23505→SCHEDULING_APPLICATION_BLOCKED/22023→SCHEDULING_VALIDATION), `model/recruitment-schedule.ts`(신청 상태 결합 DTO `RecruitmentScheduleWithApplication`·`mapRecruitmentScheduleWithApplication` 추가), `api/list-own-applications.ts`(server-only, 세션 확인 후 `profile_id`·`scheduleIds` 이중 필터 — RLS 관리자 우회로 인한 타인 노출을 앱 계층에서도 막음).
  - `src/features/application/api/apply-recruitment-changes.ts`(Server Action — 세션 확인→Zod→rpc→매핑→`revalidatePath("/schedule")`→구조화 stderr 로그), `hooks/useApplicationBatch.ts`(savedApplied·pending·diff·제출 상태·마지막 batch 기억·Undo 소멸 3조건 — toggle이 즉시 지움·다음 저장 성공이 새 메모리로 대체·화면 이탈은 자연 소멸), `ui/ApplicationChangeBar.tsx`(변경 개수·저장·되돌리기 바, Undo 메모리가 있으면 되돌리기 버튼으로 전환 — RADIO 설계 인터뷰 확정대로 스낵바와 별개의 하단 상시 요소).
  - `src/views/schedule/model/schedule-cell-state.ts`(P0 스텁의 ui 내 `toCellState`를 분리·확장 — CANCELLED는 비활성으로 취급, CONFIRMED 우선, OPEN 아니면 closed, pending·savedApplied로 selected/requested 구분), `ui/ScheduleView.tsx`(실데이터 props로 전환: `month`·`today`·`schedules`·`onApply` — 서버 컴포넌트가 된 `page.tsx`가 콜백을 못 넘기므로 상세 이동·월 이동 라우팅을 `useRouter`로 뷰 내부에 흡수), `ui/schedule.mock.ts`(새 DTO 형태로 갱신, preview 잔존 허용 조건 그대로 유지).
  - `src/app/(protected)/(tabs)/schedule/page.tsx`: 클라이언트 스텁 → 서버 컴포넌트. `month` searchParam(P2-T02 관례 그대로 재사용 — UTC 자정 파싱 방식 포함. F-03 타임존 경계는 사용자 메모에 따라 P2 몫이 이미 P2-T05로 종결됐으므로 이번 task에서 새로 고치지 않았다) + 월 범위 조회(`list-recruitment-schedules` 재사용) + `list-own-applications` 결합 + Action 주입.
  - P0 스텁 전용이던 `src/entities/schedule/model/work-schedule.ts`·`work-schedule.mock.ts`·`application.ts`·`application.mock.ts`(+ 각 테스트)는 실데이터 DTO로 완전히 대체돼 소비처가 사라져 삭제했다(전수 grep으로 다른 소비처 없음을 확인).
  - `pnpm vitest run` 전체 154 files·922 tests GREEN(회귀 없음). `pnpm typecheck`는 아래 미해결 1건만 남기고 통과.
- **막힌 지점**: `src/app/(protected)/(tabs)/schedule/page.tsx`를 서버 컴포넌트로 바꾸면(RADIO 명시 지시) `ScheduleView`가 더 이상 `onOpenDetail` 콜백을 prop으로 받을 수 없다(서버→클라이언트로 함수를 그대로 넘길 수 없음 — Next.js 제약, 선택의 여지가 없다). 그래서 `ScheduleView`의 상세·월 이동 라우팅을 내부 `useRouter`로 옮겼는데, `src/app/preview/page.dev.tsx`(프리뷰 카탈로그)가 옛 시그니처(`onOpenDetail={() => {}}`)로 `ScheduleView`를 두 번 호출해 `pnpm typecheck`·`pnpm build`가 깨진다. 이 파일은 RADIO의 변경 허용 경로 목록에 없다. 자세한 근거·확인 사항·미결 질문은 `docs/execution/runs/P2-T03/decision-signal.json`에 구조화해 남겼다.
- 위 막힌 지점 때문에 index의 P2-T03을 `in_progress`에서 `blocked`로 되돌렸다.

### 미결 사항

- `src/app/preview/page.dev.tsx`(또는 `src/app/preview/**`)를 이번 RADIO의 변경 허용 경로에 추가하는 재봉인이 필요한지, 아니면 다른 처리를 원하는지 — 결정 주체: 사용자, 반환할 단계: 설계(RADIO 재봉인, 기술 설계 변경으로 보여 `development_approval`만 다시 받으면 될 것으로 보이나 확인 필요).
- 위 결정 전까지 `tests/e2e/schedule.spec.ts` 재작성(기술 인수 조건 6)과 `pnpm verify` 전체 실행·commit은 시작하지 않았다.

### 다음 행동

1. 위 미결 사항을 해소한다(RADIO 재봉인 또는 대안 결정).
2. `src/app/preview/page.dev.tsx`가 허용 경로에 들어오면 이미 적용된 2줄 수정(각 `<ScheduleView>` 호출에서 `onOpenDetail={() => {}}` 제거)을 그대로 스테이징한다 — 이미 작업 트리에 반영돼 있다.
3. `tests/e2e/schedule.spec.ts`를 RADIO 기술 인수 조건 6(근무자 로그인 → 일정 탭 → 모집 날짜 2개 선택 + 기존 신청 1개 해제 → 저장 → 셀 상태 반영 확인 → 되돌리기 → 원상 복귀 확인)대로 재작성한다. 근무자 세션 픽스처는 `worker-management.spec.ts`/`recruitment-open.spec.ts`의 `createAdminSession` 관례를 admin 롤 없이 재사용하면 된다.
4. `pnpm verify` 전체를 통과시키고, 관련 변경 파일을 전체 스테이징해 P2-T03 task ID를 포함한 commit을 만든다.
5. index를 `in_progress`로 다시 전환한 뒤 이어간다(재개 시 `blocked`→`in_progress` 전환 필요).

### 증거·산출물 경로

- `docs/execution/runs/P2-T03/tdd.json`(완료된 부분의 RED→GREEN 실행 기록)
- `docs/execution/runs/P2-T03/decision-signal.json`
- `supabase/migrations/20260808000000_recruitment_application.sql`, `supabase/tests/14-recruitment-application.test.sql`
- `src/entities/schedule/model/application-changes.ts`, `model/recruitment-schedule.ts`, `api/list-own-applications.ts`
- `src/features/application/**`
- `src/views/schedule/**`
- `src/app/(protected)/(tabs)/schedule/page.tsx`
- `src/app/preview/page.dev.tsx`(허용 경로 밖 — 작업 트리에만 존재, 미스테이징)
- `src/shared/config/error-codes.config.ts`

## 2026-08-08 · 재봉인 반영 후 개발 재개·종료

- 작업 식별자: P2-T03
- 현재 단계: `blocked` → 재개(`in_progress`) → 개발 완료
- 기준 시각: verify 최종 통과 2026-08-07T21:41:13Z(UTC)

### 재개 배경

- 사용자가 RADIO 재봉인을 승인했다. 조정자가 RADIO revision 2를 봉인했다: 변경 허용 경로에 `src/app/preview/page.dev.tsx` 한 파일을 추가했고, 그 외 결정 내용은 무변경이다. SHA-256 `2dcb8ff80901b7bb3891705e301d39236ec0b63239fa5c3b92231a8b8405fd48`.
- `docs/execution/phases/index.jsonl`의 `development_approval`이 `radio_revision:2`·위 해시로 갱신되고 P2-T03이 `in_progress`로 복귀한 것을 확인한 뒤 재개했다. `docs/execution/runs/P2-T03/decision-signal.json`은 이력으로 보존하고 수정하지 않았다(해소된 사실은 이 절에 기록).

### 재개 후 완료한 작업

- `src/app/preview/page.dev.tsx`: 이미 작업 트리에 반영돼 있던 `onOpenDetail={() => {}}` prop 제거 2건이 이제 허용 경로 안에 들어와 스테이징 가능해졌다(코드 수정 자체는 새로 하지 않음).
- `tests/e2e/schedule.spec.ts`: RADIO 기술 인수 조건 6대로 전면 재작성했다. 근무자(비관리자) 세션은 `worker-management.spec.ts`의 `createActiveWorker` 패턴을 참고해 이 파일 안에 자체 `createWorkerSession` 헬퍼로 작성했다(서비스 롤로 사용자 생성 → `profiles` insert(status active) → 비밀번호 로그인 쿠키 주입). 픽스처는 매 실행마다 무작위 미래 월(6~29개월 뒤)·무작위 날짜 3개를 뽑아 시딩해, `recruitment-open.spec.ts` 등 기존 고정 날짜 픽스처와 결코 같은 로컬 DB 상태에 반복 삽입되지 않도록 했다(스케줄은 append-only라 같은 날짜 재삽입은 유니크 제약 위반으로 막힌다).
  - 시나리오: OPEN 스케줄 2건(신규 선택 대상) + 기존 `applied` 신청 1건(해제 대상)을 시딩 → `/schedule?month=...` 진입 → 2건 선택 + 1건 해제 클릭("3개 변경") → 저장 → 셀 라벨이 "신청"/"신청 가능"으로 반영됨을 확인 → "방금 변경한 3개 날짜 되돌리기" 클릭 → 원상 복귀 확인.
- `pnpm typecheck` 통과 확인 도중 `pickDistinctDays`의 배열 인덱스 접근이 `noUncheckedIndexedAccess`에 걸려 타입 에러가 났다. Fisher–Yates 스왑 대신 `Set`으로 중복 없는 3개 날짜를 뽑는 방식으로 바꿔 해결했다(반복 destructuring이 iterator 기반이라 undefined 문제가 없다).
- `src/features/application/hooks/__tests__/useApplicationBatch.test.ts`: `pnpm lint:ci`가 `expect(...).toEqual({ count: 1, execute: expect.any(Function) })` 2곳에서 `@typescript-eslint/no-unsafe-assignment`를 걸었다. `expect.any(Function)`이 `any` 타입을 반환해 생기는 문제라, `expect(result.current.undo?.count).toBe(1)` + `expect(typeof result.current.undo?.execute).toBe("function")`로 분리해 해결했다(단언 내용은 동일, 타입 안전성만 개선).
- `pnpm format`이 `page.tsx`·`useApplicationBatch.ts`·`ApplicationChangeBar.tsx` 3개 파일의 공백을 재정렬했다(내용 변경 없음).

### E2E 실행 중 발견한 환경 문제(코드 결함 아님)

- 최초 `pnpm exec playwright test schedule.spec.ts` 실행이 실패했다(현재 월 데이터가 그대로 렌더돼 시딩한 날짜를 찾지 못함). `fetch`로 직접 프로덕션 서버에 쿠키를 실어 재현한 결과, 같은 증상이 나타났다가 `.next`를 지우고 완전히 새로 빌드하자 사라졌다 — 세션 안에서 반복된 `pnpm build`가 Turbopack의 증분 빌드 캐시를 남긴 것으로 보이며, `page.tsx`의 `searchParams` 처리 코드 자체는 문제가 없음을 fetch 재현으로 확인했다.
- `pnpm verify`를 두 번째로 실행했을 때 `recruitment-open.spec.ts`(P2-T02 소유, 이번 task 범위 밖)가 고정 날짜(다음 달 10일)를 다시 삽입하려다 유니크 제약 위반으로 실패했다 — 스케줄이 append-only라 같은 로컬 DB에서 `test:e2e`를 두 번 이상 돌리면 발생하는, 이미 존재하던 픽스처 설계의 특성이다(내가 세션 중 여러 번 verify를 돌리며 누적된 상태 때문에 드러났을 뿐, 내 변경이 유발한 회귀는 아니다). `pnpm db:reset`으로 로컬 DB를 비운 뒤 `pnpm verify`를 다시 돌려 정상 통과를 확인했다. 이 두 문제 모두 코드 변경이 아니라 로컬 반복 실행에 따른 환경 상태 문제였다.

### 최종 검증

- `pnpm gate:tdd` 단독 통과.
- `pnpm db:reset && pnpm db:test`: 14개 파일 699 subtests 전부 GREEN(01~13 기존 파일 무회귀, 14번 신규 파일 40 subtests 포함).
- `pnpm verify`(format → lint:ci → typecheck → vitest 154 files/922 tests → harness:typecheck → harness:self-test 279 tests → check:docs → build → check:app-build → check:client-secret-scan → test:e2e 32/32 → gate:all) 최종 실행: 시작 2026-08-07T21:39:53Z, 종료 2026-08-07T21:41:13Z, 종료 코드 0.
- `docs/execution/runs/P2-T03/tdd.json`에 E2E RED(2026-08-07T21:29:19Z, exit 1)→GREEN(2026-08-07T21:34:08Z, exit 0) 실행 기록을 추가했다(명령: `pnpm exec playwright test schedule.spec.ts`).
- 남은 [질문]: 없음(재봉인으로 해소됨).

### 다음 행동

1. 관련 변경 파일을 RADIO revision 2의 변경 허용 경로 안에서 전체 스테이징한다(부분 스테이징 금지). `docs/execution/runs/interviews/2026-08-08-p2-t03-reseal.md`는 허용 경로 밖이라 스테이징하지 않는다.
2. `P2-T03` task ID를 포함한 새 커밋을 만든다(amend 금지, push는 다음 담당자 몫).

## 2026-08-08 · 교차 검증 수정 라운드(F-01·F-02 high 2건)

- 작업 식별자: P2-T03
- 근거: `docs/execution/reviews/P2-T03-review.json`(opus·codex 전원 인정, base_commit `4503e799...`, total 78). WORKFLOW 4단계 5항(검증 실패가 구현 결함이면 3단계 복귀)에 따라 승인 범위 안 high 2건만 수정했다. F-03(DB 경계 batch 상한 미강제)은 review 자체가 "승인 범위를 넓히므로 이 task 안에서 하지 않는다"고 명시해 손대지 않았다. medium 이하(F-04~F-12)도 이번 라운드 대상이 아니다.

### F-01 — 월 이동 후 batch 상태 미동기화

- 원인: `useApplicationBatch`가 `savedApplied`·`pending`을 `useState(initialApplied)`로 마운트 1회만 파생했다. 월 이동은 `router.push`로 `month` searchParam만 바꾸고 `ScheduleView`에 `key`가 없어 컴포넌트·훅 인스턴스가 그대로 유지되므로, 새 달의 `schedules` prop이 들어와도 상태가 갱신되지 않았다.
- 수정: `schedules` prop이 참조 단위로 바뀔 때만 실행되는 `useEffect` 동기화를 추가했다. 새 프롭에 있는 날짜만 대상으로 ① `savedApplied`를 서버 진실(applicationStatus)에 맞춰 갱신하고 ② 그 날짜에 대해 사용자가 아직 손대지 않은(`pending`이 이전 `savedApplied`와 같던) 경우에만 `pending`도 같이 갱신한다. 새 프롭에 없는 날짜(다른 달)는 두 Set 모두 그대로 둔다 — 이것이 RADIO의 "월 이동 시 선택 유지"를 실제로 성립시키는 부분이다.
- `scheduleIdByDate`도 매 렌더 스코프의 `useMemo`에서 렌더 간 누적되는 `useRef<Map>`으로 바꿔, 현재 보이는 달이 아닌 이전 달에서 만든 선택도 저장 시 스케줄 id로 정확히 해석되도록 했다(review가 지적한 "조용한 누락" 원인 제거).

### F-02 — 차단 후 OPEN 아닌 셀의 pending 해제 불가

- 판단: `ScheduleView.tsx`는 수정하지 않았다. `apply-recruitment-changes.ts`의 `revalidatePath`가 성공·실패 모두에서 무조건 호출되므로(58행), 차단된 저장 시도 뒤에도 `/schedule`이 자동 리프레시되어 새 `schedules` prop이 들어온다 — 이 시점이 F-01과 동일한 동기화 지점이라, 같은 `useEffect` 안에서 함께 해소했다: 날짜의 최신 `status`가 `OPEN`이 아니면(사용자가 그 날짜를 직접 고쳤는지와 무관하게) `pending`을 서버 진실(`applicationStatus`)에 강제로 맞춘다. `저장 실패 시 로컬 선택 보존`(RADIO 기술 인수 조건 5)과 충돌하지 않는다고 판단한 근거: 그 문구는 실패한 batch 전체를 초기화하지 않는다는 뜻이지, 이미 선택 불가능해진(마감·취소된) 날짜의 유령 선택을 계속 붙들고 있어야 한다는 뜻은 아니다 — 오히려 그 유령 선택이 이후 저장을 계속 차단해 "선택 보존"의 취지(다른 유효한 선택들의 재제출 가능성)를 해쳤다. 여전히 OPEN인 날짜의 미저장 선택은 이 조건에서 전혀 건드리지 않는다. 이미 신청 완료된 날짜가 나중에 CLOSED로 바뀌는 경우도 `applicationStatus`가 여전히 applied이면 `pending`을 applied로 맞추므로 신청 자체는 보존된다(회귀 테스트로 확인).
- 별도의 [질문] 없이 진행했다 — 위 판단이 RADIO 문구의 의미를 바꾸는 것이 아니라 좁게 보강하는 것이라고 판단했다.

### F-05 — 월 이동·차단 복구 경계 테스트 공백 해소

- `useApplicationBatch.test.ts`에 `rerender`로 schedules를 교체하는 시나리오 4건을 추가했다: 월 이동 후 새 달 상태 반영+이전 달 미저장 선택 유지, 월 이동 후 저장 시 이전 달 선택도 함께 전송, OPEN 이탈 날짜의 pending 자동 정리, 이미 신청된 날짜가 CLOSED로 바뀌어도 신청 유지.
- `ScheduleView.test.tsx`에 컴포넌트 레벨 통합 테스트 1건을 추가했다 — 8월에서 날짜를 선택(미저장) → 9월로 rerender(9월 자체의 기존 신청 상태가 "신청"으로 정확히 표시되는지 확인) → 다시 8월로 rerender(미저장 선택이 유지되는지 확인). 이 테스트는 수정 전 코드에서 실제로 실패했다(9월 셀이 "신청" 대신 "신청 가능"으로 렌더).

### 검증

- RED→GREEN 실제 실행(신규 4건은 아래, 회귀는 전체 스위트로 확인):
  - `pnpm vitest run src/features/application/hooks/__tests__/useApplicationBatch.test.ts`: RED 2026-08-07T22:12:36Z(exit 1, 신규 3건 실패) → GREEN 2026-08-07T22:15:08Z(exit 0, 11건 전부 통과).
  - `pnpm vitest run src/views/schedule/ui/__tests__/ScheduleView.test.tsx`: RED 2026-08-07T22:13:56Z(exit 1) → GREEN 2026-08-07T22:15:13Z(exit 0, 7건 전부 통과).
- `pnpm typecheck`·`pnpm lint:ci` 통과(`ApplicationBatchSchedule`에 `status: RecruitmentScheduleStatus` 필드 추가, 테스트 픽스처 타입도 함께 갱신).
- `pnpm db:reset` 후 `pnpm verify` 전체(format → lint:ci → typecheck → vitest **154 files/927 tests**(922+신규 5) → harness:typecheck → harness:self-test → check:docs → build → check:app-build → check:client-secret-scan → test:e2e 32/32 → gate:all) 최종 실행: 시작 2026-08-07T22:17:09Z, 종료 2026-08-07T22:18:34Z, 종료 코드 0.
- 이번 라운드는 `src/features/application/hooks/useApplicationBatch.ts`·`__tests__/useApplicationBatch.test.ts`·`src/views/schedule/ui/__tests__/ScheduleView.test.tsx`만 바꿨다(마이그레이션·pgTAP·ScheduleView.tsx 본체는 무수정 — RADIO 변경 허용 경로 안, F-03 등 승인 범위를 넘는 항목은 손대지 않았다).
- 남은 [질문]: 없음.

### 다음 행동(수정 라운드 이후)

1. 이번 라운드에서 바꾼 파일만 전체 스테이징해 `P2-T03` task ID를 포함한 새 커밋을 만든다(amend 금지, push는 다음 담당자 몫).
2. F-03·F-04~F-12는 이번 라운드 범위 밖으로 남겨둔다 — 조정자가 후속 task 또는 재봉인 여부를 결정한다.

## 2026-08-08 · 교차 검증 재확인 수정 라운드(F-13 high 1건, 신규)

- 작업 식별자: P2-T03
- 근거: F-01·F-02·F-05는 opus·codex 전원이 해소를 인정했다. 재확인 과정에서 두 리뷰어가 독립적으로 같은 새 high 결함(F-13)을 발견해 전원 인정으로 확정됐다. 이번 라운드는 F-13 하나와, 같은 effect 안에서 함께 처리하라고 지시된 CANCELLED 필터 정합화만 다뤘다.

### F-13 — 월 이동 후 되돌리기가 다른 달의 기존 신청까지 철회한다

- 원인: 직전 라운드의 F-01 수정으로 `savedApplied`가 월 이동 시 다른 달의 기존 신청까지 흡수하게 됐는데, `executeUndo`는 저장 시점에 찍어둔 `lastUndo.previous`(그 시점의 savedApplied 전체 스냅샷)를 그대로 `submit()`에 넘겼다. `submit`은 `withdrawDates = savedApplied(현재) − target(그 스냅샷)`으로 차집합을 계산하므로, 스냅샷 이후 다른 달에서 새로 병합된 날짜(스냅샷엔 없고 현재엔 있는 날짜)가 전부 "철회 대상"으로 오분류됐다. 직전 라운드 전에는 `scheduleIdByDate`가 매 렌더 스코프였어서 다른 달 날짜의 id 해석이 실패해 조용히 빠졌는데, 이번 라운드에서 id를 `useRef`로 누적한 게 이 오분류를 실제 쓰기로 바꿔놓았다.
- 수정: Undo 메모리를 "저장 시점 전체 스냅샷"이 아니라 "그 저장이 실제로 바꾼 날짜만의 diff"로 바꿨다 — `UndoMemory.previousByDate: Map<날짜, 그 저장 이전 상태(applied 여부)>`. `executeUndo`는 **현재** `savedApplied`를 복제한 뒤 diff에 있는 날짜만 이전 상태로 되돌려 `target`을 만들고, 그 `target`을 평소의 `submit()` 경로로 보낸다 — 그러면 diff에 없는 날짜(다른 달의 기존 신청 등)는 target에도 현재 savedApplied와 동일하게 남아 `submit`의 차집합 계산에서 자연히 제외된다.
- RADIO 정합성: 불변 규칙의 "저장 성공 시 직전 저장 상태와의 **diff**를 클라이언트가 기억"이라는 문구가 이 방향을 직접 뒷받침한다고 판단했다. Data model의 "{이전 savedApplied, 이후 savedApplied} 쌍"은 개념적으로 diff와 동치다 — 두 스냅샷 중 실제로 다른 부분만 diff이고, 나머지(안 바뀐 날짜)는 이번 Undo 실행에 어차피 아무 영향을 주지 않으므로 diff만 남기는 것은 그 쌍이 담은 정보의 손실 없는 압축이다. 다른 달이 전혀 병합되지 않는(F-01 버그가 없던) 경우엔 이전 구현과 관찰 가능한 동작이 완전히 같고, 병합되는 경우에만 달라지는데 그 경우 이전 구현 쪽이 버그였다. 별도 [질문] 없이 진행했다.

### 함께 처리 — CANCELLED 필터 정합화

- 동기화 effect가 `schedules`를 필터 없이 순회했다. `ScheduleView.tsx`·`schedule-cell-state.ts`는 둘 다 `status !== "CANCELLED"`로 거른 뒤 날짜별 Map을 만드는데, 같은 근무일에 CANCELLED 1행 + 활성 1행이 부분 유니크 제약상 공존할 수 있어 effect도 필터 없이 돌면 배열 안 등장 순서에 따라 CANCELLED 행의 정보(옛 id·status·applicationStatus)가 활성 행의 정보를 덮어쓸 수 있었다. `scheduleIdByDateRef` 초기값·병합, `savedApplied`·`pending` 재동기화 세 지점 모두에 `schedule.status !== "CANCELLED"` 필터를 앞단에 적용해 세 곳(뷰·model·hook)의 판정을 일치시켰다. 동작 계약 변경이 아니라 정합화이고, review 시점 기준 실제 재현 경로는 없었다(opus 단독 발견, codex 판정 대기 중이었음).

### 검증

- RED→GREEN 실제 실행: `pnpm vitest run src/features/application/hooks/__tests__/useApplicationBatch.test.ts` — RED 2026-08-07T22:29:32Z(exit 1, 신규 2건 실패: F-13 재현·CANCELLED 정합 재현) → GREEN 2026-08-07T22:30:13Z(exit 0, 13건 전부 통과).
- `pnpm typecheck`·`pnpm lint:ci`·`pnpm format:check` 통과.
- `pnpm vitest run`(전체) 154 files/**929 tests**(927+신규 2) GREEN.
- `pnpm db:reset` 후 `pnpm verify` 전체 최종 실행: 시작 2026-08-07T22:31:32Z, 종료 2026-08-07T22:32:57Z, 종료 코드 0(vitest 929, e2e 32/32, gate:all 포함).
- 이번 라운드는 `src/features/application/hooks/useApplicationBatch.ts`·`__tests__/useApplicationBatch.test.ts`만 바꿨다.
- 남은 [질문]: 없음.

### 다음 행동(F-13 라운드 이후)

1. 이번 라운드에서 바꾼 두 파일만 전체 스테이징해 `P2-T03` task ID를 포함한 새 커밋을 만든다(amend 금지, push는 다음 담당자 몫).

## 2026-08-08 · 교차 검증 재확인 마이크로 수정 라운드(R3-01 CANCELLED 정렬 잔여 2건)

- 작업 식별자: P2-T03
- 근거: F-13은 리뷰어 전원이 해소를 인정했다. 그러나 R3-01(CANCELLED 정렬)은 codex가 "미해소"로, opus도 같은 잔여 지점을 지적해 04cb123 수정이 필터를 effect·id 맵에만 적용하고 두 경로를 놓쳤다고 확정했다.

### 잔여 경로 ① — 마운트 파생 미필터

- 원인: `initialAppliedSet`(마운트 시 `savedApplied`·`pending` 초깃값을 만드는 함수)이 `status`를 보지 않고 `applicationStatus === "applied"`만으로 걸렀다. 같은 근무일에 CANCELLED(applicationStatus applied) 행과 OPEN(신청 없음) 행이 첫 렌더부터 공존하면, 동기화 effect는 `schedules` prop 참조가 "바뀔 때만" 도는데 마운트 시점엔 참조가 바뀔 일이 없어 이 유령 상태가 전혀 교정되지 않았다.
- 수정: `initialAppliedSet`에도 `schedule.status !== "CANCELLED"` 필터를 `applicationStatus === "applied"` 조건과 함께 적용했다 — effect·id 맵에 이미 적용한 것과 같은 필터를 마운트 경로에도 맞췄다.

### 잔여 경로 ② — CANCELLED만 남은 날짜의 pending 정리 우회

- 원인: 직전 커밋에서 `activeSchedules`(CANCELLED 제외)만 순회하도록 바꾸면서, 그 날짜에 활성 행이 하나도 없는(=CANCELLED 행뿐인) 날짜는 순회 대상에서 통째로 빠졌다. 그런 날짜는 F-02가 고쳤던 "OPEN 아니면 서버 진실로 강제 정리" 분기를 아예 타지 않아, 사용자가 OPEN이었을 때 만든 미저장 pending이 영원히 남았다. 달력은 이런 날짜를 `모집 없음`/none·disabled로 그리므로 되돌릴 UI 수단이 없고, 저장 시도마다 같은 날짜가 계속 포함돼 반복 차단된다 — F-02가 이미 확정했던 막다른 상태가 CANCELLED 단독 상태에 대해 재발한 것이다.
- 수정: effect 안에서 "이 schedules 스냅샷에 CANCELLED 행만 있고 활성 행이 없는 날짜" 집합(`cancelledOnlyDates`)을 별도로 계산해, 그 날짜들은 `hadOwnEdit` 여부와 무관하게 `nextSaved`·`nextPending`에서 무조건 제거한다(서버 진실 = 신청 없음). 활성 행이 있는 날짜의 로직(월 이동 시 미저장 선택 유지 등)은 전혀 건드리지 않았다.

### 검증

- RED→GREEN 실제 실행: `pnpm vitest run src/features/application/hooks/__tests__/useApplicationBatch.test.ts` — RED 2026-08-07T22:39:50Z(exit 1, 신규 2건 실패: 마운트 시점 CANCELLED 공존·CANCELLED만 남은 날짜 pending 미정리) → GREEN 2026-08-07T22:40:29Z(exit 0, 15건 전부 통과).
- `pnpm typecheck`·`pnpm lint:ci`·`pnpm format:check` 통과.
- `pnpm vitest run`(전체) 154 files/**931 tests**(929+신규 2) GREEN.
- `pnpm db:reset` 후 `pnpm verify` 전체 최종 실행: 시작 2026-08-07T22:42:13Z, 종료 2026-08-07T22:43:35Z, 종료 코드 0(vitest 931, e2e 32/32, gate:all 포함).
- 이번 라운드도 `src/features/application/hooks/useApplicationBatch.ts`·`__tests__/useApplicationBatch.test.ts`만 바꿨다.
- 남은 [질문]: 없음.

### 다음 행동(R3-01 라운드 이후)

1. 이번 라운드에서 바꾼 두 파일만 전체 스테이징해 `P2-T03` task ID를 포함한 새 커밋을 만든다(amend 금지, push는 다음 담당자 몫).

## 2026-08-08 · 검증 종료 · done 전환 (조정자 기록)

- 교차 검증(opus·codex) 확정 발견 14건: 1차 12건 + 재확인 라운드 2건(F-13 Undo 범위·R3-01 CANCELLED 정렬).
- 수정 라운드 3회(`2dd0d42` → `04cb123` → `f06cfb9`)로 high 3건(월 이동 미동기화·차단 후 해제 불가·Undo 범위)과 medium 2건(테스트 공백·CANCELLED 정렬)을 해소 — 매 라운드 리뷰어 전원 재확인, 마지막 라운드 양쪽 모두 "해소·새 결함 없음".
- 미해결 9건(high 1·medium 7·low 1)은 `docs/execution/reviews/P2-T03-review.json`(최종 점수 84) 정본, medium·low는 backlog 누적.
- **미해결 high 1건(DB 경계 batch 상한)은 수정이 승인 범위 밖이라 사용자 결정 대기** — EXECUTE 하드닝 low·P2-T02 동일 공백과 묶은 후속 하드닝 task를 추천한 상태.
- 리팩토링 단계: 수정 라운드가 이미 구조 정렬(Undo diff화·CANCELLED 필터 3지점 일치)을 수행했고, 추가 정리는 동작 위험 대비 이득이 없어 backlog로 이관(셀 판정 이원화 등). 검증 GREEN 유지 확인.
- 후속 참고(opus 관찰, 결함 아님): 동기화 useEffect가 id 맵 누적·savedApplied 정렬·편집 보존 가드·CANCELLED 정리 네 책임(약 50줄)을 담게 됐다. P2-T04가 마감·재오픈 전이를 붙일 때 순수 함수 분리가 읽기·검증에 유리하다.
- index: P2-T03 `in_progress → done`(2026-08-08). 커밋·검증 증거는 이 파일 위 절들과 tdd.json이 정본.
