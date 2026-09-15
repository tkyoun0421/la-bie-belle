import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type LocalSupabase = {
  apiUrl: string;
  anonKey: string;
};

let resolved: LocalSupabase | undefined;

function readStatus(): Map<string, string> {
  let output: string;
  try {
    output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
    });
  } catch {
    throw new Error(
      "로컬 Supabase가 뜨지 않았다. pnpm test:integration 으로 돌려라.",
    );
  }

  const entries = output
    .split("\n")
    .map((line) => /^([A-Z0-9_]+)="(.*)"$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(([, key, value]): [string, string] => [key, value]);

  return new Map(entries);
}

function localSupabase(): LocalSupabase {
  if (resolved) {
    return resolved;
  }

  const status = readStatus();
  const apiUrl = status.get("API_URL");
  const anonKey = status.get("ANON_KEY");
  if (!apiUrl || !anonKey) {
    throw new Error("supabase status 가 API_URL 이나 ANON_KEY 를 주지 않았다.");
  }

  resolved = { apiUrl, anonKey };
  return resolved;
}

export type SignedInUser = {
  client: SupabaseClient;
  userId: string;
  email: string;
  profileId: string;
};

export function createGuestClient(): SupabaseClient {
  const { apiUrl, anonKey } = localSupabase();

  return createClient(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type SignedInUserWithoutProfile = {
  client: SupabaseClient;
  userId: string;
  email: string;
};

export async function createSignedInUserWithoutProfile(): Promise<SignedInUserWithoutProfile> {
  const email = `${randomUUID()}@example.com`;
  const password = randomUUID();
  const client = createGuestClient();

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  if (!data.user || !data.session) {
    throw new Error(`가입은 됐는데 세션이 없다: ${email}`);
  }

  return {
    client,
    userId: data.user.id,
    email,
  };
}

export async function createSignedInUser(): Promise<SignedInUser> {
  const email = `${randomUUID()}@example.com`;
  const password = randomUUID();
  const client = createGuestClient();

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  if (!data.user || !data.session) {
    throw new Error(`가입은 됐는데 세션이 없다: ${email}`);
  }

  const { error: ensureError } = await client.rpc("ensure_profile");
  if (ensureError) {
    throw ensureError;
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id")
    .eq("user_id", data.user.id)
    .single<{ id: string }>();
  if (profileError) {
    throw profileError;
  }

  return {
    client,
    userId: data.user.id,
    email,
    profileId: profile.id,
  };
}
