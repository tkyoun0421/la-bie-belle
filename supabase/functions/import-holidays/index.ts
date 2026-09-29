// 공휴일 받기의 밖으로 나가는 한 걸음이다. `internal.fetch_holidays`가 다음 해가 비어 있는
// 것을 보고 pg_net으로 이 함수를 쏘면, 여기가 공공 API(한국천문연구원 특일 정보)를 부르고
// 받은 목록을 service role로 `internal.import_holidays`에 넘긴다 — Postgres 함수가 외부 HTTP를
// 못 부른다(payroll/design.md 「공휴일 받기」).
//
// 서비스 키를 쥐는 자리 셋 중 하나라 호출자 검사가 이 파일의 첫 일이다. 게이트웨이의
// `verify_jwt`는 유효한 토큰인지만 봐서 anon 키도 통과한다 — 안 막으면 인증된 클라이언트
// 아무나 이 주소를 되풀이해 불러 우리 공공 API 쿼터를 태운다.
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

import {
  type HolidayRow,
  parseHolidayApiResponse,
} from "../../../src/features/payroll/model/holiday-api-response.ts";

const BEARER = "Bearer ";

const HOLIDAY_API =
  "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

/** 한 해를 한 번에 못 받는다. `solMonth`를 넘겨 달마다 부른다. */
const MONTHS = 12;

/** 한 달 공휴일이 이 수를 넘는 일이 없다. 기본값 10으로 두면 연휴가 있는 달이 잘린다. */
const ROWS_PER_MONTH = 100;

/** 받아올 수 있는 해의 범위다. 이 밖의 값은 부르는 쪽이 잘못 보낸 것이다. */
const EARLIEST_YEAR = 2000;
const LATEST_YEAR = 2100;

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const holidayApiKey = Deno.env.get("HOLIDAY_API_KEY") ?? "";

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

/** 어느 해를 받는지는 `fetch_holidays`가 정한다 — 비어 있는 해를 아는 자리가 거기 하나다. */
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

async function fetchMonth(year: number, month: number): Promise<HolidayRow[]> {
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

/**
 * 열두 달을 모아 한 해를 만든다. **한 달이라도 실패하면 던진다** — 부분 성공이 없다.
 * 반쪽짜리 한 해를 넣으면 `import_holidays`가 그 해의 `api` 행을 지우고 새로 넣어 멀쩡하던
 * 날들이 사라진다. 실패한 날은 아무것도 안 넣고 다음 날 cron이 같은 조건을 다시 본다.
 */
async function fetchYear(year: number): Promise<HolidayRow[]> {
  const byDate = new Map<string, HolidayRow>();

  for (let month = 1; month <= MONTHS; month += 1) {
    for (const row of await fetchMonth(year, month)) {
      byDate.set(row.holiday_date, row);
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

// 사람이 안 보는 동작이라 로그가 유일한 창이다. 넣은 건수와 실패 사유를 해와 같이 남긴다.
// 모양이 어긋난 응답도 빈 배열로 와서(`parseHolidayApiResponse`) 「결과 없음」과 같아 보이니,
// 0건은 0건이라고 따로 적는다.
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

  let rows: HolidayRow[];

  try {
    rows = await fetchYear(year);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`import-holidays: ${year}년 받아오기가 실패했다 — ${reason}`);
    return respond(502, { error: "fetch_failed" });
  }

  if (rows.length === 0) {
    console.error(`import-holidays: ${year}년이 0건이라 아무것도 안 넣었다`);
    return respond(200, { year, imported: 0 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.schema("internal").rpc("import_holidays", {
    p_year: year,
    p_rows: rows,
  });

  if (error !== null) {
    console.error(
      `import-holidays: ${year}년 ${rows.length}건 넣기가 실패했다 — ${error.message}`,
    );
    return respond(500, { error: error.message });
  }

  console.log(`import-holidays: ${year}년 공휴일 ${rows.length}건을 넣었다`);

  return respond(200, { year, imported: rows.length });
});
