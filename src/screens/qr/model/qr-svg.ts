import QRCode from "qrcode";

/**
 * 주소 하나를 QR 그림으로 굽는다. 결과가 SVG 문자열인 것은 그 한 장이 두 자리를 채우기
 * 때문이다 — 화면은 `react-native-svg`의 `SvgXml`로 그리고, 인쇄용 종이는 같은 문자열을
 * HTML에 박는다(`qr-paper.ts`). 벡터라 A4로 키워도 안 깨지고, 프린터가 「용지에 맞춤」으로
 * 줄여도 비율이 같다(`docs/2-design/spec/attendance-qr.md`의 AC-03).
 *
 * **여백을 0으로 굽는다.** 코드 둘레의 흰 띠는 종이와 화면이 각자 제 크기로 두르는 값이라
 * 그림 안에 섞이면 두 번 들어간다.
 *
 * **글자가 안 들어간다.** 결과는 경로뿐이고 담은 주소가 문자로 남지 않는다 — 눈에 보이면
 * 복사해 옮길 수 있고, 그 순간 홀에 서 있지 않아도 찍히는 길이 열린다
 * (`docs/2-design/modules/attendance/screens/qr.md`의 「QR 그림」).
 */

export function buildQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 0 });
}
