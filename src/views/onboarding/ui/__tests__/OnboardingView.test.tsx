import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingView } from "@/views/onboarding/ui/OnboardingView";

afterEach(cleanup);

describe("OnboardingView", () => {
  it("안내 제목과 가입 폼을 렌더한다", () => {
    const action = vi.fn().mockResolvedValue({ ok: true });

    render(<OnboardingView action={action} />);

    expect(screen.getByRole("heading")).toBeInTheDocument();
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가입 신청하기" })).toBeInTheDocument();
  });
});
