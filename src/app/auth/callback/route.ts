import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { bootstrapSuperAdmin } from "@/entities/identity/api/bootstrap-super-admin";
import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileGate } from "@/entities/identity/model/profile-gate";
import { HOME_PATH, LOGIN_ERROR_PATH } from "@/shared/config/auth-routes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code === null || code.length === 0) {
    return NextResponse.redirect(new URL(LOGIN_ERROR_PATH, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(LOGIN_ERROR_PATH, request.url));
  }

  await bootstrapSuperAdmin(data.user.email);

  const profileResult = await findOwnProfile(data.user.id);

  if (!profileResult.ok) {
    return NextResponse.redirect(new URL(LOGIN_ERROR_PATH, request.url));
  }

  const target = resolveProfileGate(profileResult.data, HOME_PATH) ?? HOME_PATH;

  return NextResponse.redirect(new URL(target, request.url));
}
