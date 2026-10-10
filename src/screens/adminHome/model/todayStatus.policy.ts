export type TodayStatus =
  | { kind: "none" }
  | { kind: "unconfirmed" }
  | {
      kind: "value";
      assignedCount: number;
      checkedInCount: number;
      notCheckedInCount: number;
      bandRatio: number;
    };

export type TodayStatusInput = {
  isConfirmed: boolean;
  assignedCount: number;
  checkedInCount: number;
};

export function todayStatus({
  isConfirmed,
  assignedCount,
  checkedInCount,
}: TodayStatusInput): TodayStatus {
  if (assignedCount === 0) {
    return { kind: "none" };
  }

  if (!isConfirmed) {
    return { kind: "unconfirmed" };
  }

  return {
    kind: "value",
    assignedCount,
    checkedInCount,
    notCheckedInCount: assignedCount - checkedInCount,
    bandRatio: checkedInCount / assignedCount,
  };
}

export type TodayBandShare = {
  key: string;
  label: string;
  value: number;
};

export function todayBandShares(
  checkedInCount: number,
  notCheckedInCount: number,
): TodayBandShare[] {
  return [
    { key: "checked-in", label: "출근", value: checkedInCount },
    { key: "unused-sky", label: "", value: 0 },
    { key: "unused-mint", label: "", value: 0 },
    { key: "not-checked-in", label: "안 찍음", value: notCheckedInCount },
  ];
}
