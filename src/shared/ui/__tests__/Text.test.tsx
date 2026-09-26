import { render } from "@testing-library/react-native";
import { Text } from "@/shared/ui/Text";

describe("Text — 글자 배율 상한 1.3을 기본으로 건다 (AC-04)", () => {
  it("prop 없이 렌더해도 maxFontSizeMultiplier가 1.3이다", () => {
    const { getByText } = render(<Text>오늘 근무가 있어요</Text>);

    expect(getByText("오늘 근무가 있어요").props.maxFontSizeMultiplier).toBe(
      1.3,
    );
  });

  it("className을 얹어도 상한은 그대로 1.3이다 — 화면 파일이 상한을 따로 안 건다", () => {
    const { getByText } = render(
      <Text className="font-medium text-sm">62% 지났어요</Text>,
    );

    expect(getByText("62% 지났어요").props.maxFontSizeMultiplier).toBe(1.3);
  });

  /**
   * 기기 글자 배율이 1.3을 넘어도(예: 2.0) 이 조각이 넘기는 값은 그대로 1.3이다 —
   * RN이 그 값을 상한으로 실제 배율에 곱한다. 여기서 보는 것은 "무엇을 넘기는가"고
   * 실제 렌더 크기는 네이티브 계층의 일이라 RNTL 밖이다.
   */
  it("숫자만 있는 글자에도 같은 상한을 건다", () => {
    const { getByText } = render(<Text>142만원</Text>);

    expect(getByText("142만원").props.maxFontSizeMultiplier).toBe(1.3);
  });
});
