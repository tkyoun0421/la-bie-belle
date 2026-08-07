import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MyProfileView } from "@/views/my-profile/ui/MyProfileView";

afterEach(cleanup);

const INFO = {
  name: "김근무",
  gender: "male" as const,
  birthDate: "1990-01-01",
  phone: "01012345678",
  hourlyWage: null,
  defaultHourlyWage: 12000,
};

describe("MyProfileView", () => {
  it("이름·성별·생년월일을 표시만 한다(수정 필드 아님)", () => {
    render(<MyProfileView info={INFO} onUpdatePhone={vi.fn()} onSetWage={vi.fn()} />);

    expect(screen.getByText("김근무")).toBeInTheDocument();
    expect(screen.getByText("남성")).toBeInTheDocument();
    expect(screen.getByText("1990-01-01")).toBeInTheDocument();
    expect(screen.queryByLabelText("이름")).not.toBeInTheDocument();
  });

  it("휴대폰 편집 폼을 렌더한다", () => {
    render(<MyProfileView info={INFO} onUpdatePhone={vi.fn()} onSetWage={vi.fn()} />);

    expect(screen.getByLabelText("휴대폰 번호")).toHaveValue("01012345678");
  });

  it("시급 미설정이면 기본 시급 적용 중 안내를 보여준다", () => {
    render(<MyProfileView info={INFO} onUpdatePhone={vi.fn()} onSetWage={vi.fn()} />);

    expect(screen.getByText("기본 시급 적용 중")).toBeInTheDocument();
  });
});
