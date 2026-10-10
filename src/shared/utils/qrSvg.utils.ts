import QRCode from "qrcode";

export function buildQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 0 });
}
