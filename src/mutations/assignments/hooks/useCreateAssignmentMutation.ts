import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAssignmentAction } from "#/mutations/assignments/actions/createAssignment";
import type { CreateAssignmentInput } from "#/mutations/assignments/schemas/createAssignment";
import { assignmentQueryKeys } from "#/queries/assignments/constants/assignmentQueryKeys";

export function useCreateAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => createAssignmentAction(input),
    onSuccess(result) {
      void queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.detail(result.eventId),
      });
    },
  });
}
