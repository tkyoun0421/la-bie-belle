import { createDomainErrorHelpers } from "#/shared/lib/errors/appError";

export const applicationErrorCodes = {
  applyClosedEvent: "APPLICATION_APPLY_CLOSED_EVENT",
  applyEventNotFound: "APPLICATION_APPLY_EVENT_NOT_FOUND",
  applyFailed: "APPLICATION_APPLY_FAILED",
  cancelClosedEvent: "APPLICATION_CANCEL_CLOSED_EVENT",
  cancelEventNotFound: "APPLICATION_CANCEL_EVENT_NOT_FOUND",
  cancelFailed: "APPLICATION_CANCEL_FAILED",
  cancelTargetMissing: "APPLICATION_CANCEL_TARGET_MISSING",
  listFailed: "APPLICATION_LIST_FAILED",
  readFailed: "APPLICATION_READ_FAILED",
} as const;

export type ApplicationErrorCode =
  (typeof applicationErrorCodes)[keyof typeof applicationErrorCodes];

export const applicationErrors =
  createDomainErrorHelpers(applicationErrorCodes);
