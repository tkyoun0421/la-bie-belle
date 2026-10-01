import { DomainError } from "@/shared/api/errors";
import { unblockMember } from "@/features/memberAdmin/api/unblockMember.api";
import {
  createAdminUser,
  createApprovedUser,
  createSubmittedUser,
  execSql,
} from "@tests/integration/postgres";

describe("unblockMember dal — unblock_member를 부르고 오류를 DomainError로 올린다", () => {
  it("관리자가 해제하면 blocked_at과 submitted_at이 둘 다 빈다", async () => {
    const admin = await createAdminUser();
    const target = await createSubmittedUser();
    execSql(
      "update public.profiles set blocked_at = now() where user_id = :'user_id';\n",
      { user_id: target.userId },
    );

    await unblockMember(admin.client, target.profileId);

    const { data, error } = await admin.client
      .from("profiles")
      .select("blocked_at, submitted_at")
      .eq("id", target.profileId)
      .single<{ blocked_at: string | null; submitted_at: string | null }>();

    expect(error).toBeNull();
    expect(data?.blocked_at).toBeNull();
    expect(data?.submitted_at).toBeNull();
  });

  it("차단 안 된 대상을 해제하면 DomainError('already_decided')를 던진다", async () => {
    const admin = await createAdminUser();
    const notBlocked = await createApprovedUser();

    let caught: unknown;
    try {
      await unblockMember(admin.client, notBlocked.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("already_decided");
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    const nonAdmin = await createApprovedUser();
    const target = await createSubmittedUser();
    execSql(
      "update public.profiles set blocked_at = now() where user_id = :'user_id';\n",
      { user_id: target.userId },
    );

    let caught: unknown;
    try {
      await unblockMember(nonAdmin.client, target.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
