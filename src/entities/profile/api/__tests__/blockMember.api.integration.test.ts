import { DomainError } from "@/shared/api/errors";
import { blockMember } from "@/entities/profile/api/blockMember.api";
import {
  createAdminUser,
  createApprovedUser,
  createBlockedUser,
  createRejectedUser,
  createSubmittedUser,
} from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

describe("blockMember dal — block_member를 부르고 오류를 DomainError로 올린다", () => {
  it("관리자가 제출됨 대상을 차단하면 blocked_at이 찍힌다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSubmittedUser();

    await blockMember(admin.client, applicant.profileId);

    const { data, error } = await admin.client
      .from("profiles")
      .select("blocked_at")
      .eq("id", applicant.profileId)
      .single<{ blocked_at: string | null }>();

    expect(error).toBeNull();
    expect(data?.blocked_at).not.toBeNull();
  });

  it("이미 승인된 사람을 차단하면 DomainError('already_decided')를 던진다", async () => {
    const admin = await createAdminUser();
    const approved = await createApprovedUser();

    let caught: unknown;
    try {
      await blockMember(admin.client, approved.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("already_decided");
  });

  it("이미 거절된 사람을 차단하면 DomainError('already_decided')를 던진다", async () => {
    const admin = await createAdminUser();
    const rejected = await createRejectedUser();

    let caught: unknown;
    try {
      await blockMember(admin.client, rejected.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("already_decided");
  });

  it("이미 차단된 사람을 다시 차단하면 DomainError('already_decided')를 던진다", async () => {
    const admin = await createAdminUser();
    const blocked = await createBlockedUser();

    let caught: unknown;
    try {
      await blockMember(admin.client, blocked.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("already_decided");
  });

  it("프로필을 안 보낸 사람을 차단하면 DomainError('already_decided')를 던진다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSignedInUser();

    let caught: unknown;
    try {
      await blockMember(admin.client, applicant.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("already_decided");
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    const nonAdmin = await createApprovedUser();
    const applicant = await createSubmittedUser();

    let caught: unknown;
    try {
      await blockMember(nonAdmin.client, applicant.profileId);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
