export function readErrorMessage(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if (
      "message" in value &&
      typeof value.message === "string" &&
      value.message.length > 0
    ) {
      return value.message;
    }

    if (Array.isArray(value)) {
      for (const nextValue of value) {
        const nextMessage = readErrorMessage(nextValue);

        if (nextMessage) {
          return nextMessage;
        }
      }

      return null;
    }

    for (const nextValue of Object.values(value)) {
      const nextMessage = readErrorMessage(nextValue);

      if (nextMessage) {
        return nextMessage;
      }
    }
  }

  return null;
}

export function readOwnErrorMessage(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string" &&
    value.message.length > 0
  ) {
    return value.message;
  }

  return null;
}
