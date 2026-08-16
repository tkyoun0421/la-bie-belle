# P0-T47 봉인 후 결정

## D-01 간격 값 0 — 해소

- 상황: RADIO revision 1의 불변 규칙은 "간격은 문서에 적힌 값만 쓴다"인데 FOUNDATIONS 간격 표에 `0`이 없다. `gap-0`·`p-0`·`py-0`이 `src/shared/ui/notification-row.tsx`·`calendar.tsx`·`schedule-row.tsx`, `src/views/schedule/ui/DeadlineBatchList.tsx`에 실사용 중이라 규칙을 그대로 적용하면 `pnpm verify`가 통과하지 못한다. `unit-test-writer`가 RED 작성 중 발견해 반환했고, 테스트는 `0`을 valid·invalid 어느 쪽으로도 단언하지 않았다.
- 결정: **FOUNDATIONS 간격 표에 `space-0` = `0px`를 넣는다.** 린트에 예외 목록을 두지 않고 "표에 있는 값만"이 예외 없이 성립하게 만든다. 2026-08-17 사용자 결정.
- 처리: RADIO revision 2로 재봉인했다(2026-08-17, SHA `fc374520e6b3…`). 범위 ⓪, 인수 조건 9·10, FOUNDATIONS 용도 한정 문구가 함께 열렸다. 구현 차단이 풀렸다.
