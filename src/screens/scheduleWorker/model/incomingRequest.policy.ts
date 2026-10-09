import type {
  SlotRequest,
  SlotRequestCandidate,
} from "@/entities/workRequest/model/workRequest.type";

export type IncomingRequest = Pick<SlotRequest, "closedAt"> & {
  candidates: readonly Pick<SlotRequestCandidate, "profileId" | "status">[];
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
      request.closedAt === null &&
      request.candidates.some(
        (candidate) =>
          candidate.profileId === myProfileId && candidate.status === "pending",
      ),
  );
}
