/**
 * 달치로 읽어 온 배열에서 보는 달 하나를 집는다. 화면이 열두 달을 한 번에 읽고 그중 한 달을
 * 그리는 꼴이 통계 둘에 같이 있었다 — 관리자 쪽은 함수로, 근무자 쪽은 생
 * `.find((one) => one.month === month)`로 세 자리에 들고 있었다.
 *
 * 이 자리가 `shared`인 것은 쓰는 쪽이 `screens` 슬라이스 둘이라서다 — 같은 층 슬라이스끼리는
 * 서로를 못 부른다(lint 규칙 3). 달 글자만 보고 안에 무엇이 들었는지는 모르니 도메인도 없다.
 *
 * **없는 달은 `undefined`다.** 빈 꼴을 여기서 지어 내리면 「아직 안 온 달」과 「비어 있는 달」이
 * 같은 모양이 되고, 그 가름은 화면마다 다르다.
 */

export function monthIn<Loaded extends { month: string }>(
  loaded: readonly Loaded[] | undefined,
  month: string,
): Loaded | undefined {
  return loaded?.find((one) => one.month === month);
}
