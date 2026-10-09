import { useKeepAwake } from "expo-keep-awake";
import { QR_SCREEN_COPY } from "@/screens/qr/consts/qr.const";
import type {
  QrFullscreenController,
  QrFullscreenInput,
} from "@/screens/qr/model/qrFullscreen.type";
import { fullscreenQrSize } from "@/screens/qr/utils/fullscreenQrSize.utils";

export function useQrFullscreen({
  width,
}: QrFullscreenInput): QrFullscreenController {
  useKeepAwake();

  return {
    size: fullscreenQrSize(width),
    closeLabel: QR_SCREEN_COPY.close,
  };
}
