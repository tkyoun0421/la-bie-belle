const { renderHook } = await import("@testing-library/react-native");
const { usePersonSheet } =
  await import("@/screens/scheduleAdmin/hooks/usePersonSheet");

type Input = Parameters<typeof usePersonSheet>[0];

function input(over: Partial<Input> = {}): Input {
  return {
    name: "박수진",
    photoUrl: null,
    gender: "female",
    birthDate: "1998-03-04",
    qualifications: ["스캔"],
    ...over,
  };
}

describe("usePersonSheet — 조각이 꽂을 줄을 controller가 완성한다", () => {
  it("성별과 태어난 해를 한 줄로 합친다", () => {
    const { result } = renderHook(() => usePersonSheet(input()));

    expect(result.current.genderIcon).toBe("Venus");
    expect(result.current.factsLine).toBe("여성 · 98년생");
  });

  it("남성은 Mars를 든다", () => {
    const { result } = renderHook(() =>
      usePersonSheet(input({ gender: "male" })),
    );

    expect(result.current.genderIcon).toBe("Mars");
  });

  it("모르는 성별은 아이콘도 줄도 안 세운다", () => {
    const { result } = renderHook(() =>
      usePersonSheet(input({ gender: "unknown", birthDate: null })),
    );

    expect(result.current.genderIcon).toBeNull();
    expect(result.current.factsLine).toBeNull();
  });

  it("성별을 몰라도 태어난 해만으로 줄이 선다", () => {
    const { result } = renderHook(() =>
      usePersonSheet(input({ gender: null })),
    );

    expect(result.current.factsLine).toBe("98년생");
  });

  it("제한 자격만 골라 한 줄로 낸다", () => {
    const { result } = renderHook(() =>
      usePersonSheet(input({ qualifications: ["스캔", "없는자격", "메인"] })),
    );

    expect(result.current.qualificationLine).toBe("스캔 · 메인");
  });

  it("제한 자격이 없으면 그 줄이 없다", () => {
    const { result } = renderHook(() =>
      usePersonSheet(input({ qualifications: ["없는자격"] })),
    );

    expect(result.current.qualificationLine).toBeNull();
  });

  it("이름과 사진은 받은 그대로 간다", () => {
    const { result } = renderHook(() =>
      usePersonSheet(input({ photoUrl: "https://example.test/a.png" })),
    );

    expect(result.current.name).toBe("박수진");
    expect(result.current.photoUrl).toBe("https://example.test/a.png");
  });
});
