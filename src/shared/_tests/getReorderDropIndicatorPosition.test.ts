import { describe, expect, it } from "vitest";
import { getReorderDropIndicatorPosition } from "#/shared/lib/drag-and-drop/getReorderDropIndicatorPosition";

describe("getReorderDropIndicatorPosition", () => {
  it("returns top when the dragged item moves upward", () => {
    expect(getReorderDropIndicatorPosition(3, 1)).toBe("top");
  });

  it("returns bottom when the dragged item moves downward", () => {
    expect(getReorderDropIndicatorPosition(1, 3)).toBe("bottom");
  });

  it("returns null for invalid or identical positions", () => {
    expect(getReorderDropIndicatorPosition(-1, 1)).toBeNull();
    expect(getReorderDropIndicatorPosition(1, -1)).toBeNull();
    expect(getReorderDropIndicatorPosition(2, 2)).toBeNull();
  });
});
