import { DomainError } from "@/shared/api/errors";
import { grantPosition } from "@/features/schedule/api/grantPosition.api";
import {
  createAdminUser,
  createApprovedUser,
  type AdminUser,
} from "@tests/integration/postgres";

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

describe("grantPosition dal — grant_position을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 자격을 주면 position_grants에 행이 선다", async () => {
    const grantee = await createApprovedUser();

    await grantPosition(admin.client, grantee.profileId, "스캔");

    const { data } = await admin.client
      .from("position_grants")
      .select("id")
      .eq("profile_id", grantee.profileId)
      .eq("position", "스캔");
    expect(data).toHaveLength(1);
  });

  it("근무자가 부르면 not_allowed", async () => {
    const worker = await createApprovedUser();
    const grantee = await createApprovedUser();

    const error = await captureDomainError(() =>
      grantPosition(worker.client, grantee.profileId, "스캔"),
    );

    expect(error.code).toBe("not_allowed");
  });
});
