# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `fsd-read-write-layers`의 여덟째 묶음이다 — 타입 빼내기와 `model`·`utils` 가르기(AC-06나).** 타입 선언 492개가 파일 186개에 흩어져 있고 `model` 파일 119개 중 88개가 함수와 타입을 같이 든다. 도메인의 모양을 말하는 타입을 `[domain].type.ts`로 빼고(훅의 반환 꼴처럼 좁은 것은 그 파일에 남는다), 순수 함수를 판정(`[domain].policy.ts`)과 꼴 바꾸기(`[domain].utils.ts`)로 갈라 옮기고, 바깥 값 검증을 `[domain].schema.ts`로, zustand store를 `[domain].store.ts`로 모은다. `[domain]`은 **쪼개진 뒤의 슬라이스 이름**이다 — 그래서 이 묶음이 AC-07 뒤다. **같이 고칠 두 줄이 있다** — `runtime.md`가 「상수는 `src/entities/<도메인>/model/constants.ts`에 산다」고 적어 ADR-015의 `[domain].type.ts`(「타입과 상수」)와 어긋나고, `tests/lint/attendanceConstants.ts`가 그 경로를 글자로 박고 있다. **이 task가 도는 동안 다른 코드 task를 띄우지 않는다.**

**묶음 일곱이 끝났다(#483·#484·#485·#486·#487·#488 그리고 7).** 이름이 camelCase가 되고(535개, `Db`→`DB` 334회), 폴더도 camelCase가 되고, 캐시 키가 `src/shared/api/queryKeys.ts` 팩토리 하나로 모이고, 통신 74개가 `entities/*/api/`의 `[action].api.ts`가 되고, 훅 59개가 `hooks/`로 가며 읽기·쓰기로 층이 갈렸다. 그리고 `shared/lib`이 사라져 `api`·`hooks`·`utils`로 갈리고 층이 틀린 아홉이 `features/auth`·`entities/session`·`entities/clock`으로 갔다. 그리고 슬라이스가 **entities 14 · features 22**로 쪼개졌다 — `no-cross-slice-import`가 0건이다. 지금 **`entities/`에 `useMutation`이 없고 `features/`에 `useQuery`가 없다.**

**묶음마다 커밋이 성격으로 갈려 있다** — 자리와 이름만 바꾸는 커밋은 내용 0줄이고 참조 수정이 그 뒤에 온다. `git log --follow`가 이동을 따라가게 하는 값이고, 리뷰도 생각이 든 커밋만 읽으면 된다. 남은 묶음 셋도 같은 꼴로 간다.

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

**금액 꼴은 `shared/lib/spellNumber.ts` 하나로 모였고, 시간 길이 꼴은 아직 슬라이스 셋에 흩어져 있다.** `screens/payroll/utils/summary.utils.ts`의 `spellWorkedHours`(「0시간 30분」)와 `screens/schedule-admin/model/adjustSheetRows.ts`의 `spellHours`·`features/rehearsal/model/spellTotal.ts`의 `spellMinutes`(「30분」)가 갈려 있다 — `writing.md`가 「30분」 쪽으로 판정했으니 `summary.ts`가 어긋난 쪽이다. `spell-number-shared` candidate가 받는다.

**`internal` 스키마의 실제 방어는 두 겹뿐이다.** PostgREST 라우팅과 스키마 USAGE다 — 문서가 요구하는 「함수 revoke」 한 겹은 저장소 전체에서 안 서 있다. `internal-grants-public` candidate가 고칠 길(`revoke execute on all functions in schema internal from public`)까지 적어 뒀다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024, open).** `backlog.md`의 `test-seed-transaction`이 받는다. `addAssignment.integration.test.ts`가 전체 실행에서 한 번 이 경쟁으로 흔들렸다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더. 여기에 Edge Function 배포 뒤 손 확인(`profile-erasure`의 AC-03)이 더해졌다.

회차 기록은 [docs/log/2026-10-01.md](log/2026-10-01.md)다 — `notification-settings`의 막힌 판정 여섯(#475)과 그 구현(#476), 관찰 정리(#477), 시안↔문서 여백 어긋남을 시안 쪽에서 맞춘 `sian-sync`(#478)가 들었다. 그 앞은 [docs/log/2026-09-29-3.md](log/2026-09-29-3.md)(공휴일 받기·알림 목록)와 [docs/log/2026-09-29-2.md](log/2026-09-29-2.md)(계정 삭제 파이프라인)와 [docs/log/2026-09-29.md](log/2026-09-29.md)(통계 모듈)와 [docs/log/2026-09-28.md](log/2026-09-28.md)(급여 모듈)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
