import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Position } from "#/entities/positions/models/schemas/position";
import { reorderPositionsByIds } from "#/entities/positions/models/helpers/sortPositions";
import { reorderPositionsAction } from "#/mutations/positions/actions/reorderPositions";
import type { ReorderPositionsInput } from "#/mutations/positions/schemas/reorderPositions";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";

export function useReorderPositionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderPositionsInput) => reorderPositionsAction(input),
    onSuccess(positionIds) {
      const nextPositions =
        queryClient.setQueryData<Position[]>(
        positionQueryKeys.collection(),
        (current = []) => reorderPositionsByIds(current, positionIds)
      ) ?? [];

      nextPositions.forEach((position) => {
        queryClient.setQueryData(positionQueryKeys.detail(position.id), position);
      });
    },
  });
}
