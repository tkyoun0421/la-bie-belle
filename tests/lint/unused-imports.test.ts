import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lintFixture(code: string, filePath: string, fix = false) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs", fix });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), filePath),
  });
  return result;
}

describe("규칙14 — 미사용 import와 import type", () => {
  it("안 쓰는 named import가 걸리고, --fix 후 그 줄이 사라진다", async () => {
    const code = `import { unused } from "react";\n\nexport const value = 1;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );
    expect(result.errorCount).toBeGreaterThan(0);

    const fixedResult = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
      true,
    );
    const fixedCode = fixedResult.output ?? code;

    expect(fixedCode).not.toContain("unused");
  });

  it("일부만 안 쓰는 named import는 --fix 후 쓰는 것만 남는다", async () => {
    const code = `import { used, unused } from "react";\n\nexport const value = used;\n`;

    const fixedResult = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
      true,
    );
    const fixedCode = fixedResult.output ?? code;
    const importLine = fixedCode.match(/import \{([^}]+)\} from "react";/);

    expect(importLine).not.toBeNull();
    const specifiers = (importLine?.[1] ?? "")
      .split(",")
      .map((specifier) => specifier.trim())
      .filter(Boolean);

    expect(specifiers).toEqual(["used"]);
  });

  it("값 자리에서 안 쓰이고 타입 자리에서만 쓰는 import는 --fix 후 import type으로 바뀐다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport function show(profile: Profile) {\n  return profile;\n}\n`;

    const result = await lintFixture(
      code,
      "src/features/attendance/model/fixture.ts",
    );
    expect(result.errorCount).toBeGreaterThan(0);

    const fixedResult = await lintFixture(
      code,
      "src/features/attendance/model/fixture.ts",
      true,
    );
    const fixedCode = fixedResult.output ?? code;

    expect(fixedCode).toMatch(
      /import\s+type\s+\{\s*Profile\s*\}|import\s+\{\s*type\s+Profile\s*\}/,
    );
  });

  it("이미 올바른 import { x, type Y }는 위반 0건이다", async () => {
    const code = `import { useState, type ReactNode } from "react";\n\nexport function useThing(): ReactNode {\n  const [value] = useState<ReactNode>(null);\n  return value;\n}\n`;

    const result = await lintFixture(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("회귀 — utils.ts는 이미 inline type을 쓰고 있어 위반 0건이다", async () => {
    const code = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

    const result = await lintFixture(code, "src/shared/lib/utils.ts");

    expect(result.errorCount).toBe(0);
  });

  it("회귀 — button.tsx는 이미 inline type을 쓰고 있어 위반 0건이다", async () => {
    const code = `import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva("inline-flex items-center", {
  variants: {
    variant: { default: "bg-primary" },
    size: { default: "h-8" },
  },
  defaultVariants: { variant: "default", size: "default" },
})

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
`;

    const result = await lintFixture(code, "src/shared/ui/button.tsx");

    expect(result.errorCount).toBe(0);
  });
});
