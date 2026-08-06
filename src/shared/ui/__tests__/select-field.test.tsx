import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SelectField } from "@/shared/ui/select-field";

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

afterEach(cleanup);

const OPTIONS = [
  { value: "main", label: "본점" },
  { value: "branch", label: "지점" },
];

describe("SelectField", () => {
  it("현재 값을 표시하고 접힌 상태다", () => {
    render(<SelectField label="근무지" value="main" options={OPTIONS} onChange={() => {}} />);

    const trigger = screen.getByRole("button", { name: "근무지 본점" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("값이 없으면 placeholder를 보여준다", () => {
    render(
      <SelectField
        label="근무지"
        value={null}
        options={OPTIONS}
        onChange={() => {}}
        placeholder="선택하세요"
      />,
    );

    expect(screen.getByRole("button", { name: "근무지 선택하세요" })).toBeInTheDocument();
  });

  it("오류가 있으면 필드 아래 렌더되고 aria-invalid·aria-describedby로 연결된다", () => {
    render(
      <SelectField
        label="근무지"
        value={null}
        options={OPTIONS}
        onChange={() => {}}
        error="근무지를 선택하세요"
      />,
    );

    const trigger = screen.getByRole("button", { name: /근무지/ });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    const describedById = trigger.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById ?? "")).toHaveTextContent("근무지를 선택하세요");
  });

  it("클릭하면 바텀시트가 열리고 옵션을 고르면 onChange 후 닫힌다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField label="근무지" value="main" options={OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "근무지 본점" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "지점" }));

    expect(onChange).toHaveBeenCalledWith("branch");
  });
});
