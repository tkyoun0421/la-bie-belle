---
status: open
target: docs/4-test/execution.md
date: 2026-10-11
---

# 전체 suite를 한꺼번에 돌리면 query 테스트가 간헐적으로 타임아웃한다

`pnpm test`로 435 suite를 돌리면 `services`의 query 테스트가 **아무 변경과 무관하게** 가끔 실패한다. 따로 돌리면 통과한다.

이 회차에 본 넷이다.

| 자리 | 꼴 |
| --- | --- |
| `entities/payroll/services/__tests__/useWageRatesQuery.test.ts` | `waitFor` 단언이 안 맞는다 |
| `entities/schedule/services/__tests__/useFirstScheduleMonthQuery.test.ts` | 같다. 8.4초를 쓴다 |
| `entities/availability/hooks/__tests__/useApplicationsList.test.ts` | `waitFor(… "pending" …)`가 타임아웃한다 |
| `entities/notification/ui/__tests__/UnreadCountLine.test.tsx` | suite 자체가 안 뜬다 |

**셋을 따로 돌리면 6/6 통과한다.** CI는 초록이다.

## 왜 마찰인가

**구현자와 작성자가 이것을 자기 변경 탓으로 오해한다.** 이 회차에 두 subagent가 각자 한 번씩 보고했고, 둘 다 「내 변경과 무관해 보인다」고 단 뒤에 넘겼다. 다음 사람은 그 판단을 또 처음부터 해야 한다.

**제한 시간을 늘리는 값을 처음에 과하게 봤다.** 「진짜 실패도 같이 늦게 잡힌다」고 적었는데 그 비용이 생각보다 훨씬 작다 — **`waitFor`는 조건이 참이 되는 즉시 돌아온다.** 통과하는 테스트는 제한이 1초든 5초든 **같은 시간을 쓴다.** 늘어나는 것은 **실패하는 테스트가 보고되기까지**뿐이고, 그건 드물고 그때는 이미 들여다보는 중이다.

지워도 되는 테스트와는 가른다. 묶음 1에서 지운 「재시도 중」 테스트 일곱은 **단언이 아무것도 안 지켜서** 지웠고 이 넷은 지킬 것이 있다.

## 원인을 쟀다

**자원 다툼이다.** `useFirstScheduleMonthQuery.test.ts`를 혼자 돌리면 **0.399초**고 전체 실행에서 **8.4초**를 쓴다 — **21배**다. 기계가 8코어고 Jest가 기본으로 7 worker를 띄워 435 suite를 나눠 돌린다.

**`waitFor`의 제한이 벽시계라서 그 늘어남을 못 견딘다.** `@testing-library/react-native` 13.3.3의 기본값이 `asyncUtilTimeout: 1000`이다(`build/config.js:14`). 혼자서 20ms에 가라앉는 조건이 21배로 늘어나면 1000ms를 넘는다.

**재시도는 원인이 아니다.** `QueryClient`를 세우는 테스트 130곳이 **전부** `retry: false`를 적어 뒀다. 지수 백오프가 7초를 먹는 길은 막혀 있다.

**`UnreadCountLine.test.tsx`는 꼴이 다르다** — suite 자체가 안 뜬 것이라 `waitFor` 타임아웃이 아니고 이 설명이 안 덮는다.

## 고칠 길

**`asyncUtilTimeout`을 올린다.** 통과하는 테스트의 시간이 안 변하니 비용이 없고, 벽시계가 21배로 늘어나는 자리를 견딘다. 자리는 두 프로젝트의 setup 파일이다.

**`maxWorkers`를 줄이는 길도 있지만 더 나쁘다** — 다툼은 줄지만 **모든 실행이 느려진다.** 한쪽은 실패할 때만 비용을 내고 한쪽은 늘 낸다.

**얼마로 올릴지는 재서 정한다.** 혼자 20ms에 가라앉는 조건이 21배로 늘어도 420ms다 — 1000ms가 모자란 자리는 그보다 더 늘어난 순간이고, 5000ms면 열두 배의 여유를 두면서 멈춘 조건은 5초에 잡는다.

**적어 두는 것으로는 안 끝난다.** 꼴만 적어 두면(「`services`의 query 테스트가 타임아웃하면 따로 돌려 가린다」) 다음 사람이 판단을 다시 안 해도 되지만, **그 네 자리가 실제로 깨졌을 때도 「알려진 플레이크」로 넘어갈 위험**이 남는다. 원인을 쟀으니 적는 쪽이 아니라 고치는 쪽으로 간다.
