import { z } from "zod";
import { findDuplicateEventTemplateSlotPositionIds } from "#/entities/events/models/policies/eventTemplatePolicy";
import { timeValueSchema } from "#/entities/events/models/schemas/eventTemplate";

const createEventTemplateSlotInputSchema = z.object({
  positionId: z.string().uuid("포지션을 선택해 주세요."),
  requiredCount: z.number().int().min(1, "필수 인원은 1명 이상이어야 합니다."),
});

const createEventTemplateBaseSchema = z.object({
  name: z.string().trim().min(2, "템플릿 이름은 두 글자 이상이어야 합니다."),
  isPrimary: z.boolean().default(false),
  firstServiceAt: timeValueSchema,
  lastServiceEndAt: timeValueSchema,
  slotDefaults: z
    .array(createEventTemplateSlotInputSchema)
    .min(1, "최소 한 개의 포지션 슬롯이 필요합니다."),
});

export const createEventTemplateInputSchema = createEventTemplateBaseSchema
  .superRefine((value, context) => {
    if (compareTimeValue(value.firstServiceAt, value.lastServiceEndAt) >= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastServiceEndAt"],
        message: "마지막 서비스 종료 시간은 시작 시간보다 늦어야 합니다.",
      });
    }

    const duplicatePositionIds = findDuplicateEventTemplateSlotPositionIds(
      value.slotDefaults
    );

    if (duplicatePositionIds.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slotDefaults"],
        message: "같은 포지션은 하나의 템플릿에서 한 번만 선택할 수 있습니다.",
      });
    }
  })
  .transform((value) => ({
    ...value,
    name: value.name.trim(),
    slotDefaults: value.slotDefaults.map((slot) => ({
      positionId: slot.positionId,
      requiredCount: slot.requiredCount,
      trainingCount: 0,
    })),
  }));

export type CreateEventTemplateInput = z.input<
  typeof createEventTemplateInputSchema
>;
export type CreateEventTemplateValues = z.output<
  typeof createEventTemplateInputSchema
>;

export function parseCreateEventTemplateInput(
  input: CreateEventTemplateInput
): CreateEventTemplateValues {
  return createEventTemplateInputSchema.parse(input);
}

function compareTimeValue(left: string, right: string) {
  const [leftHour, leftMinute] = left.split(":").map(Number);
  const [rightHour, rightMinute] = right.split(":").map(Number);

  return leftHour * 60 + leftMinute - (rightHour * 60 + rightMinute);
}
