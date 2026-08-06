import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OnboardingPlaceholderView } from "@/views/onboarding/ui/OnboardingPlaceholderView";

afterEach(cleanup);

describe("OnboardingPlaceholderView", () => {
  it("자리표시 콘텐츠를 렌더한다", () => {
    render(<OnboardingPlaceholderView />);

    expect(screen.getByRole("heading")).toHaveTextContent("가입을 계속 진행해요");
    expect(screen.getAllByText(/가입/).length).toBeGreaterThan(0);
  });
});
