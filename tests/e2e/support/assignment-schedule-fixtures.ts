import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";

import { loadSupabaseTestEnv, signInWithPasswordCookies, toPlaywrightCookies } from "./supabase-test-auth";

export function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

export async function createAdminSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-assignment-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-assignment-admin-password-Aa1!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("관리자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name: `배정관리자-${randomUUID().slice(0, 8)}`,
    phone: randomPhone(),
    gender: "male",
    birth_date: "1985-01-01",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  const { error: roleError } = await admin
    .from("profile_roles")
    .insert({ profile_id: data.user.id, role: "admin" });
  if (roleError) {
    throw roleError;
  }

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return { admin, email, password };
}

export async function createWorkerProfile(
  admin: SupabaseClient,
  slug: string,
  label: string,
  gender: "male" | "female",
): Promise<{ id: string; name: string }> {
  const email = `e2e-assignment-${slug}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-assignment-worker-password-Aa1!";
  const name = `${label}-${randomUUID().slice(0, 8)}`;

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
    name,
    phone: randomPhone(),
    gender,
    birth_date: "1994-04-04",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  return { id: data.user.id, name };
}

export async function insertSchedule(
  admin: SupabaseClient,
  workDate: string,
  status: "OPEN" | "CLOSED" | "PREPARING" | "CONFIRMED",
): Promise<string> {
  const { data, error } = await admin
    .from("schedules")
    .insert({ work_date: workDate, application_deadline: workDate, status })
    .select("id")
    .single();
  if (error || !data) {
    throw error ?? new Error("스케줄 픽스처 생성에 실패했습니다.");
  }
  return (data as { id: string }).id;
}
