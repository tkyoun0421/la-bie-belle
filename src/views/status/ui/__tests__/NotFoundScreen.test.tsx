import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ERROR_CODES } from "@/shared/config/error-codes.config";

import { NotFoundScreen } from "@/views/status/ui/NotFoundScreen";

afterEach(cleanup);

describe("NotFoundScreen", () => {
  it("COMMON_NOT_FOUND 기본 문구를 표시한다", () => {
    render(<NotFoundScreen />);
    expect(screen.getByText(ERROR_CODES.COMMON_NOT_FOUND.message)).toBeInTheDocument();
  });

  it("홈으로 이동하는 안전 경로를 제공한다", () => {
    render(<NotFoundScreen />);
    expect(screen.getByRole("link", { name: /홈/ })).toHaveAttribute("href", "/");
  });
});
