import { DomainError } from "@/shared/model/error.type";
import { setHoliday } from "@/features/holiday/api/setHoliday.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  type AdminUser,
} from "@tests/integration/postgres";

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

function holidayRows(
  admin: AdminUser,
  holidayDate: string,
): Promise<QueryResult<{ source: string }>> {
  return (
    admin.client as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string,
          ) => Promise<QueryResult<{ source: string }>>;
        };
      };
    }
  )
    .from("holidays")
    .select("source")
    .eq("holiday_date", holidayDate);
}

function freshDate(): string {
  return kstDate(24 + Math.floor(Math.random() * 90000));
}

function seedApiHoliday(holidayDate: string): void {
  execSql(
    "insert into public.holidays (holiday_date, source, name)\n" +
      "values (:'holiday_date', 'api', '테스트 공휴일')\n" +
      "on conflict (holiday_date, source) do nothing;\n",
    { holiday_date: holidayDate },
  );
}

async function captureDomainError(
  run: () => Promise<unknown>,
): Promise<DomainError> {
  try {
    await run();
  } catch (error) {
    if (error instanceof DomainError) {
      return error;
    }
    throw error;
  }
  throw new Error("에러가 나지 않았다");
}

describe("setHoliday dal(plan AC-07) — set_holiday를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("on=true면 manual 행이 서고, on=false면 지워진다", async () => {
    const date = freshDate();

    await setHoliday(admin.client, { date, on: true });
    expect((await holidayRows(admin, date)).data).toEqual([
      { source: "manual" },
    ]);

    await setHoliday(admin.client, { date, on: false });
    expect((await holidayRows(admin, date)).data).toEqual([]);
  });

  it("같은 날짜에 api 행이 있으면 on=true여도 무변화다", async () => {
    const date = freshDate();
    seedApiHoliday(date);

    await setHoliday(admin.client, { date, on: true });

    expect((await holidayRows(admin, date)).data).toEqual([{ source: "api" }]);
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const date = freshDate();

    const error = await captureDomainError(() =>
      setHoliday(worker.client, { date, on: true }),
    );

    expect(error.code).toBe("not_allowed");
  });
});
