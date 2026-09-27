import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { readAppUrl } from "@/shared/lib/read-app-url";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { QrCard } from "@/shared/ui/QrFace";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { buildCheckInUrl } from "@/entities/attendance/model/check-in-url";
import { exportQrPaper } from "@/features/attendance/model/export-qr-paper";
import { useQrCode } from "@/features/attendance/model/useQrCode";
import { useRotateQr } from "@/features/attendance/model/useRotateQr";
import { buildQrPaperHtml } from "@/screens/qr/model/qr-paper";
import { qrStartLine } from "@/screens/qr/model/qr-start-line";
import { buildQrSvg } from "@/screens/qr/model/qr-svg";
import { QrFullscreen } from "@/screens/qr/ui/QrFullscreen";

/**
 * 관리자가 현장 QR을 보고 인쇄하고 새로 뽑는 자리다. 정본은
 * `docs/2-design/modules/attendance/screens/qr.md`고 완료 조건은
 * `docs/2-design/spec/attendance-qr.md`다.
 *
 * **QR이 화면 가운데에 크게 선다.** 이 화면이 들고 있는 것이 그것 하나다.
 *
 * **값을 글자로 안 보여준다.** 화면에도 인쇄용 종이에도 코드 문자열이 안 뜬다 — 눈에 보이면
 * 복사해 옮길 수 있고, 그 순간 홀에 서 있지 않아도 찍히는 길이 열린다
 * ([ATT-027](../../../../docs/2-design/modules/attendance/README.md#att-027)). 코드가 닿는
 * 자리는 주소를 조립하는 `buildCheckInUrl`과 그 주소를 굽는 `buildQrSvg`뿐이다.
 *
 * **그림 하나가 두 자리를 채운다.** 화면의 카드와 인쇄용 종이가 같은 SVG 문자열을 쓴다 —
 * 종이만 따로 구우면 화면에 선 것과 다른 코드가 벽에 붙을 수 있다.
 *
 * **버튼 셋을 세로로 쌓고 「새로 뽑기」만 위 간격이 넓다.** 앞의 둘은 지금 코드를 쓰는 길이고
 * 이것만 코드를 바꾼다 — 간격이 그 갈림을 말한다.
 *
 * **홀 위치 절은 아직 없다.** `qr.md`가 버튼 셋 아래에 두는 절이고 `hall-location`이 세운다.
 */

const APPBAR_TITLE = "QR";

const EXPORT_LABEL = "내보내기";

const FULLSCREEN_LABEL = "크게 띄우기";

const ROTATE_LABEL = "새로 뽑기";

const ROTATE_TITLE = "QR을 새로 뽑을까요?";

const ROTATE_BODY = "지금 QR이 바로 끝나요. 홀에 붙여둔 종이도 갈아야 해요";

const ROTATE_DONE = "QR을 새로 뽑았어요";

const PAPER_FAILED = "종이를 못 만들었어요. 다시 눌러주세요";

/** 통신이 끊겼을 때의 기본 문장이다 — `docs/2-design/system/data-access.md`의 「오류의 모양」. */
const SEND_FAILED = "보내지 못했어요. 다시 시도해주세요";

/** e2e가 화면 뒤에 깔린 같은 글자의 버튼과 가르는 손이다 — `tests/e2e/qr.yaml`. */
const ROTATE_CONFIRM_TEST_ID = "qr-rotate-confirm-button";

export function QrScreen() {
  const router = useRouter();

  const [svg, setSvg] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: qr } = useQrCode(supabase);
  const {
    mutate: rotate,
    isSuccess: rotated,
    isError: rotateFailed,
    reset: resetRotate,
  } = useRotateQr(supabase);

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
      setToast(ROTATE_DONE);
      resetRotate();
    }
  }, [rotated, resetRotate]);

  const exportPaper = () => {
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
        setToast(PAPER_FAILED);
      },
    );
  };

  const closeAsking = () => {
    setAsking(false);
    resetRotate();
  };

  if (fullscreen) {
    return <QrFullscreen svg={svg} onClose={() => setFullscreen(false)} />;
  }

  return (
    <Screen>
      <AppBar title={APPBAR_TITLE} onBack={() => router.back()} />

      <View className="px-5">
        <View className="mt-8">
          <QrCard svg={svg} />
        </View>

        {qr == null ? null : (
          <Text size="sm" tone="subtle" numeric className="mt-4">
            {qrStartLine(qr.rotatedAt)}
          </Text>
        )}

        <View className="mt-10 gap-3">
          <Button
            variant="secondary"
            loading={exporting}
            disabled={svg === null}
            onPress={exportPaper}
          >
            {EXPORT_LABEL}
          </Button>
          <Button variant="secondary" onPress={() => setFullscreen(true)}>
            {FULLSCREEN_LABEL}
          </Button>
        </View>

        <View className="mt-6">
          <Button variant="outline" onPress={() => setAsking(true)}>
            {ROTATE_LABEL}
          </Button>
        </View>
      </View>

      <Dialog
        visible={asking}
        title={ROTATE_TITLE}
        notice={rotateFailed ? SEND_FAILED : undefined}
        onClose={closeAsking}
        confirmLabel={ROTATE_LABEL}
        confirmTestID={ROTATE_CONFIRM_TEST_ID}
        onConfirm={rotate}
      >
        {ROTATE_BODY}
      </Dialog>

      {toast === null ? null : (
        <FloatingToast message={toast} onDone={() => setToast(null)} />
      )}
    </Screen>
  );
}
