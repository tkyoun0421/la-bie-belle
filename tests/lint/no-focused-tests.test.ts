import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lintFixture(code: string, filePath: string) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), filePath),
  });
  return result;
}

describe("규칙10 — 집중 실행 표시", () => {
  it("vitest describe.only가 걸린다", async () => {
    const code = `import { describe, it } from "vitest";\n\ndescribe.only("x", () => {\n  it("y", () => {});\n});\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/__tests__/fixture.test.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("vitest it.only가 걸린다", async () => {
    const code = `import { describe, it } from "vitest";\n\ndescribe("x", () => {\n  it.only("y", () => {});\n});\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/__tests__/fixture.test.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("vitest test.only가 걸린다", async () => {
    const code = `import { test } from "vitest";\n\ntest.only("x", () => {});\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/__tests__/fixture.test.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("playwright test.only가 걸린다", async () => {
    const code = `import { test } from "@playwright/test";\n\ntest.only("x", async () => {});\n`;

    const result = await lintFixture(code, "tests/e2e/fixture.spec.ts");

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("playwright test.describe.only가 걸린다", async () => {
    const code = `import { test } from "@playwright/test";\n\ntest.describe.only("x", () => {\n  test("y", async () => {});\n});\n`;

    const result = await lintFixture(code, "tests/e2e/fixture.spec.ts");

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("vitest it.skip은 위반 0건이다", async () => {
    const code = `import { describe, it } from "vitest";\n\ndescribe("x", () => {\n  it.skip("y", () => {});\n});\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/__tests__/fixture.test.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("playwright test.skip은 위반 0건이다", async () => {
    const code = `import { test } from "@playwright/test";\n\ntest.skip("x", async () => {});\n`;

    const result = await lintFixture(code, "tests/e2e/fixture.spec.ts");

    expect(result.errorCount).toBe(0);
  });

  it("평범한 describe/it/test는 위반 0건이다", async () => {
    const code = `import { describe, it, test } from "vitest";\n\ndescribe("x", () => {\n  it("y", () => {});\n  test("z", () => {});\n});\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/__tests__/fixture.test.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("회귀 — profile.integration.test.ts는 위반 0건이다", async () => {
    const code = `import { describe, expect, it } from "vitest";
import {
  createGuestClient,
  createSignedInUser,
} from "@tests/integration/supabase";

describe("프로필 접근 권한", () => {
  it("가입 승인 전에도 본인은 자기 프로필을 읽는다", async () => {
    const user = await createSignedInUser();

    const { data, error } = await user.client
      .from("profiles")
      .select("id, display_name, approved_at")
      .eq("id", user.userId);

    expect(error).toBeNull();
    expect(data).toEqual([
      { id: user.userId, display_name: null, approved_at: null },
    ]);
  });

  it("로그아웃 상태로는 프로필을 한 행도 읽지 못한다", async () => {
    const user = await createSignedInUser();
    const guest = createGuestClient();

    const { data, error } = await guest
      .from("profiles")
      .select("id")
      .eq("id", user.userId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
`;

    const result = await lintFixture(
      code,
      "src/entities/profile/dals/__tests__/profile.integration.test.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("회귀 — utils.test.ts는 위반 0건이다", async () => {
    const code = `import { describe, expect, it } from "vitest";
import { cn } from "@/shared/lib/utils";

describe("cn", () => {
  it("공백으로 클래스를 잇는다", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("거짓 값을 걸러낸다", () => {
    expect(cn("flex", false, undefined, "gap-2")).toBe("flex gap-2");
  });

  it("충돌하는 tailwind 클래스는 뒤가 이긴다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
`;

    const result = await lintFixture(
      code,
      "src/shared/lib/__tests__/utils.test.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("회귀 — home.spec.ts는 위반 0건이다", async () => {
    const code = `import { expect, test } from "@playwright/test";

test("기본 페이지가 뜨고 핵심 텍스트가 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("La Bie Belle")).toBeVisible();
  await expect(page.getByRole("button", { name: "시작하기" })).toBeVisible();
});
`;

    const result = await lintFixture(code, "tests/e2e/home.spec.ts");

    expect(result.errorCount).toBe(0);
  });
});
