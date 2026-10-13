# 아무도 안 부르는 export가 사라지고, 검사가 다시 생기지 않게 막는다

[감사](../../proposals/post-refactor-audit.md) 축 ①이 어디서도 import 안 되는 값 export 17과, 프로덕션이 안 부르고 테스트만 부르는 `src` 파일 14를 셌다. 지울 것은 지우고, 기다리는 것은 **기다리는 backlog 행 이름**을 달아 검사가 면제한다. 행이 닫히면 면제가 풀린다.

## 판정 — 묻지 말고 이 꼴로 쓴다

**지운다.** `Position`(`entities/schedule/model/schedule.type.ts`) · `HomeTileState`(`screens/adminHome/model/homeTileSummary.policy.ts`)는 자기 파일에서도 안 쓰는 타입이다. `EXCUSE_BODY_MAX_LENGTH`는 사유 화면이 설 때 그 화면 문서의 값으로 다시 선다 — 이름 하나를 면제하려고 검사에 이름 단위 칸을 세우지 않는다. `getDayAttendance.api.ts`와 integration 짝은 드는 행이 없다 — 달 단위 읽기가 그 일을 한다.

**export만 뗀다.** 자기 파일에서만 쓰는 셋 — `AdjustChoiceSheet.tsx`·`DayDetailCard.tsx`의 `*_TEST_ID` · `Text.tsx`의 `MAX_FONT_SIZE_MULTIPLIER`. `excuseDeadlineAt`은 짝 테스트가 당겨 재므로 export를 둔다.

**기다린다.** 막힌 task가 쓸 코드는 프로덕션에 둔다. 지우면 그 task가 다시 쓴다.

| 기다리는 것 | 행 |
| --- | --- |
| `checkIn.api.ts` | `attendance-checkin` |
| excuse 여섯과 `EXCUSE_BODY_MAX_LENGTH` | `attendance-excuse` |
| `setHallLocation.api.ts` | `hall-location` |
| `handleAuthCallback.lib.ts` · `authRedirect.utils.ts` | `login-screen-native` |
| `DraggableSheet.tsx` | 관찰 028이 판정을 든다. 면제 키는 그 관찰 파일 이름이다. 아무도 안 당기는 파일이라 면제 표에 든 동안은 죽은 export 셈에서도 빠진다 |

**드는 행이 없는 것은 지운다.** `getPushReachable.api.ts`와 짝, `reduceMotion.lib.ts`(`motionDistance` 하나뿐이다)와 짝.

**파일은 살았는데 함수만 아무도 안 부르는 열셋은 이 task 밖이다.** 감사가 판정을 안 했고, 같은 꼴이 `audit-checks-into-catalog`의 검사 목록에 든다.

## 검사

`tests/lint/deadExports.test.ts` 하나에 `it` 둘.

1. `src`의 값 export 가운데 어떤 파일(테스트 포함)도 당기지 않는 것이 0이다. 밖은 `src/app` default · `index.ts` 재수출 · `scripts/syncEdgeShared.mts`가 복사하는 폴더의 export · `tests/lint`가 글자로 읽는 대조 상수(`CHECK_IN_WINDOW_CLOSE_HOUR_KST`) · 생성물 `databaseTypes.ts`
2. 테스트만 당기는 `src` 파일이 면제 표에 든 것뿐이다. 면제 표는 `{ 파일: 행 이름 }`이고, 그 행이 backlog에 있고 `done`이 아니어야 한다 — 행이 닫혔는데 표에 남으면 빨갛다. 관찰 키는 그 관찰의 `status`가 `open`이어야 한다

셈은 감사의 「세는 법」 꼴을 따른다 — 여러 줄 import, `export … from`, `import()`, `jest.mock`·`jest.unstable_mockModule` 지정자를 다 읽는다.

## 완료 조건

- **AC-01** 위 두 `it`이 초록이다
- **AC-02** 지운 것과 export를 뗀 것이 판정 표 그대로다
- **AC-03** `pnpm lint`·`pnpm typecheck`·`pnpm test` 초록
