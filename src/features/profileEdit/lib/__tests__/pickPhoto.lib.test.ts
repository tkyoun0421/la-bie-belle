import { jest } from "@jest/globals";
import {
  pickAndShrinkPhoto,
  type PickPhotoDeps,
} from "@/features/profileEdit/lib/pickPhoto.lib";

const SHRUNK = { uri: "file:///shrunk.jpg" };

function deps(overrides: Partial<PickPhotoDeps>): PickPhotoDeps {
  return {
    launchImageLibraryAsync: jest
      .fn<PickPhotoDeps["launchImageLibraryAsync"]>()
      .mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file:///a.heic" }],
      }),
    manipulateAsync: jest
      .fn<PickPhotoDeps["manipulateAsync"]>()
      .mockResolvedValue(SHRUNK),
    saveFormatJpeg: "jpeg",
    ...overrides,
  };
}

describe("pickAndShrinkPhoto — 고르고 줄인다", () => {
  it("고른 사진을 줄여 올릴 꼴로 돌려준다", async () => {
    const injected = deps({});

    await expect(pickAndShrinkPhoto(injected)).resolves.toEqual({
      uri: SHRUNK.uri,
      contentType: "image/jpeg",
      extension: "jpg",
    });

    expect(injected.manipulateAsync).toHaveBeenCalledWith(
      "file:///a.heic",
      expect.anything(),
      expect.anything(),
    );
  });

  it("고르다 말면 줄이지 않고 null이다", async () => {
    const injected = deps({
      launchImageLibraryAsync: jest
        .fn<PickPhotoDeps["launchImageLibraryAsync"]>()
        .mockResolvedValue({ canceled: true, assets: null }),
    });

    await expect(pickAndShrinkPhoto(injected)).resolves.toBeNull();

    expect(injected.manipulateAsync).not.toHaveBeenCalled();
  });

  it("줄이다 넘어지면 던진다", async () => {
    const injected = deps({
      manipulateAsync: jest
        .fn<PickPhotoDeps["manipulateAsync"]>()
        .mockRejectedValue(new Error("못 줄였다")),
    });

    await expect(pickAndShrinkPhoto(injected)).rejects.toThrow("못 줄였다");
  });
});
