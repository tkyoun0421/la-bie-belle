import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/api/errors";
import { savePushToken } from "@/entities/notification/dals/save-push-token";
import {
  createApprovedUser,
  createLeftUser,
  type ApprovedUser,
  type LeftUser,
} from "@tests/integration/postgres";

function deviceToken(): string {
  return `ExponentPushToken[test-save-${randomUUID()}]`;
}

describe("savePushToken dal — save_push_token을 부르고 오류를 DomainError로 올린다(AC-05)", () => {
  let owner: ApprovedUser;
  let left: LeftUser;

  beforeAll(async () => {
    owner = await createApprovedUser();
    left = await createLeftUser();
  });

  it("성공하면 push_tokens에 본인 행이 실제로 선다", async () => {
    const token = deviceToken();

    await savePushToken(owner.client, token);

    const { data, error } = await owner.client
      .from("push_tokens")
      .select("profile_id")
      .eq("token", token);

    expect(error).toBeNull();
    expect(data).toEqual([{ profile_id: owner.profileId }]);
  });

  it("나간 사람이면 DomainError('not_allowed')를 던진다", async () => {
    let caught: unknown;
    try {
      await savePushToken(left.client, deviceToken());
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
