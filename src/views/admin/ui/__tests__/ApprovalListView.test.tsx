import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApprovalListView } from "@/views/admin/ui/ApprovalListView";

afterEach(cleanup);

describe("ApprovalListView", () => {
  it("pending 목록이 비어 있으면 안내 문구를 렌더한다", () => {
    render(<ApprovalListView profiles={[]} onApprove={vi.fn()} onReject={vi.fn()} />);

    expect(screen.getByText("대기 중인 가입 신청이 없어요")).toBeInTheDocument();
  });

  it("pending 프로필의 4필드와 신청 시각을 표시한다", () => {
    render(
      <ApprovalListView
        profiles={[
          {
            id: "profile-1",
            name: "홍길동",
            gender: "male",
            birthDate: "1990-01-01",
            phone: "01012345678",
            createdAt: "2026-08-07T00:00:00+09:00",
          },
        ]}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText(/남성/)).toBeInTheDocument();
    expect(screen.getByText(/1990-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/01012345678/)).toBeInTheDocument();
    expect(screen.getByText(/2026.08.07/)).toBeInTheDocument();
  });

  it("행마다 승인·거절 버튼을 렌더한다", () => {
    render(
      <ApprovalListView
        profiles={[
          {
            id: "profile-1",
            name: "홍길동",
            gender: "male",
            birthDate: "1990-01-01",
            phone: "01012345678",
            createdAt: "2026-08-07T00:00:00+09:00",
          },
        ]}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "승인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "거절" })).toBeInTheDocument();
  });
});
