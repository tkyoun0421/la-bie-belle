import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./supabase-test-auth";

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

export async function createWorkerSession(
  context: BrowserContext,
  baseURL: string | undefined,
  prefix: string,
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `${prefix}-${randomUUID()}@labiebelle.test`;
  const password = `${prefix}-password-Aa1!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("근무자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name: `근무자-${randomUUID().slice(0, 8)}`,
    phone: randomPhone(),
    gender: "female",
    birth_date: "1993-03-03",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return { admin, id: data.user.id };
}

export type WorkerSession = Awaited<ReturnType<typeof createWorkerSession>>;

export async function deleteWorkerSessions(sessions: readonly WorkerSession[]) {
  for (const session of sessions) {
    const { data: notificationRows, error: notificationsFetchError } = await session.admin
      .from("notifications")
      .select("id")
      .eq("recipient_id", session.id);
    if (notificationsFetchError) {
      throw notificationsFetchError;
    }

    const notificationIds = (notificationRows ?? []).map((row) => row.id as string);
    if (notificationIds.length > 0) {
      const { error: outboxError } = await session.admin
        .from("notification_outbox")
        .delete()
        .in("notification_id", notificationIds);
      if (outboxError) {
        throw outboxError;
      }

      const { error: notificationsError } = await session.admin
        .from("notifications")
        .delete()
        .in("id", notificationIds);
      if (notificationsError) {
        throw notificationsError;
      }
    }

    const { error } = await session.admin.auth.admin.deleteUser(session.id);
    if (error) {
      throw error;
    }
  }
}
