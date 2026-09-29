// 퇴사 1년 뒤 비우기의 마지막 한 걸음이다. `internal.erase_profiles`가 개인정보를 비운 뒤
// pg_net으로 이 함수를 쏘고, 여기가 service role로 `auth.users` 행을 지운다 — Admin API
// 말고는 그 행을 지우는 길이 없다(account/design.md 「비우기」).
//
// 서비스 키를 쥐는 자리 둘 중 하나라 호출자 검사가 이 파일의 첫 일이다. 게이트웨이의
// `verify_jwt`는 유효한 토큰인지만 봐서 anon 키도 통과한다 — 남의 계정이 사라지는 문이라
// 그 한 겹으로는 모자란다.
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const BEARER = "Bearer ";

/** 계정이 이미 없을 때 Admin API가 내는 상태다. 정상 경로라 성공으로 끝낸다. */
const ALREADY_GONE = 404;

const USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/** 앞 글자가 어디까지 맞았는지가 응답 시간으로 새지 않게 끝까지 본다. */
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

// 사람이 안 보는 동작이라 로그가 유일한 창이다. 성공도 실패도 지운 id와 같이 남긴다.
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
