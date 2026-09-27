import { DomainError } from "@/shared/api/errors";
import { setWage } from "@/entities/payroll/dals/set-wage";
import {
  createAdminUser,
  createApprovedUser,
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

describe("setWage dal(plan AC-07) — set_wage를 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 오늘 날짜에 개인 시급 행이 선다", async () => {
    const worker = await createApprovedUser();

    await setWage(admin.client, { profileId: worker.profileId, amount: 15000 });

    const { data, error } = await wageRateRow(
      admin,
      worker.profileId,
      kstDate(0),
    );
    expect(error).toBeNull();
    expect(data).toEqual({ amount: 15000, follows_default: false });
  });

  it("100,001원이면 bad_amount", async () => {
    const worker = await createApprovedUser();

    const error = await captureDomainError(() =>
      setWage(admin.client, { profileId: worker.profileId, amount: 100001 }),
    );

    expect(error.code).toBe("bad_amount");
  });

  it("관리자가 아니면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const other = await createApprovedUser();

    const error = await captureDomainError(() =>
      setWage(worker.client, { profileId: other.profileId, amount: 15000 }),
    );

    expect(error.code).toBe("not_allowed");
  });
});
