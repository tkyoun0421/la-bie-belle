import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PrivacyPolicyView } from "@/views/privacy/ui/PrivacyPolicyView";

afterEach(cleanup);

describe("PrivacyPolicyView", () => {
  it("제목과 수집 항목·이용 목적·보관 기간 안내를 렌더한다", () => {
    render(<PrivacyPolicyView />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("개인정보 처리방침");
    expect(screen.getAllByText(/이름/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/휴대폰/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/성별/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/생년월일/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/근무 배정/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/보관/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Google 계정 이메일/).length).toBeGreaterThan(0);
  });

  it("PRD가 확정한 보관 기간 수치를 구체적으로 명시한다", () => {
    render(<PrivacyPolicyView />);

    expect(screen.getAllByText(/3개월/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1년/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3년/).length).toBeGreaterThan(0);
  });
});
