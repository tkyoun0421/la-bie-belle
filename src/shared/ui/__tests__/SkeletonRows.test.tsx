import { render } from "@testing-library/react-native";
import { View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";

const THREE_ROWS = [0, 1, 2] as const;

function withoutFunctions(node: unknown): unknown {
  if (typeof node === "function") {
    return "[Function]";
  }

  if (Array.isArray(node)) {
    return node.map(withoutFunctions);
  }

  if (node !== null && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        withoutFunctions(value),
      ]),
    );
  }

  return node;
}

function structureOf(screen: ReturnType<typeof render>) {
  return withoutFunctions(screen.toJSON());
}

describe("SkeletonRows — 감쌈 꼴마다 지우기 전 Loading 조각과 같은 나무를 그린다", () => {
  it("card는 Card 안에 my-4 w-2/3 줄을 rows만큼 그린다", () => {
    const drawn = render(<SkeletonRows rows={THREE_ROWS} frame="card" />);
    const before = render(
      <Card>
        {THREE_ROWS.map((at) => (
          <SkeletonLine key={at} className="my-4 w-2/3" />
        ))}
      </Card>,
    );

    expect(structureOf(drawn)).toEqual(structureOf(before));
  });

  it("headed는 mt-6 gap-4 View 안에 h-9 머리 줄 하나와 w-2/3 줄을 rows만큼 그린다", () => {
    const drawn = render(<SkeletonRows rows={THREE_ROWS} frame="headed" />);
    const before = render(
      <View className="mt-6 gap-4">
        <SkeletonLine className="h-9 w-2/3" />
        {THREE_ROWS.map((at) => (
          <SkeletonLine key={at} className="w-2/3" />
        ))}
      </View>,
    );

    expect(structureOf(drawn)).toEqual(structureOf(before));
  });

  it("bare는 감싸지 않고 my-4 w-2/3 줄을 rows만큼 그린다", () => {
    const drawn = render(<SkeletonRows rows={THREE_ROWS} frame="bare" />);
    const before = render(
      <>
        {THREE_ROWS.map((at) => (
          <SkeletonLine key={at} className="my-4 w-2/3" />
        ))}
      </>,
    );

    expect(structureOf(drawn)).toEqual(structureOf(before));
  });
});

describe("SkeletonRows — 줄 수는 rows를 따른다", () => {
  it("card와 bare는 rows 길이만큼 줄을 그린다", () => {
    const card = render(<SkeletonRows rows={[0, 1]} frame="card" />);
    const bare = render(<SkeletonRows rows={[0, 1, 2, 3]} frame="bare" />);

    expect(card.UNSAFE_getAllByType(SkeletonLine)).toHaveLength(2);
    expect(bare.UNSAFE_getAllByType(SkeletonLine)).toHaveLength(4);
  });

  it("headed는 머리 줄 하나를 더해 rows 길이보다 한 줄 많다", () => {
    const { UNSAFE_getAllByType } = render(
      <SkeletonRows rows={[0, 1]} frame="headed" />,
    );

    expect(UNSAFE_getAllByType(SkeletonLine)).toHaveLength(3);
  });
});
