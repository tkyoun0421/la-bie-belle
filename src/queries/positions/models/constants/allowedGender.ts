import type { PositionAllowedGender } from "#/queries/positions/models/schemas/position";

export const positionAllowedGenderOptions: Array<{
  label: string;
  value: PositionAllowedGender;
}> = [
  { label: "전체 가능", value: "all" },
  { label: "여성만 가능", value: "female" },
  { label: "남성만 가능", value: "male" },
];

export function formatPositionAllowedGenderLabel(
  allowedGender: PositionAllowedGender
) {
  switch (allowedGender) {
    case "female":
      return "여성만 가능";
    case "male":
      return "남성만 가능";
    default:
      return "전체 가능";
  }
}
