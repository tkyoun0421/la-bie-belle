export const eventTemplateQueryKeys = {
  all: ["events", "templates"] as const,
  collection: () =>
    [...eventTemplateQueryKeys.all, "collection"] as const,
  detail: (templateId: string) =>
    [...eventTemplateQueryKeys.all, "detail", templateId] as const,
};
