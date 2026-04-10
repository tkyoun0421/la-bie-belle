import { useQuery } from "@tanstack/react-query";
import { getEventTemplateCollectionQueryOptions } from "#/queries/events/options/getEventTemplateCollectionQueryOptions";

export function useEventTemplatesQuery() {
  return useQuery(getEventTemplateCollectionQueryOptions());
}
