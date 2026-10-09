import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { usePersonPickerSheet } =
  await import("@/screens/scheduleAdmin/hooks/usePersonPickerSheet");

type Input = Parameters<typeof usePersonPickerSheet>[0];

type Entry = Input["entries"][number];

function entry(over: Partial<Entry> = {}): Entry {
  return {
    profileId: "p1",
    displayName: "이준호",
    category: "assignable",
    message: null,
    checkbox: false,
    photoUrl: null,
    gender: "male",
    ...over,
  } as Entry;
}

function input(over: Partial<Input> = {}): Input {
  return {
    entries: [
      entry({ profileId: "p1", displayName: "이준호" }),
      entry({
        profileId: "p2",
        displayName: "박수진",
        category: "assigned",
        gender: "female",
      }),
    ],
    expanded: false,
    picked: [],
    onPick: jest.fn(),
    onInspect: jest.fn(),
    onToggle: jest.fn(),
    ...over,
  };
}

describe("usePersonPickerSheet — 넣을 사람과 나머지를 controller가 가른다", () => {
  it("바로 넣을 수 있는 사람만 앞 묶음에 선다", () => {
    const { result } = renderHook(() => usePersonPickerSheet(input()));

    expect(result.current.assignable).toHaveLength(1);
    expect(result.current.assignable[0].displayName).toBe("이준호");
    expect(result.current.rest).toHaveLength(1);
  });

  it("배정된 사람은 흐리게 그릴 톤을 받는다", () => {
    const { result } = renderHook(() => usePersonPickerSheet(input()));

    expect(result.current.assignable[0].nameTone).toBe("neutral");
    expect(result.current.rest[0].nameTone).toBe("disabled");
    expect(result.current.rest[0].genderTone).toBe("disabled");
  });

  it("성별 아이콘은 아는 성별에만 선다", () => {
    const { result } = renderHook(() =>
      usePersonPickerSheet(
        input({
          entries: [
            entry({ gender: "female" }),
            entry({ profileId: "p3", gender: null }),
          ],
        }),
      ),
    );

    expect(result.current.assignable[0].genderIcon).toBe("Venus");
    expect(result.current.assignable[1].genderIcon).toBeNull();
  });

  it("접힌 동안은 나머지를 안 보여준다", () => {
    const { result } = renderHook(() => usePersonPickerSheet(input()));

    expect(result.current.showRest).toBe(false);
  });

  it("펴면 나머지가 보인다", () => {
    const { result } = renderHook(() =>
      usePersonPickerSheet(input({ expanded: true })),
    );

    expect(result.current.showRest).toBe(true);
  });

  it("고른 사람 수가 보내기 문구에 든다", () => {
    const { result } = renderHook(() =>
      usePersonPickerSheet(input({ picked: ["p1", "p2"] })),
    );

    expect(result.current.sendLabel).toBe("2명에게 근무 요청 보내기");
    expect(result.current.assignable[0].checked).toBe(true);
  });

  it("아무도 안 골랐으면 보내기가 없다", () => {
    const { result } = renderHook(() => usePersonPickerSheet(input()));

    expect(result.current.sendLabel).toBeNull();
  });

  it("누르기·길게 누르기·체크가 그 사람으로 간다", () => {
    const onPick = jest.fn();
    const onInspect = jest.fn();
    const onToggle = jest.fn();
    const { result } = renderHook(() =>
      usePersonPickerSheet(input({ onPick, onInspect, onToggle })),
    );

    result.current.assignable[0].press();
    result.current.assignable[0].inspect();
    result.current.assignable[0].toggle();

    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: "p1" }),
    );
    expect(onInspect).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: "p1" }),
    );
    expect(onToggle).toHaveBeenCalledWith("p1");
  });
});
