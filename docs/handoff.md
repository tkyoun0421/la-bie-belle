# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 AC-12의 남은 여덞 열이고 처음 병렬이 된다.** 본보기 열(게이트 셋)이 끝나 controller의 꼴이 박혔으니 근무표·급여·구성원·근태·알림·리허설·통계·QR을 worktree로 떼어 같이 돈다 — 열마다 본보기 PR을 받아 같은 모양으로 세운다. 열 안에서 하는 일은 넷이다: 남은 세션 읽기 아홉(`src/app/` 셋 · 화면 다섯, `PendingScreen`이 둘)을 `useSessionUserQuery`로, 로그아웃 둘(`profile`·`pending`)을 `useSignOutMutation`으로 돌리고, 에러 코드 판정 열다섯을 `model`로 내리고, `.tsx`의 로컬 문안 표를 `consts`로 보내고, 큰 파일을 책임으로 쪼갠다(`DayDetail` 969줄 · `PendingScreen` 689줄 · `StatsScreen` 470줄 · `AdminStatsScreen` 417줄). 그 안에 든 과제 둘을 잊지 않는다: `AdminHomeScreen.tsx`가 `new Date()`를 두 자리에서 그대로 읽는 것(나머지 여섯 화면은 서버 시계를 쓴다)과 근태 쓰기 셋(`checkIn`·`submitExcuse`·`decideExcuse`)에 Mutation이 없어 `.tsx`가 저장소를 직접 부르는 것이다.

**본보기 열이 끝났다 — AC-12의 꼴이 박혔다.** 아홉 열을 동시에 띄우면 controller가 아홉 모양으로 서서, 작은 열 하나(blocked·left·retry)를 먼저 직렬로 세웠다. 나온 것이 셋이다. ① **controller는 화면이 제 업무 상태를 들 때만 선다** — 게이트 셋에서 `retry`만 받았고(재시도가 도는 중인지) `blocked`·`left`는 service 둘로 상태가 다 접혀 남는 것이 「끝난 뒤 어디로 가는지」뿐이라 `.tsx`가 가진다. 화면마다 하나씩 기계적으로 세우면 빈 훅이 선다. ② **열 전부가 쓰는 도구 둘이 먼저 서야 했다** — `getCurrentUser`를 `useEffect`로 부르는 자리가 열두 군데에 받는 꼴이 셋으로 갈렸고 로그아웃 블록은 화면 다섯에 글자까지 같았다. 열마다 controller를 세워도 둘은 안 접혀서 `entities/session/services/useSessionUserQuery.ts`와 `features/auth/services/useSignOutMutation.ts`를 세웠다. ③ **`services/`는 보낼 데를 못 든다** — `useSignOutMutation`이 갈 자리를 `onDone`으로 받는 까닭이고, AC-08의 「`expo-*`는 `lib`·`ui`·`hooks`에만」이 `services/`에서 `expo-router`를 막는다.

**이동 열 열 묶음이 다 끝났다.** 공용 → 근무표 → 급여 → 구성원 → 근태 → 알림 → 리허설 → 통계 → 인증 → QR 순서로 직렬로 돌았고, **AC-09·AC-10·AC-11·AC-14·AC-15와 AC-06나의 타입 빼기가 다 찼다.** 재 보니 `services/` 아래 `.ts`가 126(구현 63·짝 63)이고 `services/` 밖에 `useQuery`·`useMutation` 호출이 0, `config/` 밖에 `process.env`·`Constants` 읽기가 0, `.policy.ts`에 시계·난수가 0이다.

**QR 묶음이 끝났다.** `hooks/` 둘이 통째로 `services/`로(넷), `HallQrCode`가 `qr.type.ts`로, 상수 아홉이 `consts/` 둘로, `exportQrPaper`가 `lib`으로 갔다 — AC-09의 여섯이 여기서 찼다. **`api/`가 선언한 타입이 꼭 DTO는 아니다** — `HallQrCode`는 `api`에 살았지만 필드가 camel이라(`getQrCode`가 `qr_code`를 옮겨 낸다) 이 묶음에 `.dto.ts`가 하나도 없다.

**AC-10의 면제 다섯을 다 돌고 재 보니 둘이 글과 달랐다.** `lib/`의 「손 묶음」이 하나가 아니라 둘이고(`PUSH_DEPS`에 `DEVICE_CLEANUP_NOT_WIRED_YET`이 붙었다), **`.tsx`가 내보내는 아홉에 문안이 하나도 없다** — e2e 손잡이 여섯과 드래그 접두 둘과 글자 배수 하나고 문안은 전부 로컬 `const`다. 면제를 글자대로 적으면 「`.tsx`의 문안」이 아니라 「`.tsx`가 내보내는 식별자」와 「`.tsx`의 로컬 문안」 둘이다. AC-08이 규칙을 쓸 때 이 글을 고친다.

**주석 안의 경로·지정자는 두 벌로 쓸어야 한다.** 인증 묶음이 `src/...` 꼴을 전수로 봐 셋을 고쳤는데, QR 묶음에서 `@/...` 꼴로 다시 쓸자 세 개가 더 나왔다 — 같은 관찰(050)의 그물 밖이 두 가지 꼴이었다.

**인증 묶음이 끝났다.** 타입 둘이 `.type.ts` 둘로(`session.type.ts`에 `AuthDestination`, `auth.type.ts`에 `EntryDecision`), 앱 스킴 하나가 `consts/`로, 실행 환경 읽기가 `config/auth.config.ts`로 갔고 **함수 다섯이 `features/auth/lib/`에 모였다**. `features/auth`의 `hooks/`와 `model/`의 함수가 다 떠나 **`model/`에 타입 파일 하나만 남은 첫 슬라이스가 됐다** — 역할로 가르면 이 슬라이스는 세션을 만들고 끊는 손이라 판정이 없는 것이 맞는 모습이고, 순수한 판정은 아래층 `entities/session`이 쥔다.

**접미사 패스가 놓친 자리가 두 묶음 연달아 나왔다.** 리허설의 reducer에 이어 인증의 `decideEntry.policy.ts`다 — 세션을 읽으러 통신을 부르는데 이름이 `.policy.ts`였고, `api/`를 당기는 `.policy.ts` 다섯 중 **값을 당겨 부르는 것은 이 하나뿐**이라 AC-08의 「`.policy.ts`에서 통신 금지」가 켜지면 이 파일 하나가 그 검사를 막는다. `fileNaming.ts`는 접미사와 세그먼트만 대조하고 파일 안을 안 봐 검사로는 못 세운다.

**`config/`의 `expo-constants` 면제가 규칙이 됐다.** 알림의 `pushSwitch.config.ts`에 이어 인증의 `auth.config.ts`가 둘째 자리다 — 둘 다 `app.json`과 실행 중인 껍데기가 아는 값이라 `process.env`로는 길이 없다. 한 자리였으면 그 파일만 빼면 됐는데 둘이 되면서 AC-08의 `nativeSdkSegment`가 면제 목록을 들어야 한다.

**없는 파일을 가리키던 주석 경로 셋을 고쳤다.** `tests/e2e/admin.yaml`과 `docs/4-test/execution.md`가 묶음 8가 이전의 짝 테스트 이름을, `integration-test-writer` 정의문이 AC-05가 없앤 `dals/`를 가리켰다 — import도 링크도 아니라 검사 셋 전부의 밖이다.

**묶음 열이 끝난 뒤 한 task가 필요해졌다.** 단위와 꼴을 내는 도구의 사본이 층층이다 — 요일 표 여섯·KST 날짜 꼴 셋·`?from=` 프로토콜 여덞 자리고, 초를 떼는 `slice(0, 5)`가 열둘인데 이름을 받은 것은 둘뿐이다. **단위 환산은 상수가 아홉이고 그 위에 올라탄 손이 둘이다** — 시·분 글자를 분으로 바꾸는 것 셋, 분을 「3시간 20분」으로 적는 것 다섯이다. 상수를 세는 것으로는 안 보여서, 그 task가 받을 것은 상수 아홉이 아니라 손 둘이다. **배정 갈래 둘(`"regular"`·`"training"`)도 여기로 왔다** — `ASSIGNMENT_KINDS`를 `entities/schedule/consts`에 세우고 타입을 거기서 끌어내는 걸음이라 유니언 자리까지 같이 움직인다. 묶음 하나가 접을 크기가 아니라 plan AC-13에 적어 뒀다.

**통계 묶음이 끝났다.** 타입 아홉이 `.type.ts` 둘로(`features/stats`에 일곱 — **`features/`의 첫 `.type.ts`다** — `screens/adminStats`에 둘), 상수 여섯이 `consts/` 셋으로, 달 맞추는 훅 하나가 `services/useAttendanceMonthsQuery.ts`로 갔다. **중복을 여섯 접거나 갈랐다** — plan이 든 둘은 몸이 달라 이름을 갈랐고(`shiftMinutes`/`paidMinutes`, `dayAttendanceLine`/`monthAttendanceLine`) plan이 안 든 넷은 몸이 같아 접었다(`monthIn`·KST 시·분 꼴·사람으로 좁히는 손·`PayrollByMonth`).

**타입을 옮기는 축에 한 겹이 붙었다.** 「밖에서 당기나」만 보면 `WorkTotals`는 남고 그 안의 `PositionTotal`만 가서, 판정 파일이 제 반환 타입의 부품을 도로 import한다. **옮기는 꼴이 담고 있는 꼴은 같이 간다**가 그 겹이다.

**규칙이 언제 우는지를 소스로 안 보고 넓게 읽은 것이 드러났다.** 리허설 묶음이 「`"regular"` 일곱 자리는 접을 길이 없다」고 적었는데, `no-cross-slice-import`는 **같은 층**일 때만 울린다 — 막히는 것은 `entities/rehearsal` 하나뿐이고 `screens`·`features`의 여섯은 `entities/schedule/consts`를 그대로 당길 수 있다. plan AC-13의 그 줄을 고쳤다.

**`.tsx`의 문안을 AC-12로 넘기는 것을 면제로 적었다.** 통계가 열아홉이고 리허설 넷에 이어서다 — `READ_FAILED`가 화면 다섯에 같은 글자라 controller가 서야 누가 들어야 하는지 보인다. AC-10의 면제가 넷에서 다섯이 됐다.

**리허설 묶음이 끝났다.** `hooks/` 여섯이 두 슬라이스에서 통째로 `services/`로(열둘), 통신 꼴 둘이 `rehearsal.dto.ts`로, 도메인 타입 둘이 `rehearsal.type.ts`로, 상수 여섯이 `consts/` 둘로 갔다. **접미사 패스가 reducer 하나를 놓친 것이 드러났다** — `addSheetState.policy.ts`가 전이 함수와 action 유니언을 들고 화면이 그것을 `useReducer`에 거는데, ADR-015가 그 파일을 「조건이 차면 `.reducer.ts`로 간다」로 이미 적어 뒀고 조건이 이미 차 있었다. `fileNaming.ts`는 접미사와 세그먼트만 대조하고 파일 안을 안 봐서 검사로는 못 세운다. **같은 값 60이 한 파일에서 두 뜻으로 섰다** — 1건이 1시간인 업무 규칙과 한 시간이 60분인 단위다. 앞의 것만 `consts`로 보냈고 가름은 「바뀔 수 있나」다.

**사본의 큰 묶음이 하나 더 보였다.** 초를 떼는 `slice(0, 5)`가 슬라이스 여섯에 열둘 있고 이름을 받은 것은 둘뿐이다. 요일 표·단위 환산·KST 꼴과 같은 자리고, 묶음 열이 끝난 뒤 한 task가 공용으로 모은다. **배정 갈래 `"regular"` 일곱 자리는 접을 길이 없다** — 리허설이 그중 하나인데 `entities`끼리 import가 `no-cross-slice-import`에 걸리고 `shared`에 두면 「`shared`는 도메인을 모른다」가 깨진다. `ExcuseStatusRow`와 같은 벽이다.

**알림 묶음이 끝났다.** `hooks/` 다섯이 슬라이스 셋에서 통째로 `services/`로(열 + 짝), 통신 꼴 둘이 `notification.dto.ts`로, 상수 열여섯이 `consts/` 넷으로 갔다. `pushDeps`가 셋으로 갈렸다 — 손은 `lib/pushDeps.lib.ts`, 앱 설정 읽기는 `config/pushSwitch.config.ts`, 기기 설정 화면에 뜨는 채널 이름은 `consts/`다. `pushPermission`은 통째로 `lib`이다(주입받아 순수한데도 하는 일이 OS에 묻는 것이라 AC-09의 판정을 지켰다).

**상수를 모으니 Deno 복사 경로가 늘었다.** 알림의 종류 목록과 한 번에 부치는 수를 Edge Function이 부르는 파일 둘이 써서 `consts/`가 `_shared/`로 복사되는 셋째 폴더가 됐다 — 「슬라이스마다 상수 한 파일」과 「함수가 부르는 것만 옮긴다」가 부딪히는 자리다. 같은 경계가 사본 접기도 막았다: 시·분 꼴을 `shared/utils/`로 올리면 공용 폴더 전체가 `node:` 금지를 받아 슬라이스 안에 섰다. **관찰 049가 요구한 「지정자가 복사본에 실제로 있나」 검사는 이미 서 있었다** — 근무표 묶음이 `syncEdgeShared.mts`에 세웠는데 그 뒤로도 「남았다」로 적혀 있었다. 이번에 그 줄을 지웠다.

**승인된 축 둘이 한 파일에서 부딪힌다.** EAS 프로젝트 id는 `app.json`에 살아 `expo-constants`로만 읽히는데, AC-11은 `Constants` 읽기를 `config/`로 몰고 AC-08의 `nativeSdkSegment`는 `expo-*`를 `lib`·`ui`·`hooks`에만 둔다. **`config/`의 `expo-constants`를 면제해야 규칙 둘이 같이 선다.** 같은 자리에서 AC-10의 관찰 결과 문장도 코드와 안 맞는 것이 드러났다 — 「`consts/` 밖에 `export const <대문자_스네이크>`가 없다」가 거짓이고 그것이 의도다(질의 열 목록은 `api/`, SDK 손 묶음은 `lib/`). `constsSegment.mjs`가 면제 넷을 가져야 켜진다.

**근태 묶음이 끝났다.** `hooks/` 하나가 `services/`로, DTO 넷이 `attendance.dto.ts`·`excuse.dto.ts`로, 상수 아홉이 `consts/` 둘로, 타입 열이 `.type.ts` 둘로 갔다. **낡은 정본 셋을 고쳤다** — `attendance.type.ts`에 **타입이 하나도 없고 상수 일곱뿐**이었는데, `runtime.md`의 「업무 상수」가 그 자리를 「ADR-015의 그 접미사가 「타입과 상수」를 담는다」로 적어 ADR의 옛 판본을 인용하고 있었고, `tests/lint/attendanceConstants.ts`와 그 짝 테스트 픽스처가 그 경로를 문자열로 들고 있었다. **중복 넷이 더 나왔다** — `DayAttendance`/`MonthAttendance`(몸이 글자까지 같아 `AttendanceRows`로 접었다), 질의 열 목록 둘의 사본, `nextMonthFirstDay`(`nextMonthStart`의 **다섯째** 사본), `CUSTOM_MAX_LENGTH`(판정 파일과 `.tsx`에 각자). **쓰기 셋에 Mutation이 없다** — `checkIn`·`submitExcuse`·`decideExcuse`가 `api/`에만 있고 `.tsx`가 저장소를 직접 부른다. AC-12 몫이다.

**구성원 묶음이 끝났다.** `hooks/` 다섯이 통째로 `services/`로(열 + 짝 열), DTO 일곱이 `member.dto.ts`·`profile.dto.ts`로, 상수와 문안 열여섯이 `consts/` 넷으로 갔다. **같은 값이 다섯 벌 선 자리를 만났다** — 성별이다. 타입 둘(`ProfileGender`·`Gender`)과 좁히는 판정 둘과 이름표 네 벌을 접어 `spellGender` 하나로 모았다. 그리고 `MemberProfileRow`가 `utils`에 사는 DTO였다 — 함수가 보는 열은 넷인데 타입이 여섯을 들어 실물은 목록 DTO 셋의 뼈대였고, `.dto.ts`로 올리고 그 자리에 함수 계약 넷만 남겼다.

**성별 문안이 정해졌다.** **값을 읽는 자리는 전부 「여성」·「남성」이고 고르는 세그먼트만 한 글자다.** 다섯째 벌(`scheduleAdmin`의 `genderLabel()`)이 「여」였고 `schedule-admin.md`가 그것을 정본으로 들고 있어 문안 결정이 필요했다 — 결정을 받아 접었다. 뿌리는 ACC-002의 「성별은 「여」·「남」 둘 중 하나」였고, 고르는 선택지를 적은 글자가 읽는 꼴로도 읽혀 시안 캡션까지 그렇게 인용하고 있었다([관찰 040](observations/040-sian-captions-cite-what-they-invent.md)이 「여성」을 어긋남으로 잡은 자리고 이 결정이 그 판정을 뒤집는다). 코드·문서·시안 셋에 걸쳐 열두 자리가 움직였다([관찰 053](observations/053-gender-label-copy-has-no-canon.md), resolved).

**급여 묶음이 끝났다.** `hooks/` 넷이 `services/`로(여덞 + 짝 여덞), DTO 일곱이 `payroll.dto.ts` 하나로, 상수 일곱이 `consts/` 셋으로, `DayKind`가 `payroll.type.ts`로 갔다. 중복 셋을 만났다 — `WageRateRow`/`MemberWageRateRow`는 **plan이 안 든 것**이고 몸이 같아 접었다. `canGoBack`·`canGoForward`는 몸이 달라 축을 이름에 넣어 갈랐다(`canGoToPreviousMonth` / `canGoToPreviousPeriod`). `ExcuseStatusRow`는 몸이 글자까지 같은데 **못 접는다** — `entities`끼리 import가 `no-cross-slice-import`에 걸리고 올릴 자리도 없다. 남은 중복 둘(`dayMinutes`·`attendanceSummaryLine`)은 통계가 뒤라 그 묶음 몫이다.

**근무표 묶음이 끝났다.** `hooks/` 열하나가 통째로 `services/`로 갔고(서른 + 짝 서른), DB 열 이름을 드는 타입 열하나가 `.dto.ts` 넷으로 떨어지고, 도메인 타입 셋과 상수 둘이 제 세그먼트로 갔다. **DTO 꼴 바꾸기는 떼어냈다** — 열 이름이 `api/` 밖 파일 쉰여덟에 닿고 `ScheduleDay` 하나가 묶음 넷에 걸려 도메인 축으로 못 가른다. [dto-to-domain-shape](3-build/plans/dto-to-domain-shape.md)가 묶음 열이 끝난 뒤 필드 축으로 가른다.

**공용 묶음이 끝났다(#493).** `shared/`와 `entities/clock`에 `consts`·`config`·`lib`·`stores`가 섰다 — 파일 일곱이 제 성격의 폴더로 가고, 한 파일에 타입과 상수와 판정과 저장을 같이 들고 있던 다섯(`api/errors`·`utils/theme`·`utils/fontLoading`·`utils/kstDate`·`clock.store`)이 갈렸다. `shared/hooks`가 비어 사라졌다. 돌면서 **재수출이 세그먼트 검사를 우회한다**는 것이 드러났다([관찰 051](observations/051-reexport-bypasses-segment-checks.md)) — `model` 둘이 `kstToday`를 재수출해 화면이 `model`을 거쳐 바깥을 읽고 있었고, `export { ... } from`은 import 축의 어느 검사도 안 본다. AC-08이 규칙을 세울 때 같이 물린다.

**계층 셋과 역할 넷이 박혔다.** presentation(`ui`) · logic(`hooks`·`services`·`stores`·`model`·`utils`·`consts`·`config`·`lib`) · db(`api`)가 계층이고, presentation · controller · service · repository가 역할이다. 재 보니 **repository와 service는 이미 섰고 controller만 없었다** — 통신 백일흔둘이 전부 저장소에 한 번만 닿고, `hooks/` 예순다섯 중 예순둘이 Query·Mutation이다. `ui`가 `hooks`를 당기는 자리가 **셋**뿐인 것이 controller가 없다는 증거다.

**세그먼트가 여덞에서 열로 열렸다.** `services`(Query·Mutation)와 `stores`(zustand·Context)가 더해졌다. 접미사는 열여섯(`.dto.ts`·`.mapper.ts`·`.reducer.ts`·`.context.ts`가 더해졌다), 검사는 열일곱이다.

**남은 PR의 가름은 도메인 축이다.** 묶음 열(공용·근무표·급여·구성원·근태·알림·리허설·통계·인증·QR)이고 겹이 둘이다 — **이동 겹**(타입·DTO·매퍼·`lib`·`consts`·`config`·`services`·`stores`·중복)은 import 경로를 바꿔 **직렬**이고, **안쪽 겹**(controller 세우기, 큰 파일 쪼개기)은 그 화면 안에서만 보여 **병렬**이다. 도메인이 다른 도메인을 당기는 자리가 백쉰둘이라 이동 PR 둘이 같이 떠 있으면 서로의 치환을 밟는다. 이동 순서는 공용 → 근무표 → 급여 → 구성원 → 근태 → 알림 → 리허설 → 통계 → 인증 → QR이고, 안쪽 겹은 그 뒤 worktree 열을 떼어 같이 돈다.

**분량**: `services` 이동 124(짝 테스트 포함, 근무표 60) · controller 화면 44 · DTO 22 · 매퍼 10 · 타입 65 · 상수 26파일 · 에러 판정 15건.

**경계가 지금 깨진 자리**: `ui` → `api` 26 · `ui` → 클라이언트 25 · `ui` → `services` 96 · `ui` → `model` 함수 91 · `model` → `api` 6 · `api` → `model` 2 · `utils` → `api` 6.

**`.tsx`의 `useState`는 UI를 담당하는 로직일 때만 남는다.** 측정한 너비·포커스·시트 열림은 되고, 통신 중·실패·서버에서 온 값은 controller로 내려간다 — 뒤 넷은 대개 React Query가 이미 준다. `shared/ui`에서 상태를 든 여섯은 전부 앞쪽이라 안 건드린다.

**열지 않기로 한 셋 중 둘이 열렸다.** `mapper`는 `.dto.ts`와 함께 섰고, `ui` 가르기는 세그먼트가 아니라 **층이 갈랐다** — `shared/ui`(도메인을 모른다) · `entities/*/ui`(도메인 타입을 받는다, 지금 0) · `features/*/ui`(use case를 실행한다) · `screens/*/ui`(한 화면 전용) 넷이다. 남은 하나는 문안이고 `consts/<도메인>.const.ts`가 받기로 했다 — 지금 마흔한 자리에 흩어져 있다(`utils` 16 · `model` 12 · `ui` 10 · `api` 2 · `hooks` 1).

**이 task 밖의 코드 task를 띄우지 않는다** — 같은 파일을 연달아 옮겨 충돌이 손으로 못 풀 만큼 커진다. 이 task 안의 안쪽 겹은 예외다 — 화면 안쪽만 고쳐 밖에서 당기는 import가 없다.


**묶음 여덟이 끝났다(#483~#489 그리고 8가).** 이름이 camelCase가 되고(535개, `Db`→`DB` 334회), 폴더도 camelCase가 되고, 캐시 키가 `src/shared/api/queryKeys.ts` 팩토리 하나로 모이고, 통신 74개가 `entities/*/api/`의 `[action].api.ts`가 되고, 훅 59개가 `hooks/`로 가며 읽기·쓰기로 층이 갈렸다. 그리고 `shared/lib`이 사라져 `api`·`hooks`·`utils`로 갈리고 층이 틀린 아홉이 `features/auth`·`entities/session`·`entities/clock`으로 갔다. 그리고 슬라이스가 **entities 14 · features 22**로 쪼개졌고, `model` 파일 123개가 성격 접미사를 받아 판정 예순하나는 `.policy.ts`로, 꼴 바꾸기 쉰여섯은 `utils/`의 `.utils.ts`로 갈렸다 — `no-cross-slice-import`가 0건이다. 지금 **`entities/`에 `useMutation`이 없고 `features/`에 `useQuery`가 없다.**

**묶음마다 커밋이 성격으로 갈려 있다** — 자리와 이름만 바꾸는 커밋은 내용 0줄이고 참조 수정이 그 뒤에 온다. `git log --follow`가 이동을 따라가게 하는 값이고, 리뷰도 생각이 든 커밋만 읽으면 된다. 남은 묶음 둘도 같은 꼴로 간다.

**일괄 치환에서 세 번 밟은 자리가 있다.** `tests/lint/fileNaming.test.ts`의 픽스처가 어긋난 이름을 리터럴로 들고 있어 치환이 지나가면 **정답으로 뒤집힌다** — 묶음 1·3에서 두 번 났고 묶음 5는 `tests/lint/`를 치환 범위 밖에 두어 막았다. ESLint 규칙 ID(`house/dumb-ui`)도 파일 이름이 아니라 생태계 식별자라 kebab으로 되돌렸다.

**계획이 둔 자리를 규칙에 대보지 않은 것이 두 번 났다([관찰 046](observations/046-plan-placement-not-checked-against-rules.md), open).** `useStatsQueries.ts`를 AC-04가 한 번, AC-05가 한 번 잘못 배치했다 — 그 파일만 `entities` 세 슬라이스를 함께 읽어 `no-cross-slice-import`에 걸린다. 묶음 5에서 넷으로 가르며 정했다. `removePushToken`도 같은 꼴로 걸렸다(짝 테스트가 `features`의 함수를 쓴다). **AC-07이 슬라이스를 열여섯·스물로 쪼개므로 그 묶음에 들어가기 전에 자리마다 import 방향을 먼저 대본다.**

**Edge Function 둘이 없는 파일을 부르고 있었다([관찰 049](observations/049-edge-functions-outside-every-check.md), open).** 묶음 1이 `src/`의 이름을 camel로 바꿀 때 `supabase/functions/_shared/`의 복사본은 따라갔고 **부르는 쪽이 안 따라갔다** — `send-push`가 `push-message.ts`를, `import-holidays`가 `holiday-api-response.ts`를 부르는데 그 이름이 없다. 묶음 다섯이 지나가는 동안 아무것도 안 울었다: `supabase/functions/`가 `typecheck`의 `exclude`에 들고, CI는 `edge-runtime`을 안 띄우고, `_shared`는 생성물이라 diff에도 안 뜬다. **지정자가 복사본에 실제로 있는지 보는 줄 하나를 `syncEdgeShared.mts`에 세우는 것이 남았다** — 그 스크립트가 이미 두 목록을 다 들고 있다.

**쪼갠 뒤 `attendanceSummary.ts`가 둘이 됐다.** 배정 표가 이름을 하나로 적는데 실물이 두 층에 각자 있고 하는 일이 다르다 — 월 집계·출근율과, 현황 줄에서 0을 빼는 것이다. 후자가 `summarizeAttendanceStatuses.ts`를 받았다. **옮기기 전에 목적지가 이미 있는지 보는 줄**이 이동 스크립트에 섰다 — 배정 표를 코드에 대보는 일이 이름 겹침까지는 안 봤다.

**`sessionStorage`는 계획이 보낸 자리에 못 섰다.** `features/auth`로 보내면 `shared/api/createSupabaseClient`가 그것을 당겨 「`shared`는 `features`를 모른다」에 걸린다 — 세션을 만드는 쓰기가 아니라 클라이언트가 받는 저장소 어댑터고, 그래서 떠나는 열이 아홉이 됐다. `fontLoading`도 계획이 `useFontLoading`으로 이름을 바꾸라 적었는데 그 파일에 훅이 없어 `utils`로 갔다.

**`pnpm test`가 이제 `jest`를 두 번 돌린다([관찰 048](observations/048-jest-projects-share-esm-cache.md), closed).** 갈래 둘이 `.ts`를 ESM으로 볼지에서 갈리는데 `jest-resolve`가 그 판정을 경로만으로 캐시해서, 한 워커가 두 갈래를 번갈아 받으면 먼저 본 답이 다음 갈래에도 적용된다. 양쪽이 다 쓰는 `.ts`에서 「Must use import to load ES Module」이 뜨고 스위트 순서에 따라 뜨다 말다 한다 — 묶음 5가 애니메이션 타이머로 짚었던 흔들림이 이 자리였다. 필터(`pnpm test -- X`)는 두 갈래에 그대로 가고 안 걸리는 쪽은 넘어간다.

**NCP 자격은 사람이 받아 와야 한다.** 받을 것은 [배포 환경](5-deploy/environments.md#데이터와-외부-의존성)의 「지도 키」 줄이 든다 — 대표 계정을 먼저 지정하고, Application 하나에 Maps → Dynamic Map을 켜 안드로이드·iOS 식별자(둘 다 `com.labiebelle.app`)를 등록해 Client ID 한 쌍을 받고, Map Style Editor로 라이트·다크 스타일을 만들어 `customStyleId` 둘을 받는다. 그것이 오면 `attendance-checkin`이 풀리고 그 뒤로 `dashboard`·`attendance-excuse`·`notification-emit` 사슬이 선다. 기다리는 동안 `candidate`를 올려 잡으려면 `spell-number-shared`·`test-seed-transaction`·`internal-grants-public`·`unbounded-read-truncates`·`stats-density-salvage` 중에서 고른다.

**지도의 정본 전제를 웹에서 네이티브로 옮겼다.** [출근 인증](2-design/modules/attendance/screens/check-in.md#출근-인증-짜임)이 「웹에서 `submodules=gl`로 띄운다」고 적고 있었는데 [ADR-011](2-design/adr/ADR-011-expo-native-app.md) 뒤로 그 전제가 죽었다. `customStyleId`는 iOS·Android SDK 둘 다 받아 색 표는 그대로 유효하고, `nightModeEnabled`는 두 레퍼런스가 「지원 안 하는 유형에서는 변화가 없다」고만 적고 어느 유형이 듣는지를 열거하지 않아 안 쓴다. 카카오를 다시 재볼 필요도 없다 — 카카오 SDK의 `MapType`이 `NORMAL`·`SKYVIEW` 둘뿐이고 데브톡 답변이 다크 모드 미지원을 밝혔다. **문서에 든 사실마다 출처를 달았다** — 조사자가 돌려준 「iOS는 Basic·Navi·Terrain, 안드로이드는 Navi만」은 공식 레퍼런스 어디에도 없었다([관찰 043](observations/043-researcher-enumerated-what-the-source-does-not.md)).

**`attendance-checkin`이 고칠 10분 한도의 성격이 갈렸다([관찰 042](observations/042-plan-set-a-number-the-canon-already-set.md)).** 보드 행이 이미 「마이그레이션의 10분 한도를 여기서 2시간으로 고친다」를 적어 그 일은 배정돼 있다. 다만 `attendance-data` plan은 10분을 **다른 축의 상수**로 적고 근거까지 달았는데(「지각 유예 10분과 `checked_at` 한도 10분은 다른 상수다」) 실제로는 **하나가 다른 하나를 무효로 만드는 관계다** — 지하에서 09:00에 눌러 11:00에 올라온 인증은 ATT-029로 받아들여지지만 `checked_at`이 11:00으로 눌려 지각이 된다. 2시간을 허용한 이유가 「한 타임 일하고 올라오는 것을 덮는다」인데 덮은 뒤 지각으로 적으면 덮지 않은 것과 같다. **plan은 한도를 2시간으로 올리고 그 밖을 `now()` 대체가 아니라 `too_late` 거부로 적는다**(미래 값만 `now()`로 누른다). `too_late`는 함수에도 `errorCodes.ts`에도 아직 없다. 세 번째 모순 하나가 더 있다 — 반경 오류 코드가 코드·테스트·`errorCodes.ts`에서 `bad_radius`인데 정본 셋(`design.md`·ATT-002·보드)은 `invalid_radius`다. `invalid_qr`과 꼴이 맞는 `invalid_radius` 쪽으로 모으는 것이 `hall-location`의 몫이다.

**키가 막는 자리는 AC 셋뿐이다.** spec의 AC 여덟을 지도 의존으로 갈라 보니 **AC-01·02·03만 지도 타일이 떠야 닫히고** AC-04(권한 거부)·05(QR 링크)·06(`invalid_qr`)·07(누른 시각 기록)·08(오프라인 큐·지수 백오프)은 키 없이 선다. 그중 AC-06·07·08은 integration과 unit이라 **개발 빌드 없이도 지금 돈다**. `attendance-checkin`을 통째로 막아둘 이유가 없다 — plan이 그 구분을 적고 키 의존 셋만 뒤로 미루면 사슬이 지금 풀린다.

**[PR #379](https://github.com/tkyoun0421/la-bie-belle/pull/379)를 닫았다.** 열흘 묶여 있던 통계 밀도 작업인데 그 사이 main이 같은 파일을 스물한 번 고쳤고, 무엇보다 이 브랜치가 [ADR-014](2-design/adr/ADR-014-toss-like-depth-and-graphics.md)보다 닷새 앞선 글이라 충돌을 푸는 일이 다시 쓰는 일과 같아졌다. **브랜치 `feat/stats-density`는 안 지웠다** — `stats-density-salvage` candidate가 거기서 살릴 판정을 고른다. 조각 절 둘(요약 판·사람 겹침)은 main에 아예 없고, 도넛·미니 달력·추이 그래프·차트 색 규칙은 main에 이미 있어 대조가 필요하다.

**`sian-sync`가 `done`이다.** 열일곱 장을 감사 넷으로 훑고 작성자 여섯으로 고쳤다. 가장 큰 자리는 **화면 좌우 여백**이었다 — 시안 전부가 24px로 그렸고 문서 전부가 `px-5`(20px)라 시안을 내렸다. [여백은 문서가 정본](observations/README.md)이라는 앞선 판정 그대로다.

**정본이 비운 자리 둘을 박았다.** [components.md 「Dialog와 바텀시트」](2-design/design-system/components.md#dialog와-바텀시트)에 바텀시트 안쪽 여백(좌우·아래 20px, 아래는 안전영역을 더한다)이 섰고, [「BottomCTA」](2-design/design-system/components.md#bottomcta)에 같은 값이 섰다. 그 값이 없어서 화면 문서 아홉이 시트 여백을 제각각(`p-6`·`px-6`·`p-5`·`px-5`) 적고 있었다 — 24px 쪽 넷과 알림 목록의 화면 좌우 `px-6`을 20px로 맞췄다.

**목업 셋이 새로 섰다.** 근무표의 「취소 요청 중」과 「보내는 사이 배정이 사라졌을 때」, 관리자 근무표의 「확정 실패」다. 셋 다 문서 상태표에 선 모습인데 시안이 안 그리고 있었다. 대시보드와 근무표에 탭 바를 세웠고, 닫기 기호 ✕(U+2715)를 ×로 바꿨다 — Wanted Sans에 없는 글자다.

**`sian-writer` 정의문에 규칙 셋이 들어갔다.** 탭 화면이면 탭 바를 목업마다 그린다, 로딩 모습은 문서 상태표에 선 것만 그린다(「첫 진입에 스켈레톤」은 `runtime.md`의 전역 계약이라 그것만 근거로 열일곱 장에 회색 덩이를 반복하지 않는다), **캡션이 문서를 인용하면 그 문서에서 읽은 문장이어야 한다**([관찰 040](observations/040-sian-captions-cite-what-they-invent.md)).

**관찰 둘이 더 열렸다.** [040](observations/040-sian-captions-cite-what-they-invent.md)은 actioned다 — 시안 캡션 셋이 문서를 근거로 들면서 그 문서에 없는 말을 적었다(제 값을 문서 탓으로 돌리거나, 이미 정해진 것을 「아직 안 정했다」고 적었다). [041](observations/041-mcp-instructions-read-as-injection.md)은 open이다 — subagent 넷 중 셋이 MCP 서버 지시문을 프롬프트 주입으로 보고 무시했다는 말을 리턴에 붙였다. 판단은 맞았지만 작성자마다 그 글을 재는 비용이 든다.

**`notification-settings`가 `done`이다(#475 정본, #476 구현).** 권한 감싸기(`pushPermission.ts`, 기기에 붙는 함수는 전부 주입), 갈래 판정(`reachState.ts`)과 자리별 문장(`reachMessage.ts`), 켜고 끄는 훅, 매 진입 주소 보내기, 「나」의 알림 줄과 승인 대기 켜기 자리, 관리자 세 자리의 갈래 표시가 섰다. **매 진입을 붙인 자리는 `src/app/(tabs)/_layout.tsx`다** — 세션이 있는 사람만 지나고 앱이 떠 있는 동안 안 내려간다.

**총괄이 정본에 박은 판정이 여덟이다.** 「나」의 거부 안내를 승인 대기 화면과 같은 두 줄로 맞췄고, 확정 뒤 확인 자리는 갈래를 안 가르고 한 줄로 합친다(그 자리에서 할 일이 어느 갈래든 따로 연락 하나다). 갈래 표시는 재직자에게만 붙는다. 「매 진입」은 앱이 뜰 때와 포그라운드 복귀마다다. 승인 대기 뷰 값은 `"idle" | "enabled" | "denied"`고 `"unsupported"` 결과도 셋째 모습으로 간다. 의사를 읽기 전에는 스위치 대신 스켈레톤이다. 안드로이드 채널 이름은 「근무 알림」이다. AC-05·AC-07의 DB 자리는 이미 선 함수와 테스트가 덮어 재배정 안 했다.

**남은 것은 기기가 있어야 닫힌다.** 권한 창을 거치는 AC-01·AC-03·AC-06과 `app.json`의 `extra.eas.projectId` 실값이다. 그 값이 없으면 `null`로 서서 「켰는데 기기가 없음」 갈래가 된다. `tests/e2e/notification-settings.yaml`이 여정을 들고 기다린다.

**관찰 셋이 열렸다.** [037](observations/037-planner-reported-absent-what-was-there.md) — 계획자가 「정본에 없다」고 한 문구 둘이 실제로는 있었다(찾은 말이 정본의 말과 달랐다). [038](observations/038-fixture-user-misses-member-list.md) — `createApprovedUser`가 `submitted_at`을 안 채워 그 사람이 `listActiveMembers`에 안 잡힌다. [039](observations/039-e2e-only-assignment-blocks-the-hook.md) — **e2e로만 배정된 `.ts`를 TDD 훅이 못 통과시킨다.** 이번에 `pushPermission.ts`가 그것에 막혀 구현이 두 라운드로 갈렸다.

**`notification-push`가 `done`이다(#472).** 트리거와 cron `retry-push`(매분)가 같은 Edge Function `send-push`를 부르고, 잡기(`claim_notifications`)의 `returning`이 두 경로의 중복 발송을 막는다. **잡기는 한 문장이다** — `update ... returning`을 CTE로 두고 밖에서 `array_agg`로 주소를 묶는다(조인하면 주소가 둘인 사람의 행에 매치가 여럿 붙어 한쪽만 남는다). 껍데기 넷의 첫 줄이 전부 `auth.role() is distinct from 'service_role'`이고, 트리거의 쏘는 단계는 예외를 삼켜 사건 함수의 트랜잭션을 안 말린다.

**`_shared` 복사 단계가 섰다(AC-09).** `pnpm edge:sync`가 `src/`를 `supabase/functions/_shared/`로 옮기며 import에 `.ts`를 붙인다. `import-holidays`도 그 복사본을 보게 고쳤다 — [관찰 035](observations/035-edge-function-reaches-outside-mount.md)가 연 자리를 닫았다. **재발은 lint 규칙 둘(20·21)이 막는다** — `supabase/functions/`의 마운트 밖 import와 복사되는 폴더의 `node:` import다. 다만 **규칙 21의 폴더 목록이 복사 대상과 정확히 같지는 않다** — `syncEdgeShared.mts`가 `src/entities/notification/model/notification.type.ts`도 옮기는데 규칙은 `src/features/notification/model/`만 문다.

**edge-runtime은 여전히 안 뜬다.** `supabase start`가 `-x`로 빼서 `send-push`가 실제로 도는 것, 실기기 수신, 접수증 서비스의 답은 배포 뒤 손 확인이다.

**`notification-list`가 `done`이다(#468).** 알림 목록 화면과 앱바 종이 섰고, 순수 함수 셋(`title`·`when`·`destination`)과 훅 셋, 읽는 손 둘이 같이 왔다. **문장·목적지는 1차 열여덟만 낸다** — 2차 다섯은 널이고 `kind` 유니온만 스물셋을 든다. `kind` 문자열과 `payload` 열쇠는 [design.md 「kind와 payload」](2-design/modules/notification/design.md#kind와-payload)가 정본이고 **`notification-emit`이 그 표에 맞춰 행을 낳아야 한다**. 판정 둘을 정본에 박았다 — 줄을 눌러 간 자리의 읽음 실패는 조용하고(토스트 없음, [runtime.md](2-design/system/runtime.md)에 예외 한 줄), `?from=notifications`는 앱바 뒤로가 있는 관리자 두 화면에만 싣는다(탭 화면은 받을 자리가 없다, [navigation.md](2-design/system/navigation.md#뒤로)).

**구현자가 남긴 발견 둘이 열려 있다.** 아래 줄(`sub`) 문안이 정본에 없어 데이터를 잇는 꼴로 지어 넣었다 — 목록은 안 그려 지금은 안 보이지만 대시보드와 푸시가 그릴 자리다. 그리고 **로컬 DB가 1000행을 넘으면 `getWageRates`가 조용히 잘린다** — 범위 없이 읽어 PostgREST 기본 상한에 걸리고, CI는 매번 빈 DB라 안 걸린다. `runtime.md` 「읽기 범위」가 막으려던 자리다.

**`payroll-holidays`가 `done`이다(#464).** `internal.fetch_holidays()`가 날마다 다음 해에 `source = 'api'` 공휴일이 있는지 보고, 비었으면 `pg_net`으로 Edge Function `import-holidays`를 쏜다. 그 함수가 공공데이터포털에서 열두 달을 순차로 받아 한 달이라도 실패하면 아무것도 안 넣고, 성공하면 `public.import_holidays(p_year, p_rows)`를 부른다. **서비스 키로도 `internal`은 못 부른다** — PostgREST가 노출 목록(`public`·`graphql_public`) 밖의 스키마를 라우팅 단계에서 끊어 키와 무관하게 `PGRST106`이다. 그래서 `public` 껍데기가 서고 그 첫 줄이 `auth.role() is distinct from 'service_role'`을 본다(`<>`면 JWT 없는 호출의 널 비교가 널이라 검사를 그냥 통과한다). 판정은 [data-access.md](2-design/system/data-access.md)의 「서비스 키 자리」가 정본이고 [관찰 033](observations/033-service-key-cannot-reach-internal.md)이 경위를 담는다.

**pg_net 호출 횟수는 응답 표가 아니라 요청 시퀀스로 센다.** `net.http_post`는 요청 행만 그 자리에서 넣고 응답 행은 백그라운드 워커가 나중에 쓴다 — `net._http_response`를 부른 직후에 세면 로컬에서는 맞고 CI에서는 0이 나온다. 통합 테스트 둘이 이 경쟁으로 깨졌고 `net.http_request_queue_id_seq`의 차를 세는 쪽으로 옮겼다([관찰 034](observations/034-pg-net-response-row-is-async.md)). `send-push`도 「쏘았는가」를 세게 되니 같은 길을 탄다.

**`profile-erasure`가 `done`이다(#461 plan, #462 구현).** 퇴사 1년 뒤 비우기가 섰다 — `internal.erase_profiles(p_now)`가 1년 경계로 `profile_private`를 지우고 `avatars` 사진을 비우고 `erased_at`을 찍은 뒤, `pg_net`으로 Edge Function `erase-account`를 쏴서 `auth.users`를 지운다. **plan을 쓰며 정본에 판정 넷을 박았다** — 도는 시각은 한국 새벽 4시, 사진은 주소만이 아니라 파일도 지운다, 알림 행은 안 비운다(`notification-data`가 넘긴 판정), 계정이 살아 있는 하루 동안 본인은 이름·지난 급여·근무 기록을 그대로 본다. 이 넷은 `account/design.md`의 「비우기」 절이 정본이다.

**구현이 쏘는 단계를 제 트랜잭션에 가뒀다.** `net.http_post` 호출을 `begin ... exception when others ...; end`로 감싸 예외가 방금 지운 개인정보를 롤백으로 되살리지 않게 했다 — 안 그러면 같은 실패가 날마다 되풀이돼 비우기가 영영 안 끝난다. **AC-03(Edge Function이 실제로 `auth.users`를 지우는 것)은 로컬·CI가 edge-runtime을 빼고 띄워 배포 뒤 손 확인으로 남았다** — 멱등, anon 키 거절, `user_id`가 널이 되는 것 셋이 확인 목록이다.

**발견 둘이 candidate로 섰다.** `erased-photo-bytes-remain` — 사진을 지우는 SQL이 `storage.objects` 행만 지워 공개 주소는 404가 되지만 객체 저장소의 바이트는 고아로 남는다(`storage.protect_delete()` 트리거가 SQL 직접 삭제를 막아서다). 완전히 지우려면 Storage API를 타야 하고 그건 Edge Function 쪽 일이다. `internal-grants-public` — `revoke all on all functions in schema internal from anon, authenticated`가 저장소의 `internal` 마이그레이션마다 복사돼 있는데 실제로는 안 막는다. 함수 EXECUTE가 기본으로 `PUBLIC`에 붙어서 역할을 이름으로 빼봐야 `PUBLIC`을 타고 들어온다. 지금 막는 것은 PostgREST 라우팅과 스키마 USAGE뿐이고, 누가 `internal`에 USAGE를 여는 날 모든 함수가 같이 열린다. [관찰 031](observations/031-internal-exposure-test-covers-one-layer.md)이 근거다.

**`plans-restate`가 `done`이다(#459, #460).** plan 열둘의 「변경 파일」 표가 디렉터리 대신 구현 파일을 하나씩 들고, 검증 표의 `(예정)`과 「e2e 명령」이 실재 경로와 `pnpm e2e`로 섰다. 채우는 일보다 낡은 서술을 걷어낸 쪽이 컸다 — 계획서가 「누가 무엇을 세우는가」를 적는데 실제 merge 순서가 그것과 달라, dal과 공용 조각의 주체가 뒤바뀐 자리 넷과 달 고르기 시트를 서로 미루던 자리 다섯이 나왔다. `attendance-excuse` AC-05의 「iOS 사파리 visual viewport」는 네이티브에 사파리가 없어 `KeyboardAvoidingView`로 판정했다(선례는 `src/screens/pending/ui/PendingScreen.tsx:390`). **다음 화면 task가 plan을 읽을 때 이 정정을 믿어도 된다** — 열둘 다 지금 코드와 대조했다.

**`ready`가 `sian-sync` 하나다.** 알림 영역에서 남은 `notification-emit`·`notification-schedule`·`notification-second`는 `attendance-excuse`(그 앞이 `dashboard`, 그 앞이 `attendance-checkin`의 NCP 자격)에 묶여 있다.

**`notification-push`의 plan이 섰고 정본에 판정 셋을 박았다.** 보낼 것이 없어도 접수증을 긁는다([Q-02](2-design/modules/notification/design.md#아직-안-정한-것) 닫음), 잡기와 결과 쓰기가 `public` 껍데기를 탄다, 접수증 번호 열(`push_receipt_id`)은 그 task가 붙인다. **문장 함수의 주인은 `notification-list`다** — spec과 plan 둘이 그렇게 적어둬서 순서를 뒤집는 대신 `notification-push`를 그 뒤로 보냈다. **[관찰 035](observations/035-edge-function-reaches-outside-mount.md)가 열려 있다** — `import-holidays`가 마운트 밖의 `src/`를 import하는데 edge-runtime을 안 띄워 아무 검사도 안 잡았다. `notification-push`의 AC-09가 복사 단계를 세우며 같이 고친다. `blocked`로 남은 쪽의 이유는 셋뿐이다 — **NCP 자격**(`attendance-checkin`·`hall-location`), **도메인**(`qr-landing-page`·`first-release`), **앞 task의 사슬**(`dashboard`가 `attendance-checkin`을 기다리고 `attendance-excuse`·`notification-emit` 이하가 그 뒤에 선다).

**관찰 021·027·030은 `archive/`로 옮겼다.** `resolved: 2026-09-29`가 이번 마감 날짜(2026-10-01)를 지나 조건을 채웠다. 가리키던 링크(`docs/log/2026-09-29.md`)도 `archive/` 경로로 같이 고쳤다. 025·026은 지난 회차에 옮겼다.

**같은 target이 3건 겹치는 자리가 났다.** `.claude/agents/test-planner.md`에 관찰 020·037·039가 쌓였다 — 정본을 못 찾아 「없다」고 돌려준 판정이 세 번째다. `backlog.md`의 `candidate`에 `test-planner-ground-truth`로 올렸다.

**앞선 `stats-worker`(#457)와 급여 모듈(`payroll-wages`·`payroll-view`·`payroll-adjust`)은 로그가 담는다.** 세부는 [2026-09-29 로그](log/2026-09-29.md)와 [2026-09-28 로그](log/2026-09-28.md)가 담는다.

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. spec 파일이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다(#441) — `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**저장소의 첫 Edge Function이 섰다.** `supabase/functions/erase-account/index.ts` — service role로 Admin API를 불러 계정을 지운다. `tsconfig.json`이 `supabase/functions`를 `exclude`에 두는데, 그 폴더가 Deno 런타임이라 `Deno` 전역도 `npm:` 지정자도 우리 `tsc`로는 안 풀려서다. Edge Function을 타입 검사하는 자리가 아직 없다 — CI에 Deno가 없다. `import-holidays`(#464)가 둘째로 섰고 검사 단계는 여전히 안 세웠다. `send-push`가 셋째다.

**vault로 로컬 시크릿을 심는 길이 섰다.** integration 테스트가 `beforeAll`/`afterAll`에서 `vault.create_secret`/삭제로 로컬 전용 가짜 값을 넣고 뺀다. `seed.sql`(전역 상태, `db reset`마다 돎)은 이 용도로 안 쓴다 — `payroll-holidays`가 같은 길을 그대로 탔고 `notification-push`도 부치는 접근 토큰을 이렇게 심는다.

**금액 꼴은 `shared/utils/spellNumber.ts` 하나로 모였고, 시간 길이 꼴은 다섯 자리에 흩어져 있다.** `screens/payroll/utils/summary.utils.ts`와 `historyRows.utils.ts`, `screens/scheduleAdmin/utils/adjustSheetRows.utils.ts`, `screens/rehearsal/utils/spellTotal.utils.ts`, `screens/stats/utils/payrollSummary.utils.ts`가 같은 `floor`와 `%`를 각자 들고, 앞의 것만 「0시간 30분」으로 0을 적는다 — `writing.md`가 「30분」 쪽으로 판정했으니 `summary.utils.ts`가 어긋난 쪽이다. `spell-number-shared` candidate가 받고, plan AC-13의 사본 묶음과 같은 손이다.

**e2e TDD 훅이 꺼져 있던 것을 통계 묶음이 고쳤다.** AC-02가 슬라이스 폴더를 camelCase로 바꾼 뒤 훅이 `tests/e2e/adminStats.yaml`을 찾는데 파일은 `admin-stats.yaml`이라, camel로 이름이 바뀐 화면 다섯이 Edit·Write로 영영 못 열렸다. 그 사이의 `.tsx` 수정이 Bash의 `perl -pi`로 지나가서 막힌 줄 몰랐다 — **훅이 Edit·Write만 보고 Bash를 안 본다.** 관찰 054고 그 구멍은 열려 있다.

**`internal` 스키마의 실제 방어는 두 겹뿐이다.** PostgREST 라우팅과 스키마 USAGE다 — 문서가 요구하는 「함수 revoke」 한 겹은 저장소 전체에서 안 서 있다. `internal-grants-public` candidate가 고칠 길(`revoke execute on all functions in schema internal from public`)까지 적어 뒀다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024, open).** `backlog.md`의 `test-seed-transaction`이 받는다. `addAssignment.integration.test.ts`가 전체 실행에서 한 번 이 경쟁으로 흔들렸다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더. 여기에 Edge Function 배포 뒤 손 확인(`profile-erasure`의 AC-03)이 더해졌다.

회차 기록은 [docs/log/2026-10-01.md](log/2026-10-01.md)다 — `notification-settings`의 막힌 판정 여섯(#475)과 그 구현(#476), 관찰 정리(#477), 시안↔문서 여백 어긋남을 시안 쪽에서 맞춘 `sian-sync`(#478)가 들었다. 그 앞은 [docs/log/2026-09-29-3.md](log/2026-09-29-3.md)(공휴일 받기·알림 목록)와 [docs/log/2026-09-29-2.md](log/2026-09-29-2.md)(계정 삭제 파이프라인)와 [docs/log/2026-09-29.md](log/2026-09-29.md)(통계 모듈)와 [docs/log/2026-09-28.md](log/2026-09-28.md)(급여 모듈)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
