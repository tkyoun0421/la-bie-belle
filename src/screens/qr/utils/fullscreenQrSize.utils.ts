import { FULLSCREEN_QR_MARGIN } from "@/screens/qr/consts/qr.const";

export function fullscreenQrSize(screenWidth: number): number {
  return Math.max(0, screenWidth - FULLSCREEN_QR_MARGIN);
}
