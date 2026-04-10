type EventTemplateSlotPosition = {
  positionId: string;
};

type EventTemplateDeletePolicyInput = {
  isPrimary: boolean;
  templatesCount: number;
};

type EventTemplateRequiredCountOverrideInput = {
  currentRequiredCount: number;
  nextRequiredCount: number;
  positionDefaultRequiredCount: number;
};

export type EventTemplateDeleteBlockReason = "last-template" | "primary";

export function findDuplicateEventTemplateSlotPositionIds(
  slotDefaults: EventTemplateSlotPosition[]
) {
  return slotDefaults
    .map((slot) => slot.positionId)
    .filter(
      (positionId, index, array) => array.indexOf(positionId) !== index
    );
}

export function hasDuplicateEventTemplateSlotPositions(
  slotDefaults: EventTemplateSlotPosition[]
) {
  return findDuplicateEventTemplateSlotPositionIds(slotDefaults).length > 0;
}

export function getEventTemplateDeleteBlockReason({
  isPrimary,
  templatesCount,
}: EventTemplateDeletePolicyInput): EventTemplateDeleteBlockReason | null {
  if (isPrimary) {
    return "primary";
  }

  if (templatesCount <= 1) {
    return "last-template";
  }

  return null;
}

export function isPrimaryTemplateToggleLocked({
  initialTemplateIsPrimary,
  templatesCount,
}: {
  initialTemplateIsPrimary: boolean;
  templatesCount: number;
}) {
  return templatesCount === 0 || initialTemplateIsPrimary;
}

export function shouldConfirmEventTemplateRequiredCountOverride({
  currentRequiredCount,
  nextRequiredCount,
  positionDefaultRequiredCount,
}: EventTemplateRequiredCountOverrideInput) {
  return (
    nextRequiredCount < positionDefaultRequiredCount &&
    currentRequiredCount >= positionDefaultRequiredCount
  );
}
