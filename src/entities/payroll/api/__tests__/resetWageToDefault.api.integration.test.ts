import { DomainError } from "@/shared/api/errors";
import { resetWageToDefault } from "@/entities/payroll/api/resetWageToDefault.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  type AdminUser,
} from "@tests/integration/postgres";

type QueryResult<T> = { data: T | null; error: { message: string } | null };

function wageRateRow(
  admin: AdminUser,
  profileId: string,
  effectiveDate: string,
): Promise<QueryResult<{ amount: number; follows_default: boolean }>> {
  return (
    admin.client as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string,
          ) => {
            eq: (
              column: string,
              value: string,
            ) => {
              maybeSingle: () => Promise<
                QueryResult<{ amount: number; follows_default: boolean }>
              >;
            };
          };
        };
      };
    }
  )
    .from("wage_rates")
    .select("amount, follows_default")
    .eq("profile_id", profileId)
    .eq("effective_date", effectiveDate)
    .maybeSingle();
}

function freshPastDate(): string {
  return kstDate(-(24 + Math.floor(Math.random() * 90000)));
}

function seedWageRate(
  profileId: string,
  effectiveDate: string,
  amount: number,
  followsDefault: boolean,
): void {
  execSql(
    "insert into public.wage_rates (profile_id, effective_date, amount, follows_default)\n" +
      `values (:'profile_id', :'effective_date', :'amount', ${followsDefault ? "true" : "false"});\n`,
    {
      profile_id: profileId,
      effective_date: effectiveDate,
      amount: String(amount),
    },
  );
}

function seedDefaultWageRate(effectiveDate: string, amount: number): void {
  execSql(
    "insert into public.default_wage_rates (effective_date, amount)\n" +
      "values (:'effective_date', :'amount')\n" +
      "on conflict (effective_date) do update set amount = excluded.amount;\n",
    { effective_date: effectiveDate, amount: String(amount) },
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

describe("resetWageToDefault dal(plan AC-07) — reset_wage_to_default를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 오늘 날짜에 그 시점 기본값 행이 선다(PAY-014)", async () => {
    const worker = await createApprovedUser();
    seedWageRate(worker.profileId, freshPastDate(), 20000, false);
    seedDefaultWageRate(kstDate(0), 15500);

    await resetWageToDefault(admin.client, worker.profileId);

    const { data, error } = await wageRateRow(
      admin,
      worker.profileId,
      kstDate(0),
    );
    expect(error).toBeNull();
    expect(data).toEqual({ amount: 15500, follows_default: true });
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();

    const error = await captureDomainError(() =>
      resetWageToDefault(worker.client, worker.profileId),
    );

    expect(error.code).toBe("not_allowed");
  });
});
