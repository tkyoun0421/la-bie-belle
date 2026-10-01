import { queryKeys } from "@/shared/api/queryKeys";
import { getQrCode } from "@/entities/attendance/dals/getQrCode";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

describe("getQrCode — 관리자가 새로 뽑기 전에도 값이 있다(AC-07)", () => {
  it("관리자가 rotate_qr을 한 번도 부르지 않아도 QR 값을 읽는다", async () => {
    const admin = await createAdminUser();

    const result = await getQrCode(admin.client);

    expect(result).not.toBeNull();
  });
});

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
    expect(queryKeys.hall.qr()).toEqual(["hall", "qr"]);
  });

  it("관리자는 hall_secrets의 값과 회전 시각을 그대로 받는다", async () => {
    const result = await getQrCode(admin.client);

    const row = await admin.client
      .from("hall_secrets")
      .select("qr_code, rotated_at")
      .eq("hall_id", hallId)
      .single<{ qr_code: string; rotated_at: string }>();
    if (row.error || !row.data) {
      throw row.error ?? new Error("hall_secrets 행을 못 찾았다");
    }

    expect(result).not.toBeNull();
    expect(result?.qrCode).toBe(row.data.qr_code);
    expect(new Date(result!.rotatedAt).getTime()).toBe(
      new Date(row.data.rotated_at).getTime(),
    );
  });

  it("근무자는 RLS에 막혀 null을 받는다", async () => {
    const result = await getQrCode(worker.client);
    expect(result).toBeNull();
  });
});
