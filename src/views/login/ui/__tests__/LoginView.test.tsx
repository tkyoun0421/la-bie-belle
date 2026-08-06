import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginView } from "@/views/login/ui/LoginView";

afterEach(cleanup);

describe("LoginView", () => {
  it("제품명과 용도 한 문장, Google로 계속하기 버튼을 렌더한다", () => {
    render(<LoginView hasAuthError={false} onSignIn={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "라비에벨" })).toBeInTheDocument();
    expect(
      screen.getByText("근무 신청부터 출퇴근, 예상 급여까지 한곳에서 관리해요"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google로 계속하기" })).toBeInTheDocument();
  });

  it("hasAuthError가 false면 오류 안내를 보여주지 않는다", () => {
    render(<LoginView hasAuthError={false} onSignIn={vi.fn()} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hasAuthError가 true면 재시도 안내를 보여준다", () => {
    render(<LoginView hasAuthError={true} onSignIn={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("로그인에 실패했어요. 다시 시도해 주세요");
  });

  it("하단에 개인정보 처리방침 링크를 보여준다", () => {
    render(<LoginView hasAuthError={false} onSignIn={vi.fn()} />);

    expect(screen.getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });
});
