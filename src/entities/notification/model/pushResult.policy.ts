const DEVICE_NOT_REGISTERED = "DeviceNotRegistered";

const INVALID_CREDENTIALS = "InvalidCredentials";

export type PushResponse =
  | { status: "ok"; id?: string }
  | {
      status: "error";
      message: string;
      details?: { error?: string; fault?: string };
    };

export type PushOutcome = {
  id: string;
  token: string;
  response: PushResponse;
};

export type PushSuccess = { id: string; receiptId: string | null };

export type PushRetry = { id: string; token: string };

export type PushNeedsReview = { id: string; token: string; message: string };

export type PushResultGroups = {
  success: PushSuccess[];
  discardTokens: string[];
  retry: PushRetry[];
  needsReview: PushNeedsReview[];
};

type DeliveredOutcome = Omit<PushOutcome, "response"> & {
  response: Extract<PushResponse, { status: "ok" }>;
};

type FailedOutcome = Omit<PushOutcome, "response"> & {
  response: Extract<PushResponse, { status: "error" }>;
};

function isDelivered(outcome: PushOutcome): outcome is DeliveredOutcome {
  return outcome.response.status === "ok";
}

function isFailed(outcome: PushOutcome): outcome is FailedOutcome {
  return outcome.response.status === "error";
}

function errorCodeOf(outcome: FailedOutcome): string | undefined {
  return outcome.response.details?.error;
}

function hasOwnGroup(outcome: FailedOutcome): boolean {
  const code = errorCodeOf(outcome);

  return code === DEVICE_NOT_REGISTERED || code === INVALID_CREDENTIALS;
}

export function splitPushResults(
  outcomes: readonly PushOutcome[],
): PushResultGroups {
  const failed = outcomes.filter(isFailed);

  return {
    success: outcomes.filter(isDelivered).map((outcome) => ({
      id: outcome.id,
      receiptId: outcome.response.id ?? null,
    })),
    discardTokens: failed
      .filter((outcome) => errorCodeOf(outcome) === DEVICE_NOT_REGISTERED)
      .map((outcome) => outcome.token),
    retry: failed
      .filter((outcome) => !hasOwnGroup(outcome))
      .map((outcome) => ({ id: outcome.id, token: outcome.token })),
    needsReview: failed
      .filter((outcome) => errorCodeOf(outcome) === INVALID_CREDENTIALS)
      .map((outcome) => ({
        id: outcome.id,
        token: outcome.token,
        message: outcome.response.message,
      })),
  };
}
