import { getWageRates } from "@/entities/payroll/dals/get-wage-rates";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  type AdminUser,
} from "@tests/integration/postgres";

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

/**
 * `default_wage_rates`는 `effective_date`가 전역이라 다른 테스트가 남긴 행이 「기본값이
 * 아예 없다」는 전제를 깬다. 그 전제가 필요한 케이스는 여기서 표를 비우고 시작한다
 * (`payroll-functions.integration.test.ts`의 `clearDefaultWageRates`와 같은 이유).
 */
function clearDefaultWageRates(): void {
  execSql("delete from public.default_wage_rates;\n");
}

describe("getWageRates(plan payroll-wages AC-05) — 전원의 wage_rates 이력과 default_wage_rates 현재값을 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자 세션으로 부르면 한 사람의 wage_rates 이력이 날짜로 안 잘리고 전부 온다", async () => {
    const worker = await createApprovedUser();
    const veryOld = kstDate(-5000);
    const recent = kstDate(-10);
    const future = kstDate(60);
    seedWageRate(worker.profileId, veryOld, 10000, false);
    seedWageRate(worker.profileId, recent, 11000, false);
    seedWageRate(worker.profileId, future, 12000, false);

    const result = await getWageRates(admin.client);
    const own = result.wageRates.filter(
      (row) => row.profile_id === worker.profileId,
    );
    const effectiveDates = own.map((row) => row.effective_date);

    expect(effectiveDates).toEqual(
      expect.arrayContaining([veryOld, recent, future]),
    );
    expect(own).toHaveLength(3);
  });

  it("시급 이력이 아예 없는 승인 사원이 있어도 던지지 않는다", async () => {
    const workerWithoutHistory = await createApprovedUser();

    await expect(getWageRates(admin.client)).resolves.toBeDefined();

    const result = await getWageRates(admin.client);
    const own = result.wageRates.filter(
      (row) => row.profile_id === workerWithoutHistory.profileId,
    );
    expect(own).toHaveLength(0);
  });

  it("default_wage_rates가 비어 있으면 그 자리가 null이고 던지지 않는다(PAY-012)", async () => {
    clearDefaultWageRates();

    const result = await getWageRates(admin.client);

    expect(result.defaultWageRate).toBeNull();
  });

  it("default_wage_rates가 여러 행이면 가장 최근 행이 같이 온다", async () => {
    clearDefaultWageRates();
    const older = kstDate(-20);
    const newer = kstDate(-1);
    seedDefaultWageRate(older, 11000);
    seedDefaultWageRate(newer, 13000);

    const result = await getWageRates(admin.client);

    expect(result.defaultWageRate).toEqual({
      effective_date: newer,
      amount: 13000,
    });
  });
});
