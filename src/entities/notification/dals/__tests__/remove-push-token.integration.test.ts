import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/api/errors";
import { removePushToken } from "@/entities/notification/dals/remove-push-token";
import { savePushToken } from "@/entities/notification/dals/save-push-token";
import {
  createApprovedUser,
  createBlockedUser,
  type ApprovedUser,
  type BlockedUser,
} from "@tests/integration/postgres";

function deviceToken(): string {
  return `ExponentPushToken[test-remove-${randomUUID()}]`;
}

describe("removePushToken dal — remove_push_token을 부르고 오류를 DomainError로 올린다(AC-05)", () => {
  let owner: ApprovedUser;
  let blocked: BlockedUser;

  beforeAll(async () => {
    owner = await createApprovedUser();
    blocked = await createBlockedUser();
  });

  it("성공하면 본인 push_tokens 행이 실제로 사라진다", async () => {
    const token = deviceToken();
    await savePushToken(owner.client, token);

    await removePushToken(owner.client, token);

    const { data, error } = await owner.client
      .from("push_tokens")
      .select("id")
      .eq("token", token);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("차단된 사람이면 DomainError('not_allowed')를 던진다", async () => {
    let caught: unknown;
    try {
      await removePushToken(blocked.client, deviceToken());
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
