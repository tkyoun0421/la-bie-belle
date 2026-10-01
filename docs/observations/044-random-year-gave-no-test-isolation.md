---
status: open
target: tests/integration/postgres.ts
date: 2026-10-01
resolved:
---

# 랜덤 연도가 테스트 격리를 못 줬다

## 일

`public.holidays`는 테스트마다 안 비워진다. 그래서 두 integration 파일이 **연도로 자리를 갈랐는데**, 가르는 방법이 둘 다 같은 랜덤이었다.

```ts
// payrollFunctions.integration.test.ts
function freshHolidayYear(): number {
  return 2050 + Math.floor(Math.random() * 900);
}

// fetchHolidays.integration.test.ts
const year = 2050 + Math.floor(Math.random() * 900);
```

`fetchHolidays`의 단언은 「거절됐으니 **아무것도 안 들어간다**」였다.

```ts
expect(error?.message).toBe("not_allowed");
expect(apiHolidayCountInYear(year)).toBe(0);
```

그 카운트가 `1`로 왔다. 거절은 제대로 됐고, 센 행은 **다른 파일이 같은 연도에 넣은 것**이었다.

## 왜 늦게 터졌나

`freshHolidayYear`라는 이름이 「비어 있는 연도」를 약속하는데 함수는 그것을 **확인하지 않았다**. 900개 중 다섯을 뽑으니 충돌이 1% 남짓이고, 그 확률은 한참 안 터진다. 파일 이름을 바꾸면서 jest의 워커 분배가 달라진 회차에 드러났다 — 이름 변경이 만든 결함이 아니라 **이름 변경이 흔든 잠복 결함**이다.

같은 축에서 하나가 더 있었다. 「이미 지난 날짜를 열면 `date_past`」가 이번 달 1일을 과거로 썼는데 **오늘이 그 1일인 날** 그 날이 과거가 아니었다. 둘 다 「고른 값이 조건을 만족하는지 안 보는」 꼴이다.

## 제안

**픽스처가 약속하는 것을 그 함수가 확인하게 한다.** `freshHolidayYear`가 「비었다」를 이름에 걸었으면 세어 보고 비었을 때 돌려줘야 한다. 지금은 그렇게 고쳤고 범위도 둘로 갈랐다(2050~2499 / 2500~2949).

범위를 가르는 일이 파일마다 손으로 적히는 것이 남는 위험이다. `tests/integration/postgres.ts`가 「이 표에서 안 쓰인 연도」를 주는 함수 하나를 들면 그 손이 없어진다 — 지금은 같은 루프가 두 파일에 산다.
