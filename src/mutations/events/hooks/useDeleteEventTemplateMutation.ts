import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { deleteEventTemplateAction } from "#/mutations/events/actions/deleteEventTemplate";
import type { DeleteEventTemplateInput } from "#/mutations/events/models/schemas/deleteEventTemplate";
import { eventTemplateQueryKeys } from "#/queries/events/constants/eventTemplateQueryKeys";

export function useDeleteEventTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteEventTemplateInput) =>
      deleteEventTemplateAction(input),
    onSuccess(deletedTemplateId) {
      queryClient.setQueryData<EventTemplate[]>(
        eventTemplateQueryKeys.collection(),
        (currentTemplates = []) =>
          currentTemplates.filter(
            (template) => template.id !== deletedTemplateId
          )
      );
    },
  });
}
