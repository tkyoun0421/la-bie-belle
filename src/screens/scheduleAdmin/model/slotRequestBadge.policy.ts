export type SlotRequestBadgeInput = {
  closed_at: string | null;
  candidates: readonly { status: string }[];
};

export type SlotRequestBadgeRow = {
  slot_id: string | null;
  closed_at: string | null;
  request_candidates: readonly { status: string }[];
};

export function slotRequestBadgeFor(
  slotId: string,
  requests: readonly SlotRequestBadgeRow[],
): string | null {
  const request = requests.filter((one) => one.slot_id === slotId).at(-1);

  return slotRequestBadge(
    request === undefined
      ? null
      : {
          closed_at: request.closed_at,
          candidates: request.request_candidates,
        },
  );
}

export function slotRequestBadge(
  request: SlotRequestBadgeInput | null,
): string | null {
  if (request === null || request.closed_at !== null) {
    return null;
  }

  const waiting = request.candidates.filter(
    (candidate) => candidate.status === "pending",
  ).length;

  return `요청 ${waiting}건 대기 중`;
}
