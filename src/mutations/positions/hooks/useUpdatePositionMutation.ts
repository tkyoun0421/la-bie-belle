import { useMutation, useQueryClient } from "@tanstack/react-query";
import { positionQueryKeys } from "#/queries/positions/models/constants/positionQueryKeys";
import type { Position } from "#/queries/positions/models/schemas/position";
import { updatePositionAction } from "#/mutations/positions/actions/updatePosition";
import type { UpdatePositionInput } from "#/mutations/positions/models/schemas/updatePosition";

function sortPositions(positions: Position[]) {
  return [...positions].sort((left, right) =>
    left.name.localeCompare(right.name, "ko")
  );
}

export function useUpdatePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePositionInput) => updatePositionAction(input),
    onSuccess(position) {
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
