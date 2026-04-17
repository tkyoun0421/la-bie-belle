import { createDomainErrorHelpers } from "#/shared/lib/errors/appError";

export const eventErrorCodes = {
  createDuplicateDate: "EVENT_CREATE_DUPLICATE_DATE",
  createFailed: "EVENT_CREATE_FAILED",
  createResultMissing: "EVENT_CREATE_RESULT_MISSING",
  createTemplateNotFound: "EVENT_CREATE_TEMPLATE_NOT_FOUND",
  listFailed: "EVENT_LIST_FAILED",
  readFailed: "EVENT_READ_FAILED",
} as const;

export type EventErrorCode =
  (typeof eventErrorCodes)[keyof typeof eventErrorCodes];

export const eventErrors = createDomainErrorHelpers(eventErrorCodes);
