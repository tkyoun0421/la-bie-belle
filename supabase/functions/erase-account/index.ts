import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const BEARER = "Bearer ";

const ALREADY_GONE = 404;

const USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function equalsWithoutTiming(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

function isServiceRole(request: Request): boolean {
  const header = request.headers.get("Authorization") ?? "";

  if (serviceRoleKey === "" || !header.startsWith(BEARER)) {
    return false;
  }

  return equalsWithoutTiming(header.slice(BEARER.length), serviceRoleKey);
}

async function readUserId(request: Request): Promise<string | null> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null) {
    return null;
  }

  const userId = (body as { user_id?: unknown }).user_id;

  return typeof userId === "string" && USER_ID.test(userId) ? userId : null;
}

function respond(status: number, body: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (!isServiceRole(request)) {
    console.error("erase-account: service role이 아닌 호출을 거절했다");
    return respond(403, { error: "forbidden" });
  }

  const userId = await readUserId(request);

  if (userId === null) {
    console.error("erase-account: 본문에서 user_id를 못 읽었다");
    return respond(400, { error: "invalid_user_id" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error !== null && error.status !== ALREADY_GONE) {
    console.error(
      `erase-account: ${userId} 삭제가 실패했다 — ${error.message}`,
    );
    return respond(500, { error: error.message });
  }

  console.log(
    error === null
      ? `erase-account: ${userId} 계정을 지웠다`
      : `erase-account: ${userId} 계정이 이미 없다`,
  );

  return respond(200, { user_id: userId });
});
