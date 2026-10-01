// 구현 대상: src/screens/approvals/model/approvalsList.ts
//
// 승인할 일 목록의 정렬과 처리한 줄 제거다(approvals.md 「목록 짜임」). 이 task가 내는
// 줄은 근무 취소뿐이다 — 사유 줄은 attendance가 뒤에 잇는다(plan schedule-requests.md
// 「배정하지 않은 것」). 근무 취소 안에서는 근무 날이 가까운 것부터 선다.

import {
  removeApproval,
  sortApprovals,
  type ApprovalListRow,
} from "@/screens/approvals/utils/approvalsList.utils";

const ROWS: ApprovalListRow[] = [
  { id: "cancel-3", kind: "cancel", workDate: "2026-10-20" },
  { id: "cancel-1", kind: "cancel", workDate: "2026-10-12" },
  { id: "cancel-2", kind: "cancel", workDate: "2026-10-15" },
];

describe("sortApprovals — 근무 취소는 근무 날이 가까운 순이다", () => {
  it("workDate 오름차순으로 정렬한다", () => {
    const sorted = sortApprovals(ROWS);

    expect(sorted.map((row) => row.id)).toEqual([
      "cancel-1",
      "cancel-2",
      "cancel-3",
    ]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    sortApprovals(ROWS);

    expect(ROWS.map((row) => row.id)).toEqual([
      "cancel-3",
      "cancel-1",
      "cancel-2",
    ]);
  });
});

describe("removeApproval — 처리한 줄을 id로 지운다", () => {
  it("그 id를 가진 줄만 빠진다", () => {
    const result = removeApproval(ROWS, "cancel-1");

    expect(result.map((row) => row.id)).toEqual(["cancel-3", "cancel-2"]);
  });

  it("없는 id를 지우려 하면 목록이 그대로다", () => {
    const result = removeApproval(ROWS, "not-in-list");

    expect(result).toHaveLength(3);
  });
});
