import { describe, expect, it } from "vitest";
import { createQueryKeyFactory } from "#/shared/lib/tanstack-query/createQueryKeyFactory";

describe("createQueryKeyFactory", () => {
  it("creates collection and detail query keys from a shared prefix", () => {
    const queryKeys = createQueryKeyFactory("events", "templates");

    expect(queryKeys.all).toEqual(["events", "templates"]);
    expect(queryKeys.collections()).toEqual([
      "events",
      "templates",
      "collection",
    ]);
    expect(queryKeys.collection()).toEqual([
      "events",
      "templates",
      "collection",
    ]);
    expect(queryKeys.collection({ status: "draft" })).toEqual([
      "events",
      "templates",
      "collection",
      { status: "draft" },
    ]);
    expect(queryKeys.details()).toEqual(["events", "templates", "detail"]);
    expect(queryKeys.detail("template-id")).toEqual([
      "events",
      "templates",
      "detail",
      "template-id",
    ]);
  });
});
