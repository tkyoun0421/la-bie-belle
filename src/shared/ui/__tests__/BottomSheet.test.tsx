import { render } from "@testing-library/react-native";
import { BottomSheet } from "@/shared/ui/BottomSheet";

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

describe("BottomSheet — 판정값을 못 받으면 이동 모션이 안 빠진다 (AC-06)", () => {
  it("distance가 0이면 처음부터 자리에서 선다 — 이동이 없다", () => {
    const { getByTestId } = render(
      <BottomSheet testID="bottom-sheet" distance={0}>
        본문
      </BottomSheet>,
    );

    const style = flatten(getByTestId("bottom-sheet").props.style);

    expect(style.transform).toEqual([{ translateY: 0 }]);
  });

  it("distance가 0보다 크면 그 값만큼 밀린 자리에서 시작한다", () => {
    const { getByTestId } = render(
      <BottomSheet testID="bottom-sheet" distance={40}>
        본문
      </BottomSheet>,
    );

    const style = flatten(getByTestId("bottom-sheet").props.style);

    expect(style.transform).toEqual([{ translateY: 40 }]);
  });
});
