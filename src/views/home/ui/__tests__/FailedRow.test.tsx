import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FailedRow } from "@/views/home/ui/FailedRow";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

describe("FailedRow — 다시 시도 눌림 스쿼시 (인수 조건 39, 라운드 38 #18, home.html:1274-1290)", () => {
  it(".97 배율의 눌림 피드백을 토큰 시간·이징으로 걸고 인라인 ms를 박지 않는다", () => {
    render(<FailedRow message="다가오는 근무를 불러오지 못했어요" />);

    const retry = screen.getByRole("button", { name: "다시 시도" });
    expect(retry.className).toContain("active:scale-[0.97]");
    expect(retry.className).toContain("duration-[var(--duration-feedback)]");
    expect(retry.className).toContain("ease-[var(--ease-out)]");
    expect(retry.getAttribute("style") ?? "").not.toMatch(/\d+m?s/);
  });
});
