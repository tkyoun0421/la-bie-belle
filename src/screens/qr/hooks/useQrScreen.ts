import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
import { readAppUrl } from "@/shared/config/app.config";
import { exportQrPaper } from "@/entities/qr/lib/exportQrPaper.lib";
import type { HallQrCode } from "@/entities/qr/model/qr.type";
import { useQrCodeQuery } from "@/entities/qr/services/useQrCodeQuery";
import { buildCheckInUrl } from "@/entities/qr/utils/checkInUrl.utils";
import { useRotateQrMutation } from "@/features/qrAdmin/services/useRotateQrMutation";
import { QR_SCREEN_COPY } from "@/screens/qr/consts/qr.const";
import { buildQrPaperHtml } from "@/screens/qr/utils/qrPaper.utils";
import { buildQrSvg } from "@/screens/qr/utils/qrSvg.utils";

/**
 * QR 화면의 controller다. 화면이 드는 업무 상태 넷이 여기 산다 — 지금 코드, 그 코드를 구운
 * 그림, 종이를 내보내는 중인지, 확인창이 열려 있는지다.
 *
 * **열림 하나가 UI 상태가 아니다.** AC-12는 시트·팝오버의 열림을 `.tsx`에 남기는데, 이
 * 확인창은 사람이 열어도 **닫히는 때가 통신 결과에 매여 있다** — 새로 뽑기가 성공하면
 * 저절로 닫히고 토스트가 선다. 측정한 너비나 포커스처럼 화면이 혼자 아는 값이 아니라서
 * 여기 든다. 「크게 띄우기」는 그것과 달라 `.tsx`에 남는다.
 *
 * **그림은 통신이 아니라서 `services`가 아니다.** 코드를 받아 SVG를 굽는 일은 기기에서
 * 끝나는 비동기 계산이고, 그 효과가 사는 자리가 controller다.
 *
 * **종이를 굽는 손을 여기서 꽂는다.** `expo-print`·`expo-sharing`은 `lib`·`ui`·`hooks`에만
 * 설 수 있어(AC-08) controller가 그 둘을 `exportQrPaper`에 넘긴다.
 */

export type QrScreenController = {
  qr: HallQrCode | null | undefined;
  svg: string | null;
  exporting: boolean;
  asking: boolean;
  rotateFailed: boolean;
  toast: string | null;
  exportPaper: () => void;
  askRotate: () => void;
  cancelRotate: () => void;
  rotate: () => void;
  dismissToast: () => void;
};

export function useQrScreen(client: DB): QrScreenController {
  const [svg, setSvg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: qr } = useQrCodeQuery(client);
  const {
    mutate: rotate,
    isSuccess: rotated,
    isError: rotateFailed,
    reset: resetRotate,
  } = useRotateQrMutation(client);

  const code = qr?.qrCode ?? null;

  useEffect(() => {
    if (code === null) {
      setSvg(null);

      return;
    }

    let live = true;

    buildQrSvg(buildCheckInUrl(readAppUrl(), code)).then(
      (made) => {
        if (live) {
          setSvg(made);
        }
      },
      () => {
        if (live) {
          setSvg(null);
        }
      },
    );

    return () => {
      live = false;
    };
  }, [code]);

  useEffect(() => {
    if (rotated) {
      setAsking(false);
      setToast(QR_SCREEN_COPY.rotateDone);
      resetRotate();
    }
  }, [rotated, resetRotate]);

  const exportPaper = useCallback(() => {
    if (svg === null || exporting) {
      return;
    }

    setExporting(true);

    exportQrPaper({
      html: buildQrPaperHtml({ qrSvg: svg }),
      printToFile: Print.printToFileAsync,
      share: Sharing.shareAsync,
    }).then(
      () => setExporting(false),
      () => {
        setExporting(false);
        setToast(QR_SCREEN_COPY.paperFailed);
      },
    );
  }, [svg, exporting]);

  const askRotate = useCallback(() => setAsking(true), []);

  const cancelRotate = useCallback(() => {
    setAsking(false);
    resetRotate();
  }, [resetRotate]);

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    qr,
    svg,
    exporting,
    asking,
    rotateFailed,
    toast,
    exportPaper,
    askRotate,
    cancelRotate,
    rotate,
    dismissToast,
  };
}
