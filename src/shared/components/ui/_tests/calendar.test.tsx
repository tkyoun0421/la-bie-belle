import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "#/shared/components/ui/calendar";

describe("Calendar", () => {
  it("renders multiple selected dates in multi-select mode", () => {
    const { container } = render(
      <Calendar
        defaultMonth={new Date("2026-04-01T00:00:00")}
        mode="multiple"
        selected={[
          new Date("2026-04-10T00:00:00"),
          new Date("2026-04-12T00:00:00"),
        ]}
      />
    );

    expect(container.querySelectorAll(".rdp-selected")).toHaveLength(2);
  });
});
