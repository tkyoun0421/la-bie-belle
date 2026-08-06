import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MoreView } from "@/views/more/ui/MoreView";

afterEach(cleanup);

describe("MoreView", () => {
  it("예상 급여 진입 항목 하나를 갖는 최소판이다", () => {
    render(<MoreView />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/pay");
    expect(links[0]).toHaveTextContent("예상 급여");
  });
});
