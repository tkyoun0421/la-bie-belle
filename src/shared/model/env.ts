import { z } from "zod";

export type EnvSource = Record<string, string | undefined>;

const REQUIRED_MESSAGE = "필수 값이 없습니다";
const NON_EMPTY_MESSAGE = "빈 문자열은 허용되지 않습니다";
const URL_MESSAGE = "URL 형식이 아닙니다";
const EMAIL_MESSAGE = "이메일 형식이 아닙니다";
const PLACEHOLDER_MESSAGE = "production에서 placeholder 값을 쓸 수 없습니다";
const PLACEHOLDER_PATTERN = /change_?me/i;

function requiredString() {
  return z.string({ error: REQUIRED_MESSAGE }).min(1, NON_EMPTY_MESSAGE);
}

function urlString() {
  return requiredString().url(URL_MESSAGE);
}

function emailString() {
  return requiredString().email(EMAIL_MESSAGE);
}

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: urlString(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString(),
  SUPABASE_SERVICE_ROLE_KEY: requiredString(),
  GOOGLE_OAUTH_CLIENT_ID: requiredString(),
  GOOGLE_OAUTH_CLIENT_SECRET: requiredString(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: requiredString(),
  VAPID_PRIVATE_KEY: requiredString(),
  VAPID_SUBJECT: requiredString(),
  SUPER_ADMIN_EMAIL: emailString(),
  QR_SIGNING_SECRET: requiredString(),
  NEXT_PUBLIC_APP_URL: urlString(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: urlString(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: requiredString(),
  NEXT_PUBLIC_APP_URL: urlString(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

function firstMessageByPath(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const byPath = new Map<string, string>();
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!byPath.has(key)) {
      byPath.set(key, issue.message);
    }
  }
  return byPath;
}

function formatIssues(entries: Map<string, string>): string {
  const lines = [...entries.entries()].map(([key, message]) => `${key}: ${message}`);
  return ["환경변수 검증에 실패했습니다.", ...lines].join("\n");
}

function parseEnv<Schema extends z.ZodObject>(
  schema: Schema,
  source: EnvSource,
  isProduction: boolean,
): z.infer<Schema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(formatIssues(firstMessageByPath(result.error.issues)));
  }

  if (isProduction) {
    const placeholderIssues = new Map<string, string>();
    for (const [key, value] of Object.entries(result.data as Record<string, unknown>)) {
      if (typeof value === "string" && PLACEHOLDER_PATTERN.test(value)) {
        placeholderIssues.set(key, PLACEHOLDER_MESSAGE);
      }
    }
    if (placeholderIssues.size > 0) {
      throw new Error(formatIssues(placeholderIssues));
    }
  }

  return result.data;
}

export function parseServerEnv(source: EnvSource, options: { isProduction: boolean }): ServerEnv {
  return parseEnv(serverSchema, source, options.isProduction);
}

export function parseClientEnv(source: EnvSource, options: { isProduction: boolean }): ClientEnv {
  return parseEnv(clientSchema, source, options.isProduction);
}
