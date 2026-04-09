import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { createEventTemplateAction } from "#/mutations/events/actions/createEventTemplate";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";
import { eventTemplateQueryKeys } from "#/queries/events/constants/eventTemplateQueryKeys";

export function useCreateEventTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventTemplateInput) =>
      createEventTemplateAction(input),
    onSuccess(template) {
      queryClient.setQueryData(
        eventTemplateQueryKeys.detail(template.id),
        template
      );
      queryClient.setQueryData<EventTemplate[]>(
        eventTemplateQueryKeys.collection(),
        (currentTemplates = []) => [template, ...currentTemplates]
      );
    },
  });
}
