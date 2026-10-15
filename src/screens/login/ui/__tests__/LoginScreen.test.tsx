import { render, within } from "@testing-library/react-native";
import type * as React from "react";
import type * as ReactNative from "react-native";
import { LoginScreen } from "@/screens/login/ui/LoginScreen";

const mockController = {
  signIn: jest.fn(),
  busy: false,
  failed: false,
};

jest.mock("@/screens/login/hooks/useLoginScreen", () => ({
  useLoginScreen: () => mockController,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@/shared/ui/Rise", () => {
  const { View } = jest.requireActual<typeof ReactNative>("react-native");
  const { createElement } = jest.requireActual<typeof React>("react");

  return {
    Rise: ({ index, children }: { index: number; children: React.ReactNode }) =>
      createElement(View, { testID: `rise-${index}` }, children),
  };
});

function renderScreen(state: { busy?: boolean; failed?: boolean } = {}) {
  mockController.busy = state.busy ?? false;
  mockController.failed = state.failed ?? false;

  return render(<LoginScreen />);
}

describe("LoginScreen — 다섯 요소가 마크·이름·설명·버튼·안내 순으로 등장한다", () => {
  it("0번은 브랜드 마크다", () => {
    const { getByTestId } = renderScreen();

    expect(within(getByTestId("rise-0")).getByText("라")).toBeTruthy();
  });

  it("1번은 서비스 이름이다", () => {
    const { getByTestId } = renderScreen();

    expect(within(getByTestId("rise-1")).getByText("라비에벨")).toBeTruthy();
  });

  it("2번은 설명 문구다", () => {
    const { getByTestId } = renderScreen();

    expect(
      within(getByTestId("rise-2")).getByText("근무표와 급여를 한곳에서 봐요"),
    ).toBeTruthy();
  });

  it("3번은 구글 로그인 버튼이다", () => {
    const { getByTestId } = renderScreen();

    expect(
      within(getByTestId("rise-3")).getByLabelText("Sign in with Google"),
    ).toBeTruthy();
  });

  it("4번은 안내 문구다", () => {
    const { getByTestId } = renderScreen();

    expect(
      within(getByTestId("rise-4")).getByText(/가입하면 관리자가 확인한 뒤에/),
    ).toBeTruthy();
  });

  it("등장 조각은 정확히 다섯이다", () => {
    const { queryByTestId } = renderScreen();

    expect(queryByTestId("rise-5")).toBeNull();
  });
});

describe("LoginScreen — 실패 줄은 안내의 자리에 선다", () => {
  it("실패하면 실패 줄이 4번 안에 뜬다", () => {
    const { getByTestId } = renderScreen({ failed: true });

    expect(
      within(getByTestId("rise-4")).getByText(
        "로그인하지 못했어요. 다시 눌러 주세요",
      ),
    ).toBeTruthy();
  });
});
