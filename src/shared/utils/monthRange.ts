/**
 * 달치 질의가 잡는 창의 두 끝이다. PostgREST에 `gte(monthStart) & lt(nextMonthStart)`로
 * 걸어 경계의 하루가 두 달에 같이 세어지거나 아무 달에도 안 세는 일을 막는다.
 *
 * 이 자리가 `shared`인 것은 `entities/schedule`·`entities/attendance`·`entities/payroll`이
 * 같이 쓰기 때문이다 — 같은 층 슬라이스끼리는 서로를 못 부른다(lint 규칙 3). 넷이 각자
 * 사본을 들고 있었고 그중 하나는 `.slice(0, 7)`을 빼먹어 꼴이 달랐다.
 */

/** `"2026-12"`도 `"2026-12-25"`도 `"2026-12-01"`이다. */
export function monthStart(month: string): string {
  return `${month.slice(0, 7)}-01`;
}

/** `"2026-12"`의 다음은 `"2027-01-01"`이다. */
export function nextMonthStart(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const rolls = index === 12;

  return [
    String(rolls ? year + 1 : year).padStart(4, "0"),
    String(rolls ? 1 : index + 1).padStart(2, "0"),
    "01",
  ].join("-");
}
