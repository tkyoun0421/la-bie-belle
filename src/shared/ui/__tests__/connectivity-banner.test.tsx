import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ConnectivityBanner } from "@/shared/ui/connectivity-banner";

afterEach(cleanup);

describe("ConnectivityBanner", () => {
  it("offline 상태에서 연결 끊김 문구를 status region으로 알린다", () => {
    render(<ConnectivityBanner status="offline" />);

    expect(screen.getByRole("status")).toHaveTextContent("인터넷 연결이 끊겼어요");
  });

  it("recovered 상태에서 복구 문구를 보여준다", () => {
    render(<ConnectivityBanner status="recovered" />);

    expect(screen.getByRole("status")).toHaveTextContent("최신 내용을 불러왔어요");
  });

  it("online 상태에서는 아무것도 렌더하지 않는다", () => {
    const { container } = render(<ConnectivityBanner status="online" />);

    expect(container).toBeEmptyDOMElement();
  });
});
