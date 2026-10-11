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

**더 나쁜 길도 있다.** 플레이크를 잡으려고 `waitFor`의 제한 시간을 늘리면 **진짜 실패도 같이 늦게 잡힌다.** 이 회차에 비슷한 자리를 하나 지웠는데(묶음 1의 「재시도 중」 테스트 일곱), 그건 단언이 아무것도 안 지켜서 지운 것이고 이 넷은 지킬 것이 있다.

## 안 하기로 한 것

**원인을 아직 안 봤다.** 짐작은 435 suite를 병렬로 띄울 때의 자원 다툼이고, `jest --maxWorkers`나 각 테스트가 세우는 `QueryClient`의 실제 타이머가 후보다. 짐작으로 고치면 안 터지는 자리를 건드린다.

## 판정이 필요한 것

**`docs/4-test/execution.md`에 「이 넷은 전체 실행에서 간헐적으로 실패하고 따로 돌리면 통과한다」를 적을지**다. 적으면 다음 사람이 같은 판단을 다시 안 한다. 안 적으면 그 네 자리가 실제로 깨졌을 때도 「알려진 플레이크」로 넘어갈 위험이 생긴다.

그 위험을 줄이는 길이 하나 있다 — **이름을 적지 말고 꼴만 적는 것**이다. 「`services`의 query 테스트가 전체 실행에서 `waitFor` 타임아웃을 내면 따로 돌려 가린다」까지만 두면 특정 파일에 면죄부를 안 준다.
