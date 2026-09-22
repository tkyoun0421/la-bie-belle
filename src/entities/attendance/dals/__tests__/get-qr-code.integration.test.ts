import { getQrCode, qrCodeKey } from "@/entities/attendance/dals/get-qr-code";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

describe("getQrCode — 관리자만 읽는 QR 값(AC-07)", () => {
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

    execSql(
      "insert into public.hall_secrets (hall_id, qr_code) values (:'hall_id', :'qr_code') on conflict (hall_id) do update set qr_code = excluded.qr_code;\n",
      { hall_id: hallId, qr_code: "get-qr-code-테스트-코드" },
    );
  });

  it("캐시 키는 ['hall', 'qr']이다", () => {
    expect(qrCodeKey()).toEqual(["hall", "qr"]);
  });

  it("관리자는 현재 QR 값을 읽는다", async () => {
    const qrCode = await getQrCode(admin.client);
    expect(qrCode).toBe("get-qr-code-테스트-코드");
  });

  it("근무자는 RLS에 막혀 null을 받는다", async () => {
    const qrCode = await getQrCode(worker.client);
    expect(qrCode).toBeNull();
  });
});
