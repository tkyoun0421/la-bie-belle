import { useMutation, useQueryClient } from "@tanstack/react-query";
import { positionQueryKeys } from "#/queries/positions/models/constants/positionQueryKeys";
import type { Position } from "#/queries/positions/models/schemas/position";
import { deletePositionAction } from "#/mutations/positions/actions/deletePosition";
import type { DeletePositionInput } from "#/mutations/positions/models/schemas/deletePosition";

export function useDeletePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeletePositionInput) => deletePositionAction(input),
    onSuccess(deletedPositionId) {
      queryClient.setQueryData<Position[]>(
        positionQueryKeys.collection(),
        (current = []) =>
          current.filter((position) => position.id !== deletedPositionId)
      );
    },
  });
}
