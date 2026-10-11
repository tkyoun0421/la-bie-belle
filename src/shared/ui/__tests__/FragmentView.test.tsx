import { fireEvent, render } from "@testing-library/react-native";
import { Text as RNText } from "react-native";
import { FragmentView } from "@/shared/ui/FragmentView";

type TestFragment =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | { state: "empty"; reason: string }
  | { state: "ready"; count: number };

describe("FragmentView — 가지마다 맞는 그림을 그린다", () => {
  it("ready 가지는 pending·failed·empty를 다 채워도 ready를 그린다", () => {
    const fragment: TestFragment = { state: "ready", count: 7 };

    const { getByText, queryByText } = render(
      <FragmentView<TestFragment>
        fragment={fragment}
        pending={<RNText>기다리는 중</RNText>}
        failed={<RNText>실패</RNText>}
        empty={<RNText>없음</RNText>}
      >
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(getByText("개수 7")).toBeTruthy();
    expect(queryByText("기다리는 중")).toBeNull();
    expect(queryByText("실패")).toBeNull();
    expect(queryByText("없음")).toBeNull();
  });

  it("pending 가지면 pending 자리를 그린다", () => {
    const fragment: TestFragment = { state: "pending" };

    const { getByText } = render(
      <FragmentView<TestFragment>
        fragment={fragment}
        pending={<RNText>기다리는 중</RNText>}
      >
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(getByText("기다리는 중")).toBeTruthy();
  });

  it("pending에서 자리를 안 주면 아무것도 안 그린다", () => {
    const fragment: TestFragment = { state: "pending" };

    const { toJSON } = render(
      <FragmentView<TestFragment> fragment={fragment}>
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(toJSON()).toBeNull();
  });

  it("failed에 노드를 주면 그 노드가 그대로 나온다", () => {
    const fragment: TestFragment = { state: "failed", retry: jest.fn() };

    const { getByText } = render(
      <FragmentView<TestFragment>
        fragment={fragment}
        failed={<RNText>실패</RNText>}
      >
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(getByText("실패")).toBeTruthy();
  });

  it("failed에 함수를 주면 그 가지의 retry를 받아 쓴다", () => {
    const retry = jest.fn();
    const fragment: TestFragment = { state: "failed", retry };

    const { getByText } = render(
      <FragmentView<TestFragment>
        fragment={fragment}
        failed={(branch) => <RNText onPress={branch.retry}>다시</RNText>}
      >
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    fireEvent.press(getByText("다시"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("failed에서 자리를 안 주면 아무것도 안 그린다", () => {
    const fragment: TestFragment = { state: "failed", retry: jest.fn() };

    const { toJSON } = render(
      <FragmentView<TestFragment> fragment={fragment}>
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(toJSON()).toBeNull();
  });

  it("empty에 노드를 주면 그 노드가 그대로 나온다", () => {
    const fragment: TestFragment = {
      state: "empty",
      reason: "검색 결과 없음",
    };

    const { getByText } = render(
      <FragmentView<TestFragment>
        fragment={fragment}
        empty={<RNText>없음</RNText>}
      >
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(getByText("없음")).toBeTruthy();
  });

  it("empty에 함수를 주면 그 가지의 reason을 받아 쓴다", () => {
    const fragment: TestFragment = {
      state: "empty",
      reason: "검색 결과 없음",
    };

    const { getByText } = render(
      <FragmentView<TestFragment>
        fragment={fragment}
        empty={(branch) => <RNText>{branch.reason}</RNText>}
      >
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(getByText("검색 결과 없음")).toBeTruthy();
  });

  it("empty에서 자리를 안 주면 아무것도 안 그린다", () => {
    const fragment: TestFragment = {
      state: "empty",
      reason: "검색 결과 없음",
    };

    const { toJSON } = render(
      <FragmentView<TestFragment> fragment={fragment}>
        {(ready) => <RNText>개수 {ready.count}</RNText>}
      </FragmentView>,
    );

    expect(toJSON()).toBeNull();
  });
});
