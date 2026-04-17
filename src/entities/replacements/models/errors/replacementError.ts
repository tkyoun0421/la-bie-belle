import { createDomainErrorHelpers } from "#/shared/lib/errors/appError";

export const replacementErrorCodes = {
  requestNotFound: "REPLACEMENT_REQUEST_NOT_FOUND",
  requestNotOpen: "REPLACEMENT_REQUEST_NOT_OPEN",
  cannotApplyToOwnCancellation: "REPLACEMENT_CANNOT_APPLY_TO_OWN_CANCELLATION",
  memberNotQualified: "MEMBER_NOT_QUALIFIED_FOR_POSITION",
  requestAlreadyProcessed: "REPLACEMENT_REQUEST_ALREADY_PROCESSED",
  cancelledAssignmentNotFound: "CANCELLED_ASSIGNMENT_NOT_FOUND",
  unauthorizedRole: "UNAUTHORIZED_ROLE",
  applyFailed: "REPLACEMENT_APPLY_FAILED",
  statusUpdateFailed: "REPLACEMENT_STATUS_UPDATE_FAILED",
  listFailed: "REPLACEMENT_LIST_FAILED",
} as const;

export type ReplacementErrorCode = (typeof replacementErrorCodes)[keyof typeof replacementErrorCodes];

export const replacementErrors = createDomainErrorHelpers(replacementErrorCodes);
