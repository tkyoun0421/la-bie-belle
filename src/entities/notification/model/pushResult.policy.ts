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

export function splitPushResults(
  outcomes: readonly PushOutcome[],
): PushResultGroups {
  const groups: PushResultGroups = {
    success: [],
    discardTokens: [],
    retry: [],
    needsReview: [],
  };

  for (const outcome of outcomes) {
    const { response } = outcome;

    if (response.status === "ok") {
      groups.success.push({
        id: outcome.id,
        receiptId: response.id ?? null,
      });
      continue;
    }

    const code = response.details?.error;

    if (code === DEVICE_NOT_REGISTERED) {
      groups.discardTokens.push(outcome.token);
      continue;
    }

    if (code === INVALID_CREDENTIALS) {
      groups.needsReview.push({
        id: outcome.id,
        token: outcome.token,
        message: response.message,
      });
      continue;
    }

    groups.retry.push({ id: outcome.id, token: outcome.token });
  }

  return groups;
}
