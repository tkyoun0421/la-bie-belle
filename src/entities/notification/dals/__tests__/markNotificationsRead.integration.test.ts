import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/api/errors";
import { markNotificationsRead } from "@/entities/notification/dals/mark-notifications-read";
import {
  createApprovedUser,
  createBlockedUser,
  execSql,
  type ApprovedUser,
  type BlockedUser,
} from "@tests/integration/postgres";

function seedNotification(profileId: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.notifications (id, profile_id, kind, subject_id, payload) values (:'id', :'profile_id', 'signup_approved', :'subject_id', '{}'::jsonb);\n",
    { id, profile_id: profileId, subject_id: randomUUID() },
  );
  return id;
}

describe("markNotificationsRead dal — mark_notifications_read를 부르고 오류를 DomainError로 올린다(AC-04)", () => {
  let owner: ApprovedUser;
  let blocked: BlockedUser;

  beforeAll(async () => {
    owner = await createApprovedUser();
    blocked = await createBlockedUser();
  });

  it("성공하면 notifications.read_at이 실제로 찍힌다", async () => {
    const notificationId = seedNotification(owner.profileId);

    await markNotificationsRead(owner.client, [notificationId]);

    const { data, error } = await owner.client
      .from("notifications")
      .select("read_at")
      .eq("id", notificationId)
      .single<{ read_at: string | null }>();

    expect(error).toBeNull();
    expect(data?.read_at).not.toBeNull();
  });

  it("차단된 사람이면 DomainError('not_allowed')를 던진다", async () => {
    let caught: unknown;
    try {
      await markNotificationsRead(blocked.client, []);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
