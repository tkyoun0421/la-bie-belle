import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";

export function upsertEventTemplateCollection(
  currentTemplates: EventTemplate[],
  nextTemplate: EventTemplate
): EventTemplate[] {
  const remainingTemplates = currentTemplates
    .filter((template) => template.id !== nextTemplate.id)
    .map((template) =>
      nextTemplate.isPrimary ? { ...template, isPrimary: false } : template
    );

  return sortEventTemplateCollection([nextTemplate, ...remainingTemplates]);
}

export function sortEventTemplateCollection(
  templates: EventTemplate[]
): EventTemplate[] {
  return [...templates].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
  });
}

function toTimestamp(value: string) {
  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}
