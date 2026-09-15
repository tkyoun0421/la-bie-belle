import { execFileSync, spawnSync } from "node:child_process";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

function dbContainerName(): string {
  const result = spawnSync(
    "docker",
    ["ps", "--filter", "name=supabase_db", "--format", "{{.Names}}"],
    { encoding: "utf8" },
  );
  const name = result.stdout.trim().split("\n")[0];
  if (!name) {
    throw new Error(
      "supabase_db 컨테이너를 못 찾았다. 로컬 Supabase가 떠 있는지 확인해라.",
    );
  }
  return name;
}

function runSql(sql: string, vars: Record<string, string>): void {
  const container = dbContainerName();

  const args = [
    "exec",
    "-i",
    container,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
  ];
  for (const [key, value] of Object.entries(vars)) {
    args.push("-v", `${key}=${value}`);
  }

  execFileSync("docker", args, { input: sql, encoding: "utf8" });
}

export function approveProfile(
  userId: string,
  approvedAt: string = new Date().toISOString(),
): void {
  runSql(
    "update public.profiles set approved_at = :'approved_at' where user_id = :'user_id';\n",
    { user_id: userId, approved_at: approvedAt },
  );
}

export type ApprovedUser = SignedInUser & { approvedAt: string };

export async function createApprovedUser(): Promise<ApprovedUser> {
  const user = await createSignedInUser();
  const approvedAt = new Date().toISOString();

  approveProfile(user.userId, approvedAt);

  return { ...user, approvedAt };
}

export type AdminUser = SignedInUser & { approvedAt: string };

export async function createAdminUser(): Promise<AdminUser> {
  const user = await createApprovedUser();

  runSql(
    "update public.profiles set role = 'admin' where user_id = :'user_id';\n",
    { user_id: user.userId },
  );

  return user;
}

export type BlockedUser = SignedInUser & {
  approvedAt: string;
  blockedAt: string;
};

export async function createBlockedUser(): Promise<BlockedUser> {
  const user = await createApprovedUser();
  const blockedAt = new Date().toISOString();

  runSql(
    "update public.profiles set blocked_at = :'blocked_at' where user_id = :'user_id';\n",
    { user_id: user.userId, blocked_at: blockedAt },
  );

  return { ...user, blockedAt };
}
