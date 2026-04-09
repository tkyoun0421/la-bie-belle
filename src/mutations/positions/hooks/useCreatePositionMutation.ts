import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Position } from "#/entities/positions/models/schemas/position";
import { createPositionAction } from "#/mutations/positions/actions/createPosition";
import type { CreatePositionInput } from "#/mutations/positions/models/schemas/createPosition";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";

export function useCreatePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePositionInput) => createPositionAction(input),
    onSuccess(position) {
      queryClient.setQueryData<Position[]>(
        positionQueryKeys.collection(),
        (current = []) =>
          [...current, position].sort((left, right) =>
            left.name.localeCompare(right.name, "ko")
          )
      );
    },
  });
}
