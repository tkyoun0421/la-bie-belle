import { describe, expect, it } from "vitest";
import { eventTemplateQueryKeys } from "#/queries/events/constants/eventTemplateQueryKeys";
import { getEventTemplateCollectionQueryOptions } from "#/queries/events/options/getEventTemplateCollectionQueryOptions";
import { fetchEventTemplates } from "#/queries/events/services/fetchEventTemplates";

describe("getEventTemplateCollectionQueryOptions", () => {
  it("returns the shared query contract for event template collections", () => {
    const queryOptions = getEventTemplateCollectionQueryOptions();

    expect(queryOptions.queryKey).toEqual(
      eventTemplateQueryKeys.collection()
    );
    expect(queryOptions.queryFn).toBe(fetchEventTemplates);
  });
});
