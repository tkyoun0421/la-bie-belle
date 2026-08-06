import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const LOGIN_ERROR_PATH = "/login?error=auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code === null || code.length === 0) {
    return NextResponse.redirect(new URL(LOGIN_ERROR_PATH, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(LOGIN_ERROR_PATH, request.url));
  }

  let hasProfile: boolean;
  try {
    hasProfile = await findOwnProfile();
  } catch {
    return NextResponse.redirect(new URL(LOGIN_ERROR_PATH, request.url));
  }

  return NextResponse.redirect(new URL(hasProfile ? "/" : "/onboarding", request.url));
}
