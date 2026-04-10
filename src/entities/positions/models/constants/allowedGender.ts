import type { PositionAllowedGender } from "#/entities/positions/models/schemas/position";

const POSITION_ALLOWED_GENDER_LABELS: Record<PositionAllowedGender, string> = {
  all: "전체 가능",
  female: "여성만 가능",
  male: "남성만 가능",
};

export const positionAllowedGenderOptions: Array<{
  label: string;
  value: PositionAllowedGender;
}> = Object.entries(POSITION_ALLOWED_GENDER_LABELS).map(([value, label]) => ({
  label,
  value: value as PositionAllowedGender,
}));

export function formatPositionAllowedGenderLabel(
  allowedGender: PositionAllowedGender
) {
  return POSITION_ALLOWED_GENDER_LABELS[allowedGender];
}
