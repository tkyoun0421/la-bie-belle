import { DomainError } from "@/shared/api/errors";
import { setDefaultWage } from "@/entities/payroll/dals/set-default-wage";
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
            ) => Promise<
              QueryResult<{ amount: number; follows_default: boolean }>
            >;
          };
        };
      };
    }
  )
    .from("wage_rates")
    .select("amount, follows_default")
    .eq("profile_id", profileId)
    .eq("effective_date", effectiveDate);
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

describe("setDefaultWage dal(plan AC-07) — set_default_wage를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 따르는 사람 전원에게 오늘 행이 같이 선다(PAY-013)", async () => {
    const follower = await createApprovedUser();
    seedWageRate(follower.profileId, freshPastDate(), 10000, true);
    const individual = await createApprovedUser();
    seedWageRate(individual.profileId, freshPastDate(), 12000, false);
    const amount = 17000 + Math.floor(Math.random() * 1000);

    await setDefaultWage(admin.client, amount);

    const followerRow = await wageRateRow(
      admin,
      follower.profileId,
      kstDate(0),
    );
    expect(followerRow.data).toEqual({ amount, follows_default: true });
    const individualRow = await wageRateRow(
      admin,
      individual.profileId,
      kstDate(0),
    );
    expect(individualRow.data).toBeNull();
  });

  it("100,001원이면 bad_amount", async () => {
    const error = await captureDomainError(() =>
      setDefaultWage(admin.client, 100001),
    );

    expect(error.code).toBe("bad_amount");
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();

    const error = await captureDomainError(() =>
      setDefaultWage(worker.client, 11000),
    );

    expect(error.code).toBe("not_allowed");
  });
});
