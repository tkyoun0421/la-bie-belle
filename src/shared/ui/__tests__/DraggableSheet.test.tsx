import { render } from "@testing-library/react-native";
import type * as React from "react";
import { Text } from "react-native";
import type * as ReactNative from "react-native";
import { DraggableSheet } from "@/shared/ui/DraggableSheet";

jest.mock("@gorhom/bottom-sheet", () => {
  const { createElement, Fragment } = jest.requireActual<typeof React>("react");

  return {
    __esModule: true,
    default: ({
      handleComponent,
      children,
    }: {
      handleComponent?: React.ComponentType | null;
      children: React.ReactNode;
    }) =>
      createElement(
        Fragment,
        null,
        handleComponent ? createElement(handleComponent) : null,
        children,
      ),
    BottomSheetBackdrop: () => null,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock("@/shared/ui/BottomSheet", () => {
  const { View } = jest.requireActual<typeof ReactNative>("react-native");
  const { createElement } = jest.requireActual<typeof React>("react");

  return {
    BottomSheet: ({ children }: { children: React.ReactNode }) =>
      createElement(View, { testID: "bottom-sheet" }, children),
  };
});

function classesOf(element: { props: { className?: unknown } }) {
  return String(element.props.className).split(/\s+/);
}

function renderSheet() {
  return render(
    <DraggableSheet snapPoints={[200]}>
      <Text>본문</Text>
    </DraggableSheet>,
  );
}

describe("DraggableSheet — 끌어 닫는 시트는 맨 위에 손잡이를 둔다", () => {
  it("손잡이가 그려진다", () => {
    const { getByTestId } = renderSheet();

    expect(getByTestId("sheet-handle")).toBeTruthy();
  });

  it("손잡이는 stroke.neutral-muted 색의 w-8 h-1 둥근 막대다", () => {
    const { getByTestId } = renderSheet();

    expect(classesOf(getByTestId("sheet-handle"))).toEqual(
      expect.arrayContaining([
        "bg-stroke-neutral-muted",
        "w-8",
        "h-1",
        "rounded-full",
      ]),
    );
  });

  it("손잡이는 가운데에 서고 위로 8px, 아래 내용까지 12px을 둔다", () => {
    const { getByTestId } = renderSheet();

    expect(classesOf(getByTestId("sheet-handle"))).toEqual(
      expect.arrayContaining(["self-center", "mt-2", "mb-3"]),
    );
  });

  it("본문도 그대로 그려진다", () => {
    const { getByText } = renderSheet();

    expect(getByText("본문")).toBeTruthy();
  });
});
