import { useWindowDimensions } from "react-native";
import { QrStage } from "@/shared/ui/QrFace";
import { useQrFullscreen } from "@/screens/qr/hooks/useQrFullscreen";

export type QrFullscreenProps = {
  svg: string | null;
  onClose: () => void;
};

export function QrFullscreen({ svg, onClose }: QrFullscreenProps) {
  const { width } = useWindowDimensions();
  const fullscreen = useQrFullscreen({ width });

  return (
    <QrStage
      svg={svg}
      size={fullscreen.size}
      closeLabel={fullscreen.closeLabel}
      onClose={onClose}
    />
  );
}
