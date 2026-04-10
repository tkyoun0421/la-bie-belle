import { useDeferredValue, useState } from "react";
import { formatPositionAllowedGenderLabel } from "#/entities/positions/models/constants/allowedGender";
import type { Position } from "#/entities/positions/models/schemas/position";
import { usePositionsQuery } from "#/queries/positions/hooks/usePositionsQuery";

const emptyPositions: Position[] = [];

export function usePositionCollectionState() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const positionsQuery = usePositionsQuery();
  const positions = positionsQuery.data ?? emptyPositions;
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();
  const filteredPositions = normalizedSearchTerm
    ? positions.filter((position) =>
        [
          position.name,
          formatPositionAllowedGenderLabel(position.allowedGender),
        ].some((value) => value.toLowerCase().includes(normalizedSearchTerm))
      )
    : positions;

  return {
    filteredPositions,
    positions,
    positionsQuery,
    searchTerm,
    setSearchTerm,
  };
}
