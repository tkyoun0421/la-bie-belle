import {
  positionSchema,
  type Position,
} from "#/entities/positions/models/schemas/position";
import type { TableRow } from "#/shared/types/database";

export type PositionRow = Pick<
  TableRow<"positions">,
  "allowed_gender" | "default_required_count" | "id" | "name" | "sort_order"
>;

export function mapPositionRow(row: PositionRow): Position {
  return positionSchema.parse({
    allowedGender: row.allowed_gender,
    defaultRequiredCount: row.default_required_count,
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  });
}
