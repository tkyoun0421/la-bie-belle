import { useQuery } from "@tanstack/react-query";
import { eventTemplateQueryKeys } from "#/queries/events/models/constants/eventTemplateQueryKeys";
import { fetchEventTemplates } from "#/queries/events/models/services/fetchEventTemplates";

export function useEventTemplatesQuery() {
  return useQuery({
    queryKey: eventTemplateQueryKeys.collection(),
    queryFn: fetchEventTemplates,
  });
}
