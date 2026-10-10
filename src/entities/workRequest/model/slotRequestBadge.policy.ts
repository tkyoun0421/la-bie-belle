export type SlotRequestBadgeInput = {
  closedAt: string | null;
  candidates: readonly { status: string }[];
};

export type SlotRequestBadgeRow = {
  slotId: string | null;
  closedAt: string | null;
  candidates: readonly { status: string }[];
};

export function slotRequestBadgeFor(
  slotId: string,
  requests: readonly SlotRequestBadgeRow[],
): string | null {
  const request = requests.filter((one) => one.slotId === slotId).at(-1);

  return slotRequestBadge(
    request === undefined
      ? null
      : {
          closedAt: request.closedAt,
          candidates: request.candidates,
        },
  );
}

export function slotRequestBadge(
  request: SlotRequestBadgeInput | null,
): string | null {
  if (request === null || request.closedAt !== null) {
    return null;
  }

  const waiting = request.candidates.filter(
    (candidate) => candidate.status === "pending",
  ).length;

  return `요청 ${waiting}건 대기 중`;
}
