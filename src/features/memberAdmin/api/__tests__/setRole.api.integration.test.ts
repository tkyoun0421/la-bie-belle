import { DomainError } from "@/shared/api/errors";
import { setRole } from "@/features/members/api/setRole.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  withOnlyAdmin,
} from "@tests/integration/postgres";

async function roleOf(
  client: Awaited<ReturnType<typeof createAdminUser>>["client"],
  profileId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single<{ role: string }>();
  if (error) {
    throw error;
  }
  return data?.role ?? null;
}

describe("setRole dal — set_role을 부르고 오류를 DomainError로 올린다", () => {
  it("재직자를 관리자로 올리면 role이 admin이 된다", async () => {
    const admin = await createAdminUser();
    const member = await createApprovedUser();

    await setRole(admin.client, member.profileId, "admin");

    expect(await roleOf(admin.client, member.profileId)).toBe("admin");
  });

  it("관리자를 재직자로 내리면 role이 member가 된다", async () => {
    const adminA = await createAdminUser();
    const adminB = await createAdminUser();

    await setRole(adminA.client, adminB.profileId, "member");

    expect(await roleOf(adminA.client, adminB.profileId)).toBe("member");
  });

  it("마지막 관리자를 내리려 하면 DomainError('last_admin')을 던진다", async () => {
    const admin = await createAdminUser();

    await withOnlyAdmin(admin.profileId, async () => {
      let caught: unknown;
      try {
        await setRole(admin.client, admin.profileId, "member");
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(DomainError);
      expect((caught as DomainError).code).toBe("last_admin");
    });
  });

  it("퇴사한 관리자는 마지막 관리자 셈에서 빠져서, 남은 관리자를 내리면 last_admin이다", async () => {
    const admin = await createAdminUser();

    await withOnlyAdmin(admin.profileId, async () => {
      const leftAdmin = await createAdminUser();
      execSql(
        "update public.profiles set left_at = now() where id = :'profile_id';\n",
        { profile_id: leftAdmin.profileId },
      );

      let caught: unknown;
      try {
        await setRole(admin.client, admin.profileId, "member");
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(DomainError);
      expect((caught as DomainError).code).toBe("last_admin");
    });
  });

  it("차단된 관리자는 마지막 관리자 셈에서 빠져서, 남은 관리자를 내리면 last_admin이다", async () => {
    const admin = await createAdminUser();

    await withOnlyAdmin(admin.profileId, async () => {
      const blockedAdmin = await createAdminUser();
      execSql(
        "update public.profiles set blocked_at = now() where id = :'profile_id';\n",
        { profile_id: blockedAdmin.profileId },
      );

      let caught: unknown;
      try {
        await setRole(admin.client, admin.profileId, "member");
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(DomainError);
      expect((caught as DomainError).code).toBe("last_admin");
    });
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    const nonAdmin = await createApprovedUser();
    const member = await createApprovedUser();

    let caught: unknown;
    try {
      await setRole(nonAdmin.client, member.profileId, "admin");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
