# `shared`를 거쳐 받지 않고 거기서 받는다

`screens`의 `model` 파일 셋과 `entities`의 `utils` 하나가 `shared/utils/kstDate`의 함수를 다시 내보내고, 소비처 여섯이 그 경유지에서 당긴다. 그래서 「이 파일이 어느 층을 당기나」를 세면 거짓이 나온다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 C다.** [`screens-calc-placement`](../../backlog.md)의 선행이다 — 가름표를 기계가 세게 하려면 재수출을 먼저 걷어야 셈이 맞는다.

**저장소에서 확인한 것 — 재수출이 넷이다.**

| 자리 | 내보내는 것 | 꼴 |
| --- | --- | --- |
| `src/screens/adminHome/model/todayStatus.policy.ts:1` | `kstDateOf` · `spellDate` | `export { ... } from "@/shared/utils/kstDate"` |
| `src/screens/scheduleWorker/model/monthState.policy.ts:35` | `shiftMonth` · `spellMonth` | 같다 |
| `src/screens/scheduleAdmin/model/monthEmptyState.policy.ts:9` | `lastDateOfMonth` · `shiftMonth` | import한 뒤 따로 `export { ... }` |
| `src/entities/schedule/utils/formatScheduleDate.utils.ts:3` | `kstDateOf` | 같다 |

`src/` 비(非)테스트 파일에서 `export ... from`과 「import한 이름을 다시 `export {}`」를 전수로 세어 이 넷이 전부다.

**죽은 재수출이 아니다 — 소비처가 여섯이다.**

| 소비처 | 당기는 이름 | 어느 경유지에서 |
| --- | --- | --- |
| `src/screens/adminHome/hooks/useAdminHomeScreen.ts:35` | `spellDate` | `todayStatus.policy` |
| `src/screens/adminHome/model/vacancyCards.policy.ts:3-6` | `kstDateOf` · `spellDate` | `todayStatus.policy` |
| `src/screens/scheduleWorker/hooks/useScheduleWorkerScreen.ts:22-28` | `shiftMonth` · `spellMonth` | `monthState.policy` |
| `src/screens/scheduleAdmin/hooks/useScheduleAdminScreen.ts:60-63` | `shiftMonth` | `monthEmptyState.policy` |
| `src/screens/scheduleAdmin/model/confirmAffordance.policy.ts:1` | `kstDateOf` | `formatScheduleDate.utils` |
| `src/screens/scheduleAdmin/model/monthEmptyState.policy.ts:2` | `kstDateOf` | `formatScheduleDate.utils` |

**무엇이 거짓이 되나.** `confirmAffordance.policy.ts`와 `monthEmptyState.policy.ts`는 `entities/schedule`을 당기는 것처럼 보이는데 실제로 받는 것은 `shared/utils`의 함수다. 그 둘의 「당기는 도메인 슬라이스 수」가 겉으로 1, 실제로는 0이다. `vacancyCards.policy.ts`도 `screens/adminHome`의 형제를 당기는 것처럼 보이지만 받는 것은 `shared`다.

[ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 가름표가 「당기는 도메인 슬라이스가 몇이냐」로 파일의 자리를 정한다. 그 셈이 import 문을 읽어 서는데, 경유지가 섞이면 사람도 기계도 틀린 수를 센다.

## 왜 고치나

[관찰 065](../../observations/065-no-home-for-cross-feature-calculation.md)가 「집이 없다」로 닫혔다가 뒤집힌 자리와 같은 꼴이다 — 실제 의존이 아니라 보이는 의존으로 판정했다. 재수출은 그 오판을 구조로 만든다.

`shared`는 모든 층이 직접 당길 수 있다. 경유지를 둘 까닭이 없다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| 위 재수출 넷 | 그 줄을 지운다. `monthEmptyState.policy.ts`와 `formatScheduleDate.utils.ts`는 자기가 쓰는 import는 남기고 `export {}`만 지운다 |
| 소비처 여섯 | import 출처를 `@/shared/utils/kstDate`로 돌린다 |
| `eslint-rules/noLayerReexport.mjs` | 신설 — `shared` 밖의 파일이 다른 모듈의 이름을 다시 내보내는 것을 막는다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` · `tests/lint/rules.ts` · `docs/4-test/execution.md` | 규칙 하나를 켜는 다섯 자리의 나머지 넷 |

`import/no-duplicates`가 걸릴 자리가 있다 — 소비처 가운데 `@/shared/utils/kstDate`를 이미 당기는 파일이면 import 문 둘이 생긴다. `pnpm exec eslint --fix`가 합친다.

## 완료 조건

- **AC-01** `src/` 비(非)테스트 파일에서 `shared` 밖의 재수출이 0이다 — `export ... from`과 「import한 이름을 다시 `export {}`」 둘 다
- **AC-02** 소비처 여섯이 `@/shared/utils/kstDate`에서 직접 당긴다
- **AC-03** `eslint-rules/noLayerReexport.mjs`가 `shared` 밖의 재수출을 막고, 그 규칙이 다섯 자리에 한 커밋으로 선다
- **AC-04** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 소비처 여섯의 import를 `@/shared/utils/kstDate`로 돌린다
2. 재수출 넷 줄을 지운다
3. `pnpm exec eslint --fix`로 중복 import를 합친다
4. lint 규칙을 다섯 자리에 한 커밋으로 켠다. **자리를 다 옮긴 뒤여야 초록이 난다**
5. 검증하고 PR을 연다

실패 테스트가 따로 서지 않는다 — 옮기는 일이라 관찰 가능한 동작이 안 바뀌고, 그 불변은 기존 짝 테스트가 지킨다. AC-01과 AC-03은 lint 규칙 자체가 검사고, 그 규칙의 짝 테스트가 `tests/lint/rules.ts`에 선다.

## 리스크

**`shared/utils/kstDate` 밖에도 같은 꼴이 있을 수 있다.** 이 계획은 `kstDate`의 네 자리를 세었다. 1번 걸음 전에 전수를 다시 세고 더 있으면 범위에 넣는다 — 규칙이 켜지면 그 자리도 막히므로 빼놓으면 lint가 빨개진다.

**`formatScheduleDate.utils.ts`는 `entities`다.** 재수출을 지우면 그 파일이 `kstDateOf`를 자기 안에서만 쓴다. 남는 export 다섯(`formatScheduleDate`·`formatBareDate`·`formatMonthName`·`formatMonthTitle`·`confirmedLine`)은 도메인 문안이라 그 자리가 맞다.
