import { describe, expect, it } from "vitest";

import { buttonVariants } from "@/shared/ui/button";

const SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

describe("buttonVariants — 모양은 크기와 무관하게 rounded-full 이다", () => {
  it.each(SIZES)(
    "%s 크기는 rounded-full 을 담고 rounded-lg 와 rounded-[ 는 안 담는다",
    (size) => {
      const className = buttonVariants({ size });

      expect(className).toContain("rounded-full");
      expect(className).not.toContain("rounded-lg");
      expect(className).not.toContain("rounded-[");
    },
  );
});
