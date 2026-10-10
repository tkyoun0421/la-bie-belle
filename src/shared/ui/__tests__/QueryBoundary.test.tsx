import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text as RNText } from "react-native";
import { QueryBoundary } from "@/shared/ui/QueryBoundary";

function wrap(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  );
}

function Throws(): never {
  throw new Error("터졌다");
}

describe("QueryBoundary — 기다리는 일과 실패를 경계가 든다", () => {
  it("다 받은 아이는 그대로 그린다", () => {
    const { getByText } = wrap(
      <QueryBoundary
        pending={<RNText>세는 중</RNText>}
        failed={() => <RNText>못 셌어요</RNText>}
      >
        <RNText>셋</RNText>
      </QueryBoundary>,
    );

    expect(getByText("셋")).toBeTruthy();
  });

  it("아이가 던지면 실패 자리를 그린다", () => {
    const { getByText, queryByText } = wrap(
      <QueryBoundary
        pending={<RNText>세는 중</RNText>}
        failed={() => <RNText>못 셌어요</RNText>}
      >
        <Throws />
      </QueryBoundary>,
    );

    expect(getByText("못 셌어요")).toBeTruthy();
    expect(queryByText("세는 중")).toBeNull();
  });

  it("실패 자리에 되돌리는 손을 넘긴다", () => {
    const { getByText } = wrap(
      <QueryBoundary
        pending={<RNText>세는 중</RNText>}
        failed={(retry) => (
          <RNText onPress={retry}>
            {typeof retry === "function" ? "다시 세기" : "손이 없다"}
          </RNText>
        )}
      >
        <Throws />
      </QueryBoundary>,
    );

    expect(getByText("다시 세기")).toBeTruthy();
  });

  it("되돌리면 아이를 다시 그린다", async () => {
    let explodes = true;

    function Sometimes() {
      if (explodes) {
        throw new Error("터졌다");
      }

      return <RNText>셋</RNText>;
    }

    const { getByText } = wrap(
      <QueryBoundary
        pending={<RNText>세는 중</RNText>}
        failed={(retry) => <RNText onPress={retry}>다시 세기</RNText>}
      >
        <Sometimes />
      </QueryBoundary>,
    );

    explodes = false;
    fireEvent.press(getByText("다시 세기"));

    await waitFor(() => expect(getByText("셋")).toBeTruthy());
  });
});
