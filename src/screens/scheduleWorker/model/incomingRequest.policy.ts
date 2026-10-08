export type IncomingRequest = {
  closed_at: string | null;
  request_candidates: readonly { profile_id: string; status: string }[];
};

export function hasIncomingRequest(
  requests: readonly IncomingRequest[],
  myProfileId: string | null,
): boolean {
  if (myProfileId === null) {
    return false;
  }

  return requests.some(
    (request) =>
      request.closed_at === null &&
      request.request_candidates.some(
        (candidate) =>
          candidate.profile_id === myProfileId &&
          candidate.status === "pending",
      ),
  );
}
