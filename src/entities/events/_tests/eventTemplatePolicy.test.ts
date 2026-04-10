import { describe, expect, it } from "vitest";
import {
  findDuplicateEventTemplateSlotPositionIds,
  getEventTemplateDeleteBlockReason,
  hasDuplicateEventTemplateSlotPositions,
  isPrimaryTemplateToggleLocked,
  shouldConfirmEventTemplateRequiredCountOverride,
} from "#/entities/events/models/policies/eventTemplatePolicy";

describe("eventTemplatePolicy", () => {
  it("finds duplicate slot positions", () => {
    expect(
      findDuplicateEventTemplateSlotPositionIds([
        { positionId: "position-1" },
        { positionId: "position-2" },
        { positionId: "position-1" },
      ])
    ).toEqual(["position-1"]);
    expect(
      hasDuplicateEventTemplateSlotPositions([
        { positionId: "position-1" },
        { positionId: "position-2" },
        { positionId: "position-1" },
      ])
    ).toBe(true);
  });

  it("returns null when there is no delete block reason", () => {
    expect(
      getEventTemplateDeleteBlockReason({
        isPrimary: false,
        templatesCount: 2,
      })
    ).toBeNull();
  });

  it("blocks deleting a primary template first", () => {
    expect(
      getEventTemplateDeleteBlockReason({
        isPrimary: true,
        templatesCount: 3,
      })
    ).toBe("primary");
  });

  it("blocks deleting the last template", () => {
    expect(
      getEventTemplateDeleteBlockReason({
        isPrimary: false,
        templatesCount: 1,
      })
    ).toBe("last-template");
  });

  it("locks the primary toggle for the first template or current primary template", () => {
    expect(
      isPrimaryTemplateToggleLocked({
        initialTemplateIsPrimary: false,
        templatesCount: 0,
      })
    ).toBe(true);
    expect(
      isPrimaryTemplateToggleLocked({
        initialTemplateIsPrimary: true,
        templatesCount: 3,
      })
    ).toBe(true);
    expect(
      isPrimaryTemplateToggleLocked({
        initialTemplateIsPrimary: false,
        templatesCount: 3,
      })
    ).toBe(false);
  });

  it("asks for confirmation only when going below the default for the first time", () => {
    expect(
      shouldConfirmEventTemplateRequiredCountOverride({
        currentRequiredCount: 2,
        nextRequiredCount: 1,
        positionDefaultRequiredCount: 2,
      })
    ).toBe(true);
    expect(
      shouldConfirmEventTemplateRequiredCountOverride({
        currentRequiredCount: 1,
        nextRequiredCount: 1,
        positionDefaultRequiredCount: 2,
      })
    ).toBe(false);
  });
});
