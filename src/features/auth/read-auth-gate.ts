import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import {
  resolveAuthDestination,
  type AuthDestination,
} from "@/shared/lib/resolve-auth-destination";
import { getApprovedAt } from "@/entities/profile/dals/get-approved-at";

export type SignedInAccount = {
  email: string;
  avatarUrl: string | null;
};

export type AuthGate = {
  destination: AuthDestination;
  account: SignedInAccount | null;
};

export function googlePhotoOf(
  metadata: Record<string, unknown>,
): string | null {
  for (const key of ["avatar_url", "picture"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

export async function readAuthGate(client: SupabaseClient): Promise<AuthGate> {
  const user = await getCurrentUser(client);

  if (!user) {
    return {
      destination: resolveAuthDestination({
        hasSession: false,
        approvedAt: null,
      }),
      account: null,
    };
  }

  return {
    destination: resolveAuthDestination({
      hasSession: true,
      approvedAt: await getApprovedAt(client, user.id),
    }),
    account: {
      email: user.email ?? "",
      avatarUrl: googlePhotoOf(user.user_metadata),
    },
  };
}
