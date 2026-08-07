import { describe, expect, it } from "vitest";

import { validateManageDeadline } from "@/views/admin-recruitment/model/recruitment-manage-deadline";

const TODAY = "2099-09-15";
const WORK_DATE = "2099-09-20";

describe("validateManageDeadline", () => {
  it("빈 마감일은 필수 입력 안내를 반환한다", () => {
    expect(
      validateManageDeadline({ deadline: "", today: TODAY, workDate: WORK_DATE }),
    ).not.toBeNull();
  });

  it("오늘 이전 마감일은 거부한다", () => {
    expect(
      validateManageDeadline({ deadline: "2099-09-14", today: TODAY, workDate: WORK_DATE }),
    ).not.toBeNull();
  });

  it("근무일보다 늦은 마감일은 거부한다", () => {
    expect(
      validateManageDeadline({ deadline: "2099-09-21", today: TODAY, workDate: WORK_DATE }),
    ).not.toBeNull();
  });

  it("오늘 날짜는 경계로서 허용한다", () => {
    expect(
      validateManageDeadline({ deadline: TODAY, today: TODAY, workDate: WORK_DATE }),
    ).toBeNull();
  });

  it("근무일 당일은 경계로서 허용한다", () => {
    expect(
      validateManageDeadline({ deadline: WORK_DATE, today: TODAY, workDate: WORK_DATE }),
    ).toBeNull();
  });

  it("오늘과 근무일 사이의 값은 허용한다", () => {
    expect(
      validateManageDeadline({ deadline: "2099-09-17", today: TODAY, workDate: WORK_DATE }),
    ).toBeNull();
  });
});
