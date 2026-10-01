import { DomainError } from "@/shared/model/error.type";
import { setDisplayName } from "@/features/memberAdmin/api/setDisplayName.api";
import {
  createAdminUser,
  createApprovedUser,
} from "@tests/integration/postgres";

describe("setDisplayName dal — set_display_name을 부르고 오류를 DomainError로 올린다", () => {
  it("관리자가 재직자 이름을 고치면 display_name이 새 값으로 바뀐다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();

    await setDisplayName(admin.client, member.profileId, "새이름");

    const { data, error } = await admin.client
      .from("profiles")
      .select("display_name")
      .eq("id", member.profileId)
      .single<{ display_name: string | null }>();

    expect(error).toBeNull();
    expect(data?.display_name).toBe("새이름");
  });

  it("빈 이름으로 고치려 하면 DomainError('invalid_name')을 던진다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();

    let caught: unknown;
    try {
      await setDisplayName(admin.client, member.profileId, "");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("invalid_name");
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    const nonAdmin = await createApprovedUser();
    const member = await createApprovedUser();

    let caught: unknown;
    try {
      await setDisplayName(nonAdmin.client, member.profileId, "새이름");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
