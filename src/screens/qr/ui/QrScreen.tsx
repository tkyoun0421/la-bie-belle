import { View } from "react-native";
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

export function QrScreen() {
  const {
    svg,
    startLine,
    exporting,
    asking,
    rotateNotice,
    toast,
    goBack,
    exportPaper,
    askRotate,
    cancelRotate,
    rotate,
    dismissToast,
    fullscreen,
    openFullscreen,
    closeFullscreen,
  } = useQrScreen();

  if (fullscreen) {
    return <QrFullscreen svg={svg} onClose={closeFullscreen} />;
  }

  return (
    <Screen>
      <AppBar title={QR_SCREEN_COPY.appBarTitle} onBack={goBack} />

      <View className="px-5">
        <View className="mt-8">
          <QrCard svg={svg} />
        </View>

        {startLine === null ? null : (
          <Text size="sm" tone="subtle" numeric className="mt-4">
            {startLine}
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
          <Button variant="secondary" onPress={openFullscreen}>
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
        notice={rotateNotice}
        onClose={cancelRotate}
        confirmLabel={QR_SCREEN_COPY.rotate}
        confirmTestID={ROTATE_CONFIRM_TEST_ID}
        onConfirm={rotate}
      >
        {QR_SCREEN_COPY.rotateBody}
      </Dialog>

      {toast === null ? null : (
        <FloatingToast
          kind={toast.kind}
          message={toast.message}
          onDone={dismissToast}
        />
      )}
    </Screen>
  );
}
