import { render } from "@testing-library/react-native";
import { SheetHandle } from "@/shared/ui/SheetHandle";

async function renderHandle() {
  return render(<SheetHandle />);
}

async function handleClasses() {
  const { getByTestId } = await renderHandle();

  return String(getByTestId("sheet-handle").props.className).split(/\s+/);
}

describe("SheetHandle — 바텀시트 맨 위 가운데 손잡이다", () => {
  it("stroke.neutral-muted 색의 w-8 h-1 둥근 막대로 선다", async () => {
    expect(await handleClasses()).toEqual(
      expect.arrayContaining([
        "bg-stroke-neutral-muted",
        "w-8",
        "h-1",
        "rounded-full",
      ]),
    );
  });

  it("가운데에 서고 위로 8px, 아래 내용까지 12px을 둔다", async () => {
    expect(await handleClasses()).toEqual(
      expect.arrayContaining(["self-center", "mt-2", "mb-3"]),
    );
  });
});
