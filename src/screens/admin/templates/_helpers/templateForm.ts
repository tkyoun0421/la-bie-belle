import type { FieldErrors } from "react-hook-form";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { formatPositionAllowedGenderLabel } from "#/entities/positions/models/constants/allowedGender";
import type { Position } from "#/entities/positions/models/schemas/position";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";

export type TemplateFieldName = "firstServiceAt" | "lastServiceEndAt" | "name";
export type TemplateFormSlot = CreateEventTemplateInput["slotDefaults"][number];
export type TemplateFormState = Pick<CreateEventTemplateInput, TemplateFieldName>;
export type TemplatePositionOption = {
  defaultRequiredCount: number;
  label: string;
  value: string;
};
export type TemplateSlotRow = TemplateFormSlot & {
  _key: string;
};

export const templateSaveErrorMessage =
  "행사 템플릿을 저장하지 못했습니다.";
export const templateDeleteErrorMessage =
  "행사 템플릿을 삭제하지 못했습니다.";

export function createTemplatePositionOptions(
  positions: Position[]
): TemplatePositionOption[] {
  return positions.map((position) => ({
    defaultRequiredCount: position.defaultRequiredCount,
    label: `${position.name} / ${formatPositionAllowedGenderLabel(position.allowedGender)} / 기본 ${position.defaultRequiredCount}명`,
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
  defaultPositionId: string,
  defaultRequiredCount = 2
): CreateEventTemplateInput {
  return {
    firstServiceAt: "10:30",
    lastServiceEndAt: "16:00",
    name: "",
    slotDefaults: [createTemplateSlot(defaultPositionId, defaultRequiredCount)],
  };
}

export function createTemplateFormValuesFromTemplate(
  template: EventTemplate
): CreateEventTemplateInput {
  return {
    firstServiceAt: template.firstServiceAt,
    lastServiceEndAt: template.lastServiceEndAt,
    name: template.name,
    slotDefaults: template.slotDefaults.map((slot) => ({
      positionId: slot.positionId,
      requiredCount: slot.requiredCount,
      trainingCount: slot.trainingCount,
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
    trainingCount: 0,
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

export function readFirstErrorMessage(
  value: FieldErrors<CreateEventTemplateInput> | unknown
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if (
      "message" in value &&
      typeof value.message === "string" &&
      value.message.length > 0
    ) {
      return value.message;
    }

    if (Array.isArray(value)) {
      for (const nextValue of value) {
        const nextMessage = readFirstErrorMessage(nextValue);

        if (nextMessage) {
          return nextMessage;
        }
      }

      return null;
    }

    for (const nextValue of Object.values(value)) {
      const nextMessage = readFirstErrorMessage(nextValue);

      if (nextMessage) {
        return nextMessage;
      }
    }
  }

  return null;
}
