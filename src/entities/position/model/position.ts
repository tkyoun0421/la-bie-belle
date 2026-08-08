import { z } from "zod";

export const GENDER_REQUIREMENT_VALUES = ["any", "male", "female"] as const;
export const GenderRequirementSchema = z.enum(GENDER_REQUIREMENT_VALUES);
export type GenderRequirement = z.infer<typeof GenderRequirementSchema>;

export type Position = {
  id: string;
  name: string;
  code: string | null;
  defaultRequiredCount: number;
  genderRequirement: GenderRequirement;
  isDefault: boolean;
  isActive: boolean;
};

export type PositionRow = {
  id: string;
  name: string;
  code: string | null;
  default_required_count: number;
  gender_requirement: string;
  is_default: boolean;
  is_active: boolean;
};

export function mapPositionRow(row: PositionRow): Position {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    defaultRequiredCount: row.default_required_count,
    genderRequirement: GenderRequirementSchema.parse(row.gender_requirement),
    isDefault: row.is_default,
    isActive: row.is_active,
  };
}

export function isSystemPosition(position: Pick<Position, "code">): boolean {
  return position.code !== null;
}
