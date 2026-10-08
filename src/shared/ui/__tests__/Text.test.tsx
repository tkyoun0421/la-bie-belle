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

  it("숫자만 있는 글자에도 같은 상한을 건다", () => {
    const { getByText } = render(<Text>142만원</Text>);

    expect(getByText("142만원").props.maxFontSizeMultiplier).toBe(1.3);
  });
});

describe("Text — size·tone·weight·numeric이 className 토큰으로 매핑된다", () => {
  it("prop을 안 주면 기본값 size=base·tone=neutral의 토큰이 붙는다", () => {
    const { getByText } = render(<Text>기본값</Text>);

    expect(getByText("기본값").props.className).toBe(
      "text-base text-fg-neutral",
    );
  });

  it("size=xs는 text-xs로 매핑된다", () => {
    const { getByText } = render(<Text size="xs">작은 글자</Text>);

    expect(getByText("작은 글자").props.className).toBe(
      "text-xs text-fg-neutral",
    );
  });

  it("size=4xl은 text-4xl로 매핑된다", () => {
    const { getByText } = render(<Text size="4xl">큰 숫자</Text>);

    expect(getByText("큰 숫자").props.className).toBe(
      "text-4xl text-fg-neutral",
    );
  });

  it("tone=muted는 text-fg-neutral-muted로 매핑된다", () => {
    const { getByText } = render(<Text tone="muted">부가 텍스트</Text>);

    expect(getByText("부가 텍스트").props.className).toBe(
      "text-base text-fg-neutral-muted",
    );
  });

  it("tone=critical은 text-fg-critical로 매핑된다", () => {
    const { getByText } = render(<Text tone="critical">에러 메시지</Text>);

    expect(getByText("에러 메시지").props.className).toBe(
      "text-base text-fg-critical",
    );
  });

  it("weight=bold는 font-bold를 더한다", () => {
    const { getByText } = render(<Text weight="bold">굵은 글자</Text>);

    expect(getByText("굵은 글자").props.className).toBe(
      "text-base text-fg-neutral font-bold",
    );
  });

  it("numeric이 참이면 tabular-nums를 더해 숫자 폭을 고정한다", () => {
    const { getByText } = render(<Text numeric>2026-09-27</Text>);

    expect(getByText("2026-09-27").props.className).toBe(
      "text-base text-fg-neutral tabular-nums",
    );
  });

  it("className을 함께 주면 prop 매핑 뒤에 합쳐진다", () => {
    const { getByText } = render(
      <Text size="sm" tone="brand" className="mt-4">
        추가 여백
      </Text>,
    );

    expect(getByText("추가 여백").props.className).toBe(
      "text-sm text-fg-brand mt-4",
    );
  });
});
