# 급여

짝은 [domain/payroll.md](../../domain/payroll.md)다. 키는 `['payroll', 'YYYY-MM']`이고 `wage_rates`·`adjustments`·`excuse_status`를 그달치로 받는다. 배정과 날은 `['schedule', 'YYYY-MM']`을 같이 쓴다 — 급여 화면이 두 키를 읽고 순수 함수에 넣는다. 무효화는 [`README.md`](README.md#무효화-표)에 있다.

## 계산은 클라이언트가 매번 한다

저장된 금액이 없다. 두 키가 갖춰지면 `features/payroll`의 순수 함수가 돈다. 서른 명 한 달이면 배정 천 행이라 `useMemo` 하나면 된다. 통계가 여러 달을 합칠 때는 달마다 키를 읽어 더한다.

급여 달과 근무표 달의 범위가 다르면 급여 한 달이 `['schedule']` 두 달을 읽는다 — [`README.md`](README.md#아직-안-정한-것)의 달 키 범위가 정해지면 따라간다.

## 응답을 기다린다

시급·조정 전부다. 돈이라 낙관적으로 칠하지 않는다.
