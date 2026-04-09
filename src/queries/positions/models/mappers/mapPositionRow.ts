import {
  positionSchema,
  type Position,
} from "#/queries/positions/models/schemas/position";

export type PositionRow = {
  allowed_gender: Position["allowedGender"];
  id: string;
  name: string;
};

export function mapPositionRow(row: PositionRow): Position {
  return positionSchema.parse({
    id: row.id,
    name: row.name,
    allowedGender: row.allowed_gender,
  });
}
