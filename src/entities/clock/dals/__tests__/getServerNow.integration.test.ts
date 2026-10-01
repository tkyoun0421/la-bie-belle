import { getServerNow } from "@/entities/clock/dals/get-server-now";
import { queryColumn } from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

function dbNowMs(): number {
  const [epochSeconds] = queryColumn("select extract(epoch from now());\n");
  if (!epochSeconds) {
    throw new Error("DB now()를 못 읽었다");
  }
  return Math.round(Number(epochSeconds) * 1000);
}

describe("getServerNow dal — server_now()을 부른다", () => {
  it("승인 여부와 무관하게 부를 수 있다 — 누구나 부르는 예외다", async () => {
    const unapproved = await createSignedInUser();

    const iso = await getServerNow(unapproved.client);

    expect(typeof iso).toBe("string");
    expect(Number.isNaN(new Date(iso).getTime())).toBe(false);
  });

  it("낸 값이 DB now()와 1초 안에 있다", async () => {
    const user = await createSignedInUser();

    const iso = await getServerNow(user.client);
    const gotMs = new Date(iso).getTime();
    const dbMs = dbNowMs();

    expect(Math.abs(gotMs - dbMs)).toBeLessThan(1000);
  });
});
