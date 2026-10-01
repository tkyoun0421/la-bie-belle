import { DomainError } from "@/shared/model/error.type";
import { undoLeave } from "@/features/memberAdmin/api/undoLeave.api";
import {
  createAdminUser,
  createApprovedUser,
  createLeftUser,
} from "@tests/integration/postgres";

describe("undoLeave dal — undo_leave를 부르고 오류를 DomainError로 올린다", () => {
  it("퇴사자를 되돌리면 left_at이 null이 된다", async () => {
    const admin = await createAdminUser();
    const left = await createLeftUser();

    await undoLeave(admin.client, left.profileId);

    const { data, error } = await admin.client
      .from("profiles")
      .select("left_at")
      .eq("id", left.profileId)
      .single<{ left_at: string | null }>();

    expect(error).toBeNull();
    expect(data?.left_at).toBeNull();
  });

  it("퇴사 아닌 대상을 되돌리면 DomainError('already_decided')를 던진다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();

    let caught: unknown;
    try {
      await undoLeave(admin.client, member.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("already_decided");
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    const nonAdmin = await createApprovedUser();
    const left = await createLeftUser();

    let caught: unknown;
    try {
      await undoLeave(nonAdmin.client, left.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
