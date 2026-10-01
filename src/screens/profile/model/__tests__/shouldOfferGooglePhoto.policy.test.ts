import { shouldOfferGooglePhoto } from "@/screens/profile/model/shouldOfferGooglePhoto.policy";

// 사진 시트의 「구글 사진으로」 줄. 정본은
// `docs/2-design/modules/account/screens/profile.md`의 「사진 고치기」 —
// 지금 쓰는 것이 구글 사진이거나 구글 계정에 사진이 없으면 줄 자체가 없다.

describe("shouldOfferGooglePhoto — 되돌릴 구글 사진이 따로 있을 때만 줄을 보인다", () => {
  it("구글 계정에 사진이 없으면 줄을 안 보인다", () => {
    expect(shouldOfferGooglePhoto("https://example.com/mine.jpg", null)).toBe(
      false,
    );
  });

  it("지금 쓰는 사진이 이미 구글 사진이면 줄을 안 보인다", () => {
    expect(
      shouldOfferGooglePhoto(
        "https://example.com/google.jpg",
        "https://example.com/google.jpg",
      ),
    ).toBe(false);
  });

  it("본인이 올린 사진을 쓰고 구글 사진이 따로 있으면 줄을 보인다", () => {
    expect(
      shouldOfferGooglePhoto(
        "https://example.com/mine.jpg",
        "https://example.com/google.jpg",
      ),
    ).toBe(true);
  });

  it("지금 사진이 없고 구글 사진이 있으면 줄을 보인다", () => {
    expect(shouldOfferGooglePhoto(null, "https://example.com/google.jpg")).toBe(
      true,
    );
  });
});
