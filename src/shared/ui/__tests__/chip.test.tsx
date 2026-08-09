import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Chip } from "@/shared/ui/chip";

afterEach(cleanup);

describe("Chip", () => {
  it("button role로 렌더되고 selected 상태를 aria-pressed로 전달한다", () => {
    render(
      <Chip selected onSelectedChange={() => {}}>
        일요일
      </Chip>,
    );

    expect(screen.getByRole("button", { name: "일요일" })).toHaveAttribute("aria-pressed", "true");
  });

  it("선택되지 않은 상태는 aria-pressed=false다", () => {
    render(
      <Chip selected={false} onSelectedChange={() => {}}>
        월요일
      </Chip>,
    );

    expect(screen.getByRole("button", { name: "월요일" })).toHaveAttribute("aria-pressed", "false");
  });

  it("클릭하면 onSelectedChange를 반대 값으로 호출한다", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <Chip selected={false} onSelectedChange={onSelectedChange}>
        화요일
      </Chip>,
    );

    await user.click(screen.getByRole("button", { name: "화요일" }));

    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it("disabled면 클릭해도 콜백이 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <Chip selected={false} onSelectedChange={onSelectedChange} disabled>
        수요일
      </Chip>,
    );

    await user.click(screen.getByRole("button", { name: "수요일" }));

    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("눌림 피드백과 easing을 토큰으로 표현한다", () => {
    render(
      <Chip selected={false} onSelectedChange={() => {}}>
        토요일
      </Chip>,
    );

    const className = screen.getByRole("button", { name: "토요일" }).className;
    expect(className).toContain("duration-[var(--duration-feedback)]");
    expect(className).toContain("ease-[var(--ease-out)]");
    expect(className).toContain("active:scale-[0.97]");
  });
});
