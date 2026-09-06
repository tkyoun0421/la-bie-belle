import { describe, expect, it } from "vitest";
import { getApprovedAt } from "@/entities/profile/dals/get-approved-at";
import { createApprovedUser } from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

describe("가입 승인 시각을 읽는다", () => {
  it("승인 전에는 승인 시각이 비어 있다", async () => {
    const user = await createSignedInUser();

    const approvedAt = await getApprovedAt(user.client, user.userId);

    expect(approvedAt).toBeNull();
  });

  it("승인되면 채워진 승인 시각을 그대로 돌려준다", async () => {
    const user = await createApprovedUser();

    const approvedAt = await getApprovedAt(user.client, user.userId);

    expect(approvedAt).not.toBeNull();
    expect(new Date(approvedAt as string).getTime()).toBe(
      new Date(user.approvedAt).getTime(),
    );
  });

  it("남이 승인돼도 내 승인 시각은 그대로 비어 있다", async () => {
    await createApprovedUser();
    const me = await createSignedInUser();

    const approvedAt = await getApprovedAt(me.client, me.userId);

    expect(approvedAt).toBeNull();
  });
});
