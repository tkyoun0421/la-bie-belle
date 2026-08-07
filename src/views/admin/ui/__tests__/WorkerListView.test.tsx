import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkerListView } from "@/views/admin/ui/WorkerListView";

afterEach(cleanup);

const WORKERS = [
  { id: "worker-1", name: "김근무", status: "active" as const },
  { id: "worker-2", name: "이근무", status: "active" as const },
];

describe("WorkerListView", () => {
  it("근무자 이름과 상세 링크를 렌더한다", () => {
    render(<WorkerListView workers={WORKERS} search="" status="active" />);

    expect(screen.getByText("김근무")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /김근무/ })).toHaveAttribute(
      "href",
      "/admin/workers/worker-1",
    );
  });

  it("검색·상태 필터가 없으면 빈 목록 안내를 보여준다", () => {
    render(<WorkerListView workers={[]} search="" status="active" />);

    expect(screen.getByText("조건에 맞는 근무자가 없어요")).toBeInTheDocument();
  });

  it("상태 필터 칩 각각의 링크가 status 쿼리를 담는다", () => {
    render(<WorkerListView workers={WORKERS} search="" status="active" />);

    expect(screen.getByRole("link", { name: "휴면" })).toHaveAttribute(
      "href",
      "/admin/workers?status=dormant",
    );
  });

  it("검색어가 있으면 필터 링크에도 검색어를 유지한다", () => {
    render(<WorkerListView workers={WORKERS} search="김" status="active" />);

    expect(screen.getByRole("link", { name: "휴면" })).toHaveAttribute(
      "href",
      "/admin/workers?status=dormant&q=%EA%B9%80",
    );
  });
});
