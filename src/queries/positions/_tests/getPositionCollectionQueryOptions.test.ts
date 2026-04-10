import { describe, expect, it } from "vitest";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";
import { getPositionCollectionQueryOptions } from "#/queries/positions/options/getPositionCollectionQueryOptions";
import { fetchPositions } from "#/queries/positions/services/fetchPositions";

describe("getPositionCollectionQueryOptions", () => {
  it("returns the shared query contract for position collections", () => {
    const queryOptions = getPositionCollectionQueryOptions();

    expect(queryOptions.queryKey).toEqual(positionQueryKeys.collection());
    expect(queryOptions.queryFn).toBe(fetchPositions);
  });
});
