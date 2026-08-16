import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AssignmentCandidateSheet } from "@/features/assignment/ui/AssignmentCandidateSheet";
import type {
  AssignmentCandidate,
  AssignmentCandidateBuckets,
} from "@/entities/assignment/types/candidate";

afterEach(cleanup);

function candidate(overrides: Partial<AssignmentCandidate> = {}): AssignmentCandidate {
  return {
    profileId: "profile-1",
    name: "후보1",
    applied: true,
    currentlyAssigned: false,
    otherPositionNames: [],
    eligible: true,
    ineligibleReason: null,
    currentlyTrainee: false,
    ...overrides,
  };
}

function buckets(overrides: Partial<AssignmentCandidateBuckets> = {}): AssignmentCandidateBuckets {
  return {
    applied: [],
    notApplied: [],
    ineligible: [],
    ...overrides,
  };
}

const baseProps = {
  target: {
    scheduleId: "schedule-1",
    positionId: "position-1",
    positionName: "매니저",
    requiredCount: 2,
  },
  assignedCount: 0,
  loading: false,
  failed: false,
  buckets: buckets(),
  selectedAssigned: new Set<string>(),
  selectedTrainee: new Set<string>(),
  onToggle: vi.fn(),
  canSelectAsTrainee: () => true,
  changeCount: 0,
  submitting: false,
  onSave: vi.fn(),
  undo: null,
  onClose: vi.fn(),
};

describe("AssignmentCandidateSheet", () => {
  it("target이 있으면 포지션명·필요/배정 인원을 시트 제목과 설명으로 렌더한다", () => {
    render(<AssignmentCandidateSheet {...baseProps} assignedCount={1} />);

    expect(screen.getByRole("dialog", { name: "매니저" })).toBeInTheDocument();
    expect(screen.getByText("필요 2 / 배정 1")).toBeInTheDocument();
  });

  it("로딩 중에는 로딩 안내만 보이고 후보 목록은 렌더하지 않는다", () => {
    render(<AssignmentCandidateSheet {...baseProps} loading />);

    expect(screen.getByText("후보를 불러오는 중이에요")).toBeInTheDocument();
    expect(screen.queryByText("신청함")).not.toBeInTheDocument();
  });

  it("실패 시 재시도 안내 문구를 렌더한다", () => {
    render(<AssignmentCandidateSheet {...baseProps} failed />);

    expect(
      screen.getByText("후보를 불러오지 못했어요. 시트를 다시 열어 시도해 주세요"),
    ).toBeInTheDocument();
  });

  it("신청함·신청 안 함 목록이 비어 있으면 각각의 빈 안내를 렌더한다", () => {
    render(<AssignmentCandidateSheet {...baseProps} />);

    expect(screen.getByText("신청한 근무자가 없어요")).toBeInTheDocument();
    expect(screen.getByText("신청하지 않은 근무자가 없어요")).toBeInTheDocument();
  });

  it("신청함 목록의 후보를 렌더하고 선택 칩을 누르면 onToggle을 assigned로 호출한다", () => {
    const onToggle = vi.fn();
    render(
      <AssignmentCandidateSheet
        {...baseProps}
        buckets={buckets({ applied: [candidate({ profileId: "p1", name: "홍길동" })] })}
        onToggle={onToggle}
      />,
    );

    const row = screen.getByText("홍길동").closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "선택" }));

    expect(onToggle).toHaveBeenCalledWith("p1", "assigned");
  });

  it("다른 포지션에 배정된 후보는 그 포지션 배지를 보여주고, 교육 칩은 canSelectAsTrainee가 false면 숨긴다", () => {
    render(
      <AssignmentCandidateSheet
        {...baseProps}
        buckets={buckets({
          applied: [candidate({ profileId: "p1", name: "겸직자", otherPositionNames: ["스캔"] })],
        })}
        canSelectAsTrainee={() => false}
      />,
    );

    const row = screen.getByText("겸직자").closest("li")!;
    expect(within(row).getByText("스캔")).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /^교육/ })).not.toBeInTheDocument();
  });

  it("자격 없는 후보는 사유 문구를 렌더한다", () => {
    render(
      <AssignmentCandidateSheet
        {...baseProps}
        buckets={buckets({
          applied: [
            candidate({
              profileId: "p1",
              name: "성별불일치",
              eligible: false,
              ineligibleReason: "GENDER_MISMATCH",
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText("포지션 성별 조건과 맞지 않아요")).toBeInTheDocument();
  });

  it("조건에 맞지 않는 후보 목록은 접힌 상태로 표시되고 펼치면 사유가 보인다", () => {
    render(
      <AssignmentCandidateSheet
        {...baseProps}
        buckets={buckets({
          ineligible: [
            candidate({
              profileId: "p1",
              name: "미등록자",
              eligible: false,
              ineligibleReason: "NOT_ELIGIBLE",
            }),
          ],
        })}
      />,
    );

    const summary = screen.getByText("조건에 맞지 않는 1명 보기");
    expect(summary).toBeInTheDocument();
    expect(screen.getByText("이 포지션의 가능 포지션으로 등록되지 않았어요")).not.toBeVisible();

    fireEvent.click(summary);

    expect(screen.getByText("이 포지션의 가능 포지션으로 등록되지 않았어요")).toBeVisible();
  });

  it("변경 개수와 저장 버튼을 렌더하고, 저장 버튼을 누르면 onSave를 호출한다", () => {
    const onSave = vi.fn();
    render(<AssignmentCandidateSheet {...baseProps} changeCount={2} onSave={onSave} />);

    expect(screen.getByText("2개 변경")).toBeInTheDocument();
    const saveButton = screen.getByRole("button", { name: "저장" });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledOnce();
  });

  it("변경 개수가 0이면 저장 버튼이 비활성화된다", () => {
    render(<AssignmentCandidateSheet {...baseProps} changeCount={0} />);

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("undo가 있으면 되돌리기 버튼을 렌더하고 누르면 execute를 호출한다", () => {
    const execute = vi.fn();
    render(<AssignmentCandidateSheet {...baseProps} undo={{ count: 3, execute }} />);

    const undoButton = screen.getByRole("button", { name: "방금 변경한 3명 되돌리기" });
    fireEvent.click(undoButton);

    expect(execute).toHaveBeenCalledOnce();
  });
});
