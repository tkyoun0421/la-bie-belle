import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkerDetailView } from "@/views/admin/ui/WorkerDetailView";

afterEach(cleanup);

const WORKER = {
  id: "worker-1",
  name: "김근무",
  gender: "male" as const,
  birthDate: "1990-01-01",
  phone: "01012345678",
  status: "active" as const,
  hourlyWage: null,
  defaultHourlyWage: 12000,
  positions: [
    { id: "pos-default", name: "안내", isDefault: true, granted: true },
    { id: "pos-scan", name: "스캔", isDefault: false, granted: false },
  ],
};

describe("WorkerDetailView", () => {
  it("근무자 이름과 개인정보 폼을 렌더한다", () => {
    render(
      <WorkerDetailView
        worker={WORKER}
        onUpdateInfo={vi.fn()}
        onSetWage={vi.fn()}
        onGrant={vi.fn()}
        onRevoke={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "김근무" })).toBeInTheDocument();
    expect(screen.getByLabelText("이름")).toHaveValue("김근무");
  });

  it("시급이 미설정이면 기본 시급 적용 중 안내를 보여준다", () => {
    render(
      <WorkerDetailView
        worker={WORKER}
        onUpdateInfo={vi.fn()}
        onSetWage={vi.fn()}
        onGrant={vi.fn()}
        onRevoke={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );

    expect(screen.getByText("기본 시급 적용 중")).toBeInTheDocument();
  });

  it("시급이 미설정이면 파생된 기본 시급 금액을 입력 필드에 보여준다(F-06)", () => {
    render(
      <WorkerDetailView
        worker={WORKER}
        onUpdateInfo={vi.fn()}
        onSetWage={vi.fn()}
        onGrant={vi.fn()}
        onRevoke={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("시급")).toHaveValue(12000);
  });

  it("기본 포지션은 뱃지를, 비기본 포지션은 토글을 보여준다", () => {
    render(
      <WorkerDetailView
        worker={WORKER}
        onUpdateInfo={vi.fn()}
        onSetWage={vi.fn()}
        onGrant={vi.fn()}
        onRevoke={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );

    expect(screen.getByText("기본 적용")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "부여" })).toBeInTheDocument();
  });

  it("active 상태 뱃지와 수동 휴면 액션을 보여준다", () => {
    render(
      <WorkerDetailView
        worker={WORKER}
        onUpdateInfo={vi.fn()}
        onSetWage={vi.fn()}
        onGrant={vi.fn()}
        onRevoke={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );

    expect(screen.getByText("활동 중")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수동 휴면" })).toBeInTheDocument();
  });

  it("dormant 상태 뱃지와 재활성화 액션을 보여준다", () => {
    render(
      <WorkerDetailView
        worker={{ ...WORKER, status: "dormant" }}
        onUpdateInfo={vi.fn()}
        onSetWage={vi.fn()}
        onGrant={vi.fn()}
        onRevoke={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );

    expect(screen.getByText("휴면")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "재활성화" })).toBeInTheDocument();
  });
});
