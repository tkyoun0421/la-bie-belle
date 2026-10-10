import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { readAppUrl } from "@/shared/config/app.config";
import { useToast, type ToastState } from "@/shared/hooks/useToast";
import { exportQrPaper } from "@/entities/qr/lib/exportQrPaper.lib";
import type { HallQrCode } from "@/entities/qr/model/qr.type";
import { useQrCodeQuery } from "@/entities/qr/services/useQrCodeQuery";
import { buildCheckInUrl } from "@/entities/qr/utils/checkInUrl.utils";
import { useRotateQrMutation } from "@/features/qrAdmin/services/useRotateQrMutation";
import { QR_SCREEN_COPY } from "@/screens/qr/consts/qr.const";
import { buildQrPaperHtml } from "@/screens/qr/utils/qrPaper.utils";
import { qrStartLine } from "@/screens/qr/utils/qrStartLine.utils";
import { buildQrSvg } from "@/screens/qr/utils/qrSvg.utils";

export type QrScreenController = {
  qr: HallQrCode | null | undefined;
  svg: string | null;
  startLine: string | null;
  exporting: boolean;
  asking: boolean;
  rotateFailed: boolean;
  rotateNotice: string | undefined;
  toast: ToastState | null;
  goBack: () => void;
  exportPaper: () => void;
  askRotate: () => void;
  cancelRotate: () => void;
  rotate: () => void;
  dismissToast: () => void;
  fullscreen: boolean;
  openFullscreen: () => void;
  closeFullscreen: () => void;
};

export function useQrScreen(): QrScreenController {
  const router = useRouter();
  const [svg, setSvg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const { toast, showToast, dismissToast } = useToast();

  const { data: qr } = useQrCodeQuery(supabase);
  const {
    mutate: rotate,
    isSuccess: rotated,
    isError: rotateFailed,
    reset: resetRotate,
  } = useRotateQrMutation(supabase);

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
      showToast("info", QR_SCREEN_COPY.rotateDone);
      resetRotate();
    }
  }, [rotated, resetRotate, showToast]);

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
        showToast("info", QR_SCREEN_COPY.paperFailed);
      },
    );
  }, [svg, exporting, showToast]);

  const askRotate = useCallback(() => setAsking(true), []);

  const cancelRotate = useCallback(() => {
    setAsking(false);
    resetRotate();
  }, [resetRotate]);

  const goBack = useCallback(() => router.back(), [router]);

  return {
    qr,
    svg,
    startLine: qr == null ? null : qrStartLine(qr.rotatedAt),
    exporting,
    asking,
    rotateFailed,
    rotateNotice: rotateFailed ? QR_SCREEN_COPY.sendFailed : undefined,
    toast,
    goBack,
    exportPaper,
    askRotate,
    cancelRotate,
    rotate,
    dismissToast,
    fullscreen,
    openFullscreen: () => setFullscreen(true),
    closeFullscreen: () => setFullscreen(false),
  };
}
