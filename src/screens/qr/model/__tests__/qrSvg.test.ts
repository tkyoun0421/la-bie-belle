import { buildQrSvg } from "@/screens/qr/model/qrSvg";

describe("buildQrSvg — 텍스트를 QR SVG 문자열로 만든다", () => {
  it("<svg로 시작하는 문자열을 낸다", async () => {
    const svg = await buildQrSvg("https://a.example/check-in?c=abc");

    expect(svg.trimStart().startsWith("<svg")).toBe(true);
  });

  it("입력 텍스트가 글자 그대로 결과에 안 들어간다", async () => {
    const text = "https://a.example/check-in?c=abc";

    const svg = await buildQrSvg(text);

    expect(svg).not.toContain(text);
  });

  it("같은 입력이면 같은 출력이다", async () => {
    const text = "https://a.example/check-in?c=abc";

    const first = await buildQrSvg(text);
    const second = await buildQrSvg(text);

    expect(first).toBe(second);
  });
});
