import { buildCheckInUrl } from "@/entities/qr/model/checkInUrl";

describe("buildCheckInUrl — 앱 주소와 코드를 합쳐 출근 인증 링크를 만든다", () => {
  it("appUrl과 code를 이어 /check-in?c=<code> 꼴을 만든다", () => {
    expect(buildCheckInUrl("https://a.example", "abc")).toBe(
      "https://a.example/check-in?c=abc",
    );
  });

  it("appUrl 끝의 슬래시를 하나로 접는다", () => {
    expect(buildCheckInUrl("https://a.example/", "abc")).toBe(
      "https://a.example/check-in?c=abc",
    );
  });

  it("appUrl 끝에 슬래시가 여러 개라도 하나로 접는다", () => {
    expect(buildCheckInUrl("https://a.example//", "abc")).toBe(
      "https://a.example/check-in?c=abc",
    );
  });

  it("코드를 encodeURIComponent로 인코딩한다", () => {
    expect(buildCheckInUrl("https://a.example", "a b/c")).toBe(
      "https://a.example/check-in?c=a%20b%2Fc",
    );
  });
});
