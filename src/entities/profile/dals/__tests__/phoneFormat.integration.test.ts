import { execSql } from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

function expectSqlError(action: () => void, pattern: RegExp): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  const stderr = (
    caught as { stderr?: Buffer } | undefined
  )?.stderr?.toString();
  expect(stderr ?? "").toMatch(pattern);
}

const CHECK_VIOLATION = /violates check constraint/;

describe("전화번호 형식", () => {
  it("010-0000-0001 꼴은 submit_profile을 통과한다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0001",
      birth_date: "1990-01-01",
      gender: "female",
    });

    expect(error).toBeNull();
  });

  it.each([
    ["하이픈이 없으면", "01000000002"],
    ["자릿수가 다르면", "010-000-0002"],
    ["010으로 시작하지 않으면", "011-0000-0003"],
    ["빈 문자열이면", ""],
  ])("%s submit_profile이 invalid_phone을 던진다", async (_label, phone) => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone,
      birth_date: "1990-01-01",
      gender: "female",
    });

    expect(error?.message).toBe("invalid_phone");
  });

  it("함수가 먼저 막는다 — 던지는 코드가 invalid_phone이지 DB 제약 위반 원문이 아니다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "011-0000-0004",
      birth_date: "1990-01-01",
      gender: "female",
    });

    expect(error?.message).toBe("invalid_phone");
    expect(error?.message).not.toMatch(CHECK_VIOLATION);
  });

  it("profile_private에 직접 나쁜 값을 넣으면 check 제약이 막는다", async () => {
    const user = await createSignedInUser();

    expectSqlError(
      () =>
        execSql(
          "insert into public.profile_private (profile_id, phone) values (:'profile_id', :'phone');\n",
          { profile_id: user.profileId, phone: "011-0000-0005" },
        ),
      CHECK_VIOLATION,
    );
  });
});
