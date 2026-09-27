import { useKeepAwake } from "expo-keep-awake";
import { useWindowDimensions } from "react-native";
import { QrStage } from "@/shared/ui/QrFace";
import { fullscreenQrSize } from "@/screens/qr/model/fullscreen-qr-size";

/**
 * 「크게 띄우기」다. 화면이 통째로 QR이 된다 — 종이가 떨어졌거나 새로 뽑은 직후에 관리자 폰을
 * 내미는 길이고 정본은 `docs/2-design/modules/attendance/screens/qr.md`의 「크게 띄우기」다.
 *
 * **화면이 안 꺼진다.** 근무자 여럿이 줄 서서 찍는 자리라 중간에 꺼지면 관리자가 계속 깨워야
 * 한다. `useKeepAwake`는 이 조각이 서 있는 동안만 걸리고 나가면 저절로 풀린다 — 밝기를 안
 * 건드리는 것과 갈라둔 기준이 되돌아오는지다.
 *
 * **밝기를 앱이 안 올린다.** 읽기에는 낫지만 사람이 정한 설정을 앱이 말없이 덮는 자리가 된다.
 */

const CLOSE_LABEL = "닫기";

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
      closeLabel={CLOSE_LABEL}
      onClose={onClose}
    />
  );
}
