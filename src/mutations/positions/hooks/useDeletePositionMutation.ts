import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Position } from "#/entities/positions/models/schemas/position";
import { deletePositionAction } from "#/mutations/positions/actions/deletePosition";
import type { DeletePositionInput } from "#/mutations/positions/schemas/deletePosition";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";

export function useDeletePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeletePositionInput) => deletePositionAction(input),
    onSuccess(deletedPositionId) {
      queryClient.removeQueries({
        queryKey: positionQueryKeys.detail(deletedPositionId),
      });
      queryClient.setQueryData<Position[]>(
        positionQueryKeys.collection(),
        (current = []) =>
          current.filter((position) => position.id !== deletedPositionId)
      );
    },
  });
}
