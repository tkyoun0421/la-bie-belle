import {
  createAppError,
  readAppErrorCode,
} from "#/shared/lib/errors/appError";

export const eventTemplateErrorCodes = {
  countFailed: "EVENT_TEMPLATE_COUNT_FAILED",
  createFailed: "EVENT_TEMPLATE_CREATE_FAILED",
  createResultMissing: "EVENT_TEMPLATE_CREATE_RESULT_MISSING",
  deleteFailed: "EVENT_TEMPLATE_DELETE_FAILED",
  deleteLastForbidden: "EVENT_TEMPLATE_DELETE_LAST_FORBIDDEN",
  deletePrimaryForbidden: "EVENT_TEMPLATE_DELETE_PRIMARY_FORBIDDEN",
  deleteTargetNotFound: "EVENT_TEMPLATE_DELETE_TARGET_NOT_FOUND",
  listFailed: "EVENT_TEMPLATE_LIST_FAILED",
  readFailed: "EVENT_TEMPLATE_READ_FAILED",
  updateFailed: "EVENT_TEMPLATE_UPDATE_FAILED",
  updateResultMissing: "EVENT_TEMPLATE_UPDATE_RESULT_MISSING",
  updateTargetNotFound: "EVENT_TEMPLATE_UPDATE_TARGET_NOT_FOUND",
} as const;

export type EventTemplateErrorCode =
  (typeof eventTemplateErrorCodes)[keyof typeof eventTemplateErrorCodes];

const eventTemplateErrorCodeSet = new Set<string>(
  Object.values(eventTemplateErrorCodes)
);

export function createEventTemplateError(
  code: EventTemplateErrorCode,
  options?: ErrorOptions
) {
  return createAppError(code, options);
}

export function readEventTemplateErrorCode(
  error: unknown
): EventTemplateErrorCode | null {
  const code = readAppErrorCode(error);

  if (!code || !eventTemplateErrorCodeSet.has(code)) {
    return null;
  }

  return code as EventTemplateErrorCode;
}
