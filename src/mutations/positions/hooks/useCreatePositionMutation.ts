import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Position } from "#/entities/positions/models/schemas/position";
import { sortPositions } from "#/entities/positions/models/helpers/sortPositions";
import { createPositionAction } from "#/mutations/positions/actions/createPosition";
import type { CreatePositionInput } from "#/mutations/positions/schemas/createPosition";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";

export function useCreatePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePositionInput) => createPositionAction(input),
    onSuccess(position) {
      queryClient.setQueryData(positionQueryKeys.detail(position.id), position);
      queryClient.setQueryData<Position[]>(
        positionQueryKeys.collection(),
        (current = []) => sortPositions([...current, position])
      );
    },
  });
}
