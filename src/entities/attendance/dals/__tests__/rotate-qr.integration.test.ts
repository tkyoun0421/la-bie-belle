import { DomainError } from "@/shared/api/errors";
import { rotateQr } from "@/entities/attendance/dals/rotate-qr";
import {
  createAdminUser,
  createApprovedUser,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

describe("rotateQr dal — rotate_qr를 부르고 오류를 DomainError로 올린다(AC-07)", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let hallId: string;

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();

    const { data, error } = await admin.client
      .from("halls")
      .select("id")
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("홀을 못 찾았다");
    }
    hallId = data.id;
  });

  it("성공하면 hall_secrets.qr_code가 실제로 바뀐다", async () => {
    const before = await admin.client
      .from("hall_secrets")
      .select("qr_code")
      .eq("hall_id", hallId)
      .maybeSingle<{ qr_code: string }>();

    await rotateQr(admin.client);

    const after = await admin.client
      .from("hall_secrets")
      .select("qr_code")
      .eq("hall_id", hallId)
      .single<{ qr_code: string }>();

    expect(after.error).toBeNull();
    expect(after.data?.qr_code).not.toBe(before.data?.qr_code);
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    let caught: unknown;
    try {
      await rotateQr(worker.client);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
