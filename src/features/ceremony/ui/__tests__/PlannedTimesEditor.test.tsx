import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlannedTimesEditor } from "@/features/ceremony/ui/PlannedTimesEditor";

afterEach(cleanup);

describe("PlannedTimesEditor", () => {
  it("현재 예정 출퇴근 값을 입력값으로 렌더한다", () => {
    render(
      <PlannedTimesEditor
        plannedCheckin="09:00"
        plannedCheckout="18:00"
        recommendationPreview={null}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    expect(screen.getByLabelText("예정 출근")).toHaveValue("09:00");
    expect(screen.getByLabelText("예정 퇴근")).toHaveValue("18:00");
  });

  it("plannedCheckin·plannedCheckout이 없으면 빈 입력으로 렌더하고 저장 버튼이 비활성화된다", () => {
    render(
      <PlannedTimesEditor
        plannedCheckin={null}
        plannedCheckout={null}
        recommendationPreview={null}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    expect(screen.getByLabelText("예정 출근")).toHaveValue("");
    expect(screen.getByRole("button", { name: "예정 시각 저장" })).toBeDisabled();
  });

  it("추천값이 있으면 출퇴근 각각의 도움말에 추천 문구를 보여준다", () => {
    render(
      <PlannedTimesEditor
        plannedCheckin="09:00"
        plannedCheckout="18:00"
        recommendationPreview={{ checkin: "08:20", checkout: { time: "19:10", capped: false } }}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    expect(screen.getByText("추천 08:20")).toBeInTheDocument();
    expect(screen.getByText("추천 19:10")).toBeInTheDocument();
  });

  it("추천 출근이 null이면 규칙표가 비어있다는 안내를 보여준다", () => {
    render(
      <PlannedTimesEditor
        plannedCheckin="09:00"
        plannedCheckout="18:00"
        recommendationPreview={{ checkin: null, checkout: { time: "19:10", capped: false } }}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    expect(screen.getByText("추천 — 규칙표가 비어 있어 직접 입력이 필요해요")).toBeInTheDocument();
  });

  it("자정 캡이 적용되면 퇴근 추천 문구에 표시가 붙는다", () => {
    render(
      <PlannedTimesEditor
        plannedCheckin="09:00"
        plannedCheckout="18:00"
        recommendationPreview={{ checkin: "08:20", checkout: { time: "23:59", capped: true } }}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    expect(screen.getByText("추천 23:59 (자정 캡)")).toBeInTheDocument();
  });

  it("출퇴근 시각을 바꾸고 저장을 누르면 onSave를 바뀐 값으로 호출한다", () => {
    const onSave = vi.fn();
    render(
      <PlannedTimesEditor
        plannedCheckin="09:00"
        plannedCheckout="18:00"
        recommendationPreview={null}
        onSave={onSave}
        saving={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("예정 출근"), { target: { value: "08:30" } });
    fireEvent.change(screen.getByLabelText("예정 퇴근"), { target: { value: "19:00" } });
    fireEvent.click(screen.getByRole("button", { name: "예정 시각 저장" }));

    expect(onSave).toHaveBeenCalledWith("08:30", "19:00");
  });

  it("saving이면 저장 버튼이 비활성화된다", () => {
    render(
      <PlannedTimesEditor
        plannedCheckin="09:00"
        plannedCheckout="18:00"
        recommendationPreview={null}
        onSave={vi.fn()}
        saving
      />,
    );

    expect(screen.getByRole("button", { name: "예정 시각 저장" })).toBeDisabled();
  });
});
