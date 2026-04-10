const APP_ERROR_PREFIX = "APP_ERROR:";

type AppErrorOptions = ErrorOptions & {
  message?: string;
};

export class AppError<Code extends string = string> extends Error {
  readonly code: Code;

  constructor(code: Code, options: AppErrorOptions = {}) {
    super(options.message ?? `${APP_ERROR_PREFIX}${code}`, options);
    this.name = "AppError";
    this.code = code;
  }
}

export function createAppError<Code extends string>(
  code: Code,
  options?: AppErrorOptions
) {
  return new AppError(code, options);
}

type ErrorCodeMap = Record<string, string>;

type ErrorCodeValue<TCodeMap extends ErrorCodeMap> =
  TCodeMap[keyof TCodeMap];

export function readAppErrorCode<Code extends string = string>(
  error: unknown
): Code | null {
  if (error && typeof error === "object") {
    if ("code" in error && typeof error.code === "string" && error.code) {
      return error.code as Code;
    }

    if (
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith(APP_ERROR_PREFIX)
    ) {
      const code = error.message.slice(APP_ERROR_PREFIX.length);
      return code ? (code as Code) : null;
    }
  }

  return null;
}

export function readApiErrorCode(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "errorCode" in payload &&
    typeof payload.errorCode === "string" &&
    payload.errorCode.length > 0
  ) {
    return payload.errorCode;
  }

  return null;
}

export function createDomainErrorHelpers<TCodeMap extends ErrorCodeMap>(
  errorCodes: TCodeMap
) {
  const errorCodeSet = new Set<string>(Object.values(errorCodes));

  return {
    create(code: ErrorCodeValue<TCodeMap>, options?: ErrorOptions) {
      return createAppError(code, options);
    },
    read(error: unknown): ErrorCodeValue<TCodeMap> | null {
      const code = readAppErrorCode(error);

      if (!code || !errorCodeSet.has(code)) {
        return null;
      }

      return code as ErrorCodeValue<TCodeMap>;
    },
  };
}
