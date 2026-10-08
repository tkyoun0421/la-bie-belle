import { useKeepAwake } from "expo-keep-awake";
import { useWindowDimensions } from "react-native";
import { QrStage } from "@/shared/ui/QrFace";
import { QR_SCREEN_COPY } from "@/screens/qr/consts/qr.const";
import { fullscreenQrSize } from "@/screens/qr/utils/fullscreenQrSize.utils";

export type QrFullscreenProps = {
  svg: string | null;
  onClose: () => void;
};

export function QrFullscreen({ svg, onClose }: QrFullscreenProps) {
  useKeepAwake();

  const { width } = useWindowDimensions();

  return (
    <QrStage
      svg={svg}
      size={fullscreenQrSize(width)}
      closeLabel={QR_SCREEN_COPY.close}
      onClose={onClose}
    />
  );
}
