import { groupBy } from "@/shared/utils/collect";
import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";

export function groupRequestsByDate(
  requests: readonly SlotRequest[],
): Map<string, SlotRequest[]> {
  return groupBy(requests, (request) => request.workDate);
}
