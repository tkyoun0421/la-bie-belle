import { FULLSCREEN_QR_MARGIN } from "@/screens/qr/consts/qr.const";

/**
 * 「크게 띄우기」의 QR 한 변이다. 화면 폭에서 좌우 48px씩을 남긴 값이고 정본은
 * `docs/2-design/modules/attendance/screens/qr.md`의 「크게 띄우기」표다.
 *
 * **음수로 안 내려간다.** 폭이 96px 아래인 기기는 없지만, 크기 값이 음수로 내려가면
 * `react-native-svg`가 그리기를 통째로 접어 흰 화면만 남는다.
 */

export function fullscreenQrSize(screenWidth: number): number {
  return Math.max(0, screenWidth - FULLSCREEN_QR_MARGIN);
}
