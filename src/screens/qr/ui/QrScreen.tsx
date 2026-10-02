import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { QrCard } from "@/shared/ui/QrFace";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import {
  QR_SCREEN_COPY,
  ROTATE_CONFIRM_TEST_ID,
} from "@/screens/qr/consts/qr.const";
import { useQrScreen } from "@/screens/qr/hooks/useQrScreen";
import { QrFullscreen } from "@/screens/qr/ui/QrFullscreen";
import { qrStartLine } from "@/screens/qr/utils/qrStartLine.utils";

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
 * 자리는 controller 안의 `buildCheckInUrl`과 그 주소를 굽는 `buildQrSvg`뿐이다.
 *
 * **그림 하나가 두 자리를 채운다.** 화면의 카드와 인쇄용 종이가 같은 SVG 문자열을 쓴다 —
 * 종이만 따로 구우면 화면에 선 것과 다른 코드가 벽에 붙을 수 있다.
 *
 * **버튼 셋을 세로로 쌓고 「새로 뽑기」만 위 간격이 넓다.** 앞의 둘은 지금 코드를 쓰는 길이고
 * 이것만 코드를 바꾼다 — 간격이 그 갈림을 말한다.
 *
 * **남은 `useState`가 하나다.** 「크게 띄우기」는 사람이 열고 사람이 닫아 이 화면이 혼자 아는
 * 값이다. 「새로 뽑을까요?」는 닫히는 때가 통신 결과에 매여 있어 controller가 든다.
 *
 * **홀 위치 절은 아직 없다.** `qr.md`가 버튼 셋 아래에 두는 절이고 `hall-location`이 세운다.
 */
export function QrScreen() {
  const router = useRouter();
  const [fullscreen, setFullscreen] = useState(false);
  const {
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
  } = useQrScreen(supabase);

  if (fullscreen) {
    return <QrFullscreen svg={svg} onClose={() => setFullscreen(false)} />;
  }

  return (
    <Screen>
      <AppBar title={QR_SCREEN_COPY.appBarTitle} onBack={() => router.back()} />

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
            {QR_SCREEN_COPY.exportPaper}
          </Button>
          <Button variant="secondary" onPress={() => setFullscreen(true)}>
            {QR_SCREEN_COPY.fullscreen}
          </Button>
        </View>

        <View className="mt-6">
          <Button variant="outline" onPress={askRotate}>
            {QR_SCREEN_COPY.rotate}
          </Button>
        </View>
      </View>

      <Dialog
        visible={asking}
        title={QR_SCREEN_COPY.rotateTitle}
        notice={rotateFailed ? QR_SCREEN_COPY.sendFailed : undefined}
        onClose={cancelRotate}
        confirmLabel={QR_SCREEN_COPY.rotate}
        confirmTestID={ROTATE_CONFIRM_TEST_ID}
        onConfirm={rotate}
      >
        {QR_SCREEN_COPY.rotateBody}
      </Dialog>

      {toast === null ? null : (
        <FloatingToast message={toast} onDone={dismissToast} />
      )}
    </Screen>
  );
}
