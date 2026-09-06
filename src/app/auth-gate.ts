import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";
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

type AuthGate = {
  destination: AuthDestination;
  account: SignedInAccount | null;
};

function googlePhotoOf(metadata: Record<string, unknown>): string | null {
  for (const key of ["avatar_url", "picture"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

async function readAuthGate(): Promise<AuthGate> {
  const client = createSupabaseServerClient(await cookies());
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

export async function enterRoute(expected: "/login" | "/"): Promise<void> {
  const { destination } = await readAuthGate();

  if (destination !== expected) {
    redirect(destination);
  }
}

export async function enterPendingRoute(): Promise<SignedInAccount> {
  const { destination, account } = await readAuthGate();

  if (destination !== "/pending" || !account) {
    redirect(destination);
  }

  return account;
}
