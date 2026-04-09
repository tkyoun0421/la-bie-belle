import { useDeferredValue, useState } from "react";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useEventTemplatesQuery } from "#/queries/events/hooks/useEventTemplatesQuery";

const emptyTemplates: EventTemplate[] = [];

export function useEventTemplateCollectionState() {
  const [highlightedTemplateId, setHighlightedTemplateId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const templatesQuery = useEventTemplatesQuery();
  const templates = templatesQuery.data ?? emptyTemplates;
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();
  const filteredTemplates = normalizedSearchTerm
    ? templates.filter((template) => {
        const searchValues = [
          template.name,
          template.timeLabel,
          ...template.slotDefaults.map((slot) => slot.positionName),
        ];

        return searchValues.some((value) =>
          value.toLowerCase().includes(normalizedSearchTerm)
        );
      })
    : templates;

  return {
    filteredTemplates,
    highlightedTemplateId,
    searchTerm,
    setHighlightedTemplateId,
    setSearchTerm,
    templates,
    templatesQuery,
  };
}
