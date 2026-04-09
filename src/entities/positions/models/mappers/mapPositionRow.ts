import {
  positionSchema,
  type Position,
} from "#/entities/positions/models/schemas/position";

export type PositionRow = {
  allowed_gender: Position["allowedGender"];
  id: string;
  name: string;
};

export function mapPositionRow(row: PositionRow): Position {
  return positionSchema.parse({
    allowedGender: row.allowed_gender,
    id: row.id,
    name: row.name,
  });
}
