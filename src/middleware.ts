import { type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";
import { getCurrentUser } from "@/shared/lib/get-current-user";

const STATIC_PATH_PREFIXES = ["/_next/static", "/_next/image"];

const STATIC_FILE_EXTENSION = /\.(?:ico|png|jpe?g|gif|svg|webp|avif)$/i;

export function isStaticAssetPath(pathname: string): boolean {
  const underStaticPrefix = STATIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return underStaticPrefix || STATIC_FILE_EXTENSION.test(pathname);
}

export async function middleware(request: NextRequest) {
  if (isStaticAssetPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const refreshed: { name: string; value: string; options: CookieOptions }[] =
    [];
  const responseHeaders = new Headers();

  const client = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    set: (name, value, options) => {
      request.cookies.set(name, value);
      refreshed.push({ name, value, options });
    },
    setHeader: (name, value) => {
      responseHeaders.set(name, value);
    },
  });

  await getCurrentUser(client);

  const response = NextResponse.next({ request });

  for (const { name, value, options } of refreshed) {
    response.cookies.set(name, value, options);
  }

  responseHeaders.forEach((value, name) => {
    response.headers.set(name, value);
  });

  return response;
}
