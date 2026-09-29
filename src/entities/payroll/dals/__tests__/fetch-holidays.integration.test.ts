import {
  type AdminUser,
  createAdminUser,
  execSql,
  queryColumn,
  seedHoliday,
} from "@tests/integration/postgres";

const FETCH_HOLIDAYS_URL_SECRET_NAME = "import_holidays_url";
const FETCH_HOLIDAYS_SERVICE_KEY_SECRET_NAME =
  "import_holidays_service_role_key";

function createFetchHolidaysVaultSecrets(): void {
  execSql(
    "select vault.create_secret(:'url', :'url_name');\n" +
      "select vault.create_secret(:'key', :'key_name');\n",
    {
      url: "http://127.0.0.1:54321/functions/v1/import-holidays",
      url_name: FETCH_HOLIDAYS_URL_SECRET_NAME,
      key: "local-only-fake-service-key",
      key_name: FETCH_HOLIDAYS_SERVICE_KEY_SECRET_NAME,
    },
  );
}

function deleteFetchHolidaysVaultSecrets(): void {
  execSql(
    "delete from vault.secrets where name in (:'url_name', :'key_name');\n",
    {
      url_name: FETCH_HOLIDAYS_URL_SECRET_NAME,
      key_name: FETCH_HOLIDAYS_SERVICE_KEY_SECRET_NAME,
    },
  );
}

function callFetchHolidays(): void {
  execSql("select internal.fetch_holidays();\n");
}

// pg_net은 요청 행만 그 자리에서 넣고 응답 행은 백그라운드 워커가 나중에 쓴다.
// net._http_response를 부른 직후에 세면 아직 안 쓰인 것을 0으로 읽는다.
// 요청 번호를 내주는 시퀀스는 net.http_post가 동기로 당기니 그쪽을 센다.
function netRequestCursor(): number {
  const rows = queryColumn(
    "select case when is_called then last_value else 0 end\n" +
      "from net.http_request_queue_id_seq;\n",
  );
  return Number(rows[0] ?? "0");
}

function netRequestCountAfter(cursor: number): number {
  return netRequestCursor() - cursor;
}

function rpc(
  user: { client: AdminUser["client"] },
  fn: string,
  args: Record<string, unknown>,
): Promise<{ error: { message: string } | null }> {
  return (
    user.client as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc(fn, args);
}

function apiHolidayCountInYear(year: number): number {
  const rows = queryColumn(
    "select count(*) from public.holidays\n" +
      "where source = 'api'\n" +
      "  and holiday_date >= make_date(:'year'::integer, 1, 1)\n" +
      "  and holiday_date < make_date(:'year'::integer + 1, 1, 1);\n",
    { year: String(year) },
  );
  return Number(rows[0] ?? "0");
}

function nextYear(): number {
  return new Date().getUTCFullYear() + 1;
}

function randomDayInYear(year: number): string {
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

let trackedHolidays: { date: string; source: "api" | "manual" }[] = [];

function seedTrackedHoliday(date: string, source: "api" | "manual"): void {
  seedHoliday(date, source);
  trackedHolidays.push({ date, source });
}

afterEach(() => {
  for (const { date, source } of trackedHolidays) {
    execSql(
      "delete from public.holidays where holiday_date = :'date' and source = :'source';\n",
      { date, source },
    );
  }
  trackedHolidays = [];
});

describe("internal.fetch_holidays — 다음 해 조건(plan AC-01)", () => {
  beforeAll(() => {
    createFetchHolidaysVaultSecrets();
  });

  afterAll(() => {
    deleteFetchHolidaysVaultSecrets();
  });

  it("다음 해에 api 공휴일이 있으면 pg_net을 부르지 않는다", () => {
    seedTrackedHoliday(randomDayInYear(nextYear()), "api");
    const before = netRequestCursor();

    callFetchHolidays();

    expect(netRequestCountAfter(before)).toBe(0);
  });

  it("다음 해에 api 공휴일이 하나도 없으면 pg_net을 한 번 부른다", () => {
    const before = netRequestCursor();

    callFetchHolidays();

    expect(netRequestCountAfter(before)).toBe(1);
  });

  it("올해 api 공휴일이 있어도 다음 해가 비어 있으면 여전히 부른다 — 다음 해만 본다", () => {
    seedTrackedHoliday(randomDayInYear(nextYear() - 1), "api");
    const before = netRequestCursor();

    callFetchHolidays();

    expect(netRequestCountAfter(before)).toBe(1);
  });

  it("다음 해에 manual 공휴일만 있으면 받아진 해로 안 쳐서 부른다", () => {
    seedTrackedHoliday(randomDayInYear(nextYear()), "manual");
    const before = netRequestCursor();

    callFetchHolidays();

    expect(netRequestCountAfter(before)).toBe(1);
  });

  it("vault 항목이 없어도 예외 없이 끝난다", () => {
    deleteFetchHolidaysVaultSecrets();

    try {
      expect(() => callFetchHolidays()).not.toThrow();
    } finally {
      createFetchHolidaysVaultSecrets();
    }
  });
});

describe("public.import_holidays 껍데기(plan AC-02) — service role만 통과한다", () => {
  it("로그인한 클라이언트가 rpc('import_holidays')를 부르면 not_allowed로 거절되고 아무것도 안 들어간다", async () => {
    const admin = await createAdminUser();
    const year = 2050 + Math.floor(Math.random() * 900);

    const { error } = await rpc(admin, "import_holidays", {
      p_year: year,
      p_rows: [{ holiday_date: `${year}-03-01`, name: "공개호출" }],
    });

    expect(error?.message).toBe("not_allowed");
    expect(apiHolidayCountInYear(year)).toBe(0);
  });
});

describe("cron 등록(plan AC-03) — 매일 한국 새벽 3시(UTC 18시)에 fetch-holidays가 돈다", () => {
  it("cron.job에 fetch-holidays 이름의 행이 하나고 스케줄이 0 18 * * *다", () => {
    const jobNames = queryColumn(
      "select jobname from cron.job where jobname = 'fetch-holidays';\n",
    );
    expect(jobNames).toEqual(["fetch-holidays"]);

    const schedules = queryColumn(
      "select schedule from cron.job where jobname = 'fetch-holidays';\n",
    );
    expect(schedules).toEqual(["0 18 * * *"]);
  });
});
