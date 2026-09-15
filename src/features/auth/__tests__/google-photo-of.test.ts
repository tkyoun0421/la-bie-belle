import { describe, expect, it } from "vitest";
import { googlePhotoOf } from "@/features/auth/google-photo-of";

describe("googlePhotoOf — 구글 로그인 메타데이터에서 사진 주소를 고른다", () => {
  it("avatar_url이 있으면 그 값을 사진으로 쓴다", () => {
    const photo = googlePhotoOf({
      avatar_url: "https://example.com/avatar.png",
    });

    expect(photo).toBe("https://example.com/avatar.png");
  });

  it("avatar_url이 없고 picture만 있으면 picture 값을 사진으로 쓴다", () => {
    const photo = googlePhotoOf({
      picture: "https://example.com/picture.png",
    });

    expect(photo).toBe("https://example.com/picture.png");
  });

  it("avatar_url도 picture도 없으면 사진은 비어 있다", () => {
    const photo = googlePhotoOf({});

    expect(photo).toBeNull();
  });
});
