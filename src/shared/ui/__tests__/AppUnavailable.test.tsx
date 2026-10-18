import { render, screen } from "@testing-library/react-native";
import type * as ReactNative from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

jest.mock("@/shared/ui/Illustration", () => {
  const { View: StubView } =
    jest.requireActual<typeof ReactNative>("react-native");

  return {
    Illustration: ({ scene }: { scene: string }) => (
      <StubView testID={`illustration-${scene}`} />
    ),
  };
});

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderUnavailable() {
  const { AppUnavailable } = await import(
    // @ts-expect-error 대상 모듈이 아직 없다
    "@/shared/ui/AppUnavailable"
  );

  return render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <AppUnavailable />
    </SafeAreaProvider>,
  );
}

describe("AppUnavailable — 설정이 빠진 빌드가 보는 한 장", () => {
  it("제목을 보인다", async () => {
    await renderUnavailable();

    expect(screen.getByText("앱을 열 수 없어요")).toBeTruthy();
  });

  it("업데이트를 안내하는 아래 줄을 보인다", async () => {
    await renderUnavailable();

    expect(screen.getByText("새 버전으로 업데이트해 주세요")).toBeTruthy();
  });

  it("server-error 그림을 그린다", async () => {
    await renderUnavailable();

    expect(screen.getByTestId("illustration-server-error")).toBeTruthy();
  });

  it("다시 시도 버튼이 없다", async () => {
    await renderUnavailable();

    expect(screen.queryByText("다시 시도")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("로그인으로 가는 길이 없다", async () => {
    await renderUnavailable();

    expect(screen.queryByText(/로그인/)).toBeNull();
  });
});

describe("APP_UNAVAILABLE_COPY — 문안 상수", () => {
  it("제목과 아래 줄이 정본 문안이다", async () => {
    const { APP_UNAVAILABLE_COPY } = await import(
      // @ts-expect-error 대상 모듈이 아직 없다
      "@/shared/consts/appUnavailable.const"
    );

    expect(APP_UNAVAILABLE_COPY).toEqual({
      title: "앱을 열 수 없어요",
      body: "새 버전으로 업데이트해 주세요",
    });
  });
});
