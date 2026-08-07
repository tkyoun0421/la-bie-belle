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
