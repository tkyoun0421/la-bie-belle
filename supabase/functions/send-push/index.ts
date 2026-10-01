// 알림 행을 기기로 내보내는 한 걸음이다. `notifications`에 행이 들어오면 트리거가, 놓친
// 것은 매분 도는 cron이 pg_net으로 이 함수를 쏜다 — Postgres 함수가 외부 HTTP를 못 부른다
// (notification/design.md 「푸시 보내기」).
//
// **여기에는 HTTP와 순서만 산다.** 무엇을 부칠지와 어떤 실패가 무슨 갈래인지는 전부
// `_shared/notification/`의 순수 함수가 정하고 unit 테스트가 지킨다. 그 복사본은
// `pnpm edge:sync`가 만든다 — 정본은 `src/features/notification/model/`이다.
//
// 서비스 키를 쥐는 자리 셋 중 하나라 호출자 검사가 이 파일의 첫 일이다. 게이트웨이의
// `verify_jwt`는 유효한 토큰인지만 봐서 anon 키도 통과한다.
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

import {
  buildPushMessages,
  chunkPushMessages,
  type ClaimedPushNotification,
  type PushMessage,
} from "../_shared/notification/pushMessage.ts";
import {
  type PushOutcome,
  type PushResponse,
  splitPushResults,
} from "../_shared/notification/pushResult.ts";

const BEARER = "Bearer ";

const EXPO_SEND = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS = "https://exp.host/--/api/v2/push/getReceipts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
/** 부치는 접근 토큰이다. Edge Function secret이라 저장소에는 이름만 있다. */
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN") ?? "";

type ClaimedRow = {
  id: string;
  profile_id: string;
  kind: string;
  payload: Record<string, unknown>;
  addresses: string[];
};

type ScrapeRow = { id: string; receipt_id: string; addresses: string[] };

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

/**
 * 트리거는 방금 들어온 id 하나를 싣고 cron은 널을 싣는다. 널이면 조건에 맞는 행 전부다 —
 * 가르는 자리가 잡는 질의 하나라 여기는 본문을 그대로 넘긴다.
 */
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

/** 부친 답은 보낸 순서 그대로 온다. 비면 그 자리를 재시도 갈래로 읽게 만든다. */
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

/**
 * 지난 접수증을 긁는다. **보낼 것이 없어도 언제나 첫 단계다** — 새 알림이 한동안 없어도
 * 앱을 지운 사람의 주소가 남지 않게(NTF-034) 이 자리가 매분 같이 돈다.
 *
 * **긁기가 실패해도 보내기는 돈다.** 접수증 서비스가 답을 안 줘도 그 회차의 발송이 막히면
 * 안 된다.
 */
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

    // 기기가 둘인 행은 접수증이 어느 기기 것인지 못 가린다(design.md Q-01). 그 행에서
    // 주소를 지우면 살아 있는 쪽이 같이 사라지니 폐기 후보에서 뺀다.
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
