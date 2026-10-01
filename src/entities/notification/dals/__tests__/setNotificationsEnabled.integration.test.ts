import { DomainError } from "@/shared/api/errors";
import { setNotificationsEnabled } from "@/entities/notification/dals/set-notifications-enabled";
import {
  createApprovedUser,
  createLeftUser,
  type ApprovedUser,
  type LeftUser,
} from "@tests/integration/postgres";

describe("setNotificationsEnabled dal — set_notifications_enabled를 부르고 오류를 DomainError로 올린다(AC-06)", () => {
  let owner: ApprovedUser;
  let left: LeftUser;

  beforeAll(async () => {
    owner = await createApprovedUser();
    left = await createLeftUser();
  });

  it("성공하면 profiles.notifications_enabled가 실제로 바뀐다", async () => {
    await setNotificationsEnabled(owner.client, false);

    const { data, error } = await owner.client
      .from("profiles")
      .select("notifications_enabled")
      .eq("id", owner.profileId)
      .single<{ notifications_enabled: boolean }>();

    expect(error).toBeNull();
    expect(data?.notifications_enabled).toBe(false);
  });

  it("나간 사람이면 DomainError('not_allowed')를 던진다", async () => {
    let caught: unknown;
    try {
      await setNotificationsEnabled(left.client, true);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
