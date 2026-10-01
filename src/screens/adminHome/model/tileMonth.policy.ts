/**
 * 근무표 관리 타일이 말하는 달이다. 정본은
 * `docs/2-design/system/screens/adminHome.md`의 「근무표 관리만 카드다」다.
 *
 * **오늘이 든 달이 기본이고 그 달이 확정됐으면 다음 달이다.** 타일의 일은 「지금 만드는
 * 근무표가 어디까지 왔나」라, 확정된 달을 계속 말하면 월말에 다음 달을 만들러 가는 길이 안
 * 보인다.
 *
 * **오늘 현황과 미니뷰는 이 값을 안 쓴다.** 둘은 지금 벌어지는 일을 보는 자리라 늘 오늘이
 * 든 달이다.
 */

export type TileMonthInput = {
  todayMonth: string;
  todayMonthConfirmed: boolean;
};

export function tileMonth({
  todayMonth,
  todayMonthConfirmed,
}: TileMonthInput): string {
  if (!todayMonthConfirmed) {
    return todayMonth;
  }

  const [year, index] = todayMonth.split("-").map(Number);
  const rolled = index === 12;

  return `${String(rolled ? year + 1 : year).padStart(4, "0")}-${String(
    rolled ? 1 : index + 1,
  ).padStart(2, "0")}`;
}
