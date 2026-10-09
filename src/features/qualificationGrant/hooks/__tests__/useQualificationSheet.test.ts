const { renderHook } = await import("@testing-library/react-native");
const { useQualificationSheet } =
  await import("@/features/qualificationGrant/hooks/useQualificationSheet");

describe("useQualificationSheet — 이름과 포지션이 제목과 안내에 든다", () => {
  it("교육 이력이 없다고 묻는다", () => {
    const { result } = renderHook(() =>
      useQualificationSheet({ name: "박서연", position: "스캔" }),
    );

    expect(result.current.title).toBe("박서연 님은 스캔 교육 이력이 없어요");
  });

  it("자격을 주면 앞으로 그 자리에 들어갈 수 있다고 말한다", () => {
    const { result } = renderHook(() =>
      useQualificationSheet({ name: "박서연", position: "스캔" }),
    );

    expect(result.current.grantDetail).toBe(
      "앞으로 스캔 자리에 들어갈 수 있어요",
    );
  });
});
