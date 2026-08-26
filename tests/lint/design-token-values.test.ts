import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lintClassName(className: string) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
  const code = `export function Fixture() {\n  return <div className="${className}" />;\n}\n`;
  const [result] = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), "src/shared/ui/fixture.tsx"),
  });
  return result;
}

describe("규칙4 — 하드코딩한 색과 크기", () => {
  describe("대괄호 안이 토큰을 거치면 통과한다", () => {
    it.each([
      ["[&_svg]:pointer-events-none", "선택자 변형"],
      ["in-data-[slot=button-group]:rounded-lg", "속성 선택자 변형"],
      ["*:[img:first-child]:rounded-t-xl", "자식 선택자 변형"],
      ["[--card-spacing:--spacing(3)]", "커스텀 프로퍼티에 스페이싱 함수"],
      [
        "bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        "var()를 감싼 color-mix",
      ],
      ["rounded-[min(var(--radius-md),12px)]", "var()를 감싼 min()"],
      ["grid-cols-[1fr_auto]", "그리드 트랙 크기"],
      ["grid-rows-[auto_auto]", "그리드 트랙 크기"],
    ])("%s (%s)는 위반 0건이다", async (className) => {
      const result = await lintClassName(`flex ${className} items-center`);

      expect(result.errorCount).toBe(0);
    });
  });

  describe("대괄호 안이 리터럴이면 걸린다", () => {
    it.each([
      ["text-[0.8rem]", "rem 리터럴 크기"],
      ["text-[13px]", "px 리터럴 크기"],
      ["p-[7px]", "px 리터럴 스페이싱"],
      ["bg-[#6E4F39]", "hex 리터럴 색"],
      ["bg-[rgb(110,79,57)]", "rgb 리터럴 색"],
      ["bg-[hsl(24,32%,33%)]", "hsl 리터럴 색"],
    ])("%s (%s)는 위반 1건 이상이다", async (className) => {
      const result = await lintClassName(`flex ${className} items-center`);

      expect(result.errorCount).toBeGreaterThan(0);
    });
  });

  it("회귀 — text-[0.8rem]이 토큰 유틸로 바뀐 button.tsx는 위반 0건이다", async () => {
    const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
    const code = `import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

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
    const [result] = await eslint.lintText(code, {
      filePath: path.join(process.cwd(), "src/shared/ui/button.tsx"),
    });

    expect(result.errorCount).toBe(0);
  });
});
