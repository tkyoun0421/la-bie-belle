import { describe, expect, it } from "vitest";

import { CardTitle } from "@/shared/ui/card";

function classNameOf(element: ReturnType<typeof CardTitle>): string {
  return (element as { props: { className?: string } }).props.className ?? "";
}

describe("CardTitle — 제목은 본문과 같은 서체를 쓰고 크기와 굵기로만 구분한다", () => {
  it("font-heading을 담지 않는다", () => {
    const className = classNameOf(CardTitle({}));

    expect(className).not.toContain("font-heading");
  });

  it("text-base로 크기를 구분한다", () => {
    const className = classNameOf(CardTitle({}));

    expect(className).toContain("text-base");
  });

  it("font-medium으로 굵기를 구분한다", () => {
    const className = classNameOf(CardTitle({}));

    expect(className).toContain("font-medium");
  });
});
