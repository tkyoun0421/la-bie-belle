# P3-T07 RADIO 적용 결과

- 기준 RADIO: `docs/execution/radio/P3-T07-radio.md` revision 2, SHA-256
  `fa3c7d7d7beb8bac3d7c6d631d5aba06787d6e779fec4c56aad5336a5e0a2eba`(index.jsonl
  `development_approval`과 재개 시점 대조 완료, 일치).

## 정지 조건 이력(개발 단계 중 1회 발동·해소)

RADIO Requirements 절이 명시한 정지 조건 3개와는 별개로, 일반 규칙("허용 경로 밖 파일을 건드려야
하면 멈춘다")이 개발 초반에 발동했다.

- **발동 지점**: RADIO(revision 1) 전제·Optimizations 절은 "예정 출퇴근 시각은 페이지가 이미 가진
  기존 조회를 재사용한다"고 적었지만, 실제로 `listRecruitmentSchedules`
  (`src/entities/schedule/api/list-recruitment-schedules.ts`)의 select 컬럼에는
  `planned_checkin`·`planned_checkout`이 없었고, 근무자가 예정 시각을 읽는 별도 경로도 저장소에
  없었다. 이 데이터를 조달하려면 변경 허용 경로 밖 파일(`list-recruitment-schedules.ts`, 캘린더
  공용 조회) 수정이 필요해 보였다.
- **반환**: `[질문]`으로 turn을 끝내며 상황·근거(파일 경로 인용)와 선택지 4개(캘린더 공용 조회를
  허용 경로에 추가 / RPC 응답 최상위에 예정 시각 키 추가 / 이번 task 범위에서 예정 출퇴근 표시 생략 /
  조정자 판단)를 제시했다. `index.jsonl`은 이 시점에 `in_progress`로 전환하지 않고 `planned`로 뒀다.
- **해소**: 조정자가 사용자 승인으로 RADIO를 revision 2로 재봉인했다(커밋 `9476b2e`). 결정: 예정
  출퇴근 시각은 `get_confirmed_roster` 반환 jsonb 최상위 키(`planned_checkin`·`planned_checkout`)로
  함께 반환한다 — 확정 스케줄은 LB027 차단 덕에 예정 시각이 항상 있다는 전제로 `listRecruitmentSchedules`는
  전혀 건드리지 않는다. 새 SHA-256을 index.jsonl `development_approval`과 대조해 일치를 확인한 뒤
  구현을 재개했다.
- RADIO Requirements 절이 명시한 정지 조건 3개는 전부 발동하지 않았다: (1) 기존 pgTAP·단위·e2e
  단언이 관리자 준비 화면 포지션 순서를 고정해 정렬 적용과 충돌 — `list-schedule-requirements.test.ts`는
  허용 경로 안이라 전면 갱신했고, `admin-schedule` 쪽에 순서를 하드코딩한 단언은 없었다. (2)
  `src/shared/ui/**` 변경 필요 — `Badge`·`Button`·`cn`을 기존 형태 그대로 재사용했고 한 글자도
  고치지 않았다. (3) `src/views/home/**` 변경 필요 — 아래 "구현 중 확정한 세부" 2번 참고, 완전히
  분리된 병렬 타입 체계로 피했다.

## 구현 중 확정한 세부(설계 재해석이 아닌 구체화)

1. **RPC 반환 구조는 revision 2 계약 그대로다.** `get_confirmed_roster`는
   `jsonb_build_object('planned_checkin', …, 'planned_checkout', …, 'ceremonies', …, 'roster', …)`를
   반환하고, roster 행은 `name`·`position_name`·`sort_order`·`is_trainee`·`is_self` 5개 필드뿐이다.
   정지 조건 해소 후 작성한 첫 파일(마이그레이션)부터 새 계약을 반영했다.
2. **home mock 표면을 건드리지 않으려고 완전히 새로운 병렬 타입 체계를 만들었다.**
   `src/views/home/**`가 허용 경로 밖이고, `home.mock.ts`가 `CONFIRMED_WITH_CHANGE.changeSummary`를
   통해 `confirmation.mock.ts`(`ScheduleConfirmation`/`AssignmentRosterRow`)에 간접 의존한다. 이
   task는 그 파일들을 한 글자도 고치지 않고, `src/entities/schedule/model/confirmed-roster.ts`(신규
   `ConfirmedRosterRow`/`ConfirmedRoster` 타입)와 `confirmed-roster.mock.ts`(신규 mock 3종)를 만들어
   `ScheduleDetailView`만 새 타입을 쓰도록 분리했다. RADIO의 "home이 소비하는 mock 표면은 유지한다"
   지시를 코드로 그대로 옮긴 것이다.
3. **stagger 애니메이션 순서를 UI가 아니라 model에서 계산한다.** `ScheduleDetailView.tsx`에서 렌더
   중 `let staggerIndex = 0; staggerIndex += 1;` 방식으로 `--stagger-index`를 매기려 했으나, React
   Compiler 대응 ESLint 규칙 `react-hooks/immutability`가 렌더 클로저 안의 mutable 지역 변수 재할당을
   막았다. RADIO는 애니메이션 순서를 명시하지 않았으므로, "화면 로직은 model에" 원칙에 따라
   `roster-groups.ts`의 `buildRosterGroups`가 그룹 생성 뒤 전체 표시 순서를 가로질러 각 멤버에
   `displayIndex: number`를 순수 계산으로 부여하도록 했다(`withDisplayIndex` 헬퍼, `Map` 기반 object
   identity 매칭). UI는 `member.displayIndex`를 그대로 읽기만 한다.
4. **AC9(관리자 준비 화면 정렬)은 `list-schedule-requirements.ts`의 서버 코드 정렬만으로 충족되고,
   `src/views/admin-schedule/**` 자체는 한 글자도 고치지 않았다.** `AdminSchedulePrepView.tsx`의
   `requirementRows.map()`(읽기 전용 렌더)과 `useRequirementEditor`의 `rows`(`useState(initial.rows)`,
   순서 보존)는 이미 `listScheduleRequirements`가 반환하는 순서를 그대로 반영한다. 코드 확인으로
   추가 수정이 불필요함을 검증했고, `list-schedule-requirements.test.ts`의 정렬 단언 2개(AC5·9,
   AC5 경계값)를 AC9의 unit 증거로 삼았다. RADIO가 "포지션 정렬 적용에만 쓰고"라고 한정한 이
   경로를, 실제로는 아예 쓰지 않는 것으로 판단했다.
5. **`/schedule/[id]` 라우트의 `id`는 work_date 문자열이지 스케줄 UUID가 아니다.** 기존 라우트
   구현(`WORK_DATE_PATTERN` 검사)과 다른 e2e spec(`motion.spec.ts`·`recruitment-flow.spec.ts`)의
   선례를 그대로 따라 `tests/e2e/schedule-roster.spec.ts`도 `goto(`/schedule/${workDate}`)`를
   쓴다 — RADIO 문면에 라우트 파라미터 형식이 명시되지 않아, 기존 코드 대조로 확정했다.

## 위험 기반 테스트 매트릭스 반영(실증 근거)

RADIO 위험 표 8행(1 필드 경계, 2 열람 권한, 3 상태 게이트, 4 그룹 내용, 5·9 정렬, 6 응답 매핑,
7 그룹 계산, 8·10 화면) 전부를 아래 계층에서 실행해 확인했다.

- `supabase/tests/22-confirmed-roster.test.sql`(pgTAP 42문항): 스키마 3·시드 9·권한 4·상태 게이트
  4·필드 경계 12·그룹 내용 6·정렬 3·is_self 경계 1 — AC1~5 전부.
- `src/entities/schedule/api/__tests__/get-confirmed-roster.test.ts`(5문항): 성공 매핑,
  42501·LB031·22023·기타 오류 매핑 — AC6.
- `src/views/schedule-detail/model/__tests__/roster-groups.test.ts`(10문항): 정식/교육생 분리, 겸직
  중복 등장, 담당자 없음 경계, 빈 입력, 정렬, 본인 표시, 내 배정 추출, displayIndex — AC7.
- `src/views/schedule-detail/ui/__tests__/ScheduleDetailView.test.tsx`(11문항): 포지션 그룹 렌더,
  겸직 중복, 내 배정 배지, 미배정 근무자 섹션 부재, 교육 배지.
- `src/entities/schedule/api/__tests__/list-schedule-requirements.test.ts`(17문항, 정렬 2문항 신규):
  AC5·AC9 정렬(동률 이름순 보조 정렬 포함).
- `tests/e2e/schedule-roster.spec.ts`(2 test): AC8(포지션 그룹·내 배정·교육 구분·미배정 근무자의 내
  배정 섹션 부재), AC10(OPEN 직접 진입 시 모집 중 안내, 배정표 미노출).

## 정지 조건 밖에서 함께 정리한 것

`tests/e2e/schedule-roster.spec.ts` 작성 중 프로젝트에 선례가 없는 `locator("..")` (XPath 부모 탐색)
패턴을 썼다가, 기존 spec들이 쓰는 `.filter({ has })` 관례로 교체했다. `AC10` 테스트의
`getByText("모집 중")`도 heading·배지·본문 3곳에 동시에 매치되는 strict mode violation이 있어
`getByRole("heading", ...)`로 좁혔고, `AC8`의 `getByText("교육")`도 임의 생성된 교육생 이름
(`교육생배정-...`)과 부분 일치해 `{ exact: true }`를 추가했다. 모두 스펙 파일 자체의 버그
수정이며 RADIO 계약이나 프로덕션 코드와는 무관하다.
