# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**랄프 루프가 이어진다 — 다음 첫 수는 `schedule-worker`, 그 뒤 `schedule-admin`이다.** 화면 task 넷(`profile-form`·`members-pending`·`profile-screen`·`members`)이 「spec approved + `expo-scaffold` 실기기 확인 미완」 조건에서 닫혔고, 「전체 기능 구현해」(2026-09-27)가 그 조건을 유지한 채 계속 가라는 지시라 `schedule-worker`·`schedule-admin`을 `ready`로 올렸다 — 둘의 선행 `schedule-data`는 done이고 `expo-scaffold`의 남은 것은 실기기 확인뿐이다. 둘은 나란히 갈 수 있고 달력 그리드는 먼저 merge되는 쪽이 만든다. 실기기 확인은 여전히 사람 자리로 남는다(카탈로그·화면 여섯·테마·e2e 플로우 열 남짓 전부 한 번도 기기에서 안 돌았다).

**`members`가 `done`이다(#422).** DB 함수 넷(`set_display_name`·`set_role`·`mark_leave`·`undo_leave`)과 마지막 관리자 셈을 한 자리에 둔 `is_last_admin`이 섰다. `mark_leave`의 남은 배정 검사(`has_future_assignments`)는 `schedule-data` plan AC-11이 넘긴 몫을 여기서 넣었다 — `assignments` 표는 그때 이미 섰지만 함수 자체가 없어 떠돌던 검사였다. **관찰 020이 여기서 정리됐다** — `members-pending`의 가입 대기·차단 읽기를 `useMembers(client, kind)`로 옮겨 목록 넷(재직·퇴사·가입 대기·차단)이 `['members']` 아래 한 쿼리 접두사를 쓴다. `SheetLayer`·`FloatingToast`가 「나」·가입 대기에 이어 직원 화면까지 슬라이스 셋째로 겹쳐 `src/shared/ui`로 승격했다(`components.md`에 「시트 겹과 떠 있는 토스트」 절 추가). 배정 목록과 「외 n건」은 못 넣었다 — 그 값을 읽을 DAL이 없고 새 DAL은 integration 테스트가 먼저 있어야 세울 수 있는데 계획에 배정이 없었다.

**`profile-screen`이 `done`이다(#420).** 저장소의 첫 서버 상태 훅 셋(`useMyProfile`·`useUpdateContact`·`useUpdatePhoto`)이 `src/features/profile/model/`에 섰다 — `client: Db`를 주입받아 `useQuery`·`useMutation`을 감싸고 테스트는 `renderHook` + `QueryClientProvider` 래퍼다. `test-planner` 정의문에 「서버 상태 훅의 unit 행 필수」가 들어갔고 이 task가 그 꼴을 처음 세워 `members`가 나머지 화면의 읽기를 같은 꼴로 옮겼다. 정본 모순 셋을 착수 전에 판정했다 — 연락처 저장은 응답 대기(낙관적으로 먼저 안 칠한다), `profile_private` 직접 갱신의 check 위반은 `invalid_phone`으로 바꾼다(RLS가 남의 행을 0행으로 돌려주는 자리는 `count: "exact"`로 갱신 행 수를 받아 0이면 `TransportError`), 「나」도 카드 셋(사진·이름·잠긴 둘·연락처 / 설정 / 로그아웃) 위에 선다. **화면 좌우·시트 안쪽 여백을 `px-5`로 일괄 맞췄다** — `spacing-shape.md` 정본(ADR-014가 24에서 20으로 내림)과 화면 문서 셋(`members-pending.md`·`admin-home.md`·`profile.md`)이 `px-6`으로 어긋나 있었다. 훅 파일 이름이 처음 생기며 `file-naming`과 `tdd-guard-unit`이 다른 짝 이름을 요구해 `file-naming`이 `__tests__/` 짝을 대상의 갈래로 보게 됐다.

**`members-pending`이 `done`이다(#418).** `test-planner`가 정본 모순 다섯을 냈고 착수 전에 판정했다 — `already_decided` 하나(`already_approved` 폐기, 「제출됨」은 `submitted_at not null`까지), 읽기 RLS는 그대로, 사진 없음은 `Avatar` 기본, 목록은 카드 한 장, e2e 파일 충돌은 슬라이스 디렉터리로 피함. `block_member`·`unblock_member`가 서면서 판정 셋의 실패 코드가 `already_decided` 하나로 모였다. 구현 중 `profile_private.email` 열이 없던 것이 드러나 `submit_profile`이 적게 했고, `is_admin()`이 퇴사·차단된 관리자를 거짓으로 보게 고쳤다. **`useQuery`를 못 앉혔다** — `dumb-ui`가 `.tsx`에서 막고 `.ts`는 짝 테스트 없이 못 쓰는 틈으로 목록 읽기가 `useEffect` + DAL로 샜다([관찰 020](observations/020-query-hook-has-no-tdd-home.md), `members`가 정리).

**`profile-form`이 `done`이다(#416).** `/pending`·`/left`·`/blocked`·`/retry` 넷이 `src/screens/<slice>/ui/*Screen.tsx`에 서고 `src/app/*.tsx`는 한 줄짜리 얇은 라우트다. 화면에 필요한 모양이 조각에 없으면 조각에 prop을 더했다 — `Text`(`size`·`tone`·`weight`·`numeric`)·`Badge`(`size`·`dot`)·`Screen`(`floor`)·`Divider`·`CelebrationCircle`. 서버 코드 `invalid_name`·`invalid_gender`와 `avatars` 버킷(공개 읽기, 1MB)이 섰다. **e2e 세션은 개발 빌드의 테스트 문으로 심는다** — `src/app/__test/session.tsx`가 딥링크로 토큰을 받아 세션을 세우고, `scripts/e2e-seed-server.mts`가 로컬 Supabase에 사용자를 만들어 토큰을 낸다. Maestro 빌드가 없어 e2e 다섯은 미실행이다.

**`ui-kit`이 `done`이다(#414).** `src/shared/ui/` 조각 서른셋, `src/app/_catalog.tsx`, eslint 규칙 19(화면 파일의 색·글자·모양 유틸을 막는다), `pnpm tossface:fetch`, Jest가 `logic`·`components` 두 갈래(`jest.projects.js`). 이후 화면 task 넷 전부가 이 조각과 규칙 19 위에서 진행됐다.

**자동 리뷰가 코멘트 없이 초록인 자리가 두 번째로 났다(관찰 019, #420).** 규칙·리뷰 잡은 안 건드리고 지켜보는 단계다.

**루프가 사람을 부르는 자리 셋은 그대로다.** 실기기 확인(카탈로그 눈 확인, expo-scaffold의 남은 AC, iOS는 개발 빌드가 서야), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더.

**남긴 이슈 몇 자리.** `members-pending`의 구분선 들여쓰기(화면 문서 「이름 왼쪽 끝부터」 vs `components.md` 「왼쪽 콘텐츠 시작 지점부터」)는 공용 조각이 뒤를 따르는 채로 남았다. 연락처 저장 실패 문안이 `profile.md`에 없어 가입 대기 화면 문구를 그대로 썼다. writer가 쓴 훅 테스트의 `jest.fn()` 타입 인자를 implementer가 붙였다(`jest.fn<(...args: unknown[]) => Promise<unknown>>()`, 단언은 안 건드림). `file-naming`의 훅 판정 새 가지에 단위 테스트가 없다.

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 스물하나 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. 남은 화면 task 둘(`schedule-worker`·`schedule-admin`)의 병목은 spec이 아니라 선행 task와 실기기 확인이다.

**test-planner가 정본 모순을 명시로 낸다.** `members-pending`·`profile-screen`이 착수 전에 정본 모순을 냈고 총괄이 판정해 정본을 먼저 고친 뒤 구현이 그 위에 섰다 — 이 순서(모순 판정 → 정본 수정 → 구현)가 화면 task 파이프라인에서 반복 확인됐다.

**서버 상태 훅의 정착지가 정해졌다.** `src/features/<영역>/model/use<이름>.ts` + `client: Db` 주입 + `renderHook`/`QueryClientProvider` 테스트가 꼴이다. `pending`·`members-pending`의 `useEffect` 읽기가 이 꼴로 다 옮겨져서, 남는 화면 task가 새로 읽기를 짤 때 이 꼴을 그대로 쓴다.

**여백 정본이 `px-5`로 일괄 정리됐다.** ADR-014가 24에서 20으로 내린 값을 화면 문서 셋이 못 따라가고 있었고 `profile-screen`에서 코드·문서를 같이 맞췄다. 새로 화면 문서를 쓸 때 `px-6`이 남아 있으면 옛 값이다.

**`SheetLayer`·`FloatingToast`가 `src/shared/ui`로 승격했다.** 슬라이스 셋(「나」·가입 대기·직원)이 겹쳐서 옮긴 것이라 이후 화면이 시트 겹이나 떠 있는 토스트가 필요하면 새로 만들지 않고 이 조각을 쓴다.

**관찰 019·020이 이번 회차에 하나씩 진행됐다.** 019(자동 리뷰가 코멘트 없이 초록)는 두 번째로만 나서 지켜보는 중이다. 020(서버 상태 훅에 TDD 정착지가 없던 것)은 `test-planner` 정의문 갱신과 `members`의 정리로 판정까지 닫혔다.

회차 기록은 `docs/log/2026-09-27.md`다. 그 앞 [2026-09-23](log/2026-09-23.md)이 spec 양식·화면 task 스물의 승인·e2e 러너 확정·lint 규칙 표·관리자 홈 분리를 다뤘고, 이번 회차는 룩앤필을 토스 홈 기준으로 옮긴 뒤(#409~#413) 랄프 루프로 화면 task 넷을 차례로 닫은 것이다(#414~#422).

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
