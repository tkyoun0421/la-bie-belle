import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";
import type { Database, TableRow } from "#/shared/types/database";

type AppActorProfile = Pick<TableRow<"users">, "email" | "id" | "name" | "role">;

export type AppActor =
  | {
      email: string;
      kind: "authenticated_user";
      name: string;
      role: TableRow<"users">["role"];
      source: "auth_user";
      userId: string;
    }
  | {
      email: string;
      kind: "development_member";
      name: string;
      role: "member";
      source: "development_seed";
      userId: string;
    };

export class AppAccessError extends Error {
  constructor(
    message: string,
    readonly code: "member_unavailable" | "profile_missing" | "unauthenticated",
    readonly status: 401 | 404 | 503
  ) {
    super(message);
    this.name = "AppAccessError";
  }
}

type ResolveAppActorOptions = {
  canSetCookies?: boolean;
  client?: SupabaseClient<Database>;
};

export async function getCurrentAppActor(
  options: ResolveAppActorOptions = {}
): Promise<AppActor | null> {
  const result = await resolveAppActor(options);

  if ("error" in result) {
    return null;
  }

  return result.actor;
}

export async function requireAppActor(
  options: ResolveAppActorOptions = {}
): Promise<AppActor> {
  const result = await resolveAppActor({
    ...options,
    canSetCookies: true,
  });

  if ("error" in result) {
    throw result.error;
  }

  return result.actor;
}

function isDevelopmentMemberBypassEnabled() {
  return process.env.NODE_ENV !== "production";
}

async function resolveAppActor(
  options: ResolveAppActorOptions
): Promise<{ actor: AppActor } | { error: AppAccessError }> {
  const client =
    options.client ??
    (await createSupabaseServerClient({
      canSetCookies: options.canSetCookies ?? false,
    }));
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    return {
      error: new AppAccessError(
        "로그인 정보를 확인할 수 없습니다.",
        "unauthenticated",
        401
      ),
    };
  }

  if (user) {
    const profile = await readUserProfile(client, user.id);

    if (!profile) {
      return {
        error: new AppAccessError(
          "앱 사용자 프로필을 찾을 수 없습니다.",
          "profile_missing",
          404
        ),
      };
    }

    return {
      actor: {
        email: profile.email,
        kind: "authenticated_user",
        name: profile.name,
        role: profile.role,
        source: "auth_user",
        userId: profile.id,
      },
    };
  }

  if (!isDevelopmentMemberBypassEnabled()) {
    return {
      error: new AppAccessError(
        "로그인이 필요합니다.",
        "unauthenticated",
        401
      ),
    };
  }

  const fallbackMember = await readDevelopmentFallbackMember(client);

  if (!fallbackMember) {
    return {
      error: new AppAccessError(
        "개발용 멤버 프로필을 찾을 수 없습니다.",
        "member_unavailable",
        503
      ),
    };
  }

  return {
    actor: {
      email: fallbackMember.email,
      kind: "development_member",
      name: fallbackMember.name,
      role: "member",
      source: "development_seed",
      userId: fallbackMember.id,
    },
  };
}

async function readUserProfile(
  client: SupabaseClient<Database>,
  userId: string
): Promise<AppActorProfile | null> {
  const { data, error } = await client
    .from("users")
    .select("id, email, name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function readDevelopmentFallbackMember(
  client: SupabaseClient<Database>
): Promise<AppActorProfile | null> {
  const { data, error } = await client
    .from("users")
    .select("id, email, name, role")
    .eq("role", "member")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.role !== "member") {
    return null;
  }

  return data;
}
