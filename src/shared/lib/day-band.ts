/**
 * 하루 띠가 그리는 두 비율이다. 정본은
 * `docs/2-design/system/screens/dashboard.md`의 「하루 띠」다.
 *
 * **축이 근무다. 하루가 아니다.** 왼쪽 끝이 출근 시각이고 오른쪽 끝이 퇴근 시각이라, 4시간
 * 근무와 9시간 근무가 화면에서 같은 폭으로 선다. 그래서 두 함수가 내는 것은 시각이 아니라
 * 그 축 위의 퍼센트고, 띠 조각은 받은 수를 폭으로 옮기기만 한다.
 */

export type ShiftWindow = {
  start: Date;
  end: Date;
};

const FULL = 100;

function ratioWithin(shift: ShiftWindow, moment: Date): number {
  const span = shift.end.getTime() - shift.start.getTime();
  const elapsed = moment.getTime() - shift.start.getTime();

  return Math.min(FULL, Math.max(0, (elapsed / span) * FULL));
}

/**
 * 출근 시각부터 지금까지 채운 비율이다. 확정 전에는 값이 없다 — 근무 시각을 모르면 축의
 * 양끝이 없고, 양끝이 없으면 퍼센트도 없다. 그때 트랙은 점선만 서고 네 귀퉁이가 통째로
 * 빈다.
 *
 * 근무 전이 0인 것은 축 밖이라서다. 인증 창은 근무 시작 한 시간 전에 열리지만 그 한 시간은
 * 이 축의 음수 자리고, 지금 찍을 수 있다는 것은 띠가 아니라 인증 버튼이 말한다.
 */
export function dayBandFillRatio(
  shift: ShiftWindow,
  now: Date,
  isConfirmed: boolean,
): number | null {
  return isConfirmed ? ratioWithin(shift, now) : null;
}

/**
 * 실제로 찍힌 시각이 축 위 어디인지다. 안 찍었으면 가리킬 자리가 없어 눈금도 없다.
 *
 * 일찍 찍은 것은 0에 물린다. 눈금이 지는 일은 「늦었나」 하나고, 정시든 20분 일찍이든 안
 * 늦은 것은 매한가지다. 몇 시에 찍었는지는 띠 아래 한 줄이 정확히 말한다.
 */
export function dayBandCheckInMarkRatio(
  shift: ShiftWindow,
  checkInAt: Date | null,
): number | null {
  return checkInAt === null ? null : ratioWithin(shift, checkInAt);
}
