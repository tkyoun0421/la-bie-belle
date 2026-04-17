import { createDomainErrorHelpers } from "#/shared/lib/errors/appError";

export const assignmentErrorCodes = {
  createDuplicateActive: "ASSIGNMENT_CREATE_DUPLICATE_ACTIVE",
  createEventNotFound: "ASSIGNMENT_CREATE_EVENT_NOT_FOUND",
  createFailed: "ASSIGNMENT_CREATE_FAILED",
  createPositionNotInEvent: "ASSIGNMENT_CREATE_POSITION_NOT_IN_EVENT",
  createUserNotApplied: "ASSIGNMENT_CREATE_USER_NOT_APPLIED",
  listFailed: "ASSIGNMENT_LIST_FAILED",
  unauthorizedRole: "ASSIGNMENT_UNAUTHORIZED_ROLE",
} as const;

export type AssignmentErrorCode =
  (typeof assignmentErrorCodes)[keyof typeof assignmentErrorCodes];

export const assignmentErrors =
  createDomainErrorHelpers(assignmentErrorCodes);
