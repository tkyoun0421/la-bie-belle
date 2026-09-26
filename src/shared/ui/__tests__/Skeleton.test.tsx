import { render } from "@testing-library/react-native";
import { Skeleton } from "@/shared/ui/Skeleton";

describe("Skeleton — 동작 줄이기가 켜지면 shimmer가 서지 않는다 (AC-06)", () => {
  it("reduceMotion이 참이면 shimmer 요소가 없다 — 덩이만 선다", () => {
    const { queryByTestId } = render(
      <Skeleton reduceMotion testID="skeleton" />,
    );

    expect(queryByTestId("skeleton-shimmer")).toBeNull();
  });

  it("reduceMotion이 거짓이면 shimmer 요소가 선다", () => {
    const { getByTestId } = render(
      <Skeleton reduceMotion={false} testID="skeleton" />,
    );

    expect(getByTestId("skeleton-shimmer")).toBeTruthy();
  });
});
