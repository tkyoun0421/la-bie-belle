# P3-T02 handoff

## 2026-08-09 · 개발 단계 착수 직후 안전 중단 (blocked)

- 작업 식별자: P3-T02 (포지션 기본 설정과 스케줄 필요 인원)
- 현재 단계: 개발(3단계) 착수 직후 안전 중단 → 다음 설계(2단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-08T15:32:48Z

### 확정된 사실

- RADIO `docs/execution/radio/P3-T02-radio.md` revision 1, SHA-256
  `fd9bfbb75b97af146c529875bf00a9923ca1cb920de1f1cdb2b1847452b455be`는 index의
  `development_approval`과 일치하고 `gate:radio` 통과 상태다. 봉인 본문은 이번 세션에서 수정하지 않았다.
- RADIO 범위 ④·Architecture 절이 요구하는 "admin 허브 진입 링크 1개"는 `src/app/(protected)/admin/page.tsx`
  (가입 승인·역할 관리·근무자 관리·모집 오픈 4개 링크가 인라인으로 나열된 유일한 허브 파일)를 편집해야 이행할 수
  있는데, 이 파일은 RADIO의 변경 허용 경로 코드펜스(`admin/positions/**`·`admin/schedule/**`·`views/admin/**`
  등) 어디와도 일치하지 않는다. 근거·전례 비교는 `docs/execution/runs/P3-T02/decision-signal.json`에 남겼다.
- 이 gap은 기술 인수 조건 1~8과는 직접 충돌하지 않는다 — 마이그레이션·함수 3종·트리거·포지션 관리 화면·준비 화면
  필요 인원 절·pgTAP·E2E는 모두 RADIO 허용 경로 안에서 계획대로 구현 가능하다. 막힌 부분은 허브 링크 1개뿐이다.
- 유사 전례: P1-T04 revision 2(허용 경로 누락 한 줄을 "사용자 재량 없는 보정"으로 development_approval만
  다시 받아 보정), P2-T05 revision 3("개발 착수 스코프 갭 해소 재봉인, 파일 한정"), P1-T05는 애초
  `src/app/**` 전체를 허용 경로에 포함해 이 문제를 원천적으로 피했다.
- 이번 세션에서 `src/`·`supabase/` 아래 코드·마이그레이션은 한 줄도 작성·스테이징하지 않았다. RADIO·기획
  (`2026-08-09-p3-t02-planning.md`)·설계(`2026-08-09-p3-t02-design.md`) 인터뷰 handoff와 기존 산출물
  (P0-T03 스키마, P1-T05 positions 정책, P3-T01 준비 화면·`get-schedule-prep.ts`, `04-rls-default-deny.test.sql`,
  `17-ceremony-schema.test.sql`)을 읽는 조사만 수행했다.

### 미결 사항

- `src/app/(protected)/admin/page.tsx`를 P3-T02 변경 허용 경로에 추가하는 재봉인(파일 한정)을 승인할지,
  아니면 이번 task 범위에서 허브 링크를 제외하고 후속으로 미룰지 — 결정 주체: 사용자(조정자 경유), 반환 단계:
  설계(development_approval 재승인). 선택지별 트레이드오프는 `decision-signal.json`의 `open_questions`에
  정리했다.

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인한다(파일 한정 추가면 revision 2,
   development_approval만).
2. 재승인 후 개발 루프가 P3-T02를 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션은 코드 작업물이 없어
   이어받을 격리 작업물이 없다 — 다음 세션은 이 handoff와 decision-signal만 읽고 처음부터 구현을 시작하면 된다.
   구현 순서 메모(재개 시 참고): ①`supabase/migrations/<ts>_position_requirements.sql`(테이블·RLS·함수 3종
   ·트리거) + `supabase/tests/18-position-requirements.test.sql` ②`src/entities/position/`·
   `src/entities/schedule/api/list-schedule-requirements.ts` ③`src/features/position/`·
   `src/features/requirement/` ④`/admin/positions` 화면과 준비 화면 필요 인원 절 ⑤`tests/e2e/position-requirements.spec.ts`
   ⑥재봉인이 승인되면 admin 허브 링크.

### 증거·산출물 경로

- `docs/execution/runs/P3-T02/decision-signal.json`
- `docs/execution/radio/P3-T02-radio.md` (봉인 본문 무수정 확인)
- `src/app/(protected)/admin/page.tsx`(허브 링크 목록 확인)
- `supabase/migrations/20260807020000_identity_worker_management.sql`(positions 정책·시스템 보호 트리거)
- `src/entities/schedule/api/get-schedule-prep.ts`·`src/app/(protected)/admin/schedule/[id]/page.tsx`
  (P3-T01 준비 화면 산출물 확인)

## 2026-08-09 · 개발 단계 완료

- 기준 시각: 이 절 작성 시점, revision 2 재봉인 커밋(`907236b`) 위에서 이어 구현
- RADIO `docs/execution/radio/P3-T02-radio.md` revision 2, SHA-256
  `7f9601daba3ef32c81c670a962509c61bafd16d7dbc7a4a2eb18c581e1613ff2` — index의 `development_approval`과 일치.

### 구현 순서(위 미결 사항 해소 후 실제로 밟은 순서)

1. `supabase/migrations/20260809000000_position_requirements.sql` + `supabase/tests/18-position-requirements.test.sql`
   (pgTAP 75건). `04-rls-default-deny.test.sql`의 `positions` 정책 수 단언을 1→4로 갱신(RADIO가 명시적으로 허용한
   F-08 교훈, `runs/P3-T02/radio.md`에 문서화 완료).
2. `src/entities/position/`(model·api)·`src/entities/schedule/`에 `requirement-manage.ts`(model)·
   `list-schedule-requirements.ts`(api)·`ensure-schedule-requirements-copied.ts`(api, 신규 — 아래 참고) 추가.
3. `src/features/position/`(api·hooks)·`src/features/requirement/`(api·hooks) — Server Action 3+3개, 편집 상태
   훅 2개.
4. `src/features/position/ui/`(`PositionList`·`PositionEditSheet`)·`src/features/requirement/ui/`
   (`RequirementTable`·`MissingPositionsBanner`), `src/views/admin-positions/ui/AdminPositionsView.tsx` +
   `src/app/(protected)/admin/positions/page.tsx`, `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx` 확장 +
   `src/app/(protected)/admin/schedule/[id]/page.tsx` 확장(기존 예식 흐름 무수정, 새 절만 추가).
5. `tests/e2e/position-requirements.spec.ts`(인수 조건 7 — 자동 반영·기본값 변경 불변·비활성화 배제).
6. `src/app/(protected)/admin/page.tsx`에 "포지션 관리" 링크 1개 추가(다른 줄 무수정, diff로 확인 완료).

### 구현 중 발견해 즉시 해결한 이슈(설계 재해석이 아니라 프레임워크 제약)

- **Next.js 16 `revalidatePath` 렌더 중 호출 금지.** `features/requirement/api/copy-requirements.ts`
  (Server Action, 내부에서 `revalidatePath` 호출)를 준비 화면 page.tsx의 렌더 안에서 직접 `await`하면
  `used "revalidatePath ..." during render which is unsupported` 예외가 실제로 발생했다(재현·수정·재검증
  완료). `revalidatePath`를 부르지 않는 `src/entities/schedule/api/ensure-schedule-requirements-copied.ts`를
  새로 만들어 렌더 시점 첫 진입 복사에 쓰고, 기존 `copyRequirements` Action은 RADIO Architecture가 지정한 대로
  그대로 남겼다. 근거는 `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`와
  실제 소스(`node_modules/next/dist/esm/server/web/spec-extension/revalidate.js`)로 확인했다. 상세는
  `runs/P3-T02/radio.md` 2번 항목.
- **P3-T01 예식 E2E와의 셀렉터 충돌(RADIO 위험 절이 예견한 위험이 실제로 발생).** `pnpm test:e2e` 전체 실행 중
  `tests/e2e/ceremony-edit.spec.ts`가 `getByRole("button",{name:"저장",exact:true})` strict mode 위반으로
  깨졌다 — 내가 새로 추가한 `RequirementTable`의 행별 "저장" 버튼이 기존 예식 섹션의 단일 "저장" 버튼과 텍스트가
  겹쳤기 때문이다. 예식 컴포넌트·예식 E2E 파일은 무수정, 내 컴포넌트 라벨만 "인원 저장"/"인원 삭제"로 바꿔
  해결했다. 재검증(`pnpm test:e2e` 전체 39건 재실행)으로 회귀 없음을 확인했다. 상세는 `runs/P3-T02/radio.md`
  3번 항목.

### 검증 결과

- `pnpm verify` 전체 GREEN(포맷·lint·typecheck·unit 191 files/1165 tests·harness self-test 308·check:docs·
  build·app-build·client-secret-scan·E2E 39/39·gate:all).
- `pnpm db:reset && pnpm db:test` GREEN(18 files, 904 assertions, `18-position-requirements.test.sql` 75건 포함).
- `tests/e2e/position-requirements.spec.ts`는 연속 재실행(같은 DB 상태, db:reset 없이 2회)으로 재실행 내성을
  확인했다.
- TDD RED→GREEN 증거는 `docs/execution/runs/P3-T02/tdd.json`(pgTAP 1쌍 + unit 9쌍, 전부 실제 명령 실행
  출력에서 기록).

### 구현 중 확정한 세부와 미결 사항 처리

- `docs/execution/runs/P3-T02/radio.md`에 전부 기록했다(정책 수 단언 갱신, 렌더-중-revalidatePath 회피,
  예식 E2E 셀렉터 충돌 회피, copy/set/remove의 CONFIRMED 처리 차이, 화면 모드 재사용, 렌더 시점 복사 가드,
  Chip 위젯 선택 — 총 7개 항목).
- RADIO의 유일한 미결 사항(확정 스케줄 수동 추가 개방·추가 시점 모달)은 P3-T06 소유로 손대지 않았다.

### 다음 단계

- 4단계(검증) — 교차 검증(`opus`·`codex`)과 인수 조건 증거 등록은 조정자가 이어 진행한다. status는
  `in_progress`로 유지했다(3~5단계는 하나의 in_progress 구간).
- push는 하지 않았다 — ci-finisher 소유.
