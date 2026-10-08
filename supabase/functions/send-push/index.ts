import { createClient } from "npm:@supabase/supabase-js@2.112.4";

import {
  buildPushMessages,
  chunkPushMessages,
  type ClaimedPushNotification,
  type PushMessage,
} from "../_shared/notification/pushMessage.utils.ts";
import {
  type PushOutcome,
  type PushResponse,
  splitPushResults,
} from "../_shared/notification/pushResult.policy.ts";

const BEARER = "Bearer ";

const EXPO_SEND = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS = "https://exp.host/--/api/v2/push/getReceipts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN") ?? "";

type ClaimedRow = {
  id: string;
  profile_id: string;
  kind: string;
  payload: Record<string, unknown>;
  addresses: string[];
};

type ScrapeRow = { id: string; receipt_id: string; addresses: string[] };

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

async function readIds(request: Request): Promise<string[] | null> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  const ids = (body as { ids?: unknown } | null)?.ids;

  return Array.isArray(ids) && ids.every((one) => typeof one === "string")
    ? (ids as string[])
    : null;
}

async function postToExpo(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${BEARER}${expoAccessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${url} 응답이 ${response.status}다`);
  }

  return await response.json();
}

function toTicketBody(messages: readonly PushMessage[]): unknown {
  return messages.map((message) => ({
    to: message.to,
    title: message.title,
    body: message.body ?? undefined,
    data: message.data,
  }));
}

function ticketResponses(
  answer: unknown,
  count: number,
): (PushResponse | undefined)[] {
  const data = (answer as { data?: unknown } | null)?.data;
  const tickets = Array.isArray(data) ? data : [];

  return Array.from(
    { length: count },
    (_, index) => tickets[index] as PushResponse | undefined,
  );
}

function warnNeedsReview(groups: ReturnType<typeof splitPushResults>): void {
  for (const one of groups.needsReview) {
    console.error(
      `send-push: 사람이 봐야 하는 실패다 — 알림 ${one.id}, ${one.message}`,
    );
  }
}

async function scrapeReceipts(
  admin: ReturnType<typeof createClient>,
): Promise<void> {
  try {
    const { data, error } = await admin.rpc("receipts_to_scrape");

    if (error !== null) {
      console.error(`send-push: 긁을 접수증을 못 읽었다 — ${error.message}`);
      return;
    }

    const rows = (data ?? []) as ScrapeRow[];

    if (rows.length === 0) {
      return;
    }

    const answer = await postToExpo(EXPO_RECEIPTS, {
      ids: rows.map((row) => row.receipt_id),
    });
    const byReceipt = ((answer as { data?: unknown } | null)?.data ??
      {}) as Record<string, PushResponse | undefined>;
    const answered = rows.filter(
      (row) => byReceipt[row.receipt_id] !== undefined,
    );

    const outcomes: PushOutcome[] = answered
      .filter((row) => row.addresses.length === 1)
      .map((row) => ({
        id: row.id,
        token: row.addresses[0],
        response: byReceipt[row.receipt_id] as PushResponse,
      }));
    const groups = splitPushResults(outcomes);

    warnNeedsReview(groups);

    const { error: clearError } = await admin.rpc("clear_receipts", {
      p_ids: answered.map((row) => row.id),
      p_dead_tokens: groups.discardTokens,
    });

    if (clearError !== null) {
      console.error(
        `send-push: 긁은 접수증을 못 지웠다 — ${clearError.message}`,
      );
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`send-push: 접수증 긁기가 실패했다 — ${reason}`);
  }
}

async function sendClaimed(
  admin: ReturnType<typeof createClient>,
  ids: string[] | null,
): Promise<number> {
  const { data, error } = await admin.rpc("claim_notifications", {
    p_ids: ids,
  });

  if (error !== null) {
    console.error(`send-push: 알림을 못 잡았다 — ${error.message}`);
    return 0;
  }

  const claimed = ((data ?? []) as ClaimedRow[]).map(
    (row): ClaimedPushNotification => ({
      id: row.id,
      kind: row.kind,
      payload: row.payload,
      tokens: row.addresses,
    }),
  );

  let pushed = 0;

  for (const chunk of chunkPushMessages(buildPushMessages(claimed))) {
    let answer: unknown;

    try {
      answer = await postToExpo(EXPO_SEND, toTicketBody(chunk));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        `send-push: ${chunk.length}건 부치기가 실패했다 — ${reason}`,
      );
      continue;
    }

    const responses = ticketResponses(answer, chunk.length);
    const outcomes: PushOutcome[] = [];

    chunk.forEach((message, index) => {
      const response = responses[index];

      if (response !== undefined) {
        outcomes.push({
          id: message.notificationId,
          token: message.to,
          response,
        });
      }
    });

    const groups = splitPushResults(outcomes);

    warnNeedsReview(groups);

    const { error: settleError } = await admin.rpc("settle_push", {
      p_pushed: groups.success.map((one) => ({
        id: one.id,
        receipt_id: one.receiptId,
      })),
      p_dead_tokens: groups.discardTokens,
    });

    if (settleError !== null) {
      console.error(`send-push: 보낸 결과를 못 썼다 — ${settleError.message}`);
      continue;
    }

    pushed += groups.success.length;
  }

  return pushed;
}

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (!isServiceRole(request)) {
    console.error("send-push: service role이 아닌 호출을 거절했다");
    return respond(403, { error: "forbidden" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await scrapeReceipts(admin);

  const pushed = await sendClaimed(admin, await readIds(request));

  return respond(200, { pushed });
});
