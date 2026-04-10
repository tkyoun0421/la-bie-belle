import { createQueryKeyFactory } from "#/shared/lib/tanstack-query/createQueryKeyFactory";

export const eventTemplateQueryKeys = createQueryKeyFactory(
  "events",
  "templates"
);
