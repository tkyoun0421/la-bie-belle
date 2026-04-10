import { describe, expect, it } from "vitest";
import { shouldConfirmEventTemplateRequiredCountOverride } from "#/entities/events/models/policies/eventTemplatePolicy";
import {
  createDefaultTemplateFormValues,
} from "#/screens/admin/templates/_helpers/templateForm";

describe("createDefaultTemplateFormValues", () => {
  it("includes every current position as a default slot", () => {
    const formValues = createDefaultTemplateFormValues(
      [
        {
          allowedGender: "all",
          defaultRequiredCount: 2,
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          name: "안내",
          sortOrder: 1,
        },
        {
          allowedGender: "female",
          defaultRequiredCount: 1,
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
          name: "대기실",
          sortOrder: 2,
        },
      ],
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      2
    );

    expect(formValues.isPrimary).toBe(false);
    expect(formValues.slotDefaults).toEqual([
      {
        positionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        requiredCount: 2,
      },
      {
        positionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        requiredCount: 1,
      },
    ]);
  });

  it("marks the first template as representative by default", () => {
    const formValues = createDefaultTemplateFormValues(
      [
        {
          allowedGender: "all",
          defaultRequiredCount: 2,
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          name: "안내",
          sortOrder: 1,
        },
      ],
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      2,
      true
    );

    expect(formValues.isPrimary).toBe(true);
  });
});

describe("shouldConfirmEventTemplateRequiredCountOverride", () => {
  it("asks for confirmation when the user goes below the position default for the first time", () => {
    expect(
      shouldConfirmEventTemplateRequiredCountOverride({
        currentRequiredCount: 2,
        nextRequiredCount: 1,
        positionDefaultRequiredCount: 2,
      })
    ).toBe(true);
  });

  it("does not ask again when the slot is already below the default", () => {
    expect(
      shouldConfirmEventTemplateRequiredCountOverride({
        currentRequiredCount: 1,
        nextRequiredCount: 1,
        positionDefaultRequiredCount: 2,
      })
    ).toBe(false);
  });

  it("does not ask when the next value stays at or above the default", () => {
    expect(
      shouldConfirmEventTemplateRequiredCountOverride({
        currentRequiredCount: 2,
        nextRequiredCount: 2,
        positionDefaultRequiredCount: 2,
      })
    ).toBe(false);
  });
});
