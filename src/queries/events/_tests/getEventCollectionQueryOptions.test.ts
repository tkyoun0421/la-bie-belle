import { describe, expect, it } from "vitest";
import { eventQueryKeys } from "#/queries/events/constants/eventQueryKeys";
import { getEventCollectionQueryOptions } from "#/queries/events/options/getEventCollectionQueryOptions";
import { fetchEvents } from "#/queries/events/services/fetchEvents";

describe("getEventCollectionQueryOptions", () => {
  it("builds the event collection query contract", () => {
    const queryOptions = getEventCollectionQueryOptions();

    expect(queryOptions.queryKey).toEqual(eventQueryKeys.collection());
    expect(queryOptions.queryFn).toBe(fetchEvents);
  });
});
