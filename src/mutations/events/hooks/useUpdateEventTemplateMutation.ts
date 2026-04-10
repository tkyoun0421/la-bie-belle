import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertEventTemplateCollection } from "#/entities/events/models/normalizeEventTemplateCollection";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { updateEventTemplateAction } from "#/mutations/events/actions/updateEventTemplate";
import type { UpdateEventTemplateInput } from "#/mutations/events/schemas/updateEventTemplate";
import { eventTemplateQueryKeys } from "#/queries/events/constants/eventTemplateQueryKeys";

export function useUpdateEventTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventTemplateInput) =>
      updateEventTemplateAction(input),
    onSuccess(template) {
      queryClient.setQueryData(
        eventTemplateQueryKeys.detail(template.id),
        template
      );
      queryClient.setQueryData<EventTemplate[]>(
        eventTemplateQueryKeys.collection(),
        (currentTemplates = []) =>
          upsertEventTemplateCollection(currentTemplates, template)
      );
    },
  });
}
