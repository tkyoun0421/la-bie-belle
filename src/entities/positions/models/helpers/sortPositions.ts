import type { Position } from "#/entities/positions/models/schemas/position";

export function sortPositions(positions: Position[]) {
  return [...positions].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "ko")
  );
}

export function reorderPositionsByIds(
  positions: Position[],
  orderedIds: string[]
): Position[] {
  const positionById = new Map(positions.map((position) => [position.id, position]));

  return orderedIds
    .map((positionId, index) => {
      const position = positionById.get(positionId);

      return position
        ? {
            ...position,
            sortOrder: index + 1,
          }
        : null;
    })
    .filter((position): position is Position => position !== null);
}
