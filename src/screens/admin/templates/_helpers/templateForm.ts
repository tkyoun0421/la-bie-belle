import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { formatPositionAllowedGenderLabel } from "#/entities/positions/models/constants/allowedGender";
import type { Position } from "#/entities/positions/models/schemas/position";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";

export type TemplateFieldName = "firstServiceAt" | "lastServiceEndAt" | "name";
export type TemplateFormSlot = CreateEventTemplateInput["slotDefaults"][number];
export type TemplateFormState = Pick<
  CreateEventTemplateInput,
  TemplateFieldName | "isPrimary"
>;
export type TemplatePositionOption = {
  defaultRequiredCount: number;
  label: string;
  name: string;
  value: string;
};
export type TemplateSlotRow = TemplateFormSlot & {
  _key: string;
};
export type TemplateSlotFieldErrors = {
  positionId: string | null;
  requiredCount: string | null;
};
export type TemplateFieldErrors = {
  firstServiceAt: string | null;
  lastServiceEndAt: string | null;
  name: string | null;
  slotDefaults: string | null;
  slotRows: TemplateSlotFieldErrors[];
};

export const templateSaveErrorMessage =
  "행사 템플릿을 저장하지 못했습니다.";
export const templateDeleteErrorMessage =
  "행사 템플릿을 삭제하지 못했습니다.";
export const primaryTemplateDeleteErrorMessage =
  "대표 템플릿은 삭제할 수 없습니다.";

export function createTemplatePositionOptions(
  positions: Position[]
): TemplatePositionOption[] {
  return positions.map((position) => ({
    defaultRequiredCount: position.defaultRequiredCount,
    label: `${position.name} / ${formatPositionAllowedGenderLabel(position.allowedGender)} / 기본 ${position.defaultRequiredCount}명`,
    name: position.name,
    value: position.id,
  }));
}

export function createPositionDefaultRequiredCountMap(
  positions: Position[]
): Record<string, number> {
  return positions.reduce<Record<string, number>>((result, position) => {
    result[position.id] = position.defaultRequiredCount;
    return result;
  }, {});
}

export function createPositionNameMap(
  positions: Position[]
): Record<string, string> {
  return positions.reduce<Record<string, string>>((result, position) => {
    result[position.id] = position.name;
    return result;
  }, {});
}

export function readDefaultRequiredCount(
  positionId: string,
  defaultRequiredCountByPositionId: Record<string, number>,
  fallbackDefaultRequiredCount: number
): number {
  return (
    defaultRequiredCountByPositionId[positionId] ?? fallbackDefaultRequiredCount
  );
}

export function createDefaultTemplateFormValues(
  positions: Position[],
  defaultPositionId: string,
  defaultRequiredCount = 2,
  isPrimary = false
): CreateEventTemplateInput {
  const slotDefaults =
    positions.length > 0
      ? positions.map((position) =>
          createTemplateSlot(position.id, position.defaultRequiredCount)
        )
      : defaultPositionId
        ? [createTemplateSlot(defaultPositionId, defaultRequiredCount)]
        : [];

  return {
    firstServiceAt: "10:30",
    isPrimary,
    lastServiceEndAt: "16:00",
    name: "",
    slotDefaults,
  };
}

export function createTemplateFormValuesFromTemplate(
  template: EventTemplate
): CreateEventTemplateInput {
  return {
    firstServiceAt: template.firstServiceAt,
    isPrimary: template.isPrimary,
    lastServiceEndAt: template.lastServiceEndAt,
    name: template.name,
    slotDefaults: template.slotDefaults.map((slot) => ({
      positionId: slot.positionId,
      requiredCount: slot.requiredCount,
    })),
  };
}

export function createTemplateSlot(
  defaultPositionId: string,
  defaultRequiredCount = 2
): TemplateFormSlot {
  return {
    positionId: defaultPositionId,
    requiredCount: defaultRequiredCount,
  };
}

export function createTemplateSlotRows(
  fields: Array<{ id: string }>,
  slotDefaults: TemplateFormSlot[] | undefined,
  defaultPositionId: string,
  defaultRequiredCountByPositionId: Record<string, number>,
  fallbackDefaultRequiredCount = 2
): TemplateSlotRow[] {
  return fields.map((field, index) => ({
    _key: field.id,
    ...(slotDefaults?.[index] ??
      createTemplateSlot(
        defaultPositionId,
        readDefaultRequiredCount(
          defaultPositionId,
          defaultRequiredCountByPositionId,
          fallbackDefaultRequiredCount
        )
      )),
  }));
}

export function findNextAvailablePositionId(
  currentSlots: TemplateFormSlot[],
  positionIds: string[],
  fallbackPositionId: string
) {
  const selectedPositionIds = new Set(
    currentSlots.map((slot) => slot.positionId).filter(Boolean)
  );

  return (
    positionIds.find((positionId) => !selectedPositionIds.has(positionId)) ??
    fallbackPositionId
  );
}

export function shouldConfirmBelowDefaultRequiredCount({
  currentRequiredCount,
  nextRequiredCount,
  positionDefaultRequiredCount,
}: {
  currentRequiredCount: number;
  nextRequiredCount: number;
  positionDefaultRequiredCount: number;
}) {
  return (
    nextRequiredCount < positionDefaultRequiredCount &&
    currentRequiredCount >= positionDefaultRequiredCount
  );
}
