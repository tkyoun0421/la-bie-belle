import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Position } from "#/entities/positions/models/schemas/position";
import { sortPositions } from "#/entities/positions/models/helpers/sortPositions";
import { updatePositionAction } from "#/mutations/positions/actions/updatePosition";
import type { UpdatePositionInput } from "#/mutations/positions/schemas/updatePosition";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";

export function useUpdatePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePositionInput) => updatePositionAction(input),
    onSuccess(position) {
      queryClient.setQueryData(positionQueryKeys.detail(position.id), position);
      queryClient.setQueryData<Position[]>(
        positionQueryKeys.collection(),
        (current = []) =>
          sortPositions(
            current.map((currentPosition) =>
              currentPosition.id === position.id ? position : currentPosition
            )
          )
      );
    },
  });
}
