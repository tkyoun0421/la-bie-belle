import {
  positionSchema,
  type Position,
} from "#/entities/positions/models/schemas/position";

export type PositionRow = {
  allowed_gender: Position["allowedGender"];
  default_required_count: number;
  id: string;
  name: string;
  sort_order: number;
};

export function mapPositionRow(row: PositionRow): Position {
  return positionSchema.parse({
    allowedGender: row.allowed_gender,
    defaultRequiredCount: row.default_required_count,
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  });
}
