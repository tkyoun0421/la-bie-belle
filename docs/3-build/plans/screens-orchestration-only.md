---
sources:
  - ../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md
  - ../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md
  - ../../2-design/system/navigation.md
---

# `.tsx`가 조립만 하게 한다

통신 쪽 경계는 섰다 — `ui`가 `api`·`services`·Supabase 클라이언트·`.dto.ts`를 당기는 자리가 0이다. 남은 것은 **값을 만드는 일**이 화면에 있다는 것이다. 포맷과 판정을 `.tsx`가 직접 부르고, 갈 데를 `.tsx`가 고르고, 상태마다 그리는 코드와 시트 배선이 한 파일에 쌓인다.

## 입력 명세·기준

**정본은 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 「`.tsx`는 조립만 한다」다** — `ui/*.tsx`가 최종 오케스트레이션 레이어고, 조각을 배치하고 controller가 준 값을 꽂는 것까지가 그 일이다. 같은 절이 「조각도 controller를 가진다」를 적고, controller의 파일 꼴이 `hooks/use<화면>.ts`에서 `hooks/use<조각>.ts`로 넓어졌다.

**저장소에서 확인한 것.**

- **`ui`가 `utils`를 값으로 당기는 자리가 스물둘, `model`이 다섯이다.** 그 스물일곱이 「`.tsx`가 값을 만든다」의 전부다. 아무 lint 규칙도 안 문다 — 통신 쪽 넷만 막혀 있다
- **그 스물일곱이 조각에 몰렸다.** `screens/*/ui` 쉰넷 중 화면 파일은 스물이고 조각이 서른넷인데, 값 import 스물다섯 중 **화면 파일은 둘**이고 나머지가 조각이다. `MemberSheet.tsx` 하나가 `canSaveDisplayName`·`formatBirthDate`·`spellGender`·`spellLeftAt` 넷을 부른다
- **`useRouter`를 쥔 `.tsx`가 스물이고 controller는 0이다.** `AdminHomeScreen.tsx`는 `router.push`를 열 번 부르고 `` `/admin/schedule?month=${asked}` ``처럼 쿼리까지 조립한다. `ScheduleAdminScreen.tsx`는 `from === ORIGIN_APPROVALS`를 보고 갈 데를 고른다
- **상태마다 그리는 삼항이 사슬로 쌓였다.** `PendingScreen.tsx` 서른하나, `ScheduleAdminScreen.tsx` 스물여덟, `MemberSheet.tsx` 열아홉이다. controller는 이미 상태 이름을 준다 — `listState`가 스물여섯 자리, `sheet`가 스물여섯 자리에 있다. `.tsx`가 그 이름을 받아 자기 안에서 분기한다
- **한 `.tsx`가 화면 여럿을 든다.** `PendingScreen.tsx`가 `stage` 넷으로 각자 `<Screen>`을 그리고, `ScheduleAdminScreen.tsx`가 `screen.day !== null`로 날 상세와 달력을 가른다
- **시트 배선이 베껴진다.** `DayDetail.tsx`가 `SheetLayer`를 여덟 번, `ScheduleAdminScreen.tsx`가 다섯 번 쓴다. `screen.sheet?.kind === "hours" ? <SheetLayer><DayHoursSheet 인자 여덟 /></SheetLayer> : null` 꼴이 시트마다 서고, controller가 든 값을 시트 props로 하나씩 옮겨 적는다
- **`useState`가 조각 둘에 남았다.** `MemberSheet.tsx`와 `MemberDetailSheet.tsx`의 `menuOpen`이고 둘 다 UI 상태라 허용 범위지만, 그 조각에 controller가 없어서 거기 남은 것이다

## 왜 따로 떼나

**[fsd-read-write-layers](fsd-read-write-layers.md)가 통신 축만 닫았다.** 그 task의 AC-12가 클라이언트를 쥐는 자리를 controller로 올리고 검사 열일곱을 세웠는데, 세운 축은 전부 「`.tsx`가 **통신에** 닿나」였다. 포맷과 판정은 통신이 아니라서 그 그물을 지난다.

**controller의 정의가 바뀌어야 한다.** 조각의 로직을 올릴 데가 없어서 `.tsx`에 남았다 — controller를 화면 단위로만 두면 조각이 갈 곳이 없고, 화면 controller가 조각의 props까지 만들면 그것이 뭉치가 된다. ADR-015를 먼저 고쳐 「조각도 controller를 가진다」를 세우고 이 계획이 전개한다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `screens/*/hooks/use<조각>.ts` | 신설 — 조각이 쓰던 포맷·판정을 그 훅이 부른다 |
| `screens/*/ui/<조각>.tsx` | 식별자와 완성된 값만 받는다. `model`·`utils` import가 사라진다 |
| `screens/*/hooks/use<화면>Screen.ts` | `useRouter`를 쥐고 갈 데를 값으로 돌려준다 |
| `screens/*/ui/<화면>Screen.tsx` | 조각을 배치하고 controller의 값을 꽂는다. 삼항 사슬이 조각 고르기로 |
| `screens/*/ui/<화면>Sheets.tsx` | 신설 — `screen.sheet`를 받아 어느 시트를 세울지 고른다 |
| `eslint-rules/uiValueImport.mjs` | 신설 — `ui/`에서 `model`·`utils`를 값으로 당기는 것을 막는다 |

## 완료 조건

### AC-01 — 조각마다 controller가 선다

- 전제: 로직을 든 조각이 열일곱이다. `MemberSheet`(4) · `PositionRow`(3) · `PersonSheet`(3) · `ConfirmSheet`(2) · `CloseDayWarningSheet`(2) · `MemberDetailSheet`(2)가 많은 쪽이고 나머지 열하나가 하나씩이다. 한 슬라이스를 열어 보면 그 안에 값 import가 없는 조각이 섞여 있다 — `scheduleAdmin`의 열 중 `DayHoursSheet`·`SlotSheet`·`QualificationSheet` 셋이 그렇다. 세는 단위가 파일이 아니라 import라서 생기는 차이고, 그 셋은 controller 없이 지나간다
- 행동: 그 조각마다 `hooks/use<조각>.ts`를 세운다. 조각이 받는 props는 식별자와 콜백이고, 문구·판정·열림 상태는 그 훅이 든다. `menuOpen` 둘도 거기로 간다
- 관찰 결과: 그 조각들의 `.tsx`에 `model`·`utils` import가 없다. 짝 테스트가 controller를 본다

### AC-02 — `ui`가 값을 만들지 않는다를 검사가 잰다

- 전제: `ui` → `utils` 22 · `ui` → `model` 5다. 타입 import는 괜찮고 값 import가 문제다
- 행동: `ui/` 안에서 `model`·`utils`를 **값으로** 당기는 것을 막는 규칙을 세운다. `import type`은 통과한다 — 도메인 타입을 props로 받는 것이 `entities/*/ui`의 기준이다
- 면제: 없다. `features/*/ui`는 service를 부르지만 그것은 다른 축이다
- 관찰 결과: AC-01이 끝난 뒤 `pnpm lint`가 0건이다

### AC-03 — 갈 데를 controller가 값으로 준다

- 전제: `useRouter`를 쥔 `.tsx`가 스물이고 controller는 0이다. 그중 다섯이 조건을 보고 갈 데를 고른다 — `from === ORIGIN_APPROVALS` 꼴 하나와 `router.canGoBack()` 꼴 넷이다
- 행동: controller가 `useRouter`를 쥔다. 「어디서 왔으면 어디로 돌아간다」와 쿼리 조립이 controller로 가고, `.tsx`는 `onBack={screen.goBack}` 꼴로 콜백만 받는다. 경로 문자열이 `.tsx`에 없다
- 관찰 결과: `screens/*/ui/*.tsx`에 `useRouter`와 경로 리터럴이 없다. 짝 테스트가 「승인에서 왔으면 승인으로 돌아간다」를 controller에서 단언한다

### AC-04 — 상태마다 조각이 선다

- 전제: 삼항 사슬이 `PendingScreen` 31 · `ScheduleAdminScreen` 28 · `MemberSheet` 19 · `PositionRow` 15 · `DayDetail` 15 · `ProfileScreen` 15이다. controller는 이미 `listState`·`stage`·`sheet` 같은 상태 이름을 준다
- 행동: 상태마다 조각을 세우고 `.tsx`는 그 이름으로 고른다. 「빈 상태」·「불러오는 중」·「실패」가 각자 파일이 된다
- 관찰 결과: 한 `.tsx`의 삼항이 다섯을 넘지 않는다

### AC-05 — 한 `.tsx`가 화면 하나를 든다

- 전제: `PendingScreen.tsx`가 `stage` 넷으로 `<Screen>` 넷을, `ScheduleAdminScreen.tsx`가 둘을 그린다
- 행동: 조건으로 갈리는 화면을 파일로 가른다. 라우트가 고르거나 상위 `.tsx`가 조각 둘 중 하나를 고른다
- 관찰 결과: `screens/*/ui/*.tsx`에서 `<Screen`이 둘 이상인 파일이 없다

### AC-06 — 시트를 고르는 자리가 하나다

- 전제: `SheetLayer`가 `DayDetail` 8 · `ScheduleAdminScreen` 5 · `ProfileScreen` 3에 쓰인다. 시트마다 `kind` 판정과 props 옮겨 적기가 반복된다
- 행동: 화면마다 `ui/<화면>Sheets.tsx`가 `screen.sheet`를 받아 고른다. 화면 파일은 그것을 한 줄로 부른다
- 관찰 결과: 시트 배선과 props 옮겨 적기가 화면 파일을 떠난다. 화면 파일의 `SheetLayer`가 0이다
- **겹쳐 뜨는 시트는 그 자리에서 둘일 수 있다.** `rehearsal`은 날 시트 위에 폼 시트가 쌓이고 닫기가 위에서부터라, 하나로 줄이면 보이는 것이 바뀐다 — 「UI가 보이는 결과를 바꾸지 않는다」가 이 수치보다 앞이다. 시트 스택을 한 `SheetLayer`로 접는 것은 그 컴포넌트를 다시 설계하는 일이라 이 task 밖이다

## 구현 순서

**슬라이스 축으로 가른다.** 조각과 그 controller와 그 화면 파일이 한 슬라이스에 살아서, 슬라이스 하나를 고르면 AC 여섯이 그 안에서 같이 닫힌다. 묶음끼리 파일이 안 겹친다.

1. **본보기 하나** — `members`를 직렬로 한다. `MemberSheet`가 로직을 가장 많이 들고(4) 삼항도 열아홉이라 AC-01·02·04가 한 자리에서 다 보인다. 거기서 꼴을 박는다
2. **나머지 슬라이스를 병렬로** — `scheduleAdmin`이 가장 크다(조각 여덟이 로직을 들고 `DayDetail`이 시트 여덟). `pending`·`profile`·`membersPending`·`qr`·`rehearsal`·`notifications`·`scheduleWorker`가 나머지다
3. **AC-03을 횡단으로** — 라우팅은 슬라이스마다 조금씩 있어 묶음에 섞인다. 경로 상수가 `shared/consts/navigation.const.ts`에 이미 있다
4. **AC-02의 규칙을 마지막에 켠다** — 0건에 닿은 뒤다

## 리스크·전환·되돌리기

**파일 수가 는다.** AC-01이 controller 열일곱을, AC-04가 상태 조각을, AC-06이 화면마다 시트 고르는 파일을 세운다. 그 값은 조각이 어디에 꽂혀도 같이 움직이는 것이고, 대가는 한 화면을 읽으려면 파일 넷을 열어야 한다는 것이다.

**TDD 훅이 짝 없는 새 `.ts`를 막는다.** controller 열일곱에 짝 테스트가 먼저 서야 한다. 조각의 controller는 포맷·판정을 부르는 얕은 층이라 단언이 「그 함수를 불러 완성된 값을 준다」가 된다 — 그 단언이 값을 하는 자리와 타입이 이미 잡는 자리를 가른다(매퍼에서 같은 축을 밟았다).

**되돌리기는 슬라이스 단위다.** 어느 슬라이스에서 멈춰도 저장소가 선다 — 끝난 슬라이스는 조각이 controller를 가지고, 안 끝난 슬라이스는 `.tsx`가 값을 만든다. 규칙을 마지막에 켜므로 중간 상태에서 `pnpm lint`가 막지 않는다.

## 검증 방법

- `pnpm lint` · `pnpm typecheck` · `pnpm test`
- 값 import 전수 — `ui/` 안에서 `model`·`utils`를 값으로 당기는 자리를 센다
- `useRouter`와 경로 리터럴 전수 — `screens/*/ui/*.tsx`에 없는지
- `<Screen`과 `SheetLayer`의 파일당 개수

## 여기서 안 하는 것

- **`shared/ui`의 도메인 낱말** — `RosterRow`·`SlotCard`가 이름에 도메인을 달지만 도메인 층을 하나도 import하지 않는다. ADR-015가 그 우회를 그대로 두기로 적었다
- **`features/*/ui`의 service 호출** — 그것이 use case를 실행하는 조각이라는 뜻이고 다른 축이다
- **조각을 `entities/*/ui`로 올리기** — 두 슬라이스 이상이 쓰는 조각이 아직 없다. 올라갈 이유가 생기면 그때다
