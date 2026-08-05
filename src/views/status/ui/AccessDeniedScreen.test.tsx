import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ERROR_CODES } from "@/shared/config/error-codes.config";

import { AccessDeniedScreen } from "./AccessDeniedScreen";

afterEach(cleanup);

describe("AccessDeniedScreen", () => {
  it("COMMON_FORBIDDEN 기본 문구를 표시한다", () => {
    render(<AccessDeniedScreen />);
    expect(screen.getByText(ERROR_CODES.COMMON_FORBIDDEN.message)).toBeInTheDocument();
  });

  it("홈으로 이동하는 안전 경로를 제공한다", () => {
    render(<AccessDeniedScreen />);
    expect(screen.getByRole("link", { name: /홈/ })).toHaveAttribute("href", "/");
  });

  it("문의용 식별자가 있으면 표시한다", () => {
    render(<AccessDeniedScreen correlationId="corr-456" />);
    expect(screen.getByText(/corr-456/)).toBeInTheDocument();
  });
});
