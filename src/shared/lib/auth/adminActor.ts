import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";
import { getServerEnv } from "#/shared/config/env";

export type AdminActor =
  | {
      email: string | null;
      kind: "bootstrap_admin";
      source: "email_allowlist";
      userId: string;
    }
  | {
      email: null;
      kind: "development_bypass";
      source: "development_bypass";
      userId: null;
    };

export class AdminAccessError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "unauthenticated" | "unconfigured",
    readonly status: 401 | 403 | 503
  ) {
    super(message);
    this.name = "AdminAccessError";
  }
}

type ResolveAdminActorAccessOptions = {
  canSetCookies?: boolean;
};

export async function getCurrentAdminActor(): Promise<AdminActor | null> {
  const result = await resolveAdminActorAccess();

  if ("error" in result) {
    return null;
  }

  return result.actor;
}

export async function requireAdminActor(): Promise<AdminActor> {
  const result = await resolveAdminActorAccess({
    canSetCookies: true,
  });

  if ("error" in result) {
    throw result.error;
  }

  return result.actor;
}

export async function requireAdminPageActor() {
  try {
    const result = await resolveAdminActorAccess();

    if ("error" in result) {
      throw result.error;
    }

    return result.actor;
  } catch (error) {
    if (error instanceof AdminAccessError) {
      redirect("/");
    }

    throw error;
  }
}

function parseBootstrapAdminEmails(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isDevelopmentAdminBypassEnabled(configuredValue?: boolean) {
  if (configuredValue !== undefined) {
    return configuredValue;
  }

  return process.env.NODE_ENV !== "production";
}

async function resolveAdminActorAccess(
  options: ResolveAdminActorAccessOptions = {}
): Promise<{ actor: AdminActor } | { error: AdminAccessError }> {
  const env = getServerEnv();
  const allowlist = parseBootstrapAdminEmails(env.BOOTSTRAP_ADMIN_EMAILS);
  const { canSetCookies = false } = options;

  if (
    allowlist.length === 0 &&
    isDevelopmentAdminBypassEnabled(env.ENABLE_DEVELOPMENT_ADMIN_BYPASS)
  ) {
    return {
      actor: {
        email: null,
        kind: "development_bypass",
        source: "development_bypass",
        userId: null,
      },
    };
  }

  if (allowlist.length === 0) {
    return {
      error: new AdminAccessError(
        "관리자 bootstrap gate가 아직 설정되지 않았습니다.",
        "unconfigured",
        503
      ),
    };
  }

  const client = await createSupabaseServerClient({
    canSetCookies,
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user?.email) {
    return {
      error: new AdminAccessError(
        "관리자 로그인이 필요합니다.",
        "unauthenticated",
        401
      ),
    };
  }

  const normalizedEmail = normalizeEmail(user.email);

  if (!allowlist.includes(normalizedEmail)) {
    return {
      error: new AdminAccessError(
        "관리자 권한이 없습니다.",
        "forbidden",
        403
      ),
    };
  }

  return {
    actor: {
      email: normalizedEmail,
      kind: "bootstrap_admin",
      source: "email_allowlist",
      userId: user.id,
    },
  };
}
