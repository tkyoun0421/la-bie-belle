import { DomainError, TransportError } from "@/shared/api/errors";
import { updateMyContact } from "@/entities/profile/dals/update-my-contact";
import { createSubmittedUser } from "@tests/integration/postgres";

describe("updateMyContact", () => {
  it("본인이 올바른 번호로 갱신하면 그 값이 실제로 반영된다", async () => {
    const user = await createSubmittedUser();

    await updateMyContact(user.client, user.profileId, "010-1234-5678");

    const { data, error } = await user.client
      .from("profile_private")
      .select("phone")
      .eq("profile_id", user.profileId)
      .single<{ phone: string | null }>();

    expect(error).toBeNull();
    expect(data?.phone).toBe("010-1234-5678");
  });

  it("하이픈 없는 번호는 invalid_phone DomainError로 거절된다", async () => {
    const user = await createSubmittedUser();

    const rejection = updateMyContact(
      user.client,
      user.profileId,
      "0100000000",
    );

    await expect(rejection).rejects.toBeInstanceOf(DomainError);
    await expect(rejection).rejects.toMatchObject({ code: "invalid_phone" });
  });

  it("남의 행을 갱신해도 조용히 성공하지 않고 실패한다", async () => {
    const owner = await createSubmittedUser();
    const intruder = await createSubmittedUser();

    const before = await owner.client
      .from("profile_private")
      .select("phone")
      .eq("profile_id", owner.profileId)
      .single<{ phone: string | null }>();

    await expect(
      updateMyContact(intruder.client, owner.profileId, "010-9999-9999"),
    ).rejects.toBeInstanceOf(TransportError);

    const after = await owner.client
      .from("profile_private")
      .select("phone")
      .eq("profile_id", owner.profileId)
      .single<{ phone: string | null }>();

    expect(after.data?.phone).toBe(before.data?.phone);
  });

  it("check 제약을 직접 어기면 PostgREST가 23514와 제약 이름을 돌려준다", async () => {
    const user = await createSubmittedUser();

    const { error } = await user.client
      .from("profile_private")
      .update({ phone: "0100000000" })
      .eq("profile_id", user.profileId);

    expect(error?.code).toBe("23514");
    expect(error?.message).toMatch(/profile_private_phone_format/);
  });
});
