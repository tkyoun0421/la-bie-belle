import { render } from "@testing-library/react-native";
import { Toast } from "@/shared/ui/Toast";

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

describe("Toast — 판정값을 못 받으면 이동 모션이 안 빠진다 (AC-06)", () => {
  it("distance가 0이면 처음부터 자리에서 선다 — 이동이 없다", () => {
    const { getByTestId } = render(
      <Toast testID="toast" distance={0}>
        저장했어요
      </Toast>,
    );

    const style = flatten(getByTestId("toast").props.style);

    expect(style.transform).toEqual([{ translateY: 0 }]);
  });

  it("distance가 0보다 크면 그 값만큼 밀린 자리에서 시작한다", () => {
    const { getByTestId } = render(
      <Toast testID="toast" distance={24}>
        저장했어요
      </Toast>,
    );

    const style = flatten(getByTestId("toast").props.style);

    expect(style.transform).toEqual([{ translateY: 24 }]);
  });
});
