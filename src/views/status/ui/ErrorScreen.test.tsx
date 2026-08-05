import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ERROR_CODES } from "@/shared/config/error-codes.config";

import { ErrorScreen } from "./ErrorScreen";

afterEach(cleanup);

describe("ErrorScreen", () => {
  it("COMMON_UNEXPECTED 기본 문구를 표시한다", () => {
    render(<ErrorScreen />);
    expect(screen.getByText(ERROR_CODES.COMMON_UNEXPECTED.message)).toBeInTheDocument();
  });

  it("홈으로 이동하는 안전 경로를 제공한다", () => {
    render(<ErrorScreen />);
    expect(screen.getByRole("link", { name: /홈/ })).toHaveAttribute("href", "/");
  });

  it("문의용 식별자가 있으면 표시한다", () => {
    render(<ErrorScreen correlationId="corr-123" />);
    expect(screen.getByText(/corr-123/)).toBeInTheDocument();
  });
});
