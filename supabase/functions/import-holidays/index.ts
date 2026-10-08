import { createClient } from "npm:@supabase/supabase-js@2.112.4";

import { toHolidayImportEntry } from "../_shared/holiday/holiday.mapper.ts";
import {
  type Holiday,
  parseHolidayApiResponse,
} from "../_shared/holiday/holiday.schema.ts";

const BEARER = "Bearer ";

const HOLIDAY_API =
  "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

const MONTHS = 12;

const ROWS_PER_MONTH = 100;

const EARLIEST_YEAR = 2000;
const LATEST_YEAR = 2100;

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const holidayApiKey = Deno.env.get("HOLIDAY_API_KEY") ?? "";

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

async function readYear(request: Request): Promise<number | null> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null) {
    return null;
  }

  const year = (body as { year?: unknown }).year;

  return typeof year === "number" &&
    Number.isInteger(year) &&
    year >= EARLIEST_YEAR &&
    year <= LATEST_YEAR
    ? year
    : null;
}

async function fetchMonth(year: number, month: number): Promise<Holiday[]> {
  const query = new URLSearchParams({
    serviceKey: holidayApiKey,
    solYear: String(year),
    solMonth: String(month).padStart(2, "0"),
    numOfRows: String(ROWS_PER_MONTH),
    _type: "json",
  });

  const response = await fetch(`${HOLIDAY_API}?${query}`);

  if (!response.ok) {
    throw new Error(`${year}-${month}월 응답이 ${response.status}다`);
  }

  return parseHolidayApiResponse(await response.json());
}

async function fetchYear(year: number): Promise<Holiday[]> {
  const byDate = new Map<string, Holiday>();

  for (let month = 1; month <= MONTHS; month += 1) {
    for (const holiday of await fetchMonth(year, month)) {
      byDate.set(holiday.date, holiday);
    }
  }

  return [...byDate.values()];
}

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (!isServiceRole(request)) {
    console.error("import-holidays: service role이 아닌 호출을 거절했다");
    return respond(403, { error: "forbidden" });
  }

  const year = await readYear(request);

  if (year === null) {
    console.error("import-holidays: 본문에서 year를 못 읽었다");
    return respond(400, { error: "invalid_year" });
  }

  let holidays: Holiday[];

  try {
    holidays = await fetchYear(year);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`import-holidays: ${year}년 받아오기가 실패했다 — ${reason}`);
    return respond(502, { error: "fetch_failed" });
  }

  if (holidays.length === 0) {
    console.error(`import-holidays: ${year}년이 0건이라 아무것도 안 넣었다`);
    return respond(200, { year, imported: 0 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.rpc("import_holidays", {
    p_year: year,
    p_rows: holidays.map(toHolidayImportEntry),
  });

  if (error !== null) {
    console.error(
      `import-holidays: ${year}년 ${holidays.length}건 넣기가 실패했다 — ${error.message}`,
    );
    return respond(500, { error: error.message });
  }

  console.log(
    `import-holidays: ${year}년 공휴일 ${holidays.length}건을 넣었다`,
  );

  return respond(200, { year, imported: holidays.length });
});
