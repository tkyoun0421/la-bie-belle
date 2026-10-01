/**
 * 이번 달 근무표 미니뷰의 칸 진하기다 — 배정 인원이 많을수록 `bg.brand-weak`에서
 * `bg.brand-solid`로 진해지고 안 연 날은 빈칸이다
 * (`docs/2-design/system/screens/adminHome.md`의 「이번 달 근무표 미니뷰」).
 *
 * **여기서 나오는 것은 0~1의 비율이고 토큰이 아니다.** 어느 비율이 어느 단계로 가는지는
 * 미니 달력 조각이 든다 — 화면이 색 이름을 고르면 디자인이 두 곳에서 바뀐다.
 *
 * 최대치는 그 달 안에서 잰다. 홀마다 자리 수가 달라 절대 기준이 없고, 한 달 안의 상대가
 * 「어느 주에 몰렸나」라는 이 자리의 질문에 답한다.
 */

export type MiniViewDensityInput = {
  isOpen: boolean;
  assignedCount: number;
  maxAssignedCount: number;
};

export function miniViewDensity({
  isOpen,
  assignedCount,
  maxAssignedCount,
}: MiniViewDensityInput): number | null {
  if (!isOpen) {
    return null;
  }

  if (maxAssignedCount <= 0) {
    return 0;
  }

  return assignedCount / maxAssignedCount;
}

export type MiniViewDay = {
  workDate: string;
  assignedCount: number;
};

/**
 * 연 날들을 미니 달력이 받는 「날짜 → 진하기」로 접는다. 최대치를 그 달 안에서 재는 자리가
 * 여기고, 안 연 날은 아예 안 담는다 — 빈칸이 곧 안 연 날이다.
 */
export function miniViewLoads(
  days: readonly MiniViewDay[],
): Record<number, { load: number }> {
  const maxAssignedCount = days.reduce(
    (most, day) => Math.max(most, day.assignedCount),
    0,
  );

  const loads: Record<number, { load: number }> = {};

  for (const day of days) {
    const load = miniViewDensity({
      isOpen: true,
      assignedCount: day.assignedCount,
      maxAssignedCount,
    });

    if (load !== null) {
      loads[Number(day.workDate.slice(8, 10))] = { load };
    }
  }

  return loads;
}
